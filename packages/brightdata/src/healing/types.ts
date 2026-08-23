export interface HealingTriggerInput {
  apiToken: string;
  collectorId: string;
  prompt: string;
  customInput?: unknown[];
  baseUrl?: string;
  timeoutMs?: number;
  intervalMs?: number;
  maxAttempts?: number;
}

export interface HealingProgress {
  status: "running" | "pending_answer" | "done" | "failed" | "error" | "cancelled" | string;
  step?: string;
  preview_result?: unknown[];
  diff?: {
    template_a?: unknown;
    template_b?: unknown;
    [key: string]: unknown;
  };
  error?: string;
  [key: string]: unknown;
}

export interface HealingApprovalInput {
  apiToken: string;
  collectorId: string;
  approve: boolean;
  autoSave?: boolean;
  baseUrl?: string;
  timeoutMs?: number;
  intervalMs?: number;
  maxAttempts?: number;
}

export interface HealingApprovalResult {
  collectorId: string;
  approved: boolean;
  status: string;
  progress: HealingProgress;
}
