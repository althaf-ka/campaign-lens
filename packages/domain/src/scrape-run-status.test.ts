import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  scrapeRunStatuses,
  ACTIVE_SCRAPE_RUN_STATUSES,
  TERMINAL_SCRAPE_RUN_STATUSES,
  isScrapeRunActive,
  isScrapeRunTerminal,
} from "./scrape-run-status.ts";

describe("ScrapeRunStatus canonical model", () => {
  it("recognizes every active status including running, collecting, and processing", () => {
    assert.equal(isScrapeRunActive("running"), true);
    assert.equal(isScrapeRunActive("collecting"), true);
    assert.equal(isScrapeRunActive("processing"), true);
    assert.equal(isScrapeRunActive("succeeded"), false);
    assert.equal(isScrapeRunActive("failed"), false);
    assert.equal(isScrapeRunActive("invalid"), false);
    assert.equal(isScrapeRunActive(null), false);
    assert.equal(isScrapeRunActive(undefined), false);
  });

  it("recognizes terminal statuses", () => {
    assert.equal(isScrapeRunTerminal("succeeded"), true);
    assert.equal(isScrapeRunTerminal("failed"), true);
    assert.equal(isScrapeRunTerminal("invalid"), true);
    assert.equal(isScrapeRunTerminal("running"), false);
    assert.equal(isScrapeRunTerminal("collecting"), false);
  });

  it("lists all statuses in scrapeRunStatuses array", () => {
    assert.ok(scrapeRunStatuses.includes("running"));
    assert.ok(scrapeRunStatuses.includes("collecting"));
    assert.ok(scrapeRunStatuses.includes("processing"));
    assert.ok(ACTIVE_SCRAPE_RUN_STATUSES.includes("running"));
    assert.ok(TERMINAL_SCRAPE_RUN_STATUSES.includes("succeeded"));
  });
});
