import type { HelixIntentKind } from "./intent-hypothesis";
import type { ToolUseRestatementV1 } from "./internet-search-intent";

type RecordLike = Record<string, unknown>;

export type HelixEvidenceReentryViolationCode =
  | "receipt_terminal_without_reentry"
  | "projection_terminal_without_reentry"
  | "tool_result_terminal_without_reentry"
  | "source_observation_terminal_without_selection"
  | "evidence_selected_but_finalizer_missing"
  | "internet_search_evidence_plan_incomplete";

export type HelixEvidenceReentryGate = {
  schema: "helix.evidence_reentry_gate.v1";
  turn_id: string;
  required: boolean;
  completed: boolean;
  selected_evidence_refs: string[];
  rejected_evidence_refs: Array<{ ref: string; reason: string }>;
  receipts_reentered: string[];
  receipts_not_reentered: string[];
  projections_reentered: string[];
  projections_not_reentered: string[];
  violation_codes: HelixEvidenceReentryViolationCode[];
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const unique = <T>(entries: T[]): T[] => Array.from(new Set(entries));

const isReceiptKind = (value: string): boolean =>
  /receipt|tool_evaluation|workstation_tool_evaluation/i.test(value);

const isProjectionKind = (value: string): boolean =>
  /projection|panel_generated_answer|client_projection|live_card_projection|no_tool_direct/i.test(value);

const readTerminalGoalFrame = (payload: RecordLike): { goalKind: string; requiredTerminalKind: string } => {
  const canonicalGoalFrame = readRecord(payload.canonical_goal_frame);
  const universalGoalFrame = readRecord(payload.universal_goal_frame);
  const universalUserGoal = readRecord(universalGoalFrame?.user_goal);
  return {
    goalKind:
      readString(canonicalGoalFrame?.goal_kind) ||
      readString(universalGoalFrame?.goal_kind) ||
      readString(universalUserGoal?.goal_kind),
    requiredTerminalKind:
      readString(canonicalGoalFrame?.required_terminal_kind) ||
      readString(universalGoalFrame?.required_terminal_kind) ||
      readString(universalUserGoal?.required_terminal_kind),
  };
};

const receiptTerminalMatchesCanonicalGoal = (payload: RecordLike, terminalArtifactKind: string): boolean => {
  const goalFrame = readTerminalGoalFrame(payload);
  return (
    goalFrame.requiredTerminalKind === terminalArtifactKind &&
    Boolean(goalFrame.goalKind) &&
    !/^(?:unknown|ambiguous)$/i.test(goalFrame.goalKind)
  );
};

const primaryAllowsReceiptTerminal = (
  primaryIntent: HelixIntentKind,
  terminalArtifactKind: string,
  allowedTerminalProducts: string[],
  payload: RecordLike,
): boolean => {
  if (!isReceiptKind(terminalArtifactKind)) return false;
  if (
    (primaryIntent === "control_command" || primaryIntent === "status_question") &&
    allowedTerminalProducts.includes(terminalArtifactKind)
  ) {
    return true;
  }
  if (!receiptTerminalMatchesCanonicalGoal(payload, terminalArtifactKind)) return false;
  return (
    allowedTerminalProducts.includes(terminalArtifactKind) ||
    primaryIntent === "control_command" ||
    primaryIntent === "status_question"
  );
};

const collectRejectedEvidence = (loopTrace: RecordLike | null): Array<{ ref: string; reason: string }> =>
  (Array.isArray(loopTrace?.evidence_rejected_for_answer) ? loopTrace.evidence_rejected_for_answer : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => ({
      ref: readString(entry.ref) || "unknown",
      reason: readString(entry.reason) || "rejected",
    }));

const collectActualToolCalls = (loopTrace: RecordLike | null): RecordLike[] =>
  (Array.isArray(loopTrace?.actual_tool_calls) ? loopTrace.actual_tool_calls : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry));

