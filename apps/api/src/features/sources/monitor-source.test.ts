import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { monitorSource } from "./monitor-source.ts";
import { advanceScrape } from "./advance-scrape.ts";
import { shouldAttemptHealing } from "./recovery-policy.ts";
import { runDueSources } from "./run-due-sources.ts";
import { listDueSources } from "@campaign-lens/db";
import { BrightDataError } from "@campaign-lens/brightdata";
import type {
  Database,
  RecoveryRun,
  NewRecoveryRun,
  ScrapeRun,
  NewScrapeRun,
} from "@campaign-lens/db";

describe("monitorSource & Non-Blocking Poll-Driven Scrape & Recovery Architecture", () => {
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

  function getMockTableName(table: unknown): string {
    if (!table) return "";
    const obj = table as Record<string | symbol, unknown>;
    const name = (obj._ as { name?: string })?.name || obj[Symbol.for("drizzle:Name")] || "";
    return typeof name === "string" ? name : "";
  }

  function createMockDb(options?: {
    sourcesList?: Array<{
      id: string;
      health: "healthy" | "degraded" | "needs_review" | "healing";
      nextRunAt: Date | null;
    }>;
    latestSnapshotData?: unknown;
    existingRecoveryRuns?: RecoveryRun[];
    existingScrapeRuns?: ScrapeRun[];
  }) {
    const mockSources = options?.sourcesList ?? [
      {
        id: "source-uuid-1111",
        health: "healthy" as const,
        nextRunAt: new Date("2026-08-23T11:00:00Z"),
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

    const scrapeRunsList: ScrapeRun[] = [...(options?.existingScrapeRuns ?? [])];
    const recoveryRunsList: RecoveryRun[] = [...(options?.existingRecoveryRuns ?? [])];
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
        from: (tableObj: unknown) => ({
          where: (condition?: unknown) => ({
            orderBy: () => ({
              limit: async (lim?: number) => {
                const tableName = getMockTableName(tableObj);
                if (tableName === "scrape_runs") {
                  const active = scrapeRunsList.filter((r) =>
                    ["collecting", "processing", "running"].includes(r.status),
                  );
                  return lim ? active.slice(0, lim) : active;
                }
                if (tableName === "recovery_runs") {
                  const active = recoveryRunsList.filter((r) =>
                    ["healing", "validating", "approving", "verifying"].includes(r.status),
                  );
                  return lim ? active.slice(0, lim) : active;
                }
                if (condition && typeof condition === "object") {
                  const nowBoundary = new Date("2026-08-23T12:00:00Z").getTime();
                  const list = sourceObjects.filter((s) => {
                    if (s.nextRunAt === null) return false;
                    return s.nextRunAt.getTime() <= nowBoundary;
                  });
                  return lim ? list.slice(0, lim) : list;
                }
                return [mockPreviousSnapshot];
              },
            }),
            limit: async () => {
              const tableName = getMockTableName(tableObj);
              if (tableName === "scrape_runs") {
                return scrapeRunsList.length > 0 ? [scrapeRunsList[0]] : [];
              }
              if (tableName === "recovery_runs") {
                return recoveryRunsList.length > 0 ? [recoveryRunsList[0]] : [];
              }
              return [sourceObjects[0]];
            },
          }),
        }),
      }),
      update: (tableObj: unknown) => ({
        set: (data: Record<string, unknown>) => ({
          where: (cond?: unknown) => ({
            returning: async () => {
              const tableName = getMockTableName(tableObj);
              if (tableName === "scrape_runs") {
                const targetId = (cond as { right?: { value?: string }; val?: string })?.right?.value ?? (cond as { val?: string })?.val;
                const found = targetId ? scrapeRunsList.find((r) => r.id === targetId) : scrapeRunsList[0];
                if (found) {
                  Object.assign(found, data);
                  return [found];
                }
                if (scrapeRunsList.length > 0) {
                  Object.assign(scrapeRunsList[0]!, data);
                  return [scrapeRunsList[0]!];
                }
              }
              if (tableName === "recovery_runs") {
                if (recoveryRunsList.length > 0) {
                  Object.assign(recoveryRunsList[0]!, data, { updatedAt: new Date() });
                  return [recoveryRunsList[0]!];
                }
              }
              const src = sourceObjects[0]!;
              if (data.nextRunAt !== undefined) src.nextRunAt = data.nextRunAt as Date | null;
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
      insert: (tableObj: unknown) => ({
        values: (vals: unknown) => ({
          returning: async () => {
            const tableName = getMockTableName(tableObj);
            if (tableName === "scrape_runs") {
              const v = vals as NewScrapeRun;
              const run: ScrapeRun = {
                id: `run-${scrapeRunsList.length + 1}`,
                sourceId: v.sourceId,
                status: v.status ?? "collecting",
                upstreamResponseId: v.upstreamResponseId ?? null,
                errorCode: v.errorCode ?? null,
                startedAt: new Date(),
                completedAt: null,
              };
              scrapeRunsList.unshift(run);
              return [run];
            }
            if (tableName === "recovery_runs") {
              const v = vals as NewRecoveryRun;
              const run: RecoveryRun = {
                id: `rec-${recoveryRunsList.length + 1}`,
                sourceId: v.sourceId,
                collectorId: v.collectorId,
                status: v.status ?? "healing",
                startedAt: new Date(),
                updatedAt: new Date(),
                completedAt: null,
                errorCode: null,
                retryable: v.retryable ?? false,
                metadata: (v.metadata as Record<string, unknown>) ?? null,
              };
              recoveryRunsList.unshift(run);
              return [run];
            }
            if (Array.isArray(vals)) {
              createdEventsCount += vals.length;
              return vals.map((v, i) => ({ id: `event-${i}`, ...(v as Record<string, unknown>) }));
            }
            const record = vals as Record<string, unknown>;
            if (record.headline !== undefined || record.data !== undefined) {
              createdSnapshotsCount++;
              return [{ id: "snap-uuid-new", ...record }];
            }
            return [{ id: "act-uuid-new", ...record }];
          },
        }),
      }),
      getSource: (idx = 0) => sourceObjects[idx],
      getScheduleUpdates: () => scheduleUpdates,
      getCreatedEventsCount: () => createdEventsCount,
      getCreatedSnapshotsCount: () => createdSnapshotsCount,
      getScrapeRuns: () => scrapeRunsList,
      getRecoveryRuns: () => recoveryRunsList,
    } as unknown as Database & {
      getSource: (idx?: number) => (typeof sourceObjects)[0];
      getScheduleUpdates: () => typeof scheduleUpdates;
      getCreatedEventsCount: () => number;
      getCreatedSnapshotsCount: () => number;
      getScrapeRuns: () => ScrapeRun[];
      getRecoveryRuns: () => RecoveryRun[];
    };

    return { mockDb, sourceObjects };
  }

  describe("Recovery Policy Invariants", () => {
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
  });

  describe("Poll-Driven Monitor Trigger & Bounded Scrape Advance", () => {
    it("4. POST monitor triggers Bright Data once and returns status accepted immediately", async () => {
      const { mockDb } = createMockDb();
      let triggerCount = 0;

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("trigger_immediate")) {
          triggerCount++;
          return new Response(JSON.stringify({ response_id: "res_12345" }), { status: 200 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(result.status, "accepted");
      assert.equal(result.state, "collecting");
      assert.ok(result.runId);
      assert.equal(triggerCount, 1);
      assert.equal(mockDb.getScrapeRuns().length, 1);
      assert.equal(mockDb.getScrapeRuns()[0]?.upstreamResponseId, "res_12345");
    });

    it("5. duplicate monitor call reuses active scrape run without re-triggering Bright Data", async () => {
      const existingRun: ScrapeRun = {
        id: "run-active-1",
        sourceId: "source-uuid-1111",
        status: "collecting",
        upstreamResponseId: "res_already_running",
        errorCode: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        existingScrapeRuns: [existingRun],
      });

      let triggerCount = 0;
      globalThis.fetch = (async () => {
        triggerCount++;
        return new Response(JSON.stringify({ response_id: "res_new" }), { status: 200 });
      }) as typeof fetch;

      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(result.status, "accepted");
      assert.equal(result.runId, "run-active-1");
      assert.equal(triggerCount, 0); // Did not re-trigger
    });

    it("6. advanceScrape with pending upstream returns collecting without modifying terminal state", async () => {
      const existingRun: ScrapeRun = {
        id: "run-adv-1",
        sourceId: "source-uuid-1111",
        status: "collecting",
        upstreamResponseId: "res_pending",
        errorCode: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        existingScrapeRuns: [existingRun],
      });

      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ status: "building", pending: true }), { status: 202 });
      }) as typeof fetch;

      const adv = await advanceScrape({
        scrapeRunId: "run-adv-1",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(adv.status, "collecting");
      assert.equal(mockDb.getScrapeRuns()[0]?.status, "collecting");
    });

    it("7. advanceScrape with completed data creates snapshot, diff, and transitions to succeeded", async () => {
      const existingRun: ScrapeRun = {
        id: "run-adv-2",
        sourceId: "source-uuid-1111",
        status: "collecting",
        upstreamResponseId: "res_done",
        errorCode: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        existingScrapeRuns: [existingRun],
      });

      globalThis.fetch = (async () => {
        return new Response(JSON.stringify([validSnapshotData]), { status: 200 });
      }) as typeof fetch;

      const adv = await advanceScrape({
        scrapeRunId: "run-adv-2",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(adv.status, "succeeded");
      assert.equal(mockDb.getScrapeRuns()[0]?.status, "succeeded");
      assert.equal(mockDb.getSource()?.health, "healthy");
      assert.equal(mockDb.getCreatedSnapshotsCount(), 1);
    });

    it("8. advanceScrape with wait_element_timeout marks degraded and creates recovery run", async () => {
      const existingRun: ScrapeRun = {
        id: "run-adv-3",
        sourceId: "source-uuid-1111",
        status: "collecting",
        upstreamResponseId: "res_timeout",
        errorCode: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        existingScrapeRuns: [existingRun],
      });

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("get_result")) {
          return new Response(
            JSON.stringify([
              {
                error: "waiting for selector failed: timeout 30000ms exceeded",
                error_code: "wait_element_timeout",
              },
            ]),
            { status: 200 },
          );
        }
        if (urlStr.includes("refactor_template")) {
          return new Response(JSON.stringify({ error: "Self healing temporarily disabled" }), { status: 503 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const adv = await advanceScrape({
        scrapeRunId: "run-adv-3",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(adv.status, "failed");
      assert.equal(mockDb.getScrapeRuns()[0]?.status, "failed");
      assert.equal(mockDb.getScrapeRuns()[0]?.errorCode, "wait_element_timeout");
      assert.equal(mockDb.getSource()?.health, "degraded");
      assert.equal(mockDb.getRecoveryRuns().length, 1);
      assert.equal(mockDb.getRecoveryRuns()[0]?.status, "unavailable");
    });

    it("9. successful trigger stores response ID before active polling", async () => {
      const { mockDb } = createMockDb();
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_verified_123" }), { status: 200 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(result.status, "accepted");
      assert.equal(result.state, "collecting");
      const created = mockDb.getScrapeRuns().find((r) => r.id === result.runId);
      assert.ok(created);
      assert.equal(created.upstreamResponseId, "res_verified_123");
      assert.equal(created.status, "collecting");
    });

    it("10. trigger failure does not leave orphaned active run", async () => {
      const { mockDb } = createMockDb();
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: "Bright Data service unavailable" }), { status: 503 });
      }) as typeof fetch;

      await assert.rejects(
        async () => {
          await monitorSource({
            sourceId: "source-uuid-1111",
            db: mockDb,
            apiToken: mockToken,
          });
        },
        (err: Error) => {
          assert.ok(err.message.includes("Bright Data trigger failed"));
          return true;
        },
      );

      // Invariant: No active scrape runs were created or left behind
      assert.equal(mockDb.getScrapeRuns().length, 0);
    });

    it("11. stale running run with null response ID does not block future monitoring", async () => {
      const staleOrphanRun: ScrapeRun = {
        id: "run-stale-orphan",
        sourceId: "source-uuid-1111",
        status: "running",
        upstreamResponseId: null, // Invalid orphaned state
        errorCode: null,
        startedAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes old
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        existingScrapeRuns: [staleOrphanRun],
      });

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        const urlStr = String(input);
        if (urlStr.includes("trigger_immediate")) {
          return new Response(JSON.stringify({ response_id: "res_fresh_recovered" }), { status: 200 });
        }
        return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
      }) as typeof fetch;

      const result = await monitorSource({
        sourceId: "source-uuid-1111",
        db: mockDb,
        apiToken: mockToken,
      });

      // The stale run should have been marked failed
      assert.equal(staleOrphanRun.status, "failed");
      assert.equal(staleOrphanRun.errorCode, "missing_upstream_response_id");
      assert.ok(staleOrphanRun.completedAt);

      // And a new fresh run was successfully created with valid upstreamResponseId
      assert.equal(result.status, "accepted");
      assert.notEqual(result.runId, "run-stale-orphan");
      const freshRun = mockDb.getScrapeRuns().find((r) => r.id === result.runId);
      assert.ok(freshRun);
      assert.equal(freshRun.upstreamResponseId, "res_fresh_recovered");
      assert.equal(freshRun.status, "collecting");
    });
  });

  describe("Scheduled Runner Invariants", () => {
    it("12. past nextRunAt is included, null is excluded", async () => {
      const now = new Date("2026-08-23T12:00:00Z");
      const pastSource = { id: "past-1", health: "healthy" as const, nextRunAt: new Date("2026-08-23T11:00:00Z") };
      const nullSource = { id: "null-1", health: "needs_review" as const, nextRunAt: null };

      const { mockDb } = createMockDb({
        sourcesList: [pastSource, nullSource],
      });

      const dueList = await listDueSources(mockDb, { now, limit: 10 });
      assert.equal(dueList.length, 1);
      assert.equal(dueList[0]?.id, "past-1");
    });

    it("13. runDueSources triggers due sources and advances active scrape runs", async () => {
      const pastSource = { id: "past-1", health: "healthy" as const, nextRunAt: new Date("2026-08-23T11:00:00Z") };
      const activeScrape: ScrapeRun = {
        id: "run-cron-1",
        sourceId: "past-1",
        status: "collecting",
        upstreamResponseId: "res_cron",
        errorCode: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const { mockDb } = createMockDb({
        sourcesList: [pastSource],
        existingScrapeRuns: [activeScrape],
      });

      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ status: "building", pending: true }), { status: 202 });
      }) as typeof fetch;

      const summary = await runDueSources({
        db: mockDb,
        apiToken: mockToken,
      });

      assert.equal(summary.processed, 1);
      assert.equal(summary.triggered, 1);
      assert.equal(summary.advancedScrapes, 1);
    });
  });
});
