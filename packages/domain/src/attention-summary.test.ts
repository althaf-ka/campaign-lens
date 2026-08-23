import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatPriceChangeSummary,
  formatOfferChangeSummary,
  formatHeadlineChangeSummary,
  formatCtaChangeSummary,
} from "./attention-summary.ts";

describe("Attention & Human-Readable Summaries", () => {
  it("1. correctly formats price increase with percentage and difference", () => {
    const res = formatPriceChangeSummary(1999, 2299, "INR");
    assert.equal(res.isIncrease, true);
    assert.equal(res.diffFormatted, "+₹300");
    assert.equal(res.percentFormatted, "+15.0%");
    assert.equal(res.title, "Price increased by ₹300");
    assert.equal(res.summary, "Price increased by ₹300 (₹1,999 → ₹2,299 · +15.0%)");
  });

  it("2. correctly formats price decrease with percentage and difference", () => {
    const res = formatPriceChangeSummary(4000, 3500, "INR");
    assert.equal(res.isIncrease, false);
    assert.equal(res.diffFormatted, "-₹500");
    assert.equal(res.percentFormatted, "-12.5%");
    assert.equal(res.title, "Price decreased by ₹500");
    assert.equal(res.summary, "Price decreased by ₹500 (₹4,000 → ₹3,500 · -12.5%)");
  });

  it("3. safely handles null, undefined, or zero previous price without division by zero", () => {
    const resNull = formatPriceChangeSummary(null, 1999, "INR");
    assert.equal(resNull.isIncrease, true);
    assert.equal(resNull.percentFormatted, "New");
    assert.equal(resNull.title, "Price updated to ₹1,999");

    const resZero = formatPriceChangeSummary(0, 1999, "INR");
    assert.equal(resZero.isIncrease, true);
    assert.equal(resZero.percentFormatted, "New");

    const resAfterNull = formatPriceChangeSummary(1999, null, "INR");
    assert.equal(resAfterNull.isIncrease, false);
    assert.equal(resAfterNull.title, "Price unlisted");
  });

  it("4. formats promotional offer changes clearly", () => {
    const updated = formatOfferChangeSummary(
      "Save 30% on the Lumora Starter Kit",
      "Free Pro Upgrade with every Starter Kit",
    );
    assert.equal(updated, 'Promotion updated: "Free Pro Upgrade with every Starter Kit"');

    const launched = formatOfferChangeSummary(null, "Summer Sale");
    assert.equal(launched, 'New promotion launched: "Summer Sale"');

    const ended = formatOfferChangeSummary("Save 30%", null);
    assert.equal(ended, "Promotional offer ended");
  });

  it("5. formats headline and CTA changes", () => {
    assert.equal(
      formatHeadlineChangeSummary("Old", "Smarter lighting."),
      'Positioning updated: "Smarter lighting."',
    );
    assert.equal(
      formatCtaChangeSummary("Buy Now", "Get Started"),
      'Primary call-to-action updated: "Get Started"',
    );
  });
});
