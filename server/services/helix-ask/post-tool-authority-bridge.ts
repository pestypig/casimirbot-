import { evaluateCalculatorToolAnswerSupport } from "./calculator-tool-answer-support";

export const HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA = "helix.post_tool_authority_bridge.v1" as const;

export type HelixPostToolAuthorityBridge = {
  schema: typeof HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA;
  turn_id: string;
  applies: boolean;
  selected_capability?: string;
  tool_observation_refs: string[];
  answer_draft_refs: string[];
  observation_support_status:
    | "supports_answer"
    | "supports_request_user_input"
    | "supports_typed_failure"
    | "not_enough_information"
    | "not_applicable";
  route_family:
    | "docs_panel"
    | "calculator"
    | "situation_room_setup"
    | "voice_delivery"
    | "repo_docs"
    | "scholarly_research"
    | "workstation_panel"
    | "unknown";
  required_terminal_kind:
    | "model_synthesized_answer"
    | "repo_code_evidence_answer"
    | "scholarly_research_answer"
    | "situation_room_live_job_setup_answer"
    | "request_user_input"
    | "typed_failure";
  terminal_repair_action?:
    | "materialize_model_synthesized_answer"
    | "materialize_request_user_input"
    | "materialize_precise_typed_failure"
    | "repair_timeline_provenance"
    | "none";
  pending_requirements: Array<{
    code:
      | "missing_live_source"
      | "missing_route_destination"
      | "voice_confirmation_required"
      | "missing_active_doc"
      | "missing_calculator_result"
      | "missing_post_tool_answer_draft";
    message: string;
    request_user_input_question?: string;
  }>;
  reason: string;
  assistant_answer: false;
  raw_content_included: false;
};

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string =>
  typeof value === "string" && value.trim() ? value.trim() : "";

const readArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const latestArtifact = (payload: RecordLike, pattern: RegExp): RecordLike | null => {
  const artifacts = readArray(payload.current_turn_artifact_ledger).map(readRecord).filter(Boolean) as RecordLike[];
  for (const artifact of [...artifacts].reverse()) {
    const artifactPayload = readRecord(artifact.payload);
    const haystack = [
      readString(artifact.kind),
      readString(artifact.artifact_id),
      readString(artifactPayload?.schema),
      readString(artifactPayload?.kind),
    ].join(" ");
    if (pattern.test(haystack)) return artifact;
  }
  return null;
};

const artifactRefs = (payload: RecordLike, pattern: RegExp): string[] =>
  readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter((artifact): artifact is RecordLike => {
      const artifactPayload = readRecord(artifact?.payload);
      return pattern.test([
        readString(artifact?.kind),
        readString(artifact?.artifact_id),
        readString(artifactPayload?.schema),
        readString(artifactPayload?.kind),
        readString(artifactPayload?.capability_key),
        readString(artifactPayload?.action_id),
      ].join(" "));
    })
    .map((artifact) => readString(artifact.artifact_id))
    .filter(Boolean);

const finalDraftText = (payload: RecordLike): string => {
  const artifact = latestArtifact(payload, /final_answer_draft|helix\.final_answer_draft\.v1/);
  const artifactPayload = readRecord(artifact?.payload);
  const directPayload = readRecord(payload.final_answer_draft);
  return (
    readString(artifactPayload?.text) ||
    readString(artifactPayload?.answer_text) ||
    readString(directPayload?.text) ||
    readString(directPayload?.answer_text)
  );
};

const selectedCapability = (payload: RecordLike): string =>
  readString(readRecord(payload.agent_step_decision)?.chosen_capability) ||
  readString(readRecord(readRecord(payload.agent_step_decision)?.model_decision)?.chosen_capability) ||
  readString(readRecord(payload.runtime_tool_call)?.capability_key);

