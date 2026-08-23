import { eq, desc, and, lt } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  snapshots,
  type Snapshot,
  type NewSnapshot,
} from "../schema/snapshots.ts";

export async function createSnapshot(
  db: Database,
  data: NewSnapshot,
): Promise<Snapshot> {
  const rows = await db.insert(snapshots).values(data).returning();
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to insert snapshot.");
  }
  return row;
}

export async function getSnapshotById(
  db: Database,
  id: string,
): Promise<Snapshot | undefined> {
  const rows = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.id, id))
    .limit(1);
  return rows[0];
}

export async function getLatestSnapshotBySourceId(
  db: Database,
  sourceId: string,
): Promise<Snapshot | undefined> {
  const rows = await db
    .select()
    .from(snapshots)
    .where(eq(snapshots.sourceId, sourceId))
    .orderBy(desc(snapshots.capturedAt))
    .limit(1);
  return rows[0];
}

export async function getPreviousSnapshot(
  db: Database,
  sourceId: string,
  beforeTimestamp: Date,
): Promise<Snapshot | undefined> {
  const rows = await db
    .select()
    .from(snapshots)
    .where(
      and(
        eq(snapshots.sourceId, sourceId),
        lt(snapshots.capturedAt, beforeTimestamp),
      ),
    )
    .orderBy(desc(snapshots.capturedAt))
    .limit(1);
  return rows[0];
}

export async function getSnapshotsBySourceId(
  db: Database,
  sourceId: string,
  limit = 20,
): Promise<Snapshot[]> {
  return db
    .select()
    .from(snapshots)
    .where(eq(snapshots.sourceId, sourceId))
    .orderBy(desc(snapshots.capturedAt))
    .limit(limit);
}
