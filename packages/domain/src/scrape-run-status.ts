export const scrapeRunStatuses = [
  "collecting",
  "processing",
  "running",
  "succeeded",
  "invalid",
  "failed",
  "healing",
] as const;

export type ScrapeRunStatus = (typeof scrapeRunStatuses)[number];

export const ACTIVE_SCRAPE_RUN_STATUSES: readonly ScrapeRunStatus[] = [
  "collecting",
  "processing",
  "running",
] as const;

export const TERMINAL_SCRAPE_RUN_STATUSES: readonly ScrapeRunStatus[] = [
  "succeeded",
  "invalid",
  "failed",
] as const;

export function isScrapeRunActive(
  status: string | null | undefined,
): status is "collecting" | "processing" | "running" {
  return (
    status === "collecting" ||
    status === "processing" ||
    status === "running"
  );
}

export function isScrapeRunTerminal(
  status: string | null | undefined,
): status is "succeeded" | "invalid" | "failed" {
  return (
    status === "succeeded" ||
    status === "invalid" ||
    status === "failed"
  );
}
