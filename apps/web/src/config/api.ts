/**
 * Centralized API configuration for CampaignLens frontend.
 */
export const API_BASE_URL: string =
  typeof window !== "undefined"
    ? (import.meta.env.VITE_API_URL || "http://localhost:8787")
    : (process.env.VITE_API_URL || "http://localhost:8787");
