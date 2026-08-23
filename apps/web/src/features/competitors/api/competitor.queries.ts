import { queryOptions } from "@tanstack/react-query";
import type { CompetitorDetailResponse, CompetitorListResponse } from "../types.ts";
import { API_BASE_URL } from "../../../config/api.ts";

export interface CreateCompetitorPayload {
  name: string;
  domain: string;
  source: {
    name: string;
    url: string;
    type: "homepage" | "pricing";
    collectorId: string;
    intervalMinutes: number;
  };
}

export interface CreateCompetitorResponse {
  competitor: {
    id: string;
    name: string;
    domain: string;
  };
  source: {
    id: string;
    name: string;
    url: string;
    collectorId: string;
    health: string;
  };
  initialMonitor: unknown;
}

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

export async function createCompetitor(payload: CreateCompetitorPayload): Promise<CreateCompetitorResponse> {
  const res = await fetch(`${API_BASE_URL}/competitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(
      errorData?.error?.message || `Failed to track competitor: HTTP ${res.status}`,
    );
  }

  return res.json();
}

export async function triggerSourceMonitor(sourceId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/sources/${sourceId}/monitor`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(
      errorData?.error?.message || `Monitoring failed with HTTP ${res.status}`,
    );
  }
  return res.json();
}

export async function triggerSourceRun(sourceId: string): Promise<unknown> {
  const res = await fetch(`${API_BASE_URL}/sources/${sourceId}/run`, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
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
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
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
