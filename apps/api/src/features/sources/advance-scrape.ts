import {
  type Database,
  getScrapeRunById,
  updateScrapeRunStatus,
  getSourceById,
  updateSourceSchedule,
  getLatestSnapshotBySourceId,
  createSnapshot,
  createCampaignEvents,
  insertSourceActivity,
  getActiveRecoveryRunBySourceId,
  insertRecoveryRun,
  updateRecoveryRun,
  type ScrapeRun,
  type RecoveryRun,
} from "@campaign-lens/db";
import {
  getCollectorRunResult,
  BrightDataError,
  BrightDataClient,
  SelfHealingUnavailableError,
} from "@campaign-lens/brightdata";
import {
  campaignSnapshotSchema,
  evaluateSnapshotIntegrity,
  diffCampaignSnapshots,
  type CampaignSnapshot,
} from "@campaign-lens/domain";
import { shouldAttemptHealing } from "./recovery-policy.ts";

export interface AdvanceScrapeOptions {
  scrapeRunId: string;
  db: Database;
  apiToken: string;
  baseUrl?: string;
  now?: Date;
  intervalMinutes?: number;
  retryIntervalMinutes?: number;
  healingPrompt?: string;
}

export type AdvanceScrapeResult =
  | {
      status: "collecting" | "processing";
      scrapeRun: ScrapeRun;
      message: string;
    }
  | {
      status: "succeeded";
      scrapeRun: ScrapeRun;
      snapshot?: CampaignSnapshot;
      changes?: ReturnType<typeof diffCampaignSnapshots>;
      reason?: string;
    }
  | {
      status: "invalid" | "failed";
      scrapeRun: ScrapeRun;
      errorCode?: string;
      recovery?: RecoveryRun;
      reason: string;
    };

const DEFAULT_INTERVAL_MINUTES = 60;
const DEFAULT_RETRY_INTERVAL_MINUTES = 15;
const DEFAULT_HEALING_PROMPT =
  "The target website DOM updated. Please repair CSS selectors and layout extraction to reliably extract headline, offer, pricing amount/currency, and primary CTA.";

/**
 * Performs at most one bounded progression step for a scrape run.
 * Does NOT poll in a loop.
 */
