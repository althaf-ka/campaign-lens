export type CampaignChangeType =
  | "price_changed"
  | "offer_changed"
  | "cta_changed"
  | "headline_changed";

export type CampaignChange =
  | {
      type: "price_changed";
      before: number | null;
      after: number | null;
    }
  | {
      type: "offer_changed";
      before: string | null;
      after: string | null;
    }
  | {
      type: "cta_changed";
      before: string | null;
      after: string | null;
    }
  | {
      type: "headline_changed";
      before: string | null;
      after: string | null;
    };
