import { Badge } from "@campaign-lens/ui/components/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle01Icon,
  Alert02Icon,
  SparklesIcon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";
import type { SourceHealth } from "../types.ts";

interface SourceHealthBadgeProps {
  health: SourceHealth;
  className?: string;
}

export function SourceHealthBadge({ health, className }: SourceHealthBadgeProps) {
  switch (health) {
    case "healthy":
      return (
        <Badge variant="outline" className={`border-emerald-500/30 text-emerald-400 bg-emerald-500/10 gap-1 font-medium ${className ?? ""}`}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3 text-emerald-400" />
          <span>Healthy</span>
        </Badge>
      );
    case "degraded":
      return (
        <Badge variant="outline" className={`border-amber-500/30 text-amber-400 bg-amber-500/10 gap-1 font-medium ${className ?? ""}`}>
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3 text-amber-400" />
          <span>Degraded</span>
        </Badge>
      );
    case "healing":
      return (
        <Badge variant="outline" className={`border-primary/30 text-primary bg-primary/10 gap-1 font-medium animate-pulse ${className ?? ""}`}>
          <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-3 text-primary" />
          <span>Self-Healing</span>
        </Badge>
      );
    case "needs_review":
      return (
        <Badge variant="destructive" className={`gap-1 font-medium ${className ?? ""}`}>
          <HugeiconsIcon icon={HelpCircleIcon} strokeWidth={2} className="size-3" />
          <span>Needs Review</span>
        </Badge>
      );
  }
}
