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
  CpuIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@campaign-lens/ui/components/button";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@campaign-lens/ui/components/alert";
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
      <div className="space-y-8 pb-12 max-w-4xl mx-auto">
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
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Failed to load competitor</AlertTitle>
          <AlertDescription className="mt-1 text-xs">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred while fetching competitor intelligence."}
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link to="/competitors" />}
            className="gap-1.5 text-xs"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span>Back to Competitors</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer gap-1.5 text-xs"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className="size-3.5"
            />
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
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* 1. Competitor Header */}
      <CompetitorHeader competitor={competitor} primarySource={primarySource} />

      {/* 2. Latest Verified Campaign */}
      <CurrentCampaignCard snapshot={currentSnapshot} isDegraded={isDegraded} />

      {/* 3. Semantic Timeline of Campaign Changes */}
      <CampaignTimeline events={events} sources={sources} />

      {/* 4. Collapsible System Health & Technical Details */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-card border border-border">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <div className="size-8 rounded-none bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <HugeiconsIcon icon={CpuIcon} strokeWidth={2} className="size-4" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">
                  Scraper Health
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono shrink-0 ${
                    isDegraded
                      ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full mr-1.5 inline-block ${
                      isDegraded ? "bg-amber-400" : "bg-emerald-400"
                    } motion-safe:animate-pulse`}
                  />
                  <span>{isDegraded ? "Self-Healing" : "Active & Verified"}</span>
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate hidden xs:block">
                Bright Data Scraper Studio collector telemetry
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs gap-1.5 h-8 px-2.5 sm:px-3 cursor-pointer shrink-0"
          >
            <HugeiconsIcon
              icon={showTechnicalDetails ? ArrowUp01Icon : ArrowDown01Icon}
              strokeWidth={2}
              className="size-3 text-muted-foreground"
            />
            <span className="hidden sm:inline">
              {showTechnicalDetails
                ? "Hide technical details"
                : "View technical details"}
            </span>
            <span className="inline sm:hidden">
              {showTechnicalDetails ? "Hide" : "Details"}
            </span>
          </Button>
        </div>

        {showTechnicalDetails && (
          <div className="space-y-4 pt-1">
            <SourceList sources={sources} />
          </div>
        )}
      </div>
    </div>
  );
}
