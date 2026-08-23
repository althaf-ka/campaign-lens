import type { CampaignSnapshot } from "@campaign-lens/domain";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tag01Icon,
  ShieldCheckIcon,
  ArrowUpRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface CurrentCampaignCardProps {
  snapshot: CampaignSnapshot | null;
}

export function CurrentCampaignCard({ snapshot }: CurrentCampaignCardProps) {
  if (!snapshot) {
    return (
      <div className="rounded-xl border border-border/80 bg-card/30 p-8 text-center text-muted-foreground font-mono text-sm">
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
    <div className="rounded-xl border border-border/90 bg-card/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-primary" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
            Active Campaign Intelligence
          </h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-mono font-medium text-primary border border-primary/20">
          Hero Campaign Extraction
        </span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Extracted Headline
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-editorial leading-snug">
              {snapshot.headline ?? "No headline extracted"}
            </h3>
          </div>

          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
              Active Promotional Offer
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary">
              <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4 text-primary flex-shrink-0" />
              <span>{snapshot.offer ?? "No active discount offer"}</span>
            </div>
          </div>

          {snapshot.guarantees && snapshot.guarantees.length > 0 && (
            <div className="pt-2">
              <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Guarantees & Assurances
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshot.guarantees.map((guarantee, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground font-mono"
                  >
                    <HugeiconsIcon icon={ShieldCheckIcon} strokeWidth={2} className="size-3 text-emerald-400" />
                    {guarantee}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-lg border border-border/80 bg-background/60 p-5 lg:col-span-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
              Hero Price Point
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-mono">
                {formatPrice(snapshot.pricing.amount, snapshot.pricing.currency)}
              </span>
              {snapshot.pricing.qualifier && (
                <span className="text-xs text-muted-foreground font-mono">
                  / {snapshot.pricing.qualifier}
                </span>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border/80 mt-4 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Primary Call-to-Action
            </div>
            <div className="flex items-center justify-between rounded-md border border-border bg-muted/80 px-3.5 py-2 text-xs font-medium text-foreground">
              <span>{snapshot.primaryCta.label ?? "Get Started"}</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
