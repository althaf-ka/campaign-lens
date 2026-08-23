import { eq } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  competitors,
  type Competitor,
  type NewCompetitor,
} from "../schema/competitors.ts";

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
