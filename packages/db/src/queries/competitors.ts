import { eq } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  competitors,
  type Competitor,
  type NewCompetitor,
} from "../schema/competitors.ts";
import { upsertSource } from "./sources.ts";
import type { Source } from "../schema/sources.ts";

export async function getCompetitors(db: Database): Promise<Competitor[]> {
  return db.select().from(competitors);
}

export async function getCompetitorById(
  db: Database,
  id: string,
): Promise<Competitor | undefined> {
  const rows = await db
    .select()
    .from(competitors)
    .where(eq(competitors.id, id))
    .limit(1);
  return rows[0];
}

export async function getCompetitorByDomain(
  db: Database,
  domain: string,
): Promise<Competitor | undefined> {
  const rows = await db
    .select()
    .from(competitors)
    .where(eq(competitors.domain, domain))
    .limit(1);
  return rows[0];
}

export async function createCompetitor(
  db: Database,
  data: NewCompetitor,
): Promise<Competitor> {
  const rows = await db.insert(competitors).values(data).returning();
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to insert competitor.");
  }
  return row;
}

export async function upsertCompetitor(
  db: Database,
  data: Omit<NewCompetitor, "id" | "createdAt" | "updatedAt">,
): Promise<Competitor> {
  const existing = await getCompetitorByDomain(db, data.domain);
  if (existing) {
    const updated = await db
      .update(competitors)
      .set({ name: data.name, updatedAt: new Date() })
      .where(eq(competitors.id, existing.id))
      .returning();
    const row = updated[0];
    if (!row) throw new Error("Failed to update competitor.");
    return row;
  }

  return createCompetitor(db, data);
}

export interface CreateCompetitorWithSourceInput {
  name: string;
  domain: string;
  source: {
    name: string;
    url: string;
    type: "homepage" | "pricing" | string;
    collectorId: string;
    intervalMinutes?: number;
  };
}

export interface CreateCompetitorWithSourceResult {
  competitor: Competitor;
  source: Source;
}

/**
 * Persists a competitor and its primary monitoring source.
 */
export async function createCompetitorWithSource(
  db: Database,
  input: CreateCompetitorWithSourceInput,
): Promise<CreateCompetitorWithSourceResult> {
  const competitor = await upsertCompetitor(db, {
    name: input.name,
    domain: input.domain,
  });

  const source = await upsertSource(db, {
    competitorId: competitor.id,
    name: input.source.name,
    url: input.source.url,
    type: input.source.type as Source["type"],
    collectorId: input.source.collectorId,
    health: "healthy",
    nextRunAt: new Date(),
  });

  return { competitor, source };
}
