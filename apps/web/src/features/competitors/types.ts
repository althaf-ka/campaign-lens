import type { CampaignSnapshot, ScrapeRunStatus } from "@campaign-lens/domain";

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

export type { ScrapeRunStatus };

export interface ScrapeRunRecord {
  id: string;
  sourceId: string;
  status: ScrapeRunStatus;
  upstreamResponseId: string | null;
  errorCode: string | null;
  startedAt: string;
  completedAt: string | null;
}

export interface MonitorAcceptedResponse {
  status: "accepted";
  runId: string;
  sourceId: string;
  state: ScrapeRunStatus;
  scrapeRun?: ScrapeRunRecord;
}

export interface ScrapeRunResponse {
  scrapeRun: ScrapeRunRecord;
}

export type RecoveryRunStatus =
  | "healing"
  | "validating"
  | "approving"
  | "verifying"
  | "recovered"
  | "unavailable"
  | "needs_review"
  | "failed";

export interface RecoveryRunRecord {
  id: string;
  sourceId: string;
  collectorId: string;
  status: RecoveryRunStatus;
  startedAt: string;
  updatedAt: string;
  completedAt: string | null;
  errorCode: string | null;
  retryable: boolean;
  metadata: Record<string, unknown> | null;
}

export interface SourceRecoveryResponse {
  sourceId: string;
  sourceHealth: SourceHealth;
  recovery: RecoveryRunRecord | null;
}