const inferRouteFamily = (payload: RecordLike, capability: string): HelixPostToolAuthorityBridge["route_family"] => {
  const sourceTarget = readString(readRecord(payload.route_product_contract)?.source_target);
  const goalKind = readString(readRecord(payload.canonical_goal_frame)?.goal_kind);
  const prompt = readString(payload.active_prompt) || readString(payload.prompt) || readString(payload.question);
  const haystack = `${sourceTarget} ${goalKind} ${capability} ${readString(payload.route_reason_code)} ${readString(payload.route)} ${prompt}`;
  if (/scholarly_research|scholarly-research|doi|arxiv|citation|journal/i.test(haystack)) return "scholarly_research";
  if (/calculator|scientific-calculator/i.test(haystack)) return "calculator";
  if (/voice_delivery|confirm_speak|read.+out loud|voice/i.test(haystack)) return "voice_delivery";
  if (/dottie|situation-room|minecraft|live_pipeline|stage_play_badge_graph|stage_play_job_plan|stage_play_checkpoint_request_result|stage_play_checkpoint_request|stage_play_checkpoint_queue|stage_play_builder_catalog|stage_play_source_query|stage_play_graph_draft_validation|reflect_stage_play_context|plan_stage_play_job|request_stage_play_checkpoint/i.test(haystack)) return "situation_room_setup";
  if (/repo|doc_summary|doc_evidence|search_docs/i.test(haystack)) return "repo_docs";
  if (/docs-viewer|doc_open|docs_panel/i.test(haystack)) return "docs_panel";
  if (capability.includes(".")) return "workstation_panel";
  return "unknown";
};

