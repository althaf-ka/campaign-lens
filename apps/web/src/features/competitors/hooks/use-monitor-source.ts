import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  triggerSourceMonitor,
  triggerDebugLumoraRun,
  scrapeRunQueryOptions,
  advanceScrapeRun,
} from "../api/competitor.queries.ts";
import {
  isScrapeRunActive,
  type ScrapeRunStatus,
} from "@campaign-lens/domain";
import type { ScrapeRunRecord } from "../types.ts";

export interface UseMonitorSourceResult {
  isStarting: boolean;
  isActive: boolean;
  isCollecting: boolean;
  isProcessing: boolean;
  scrapeRun: ScrapeRunRecord | null;
  monitorNow: () => void;
  statusMessage: string | null;
}

export function useMonitorSource(
  sourceId: string | undefined,
  competitorId?: string,
): UseMonitorSourceResult {
  const queryClient = useQueryClient();
  const [activeRunId, setActiveRunId] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const advanceLockRef = React.useRef(false);

  // 1. Trigger initial monitoring (Returns HTTP 202 immediately)
  const startMonitorMutation = useMutation({
    mutationFn: async () => {
      if (sourceId) {
        return triggerSourceMonitor(sourceId);
      }
      await triggerDebugLumoraRun();
      return null;
    },
    onMutate: () => {
      setStatusMessage(null);
    },
    onSuccess: (data) => {
      if (data?.runId) {
        setActiveRunId(data.runId);
      } else {
        // Fallback for debug lumora run
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
        if (competitorId) {
          queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });
        }
      }
    },
    onError: (err: Error) => {
      console.error("Failed to initiate monitor:", err);
      setStatusMessage(err.message || "Failed to start monitoring");
      setTimeout(() => setStatusMessage(null), 5000);
    },
  });

  // 2. Poll active scrape run
  const { data: scrapeRunData } = useQuery({
    ...scrapeRunQueryOptions(activeRunId),
    enabled: Boolean(activeRunId),
    refetchInterval: (query) => {
      const status = query.state.data?.scrapeRun?.status;
      if (isScrapeRunActive(status)) {
        return 2000;
      }
      return false;
    },
  });

  const scrapeRun = scrapeRunData?.scrapeRun ?? null;
  const status = scrapeRun?.status;
  const isActive = Boolean(activeRunId && isScrapeRunActive(status));

  // 3. Advance active scrape run step by step
  const advanceMutation = useMutation({
    mutationFn: (runId: string) => advanceScrapeRun(runId),
    onSuccess: () => {
      advanceLockRef.current = false;
      if (activeRunId) {
        queryClient.invalidateQueries({ queryKey: ["scrape-runs", activeRunId] });
      }
    },
    onError: () => {
      advanceLockRef.current = false;
    },
  });

  React.useEffect(() => {
    if (
      activeRunId &&
      isActive &&
      !advanceMutation.isPending &&
      !advanceLockRef.current
    ) {
      advanceLockRef.current = true;
      advanceMutation.mutate(activeRunId);
    }
  }, [activeRunId, isActive, status, advanceMutation]);

  // 4. Handle terminal transitions
  const prevStatusRef = React.useRef<ScrapeRunStatus | undefined>(undefined);
  React.useEffect(() => {
    if (prevStatusRef.current && prevStatusRef.current !== status) {
      if (status === "succeeded") {
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
        if (competitorId) {
          queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });
        }
        queryClient.invalidateQueries({ queryKey: ["attention"] });
        queryClient.invalidateQueries({ queryKey: ["activity"] });
        setStatusMessage("Verified · No campaign changes");
        setActiveRunId(null);
        setTimeout(() => setStatusMessage(null), 5000);
      } else if (status === "failed" || status === "invalid") {
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
        if (competitorId) {
          queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });
        }
        if (sourceId) {
          queryClient.invalidateQueries({ queryKey: ["source-recovery", sourceId] });
        }
        queryClient.invalidateQueries({ queryKey: ["attention"] });
        queryClient.invalidateQueries({ queryKey: ["activity"] });
        setActiveRunId(null);
      }
    }
    prevStatusRef.current = status;
  }, [status, competitorId, sourceId, queryClient]);

  return {
    isStarting: startMonitorMutation.isPending,
    isActive,
    isCollecting: status === "collecting" || status === "running",
    isProcessing: status === "processing",
    scrapeRun,
    monitorNow: () => startMonitorMutation.mutate(),
    statusMessage,
  };
}
