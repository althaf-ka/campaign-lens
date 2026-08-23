import { z } from "zod";

export const campaignSnapshotSchema = z.object({
  headline: z.string().nullable(),
  offer: z.string().nullable(),

  pricing: z.object({
    amount: z.number().nullable(),
    currency: z.string().nullable(),
    qualifier: z.string().nullable(),
  }),

  primaryCta: z.object({
    label: z.string().nullable(),
    href: z.string().nullable(),
  }),

  guarantees: z.array(z.string()),

  sourceUrl: z.string().url(),
});

export type CampaignSnapshot = z.infer<typeof campaignSnapshotSchema>;
