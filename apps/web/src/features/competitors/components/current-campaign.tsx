import type { CampaignSnapshot } from "@campaign-lens/domain";
import { Tag, ShieldCheck, ArrowUpRight, Sparkles } from "lucide-react";

interface CurrentCampaignCardProps {
  snapshot: CampaignSnapshot | null;
}

export function CurrentCampaignCard({ snapshot }: CurrentCampaignCardProps) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-8 text-center text-zinc-500 font-mono text-sm">
        No active campaign snapshot captured yet. Run a scan to baseline this competitor.
      </div>
    );
  }

  const formatPrice = (amount: number | null, currency: string | null) => {
    if (amount === null) return "N/A";
    if (currency === "INR") {
      return `₹${amount.toLocaleString("en-IN")}`;
    }
    return `${currency ?? ""}${amount}`;
  };

  return (
    <div className="rounded-xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
            Active Campaign Intelligence
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-2 py-0.5 text-[11px] font-mono font-medium text-amber-400 border border-amber-400/20">
          Extracted Hero Campaign
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
              Headline
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-editorial leading-snug">
              {snapshot.headline ?? "No headline extracted"}
            </h3>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1.5">
              Active Promotional Offer
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-sm font-semibold text-amber-300">
              <Tag className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>{snapshot.offer ?? "No active discount offer"}</span>
            </div>
          </div>

          {snapshot.guarantees && snapshot.guarantees.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">
                Guarantees & Assurances
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshot.guarantees.map((guarantee, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/90 px-2.5 py-1 text-xs text-zinc-300 font-mono"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    {guarantee}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-5 lg:col-span-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
              Hero Price Point
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                {formatPrice(snapshot.pricing.amount, snapshot.pricing.currency)}
              </span>
              {snapshot.pricing.qualifier && (
                <span className="text-xs text-zinc-400 font-mono">
                  / {snapshot.pricing.qualifier}
                </span>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800/80 mt-4 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              Primary Call-to-Action
            </div>
            <div className="flex items-center justify-between rounded-md border border-zinc-700 bg-zinc-800/90 px-3.5 py-2 text-xs font-medium text-zinc-200">
              <span>{snapshot.primaryCta.label ?? "Get Started"}</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
