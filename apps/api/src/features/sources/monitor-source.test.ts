import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { monitorSource } from "./monitor-source.ts";
import { runDueSources } from "./run-due-sources.ts";
import { shouldAttemptHealing } from "./recovery-policy.ts";
import { listDueSources } from "@campaign-lens/db";
import { BrightDataError } from "@campaign-lens/brightdata";
import type { Database } from "@campaign-lens/db";

describe("monitorSource & Scheduled Monitoring Orchestration", () => {
  const originalFetch = globalThis.fetch;
  const mockToken = "test-brightdata-token-12345";
  const testCollectorId = "c_mt5kun512itlsaiw1s";

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  const validSnapshotData = {
    headline: "Smarter lighting. Simpler living.",
    offer: "Free Pro Upgrade with every Starter Kit",
    pricing: { amount: 2299, currency: "INR", qualifier: "Starter Kit" },
    primaryCta: { label: "Get the Starter Kit", href: "#products" },
    guarantees: ["Free installation support", "30-day returns", "2-year warranty"],
    sourceUrl: "https://lumora-58u.pages.dev/",
  };

  function createMockDb(options?: {
    sourcesList?: Array<{
      id: string;
      health: "healthy" | "degraded" | "needs_review" | "healing";
      nextRunAt: Date | null;
    }>;
    latestSnapshotData?: unknown;
  }) {
    const mockSources = options?.sourcesList ?? [
      {
        id: "source-uuid-1111",
        health: "healthy" as const,
        nextRunAt: null,
      },
    ];

    const sourceObjects = mockSources.map((s) => ({
      id: s.id,
      competitorId: "competitor-uuid-2222",
      name: "Homepage Campaign",
      url: "https://lumora-58u.pages.dev/",
      type: "homepage",
      collectorId: testCollectorId,
      health: s.health,
      lastRunAt: new Date(),
      nextRunAt: s.nextRunAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    let createdEventsCount = 0;
    let createdSnapshotsCount = 0;
    const scheduleUpdates: Array<{ id: string; nextRunAt: Date | null; health?: string }> = [];

    const mockPreviousSnapshot = {
      id: "snap-uuid-prev",
      sourceId: sourceObjects[0]?.id,
      data: options?.latestSnapshotData ?? validSnapshotData,
    };

    const mockDb = {
      select: () => ({
        from: () => ({
          where: (condition?: unknown) => ({
            orderBy: () => ({
              limit: async (lim?: number) => {
                // If condition is present in listDueSources query
                if (condition && typeof condition === "object") {
                  const list = sourceObjects.filter((s) => {
                    if (s.nextRunAt === null) return true;
                    return s.nextRunAt.getTime() <= new Date("2026-08-23T12:00:00Z").getTime();
                  });
                  return lim ? list.slice(0, lim) : list;
                }
                // If snapshot query orderBy desc
                return [mockPreviousSnapshot];
              },
            }),
            limit: async () => {
              return [sourceObjects[0]];
            },
          }),
        }),
      }),
      update: () => ({
        set: (data: { nextRunAt?: Date | null; health?: string }) => ({
          where: () => ({
            returning: async () => {
              const src = sourceObjects[0]!;
              if (data.nextRunAt !== undefined) src.nextRunAt = data.nextRunAt;
              if (data.health) src.health = data.health as typeof src.health;
              scheduleUpdates.push({
                id: src.id,
                nextRunAt: src.nextRunAt,
                health: src.health,
              });
              return [src];
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
      getSource: (idx = 0) => sourceObjects[idx],
      getScheduleUpdates: () => scheduleUpdates,
      getCreatedEventsCount: () => createdEventsCount,
      getCreatedSnapshotsCount: () => createdSnapshotsCount,
    } as unknown as Database & {
      getSource: (idx?: number) => (typeof sourceObjects)[0];
      getScheduleUpdates: () => typeof scheduleUpdates;
      getCreatedEventsCount: () => number;
      getCreatedSnapshotsCount: () => number;
    };

    return { mockDb, sourceObjects };
  }

  describe("Recovery Policy", () => {
    it("1. healthy source -> no healing attempted", () => {
      const decision = shouldAttemptHealing({
        status: "healthy",
        sourceId: "src-1",
        scrapeRunId: "run-1",
        snapshotId: "snap-1",
        snapshot: validSnapshotData,
        changes: [],
      });
      assert.equal(decision.shouldHeal, false);
    });

    it("2. extraction-integrity failure -> healing attempted", () => {
      const decision = shouldAttemptHealing({
        status: "degraded",
        sourceId: "src-1",
        scrapeRunId: "run-1",
        missing: ["pricing.amount"],
        snapshot: validSnapshotData,
      });
      assert.equal(decision.shouldHeal, true);
      assert.ok(decision.reason?.includes("extraction_integrity_degraded"));
    });

    it("3. wait_element_timeout -> healing attempted", () => {
      const decision = shouldAttemptHealing(
        undefined,
        new BrightDataError("Crawler error: waiting for selector 'section.hero' failed: timeout 30000ms exceeded"),
      );
      assert.equal(decision.shouldHeal, true);
      assert.equal(decision.reason, "wait_element_timeout");
    });

    it("4. authentication failure (401/403) -> healing NOT attempted", () => {
      const decision = shouldAttemptHealing(
        undefined,
        new BrightDataError("Unauthorized", { statusCode: 401 }),
      );
      assert.equal(decision.shouldHeal, false);
      assert.equal(decision.reason, "authentication_error");
    });

    it("5. rate limit (429) -> healing NOT attempted", () => {
      const decision = shouldAttemptHealing(
        undefined,
        new BrightDataError("Too Many Requests", { statusCode: 429 }),
      );
      assert.equal(decision.shouldHeal, false);
      assert.equal(decision.reason, "rate_limit_exceeded");
    });
  });

  describe("monitorSource Autonomous Lifecycle", () => {
    it("6. healthy source runs collection and schedules future nextRunAt", async () => {
      const { mockDb } = createMockDb();

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_ok" }), { status: 200 });
        }
        if (urlStr.includes("get_result")) {
          return new Response(JSON.stringify([validSnapshotData]), { status: 200 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const now = new Date("2026-08-23T12:00:00Z");
      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
        now,
        intervalMinutes: 60,
      });

      assert.equal(result.status, "healthy");
      assert.equal(result.nextRunAt.toISOString(), "2026-08-23T13:00:00.000Z");
      assert.equal(mockDb.getSource()?.health, "healthy");
    });

    it("7. Self-Healing unavailable (503) -> monitor result remains degraded and retryable", async () => {
      const { mockDb } = createMockDb();

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        // Scraper run returns degraded extraction (missing price)
        if (urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_degraded" }), { status: 200 });
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
        // Healing returns 503 unavailable
        if (urlStr.includes("refactor_template")) {
          return new Response(
            JSON.stringify({
              status: "heal_trigger_failed",
              error: "Self healing tool is temporarily disabled",
            }),
            { status: 503 },
          );
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const now = new Date("2026-08-23T12:00:00Z");
      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
        now,
        retryIntervalMinutes: 15,
      });

      assert.equal(result.status, "degraded");
      if (result.status === "degraded") {
        assert.equal(result.recoveryAttempted, true);
        assert.equal(result.retryable, true);
      }
      assert.equal(result.nextRunAt.toISOString(), "2026-08-23T12:15:00.000Z");
      assert.equal(mockDb.getSource()?.health, "degraded");
    });

    it("8. successful heal -> recovers, uses same Collector ID, and emits 0 new events on identical campaign data", async () => {
      const { mockDb } = createMockDb();

      let healTriggered = false;
      let approveCalled = false;
      let rerunCollectorId: string | undefined;

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);

        // 1. Initial collection run returns degraded (missing price)
        if (!healTriggered && urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_init_run" }), { status: 200 });
        }
        if (!healTriggered && urlStr.includes("get_result")) {
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

        // 2. Healing triggers and returns pending_answer preview
        if (urlStr.includes("refactor_template/progress")) {
          return new Response(
            JSON.stringify({
              status: "pending_answer",
              preview_result: [validSnapshotData],
            }),
            { status: 200 },
          );
        }
        if (urlStr.includes("refactor_template")) {
          healTriggered = true;
          return new Response(JSON.stringify({ status: "triggered" }), { status: 200 });
        }

        // 3. Approval
        if (urlStr.includes("resume_automation_job")) {
          approveCalled = true;
          return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
        }

        // 4. Rerun after heal
        if (healTriggered && urlStr.includes("trigger_immediate")) {
          rerunCollectorId = urlStr.split("collector=")[1];
          return new Response(JSON.stringify({ response_id: "res_post_heal" }), { status: 200 });
        }
        if (healTriggered && urlStr.includes("get_result")) {
          return new Response(JSON.stringify([validSnapshotData]), { status: 200 });
        }

        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const now = new Date("2026-08-23T12:00:00Z");
      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
        now,
      });

      assert.equal(result.status, "recovered");
      assert.equal(approveCalled, true);
      assert.equal(rerunCollectorId, testCollectorId); // Same collector preserved
      assert.equal(mockDb.getSource()?.health, "healthy");
      assert.equal(mockDb.getCreatedEventsCount(), 0); // 0 new events for identical campaign
    });
  });

  describe("Scheduled Runner (runDueSources)", () => {
    it("9. due-source query excludes future sources and processes only due batch", async () => {
      const now = new Date("2026-08-23T12:00:00Z");
      const dueSource = { id: "due-1", health: "healthy" as const, nextRunAt: new Date("2026-08-23T11:00:00Z") };
      const nullNextRunSource = { id: "due-2", health: "healthy" as const, nextRunAt: null };
      const futureSource = { id: "future-1", health: "healthy" as const, nextRunAt: new Date("2026-08-23T13:00:00Z") };

      const { mockDb } = createMockDb({
        sourcesList: [dueSource, nullNextRunSource, futureSource],
      });

      const dueList = await listDueSources(mockDb, { now, limit: 10 });
      assert.equal(dueList.length, 2);
      assert.ok(dueList.some((s) => s.id === "due-1"));
      assert.ok(dueList.some((s) => s.id === "due-2"));
      assert.ok(!dueList.some((s) => s.id === "future-1"));
    });

    it("10. one scheduled source failure does not stop processing other due sources", async () => {
      const { mockDb } = createMockDb({
        sourcesList: [
          { id: "source-1", health: "healthy", nextRunAt: null },
          { id: "source-2", health: "healthy", nextRunAt: null },
        ],
      });

      let callCount = 0;
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        callCount++;

        if (urlStr.includes("trigger_immediate")) {
          // First source succeeds, second source fails network
          if (callCount <= 2) {
            return new Response(JSON.stringify({ response_id: "res_1" }), { status: 200 });
          }
          return new Response("Unauthorized", { status: 401 });
        }

        if (urlStr.includes("get_result")) {
          return new Response(JSON.stringify([validSnapshotData]), { status: 200 });
        }

        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const summary = await runDueSources({
        db: mockDb,
        apiToken: mockToken,
        now: new Date(),
        limit: 10,
      });

      assert.equal(summary.processed, 2);
      assert.equal(summary.results.length, 2);
      // Both sources were processed independently
      assert.ok(summary.succeeded >= 1);
    });
  });
});
