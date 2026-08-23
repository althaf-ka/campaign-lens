import { Hono } from "hono";
import { createCompetitorInputSchema } from "@campaign-lens/domain";
import {
  createDb,
  getCompetitors,
  getCompetitorById,
  getSourcesByCompetitorId,
  getCampaignEventsByCompetitorId,
  getLatestSnapshotBySourceId,
  createCompetitorWithSource,
} from "@campaign-lens/db";
import { monitorSource } from "../sources/monitor-source.ts";

export const competitorRoutes = new Hono<{ Bindings: CloudflareBindings }>();

competitorRoutes.get("/competitors", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "DATABASE_URL is not configured.",
        },
      },
      500,
    );
  }

  const db = createDb(databaseUrl);
  const list = await getCompetitors(db);
  return c.json({ competitors: list });
});

competitorRoutes.get("/competitors/:id", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  if (!databaseUrl) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "DATABASE_URL is not configured.",
        },
      },
      500,
    );
  }

  const db = createDb(databaseUrl);
  const competitorId = c.req.param("id");

  const competitor = await getCompetitorById(db, competitorId);
  if (!competitor) {
    return c.json(
      { error: { code: "NOT_FOUND", message: "Competitor not found." } },
      404,
    );
  }

  const sourcesList = await getSourcesByCompetitorId(db, competitorId);
  const eventsList = await getCampaignEventsByCompetitorId(
    db,
    competitorId,
    20,
  );

  // Fetch latest snapshot for primary source if available
  const primarySource = sourcesList[0];
  const currentSnapshot = primarySource
    ? await getLatestSnapshotBySourceId(db, primarySource.id)
    : null;

  return c.json({
    competitor,
    currentSnapshot: currentSnapshot?.data ?? null,
    sources: sourcesList,
    events: eventsList,
  });
});

/**
 * Onboard a competitor and its primary Scraper Studio source,
 * then execute initial monitoring to establish the baseline.
 */
competitorRoutes.post("/competitors", async (c) => {
  const databaseUrl = c.env.DATABASE_URL;
  const apiToken = c.env.BRIGHT_DATA_API_TOKEN;

  if (!databaseUrl || !apiToken) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "Server is missing DATABASE_URL or BRIGHT_DATA_API_TOKEN configuration.",
        },
      },
      500,
    );
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      400,
    );
  }

  const parseResult = createCompetitorInputSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid competitor onboarding data.",
          issues: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const data = parseResult.data;
  const db = createDb(databaseUrl);

  try {
    // 1. Atomically persist competitor and source
    const { competitor, source } = await createCompetitorWithSource(db, {
      name: data.name,
      domain: data.domain,
      source: {
        name: data.source.name,
        url: data.source.url,
        type: data.source.type,
        collectorId: data.source.collectorId,
        intervalMinutes: data.source.intervalMinutes,
      },
    });

    // 2. Perform initial monitoring to capture baseline
    let initialMonitor: unknown;
    try {
      initialMonitor = await monitorSource({
        sourceId: source.id,
        db,
        apiToken,
        intervalMinutes: data.source.intervalMinutes,
      });
    } catch (monitorErr) {
      console.error("[Initial Monitor Error]", monitorErr);
      initialMonitor = {
        status: "degraded",
        error: monitorErr instanceof Error ? monitorErr.message : "Initial collection failed",
      };
    }

    return c.json(
      {
        competitor,
        source,
        initialMonitor,
      },
      201,
    );
  } catch (err) {
    console.error("[Competitor Onboarding Error]", err);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err instanceof Error ? err.message : "Failed to onboard competitor.",
        },
      },
      500,
    );
  }
});
