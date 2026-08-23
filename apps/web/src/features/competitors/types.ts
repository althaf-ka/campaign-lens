import type { CampaignSnapshot } from "@campaign-lens/domain";

export type SourceHealth = "healthy" | "degraded" | "healing" | "needs_review";

export type CampaignEventType =
  | "price_changed"
  | "offer_changed"
  | "cta_changed"
  | "headline_changed";

export interface Competitor {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedSource {
  id: string;
  competitorId: string;
  name: string;
  url: string;
  type: string;
  collectorId: string;
  health: SourceHealth;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignEventRecord {
  id: string;
  competitorId: string;
  sourceId: string;
  snapshotId: string;
  type: CampaignEventType;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  detectedAt: string;
}

export interface CompetitorDetailResponse {
  competitor: Competitor;
  currentSnapshot: CampaignSnapshot | null;
  sources: TrackedSource[];
  events: CampaignEventRecord[];
}

export interface CompetitorListResponse {
  competitors: Competitor[];
}

export interface ComparisonResponse {
  event: CampaignEventRecord;
  before: CampaignSnapshot | null;
  after: CampaignSnapshot;
  changedFields: string[];
}
