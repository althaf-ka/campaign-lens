import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
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
      setLastActionStatus("Updated successfully");
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
    <header className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md pb-6 pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100 font-editorial sm:text-3xl">
                {competitor.name}
              </h1>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Monitoring
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-400 font-mono">
              <a
                href={
                  competitor.domain.startsWith("http")
                    ? competitor.domain
                    : `https://${competitor.domain}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-zinc-200 transition-colors"
              >
                {competitor.domain}
                <ExternalLink className="h-3 w-3 text-zinc-500" />
              </a>
              <span className="text-zinc-600">·</span>
              <span className="text-xs text-zinc-500">
                ID: {competitor.id.slice(0, 8)}...
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {lastActionStatus && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lastActionStatus}
              </span>
            )}

            <button
              onClick={handleManualRun}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 shadow-sm hover:bg-zinc-800 hover:border-zinc-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRunning ? "animate-spin text-amber-400" : "text-zinc-400"}`}
              />
              {isRunning ? "Collecting Snapshot..." : "Trigger Live Scan"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
