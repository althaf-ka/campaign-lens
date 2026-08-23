import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  Tag01Icon,
  Mouse01Icon,
  TextIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { CampaignEventRecord, CampaignEventType } from "../types.ts";

interface CampaignEventCardProps {
  event: CampaignEventRecord;
  sourceName?: string;
}

function getEventMetadata(type: CampaignEventType) {
  switch (type) {
    case "price_changed":
      return {
        label: "Price Change",
        badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        icon: <HugeiconsIcon icon={ArrowUp01Icon} strokeWidth={2} className="size-3.5 text-emerald-400" />,
      };
    case "offer_changed":
      return {
        label: "Promotional Shift",
        badgeClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        icon: <HugeiconsIcon icon={Tag01Icon} strokeWidth={2} className="size-3.5 text-amber-400" />,
      };
    case "cta_changed":
      return {
        label: "CTA Update",
        badgeClass: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
        icon: <HugeiconsIcon icon={Mouse01Icon} strokeWidth={2} className="size-3.5 text-cyan-400" />,
      };
    case "headline_changed":
      return {
        label: "Headline Change",
        badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/30",
        icon: <HugeiconsIcon icon={TextIcon} strokeWidth={2} className="size-3.5 text-purple-400" />,
      };
  }
}

export function CampaignEventCard({ event, sourceName }: CampaignEventCardProps) {
  const meta = getEventMetadata(event.type);
  const detectedDate = new Date(event.detectedAt);
  const formattedTime = detectedDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const formattedDate = detectedDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const beforeValue = event.before?.value ?? event.before;
  const afterValue = event.after?.value ?? event.after;

  // Render before/after based on event type
  const renderDiffContent = () => {
    if (event.type === "price_changed") {
      const beforeNum = typeof beforeValue === "number" ? beforeValue : Number(beforeValue);
      const afterNum = typeof afterValue === "number" ? afterValue : Number(afterValue);
      const diff = afterNum - beforeNum;
      const percentChange = ((diff / beforeNum) * 100).toFixed(1);
      const isIncrease = diff > 0;

      return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-2">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-base sm:text-lg text-muted-foreground line-through">
              ₹{beforeNum.toLocaleString("en-IN")}
            </span>
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4 text-muted-foreground" />
            <span className="text-xl font-bold text-foreground">
              ₹{afterNum.toLocaleString("en-IN")}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-medium ${
              isIncrease
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
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
          </div>
        </div>
      );
    }

    if (event.type === "offer_changed") {
      return (
        <div className="space-y-2.5 py-1">
          <div className="rounded-lg border border-rose-900/40 bg-rose-950/20 p-3 text-xs text-rose-300 line-through">
            <span className="text-[10px] uppercase font-mono text-rose-500 block mb-0.5">Previous Offer</span>
            {String(beforeValue ?? "None")}
          </div>

          <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 p-3 text-xs text-emerald-200 font-medium">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-0.5">New Offer Detected</span>
            {String(afterValue ?? "None")}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 text-xs">
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-muted-foreground">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-0.5">Previous</span>
          {String(beforeValue ?? "None")}
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/80 p-3 text-foreground font-medium">
          <span className="text-[10px] uppercase font-mono text-muted-foreground block mb-0.5">Updated</span>
          {String(afterValue ?? "None")}
        </div>
      </div>
    );
  };

  return (
    <div className="relative rounded-xl border border-border/90 bg-card/60 p-5 backdrop-blur-sm transition-all hover:border-primary/40 hover:bg-card/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
            {meta.icon}
            {meta.label}
          </div>
          {sourceName && (
            <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
              · {sourceName}
            </span>
          )}
        </div>

        <div className="text-xs text-muted-foreground font-mono">
          <span className="text-foreground font-medium">{formattedTime}</span>
          <span className="text-muted-foreground mx-1.5">·</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="mt-3.5">{renderDiffContent()}</div>
    </div>
  );
}
