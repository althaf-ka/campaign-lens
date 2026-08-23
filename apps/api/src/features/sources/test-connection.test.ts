import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { app } from "../../app.ts";

describe("Test Scraper Connection Diagnostic Endpoint", () => {
  const originalFetch = globalThis.fetch;
  const mockToken = "test-brightdata-token-12345";
  const validCollectorId = "c_mt5kun512itlsaiw1s";
  const validUrl = "https://lumora-58u.pages.dev/";

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const validSnapshotData = {
    headline: "Smarter lighting. Simpler living.",
    offer: "Free Pro Upgrade with every Starter Kit",
    pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
    primaryCta: { label: "Get the Starter Kit", href: "#products" },
    guarantees: ["Free installation support"],
    sourceUrl: validUrl,
  };

  it("1. compatible collector returns status 'compatible' with sanitized preview", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("trigger_immediate")) {
        return new Response(JSON.stringify({ response_id: "res_diag_ok" }), { status: 200 });
      }
      if (urlStr.includes("get_result")) {
        return new Response(JSON.stringify([validSnapshotData]), { status: 200 });
      }
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as typeof fetch;

    const res = await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: validUrl,
        collectorId: validCollectorId,
        sourceType: "homepage",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      status: string;
      preview: { headline: string; pricing: { amount: number }; primaryCta: { label: string } };
    };
    assert.equal(data.status, "compatible");
    assert.equal(data.preview.headline, "Smarter lighting. Simpler living.");
    assert.equal(data.preview.pricing.amount, 2299);
    assert.equal(data.preview.primaryCta.label, "Get the Starter Kit");
  });

  it("2. invalid collector ID (missing 'c_' prefix) is rejected with 400", async () => {
    const res = await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: validUrl,
        collectorId: "invalid_collector_id",
        sourceType: "homepage",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(res.status, 400);
    const data = (await res.json()) as { error: { code: string } };
    assert.equal(data.error.code, "VALIDATION_ERROR");
  });

  it("3. malformed URL is rejected with 400", async () => {
    const res = await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: "not-a-valid-url",
        collectorId: validCollectorId,
        sourceType: "homepage",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(res.status, 400);
    const data = (await res.json()) as { error: { code: string } };
    assert.equal(data.error.code, "VALIDATION_ERROR");
  });

  it("4. valid schema but degraded integrity returns 'incompatible' with missing fields", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("trigger_immediate")) {
        return new Response(JSON.stringify({ response_id: "res_diag_degraded" }), { status: 200 });
      }
      if (urlStr.includes("get_result")) {
        return new Response(
          JSON.stringify([
            {
              ...validSnapshotData,
              pricing: { amount: null, currency: null, qualifier: null },
            },
          ]),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as typeof fetch;

    const res = await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: validUrl,
        collectorId: validCollectorId,
        sourceType: "homepage",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as {
      status: string;
      reason: string;
      missing: string[];
    };
    assert.equal(data.status, "incompatible");
    assert.equal(data.reason, "extraction_integrity_failed");
    assert.ok(data.missing.includes("pricing.amount"));
  });

  it("5. crawler wait_element_timeout returns 'incompatible' with sanitized error code", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("trigger_immediate")) {
        return new Response(JSON.stringify({ response_id: "res_crawler_err" }), { status: 200 });
      }
      if (urlStr.includes("get_result")) {
        return new Response(
          JSON.stringify([
            {
              input: { url: validUrl },
              error: 'Crawler error: waiting for selector "section.hero" failed: timeout 30000ms exceeded',
              error_code: "wait_element_timeout",
            },
          ]),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as typeof fetch;

    const res = await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: validUrl,
        collectorId: validCollectorId,
        sourceType: "homepage",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(res.status, 200);
    const data = (await res.json()) as { status: string; reason: string };
    assert.equal(data.status, "incompatible");
    assert.equal(data.reason, "wait_element_timeout");
  });

  it("6. client API token injection is ignored and server binding is used", async () => {
    let capturedAuthHeader: string | undefined;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      capturedAuthHeader = headers["Authorization"];
      return new Response(JSON.stringify({ response_id: "res_auth_check" }), { status: 200 });
    }) as typeof fetch;

    await app.request("/sources/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: validUrl,
        collectorId: validCollectorId,
        sourceType: "homepage",
        apiToken: "malicious_client_token",
      }),
    }, {
      DATABASE_URL: "postgresql://mock:mock@mock.neon.tech/mock",
      BRIGHT_DATA_API_TOKEN: mockToken,
    });

    assert.equal(capturedAuthHeader, `Bearer ${mockToken}`);
    assert.ok(!capturedAuthHeader?.includes("malicious"));
  });
});