export function buildPostToolAuthorityBridge(input: {
  turnId: string;
  payload: RecordLike;
}): HelixPostToolAuthorityBridge {
  const capability = selectedCapability(input.payload);
  const routeFamily = inferRouteFamily(input.payload, capability);
  const toolObservationRefs = artifactRefs(input.payload, /agent_step_observation_packet|runtime_tool_observation|live_environment_tool_observation|workspace_action_receipt|calculator_receipt|scholarly_research_observation|scholarly_full_text_observation|dottie_|voice_delivery|workstation_tool_evaluation|stage_play_badge_graph|stage_play_job_plan|stage_play_checkpoint_request_result|stage_play_checkpoint_request|stage_play_checkpoint_queue|stage_play_builder_catalog|stage_play_source_query|stage_play_graph_draft_validation/);
  const answerDraftRefs = artifactRefs(input.payload, /final_answer_draft|direct_answer_text|repo_code_evidence_answer|scholarly_research_answer/);
  const calculatorSupport = evaluateCalculatorToolAnswerSupport({ turnId: input.turnId, payload: input.payload });
  if (calculatorSupport.supports_goal) {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability || calculatorSupport.selected_capability || undefined,
      tool_observation_refs: calculatorSupport.calculator_observation_refs,
      answer_draft_refs: calculatorSupport.final_answer_draft_ref ? [calculatorSupport.final_answer_draft_ref] : answerDraftRefs,
      observation_support_status: "supports_answer",
      route_family: "calculator",
      required_terminal_kind: "model_synthesized_answer",
      terminal_repair_action: "materialize_model_synthesized_answer",
      pending_requirements: [],
      reason: "calculator_result_and_answer_draft_support_goal",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (routeFamily === "voice_delivery") {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability || undefined,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: "supports_request_user_input",
      route_family: "voice_delivery",
      required_terminal_kind: "request_user_input",
      terminal_repair_action: "materialize_request_user_input",
      pending_requirements: [{
        code: "voice_confirmation_required",
        message: "Voice delivery requires explicit confirmation before speaking.",
        request_user_input_question: "I can prepare that voice output, but I need your confirmation before speaking. Should I speak it now?",
      }],
      reason: "voice_confirmation_required",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (routeFamily === "scholarly_research") {
    const draftText = finalDraftText(input.payload);
    const supportsAnswer = Boolean(toolObservationRefs.length > 0 && draftText);
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: toolObservationRefs.length > 0 || answerDraftRefs.length > 0,
      selected_capability: capability || undefined,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: supportsAnswer ? "supports_answer" : toolObservationRefs.length > 0 ? "not_enough_information" : "not_applicable",
      route_family: "scholarly_research",
      required_terminal_kind: "scholarly_research_answer",
      terminal_repair_action: "none",
      pending_requirements: supportsAnswer ? [] : [{
        code: toolObservationRefs.length > 0 ? "missing_post_tool_answer_draft" : "missing_live_source",
        message: toolObservationRefs.length > 0 ? "A model-authored scholarly answer draft is missing." : "No usable scholarly research observation was found.",
      }],
      reason: supportsAnswer
        ? "scholarly_route_requires_scholarly_research_answer_materialization"
        : "scholarly_post_tool_support_incomplete",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (routeFamily === "situation_room_setup" && /budget_exhausted|terminal_boundary_ineligible/i.test(readString(input.payload.terminal_error_code))) {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability || undefined,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: "supports_request_user_input",
      route_family: "situation_room_setup",
      required_terminal_kind: "request_user_input",
      terminal_repair_action: "materialize_request_user_input",
      pending_requirements: [{
        code: "missing_live_source",
        message: "The setup needs a live Minecraft/source binding before it can proceed.",
        request_user_input_question: "I can set up Auntie Dottie, but I need the Minecraft live source or route destination first. Which source should I attach?",
      }],
      reason: "live_job_setup_pending_source",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  const draftText = finalDraftText(input.payload);
  const supportsAnswer = Boolean(toolObservationRefs.length > 0 && draftText);
  return {
    schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
    turn_id: input.turnId,
    applies: toolObservationRefs.length > 0 || routeFamily !== "unknown",
    selected_capability: capability || undefined,
    tool_observation_refs: toolObservationRefs,
    answer_draft_refs: answerDraftRefs,
    observation_support_status: supportsAnswer ? "supports_answer" : toolObservationRefs.length > 0 ? "not_enough_information" : "not_applicable",
    route_family: routeFamily,
    required_terminal_kind: routeFamily === "repo_docs" ? "repo_code_evidence_answer" : "model_synthesized_answer",
    terminal_repair_action: supportsAnswer ? "materialize_model_synthesized_answer" : "none",
    pending_requirements: supportsAnswer ? [] : [{
      code: toolObservationRefs.length > 0 ? "missing_post_tool_answer_draft" : "missing_live_source",
      message: toolObservationRefs.length > 0 ? "A post-tool answer draft is missing." : "No usable tool observation was found.",
    }],
    reason: supportsAnswer ? "tool_observation_and_answer_draft_support_goal" : "post_tool_support_incomplete",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function applyPostToolAuthorityBridgeRepair(input: {
  turnId: string;
  payload: RecordLike;
  bridge?: HelixPostToolAuthorityBridge;
}): HelixPostToolAuthorityBridge {
  const bridge = input.bridge ?? buildPostToolAuthorityBridge({ turnId: input.turnId, payload: input.payload });
  input.payload.post_tool_authority_bridge = bridge as unknown as RecordLike;
  if (!bridge.applies) return bridge;

  if (bridge.observation_support_status === "supports_answer" && bridge.required_terminal_kind === "model_synthesized_answer") {
    const text = finalDraftText(input.payload);
    if (text) {
      input.payload.ok = true;
      input.payload.response_type = "final_answer";
      input.payload.final_status = "final_answer";
      input.payload.terminal_artifact_kind = "model_synthesized_answer";
      input.payload.final_answer_source = "final_answer_draft";
      input.payload.selected_final_answer = text;
      input.payload.answer = text;
      input.payload.text = text;
      input.payload.assistant_answer = text;
      delete input.payload.terminal_error_code;
      const goal = readRecord(input.payload.goal_satisfaction_evaluation);
      if (goal) {
        goal.satisfaction = "satisfied";
        goal.next_decision = "allow_terminal";
        goal.reason = bridge.reason;
        goal.supporting_artifact_refs = Array.from(new Set([
          ...bridge.tool_observation_refs,
          ...bridge.answer_draft_refs,
        ]));
      }
    }
    return bridge;
  }

  if (bridge.observation_support_status === "supports_request_user_input") {
    const requirement = bridge.pending_requirements[0];
    const prompt = requirement?.request_user_input_question ?? "I need one more confirmation or source before I can continue.";
    const requestUserInput = {
      schema: "helix.request_user_input.v1",
      turn_id: input.turnId,
      prompt,
      reason: bridge.reason,
      pending_requirements: bridge.pending_requirements,
      assistant_answer: false,
      raw_content_included: false,
    };
    input.payload.ok = true;
    input.payload.response_type = "pending_input";
    input.payload.final_status = "pending_input";
    input.payload.terminal_artifact_kind = "request_user_input";
    input.payload.final_answer_source = "request_user_input";
    input.payload.request_user_input = requestUserInput;
    input.payload.pending_server_request = requestUserInput;
    input.payload.selected_final_answer = prompt;
    input.payload.answer = prompt;
    input.payload.text = prompt;
    input.payload.assistant_answer = prompt;
    delete input.payload.terminal_error_code;
    const goal = readRecord(input.payload.goal_satisfaction_evaluation);
    if (goal) {
      goal.satisfaction = "needs_user_input";
      goal.next_decision = "request_user_input";
      goal.reason = bridge.reason;
      goal.pending_requirements = bridge.pending_requirements;
    }
  }
  return bridge;
}
