import {
  inferToolFamilyFromToolName,
  resolveToolFamilyContract,
  TOOL_FAMILY_DEFAULT_CONTRACTS,
  type ToolFamilyContract,
} from "./tool-family-contract";
import {
  explicitCapabilityContractForCapability,
  explicitCapabilityMatches,
} from "./explicit-capability-contract";
import {
  CODEX_PARITY_AGENT_SPINE_CLASSES,
  CODEX_PARITY_AGENT_SPINE_RAIL_FAILURE_CODES,
  CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA,
  type CodexParityAgentSpineClass,
  type CodexParityAgentSpineFirstBrokenRail,
  type CodexParityAgentSpineRailFailureCode,
  type CodexParityAgentSpineRailStatus,
  type CodexParityAgentSpineRepairTarget,
} from "./codex-parity-agent-spine-contract";
import {
  contextualToolSuppressionBlocksFamily,
  detectContextualToolAdmissionSuppression,
  type HelixContextualToolAdmissionSuppression,
} from "./contextual-tool-admission";
import { WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS } from "./workstation-context-feed-query-tool-contracts";

type RecordLike = Record<string, unknown>;

type RailFailureCode = CodexParityAgentSpineRailFailureCode;

type RailStatus = CodexParityAgentSpineRailStatus;

type FirstBrokenRail = CodexParityAgentSpineFirstBrokenRail;

type FailureBucket =
  | "A_tool_did_not_execute"
  | "B_tool_executed_observation_missing"
  | "C_observation_not_reentered"
  | "D_support_backed_draft_missing"
  | "E_terminal_materializer_gap"
  | "F_terminal_projection_mismatch"
  | "G_config_missing"
  | "H_route_tool_family_contract_mismatch";

type RepairTarget = CodexParityAgentSpineRepairTarget;

type CodexParityClass = CodexParityAgentSpineClass;

const TOOL_TURN_CHAIN_FAILURE_CODES: RailFailureCode[] = [...CODEX_PARITY_AGENT_SPINE_RAIL_FAILURE_CODES];

const TOOL_TURN_CHAIN_MATRIX_FAMILIES = [
  "docs_viewer",
  "repo_code",
  "live_env",
  "workspace_directory",
  "calculator",
  "internet_search",
  "image_lens / visual_capture",
] as const;

const TERMINAL_RECEIPT_KINDS = new Set([
  "tool_receipt",
  "workspace_action_receipt",
  "workstation_tool_evaluation",
  "live_pipeline_receipt",
  "stage_play_workstation_control_receipt",
  "helix.narrator_say_request.v1",
  "helix.narrator_bind_stream_request.v1",
  "doc_open_receipt",
  "docs_viewer_receipt",
]);

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readNullableString = (value: unknown): string | null => {
  const stringValue = readString(value);
  return stringValue || null;
};

const readBoolean = (value: unknown): boolean => value === true;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => readString(entry))
        .filter(Boolean)
    : [];

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readFirstPromptText = (payload: RecordLike): string | null =>
  [
    payload.active_prompt,
    payload.prompt,
    payload.question,
    payload.user_prompt,
    payload.input_text,
    readRecord(payload.request)?.prompt,
    readRecord(payload.request)?.question,
  ].map(readString).find(Boolean) ?? null;

const unique = (values: string[]): string[] =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const normalize = (value: unknown): string =>
  readString(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const ledgerEntries = (payload: RecordLike): RecordLike[] =>
  Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
        .map((entry) => readRecord(entry))
        .filter((entry): entry is RecordLike => Boolean(entry))
    : [];

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : value ? [value] : [];

const supplementalPayloadArtifacts = (payload: RecordLike): RecordLike[] => {
  const entries: RecordLike[] = [];
  for (const validation of readArray(payload.calculator_result_validations)) {
    const record = readRecord(validation);
    if (!record) continue;
    entries.push({
      artifact_id: readString(record.validation_id) || `${readString(record.turn_id) || "turn"}:calculator_result_validation`,
      kind: "calculator_result_validation",
      schema: readString(record.schema) || "helix.calculator_result_validation.v1",
      source_scope: "debug_payload",
      payload: record,
    });
  }
  for (const receipt of readArray(payload.calculator_subgoal_receipts)) {
    const record = readRecord(receipt);
    if (!record) continue;
    entries.push({
      artifact_id: readString(record.receipt_id) || `${readString(record.turn_id) || "turn"}:calculator_subgoal_receipt`,
      kind: "calculator_subgoal_receipt",
      schema: readString(record.schema) || "helix.calculator_subgoal_receipt.v1",
      source_scope: "debug_payload",
      payload: record,
    });
  }
  return entries;
};

const artifactsForPayload = (payload: RecordLike): RecordLike[] => {
  const byRef = new Map<string, RecordLike>();
  for (const artifact of [...ledgerEntries(payload), ...supplementalPayloadArtifacts(payload)]) {
    byRef.set(artifactRef(artifact), artifact);
  }
  return Array.from(byRef.values());
};

const artifactPayload = (artifact: RecordLike): RecordLike | null => readRecord(artifact.payload);

const artifactRef = (artifact: RecordLike): string =>
  readString(artifact.artifact_id) ||
  readString(artifact.id) ||
  readString(artifact.ref) ||
  readString(artifact.kind) ||
  "artifact:unknown";

const artifactKindTokens = (artifact: RecordLike): string[] => {
  const payload = artifactPayload(artifact);
  return unique([
    readString(artifact.kind),
    readString(artifact.schema),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.type),
  ]);
};

const observationKindMatches = (artifact: RecordLike, requiredKind: string): boolean => {
  const required = normalize(requiredKind);
  if (!required) return false;
  return artifactKindTokens(artifact).some((token) => {
    const normalized = normalize(token);
    return normalized === required || normalized.includes(required) || required.includes(normalized);
  });
};

const firstString = (...values: unknown[]): string | null => {
  for (const value of values) {
    const stringValue = readString(value);
    if (stringValue) return stringValue;
  }
  return null;
};

const normalizedEqual = (left: unknown, right: unknown): boolean => {
  const normalizedLeft = normalize(left);
  const normalizedRight = normalize(right);
  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
};

const isGenericAuditFamily = (family: unknown): boolean => {
  const normalized = normalize(family);
  return (
    !normalized ||
    normalized === "none" ||
    normalized === "unknown" ||
    normalized === "debug_export" ||
    normalized === "workstation_action"
  );
};

const isModelAnswerCapability = (capability: unknown): boolean => {
  const normalized = normalize(capability);
  return (
    normalized === "model_direct_answer" ||
    normalized === "model_answer" ||
    normalized === "direct_answer" ||
    normalized === "final_answer" ||
    normalized === "answer"
  );
};

const nonModelToolCapability = (capability: unknown): string | null => {
  const stringValue = readString(capability);
  return stringValue && !isModelAnswerCapability(stringValue) ? stringValue : null;
};

const GENERIC_PLANNER_CAPABILITIES = new Set([
  "click_or_activate_control",
  "control_live_source",
  "execute_live_environment_action",
  "execute_workstation_action",
  "inspect_live_source",
  "open_or_validate_document",
  "retrieve_document_evidence",
]);

const isGenericPlannerCapability = (capability: unknown): boolean => {
  const normalized = normalize(capability);
  return normalized ? GENERIC_PLANNER_CAPABILITIES.has(normalized) : false;
};

const preferConcreteCapability = (
  candidate: unknown,
  concreteCapability: string | null,
): string | null => {
  const candidateCapability = readString(candidate);
  if (!candidateCapability) return concreteCapability;
  if (concreteCapability && isGenericPlannerCapability(candidateCapability)) return concreteCapability;
  return candidateCapability;
};

const runtimeLoopExecutedCapability = (payload: RecordLike): string | null => {
  const loop = readRecord(payload.agent_runtime_loop);
  const iterations = Array.isArray(loop?.iterations)
    ? loop.iterations.map((iteration) => readRecord(iteration)).filter((iteration): iteration is RecordLike => Boolean(iteration))
    : [];
  let terminalModelCapability: string | null = null;
  for (const iteration of [...iterations].reverse()) {
    const chosen = readString(iteration.chosen_capability);
    const producedArtifacts = readStringArray(iteration.produced_artifacts);
    if (
      chosen &&
      isModelAnswerCapability(chosen) &&
      producedArtifacts.some((artifactKind) => normalizedEqual(artifactKind, "direct_answer_text"))
    ) {
      terminalModelCapability = terminalModelCapability ?? chosen;
      continue;
    }
    const executed = nonModelToolCapability(iteration.executed_action_key);
    if (executed) return executed;
  }
  return terminalModelCapability;
};

const capabilityFromPayload = (payload: RecordLike, lifecycleTrace: RecordLike | null): string | null => {
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const plan = readRecord(payload.capability_plan);
  const runtimeToolCall = readRecord(payload.runtime_tool_call);
  return (
    runtimeLoopExecutedCapability(payload) ||
    nonModelToolCapability(lifecycleTrace?.executed_capability) ||
    readString(lifecycleTrace?.admitted_capability) ||
    readString(lifecycleTrace?.requested_capability) ||
    nonModelToolCapability(operationalTrace?.executed_capability) ||
    nonModelToolCapability(runtimeToolCall?.capability_key) ||
    readString(plan?.requested_action) ||
    null
  );
};

const familyFromPayload = (payload: RecordLike, lifecycleTrace: RecordLike | null): string | null => {
  const plan = readRecord(payload.capability_plan);
  return (
    readString(lifecycleTrace?.tool_family) ||
    readString(plan?.capability_family) ||
    inferToolFamilyFromToolName(capabilityFromPayload(payload, lifecycleTrace)) ||
    null
  );
};

