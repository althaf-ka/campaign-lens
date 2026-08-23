import type { Database } from "./client.ts";
import { upsertCompetitor } from "./queries/competitors.ts";
import { upsertSource } from "./queries/sources.ts";
import type { Competitor } from "./schema/competitors.ts";
import type { Source } from "./schema/sources.ts";

export interface SeedResult {
  competitor: Competitor;
  source: Source;
}

export async function seedLumora(db: Database): Promise<SeedResult> {
  const competitor = await upsertCompetitor(db, {
    name: "Lumora",
    domain: "lumora-58u.pages.dev",
  });

  const source = await upsertSource(db, {
    competitorId: competitor.id,
    name: "Homepage Campaign",
    url: "https://lumora-58u.pages.dev/",
    type: "homepage",
    collectorId: "c_mt5kun512itlsaiw1s",
    health: "healthy",
    nextRunAt: new Date(),
  });

  return { competitor, source };
}
