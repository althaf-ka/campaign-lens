import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  RefreshIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Link } from "@tanstack/react-router";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto size-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive mb-4">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground font-editorial">
          Failed to Load Competitor Intelligence
        </h2>
        <p className="mt-2 text-sm text-muted-foreground font-mono">
          {error instanceof Error ? error.message : "An unexpected error occurred."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" render={<Link to="/" />}>
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
            Back to Overview
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer gap-2"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const { competitor, currentSnapshot, sources, events } = data;
  const primarySource = sources[0];

  return (
    <div className="space-y-6 pb-12">
      <CompetitorHeader competitor={competitor} primarySource={primarySource} />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-6">
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
