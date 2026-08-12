import crypto from "node:crypto";
import {
  HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA,
  type HelixTerminalGroundingAuthority,
  type HelixTerminalGroundingAuthorityFailureCode,
  type HelixTerminalGroundingAuthoritySource,
} from "@shared/helix-terminal-grounding-authority";
import { hashHelixTerminalText } from "./turn-terminal-authority";
import { providerBridgeAllEvidenceReentryCompatible } from "./provider-evidence-reentry-compatibility";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );

const normalizeSha256 = (value: string | null): string | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/^sha256:/, "");
  return /^[a-f0-9]{64}$/.test(normalized) ? `sha256:${normalized}` : null;
};

const hashAuthority = (value: unknown): string =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 20);

const readDebug = (payload: RecordLike): RecordLike | null => {
  const direct = readRecord(payload.debug);
  if (direct) return direct;
  const serialized = readString(payload.debug);
  if (!serialized) return null;
  try {
    return readRecord(JSON.parse(serialized));
  } catch {
    return null;
  }
};

const terminalTextFromPayload = (
  payload: RecordLike,
  terminalAuthority: RecordLike | null,
  terminalPresentation: RecordLike | null,
): string | null =>
  readString(payload.selected_final_answer) ??
  readString(payload.content) ??
  readString(payload.answer) ??
  readString(payload.text) ??
  readString(terminalPresentation?.concise_text) ??
  readString(terminalAuthority?.terminal_text_preview);

