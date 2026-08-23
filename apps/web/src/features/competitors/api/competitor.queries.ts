import { queryOptions } from "@tanstack/react-query";
import type { CompetitorDetailResponse, CompetitorListResponse } from "../types.ts";

export const API_BASE_URL =
  typeof window !== "undefined"
    ? (import.meta.env.VITE_API_URL || "http://localhost:8787")
    : (process.env.VITE_API_URL || "http://localhost:8787");

export async function fetchCompetitors(): Promise<CompetitorListResponse> {
  const res = await fetch(`${API_BASE_URL}/competitors`);
  if (!res.ok) {
    throw new Error(`Failed to fetch competitors: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCompetitor(id: string): Promise<CompetitorDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/competitors/${id}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Competitor not found.");
    }
    throw new Error(`Failed to fetch competitor details: ${res.statusText}`);
  }
  return res.json();
}

export async function triggerSourceRun(sourceId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/sources/${sourceId}/run`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Source execution failed with HTTP ${res.status}`,
    );
  }
  return res.json();
}

export async function triggerDebugLumoraRun(): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/debug/lumora/run`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error?.message || `Lumora debug run failed with HTTP ${res.status}`,
    );
  }
  return res.json();
}

export function competitorsQueryOptions() {
  return queryOptions({
    queryKey: ["competitors"],
    queryFn: fetchCompetitors,
    staleTime: 10_000,
  });
}

export function competitorQueryOptions(id: string) {
  return queryOptions({
    queryKey: ["competitors", id],
    queryFn: () => fetchCompetitor(id),
    staleTime: 10_000,
  });
}
