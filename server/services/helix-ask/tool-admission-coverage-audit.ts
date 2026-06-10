type ToolAdmissionCoverageAuditInput = {
  payload: Record<string, unknown>;
};

export type HelixToolAdmissionCoverageAudit = {
  schema: "helix.tool_admission_coverage_audit.v1";
  ok: boolean;
  source_target: string;
  tool_admission_required: boolean;
  retrieval_required: boolean;
  checks: Array<{
    check: string;
    passed: boolean;
    evidence: string | null;
  }>;
  violations: string[];
  assistant_answer: false;
  raw_content_included: false;
};

const REQUIRED_TOOL_ADMISSION_SOURCES = new Set([
  "visual_capture",
  "docs_viewer",
  "active_doc",
  "repo_code",
  "runtime_evidence",
  "procedure_memory",
  "situation_epoch",
  "visual_scene_memory",
  "process_graph",
  "live_pipeline",
  "world_event",
  "workspace_action",
]);

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" ? value as Record<string, unknown> : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean =>
  value === true;

const hasSchema = (value: unknown, schema: string): boolean =>
  readRecord(value)?.schema === schema;

const readRetrievalRequired = (payload: Record<string, unknown>): boolean => {
  const preflight = readRecord(payload.ask_turn_preflight_context);
  const directSignal = readRecord(payload.retrieval_required_signal);
  const preflightSignal = readRecord(preflight?.retrieval_required_signal);
  return readBoolean(preflightSignal?.required) || readBoolean(directSignal?.required);
};

export function auditToolAdmissionCoverage(input: ToolAdmissionCoverageAuditInput): HelixToolAdmissionCoverageAudit {
  const payload = input.payload;
  const sourceTargetIntent = readRecord(payload.source_target_intent);
  const routeProductContract = readRecord(payload.route_product_contract);
  const toolCallAdmissionDecision = readRecord(payload.tool_call_admission_decision);
  const productAuthorityGuard = readRecord(payload.product_authority_guard);
  const terminalPresentation = readRecord(payload.terminal_presentation);
  const terminalAuthority = readRecord(payload.terminal_answer_authority);
  const sourceTarget =
    readString(sourceTargetIntent?.target_source) ??
    readString(routeProductContract?.source_target) ??
    readString(toolCallAdmissionDecision?.source_target) ??
    "unknown";
  const admissionMode = readString(toolCallAdmissionDecision?.admission_mode);
  const unknownSourceDiscoveryAdmitted =
    sourceTarget === "unknown" &&
    admissionMode === "unknown_source_discovery" &&
    readBoolean(toolCallAdmissionDecision?.required);
  const retrievalRequired = readRetrievalRequired(payload);
  const toolAdmissionRequired =
    REQUIRED_TOOL_ADMISSION_SOURCES.has(sourceTarget) ||
    readBoolean(toolCallAdmissionDecision?.required) ||
    retrievalRequired;
  const checks = [
    {
      check: "source_target_intent_present",
      passed: hasSchema(sourceTargetIntent, "helix.ask_source_target_intent.v1"),
      evidence: readString(sourceTargetIntent?.target_source),
    },
    {
      check: "tool_call_admission_decision_present",
      passed: hasSchema(toolCallAdmissionDecision, "helix.tool_call_admission_decision.v1"),
      evidence: readString(toolCallAdmissionDecision?.source_target),
    },
    {
      check: "route_product_contract_present",
      passed: hasSchema(routeProductContract, "helix.route_product_contract.v1"),
      evidence: readString(routeProductContract?.source_target),
    },
    {
      check: "product_authority_guard_present",
      passed: hasSchema(productAuthorityGuard, "helix.product_authority_guard.v1"),
      evidence: readString(productAuthorityGuard?.reason),
    },
    {
      check: "product_authority_guard_allows_terminal",
      passed: !toolAdmissionRequired || productAuthorityGuard?.allowed === true,
      evidence: readString(productAuthorityGuard?.terminal_artifact_kind),
    },
    {
      check: "terminal_presentation_present",
      passed: hasSchema(terminalPresentation, "helix.terminal_presentation.v1"),
      evidence: readString(terminalPresentation?.terminal_artifact_kind),
    },
    {
      check: "terminal_answer_authority_present",
      passed: hasSchema(terminalAuthority, "helix.turn_terminal_authority.v1") && terminalAuthority?.server_authoritative === true,
      evidence: readString(terminalAuthority?.terminal_artifact_kind),
    },
    {
      check: "retrieval_required_has_source_target",
      passed: !retrievalRequired || unknownSourceDiscoveryAdmitted || (sourceTarget !== "unknown" && sourceTarget !== "model_only"),
      evidence: unknownSourceDiscoveryAdmitted ? "unknown_source_discovery" : sourceTarget,
    },
  ];
  const violations = checks
    .filter((check: (typeof checks)[number]) => toolAdmissionRequired || check.check === "retrieval_required_has_source_target")
    .filter((check: (typeof checks)[number]) => !check.passed)
    .map((check: (typeof checks)[number]) =>
      check.check === "tool_call_admission_decision_present"
        ? "missing_tool_admission_decision"
        : check.check,
    );
  return {
    schema: "helix.tool_admission_coverage_audit.v1",
    ok: violations.length === 0,
    source_target: sourceTarget,
    tool_admission_required: toolAdmissionRequired,
    retrieval_required: retrievalRequired,
    checks,
    violations,
    assistant_answer: false,
    raw_content_included: false,
  };
}
