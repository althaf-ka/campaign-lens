import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateSnapshotIntegrity } from "./extraction-integrity.ts";
import type { CampaignSnapshot } from "./campaign-snapshot.ts";

describe("evaluateSnapshotIntegrity", () => {
  const completeSnapshot: CampaignSnapshot = {
    headline: "Smarter lighting. Simpler living.",
    offer: "Free Pro Upgrade with every Starter Kit",
    pricing: {
      amount: 2299,
      currency: "INR",
      qualifier: "Starter Kit",
    },
    primaryCta: {
      label: "Get the Starter Kit",
      href: "https://lumora-58u.pages.dev/#products",
    },
    guarantees: [
      "Free installation support",
      "30-day returns",
      "2-year warranty",
    ],
    sourceUrl: "https://lumora-58u.pages.dev/",
  };

  it("returns healthy for a complete Lumora snapshot", () => {
    const result = evaluateSnapshotIntegrity({
      snapshot: completeSnapshot,
      sourceType: "homepage",
    });

    assert.equal(result.status, "healthy");
    if (result.status === "healthy") {
      assert.ok(true);
    }
  });

  it("detects degraded extraction when offer is null or empty", () => {
    const nullOfferSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      offer: null,
    };
    const emptyOfferSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      offer: "   ",
    };

    const res1 = evaluateSnapshotIntegrity({ snapshot: nullOfferSnapshot, sourceType: "homepage" });
    assert.equal(res1.status, "degraded");
    if (res1.status === "degraded") {
      assert.deepEqual(res1.missing, ["offer"]);
    }

    const res2 = evaluateSnapshotIntegrity({ snapshot: emptyOfferSnapshot, sourceType: "homepage" });
    assert.equal(res2.status, "degraded");
    if (res2.status === "degraded") {
      assert.deepEqual(res2.missing, ["offer"]);
    }
  });

  it("detects degraded extraction when price amount is null", () => {
    const nullPriceSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      pricing: {
        amount: null,
        currency: null,
        qualifier: null,
      },
    };

    const result = evaluateSnapshotIntegrity({
      snapshot: nullPriceSnapshot,
      sourceType: "homepage",
    });

    assert.equal(result.status, "degraded");
    if (result.status === "degraded") {
      assert.deepEqual(result.missing, ["pricing.amount"]);
    }
  });

  it("detects degraded extraction when primary CTA label is null or whitespace", () => {
    const nullCtaSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      primaryCta: {
        label: null,
        href: null,
      },
    };

    const result = evaluateSnapshotIntegrity({
      snapshot: nullCtaSnapshot,
      sourceType: "homepage",
    });

    assert.equal(result.status, "degraded");
    if (result.status === "degraded") {
      assert.deepEqual(result.missing, ["primaryCta.label"]);
    }
  });

  it("detects degraded extraction when headline is null or whitespace", () => {
    const nullHeadlineSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      headline: null,
    };

    const result = evaluateSnapshotIntegrity({
      snapshot: nullHeadlineSnapshot,
      sourceType: "homepage",
    });

    assert.equal(result.status, "degraded");
    if (result.status === "degraded") {
      assert.deepEqual(result.missing, ["headline"]);
    }
  });

  it("returns all missing fields when multiple extractions fail simultaneously (DOM breakage)", () => {
    const brokenDomSnapshot: CampaignSnapshot = {
      headline: "Smarter lighting. Simpler living.",
      offer: null,
      pricing: {
        amount: null,
        currency: null,
        qualifier: null,
      },
      primaryCta: {
        label: null,
        href: null,
      },
      guarantees: [],
      sourceUrl: "https://lumora-58u.pages.dev/",
    };

    const result = evaluateSnapshotIntegrity({
      snapshot: brokenDomSnapshot,
      sourceType: "homepage",
    });

    assert.equal(result.status, "degraded");
    if (result.status === "degraded") {
      assert.deepEqual(result.missing, [
        "offer",
        "pricing.amount",
        "primaryCta.label",
      ]);
    }
  });

  it("supports extensible source-type specific policies", () => {
    // A pricing-only source doesn't strictly require a promotional offer banner
    const pricingSourceSnapshot: CampaignSnapshot = {
      ...completeSnapshot,
      offer: null,
    };

    const result = evaluateSnapshotIntegrity({
      snapshot: pricingSourceSnapshot,
      sourceType: "pricing",
    });

    assert.equal(result.status, "healthy");
  });
});
