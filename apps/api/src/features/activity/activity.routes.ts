import { Hono } from "hono";
import {
  createDb,
  getCompetitors,
  listAllSourceActivity,
  listCompetitorSourceActivity,
  getCampaignEventsByCompetitorId,
  getSourcesByCompetitorId,
} from "@campaign-lens/db";

export const activityRoutes = new Hono<{ Bindings: CloudflareBindings }>();

export type ActivityItem =
  | {
      id: string;
      kind: "system";
      type:
        | "monitor_started"
        | "monitor_succeeded"
        | "extraction_degraded"
        | "healing_started"
        | "healing_unavailable"
        | "healing_failed"
        | "healing_recovered";
      sourceId: string;
      sourceName: string;
      competitorId: string;
      competitorName?: string;
      occurredAt: string;
      message: string;
      metadata?: unknown;
    }
  | {
      id: string;
      kind: "campaign";
      type:
        | "price_changed"
        | "offer_changed"
        | "headline_changed"
        | "cta_changed";
      sourceId: string;
      sourceName: string;
      competitorId: string;
      competitorName?: string;
      before: unknown;
      after: unknown;
      occurredAt: string;
      message: string;
    };

/**
 * GET /activity
 * Returns system-wide chronological activity stream (operational + campaign events).
 */
activityRoutes.get("/activity", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json(
      { error: { code: "CONFIG_ERROR", message: "DATABASE_URL is not configured." } },
      500,
    );
  }

  const db = createDb(databaseUrl);
  const competitorsList = await getCompetitors(db);
  const competitorMap = new Map(competitorsList.map((comp) => [comp.id, comp.name]));

  // Fetch operational activities and campaign events
  const sysActivities = await listAllSourceActivity(db, 50);

  // Fetch campaign events across competitors
  const allEvents: Array<ActivityItem> = [];

  for (const comp of competitorsList) {
    const events = await getCampaignEventsByCompetitorId(db, comp.id, 50);
    const sources = await getSourcesByCompetitorId(db, comp.id);
    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    for (const ev of events) {
      allEvents.push({
        id: ev.id,
        kind: "campaign",
        type: ev.type as "price_changed" | "offer_changed" | "headline_changed" | "cta_changed",
        sourceId: ev.sourceId,
        sourceName: sourceMap.get(ev.sourceId) ?? "Unknown Source",
        competitorId: ev.competitorId,
        competitorName: comp.name,
        before: ev.before,
        after: ev.after,
        occurredAt: new Date(ev.detectedAt).toISOString(),
        message: formatCampaignEventMessage(ev.type, ev.before, ev.after),
      });
    }
  }

  // Format system activity items
  const formattedSys: ActivityItem[] = sysActivities.map((act) => ({
    id: act.id,
    kind: "system",
    type: act.type as ActivityItem extends { kind: "system" } ? ActivityItem["type"] : never,
    sourceId: act.sourceId,
    sourceName: "Homepage Campaign",
    competitorId: act.competitorId,
    competitorName: competitorMap.get(act.competitorId) ?? "Competitor",
    occurredAt: new Date(act.occurredAt).toISOString(),
    message: act.message,
    metadata: act.metadata,
  }));

  // Merge and sort newest first
  const combined = [...formattedSys, ...allEvents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  ).slice(0, 50);

  return c.json({ activity: combined });
});

/**
 * GET /competitors/:id/activity
 * Returns competitor-specific chronological activity stream.
 */
activityRoutes.get("/competitors/:id/activity", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json(
      { error: { code: "CONFIG_ERROR", message: "DATABASE_URL is not configured." } },
      500,
    );
  }

  const competitorId = c.req.param("id");
  const db = createDb(databaseUrl);

  const sources = await getSourcesByCompetitorId(db, competitorId);
  const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

  const sysActivities = await listCompetitorSourceActivity(db, competitorId, 50);
  const campaignEvents = await getCampaignEventsByCompetitorId(db, competitorId, 50);

  const formattedSys: ActivityItem[] = sysActivities.map((act) => ({
    id: act.id,
    kind: "system",
    type: act.type as ActivityItem extends { kind: "system" } ? ActivityItem["type"] : never,
    sourceId: act.sourceId,
    sourceName: sourceMap.get(act.sourceId) ?? "Homepage Campaign",
    competitorId: act.competitorId,
    occurredAt: new Date(act.occurredAt).toISOString(),
    message: act.message,
    metadata: act.metadata,
  }));

  const formattedEvents: ActivityItem[] = campaignEvents.map((ev) => ({
    id: ev.id,
    kind: "campaign",
    type: ev.type as "price_changed" | "offer_changed" | "headline_changed" | "cta_changed",
    sourceId: ev.sourceId,
    sourceName: sourceMap.get(ev.sourceId) ?? "Homepage Campaign",
    competitorId: ev.competitorId,
    before: ev.before,
    after: ev.after,
    occurredAt: new Date(ev.detectedAt).toISOString(),
    message: formatCampaignEventMessage(ev.type, ev.before, ev.after),
  }));

  const combined = [...formattedSys, ...formattedEvents].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  ).slice(0, 50);

  return c.json({ activity: combined });
});

function formatCampaignEventMessage(type: string, before: unknown, after: unknown): string {
  const bVal = (before as Record<string, unknown>)?.value;
  const aVal = (after as Record<string, unknown>)?.value;

  switch (type) {
    case "price_changed":
      return `Price updated from ₹${bVal ?? "N/A"} to ₹${aVal ?? "N/A"}`;
    case "offer_changed":
      return `Offer updated: "${aVal ?? ""}"`;
    case "headline_changed":
      return `Headline updated: "${aVal ?? ""}"`;
    case "cta_changed":
      return `CTA updated: "${aVal ?? ""}"`;
    default:
      return "Campaign changed";
  }
}
