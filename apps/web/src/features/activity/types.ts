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
      metadata?: Record<string, unknown>;
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

export interface ActivityResponse {
  activity: ActivityItem[];
}