const collectObservationRefs = (loopTrace: RecordLike | null): string[] =>
  (Array.isArray(loopTrace?.observations_created) ? loopTrace.observations_created : [])
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .map((entry) => readString(entry.observation_id))
    .filter(Boolean);

const collectWorkspaceSourceEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const workspaceSnapshot = readRecord(input.payload.workspace_context_snapshot);
  const activeDocPath =
    readString(workspaceSnapshot?.activeDocPath) ||
    readString(workspaceSnapshot?.docContextPath) ||
    readString(readRecord(input.payload.active_doc_identity)?.path) ||
    readString(readRecord(input.payload.active_doc_identity)?.activeDocPath);
  const terminalUsesActiveDoc =
    /active_doc_identity|doc_summary|doc_open_receipt|doc_location/i.test(input.terminalArtifactKind) ||
    /active_doc_identity|doc_summary|doc_open_receipt|doc_location/i.test(input.finalAnswerSource);
  if (activeDocPath && terminalUsesActiveDoc) {
    return [`workspace_snapshot:active_doc_path:${activeDocPath}`];
  }
  return [];
};

const collectConversationMemoryEvidenceRefs = (payload: RecordLike): string[] => {
  const memoryPacket = readRecord(payload.conversation_memory_packet);
  const goalFrame = readRecord(payload.canonical_goal_frame);
  const routeText = [
    readString(payload.route_reason_code),
    readString(payload.route),
    readString(goalFrame?.goal_kind),
  ].join(" ");
  if (!memoryPacket || !/conversation_memory_recall/i.test(routeText)) return [];
  return unique([
    readString(memoryPacket.packet_id),
    readString(payload.conversation_memory_evidence_ref),
    readString(payload.terminal_artifact_id),
    `${readString(payload.turn_id) || "current_turn"}:conversation_memory_packet`,
  ].filter(Boolean));
};

const collectRepoEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesRepoEvidence =
    /repo_code_evidence_answer|repo_entity_definition/i.test(input.terminalArtifactKind) ||
    /repo_code_evidence_answer|repo_entity_definition/i.test(input.finalAnswerSource);
  if (!terminalUsesRepoEvidence) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => readString(entry.kind) === "repo_code_evidence_observation")
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const collectDocsViewerEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesDocsEvidence =
    /doc_summary|doc_location|doc_open_receipt|active_doc/i.test(input.terminalArtifactKind) ||
    /doc_summary|doc_location|doc_open_receipt|active_doc/i.test(input.finalAnswerSource);
  if (!terminalUsesDocsEvidence) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => {
      const kind = readString(entry.kind);
      return (
        kind === "doc_summary" ||
        kind === "doc_search_results" ||
        kind === "doc_open_receipt" ||
        kind === "active_doc_path" ||
        kind === "doc_context"
      );
    })
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const collectScholarlyResearchEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesScholarlyResearch =
    /scholarly_research_answer|scholarly_research_observation|scholarly_full_text_observation/i.test(input.terminalArtifactKind) ||
    /scholarly_research_answer|scholarly_research_observation|scholarly_full_text_observation/i.test(input.finalAnswerSource);
  if (!terminalUsesScholarlyResearch) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => {
      const kind = readString(entry.kind);
      return kind === "scholarly_research_observation" || kind === "scholarly_full_text_observation";
    })
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const collectInternetSearchEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesInternetSearch =
    /internet_search_answer|internet_search_observation/i.test(input.terminalArtifactKind) ||
    /internet_search_answer|internet_search_observation/i.test(input.finalAnswerSource);
  if (!terminalUsesInternetSearch) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => readString(entry.kind) === "internet_search_observation")
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const collectCapabilityHelpEvidenceRefs = (input: {
  payload: RecordLike;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const terminalUsesCapabilityHelp =
    /capability_help_summary/i.test(input.terminalArtifactKind) ||
    /capability_help_summary/i.test(input.finalAnswerSource);
  if (!terminalUsesCapabilityHelp) return [];
  const ledger = Array.isArray(input.payload.current_turn_artifact_ledger)
    ? input.payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => {
      const kind = readString(entry.kind);
      return kind === "capability_registry" || kind === "capability_help_summary";
    })
    .map((entry) => readString(entry.artifact_id))
    .filter(Boolean);
};

