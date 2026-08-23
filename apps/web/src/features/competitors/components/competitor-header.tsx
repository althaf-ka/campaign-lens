import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import type { Competitor, TrackedSource } from "../types.ts";
import { SourceHealthBadge } from "./source-health-badge.tsx";
import { useMonitorSource } from "../hooks/use-monitor-source.ts";
import { useSourceRecovery } from "../hooks/use-source-recovery.ts";
import { RecoveryStatus } from "./recovery-status.tsx";

interface CompetitorHeaderProps {
  competitor: Competitor;
  primarySource?: TrackedSource;
}

export function CompetitorHeader({
  competitor,
  primarySource,
}: CompetitorHeaderProps) {
  const {
    isStarting,
    isActive: isScrapeActive,
    isCollecting,
    isProcessing,
    scrapeRun,
    monitorNow,
    statusMessage,
  } = useMonitorSource(primarySource?.id, competitor.id);

  const { recovery, isActive: isRecoveryActive } = useSourceRecovery(
    primarySource?.id,
    competitor.id,
  );

  const isBusy = isStarting || isScrapeActive || isRecoveryActive;

  const domainUrl = competitor.domain.startsWith("http")
    ? competitor.domain
    : `https://${competitor.domain}`;

  const formattedLastRun = primarySource?.lastRunAt
    ? new Date(primarySource.lastRunAt).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="space-y-4 pb-6 border-b border-border">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {competitor.name}
            </h1>
            {primarySource && <SourceHealthBadge health={primarySource.health} />}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <a
              href={domainUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground font-mono transition-colors"
            >
              <span>{competitor.domain}</span>
              <HugeiconsIcon
                icon={LinkSquare01Icon}
                strokeWidth={2}
                className="size-3 text-muted-foreground"
              />
            </a>
            {formattedLastRun && (
              <>
                <span>·</span>
                <span>Last checked {formattedLastRun}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Visible text shimmer during active scrape */}
          {(isStarting || isCollecting) && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-xs shimmer text-muted-foreground font-mono bg-muted/60 px-2.5 py-1"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className="size-3.5 animate-spin text-primary shrink-0"
              />
              <span>Checking competitor…</span>
            </span>
          )}

          {isProcessing && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 text-xs shimmer text-muted-foreground font-mono bg-muted/60 px-2.5 py-1"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className="size-3.5 animate-spin text-primary shrink-0"
              />
              <span>Verifying campaign data…</span>
            </span>
          )}

          {statusMessage && !isBusy && (
            <span className="inline-flex items-center gap-1 text-xs text-foreground font-mono bg-muted px-2.5 py-1 max-w-full truncate">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="size-3.5 text-emerald-400 shrink-0"
              />
              <span className="truncate">{statusMessage}</span>
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={monitorNow}
            disabled={isBusy}
            className="gap-2 cursor-pointer text-xs w-full sm:w-auto"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className={`size-3.5 shrink-0 ${
                isBusy ? "animate-spin text-primary" : "text-muted-foreground"
              }`}
            />
            <span>
              {isStarting || isCollecting
                ? "Checking…"
                : isProcessing
                  ? "Verifying…"
                  : isRecoveryActive
                    ? "Self-Healing in progress…"
                    : "Monitor now"}
            </span>
          </Button>
        </div>
      </div>

      {/* Visibly render progress during scrape or recovery */}
      {(isStarting || isScrapeActive) && (
        <RecoveryStatus
          isStarting={isStarting}
          scrapeRun={scrapeRun}
          recovery={null}
        />
      )}

      {!isStarting && !isScrapeActive && recovery && (
        <RecoveryStatus recovery={recovery} />
      )}
    </div>
  );
}
