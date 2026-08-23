import { queryOptions } from "@tanstack/react-query";
import type { ActivityResponse } from "../types.ts";
import { API_BASE_URL } from "../../../config/api.ts";

export async function fetchAllActivity(): Promise<ActivityResponse> {
  const res = await fetch(`${API_BASE_URL}/activity`);
  if (!res.ok) {
    throw new Error(`Failed to fetch system activity: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCompetitorActivity(competitorId: string): Promise<ActivityResponse> {
  const res = await fetch(`${API_BASE_URL}/competitors/${competitorId}/activity`);
  if (!res.ok) {
    throw new Error(`Failed to fetch competitor activity: ${res.statusText}`);
  }
  return res.json();
}

export function activityQueryOptions() {
  return queryOptions({
    queryKey: ["activity"],
    queryFn: fetchAllActivity,
    staleTime: 5_000,
  });
}

export function competitorActivityQueryOptions(competitorId: string) {
  return queryOptions({
    queryKey: ["competitor-activity", competitorId],
    queryFn: () => fetchCompetitorActivity(competitorId),
    staleTime: 5_000,
  });
}
