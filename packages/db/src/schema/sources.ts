import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { competitors } from "./competitors.ts";

export const sourceTypes = [
  "homepage",
  "pricing",
  "offer",
  "product",
  "service",
] as const;
export type SourceType = (typeof sourceTypes)[number];

export const sourceHealthStatuses = [
  "healthy",
  "degraded",
  "healing",
  "needs_review",
] as const;
export type SourceHealth = (typeof sourceHealthStatuses)[number];

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitorId: uuid("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    type: text("type", { enum: sourceTypes }).notNull(),
    collectorId: text("collector_id").notNull(),
    health: text("health", { enum: sourceHealthStatuses })
      .default("healthy")
      .notNull(),
    lastRunAt: timestamp("last_run_at", { withTimezone: true }),
    nextRunAt: timestamp("next_run_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("sources_competitor_id_idx").on(table.competitorId)],
);

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
