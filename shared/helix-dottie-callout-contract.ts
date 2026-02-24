import { z } from "zod";

export const calloutModeSchema = z.enum(["callout", "briefing", "debrief"]);
export const suppressionReasonSchema = z.enum([
  "context_ineligible",
  "dedupe_cooldown",
  "mission_rate_limited",
  "voice_rate_limited",
  "voice_budget_exceeded",
  "missing_evidence",
  "contract_violation",
  "overload_admission_control",
]);

export const calloutTemplateSchema = z.object({
  mode: calloutModeSchema,
  what_changed: z.string().min(1).max(160),
  why_it_matters: z.string().min(1).max(220),
  next_action: z.string().min(1).max(160),
  evidence_anchor: z.string().min(1).max(500),
});

export type CalloutTemplate = z.infer<typeof calloutTemplateSchema>;
