import * as React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@campaign-lens/ui/components/alert";
import { Separator } from "@campaign-lens/ui/components/separator";
import { Card, CardContent } from "@campaign-lens/ui/components/card";
import { Input } from "@campaign-lens/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@campaign-lens/ui/components/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Store01Icon,
  Tag01Icon,
  ArrowRight01Icon,
  Activity01Icon,
  Search01Icon,
  AiBrain01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { activityQueryOptions } from "../features/activity/api/activity.queries.ts";
import type { ActivityItem } from "../features/activity/types.ts";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

type FilterType = "all" | "campaign" | "system";

function ActivityPage() {
  const { data, isLoading, isFetching, error, refetch } = useQuery(
    activityQueryOptions(),
  );
  const activities = React.useMemo(
    () => data?.activity ?? [],
    [data?.activity],
  );

  const [activeFilter, setActiveFilter] = React.useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCompetitor, setSelectedCompetitor] =
    React.useState<string>("all");

  // Extract unique competitor list for filtering
  const competitorOptions = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const item of activities) {
      if (item.competitorId && item.competitorName) {
        map.set(item.competitorId, item.competitorName);
      }
    }
    const list = [{ label: "All Competitors", value: "all" }];
    for (const [id, name] of map.entries()) {
      list.push({ label: name, value: id });
    }
    return list;
  }, [activities]);

  // Counts for summary metrics
  const campaignCount = activities.filter((a) => a.kind === "campaign").length;
  const systemCount = activities.filter((a) => a.kind === "system").length;
  const verifiedCount = activities.filter(
    (a) => a.kind === "system" && a.type === "monitor_succeeded",
  ).length;
  const issueCount = activities.filter(
    (a) =>
      a.kind === "system" &&
      (a.type === "extraction_degraded" ||
        a.type === "healing_started" ||
        a.type === "healing_failed"),
  ).length;

  // Filtered items
  const filteredActivities = React.useMemo(() => {
    return activities.filter((item) => {
      // Filter by type
      if (activeFilter === "campaign" && item.kind !== "campaign") return false;
      if (activeFilter === "system" && item.kind !== "system") return false;

      // Filter by competitor
      if (
        selectedCompetitor !== "all" &&
        item.competitorId !== selectedCompetitor
      ) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const compMatch =
          item.competitorName?.toLowerCase().includes(query) ?? false;
        const msgMatch = item.message.toLowerCase().includes(query);
        const srcMatch = item.sourceName.toLowerCase().includes(query);
        const titleMatch = getActivityTitle(item).toLowerCase().includes(query);
        return compMatch || msgMatch || srcMatch || titleMatch;
      }

      return true;
    });
  }, [activities, activeFilter, selectedCompetitor, searchQuery]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Activity Stream
            </h1>
            <Badge variant="outline" className="text-xs font-mono">
              {activities.length} total
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Chronological stream of detected competitor campaign updates and
            scraping operations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="gap-2 text-xs self-start sm:self-auto cursor-pointer"
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
          <span aria-live="polite">
            {isFetching ? "Refreshing…" : "Refresh stream"}
          </span>
        </Button>
      </div>

      <Separator />

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <HugeiconsIcon
              icon={Activity01Icon}
              strokeWidth={2}
              className="size-4 text-primary"
            />
            <span>Total Events</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {activities.length}
          </div>
        </Card>

        <Card className="bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <HugeiconsIcon
              icon={Tag01Icon}
              strokeWidth={2}
              className="size-4 text-primary"
            />
            <span>Campaign Shifts</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {campaignCount}
          </div>
        </Card>

        <Card className="bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              strokeWidth={2}
              className="size-4 text-emerald-400"
            />
            <span>Verified Runs</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">
            {verifiedCount}
          </div>
        </Card>

        <Card className="bg-card p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <HugeiconsIcon
              icon={AiBrain01Icon}
              strokeWidth={2}
              className="size-4 text-amber-400"
            />
            <span>Health & Healing</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {issueCount}
          </div>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/30 border border-border w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer text-center whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({activities.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("campaign")}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer text-center whitespace-nowrap ${
                activeFilter === "campaign"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Campaign Shifts ({campaignCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("system")}
              className={`flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer text-center whitespace-nowrap ${
                activeFilter === "system"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              System & Scrapers ({systemCount})
            </button>
          </div>

          {/* Competitor Dropdown Filter */}
          {competitorOptions.length > 2 && (
            <div className="w-full sm:w-56">
              <Select
                items={competitorOptions}
                value={selectedCompetitor}
                onValueChange={(val) => {
                  if (val) setSelectedCompetitor(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-card">
                  <SelectValue placeholder="All Competitors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {competitorOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <HugeiconsIcon
            icon={Search01Icon}
            strokeWidth={2}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
          />
          <Input
            aria-label="Search activity"
            name="activity-search"
            autoComplete="off"
            placeholder="Search messages, competitors, or events…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-9 bg-card"
          />
        </div>
      </div>

      {/* Stream Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-none" />
          <Skeleton className="h-24 w-full rounded-none" />
          <Skeleton className="h-24 w-full rounded-none" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <HugeiconsIcon
            icon={AlertCircleIcon}
            strokeWidth={2}
            className="size-4"
          />
          <AlertTitle>Failed to load activity stream</AlertTitle>
          <AlertDescription className="mt-2 flex items-center justify-between">
            <span className="text-xs">
              {error instanceof Error
                ? error.message
                : "An unexpected error occurred."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-1.5 text-xs cursor-pointer"
            >
              <HugeiconsIcon
                icon={RefreshIcon}
                strokeWidth={2}
                className="size-3.5"
              />
              <span>Retry</span>
            </Button>
          </AlertDescription>
        </Alert>
      ) : filteredActivities.length === 0 ? (
        <Card className="border-dashed p-12 text-center bg-muted/10">
          <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <HugeiconsIcon
              icon={Store01Icon}
              strokeWidth={2}
              className="size-5"
            />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {activities.length === 0
              ? "No Activity Recorded Yet"
              : "No Matching Events Found"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {activities.length === 0
              ? "Track a competitor or trigger scraping runs to generate live activity events."
              : "Try adjusting your category filter, competitor selection, or search keywords."}
          </p>
          {activities.length === 0 ? (
            <div className="mt-4">
              <Button
                size="sm"
                render={<Link to="/competitors/new" />}
                className="gap-2 text-xs"
              >
                <span>Track competitor</span>
              </Button>
            </div>
          ) : (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveFilter("all");
                  setSelectedCompetitor("all");
                  setSearchQuery("");
                }}
                className="text-xs"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {filteredActivities.length} event
              {filteredActivities.length === 1 ? "" : "s"}
            </span>
            <span className="font-mono">Newest first</span>
          </div>

          <div className="space-y-3">
            {filteredActivities.map((item) => (
              <ActivityCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const isCampaign = item.kind === "campaign";
  const dateObj = new Date(item.occurredAt);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const formattedTime = dateObj.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isCampaign) {
    const isPrice = item.type === "price_changed";
    const isOffer = item.type === "offer_changed";
    const isHeadline = item.type === "headline_changed";
    const isCta = item.type === "cta_changed";

    const beforeVal =
      (item.before as Record<string, unknown>)?.value ?? item.before;
    const afterVal =
      (item.after as Record<string, unknown>)?.value ?? item.after;

    return (
      <Card className="bg-card hover:border-border transition-colors">
        <CardContent className="p-4 sm:p-5 space-y-3">
          {/* Top metadata row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="text-[11px] font-mono border-primary/40 text-primary bg-primary/10"
              >
                {isPrice
                  ? "Price Updated"
                  : isOffer
                    ? "Promo Offer"
                    : isHeadline
                      ? "Headline"
                      : isCta
                        ? "Call To Action"
                        : "Campaign"}
              </Badge>

              {item.competitorName && (
                <>
                  <span className="text-muted-foreground text-xs">·</span>
                  <Link
                    to="/competitors/$competitorId"
                    params={{ competitorId: item.competitorId }}
                    className="text-xs font-bold text-foreground hover:underline"
                  >
                    {item.competitorName}
                  </Link>
                </>
              )}

              <span className="text-muted-foreground text-xs">·</span>
              <span className="text-xs text-muted-foreground">
                {item.sourceName}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
              <HugeiconsIcon
                icon={Clock01Icon}
                strokeWidth={2}
                className="size-3 text-muted-foreground"
              />
              <span>
                {formattedDate} · {formattedTime}
              </span>
            </div>
          </div>

          {/* Event description */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {item.message}
            </p>

            {/* Before / After visual difference */}
            {(beforeVal != null || afterVal != null) && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 bg-muted/20 border border-border text-xs">
                <div className="flex-1 space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                    Previous
                  </span>
                  <p className="text-muted-foreground line-through font-mono break-words">
                    {beforeVal ? String(beforeVal) : "None"}
                  </p>
                </div>

                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-3.5 text-primary shrink-0 rotate-90 sm:rotate-0 self-center"
                />

                <div className="flex-1 space-y-0.5 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-mono font-semibold">
                    Detected Change
                  </span>
                  <p className="text-foreground font-semibold font-mono break-words">
                    {afterVal ? String(afterVal) : "None"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card footer action */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-mono">
              Verified by Bright Data scraper
            </span>

            {item.competitorId && (
              <Button
                variant="ghost"
                size="xs"
                render={
                  <Link
                    to="/competitors/$competitorId"
                    params={{ competitorId: item.competitorId }}
                  />
                }
                className="gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <span>View competitor</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  strokeWidth={2}
                  className="size-3"
                />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // System & Scraping Activity Card
  const isSucceeded = item.type === "monitor_succeeded";
  const isDegraded = item.type === "extraction_degraded";
  const isHealing = item.type === "healing_started";
  const isRecovered = item.type === "healing_recovered";
  const isFailed = item.type === "healing_failed";

  return (
    <Card
      className={`bg-card transition-colors ${
        isDegraded
          ? "border-amber-500/30 bg-amber-500/5"
          : isHealing
            ? "border-cyan-500/30 bg-cyan-500/5"
            : isRecovered
              ? "border-emerald-500/30 bg-emerald-500/5"
              : isFailed
                ? "border-destructive/30 bg-destructive/5"
                : "border-border"
      }`}
    >
      <CardContent className="p-4 sm:p-5 space-y-3">
        {/* Top metadata row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ActivityBadge item={item} />

            {item.competitorName && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <Link
                  to="/competitors/$competitorId"
                  params={{ competitorId: item.competitorId }}
                  className="text-xs font-bold text-foreground hover:underline"
                >
                  {item.competitorName}
                </Link>
              </>
            )}

            <span className="text-muted-foreground text-xs">·</span>
            <span className="text-xs text-muted-foreground">
              {item.sourceName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
            <HugeiconsIcon
              icon={Clock01Icon}
              strokeWidth={2}
              className="size-3 text-muted-foreground"
            />
            <span>
              {formattedDate} · {formattedTime}
            </span>
          </div>
        </div>

        {/* Event description */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">
            {getActivityTitle(item)}
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {item.message}
          </p>

          {/* Formatted metadata tags */}
          {item.metadata &&
            typeof item.metadata === "object" &&
            Object.keys(item.metadata).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5 max-w-full overflow-hidden">
                {Object.entries(item.metadata).map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 bg-muted/40 border border-border/60 text-muted-foreground max-w-full break-all"
                  >
                    <span className="font-semibold text-foreground/80 shrink-0">
                      {key}:
                    </span>
                    <span className="break-all truncate">
                      {typeof val === "object"
                        ? JSON.stringify(val)
                        : String(val)}
                    </span>
                  </span>
                ))}
              </div>
            )}
        </div>

        {/* Card footer action */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground font-mono">
            {isSucceeded
              ? "All selectors validated"
              : isHealing
                ? "Bright Data AI Self-Healing in progress"
                : isRecovered
                  ? "Scraper Studio collector healed"
                  : isDegraded
                    ? "Selector drift detected"
                    : "Bright Data infrastructure event"}
          </span>

          {item.competitorId && (
            <Button
              variant="ghost"
              size="xs"
              render={
                <Link
                  to="/competitors/$competitorId"
                  params={{ competitorId: item.competitorId }}
                />
              }
              className="gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>View competitor</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                strokeWidth={2}
                className="size-3"
              />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityBadge({ item }: { item: ActivityItem }) {
  if (item.kind === "campaign") {
    return (
      <Badge
        variant="outline"
        className="border-primary/40 text-primary bg-primary/10 text-[11px] font-mono"
      >
        Campaign change
      </Badge>
    );
  }

  switch (item.type) {
    case "monitor_succeeded":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px] font-mono"
        >
          Verified Capture
        </Badge>
      );
    case "extraction_degraded":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px] font-mono"
        >
          Degraded
        </Badge>
      );
    case "healing_started":
      return (
        <Badge
          variant="outline"
          className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[11px] font-mono"
        >
          AI Self-Healing
        </Badge>
      );
    case "healing_unavailable":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[11px] font-mono"
        >
          Healing Paused
        </Badge>
      );
    case "healing_recovered":
      return (
        <Badge
          variant="outline"
          className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[11px] font-mono"
        >
          Recovered
        </Badge>
      );
    case "healing_failed":
      return (
        <Badge variant="destructive" className="text-[11px] font-mono">
          Needs Review
        </Badge>
      );
    case "monitor_started":
    default:
      return (
        <Badge
          variant="outline"
          className="text-muted-foreground bg-muted text-[11px] font-mono"
        >
          Monitoring Run
        </Badge>
      );
  }
}

function getActivityTitle(item: ActivityItem): string {
  if (item.kind === "campaign") {
    switch (item.type) {
      case "price_changed":
        return "Competitor price shift";
      case "offer_changed":
        return "Promotional offer updated";
      case "headline_changed":
        return "Hero headline updated";
      case "cta_changed":
        return "Call to action updated";
      default:
        return "Campaign change detected";
    }
  }

  switch (item.type) {
    case "monitor_succeeded":
      return "Scraper Studio monitoring verified";
    case "extraction_degraded":
      return "Competitor page layout changed";
    case "healing_started":
      return "AI Self-Healing triggered";
    case "healing_unavailable":
      return "Self-Healing temporarily unavailable";
    case "healing_recovered":
      return "Collector schema successfully repaired";
    case "healing_failed":
      return "Self-Healing requires developer review";
    case "monitor_started":
      return "Scheduled monitoring run initiated";
    default:
      return "System activity";
  }
}
