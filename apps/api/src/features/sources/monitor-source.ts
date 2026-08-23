import {
  type Database,
  getSourceById,
  updateSourceSchedule,
  insertSourceActivity,
} from "@campaign-lens/db";
import { runSource, type SourceRunResult } from "./run-source.ts";
import { healSource, type HealSourceResult } from "./heal-source.ts";
import { shouldAttemptHealing } from "./recovery-policy.ts";

export interface MonitorSourceOptions {
  sourceId: string;
  db: Database;
  apiToken: string;
  now?: Date;
  intervalMinutes?: number;
  retryIntervalMinutes?: number;
  prompt?: string;
  baseUrl?: string;
}

export type MonitorSourceResult =
  | {
      status: "healthy";
      sourceId: string;
      collectorId: string;
      run: SourceRunResult;
      nextRunAt: Date;
    }
  | {
      status: "recovered";
      sourceId: string;
      collectorId: string;
      run: SourceRunResult;
      recovery: HealSourceResult;
      nextRunAt: Date;
    }
  | {
      status: "degraded";
      sourceId: string;
      collectorId: string;
      run?: SourceRunResult;
      recovery?: HealSourceResult;
      recoveryAttempted: boolean;
      retryable: boolean;
      reason: string;
      nextRunAt: Date;
    }
  | {
      status: "needs_review";
      sourceId: string;
      collectorId: string;
      run?: SourceRunResult;
      recovery?: HealSourceResult;
      recoveryAttempted: boolean;
      retryable: boolean;
      reason: string;
      nextRunAt: Date | null;
    };

const DEFAULT_INTERVAL_MINUTES = 60; // 1 hour normal monitoring cycle
const DEFAULT_RETRY_INTERVAL_MINUTES = 15; // 15 minutes bounded retry for degraded sources

/**
 * Orchestrates a complete autonomous monitoring cycle for a competitor source:
 * 1. Executes collection pipeline (runSource).
 * 2. Evaluates run results against deterministic recovery policy (shouldAttemptHealing).
 * 3. Automatically triggers Bright Data Self-Healing for recoverable DOM/extraction breakage.
 * 4. Schedules the next monitoring cycle timestamp (nextRunAt).
 * 5. Records operational activity into source_activity audit log.
 */
export async function monitorSource(
  options: MonitorSourceOptions,
): Promise<MonitorSourceResult> {
  const {
    sourceId,
    db,
    apiToken,
    now = new Date(),
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
    retryIntervalMinutes = DEFAULT_RETRY_INTERVAL_MINUTES,
    prompt,
    baseUrl,
  } = options;

  const source = await getSourceById(db, sourceId);
  if (!source) {
    throw new Error(`Source with ID '${sourceId}' not found.`);
  }

  // 1. Record monitor started activity
  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "monitor_started",
    message: "Source monitoring started",
    occurredAt: now,
  });

  let runResult: SourceRunResult | undefined;
  let runError: unknown;

  try {
    runResult = await runSource({ sourceId: source.id, db, apiToken });
  } catch (err) {
    runError = err;
  }

  // 2. If run succeeded and is healthy -> update schedule and record success
  if (runResult && runResult.status === "healthy") {
    const nextRunAt = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    await updateSourceSchedule(db, source.id, {
      nextRunAt,
      health: "healthy",
      lastRunAt: now,
    });

    await insertSourceActivity(db, {
      competitorId: source.competitorId,
      sourceId: source.id,
      type: "monitor_succeeded",
      message: "Monitoring completed successfully",
      metadata: {
        changesDetected: runResult.changes.length,
      },
      occurredAt: new Date(),
    });

    return {
      status: "healthy",
      sourceId: source.id,
      collectorId: source.collectorId,
      run: runResult,
      nextRunAt,
    };
  }

  // 3. Evaluate recovery policy
  const decision = shouldAttemptHealing(runResult, runError);

  // Record extraction degraded activity
  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "extraction_degraded",
    message:
      runResult?.status === "degraded"
        ? "Website structure changed · Extraction degraded"
        : `Website collection failed: ${decision.reason}`,
    metadata: {
      reason: decision.reason,
      missing: runResult?.status === "degraded" ? runResult.missing : [],
    },
    occurredAt: new Date(),
  });

  // 4. If healing is NOT appropriate (e.g. auth error, rate limit, network drop)
  if (!decision.shouldHeal) {
    const isFatalAuthOrConfig =
      decision.reason === "authentication_error" ||
      decision.reason === "unrecognized_or_non_recoverable_error";

    if (isFatalAuthOrConfig) {
      await updateSourceSchedule(db, source.id, {
        nextRunAt: null,
        health: "needs_review",
        lastRunAt: now,
      });

      return {
        status: "needs_review",
        sourceId: source.id,
        collectorId: source.collectorId,
        run: runResult,
        recoveryAttempted: false,
        retryable: false,
        reason: decision.reason ?? "authentication_or_config_error",
        nextRunAt: null,
      };
    }

    // Retryable transient issue (e.g. rate limit, temporary upstream outage)
    const nextRunAt = new Date(
      now.getTime() + retryIntervalMinutes * 60 * 1000,
    );
    await updateSourceSchedule(db, source.id, {
      nextRunAt,
      health: "degraded",
      lastRunAt: now,
    });

    return {
      status: "degraded",
      sourceId: source.id,
      collectorId: source.collectorId,
      run: runResult,
      recoveryAttempted: false,
      retryable: true,
      reason: decision.reason ?? "transient_upstream_issue",
      nextRunAt,
    };
  }

  // 5. Healing IS appropriate -> trigger autonomous recovery
  const healResult = await healSource({
    sourceId: source.id,
    db,
    apiToken,
    prompt,
    baseUrl,
  });

  if (healResult.status === "healed") {
    const nextRunAt = new Date(now.getTime() + intervalMinutes * 60 * 1000);
    await updateSourceSchedule(db, source.id, {
      nextRunAt,
      health: "healthy",
      lastRunAt: now,
    });

    return {
      status: "recovered",
      sourceId: source.id,
      collectorId: source.collectorId,
      run: healResult.runResult,
      recovery: healResult,
      nextRunAt,
    };
  }

  if (healResult.status === "unavailable") {
    const nextRunAt = new Date(
      now.getTime() + retryIntervalMinutes * 60 * 1000,
    );
    await updateSourceSchedule(db, source.id, {
      nextRunAt,
      health: "degraded",
      lastRunAt: now,
    });

    return {
      status: "degraded",
      sourceId: source.id,
      collectorId: source.collectorId,
      run: runResult,
      recovery: healResult,
      recoveryAttempted: true,
      retryable: true,
      reason: healResult.message,
      nextRunAt,
    };
  }

  // Terminal heal failure or preview failed validation -> needs_review
  await updateSourceSchedule(db, source.id, {
    nextRunAt: null,
    health: "needs_review",
    lastRunAt: now,
  });

  return {
    status: "needs_review",
    sourceId: source.id,
    collectorId: source.collectorId,
    run: runResult,
    recovery: healResult,
    recoveryAttempted: true,
    retryable: false,
    reason:
      healResult.status === "needs_review"
        ? healResult.reason
        : (healResult as { error: string }).error,
    nextRunAt: null,
  };
}
