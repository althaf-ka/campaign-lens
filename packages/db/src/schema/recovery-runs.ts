import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sources } from "./sources.ts";

export const recoveryStatuses = [
  "healing",
  "validating",
  "approving",
  "verifying",
  "recovered",
  "unavailable",
  "needs_review",
  "failed",
] as const;

export type RecoveryStatus = (typeof recoveryStatuses)[number];

export const recoveryRuns = pgTable(
  "recovery_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    collectorId: text("collector_id").notNull(),
    status: text("status", { enum: recoveryStatuses })
      .default("healing")
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    errorCode: text("error_code"),
    retryable: boolean("retryable").default(false).notNull(),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("recovery_runs_source_id_idx").on(table.sourceId),
    index("recovery_runs_status_idx").on(table.status),
    index("recovery_runs_source_id_status_idx").on(
      table.sourceId,
      table.status,
    ),
  ],
);

export type RecoveryRun = typeof recoveryRuns.$inferSelect;
export type NewRecoveryRun = typeof recoveryRuns.$inferInsert;
