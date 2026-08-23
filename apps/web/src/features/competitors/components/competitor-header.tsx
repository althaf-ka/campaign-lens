import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare01Icon,
  RefreshIcon,
  CheckmarkCircle01Icon,
  Target02Icon,
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
      setLastActionStatus("Live Scan complete");
      setTimeout(() => setLastActionStatus(null), 4000);
    } catch (err) {
      console.error("Manual run failed:", err);
      setLastActionStatus(err instanceof Error ? err.message : "Run failed");
      setTimeout(() => setLastActionStatus(null), 5000);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <header className="border-b border-border/80 bg-card/40 backdrop-blur-md pb-6 pt-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/20">
                <HugeiconsIcon icon={Target02Icon} strokeWidth={2} className="size-4" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-editorial sm:text-3xl">
                {competitor.name}
              </h1>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Monitoring
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <a
                href={
                  competitor.domain.startsWith("http")
                    ? competitor.domain
                    : `https://${competitor.domain}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                {competitor.domain}
                <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
              </a>
              <span className="text-border">·</span>
              <span>ID: {competitor.id.slice(0, 8)}...</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastActionStatus && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                {lastActionStatus}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRun}
              disabled={isRunning}
              className="gap-2 cursor-pointer border-border hover:bg-accent"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className={`size-3.5 ${isRunning ? "animate-spin text-primary" : "text-muted-foreground"}`}
              />
              {isRunning ? "Collecting Snapshot..." : "Trigger Live Scan"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
