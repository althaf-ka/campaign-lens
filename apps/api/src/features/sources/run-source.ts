import {
  campaignSnapshotSchema,
  diffCampaignSnapshots,
  type CampaignSnapshot,
  type CampaignChange,
} from "@campaign-lens/domain";
import { runBrightDataCollector, BrightDataError } from "@campaign-lens/brightdata";
import {
  type Database,
  getSourceById,
  updateSourceHealth,
  createScrapeRun,
  updateScrapeRunStatus,
  createSnapshot,
  getLatestSnapshotBySourceId,
  createCampaignEvents,
} from "@campaign-lens/db";


import type { z } from "zod";

export const DEMO_LUMORA_COLLECTOR_ID = "c_mt5kun512itlsaiw1s";
export const DEMO_LUMORA_URL = "https://lumora-58u.pages.dev/";

export type SourceRunResult =
  | {
      status: "healthy";
      sourceId: string;
      scrapeRunId: string;
      snapshotId: string;
      snapshot: CampaignSnapshot;
      changes: CampaignChange[];
    }
  | {
      status: "invalid";
      sourceId: string;
      scrapeRunId: string;
      issues: z.ZodIssue[];
    };

export interface RunSourceOptions {
  sourceId: string;
  db: Database;
  apiToken: string;
}

/**
 * Orchestrates fetching competitor campaign data, validating the structure,
 * persisting snapshot history, and detecting semantic changes.
 */
export async function runSource(
  options: RunSourceOptions,
): Promise<SourceRunResult> {
  const { sourceId, db, apiToken } = options;

  // 1. Load the tracked source from the database
  const source = await getSourceById(db, sourceId);
  if (!source) {
    throw new Error(`Source with ID '${sourceId}' not found.`);
  }

  // 2. Register a new scrape run in 'running' status
  const scrapeRun = await createScrapeRun(db, {
    sourceId: source.id,
    status: "running",
  });

  let rawData: unknown;

  try {
    // 3. Trigger Bright Data collector and await output
    rawData = await runBrightDataCollector({
      apiToken,
      collectorId: source.collectorId,
      url: source.url,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await updateScrapeRunStatus(db, scrapeRun.id, {
      status: "failed",
      errorCode: errorMessage,
      completedAt: new Date(),
    });
    await updateSourceHealth(db, source.id, "degraded");

    if (error instanceof BrightDataError) {
      throw error;
    }
    throw new Error(`Scraper execution failed: ${errorMessage}`, {
      cause: error,
    });
  }

  // 4. Validate output with domain Zod schema
  const validation = campaignSnapshotSchema.safeParse(rawData);

  if (!validation.success) {
    console.warn(
      `[Source ${source.id}] Scraper output failed schema validation:`,
      validation.error.issues,
    );

    await updateScrapeRunStatus(db, scrapeRun.id, {
      status: "invalid",
      errorCode: "SCHEMA_VALIDATION_FAILED",
      completedAt: new Date(),
    });
    await updateSourceHealth(db, source.id, "degraded");

    return {
      status: "invalid",
      sourceId: source.id,
      scrapeRunId: scrapeRun.id,
      issues: validation.error.issues,
    };
  }

  const currentSnapshot = validation.data;

  // 5. Query latest previous snapshot to compute diff
  const previousSnapshot = await getLatestSnapshotBySourceId(db, source.id);

  // 6. Persist the new canonical snapshot
  const insertedSnapshot = await createSnapshot(db, {
    sourceId: source.id,
    scrapeRunId: scrapeRun.id,
    headline: currentSnapshot.headline,
    offer: currentSnapshot.offer,
    priceAmount: currentSnapshot.pricing.amount,
    priceCurrency: currentSnapshot.pricing.currency,
    priceQualifier: currentSnapshot.pricing.qualifier,
    ctaLabel: currentSnapshot.primaryCta.label,
    ctaHref: currentSnapshot.primaryCta.href,
    guarantees: currentSnapshot.guarantees,
    data: currentSnapshot,
  });

  // 7. Calculate semantic changes if previous snapshot exists
  let detectedChanges: CampaignChange[] = [];
  if (previousSnapshot && previousSnapshot.data) {
    detectedChanges = diffCampaignSnapshots(
      previousSnapshot.data,
      currentSnapshot,
    );

    if (detectedChanges.length > 0) {
      await createCampaignEvents(
        db,
        detectedChanges.map((change) => ({
          competitorId: source.competitorId,
          sourceId: source.id,
          snapshotId: insertedSnapshot.id,
          type: change.type,
          before: change.before !== null ? { value: change.before } : null,
          after: change.after !== null ? { value: change.after } : null,
        })),
      );
    }
  }

  // 8. Update source status to healthy and mark run succeeded
  await updateSourceHealth(db, source.id, "healthy");
  await updateScrapeRunStatus(db, scrapeRun.id, {
    status: "succeeded",
    completedAt: new Date(),
  });

  return {
    status: "healthy",
    sourceId: source.id,
    scrapeRunId: scrapeRun.id,
    snapshotId: insertedSnapshot.id,
    snapshot: currentSnapshot,
    changes: detectedChanges,
  };
}
