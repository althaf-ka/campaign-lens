import {
  type Database,
  getSourceById,
  getActiveScrapeRunBySourceId,
  createScrapeRun,
  updateScrapeRunStatus,
  insertSourceActivity,
  type ScrapeRun,
} from "@campaign-lens/db";
import { triggerCollectorRun, BrightDataError } from "@campaign-lens/brightdata";

export interface MonitorSourceOptions {
  sourceId: string;
  db: Database;
  apiToken: string;
  now?: Date;
  baseUrl?: string;
  intervalMinutes?: number;
  retryIntervalMinutes?: number;
}

export interface MonitorSourceAcceptedResult {
  status: "accepted";
  runId: string;
  sourceId: string;
  state: ScrapeRun["status"];
  scrapeRun?: ScrapeRun;
}

/**
 * Triggers asynchronous autonomous monitoring:
 * 1. Checks for an active scrape run with a valid upstreamResponseId.
 * 2. If an orphaned run with null upstreamResponseId exists, marks it failed and allows a fresh monitor attempt.
 * 3. Calls Bright Data trigger_immediate exactly once.
 * 4. Invariant: An active scrape run requiring result polling MUST have a valid upstreamResponseId.
 *    If trigger fails, no orphaned active run is left behind.
 * 5. Returns HTTP 202 Accepted payload immediately.
 */
export async function monitorSource(
  options: MonitorSourceOptions,
): Promise<MonitorSourceAcceptedResult> {
  const { sourceId, db, apiToken, now = new Date(), baseUrl } = options;

  const source = await getSourceById(db, sourceId);
  if (!source) {
    throw new Error(`Source with ID '${sourceId}' not found.`);
  }

  // 1. Check if there's already an active scrape run in progress
  const activeRun = await getActiveScrapeRunBySourceId(db, source.id, now);
  if (activeRun) {
    if (activeRun.upstreamResponseId) {
      return {
        status: "accepted",
        runId: activeRun.id,
        sourceId: source.id,
        state: activeRun.status,
        scrapeRun: activeRun,
      };
    }

    // Mark permanently orphaned run as failed so it does not block future runs
    await updateScrapeRunStatus(db, activeRun.id, {
      status: "failed",
      errorCode: "missing_upstream_response_id",
      completedAt: now,
    });
  }

  // 2. Trigger Bright Data collector ONCE
  let triggerResult: { responseId: string };
  try {
    triggerResult = await triggerCollectorRun({
      apiToken,
      collectorId: source.collectorId,
      url: source.url,
      baseUrl,
    });
  } catch (triggerError) {
    // If Bright Data trigger fails before returning a response ID, ensure error is sanitized and rethrow
    const sanitizedError =
      triggerError instanceof BrightDataError
        ? triggerError.errorCode || "crawler_trigger_error"
        : triggerError instanceof Error
          ? triggerError.message
          : "trigger_failed";

    throw new Error(`Bright Data trigger failed: ${sanitizedError}`, {
      cause: triggerError,
    });
  }

  if (!triggerResult.responseId) {
    throw new Error("Bright Data trigger failed: missing response ID.");
  }

  // 3. Persist new scrape run record with guaranteed upstream response ID
  const createdRun = await createScrapeRun(db, {
    sourceId: source.id,
    status: "collecting",
    upstreamResponseId: triggerResult.responseId,
    startedAt: now,
  });

  // 4. Record monitor_started activity
  await insertSourceActivity(db, {
    competitorId: source.competitorId,
    sourceId: source.id,
    type: "monitor_started",
    message: "Source monitoring started",
    metadata: {
      scrapeRunId: createdRun.id,
      collectorId: source.collectorId,
    },
    occurredAt: now,
  });

  return {
    status: "accepted",
    runId: createdRun.id,
    sourceId: source.id,
    state: "collecting",
    scrapeRun: createdRun,
  };
}