export async function advanceScrape(
  options: AdvanceScrapeOptions,
): Promise<AdvanceScrapeResult> {
  const {
    scrapeRunId,
    db,
    apiToken,
    baseUrl,
    now = new Date(),
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
    retryIntervalMinutes = DEFAULT_RETRY_INTERVAL_MINUTES,
    healingPrompt = DEFAULT_HEALING_PROMPT,
  } = options;

  const scrapeRun = await getScrapeRunById(db, scrapeRunId);
  if (!scrapeRun) {
    throw new Error(`Scrape run '${scrapeRunId}' not found.`);
  }

  // 1. If already in terminal status, return immediately
  if (
    scrapeRun.status === "succeeded" ||
    scrapeRun.status === "invalid" ||
    scrapeRun.status === "failed"
  ) {
    if (scrapeRun.status === "succeeded") {
      return {
        status: "succeeded",
        scrapeRun,
        reason: `Scrape run already in terminal status '${scrapeRun.status}'.`,
      };
    }
    return {
      status: scrapeRun.status as "invalid" | "failed",
      scrapeRun,
      reason: `Scrape run already in terminal status '${scrapeRun.status}'.`,
    };
  }

  const source = await getSourceById(db, scrapeRun.sourceId);
  if (!source) {
    throw new Error(`Source '${scrapeRun.sourceId}' not found.`);
  }

  if (!scrapeRun.upstreamResponseId) {
    const updated = await updateScrapeRunStatus(db, scrapeRun.id, {
      status: "failed",
      errorCode: "missing_upstream_response_id",
      completedAt: now,
    });
    return {
      status: "failed",
      scrapeRun: updated ?? scrapeRun,
      reason: "Missing upstream response ID.",
    };
  }

  try {
    // 2. Query Bright Data for result
    const result = await getCollectorRunResult({
      apiToken,
      responseId: scrapeRun.upstreamResponseId,
      baseUrl,
    });

    // 3. Still collecting / pending
    if (result.status === "pending") {
      return {
        status: "collecting",
        scrapeRun,
        message: "Scraper is currently executing on Bright Data.",
      };
    }

    // 4. Upstream completed -> Validate schema
    const validation = campaignSnapshotSchema.safeParse(result.data);
    if (!validation.success) {
      const updated = await updateScrapeRunStatus(db, scrapeRun.id, {
        status: "invalid",
        errorCode: "schema_validation_failed",
        completedAt: now,
      });

      await updateSourceSchedule(db, source.id, {
        health: "needs_review",
        lastRunAt: now,
        nextRunAt: null,
      });

      return {
        status: "invalid",
        scrapeRun: updated ?? scrapeRun,
        errorCode: "schema_validation_failed",
        reason: "Collector output did not match CampaignSnapshot schema.",
      };
    }

    const snapshot = validation.data;

    // 5. Evaluate extraction integrity
    const integrity = evaluateSnapshotIntegrity({
      snapshot,
      sourceType: source.type,
    });

    if (integrity.status === "degraded") {
      const updated = await updateScrapeRunStatus(db, scrapeRun.id, {
        status: "failed",
        errorCode: "extraction_integrity_degraded",
        completedAt: now,
      });

      const nextRetryAt = new Date(
        now.getTime() + retryIntervalMinutes * 60 * 1000,
      );
      await updateSourceSchedule(db, source.id, {
        health: "degraded",
        lastRunAt: now,
        nextRunAt: nextRetryAt,
      });

      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "extraction_degraded",
        message: `Website structure changed · Missing required fields: ${integrity.missing.join(", ")}`,
        metadata: {
          missing: integrity.missing,
          reason: "extraction_integrity_degraded",
        },
        occurredAt: now,
      });

      // Initiate Self-Healing recovery once
      const recovery = await initiateRecoveryOnce({
        db,
        source,
        apiToken,
        baseUrl,
        now,
        prompt: healingPrompt,
        reason: `extraction_integrity_degraded: missing ${integrity.missing.join(", ")}`,
        nextRetryAt,
      });

      return {
        status: "failed",
        scrapeRun: updated ?? scrapeRun,
        errorCode: "extraction_integrity_degraded",
        recovery,
        reason: `Extraction degraded: missing required fields ${integrity.missing.join(", ")}`,
      };
    }

    // 6. Healthy extraction -> Persist snapshot & diff
    const previousSnapshotRecord = await getLatestSnapshotBySourceId(
      db,
      source.id,
    );
    const previousSnapshot = previousSnapshotRecord
      ? (previousSnapshotRecord.data as CampaignSnapshot)
      : null;

    const changes = previousSnapshot
      ? diffCampaignSnapshots(previousSnapshot, snapshot)
      : [];

    const newSnapshotRecord = await createSnapshot(db, {
      sourceId: source.id,
      scrapeRunId: scrapeRun.id,
      headline: snapshot.headline,
      offer: snapshot.offer,
      priceAmount: snapshot.pricing.amount,
      priceCurrency: snapshot.pricing.currency,
      priceQualifier: snapshot.pricing.qualifier,
      ctaLabel: snapshot.primaryCta.label,
      ctaHref: snapshot.primaryCta.href,
      guarantees: snapshot.guarantees,
      data: snapshot,
      capturedAt: now,
    });

    if (changes.length > 0) {
      await createCampaignEvents(
        db,
        changes.map((change) => ({
          competitorId: source.competitorId,
          sourceId: source.id,
          snapshotId: newSnapshotRecord.id,
          type: change.type,
          before: { value: change.before },
          after: { value: change.after },
          detectedAt: now,
        })),
      );
    }

    const nextRunAt = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    const updated = await updateScrapeRunStatus(db, scrapeRun.id, {
      status: "succeeded",
      completedAt: now,
    });

    await updateSourceSchedule(db, source.id, {
      health: "healthy",
      lastRunAt: now,
      nextRunAt,
    });

    await insertSourceActivity(db, {
      competitorId: source.competitorId,
      sourceId: source.id,
      type: "monitor_succeeded",
      message: "Monitoring completed successfully",
      metadata: {
        changesDetected: changes.length,
      },
      occurredAt: now,
    });

    return {
      status: "succeeded",
      scrapeRun: updated ?? scrapeRun,
      snapshot,
      changes,
    };
  } catch (err) {
    const errorCode =
      err instanceof BrightDataError
        ? err.errorCode || "crawler_execution_error"
        : "unknown_error";
    const errorMessage = err instanceof Error ? err.message : String(err);

    const updated = await updateScrapeRunStatus(db, scrapeRun.id, {
      status: "failed",
      errorCode,
      completedAt: now,
    });

    const decision = shouldAttemptHealing(undefined, err);

    if (decision.shouldHeal) {
      const nextRetryAt = new Date(
        now.getTime() + retryIntervalMinutes * 60 * 1000,
      );
      await updateSourceSchedule(db, source.id, {
        health: "degraded",
        lastRunAt: now,
        nextRunAt: nextRetryAt,
      });

      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "extraction_degraded",
        message: `Website collection failed: ${decision.reason}`,
        metadata: {
          reason: decision.reason,
          errorCode,
        },
        occurredAt: now,
      });

      const recovery = await initiateRecoveryOnce({
        db,
        source,
        apiToken,
        baseUrl,
        now,
        prompt: healingPrompt,
        reason: decision.reason,
        nextRetryAt,
      });

      return {
        status: "failed",
        scrapeRun: updated ?? scrapeRun,
        errorCode,
        recovery,
        reason: errorMessage,
      };
    }

    // Fatal or non-recoverable error
    await updateSourceSchedule(db, source.id, {
      health: "needs_review",
      lastRunAt: now,
      nextRunAt: null,
    });

    return {
      status: "failed",
      scrapeRun: updated ?? scrapeRun,
      errorCode,
      reason: errorMessage,
    };
  }
}