const capabilityItineraryEvidencePatterns: Array<{ family: string; pattern: RegExp }> = [
  {
    family: "calculator",
    pattern:
      /calculator_receipt|calculator_result|workstation_tool_evaluation|scientific[-_.:]calculator[-_.:]solve[-_.:]expression/i,
  },
  {
    family: "docs_viewer",
    pattern:
      /docs_viewer_receipt|doc_open_receipt|doc_location_result|doc_location_matches|doc_evidence_location|doc_equation_context|doc_summary|observation_review/i,
  },
  {
    family: "repo_code",
    pattern:
      /repo_code_evidence_observation|repo_code_search_result|repo_evidence_relevance_gate|repo[-_.:]code[-_.:]search[-_.:]concept/i,
  },
  {
    family: "workspace_directory",
    pattern: /workspace_directory_resolution|workspace[-_.:]directory[-_.:]resolve/i,
  },
  {
    family: "workspace_diagnostic",
    pattern: /workspace_os_status_observation|workspace_os\.status|workspace[-_]os[-_]status|workspace_status/i,
  },
  {
    family: "workstation",
    pattern: /workspace_action_receipt|workstation_tool_evaluation|tool_evaluation|note_update_receipt|note_action_receipt/i,
  },
  {
    family: "workstation_action",
    pattern: /workspace_action_receipt|workstation_tool_evaluation|tool_evaluation|note_update_receipt|note_action_receipt/i,
  },
  {
    family: "capability_catalog",
    pattern: /capability_registry|capability_help_summary|inspect_capability_catalog/i,
  },
  {
    family: "internet_search",
    pattern: /internet_search_observation|web_research_observation|internet_search|web_research/i,
  },
  {
    family: "scholarly_research",
    pattern: /scholarly_research_observation|scholarly_full_text_observation|lookup_papers|fetch_full_text/i,
  },
  {
    family: "theory_locator",
    pattern:
      /helix_theory_context_reflection_tool_receipt|theory_context_reflection|reflect_theory_context|helix_theory_frontier_vector_field_tool_receipt|theory_frontier_vector_field|frontierVectorFieldTrace/i,
  },
  {
    family: "context_reflection",
    pattern:
      /helix_context_reflection_tool_receipt|bounded_context_reference|context_attachment|live_synthetic_data/i,
  },
  {
    family: "zen_graph_reflection",
    pattern:
      /ideology_context_reflection|procedural_zen_classification|helix_zen_graph_reflection_tool_result|helix_theory_ideology_bridge_tool_result|theory_ideology_bridge/i,
  },
  {
    family: "civilization_bounds",
    pattern:
      /civilization_scenario_frame|helix_civilization_scenario_frame_tool_result|civilization_bounds_roadmap|helix_civilization_bounds_tool_result/i,
  },
  {
    family: "visual_capture",
    pattern:
      /visual_frame_evidence|situation_context_pack|visual_capture_coverage|image_lens\.inspect|situation[-_]room[-_.:]describe[-_]visual[-_]capture/i,
  },
  {
    family: "situation_run",
    pattern:
      /visual_frame_evidence|situation_context_pack|visual_capture_coverage|situation[-_]room[-_.:]describe[-_]visual[-_]capture|situation_run/i,
  },
  {
    family: "live_environment",
    pattern:
      /live_environment_tool_observation|stage_play_|micro_reasoner|workstation_goal|agent_goal|narrator|voice_|route_watch|loop_state/i,
  },
  {
    family: "live_source_mail",
    pattern:
      /processed_live_source_mail|stage_play_processed_mail_packet|live_source_mail|read_processed_live_source_mail|reflect_live_source_mail_loop/i,
  },
  {
    family: "live_pipeline",
    pattern: /live_pipeline|live_source_pipeline|stage_play_live_source|stage_play_source_query/i,
  },
  {
    family: "live_source_decision",
    pattern: /live_source_decision|checkpoint|stage_play_checkpoint|arbiter/i,
  },
  {
    family: "process_graph",
    pattern: /stage_play_badge_graph|badge_graph|process_graph/i,
  },
  {
    family: "voice_delivery",
    pattern: /voice_delivery|voice_|narrator/i,
  },
  {
    family: "notes",
    pattern: /note_update_receipt|note_action_receipt|workstation[-_]notes[-_.:]append[-_]to[-_]note/i,
  },
];