const artifactInferredFamily = (artifacts: RecordLike[]): string | null => {
  let best: { family: string; score: number } | null = null;
  for (const contract of Object.values(TOOL_FAMILY_DEFAULT_CONTRACTS)) {
    const score = contract.requiredObservationKinds.reduce(
      (count, kind) => count + (artifacts.some((artifact) => observationKindMatches(artifact, kind)) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) {
      best = { family: contract.toolFamily, score };
    }
  }
  return best?.family ?? null;
};

const COMMON_CONTEXT_FEED_QUERY_ALIASES = new Set([
  "stage_play_workstation_context_feed_query_result",
  "stage_play_workstation_context_feed_query_result_v1",
]);

const capabilityFromCanonicalContextFeedQueryArtifacts = (haystack: string): string | null => {
  const normalizedHaystack = normalize(haystack);
  for (const spec of WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS) {
    if (
      spec.feedKind === "source_health" ||
      spec.feedKind === "trace_memory" ||
      spec.feedKind === "packet_traces"
    ) {
      continue;
    }

    const tokens = [
      spec.capability,
      spec.feedKind,
      spec.actuator,
      ...spec.aliases,
      spec.explicitRequiredObservationKind,
    ]
      .map(normalize)
      .filter((token) => token && !COMMON_CONTEXT_FEED_QUERY_ALIASES.has(token));

    if (tokens.some((token) => normalizedHaystack.includes(token))) return spec.capability;
  }
  return null;
};

const capabilityFromArtifacts = (artifacts: RecordLike[]): string | null => {
  const haystack = artifacts
    .flatMap((artifact) => [
      artifactRef(artifact),
      readString(artifact.kind),
      readString(artifact.schema),
      readString(artifact.producer_item_id),
      readString(artifact.source_scope),
      readString(artifactPayload(artifact)?.tool_name),
      readString(artifactPayload(artifact)?.capability),
      readString(artifactPayload(artifact)?.capability_key),
      readString(artifactPayload(artifact)?.requiredActuator),
      readString(artifactPayload(artifact)?.required_actuator),
      readString(artifactPayload(artifact)?.actuator),
      readString(artifactPayload(artifact)?.controlKind),
      readString(artifactPayload(artifact)?.control_kind),
      readString(artifactPayload(artifact)?.feed_kind),
      readString(artifactPayload(artifact)?.feedKind),
      readString(artifactPayload(artifact)?.source_kind),
      readString(artifactPayload(artifact)?.sourceKind),
    ])
    .join("\n")
    .toLowerCase();
  if (/scientific[-_]calculator[-_.:]solve[-_]expression|calculator_result|calculator_receipt/.test(haystack)) {
    return "scientific-calculator.solve_expression";
  }
  if (/docs[-_]viewer[-_.:]summarize[-_]doc|doc_summary/.test(haystack)) return "docs-viewer.summarize_doc";
  if (/docs[-_]viewer[-_.:]locate[-_]in[-_]doc|doc_location|doc_evidence_location/.test(haystack)) {
    return "docs-viewer.locate_in_doc";
  }
  if (/docs[-_]viewer[-_.:]doc[-_]equation[-_]context|doc_equation_context/.test(haystack)) {
    return "docs-viewer.doc_equation_context";
  }
  if (/helix_ask[-_.:]inspect_capability_catalog|capability_catalog_observation|capability_registry|helix\.capability_catalog_observation\.v1/.test(haystack)) {
    return "helix_ask.inspect_capability_catalog";
  }
  if (/situation[-_]room[-_.:]describe[-_]visual[-_]capture|situation_context_pack|helix\.situation_context_pack\.v1|visual_capture|image_lens/.test(haystack)) {
    return "situation-room.describe_visual_capture";
  }
  if (/repo[-_]code[-_.:]search[-_]concept|repo_code_search|repo_code_evidence/.test(haystack)) {
    return "repo-code.search_concept";
  }
  if (/internet[-_]search[-_.:]web[-_]research|web_research_observation|internet_search_observation/.test(haystack)) {
    return "internet_search.web_research";
  }
  if (/workspace[-_]directory[-_.:]resolve|workspace_directory_resolution/.test(haystack)) {
    return "workspace-directory.resolve";
  }
  if (/live_env[-_.:]process_live_source_mail|stage_play_live_source_mail_read_result/.test(haystack)) {
    return "live_env.process_live_source_mail";
  }
  if (/live_env[-_.:]read_processed_live_source_mail|stage_play_processed_mail_packet/.test(haystack)) {
    return "live_env.read_processed_live_source_mail";
  }
  if (/live_env[-_.:]reflect_live_source_mail_loop|stage_play_live_source_mail_loop_reflection/.test(haystack)) {
    return "live_env.reflect_live_source_mail_loop";
  }
  if (/live_env[-_.:]query_source_health|helix\.situation_source_capability_read|source_capability_read/.test(haystack)) {
    return "live_env.query_source_health";
  }
  if (/live_env[-_.:]query_live_source_quality|stage_play_live_source_quality/.test(haystack)) {
    return "live_env.query_live_source_quality";
  }
  if (/live_env[-_.:]summarize_live_source_current_state|stage_play_live_source_current_state/.test(haystack)) {
    return "live_env.summarize_live_source_current_state";
  }
  if (/live_env[-_.:]query_trace_memory|workstation_reasoning_trace_query|helix\.workstation_reasoning_trace_query_result|helix\.workstation_reasoning_trace\.v1/.test(haystack)) {
    return "live_env.query_trace_memory";
  }
  if (/live_env[-_.:]evaluate_goal_satisfaction|goal_satisfaction|helix\.live_environment_goal_satisfaction\.v1/.test(haystack)) {
    return "live_env.evaluate_goal_satisfaction";
  }
  if (/live_env[-_.:]query_packet_traces|packet_traces|per_packet_traces|packet_causal_trace|live_source_causal_trace/.test(haystack)) {
    return "live_env.query_packet_traces";
  }
  const contextFeedQueryCapability = capabilityFromCanonicalContextFeedQueryArtifacts(haystack);
  if (contextFeedQueryCapability) return contextFeedQueryCapability;
  if (/live_env[-_.:]set_visual_preset|set_visual_preset|visual_preset/.test(haystack)) {
    return "live_env.set_visual_preset";
  }
  if (/live_env[-_.:]set_audio_preset|set_audio_preset|audio_preset/.test(haystack)) {
    return "live_env.set_audio_preset";
  }
  if (/live_env[-_.:]change_workstation_preset|change_workstation_preset|apply_workstation_preset/.test(haystack)) {
    return "live_env.change_workstation_preset";
  }
  if (/live_env[-_.:]bind_workstation_source|bind_workstation_source|source_binding/.test(haystack)) {
    return "live_env.bind_workstation_source";
  }
  if (/live_env[-_.:]unbind_workstation_source|unbind_workstation_source|detach_source/.test(haystack)) {
    return "live_env.unbind_workstation_source";
  }
  if (/live_env[-_.:]pause_workstation_loop|pause_workstation_loop|pause_loop/.test(haystack)) {
    return "live_env.pause_workstation_loop";
  }
  if (/live_env[-_.:]resume_workstation_loop|resume_workstation_loop|resume_loop/.test(haystack)) {
    return "live_env.resume_workstation_loop";
  }
  if (/live_env[-_.:]set_workstation_loop_state|set_workstation_loop_state|repair_loop/.test(haystack)) {
    return "live_env.set_workstation_loop_state";
  }
  if (/live_env[-_.:]repair_workstation_source|repair_workstation_source|repair_source|source_repair/.test(haystack)) {
    return "live_env.repair_workstation_source";
  }
  if (/live_env[-_.:]update_live_answer_projection|update_live_answer_projection|live_answer_projection/.test(haystack)) {
    return "live_env.update_live_answer_projection";
  }
  if (/live_env[-_.:]focus_process_graph|focus_process_graph|process_graph_focus/.test(haystack)) {
    return "live_env.focus_process_graph";
  }
  if (/live_env[-_.:]narrator_say|narrator\.say|narrator_say_request|helix\.narrator_say_request\.v1/.test(haystack)) {
    return "live_env.narrator_say";
  }
  if (/live_env[-_.:]narrator_bind_stream|narrator\.bind_stream|narrator_bind_stream_request|helix\.narrator_bind_stream_request\.v1/.test(haystack)) {
    return "live_env.narrator_bind_stream";
  }
  if (/live_env[-_.:]configure_route_watch|configure_route_watch|route_watch_policy|route[-_\s]?watch/.test(haystack)) {
    return "live_env.configure_route_watch";
  }
  if (/stage_play_workstation_control_receipt/.test(haystack)) {
    return "live_env.change_workstation_preset";
  }
  if (/live_env[-_.:]query_workstation_goal_context|stage_play_workstation_goal_context_read_result|helix\.workstation_goal_context_update\.v1/.test(haystack)) {
    return "live_env.query_workstation_goal_context";
  }
  if (/live_env[-_.:]start_agent_goal_session|stage_play_agent_goal_session_tool_result|helix\.agent_goal_session\.v1/.test(haystack)) {
    return "live_env.start_agent_goal_session";
  }
  return null;
};

const shouldPreferArtifactFamily = (family: string | null, capability: string | null): boolean => {
  const normalizedFamily = normalize(family);
  const normalizedCapability = normalize(capability);
  return (
    isGenericAuditFamily(normalizedFamily) ||
    isModelAnswerCapability(normalizedCapability)
  );
};

const shouldPreferArtifactCapability = (capability: string | null): boolean => {
  const normalizedCapability = normalize(capability);
  return (
    !normalizedCapability ||
    isModelAnswerCapability(normalizedCapability)
  );
};

const contractSummary = (contract: ToolFamilyContract | null): RecordLike | null =>
  contract
    ? {
        tool_name: contract.toolName,
        tool_family: contract.toolFamily,
        authority: contract.authority,
        mutating: contract.mutating,
        required_observation_kinds: contract.requiredObservationKinds,
        allowed_terminal_kinds: contract.allowedTerminalKinds,
        required_reentry: contract.requiredReentry,
        requires_goal_satisfaction: contract.requiresGoalSatisfaction,
      }
    : null;

const canonicalAuditFamily = (family: unknown, capability?: unknown): string | null => {
  const capabilityFamily = inferToolFamilyFromToolName(readString(capability));
  const normalized = isGenericAuditFamily(family) && capabilityFamily ? normalize(capabilityFamily) : normalize(family) || normalize(capability);
  if (!normalized) return null;
  if (normalized.includes("live_source") || normalized.includes("live_env") || normalized.includes("micro_reasoner")) {
    return "live_env";
  }
  if (normalized.includes("image_lens") || normalized.includes("visual_capture") || normalized.includes("visual")) {
    return "image_lens / visual_capture";
  }
  return normalized;
};

const rejectedToolExecutionTexts = (payload: RecordLike, artifacts: RecordLike[]): string[] => {
  const payloadCandidates = [
    payload.runtime_tool_observation,
    payload.runtime_tool_call_validation,
    payload.runtime_tool_rejection,
    payload.tool_call_admission_decision,
    payload.capability_result,
  ];
  const artifactCandidates = artifacts.filter((artifact) =>
    /runtime_tool_observation|runtime_tool_call_validation|tool_rejection|tool_admission/i.test(
      [
        readString(artifact.kind),
        readString(artifact.schema),
        readString(artifactPayload(artifact)?.schema),
        readString(artifact.producer_item_id),
      ].join(" "),
    ),
  );
  return [
    ...payloadCandidates.map(readRecord).filter((entry): entry is RecordLike => Boolean(entry)),
    ...artifactCandidates.flatMap((artifact) => [artifact, artifactPayload(artifact)].filter(Boolean) as RecordLike[]),
  ].map((entry) =>
    [
      readString(entry.status),
      readString(entry.decision),
      readString(entry.reason),
      readString(entry.failure_reason),
      readString(entry.error_code),
      readString(entry.message),
      readString(entry.summary),
      readString(entry.text),
    ].join("\n"),
  );
};

const runtimeToolExecutionRejected = (payload: RecordLike, artifacts: RecordLike[]): boolean =>
  rejectedToolExecutionTexts(payload, artifacts).some((text) =>
    /\b(?:rejected\s+before\s+execution|forbidden(?:\s+by\s+tool\s+policy)?|not[_\s-]?admitted|blocked\s+before\s+execution|runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy|tool_call_rejected|tool_execution_rejected)\b/i.test(text),
  );

const runtimeToolPolicyRejectionArtifact = (artifacts: RecordLike[]): RecordLike | null =>
  artifacts.find((artifact) =>
    /\b(?:runtime_tool_observation|runtime_tool_call_validation|tool_rejection|tool_admission)\b/i.test(
      [
        readString(artifact.kind),
        readString(artifact.schema),
        readString(artifactPayload(artifact)?.schema),
        readString(artifact.producer_item_id),
      ].join(" "),
    ) &&
      /\b(?:rejected\s+before\s+execution|forbidden|not[_\s-]?admitted|runtime_capability_not_admitted_by_tool_policy|runtime_tool_forbidden_by_tool_policy)\b/i.test(
        [
          readString(artifactPayload(artifact)?.summary),
          readString(artifactPayload(artifact)?.message),
          readString(artifactPayload(artifact)?.failure_reason),
          readString(artifactPayload(artifact)?.error_code),
          readString(artifactPayload(artifact)?.text),
        ].join("\n"),
      ),
  ) ?? null;

const likelyInternetSearchConfigMissing = (payload: RecordLike, routeFamily: string | null): boolean => {
  if (canonicalAuditFamily(routeFamily) !== "internet_search") return false;
  const terminalError = readString(payload.terminal_error_code);
  const finalAnswer = readString(payload.selected_final_answer);
  const typedFailure = readRecord(payload.typed_failure);
  const text = [
    terminalError,
    finalAnswer,
    readString(typedFailure?.code),
    readString(typedFailure?.reason),
    readString(typedFailure?.message),
  ].join("\n");
  return /\b(?:config|configuration|api[-_\s]?key|provider|credential|tavily|exa|google\s+cse|search\s+key|missing\s+key)\b/i.test(text);
};

const artifactForKind = (artifacts: RecordLike[], kind: string): RecordLike | null =>
  artifacts.find((artifact) => observationKindMatches(artifact, kind)) ?? null;

const artifactSearchText = (artifact: RecordLike): string => {
  const payload = artifactPayload(artifact);
  return [
    artifactRef(artifact),
    readString(artifact.kind),
    readString(artifact.schema),
    readString(artifact.producer_item_id),
    readString(artifact.source_scope),
    readString(payload?.kind),
    readString(payload?.schema),
    readString(payload?.type),
    readString(payload?.tool_name),
    readString(payload?.capability),
    readString(payload?.capability_key),
  ].join("\n").toLowerCase();
};

const artifactSupportsCapabilityObservation = (artifact: RecordLike, capability: string | null): boolean => {
  const normalizedCapability = normalize(capability);
  if (!normalizedCapability) return false;
  const text = artifactSearchText(artifact);
  if (normalizedCapability === "scientific_calculator_solve_expression") {
    return /scientific[-_]calculator[-_.:]solve[-_]expression|calculator_result|calculator_receipt|workstation_tool_evaluation/.test(text);
  }
  if (normalizedCapability === "docs_viewer_locate_in_doc") {
    return /docs[-_]viewer[-_.:]locate[-_]in[-_]doc|doc_location|doc_evidence_location|agent_runtime_[^\s]*docs_viewer_locate_in_doc/.test(text);
  }
  if (normalizedCapability === "docs_viewer_summarize_doc") {
    return /docs[-_]viewer[-_.:]summarize[-_]doc|doc_summary/.test(text);
  }
  if (normalizedCapability === "repo_code_search_concept") {
    return /repo[-_]code[-_.:]search[-_]concept|repo_code_search|repo_code_evidence/.test(text);
  }
  if (normalizedCapability === "workspace_os_status") {
    return /workspace[-_]os[-_.:]status|workspace_os_status|workspace_status|workstation_tool_evaluation/.test(text);
  }
  if (normalizedCapability === "workspace_directory_resolve") {
    return /workspace[-_]directory[-_.:]resolve|workspace_directory_resolution/.test(text);
  }
  if (normalizedCapability === "internet_search_web_research") {
    return /internet[-_]search[-_.:]web[-_]research|web_research_observation|internet_search_observation/.test(text);
  }
  if (normalizedCapability === "helix_ask_inspect_capability_catalog") {
    return /capability_registry|capability_catalog_observation|helix\.capability_catalog_observation\.v1/.test(text);
  }
  if (normalizedCapability === "image_lens_inspect" || normalizedCapability === "situation_room_describe_visual_capture") {
    return /situation_context_pack|helix\.situation_context_pack\.v1|situation[-_]room[-_.:]describe[-_]visual[-_]capture|visual_capture|image_lens/.test(text);
  }
  if (normalizedCapability.startsWith("live_env_")) {
    return text.includes(normalizedCapability) || /stage_play|live_source|mail_packet|mailbox|live_env/.test(text);
  }
  return text.includes(normalizedCapability);
};

const artifactDisplayKind = (artifact: RecordLike): string | null =>
  firstString(
    artifact.kind,
    artifact.schema,
    artifactPayload(artifact)?.kind,
    artifactPayload(artifact)?.schema,
  );

const capabilityObservationArtifact = (
  artifacts: RecordLike[],
  capability: string | null,
  requiredKinds: string[],
): RecordLike | null => {
  const candidates = artifacts
    .map((artifact, index) => {
      const ref = artifactRef(artifact).toLowerCase();
      const text = artifactSearchText(artifact);
      const normalizedArtifactKind = normalize(artifact.kind);
      const normalizedCapability = normalize(capability);
      const requiredKindMatch = requiredKinds.some((kind) => observationKindMatches(artifact, kind));
      const exactArtifactKindMatch = requiredKinds.some((kind) => normalizedArtifactKind === normalize(kind));
      const capabilityMatch = artifactSupportsCapabilityObservation(artifact, capability);
      const genericObservation = /(?:observation|evidence|result|receipt|context|trace|packet|resolution|reflection|registry|summary)/i.test(
        artifactDisplayKind(artifact) ?? "",
      );
      let score = 0;
      if (capabilityMatch) score += 100;
      if (requiredKindMatch) score += 70;
      if (exactArtifactKindMatch) score += 45;
      if (genericObservation) score += 20;
      if (normalizedCapability.startsWith("live_env_") && normalizedArtifactKind === "reasoning_context") score += 140;
      if (ref.includes("agent_runtime")) score += 30;
      if (ref.includes("runtime_tool_call")) score += 25;
      if (ref.includes("model_step")) score -= 15;
      if (/^(?:workspace_context|doc_context|active_doc_path|validation)$/.test(normalizedArtifactKind) && !exactArtifactKindMatch) score -= 25;
      if (normalizedCapability.startsWith("live_env_") && normalizedArtifactKind === "runtime_tool_observation" && !exactArtifactKindMatch) {
        score -= 85;
      }
      if (
        normalizedCapability.startsWith("live_env_") &&
        /^(?:runtime_tool_call|runtime_tool_call_validation)$/.test(normalizedArtifactKind) &&
        !exactArtifactKindMatch
      ) {
        score -= 110;
      }
      if (/\bvalidation\b/.test(text) && !requiredKindMatch && !capabilityMatch) score -= 20;
      if (normalize(artifact.kind) === "direct_answer_text" && nonModelToolCapability(capability)) score -= 100;
      return { artifact, index, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index);
  return candidates[0]?.artifact ?? null;
};

const explicitObservationCoverageMode = (capability: string | null): "all" | "any" => {
  const normalized = normalize(capability);
  const explicitContract = explicitCapabilityContractForCapability(capability);
  if (explicitContract?.required_observation_kinds.includes("live_environment_tool_observation")) {
    return "any";
  }
  if (
    normalized === "image_lens_inspect" ||
    normalized === "situation_room_describe_visual_capture" ||
    normalized === "docs_viewer_locate_in_doc" ||
    normalized === "scientific_calculator_solve_expression"
  ) {
    return "any";
  }
  return "all";
};

const observationCoverageSatisfied = (
  coverage: RecordLike[],
  mode: "all" | "any",
): boolean => {
  if (coverage.length === 0) return true;
  return mode === "any"
    ? coverage.some((entry) => readBoolean(entry.present))
    : coverage.every((entry) => readBoolean(entry.present));
};

const finalAnswerDraftRef = (payload: RecordLike, artifacts: RecordLike[]): string | null => {
  const draftArtifact = [...artifacts].reverse().find((artifact) => normalize(artifact.kind) === "final_answer_draft");
  return (
    readString(draftArtifact?.artifact_id) ||
    readString(draftArtifact?.id) ||
    readString(readRecord(payload.final_answer_draft)?.draft_id) ||
    readString(readRecord(payload.final_answer_draft)?.artifact_id) ||
    null
  );
};

const supportRefsCount = (payload: RecordLike, artifacts: RecordLike[]): number => {
  const draftArtifact = [...artifacts].reverse().find((artifact) => normalize(artifact.kind) === "final_answer_draft");
  const draftPayload = readRecord(draftArtifact?.payload);
  const payloadDraft = readRecord(payload.final_answer_draft);
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  const refs = unique([
    ...readStringArray(payloadDraft?.support_refs),
    ...readStringArray(payloadDraft?.artifact_refs),
    ...readStringArray(draftPayload?.support_refs),
    ...readStringArray(draftPayload?.artifact_refs),
    ...readStringArray(terminalAuthority?.support_refs),
    ...readStringArray(terminalAnswerAuthority?.support_refs),
    ...readStringArray(draftSelection?.support_refs),
  ]);
  return (
    refs.length ||
    readNumber(payloadDraft?.support_refs_count) ||
    readNumber(draftPayload?.support_refs_count) ||
    readNumber(terminalAuthority?.support_refs_count) ||
    readNumber(terminalAnswerAuthority?.support_refs_count) ||
    readNumber(draftSelection?.support_refs_count) ||
    0
  );
};

const requiredTerminalKind = (payload: RecordLike, contract: ToolFamilyContract | null): string | null => {
  const canonicalGoal = readRecord(payload.canonical_goal_frame);
  const routeProductContract = readRecord(payload.route_product_contract);
  return (
    firstString(
      canonicalGoal?.required_terminal_kind,
      routeProductContract?.required_terminal_artifact_kind,
      routeProductContract?.required_terminal_kind,
    ) ||
    readStringArray(routeProductContract?.allowed_terminal_artifact_kinds)[0] ||
    contract?.allowedTerminalKinds[0] ||
    null
  );
};

const materializedTerminalKind = (payload: RecordLike): string | null => {
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  return firstString(
    terminalAuthority?.selected_terminal_artifact_kind,
    terminalAnswerAuthority?.terminal_artifact_kind,
    terminalAuthority?.terminal_artifact_kind,
    terminalAuthority?.integrity && readRecord(terminalAuthority.integrity)?.materialized_terminal_artifact_kind,
    terminalAuthority?.materialized_terminal_artifact_kind,
    draftSelection?.materialized_terminal_artifact_kind,
    payload.terminal_artifact_kind,
  );
};

const terminalAuthorityEvidence = (payload: RecordLike): { kind: string | null; source: string | null; proven: boolean } => {
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const terminalAnswerAuthority = readRecord(payload.terminal_answer_authority);
  const candidates: Array<{ kind: unknown; source: string }> = [
    {
      kind: terminalAuthority?.selected_terminal_artifact_kind,
      source: "terminal_authority_single_writer.selected_terminal_artifact_kind",
    },
    {
      kind: terminalAnswerAuthority?.terminal_artifact_kind,
      source: "terminal_answer_authority.terminal_artifact_kind",
    },
    {
      kind: terminalAuthority?.terminal_artifact_kind,
      source: "terminal_authority_single_writer.terminal_artifact_kind",
    },
  ];
  for (const candidate of candidates) {
    const kind = readString(candidate.kind);
    if (kind) {
      return { kind, source: candidate.source, proven: true };
    }
  }
  return { kind: null, source: null, proven: false };
};

const terminalAuthorityKind = (payload: RecordLike): string | null => {
  return terminalAuthorityEvidence(payload).kind;
};

const visibleTerminalEvidence = (payload: RecordLike): { kind: string | null; source: string | null; proven: boolean } => {
  const presentation = readRecord(payload.terminal_presentation);
  const resolvedSummary = readRecord(payload.resolved_turn_summary);
  const candidates: Array<{ kind: unknown; source: string }> = [
    { kind: presentation?.terminal_artifact_kind, source: "terminal_presentation.terminal_artifact_kind" },
    { kind: resolvedSummary?.terminal_artifact_kind, source: "resolved_turn_summary.terminal_artifact_kind" },
    { kind: payload.terminal_artifact_kind, source: "payload.terminal_artifact_kind" },
  ];
  for (const candidate of candidates) {
    const kind = readString(candidate.kind);
    if (kind) {
      return { kind, source: candidate.source, proven: true };
    }
  }
  return { kind: null, source: null, proven: false };
};

const visibleTerminalKind = (payload: RecordLike): string | null => {
  return visibleTerminalEvidence(payload).kind;
};

const terminalDebugMirrorKinds = (payload: RecordLike): Array<{ source: string; terminal_kind: string }> => {
  const resolvedSummary = readRecord(payload.resolved_turn_summary);
  const terminalAuthority = readRecord(payload.terminal_authority_single_writer);
  const authorityIntegrity = readRecord(terminalAuthority?.integrity);
  const draftSelection = readRecord(payload.final_answer_draft_selection);
  const debug = readRecord(payload.debug);
  const debugResolvedSummary = readRecord(debug?.resolved_turn_summary);
  const candidates: Array<{ source: string; terminal_kind: string | null }> = [
    { source: "payload.terminal_artifact_kind", terminal_kind: readString(payload.terminal_artifact_kind) },
    { source: "payload.resolved_turn_summary.terminal_artifact_kind", terminal_kind: readString(resolvedSummary?.terminal_artifact_kind) },
    {
      source: "terminal_authority_single_writer.integrity.materialized_terminal_artifact_kind",
      terminal_kind: readString(authorityIntegrity?.materialized_terminal_artifact_kind),
    },
    {
      source: "final_answer_draft_selection.materialized_terminal_artifact_kind",
      terminal_kind: readString(draftSelection?.materialized_terminal_artifact_kind),
    },
    { source: "debug.terminal_artifact_kind", terminal_kind: readString(debug?.terminal_artifact_kind) },
    {
      source: "debug.resolved_turn_summary.terminal_artifact_kind",
      terminal_kind: readString(debugResolvedSummary?.terminal_artifact_kind),
    },
  ];
  return candidates.filter((entry): entry is { source: string; terminal_kind: string } => Boolean(entry.terminal_kind));
};

const staleTerminalDebugMirrors = (payload: RecordLike, terminalAuthority: string | null): Array<{ source: string; terminal_kind: string }> => {
  if (!terminalAuthority) return [];
  return terminalDebugMirrorKinds(payload).filter((entry) => !normalizedEqual(entry.terminal_kind, terminalAuthority));
};

const expectedReentryCapability = (
  contract: ToolFamilyContract | null,
  artifacts: RecordLike[],
  followupDecision: RecordLike | null,
  observationRef: string | null,
): string | null => {
  const explicit = firstString(followupDecision?.required_next_capability, followupDecision?.next_tool);
  if (explicit) return explicit;
  for (const rule of contract?.requiredNextWhen ?? []) {
    const hasTrigger = artifacts.some((artifact) => observationKindMatches(artifact, rule.observationKind));
    const hasForbidUntil = rule.forbidTerminalUntil.some((kind) =>
      artifacts.some((artifact) => observationKindMatches(artifact, kind)),
    );
    if (hasTrigger && !hasForbidUntil) return rule.nextTool;
  }
  return contract?.requiredReentry && observationRef ? "model.direct_answer" : null;
};

const contextualToolReferenceSuppressed = (payload: RecordLike, capabilityPlan: RecordLike | null): boolean => {
  const arbitration = readRecord(capabilityPlan?.capability_contract_arbitration);
  const text = [
    readString(arbitration?.contract_state),
    readString(capabilityPlan?.requested_action),
    readString(capabilityPlan?.selected_capability),
    readString(capabilityPlan?.rejection_reason),
    readString(capabilityPlan?.suppression_reason),
    readString(payload.final_answer_source),
  ].join(" ");
  return (
    readBoolean(capabilityPlan?.tool_admission_suppressed) ||
    readBoolean(payload.tool_admission_suppressed) ||
    /\bsuppressed_contextual_reference\b/i.test(text) ||
    /\bsuppressed_contextual_tool_reference\b/i.test(text) ||
    /\bcontextual_tool_reference_suppressed\b/i.test(text)
  );
};

const buildToolTurnChainAudit = (input: {
  payload: RecordLike;
  artifacts: RecordLike[];
  lifecycleTrace: RecordLike | null;
  followupDecision: RecordLike | null;
  capability: string | null;
  toolFamily: string | null;
  contract: ToolFamilyContract | null;
  requiredObservationCoverage: RecordLike[];
  requiredObservationsSatisfied: boolean;
}): RecordLike => {
  const admission = readRecord(input.payload.tool_call_admission_decision);
  const capabilityPlan = readRecord(input.payload.capability_plan);
  const contextualSuppression = contextualToolReferenceSuppressed(input.payload, capabilityPlan);
  const requestedCapability = firstString(
    admission?.requested_capability,
    capabilityPlan?.requested_capability,
  );
  const requestedCapabilityContract = explicitCapabilityContractForCapability(requestedCapability);
  const operationalTrace = readRecord(input.payload.operational_capability_trace);
  const runtimeToolCall = readRecord(input.payload.runtime_tool_call);
  const concreteSelectedCapability = firstString(
    nonModelToolCapability(operationalTrace?.model_proposed_capability),
    nonModelToolCapability(input.lifecycleTrace?.admitted_capability),
    nonModelToolCapability(input.lifecycleTrace?.requested_capability),
    nonModelToolCapability(runtimeToolCall?.capability_key),
    nonModelToolCapability(input.lifecycleTrace?.executed_capability),
    nonModelToolCapability(operationalTrace?.executed_capability),
  );
  const selectedCapability =
    preferConcreteCapability(
      firstString(
        capabilityPlan?.selected_capability,
        input.lifecycleTrace?.admitted_capability,
        input.lifecycleTrace?.requested_capability,
      ),
      concreteSelectedCapability,
    ) ?? input.capability;
  const toolExecutionRejected = runtimeToolExecutionRejected(input.payload, input.artifacts);
  const capabilityCatalogArtifact = input.artifacts.find((artifact) => observationKindMatches(artifact, "capability_registry")) ?? null;
  const requestedObservationKinds = unique([
    ...readStringArray(admission?.required_observation_kinds_for_requested_capability),
    ...(requestedCapabilityContract?.required_observation_kinds ?? []),
  ]);
  const selectedCapabilityObservationArtifact = capabilityObservationArtifact(
    input.artifacts,
    selectedCapability ?? requestedCapability ?? input.capability,
    requestedObservationKinds,
  );
  const rawExecutedCapability = firstString(
    selectedCapability === "helix_ask.inspect_capability_catalog" && capabilityCatalogArtifact
      ? "helix_ask.inspect_capability_catalog"
      : null,
    !contextualSuppression && selectedCapability && selectedCapabilityObservationArtifact && nonModelToolCapability(selectedCapability)
      ? selectedCapability
      : null,
    runtimeLoopExecutedCapability(input.payload),
    nonModelToolCapability(input.lifecycleTrace?.executed_capability),
    nonModelToolCapability(operationalTrace?.executed_capability),
    nonModelToolCapability(runtimeToolCall?.capability_key),
  );
  const executedCapability = toolExecutionRejected ? null : rawExecutedCapability;
  const requestedSelectedMatch =
    requestedCapability && selectedCapability
      ? explicitCapabilityMatches(requestedCapability, selectedCapability)
      : requestedCapability
        ? false
        : null;
  const selectedExecutedMatch =
    selectedCapability && executedCapability
      ? normalizedEqual(selectedCapability, executedCapability)
      : selectedCapability
        ? false
        : null;
  const requestedExecutedMatch =
    requestedCapability && executedCapability
      ? explicitCapabilityMatches(requestedCapability, executedCapability)
      : requestedCapability
        ? false
        : null;
  const selectedFamily = inferToolFamilyFromToolName(selectedCapability);
  const rawRouteFamily = firstString(input.toolFamily, input.contract?.toolFamily, selectedFamily);
  const routeFamily = contextualSuppression
    ? "model_only"
    : isGenericAuditFamily(rawRouteFamily) && selectedFamily
      ? selectedFamily
      : rawRouteFamily;
  const executedFamily = inferToolFamilyFromToolName(executedCapability);
  const observationCoverage = input.requiredObservationCoverage.find((entry) => readBoolean(entry.present));
  const policyRejectionArtifact = runtimeToolPolicyRejectionArtifact(input.artifacts);
  const observationArtifactKind =
    toolExecutionRejected
      ? null
      : selectedCapability === "helix_ask.inspect_capability_catalog" && capabilityCatalogArtifact
        ? "capability_registry"
      : selectedCapabilityObservationArtifact
        ? artifactDisplayKind(selectedCapabilityObservationArtifact)
      : readString(observationCoverage?.kind) ||
        input.artifacts
          .map((artifact) => readString(artifact.kind) || readString(artifact.schema))
          .find((kind) => /(?:observation|evidence|result|receipt|context|validation|trace|packet|resolution|reflection)/i.test(kind)) ||
        null;
  const observationRef =
    toolExecutionRejected
      ? null
      : selectedCapability === "helix_ask.inspect_capability_catalog" && capabilityCatalogArtifact
        ? artifactRef(capabilityCatalogArtifact)
      : selectedCapabilityObservationArtifact
        ? artifactRef(selectedCapabilityObservationArtifact)
      : readStringArray(observationCoverage?.artifact_refs)[0] ||
        (observationArtifactKind ? artifactRef(artifactForKind(input.artifacts, observationArtifactKind) ?? {}) : null);
  const observedArtifactSupportsRequestedCapability =
    requestedObservationKinds.length === 0 ||
    input.artifacts.some((artifact) =>
      requestedObservationKinds.some((kind) => observationKindMatches(artifact, kind)),
    );
  const requiredTerminal =
    requestedCapabilityContract?.capability === "image_lens.inspect"
      ? requestedCapabilityContract.required_terminal_kind
      : requiredTerminalKind(input.payload, input.contract);
  const supportCount = supportRefsCount(input.payload, input.artifacts);
  const materializedTerminal = materializedTerminalKind(input.payload);
  const authorityTerminalEvidence = terminalAuthorityEvidence(input.payload);
  const visibleTerminalProjection = visibleTerminalEvidence(input.payload);
  const authorityTerminal = authorityTerminalEvidence.kind;
  const visibleTerminal = visibleTerminalProjection.kind;
  const staleDebugMirrors = staleTerminalDebugMirrors(input.payload, authorityTerminal);
  const finalDraftRef = finalAnswerDraftRef(input.payload, input.artifacts);
  const modelDirectAnswerMaterialized = Boolean(
    normalizedEqual(selectedCapability, "model.direct_answer") &&
      input.artifacts.some((artifact) => observationKindMatches(artifact, "direct_answer_text")) &&
      (!requiredTerminal || normalizedEqual(requiredTerminal, "direct_answer_text")),
  );
  const capabilityCatalogSummaryMaterialized = Boolean(
    normalizedEqual(selectedCapability, "helix_ask.inspect_capability_catalog") &&
      capabilityCatalogArtifact &&
      observationRef &&
      normalizedEqual(requiredTerminal, "capability_help_summary") &&
      (normalizedEqual(materializedTerminal, "capability_help_summary") ||
        normalizedEqual(authorityTerminal, "capability_help_summary") ||
        normalizedEqual(visibleTerminal, "capability_help_summary") ||
        normalizedEqual(input.payload.final_answer_source, "capability_help_summary") ||
        input.artifacts.some((artifact) => observationKindMatches(artifact, "capability_help_summary"))),
  );
  const reentryProofSource =
    readString(input.lifecycleTrace?.lifecycle_stage) === "reentered_solver"
      ? "tool_lifecycle_trace.lifecycle_stage"
      : readBoolean(input.followupDecision?.evidence_reentered)
        ? "tool_followup_decision.evidence_reentered"
        : modelDirectAnswerMaterialized
          ? "direct_answer_text_materialized"
          : capabilityCatalogSummaryMaterialized
            ? "capability_help_summary_materialized_from_catalog_observation"
          : observationRef && supportCount > 0 && finalDraftRef
            ? "final_answer_draft_with_support_refs"
            : null;
  const reentryExecuted = Boolean(reentryProofSource);
  const expectedReentry = expectedReentryCapability(
    input.contract,
    input.artifacts,
    input.followupDecision,
    observationRef,
  );
  const terminalProjectionMismatch = Boolean(authorityTerminal && visibleTerminal && !normalizedEqual(authorityTerminal, visibleTerminal));
  const terminalProductMismatch = Boolean(
    requiredTerminal &&
      materializedTerminal &&
      materializedTerminal !== "typed_failure" &&
      !normalizedEqual(requiredTerminal, materializedTerminal) &&
      !(input.contract?.allowedTerminalKinds ?? []).some((kind) => normalizedEqual(kind, materializedTerminal)),
  );
  const terminalProductAllowed = Boolean(
    materializedTerminal &&
      !terminalProductMismatch &&
      (!requiredTerminal ||
        normalizedEqual(requiredTerminal, materializedTerminal) ||
        (input.contract?.allowedTerminalKinds ?? []).some((kind) => normalizedEqual(kind, materializedTerminal))),
  );
  const concreteTurnChainComplete = Boolean(
    executedCapability &&
      observationRef &&
      reentryExecuted &&
      terminalProductAllowed &&
      authorityTerminal &&
      visibleTerminal &&
      normalizedEqual(authorityTerminal, visibleTerminal),
  );
  const contextualSuppressionComplete = Boolean(
    contextualSuppression &&
      reentryExecuted &&
      terminalProductAllowed &&
      authorityTerminal &&
      visibleTerminal &&
      normalizedEqual(authorityTerminal, visibleTerminal),
  );
  const routeFamilyMismatch = Boolean(
    selectedFamily && executedFamily && selectedFamily !== executedFamily,
  );
  const toolAdmissionDrift = Boolean(
    selectedCapability &&
      executedCapability &&
      !normalizedEqual(selectedCapability, executedCapability) &&
      !routeFamilyMismatch,
  );
  const configMissing = likelyInternetSearchConfigMissing(input.payload, routeFamily);
  const repoWeakEvidenceRepairLoop =
    readString(input.payload.terminal_error_code) === "repo_evidence_weak_after_repair" ||
    input.artifacts.some((artifact) => {
      if (normalize(artifact.kind) !== "typed_failure") return false;
      const payload = artifactPayload(artifact);
      return readString(payload?.error_code) === "repo_evidence_weak_after_repair";
    });
  const terminalErrorCode = readString(input.payload.terminal_error_code);
  const typedFailureSelected = Boolean(
    normalizedEqual(materializedTerminal, "typed_failure") ||
      normalizedEqual(authorityTerminal, "typed_failure") ||
      normalizedEqual(visibleTerminal, "typed_failure"),
  );
  const typedFailureInsteadOfRequiredTerminal = Boolean(
    terminalErrorCode &&
      typedFailureSelected &&
      requiredTerminal &&
      !normalizedEqual(requiredTerminal, "typed_failure"),
  );
  const draftNeedsSupport =
    Boolean(finalDraftRef) &&
    Boolean(materializedTerminal) &&
    !["typed_failure", "direct_answer_text", "tool_receipt"].some((kind) => normalizedEqual(kind, materializedTerminal));
  const railFailureCode: RailFailureCode | null =
    configMissing
      ? "config_missing"
      : contextualSuppressionComplete
        ? null
        : requestedCapability && requestedSelectedMatch === false
        ? "explicit_capability_not_selected"
        : requestedCapability && executedCapability && requestedExecutedMatch === false
          ? "wrong_capability_executed"
          : routeFamilyMismatch
            ? "route_family_mismatch"
            : toolAdmissionDrift
              ? "tool_admission_drift"
              : toolExecutionRejected
                ? "tool_execution_rejected"
                : requestedCapability && observationRef && !observedArtifactSupportsRequestedCapability
                  ? "required_observation_missing"
                  : repoWeakEvidenceRepairLoop
                    ? "weak_evidence_repair_loop"
                    : !input.requiredObservationsSatisfied && !concreteTurnChainComplete
                      ? "observation_missing"
                      : observationRef && !reentryExecuted
                        ? "observation_not_reentered"
                        : expectedReentry && !reentryExecuted
                          ? "reentry_step_not_executed"
                          : draftNeedsSupport && supportCount === 0
                            ? "support_refs_missing"
                            : typedFailureInsteadOfRequiredTerminal
                              ? "terminal_not_materialized"
                              : terminalProductMismatch
                              ? "terminal_product_mismatch"
                              : !materializedTerminal
                                ? "terminal_not_materialized"
                                : !authorityTerminal
                                  ? "terminal_authority_missing"
                                  : terminalProjectionMismatch
                                    ? "terminal_projection_mismatch"
                                    : staleDebugMirrors.length > 0
                                      ? "debug_mirror_stale"
                                      : null;
  const railStatus: RailStatus =
    railFailureCode === null ? "complete" : materializedTerminal === "typed_failure" ? "fail_closed" : "broken";

  return {
    schema: "helix.tool_turn_chain_audit.v1",
    capability_contract_guard_version: requestedCapability ? "E82" : null,
    route_family: routeFamily,
    requested_capability: requestedCapability,
    requested_capability_family:
      readNullableString(admission?.requested_capability_family) ??
      requestedCapabilityContract?.capability_family ??
      null,
    requested_capability_source:
      readNullableString(admission?.requested_capability_source) ??
      readNullableString(capabilityPlan?.requested_capability_source) ??
      null,
    requested_capability_confidence: readNumber(admission?.requested_capability_confidence),
    selected_capability: selectedCapability,
    executed_capability: executedCapability,
    requested_selected_match: requestedSelectedMatch,
    selected_executed_match: selectedExecutedMatch,
    substitution_rule_applied: false,
    substitution_rule_id: null,
    required_observation_kinds_for_requested_capability: requestedObservationKinds,
    observed_artifact_supports_requested_capability: requestedCapability
      ? observedArtifactSupportsRequestedCapability
      : null,
    policy_rejection_ref: toolExecutionRejected && policyRejectionArtifact ? artifactRef(policyRejectionArtifact) : null,
    policy_rejection_reason: toolExecutionRejected ? rejectedToolExecutionTexts(input.payload, input.artifacts).find(Boolean) ?? null : null,
    observation_artifact_kind: observationArtifactKind,
    observation_ref: observationRef,
    required_terminal_kind: requiredTerminal,
    expected_reentry_capability: expectedReentry,
    reentry_executed: reentryExecuted,
    reentry_proof_source: reentryProofSource,
    reentry_proven: reentryExecuted,
    final_answer_draft_ref: finalDraftRef,
    support_refs_count: supportCount,
    materialized_terminal_artifact_kind: materializedTerminal,
    terminal_authority_kind: authorityTerminal,
    terminal_authority_proof_source: authorityTerminalEvidence.source,
    terminal_authority_proven: authorityTerminalEvidence.proven,
    visible_terminal_kind: visibleTerminal,
    visible_projection_source: visibleTerminalProjection.source,
    visible_projection_proven: visibleTerminalProjection.proven,
    stale_terminal_debug_mirrors: staleDebugMirrors,
    rail_status: railStatus,
    rail_failure_code: railFailureCode,
    normalized_failure_codes: TOOL_TURN_CHAIN_FAILURE_CODES,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildToolTurnChainFamilyMatrix = (audit: RecordLike): RecordLike[] => {
  const family = canonicalAuditFamily(audit.route_family, audit.executed_capability);
  return TOOL_TURN_CHAIN_MATRIX_FAMILIES.map((matrixFamily) => {
    const observed = family === matrixFamily;
    const authority = readString(audit.terminal_authority_kind);
    const visible = readString(audit.visible_terminal_kind);
    return {
      route_family: matrixFamily,
      observed,
      requested_capability: observed ? audit.requested_capability ?? null : null,
      requested_selected_match: observed ? audit.requested_selected_match ?? null : null,
      selected_executed_match: observed ? audit.selected_executed_match ?? null : null,
      did_tool_run: observed ? Boolean(readString(audit.executed_capability)) : null,
      artifact_produced: observed ? Boolean(readString(audit.observation_ref)) : null,
      observation_artifact_kind: observed ? audit.observation_artifact_kind ?? null : null,
      observation_ref: observed ? audit.observation_ref ?? null : null,
      artifact_reentered: observed ? audit.reentry_executed === true : null,
      required_terminal_kind: observed ? audit.required_terminal_kind ?? null : null,
      materialized: observed ? Boolean(readString(audit.materialized_terminal_artifact_kind)) : null,
      materialized_terminal_artifact_kind: observed ? audit.materialized_terminal_artifact_kind ?? null : null,
      terminal_authority_selected: observed ? Boolean(authority) : null,
      visible_projection_matches: observed && authority && visible ? normalizedEqual(authority, visible) : observed ? null : null,
      rail_status: observed ? audit.rail_status ?? "broken" : "not_applicable",
      rail_failure_code: observed ? audit.rail_failure_code ?? null : null,
    };
  });
};

const hasTerminalProduct = (audit: RecordLike): boolean => Boolean(readString(audit.materialized_terminal_artifact_kind));

const terminalKindRequiresSupportBackedDraft = (audit: RecordLike): boolean => {
  const terminalKind = normalize(audit.materialized_terminal_artifact_kind) || normalize(audit.required_terminal_kind);
  if (!terminalKind) return false;
  if (terminalKind === "typed_failure" || terminalKind === "request_user_input") return false;
  if (TERMINAL_RECEIPT_KINDS.has(terminalKind)) return false;
  return terminalKind.includes("model_synthesized") || terminalKind.includes("answer") || terminalKind.includes("summary");
};

const triageFromAudit = (audit: RecordLike): {
  first_broken_rail: FirstBrokenRail | null;
  failure_bucket: FailureBucket | null;
  repair_target: RepairTarget | null;
} => {
  const railFailureCode = readString(audit.rail_failure_code);
  const railStatus = readString(audit.rail_status);
  const routeFamily = readString(audit.route_family);
  const selectedCapability = readString(audit.selected_capability);
  const executedCapability = readString(audit.executed_capability);
  const observationRef = readString(audit.observation_ref);
  const reentryExecuted = audit.reentry_executed === true;
  const finalDraftRef = readString(audit.final_answer_draft_ref);
  const supportCount = readNumber(audit.support_refs_count) ?? 0;
  const materializedTerminal = readString(audit.materialized_terminal_artifact_kind);
  const terminalAuthority = readString(audit.terminal_authority_kind);
  const visibleTerminal = readString(audit.visible_terminal_kind);

  if (!railFailureCode && railStatus === "complete") {
    return { first_broken_rail: null, failure_bucket: null, repair_target: null };
  }
  if (railFailureCode === "config_missing") {
    return { first_broken_rail: "config", failure_bucket: "G_config_missing", repair_target: "operator_config" };
  }
  if (railFailureCode === "explicit_capability_not_selected") {
    return {
      first_broken_rail: "route_admission",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "intent_arbitration",
    };
  }
  if (railFailureCode === "wrong_capability_executed") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "agent_step_selection",
    };
  }
  if (!routeFamily || railFailureCode === "route_family_mismatch") {
    return {
      first_broken_rail: "route_admission",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "tool_admission",
    };
  }
  if (railFailureCode === "tool_admission_drift") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "H_route_tool_family_contract_mismatch",
      repair_target: "tool_admission",
    };
  }
  if (railFailureCode === "tool_execution_rejected") {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_admission",
    };
  }
  if (selectedCapability && !executedCapability) {
    return {
      first_broken_rail: "capability_execution",
      failure_bucket: "A_tool_did_not_execute",
      repair_target: "tool_execution",
    };
  }
  if (railFailureCode === "weak_evidence_repair_loop") {
    return {
      first_broken_rail: "evidence_reentry",
      failure_bucket: "C_observation_not_reentered",
      repair_target: "repo_retrieval_repair_policy",
    };
  }
  if (!observationRef || railFailureCode === "observation_missing") {
    return {
      first_broken_rail: "observation_artifact",
      failure_bucket: "B_tool_executed_observation_missing",
      repair_target: "observation_materializer",
    };
  }
  if (railFailureCode === "required_observation_missing") {
    return {
      first_broken_rail: "observation_artifact",
      failure_bucket: "B_tool_executed_observation_missing",
      repair_target: "observation_materializer",
    };
  }
  if (!reentryExecuted || railFailureCode === "observation_not_reentered" || railFailureCode === "reentry_step_not_executed") {
    return {
      first_broken_rail: "evidence_reentry",
      failure_bucket: "C_observation_not_reentered",
      repair_target: "reentry_gate",
    };
  }
  if (!finalDraftRef && !hasTerminalProduct(audit)) {
    return {
      first_broken_rail: "support_backed_draft",
      failure_bucket: "D_support_backed_draft_missing",
      repair_target: "draft_builder",
    };
  }
  if (railFailureCode === "support_refs_missing" || (terminalKindRequiresSupportBackedDraft(audit) && finalDraftRef && supportCount === 0)) {
    return {
      first_broken_rail: "support_backed_draft",
      failure_bucket: "D_support_backed_draft_missing",
      repair_target: "draft_builder",
    };
  }
  if (!materializedTerminal || railFailureCode === "terminal_not_materialized" || railFailureCode === "terminal_product_mismatch") {
    return {
      first_broken_rail: "terminal_materialization",
      failure_bucket: "E_terminal_materializer_gap",
      repair_target: "terminal_materializer",
    };
  }
  if (!terminalAuthority || railFailureCode === "terminal_authority_missing") {
    return {
      first_broken_rail: "terminal_authority",
      failure_bucket: "E_terminal_materializer_gap",
      repair_target: "terminal_authority",
    };
  }
  if (railFailureCode === "debug_mirror_stale") {
    return {
      first_broken_rail: "visible_projection",
      failure_bucket: "F_terminal_projection_mismatch",
      repair_target: "presenter_boundary",
    };
  }
  if (!visibleTerminal || railFailureCode === "terminal_projection_mismatch" || !normalizedEqual(terminalAuthority, visibleTerminal)) {
    return {
      first_broken_rail: "visible_projection",
      failure_bucket: "F_terminal_projection_mismatch",
      repair_target: "presenter_boundary",
    };
  }
  return { first_broken_rail: null, failure_bucket: null, repair_target: null };
};

