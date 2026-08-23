import { BrightDataClient } from "./client.ts";
import { BrightDataError } from "./errors.ts";

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
 *
 * Throws a BrightDataError if the network request fails, polling times out,
 * or the collector returns no valid records.
 */
export async function runBrightDataCollector(
  input: RunCollectorInput,
): Promise<unknown> {
  const client = new BrightDataClient({ apiToken: input.apiToken });

  // 1. Trigger the real-time collector
  const triggerRes = await client.triggerImmediate({
    collectorId: input.collectorId,
    url: input.url,
  });

  const responseId = triggerRes.response_id;
  if (!responseId) {
    throw new BrightDataError(
      "Bright Data did not return a valid response_id.",
    );
  }

  // 2. Poll for the collected output
  const rawData = await client.pollRealTime({
    responseId,
    timeoutMs: input.timeoutMs,
    intervalMs: input.pollIntervalMs,
    maxAttempts: input.maxAttempts,
  });

  // 3. Extract the first record from the array or object
  if (Array.isArray(rawData)) {
    if (rawData.length === 0) {
      throw new BrightDataError(
        "Bright Data collector returned an empty result array.",
      );
    }
    return rawData[0];
  }

  if (rawData && typeof rawData === "object") {
    return rawData;
  }

  throw new BrightDataError(
    "Bright Data collector returned an unrecognized response format.",
  );
}
