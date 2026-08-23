import * as React from "react";
import { Card, CardHeader, CardContent } from "@campaign-lens/ui/components/card";
import { Badge } from "@campaign-lens/ui/components/badge";
import { Button } from "@campaign-lens/ui/components/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  Tag01Icon,
  Mouse01Icon,
  TextIcon,
  ArrowRight01Icon,
  EyeIcon,
} from "@hugeicons/core-free-icons";
import type { CampaignEventRecord, CampaignEventType } from "../types.ts";
import { SnapshotComparisonDialog } from "./snapshot-comparison-dialog.tsx";

interface CampaignEventProps {
  event: CampaignEventRecord;
  sourceName?: string;
}

function getEventBadge(type: CampaignEventType) {
  switch (type) {
    case "price_changed":
      return {
        label: "Price changed",
        variant: "outline" as const,
        className: "border-primary/30 text-primary bg-primary/10 gap-1 text-xs font-medium",
        icon: <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3 text-primary" />,
      };
    case "offer_changed":
      return {
        label: "Offer changed",
        variant: "outline" as const,
        className: "border-primary/30 text-primary bg-primary/10 gap-1 text-xs font-medium",
        icon: <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-3 text-primary" />,
      };
    case "cta_changed":
      return {
        label: "CTA changed",
        variant: "outline" as const,
        className: "border-cyan-500/30 text-cyan-400 bg-cyan-500/10 gap-1 text-xs font-medium",
        icon: <HugeiconsIcon icon={Mouse01Icon} strokeWidth={2} className="size-3 text-cyan-400" />,
      };
    case "headline_changed":
      return {
        label: "Headline changed",
        variant: "outline" as const,
        className: "border-purple-500/30 text-purple-400 bg-purple-500/10 gap-1 text-xs font-medium",
        icon: <HugeiconsIcon icon={TextIcon} strokeWidth={2} className="size-3 text-purple-400" />,
      };
  }
}

export function CampaignEvent({ event, sourceName }: CampaignEventProps) {
  const [comparisonOpen, setComparisonOpen] = React.useState(false);
  const badgeInfo = getEventBadge(event.type);
  const detectedDate = new Date(event.detectedAt);
  const formattedTime = detectedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const formattedDate = detectedDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  const beforeValue = event.before?.value ?? event.before;
  const afterValue = event.after?.value ?? event.after;

  const cleanSourceName = sourceName ? sourceName.replace(/\s*Campaign$/i, "") : "Homepage";

  const renderContent = () => {
    if (event.type === "price_changed") {
      const beforeNum = typeof beforeValue === "number" ? beforeValue : Number(beforeValue);
      const afterNum = typeof afterValue === "number" ? afterValue : Number(afterValue);
      const diff = afterNum - beforeNum;
      const percentChange = ((diff / beforeNum) * 100).toFixed(1);
      const isIncrease = diff > 0;

      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-2.5 text-base sm:text-lg">
              <span className="text-muted-foreground line-through">
                ₹{beforeNum.toLocaleString("en-IN")}
              </span>
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                ₹{afterNum.toLocaleString("en-IN")}
              </span>
            </div>

            <Badge
              variant="outline"
              className={`text-xs gap-1 py-0.5 px-2 font-medium ${
                isIncrease
                  ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  : "border-destructive/30 text-destructive bg-destructive/10"
              }`}
            >
              <HugeiconsIcon
                icon={isIncrease ? ArrowUp01Icon : ArrowDown01Icon}
                strokeWidth={2}
                className="size-3"
              />
              <span>
                {isIncrease ? `+₹${diff.toLocaleString("en-IN")}` : `-₹${Math.abs(diff).toLocaleString("en-IN")}`} ({isIncrease ? `+${percentChange}%` : `${percentChange}%`})
              </span>
            </Badge>
          </div>
        </div>
      );
    }

    if (event.type === "offer_changed") {
      return (
        <div className="space-y-2.5 text-sm">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-medium">Previous offer</span>
            <p className="text-muted-foreground line-through text-sm">
              {String(beforeValue ?? "None")}
            </p>
          </div>

          <div className="space-y-0.5 pt-2 border-t border-border/40">
            <span className="text-xs text-primary font-medium">Current offer</span>
            <p className="text-foreground font-medium text-sm">
              {String(afterValue ?? "None")}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-0.5">
          <span className="text-xs text-muted-foreground font-medium">Previous</span>
          <p className="text-muted-foreground text-sm">{String(beforeValue ?? "None")}</p>
        </div>
        <div className="space-y-0.5">
          <span className="text-xs text-foreground font-medium">Updated</span>
          <p className="text-foreground font-medium text-sm">{String(afterValue ?? "None")}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="bg-card hover:border-border transition-colors">
        <CardHeader className="py-3 px-5 flex flex-row items-center justify-between space-y-0 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Badge variant={badgeInfo.variant} className={badgeInfo.className}>
              {badgeInfo.icon}
              <span>{badgeInfo.label}</span>
            </Badge>
            <span className="text-xs text-muted-foreground">
              · {cleanSourceName}
            </span>
          </div>

          <div className="text-xs text-muted-foreground">
            {formattedDate} · {formattedTime}
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-3">
          {renderContent()}

          <div className="pt-2 border-t border-border/40 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setComparisonOpen(true)}
              className="text-xs text-primary hover:text-primary gap-1.5 h-7 px-2 cursor-pointer font-medium"
            >
              <HugeiconsIcon icon={EyeIcon} strokeWidth={2} className="size-3" />
              <span>View comparison</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <SnapshotComparisonDialog
        eventId={event.id}
        open={comparisonOpen}
        onOpenChange={setComparisonOpen}
      />
    </>
  );
}
