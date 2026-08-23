import type { PriceChangeMetric } from "@campaign-lens/domain";

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

export interface AttentionResponse {
  items: AttentionItem[];
}
