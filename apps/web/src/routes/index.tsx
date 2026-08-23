import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Eye,
  ArrowRight,
  Sparkles,
  Activity,
  ShieldCheck,
  Building2,
  RefreshCw,
} from "lucide-react";
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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-400">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous Competitor Campaign Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-editorial">
          Tracked Competitor Intelligence
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl font-mono">
          Continuous real-time scraping via Bright Data Scraper Studio, domain schema validation, and deterministic semantic change diffing.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-44 bg-zinc-900 rounded-xl animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-900/40 bg-zinc-900/40 p-8 text-center">
          <p className="text-sm text-rose-400 font-mono mb-4">
            {error instanceof Error ? error.message : "Failed to load competitors"}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      ) : competitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-zinc-600 mb-3" />
          <h3 className="text-base font-semibold text-zinc-300">No Competitors Seeded</h3>
          <p className="text-xs text-zinc-500 font-mono mt-1">
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
              className="group rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all hover:border-amber-400/40 hover:bg-zinc-900/80 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white font-editorial group-hover:text-amber-300 transition-colors">
                    {comp.name}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400">{comp.domain}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span className="inline-flex items-center gap-1.5 text-zinc-300 group-hover:text-amber-300 transition-colors">
                  View Campaign Intelligence <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="text-zinc-600">ID: {comp.id.slice(0, 8)}...</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
