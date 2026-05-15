import type { HelixTurnInputItem } from "./helix-turn-input-item";

export type HelixMultimodalTurnContext = {
  schema: "helix.multimodal_turn_context.v1";
  thread_id: string;
  turn_input_items: HelixTurnInputItem[];
  visual_evidence_refs: string[];
  selected_evidence_refs: string[];
  raw_image_included: false;
  assistant_answer: false;
  context_policy: "compact_context_pack_only";
};

