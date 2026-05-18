export const HELIX_LIVE_PROCEDURE_ACTIVATION_GATE_SCHEMA =
  "helix.live_procedure_activation_gate.v1" as const;
export const HELIX_LIVE_PROCEDURE_LEDGER_ITEM_SCHEMA =
  "helix.live_procedure_ledger_item.v1" as const;

export type HelixLiveProcedureKind =
  | "translation"
  | "screen_summary"
  | "prediction_center"
  | "discord_voice"
  | "world_monitor";

export type HelixLiveProcedureRequesterAuthority =
  | "command_allowed"
  | "command_confirm"
  | "transcribe_only"
  | "ignored"
  | "system";

export type HelixLiveProcedureActivationDecision =
  | "activate"
  | "request_confirmation"
  | "blocked"
  | "journal_only";

export type HelixLiveProcedureActivationReason =
  | "authorized_direct_request"
  | "needs_confirmation"
  | "untrusted_speaker"
  | "missing_consent"
  | "ambiguous_source"
  | "policy_disabled"
  | "already_active"
  | "insufficient_evidence";

export type HelixLiveProcedureActivationGate = {
  schema: typeof HELIX_LIVE_PROCEDURE_ACTIVATION_GATE_SCHEMA;
  gate_id: string;
  procedure_kind: HelixLiveProcedureKind;
  requested_by: {
    source_id: string;
    speaker_id?: string | null;
    authority: HelixLiveProcedureRequesterAuthority;
  };
  decision: HelixLiveProcedureActivationDecision;
  reason: HelixLiveProcedureActivationReason;
  evidence_refs: string[];
  context_policy: "compact_context_pack_only";
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
};

export type HelixLiveProcedureLedgerItem = {
  schema: typeof HELIX_LIVE_PROCEDURE_LEDGER_ITEM_SCHEMA;
  ledger_item_id: string;
  procedure_id: string;
  procedure_kind: HelixLiveProcedureKind;
  event:
    | "activation_requested"
    | "activation_decided"
    | "observation_recorded"
    | "output_gated"
    | "paused"
    | "resumed"
    | "completed"
    | "blocked";
  summary: string;
  decision?: string | null;
  reason?: string | null;
  evidence_refs: string[];
  ts: string;
  assistant_answer: false;
  raw_audio_included: false;
  raw_transcript_included: false;
};
