import {
  campaignSnapshotSchema,
  evaluateSnapshotIntegrity,
} from "@campaign-lens/domain";
import {
  triggerCollectorHealing,
  approveCollectorHealing,
  SelfHealingUnavailableError,
} from "@campaign-lens/brightdata";
import {
  type Database,
  getSourceById,
  updateSourceHealth,
  insertSourceActivity,
} from "@campaign-lens/db";
import { runSource, type SourceRunResult } from "./run-source.ts";
import type { z } from "zod";

export interface HealSourceOptions {
  sourceId: string;
  db: Database;
  apiToken: string;
  prompt?: string;
  baseUrl?: string;
  timeoutMs?: number;
  intervalMs?: number;
  maxAttempts?: number;
}

export type HealSourceResult =
  | {
      status: "healed";
      sourceId: string;
      collectorId: string;
      runResult: SourceRunResult;
    }
  | {
      status: "healthy";
      sourceId: string;
      collectorId: string;
      message: string;
    }
  | {
      status: "unavailable";
      sourceId: string;
      collectorId: string;
      retryable: true;
      message: string;
    }
  | {
      status: "needs_review";
      sourceId: string;
      collectorId: string;
      reason: string;
      preview?: unknown;
      missing?: string[];
      issues?: z.ZodIssue[];
    }
  | {
      status: "failed";
      sourceId: string;
      collectorId: string;
      error: string;
    };

const DEFAULT_HEALING_PROMPT =
  "The competitor web page was redesigned and the existing scraper no longer extracts the primary campaign correctly. " +
  "Recover the main headline, active promotional offer, current price and currency, qualifier, primary CTA label and href, " +
  "and customer guarantees from the redesigned page. Preserve the existing output schema.";

/**
 * Orchestrates autonomous self-healing of a degraded or broken competitor source collector.
 *
 * Enforces safety gates:
 * 1. Validates source exists and is currently in need of healing (degraded or needs_review).
 * 2. Safely handles temporary platform outages without corrupting source health or credentials.
 * 3. Inspects proposed AI refactor preview before approval (validating Zod schema + domain extraction integrity).
 * 4. Only approves valid repairs, re-running the same collector ID and restoring healthy campaign monitoring.
 * 5. Logs recovery milestones into source_activity audit log.
 */
