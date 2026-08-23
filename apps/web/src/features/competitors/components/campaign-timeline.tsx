import { Badge } from "@campaign-lens/ui/components/badge";
import { Card } from "@campaign-lens/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import type { CampaignEventRecord, TrackedSource } from "../types.ts";
import { CampaignEvent } from "./campaign-event.tsx";

interface CampaignTimelineProps {
  events: CampaignEventRecord[];
  sources: TrackedSource[];
}

export function CampaignTimeline({ events, sources }: CampaignTimelineProps) {
  const sourcesMap = new Map(sources.map((s) => [s.id, s.name]));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-base font-semibold text-foreground">
          Campaign timeline
        </h3>
        <Badge variant="secondary" className="text-xs font-normal">
          {events.length} {events.length === 1 ? "event" : "events"}
        </Badge>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed p-8 text-center bg-muted/20">
          <div className="mx-auto size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-4 text-emerald-400" />
          </div>
          <h4 className="text-sm font-medium text-foreground">Baseline Established</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            Initial campaign snapshot stored. Future price or offer changes will appear here automatically.
          </p>
        </Card>
      ) : (
        <div className="relative pl-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-border space-y-4">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <div className="absolute -left-6 top-4 size-4 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                <div className="size-1 rounded-full bg-primary" />
              </div>
              <CampaignEvent
                event={event}
                sourceName={sourcesMap.get(event.sourceId)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
