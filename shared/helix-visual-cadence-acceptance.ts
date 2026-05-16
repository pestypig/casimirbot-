export const HELIX_VISUAL_CADENCE_ACCEPTANCE_RESULT_SCHEMA =
  "helix.visual_cadence_acceptance_result.v1" as const;

export type HelixVisualCadenceAcceptanceCheck = {
  name: string;
  ok: boolean;
  summary: string;
  related_ids: string[];
};

export type HelixVisualCadenceAcceptanceResult = {
  schema: typeof HELIX_VISUAL_CADENCE_ACCEPTANCE_RESULT_SCHEMA;
  producer_id: string;
  ok: boolean;
  checks: HelixVisualCadenceAcceptanceCheck[];
  next_required_action?: string | null;
  assistant_answer: false;
};
