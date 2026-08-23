import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@campaign-lens/ui/components/button";
import { Badge } from "@campaign-lens/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import type { Competitor, TrackedSource } from "../types.ts";
import { triggerSourceRun, triggerDebugLumoraRun } from "../api/competitor.queries.ts";

interface CompetitorHeaderProps {
  competitor: Competitor;
  primarySource?: TrackedSource;
}

export function CompetitorHeader({ competitor, primarySource }: CompetitorHeaderProps) {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [lastActionStatus, setLastActionStatus] = useState<string | null>(null);

  const handleManualRun = async () => {
    setIsRunning(true);
    setLastActionStatus(null);
    try {
      if (primarySource) {
        await triggerSourceRun(primarySource.id);
      } else {
        await triggerDebugLumoraRun();
      }
      await queryClient.invalidateQueries({ queryKey: ["competitors", competitor.id] });
      setLastActionStatus("Scan complete");
      setTimeout(() => setLastActionStatus(null), 3000);
    } catch (err) {
      console.error("Manual run failed:", err);
      setLastActionStatus(err instanceof Error ? err.message : "Scan failed");
      setTimeout(() => setLastActionStatus(null), 4000);
    } finally {
      setIsRunning(false);
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
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 text-xs">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-emerald-400" />
            <span>Healthy</span>
          </Badge>
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
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-mono">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
            {lastActionStatus}
          </span>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRun}
          disabled={isRunning}
          className="gap-2 cursor-pointer text-xs"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className={`size-3.5 ${isRunning ? "animate-spin text-primary" : "text-muted-foreground"}`}
          />
          <span>{isRunning ? "Running scan..." : "Run scan"}</span>
        </Button>
      </div>
    </div>
  );
}