async function initiateRecoveryOnce({
  db,
  source,
  apiToken,
  baseUrl,
  now,
  prompt,
  reason,
  nextRetryAt,
}: {
  db: Database;
  source: { id: string; competitorId: string; collectorId: string };
  apiToken: string;
  baseUrl?: string;
  now: Date;
  prompt: string;
  reason?: string;
  nextRetryAt: Date;
}): Promise<RecoveryRun> {
  const existingActive = await getActiveRecoveryRunBySourceId(db, source.id);
  if (existingActive) {
    return existingActive;
  }

  const recoveryRecord = await insertRecoveryRun(db, {
    sourceId: source.id,
    collectorId: source.collectorId,
    status: "healing",
    startedAt: now,
    updatedAt: now,
    retryable: true,
  });

  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "healing_started",
    message: "Bright Data AI Self-Healing requested",
    metadata: {
      collectorId: source.collectorId,
      reason,
    },
    occurredAt: now,
  });

  const client = new BrightDataClient({
    apiToken,
    baseUrl,
  });

  try {
    await client.triggerRefactorTemplate({
      collectorId: source.collectorId,
      prompt,
    });
    return recoveryRecord;
  } catch (err) {
    if (err instanceof SelfHealingUnavailableError) {
      const updated = await updateRecoveryRun(db, recoveryRecord.id, {
        status: "unavailable",
        retryable: true,
        errorCode: "503_temporarily_disabled",
        completedAt: now,
      });

      await updateSourceSchedule(db, source.id, {
        nextRunAt: nextRetryAt,
        health: "degraded",
        lastRunAt: now,
      });

      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_unavailable",
        message:
          "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
        metadata: { retryable: true },
        occurredAt: now,
      });

      return updated;
    }

    const updated = await updateRecoveryRun(db, recoveryRecord.id, {
      status: "failed",
      errorCode: err instanceof Error ? err.message : String(err),
      completedAt: now,
    });

    return updated;
  }
}