const capabilityItineraryEntryMatchesObservedFamily = (entry: RecordLike, requiredObserved: Set<string>): boolean => {
  const payloadRecord = readRecord(entry.payload);
  const haystack = [
    readString(entry.kind),
    readString(payloadRecord?.schema),
    readString(payloadRecord?.capability),
    readString(payloadRecord?.tool_id),
  ].join(" ");
  return capabilityItineraryEvidencePatterns.some(({ family, pattern }) => requiredObserved.has(family) && pattern.test(haystack));
};

const collectCapabilityItineraryEvidenceRefs = (payload: RecordLike): string[] => {
  const itinerary = readRecord(payload.capability_itinerary);
  const executionState = readRecord(itinerary?.execution_state);
  const requiredFamilies = readStringArray(
    executionState?.required_observation_families ??
      readRecord(itinerary?.terminal_success_criteria)?.required_observation_families,
  );
  const observedFamilies = readStringArray(executionState?.observed_families);
  if (requiredFamilies.length === 0) return [];
  const requiredObserved = new Set(
    requiredFamilies.filter((family) => observedFamilies.length === 0 || observedFamilies.includes(family)),
  );
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => capabilityItineraryEntryMatchesObservedFamily(entry, requiredObserved))
    .flatMap((entry) => {
      const payloadRecord = readRecord(entry.payload);
      return [
        readString(entry.artifact_id),
        readString(payloadRecord?.artifact_id),
        ...readStringArray(payloadRecord?.evidence_refs),
        ...readStringArray(payloadRecord?.support_refs),
        ...readStringArray(payloadRecord?.produced_artifact_refs),
      ];
    })
    .filter(Boolean);
};

const collectInternetSearchObservationArtifacts = (payload: RecordLike): RecordLike[] => {
  const ledger = Array.isArray(payload.current_turn_artifact_ledger)
    ? payload.current_turn_artifact_ledger
    : [];
  return ledger
    .map((entry) => readRecord(entry))
    .filter((entry): entry is RecordLike => Boolean(entry))
    .filter((entry) => {
      const payloadRecord = readRecord(entry.payload);
      return (
        readString(entry.kind) === "internet_search_observation" ||
        readString(payloadRecord?.schema) === "helix.internet_search_observation.v1"
      );
    });
};

const hostForUrl = (value: string): string => {
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
};

