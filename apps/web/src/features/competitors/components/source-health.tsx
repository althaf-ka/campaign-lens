import { HugeiconsIcon } from "@hugeicons/react";
import {
  Activity01Icon,
  Alert02Icon,
  SparklesIcon,
  HelpCircleIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
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
        icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-emerald-400" />,
      };
    case "degraded":
      return {
        label: "Degraded",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        icon: <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 text-amber-400" />,
      };
    case "healing":
      return {
        label: "Self-Healing",
        className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse",
        icon: <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3 text-indigo-400" />,
      };
    case "needs_review":
      return {
        label: "Needs Review",
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        icon: <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} className="size-3 text-rose-400" />,
      };
  }
}

export function SourceHealthCard({ sources }: SourceHealthProps) {
  return (
    <div className="rounded-xl border border-border/80 bg-card/50 p-5 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Tracked Sources & Scraper Health
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {sources.length} active {sources.length === 1 ? "endpoint" : "endpoints"}
        </span>
      </div>

      <div className="divide-y divide-border/40 mt-1">
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
                  <span className="text-sm font-medium text-foreground">{source.name}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground uppercase">
                    {source.type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span className="truncate max-w-[260px] sm:max-w-xs">{source.url}</span>
                  <span className="text-border">·</span>
                  <span>Collector: {source.collectorId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                <div className="text-right">
                  <div className="text-[11px] text-muted-foreground font-mono">Last Scraped</div>
                  <div className="text-xs text-foreground font-mono">{formattedLastRun}</div>
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
