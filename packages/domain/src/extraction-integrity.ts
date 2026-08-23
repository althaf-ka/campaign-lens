import type { CampaignSnapshot } from "./campaign-snapshot.ts";

export type ExtractionHealth =
  | {
      status: "healthy";
    }
  | {
      status: "degraded";
      missing: string[];
    };

export type SourceType =
  | "homepage"
  | "pricing"
  | "offer"
  | "product"
  | "service"
  | (string & {});

export interface EvaluateSnapshotIntegrityOptions {
  snapshot: CampaignSnapshot;
  sourceType?: SourceType;
}

export type RequiredField =
  | "headline"
  | "offer"
  | "pricing.amount"
  | "primaryCta.label"
  | "guarantees";

const SOURCE_INTEGRITY_POLICIES: Record<string, RequiredField[]> = {
  homepage: ["headline", "offer", "pricing.amount", "primaryCta.label"],
  pricing: ["headline", "pricing.amount"],
  offer: ["headline", "offer"],
  product: ["headline", "pricing.amount", "primaryCta.label"],
  service: ["headline", "offer", "primaryCta.label"],
};

const DEFAULT_REQUIRED_FIELDS: RequiredField[] = [
  "headline",
  "offer",
  "pricing.amount",
  "primaryCta.label",
];

function isFieldPresent(snapshot: CampaignSnapshot, field: RequiredField): boolean {
  switch (field) {
    case "headline":
      return typeof snapshot.headline === "string" && snapshot.headline.trim().length > 0;
    case "offer":
      return typeof snapshot.offer === "string" && snapshot.offer.trim().length > 0;
    case "pricing.amount":
      return (
        typeof snapshot.pricing?.amount === "number" &&
        !Number.isNaN(snapshot.pricing.amount)
      );
    case "primaryCta.label":
      return (
        typeof snapshot.primaryCta?.label === "string" &&
        snapshot.primaryCta.label.trim().length > 0
      );
    case "guarantees":
      return Array.isArray(snapshot.guarantees) && snapshot.guarantees.length > 0;
  }
}

/**
 * Evaluates whether an extracted snapshot meets the required domain integrity contract
 * for a specific source type, distinguishing valid schema parsing from degraded extraction.
 */
export function evaluateSnapshotIntegrity(
  options: EvaluateSnapshotIntegrityOptions,
): ExtractionHealth {
  const { snapshot, sourceType = "homepage" } = options;

  const requiredFields =
    SOURCE_INTEGRITY_POLICIES[sourceType.toLowerCase()] ?? DEFAULT_REQUIRED_FIELDS;

  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!isFieldPresent(snapshot, field)) {
      missing.push(field);
    }
  }

  if (missing.length === 0) {
    return { status: "healthy" };
  }

  return {
    status: "degraded",
    missing,
  };
}