const internetSearchEvidencePlanIncomplete = (input: {
  payload: RecordLike;
  selectedEvidenceRefs: string[];
  toolUseRestatement?: ToolUseRestatementV1 | RecordLike | null;
}): boolean => {
  const restatement = readRecord(input.toolUseRestatement ?? input.payload.tool_use_restatement);
  const families = readStringArray(restatement?.requiredToolFamilies ?? restatement?.required_tool_families);
  if (!families.includes("internet_search")) return false;
  const plan = readRecord(restatement?.minimumEvidencePlan ?? restatement?.minimum_evidence_plan);
  const minSearches = typeof plan?.minSearches === "number" ? plan.minSearches : 1;
  const minIndependentSources = typeof plan?.minIndependentSources === "number" ? plan.minIndependentSources : 1;
  const observations = collectInternetSearchObservationArtifacts(input.payload);
  const selected = observations.filter((entry) => {
    const artifactId = readString(entry.artifact_id) || readString(readRecord(entry.payload)?.artifact_id);
    const payloadRecord = readRecord(entry.payload);
    return (
      payloadRecord?.selected_for_answer !== false &&
      (!artifactId || input.selectedEvidenceRefs.length === 0 || input.selectedEvidenceRefs.includes(artifactId))
    );
  });
  const hosts = new Set<string>();
  for (const entry of selected) {
    const payloadRecord = readRecord(entry.payload);
    const results = Array.isArray(payloadRecord?.results) ? payloadRecord.results : [];
    for (const result of results) {
      const url = readString(readRecord(result)?.url);
      const host = hostForUrl(url);
      if (host) hosts.add(host);
    }
    const evidenceRefs = Array.isArray(payloadRecord?.evidence_refs) ? payloadRecord.evidence_refs : [];
    for (const ref of evidenceRefs) {
      const url = readString(readRecord(ref)?.url);
      const host = hostForUrl(url);
      if (host) hosts.add(host);
    }
  }
  return selected.length < minSearches || hosts.size < minIndependentSources;
};

const collectReceiptRefs = (input: {
  payload: RecordLike;
  loopTrace: RecordLike | null;
  terminalArtifactKind: string;
  finalAnswerSource: string;
}): string[] => {
  const refs: string[] = [];
  for (const call of collectActualToolCalls(input.loopTrace)) {
    const toolId = readString(call.tool_id);
    const resultRef = readString(call.result_ref);
    if (resultRef && (isReceiptKind(resultRef) || isReceiptKind(toolId))) refs.push(resultRef);
  }
  for (const key of ["workspace_action_receipt", "live_pipeline_turn_receipt", "live_source_pipeline_receipt", "visual_producer_cadence_receipt"]) {
    const receipt = readRecord(input.payload[key]);
    const ref = readString(receipt?.receipt_id) || readString(receipt?.pipeline_receipt_id);
    if (ref) refs.push(ref);
  }
  if (isReceiptKind(input.terminalArtifactKind)) refs.push(input.terminalArtifactKind);
  if (isReceiptKind(input.finalAnswerSource)) refs.push(input.finalAnswerSource);
  return unique(refs);
};

