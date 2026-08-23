import { eq, desc } from "drizzle-orm";
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

export async function updateScrapeRunStatus(
  db: Database,
  id: string,
  data: {
    status: ScrapeRunStatus;
    completedAt?: Date;
    upstreamResponseId?: string | null;
    errorCode?: string | null;
  },
): Promise<ScrapeRun | undefined> {
  const rows = await db
    .update(scrapeRuns)
    .set({
      status: data.status,
      completedAt: data.completedAt ?? new Date(),
      upstreamResponseId: data.upstreamResponseId,
      errorCode: data.errorCode,
    })
    .where(eq(scrapeRuns.id, id))
    .returning();
  return rows[0];
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
