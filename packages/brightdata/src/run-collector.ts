import { BrightDataClient } from "./client.ts";
import { BrightDataError } from "./errors.ts";

export interface TriggerCollectorRunInput {
  apiToken: string;
  collectorId: string;
  url: string;
  baseUrl?: string;
}

export interface GetCollectorRunResultInput {
  apiToken: string;
  responseId: string;
  baseUrl?: string;
}

export type CollectorRunResult =
  | { status: "pending" }
  | { status: "completed"; data: unknown };

/**
 * Triggers a real-time Scraper Studio collector run and returns the response_id immediately.
 * Does NOT block or poll.
 */
export async function triggerCollectorRun(
  input: TriggerCollectorRunInput,
): Promise<{ responseId: string }> {
  const client = new BrightDataClient({
    apiToken: input.apiToken,
    baseUrl: input.baseUrl,
  });

  const triggerRes = await client.triggerImmediate({
    collectorId: input.collectorId,
    url: input.url,
  });

  const responseId = triggerRes.response_id;
  if (!responseId) {
    throw new BrightDataError("Bright Data did not return a valid response_id.");
  }

  return { responseId };
}

/**
 * Checks the status of an ongoing collector run.
 * Returns { status: "pending" } or { status: "completed", data } or throws BrightDataError.
 */
export async function getCollectorRunResult(
  input: GetCollectorRunResultInput,
): Promise<CollectorRunResult> {
  const client = new BrightDataClient({
    apiToken: input.apiToken,
    baseUrl: input.baseUrl,
  });

  const rawData = await client.getResult(input.responseId);

  // 1. Check if still pending / building
  if (
    rawData &&
    typeof rawData === "object" &&
    "pending" in rawData &&
    (rawData as { pending?: boolean }).pending === true
  ) {
    return { status: "pending" };
  }

  if (
    rawData &&
    typeof rawData === "object" &&
    "status" in rawData &&
    ["building", "running", "pending"].includes((rawData as { status?: string }).status ?? "")
  ) {
    return { status: "pending" };
  }

  // 2. Extract record & check for crawler errors
  if (Array.isArray(rawData)) {
    if (rawData.length === 0) {
      throw new BrightDataError("Bright Data collector returned an empty result array.");
    }
    const firstRecord = rawData[0];
    if (firstRecord && typeof firstRecord === "object") {
      const rec = firstRecord as Record<string, unknown>;
      if (rec.error || rec.error_code) {
        const errorCode =
          typeof rec.error_code === "string"
            ? rec.error_code
            : "collector_execution_error";
        const errorMsg =
          typeof rec.error === "string"
            ? rec.error
            : `Collector execution error: ${errorCode}`;
        throw new BrightDataError(errorMsg, {
          errorCode,
          details: { errorCode, error: errorMsg },
        });
      }
    }
    return { status: "completed", data: firstRecord };
  }

  if (rawData && typeof rawData === "object") {
    const rec = rawData as Record<string, unknown>;
    if (rec.error || rec.error_code) {
      const errorCode =
        typeof rec.error_code === "string"
          ? rec.error_code
          : "collector_execution_error";
      const errorMsg =
        typeof rec.error === "string"
          ? rec.error
          : `Collector execution error: ${errorCode}`;
      throw new BrightDataError(errorMsg, {
        errorCode,
        details: { errorCode, error: errorMsg },
      });
    }
    return { status: "completed", data: rawData };
  }

  throw new BrightDataError(
    "Bright Data collector returned an unrecognized response format.",
  );
}

export interface RunCollectorInput {
  apiToken: string;
  collectorId: string;
  url: string;
  timeoutMs?: number;
  pollIntervalMs?: number;
  maxAttempts?: number;
}

/**
 * Triggers a Bright Data Scraper Studio collector, polls for completion,
 * and extracts the raw first record returned by the collector.
 */
export async function runBrightDataCollector(
  input: RunCollectorInput,
): Promise<unknown> {
  const { responseId } = await triggerCollectorRun({
    apiToken: input.apiToken,
    collectorId: input.collectorId,
    url: input.url,
  });

  const client = new BrightDataClient({ apiToken: input.apiToken });
  const rawData = await client.pollRealTime({
    responseId,
    timeoutMs: input.timeoutMs,
    intervalMs: input.pollIntervalMs,
    maxAttempts: input.maxAttempts,
  });

  if (Array.isArray(rawData)) {
    if (rawData.length === 0) {
      throw new BrightDataError("Bright Data collector returned an empty result array.");
    }
    const firstRecord = rawData[0];
    if (firstRecord && typeof firstRecord === "object") {
      const rec = firstRecord as Record<string, unknown>;
      if (rec.error || rec.error_code) {
        const errorCode =
          typeof rec.error_code === "string"
            ? rec.error_code
            : "collector_execution_error";
        const errorMsg =
          typeof rec.error === "string"
            ? rec.error
            : `Collector execution error: ${errorCode}`;
        throw new BrightDataError(errorMsg, {
          errorCode,
          details: { errorCode, error: errorMsg },
        });
      }
    }
    return firstRecord;
  }

  if (rawData && typeof rawData === "object") {
    const rec = rawData as Record<string, unknown>;
    if (rec.error || rec.error_code) {
      const errorCode =
        typeof rec.error_code === "string"
          ? rec.error_code
          : "collector_execution_error";
      const errorMsg =
        typeof rec.error === "string"
          ? rec.error
          : `Collector execution error: ${errorCode}`;
      throw new BrightDataError(errorMsg, {
        errorCode,
        details: { errorCode, error: errorMsg },
      });
    }
    return rawData;
  }

  throw new BrightDataError(
    "Bright Data collector returned an unrecognized response format.",
  );
}
