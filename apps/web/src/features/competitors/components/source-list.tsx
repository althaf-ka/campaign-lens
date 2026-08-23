import { Card, CardHeader, CardTitle, CardContent } from "@campaign-lens/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { LinkSquare01Icon } from "@hugeicons/core-free-icons";
import type { TrackedSource } from "../types.ts";
import { SourceHealthBadge } from "./source-health-badge.tsx";

interface SourceListProps {
  sources: TrackedSource[];
}

export function SourceList({ sources }: SourceListProps) {
  return (
    <Card className="bg-card">
      <CardHeader className="py-4 px-6 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0 divide-y divide-border/60">
        {sources.map((source) => {
          const formattedLastRun = source.lastRunAt
            ? new Date(source.lastRunAt).toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })
            : "Pending";

          return (
            <div
              key={source.id}
              className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{source.name}</span>
                </div>
                <div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
                  >
                    <span>{source.url}</span>
                    <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                <span className="text-xs text-muted-foreground">
                  Last checked {formattedLastRun}
                </span>
                <SourceHealthBadge health={source.health} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
