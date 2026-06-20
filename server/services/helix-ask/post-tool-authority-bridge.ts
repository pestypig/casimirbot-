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
    | "live_source_mailbox"
    | "situation_room_setup"
    | "voice_delivery"
    | "repo_docs"
    | "scholarly_research"
    | "internet_search"
    | "workstation_panel"
    | "unknown";
  required_terminal_kind:
    | "model_synthesized_answer"
    | "doc_evidence_synthesis_answer"
    | "repo_code_evidence_answer"
    | "scholarly_research_answer"
    | "internet_search_answer"
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

const selectedVisibleAnswerText = (payload: RecordLike): string =>
  readString(payload.selected_final_answer) ||
  readString(payload.assistant_answer) ||
  readString(payload.answer) ||
  readString(payload.text);

const clip = (value: string, max = 180): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}...` : value;

const artifactLedger = (payload: RecordLike): RecordLike[] =>
  readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter((artifact): artifact is RecordLike => Boolean(artifact));

const artifactPayload = (artifact: RecordLike): RecordLike | null => readRecord(artifact.payload);

const artifactObservation = (artifact: RecordLike): RecordLike | null =>
  readRecord(artifactPayload(artifact)?.observation) ?? readRecord(artifact.observation);

const artifactToolName = (artifact: RecordLike): string =>
  readString(artifactPayload(artifact)?.tool_name) ||
  readString(artifactPayload(artifact)?.toolName) ||
  readString(artifact.tool_name) ||
  readString(artifact.toolName);

const collectLiveSourceProcessedPackets = (payload: RecordLike): RecordLike[] =>
  artifactLedger(payload).flatMap((artifact) => {
    const directPayload = artifactPayload(artifact);
    const observation = artifactObservation(artifact);
    return [
      directPayload,
      ...readArray(directPayload?.packets),
      ...readArray(observation?.packets),
    ].map(readRecord).filter((entry): entry is RecordLike => {
      const marker = [
        readString(entry.artifactId),
        readString(entry.artifact_id),
        readString(entry.packetId),
        readString(entry.packet_id),
        readString(entry.schema),
        readString(entry.schemaVersion),
        readString(entry.kind),
      ].join(" ");
      return /stage_play_processed_mail_packet|processed_mail_packet/i.test(marker);
    });
  });

const collectLiveSourceMailLoopReflections = (payload: RecordLike): RecordLike[] =>
  artifactLedger(payload).flatMap((artifact) => {
    const directPayload = artifactPayload(artifact);
    const observation = artifactObservation(artifact);
    return [
      directPayload,
      observation,
      readRecord(directPayload?.reflection),
      readRecord(observation?.reflection),
    ].map(readRecord).filter((entry): entry is RecordLike => {
      if (!entry) return false;
      const marker = [
        readString(entry.artifactId),
        readString(entry.artifact_id),
        readString(entry.schema),
        readString(entry.schemaVersion),
        readString(entry.kind),
      ].join(" ");
      return /stage_play_live_source_mail_loop_reflection/i.test(marker);
    });
  });

const latestLiveSourceMailDecision = (payload: RecordLike): RecordLike | null => {
  for (const artifact of [...artifactLedger(payload)].reverse()) {
    const haystack = [
      readString(artifact.kind),
      readString(artifact.artifact_id),
      readString(artifactPayload(artifact)?.schema),
      readString(artifactObservation(artifact)?.artifactId),
      readString(artifactObservation(artifact)?.schemaVersion),
      artifactToolName(artifact),
    ].join(" ");
    if (/stage_play_live_source_mail_decision|record_live_source_mail_decision/i.test(haystack)) {
      return artifactObservation(artifact) ?? artifactPayload(artifact);
    }
  }
  return null;
};

const latestLiveSourceVoiceReceipt = (payload: RecordLike): RecordLike | null => {
  for (const artifact of [...artifactLedger(payload)].reverse()) {
    const observation = artifactObservation(artifact);
    const receipt = readRecord(observation?.receipt) ?? readRecord(artifactPayload(artifact)?.receipt);
    const haystack = [
      readString(artifact.kind),
      readString(artifact.artifact_id),
      readString(artifactPayload(artifact)?.schema),
      readString(observation?.schema),
      readString(observation?.artifactId),
      readString(observation?.kind),
      artifactToolName(artifact),
      readString(receipt?.status),
    ].join(" ");
    if (/request_interim_voice_callout|interim_voice_callout|voice_hold_receipt|voice_block_receipt|voice_receipt|awaiting_client_playback|queued_for_retry|blocked_capacity|blocked_policy|blocked_missing_text|delivered|expired/i.test(haystack)) {
      return receipt ?? observation ?? artifactPayload(artifact);
    }
  }
  return null;
};

const readStringItems = (value: unknown): string[] =>
  readArray(value).map((entry) => {
    if (typeof entry === "string") return entry.trim();
    const record = readRecord(entry);
    return readString(record?.text) || readString(record?.summary) || readString(record?.label);
  }).filter(Boolean);

const firstString = (...values: unknown[]): string =>
  values.map(readString).find(Boolean) ?? "";

const liveSourceMailboxTerminalArtifactRef = (payload: RecordLike, turnId: string): string =>
  readString(payload.terminal_artifact_id) ||
  readString(readRecord(payload.final_answer_draft)?.artifact_id) ||
  `${turnId}:live_source_mailbox_synthesis`;

const liveSourceMailboxSynthesisText = (payload: RecordLike): string => {
  const packet = collectLiveSourceProcessedPackets(payload).at(-1) ?? null;
  const decision = latestLiveSourceMailDecision(payload);
  const voiceReceipt = latestLiveSourceVoiceReceipt(payload);
  if (!packet || !decision || !voiceReceipt) return "";

  const recommendedNext = readString(packet.recommendedNext) || readString(packet.recommended_next);
  const salience = readRecord(packet.salience);
  const salienceLevel = readString(salience?.level);
  const decisionValue = readString(decision.decision) || readString(decision.selectedDecision) || readString(decision.selected_decision);
  const rationale = readString(decision.rationalePreview) || readString(decision.rationale_preview);
  const voiceCalloutDraft = readRecord(decision.voiceCalloutDraft ?? decision.voice_callout_draft);
  const voicePolicy = readRecord(decision.voicePolicy ?? decision.voice_policy);
  const voiceText = readString(voiceCalloutDraft?.text);
  const voicePolicyReason = readString(voicePolicy?.reason);
  const requestedTool = readString(readRecord(decision.requestedTool ?? decision.requested_tool)?.toolName) ||
    readString(readRecord(decision.requestedTool ?? decision.requested_tool)?.tool_name);
  const receiptStatus = readString(voiceReceipt.status) || readString(voiceReceipt.receipt_status);
  const observedFacts = readStringItems(packet.observedFacts ?? packet.observed_facts ?? packet.facts).slice(0, 2);
  const changedFacts = readStringItems(packet.changedFacts ?? packet.changed_facts).slice(0, 2);
  const riskCues = readStringItems(packet.riskCues ?? packet.risk_cues ?? salience?.riskCues ?? salience?.risk_cues).slice(0, 4);
  const reasonCodes = readStringItems(
    packet.reasonCodes ??
    packet.reason_codes ??
    salience?.reasonCodes ??
    salience?.reason_codes ??
    voicePolicyReason?.split(","),
  ).slice(0, 4);

  const details = [
    recommendedNext ? `processed packet recommended ${recommendedNext}` : "",
    salienceLevel ? `salience was ${salienceLevel}` : "",
    riskCues.length ? `risk cues were ${riskCues.join(", ")}` : "",
    reasonCodes.length ? `reason codes were ${reasonCodes.join(", ")}` : "",
  ].filter(Boolean).join("; ");

  const evidence = [...observedFacts, ...changedFacts].slice(0, 3).map((entry) => clip(entry, 150));
  return [
    `The live-source mailbox route completed: it read processed mailbox packets, recorded a mail decision, and reached the voice receipt checkpoint${details ? ` (${details})` : "."}`,
    decisionValue ? `The recorded decision was ${decisionValue}${rationale ? ` because ${rationale}` : ""}.` : "A live-source mail decision receipt is present.",
    voiceText ? `The voice draft was "${clip(voiceText, 140)}".` : "",
    requestedTool ? `The requested next tool was ${requestedTool}.` : "",
    receiptStatus ? `The voice phase has a receipt with status ${receiptStatus}, so another interim voice callout is not required before synthesis.` : "A voice, hold, or block receipt is present, so another interim voice callout is not required before synthesis.",
    evidence.length ? `Evidence used: ${evidence.join(" | ")}` : "",
  ].filter(Boolean).join(" ");
};

const liveSourceMailLoopReflectionSynthesisText = (payload: RecordLike): string => {
  const reflection = collectLiveSourceMailLoopReflections(payload).at(-1) ?? null;
  if (!reflection) return "";
  const inspectionWindow = readRecord(reflection.inspectionWindow ?? reflection.inspection_window);
  const stageSummaries = readRecord(reflection.stageSummaries ?? reflection.stage_summaries);
  const mailIds = readStringItems(inspectionWindow?.mailIds ?? inspectionWindow?.mail_ids);
  const packetRefs = readStringItems(inspectionWindow?.processedPacketRefs ?? inspectionWindow?.processed_packet_refs);
  const microRunRefs = readStringItems(inspectionWindow?.microReasonerRunRefs ?? inspectionWindow?.micro_reasoner_run_refs);
  const decisionRefs = readStringItems(inspectionWindow?.decisionRefs ?? inspectionWindow?.decision_refs);
  const graphRef = readString(inspectionWindow?.stagePlayGraphRef ?? inspectionWindow?.stage_play_graph_ref);
  const currentStateRef = readString(inspectionWindow?.currentStateRef ?? inspectionWindow?.current_state_ref);
  const loopHealthRef = readString(inspectionWindow?.loopHealthRef ?? inspectionWindow?.loop_health_ref);
  const causalEdges = readArray(reflection.causalGraph ?? reflection.causal_graph).length;
  const entered = readStringItems(reflection.whatEnteredAnswerContext ?? reflection.what_entered_answer_context).slice(0, 3);
  const excluded = readStringItems(reflection.whatDidNotEnterAnswerContext ?? reflection.what_did_not_enter_answer_context).slice(0, 3);
  const missing = readStringItems(reflection.missingEvidence ?? reflection.missing_evidence).slice(0, 4);
  const safeSay = readStringItems(reflection.whatAskCanSafelySay ?? reflection.what_ask_can_safely_say).slice(0, 3);
  const limitations = readStringItems(reflection.limitations).slice(0, 3);
  const nextUsefulTool = readString(reflection.nextUsefulTool ?? reflection.next_useful_tool);
  const processedSummary = readStringItems(stageSummaries?.processedMail ?? stageSummaries?.processed_mail).slice(0, 2);
  const microDeckSummary = readStringItems(stageSummaries?.microDeck ?? stageSummaries?.micro_deck).slice(0, 2);
  const readiness = readStringItems(stageSummaries?.terminalReadiness ?? stageSummaries?.terminal_readiness).slice(0, 2);

  return [
    `The live-source mail-loop reflection inspected ${mailIds.length} mail item(s), ${packetRefs.length} processed packet(s), ${microRunRefs.length} MicroDeck run(s), ${decisionRefs.length} decision receipt(s), and ${causalEdges} causal edge(s).`,
    graphRef ? `Stage Play graph evidence was included as ${graphRef}.` : "No Stage Play graph ref was available in the reflection window.",
    currentStateRef || loopHealthRef ? `State refs: ${[currentStateRef, loopHealthRef].filter(Boolean).join(", ")}.` : "",
    processedSummary.length ? `Processed mail: ${processedSummary.map((entry) => clip(entry, 150)).join(" | ")}` : "",
    microDeckSummary.length ? `MicroDeck: ${microDeckSummary.map((entry) => clip(entry, 150)).join(" | ")}` : "",
    entered.length ? `Entered answer context: ${entered.map((entry) => clip(entry, 160)).join(" | ")}` : "No processed packet or MicroDeck evidence entered answer context yet.",
    excluded.length ? `Excluded from answer context: ${excluded.map((entry) => clip(entry, 140)).join(" | ")}` : "",
    safeSay.length ? `Safe to say: ${safeSay.map((entry) => clip(entry, 160)).join(" | ")}` : "",
    missing.length ? `Missing evidence: ${missing.join(", ")}.` : "No missing reflection evidence was reported.",
    limitations.length ? `Limitations: ${limitations.map((entry) => clip(entry, 140)).join(" | ")}` : "",
    readiness.length ? `Terminal readiness: ${readiness.map((entry) => clip(entry, 160)).join(" | ")}` : "",
    nextUsefulTool ? `Next useful tool: ${nextUsefulTool}.` : "",
  ].filter(Boolean).join(" ");
};

const writeLiveSourceMailboxTerminalArtifacts = (input: {
  turnId: string;
  payload: RecordLike;
  bridge: HelixPostToolAuthorityBridge;
  text: string;
}): void => {
  const artifactRef = liveSourceMailboxTerminalArtifactRef(input.payload, input.turnId);
  input.payload.final_answer_draft = {
    ...(readRecord(input.payload.final_answer_draft) ?? {}),
    schema: "helix.final_answer_draft.v1",
    artifact_id: artifactRef,
    turn_id: input.turnId,
    text: input.text,
    answer_text: input.text,
    authority: "live_source_mailbox_receipts_synthesis",
    source: "post_tool_authority_bridge",
    assistant_answer: false,
    raw_content_included: false,
  };
  input.payload.terminal_presentation = {
    ...(readRecord(input.payload.terminal_presentation) ?? {}),
    schema: "helix.terminal_presentation.v1",
    turn_id: input.turnId,
    terminal_artifact_kind: "model_synthesized_answer",
    concise_text: input.text,
    assistant_answer: false,
    raw_content_included: false,
  };
  const rejectedCandidates = selectedVisibleAnswerText(input.payload) && selectedVisibleAnswerText(input.payload) !== input.text
    ? [{
      artifactKind: readString(input.payload.terminal_artifact_kind) || "direct_answer_text",
      artifactRef: readString(input.payload.terminal_artifact_id) || undefined,
      reason: "route_contract_disallowed" as const,
    }]
    : [];
  const audit = {
    artifactId: "terminal_authority_single_writer" as const,
    schemaVersion: "helix.terminal_authority_single_writer.v1" as const,
    selectedArtifactKind: "model_synthesized_answer",
    selectedArtifactRef: artifactRef,
    rejectedCandidates,
    wroteVisibleFields: [
      "payload.text",
      "payload.answer",
      "payload.assistant_answer",
      "payload.selected_final_answer",
      "terminal_presentation.concise_text",
    ],
  };
  const writer = {
    schema: "helix.terminal_authority_single_writer_result.v1",
    artifactId: "terminal_authority_single_writer" as const,
    schemaVersion: "helix.terminal_authority_single_writer.v1" as const,
    turn_id: input.turnId,
    selectedArtifactKind: "model_synthesized_answer",
    selectedArtifactRef: artifactRef,
    selected_terminal_artifact_ref: artifactRef,
    selected_terminal_artifact_kind: "model_synthesized_answer",
    visible_text: input.text,
    assistant_answer: false,
    source: "final_answer_draft",
    rejected_candidates: rejectedCandidates.map((candidate) => ({
      ref: candidate.artifactRef,
      kind: candidate.artifactKind,
      source: "legacy_fallback",
      reason: "route_contract_disallowed",
    })),
    writes: {
      payload_text: input.text,
      payload_answer: input.text,
      payload_assistant_answer: input.text,
      payload_selected_final_answer: input.text,
      terminal_presentation_concise_text: input.text,
      debug_selected_final_answer: input.text,
    },
    wroteVisibleFields: audit.wroteVisibleFields,
    audit,
    integrity: {
      single_writer_applied: true,
      terminal_authority_single_writer_audit: audit,
      forbidden_pre_authority_visible_fields: [],
      visible_matches_selected_artifact: true,
      visible_matches_draft: true,
      stale_failure_visible: false,
      receipt_visible_as_answer: false,
      post_tool_model_step_satisfied: true,
      legacy_terminal_candidate_count: rejectedCandidates.length,
      forbidden_terminal_candidate_count: rejectedCandidates.length,
      payload_mirror_written_after_terminal_selection: true,
      materialized_terminal_artifact_kind: "model_synthesized_answer",
      materialized_terminal_artifact_ref: artifactRef,
      materialization_blocked_reason: null,
    },
  };
  input.payload.terminal_authority_single_writer = writer as unknown as RecordLike;
  input.payload.terminal_candidate_rejections = rejectedCandidates;
  const debug = readRecord(input.payload.debug);
  if (debug) {
    debug.terminal_authority_single_writer = writer as unknown as RecordLike;
    debug.terminal_candidate_rejections = rejectedCandidates;
  }
};

const isCompoundInterimVoiceCalloutPrompt = (payload: RecordLike): boolean => {
  const prompt = [
    readString(payload.active_prompt),
    readString(payload.prompt),
    readString(payload.question),
  ].find(Boolean) ?? "";
  if (!prompt) return false;
  const asksForVoiceCallout =
    /\b(?:interim\s+voice\s+callout|voice\s+callout|callout\s+saying|say(?:ing)?\s+exactly|speak|read\s+out\s+loud)\b/i.test(prompt) ||
    /\blive_env\.request_interim_voice_callout\b/i.test(prompt);
  if (!asksForVoiceCallout) return false;
  return /\b(?:take\s+(?:a\s+)?few\s+steps|multi[-\s]?step|step(?:s)?\s+before|continue|then\s+(?:finish|explain|answer)|explain\s+(?:what|how|why)|what\s+.+\bmean(?:s)?\b|meaning|full[-\s]?fledged|full\s+answer)\b/i.test(prompt);
};

const hasFinalInterimVoiceCalloutReceipt = (payload: RecordLike): boolean =>
  readArray(payload.current_turn_artifact_ledger)
    .map(readRecord)
    .filter((artifact): artifact is RecordLike => Boolean(artifact))
    .some((artifact) => {
      if (readString(artifact.kind) !== "live_environment_tool_observation") return false;
      const artifactPayload = readRecord(artifact.payload);
      if (readString(artifactPayload?.tool_name) !== "live_env.request_interim_voice_callout") return false;
      const observation = readRecord(artifactPayload?.observation);
      if (readString(observation?.schema) !== "helix.interim_voice_callout_tool_result.v1") return false;
      const receipt = readRecord(observation?.receipt);
      return [
        "awaiting_client_playback",
        "queued",
        "queued_for_retry",
        "delivered",
        "expired",
        "blocked_capacity",
        "blocked_policy",
        "blocked_missing_text",
      ].includes(readString(receipt?.status));
    });

const selectedCapability = (payload: RecordLike): string =>
  readString(readRecord(payload.agent_step_decision)?.chosen_capability) ||
  readString(readRecord(readRecord(payload.agent_step_decision)?.model_decision)?.chosen_capability) ||
  readString(readRecord(payload.runtime_tool_call)?.capability_key);

const inferRouteFamily = (payload: RecordLike, capability: string): HelixPostToolAuthorityBridge["route_family"] => {
  const sourceTarget = readString(readRecord(payload.route_product_contract)?.source_target);
  const goalKind = readString(readRecord(payload.canonical_goal_frame)?.goal_kind);
  const targetSource = readString(readRecord(payload.source_target_intent)?.target_source) ||
    readString(readRecord(payload.evidence_target_arbitration)?.selected_target_source);
  const phase = readRecord(payload.phase_controller_trajectory);
  const phaseResolution = readRecord(payload.live_source_turn_phase_resolution);
  const phaseGoal = readString(phase?.canonical_goal) || readString(phaseResolution?.canonicalGoal);
  const prompt = readString(payload.active_prompt) || readString(payload.prompt) || readString(payload.question);
  const toolChain = artifactLedger(payload).map((artifact) => artifactToolName(artifact)).filter(Boolean).join(" ");
  const haystack = `${sourceTarget} ${targetSource} ${goalKind} ${phaseGoal} ${capability} ${toolChain} ${readString(payload.route_reason_code)} ${readString(payload.route)} ${prompt}`;
  if (/live_source_mailbox|live_source_processed_mail_interpretation|processed_mail_voice_decision|stage_play_processed_mail_packet|stage_play_live_source_mail_loop_reflection|record_live_source_mail_decision|read_processed_live_source_mail|reflect_live_source_mail_loop/i.test(haystack)) return "live_source_mailbox";
  if (/scholarly_research|scholarly-research|doi|arxiv|citation|journal/i.test(haystack)) return "scholarly_research";
  if (/internet_search|internet-search|search_web|google_custom_search|web_search/i.test(haystack)) return "internet_search";
  if (/calculator|scientific-calculator/i.test(haystack)) return "calculator";
  if (/voice_delivery|confirm_speak|read.+out loud|voice/i.test(haystack)) return "voice_delivery";
  if (/dottie|situation-room|minecraft|live_pipeline|stage_play_badge_graph|stage_play_job_plan|stage_play_checkpoint_request_result|stage_play_checkpoint_request|stage_play_checkpoint_queue|stage_play_builder_catalog|stage_play_source_query|stage_play_graph_draft_validation|reflect_stage_play_context|plan_stage_play_job|request_stage_play_checkpoint/i.test(haystack)) return "situation_room_setup";
  if (
    sourceTarget === "docs_viewer" ||
    targetSource === "docs_viewer" ||
    goalKind === "doc_evidence_synthesis" ||
    /doc_evidence_synthesis_answer|docs-viewer|doc_open|docs_panel/i.test(haystack)
  ) return "docs_panel";
  if (/repo|doc_summary|doc_evidence|search_docs/i.test(haystack)) return "repo_docs";
  if (capability.includes(".")) return "workstation_panel";
  return "unknown";
};

export function buildPostToolAuthorityBridge(input: {
  turnId: string;
  payload: RecordLike;
}): HelixPostToolAuthorityBridge {
  const capability = selectedCapability(input.payload);
  const routeFamily = inferRouteFamily(input.payload, capability);
  const toolObservationRefs = artifactRefs(input.payload, /agent_step_observation_packet|runtime_tool_observation|live_environment_tool_observation|workspace_action_receipt|calculator_receipt|doc_summary|doc_location_result|doc_evidence_location|doc_location_matches|doc_equation_context|doc_equation_location|doc_calculator_evidence|scholarly_research_observation|scholarly_full_text_observation|internet_search_observation|dottie_|voice_delivery|workstation_tool_evaluation|stage_play_badge_graph|stage_play_live_source_mail_loop_reflection|stage_play_job_plan|stage_play_checkpoint_request_result|stage_play_checkpoint_request|stage_play_checkpoint_queue|stage_play_builder_catalog|stage_play_source_query|stage_play_graph_draft_validation/);
  const answerDraftRefs = artifactRefs(input.payload, /final_answer_draft|direct_answer_text|doc_evidence_synthesis_answer|repo_code_evidence_answer|scholarly_research_answer|internet_search_answer/);
  const liveSourceReflectionSynthesis = liveSourceMailLoopReflectionSynthesisText(input.payload);
  const liveSourceSynthesis = liveSourceReflectionSynthesis || liveSourceMailboxSynthesisText(input.payload);
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
  if (routeFamily === "live_source_mailbox" && liveSourceSynthesis) {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability || undefined,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: "supports_answer",
      route_family: "live_source_mailbox",
      required_terminal_kind: "model_synthesized_answer",
      terminal_repair_action: "materialize_model_synthesized_answer",
      pending_requirements: [],
      reason: liveSourceReflectionSynthesis
        ? "live_source_mail_loop_reflection_supports_synthesized_answer"
        : "live_source_mailbox_receipts_support_synthesized_answer",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (
    capability === "live_env.request_interim_voice_callout" &&
    hasFinalInterimVoiceCalloutReceipt(input.payload) &&
    !isCompoundInterimVoiceCalloutPrompt(input.payload)
  ) {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: "supports_answer",
      route_family: "voice_delivery",
      required_terminal_kind: "model_synthesized_answer",
      terminal_repair_action: "materialize_model_synthesized_answer",
      pending_requirements: [],
      reason: "interim_voice_callout_receipt_supports_status_answer",
      assistant_answer: false,
      raw_content_included: false,
    };
  }
  if (capability === "live_env.request_interim_voice_callout" && hasFinalInterimVoiceCalloutReceipt(input.payload)) {
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: true,
      selected_capability: capability,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: answerDraftRefs.length > 0 ? "supports_answer" : "not_enough_information",
      route_family: "voice_delivery",
      required_terminal_kind: "model_synthesized_answer",
      terminal_repair_action: answerDraftRefs.length > 0 ? "materialize_model_synthesized_answer" : "none",
      pending_requirements: answerDraftRefs.length > 0 ? [] : [{
        code: "missing_post_tool_answer_draft",
        message: "The interim voice callout receipt satisfies only the callout subgoal; a post-tool answer draft is still required for the explanatory prompt.",
      }],
      reason: answerDraftRefs.length > 0
        ? "interim_voice_callout_receipt_plus_answer_draft_supports_compound_goal"
        : "interim_voice_callout_receipt_only_covers_callout_subgoal",
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
  if (routeFamily === "docs_panel") {
    const goalKind = readString(readRecord(input.payload.canonical_goal_frame)?.goal_kind);
    const requiresDocsSynthesis = goalKind === "doc_evidence_synthesis";
    const draftText = finalDraftText(input.payload);
    const docSynthesisAnswer = readRecord(input.payload.doc_evidence_synthesis_answer);
    const supportsAnswer = requiresDocsSynthesis
      ? Boolean(toolObservationRefs.length > 0 && (draftText || docSynthesisAnswer))
      : Boolean(toolObservationRefs.length > 0 && draftText);
    return {
      schema: HELIX_POST_TOOL_AUTHORITY_BRIDGE_SCHEMA,
      turn_id: input.turnId,
      applies: toolObservationRefs.length > 0 || answerDraftRefs.length > 0 || Boolean(docSynthesisAnswer),
      selected_capability: capability || undefined,
      tool_observation_refs: toolObservationRefs,
      answer_draft_refs: answerDraftRefs,
      observation_support_status: supportsAnswer ? "supports_answer" : toolObservationRefs.length > 0 ? "not_enough_information" : "not_applicable",
      route_family: "docs_panel",
      required_terminal_kind: requiresDocsSynthesis ? "doc_evidence_synthesis_answer" : "model_synthesized_answer",
      terminal_repair_action: "none",
      pending_requirements: supportsAnswer ? [] : [{
        code: toolObservationRefs.length > 0 ? "missing_post_tool_answer_draft" : "missing_active_doc",
        message: requiresDocsSynthesis
          ? "Docs evidence is present, but no model-authored docs synthesis answer draft has been materialized."
          : "No usable Docs Viewer observation was found for the current document goal.",
      }],
      reason: supportsAnswer
        ? "docs_observation_and_answer_draft_support_goal"
        : "docs_post_tool_support_incomplete",
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
  if (routeFamily === "internet_search") {
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
      route_family: "internet_search",
      required_terminal_kind: "internet_search_answer",
      terminal_repair_action: "none",
      pending_requirements: supportsAnswer ? [] : [{
        code: toolObservationRefs.length > 0 ? "missing_post_tool_answer_draft" : "missing_live_source",
        message: toolObservationRefs.length > 0 ? "A model-authored internet search answer draft is missing." : "No usable internet search observation was found.",
      }],
      reason: supportsAnswer
        ? "internet_search_route_requires_internet_search_answer_materialization"
        : "internet_search_post_tool_support_incomplete",
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
  const itinerary = readRecord(input.payload.capability_itinerary);
  const executionState =
    readRecord(input.payload.capability_itinerary_execution_state) ??
    readRecord(itinerary?.execution_state);
  if (executionState?.applies === true && executionState?.complete === false) {
    return {
      ...bridge,
      observation_support_status: "not_enough_information",
      terminal_repair_action: "none",
      reason: "compound_itinerary_incomplete",
    };
  }

  if (bridge.observation_support_status === "supports_answer" && bridge.required_terminal_kind === "model_synthesized_answer") {
    const text =
      (bridge.route_family === "live_source_mailbox" ? liveSourceMailLoopReflectionSynthesisText(input.payload) || liveSourceMailboxSynthesisText(input.payload) : "") ||
      finalDraftText(input.payload) ||
      (bridge.selected_capability === "live_env.request_interim_voice_callout" ? selectedVisibleAnswerText(input.payload) : "");
    if (text) {
      if (bridge.route_family === "live_source_mailbox") {
        writeLiveSourceMailboxTerminalArtifacts({ turnId: input.turnId, payload: input.payload, bridge, text });
      }
      input.payload.ok = true;
      input.payload.response_type = "final_answer";
      input.payload.final_status = "final_answer";
      input.payload.terminal_artifact_kind = "model_synthesized_answer";
      input.payload.terminal_artifact_id = readString(input.payload.terminal_artifact_id) || `${input.turnId}:final_answer_draft`;
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
    input.payload.request_user_input_preview = {
      schema: "helix.request_user_input_preview.v1",
      prompt,
      assistant_answer: false,
      raw_content_included: false,
    };
    delete input.payload.selected_final_answer;
    delete input.payload.answer;
    delete input.payload.text;
    delete input.payload.finalAnswer;
    input.payload.assistant_answer = false;
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
