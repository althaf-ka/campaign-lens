import {
  type Database,
  getSourceById,
  getActiveRecoveryRunBySourceId,
  updateRecoveryRun,
  updateSourceSchedule,
  insertSourceActivity,
  type RecoveryRun,
  type Source,
} from "@campaign-lens/db";
import {
  BrightDataClient,
  SelfHealingUnavailableError,
} from "@campaign-lens/brightdata";
import {
  campaignSnapshotSchema,
  evaluateSnapshotIntegrity,
} from "@campaign-lens/domain";
import { runSource, type SourceRunResult } from "./run-source.ts";

export interface AdvanceRecoveryOptions {
  sourceId: string;
  db: Database;
  apiToken: string;
  baseUrl?: string;
  now?: Date;
  intervalMinutes?: number;
}

export type AdvanceRecoveryResult =
  | {
      status: "idle";
      message: string;
    }
  | {
      status: "healing" | "validating" | "approving" | "verifying";
      recovery: RecoveryRun;
      message: string;
    }
  | {
      status: "recovered";
      recovery: RecoveryRun;
      runResult: SourceRunResult;
    }
  | {
      status: "unavailable";
      recovery: RecoveryRun;
      retryable: boolean;
      message: string;
    }
  | {
      status: "needs_review" | "failed";
      recovery: RecoveryRun;
      reason: string;
    };

const DEFAULT_INTERVAL_MINUTES = 60;
const DEFAULT_RETRY_INTERVAL_MINUTES = 15;

/**
 * Performs at most one bounded recovery step for an active Self-Healing run.
 * Does NOT block on long external polling loops.
 */
export async function advanceRecovery(
  options: AdvanceRecoveryOptions,
): Promise<AdvanceRecoveryResult> {
  const {
    sourceId,
    db,
    apiToken,
    baseUrl,
    now = new Date(),
    intervalMinutes = DEFAULT_INTERVAL_MINUTES,
  } = options;

  const source = await getSourceById(db, sourceId);
  if (!source) {
    throw new Error(`Source '${sourceId}' not found.`);
  }

  const activeRun = await getActiveRecoveryRunBySourceId(db, source.id);
  if (!activeRun) {
    return {
      status: "idle",
      message: "No active recovery to advance.",
    };
  }

  const client = new BrightDataClient({
    apiToken,
    baseUrl,
  });

  try {
    // 1. If currently in 'healing' status -> query Bright Data progress
    if (activeRun.status === "healing") {
      let progress;
      try {
        progress = await client.getRefactorProgress(activeRun.collectorId);
      } catch (err) {
        if (err instanceof SelfHealingUnavailableError) {
          const updated = await updateRecoveryRun(db, activeRun.id, {
            status: "unavailable",
            retryable: true,
            errorCode: "503_temporarily_disabled",
            completedAt: now,
          });

          await updateSourceSchedule(db, source.id, {
            health: "degraded",
            nextRunAt: new Date(now.getTime() + DEFAULT_RETRY_INTERVAL_MINUTES * 60 * 1000),
          });

          await insertSourceActivity(db, {
            competitorId: source.competitorId,
            sourceId: source.id,
            type: "healing_unavailable",
            message: "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
            metadata: { retryable: true },
            occurredAt: now,
          });

          return {
            status: "unavailable",
            recovery: updated,
            retryable: true,
            message: "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
          };
        }
        throw err;
      }

      if (progress.status === "running" || progress.status === "building") {
        return {
          status: "healing",
          recovery: activeRun,
          message: "Self-Healing AI job is in progress on Bright Data",
        };
      }

      if (progress.status === "pending_answer") {
        // AI proposed a fix with preview_result
        await updateRecoveryRun(db, activeRun.id, {
          status: "validating",
          metadata: { progress },
        });

        // Validate the preview result
        const previewItem = Array.isArray(progress.preview_result)
          ? progress.preview_result[0]
          : progress.preview_result;

        const parseResult = campaignSnapshotSchema.safeParse(previewItem);
        let isValid = parseResult.success;
        let integrityReason = "";

        if (parseResult.success) {
          const integrity = evaluateSnapshotIntegrity({
            snapshot: parseResult.data,
            sourceType: source.type,
          });
          if (integrity.status === "degraded") {
            isValid = false;
            integrityReason = `Extraction integrity degraded: missing ${integrity.missing.join(", ")}`;
          }
        } else {
          integrityReason = "Preview payload failed Zod schema validation";
        }

        if (isValid) {
          // Approve the repair
          await client.resumeAutomationJob({
            collectorId: activeRun.collectorId,
            approve: true,
          });

          const updated = await updateRecoveryRun(db, activeRun.id, {
            status: "approving",
          });

          return {
            status: "approving",
            recovery: updated,
            message: "Repaired preview validated and approval sent to Bright Data",
          };
        }

        // Invalid preview -> reject & needs_review
        await client.resumeAutomationJob({
          collectorId: activeRun.collectorId,
          approve: false,
        });

        const updated = await updateRecoveryRun(db, activeRun.id, {
          status: "needs_review",
          errorCode: "preview_integrity_failed",
          completedAt: now,
        });

        await updateSourceSchedule(db, source.id, {
          health: "needs_review",
          nextRunAt: null,
        });

        await insertSourceActivity(db, {
          competitorId: source.competitorId,
          sourceId: source.id,
          type: "healing_failed",
          message: `Self-Healing preview rejected: ${integrityReason}`,
          occurredAt: now,
        });

        return {
          status: "needs_review",
          recovery: updated,
          reason: integrityReason,
        };
      }

      if (progress.status === "done") {
        // Move to verifying
        await updateRecoveryRun(db, activeRun.id, {
          status: "verifying",
        });

        return advanceVerification({
          source,
          activeRun,
          db,
          apiToken,
          now,
          intervalMinutes,
        });
      }

      if (progress.status === "failed" || progress.status === "error") {
        const updated = await updateRecoveryRun(db, activeRun.id, {
          status: "failed",
          errorCode: progress.error || "ai_job_failed",
          completedAt: now,
        });

        await updateSourceSchedule(db, source.id, {
          health: "needs_review",
          nextRunAt: null,
        });

        await insertSourceActivity(db, {
          competitorId: source.competitorId,
          sourceId: source.id,
          type: "healing_failed",
          message: `Bright Data Self-Healing job failed: ${progress.error || "unknown error"}`,
          occurredAt: now,
        });

        return {
          status: "failed",
          recovery: updated,
          reason: progress.error || "Self-Healing job failed",
        };
      }
    }

    // 2. If in 'approving' status -> check if Bright Data finalized template save
    if (activeRun.status === "approving") {
      const progress = await client.getRefactorProgress(activeRun.collectorId);
      if (progress.status === "done") {
        await updateRecoveryRun(db, activeRun.id, {
          status: "verifying",
        });

        return advanceVerification({
          source,
          activeRun,
          db,
          apiToken,
          now,
          intervalMinutes,
        });
      }

      return {
        status: "approving",
        recovery: activeRun,
        message: "Applying template refactor to collector...",
      };
    }

    // 3. If in 'verifying' status -> execute collector run
    if (activeRun.status === "verifying") {
      return advanceVerification({
        source,
        activeRun,
        db,
        apiToken,
        now,
        intervalMinutes,
      });
    }

    return {
      status: "idle",
      message: `Recovery run in terminal status '${activeRun.status}'.`,
    };
  } catch (err) {
    if (err instanceof SelfHealingUnavailableError) {
      const updated = await updateRecoveryRun(db, activeRun.id, {
        status: "unavailable",
        retryable: true,
        errorCode: "503_temporarily_disabled",
        completedAt: now,
      });

      await updateSourceSchedule(db, source.id, {
        health: "degraded",
        nextRunAt: new Date(now.getTime() + DEFAULT_RETRY_INTERVAL_MINUTES * 60 * 1000),
      });

      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_unavailable",
        message: "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
        metadata: { retryable: true },
        occurredAt: now,
      });

      return {
        status: "unavailable",
        recovery: updated,
        retryable: true,
        message: "Bright Data Self-Healing temporarily disabled · Automatic retry scheduled",
      };
    }

    throw err;
  }
}

