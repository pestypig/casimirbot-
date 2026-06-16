import type {
  StagePlayVisualObserverProfileDomainV1,
  StagePlayVisualObserverProfileOutputModeV1,
  StagePlayVisualObserverProfileV1,
} from "./stage-play-visual-observer-profile.v1";

export const STAGE_PLAY_ADAPTIVE_VISUAL_LENS_PROPOSAL_SCHEMA =
  "stage_play_adaptive_visual_lens_proposal/v1" as const;

export const STAGE_PLAY_ADAPTIVE_VISUAL_LENS_APPLY_RESULT_SCHEMA =
  "stage_play_adaptive_visual_lens_apply_result/v1" as const;

export const ADAPTIVE_VISUAL_LENS_CONTROLLER_PRESET_ID =
  "stage_play_micro_reasoner_prompt_preset:adaptive-visual-lens-controller:v1" as const;

export type StagePlayAdaptiveVisualLensDriftStateV1 =
  | "same_subject"
  | "possible_drift"
  | "new_subject"
  | "uncertain";

export type StagePlayAdaptiveVisualLensDecisionV1 =
  | "keep_current"
  | "suggest_profile"
  | "needs_more_evidence"
  | "blocked";

export type StagePlayAdaptiveVisualLensSuggestedProfileDraftV1 = {
  title: string;
  domain: StagePlayVisualObserverProfileDomainV1;
  subjectCategory?: string | null;
  subject?: string | null;
  prompt: string;
  outputMode: StagePlayVisualObserverProfileOutputModeV1;
  expectedSchema?: StagePlayVisualObserverProfileV1["expectedSchema"];
};

export type StagePlayAdaptiveVisualLensProposalV1 = {
  artifactId: "stage_play_adaptive_visual_lens_proposal";
  schemaVersion: typeof STAGE_PLAY_ADAPTIVE_VISUAL_LENS_PROPOSAL_SCHEMA;
  proposalId: string;
  threadId: string;
  sourceId: string;
  activeProfileId?: string | null;
  activeProfileTitle?: string | null;
  activeProfilePromptHash?: string | null;
  recognizedSubject: string;
  recognizedSubjectConfidence: number;
  driftState: StagePlayAdaptiveVisualLensDriftStateV1;
  decision: StagePlayAdaptiveVisualLensDecisionV1;
  reason: string;
  candidateProfileId?: string | null;
  candidateProfileTitle?: string | null;
  candidateProfilePromptHash?: string | null;
  suggestedProfileDraft?: StagePlayAdaptiveVisualLensSuggestedProfileDraftV1 | null;
  blockedReason?: string | null;
  applyable: boolean;
  mailIds: string[];
  microReasonerRunRefs: string[];
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};

export type StagePlayAdaptiveVisualLensApplyResultV1 = {
  artifactId: "stage_play_adaptive_visual_lens_apply_result";
  schemaVersion: typeof STAGE_PLAY_ADAPTIVE_VISUAL_LENS_APPLY_RESULT_SCHEMA;
  proposalId: string;
  sourceId: string;
  applied: boolean;
  reason: string;
  profile: StagePlayVisualObserverProfileV1 | null;
  createdProfile?: StagePlayVisualObserverProfileV1 | null;
  evidenceRefs: string[];
  createdAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
};
