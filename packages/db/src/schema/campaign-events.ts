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
import { snapshots } from "./snapshots.ts";

export const campaignEventTypes = [
  "price_changed",
  "offer_changed",
  "cta_changed",
  "headline_changed",
] as const;
export type CampaignEventType = (typeof campaignEventTypes)[number];

export const campaignEvents = pgTable(
  "campaign_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitorId: uuid("competitor_id")
      .notNull()
      .references(() => competitors.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => snapshots.id, { onDelete: "cascade" }),
    type: text("type", { enum: campaignEventTypes }).notNull(),
    before: jsonb("before"),
    after: jsonb("after"),
    detectedAt: timestamp("detected_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("campaign_events_competitor_id_detected_at_idx").on(
      table.competitorId,
      table.detectedAt,
    ),
  ],
);

export type CampaignEvent = typeof campaignEvents.$inferSelect;
export type NewCampaignEvent = typeof campaignEvents.$inferInsert;
