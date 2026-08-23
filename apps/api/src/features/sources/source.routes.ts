import { Hono } from "hono";
import { z } from "zod";
import {
  BrightDataError,
  runBrightDataCollector,
} from "@campaign-lens/brightdata";
import {
  campaignSnapshotSchema,
  evaluateSnapshotIntegrity,
} from "@campaign-lens/domain";
import { createDb, seedLumora, getSourceById } from "@campaign-lens/db";

import { runSource } from "./run-source.ts";
import { healSource } from "./heal-source.ts";
import { monitorSource } from "./monitor-source.ts";

export const sourceRoutes = new Hono<{ Bindings: CloudflareBindings }>();

const testConnectionSchema = z.object({
  url: z.string().url("Must be a valid HTTP or HTTPS URL"),
  collectorId: z
    .string()
    .min(3)
    .regex(/^c_[a-zA-Z0-9]+$/, "Collector ID must start with 'c_'"),
  sourceType: z.enum(["homepage", "pricing"]).default("homepage"),
});

/**
 * Diagnostic endpoint: Validates a Scraper Studio collector against a target URL
 * WITHOUT persistence side-effects or automated recovery triggering.
 */
sourceRoutes.post("/sources/test-connection", async (c) => {
  const apiToken = c.env.BRIGHT_DATA_API_TOKEN;
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

  const parseResult = testConnectionSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid test connection input.",
          issues: parseResult.error.issues,
        },
      },
      400,
    );
  }

  const { url, collectorId, sourceType } = parseResult.data;

  try {
    const rawData = await runBrightDataCollector({
      apiToken,
      collectorId,
      url,
    });

    const validation = campaignSnapshotSchema.safeParse(rawData);
    if (!validation.success) {
      return c.json(
        {
          status: "incompatible",
          reason: "schema_validation_failed",
          message:
            "Scraper Studio collector output does not match CampaignLens schema.",
          issues: validation.error.issues,
        },
        200,
      );
    }

    const snapshot = validation.data;
    const integrity = evaluateSnapshotIntegrity({
      snapshot,
      sourceType,
    });

    if (integrity.status === "degraded") {
      return c.json(
        {
          status: "incompatible",
          reason: "extraction_integrity_failed",
          message: `Collector output is missing required fields: ${integrity.missing.join(", ")}`,
          missing: integrity.missing,
          preview: {
            headline: snapshot.headline,
            offer: snapshot.offer,
            pricing: {
              amount: snapshot.pricing.amount,
              currency: snapshot.pricing.currency,
            },
            primaryCta: {
              label: snapshot.primaryCta.label,
            },
          },
        },
        200,
      );
    }

    return c.json(
      {
        status: "compatible",
        preview: {
          headline: snapshot.headline,
          offer: snapshot.offer,
          pricing: {
            amount: snapshot.pricing.amount,
            currency: snapshot.pricing.currency,
          },
          primaryCta: {
            label: snapshot.primaryCta.label,
          },
        },
      },
      200,
    );
  } catch (error) {
    if (error instanceof BrightDataError) {
      return c.json(
        {
          status: "incompatible",
          reason: error.errorCode || "crawler_execution_error",
          message: error.message,
        },
        200,
      );
    }

    const genericMsg =
      error instanceof Error ? error.message : String(error);
    return c.json(
      {
        status: "incompatible",
        reason: "connection_error",
        message: genericMsg,
      },
      200,
    );
  }
});

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

    if (result.status === "invalid" || result.status === "degraded") {
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
 * Triggers autonomous Bright Data Self-Healing recovery for a degraded source.
 */
sourceRoutes.post("/sources/:id/heal", async (c) => {
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

    const result = await healSource({
      sourceId,
      db,
      apiToken,
    });

    if (result.status === "unavailable") {
      return c.json(result, 503);
    }

    if (result.status === "needs_review" || result.status === "failed") {
      return c.json(result, 422);
    }

    return c.json(result, 200);
  } catch (error) {
    console.error("[Source Heal Error]", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred during source healing.",
        },
      },
      500,
    );
  }
});

/**
 * Triggers high-level autonomous monitoring (runSource -> evaluate -> healSource if degraded).
 */
sourceRoutes.post("/sources/:id/monitor", async (c) => {
  const apiToken = c.env.BRIGHT_DATA_API_TOKEN;
  const databaseUrl = c.env.DATABASE_URL;

  if (!apiToken || !databaseUrl) {
    return c.json(
      {
        error: {
          code: "CONFIG_ERROR",
          message:
            "Worker configuration missing DATABASE_URL or BRIGHT_DATA_API_TOKEN.",
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

    const result = await monitorSource({
      sourceId,
      db,
      apiToken,
    });

    return c.json(result, 200);
  } catch (error) {
    console.error("[Source Monitor Error]", error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred during source monitoring.",
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

    if (result.status === "invalid" || result.status === "degraded") {
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
