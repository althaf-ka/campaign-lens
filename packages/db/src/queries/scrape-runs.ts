import { eq, desc, inArray } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  scrapeRuns,
  type ScrapeRun,
  type NewScrapeRun,
  type ScrapeRunStatus,
} from "../schema/scrape-runs.ts";

export async function createScrapeRun(
  db: Database,
  data: NewScrapeRun,
): Promise<ScrapeRun> {
  const rows = await db.insert(scrapeRuns).values(data).returning();
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to insert scrape run.");
  }
  return row;
}

export async function getScrapeRunById(
  db: Database,
  id: string,
): Promise<ScrapeRun | null> {
  const [row] = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.id, id))
    .limit(1);
  return row ?? null;
}

/**
 * Returns the currently active scrape run for a source, enforcing the invariant that
 * permanently orphaned runs (active status with missing upstreamResponseId beyond setup threshold)
 * are marked failed and do not block subsequent monitoring.
 */
export async function getActiveScrapeRunBySourceId(
  db: Database,
  sourceId: string,
  now = new Date(),
  staleThresholdMs = 30_000,
): Promise<ScrapeRun | null> {
  const activeStatuses: ScrapeRunStatus[] = ["collecting", "processing", "running"];
  const [row] = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.sourceId, sourceId))
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(1);

  if (!row || !activeStatuses.includes(row.status as ScrapeRunStatus)) {
    return null;
  }

  // Invariant: An active scrape run requiring polling MUST have an upstreamResponseId.
  if (!row.upstreamResponseId) {
    const ageMs = now.getTime() - new Date(row.startedAt).getTime();
    if (ageMs > staleThresholdMs) {
      await updateScrapeRunStatus(db, row.id, {
        status: "failed",
        errorCode: "missing_upstream_response_id",
        completedAt: now,
      });
      return null;
    }
  }

  return row;
}

export async function getLatestScrapeRunBySourceId(
  db: Database,
  sourceId: string,
): Promise<ScrapeRun | null> {
  const [row] = await db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.sourceId, sourceId))
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(1);
  return row ?? null;
}

export async function updateScrapeRunStatus(
  db: Database,
  id: string,
  data: {
    status: ScrapeRunStatus;
    completedAt?: Date | null;
    upstreamResponseId?: string | null;
    errorCode?: string | null;
  },
): Promise<ScrapeRun | undefined> {
  const isTerminal = ["succeeded", "invalid", "failed"].includes(data.status);
  const rows = await db
    .update(scrapeRuns)
    .set({
      status: data.status,
      completedAt: data.completedAt !== undefined ? data.completedAt : isTerminal ? new Date() : null,
      upstreamResponseId: data.upstreamResponseId,
      errorCode: data.errorCode,
    })
    .where(eq(scrapeRuns.id, id))
    .returning();
  return rows[0];
}

export async function listActiveScrapeRuns(
  db: Database,
  limit = 10,
  now = new Date(),
  staleThresholdMs = 30_000,
): Promise<ScrapeRun[]> {
  const activeStatuses: ScrapeRunStatus[] = ["collecting", "processing", "running"];
  const rows = await db
    .select()
    .from(scrapeRuns)
    .where(inArray(scrapeRuns.status, activeStatuses))
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(limit);

  const validActive: ScrapeRun[] = [];
  for (const row of rows) {
    if (!row.upstreamResponseId) {
      const ageMs = now.getTime() - new Date(row.startedAt).getTime();
      if (ageMs > staleThresholdMs) {
        await updateScrapeRunStatus(db, row.id, {
          status: "failed",
          errorCode: "missing_upstream_response_id",
          completedAt: now,
        });
        continue;
      }
    }
    validActive.push(row);
  }
  return validActive;
}

export async function getScrapeRunsBySourceId(
  db: Database,
  sourceId: string,
  limit = 10,
): Promise<ScrapeRun[]> {
  return db
    .select()
    .from(scrapeRuns)
    .where(eq(scrapeRuns.sourceId, sourceId))
    .orderBy(desc(scrapeRuns.startedAt))
    .limit(limit);
}
