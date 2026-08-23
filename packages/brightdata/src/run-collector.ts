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
 * or the collector returns an error record (e.g. wait_element_timeout).
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

  // 3. Extract the first record from the array or object and detect crawler errors
  if (Array.isArray(rawData)) {
    if (rawData.length === 0) {
      throw new BrightDataError(
        "Bright Data collector returned an empty result array.",
      );
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
