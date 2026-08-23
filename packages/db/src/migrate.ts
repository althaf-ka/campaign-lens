import { neon } from "@neondatabase/serverless";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const possibleEnvFiles = [
    resolve(process.cwd(), "../../apps/api/.dev.vars"),
    resolve(process.cwd(), "../../.dev.vars"),
    resolve(process.cwd(), "apps/api/.dev.vars"),
    resolve(process.cwd(), ".dev.vars"),
    resolve(process.cwd(), ".env"),
  ];

  for (const envPath of possibleEnvFiles) {
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.startsWith("DATABASE_URL=")) {
          return trimmed.replace("DATABASE_URL=", "").trim().replace(/^["']|["']$/g, "");
        }
      }
    }
  }

  throw new Error("DATABASE_URL is not set.");
}

async function runMigration() {
  const dbUrl = getDatabaseUrl();
  const sql = neon(dbUrl);

  console.log("Applying database migrations to Neon PostgreSQL...");

  // 1. Create competitors table
  await sql`
    CREATE TABLE IF NOT EXISTS "competitors" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "domain" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "competitors_domain_unique" UNIQUE("domain")
    );
  `;

  // 2. Create sources table
  await sql`
    CREATE TABLE IF NOT EXISTS "sources" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "competitor_id" uuid NOT NULL REFERENCES "competitors"("id") ON DELETE cascade,
      "name" text NOT NULL,
      "url" text NOT NULL,
      "type" text NOT NULL,
      "collector_id" text NOT NULL,
      "health" text DEFAULT 'healthy' NOT NULL,
      "last_run_at" timestamp with time zone,
      "next_run_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  // 3. Create scrape_runs table
  await sql`
    CREATE TABLE IF NOT EXISTS "scrape_runs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "source_id" uuid NOT NULL REFERENCES "sources"("id") ON DELETE cascade,
      "status" text NOT NULL,
      "upstream_response_id" text,
      "error_code" text,
      "started_at" timestamp with time zone DEFAULT now() NOT NULL,
      "completed_at" timestamp with time zone
    );
  `;

  // 4. Create snapshots table
  await sql`
    CREATE TABLE IF NOT EXISTS "snapshots" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "source_id" uuid NOT NULL REFERENCES "sources"("id") ON DELETE cascade,
      "scrape_run_id" uuid NOT NULL REFERENCES "scrape_runs"("id") ON DELETE cascade,
      "headline" text,
      "offer" text,
      "price_amount" double precision,
      "price_currency" text,
      "price_qualifier" text,
      "cta_label" text,
      "cta_href" text,
      "guarantees" jsonb DEFAULT '[]'::jsonb NOT NULL,
      "data" jsonb NOT NULL,
      "captured_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  // 5. Create campaign_events table
  await sql`
    CREATE TABLE IF NOT EXISTS "campaign_events" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "competitor_id" uuid NOT NULL REFERENCES "competitors"("id") ON DELETE cascade,
      "source_id" uuid NOT NULL REFERENCES "sources"("id") ON DELETE cascade,
      "snapshot_id" uuid NOT NULL REFERENCES "snapshots"("id") ON DELETE cascade,
      "type" text NOT NULL,
      "before" jsonb,
      "after" jsonb,
      "detected_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  // 6. Create source_activity table
  await sql`
    CREATE TABLE IF NOT EXISTS "source_activity" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "competitor_id" uuid NOT NULL REFERENCES "competitors"("id") ON DELETE cascade,
      "source_id" uuid NOT NULL REFERENCES "sources"("id") ON DELETE cascade,
      "type" text NOT NULL,
      "message" text NOT NULL,
      "metadata" jsonb,
      "occurred_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `;

  // Indexes
  await sql`CREATE INDEX IF NOT EXISTS "sources_competitor_id_idx" ON "sources" ("competitor_id");`;
  await sql`CREATE INDEX IF NOT EXISTS "scrape_runs_source_id_started_at_idx" ON "scrape_runs" ("source_id", "started_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "snapshots_source_id_captured_at_idx" ON "snapshots" ("source_id", "captured_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "campaign_events_competitor_id_detected_at_idx" ON "campaign_events" ("competitor_id", "detected_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "source_activity_competitor_id_occurred_at_idx" ON "source_activity" ("competitor_id", "occurred_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "source_activity_source_id_occurred_at_idx" ON "source_activity" ("source_id", "occurred_at");`;
  await sql`CREATE INDEX IF NOT EXISTS "source_activity_occurred_at_idx" ON "source_activity" ("occurred_at");`;

  console.log("✓ Database migrations successfully applied.");
}

runMigration().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
