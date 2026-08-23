import { BrightDataClient } from "../client.ts";
import type { HealingTriggerInput, HealingProgress } from "./types.ts";

/**
 * Triggers Bright Data Self-Healing for an existing collector and polls until it reaches
 * an approval gate (status: "pending_answer") or completion (status: "done").
 */
export async function triggerCollectorHealing(
  input: HealingTriggerInput,
): Promise<HealingProgress> {
  const client = new BrightDataClient({
    apiToken: input.apiToken,
    baseUrl: input.baseUrl,
  });

  // 1. Trigger refactor_template
  await client.triggerRefactorTemplate({
    collectorId: input.collectorId,
    prompt: input.prompt,
    customInput: input.customInput,
  });

  // 2. Poll until awaiting approval (pending_answer) or done
  const progress = await client.pollRefactorProgress({
    collectorId: input.collectorId,
    timeoutMs: input.timeoutMs,
    intervalMs: input.intervalMs,
    maxAttempts: input.maxAttempts,
  });

  return progress;
}
