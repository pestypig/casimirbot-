import type { HelixAskHandoff } from "@shared/helix-ask-handoff";

export type HelixAskHandoffConsumption = {
  schema: "helix.ask_handoff_consumption.v1";
  handoff_id: string;
  thread_id: string;
  selected_evidence_refs: string[];
  mode: "explicit_ask" | "policy_approved_companion";
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};

export function consumeAskHandoffForEvidencePack(input: {
  handoff: HelixAskHandoff;
  mode: "explicit_ask" | "policy_approved_companion";
  now?: string;
}): HelixAskHandoffConsumption {
  return {
    schema: "helix.ask_handoff_consumption.v1",
    handoff_id: input.handoff.handoff_id,
    thread_id: input.handoff.thread_id,
    selected_evidence_refs: Array.from(new Set([
      ...input.handoff.selected_evidence_refs,
      ...input.handoff.allowed_inputs.observation_refs,
      ...input.handoff.allowed_inputs.interpretation_refs,
      ...input.handoff.allowed_inputs.goal_refs,
    ])),
    mode: input.mode,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.now ?? new Date().toISOString(),
  };
}

