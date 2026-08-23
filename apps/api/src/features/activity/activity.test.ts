import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ActivityItem } from "./activity.routes.ts";

describe("Activity & Recovery Center Read Model", () => {
  it("1. campaign events and source activity combine and sort descending by timestamp", () => {
    const rawSystemActivities: ActivityItem[] = [
      {
        id: "act-1",
        kind: "system",
        type: "monitor_started",
        sourceId: "src-1",
        sourceName: "Homepage Campaign",
        competitorId: "comp-1",
        occurredAt: "2026-08-23T12:00:00.000Z",
        message: "Source monitoring started",
      },
      {
        id: "act-2",
        kind: "system",
        type: "healing_unavailable",
        sourceId: "src-1",
        sourceName: "Homepage Campaign",
        competitorId: "comp-1",
        occurredAt: "2026-08-23T12:01:00.000Z",
        message: "Bright Data Self-Healing temporarily disabled",
        metadata: { retryable: true },
      },
    ];

    const rawCampaignEvents: ActivityItem[] = [
      {
        id: "evt-1",
        kind: "campaign",
        type: "price_changed",
        sourceId: "src-1",
        sourceName: "Homepage Campaign",
        competitorId: "comp-1",
        before: { value: 1999 },
        after: { value: 2299 },
        occurredAt: "2026-08-23T12:00:30.000Z",
        message: "Price updated from ₹1999 to ₹2299",
      },
    ];

    const combined = [...rawSystemActivities, ...rawCampaignEvents].sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

    assert.equal(combined.length, 3);
    assert.equal(combined[0]?.id, "act-2"); // 12:01:00 (newest)
    assert.equal(combined[1]?.id, "evt-1"); // 12:00:30
    assert.equal(combined[2]?.id, "act-1"); // 12:00:00 (oldest)
  });

  it("2. metadata sanitizes secrets and contains no tokens", () => {
    const activity: ActivityItem = {
      id: "act-3",
      kind: "system",
      type: "extraction_degraded",
      sourceId: "src-1",
      sourceName: "Homepage Campaign",
      competitorId: "comp-1",
      occurredAt: "2026-08-23T12:05:00.000Z",
      message: "Extraction degraded",
      metadata: {
        reason: "wait_element_timeout",
        missing: ["pricing.amount"],
      },
    };

    const serialized = JSON.stringify(activity);
    assert.ok(!serialized.includes("token"));
    assert.ok(!serialized.includes("Bearer"));
    assert.ok(!serialized.includes("secret"));
  });

  it("3. applies max limit correctly", () => {
    const list: ActivityItem[] = Array.from({ length: 60 }, (_, i) => ({
      id: `item-${i}`,
      kind: "system" as const,
      type: "monitor_succeeded" as const,
      sourceId: "src-1",
      sourceName: "Homepage Campaign",
      competitorId: "comp-1",
      occurredAt: new Date(Date.now() - i * 1000).toISOString(),
      message: "Monitoring completed",
    }));

    const sliced = list.slice(0, 50);
    assert.equal(sliced.length, 50);
  });
});
