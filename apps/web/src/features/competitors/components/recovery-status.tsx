import { Badge } from "@campaign-lens/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  RefreshIcon,
  CheckmarkCircle01Icon,
  Alert02Icon,
  AlertCircleIcon,
  Shield01Icon,
} from "@hugeicons/core-free-icons";
import { isScrapeRunActive } from "@campaign-lens/domain";
import type {
  RecoveryRunRecord,
  RecoveryRunStatus,
  ScrapeRunRecord,
} from "../types.ts";

interface RecoveryStatusProps {
  scrapeRun?: ScrapeRunRecord | null;
  recovery?: RecoveryRunRecord | null;
  isStarting?: boolean;
  className?: string;
}

export function RecoveryStatus({
  scrapeRun,
  recovery,
  isStarting = false,
  className = "",
}: RecoveryStatusProps) {
  // 1. Initial trigger or active scrape run (collecting / running / processing)
  const isProcessing = scrapeRun?.status === "processing";
  const isCollecting =
    isStarting ||
    (isScrapeRunActive(scrapeRun?.status) && !isProcessing);

  if (isCollecting) {
    return (
      <div
        className={`p-3 border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className="size-3.5 text-primary animate-spin"
          />
          <span
            role="status"
            className="shimmer text-muted-foreground font-medium"
          >
            Checking competitor…
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10"
        >
          Scraper Studio Run
        </Badge>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div
        className={`p-3 border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className="size-3.5 text-primary animate-spin"
          />
          <span
            role="status"
            className="shimmer text-muted-foreground font-medium"
          >
            Verifying campaign data…
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10"
        >
          Contract Validation
        </Badge>
      </div>
    );
  }

  if (!recovery) return null;

  const status = recovery.status as RecoveryRunStatus;

  // 2. Active AI Self-Healing progression states
  if (
    status === "healing" ||
    status === "validating" ||
    status === "approving" ||
    status === "verifying"
  ) {
    let label = "Repairing scraper…";
    if (status === "validating") label = "Validating repaired extraction…";
    if (status === "approving") label = "Applying repair…";
    if (status === "verifying") label = "Verifying campaign…";

    return (
      <div
        className={`p-3 border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={RefreshIcon}
            strokeWidth={2}
            className="size-3.5 text-primary animate-spin"
          />
          <span
            role="status"
            className="shimmer text-muted-foreground font-medium"
          >
            {label}
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-primary/40 text-primary bg-primary/10"
        >
          Autonomous AI Healing
        </Badge>
      </div>
    );
  }

  // 3. Recovered (Terminal success)
  if (status === "recovered") {
    return (
      <div
        className={`p-3 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3 text-xs ${className}`}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={CheckmarkCircle01Icon}
            strokeWidth={2}
            className="size-3.5 text-emerald-400"
          />
          <span className="text-emerald-400 font-medium">
            Recovered · Scraper repaired and campaign verified.
          </span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-emerald-500/40 text-emerald-400"
        >
          Healthy
        </Badge>
      </div>
    );
  }

  // 4. Unavailable (Remote 503 · Terminal for current cycle)
  if (status === "unavailable") {
    return (
      <div
        className={`p-3 border border-amber-500/30 bg-amber-500/5 space-y-1.5 text-xs ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <HugeiconsIcon
              icon={Shield01Icon}
              strokeWidth={2}
              className="size-3.5"
            />
            <span>Recovery temporarily unavailable</span>
          </div>
          <Badge
            variant="outline"
            className="text-[10px] font-mono border-amber-500/40 text-amber-400"
          >
            Baseline Protected
          </Badge>
        </div>
        <p className="text-muted-foreground text-[11px] leading-relaxed">
          Last verified campaign protected · Automatic retry scheduled
        </p>
      </div>
    );
  }

  // 5. Needs Review (Terminal validation failure)
  if (status === "needs_review") {
    return (
      <div
        className={`p-3 border border-amber-500/30 bg-amber-500/5 space-y-1 text-xs ${className}`}
      >
        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
          <HugeiconsIcon
            icon={Alert02Icon}
            strokeWidth={2}
            className="size-3.5"
          />
          <span>Recovery needs review</span>
        </div>
        <p className="text-muted-foreground text-[11px]">
          The proposed extraction did not pass CampaignLens validation.
        </p>
      </div>
    );
  }

  // 6. Failed (Terminal error)
  return (
    <div
      className={`p-3 border border-destructive/30 bg-destructive/5 flex items-center gap-2 text-xs text-destructive ${className}`}
    >
      <HugeiconsIcon
        icon={AlertCircleIcon}
        strokeWidth={2}
        className="size-3.5"
      />
      <span>Recovery failed.</span>
    </div>
  );
}