export const buildHelixTerminalGroundingAuthority = (input: {
  payload: RecordLike;
  turnId?: string | null;
  authoritySource?: HelixTerminalGroundingAuthoritySource;
}): HelixTerminalGroundingAuthority => {
  const payload = input.payload;
  const debug = readDebug(payload);
  const solverTrace =
    readRecord(payload.ask_turn_solver_trace) ??
    readRecord(debug?.ask_turn_solver_trace);
  const procedureTrace =
    readRecord(payload.ask_turn_procedure_trace) ??
    readRecord(debug?.ask_turn_procedure_trace);
  const terminalAuthority =
    readRecord(payload.terminal_answer_authority) ??
    readRecord(debug?.terminal_answer_authority);
  const terminalPresentation =
    readRecord(payload.terminal_presentation) ??
    readRecord(debug?.terminal_presentation);
  const singleWriter =
    readRecord(payload.terminal_authority_single_writer) ??
    readRecord(debug?.terminal_authority_single_writer);
  const selectedTerminalProduct = readRecord(
    procedureTrace?.selected_terminal_product,
  );
  const finalArbitration = readRecord(solverTrace?.final_arbitration);
  const evidenceReentryGate = readRecord(solverTrace?.evidence_reentry_gate);
  const routeEvidenceAuthority =
    readRecord(solverTrace?.route_evidence_authority) ??
    readRecord(payload.route_evidence_authority) ??
    readRecord(debug?.route_evidence_authority);
  const solverArtifactAudit =
    readRecord(payload.solver_artifact_reentry_audit) ??
    readRecord(solverTrace?.solver_artifact_reentry_audit) ??
    readRecord(debug?.solver_artifact_reentry_audit);
  const poisonAudit =
    readRecord(payload.poison_audit) ?? readRecord(debug?.poison_audit);

  const turnId =
    readString(input.turnId) ??
    readString(payload.turn_id ?? payload.turnId) ??
    readString(solverTrace?.turn_id) ??
    readString(terminalAuthority?.turn_id) ??
    readString(terminalPresentation?.turn_id) ??
    readString(procedureTrace?.turn_id) ??
    "unknown";
  const terminalArtifactKind =
    readString(payload.terminal_artifact_kind) ??
    readString(terminalAuthority?.terminal_artifact_kind) ??
    readString(terminalPresentation?.terminal_artifact_kind) ??
    readString(selectedTerminalProduct?.kind);
  const finalAnswerSource =
    readString(payload.final_answer_source) ??
    readString(terminalAuthority?.final_answer_source) ??
    readString(terminalPresentation?.final_answer_source);
  const terminalArtifactRef =
    readString(terminalAuthority?.terminal_artifact_ref) ??
    readString(terminalPresentation?.terminal_authority_ref) ??
    readString(selectedTerminalProduct?.ref) ??
    readString(singleWriter?.selected_terminal_artifact_ref) ??
    readString(payload.terminal_artifact_id);
  const terminalText = terminalTextFromPayload(
    payload,
    terminalAuthority,
    terminalPresentation,
  );
  const declaredTerminalTextHash = normalizeSha256(
    readString(terminalAuthority?.terminal_text_hash),
  );
  const computedTerminalTextHash = terminalText
    ? `sha256:${hashHelixTerminalText(terminalText)}`
    : null;

  const selectedEvidenceRefs = unique([
    ...readStringArray(payload.selected_terminal_support_refs),
    ...readStringArray(payload.terminal_synthesis_support_refs),
    ...readStringArray(terminalPresentation?.selected_observation_refs),
    ...readStringArray(terminalPresentation?.support_refs),
    ...readStringArray(evidenceReentryGate?.selected_evidence_refs),
  ]);
  const evidenceRequiredDeclaration =
    typeof evidenceReentryGate?.required === "boolean"
      ? evidenceReentryGate.required
      : null;
  const admittedRouteTools = Array.isArray(
    routeEvidenceAuthority?.admitted_tools,
  )
    ? routeEvidenceAuthority.admitted_tools
        .map(readRecord)
        .filter((entry): entry is RecordLike => Boolean(entry))
    : [];
  const routeDeclaresModelOnly =
    admittedRouteTools.length > 0 &&
    admittedRouteTools.every(
      (entry) =>
        readString(entry.family) === "model_only" ||
        readString(entry.capability_id) === "model_only" ||
        readString(entry.capability_id) === "family:model_only",
    );
  const routeGroundingEvidenceRefs = readStringArray(
    routeEvidenceAuthority?.supporting_evidence_refs,
  ).filter((ref) =>
    /:(?:observation|workstation_gateway|gateway_call|codex_normalized):/i.test(
      ref,
    ),
  );
  const hasGroundingSignals =
    selectedEvidenceRefs.length > 0 || routeGroundingEvidenceRefs.length > 0;
  const groundingModeKnown =
    evidenceRequiredDeclaration !== null ||
    hasGroundingSignals ||
    routeDeclaresModelOnly;
  const groundingModeConflict =
    (evidenceRequiredDeclaration === false || routeDeclaresModelOnly) &&
    hasGroundingSignals;
  const groundingRequired =
    evidenceRequiredDeclaration === true ||
    (evidenceRequiredDeclaration !== false && hasGroundingSignals);

  const declaredTurnIds = unique([
    readString(payload.turn_id ?? payload.turnId),
    readString(solverTrace?.turn_id),
    readString(terminalAuthority?.turn_id),
    readString(terminalPresentation?.turn_id),
    readString(procedureTrace?.turn_id),
    readString(evidenceReentryGate?.turn_id),
    readString(routeEvidenceAuthority?.turn_id),
    readString(solverArtifactAudit?.turn_id),
  ]);
  const turnBindingOk =
    turnId !== "unknown" &&
    declaredTurnIds.length > 0 &&
    declaredTurnIds.every((declaredTurnId) => declaredTurnId === turnId);
  const declaredArtifactRefs = unique([
    readString(terminalAuthority?.terminal_artifact_ref),
    readString(terminalPresentation?.terminal_authority_ref),
    readString(selectedTerminalProduct?.ref),
    readString(singleWriter?.selected_terminal_artifact_ref),
    readString(payload.terminal_artifact_id),
  ]);
  const artifactBindingOk =
    Boolean(terminalArtifactRef) &&
    declaredArtifactRefs.every(
      (declaredRef) => declaredRef === terminalArtifactRef,
    );
  const artifactKindBindingOk =
    unique([
      terminalArtifactKind,
      readString(terminalAuthority?.terminal_artifact_kind),
      readString(terminalPresentation?.terminal_artifact_kind),
      readString(selectedTerminalProduct?.kind),
      readString(finalArbitration?.terminal_artifact_kind),
    ]).length <= 1;
  const answerSourceBindingOk =
    unique([
      finalAnswerSource,
      readString(terminalAuthority?.final_answer_source),
      readString(terminalPresentation?.final_answer_source),
      readString(finalArbitration?.final_answer_source),
    ]).length <= 1;
  const completedSolverPath = solverTrace?.completed_solver_path === true;
  const routeProductContract = readRecord(payload.route_product_contract);
  const routeProductAllowedKinds = readStringArray(
    routeProductContract?.allowed_terminal_artifact_kinds,
  );
  const routeProductForbiddenKinds = readStringArray(
    routeProductContract?.forbidden_terminal_artifact_kinds,
  );
  const routeProductRequiredKind =
    readString(routeProductContract?.required_terminal_artifact_kind) ??
    readString(routeProductContract?.required_terminal_kind);
  const normalizedTerminalArtifactKind = terminalArtifactKind?.toLowerCase() ?? null;
  const routeProductContractAllowsTerminal = Boolean(
    normalizedTerminalArtifactKind &&
      readString(routeProductContract?.schema) ===
        "helix.route_product_contract.v1" &&
      (!readString(routeProductContract?.turn_id) ||
        readString(routeProductContract?.turn_id) === turnId) &&
      (
        routeProductRequiredKind?.toLowerCase() ===
          normalizedTerminalArtifactKind ||
        routeProductAllowedKinds.some(
          (kind) => kind.toLowerCase() === normalizedTerminalArtifactKind,
        )
      ) &&
      !routeProductForbiddenKinds.some(
        (kind) => kind.toLowerCase() === normalizedTerminalArtifactKind,
      ),
  );
  const routeEvidenceAllowedKinds = readStringArray(
    routeEvidenceAuthority?.allowed_terminal_artifact_kinds,
  );
  const routeEvidenceForbiddenKinds = readStringArray(
    routeEvidenceAuthority?.forbidden_terminal_artifact_kinds,
  );
  const routeEvidenceRequiredKind = readString(
    routeEvidenceAuthority?.required_terminal_kind,
  );
  const unresolvedRouteEvidenceProjection = Boolean(
    routeEvidenceAuthority?.terminal_product_allowed === false &&
      routeEvidenceAllowedKinds.length === 0 &&
      routeEvidenceForbiddenKinds.length === 0 &&
      (!routeEvidenceRequiredKind ||
        routeEvidenceRequiredKind.toLowerCase() === "unknown"),
  );
  const routeEvidenceTerminalProductRejected = Boolean(
    routeEvidenceAuthority?.terminal_product_allowed === false &&
      !(
        unresolvedRouteEvidenceProjection &&
        routeProductContractAllowsTerminal
      ),
  );
  const routeAuthorityOk =
    solverTrace?.route_authority_ok === true &&
    selectedTerminalProduct?.allowed_by_route !== false &&
    !routeEvidenceTerminalProductRejected;
  const poisonAuditOk =
    solverTrace?.poison_audit_ok === true && poisonAudit?.ok !== false;
  const terminalAuthorityOk =
    solverTrace?.terminal_authority_ok === true &&
    terminalAuthority?.server_authoritative === true &&
    terminalAuthority?.terminal_eligible !== false;
  const currentTurnOnly = routeEvidenceAuthority?.current_turn_only === true;
  const providerBridge =
    readRecord(payload.provider_terminal_authority_bridge) ??
    readRecord(debug?.provider_terminal_authority_bridge);
  const providerReentry =
    readRecord(payload.provider_reasoning_reentry) ??
    readRecord(debug?.provider_reasoning_reentry);
  const providerSupportedRefs = new Set(
    unique([
      ...readStringArray(providerBridge?.successful_gateway_observation_refs),
      ...readStringArray(
        providerBridge?.successful_capability_lane_observation_refs,
      ),
      ...readStringArray(providerBridge?.normalized_observation_refs),
      ...readStringArray(providerReentry?.normalized_observation_refs),
    ]),
  );
  const currentTurnLedger = [
    ...(Array.isArray(payload.current_turn_artifact_ledger)
      ? payload.current_turn_artifact_ledger
      : []),
    ...(Array.isArray(debug?.current_turn_artifact_ledger)
      ? debug.current_turn_artifact_ledger
      : []),
  ];
  for (const rawEntry of currentTurnLedger) {
    const entry = readRecord(rawEntry);
    const entryPayload = readRecord(entry?.payload);
    if (
      !entry ||
      (readString(entry.turn_id) && readString(entry.turn_id) !== turnId)
    )
      continue;
    const status = readString(entry.status) ?? readString(entryPayload?.status);
    if (status && /failed|rejected|blocked/i.test(status)) continue;
    const aliases = unique([
      readString(entry.artifact_id),
      readString(entryPayload?.artifact_id),
      readString(entry.provider_gateway_observation_ref),
      readString(entryPayload?.provider_gateway_observation_ref),
      ...readStringArray(entry.provider_gateway_packet_refs),
      ...readStringArray(entryPayload?.provider_gateway_packet_refs),
    ]);
    if (aliases.some((ref) => providerSupportedRefs.has(ref))) {
      aliases.forEach((ref) => providerSupportedRefs.add(ref));
    }
  }
  const providerBridgeReentryValid =
    readString(providerBridge?.schema) ===
      "helix.provider_terminal_authority_bridge.v1" &&
    readString(providerBridge?.turn_id) === turnId &&
    providerBridgeAllEvidenceReentryCompatible(providerBridge) &&
    providerBridge?.normalized_observations_ready === true &&
    providerBridge?.terminal_authority_granted === true &&
    providerBridge?.final_visible_answer_authorized === true &&
    readString(providerReentry?.schema) ===
      "helix.provider_reasoning_reentry.v1" &&
    readString(providerReentry?.turn_id) === turnId &&
    readString(providerReentry?.status) === "completed" &&
    providerReentry?.evidence_reentered === true &&
    providerReentry?.solver_completed === true &&
    providerReentry?.goal_satisfaction_compatible === true &&
    selectedEvidenceRefs.length > 0 &&
    selectedEvidenceRefs.every((ref) => providerSupportedRefs.has(ref));
  const evidenceReentryAuthorityValid =
    evidenceReentryGate?.reentry_authority === "runtime_event_log"
      ? evidenceReentryGate.runtime_lifecycle_verified === true
      : evidenceReentryGate?.reentry_authority ===
          "provider_terminal_authority_bridge"
        ? providerBridgeReentryValid
        : evidenceReentryGate?.reentry_authority === "compatibility_projection"
          ? procedureTrace?.evidence_reentry_status === "reentered"
          : false;
  const evidenceReentryCompleted =
    evidenceReentryGate?.completed === true &&
    (!groundingRequired || evidenceReentryAuthorityValid);
  const supportCoverageComplete =
    !groundingRequired ||
    (selectedEvidenceRefs.length > 0 &&
      solverArtifactAudit?.ok !== false &&
      !(
        Array.isArray(solverArtifactAudit?.terminal_relevant_artifacts) &&
        solverArtifactAudit.terminal_relevant_artifacts
          .map(readRecord)
          .filter((entry): entry is RecordLike => Boolean(entry))
          .some(
            (entry) =>
              entry.selected_as_support === true &&
              entry.reentered_solver !== true,
          )
      ));

  const failureCodes = unique(
    [
      !groundingModeKnown || groundingModeConflict
        ? "grounding_mode_ambiguous"
        : null,
      !completedSolverPath ? "solver_path_not_completed" : null,
      !routeAuthorityOk ? "route_authority_rejected" : null,
      !poisonAuditOk ? "poison_audit_rejected" : null,
      terminalAuthority?.server_authoritative !== true
        ? "terminal_answer_not_server_authoritative"
        : null,
      terminalAuthority?.terminal_eligible === false
        ? "terminal_answer_not_eligible"
        : null,
      !terminalText || !terminalArtifactKind || !finalAnswerSource
        ? "terminal_answer_contract_incomplete"
        : null,
      !turnBindingOk ? "terminal_turn_binding_mismatch" : null,
      !terminalArtifactRef ? "terminal_artifact_ref_missing" : null,
      terminalArtifactRef &&
      (!artifactBindingOk || !artifactKindBindingOk || !answerSourceBindingOk)
        ? "terminal_artifact_binding_mismatch"
        : null,
      !declaredTerminalTextHash ? "terminal_text_hash_missing" : null,
      declaredTerminalTextHash &&
      computedTerminalTextHash &&
      declaredTerminalTextHash !== computedTerminalTextHash
        ? "terminal_text_hash_mismatch"
        : null,
      selectedTerminalProduct?.allowed_by_route === false ||
      routeEvidenceTerminalProductRejected
        ? "terminal_product_not_allowed_by_route"
        : null,
      groundingRequired && !evidenceReentryCompleted
        ? "evidence_reentry_not_completed"
        : null,
      groundingRequired && !currentTurnOnly
        ? "evidence_not_current_turn"
        : null,
      groundingRequired && selectedEvidenceRefs.length === 0
        ? "selected_evidence_missing"
        : null,
      groundingRequired && !supportCoverageComplete
        ? "selected_evidence_support_incomplete"
        : null,
      groundingRequired && solverArtifactAudit?.ok === false
        ? "solver_artifact_reentry_rejected"
        : null,
    ].filter((entry): entry is HelixTerminalGroundingAuthorityFailureCode =>
      Boolean(entry),
    ),
  ) as HelixTerminalGroundingAuthorityFailureCode[];
  const status =
    failureCodes.length > 0
      ? "rejected"
      : groundingRequired
        ? "validated"
        : "not_required";
  const authoritySource =
    input.authoritySource ?? "canonical_terminal_boundary";
  const terminalTextHash = declaredTerminalTextHash ?? computedTerminalTextHash;

  return {
    schema: HELIX_TERMINAL_GROUNDING_AUTHORITY_SCHEMA,
    authority_id: `terminal-grounding:${hashAuthority([
      turnId,
      terminalArtifactRef,
      terminalTextHash,
      groundingRequired,
      status,
      selectedEvidenceRefs,
    ])}`,
    authority_source: authoritySource,
    turn_id: turnId,
    terminal_artifact_ref: terminalArtifactRef,
    terminal_artifact_kind: terminalArtifactKind,
    final_answer_source: finalAnswerSource,
    terminal_text_hash: terminalTextHash,
    grounding_required: groundingRequired,
    status,
    selected_evidence_refs: groundingRequired ? selectedEvidenceRefs : [],
    evidence_reentry_authority:
      groundingRequired &&
      (evidenceReentryGate?.reentry_authority === "runtime_event_log" ||
        evidenceReentryGate?.reentry_authority ===
          "provider_terminal_authority_bridge" ||
        evidenceReentryGate?.reentry_authority === "compatibility_projection")
        ? evidenceReentryGate.reentry_authority
        : null,
    runtime_lifecycle_verified:
      groundingRequired &&
      evidenceReentryGate?.runtime_lifecycle_verified === true,
    current_turn_only: groundingRequired ? currentTurnOnly : true,
    completed_solver_path: completedSolverPath,
    route_authority_ok: routeAuthorityOk,
    poison_audit_ok: poisonAuditOk,
    terminal_authority_ok: terminalAuthorityOk,
    support_coverage_complete: supportCoverageComplete,
    failure_code: failureCodes[0] ?? null,
    failure_codes: failureCodes,
    assistant_answer: false,
    terminal_eligible: false,
    provider_payload_included: false,
    raw_content_included: false,
  };
};

export const attachHelixTerminalGroundingAuthority = (input: {
  payload: RecordLike;
  turnId?: string | null;
}): HelixTerminalGroundingAuthority => {
  const authority = buildHelixTerminalGroundingAuthority({
    payload: input.payload,
    turnId: input.turnId,
    authoritySource: "canonical_terminal_boundary",
  });
  input.payload.terminal_grounding_authority = authority;
  const debug = readRecord(input.payload.debug);
  if (debug) debug.terminal_grounding_authority = authority;
  return authority;
};
