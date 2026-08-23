import { Hono } from "hono";
import { BrightDataError } from "@campaign-lens/brightdata";
import { createDb, seedLumora, getSourceById } from "@campaign-lens/db";

import { runSource } from "./run-source.ts";

export const sourceRoutes = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Triggers a scrape and diff analysis for a specific source ID.
 */
sourceRoutes.post("/sources/:id/run", async (c) => {
  const apiToken = c.env.BRIGHT_DATA_API_TOKEN;
  const databaseUrl = c.env.DATABASE_URL;

  if (!apiToken) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message:
            "BRIGHT_DATA_API_TOKEN is not configured in worker bindings.",
        },
      },
      500,
    );
  }

  if (!databaseUrl) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "DATABASE_URL is not configured in worker bindings.",
        },
      },
      500,
    );
  }

  const sourceId = c.req.param("id");
  const db = createDb(databaseUrl);

  try {
    const existing = await getSourceById(db, sourceId);
    if (!existing) {
      return c.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Source '${sourceId}' was not found.`,
          },
        },
        404,
      );
    }

    const result = await runSource({
      sourceId,
      db,
      apiToken,
    });

    if (result.status === "invalid") {
      return c.json(result, 422);
    }

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof BrightDataError) {
      console.error("[BrightData Error]", error.message);
      return c.json(
        {
          error: {
            code: "BRIGHT_DATA_ERROR",
            message: "Unable to retrieve competitor snapshot",
          },
        },
        502,
      );
    }

    console.error("[Source Run Error]", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        },
      },
      500,
    );
  }
});

/**
 * Convenience development route: Idempotently seeds Lumora and runs the source.
 */
sourceRoutes.post("/debug/lumora/run", async (c) => {
  const apiToken = c.env.BRIGHT_DATA_API_TOKEN;
  const databaseUrl = c.env.DATABASE_URL;

  if (!apiToken) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message:
            "BRIGHT_DATA_API_TOKEN is not configured in worker bindings.",
        },
      },
      500,
    );
  }

  if (!databaseUrl) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message: "DATABASE_URL is not configured in worker bindings.",
        },
      },
      500,
    );
  }

  const db = createDb(databaseUrl);

  try {
    const { source } = await seedLumora(db);
    const result = await runSource({
      sourceId: source.id,
      db,
      apiToken,
    });

    if (result.status === "invalid") {
      return c.json(result, 422);
    }

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof BrightDataError) {
      console.error("[BrightData Error]", error.message);
      return c.json(
        {
          error: {
            code: "BRIGHT_DATA_ERROR",
            message: "Unable to retrieve competitor snapshot",
          },
        },
        502,
      );
    }

    console.error("[Debug Run Error]", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        },
      },
      500,
    );
  }
});
