import { z } from "zod";

export const supportedSourceTypes = ["homepage", "pricing"] as const;
export type SupportedSourceType = (typeof supportedSourceTypes)[number];

export const createCompetitorInputSchema = z.object({
  name: z.string().trim().min(1, "Competitor name is required"),
  domain: z
    .string()
    .trim()
    .min(1, "Domain is required")
    .transform((val) =>
      val
        .replace(/^https?:\/\//i, "")
        .replace(/\/.*$/, "")
        .toLowerCase(),
    ),
  source: z.object({
    name: z.string().trim().min(1, "Source name is required"),
    url: z.string().trim().url("Must be a valid HTTP or HTTPS URL"),
    type: z.enum(supportedSourceTypes, {
      errorMap: () => ({
        message: "Source type must be 'homepage' or 'pricing'",
      }),
    }),
    collectorId: z
      .string()
      .trim()
      .regex(
        /^c_[a-zA-Z0-9]+$/,
        "Collector ID must start with 'c_' (e.g. c_mt5kun512itlsaiw1s)",
      ),
    intervalMinutes: z
      .number()
      .int()
      .min(5, "Interval must be at least 5 minutes")
      .max(10080, "Interval cannot exceed 7 days")
      .default(60),
  }),
});

export type CreateCompetitorInput = z.infer<typeof createCompetitorInputSchema>;
