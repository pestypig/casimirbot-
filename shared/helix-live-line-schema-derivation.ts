import type { HelixSituationSourceModality } from "./helix-situation-source-capability";
import type { LiveAnswerLineDefinition } from "./helix-live-answer-environment";

export const HELIX_LIVE_LINE_SCHEMA_DERIVATION_SCHEMA =
  "helix.live_line_schema_derivation.v1" as const;

export type HelixLiveLineSchemaDerivation = {
  schema: typeof HELIX_LIVE_LINE_SCHEMA_DERIVATION_SCHEMA;
  derivation_id: string;
  thread_id: string;
  environment_id: string;
  objective: string;
  line_schema: Array<LiveAnswerLineDefinition & {
    purpose: string;
    primary_modality: HelixSituationSourceModality | "mixed";
    initial_value: string;
    evidence_refs: string[];
    missing_evidence: string[];
    next_best_tool?: string | null;
  }>;
  assistant_answer: false;
  raw_content_included: false;
  context_policy: "compact_context_pack_only";
  created_at: string;
};
