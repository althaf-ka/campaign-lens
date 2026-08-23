import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SparklesIcon,
  Store01Icon,
  RefreshIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@campaign-lens/ui/components/button";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { competitorsQueryOptions } from "../features/competitors/api/competitor.queries.ts";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useQuery(competitorsQueryOptions());

  const competitors = data?.competitors ?? [];

  // Automatically navigate to Lumora if exactly 1 competitor is tracked
  useEffect(() => {
    if (competitors.length === 1 && competitors[0]) {
      navigate({
        to: "/competitors/$competitorId",
        params: { competitorId: competitors[0].id },
      });
    }
  }, [competitors, navigate]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3.5" />
          Autonomous Competitor Campaign Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-editorial">
          Tracked Competitor Intelligence
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl font-mono">
          Continuous real-time scraping via Bright Data Scraper Studio, domain schema validation, and deterministic semantic change diffing.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/40 bg-card/40 p-8 text-center">
          <p className="text-sm text-destructive font-mono mb-4">
            {error instanceof Error ? error.message : "Failed to load competitors"}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="cursor-pointer gap-2"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-3.5" />
            Retry
          </Button>
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/20 p-12 text-center">
          <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="mx-auto size-8 text-muted-foreground mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Competitors Seeded</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            Trigger a debug run on the API to seed Lumora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {competitors.map((comp) => (
            <Link
              key={comp.id}
              to="/competitors/$competitorId"
              params={{ competitorId: comp.id }}
              className="group rounded-xl border border-border/80 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/80 cursor-pointer shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-foreground font-editorial group-hover:text-primary transition-colors">
                    {comp.name}
                  </h3>
                  <p className="text-xs font-mono text-muted-foreground">{comp.domain}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span className="inline-flex items-center gap-1.5 text-foreground group-hover:text-primary transition-colors">
                  View Campaign Intelligence
                  <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-3.5 transform group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-muted-foreground">ID: {comp.id.slice(0, 8)}...</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
