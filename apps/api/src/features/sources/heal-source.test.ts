import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { healSource } from "./heal-source.ts";
import type { Database } from "@campaign-lens/db";

describe("healSource Orchestration", () => {
  const originalFetch = globalThis.fetch;
  const mockToken = "test-brightdata-token-12345";
  const testCollectorId = "c_mt5kun512itlsaiw1s";

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function createMockDb(options?: {
    sourceHealth?: "healthy" | "degraded" | "needs_review" | "healing";
    latestSnapshotData?: unknown;
  }) {
    let currentHealth = options?.sourceHealth ?? "degraded";
    const healthHistory: string[] = [];
    let createdEventsCount = 0;
    let createdSnapshotsCount = 0;

    const mockSource = {
      id: "source-uuid-1111",
      competitorId: "competitor-uuid-2222",
      name: "Homepage Campaign",
      url: "https://lumora-58u.pages.dev/",
      type: "homepage",
      collectorId: testCollectorId,
      get health() {
        return currentHealth;
      },
      set health(val) {
        currentHealth = val;
        healthHistory.push(val);
      },
      lastRunAt: new Date(),
      nextRunAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockPreviousSnapshot = {
      id: "snap-uuid-prev",
      sourceId: mockSource.id,
      data: options?.latestSnapshotData ?? {
        headline: "Smarter lighting. Simpler living.",
        offer: "Free Pro Upgrade with every Starter Kit",
        pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
        primaryCta: { label: "Get the Starter Kit", href: "#products" },
        guarantees: ["Free installation support", "30-day returns", "2-year warranty"],
        sourceUrl: "https://lumora-58u.pages.dev/",
      },
    };

    const mockDb = {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => {
              return [mockSource];
            },
            orderBy: () => ({
              limit: async () => {
                return [mockPreviousSnapshot];
              },
            }),
          }),
        }),
      }),
      update: () => ({
        set: (data: { health?: string; status?: string }) => ({
          where: () => ({
            returning: async () => {
              if (data.health) {
                mockSource.health = data.health as typeof currentHealth;
              }
              return [mockSource];
            },
          }),
        }),
      }),
      insert: () => ({
        values: (vals: unknown) => ({
          returning: async () => {
            if (Array.isArray(vals)) {
              createdEventsCount += vals.length;
              return vals.map((v, i) => ({ id: `event-${i}`, ...v }));
            }
            createdSnapshotsCount++;
            return [{ id: "snap-uuid-new", ...(vals as Record<string, unknown>) }];
          },
        }),
      }),
      getHealthHistory: () => healthHistory,
      getCurrentHealth: () => currentHealth,
      getCreatedEventsCount: () => createdEventsCount,
      getCreatedSnapshotsCount: () => createdSnapshotsCount,
    } as unknown as Database & {
      getHealthHistory: () => string[];
      getCurrentHealth: () => string;
      getCreatedEventsCount: () => number;
      getCreatedSnapshotsCount: () => number;
    };

    return { mockDb, mockSource };
  }

  it("1. healthy source is not unnecessarily healed", async () => {
    const { mockDb, mockSource } = createMockDb({ sourceHealth: "healthy" });

    const result = await healSource({
      sourceId: mockSource.id,
      db: mockDb,
      apiToken: mockToken,
    });

    assert.equal(result.status, "healthy");
    assert.equal(mockDb.getCurrentHealth(), "healthy");
    assert.equal(mockDb.getHealthHistory().length, 0); // No state mutation
  });

  it("2. HTTP 503 unavailable healing returns source safely to degraded without corruption", async () => {
    const { mockDb, mockSource } = createMockDb({ sourceHealth: "degraded" });

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          status: "heal_trigger_failed",
          error: "Self healing tool is temporarily disabled",
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    const result = await healSource({
      sourceId: mockSource.id,
      db: mockDb,
      apiToken: mockToken,
    });

    assert.equal(result.status, "unavailable");
    if (result.status === "unavailable") {
      assert.equal(result.retryable, true);
    }
    // Flow: degraded -> healing -> degraded
    assert.deepEqual(mockDb.getHealthHistory(), ["healing", "degraded"]);
    assert.equal(mockDb.getCurrentHealth(), "degraded");
  });

  it("3. degraded source starts healing and marks source as healing", async () => {
    const { mockDb, mockSource } = createMockDb({ sourceHealth: "degraded" });

    let triggerCalled = false;
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("refactor_template")) {
        triggerCalled = true;
        return new Response(JSON.stringify({ status: "triggered" }), { status: 200 });
      }
      return new Response(JSON.stringify({ status: "running", step: "generating" }), { status: 200 });
    }) as typeof fetch;

    // Call with 1 attempt to observe progress
    await healSource({
      sourceId: mockSource.id,
      db: mockDb,
      apiToken: mockToken,
      maxAttempts: 1,
      intervalMs: 1,
      timeoutMs: 100,
    });

    assert.ok(triggerCalled);
    assert.ok(mockDb.getHealthHistory().includes("healing"));
  });

  it("4. bad preview (missing required price) fails integrity check and transitions to needs_review without approval", async () => {
    const { mockDb, mockSource } = createMockDb({ sourceHealth: "degraded" });

    let approveCalled = false;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("resume_automation_job")) {
        approveCalled = true;
        return new Response(JSON.stringify({ status: "approved" }), { status: 200 });
      }
      if (urlStr.includes("refactor_template/progress")) {
        return new Response(
          JSON.stringify({
            status: "pending_answer",
            preview_result: [
              {
                headline: "Smarter lighting. Simpler living.",
                offer: "Free Pro Upgrade with every Starter Kit",
                pricing: { amount: null, currency: null, qualifier: null }, // BAD: missing price!
                primaryCta: { label: "Get the Starter Kit", href: "#products" },
                guarantees: [],
                sourceUrl: "https://lumora-58u.pages.dev/",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ status: "triggered" }), { status: 200 });
    }) as typeof fetch;

    const result = await healSource({
      sourceId: mockSource.id,
      db: mockDb,
      apiToken: mockToken,
      intervalMs: 1,
    });

    assert.equal(result.status, "needs_review");
    if (result.status === "needs_review") {
      assert.deepEqual(result.missing, ["pricing.amount"]);
    }
    assert.equal(approveCalled, false); // Crucial: was NOT approved
    assert.equal(mockDb.getCurrentHealth(), "needs_review");
  });

  it("5. healthy preview passes schema + integrity, approves repair, reruns SAME collectorId, and emits 0 new events on identical data", async () => {
    const { mockDb, mockSource } = createMockDb({
      sourceHealth: "degraded",
      latestSnapshotData: {
        headline: "Smarter lighting. Simpler living.",
        offer: "Free Pro Upgrade with every Starter Kit",
        pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
        primaryCta: { label: "Get the Starter Kit", href: "#products" },
        guarantees: ["Free installation support", "30-day returns", "2-year warranty"],
        sourceUrl: "https://lumora-58u.pages.dev/",
      },
    });

    const validPreview = {
      headline: "Smarter lighting. Simpler living.",
      offer: "Free Pro Upgrade with every Starter Kit",
      pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
      primaryCta: { label: "Get the Starter Kit", href: "#order-now" },
      guarantees: ["Free installation support", "30-day returns", "2-year warranty"],
      sourceUrl: "https://lumora-58u.pages.dev/",
    };

    let approveCalled = false;
    let rerunCollectorId: string | undefined;

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const urlStr = String(input);

      if (urlStr.includes("refactor_template/progress")) {
        return new Response(
          JSON.stringify({
            status: "pending_answer",
            preview_result: [validPreview],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (urlStr.includes("resume_automation_job")) {
        approveCalled = true;
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }

      // Re-run trigger and poll
      if (urlStr.includes("trigger_immediate")) {
        rerunCollectorId = urlStr.split("collector=")[1];
        return new Response(JSON.stringify({ response_id: "res_rerun_123" }), { status: 200 });
      }

      if (urlStr.includes("get_result")) {
        return new Response(JSON.stringify([validPreview]), { status: 200 });
      }

      return new Response(JSON.stringify({ status: "triggered" }), { status: 200 });
    }) as typeof fetch;

    const result = await healSource({
      sourceId: mockSource.id,
      db: mockDb,
      apiToken: mockToken,
      intervalMs: 1,
    });

    assert.equal(result.status, "healed");
    assert.equal(approveCalled, true);
    assert.equal(rerunCollectorId, testCollectorId); // Same collector ID preserved
    if (result.status === "healed") {
      assert.equal(result.collectorId, testCollectorId);
      assert.equal(result.runResult.status, "healthy");
    }
    assert.equal(mockDb.getCurrentHealth(), "healthy");
    // Since recovered data matches last known-good data, 0 new events created
    assert.equal(mockDb.getCreatedEventsCount(), 0);
  });
});
