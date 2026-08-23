import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@campaign-lens/ui/components/card";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@campaign-lens/ui/components/alert";
import { Separator } from "@campaign-lens/ui/components/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Store01Icon,
  RefreshIcon,
  ArrowRight01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  Tag01Icon,
  LinkSquare01Icon,
} from "@hugeicons/core-free-icons";
import { competitorsQueryOptions } from "../../features/competitors/api/competitor.queries.ts";

export const Route = createFileRoute("/competitors/")({
  component: CompetitorsIndexPage,
});

function CompetitorsIndexPage() {
  const { data, isLoading, error, refetch } = useQuery(competitorsQueryOptions());

  const competitors = data?.competitors ?? [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Competitors
        </h1>
        <p className="text-sm text-muted-foreground">
          Track public campaign positioning, offers and pricing over time.
        </p>
      </div>

      <Separator />

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Card className="p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <div className="pt-4 border-t border-border flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </Card>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Failed to load competitors</AlertTitle>
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
      ) : competitors.length === 0 ? (
        <Card className="border-dashed p-12 text-center bg-muted/20">
          <div className="mx-auto size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
            <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Tracked Competitors</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Trigger a scrape run from the API to seed Lumora and start tracking campaigns.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing {competitors.length} tracked competitor
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {competitors.map((comp) => (
              <Card
                key={comp.id}
                className="hover:border-border transition-colors bg-card"
              >
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-bold text-foreground">
                        {comp.name}
                      </CardTitle>
                      <a
                        href={comp.domain.startsWith("http") ? comp.domain : `https://${comp.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-mono transition-colors"
                      >
                        <span>{comp.domain}</span>
                        <HugeiconsIcon icon={LinkSquare01Icon} strokeWidth={2} className="size-3 text-muted-foreground" />
                      </a>
                    </div>

                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 text-xs self-start sm:self-auto">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-emerald-400" />
                      <span>Healthy</span>
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2 py-2">
                  <p className="text-sm font-medium text-foreground">
                    Smarter lighting. Simpler living.
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-3.5" />
                    <span>Free Pro Upgrade with every Starter Kit</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-base font-bold text-foreground tabular-nums">
                      ₹2,299
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground tabular-nums">2 changes recorded</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link to="/competitors/$competitorId" params={{ competitorId: comp.id }} />}
                    className="gap-1.5 text-xs w-full sm:w-auto"
                  >
                    <span>View Intelligence</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
