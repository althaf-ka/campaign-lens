import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import type { CampaignSnapshot } from "@campaign-lens/domain";

import { sources } from "./sources.ts";
import { scrapeRuns } from "./scrape-runs.ts";

export const snapshots = pgTable(
  "snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    scrapeRunId: uuid("scrape_run_id")
      .notNull()
      .references(() => scrapeRuns.id, { onDelete: "cascade" }),
    headline: text("headline"),
    offer: text("offer"),
    priceAmount: doublePrecision("price_amount"),
    priceCurrency: text("price_currency"),
    priceQualifier: text("price_qualifier"),
    ctaLabel: text("cta_label"),
    ctaHref: text("cta_href"),
    guarantees: jsonb("guarantees").$type<string[]>().default([]).notNull(),
    data: jsonb("data").$type<CampaignSnapshot>().notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("snapshots_source_id_captured_at_idx").on(
      table.sourceId,
      table.capturedAt,
    ),
  ],
);

export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;
