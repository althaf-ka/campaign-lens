import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@campaign-lens/ui/components/alert";
import { Separator } from "@campaign-lens/ui/components/separator";
import { Card, CardContent } from "@campaign-lens/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Store01Icon,
  Tag01Icon,
  ArrowRight01Icon,
  Activity01Icon,
} from "@hugeicons/core-free-icons";
import { activityQueryOptions } from "../features/activity/api/activity.queries.ts";
import type { ActivityItem } from "../features/activity/types.ts";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  const { data, isLoading, error, refetch } = useQuery(activityQueryOptions());
  const activities = data?.activity ?? [];

  return (
    <div className="space-y-8 max-w-3xl pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Activity
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitoring, campaign changes and source recovery across CampaignLens.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
          <span>Refresh stream</span>
        </Button>
      </div>

      <Separator />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-none" />
          <Skeleton className="h-20 w-full rounded-none" />
          <Skeleton className="h-20 w-full rounded-none" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Failed to load activity stream</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span className="text-xs">
              {error instanceof Error ? error.message : "An unexpected error occurred."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs"
            >
              <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : activities.length === 0 ? (
        <Card className="border-dashed p-12 text-center bg-muted/20">
          <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Activity Recorded Yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Track a competitor or trigger monitoring to start generating operational and campaign events.
          </p>
          <div className="mt-4">
            <Button size="sm" render={<Link to="/competitors/new" />} className="gap-2 text-xs">
              <span>Track competitor</span>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-muted-foreground">
            Showing {activities.length} recent system and campaign event{activities.length > 1 ? "s" : ""}
          </div>

          <div className="divide-y divide-border/60 border-y border-border/60">
            {activities.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const dateObj = new Date(item.occurredAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="py-4 space-y-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ActivityBadge item={item} />
          <span className="text-xs font-semibold text-foreground">
            {getActivityTitle(item)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
          <span>
            {formattedDate} · {formattedTime}
          </span>
          {item.competitorId && (
            <>
              <span>·</span>
              <Link
                to="/competitors/$competitorId"
                params={{ competitorId: item.competitorId }}
                className="hover:text-foreground underline underline-offset-2"
              >
                {item.competitorName ?? "Competitor"}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="pl-0.5 space-y-1">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">{item.sourceName}</span> · {item.message}
        </p>

        {item.kind === "system" && item.metadata && Object.keys(item.metadata).length > 0 && (
          <div className="text-[11px] text-muted-foreground/80 font-mono bg-muted/30 px-2 py-1 inline-block border border-border/40">
            {Object.entries(item.metadata)
              .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
              .join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityBadge({ item }: { item: ActivityItem }) {
  if (item.kind === "campaign") {
    return (
      <Badge variant="outline" className="border-primary/40 text-primary bg-primary/10 text-[11px] font-mono">
        Campaign change
      </Badge>
    );
  }

  switch (item.type) {
    case "monitor_succeeded":
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px] font-mono">
          Verified
        </Badge>
      );
    case "extraction_degraded":
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px] font-mono">
          Degraded
        </Badge>
      );
    case "healing_started":
      return (
        <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[11px] font-mono">
          Self-Healing
        </Badge>
      );
    case "healing_unavailable":
      return (
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px] font-mono">
          Recovery paused
        </Badge>
      );
    case "healing_recovered":
      return (
        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px] font-mono">
          Recovered
        </Badge>
      );
    case "healing_failed":
      return (
        <Badge variant="destructive" className="text-[11px] font-mono">
          Needs review
        </Badge>
      );
    case "monitor_started":
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground bg-muted text-[11px] font-mono">
          Monitoring
        </Badge>
      );
  }
}

function getActivityTitle(item: ActivityItem): string {
  if (item.kind === "campaign") {
    switch (item.type) {
      case "price_changed":
        return "Price updated";
      case "offer_changed":
        return "Promotional offer updated";
      case "headline_changed":
        return "Headline updated";
      case "cta_changed":
        return "Call to action updated";
      default:
        return "Campaign change detected";
    }
  }

  switch (item.type) {
    case "monitor_succeeded":
      return "Monitoring completed";
    case "extraction_degraded":
      return "Website structure changed";
    case "healing_started":
      return "Bright Data AI Self-Healing requested";
    case "healing_unavailable":
      return "Self-Healing temporarily disabled";
    case "healing_recovered":
      return "Scraper Studio collector repaired";
    case "healing_failed":
      return "Self-Healing requires review";
    case "monitor_started":
      return "Source monitoring started";
    default:
      return "System activity";
  }
}
