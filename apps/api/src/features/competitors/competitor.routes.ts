import { Hono } from "hono";
import {
  createDb,
  getCompetitors,
  getCompetitorById,
  getSourcesByCompetitorId,
  getCampaignEventsByCompetitorId,
  getLatestSnapshotBySourceId,
} from "@campaign-lens/db";


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