const buildToolRailFailureTriage = (input: {
  turnId: string;
  audit: RecordLike;
}): RecordLike => {
  const triage = triageFromAudit(input.audit);
  const executedCapability = readString(input.audit.executed_capability);
  const observationRef = readString(input.audit.observation_ref);
  return {
    schema: "helix.tool_rail_failure_triage.v1",
    turn_id: input.turnId,
    route_family: readNullableString(input.audit.route_family),
    capability_contract_guard_version: readNullableString(input.audit.capability_contract_guard_version),
    requested_capability: readNullableString(input.audit.requested_capability),
    requested_capability_family: readNullableString(input.audit.requested_capability_family),
    requested_capability_source: readNullableString(input.audit.requested_capability_source),
    requested_capability_confidence: readNumber(input.audit.requested_capability_confidence),
    selected_capability: readNullableString(input.audit.selected_capability),
    executed_capability: executedCapability || null,
    requested_selected_match:
      typeof input.audit.requested_selected_match === "boolean" ? input.audit.requested_selected_match : null,
    selected_executed_match:
      typeof input.audit.selected_executed_match === "boolean" ? input.audit.selected_executed_match : null,
    substitution_rule_applied: input.audit.substitution_rule_applied === true,
    substitution_rule_id: readNullableString(input.audit.substitution_rule_id),
    required_observation_kinds_for_requested_capability:
      readStringArray(input.audit.required_observation_kinds_for_requested_capability),
    observed_artifact_supports_requested_capability:
      typeof input.audit.observed_artifact_supports_requested_capability === "boolean"
        ? input.audit.observed_artifact_supports_requested_capability
        : null,
    did_tool_run: Boolean(executedCapability),
    policy_rejection_ref: readNullableString(input.audit.policy_rejection_ref),
    policy_rejection_reason: readNullableString(input.audit.policy_rejection_reason),
    observation_artifact_kind: readNullableString(input.audit.observation_artifact_kind),
    observation_ref: observationRef || null,
    reentry_executed: input.audit.reentry_executed === true,
    required_terminal_kind: readNullableString(input.audit.required_terminal_kind),
    final_answer_draft_ref: readNullableString(input.audit.final_answer_draft_ref),
    support_refs_count: readNumber(input.audit.support_refs_count) ?? 0,
    materialized_terminal_artifact_kind: readNullableString(input.audit.materialized_terminal_artifact_kind),
    terminal_authority_kind: readNullableString(input.audit.terminal_authority_kind),
    visible_terminal_kind: readNullableString(input.audit.visible_terminal_kind),
    first_broken_rail: triage.first_broken_rail,
    failure_bucket: triage.failure_bucket,
    rail_status: readString(input.audit.rail_status) || "broken",
    rail_failure_code: readNullableString(input.audit.rail_failure_code),
    repair_target: triage.repair_target,
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const collectVisibleCapabilitySurfaceFromRecord = (record: RecordLike | null): string[] => {
  if (!record) return [];
  const keys = [
    "visible_tools",
    "tools",
    "tool_specs",
    "capabilities",
    "capability_keys",
    "available_capabilities",
    "admitted_capabilities",
    "admitted_tool_families",
    "allowed_tool_families",
    "information_reflection",
    "utility",
    "reasoning",
  ];
  const values: string[] = [];
  for (const key of keys) {
    for (const entry of readArray(record[key])) {
      if (typeof entry === "string") {
        values.push(entry);
        continue;
      }
      const entryRecord = readRecord(entry);
      if (!entryRecord) continue;
      values.push(
        ...[
          entryRecord.name,
          entryRecord.tool_name,
          entryRecord.capability,
          entryRecord.capability_key,
          entryRecord.action,
          entryRecord.id,
          entryRecord.family,
        ].map(readString),
      );
    }
  }
  return unique(values);
};

const visibleCapabilitySurface = (payload: RecordLike, artifacts: RecordLike[]): string[] => {
  const capabilityPlan = readRecord(payload.capability_plan);
  const admission = readRecord(payload.tool_call_admission_decision);
  const runtimeIntent = readRecord(payload.runtime_intent_packet);
  const contextualSuppression = detectContextualToolAdmissionSuppression(readFirstPromptText(payload) ?? "");
  const directRecords = [
    payload.available_capabilities,
    payload.initial_available_capabilities,
    payload.tool_surface_packet,
    payload.capability_catalog_observation,
    capabilityPlan,
    admission,
    runtimeIntent,
  ].map(readRecord);
  const artifactRecords = artifacts
    .filter((artifact) =>
      ["available_capabilities", "tool_surface_packet", "capability_registry"].some((kind) =>
        observationKindMatches(artifact, kind),
      ),
    )
    .map((artifact) => artifactPayload(artifact) ?? artifact);
  return unique([
    ...directRecords.flatMap(collectVisibleCapabilitySurfaceFromRecord),
    ...artifactRecords.flatMap(collectVisibleCapabilitySurfaceFromRecord),
  ]).filter((capability) => !suppressedVisibleToolSurfaceCapability(capability, contextualSuppression));
};

const suppressedVisibleToolSurfaceCapability = (
  capability: string,
  suppression: HelixContextualToolAdmissionSuppression | null,
): boolean => {
  if (!suppression) return false;
  if (normalizedEqual(capability, "model.direct_answer")) return false;
  if (normalizedEqual(capability, "suppressed_contextual_tool_reference")) return false;
  const family = inferToolFamilyFromToolName(capability);
  if (!family) return false;
  if (contextualToolSuppressionBlocksFamily(suppression, family)) return true;
  if (family === "workstation" && contextualToolSuppressionBlocksFamily(suppression, "workstation_action")) return true;
  if (family === "live_source_mail" && contextualToolSuppressionBlocksFamily(suppression, "live_environment")) return true;
  return false;
};

const RAIL_TABLE_VISIBLE_SURFACE_LIMIT = 40;

const railTableVisibleCapabilitySurface = (input: {
  payload: RecordLike;
  artifacts: RecordLike[];
  audit: RecordLike;
  lifecycleTrace: RecordLike | null;
}): {
  visibleSurface: string[];
  originalCount: number;
  truncated: boolean;
} => {
  const admittedCapability = readAdmittedCapability(input.payload, input.audit, input.lifecycleTrace);
  const rawSurface = visibleCapabilitySurface(input.payload, input.artifacts);
  if (rawSurface.length === 0) {
    return {
      visibleSurface: [],
      originalCount: 0,
      truncated: false,
    };
  }
  const prioritized = unique([
    readString(input.audit.requested_capability),
    readString(input.audit.selected_capability),
    admittedCapability,
    readString(input.audit.executed_capability),
    ...rawSurface,
  ].filter((entry: string | null): entry is string => Boolean(entry)));
  return {
    visibleSurface: prioritized.slice(0, RAIL_TABLE_VISIBLE_SURFACE_LIMIT),
    originalCount: prioritized.length,
    truncated: prioritized.length > RAIL_TABLE_VISIBLE_SURFACE_LIMIT,
  };
};

const readAdmittedCapabilityEvidence = (
  payload: RecordLike,
  audit: RecordLike,
  lifecycleTrace: RecordLike | null,
): { capability: string | null; source: string | null; proven: boolean } => {
  const admission = readRecord(payload.tool_call_admission_decision);
  const capabilityPlan = readRecord(payload.capability_plan);
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const planAdmitted =
    readString(capabilityPlan?.admission_status) === "admitted" ||
    readString(capabilityPlan?.status) === "admitted" ||
    capabilityPlan?.admitted === true;
  const auditExecutedCapability = nonModelToolCapability(audit.executed_capability);
  const auditSelectedCapability = nonModelToolCapability(audit.selected_capability);
  const auditObservationRef = readString(audit.observation_ref);
  const staleModelAdmission = Boolean(
    isModelAnswerCapability(admission?.admitted_capability) ||
      isModelAnswerCapability(admission?.selected_capability) ||
      isModelAnswerCapability(operationalTrace?.policy_admitted_capability),
  );
  if (auditExecutedCapability && staleModelAdmission) {
    return {
      capability: auditExecutedCapability,
      source: "tool_turn_chain_audit.executed_capability",
      proven: true,
    };
  }
  if (auditSelectedCapability && auditObservationRef && staleModelAdmission) {
    return {
      capability: auditSelectedCapability,
      source: "tool_turn_chain_audit.selected_capability_observation",
      proven: true,
    };
  }
  const candidates: Array<{ capability: unknown; source: string }> = [
    { capability: admission?.admitted_capability, source: "tool_call_admission_decision.admitted_capability" },
    { capability: admission?.selected_capability, source: "tool_call_admission_decision.selected_capability" },
    { capability: operationalTrace?.policy_admitted_capability, source: "operational_capability_trace.policy_admitted_capability" },
    { capability: planAdmitted ? capabilityPlan?.selected_capability : null, source: "capability_plan.selected_capability" },
    { capability: planAdmitted ? capabilityPlan?.requested_action : null, source: "capability_plan.requested_action" },
    { capability: planAdmitted ? audit.selected_capability : null, source: "capability_plan.audit_selected_capability" },
    { capability: lifecycleTrace?.admitted_capability, source: "tool_lifecycle_trace.admitted_capability" },
  ];
  for (const candidate of candidates) {
    const capability = readString(candidate.capability);
    if (capability) {
      return {
        capability,
        source: candidate.source,
        proven: true,
      };
    }
  }
  return {
    capability: null,
    source: null,
    proven: false,
  };
};

const readAdmittedCapability = (
  payload: RecordLike,
  audit: RecordLike,
  lifecycleTrace: RecordLike | null,
): string | null => {
  return readAdmittedCapabilityEvidence(payload, audit, lifecycleTrace).capability;
};

const readSelectedCapabilityForRailTable = (
  payload: RecordLike,
  audit: RecordLike,
  lifecycleTrace: RecordLike | null,
): string | null => {
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const runtimeToolCall = readRecord(payload.runtime_tool_call);
  const auditSelectedCapability = readString(audit.selected_capability);
  const concreteCapability = firstString(
    nonModelToolCapability(operationalTrace?.model_proposed_capability),
    nonModelToolCapability(lifecycleTrace?.admitted_capability),
    nonModelToolCapability(lifecycleTrace?.requested_capability),
    nonModelToolCapability(runtimeToolCall?.capability_key),
    nonModelToolCapability(lifecycleTrace?.executed_capability),
    nonModelToolCapability(operationalTrace?.executed_capability),
  );
  return preferConcreteCapability(auditSelectedCapability, concreteCapability);
};

const readExecutedCapabilityForRailTable = (
  payload: RecordLike,
  audit: RecordLike,
  lifecycleTrace: RecordLike | null,
): string | null => {
  if (readString(audit.rail_failure_code) === "tool_execution_rejected" || readString(audit.policy_rejection_ref)) {
    return nonModelToolCapability(audit.executed_capability);
  }
  const operationalTrace = readRecord(payload.operational_capability_trace);
  const runtimeToolCall = readRecord(payload.runtime_tool_call);
  return firstString(
    runtimeLoopExecutedCapability(payload),
    nonModelToolCapability(lifecycleTrace?.executed_capability),
    nonModelToolCapability(operationalTrace?.executed_capability),
    nonModelToolCapability(runtimeToolCall?.capability_key),
    nonModelToolCapability(audit.executed_capability),
  );
};

const normalizeGoalSatisfaction = (payload: RecordLike): string | null => {
  const goal = readRecord(payload.goal_satisfaction_evaluation);
  return firstString(goal?.satisfaction, goal?.next_decision, payload.final_status, payload.response_type);
};

const codexParityClassFromAudit = (input: {
  audit: RecordLike;
  triage: RecordLike;
  visibleSurface: string[];
}): CodexParityClass => {
  const railStatus = readString(input.audit.rail_status);
  const failureCode = readString(input.audit.rail_failure_code);
  const requestedCapability = readString(input.audit.requested_capability);
  const selectedCapability = readString(input.audit.selected_capability);
  const executedCapability = readString(input.audit.executed_capability);
  const firstBrokenRail = readString(input.triage.first_broken_rail);
  const repairTarget = readString(input.triage.repair_target);
  if (!failureCode && railStatus === "complete") return "complete";
  if (failureCode === "config_missing") return "provider_config_missing";
  if (requestedCapability && input.visibleSurface.length === 0) return "tool_surface_missing";
  if (failureCode === "explicit_capability_not_selected" || failureCode === "wrong_capability_executed") {
    return "explicit_capability_demoted";
  }
  if (
    failureCode === "tool_execution_rejected" ||
    failureCode === "tool_admission_drift" ||
    repairTarget === "tool_admission"
  ) {
    return "tool_admission_rejected";
  }
  if (selectedCapability && !executedCapability) return "selected_not_executed";
  if (failureCode === "observation_missing" || failureCode === "required_observation_missing") return "observation_missing";
  if (
    failureCode === "observation_not_reentered" ||
    failureCode === "reentry_step_not_executed" ||
    failureCode === "weak_evidence_repair_loop"
  ) {
    return "observation_not_reentered";
  }
  if (failureCode === "terminal_product_mismatch") return "terminal_product_not_allowed";
  if (failureCode === "terminal_not_materialized" || failureCode === "support_refs_missing") {
    return "goal_contract_mismatch";
  }
  if (failureCode === "terminal_authority_missing") return "terminal_authority_mismatch";
  if (firstBrokenRail === "terminal_authority") return "terminal_authority_mismatch";
  if (failureCode === "debug_mirror_stale") return "debug_mirror_stale";
  if (failureCode === "terminal_projection_mismatch" || firstBrokenRail === "visible_projection") {
    return "visible_projection_mismatch";
  }
  return "goal_contract_mismatch";
};

const buildCodexParityAgentSpineRailTable = (input: {
  turnId: string;
  payload: RecordLike;
  artifacts: RecordLike[];
  lifecycleTrace: RecordLike | null;
  audit: RecordLike;
  triage: RecordLike;
}): RecordLike => {
  const visibleSurfaceProjection = railTableVisibleCapabilitySurface({
    payload: input.payload,
    artifacts: input.artifacts,
    audit: input.audit,
    lifecycleTrace: input.lifecycleTrace,
  });
  const visibleSurface = visibleSurfaceProjection.visibleSurface;
  const admissionProof = readAdmittedCapabilityEvidence(input.payload, input.audit, input.lifecycleTrace);
  const selectedCapability = readSelectedCapabilityForRailTable(input.payload, input.audit, input.lifecycleTrace);
  const executedCapability = readExecutedCapabilityForRailTable(input.payload, input.audit, input.lifecycleTrace);
  const codexParityClass = codexParityClassFromAudit({
    audit: input.audit,
    triage: input.triage,
    visibleSurface,
  });
  return {
    schema: CODEX_PARITY_AGENT_SPINE_RAIL_TABLE_SCHEMA,
    turn_id: input.turnId,
    prompt: readFirstPromptText(input.payload),
    requested_capability: readNullableString(input.audit.requested_capability),
    visible_tool_surface: visibleSurface,
    visible_tool_surface_original_count: visibleSurfaceProjection.originalCount,
    visible_tool_surface_truncated: visibleSurfaceProjection.truncated,
    selected_capability: selectedCapability,
    admitted_capability: admissionProof.capability,
    admission_proof_source: admissionProof.source,
    admission_proven: admissionProof.proven,
    executed_capability: executedCapability,
    observation_kind: readNullableString(input.audit.observation_artifact_kind),
    observation_ref: readNullableString(input.audit.observation_ref),
    required_observation_kinds_for_requested_capability:
      readStringArray(input.audit.required_observation_kinds_for_requested_capability),
    observed_artifact_supports_requested_capability:
      typeof input.audit.observed_artifact_supports_requested_capability === "boolean"
        ? input.audit.observed_artifact_supports_requested_capability
        : null,
    reentry_status: input.audit.reentry_executed === true
      ? "reentered"
      : readString(input.audit.observation_ref)
        ? "not_reentered"
        : "no_observation",
    reentry_proof_source: readNullableString(input.audit.reentry_proof_source),
    reentry_proven: input.audit.reentry_proven === true,
    goal_satisfaction: normalizeGoalSatisfaction(input.payload),
    required_terminal_kind: readNullableString(input.audit.required_terminal_kind),
    selected_terminal_kind: readNullableString(input.audit.terminal_authority_kind),
    terminal_authority_proof_source: readNullableString(input.audit.terminal_authority_proof_source),
    terminal_authority_proven: input.audit.terminal_authority_proven === true,
    visible_terminal_kind: readNullableString(input.audit.visible_terminal_kind),
    visible_projection_source: readNullableString(input.audit.visible_projection_source),
    visible_projection_proven: input.audit.visible_projection_proven === true,
    first_broken_rail: readNullableString(input.triage.first_broken_rail),
    repair_target: readNullableString(input.triage.repair_target),
    codex_parity_class: codexParityClass,
    normalized_codex_parity_classes: CODEX_PARITY_AGENT_SPINE_CLASSES,
    rail_status: readString(input.audit.rail_status) || "broken",
    rail_failure_code: readNullableString(input.audit.rail_failure_code),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};

const buildArtifactEntry = (artifact: RecordLike): RecordLike => {
  const payload = artifactPayload(artifact);
  const payloadArtifactV1 = readRecord(payload?.artifact_v1);
  const payloadArtifactAuthority = readRecord(payloadArtifactV1?.authority);
  const replay = readRecord(payloadArtifactV1?.replay);
  const nestedSources = readArray(payloadArtifactV1?.sources)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const nestedScholarlyLookupRequests = readArray(payloadArtifactV1?.scholarlyLookupRequests)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const ref = artifactRef(artifact);
  const kind = readString(artifact.kind);
  const schema = readString(artifact.schema);
  const payloadKind = readString(payload?.kind);
  const payloadSchema = readString(payload?.schema);
  const queryKeys = unique([
    ref,
    kind,
    schema,
    payloadKind,
    payloadSchema,
    readString(payload?.feed_kind),
    readString(payload?.feedKind),
    readString(payload?.requiredActuator),
    readString(payload?.required_actuator),
    readString(payload?.actuator),
    readString(payload?.controlKind),
    readString(payload?.control_kind),
    readString(artifact.producer_item_id),
    readString(artifact.source_scope),
    readString(payloadArtifactV1?.artifactId),
    readString(payloadArtifactV1?.schemaVersion),
    readString(payloadArtifactV1?.mapId),
    readString(payloadArtifactV1?.searchId),
    readString(payloadArtifactV1?.candidateId),
    readString(payloadArtifactV1?.frontierKind),
    readString(payloadArtifactV1?.status),
    readString(payloadArtifactV1?.title),
    readString(payloadArtifactV1?.graphHash),
    readString(payloadArtifactV1?.graphId),
    readString(payloadArtifactV1?.query),
    readString(payloadArtifactV1?.searchSeed),
    readString(payloadArtifactV1?.taxonomyVersion),
    readString(payloadArtifactV1?.scoringVersion),
    readString(payloadArtifactV1?.verifierVersion),
    readString(replay?.graphHash),
    readString(replay?.graphId),
    readString(replay?.query),
    readString(replay?.searchSeed),
    readString(replay?.taxonomyVersion),
    readString(replay?.scoringVersion),
    readString(replay?.literatureMapVersion),
    ...readStringArray(replay?.evidenceReferenceIds),
    ...readStringArray(payloadArtifactV1?.frontierCandidateIds),
    ...readStringArray(payloadArtifactV1?.badgeIds),
    ...nestedScholarlyLookupRequests.flatMap((request) => [
      readString(request.requestId),
      readString(request.candidateId),
      readString(request.targetSource),
      readString(request.query),
      ...readStringArray(request.requestedOutputs),
      ...readStringArray(request.badgeIds),
      ...readStringArray(request.renderChunkIds),
      ...readStringArray(request.semanticChunkIds),
    ]),
    ...nestedSources.map((source) => readString(source.sourceId)),
  ]);
  return {
    ref,
    kind: kind || null,
    schema: schema || null,
    payload_kind: payloadKind || null,
    payload_schema: payloadSchema || null,
    nested_artifact_id: readString(payloadArtifactV1?.artifactId) || null,
    nested_schema_version: readString(payloadArtifactV1?.schemaVersion) || null,
    source_scope: readString(artifact.source_scope) || null,
    producer_item_id: readString(artifact.producer_item_id) || null,
    query_keys: queryKeys,
    artifact_query_role: "observation_index_entry",
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
    payload_authority_flags: {
      assistant_answer: readBoolean(payload?.assistant_answer) || readBoolean(payloadArtifactAuthority?.assistant_answer),
      terminal_eligible: readBoolean(payload?.terminal_eligible) || readBoolean(payloadArtifactAuthority?.terminal_eligible),
      raw_content_included: readBoolean(payload?.raw_content_included),
    },
  };
};

export const buildArtifactQueryIndex = (input: {
  turnId: string;
  payload: RecordLike;
}): RecordLike => {
  const lifecycleTrace = readRecord(input.payload.tool_lifecycle_trace);
  const followupDecision = readRecord(input.payload.tool_followup_decision);
  const capabilityPlan = readRecord(input.payload.capability_plan);
  const capabilityItinerary = readRecord(input.payload.capability_itinerary);
  const compoundCapabilityContract =
    readRecord(input.payload.compound_capability_contract) ??
    readRecord(capabilityItinerary?.compound_capability_contract);
  const capabilityItineraryExecutionState =
    readRecord(input.payload.capability_itinerary_execution_state) ??
    readRecord(capabilityItinerary?.execution_state);
  const compoundSubgoalLedger = readArray(capabilityItineraryExecutionState?.compound_subgoal_ledger)
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));
  const compoundSubgoalRailStatuses = compoundSubgoalLedger.map((entry) => ({
    subgoal_id: readNullableString(entry.subgoal_id),
    order: readNumber(entry.order),
    requested_capability: readNullableString(entry.requested_capability),
    selected_capability: readNullableString(entry.selected_capability),
    executed_capability: readNullableString(entry.executed_capability),
    args: readRecord(entry.args),
    args_source: readNullableString(entry.args_source),
    planned_args: readRecord(entry.planned_args),
    selected_args: readRecord(entry.selected_args),
    required_args: readStringArray(entry.required_args),
    optional_args: readStringArray(entry.optional_args),
    input_bindings: readArray(entry.input_bindings)
      .map((binding) => readRecord(binding))
      .filter((binding): binding is RecordLike => Boolean(binding)),
    observation_kind: readNullableString(entry.observation_kind),
    observation_ref: readNullableString(entry.observation_ref),
    observation_provenance: readNullableString(entry.observation_provenance),
    support_refs: readStringArray(entry.support_refs),
    bound_input_refs: readArray(entry.bound_input_refs)
      .map((binding) => readRecord(binding))
      .filter((binding): binding is RecordLike => Boolean(binding)),
    unresolved_input_bindings: readArray(entry.unresolved_input_bindings)
      .map((binding) => readRecord(binding))
      .filter((binding): binding is RecordLike => Boolean(binding)),
    satisfaction: readNullableString(entry.satisfaction),
    contribution_role: readNullableString(entry.contribution_role),
    terminal_contribution_kind: readNullableString(entry.terminal_contribution_kind),
    rail_status: readNullableString(entry.rail_status),
    first_broken_rail: readNullableString(entry.first_broken_rail),
    rail_failure_code: readNullableString(entry.rail_failure_code),
    repair_target: readNullableString(entry.repair_target),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  }));
  const admission = readRecord(input.payload.tool_call_admission_decision);
  const artifacts = artifactsForPayload(input.payload);
  const lifecycleCapability = capabilityFromPayload(input.payload, lifecycleTrace);
  const artifactCapability = capabilityFromArtifacts(artifacts);
  const capability =
    artifactCapability && shouldPreferArtifactCapability(lifecycleCapability)
      ? artifactCapability
      : lifecycleCapability ?? artifactCapability;
  const lifecycleFamily = familyFromPayload(input.payload, lifecycleTrace);
  const inferredArtifactFamily = artifactInferredFamily(artifacts);
  const toolFamily =
    inferredArtifactFamily && shouldPreferArtifactFamily(lifecycleFamily, capability)
      ? inferredArtifactFamily
      : lifecycleFamily ?? inferredArtifactFamily;
  const contract = resolveToolFamilyContract({
    toolName: capability,
    toolFamily,
  });
  const resolvedToolFamily = isGenericAuditFamily(toolFamily) && contract?.toolFamily ? contract.toolFamily : toolFamily;
  const artifactRefs = artifacts.map(buildArtifactEntry);
  const requestedCapability = firstString(
    admission?.requested_capability,
    capabilityPlan?.requested_capability,
  );
  const requestedCapabilityContract = explicitCapabilityContractForCapability(requestedCapability);
  const requestedCapabilityCompoundSubgoal = compoundSubgoalLedger.find((entry) =>
    normalizedEqual(readNullableString(entry.requested_capability), requestedCapability) ||
    normalizedEqual(readNullableString(entry.runtime_capability), requestedCapability)
  ) ?? readArray(readRecord(compoundCapabilityContract)?.subgoals)
    .map((entry) => readRecord(entry))
    .find((entry) =>
      normalizedEqual(readNullableString(entry?.requested_capability), requestedCapability) ||
      normalizedEqual(readNullableString(entry?.runtime_capability), requestedCapability)
    ) ?? null;
  const compoundSubgoalRequiredObservationKinds = readStringArray(
    readRecord(requestedCapabilityCompoundSubgoal)?.required_observation_kinds,
  );
  const requiredObservationKinds = compoundSubgoalRequiredObservationKinds.length
    ? compoundSubgoalRequiredObservationKinds
    : requestedCapabilityContract?.required_observation_kinds.length
    ? requestedCapabilityContract.required_observation_kinds
    : contract?.requiredObservationKinds ?? [];
  const requiredObservationCoverageMode = compoundSubgoalRequiredObservationKinds.length
    ? "any"
    : requestedCapabilityContract
    ? explicitObservationCoverageMode(requestedCapabilityContract.capability)
    : "all";
  const requiredObservationCoverage = requiredObservationKinds.map((kind) => {
    const matches = artifacts.filter((artifact) => observationKindMatches(artifact, kind)).map(artifactRef);
    return {
      kind,
      present: matches.length > 0,
      artifact_refs: unique(matches),
    };
  });
  const requiredObservationsSatisfied = observationCoverageSatisfied(
    requiredObservationCoverage,
    requiredObservationCoverageMode,
  );
  const lifecycleObservationRefs = readStringArray(lifecycleTrace?.observation_refs);
  const lifecycleReceiptRefs = readStringArray(lifecycleTrace?.receipt_refs);
  const lifecycleEvidenceRefs = readStringArray(lifecycleTrace?.evidence_refs);
  const toolTurnChainAudit = buildToolTurnChainAudit({
    payload: input.payload,
    artifacts,
    lifecycleTrace,
    followupDecision,
    capability,
    toolFamily: resolvedToolFamily,
    contract,
    requiredObservationCoverage,
    requiredObservationsSatisfied,
  });
  const toolRailFailureTriage = buildToolRailFailureTriage({
    turnId: input.turnId,
    audit: toolTurnChainAudit,
  });
  const codexParityAgentSpineRailTable = buildCodexParityAgentSpineRailTable({
    turnId: input.turnId,
    payload: input.payload,
    artifacts,
    lifecycleTrace,
    audit: toolTurnChainAudit,
    triage: toolRailFailureTriage,
  });

  return {
    schema: "helix.artifact_query_index.v1",
    turn_id: input.turnId,
    source: "debug_export_current_turn_ledger",
    artifact_count: artifactRefs.length,
    artifact_refs: artifactRefs,
    queryable_artifact_keys: unique(artifactRefs.flatMap((entry) => readStringArray(entry.query_keys))),
    tool_family: resolvedToolFamily,
    capability,
    compound_capability_contract: compoundCapabilityContract,
    capability_itinerary_execution_state: capabilityItineraryExecutionState,
    compound_subgoal_ledger: compoundSubgoalLedger,
    compound_subgoal_rail_statuses: compoundSubgoalRailStatuses,
    tool_family_contract: contractSummary(contract),
    requested_capability_contract: requestedCapabilityContract,
    required_observation_coverage_mode: requiredObservationCoverageMode,
    required_observation_coverage: requiredObservationCoverage,
    missing_required_observation_kinds: requiredObservationCoverage
      .filter((entry) => !requiredObservationsSatisfied && entry.present !== true)
      .map((entry) => entry.kind),
    lifecycle_refs: {
      observation_refs: lifecycleObservationRefs,
      receipt_refs: lifecycleReceiptRefs,
      evidence_refs: lifecycleEvidenceRefs,
    },
    reentry_status: {
      evidence_reentered:
        readString(lifecycleTrace?.lifecycle_stage) === "reentered_solver" ||
        readBoolean(followupDecision?.evidence_reentered),
      followup_next_action: readString(followupDecision?.next_action) || null,
      terminal_use_allowed:
        readBoolean(lifecycleTrace?.terminal_eligible) &&
        readString(followupDecision?.next_action) === "terminal_answer" &&
        requiredObservationsSatisfied,
    },
    codex_parity_agent_spine_rail_table: codexParityAgentSpineRailTable,
    tool_turn_chain_audit: toolTurnChainAudit,
    tool_rail_failure_triage: toolRailFailureTriage,
    tool_turn_chain_family_matrix: buildToolTurnChainFamilyMatrix(toolTurnChainAudit),
    assistant_answer: false,
    terminal_eligible: false,
    raw_content_included: false,
  };
};
