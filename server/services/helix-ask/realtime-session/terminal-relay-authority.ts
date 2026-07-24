import type { HelixRealtimeStagePlayAskHandoffV1 } from "@shared/contracts/helix-realtime-stage-play.v1";
import type { HelixRealtimeTerminalRelayBasisV1 } from "@shared/contracts/helix-realtime-worker-relay.v1";
import {
  HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA,
  type HelixTerminalGroundingAuthority,
  type HelixTerminalGroundingAuthoritySource,
} from "@shared/helix-terminal-grounding-authority";
import { buildHelixTerminalGroundingAuthority } from "../terminal-grounding-authority";
import { hashHelixTerminalText } from "../turn-terminal-authority";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordLike
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeSha256 = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/^sha256:/, "");
  return /^[a-f0-9]{64}$/.test(normalized) ? `sha256:${normalized}` : null;
};

const readExistingAuthority = (
  payload: RecordLike,
  debug: RecordLike | null,
): RecordLike | null =>
  readRecord(payload.terminal_grounding_authority) ??
  readRecord(debug?.terminal_grounding_authority);

const resolveGroundingAuthority = (input: {
  payload: RecordLike;
  debug: RecordLike | null;
  askTurnId?: string | null;
}): {
  authority: HelixTerminalGroundingAuthority;
  proofSource: HelixTerminalGroundingAuthoritySource;
  invalidExistingAuthority: boolean;
} => {
  const existing = readExistingAuthority(input.payload, input.debug);
  if (existing?.schema === HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA) {
    return {
      authority: existing as unknown as HelixTerminalGroundingAuthority,
      proofSource: existing.authority_source === "canonical_terminal_boundary"
        ? "canonical_terminal_boundary"
        : "canonical_terminal_boundary_compatibility",
      invalidExistingAuthority: false,
    };
  }
  const authority = buildHelixTerminalGroundingAuthority({
    payload: input.payload,
    turnId: input.askTurnId,
    authoritySource: "canonical_terminal_boundary_compatibility",
  });
  return {
    authority,
    proofSource: "canonical_terminal_boundary_compatibility",
    invalidExistingAuthority: Boolean(existing),
  };
};

const relayFailureCodeForAuthority = (
  failureCode: string | null,
): string | null => {
  if (!failureCode) return null;
  if (failureCode === "terminal_text_hash_mismatch") {
    return "terminal_relay_text_hash_mismatch";
  }
  if (failureCode === "terminal_text_hash_missing") {
    return "terminal_relay_text_hash_missing";
  }
  if (failureCode === "terminal_turn_binding_mismatch") {
    return "terminal_relay_current_turn_binding_mismatch";
  }
  if (failureCode === "terminal_artifact_ref_missing") {
    return "terminal_relay_artifact_ref_missing";
  }
  if (failureCode === "terminal_artifact_binding_mismatch") {
    return "terminal_relay_artifact_kind_mismatch";
  }
  if ([
    "evidence_reentry_not_completed",
    "evidence_not_current_turn",
    "selected_evidence_missing",
    "selected_evidence_support_incomplete",
    "solver_artifact_reentry_rejected",
  ].includes(failureCode)) {
    return "required_grounding_evidence_missing";
  }
  return failureCode;
};

const authorityIntegrityValid = (
  authority: HelixTerminalGroundingAuthority,
): boolean => {
  const commonValid =
    authority.schema === HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA &&
    Boolean(readString(authority.authority_id)) &&
    (
      authority.authority_source === "canonical_terminal_boundary" ||
      authority.authority_source === "canonical_terminal_boundary_compatibility"
    ) &&
    authority.completed_solver_path === true &&
    authority.route_authority_ok === true &&
    authority.poison_audit_ok === true &&
    authority.terminal_authority_ok === true &&
    authority.support_coverage_complete === true &&
    authority.assistant_answer === false &&
    authority.terminal_eligible === false &&
    authority.provider_payload_included === false &&
    authority.raw_content_included === false;
  if (!commonValid) return false;
  if (!authority.grounding_required) {
    return authority.status === "not_required" &&
      Array.isArray(authority.selected_evidence_refs) &&
      authority.selected_evidence_refs.length === 0;
  }
  return (
    authority.status === "validated" &&
    authority.current_turn_only === true &&
    Array.isArray(authority.selected_evidence_refs) &&
    authority.selected_evidence_refs.length > 0 &&
    (
      authority.evidence_reentry_authority === "runtime_event_log" ||
      authority.evidence_reentry_authority === "provider_terminal_authority_bridge" ||
      authority.evidence_reentry_authority === "compatibility_projection"
    )
  );
};

