import { BrightDataError } from "./errors.ts";

export interface BrightDataClientOptions {
  apiToken: string;
  baseUrl?: string;
}

export interface TriggerOptions {
  collectorId: string;
  url: string;
}

export interface PollOptions {
  responseId?: string;
  collectionId?: string;
  maxAttempts?: number;
  intervalMs?: number;
  timeoutMs?: number;
}

export class BrightDataClient {
  private readonly apiToken: string;
  private readonly baseUrl: string;

  constructor(options: BrightDataClientOptions) {
    if (!options.apiToken) {
      throw new BrightDataError("Bright Data API token is required.");
    }
    this.apiToken = options.apiToken;
    this.baseUrl = options.baseUrl ?? "https://api.brightdata.com";
  }

  /**
   * Triggers a real-time Scraper Studio collector run.
   * Endpoint: POST /dca/trigger_immediate?collector=<collectorId>
   * Request body format: single object { url: string }
   */
  async triggerImmediate(
    options: TriggerOptions,
  ): Promise<{ response_id: string; [key: string]: unknown }> {
    const endpoint = `${this.baseUrl}/dca/trigger_immediate?collector=${encodeURIComponent(options.collectorId)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: options.url }),
      });
    } catch (err) {
      throw new BrightDataError(
        "Network error while connecting to Bright Data trigger API.",
        {
          cause: err,
        },
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new BrightDataError(
        `Bright Data real-time trigger failed with HTTP ${response.status}: ${errorText}`,
        { statusCode: response.status, details: errorText },
      );
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const responseId = (data.response_id || data.collection_id || data.id) as
      | string
      | undefined;

    if (!responseId) {
      throw new BrightDataError(
        "Bright Data trigger did not return a response_id.",
        { details: data },
      );
    }

    return { response_id: responseId, ...data };
  }

  /**
   * Retrieves results for a real-time collection request.
   * Endpoint: GET /dca/get_result?response_id=<responseId>
   */
  async getResult(responseId: string): Promise<unknown> {
    const endpoint = `${this.baseUrl}/dca/get_result?response_id=${encodeURIComponent(responseId)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });
    } catch (err) {
      throw new BrightDataError(
        "Network error while fetching Bright Data collection result.",
        {
          cause: err,
        },
      );
    }

    // HTTP 202 Accepted indicates job is still pending/building
    if (response.status === 202) {
      return { status: "building", pending: true };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new BrightDataError(
        `Bright Data get_result failed with HTTP ${response.status}: ${errorText}`,
        { statusCode: response.status, details: errorText },
      );
    }

    const text = await response.text();
    if (!text || text.trim() === "") {
      return { status: "building", pending: true };
    }

    try {
      return JSON.parse(text);
    } catch {
      return { status: "building", pending: true };
    }
  }

  /**
   * Triggers a batch Scraper Studio collector run.
   * Endpoint: POST /dca/trigger?collector=<collectorId>&queue_next=1
   * Request body format: array of objects [{ url: string }]
   */
  async triggerBatch(
    options: TriggerOptions,
  ): Promise<{ collection_id: string; [key: string]: unknown }> {
    const endpoint = `${this.baseUrl}/dca/trigger?collector=${encodeURIComponent(options.collectorId)}&queue_next=1`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ url: options.url }]),
      });
    } catch (err) {
      throw new BrightDataError(
        "Network error while connecting to Bright Data batch trigger API.",
        {
          cause: err,
        },
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new BrightDataError(
        `Bright Data batch trigger failed with HTTP ${response.status}: ${errorText}`,
        { statusCode: response.status, details: errorText },
      );
    }

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const collectionId = (data.collection_id || data.response_id || data.id) as
      | string
      | undefined;

    if (!collectionId) {
      throw new BrightDataError(
        "Bright Data batch trigger did not return a collection_id.",
        { details: data },
      );
    }

    return { collection_id: collectionId, ...data };
  }

  /**
   * Retrieves dataset for a batch collection request.
   * Endpoint: GET /dca/dataset?id=<collectionId>
   */
  async getDataset(collectionId: string): Promise<unknown> {
    const endpoint = `${this.baseUrl}/dca/dataset?id=${encodeURIComponent(collectionId)}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
        },
      });
    } catch (err) {
      throw new BrightDataError(
        "Network error while fetching Bright Data dataset.",
        {
          cause: err,
        },
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new BrightDataError(
        `Bright Data dataset retrieval failed with status ${response.status}: ${errorText}`,
        { statusCode: response.status, details: errorText },
      );
    }

    return response.json();
  }

  /**
   * Bounded polling loop for real-time response.
   */
  async pollRealTime(options: {
    responseId: string;
    maxAttempts?: number;
    intervalMs?: number;
    timeoutMs?: number;
  }): Promise<unknown> {
    const maxAttempts = options.maxAttempts ?? 30;
    const intervalMs = options.intervalMs ?? 2000;
    const timeoutMs = options.timeoutMs ?? 60_000;
    const startTime = Date.now();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (Date.now() - startTime > timeoutMs) {
        throw new BrightDataError(
          `Bright Data polling timed out after ${timeoutMs}ms (attempt ${attempt}/${maxAttempts}).`,
        );
      }

      const result = await this.getResult(options.responseId);

      // Check if finished (array of results or complete record)
      if (Array.isArray(result)) {
        if (result.length > 0) {
          return result;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      } else if (result && typeof result === "object") {
        const record = result as Record<string, unknown>;
        const status = (record.status as string)?.toLowerCase();
        const isPending =
          record.pending === true ||
          status === "building" ||
          status === "running" ||
          status === "collecting" ||
          status === "pending" ||
          status === "processing" ||
          status === "in_progress" ||
          (typeof record.message === "string" &&
            /pending|processing|building|running/i.test(record.message));

        if (status === "failed" || status === "error") {
          throw new BrightDataError(
            `Bright Data collector execution failed: ${record.error || record.message || JSON.stringify(record)}`,
            { details: record },
          );
        }

        if (record.error && !isPending) {
          throw new BrightDataError(
            `Bright Data collector execution failed: ${record.error}`,
            { details: record },
          );
        }

        // Still building/running/pending
        if (isPending) {
          await new Promise((resolve) => setTimeout(resolve, intervalMs));
          continue;
        }

        // If it's a valid data object returned directly
        return record;
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new BrightDataError(
      `Bright Data collector reached maximum polling attempts (${maxAttempts}) without completing.`,
    );
  }
}
