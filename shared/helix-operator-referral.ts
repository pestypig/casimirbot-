import type { LiveScenarioKind } from "./helix-live-scenario-evidence.ts";

export const HELIX_OPERATOR_REFERRAL_SCHEMA = "helix.operator_referral.v1" as const;

export type OperatorReferralType =
  | "minecraft_route_assist"
  | "browser_claim_review"
  | "translation_ambiguity"
  | "workstation_operator_review"
  | "research_verification"
  | "support_escalation";

export type OperatorAction =
  | "review_or_surface_guidance"
  | "request_missing_evidence"
  | "verify_claim"
  | "check_translation"
  | "review_process_failure"
  | "review_research_evidence"
  | "monitor_only";

export type HelixOperatorReferral = {
  schema: typeof HELIX_OPERATOR_REFERRAL_SCHEMA;
  referral_id: string;

  scenario_kind: LiveScenarioKind;
  referral_type: OperatorReferralType;
  reason_code: string;
  operator_action: OperatorAction;

  thread_id?: string | null;
  room_id?: string | null;
  source_ids?: string[];
  related_objective_id?: string | null;
  related_rehearsal_id?: string | null;
  related_anomaly_id?: string | null;
  related_policy_receipt_id?: string | null;

  evidence_refs: string[];

  instruction_authority: "none";
  ask_instruction_authority: "none";
  ask_context_policy: "operator_only" | "not_admissible";
  context_role: "operator_referral";
  creates_ask_turn: false;
  turn_triggered: false;

  raw_user_text_included: false;
  raw_transcript_included?: false;
  raw_image_included?: false;
  raw_audio_included?: false;

  model_invoked: false;
  created_at: string;
};

export type DotOperatorReferral = HelixOperatorReferral;

export function createOperatorReferral(
  input: Omit<
    HelixOperatorReferral,
    | "schema"
    | "instruction_authority"
    | "ask_instruction_authority"
    | "context_role"
    | "creates_ask_turn"
    | "turn_triggered"
    | "raw_user_text_included"
    | "raw_transcript_included"
    | "raw_image_included"
    | "raw_audio_included"
    | "model_invoked"
    | "created_at"
  > & {
    created_at?: string;
  },
): HelixOperatorReferral {
  return {
    schema: HELIX_OPERATOR_REFERRAL_SCHEMA,
    ...input,
    instruction_authority: "none",
    ask_instruction_authority: "none",
    context_role: "operator_referral",
    creates_ask_turn: false,
    turn_triggered: false,
    raw_user_text_included: false,
    raw_transcript_included: false,
    raw_image_included: false,
    raw_audio_included: false,
    model_invoked: false,
    created_at: input.created_at ?? new Date(0).toISOString(),
  };
}

export function createDotOperatorReferral(
  input: Parameters<typeof createOperatorReferral>[0],
): DotOperatorReferral {
  return createOperatorReferral(input);
}

export function buildMinecraftRouteAssistReferral(
  input: BaseReferralFactoryInput & {
    reason_code:
      | "wrong_direction_from_end_return_route"
      | "return_route_unknown_gateway"
      | "void_risk_on_route"
      | "identity_binding_missing"
      | "home_binding_missing"
      | "stale_route_objective"
      | "player_death_route_invalidated"
      | "route_confidence_low";
    operator_action?: OperatorAction;
  },
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "minecraft_route_monitor",
    referral_type: "minecraft_route_assist",
    operator_action: input.operator_action ?? "review_or_surface_guidance",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

export function buildBrowserClaimReviewReferral(
  input: BaseReferralFactoryInput,
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "browser_audio_claim_monitor",
    referral_type: "browser_claim_review",
    reason_code: input.reason_code,
    operator_action: "verify_claim",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

export function buildTranslationAmbiguityReferral(
  input: BaseReferralFactoryInput,
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "live_translation",
    referral_type: "translation_ambiguity",
    reason_code: input.reason_code,
    operator_action: "check_translation",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

export function buildWorkstationOperatorReviewReferral(
  input: BaseReferralFactoryInput,
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "workstation_operator_monitor",
    referral_type: "workstation_operator_review",
    reason_code: input.reason_code,
    operator_action: "review_process_failure",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

export function buildResearchVerificationReferral(
  input: BaseReferralFactoryInput,
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "research_session",
    referral_type: "research_verification",
    reason_code: input.reason_code,
    operator_action: "review_research_evidence",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

export function buildSupportEscalationReferral(
  input: BaseReferralFactoryInput,
): HelixOperatorReferral {
  return createOperatorReferral({
    ...input,
    scenario_kind: "support_procedure_monitor",
    referral_type: "support_escalation",
    reason_code: input.reason_code,
    operator_action: "review_or_surface_guidance",
    ask_context_policy: input.ask_context_policy ?? "operator_only",
  });
}

type BaseReferralFactoryInput = {
  referral_id: string;
  reason_code: string;
  thread_id?: string | null;
  room_id?: string | null;
  source_ids?: string[];
  related_objective_id?: string | null;
  related_rehearsal_id?: string | null;
  related_anomaly_id?: string | null;
  related_policy_receipt_id?: string | null;
  evidence_refs: string[];
  ask_context_policy?: "operator_only" | "not_admissible";
  created_at?: string;
};