export type RealtimeTerminalRelayAuthorityEvaluation = {
  askTurnId: string | null;
  terminalArtifactRef: string | null;
  terminalTextHash: string | null;
  terminalSpeechAuthorityStatus: "validated" | "rejected";
  relayBasis: HelixRealtimeTerminalRelayBasisV1;
  groundingRequired: boolean;
  groundingEvidenceRefs: string[];
  groundingAuthorityRef: string | null;
  groundingProofSource:
    | HelixTerminalGroundingAuthoritySource
    | "gateway_call_results"
    | "canonical_solver_trace";
  requiredGroundingCapabilityIds: string[];
  failureCode: string | null;
};

export const evaluateRealtimeTerminalRelayAuthority = (input: {
  handoff: HelixRealtimeStagePlayAskHandoffV1;
  payload: RecordLike;
  debug: RecordLike | null;
  solverTrace: RecordLike | null;
  terminalAuthority: RecordLike | null;
  answerText: string | null;
  finalAnswerSource: string | null;
  terminalArtifactKind: string | null;
  askTurnId?: string | null;
}): RealtimeTerminalRelayAuthorityEvaluation => {
  const resolved = resolveGroundingAuthority({
    payload: input.payload,
    debug: input.debug,
    askTurnId: input.askTurnId,
  });
  const authority = resolved.authority;
  const groundingEvidenceRefs = Array.isArray(authority.selected_evidence_refs)
    ? authority.selected_evidence_refs.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    : [];
  const askTurnId =
    readString(input.askTurnId) ??
    readString(input.payload.turn_id ?? input.payload.turnId) ??
    readString(input.terminalAuthority?.turn_id) ??
    readString(input.solverTrace?.turn_id) ??
    readString(authority.turn_id);
  const terminalArtifactRef = readString(authority.terminal_artifact_ref);
  const answerAuthorityArtifactRef =
    readString(input.terminalAuthority?.terminal_artifact_ref);
  const terminalTextHash = normalizeSha256(readString(authority.terminal_text_hash));
  const computedTextHash = input.answerText
    ? `sha256:${hashHelixTerminalText(input.answerText)}`
    : null;
  const relayBasis: HelixRealtimeTerminalRelayBasisV1 =
    authority.grounding_required
      ? "grounded_capability_terminal"
      : "model_direct_terminal";

  const failureCode = resolved.invalidExistingAuthority
    ? "terminal_grounding_authority_invalid"
    : !authorityIntegrityValid(authority)
      ? relayFailureCodeForAuthority(authority.failure_code) ??
        "terminal_grounding_authority_invalid"
      : authority.status === "rejected"
        ? relayFailureCodeForAuthority(authority.failure_code) ??
          "terminal_grounding_authority_rejected"
      : !askTurnId || askTurnId !== authority.turn_id
        ? "terminal_relay_current_turn_binding_mismatch"
        : !terminalArtifactRef
          ? "terminal_relay_artifact_ref_missing"
          : answerAuthorityArtifactRef &&
            terminalArtifactRef !== answerAuthorityArtifactRef
            ? "terminal_relay_artifact_ref_mismatch"
            : !input.answerText || !input.terminalArtifactKind || !input.finalAnswerSource
              ? "terminal_answer_contract_incomplete"
              : authority.terminal_artifact_kind !== input.terminalArtifactKind
                ? "terminal_relay_artifact_kind_mismatch"
                : authority.final_answer_source !== input.finalAnswerSource
                  ? "terminal_relay_answer_source_mismatch"
                  : !terminalTextHash
                    ? "terminal_relay_text_hash_missing"
                    : terminalTextHash !== computedTextHash
                      ? "terminal_relay_text_hash_mismatch"
                      : authority.grounding_required &&
                        authority.status !== "validated"
                        ? "required_grounding_evidence_missing"
                        : !authority.grounding_required &&
                          authority.status !== "not_required"
                          ? "terminal_grounding_authority_status_mismatch"
                          : null;

  return {
    askTurnId,
    terminalArtifactRef,
    terminalTextHash,
    terminalSpeechAuthorityStatus: failureCode ? "rejected" : "validated",
    relayBasis,
    groundingRequired: authority.grounding_required,
    groundingEvidenceRefs,
    groundingAuthorityRef: readString(authority.authority_id),
    groundingProofSource: resolved.proofSource,
    // Preliminary capability guesses remain on the handoff debug artifact only.
    requiredGroundingCapabilityIds: [],
    failureCode,
  };
};
