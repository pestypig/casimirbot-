import type { HelixClarificationExpectedEffect } from "./helix-clarification-ranking";

export const HELIX_AGENTIC_REQUEST_INPUT_SCHEMA =
  "helix.agentic_request_input.v1" as const;

export type HelixAgenticRequestInput = {
  schema: typeof HELIX_AGENTIC_REQUEST_INPUT_SCHEMA;
  request_id: string;
  thread_id: string;
  room_id?: string | null;
  question: string;
  answer_options: string[];
  why_it_matters: string;
  evidence_refs: string[];
  expected_effect: HelixClarificationExpectedEffect;
  source: "clarification_dialogue";
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
