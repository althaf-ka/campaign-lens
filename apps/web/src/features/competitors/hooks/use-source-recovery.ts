import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sourceRecoveryQueryOptions,
  advanceSourceRecovery,
} from "../api/competitor.queries.ts";
import type { RecoveryRunRecord, SourceHealth } from "../types.ts";

export interface UseSourceRecoveryResult {
  recovery: RecoveryRunRecord | null;
  sourceHealth: SourceHealth | undefined;
  isLoading: boolean;
  isActive: boolean;
  isAdvancing: boolean;
  refetch: () => void;
}

const ACTIVE_STATUSES = ["healing", "validating", "approving", "verifying"];

export function useSourceRecovery(
  sourceId: string | undefined,
  competitorId?: string,
): UseSourceRecoveryResult {
  const queryClient = useQueryClient();
  const advanceLockRef = React.useRef(false);

  const { data, isLoading, refetch } = useQuery({
    ...sourceRecoveryQueryOptions(sourceId ?? ""),
    enabled: Boolean(sourceId),
    refetchInterval: (query) => {
      const status = query.state.data?.recovery?.status;
      if (status && ACTIVE_STATUSES.includes(status)) {
        return 2000;
      }
      return false;
    },
  });

  const advanceMutation = useMutation({
    mutationFn: (srcId: string) => advanceSourceRecovery(srcId),
    onSuccess: () => {
      advanceLockRef.current = false;
      queryClient.invalidateQueries({
        queryKey: ["source-recovery", sourceId],
      });
    },
    onError: () => {
      advanceLockRef.current = false;
    },
  });

  const recovery = data?.recovery ?? null;
  const sourceHealth = data?.sourceHealth;
  const status = recovery?.status;
  const isActive = Boolean(status && ACTIVE_STATUSES.includes(status));

  // Automatically advance one step while active
  React.useEffect(() => {
    if (
      sourceId &&
      isActive &&
      !advanceMutation.isPending &&
      !advanceLockRef.current
    ) {
      advanceLockRef.current = true;
      advanceMutation.mutate(sourceId);
    }
  }, [sourceId, isActive, status, advanceMutation]);

  // Invalidate parent competitor / activity / attention when terminal state is reached
  const prevStatusRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (prevStatusRef.current && prevStatusRef.current !== status) {
      if (status === "recovered" || status === "unavailable" || status === "needs_review" || status === "failed") {
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
        if (competitorId) {
          queryClient.invalidateQueries({ queryKey: ["competitors", competitorId] });
        }
        queryClient.invalidateQueries({ queryKey: ["attention"] });
        queryClient.invalidateQueries({ queryKey: ["activity"] });
      }
    }
    prevStatusRef.current = status;
  }, [status, competitorId, queryClient]);

  return {
    recovery,
    sourceHealth,
    isLoading,
    isActive,
    isAdvancing: advanceMutation.isPending,
    refetch,
  };
}
