import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { BrightDataClient } from "./client.ts";
import { runBrightDataCollector } from "./run-collector.ts";
import { BrightDataError, SelfHealingUnavailableError } from "./errors.ts";

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

  describe("Self-Healing API", () => {
    it("5. triggers refactor_template with prompt and custom_input", async () => {
      let capturedUrl: string | undefined;
      let capturedMethod: string | undefined;
      let capturedBody: unknown;

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(JSON.stringify({ status: "triggered" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const client = new BrightDataClient({ apiToken: mockToken });
      await client.triggerRefactorTemplate({
        collectorId,
        prompt: "Recover missing price and CTA selectors",
      });

      assert.equal(capturedMethod, "POST");
      assert.ok(capturedUrl?.includes(`/dca/collectors/${collectorId}/refactor_template`));
      assert.deepEqual(capturedBody, {
        prompt: "Recover missing price and CTA selectors",
        custom_input: [],
      });
    });

    it("6. throws SelfHealingUnavailableError on HTTP 503 disabled response", async () => {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            status: "heal_trigger_failed",
            error: "Self healing tool is temporarily disabled",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        );
      }) as typeof fetch;

      const client = new BrightDataClient({ apiToken: mockToken });

      await assert.rejects(
        async () => {
          await client.triggerRefactorTemplate({
            collectorId,
            prompt: "Recover selectors",
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof SelfHealingUnavailableError);
          assert.equal(err.statusCode, 503);
          assert.equal(err.retryable, true);
          return true;
        },
      );
    });

    it("7. polls refactor_template/progress until pending_answer (awaiting approval)", async () => {
      let pollCount = 0;

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        assert.ok(urlStr.includes(`/dca/collectors/${collectorId}/refactor_template/progress`));
        pollCount++;

        if (pollCount === 1) {
          return new Response(
            JSON.stringify({ status: "running", step: "analyzing" }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            status: "pending_answer",
            step: "review_diff",
            preview_result: [
              {
                headline: "Smarter lighting. Simpler living.",
                offer: "Free Pro Upgrade with every Starter Kit",
                pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
                primaryCta: { label: "Get the Starter Kit", href: "#products" },
                guarantees: ["Free installation support", "30-day returns", "2-year warranty"],
                sourceUrl: testUrl,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof fetch;

      const client = new BrightDataClient({ apiToken: mockToken });
      const progress = await client.pollRefactorProgress({
        collectorId,
        intervalMs: 5,
        maxAttempts: 5,
      });

      assert.equal(pollCount, 2);
      assert.equal(progress.status, "pending_answer");
      assert.ok(Array.isArray(progress.preview_result));
      assert.equal(progress.preview_result.length, 1);
    });

    it("8. resumeAutomationJob sends approval decision with auto_save", async () => {
      let capturedUrl: string | undefined;
      let capturedMethod: string | undefined;
      let capturedBody: unknown;

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = String(input);
        capturedMethod = init?.method;
        capturedBody = init?.body ? JSON.parse(String(init.body)) : undefined;

        return new Response(JSON.stringify({ status: "ok" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const client = new BrightDataClient({ apiToken: mockToken });
      await client.resumeAutomationJob({
        collectorId,
        approve: true,
        autoSave: true,
      });

      assert.equal(capturedMethod, "POST");
      assert.ok(capturedUrl?.includes(`/dca/collectors/${collectorId}/resume_automation_job`));
      assert.deepEqual(capturedBody, {
        message: true,
        auto_save: true,
      });
    });

    it("9. crawler error payload with wait_element_timeout throws typed BrightDataError with errorCode", async () => {
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_timeout_test" }), { status: 200 });
        }
        if (urlStr.includes("get_result")) {
          return new Response(
            JSON.stringify([
              {
                input: { url: testUrl },
                error: 'Crawler error: waiting for selector "section.hero" failed: timeout 30000ms exceeded',
                error_code: "wait_element_timeout",
              },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      await assert.rejects(
        async () => {
          await runBrightDataCollector({
            apiToken: mockToken,
            collectorId,
            url: testUrl,
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof BrightDataError);
          assert.equal(err.errorCode, "wait_element_timeout");
          assert.ok(err.message.includes("waiting for selector"));
          return true;
        },
      );
    });
  });
});
