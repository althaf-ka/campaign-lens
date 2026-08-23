import { BrightDataClient } from "../client.ts";
import type { HealingApprovalInput, HealingApprovalResult } from "./types.ts";

/**
 * Resumes an automation job to approve or reject a proposed Self-Healing refactor,
 * then polls until the refactor completes.
 */
export async function approveCollectorHealing(
  input: HealingApprovalInput,
): Promise<HealingApprovalResult> {
  const client = new BrightDataClient({
    apiToken: input.apiToken,
    baseUrl: input.baseUrl,
  });

  // 1. Send approval/rejection decision
  await client.resumeAutomationJob({
    collectorId: input.collectorId,
    approve: input.approve,
    autoSave: input.autoSave,
  });

  // 2. Poll until terminal status (done or failed)
  const progress = await client.pollRefactorProgress({
    collectorId: input.collectorId,
    timeoutMs: input.timeoutMs,
    intervalMs: input.intervalMs,
    maxAttempts: input.maxAttempts,
  });

  return {
    collectorId: input.collectorId,
    approved: input.approve,
    status: progress.status,
    progress,
  };
}
