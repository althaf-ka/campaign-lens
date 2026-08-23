import { Activity, AlertTriangle, Sparkles, HelpCircle, CheckCircle } from "lucide-react";
import type { TrackedSource, SourceHealth } from "../types.ts";

interface SourceHealthProps {
  sources: TrackedSource[];
}

function getHealthBadge(health: SourceHealth) {
  switch (health) {
    case "healthy":
      return {
        label: "Healthy",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        icon: <CheckCircle className="h-3 w-3 text-emerald-400" />,
      };
    case "degraded":
      return {
        label: "Degraded",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: <AlertTriangle className="h-3 w-3 text-amber-400" />,
      };
    case "healing":
      return {
        label: "Self-Healing",
        className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse",
        icon: <Sparkles className="h-3 w-3 text-indigo-400" />,
      };
    case "needs_review":
      return {
        label: "Needs Review",
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: <HelpCircle className="h-3 w-3 text-rose-400" />,
      };
  }
}

export function SourceHealthCard({ sources }: SourceHealthProps) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Tracked Sources & Scraper Health
          </h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          {sources.length} active {sources.length === 1 ? "endpoint" : "endpoints"}
        </span>
      </div>

      <div className="divide-y divide-zinc-800/40 mt-1">
        {sources.map((source) => {
          const badge = getHealthBadge(source.health);
          const formattedLastRun = source.lastRunAt
            ? new Date(source.lastRunAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "Pending";

          return (
            <div
              key={source.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">{source.name}</span>
                  <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 uppercase">
                    {source.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="truncate max-w-[260px] sm:max-w-xs">{source.url}</span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">Collector: {source.collectorId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-[11px] text-zinc-500 font-mono">Last Scraped</div>
                  <div className="text-xs text-zinc-300 font-mono">{formattedLastRun}</div>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${badge.className}`}
                >
                  {badge.icon}
                  <span>{badge.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
