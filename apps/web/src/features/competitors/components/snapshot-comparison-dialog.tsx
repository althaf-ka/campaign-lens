import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@campaign-lens/ui/components/sheet";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Skeleton } from "@campaign-lens/ui/components/skeleton";
import { Separator } from "@campaign-lens/ui/components/separator";
import { Card, CardContent } from "@campaign-lens/ui/components/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, Tag01Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { eventComparisonQueryOptions } from "../api/competitor.queries.ts";

interface SnapshotComparisonDialogProps {
  eventId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SnapshotComparisonDialog({
  eventId,
  open,
  onOpenChange,
}: SnapshotComparisonDialogProps) {
  const { data, isLoading, error } = useQuery({
    ...eventComparisonQueryOptions(eventId ?? ""),
    enabled: Boolean(eventId && open),
  });

  const event = data?.event;
  const before = data?.before;
  const after = data?.after;
  const changedFields = new Set(data?.changedFields ?? []);

  const formattedDate = event?.detectedAt
    ? new Date(event.detectedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background"
      >
        <SheetHeader className="p-6 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <SheetTitle className="text-lg font-bold text-foreground">
                Campaign Comparison
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Verified semantic change detected on {formattedDate}
              </SheetDescription>
            </div>
            {event && (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10 font-mono text-xs">
                {formatEventBadge(event.type)}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6 flex-1">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-none" />
              <Skeleton className="h-24 w-full rounded-none" />
              <Skeleton className="h-24 w-full rounded-none" />
            </div>
          ) : error || !data ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Failed to load comparison data.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Headline */}
              <ComparisonField
                label="Headline"
                isChanged={changedFields.has("headline_changed")}
                before={before?.headline}
                after={after.headline}
              />

              {/* Promotional Offer */}
              <ComparisonField
                label="Promotional Offer"
                isChanged={changedFields.has("offer_changed")}
                before={before?.offer}
                after={after.offer}
              />

              {/* Pricing */}
              <ComparisonField
                label="Price"
                isChanged={changedFields.has("price_changed")}
                before={
                  before?.pricing.amount !== null && before?.pricing.amount !== undefined
                    ? `₹${before.pricing.amount.toLocaleString()} ${before.pricing.qualifier ? `(${before.pricing.qualifier})` : ""}`
                    : null
                }
                after={
                  after.pricing.amount !== null && after.pricing.amount !== undefined
                    ? `₹${after.pricing.amount.toLocaleString()} ${after.pricing.qualifier ? `(${after.pricing.qualifier})` : ""}`
                    : null
                }
              />

              {/* Primary Call to Action */}
              <ComparisonField
                label="Primary CTA"
                isChanged={changedFields.has("cta_changed")}
                before={
                  before?.primaryCta.label
                    ? `${before.primaryCta.label} (${before.primaryCta.href || "#"})`
                    : null
                }
                after={
                  after.primaryCta.label
                    ? `${after.primaryCta.label} (${after.primaryCta.href || "#"})`
                    : null
                }
              />

              {/* Customer Guarantees */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Guarantees
                  </span>
                  {changedFields.has("guarantees_changed") && (
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10">
                      Changed
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 border border-border/60 bg-muted/10 space-y-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase block">
                      Before
                    </span>
                    {before?.guarantees && before.guarantees.length > 0 ? (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {before.guarantees.map((g, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <span className="size-1 rounded-full bg-muted-foreground shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Not detected</span>
                    )}
                  </div>

                  <div className="p-3 border border-border/60 bg-muted/20 space-y-1.5">
                    <span className="text-[11px] font-mono text-foreground font-semibold uppercase block">
                      After
                    </span>
                    {after.guarantees && after.guarantees.length > 0 ? (
                      <ul className="space-y-1 text-xs text-foreground">
                        {after.guarantees.map((g, i) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-emerald-500 shrink-0" />
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Not detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ComparisonFieldProps {
  label: string;
  isChanged: boolean;
  before: string | null | undefined;
  after: string | null | undefined;
}

function ComparisonField({
  label,
  isChanged,
  before,
  after,
}: ComparisonFieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
          {label}
        </span>
        {isChanged && (
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10"
          >
            Changed →
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Before */}
        <div className="p-3 border border-border/60 bg-muted/10 space-y-1">
          <span className="text-[11px] font-mono text-muted-foreground uppercase block">
            Before
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {before ?? <span className="italic text-muted-foreground/60">Not detected</span>}
          </p>
        </div>

        {/* After */}
        <div
          className={`p-3 border space-y-1 ${
            isChanged
              ? "border-primary/40 bg-primary/5"
              : "border-border/60 bg-muted/20"
          }`}
        >
          <span className="text-[11px] font-mono text-foreground font-semibold uppercase block">
            After
          </span>
          <p className="text-xs font-medium text-foreground leading-relaxed">
            {after ?? <span className="italic text-muted-foreground/60">Not detected</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatEventBadge(type: string): string {
  switch (type) {
    case "price_changed":
      return "Price updated";
    case "offer_changed":
      return "Offer updated";
    case "headline_changed":
      return "Headline updated";
    case "cta_changed":
      return "CTA updated";
    default:
      return "Campaign change";
  }
}
