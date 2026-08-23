import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  RefreshIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@campaign-lens/ui/components/alert";
import { competitorQueryOptions } from "../../features/competitors/api/competitor.queries.ts";
import { CompetitorHeader } from "../../features/competitors/components/competitor-header.tsx";
import { CurrentCampaignCard } from "../../features/competitors/components/current-campaign.tsx";
import { SourceList } from "../../features/competitors/components/source-list.tsx";
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
      <div className="space-y-8 pb-12">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-28" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 space-y-4 max-w-lg mx-auto">
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Failed to load competitor</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            {error instanceof Error ? error.message : "An unexpected error occurred while fetching competitor intelligence."}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" render={<Link to="/competitors" />} className="gap-1.5 text-xs">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-3.5" />
            <span>Back to Competitors</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  const { competitor, currentSnapshot, sources, events } = data;
  const primarySource = sources[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Competitor Header */}
      <CompetitorHeader competitor={competitor} primarySource={primarySource} />

      {/* Current Campaign Extraction */}
      <CurrentCampaignCard snapshot={currentSnapshot} />

      {/* Tracked Sources & Status */}
      <SourceList sources={sources} />

      {/* Semantic Timeline of Changes */}
      <CampaignTimeline events={events} sources={sources} />
    </div>
  );
}
