import {
  type Database,
  listDueSources,
  listActiveScrapeRuns,
  listActiveRecoveryRuns,
} from "@campaign-lens/db";
import { monitorSource, type MonitorSourceAcceptedResult } from "./monitor-source.ts";
import { advanceScrape } from "./advance-scrape.ts";
import { advanceRecovery } from "./advance-recovery.ts";

export interface RunDueSourcesOptions {
  db: Database;
  apiToken: string;
  now?: Date;
  limit?: number;
  intervalMinutes?: number;
  retryIntervalMinutes?: number;
}

export interface RunDueSourcesSummary {
  processed: number;
  triggered: number;
  succeeded: number;
  recovered: number;
  degraded: number;
  failed: number;
  advancedScrapes: number;
  advancedRecoveries: number;
  results: Array<{
    sourceId: string;
    result?: MonitorSourceAcceptedResult;
    error?: string;
  }>;
}

/**
 * Scheduled monitoring handler:
 * 1. Triggers asynchronous monitoring for due sources (returns 202 immediately).
 * 2. Advances active scrape runs by one bounded step so scrapes progress even with no browser open.
 * 3. Advances active recovery runs by one bounded step so recoveries proceed in background.
 */
export async function runDueSources(
  options: RunDueSourcesOptions,
): Promise<RunDueSourcesSummary> {
  const {
    db,
    apiToken,
    now = new Date(),
    limit = 10,
    intervalMinutes,
    retryIntervalMinutes,
  } = options;

  // 1. Fetch bounded batch of due sources and trigger async monitoring
  const dueSources = await listDueSources(db, { now, limit });

  let triggered = 0;
  let failed = 0;
  const results: Array<{
    sourceId: string;
    result?: MonitorSourceAcceptedResult;
    error?: string;
  }> = [];

  if (dueSources.length > 0) {
    const outcomes = await Promise.allSettled(
      dueSources.map((source) =>
        monitorSource({
          sourceId: source.id,
          db,
          apiToken,
          now,
        }),
      ),
    );

    for (let i = 0; i < dueSources.length; i++) {
      const source = dueSources[i]!;
      const outcome = outcomes[i]!;

      if (outcome.status === "fulfilled") {
        results.push({ sourceId: source.id, result: outcome.value });
        triggered++;
      } else {
        const err = outcome.reason;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Scheduled Monitoring] Error triggering source ${source.id}:`, errorMsg);
        results.push({ sourceId: source.id, error: errorMsg });
        failed++;
      }
    }
  }

  // 2. Advance active scrape runs (bounded batch of up to 5)
  let advancedScrapes = 0;
  let succeeded = 0;
  let degraded = 0;
  try {
    const activeScrapes = await listActiveScrapeRuns(db, 5);
    if (activeScrapes.length > 0) {
      const advanceOutcomes = await Promise.allSettled(
        activeScrapes.map((run) =>
          advanceScrape({
            scrapeRunId: run.id,
            db,
            apiToken,
            now,
            intervalMinutes,
            retryIntervalMinutes,
          }),
        ),
      );

      for (const outcome of advanceOutcomes) {
        if (outcome.status === "fulfilled") {
          advancedScrapes++;
          if (outcome.value.status === "succeeded") {
            succeeded++;
          } else if (outcome.value.status === "failed") {
            degraded++;
          }
        }
      }
    }
  } catch (scrapeErr) {
    console.error("[Scheduled Scrape Advance Error]", scrapeErr);
  }

  // 3. Advance active recovery runs (bounded batch of up to 5)
  let advancedRecoveries = 0;
  let recovered = 0;
  try {
    const activeRuns = await listActiveRecoveryRuns(db, 5);
    if (activeRuns.length > 0) {
      const advanceOutcomes = await Promise.allSettled(
        activeRuns.map((run) =>
          advanceRecovery({
            sourceId: run.sourceId,
            db,
            apiToken,
            now,
            intervalMinutes,
          }),
        ),
      );

      for (const outcome of advanceOutcomes) {
        if (outcome.status === "fulfilled") {
          advancedRecoveries++;
          if (outcome.value.status === "recovered") {
            recovered++;
          }
        }
      }
    }
  } catch (advErr) {
    console.error("[Scheduled Recovery Advance Error]", advErr);
  }

  return {
    processed: dueSources.length,
    triggered,
    succeeded,
    recovered,
    degraded,
    failed,
    advancedScrapes,
    advancedRecoveries,
    results,
  };
}
