import { type Database, listDueSources } from "@campaign-lens/db";
import { monitorSource, type MonitorSourceResult } from "./monitor-source.ts";

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
  succeeded: number;
  recovered: number;
  degraded: number;
  failed: number;
  results: Array<{
    sourceId: string;
    result?: MonitorSourceResult;
    error?: string;
  }>;
}

/**
 * Scheduled monitoring handler: fetches a bounded batch of due sources and executes
 * autonomous monitoring and recovery per source with complete fault isolation.
 */
export async function runDueSources(
  options: RunDueSourcesOptions,
): Promise<RunDueSourcesSummary> {
  const { db, apiToken, now = new Date(), limit = 10, intervalMinutes, retryIntervalMinutes } = options;

  // 1. Fetch bounded batch of due sources
  const dueSources = await listDueSources(db, { now, limit });

  if (dueSources.length === 0) {
    return {
      processed: 0,
      succeeded: 0,
      recovered: 0,
      degraded: 0,
      failed: 0,
      results: [],
    };
  }

  // 2. Process all due sources with per-source fault isolation
  const outcomes = await Promise.allSettled(
    dueSources.map((source) =>
      monitorSource({
        sourceId: source.id,
        db,
        apiToken,
        now,
        intervalMinutes,
        retryIntervalMinutes,
      }),
    ),
  );

  let succeeded = 0;
  let recovered = 0;
  let degraded = 0;
  let failed = 0;

  const results: Array<{
    sourceId: string;
    result?: MonitorSourceResult;
    error?: string;
  }> = [];

  for (let i = 0; i < dueSources.length; i++) {
    const source = dueSources[i]!;
    const outcome = outcomes[i]!;

    if (outcome.status === "fulfilled") {
      const res = outcome.value;
      results.push({ sourceId: source.id, result: res });

      if (res.status === "healthy") {
        succeeded++;
      } else if (res.status === "recovered") {
        recovered++;
      } else if (res.status === "degraded") {
        degraded++;
      } else {
        failed++;
      }
    } else {
      const err = outcome.reason;
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Scheduled Monitoring] Error monitoring source ${source.id}:`, errorMsg);
      results.push({ sourceId: source.id, error: errorMsg });
      failed++;
    }
  }

  return {
    processed: dueSources.length,
    succeeded,
    recovered,
    degraded,
    failed,
    results,
  };
}
