import crypto from "node:crypto";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../golden-path/capability-failure";
import { buildRouteProductContract } from "../route-product-contract";
import { routeSituationContextTurn } from "../situation-context-turn-router";
import { applyHelixTerminalAuthoritySingleWriter } from "../terminal-authority-single-writer";

type RecordLike = Record<string, unknown>;

type ArtifactLike = {
  artifact_id?: string;
  payload?: unknown;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readPrompt = (body: RecordLike): string =>
  readString(body.raw_user_prompt) ??
  readString(body.prompt) ??
  readString(body.question) ??
  readString(body.transcript) ??
  "";

const readSessionId = (body: RecordLike): string | null =>
  readString(body.session_id) ?? readString(body.sessionId);

const readThreadId = (body: RecordLike): string | null =>
  readString(body.thread_id) ??
  readString(body.threadId) ??
  readSessionId(body);

const hashGoalFrame = (value: unknown): string =>
  crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);

export const maybeBuildHelixProviderProcedureMemoryPreflightTerminalPayload = (
  args: {
    body: RecordLike;
    turnId: string;
  },
): RecordLike | null => {
  const sourceTargetIntent =
    readRecord(args.body.source_target_intent) ??
    readRecord(args.body.sourceTargetIntent);
  if (
    readString(sourceTargetIntent?.target_source) !== "procedure_memory" ||
    readString(sourceTargetIntent?.strength) !== "hard"
  ) {
    return null;
  }

  const promptText = readPrompt(args.body);
  const threadId =
    readString(sourceTargetIntent?.thread_id) ??
    readThreadId(args.body) ??
    "helix-ask:desktop";
  const now = new Date();
  const route = routeSituationContextTurn({
    threadId,
    promptText,
    inputModality: "typed",
    turnId: args.turnId,
    submittedAt: now.toISOString(),
    serverReceivedAt: now.toISOString(),
    answerStartedAt: now.toISOString(),
  });
  if (!route.typed_failure) return null;

  const failureText =
    "Auntie Dot: sensors are separate from mission memory. Procedure memory is unavailable because no_active_situation_run. Repair hint: create_or_resume_situation_run.";
  const typedFailure = {
    ...route.typed_failure,
    error_code: "procedure_memory_unavailable",
    failure_kind: "procedure_memory_unavailable",
    requested_capability: "procedure_memory",
    failure_code:
      readString(route.typed_failure.failure_code) ??
      readString(route.typed_failure.error_code) ??
      "PROCEDURE_MEMORY_ACTIVE_SITUATION_RUN_MISSING",
    missing_evidence: ["active_situation_run", "procedure_memory"],
    next_required_action: "repair_procedure_memory",
    blocking_reason: "no_active_situation_run",
    repair_hint: "create_or_resume_situation_run",
    message: failureText,
    assistant_answer: false,
    raw_content_included: false,
  };
  const routeGateArtifactId = `${args.turnId}:procedure_memory_route_gate`;
  const terminalResultId =
    `${args.turnId}:procedure_memory_typed_failure_result`;
  const terminalArtifactId =
    `${args.turnId}:procedure_memory_typed_failure`;
  const payload = buildGoldenPathCapabilityTypedFailurePayload({
    turnId: args.turnId,
    traceId:
      readString(args.body.trace_id) ??
      readString(args.body.traceId) ??
      args.turnId,
    sessionId: readSessionId(args.body) ?? undefined,
    threadId,
    promptText,
    createdAtMs: now.getTime(),
    routeGateArtifactId,
    terminalResultId,
    requiredTerminalKind: "procedure_memory_recall",
    answerScope: "runtime_evidence",
    canonicalGoalFrameExtra: {
      requested_capability: "procedure_memory",
      deterministic_preflight_terminal: true,
      allowed_terminal_artifact_kinds: [
        "procedure_memory_recall",
        "procedure_epoch_replay",
        "typed_failure",
      ],
      forbidden_terminal_artifact_kinds: [
        "direct_answer_text",
        "model_only_concept",
        "no_tool_direct",
        "panel_generated_answer",
      ],
    },
    goalKind: "situation_context_question",
    classifierReasons: [
      "provider_preflight_hard_procedure_memory_source",
      "procedure_memory_source_unavailable",
    ],
    requestedCapability: "procedure_memory",
    selectedCapability: "procedure_memory",
    sourceTarget: "procedure_memory",
    family: "procedure_memory",
    requiredObservationKinds: ["active_situation_run", "procedure_memory"],
    status: "procedure_memory_unavailable",
    route: "procedure_memory_preflight",
    errorCode: "procedure_memory_unavailable",
    brokenRail: "observation",
    missingRequirement: "active_situation_run",
    text: failureText,
    terminalArtifactId,
    terminalArtifactRef: terminalArtifactId,
    terminalResultIdInRuntimeStatus: terminalResultId,
    routeGate: "hard_source_target",
    routeGateTerminalEligible: false,
    debugStatus: "procedure_memory_unavailable",
    debugPrivateRuntimeLoopEntered: false,
    completedSolverPath: false,
    goalSatisfaction: "not_satisfied",
    goalSatisfactionRepairTarget:
      readString(typedFailure.next_required_action) ??
      "repair_procedure_memory",
    routeAuthorityOk: true,
    terminalAuthorityOk: true,
    includeGoalSatisfactionInDebug: true,
    includeLedgerSupportRefs: true,
    includeTerminalErrorCodeInSolverTrace: true,
    includeFirstBrokenRailInTerminalAuthority: true,
    useTerminalErrorLedgerArtifact: true,
    hashGoalFrame,
  }) as RecordLike;
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? (payload.current_turn_artifact_ledger as ArtifactLike[])
    : [];
  const typedFailureArtifact = ledger.find(
    (artifact) => artifact.artifact_id === terminalArtifactId,
  );
  if (typedFailureArtifact) {
    typedFailureArtifact.payload = {
      ...(readRecord(typedFailureArtifact.payload) ?? {}),
      typed_failure: typedFailure,
      blocking_reason:
        readString(typedFailure.blocking_reason) ??
        "no_active_situation_run",
      repair_hint:
        readString(typedFailure.repair_hint) ??
        "create_or_resume_situation_run",
    };
  }
  payload.source_target_intent = sourceTargetIntent;
  payload.sourceTargetIntent = sourceTargetIntent;
  payload.route_product_contract =
    args.body.route_product_contract ??
    buildRouteProductContract({
      turnId: args.turnId,
      threadId,
      sourceTargetIntent,
      promptText,
    });
  const routeAuthorityAudit = {
    schema: "helix.route_authority_audit.v1",
    audit_id: `route-authority:${hashGoalFrame([
      args.turnId,
      "procedure_memory_preflight",
    ])}`,
    turn_id: args.turnId,
    prompt_hash: hashGoalFrame(promptText),
    source_target: "procedure_memory",
    target_kind: "procedure_memory",
    selected_route: "procedure_memory_preflight",
    terminal_artifact_kind: "typed_failure",
    final_answer_source: "typed_failure",
    route_product_precedence_reason:
      "deterministic_preflight_source_unavailable",
    allowed_terminal_artifact_kinds: ["typed_failure"],
    forbidden_terminal_artifact_kinds: [],
    terminal_artifact_allowed: true,
    route_authority_ok: true,
    primary_violation_code: null,
    violation_codes: [],
    route_authority_violation_code: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  payload.route_authority_audit = routeAuthorityAudit;
  payload.typed_failure = typedFailure;
  payload.active_situation_context = route.active_situation_context;
  payload.situation_evidence_selection = route.situation_evidence_selection;
  payload.procedure_evidence_retrieval_plan =
    route.procedure_evidence_retrieval_plan;
  payload.procedure_evidence_retrieval_result =
    route.procedure_evidence_retrieval_result;
  const debug = readRecord(payload.debug) ?? {};
  payload.debug = {
    ...debug,
    source_target_intent: sourceTargetIntent,
    route_authority_audit: routeAuthorityAudit,
    typed_failure: typedFailure,
    active_situation_context: route.active_situation_context,
    situation_evidence_selection: route.situation_evidence_selection,
    procedure_evidence_retrieval_plan:
      route.procedure_evidence_retrieval_plan,
    procedure_evidence_retrieval_result:
      route.procedure_evidence_retrieval_result,
  };
  applyHelixTerminalAuthoritySingleWriter({
    payload,
    turnId: args.turnId,
    threadId,
    artifactLedger: ledger,
  });
  return payload;
};
