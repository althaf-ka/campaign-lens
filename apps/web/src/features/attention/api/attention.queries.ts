import { queryOptions } from "@tanstack/react-query";
import type { AttentionResponse } from "../types.ts";
import { API_BASE_URL } from "../../../config/api.ts";

export async function fetchAttention(): Promise<AttentionResponse> {
  const res = await fetch(`${API_BASE_URL}/attention`);
  if (!res.ok) {
    throw new Error(`Failed to fetch attention items: ${res.statusText}`);
  }
  return res.json();
}

export function attentionQueryOptions() {
  return queryOptions({
    queryKey: ["attention"],
    queryFn: fetchAttention,
    staleTime: 5_000,
  });
}
