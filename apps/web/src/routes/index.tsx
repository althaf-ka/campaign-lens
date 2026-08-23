import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@campaign-lens/ui/components/card";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@campaign-lens/ui/components/alert";
import { Separator } from "@campaign-lens/ui/components/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  RefreshIcon,
  ArrowRight01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  PlusSignIcon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import { competitorsQueryOptions } from "../features/competitors/api/competitor.queries.ts";
import { attentionQueryOptions } from "../features/attention/api/attention.queries.ts";
import type { AttentionItem } from "../features/attention/types.ts";
import { SnapshotComparisonDialog } from "../features/competitors/components/snapshot-comparison-dialog.tsx";

export const Route = createFileRoute("/")({
  component: OverviewPage,
});

function OverviewPage() {
  const {
    data: compData,
    isLoading: compLoading,
    error: compError,
    refetch: refetchComp,
  } = useQuery(competitorsQueryOptions());
  const {
    data: attData,
    isLoading: attLoading,
    error: attError,
    refetch: refetchAtt,
  } = useQuery(attentionQueryOptions());

  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(
    null,
  );
  const [comparisonOpen, setComparisonOpen] = React.useState(false);

  const competitors = compData?.competitors ?? [];
  const attentionItems = attData?.items ?? [];

  const handleOpenComparison = (eventId: string) => {
    setSelectedEventId(eventId);
    setComparisonOpen(true);
  };

  const handleRefreshAll = () => {
    refetchComp();
    refetchAtt();
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Competitor changes that need your attention.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            aria-label="Refresh overview data"
            className="gap-1.5 text-xs cursor-pointer"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span>Refresh</span>
          </Button>

          <Button
            size="sm"
            render={<Link to="/competitors/new" />}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <HugeiconsIcon
              icon={PlusSignIcon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span>Track competitor</span>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Section 1: Needs Attention */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Needs attention
            </h2>
            {attentionItems.length > 0 && (
              <Badge
                variant="secondary"
                className="text-xs font-mono tabular-nums"
              >
                {attentionItems.length}
              </Badge>
            )}
          </div>
        </div>

        {attLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full rounded-none" />
            <Skeleton className="h-24 w-full rounded-none" />
          </div>
        ) : attError ? (
          <Alert variant="destructive">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Failed to load attention stream</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {attError instanceof Error
                ? attError.message
                : "Unable to reach attention service."}
            </AlertDescription>
          </Alert>
        ) : attentionItems.length === 0 ? (
          <Card className="border-dashed p-8 text-center bg-muted/10">
            <div className="mx-auto size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-2">
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                strokeWidth={2}
                className="size-4 text-emerald-400"
              />
            </div>
            <h4 className="text-sm font-medium text-foreground">All Clear</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No recent price shifts or degraded sources detected across your
              tracked competitors.
            </p>
          </Card>
        ) : (
          <div className="divide-y divide-border/60 border border-border/60 bg-card">
            {attentionItems.map((item) => (
              <AttentionCard
                key={item.id}
                item={item}
                onViewChange={handleOpenComparison}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Tracked Competitors */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">
            Tracked competitors
          </h2>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/competitors" />}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            View all ({competitors.length}) →
          </Button>
        </div>

        {compLoading ? (
          <div className="grid grid-cols-1 gap-4">
            <Skeleton className="h-32 w-full rounded-none" />
          </div>
        ) : compError ? (
          <Alert variant="destructive">
            <HugeiconsIcon
              icon={AlertCircleIcon}
              strokeWidth={2}
              className="size-4"
            />
            <AlertTitle>Failed to load competitors</AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {compError instanceof Error
                ? compError.message
                : "Failed to load competitors."}
            </AlertDescription>
          </Alert>
        ) : competitors.length === 0 ? (
          <Card className="border-dashed p-10 text-center bg-muted/20">
            <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
              <HugeiconsIcon
                icon={Store01Icon}
                strokeWidth={2}
                className="size-5"
              />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No Competitors Tracked
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Start tracking a competitor to monitor promotional campaigns and
              price shifts.
            </p>
            <div className="mt-4">
              <Button
                size="sm"
                render={<Link to="/competitors/new" />}
                className="text-xs"
              >
                Track competitor
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {competitors.map((comp) => (
              <Card
                key={comp.id}
                className="hover:border-border transition-colors bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">
                        {comp.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground font-mono">
                        {comp.domain}
                      </CardDescription>
                    </div>

                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 text-xs self-start sm:self-auto"
                    >
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        strokeWidth={2}
                        className="size-3 text-emerald-400"
                      />
                      <span>Verified baseline</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="py-1">
                  <p className="text-xs text-muted-foreground">
                    Campaign and pricing changes are monitored from the
                    competitor&apos;s public pages.
                  </p>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground font-mono break-all">
                    {comp.domain}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    render={
                      <Link
                        to="/competitors/$competitorId"
                        params={{ competitorId: comp.id }}
                      />
                    }
                    className="gap-1.5 text-xs w-full sm:w-auto cursor-pointer"
                  >
                    <span>View competitor</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      strokeWidth={2}
                      className="size-3.5"
                    />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <SnapshotComparisonDialog
        eventId={selectedEventId}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />
    </div>
  );
}

function AttentionCard({
  item,
  onViewChange,
}: {
  item: AttentionItem;
  onViewChange: (eventId: string) => void;
}) {
  const isCampaign = item.kind === "campaign_change";
  const dateObj = new Date(item.occurredAt);
  const formattedTime = dateObj.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const formattedDate = dateObj.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  if (isCampaign) {
    const isPrice = item.eventType === "price_changed";
    const isOffer = item.eventType === "offer_changed";

    return (
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">
              {item.competitorName}
            </span>
            <span className="text-muted-foreground text-xs">·</span>
            <Badge
              variant="outline"
              className="text-[11px] font-mono border-primary/30 text-primary bg-primary/10"
            >
              {isPrice
                ? "Price changed"
                : isOffer
                  ? "Offer changed"
                  : "Campaign changed"}
            </Badge>
            <span className="text-[11px] text-muted-foreground font-mono ml-auto sm:ml-0">
              {formattedDate} · {formattedTime}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{item.title}</p>

            {isPrice && item.metric && (
              <div className="flex items-center gap-2 pt-0.5">
                <Badge
                  variant="outline"
                  className={`text-xs gap-1 font-mono ${
                    item.metric.isIncrease
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      : "border-destructive/30 text-destructive bg-destructive/10"
                  }`}
                >
                  <HugeiconsIcon
                    icon={
                      item.metric.isIncrease ? ArrowUp01Icon : ArrowDown01Icon
                    }
                    strokeWidth={2}
                    className="size-3"
                  />
                  <span>
                    {item.metric.diffFormatted} ({item.metric.percentFormatted})
                  </span>
                </Badge>
              </div>
            )}

            {isOffer && (
              <div className="text-xs text-muted-foreground space-y-0.5 pt-0.5">
                <p className="line-through text-muted-foreground/70">
                  {String(
                    (item.before as Record<string, unknown>)?.value ??
                      item.before ??
                      "",
                  )}
                </p>
                <p className="text-foreground font-medium">
                  →{" "}
                  {String(
                    (item.after as Record<string, unknown>)?.value ??
                      item.after ??
                      "",
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewChange(item.eventId)}
            className="text-xs gap-1.5 cursor-pointer h-8"
          >
            <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-3" />
            <span>View change</span>
          </Button>
        </div>
      </div>
    );
  }

  // Source issue card
  return (
    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-amber-500/5 hover:bg-amber-500/10 transition-colors">
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-foreground">
            {item.competitorName}
          </span>
          <span className="text-muted-foreground text-xs">·</span>
          <Badge
            variant="outline"
            className="text-[11px] font-mono border-amber-500/30 text-amber-400 bg-amber-500/10"
          >
            Degraded
          </Badge>
          <span className="text-[11px] text-muted-foreground font-mono ml-auto sm:ml-0">
            {formattedDate} · {formattedTime}
          </span>
        </div>

        <p className="text-xs font-semibold text-foreground">{item.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {item.summary}
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        <Button
          variant="outline"
          size="sm"
          render={
            <Link
              to="/competitors/$competitorId"
              params={{ competitorId: item.competitorId }}
            />
          }
          className="text-xs gap-1.5 cursor-pointer h-8"
        >
          <span>View competitor</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-3"
          />
        </Button>
      </div>
    </div>
  );
}
