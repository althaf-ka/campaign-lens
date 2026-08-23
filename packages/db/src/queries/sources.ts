import { eq, lte, or, isNull, asc } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  sources,
  type Source,
  type NewSource,
  type SourceHealth,
} from "../schema/sources.ts";

export async function getSourceById(
  db: Database,
  id: string,
): Promise<Source | undefined> {
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.id, id))
    .limit(1);
  return rows[0];
}

export async function getSourcesByCompetitorId(
  db: Database,
  competitorId: string,
): Promise<Source[]> {
  return db
    .select()
    .from(sources)
    .where(eq(sources.competitorId, competitorId));
}

export async function getSourceByUrl(
  db: Database,
  url: string,
): Promise<Source | undefined> {
  const rows = await db
    .select()
    .from(sources)
    .where(eq(sources.url, url))
    .limit(1);
  return rows[0];
}

export async function listDueSources(
  db: Database,
  options?: {
    now?: Date;
    limit?: number;
  },
): Promise<Source[]> {
  const now = options?.now ?? new Date();
  const limit = options?.limit ?? 10;

  return db
    .select()
    .from(sources)
    .where(or(isNull(sources.nextRunAt), lte(sources.nextRunAt, now)))
    .orderBy(asc(sources.nextRunAt))
    .limit(limit);
}

export async function createSource(
  db: Database,
  data: NewSource,
): Promise<Source> {
  const rows = await db.insert(sources).values(data).returning();
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to insert source.");
  }
  return row;
}

export async function upsertSource(
  db: Database,
  data: Omit<NewSource, "id" | "createdAt" | "updatedAt">,
): Promise<Source> {
  const existing = await getSourceByUrl(db, data.url);
  if (existing) {
    const updated = await db
      .update(sources)
      .set({
        name: data.name,
        type: data.type,
        collectorId: data.collectorId,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, existing.id))
      .returning();
    const row = updated[0];
    if (!row) throw new Error("Failed to update source.");
    return row;
  }

  return createSource(db, data);
}

export async function updateSourceHealth(
  db: Database,
  id: string,
  health: SourceHealth,
  lastRunAt: Date = new Date(),
): Promise<Source | undefined> {
  const rows = await db
    .update(sources)
    .set({
      health,
      lastRunAt,
      updatedAt: new Date(),
    })
    .where(eq(sources.id, id))
    .returning();
  return rows[0];
}

export async function updateSourceSchedule(
  db: Database,
  id: string,
  data: {
    nextRunAt: Date | null;
    health?: SourceHealth;
    lastRunAt?: Date;
  },
): Promise<Source | undefined> {
  const rows = await db
    .update(sources)
    .set({
      nextRunAt: data.nextRunAt,
      ...(data.health ? { health: data.health } : {}),
      ...(data.lastRunAt ? { lastRunAt: data.lastRunAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(sources.id, id))
    .returning();
  return rows[0];
}
