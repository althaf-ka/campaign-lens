import type { CampaignSnapshot } from "./campaign-snapshot.ts";
import type { CampaignChange } from "./campaign-change.ts";

/**
 * Normalizes whitespace in text strings to prevent cosmetic formatting differences
 * (extra spaces, newlines, tabs) from triggering false semantic change events.
 */
export function normalizeText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

/**
 * Deterministically compares two CampaignSnapshots and returns a list of semantic changes.
 */
export function diffCampaignSnapshots(
  previous: CampaignSnapshot,
  current: CampaignSnapshot,
): CampaignChange[] {
  const changes: CampaignChange[] = [];

  // 1. Price comparison (numeric amount)
  if (previous.pricing.amount !== current.pricing.amount) {
    changes.push({
      type: "price_changed",
      before: previous.pricing.amount,
      after: current.pricing.amount,
    });
  }

  // 2. Offer comparison (normalized text)
  if (normalizeText(previous.offer) !== normalizeText(current.offer)) {
    changes.push({
      type: "offer_changed",
      before: previous.offer,
      after: current.offer,
    });
  }

  // 3. CTA comparison (normalized label)
  if (
    normalizeText(previous.primaryCta.label) !==
    normalizeText(current.primaryCta.label)
  ) {
    changes.push({
      type: "cta_changed",
      before: previous.primaryCta.label,
      after: current.primaryCta.label,
    });
  }

  // 4. Headline comparison (normalized text)
  if (normalizeText(previous.headline) !== normalizeText(current.headline)) {
    changes.push({
      type: "headline_changed",
      before: previous.headline,
      after: current.headline,
    });
  }

  return changes;
}
