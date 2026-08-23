import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { CampaignSnapshot } from "./campaign-snapshot.ts";
import {
  diffCampaignSnapshots,
  normalizeText,
} from "./diff-campaign-snapshots.ts";

describe("diffCampaignSnapshots", () => {
  const baseSnapshot: CampaignSnapshot = {
    headline: "Smarter lighting. Simpler living.",
    offer: "Save 30% on the Lumora Starter Kit",
    pricing: {
      amount: 1999,
      currency: "INR",
      qualifier: "Starter Kit",
    },
    primaryCta: {
      label: "Get the Starter Kit",
      href: "#products",
    },
    guarantees: [
      "Free installation support",
      "30-day returns",
      "2-year warranty",
    ],
    sourceUrl: "https://lumora-58u.pages.dev/",
  };

  it("returns zero changes for identical snapshots", () => {
    const current = { ...baseSnapshot };
    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 0);
  });

  it("detects price_changed when pricing amount changes (1999 -> 2299)", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      pricing: {
        ...baseSnapshot.pricing,
        amount: 2299,
      },
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0], {
      type: "price_changed",
      before: 1999,
      after: 2299,
    });
  });

  it("detects offer_changed when promotional copy changes", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      offer: "Free Pro Upgrade with every Starter Kit",
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0], {
      type: "offer_changed",
      before: "Save 30% on the Lumora Starter Kit",
      after: "Free Pro Upgrade with every Starter Kit",
    });
  });

  it("ignores whitespace-only changes without generating false events", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      headline: "  Smarter lighting.   Simpler living.  \n",
      offer: "Save 30% on the Lumora   Starter Kit  ",
      primaryCta: {
        ...baseSnapshot.primaryCta,
        label: " Get the Starter Kit ",
      },
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 0);
  });

  it("detects cta_changed when primary CTA label changes", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      primaryCta: {
        ...baseSnapshot.primaryCta,
        label: "Claim Your Starter Kit Now",
      },
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0], {
      type: "cta_changed",
      before: "Get the Starter Kit",
      after: "Claim Your Starter Kit Now",
    });
  });

  it("detects headline_changed when main heading changes", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      headline: "Elevate your home with adaptive light.",
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 1);
    assert.deepEqual(changes[0], {
      type: "headline_changed",
      before: "Smarter lighting. Simpler living.",
      after: "Elevate your home with adaptive light.",
    });
  });

  it("detects multiple simultaneous changes accurately", () => {
    const current: CampaignSnapshot = {
      ...baseSnapshot,
      headline: "Next-gen lighting.",
      offer: "Save 40% on Pro Bundles",
      pricing: {
        ...baseSnapshot.pricing,
        amount: 3499,
      },
      primaryCta: {
        ...baseSnapshot.primaryCta,
        label: "Get the Pro Kit",
      },
    };

    const changes = diffCampaignSnapshots(baseSnapshot, current);
    assert.equal(changes.length, 4);

    const types = changes.map((c) => c.type);
    assert.ok(types.includes("price_changed"));
    assert.ok(types.includes("offer_changed"));
    assert.ok(types.includes("cta_changed"));
    assert.ok(types.includes("headline_changed"));
  });

  it("normalizeText helper trims and collapses internal whitespace", () => {
    assert.equal(normalizeText("   hello   world  \n\t "), "hello world");
    assert.equal(normalizeText(""), null);
    assert.equal(normalizeText(null), null);
    assert.equal(normalizeText(undefined), null);
  });
});
