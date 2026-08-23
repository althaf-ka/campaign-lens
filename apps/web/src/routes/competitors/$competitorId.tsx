import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { competitorQueryOptions } from "../../features/competitors/api/competitor.queries.ts";
import { CompetitorHeader } from "../../features/competitors/components/competitor-header.tsx";
import { CurrentCampaignCard } from "../../features/competitors/components/current-campaign.tsx";
import { SourceHealthCard } from "../../features/competitors/components/source-health.tsx";
import { CampaignTimeline } from "../../features/competitors/components/campaign-timeline.tsx";

export const Route = createFileRoute("/competitors/$competitorId")({
  component: CompetitorDetailPage,
});

function CompetitorDetailPage() {
  const { competitorId } = Route.useParams();
  const { data, isLoading, error, refetch } = useQuery(
    competitorQueryOptions(competitorId),
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-20 bg-zinc-900 rounded-xl" />
          <div className="h-64 bg-zinc-900 rounded-xl" />
          <div className="h-40 bg-zinc-900 rounded-xl" />
          <div className="h-96 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-zinc-100 font-editorial">
          Failed to Load Competitor Intelligence
        </h2>
        <p className="mt-2 text-sm text-zinc-400 font-mono">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { competitor, currentSnapshot, sources, events } = data;
  const primarySource = sources[0];

  return (
    <div className="space-y-8 pb-16">
      <CompetitorHeader competitor={competitor} primarySource={primarySource} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Active Campaign Extraction Card */}
        <CurrentCampaignCard snapshot={currentSnapshot} />

        {/* Tracked Sources & Scraper Studio Health */}
        <SourceHealthCard sources={sources} />

        {/* Hero Timeline of Semantic Changes */}
        <CampaignTimeline events={events} sources={sources} />
      </div>
    </div>
  );
}
