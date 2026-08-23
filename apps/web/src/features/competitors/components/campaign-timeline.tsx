import { History, Clock, CheckCircle } from "lucide-react";
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
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-200 font-mono">
            Campaign Change Timeline
          </h2>
        </div>
        <span className="text-xs text-zinc-500 font-mono">
          {events.length} {events.length === 1 ? "semantic event" : "semantic events"} recorded
        </span>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 p-10 text-center">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mb-3 border border-zinc-800">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="text-sm font-medium text-zinc-300">Baseline Established</h3>
          <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto font-mono">
            Initial campaign snapshot has been stored. Future price, offer, CTA, or headline changes will automatically generate timeline events.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-px before:bg-zinc-800">
          <div className="space-y-6">
            {events.map((event) => (
              <div key={event.id} className="relative">
                <div className="absolute -left-6 sm:-left-8 top-5 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full bg-zinc-950 border-2 border-zinc-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
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
