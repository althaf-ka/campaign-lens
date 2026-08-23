import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { competitors } from "./competitors.ts";
import { sources } from "./sources.ts";

export const sourceActivityTypes = [
  "monitor_started",
  "monitor_succeeded",
  "extraction_degraded",
  "healing_started",
  "healing_unavailable",
  "healing_failed",
  "healing_recovered",
] as const;

export type SourceActivityType = (typeof sourceActivityTypes)[number];

export const sourceActivity = pgTable(
  "source_activity",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitorId: uuid("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    type: text("type", { enum: sourceActivityTypes }).notNull(),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("source_activity_competitor_id_occurred_at_idx").on(
      table.competitorId,
      table.occurredAt,
    ),
    index("source_activity_source_id_occurred_at_idx").on(
      table.sourceId,
      table.occurredAt,
    ),
    index("source_activity_occurred_at_idx").on(table.occurredAt),
  ],
);

export type SourceActivity = typeof sourceActivity.$inferSelect;
export type NewSourceActivity = typeof sourceActivity.$inferInsert;
