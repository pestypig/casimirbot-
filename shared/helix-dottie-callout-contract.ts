import { z } from "zod";

export const calloutModeSchema = z.enum(["callout", "briefing", "debrief"]);
export const certaintyClassSchema = z.enum([
  "unknown",
  "hypothesis",
  "reasoned",
  "confirmed",
]);
export const suppressionReasonSchema = z.enum([
  "context_ineligible",
  "dedupe_cooldown",
  "mission_rate_limited",
  "voice_rate_limited",
  "voice_budget_exceeded",
  "missing_evidence",
  "contract_violation",
  "agi_overload_admission_control",
]);

export const calloutTemplateSchema = z.object({
  mode: calloutModeSchema,
  what_changed: z.string().min(1).max(160),
  why_it_matters: z.string().min(1).max(220),
  next_action: z.string().min(1).max(160),
  evidence_anchor: z.string().min(1).max(500),
});

export type CalloutTemplate = z.infer<typeof calloutTemplateSchema>;
export type CertaintyClass = z.infer<typeof certaintyClassSchema>;
export type SuppressionReason = z.infer<typeof suppressionReasonSchema>;

const CERTAINTY_RANK: Record<CertaintyClass, number> = {
  unknown: 0,
  hypothesis: 1,
  reasoned: 2,
  confirmed: 3,
};

export const isVoiceCertaintyAllowed = (
  textCertainty: CertaintyClass,
  voiceCertainty: CertaintyClass,
): boolean => {
  return CERTAINTY_RANK[voiceCertainty] <= CERTAINTY_RANK[textCertainty];
};

export const deriveCalloutSuppressionReason = (input: {
  deterministic: boolean;
  evidenceRefs: string[];
}): SuppressionReason | null => {
  if (!input.deterministic) return "contract_violation";
  if (input.evidenceRefs.length === 0) return "missing_evidence";
  return null;
};
