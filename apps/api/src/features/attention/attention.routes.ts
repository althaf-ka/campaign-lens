import { Hono } from "hono";
import {
  createDb,
  getCompetitors,
  getSourcesByCompetitorId,
  getCampaignEventsByCompetitorId,
} from "@campaign-lens/db";
import {
  formatPriceChangeSummary,
  formatOfferChangeSummary,
  formatHeadlineChangeSummary,
  formatCtaChangeSummary,
  type PriceChangeMetric,
} from "@campaign-lens/domain";

export const attentionRoutes = new Hono<{ Bindings: CloudflareBindings }>();

export type AttentionItem =
  | {
      id: string;
      kind: "campaign_change";
      competitorId: string;
      competitorName: string;
      sourceId: string;
      sourceName: string;
      eventId: string;
      eventType:
        | "price_changed"
        | "offer_changed"
        | "headline_changed"
        | "cta_changed";
      occurredAt: string;
      title: string;
      summary: string;
      before: unknown;
      after: unknown;
      metric?: PriceChangeMetric;
    }
  | {
      id: string;
      kind: "source_issue";
      competitorId: string;
      competitorName: string;
      sourceId: string;
      sourceName: string;
      health: "degraded" | "needs_review";
      occurredAt: string;
      title: string;
      summary: string;
    };

/**
 * GET /attention
 * Read model returning high-signal events and issues requiring user attention:
 * - Genuine competitor campaign changes (pricing, promotion, messaging)
 * - Degraded or reviewing source statuses
 * Excludes normal routine monitoring logs.
 */
attentionRoutes.get("/attention", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json(
      { error: { code: "CONFIG_ERROR", message: "DATABASE_URL is not configured." } },
      500,
    );
  }

  const db = createDb(databaseUrl);
  const competitorsList = await getCompetitors(db);

  const attentionItems: AttentionItem[] = [];

  for (const comp of competitorsList) {
    const sources = await getSourcesByCompetitorId(db, comp.id);
    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    // 1. Check for degraded / needs_review sources
    for (const s of sources) {
      if (s.health === "degraded" || s.health === "needs_review") {
        const isDegraded = s.health === "degraded";
        attentionItems.push({
          id: `source-${s.id}`,
          kind: "source_issue",
          competitorId: comp.id,
          competitorName: comp.name,
          sourceId: s.id,
          sourceName: s.name,
          health: s.health,
          occurredAt: new Date(s.lastRunAt || s.updatedAt || s.createdAt).toISOString(),
          title: isDegraded
            ? "Website structure changed · Monitoring degraded"
            : "Monitoring paused · Needs review",
          summary: isDegraded
            ? `Website structure changed on ${s.name}. Last verified campaign remains protected while self-healing retries.`
            : `Automated monitoring requires review on ${s.name}.`,
        });
      }
    }

    // 2. Check for recent campaign changes
    const events = await getCampaignEventsByCompetitorId(db, comp.id, 20);
    for (const ev of events) {
      const bVal = (ev.before as Record<string, unknown> | null)?.value ?? ev.before;
      const aVal = (ev.after as Record<string, unknown> | null)?.value ?? ev.after;

      let title = "Campaign changed";
      let summary = "A campaign change was detected.";
      let metric: PriceChangeMetric | undefined;

      switch (ev.type) {
        case "price_changed": {
          const bNum = typeof bVal === "number" ? bVal : Number(bVal) || 0;
          const aNum = typeof aVal === "number" ? aVal : Number(aVal) || 0;
          metric = formatPriceChangeSummary(bNum, aNum, "INR");
          title = metric.title;
          summary = metric.summary;
          break;
        }
        case "offer_changed": {
          title = "Promotion changed";
          summary = formatOfferChangeSummary(
            typeof bVal === "string" ? bVal : null,
            typeof aVal === "string" ? aVal : null,
          );
          break;
        }
        case "headline_changed": {
          title = "Positioning changed";
          summary = formatHeadlineChangeSummary(
            typeof bVal === "string" ? bVal : null,
            typeof aVal === "string" ? aVal : null,
          );
          break;
        }
        case "cta_changed": {
          title = "Call to action updated";
          summary = formatCtaChangeSummary(
            typeof bVal === "string" ? bVal : null,
            typeof aVal === "string" ? aVal : null,
          );
          break;
        }
      }

      attentionItems.push({
        id: ev.id,
        kind: "campaign_change",
        competitorId: comp.id,
        competitorName: comp.name,
        sourceId: ev.sourceId,
        sourceName: sourceMap.get(ev.sourceId) ?? "Homepage Campaign",
        eventId: ev.id,
        eventType: ev.type as AttentionItem extends { kind: "campaign_change" } ? AttentionItem["eventType"] : never,
        occurredAt: new Date(ev.detectedAt).toISOString(),
        title,
        summary,
        before: ev.before,
        after: ev.after,
        metric,
      });
    }
  }

  // Sort newest first by timestamp and limit to 15 items
  const sorted = attentionItems
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 15);

  return c.json({ items: sorted });
});
