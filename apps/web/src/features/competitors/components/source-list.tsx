import { Link } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@campaign-lens/ui/components/card";
import { Badge } from "@campaign-lens/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  LinkSquare01Icon,
  AlertCircleIcon,
  CpuIcon,
  Clock01Icon,
  ShieldCheckIcon,
  AiBrain01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { TrackedSource } from "../types.ts";
import { SourceHealthBadge } from "./source-health-badge.tsx";

interface SourceListProps {
  sources: TrackedSource[];
}

export function SourceList({ sources }: SourceListProps) {
  const isAnyDegraded = sources.some((s) => s.health === "degraded" || s.health === "healing");

  return (
    <div className="space-y-4">
      {/* Infrastructure Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-card border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <HugeiconsIcon icon={CpuIcon} strokeWidth={2} className="size-3.5 text-primary" />
            <span>Scraper Engine</span>
          </div>
          <p className="text-xs font-semibold text-foreground">
            Bright Data Scraper Studio
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            Custom DOM extractor
          </p>
        </div>

        <div className="p-3.5 bg-card border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <HugeiconsIcon icon={ShieldCheckIcon} strokeWidth={2} className="size-3.5 text-emerald-400" />
            <span>Integrity Guard</span>
          </div>
          <p className="text-xs font-semibold text-emerald-400">
            Contract Active
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            0 fake campaign diffs
          </p>
        </div>

        <div className="p-3.5 bg-card border border-border space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="size-3.5 text-cyan-400" />
            <span>AI Self-Healing</span>
          </div>
          <p className="text-xs font-semibold text-foreground">
            {isAnyDegraded ? "Repair Queued" : "Autonomous Standby"}
          </p>
          <p className="text-[11px] text-muted-foreground font-mono">
            In-place collector repair
          </p>
        </div>
      </div>

      {/* Sources Detail Card */}
      <Card className="bg-card">
        <CardHeader className="py-4 px-5 sm:px-6 pb-3 border-b border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">
                Tracked Endpoints & Collector Schemas
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Target URLs bound to isolated Scraper Studio collectors.
              </CardDescription>
            </div>
            <Link
              to="/activity"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium self-start sm:self-auto font-mono"
            >
              <span>Full activity stream</span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 divide-y divide-border/60">
          {sources.map((source) => {
            const formattedLastRun = source.lastRunAt
              ? new Date(source.lastRunAt).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Pending";

            const isDegraded = source.health === "degraded";
            const isHealing = source.health === "healing";

            return (
              <div
                key={source.id}
                className="py-4 first:pt-4 last:pb-0 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {source.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono border-border bg-muted/30 text-muted-foreground uppercase"
                      >
                        {source.type || "Source"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono bg-muted/40 px-2 py-0.5 border border-border/40">
                        ID: {source.collectorId || "c_mt5kun512itlsaiw1s"}
                      </span>
                    </div>

                    <div className="max-w-full overflow-hidden">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors max-w-full break-all"
                      >
                        <span className="break-all">{source.url}</span>
                        <HugeiconsIcon
                          icon={LinkSquare01Icon}
                          strokeWidth={2}
                          className="size-3 text-muted-foreground shrink-0"
                        />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                        <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
                        <span>Last run: {formattedLastRun}</span>
                      </div>
                    </div>
                    <SourceHealthBadge health={source.health} />
                  </div>
                </div>

                {isDegraded && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5 shrink-0" />
                      <span>DOM Structure Drift Detected</span>
                    </div>
                    <p className="text-[11px] text-amber-500/90 leading-relaxed">
                      Target page selectors failed extraction contract. Integrity guard preserved historical campaign state. Autonomous Bright Data Scraper Studio self-healing has been initiated to repair selectors.
                    </p>
                  </div>
                )}

                {isHealing && (
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <HugeiconsIcon icon={AiBrain01Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                      <span>AI Self-Healing in Progress</span>
                    </div>
                    <p className="text-[11px] text-cyan-400/90 leading-relaxed">
                      Refactoring collector schema against live HTML without altering historical collector ID.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
