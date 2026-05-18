import type { HelixDeicticReference } from "./helix-deictic-reference";
import type { HelixSituationEvidenceSelection } from "./helix-situation-evidence-selection";

export const HELIX_VOICE_LIVE_HANDOFF_SCHEMA =
  "helix.voice_live_handoff.v1" as const;

export type HelixVoiceLiveHandoff = {
  schema: typeof HELIX_VOICE_LIVE_HANDOFF_SCHEMA;
  handoff_id: string;
  thread_id: string;
  transcript: string;
  deictic_reference: HelixDeicticReference;
  situation_evidence_selection: HelixSituationEvidenceSelection;
  route: "situation_context_question" | "procedure_epoch_replay_question" | "request_user_input";
  quick_response_suppressed: boolean;
  assistant_answer: false;
  raw_content_included: false;
};