export async function healSource(
  options: HealSourceOptions,
): Promise<HealSourceResult> {
  const { sourceId, db, apiToken, prompt = DEFAULT_HEALING_PROMPT, baseUrl, timeoutMs, intervalMs, maxAttempts } = options;

  // 1. Verify source exists
  const source = await getSourceById(db, sourceId);
  if (!source) {
    throw new Error(`Source with ID '${sourceId}' not found.`);
  }

  // 2. Precondition check: do not heal an already healthy source
  if (source.health === "healthy") {
    return {
      status: "healthy",
      sourceId: source.id,
      collectorId: source.collectorId,
      message: "Source is already healthy. No self-healing required.",
    };
  }

  // 3. Mark source as healing in DB and log activity
  await updateSourceHealth(db, source.id, "healing");
  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "healing_started",
    message: "Bright Data AI Self-Healing requested",
    occurredAt: new Date(),
  });

  // 4. Trigger Bright Data Self-Healing AI job
  let progress;
  try {
    progress = await triggerCollectorHealing({
      apiToken,
      collectorId: source.collectorId,
      prompt,
      baseUrl,
      timeoutMs,
      intervalMs,
      maxAttempts,
    });
  } catch (error) {
    if (error instanceof SelfHealingUnavailableError) {
      console.warn(
        `[Source ${source.id}] Bright Data Self-Healing is temporarily unavailable (HTTP 503):`,
        error.message,
      );
      // Reset health back to degraded (safe & retryable)
      await updateSourceHealth(db, source.id, "degraded");
      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_unavailable",
        message: "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
        metadata: { retryable: true },
        occurredAt: new Date(),
      });
      return {
        status: "unavailable",
        sourceId: source.id,
        collectorId: source.collectorId,
        retryable: true,
        message: "Bright Data Self-Healing is temporarily unavailable",
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Source ${source.id}] Self-Healing trigger failed:`, errorMessage);

    await updateSourceHealth(db, source.id, "needs_review");
    await insertSourceActivity(db, {
      competitorId: source.competitorId,
      sourceId: source.id,
      type: "healing_failed",
      message: `Self-Healing trigger failed: ${errorMessage}`,
      metadata: { error: errorMessage },
      occurredAt: new Date(),
    });
    return {
      status: "failed",
      sourceId: source.id,
      collectorId: source.collectorId,
      error: errorMessage,
    };
  }

  // 5. Inspect and validate preview_result before committing approval
  if (progress.status === "pending_answer" || progress.preview_result) {
    const rawPreview = Array.isArray(progress.preview_result)
      ? progress.preview_result[0]
      : progress.preview_result;

    if (!rawPreview || typeof rawPreview !== "object") {
      console.warn(
        `[Source ${source.id}] Self-Healing did not return a valid preview record to validate:`,
        progress,
      );
      await updateSourceHealth(db, source.id, "needs_review");
      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_failed",
        message: "Self-Healing did not return a valid preview record",
        occurredAt: new Date(),
      });
      return {
        status: "needs_review",
        sourceId: source.id,
        collectorId: source.collectorId,
        reason: "Self-Healing did not return a valid preview record.",
        preview: rawPreview,
      };
    }

    // A. Validate preview schema
    const schemaValidation = campaignSnapshotSchema.safeParse(rawPreview);
    if (!schemaValidation.success) {
      console.warn(
        `[Source ${source.id}] Self-Healing preview failed schema validation:`,
        schemaValidation.error.issues,
      );
      await updateSourceHealth(db, source.id, "needs_review");
      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_failed",
        message: "Self-Healing proposed preview failed schema validation",
        occurredAt: new Date(),
      });
      return {
        status: "needs_review",
        sourceId: source.id,
        collectorId: source.collectorId,
        reason: "Self-Healing preview failed schema validation.",
        issues: schemaValidation.error.issues,
        preview: rawPreview,
      };
    }

    // B. Validate preview domain extraction integrity
    const integrityValidation = evaluateSnapshotIntegrity({
      snapshot: schemaValidation.data,
      sourceType: source.type,
    });

    if (integrityValidation.status === "degraded") {
      console.warn(
        `[Source ${source.id}] Self-Healing preview failed extraction integrity. Missing fields:`,
        integrityValidation.missing,
      );
      await updateSourceHealth(db, source.id, "needs_review");
      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_failed",
        message: `Self-Healing preview missing required fields: ${integrityValidation.missing.join(", ")}`,
        metadata: { missing: integrityValidation.missing },
        occurredAt: new Date(),
      });
      return {
        status: "needs_review",
        sourceId: source.id,
        collectorId: source.collectorId,
        reason: "Self-Healing preview has degraded extraction integrity.",
        missing: integrityValidation.missing,
        preview: schemaValidation.data,
      };
    }

    // C. Approval Gate: Preview is fully valid and integrity is healthy -> Approve repair
    try {
      await approveCollectorHealing({
        apiToken,
        collectorId: source.collectorId,
        approve: true,
        autoSave: true,
        baseUrl,
        timeoutMs,
        intervalMs,
        maxAttempts,
      });
    } catch (approveError) {
      const approveMsg = approveError instanceof Error ? approveError.message : String(approveError);
      console.error(`[Source ${source.id}] Failed to commit Self-Healing approval:`, approveMsg);
      await updateSourceHealth(db, source.id, "needs_review");
      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_failed",
        message: `Failed to commit Self-Healing approval: ${approveMsg}`,
        occurredAt: new Date(),
      });
      return {
        status: "failed",
        sourceId: source.id,
        collectorId: source.collectorId,
        error: `Failed to commit Self-Healing approval: ${approveMsg}`,
      };
    }
  } else if (progress.status !== "done") {
    // If terminal failure without pending_answer
    await updateSourceHealth(db, source.id, "needs_review");
    await insertSourceActivity(db, {
      competitorId: source.competitorId,
      sourceId: source.id,
      type: "healing_failed",
      message: progress.error || `Self-healing finished with status '${progress.status}'`,
      occurredAt: new Date(),
    });
    return {
      status: "failed",
      sourceId: source.id,
      collectorId: source.collectorId,
      error: progress.error || `Self-healing finished with status '${progress.status}'.`,
    };
  }

  // 6. Refactor committed! Rerun the SAME collector using standard runSource pipeline
  const runResult = await runSource({
    sourceId: source.id,
    db,
    apiToken,
  });

  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "healing_recovered",
    message: "Scraper Studio collector repaired with same Collector ID",
    metadata: { collectorId: source.collectorId },
    occurredAt: new Date(),
  });

  return {
    status: "healed",
    sourceId: source.id,
    collectorId: source.collectorId,
    runResult,
  };
}