export function buildEvidenceReentryGate(input: {
  turnId: string;
  payload: RecordLike;
  loopTrace?: RecordLike | null;
  primaryIntent: HelixIntentKind;
  terminalArtifactKind: string;
  finalAnswerSource: string;
  finalArbitrationRan: boolean;
  sourceEvidenceRequired?: boolean;
  allowedTerminalProducts?: string[];
  toolUseRestatement?: ToolUseRestatementV1 | RecordLike | null;
}): HelixEvidenceReentryGate {
  const loopTrace = input.loopTrace ?? null;
  const selectedEvidenceRefs = unique([
    ...readStringArray(loopTrace?.evidence_selected_for_answer),
    ...collectWorkspaceSourceEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectConversationMemoryEvidenceRefs(input.payload),
    ...collectRepoEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectDocsViewerEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectScholarlyResearchEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectInternetSearchEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectCapabilityHelpEvidenceRefs({
      payload: input.payload,
      terminalArtifactKind: input.terminalArtifactKind,
      finalAnswerSource: input.finalAnswerSource,
    }),
    ...collectCapabilityItineraryEvidenceRefs(input.payload),
  ]);
  const rejectedEvidenceRefs = collectRejectedEvidence(loopTrace);
  const rejectedRefSet = new Set(rejectedEvidenceRefs.map((entry) => entry.ref));
  const evidenceRefSet = new Set([...selectedEvidenceRefs, ...rejectedEvidenceRefs.map((entry) => entry.ref)]);
  const actualToolCalls = collectActualToolCalls(loopTrace);
  const observationRefs = collectObservationRefs(loopTrace);
  const receiptRefs = collectReceiptRefs({
    payload: input.payload,
    loopTrace,
    terminalArtifactKind: input.terminalArtifactKind,
    finalAnswerSource: input.finalAnswerSource,
  });
  const allowedReceiptTerminal = primaryAllowsReceiptTerminal(
    input.primaryIntent,
    input.terminalArtifactKind,
    input.allowedTerminalProducts ?? [],
    input.payload,
  );
  const receiptsReentered = receiptRefs.filter((ref) =>
    evidenceRefSet.has(ref) ||
    (allowedReceiptTerminal &&
      (ref === input.terminalArtifactKind || ref === input.finalAnswerSource || isReceiptKind(ref)))
  );
  const receiptsNotReentered = receiptRefs.filter((ref) => !receiptsReentered.includes(ref));
  const projectionRefs = unique([
    isProjectionKind(input.terminalArtifactKind) ? input.terminalArtifactKind : "",
    isProjectionKind(input.finalAnswerSource) ? input.finalAnswerSource : "",
  ].filter(Boolean));
  const projectionsReentered = projectionRefs.filter((ref) => evidenceRefSet.has(ref) || rejectedRefSet.has(ref));
  const projectionsNotReentered = projectionRefs.filter((ref) => !projectionsReentered.includes(ref));
  const hasTerminalReceipt = isReceiptKind(input.terminalArtifactKind) || isReceiptKind(input.finalAnswerSource);
  const hasTerminalProjection = isProjectionKind(input.terminalArtifactKind) || isProjectionKind(input.finalAnswerSource);
  const required =
    actualToolCalls.length > 0 ||
    observationRefs.length > 0 ||
    selectedEvidenceRefs.length > 0 ||
    input.sourceEvidenceRequired === true ||
    rejectedEvidenceRefs.length > 0 ||
    receiptRefs.length > 0 ||
    projectionRefs.length > 0 ||
    hasTerminalReceipt ||
    hasTerminalProjection;
  const violationCodes = unique<HelixEvidenceReentryViolationCode>([
    hasTerminalReceipt && (!allowedReceiptTerminal || receiptsNotReentered.length > 0)
      ? "receipt_terminal_without_reentry"
      : "",
    hasTerminalProjection && projectionsNotReentered.length > 0
      ? "projection_terminal_without_reentry"
      : "",
    actualToolCalls.length > 0 && hasTerminalReceipt && receiptsNotReentered.length > 0
      ? "tool_result_terminal_without_reentry"
      : "",
    (observationRefs.length > 0 || input.sourceEvidenceRequired === true) &&
      selectedEvidenceRefs.length === 0 &&
      input.primaryIntent !== "control_command" &&
      input.primaryIntent !== "status_question"
      ? "source_observation_terminal_without_selection"
      : "",
    selectedEvidenceRefs.length > 0 && !input.finalArbitrationRan
      ? "evidence_selected_but_finalizer_missing"
      : "",
    internetSearchEvidencePlanIncomplete({
      payload: input.payload,
      selectedEvidenceRefs,
      toolUseRestatement: input.toolUseRestatement,
    })
      ? "internet_search_evidence_plan_incomplete"
      : "",
  ].filter((entry): entry is HelixEvidenceReentryViolationCode => Boolean(entry)));

  return {
    schema: "helix.evidence_reentry_gate.v1",
    turn_id: input.turnId,
    required,
    completed: violationCodes.length === 0 && (!required || input.finalArbitrationRan || allowedReceiptTerminal),
    selected_evidence_refs: selectedEvidenceRefs,
    rejected_evidence_refs: rejectedEvidenceRefs,
    receipts_reentered: receiptsReentered,
    receipts_not_reentered: receiptsNotReentered,
    projections_reentered: projectionsReentered,
    projections_not_reentered: projectionsNotReentered,
    violation_codes: violationCodes,
    assistant_answer: false,
    raw_content_included: false,
  };
}
