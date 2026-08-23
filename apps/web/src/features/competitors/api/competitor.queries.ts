import { queryOptions } from "@tanstack/react-query";
import type {
  CompetitorDetailResponse,
  CompetitorListResponse,
  ComparisonResponse,
} from "../types.ts";
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

export interface TestConnectionPayload {
  url: string;
  collectorId: string;
  sourceType: string;
}

export interface TestConnectionResponse {
  status: "compatible" | "incompatible";
  reason?: string;
  message?: string;
  missing?: string[];
  preview?: {
    headline: string | null;
    offer: string | null;
    pricing: {
      amount: number | null;
      currency: string | null;
    };
    primaryCta: {
      label: string | null;
    };
  };
  issues?: unknown[];
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

export async function fetchEventComparison(eventId: string): Promise<ComparisonResponse> {
  const res = await fetch(`${API_BASE_URL}/campaign-events/${eventId}/comparison`);
  if (!res.ok) {
    throw new Error(`Failed to fetch event comparison: ${res.statusText}`);
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

export async function testScraperConnection(
  payload: TestConnectionPayload,
): Promise<TestConnectionResponse> {
  const res = await fetch(`${API_BASE_URL}/sources/test-connection`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(
      errorData?.error?.message || `Test connection failed: HTTP ${res.status}`,
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

export function eventComparisonQueryOptions(eventId: string) {
  return queryOptions({
    queryKey: ["event-comparison", eventId],
    queryFn: () => fetchEventComparison(eventId),
    staleTime: 60_000,
  });
}
