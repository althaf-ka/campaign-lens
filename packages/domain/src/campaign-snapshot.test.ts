import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { campaignSnapshotSchema } from "./campaign-snapshot.ts";

describe("campaignSnapshotSchema", () => {
  const validSampleOutput = {
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

  it("passes validation with valid Bright Data output", () => {
    const result = campaignSnapshotSchema.safeParse(validSampleOutput);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.headline, "Smarter lighting. Simpler living.");
      assert.equal(result.data.offer, "Save 30% on the Lumora Starter Kit");
      assert.equal(result.data.pricing.amount, 1999);
      assert.equal(result.data.pricing.currency, "INR");
      assert.equal(result.data.pricing.qualifier, "Starter Kit");
      assert.equal(result.data.primaryCta.label, "Get the Starter Kit");
      assert.equal(result.data.primaryCta.href, "#products");
      assert.deepEqual(result.data.guarantees, [
        "Free installation support",
        "30-day returns",
        "2-year warranty",
      ]);
      assert.equal(result.data.sourceUrl, "https://lumora-58u.pages.dev/");
    }
  });

  it("does not include Bright Data input transport metadata in parsed CampaignSnapshot", () => {
    const rawWithInput = {
      ...validSampleOutput,
      input: {
        url: "https://lumora-58u.pages.dev/",
      },
    };

    const result = campaignSnapshotSchema.safeParse(rawWithInput);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal("input" in result.data, false);
      assert.equal((result.data as Record<string, unknown>).input, undefined);
    }
  });

  it("fails validation when pricing.amount has wrong type (e.g. string instead of number or null)", () => {
    const invalidPriceType = {
      ...validSampleOutput,
      pricing: {
        amount: "1999", // string instead of number
        currency: "INR",
        qualifier: "Starter Kit",
      },
    };

    const result = campaignSnapshotSchema.safeParse(invalidPriceType);
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "pricing.amount",
      );
      assert.ok(issue, "Expected validation error on pricing.amount");
    }
  });

  it("fails validation when required nested objects are missing", () => {
    const missingPricing = {
      headline: "Smarter lighting.",
      offer: "Save 30%",
      primaryCta: {
        label: "Get the Starter Kit",
        href: "#products",
      },
      guarantees: [],
      sourceUrl: "https://lumora-58u.pages.dev/",
    };

    const result = campaignSnapshotSchema.safeParse(missingPricing);
    assert.equal(result.success, false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "pricing",
      );
      assert.ok(issue, "Expected validation error on pricing");
    }
  });
});
