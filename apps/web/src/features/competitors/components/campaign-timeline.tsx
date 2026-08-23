import { HugeiconsIcon } from "@hugeicons/react";
import { Time02Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import type { CampaignEventRecord, TrackedSource } from "../types.ts";
import { CampaignEventCard } from "./campaign-event-card.tsx";

interface CampaignTimelineProps {
  events: CampaignEventRecord[];
  sources: TrackedSource[];
}

export function CampaignTimeline({ events, sources }: CampaignTimelineProps) {
  const sourcesMap = new Map(sources.map((s) => [s.id, s.name]));

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Time02Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground font-mono">
            Campaign Change Timeline
          </h2>
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {events.length} {events.length === 1 ? "semantic event" : "semantic events"} recorded
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/20 p-10 text-center">
          <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3 border border-border">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-5 text-emerald-500" />
          </div>
          <h3 className="text-sm font-medium text-foreground">Baseline Established</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto font-mono">
            Initial campaign snapshot has been stored. Future price, offer, CTA, or headline changes will automatically generate timeline events.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-border">
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-6 sm:-left-8 top-5 flex size-5 -translate-x-1/2 items-center justify-center rounded-full bg-background border-2 border-primary">
                  <div className="size-1.5 rounded-full bg-primary" />
                </div>
                <CampaignEventCard
                  event={event}
                  sourceName={sourcesMap.get(event.sourceId)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
