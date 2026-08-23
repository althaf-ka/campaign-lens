import { eq, desc, inArray } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  recoveryRuns,
  type RecoveryRun,
  type NewRecoveryRun,
  type RecoveryStatus,
} from "../schema/recovery-runs.ts";

export async function insertRecoveryRun(
  db: Database,
  data: NewRecoveryRun,
): Promise<RecoveryRun> {
  const [created] = await db.insert(recoveryRuns).values(data).returning();
  if (!created) {
    throw new Error("Failed to insert recovery run record.");
  }
  return created;
}

export async function getActiveRecoveryRunBySourceId(
  db: Database,
  sourceId: string,
): Promise<RecoveryRun | null> {
  const activeStatuses: RecoveryStatus[] = [
    "healing",
    "validating",
    "approving",
    "verifying",
  ];
  const [active] = await db
    .select()
    .from(recoveryRuns)
    .where(
      eq(recoveryRuns.sourceId, sourceId),
    )
    .orderBy(desc(recoveryRuns.startedAt))
    .limit(1);

  if (active && activeStatuses.includes(active.status as RecoveryStatus)) {
    return active;
  }
  return null;
}

export async function getLatestRecoveryRunBySourceId(
  db: Database,
  sourceId: string,
): Promise<RecoveryRun | null> {
  const [latest] = await db
    .select()
    .from(recoveryRuns)
    .where(eq(recoveryRuns.sourceId, sourceId))
    .orderBy(desc(recoveryRuns.startedAt))
    .limit(1);

  return latest ?? null;
}

export async function updateRecoveryRun(
  db: Database,
  id: string,
  data: Partial<NewRecoveryRun>,
): Promise<RecoveryRun> {
  const [updated] = await db
    .update(recoveryRuns)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(recoveryRuns.id, id))
    .returning();

  if (!updated) {
    throw new Error(`Recovery run '${id}' not found for update.`);
  }
  return updated;
}

export async function listActiveRecoveryRuns(
  db: Database,
  limit = 10,
): Promise<RecoveryRun[]> {
  const activeStatuses: RecoveryStatus[] = [
    "healing",
    "validating",
    "approving",
    "verifying",
  ];
  return db
    .select()
    .from(recoveryRuns)
    .where(inArray(recoveryRuns.status, activeStatuses))
    .orderBy(desc(recoveryRuns.startedAt))
    .limit(limit);
}
