import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  RefreshIcon,
  ArrowLeft01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@campaign-lens/ui/components/button";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@campaign-lens/ui/components/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@campaign-lens/ui/components/card";
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
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const { data, isLoading, error, refetch } = useQuery(
    competitorQueryOptions(competitorId),
  );

  if (isLoading) {
    return (
      <div className="space-y-8 pb-12 max-w-4xl">
        <div className="flex items-center justify-between pb-6 border-b border-border">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>

        <div className="rounded-none border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
        </div>

        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-28 w-full rounded-none" />
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
  const isDegraded = primarySource?.health === "degraded";

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* 1. Competitor Header */}
      <CompetitorHeader competitor={competitor} primarySource={primarySource} />

      {/* 2. Latest Verified Campaign */}
      <CurrentCampaignCard snapshot={currentSnapshot} isDegraded={isDegraded} />

      {/* 3. Semantic Timeline of Campaign Changes */}
      <CampaignTimeline events={events} sources={sources} />

      {/* 4. Collapsible System Health & Technical Details */}
      <div className="pt-4 border-t border-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              System health
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono ${
                isDegraded
                  ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                  : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
              }`}
            >
              {isDegraded ? "Monitoring degraded · Self-healing queued" : "Monitoring active"}
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-7 cursor-pointer"
          >
            <HugeiconsIcon
              icon={showTechnicalDetails ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={2}
              className="size-3"
            />
            <span>{showTechnicalDetails ? "Hide technical details" : "View technical details"}</span>
          </Button>
        </div>

        {showTechnicalDetails && (
          <div className="space-y-4 pt-2">
            <SourceList sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}
