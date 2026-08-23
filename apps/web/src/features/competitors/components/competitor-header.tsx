import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Competitor, TrackedSource } from "../types.ts";
import { triggerSourceMonitor, triggerDebugLumoraRun } from "../api/competitor.queries.ts";
import { SourceHealthBadge } from "./source-health-badge.tsx";

interface CompetitorHeaderProps {
  competitor: Competitor;
  primarySource?: TrackedSource;
}

export function CompetitorHeader({ competitor, primarySource }: CompetitorHeaderProps) {
  const queryClient = useQueryClient();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const handleMonitorNow = async () => {
    setIsMonitoring(true);
    setLastActionStatus(null);
    try {
      if (primarySource) {
        const result = (await triggerSourceMonitor(primarySource.id)) as {
          status?: string;
          changes?: unknown[];
          recoveryAttempted?: boolean;
        };
        if (result.status === "healthy") {
          const changeCount = result.changes?.length ?? 0;
          setLastActionStatus(changeCount > 0 ? `${changeCount} change(s) detected` : "Verified · Baseline unchanged");
        } else if (result.status === "recovered") {
          setLastActionStatus("Source recovered · Baseline unchanged");
        } else if (result.status === "degraded") {
          setLastActionStatus("Extraction degraded · Self-healing queued");
        } else {
          setLastActionStatus("Monitoring completed");
        }
      } else {
        await triggerDebugLumoraRun();
        setLastActionStatus("Scan complete");
      }
      await queryClient.invalidateQueries({ queryKey: ["competitors", competitor.id] });
      setTimeout(() => setLastActionStatus(null), 5000);
    } catch (err) {
      console.error("Monitor run failed:", err);
      setLastActionStatus(err instanceof Error ? err.message : "Monitoring failed");
      setTimeout(() => setLastActionStatus(null), 5000);
    } finally {
      setIsMonitoring(false);
    }
  };

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border">
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
            <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
          </a>
          {formattedLastRun && (
            <>
              <span>·</span>
              <span>Last checked {formattedLastRun}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {lastActionStatus && (
          <span className="inline-flex items-center gap-1 text-xs text-foreground font-mono bg-muted px-2.5 py-1">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5 text-emerald-400" />
            {lastActionStatus}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleMonitorNow}
          disabled={isMonitoring}
          className="gap-2 cursor-pointer text-xs"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className={`size-3.5 ${isMonitoring ? "animate-spin text-primary" : "text-muted-foreground"}`}
          />
          <span>{isMonitoring ? "Monitoring source..." : "Monitor now"}</span>
        </Button>
      </div>
    </div>
  );
}
