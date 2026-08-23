import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { BrightDataClient } from "./client.ts";

describe("BrightDataClient", () => {
  const originalFetch = globalThis.fetch;
  const mockToken = "test-brightdata-token-12345";
  const collectorId = "c_mt5kun512itlsaiw1s";
  const testUrl = "https://lumora-58u.pages.dev/";

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("1. real-time trigger sends a single object in the request body", async () => {
    let capturedUrl: string | undefined;
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

      return new Response(
        JSON.stringify({
          response_id: "res_abc12345",
          status: "pending",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    const client = new BrightDataClient({ apiToken: mockToken });
    const res = await client.triggerImmediate({
      collectorId,
      url: testUrl,
    });

    assert.equal(res.response_id, "res_abc12345");
    assert.equal(capturedMethod, "POST");
    assert.ok(
      capturedUrl?.includes(
        "/dca/trigger_immediate?collector=c_mt5kun512itlsaiw1s",
      ),
    );
    // Verify single object form
    assert.deepEqual(capturedBody, { url: testUrl });
    assert.equal(Array.isArray(capturedBody), false);
  });

  it("2. batch trigger sends an array of objects in the request body", async () => {
    let capturedUrl: string | undefined;
    let capturedMethod: string | undefined;
    let capturedBody: unknown;

    globalThis.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

      return new Response(
        JSON.stringify({
          collection_id: "col_xyz789",
          status: "pending",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }) as typeof fetch;

    const client = new BrightDataClient({ apiToken: mockToken });
    const res = await client.triggerBatch({
      collectorId,
      url: testUrl,
    });

    assert.equal(res.collection_id, "col_xyz789");
    assert.equal(capturedMethod, "POST");
    assert.ok(
      capturedUrl?.includes(
        "/dca/trigger?collector=c_mt5kun512itlsaiw1s&queue_next=1",
      ),
    );
    // Verify array form
    assert.deepEqual(capturedBody, [{ url: testUrl }]);
    assert.equal(Array.isArray(capturedBody), true);
  });

  it("3. authentication header Bearer token is correctly set", async () => {
    let capturedAuthHeader: string | undefined;

    globalThis.fetch = (async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const headers = init?.headers as Record<string, string>;
      capturedAuthHeader = headers["Authorization"];

      return new Response(JSON.stringify({ response_id: "res_auth_test" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const client = new BrightDataClient({ apiToken: mockToken });
    await client.triggerImmediate({ collectorId, url: testUrl });

    assert.equal(capturedAuthHeader, `Bearer ${mockToken}`);
  });

  it("4. response_id is correctly used when polling real-time results, handling pending and completion", async () => {
    const requestedEndpoints: string[] = [];
    let pollCount = 0;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      requestedEndpoints.push(urlStr);
      pollCount++;

      // First poll: returns pending status
      if (pollCount === 1) {
        return new Response(
          JSON.stringify({ pending: true, message: "Request is pending" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      // Second poll: returns 202 Accepted (still building)
      if (pollCount === 2) {
        return new Response(null, { status: 202 });
      }

      // Third poll: returns completed data
      return new Response(
        JSON.stringify([
          {
            headline: "Smarter lighting. Simpler living.",
            offer: "Save 30% on the Lumora Starter Kit",
            pricing: {
              amount: 1999,
              currency: "INR",
              qualifier: "Starter Kit",
            },
            primaryCta: { label: "Get the Starter Kit", href: "#products" },
            guarantees: ["Free installation support"],
            sourceUrl: "https://lumora-58u.pages.dev/",
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const client = new BrightDataClient({ apiToken: mockToken });
    const result = await client.pollRealTime({
      responseId: "res_target_456",
      maxAttempts: 5,
      intervalMs: 10,
    });

    assert.equal(pollCount, 3);
    assert.ok(
      requestedEndpoints.every((ep) =>
        ep.includes("/dca/get_result?response_id=res_target_456"),
      ),
    );
    assert.ok(Array.isArray(result));
    assert.equal(
      (result as Array<{ headline: string }>)[0]?.headline,
      "Smarter lighting. Simpler living.",
    );
  });
});