async function advanceVerification({
  source,
  activeRun,
  db,
  apiToken,
  now,
  intervalMinutes,
}: {
  source: Source;
  activeRun: RecoveryRun;
  db: Database;
  apiToken: string;
  now: Date;
  intervalMinutes: number;
}): Promise<AdvanceRecoveryResult> {
  try {
    const runResult = await runSource({
      sourceId: source.id,
      db,
      apiToken,
    });

    if (runResult.status === "healthy") {
      const nextRunAt = new Date(now.getTime() + intervalMinutes * 60 * 1000);
      const updated = await updateRecoveryRun(db, activeRun.id, {
        status: "recovered",
        completedAt: now,
      });

      await updateSourceSchedule(db, source.id, {
        health: "healthy",
        nextRunAt,
        lastRunAt: now,
      });

      await insertSourceActivity(db, {
        competitorId: source.competitorId,
        sourceId: source.id,
        type: "healing_recovered",
        message: "Collector successfully recovered · Source restored to healthy",
        metadata: {
          changesDetected: runResult.changes.length,
        },
        occurredAt: now,
      });

      return {
        status: "recovered",
        recovery: updated,
        runResult,
      };
    }

    // Run returned degraded or invalid
    const updated = await updateRecoveryRun(db, activeRun.id, {
      status: "needs_review",
      errorCode: "verification_run_degraded",
      completedAt: now,
    });

    await updateSourceSchedule(db, source.id, {
      health: "needs_review",
      nextRunAt: null,
    });

    await insertSourceActivity(db, {
      competitorId: source.competitorId,
      sourceId: source.id,
      type: "healing_failed",
      message: "Post-healing collector execution remained degraded · Requires manual review",
      occurredAt: now,
    });

    return {
      status: "needs_review",
      recovery: updated,
      reason: "Post-healing collector execution remained degraded",
    };
  } catch (err) {
    const updated = await updateRecoveryRun(db, activeRun.id, {
      status: "failed",
      errorCode: err instanceof Error ? err.message : String(err),
      completedAt: now,
    });

    await updateSourceSchedule(db, source.id, {
      health: "needs_review",
      nextRunAt: null,
    });

    return {
      status: "failed",
      recovery: updated,
      reason: err instanceof Error ? err.message : "Verification execution failed",
    };
  }
}
