import type { CampaignSnapshot } from "@campaign-lens/domain";
import { Card, CardHeader, CardTitle, CardContent } from "@campaign-lens/ui/components/card";
import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tag01Icon,
  CheckmarkCircle01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";

interface CurrentCampaignProps {
  snapshot: CampaignSnapshot | null;
}

export function CurrentCampaignCard({ snapshot }: CurrentCampaignProps) {
  if (!snapshot) {
    return (
      <Card className="border-dashed p-8 text-center bg-muted/20">
        <p className="text-sm text-muted-foreground">
          No campaign snapshot captured yet. Run a scan to establish baseline.
        </p>
      </Card>
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
    <Card className="bg-card">
      <CardHeader className="py-4 px-6 pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Current campaign
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 pt-2 space-y-6">
        <div className="space-y-3">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground leading-snug">
            {snapshot.headline ?? "No headline extracted"}
          </h2>

          {snapshot.offer && (
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3.5 py-1.5 text-sm font-semibold text-primary">
                <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-4 text-primary shrink-0" />
                <span>{snapshot.offer}</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground tracking-tight tabular-nums">
              {formatPrice(snapshot.pricing.amount, snapshot.pricing.currency)}
            </span>
            {snapshot.pricing.qualifier && (
              <span className="text-sm text-muted-foreground">
                · {snapshot.pricing.qualifier}
              </span>
            )}
          </div>

          {snapshot.primaryCta.label && (
            <Button variant="outline" size="sm" className="gap-2 self-start sm:self-auto">
              <span>{snapshot.primaryCta.label}</span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>

        {snapshot.guarantees && snapshot.guarantees.length > 0 && (
          <div className="pt-4 border-t border-border/60 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {snapshot.guarantees.map((guarantee, idx) => (
              <div key={idx} className="inline-flex items-center gap-1.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5 text-emerald-400 shrink-0" />
                <span>{guarantee}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
