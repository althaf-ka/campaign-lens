import { desc, eq } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  sourceActivity,
  type SourceActivity,
  type NewSourceActivity,
} from "../schema/source-activity.ts";

/**
 * Safely inserts an operational activity record.
 * Never throws fatal exceptions to calling pipeline.
 */
export async function insertSourceActivity(
  db: Database,
  data: NewSourceActivity,
): Promise<SourceActivity | undefined> {
  try {
    const rows = await db.insert(sourceActivity).values(data).returning();
    return rows[0];
  } catch (err) {
    console.error("[insertSourceActivity Non-Fatal Error]", err);
    return undefined;
  }
}

export async function listCompetitorSourceActivity(
  db: Database,
  competitorId: string,
  limit = 50,
): Promise<SourceActivity[]> {
  return db
    .select()
    .from(sourceActivity)
    .where(eq(sourceActivity.competitorId, competitorId))
    .orderBy(desc(sourceActivity.occurredAt))
    .limit(limit);
}

export async function listAllSourceActivity(
  db: Database,
  limit = 50,
): Promise<SourceActivity[]> {
  return db
    .select()
    .from(sourceActivity)
    .orderBy(desc(sourceActivity.occurredAt))
    .limit(limit);
}
