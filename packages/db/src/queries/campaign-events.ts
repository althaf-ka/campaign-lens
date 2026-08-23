import { eq, desc } from "drizzle-orm";
import type { Database } from "../client.ts";
import {
  campaignEvents,
  type CampaignEvent,
  type NewCampaignEvent,
} from "../schema/campaign-events.ts";

export async function createCampaignEvent(
  db: Database,
  data: NewCampaignEvent,
): Promise<CampaignEvent> {
  const rows = await db.insert(campaignEvents).values(data).returning();
  const row = rows[0];
  if (!row) {
    throw new Error("Failed to insert campaign event.");
  }
  return row;
}

export async function createCampaignEvents(
  db: Database,
  data: NewCampaignEvent[],
): Promise<CampaignEvent[]> {
  if (data.length === 0) return [];
  return db.insert(campaignEvents).values(data).returning();
}

export async function getCampaignEventById(
  db: Database,
  id: string,
): Promise<CampaignEvent | undefined> {
  const rows = await db
    .select()
    .from(campaignEvents)
    .where(eq(campaignEvents.id, id))
    .limit(1);
  return rows[0];
}

export async function getCampaignEventsByCompetitorId(
  db: Database,
  competitorId: string,
  limit = 50,
): Promise<CampaignEvent[]> {
  return db
    .select()
    .from(campaignEvents)
    .where(eq(campaignEvents.competitorId, competitorId))
    .orderBy(desc(campaignEvents.detectedAt))
    .limit(limit);
}

export async function getCampaignEventsBySourceId(
  db: Database,
  sourceId: string,
  limit = 50,
): Promise<CampaignEvent[]> {
  return db
    .select()
    .from(campaignEvents)
    .where(eq(campaignEvents.sourceId, sourceId))
    .orderBy(desc(campaignEvents.detectedAt))
    .limit(limit);
}
