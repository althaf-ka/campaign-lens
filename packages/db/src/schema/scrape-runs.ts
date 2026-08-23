import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { sources } from "./sources.ts";

export const scrapeRunStatuses = [
  "collecting",
  "processing",
  "running",
  "succeeded",
  "invalid",
  "failed",
  "healing",
] as const;

export type ScrapeRunStatus = (typeof scrapeRunStatuses)[number];

export const scrapeRuns = pgTable(
  "scrape_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    status: text("status", { enum: scrapeRunStatuses }).notNull(),
    upstreamResponseId: text("upstream_response_id"),
    errorCode: text("error_code"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("scrape_runs_source_id_started_at_idx").on(
      table.sourceId,
      table.startedAt,
    ),
    index("scrape_runs_status_idx").on(table.status),
  ],
);

export type ScrapeRun = typeof scrapeRuns.$inferSelect;
export type NewScrapeRun = typeof scrapeRuns.$inferInsert;
