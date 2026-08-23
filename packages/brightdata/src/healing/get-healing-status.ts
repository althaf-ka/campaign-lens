import { BrightDataClient } from "../client.ts";
import type { HealingProgress } from "./types.ts";

/**
 * Retrieves the current status and preview of an active or recent collector Self-Healing job.
 */
export async function getCollectorHealingStatus(
  apiToken: string,
  collectorId: string,
  baseUrl?: string,
): Promise<HealingProgress> {
  const client = new BrightDataClient({
    apiToken,
    baseUrl,
  });

  return client.getRefactorProgress(collectorId);
}
