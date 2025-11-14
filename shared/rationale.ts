import { z } from "zod";

export const rationaleTagSchema = z.enum(["evidence", "assumption", "inference", "speculation"]);
export type RationaleTag = z.infer<typeof rationaleTagSchema>;

export const spanRefSchema = z.object({
  kind: z.enum(["text", "code", "dom", "viz"]),
  target: z.string(),
  start: z.number().int().nonnegative().optional(),
  end: z.number().int().nonnegative().optional(),
  lineStart: z.number().int().positive().optional(),
  lineEnd: z.number().int().positive().optional(),
});
export type SpanRef = z.infer<typeof spanRefSchema>;

export const rationaleSourceSchema = z.object({
  kind: z.enum(["doc", "url", "sensor", "calc"]),
  ref: z.string(),
  excerpt: z.string().optional(),
});
export type RationaleSource = z.infer<typeof rationaleSourceSchema>;

export const whyBelongsItemSchema = z.object({
  tag: rationaleTagSchema,
  message: z.string(),
  source: rationaleSourceSchema.optional(),
  spans: z.array(spanRefSchema).max(16).optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type WhyBelongsItem = z.infer<typeof whyBelongsItemSchema>;

export const whyBelongsSummarySchema = z.object({
  evidence: z.number().int().nonnegative(),
  assumptions: z.number().int().nonnegative(),
  inferences: z.number().int().nonnegative(),
  speculation: z.number().int().nonnegative(),
});
export type WhyBelongsSummary = z.infer<typeof whyBelongsSummarySchema>;

export const whyBelongsSchema = z.object({
  claim: z.string(),
  items: z.array(whyBelongsItemSchema),
  summary: whyBelongsSummarySchema.optional(),
});
export type WhyBelongs = z.infer<typeof whyBelongsSchema>;

export const RATIONALE_TAGS: RationaleTag[] = ["evidence", "assumption", "inference", "speculation"];

export const defaultWhyBelongsSummary: WhyBelongsSummary = {
  evidence: 0,
  assumptions: 0,
  inferences: 0,
  speculation: 0,
};
