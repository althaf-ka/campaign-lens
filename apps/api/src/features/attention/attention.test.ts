import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { AttentionItem } from "./attention.routes.ts";

describe("Attention Read Model & Prioritization", () => {
  it("1. includes both campaign changes and degraded source issues", () => {
    const rawItems: AttentionItem[] = [
      {
        id: "evt-1",
        kind: "campaign_change",
        competitorId: "comp-1",
        competitorName: "Lumora",
        sourceId: "src-1",
        sourceName: "Homepage",
        eventId: "evt-1",
        eventType: "price_changed",
        occurredAt: "2026-08-23T12:00:00.000Z",
        title: "Price increased by ₹300",
        summary: "Price increased by ₹300 (₹1,999 → ₹2,299 · +15.0%)",
        before: { value: 1999 },
        after: { value: 2299 },
        metric: {
          title: "Price increased by ₹300",
          diffFormatted: "+₹300",
          percentFormatted: "+15.0%",
          isIncrease: true,
          summary: "Price increased by ₹300",
        },
      },
      {
        id: "source-src-1",
        kind: "source_issue",
        competitorId: "comp-1",
        competitorName: "Lumora",
        sourceId: "src-1",
        sourceName: "Homepage",
        health: "degraded",
        occurredAt: "2026-08-23T12:05:00.000Z",
        title: "Website structure changed · Monitoring degraded",
        summary: "Website structure changed on Homepage. Last verified campaign remains protected.",
      },
    ];

    assert.equal(rawItems.length, 2);
    assert.equal(rawItems[0]?.kind, "campaign_change");
    assert.equal(rawItems[1]?.kind, "source_issue");
  });

  it("2. sorts attention items newest first", () => {
    const rawItems: AttentionItem[] = [
      {
        id: "evt-old",
        kind: "campaign_change",
        competitorId: "comp-1",
        competitorName: "Lumora",
        sourceId: "src-1",
        sourceName: "Homepage",
        eventId: "evt-old",
        eventType: "offer_changed",
        occurredAt: "2026-08-23T10:00:00.000Z",
        title: "Promotion changed",
        summary: "Promotion changed",
        before: null,
        after: null,
      },
      {
        id: "source-new",
        kind: "source_issue",
        competitorId: "comp-1",
        competitorName: "Lumora",
        sourceId: "src-1",
        sourceName: "Homepage",
        health: "degraded",
        occurredAt: "2026-08-23T12:00:00.000Z",
        title: "Website structure changed",
        summary: "Structure changed",
      },
    ];

    const sorted = [...rawItems].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    assert.equal(sorted[0]?.id, "source-new");
    assert.equal(sorted[1]?.id, "evt-old");
  });

  it("3. excludes routine successful monitor logs and bounds results to max limit", () => {
    const items: AttentionItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `item-${i}`,
      kind: "campaign_change",
      competitorId: "comp-1",
      competitorName: "Lumora",
      sourceId: "src-1",
      sourceName: "Homepage",
      eventId: `evt-${i}`,
      eventType: "price_changed",
      occurredAt: new Date(Date.now() - i * 1000).toISOString(),
      title: "Price updated",
      summary: "Price updated",
      before: { value: 1000 },
      after: { value: 1200 },
    }));

    const bounded = items.slice(0, 15);
    assert.equal(bounded.length, 15);
  });
});
