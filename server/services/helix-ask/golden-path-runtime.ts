import { buildHelixGoalSatisfactionEvaluationArtifact } from "./goal-satisfaction-artifact";
import {
  buildHelixAskGoldenPathCalculatorSolvePayload,
  evaluateGoldenPathCalculatorExpression,
  formatGoldenPathNumber,
  isHelixAskGoldenPathCalculatorSolveRequested,
  readCalculatorExpression,
} from "./golden-path/capabilities/calculator";
import {
  buildHelixAskGoldenPathDocsLocatePayload,
  findGoldenPathDocLocationMatches,
  isHelixAskGoldenPathDocsLocateRequested,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "./golden-path/capabilities/docs-locate";
import {
  buildHelixAskGoldenPathRepoSearchConceptPayload,
  findGoldenPathRepoEvidence,
  isHelixAskGoldenPathRepoSearchConceptRequested,
  readGoldenPathRepoSearchFiles,
  readRepoSearchConcept,
} from "./golden-path/capabilities/repo-search-concept";
import {
  buildAskTurnCompositeFollowupAudit,
  buildAskTurnCompositeHandoffDecision,
  type HelixAskCompositeSubgoalReferenceIntent,
} from "./composite-followup-helpers";
import {
  buildStagePlayAskCheckpointReceiptPayload,
  type StagePlayCheckpointReceiptArtifactLike,
} from "./live-source/stage-play-checkpoint-receipt";
import { STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA } from "../../../shared/contracts/stage-play-live-source-mail.v1";
import { HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA } from "../../../shared/helix-visual-frame-evidence";
import {
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
} from "../../../shared/helix-internet-search-observation";
import { HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA } from "../../../shared/helix-scholarly-research-observation";
import {
  defaultHashGoalFrame,
  flagEnabled,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  readArray,
  readBoolean,
  readHelixAskGoldenPathPrompt,
  readNumber,
  readRecord,
  readString,
  readStringArray,
  isHelixAskGoldenPathRequested,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
  type RecordLike,
} from "./golden-path/core";
import {
  buildGoldenPathCapabilityCatalogObservation,
  buildHelixAskGoldenPathCapabilityCatalogPayload,
  isHelixAskGoldenPathCapabilityCatalogRequested,
} from "./golden-path/capabilities/capability-catalog";
import {
  buildHelixAskGoldenPathStagePlayReflectionPayload,
  isHelixAskGoldenPathStagePlayReflectionRequested,
} from "./golden-path/capabilities/stage-play-reflection";
import {
  buildGoldenPathWorkspaceStatusObservation,
  buildHelixAskGoldenPathWorkspaceStatusPayload,
  isHelixAskGoldenPathWorkspaceStatusRequested,
} from "./golden-path/capabilities/workspace-status";
import {
  buildHelixAskGoldenPathWorkspaceDirectoryPayload,
  isHelixAskGoldenPathWorkspaceDirectoryRequested,
} from "./golden-path/capabilities/workspace-directory";
export {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
  isHelixAskGoldenPathRequested,
  readHelixAskGoldenPathPrompt,
  type HelixAskGoldenPathRuntimeDecision,
  type HelixAskGoldenPathRuntimeTerminalResult,
} from "./golden-path/core";

export type HelixAskGoldenPathRuntimeDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
  buildCompositeHandoffDecision: typeof buildAskTurnCompositeHandoffDecision;
  buildCompositeFollowupAudit: typeof buildAskTurnCompositeFollowupAudit;
  buildStagePlayCheckpointReceiptPayload: typeof buildStagePlayAskCheckpointReceiptPayload;
};

export const createHelixAskGoldenPathRuntimeDependencies = (
  overrides: Partial<HelixAskGoldenPathRuntimeDependencies> = {},
): HelixAskGoldenPathRuntimeDependencies => ({
  now: () => new Date(),
  hashGoalFrame: defaultHashGoalFrame,
  buildGoalSatisfactionEvaluationArtifact: buildHelixGoalSatisfactionEvaluationArtifact,
  buildCompositeHandoffDecision: buildAskTurnCompositeHandoffDecision,
  buildCompositeFollowupAudit: buildAskTurnCompositeFollowupAudit,
  buildStagePlayCheckpointReceiptPayload: buildStagePlayAskCheckpointReceiptPayload,
  ...overrides,
});

export const isHelixAskGoldenPathRuntimeEnabled = (
  env: Record<string, string | undefined> = process.env,
): boolean => flagEnabled(env[HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG]);

const isHelixAskGoldenPathCatalogWorkspaceCompoundRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  const hasCatalog = requestedCapabilities.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY);
  const hasWorkspace = requestedCapabilities.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY);
  if (hasCatalog && hasWorkspace) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY) &&
    prompt.includes(HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY)
  );
};

const isHelixAskGoldenPathVisualCalculatorCompoundRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathVisualCaptureRequested(body) && isHelixAskGoldenPathCalculatorSolveRequested(body);
};

const isHelixAskGoldenPathDocsCalculatorCompoundRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathDocsLocateRequested(body) && isHelixAskGoldenPathCalculatorSolveRequested(body);
};

const isHelixAskGoldenPathRepoDocsCompoundRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathRepoSearchConceptRequested(body) && isHelixAskGoldenPathDocsLocateRequested(body);
};

const isHelixAskGoldenPathInternetResearchReflectionCompoundRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathInternetSearchRequested(body) && isHelixAskGoldenPathTheoryReflectionRequested(body);
};

const isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathCivilizationBoundsReflectionRequested(body) && isHelixAskGoldenPathZenGraphReflectionRequested(body);
};

const isHelixAskGoldenPathProcessedLiveSourceMailRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY) ||
    /\bread[_\s-]?processed[_\s-]?live[_\s-]?source[_\s-]?mail\b/.test(prompt) ||
    /\bprocessed\s+live[-\s]?source\s+mail\b/.test(prompt)
  );
};

const readProcessedMailPacketInput = (body: RecordLike): RecordLike | null =>
  readRecord(body.processed_mail_packet) ??
  readRecord(body.processedMailPacket) ??
  readRecord(body.stage_play_processed_mail_packet) ??
  readRecord(body.stagePlayProcessedMailPacket) ??
  null;

const readProcessedMailPacketStringArray = (packet: RecordLike, camelKey: string, snakeKey: string): string[] =>
  readStringArray(packet[camelKey] ?? packet[snakeKey]);

const buildProcessedMailPacketPayload = (args: {
  body: RecordLike;
  turnId: string;
  createdAtMs: number;
}): RecordLike | null => {
  const input = readProcessedMailPacketInput(args.body);
  if (!input) return null;
  const packetId =
    readString(input.packetId) ??
    readString(input.packet_id) ??
    readString(input.artifactId) ??
    readString(input.artifact_id) ??
    `${args.turnId}:stage_play_processed_mail_packet`;
  const evidenceRefs = readProcessedMailPacketStringArray(input, "evidenceRefs", "evidence_refs");
  return {
    artifactId: "stage_play_processed_mail_packet",
    schemaVersion: STAGE_PLAY_PROCESSED_MAIL_PACKET_SCHEMA,
    packetId,
    jobId: readString(input.jobId) ?? readString(input.job_id) ?? `${args.turnId}:live_source_job`,
    sourceId: readString(input.sourceId) ?? readString(input.source_id) ?? "golden_path_compact_mail_source",
    mailIds: readProcessedMailPacketStringArray(input, "mailIds", "mail_ids"),
    observedFacts: readProcessedMailPacketStringArray(input, "observedFacts", "observed_facts"),
    inferredFacts: readProcessedMailPacketStringArray(input, "inferredFacts", "inferred_facts"),
    uncertainties: readProcessedMailPacketStringArray(input, "uncertainties", "uncertainties"),
    sceneTags: readProcessedMailPacketStringArray(input, "sceneTags", "scene_tags"),
    visualEvidenceRefs: readProcessedMailPacketStringArray(input, "visualEvidenceRefs", "visual_evidence_refs"),
    recommendedNext: readString(input.recommendedNext) ?? readString(input.recommended_next) ?? "inspect_if_needed",
    watchNext: readProcessedMailPacketStringArray(input, "watchNext", "watch_next"),
    resolutionState: readString(input.resolutionState) ?? readString(input.resolution_state) ?? "processed",
    microReasonerRunRefs: readProcessedMailPacketStringArray(input, "microReasonerRunRefs", "micro_reasoner_run_refs"),
    evidenceRefs: evidenceRefs.length ? evidenceRefs : [packetId],
    createdAt: readString(input.createdAt) ?? new Date(args.createdAtMs).toISOString(),
    assistant_answer: false,
    terminal_eligible: false,
  };
};

const isHelixAskGoldenPathTheoryReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY) ||
    /\b(?:reflect|reflection|theory\s+context|concept\s+route|theory\s+badge\s+graph)\b/.test(prompt)
  );
};

const isHelixAskGoldenPathCivilizationBoundsReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) ||
    /\b(?:civilization\s+bounds|civilization\s+roadmap|bounded\s+civilization|collaboration\s+constraints|capacity\s+bounds|system\s+limits)\b/.test(prompt)
  );
};

const isHelixAskGoldenPathZenGraphReflectionRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY) ||
    /\b(?:zen\s+graph|ideology\s+context|ideology\s+lens|right\s+speech|two-key|two\s+key|fruition|moral\s+guilt|missing\s+considerations?)\b/.test(prompt)
  );
};

const readTheoryReflectionTopic = (body: RecordLike): string | null => {
  const direct =
    readString(body.topic) ??
    readString(body.concept) ??
    readString(body.theory_topic) ??
    readString(body.theoryTopic) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/helix_ask\.reflect_theory_context/gi, "")
    .replace(/\b(?:reflect|reflection|theory\s+context|concept\s+route|theory\s+badge\s+graph|on|about|for|use)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const readTheoryReflectionAnchors = (body: RecordLike): string[] => {
  const direct =
    readStringArray(body.anchors).length > 0
      ? readStringArray(body.anchors)
      : readStringArray(body.theory_anchors).length > 0
        ? readStringArray(body.theory_anchors)
        : readStringArray(body.theoryAnchors);
  if (direct.length > 0) return direct.slice(0, 6);
  const context = readString(body.context) ?? readString(body.theory_context) ?? readString(body.theoryContext);
  if (!context) return [];
  return context
    .split(/\r?\n|[.;]/g)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);
};

const readCompactCivilizationBoundsToolResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.civilization_bounds_tool_result) ??
    readRecord(body.civilizationBoundsToolResult) ??
    readRecord(body.helix_civilization_bounds_tool_result) ??
    readRecord(body.helixCivilizationBoundsToolResult);
  if (direct) return direct;
  const roadmap = readRecord(body.civilization_bounds_roadmap) ?? readRecord(body.civilizationBoundsRoadmap);
  return roadmap ? { roadmap } : null;
};

const readCompactZenGraphReflectionToolResult = (body: RecordLike): RecordLike | null => {
  const direct =
    readRecord(body.zen_graph_reflection_tool_result) ??
    readRecord(body.zenGraphReflectionToolResult) ??
    readRecord(body.helix_zen_graph_reflection_tool_result) ??
    readRecord(body.helixZenGraphReflectionToolResult) ??
    readRecord(body.ideology_context_reflection_tool_result) ??
    readRecord(body.ideologyContextReflectionToolResult);
  if (direct) return direct;
  const reflection = readRecord(body.ideology_context_reflection) ?? readRecord(body.ideologyContextReflection);
  return reflection ? { reflection } : null;
};

const isHelixAskGoldenPathScholarlyResearchRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY) ||
    /\b(?:scholarly\s+research|research\s+papers?|paper\s+metadata|peer[-\s]?reviewed|literature|preprints?|arxiv|crossref|openalex|semantic\s+scholar)\b/.test(prompt)
  );
};

const readScholarlyResearchQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.scholarly_query) ??
    readString(body.scholarlyQuery) ??
    readString(body.research_query) ??
    readString(body.researchQuery) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/scholarly-research\.lookup_papers/gi, "")
    .replace(/\b(?:use|run|call|lookup|look\s+up|search|find|research|papers?|scholarly|literature|metadata|for|about)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const readCompactScholarlyPapers = (body: RecordLike): RecordLike[] => {
  const observation =
    readRecord(body.scholarly_research_observation) ??
    readRecord(body.scholarlyResearchObservation) ??
    readRecord(body.compact_scholarly_research_observation) ??
    readRecord(body.compactScholarlyResearchObservation);
  const observedPapers = observation
    ? readArray(observation.papers).map(readRecord).filter((paper): paper is RecordLike => Boolean(paper))
    : [];
  if (observedPapers.length > 0) return observedPapers;
  return readArray(body.scholarly_papers ?? body.scholarlyPapers ?? body.papers)
    .map(readRecord)
    .filter((paper): paper is RecordLike => Boolean(paper));
};

const isHelixAskGoldenPathInternetSearchRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY)) return true;
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY) return true;
  if (requestedCapability === HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY) ||
    prompt.includes(HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY) ||
    /\b(?:internet\s+search|web\s+research|web\s+search|search\s+web|look\s+up\s+online|check\s+online|current\s+web|public\s+web)\b/.test(prompt)
  );
};

const readInternetSearchQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.internet_search_query) ??
    readString(body.internetSearchQuery) ??
    readString(body.web_research_query) ??
    readString(body.webResearchQuery) ??
    readString(body.query);
  if (direct) return direct;
  const cleaned = readHelixAskGoldenPathPrompt(body)
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/internet_search\.web_research/gi, "")
    .replace(/internet-search\.search_web/gi, "")
    .replace(/\b(?:use|run|call|lookup|look\s+up|search|find|research|web|internet|online|for|about)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const readCompactInternetSearchResults = (body: RecordLike): RecordLike[] => {
  const observation =
    readRecord(body.internet_search_observation) ??
    readRecord(body.internetSearchObservation) ??
    readRecord(body.compact_internet_search_observation) ??
    readRecord(body.compactInternetSearchObservation);
  const observedResults = observation
    ? readArray(observation.results).map(readRecord).filter((result): result is RecordLike => Boolean(result))
    : [];
  if (observedResults.length > 0) return observedResults;
  return readArray(body.internet_search_results ?? body.internetSearchResults ?? body.web_results ?? body.webResults)
    .map(readRecord)
    .filter((result): result is RecordLike => Boolean(result));
};

const isHelixAskGoldenPathVisualCaptureRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY)) return true;
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY) return true;
  if (requestedCapability === HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY) return true;
  const prompt = readHelixAskGoldenPathPrompt(body);
  return (
    /\bimage_lens\.inspect\b/i.test(prompt) ||
    /\bsituation-room\.describe_visual_capture\b/i.test(prompt) ||
    (/\b(?:visual capture|visual frame|image lens|screen capture|current screen|visible right now)\b/i.test(prompt) &&
      /\b(?:inspect|describe|review|summarize|what|seeing|visible)\b/i.test(prompt))
  );
};

const readVisualCaptureSummary = (body: RecordLike): string | null =>
  readString(body.visual_summary) ??
  readString(body.visualSummary) ??
  readString(body.scene_text) ??
  readString(body.sceneText) ??
  readString(readRecord(body.visual_frame_evidence)?.summary) ??
  readString(readRecord(body.visualFrameEvidence)?.summary);

const buildGoldenPathCompositeDebug = (args: {
  deps: HelixAskGoldenPathRuntimeDependencies;
  turnId: string;
}): { decision: RecordLike; audit: RecordLike } => {
  const intent: HelixAskCompositeSubgoalReferenceIntent = {
    required: false,
    reference_kind: "that_result",
    requested_action: "inspect_debug",
    matched_phrases: [],
    confidence: "low",
  };
  const binding = {
    current_turn_id: args.turnId,
    prior_composite_turn_id: null,
    prior_composite_receipt_id: null,
    selected_subgoal_ids: [],
    candidate_subgoals: [],
    rejected_subgoals: [],
    binding_status: "no_usable_subgoal",
    non_authoritative_debug_probe: true,
  };
  const decision = args.deps.buildCompositeHandoffDecision({ turnId: args.turnId, binding, intent });
  const audit = args.deps.buildCompositeFollowupAudit({ priorEnvelope: null, binding, handoffDecision: decision });
  return { decision, audit };
};

export const buildHelixAskGoldenPathRuntimePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-path:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const modelPacketRef = `${turnId}:golden_path_model_turn_packet`;
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const artifactId = `${turnId}:golden_path_contract_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const answerText =
    "Helix Ask golden path runtime returned a contract-only final answer. This scaffold verifies routing, ledger, and terminal-source invariants without entering a private runtime loop.";

  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "golden_path_runtime_contract",
    answer_scope: "current_turn",
    required_terminal_kind: "golden_path_contract_answer",
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_golden_path_runtime_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "golden_path_runtime_contract",
    required_terminal_kind: "golden_path_contract_answer",
    selected_terminal_artifact_kind: "golden_path_contract_answer",
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const compositeDebug = buildGoldenPathCompositeDebug({ deps, turnId });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: artifactId,
    artifact_kind: "golden_path_contract_answer",
    final_answer_source: "helix_ask_golden_path_runtime",
    text: answerText,
    support_refs: [routeGateArtifactId, modelPacketRef, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const stagePlayCheckpointReceiptPayload = deps.buildStagePlayCheckpointReceiptPayload({
    payload: {
      ask_turn_solver_trace: { schema: "helix.ask_turn_solver_trace.v1" },
      final_answer_source: terminalResult.final_answer_source,
      terminal_artifact_kind: terminalResult.artifact_kind,
      thread_id: threadId,
      session_id: sessionId,
    },
    turnId,
    artifacts: [] as StagePlayCheckpointReceiptArtifactLike[],
    finalAnswerDraft: { text: answerText, authority: "golden_path_contract" },
    finalAnswerDraftRef: artifactId,
    createdAt: now.toISOString(),
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "contract_only",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      model_turn_packet_ref: modelPacketRef,
      route_gate_artifact_ref: routeGateArtifactId,
      terminal_artifact_ref: artifactId,
      terminal_result_id: terminalResultId,
      terminal_result_count: 1,
      reused_extracted_helpers: ["S275", "S276", "S277"],
      assistant_answer: false,
      raw_content_included: false,
    },
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    canonical_goal_frame: canonicalGoalFrame,
    route_reason_code: "golden_path_runtime / contract_only",
    route: "golden_path_runtime / contract_only",
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    model_turn_packet: {
      schema: "helix.model_turn_packet.v1",
      packet_ref: modelPacketRef,
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [],
      model_visible_artifacts: [goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        allow_tools: false,
        require_model_authored_terminal: false,
        deterministic_fallback_terminal_allowed: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / contract_only",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          model_turn_packet_ref: modelPacketRef,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          reused_extracted_helpers: ["S275", "S276", "S277"],
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: artifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_contract_answer",
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_contract_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
    composite_handoff_decision: { ...compositeDebug.decision, non_authoritative_debug_probe: true },
    composite_followup_anti_determinism_audit: { ...compositeDebug.audit, non_authoritative_debug_probe: true },
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "contract_only",
      private_runtime_loop_entered: false,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      composite_handoff_decision: compositeDebug.decision,
      composite_followup_anti_determinism_audit: compositeDebug.audit,
      stage_play_checkpoint_receipt_payload: stagePlayCheckpointReceiptPayload,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathInternetSearchPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-internet:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:internet_search_observation`;
  const terminalArtifactId = `${turnId}:internet_search_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "internet_search_answer";
  const goalKind = "internet_search_lookup";
  const query = readInternetSearchQuery(args.body);
  const results = readCompactInternetSearchResults(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_internet_search_query" | "missing_compact_internet_search_evidence";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "external_internet_search",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_internet_search_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "internet_search_lookup_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        source_target: "internet_search",
        family: "internet_search",
        required_observation_kinds: ["internet_search_observation"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / internet_search_lookup",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "internet_search_lookup_failed",
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_internet_search_query",
      brokenRail: "argument_extraction",
      missingRequirement: "internet_search_query",
      text: "I could not complete this golden-path internet search turn because no web search query was provided.",
    });
  }
  if (results.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_internet_search_evidence",
      brokenRail: "observation",
      missingRequirement: "internet_search_observation",
      text: "I could not complete this golden-path internet search turn because no compact web result evidence was provided.",
    });
  }

  const normalizedResults = results.slice(0, 5).map((result, index) => {
    const url = readString(result.url) ?? `https://example.invalid/result-${index + 1}`;
    const evidenceRefs = readStringArray(result.evidence_refs ?? result.evidenceRefs);
    return {
      result_id: readString(result.result_id) ?? readString(result.resultId) ?? `${turnId}:web_result:${index + 1}`,
      title: readString(result.title) ?? url,
      url,
      snippet: readString(result.snippet) ?? undefined,
      content_excerpt: readString(result.content_excerpt) ?? readString(result.contentExcerpt) ?? undefined,
      published_at: readString(result.published_at) ?? readString(result.publishedAt) ?? undefined,
      source_provider: readString(result.source_provider) ?? readString(result.sourceProvider) ?? "tavily",
      rank: readNumber(result.rank) ?? index + 1,
      evidence_refs: evidenceRefs.length ? evidenceRefs : [`internet_search:${index + 1}`],
      confidence: readString(result.confidence) ?? "medium",
    };
  });
  const evidenceRefs = normalizedResults.flatMap((result) =>
    result.evidence_refs.map((ref) => ({
      ref,
      provider: result.source_provider,
      url: result.url,
      retrieved_at_ms: createdAtMs,
    })),
  );
  const domains = readStringArray(args.body.domains);
  const recencyDays = readNumber(args.body.recency_days) ?? readNumber(args.body.recencyDays);
  const observation = {
    schema: HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
    artifact_id: observationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    query,
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: evidenceRefs,
    results: normalizedResults,
    ...(domains.length ? { domains } : {}),
    ...(typeof recencyDays === "number" ? { recency_days: recencyDays } : {}),
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerLines = [
    `Internet search completed for: ${query}`,
    ...normalizedResults.slice(0, 3).map((result, index) => `${index + 1}. ${result.title} - ${result.url}`),
    "This answer is grounded in compact web metadata supplied to the current turn; provider lookup is not run inside the golden path.",
  ];
  const answerText = answerLines.join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "external_internet_search",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_internet_search_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    internet_search_observation: observation,
    internet_search_answer: {
      schema: "helix.internet_search_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      result_count: normalizedResults.length,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "internet_search_lookup",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      source_target: "internet_search",
      family: "internet_search",
      args: { query },
      required_observation_kinds: ["internet_search_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / internet_search_lookup",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        kind: "internet_search_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: observation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_internet_search_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.internet_search_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          result_count: normalizedResults.length,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "internet_search_lookup",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
      observed_artifact_kind: "internet_search_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathScholarlyResearchPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-scholarly:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:scholarly_research_observation`;
  const terminalArtifactId = `${turnId}:scholarly_research_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "scholarly_research_answer";
  const goalKind = "scholarly_research_lookup";
  const query = readScholarlyResearchQuery(args.body);
  const papers = readCompactScholarlyPapers(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_scholarly_query" | "missing_compact_scholarly_evidence";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "external_scholarly_research",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_scholarly_research_lookup_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "scholarly_research_lookup_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executed_capability: null,
        source_target: "scholarly_research",
        family: "scholarly_research",
        required_observation_kinds: ["scholarly_research_observation"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / scholarly_research_lookup",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "scholarly_research_lookup_failed",
        requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_scholarly_query",
      brokenRail: "argument_extraction",
      missingRequirement: "scholarly_query",
      text: "I could not complete this golden-path scholarly research turn because no research query was provided.",
    });
  }
  if (papers.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_scholarly_evidence",
      brokenRail: "observation",
      missingRequirement: "scholarly_research_observation",
      text: "I could not complete this golden-path scholarly research turn because no compact scholarly paper evidence was provided.",
    });
  }

  const normalizedPapers = papers.slice(0, 5).map((paper, index) => {
    const title = readString(paper.title) ?? `Untitled paper ${index + 1}`;
    const evidenceRefs = readStringArray(paper.evidence_refs ?? paper.evidenceRefs);
    return {
      result_id: readString(paper.result_id) ?? readString(paper.resultId) ?? `${turnId}:paper:${index + 1}`,
      title,
      authors: readArray(paper.authors).map(readRecord).filter((author): author is RecordLike => Boolean(author)),
      year: readNumber(paper.year) ?? undefined,
      venue: readString(paper.venue) ?? undefined,
      abstract: readString(paper.abstract) ?? undefined,
      identifiers: readRecord(paper.identifiers) ?? {},
      evidence_refs: evidenceRefs.length ? evidenceRefs : [`scholarly:${index + 1}`],
      source_providers: readStringArray(paper.source_providers ?? paper.sourceProviders),
      confidence: readString(paper.confidence) ?? "medium",
    };
  });
  const evidenceRefs = normalizedPapers.flatMap((paper) => paper.evidence_refs).map((ref, index) => ({
    ref,
    provider: (readString(normalizedPapers[index]?.source_providers?.[0]) ?? "openalex") as string,
    retrieved_at_ms: createdAtMs,
  }));
  const observation = {
    schema: HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
    artifact_id: observationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    query,
    intent: readString(args.body.scholarly_intent) ?? readString(args.body.scholarlyIntent) ?? "paper_search",
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: evidenceRefs,
    papers: normalizedPapers,
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerLines = [
    `Scholarly research lookup completed for: ${query}`,
    ...normalizedPapers.slice(0, 3).map((paper, index) => {
      const year = typeof paper.year === "number" ? ` (${paper.year})` : "";
      const venue = paper.venue ? `, ${paper.venue}` : "";
      return `${index + 1}. ${paper.title}${year}${venue}.`;
    }),
    "This answer is grounded in compact scholarly metadata supplied to the current turn; provider lookup is not run inside the golden path.",
  ];
  const answerText = answerLines.join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "external_scholarly_research",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_scholarly_research_lookup_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    scholarly_research_observation: observation,
    scholarly_research_answer: {
      schema: "helix.scholarly_research_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      paper_count: normalizedPapers.length,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "scholarly_research_lookup",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observed_artifact_kind: "scholarly_research_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      source_target: "scholarly_research",
      family: "scholarly_research",
      args: { query },
      required_observation_kinds: ["scholarly_research_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / scholarly_research_lookup",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observed_artifact_kind: "scholarly_research_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
        kind: "scholarly_research_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: observation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_scholarly_research_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.scholarly_research_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          paper_count: normalizedPapers.length,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "scholarly_research_lookup",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
      observed_artifact_kind: "scholarly_research_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathTheoryReflectionPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-theory:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:helix_theory_context_reflection_tool_receipt`;
  const terminalArtifactId = `${turnId}:theory_context_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "theory_context_reflection_answer";
  const goalKind = "theory_context_reflection";
  const topic = readTheoryReflectionTopic(args.body);
  const anchors = readTheoryReflectionAnchors(args.body);

  if (!topic) {
    const failureText =
      "I could not complete this golden-path theory reflection turn because no reflection topic was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      allows_workspace_context: true,
      allows_prior_artifacts: false,
      classifier_reasons: ["explicit_theory_reflection_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["theory_reflection_topic"],
      first_broken_rail: "argument_extraction",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_theory_reflection_topic",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "theory_context_reflection_missing_topic",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executed_capability: null,
        source_target: "theory_context",
        family: "theory_context_reflection",
        required_observation_kinds: ["helix_theory_context_reflection_tool_receipt"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "argument_extraction",
        terminal_authority_ok: true,
        route: "golden_path_runtime / theory_context_reflection",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "argument_extraction",
        terminal_error_code: "missing_theory_reflection_topic",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_theory_reflection_topic",
            first_broken_rail: "argument_extraction",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "theory_context_reflection_missing_topic",
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "argument_extraction",
        terminal_error_code: "missing_theory_reflection_topic",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const answerText = [
    `Theory context reflection for: ${topic}`,
    anchors.length > 0
      ? `Relevant anchors: ${anchors.join("; ")}.`
      : "No explicit theory anchors were supplied, so this answer stays at a concept-routing level.",
    "Use this as reflection context, not as numerical proof or terminal scientific authority.",
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_theory_reflection_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    reflection_mode: "golden_path_deterministic_context",
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "theory_context_reflection",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_theory_context_reflection_tool_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    helix_theory_context_reflection_tool_receipt: reflectionReceipt,
    theory_context_reflection_answer: {
      schema: "helix.theory_context_reflection_answer.v1",
      topic,
      anchors,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    model_turn_input: {
      schema: "helix.ask_model_turn_input.v1",
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY],
      function_call_outputs: [
        {
          call_id: `${turnId}:call:theory_reflection`,
          name: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
          output_ref: observationArtifactId,
          output_kind: "helix_theory_context_reflection_tool_receipt",
        },
      ],
      model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        private_runtime_loop_entered: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      source_target: "theory_context",
      family: "theory_context_reflection",
      args: { topic, anchors },
      required_observation_kinds: ["helix_theory_context_reflection_tool_receipt"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / theory_context_reflection",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_theory_context_reflection_tool_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "helix_theory_context_reflection_tool_receipt",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: reflectionReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.theory_context_reflection_answer.v1",
          topic,
          anchors,
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "theory_context_reflection",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_theory_context_reflection_tool_receipt",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCivilizationBoundsReflectionPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-civilization-bounds:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const terminalArtifactId = `${turnId}:civilization_bounds_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "civilization_bounds_reflection_answer";
  const goalKind = "civilization_bounds_reflection";
  const compactResult = readCompactCivilizationBoundsToolResult(args.body);
  const roadmap = readRecord(compactResult?.roadmap);

  if (!compactResult || !roadmap) {
    const failureText =
      "I could not complete this golden-path civilization-bounds turn because no compact civilization-bounds tool result was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "runtime_evidence",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_civilization_bounds_reflection_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["helix_civilization_bounds_tool_result"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_civilization_bounds_tool_result",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "civilization_bounds_reflection_missing_result",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executed_capability: null,
        source_target: "civilization_bounds",
        family: "civilization_bounds",
        required_observation_kinds: ["helix_civilization_bounds_tool_result"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / civilization_bounds_reflection",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_civilization_bounds_tool_result",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_civilization_bounds_tool_result",
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "civilization_bounds_reflection_missing_result",
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_civilization_bounds_tool_result",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const badges = readArray(roadmap.badges);
  const systems = readArray(roadmap.systems);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const missingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const bridgeContext = readRecord(compactResult.bridgeContext ?? compactResult.bridge_context);
  const evidenceRefs = [roadmapId, ...missingEvidence].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const answerText = [
    "Civilization bounds reflection completed.",
    `Roadmap: ${title} (${roadmapId})`,
    `Systems: ${systems.length}; badges: ${badges.length}; collaboration bounds: ${collaborationBounds.length}.`,
    missingEvidence.length > 0 ? `Missing evidence hooks: ${missingEvidence.slice(0, 3).join(", ")}.` : null,
    "The civilization-bounds receipt is evidence-only; this answer is a synthesis summary and does not grant prediction, policy, moral, or execution authority.",
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "runtime_evidence",
    required_terminal_kind: requiredTerminalKind,
    classifier_reasons: ["explicit_civilization_bounds_reflection_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const civilizationBoundsReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext,
    evidence_refs: evidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "civilization_bounds_reflection",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_civilization_bounds_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    helix_civilization_bounds_tool_result: civilizationBoundsReceipt,
    civilization_bounds_reflection_answer: {
      schema: "helix.civilization_bounds_reflection_answer.v1",
      roadmap_id: roadmapId,
      title,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    model_turn_input: {
      schema: "helix.ask_model_turn_input.v1",
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY],
      function_call_outputs: [
        {
          call_id: `${turnId}:call:civilization_bounds_reflection`,
          name: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
          output_ref: observationArtifactId,
          output_kind: "helix_civilization_bounds_tool_result",
        },
      ],
      model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        private_runtime_loop_entered: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      source_target: "civilization_bounds",
      family: "civilization_bounds",
      args: { roadmap_id: roadmapId, title },
      required_observation_kinds: ["helix_civilization_bounds_tool_result"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / civilization_bounds_reflection",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_civilization_bounds_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "helix_civilization_bounds_tool_result",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: civilizationBoundsReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.civilization_bounds_reflection_answer.v1",
          roadmap_id: roadmapId,
          title,
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "civilization_bounds_reflection",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_civilization_bounds_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathZenGraphReflectionPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-zen:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:helix_zen_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:ideology_context_reflection_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "ideology_context_reflection_answer";
  const goalKind = "ideology_context_reflection";
  const compactResult = readCompactZenGraphReflectionToolResult(args.body);
  const reflection = readRecord(compactResult?.reflection);

  if (!compactResult || !reflection) {
    const failureText =
      "I could not complete this golden-path ideology reflection turn because no compact zen graph reflection tool result was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "runtime_evidence",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_zen_graph_reflection_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["helix_zen_graph_reflection_tool_result"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_zen_graph_reflection_tool_result",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "ideology_context_reflection_missing_result",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        executed_capability: null,
        source_target: "zen_graph",
        family: "ideology_context_reflection",
        required_observation_kinds: ["helix_zen_graph_reflection_tool_result"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / ideology_context_reflection",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_zen_graph_reflection_tool_result",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_zen_graph_reflection_tool_result",
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "ideology_context_reflection_missing_result",
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_zen_graph_reflection_tool_result",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? readHelixAskGoldenPathPrompt(args.body);
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? compactResult.recommendedActions,
  );
  const proceduralClassification = readRecord(
    compactResult.proceduralClassification ?? compactResult.procedural_classification,
  );
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(compactResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(compactResult.fruition);
  const admissions = readArray(compactResult.admissions);
  const refs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const evidenceRefs = [reflectionId, ...refs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const answerText = [
    "Ideology context reflection completed.",
    `Reflection: ${reflectionId}`,
    `Input: ${inputSummary}`,
    `Activated lenses: ${activatedTraits.length}; tensions: ${tensions.length}; recommended actions: ${recommendedActions.length}.`,
    `Procedural classifications: ${proceduralClassifications.length}; badge locator matches: ${locatorMatches.length}; admissions: ${admissions.length}.`,
    fruition ? "Fruition procedure evidence is present as support, not final authority." : null,
    "The zen graph receipt is evidence-only; this answer is a synthesis summary and does not grant moral, character, policy, or execution authority.",
  ]
    .filter((line): line is string => typeof line === "string" && line.length > 0)
    .join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "runtime_evidence",
    required_terminal_kind: requiredTerminalKind,
    classifier_reasons: ["explicit_zen_graph_reflection_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const zenGraphReceipt = {
    schema: "helix_zen_graph_reflection_tool_result.v1",
    kind: "helix_zen_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: evidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "ideology_context_reflection",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_zen_graph_reflection_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    helix_zen_graph_reflection_tool_result: zenGraphReceipt,
    ideology_context_reflection_answer: {
      schema: "helix.ideology_context_reflection_answer.v1",
      reflection_id: reflectionId,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    model_turn_input: {
      schema: "helix.ask_model_turn_input.v1",
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY],
      function_call_outputs: [
        {
          call_id: `${turnId}:call:zen_graph_reflection`,
          name: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
          output_ref: observationArtifactId,
          output_kind: "helix_zen_graph_reflection_tool_result",
        },
      ],
      model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        private_runtime_loop_entered: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      source_target: "zen_graph",
      family: "ideology_context_reflection",
      args: { reflection_id: reflectionId, input_summary: inputSummary },
      required_observation_kinds: ["helix_zen_graph_reflection_tool_result"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / ideology_context_reflection",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_zen_graph_reflection_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "helix_zen_graph_reflection_tool_result",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: zenGraphReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.ideology_context_reflection_answer.v1",
          reflection_id: reflectionId,
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "ideology_context_reflection",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
      observed_artifact_kind: "helix_zen_graph_reflection_tool_result",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathVisualCapturePayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-visual:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId) ?? "helix-ask:visual";
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const requestedCapability =
    readString(args.body.requested_capability) ??
    readString(args.body.requestedCapability) ??
    readString(args.body.capability) ??
    (/\bimage_lens\.inspect\b/i.test(promptText)
      ? HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY
      : HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY);
  const visualSummary = readVisualCaptureSummary(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:visual_frame_evidence`;
  const terminalArtifactId = `${turnId}:situation_context_pack`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "situation_context_pack";
  const goalKind = "visual_capture_describe";

  if (!visualSummary) {
    const failureText =
      "I could not complete this golden-path visual capture turn because no compact visual evidence was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "runtime_evidence",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_visual_capture"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["visual_frame_evidence"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_compact_visual_evidence",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "visual_capture_missing_evidence",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: requestedCapability,
        selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: requestedCapability,
        selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executed_capability: null,
        source_target: "visual_capture",
        family: "visual_capture",
        required_observation_kinds: ["visual_frame_evidence", "situation_context_pack"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / visual_capture",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: requestedCapability,
        selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_compact_visual_evidence",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: requestedCapability,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_compact_visual_evidence",
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "visual_capture_missing_evidence",
        private_runtime_loop_entered: false,
        requested_capability: requestedCapability,
        selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_compact_visual_evidence",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const detectedObjects = readStringArray(args.body.detected_objects ?? args.body.detectedObjects);
  const detectedRelations = readStringArray(args.body.detected_scene_relations ?? args.body.detectedSceneRelations);
  const uncertainty = readStringArray(args.body.uncertainty);
  const sourceId = readString(args.body.source_id) ?? readString(args.body.sourceId) ?? "golden_path_visual_capture";
  const frameId = readString(args.body.frame_id) ?? readString(args.body.frameId) ?? `${turnId}:visual_frame`;
  const evidence = {
    schema: HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
    frame_id: frameId,
    evidence_id: observationArtifactId,
    source_id: sourceId,
    thread_id: threadId,
    ts: now.toISOString(),
    image_model: readString(args.body.image_model) ?? readString(args.body.imageModel) ?? "golden_path_compact_visual_evidence",
    model_invoked: true,
    summary: visualSummary,
    detected_objects: detectedObjects,
    detected_scene_relations: detectedRelations,
    uncertainty,
    supports_claims: [],
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const answerText = [
    "Visual capture compact evidence was inspected.",
    `Summary: ${visualSummary}`,
    detectedObjects.length > 0 ? `Detected objects: ${detectedObjects.slice(0, 8).join(", ")}.` : "Detected objects: none provided.",
    detectedRelations.length > 0 ? `Scene relations: ${detectedRelations.slice(0, 6).join(", ")}.` : "Scene relations: none provided.",
    uncertainty.length > 0 ? `Uncertainty: ${uncertainty.slice(0, 4).join(", ")}.` : "Uncertainty: none provided.",
    "This is compact visual evidence; no raw image is included or promoted as answer authority.",
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "runtime_evidence",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_visual_capture", "golden_path_visual_capture"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const substitutionApplied = requestedCapability === HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY;
  const situationContextPack = {
    schema: "helix.situation_context_pack.v1",
    artifact_id: terminalArtifactId,
    turn_id: turnId,
    answer_text: answerText,
    visual_frame_evidence_ref: observationArtifactId,
    source_observation_refs: [observationArtifactId],
    support_refs: terminalResult.support_refs,
    terminal_eligible: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "visual_capture",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: requestedCapability,
      selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observed_artifact_kind: "visual_frame_evidence",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    visual_frame_evidence: evidence,
    situation_context_pack: situationContextPack,
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: requestedCapability,
      selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      source_target: "visual_capture",
      family: "visual_capture",
      substitution_rule_applied: substitutionApplied,
      substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
      required_observation_kinds: ["visual_frame_evidence", "situation_context_pack"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / visual_capture",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: requestedCapability,
      selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observed_artifact_kind: "visual_frame_evidence",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      substitution_rule_applied: substitutionApplied,
      substitution_rule_id: substitutionApplied ? "image_lens.inspect->situation-room.describe_visual_capture" : null,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: requestedCapability,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        kind: "visual_frame_evidence",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: evidence,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_visual_capture_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: situationContextPack,
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "visual_capture",
      private_runtime_loop_entered: false,
      requested_capability: requestedCapability,
      selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
      observed_artifact_kind: "visual_frame_evidence",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathProcessedLiveSourceMailPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-processed-mail:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const packetPayload = buildProcessedMailPacketPayload({ body: args.body, turnId, createdAtMs });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = readString(packetPayload?.packetId) ?? `${turnId}:stage_play_processed_mail_packet`;
  const terminalArtifactId = `${turnId}:model_synthesized_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "model_synthesized_answer";
  const goalKind = "processed_live_source_mail_read";

  if (!packetPayload) {
    const failureText =
      "I could not complete this golden-path Ask turn because no processed live-source mail packet was provided.";
    const terminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: failureText,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      allows_workspace_context: false,
      allows_prior_artifacts: false,
      classifier_reasons: ["explicit_processed_live_source_mail_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: ["stage_play_processed_mail_packet"],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: "missing_processed_live_source_mail_packet",
      answer: failureText,
      text: failureText,
      assistant_answer: failureText,
      selected_final_answer: failureText,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "processed_live_source_mail_missing_packet",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_ref: terminalResult.artifact_id,
        terminal_result_id: terminalResultId,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        terminal_result_count: 1,
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        source_target: "live_source_mailbox",
        family: "live_environment",
        required_observation_kinds: ["stage_play_processed_mail_packet"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        completed_solver_path: false,
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: failureText,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / processed_live_source_mail",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: failureText,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        route_authority_ok: true,
        terminal_authority_ok: true,
        goal_satisfaction: "not_satisfied",
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        observed_artifact_kind: null,
        observed_artifact_ref: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: "missing_processed_live_source_mail_packet",
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          payload: {
            schema: "helix.typed_failure.v1",
            text: failureText,
            answer_text: failureText,
            terminal_error_code: "missing_processed_live_source_mail_packet",
            first_broken_rail: "observation",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "processed_live_source_mail_missing_packet",
        private_runtime_loop_entered: false,
        requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        terminal_result_count: 1,
        final_answer_source: "typed_failure",
        terminal_error_code: "missing_processed_live_source_mail_packet",
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  }

  const observedFacts = readStringArray(packetPayload.observedFacts);
  const inferredFacts = readStringArray(packetPayload.inferredFacts);
  const uncertainties = readStringArray(packetPayload.uncertainties);
  const recommendedNext = readString(packetPayload.recommendedNext) ?? "inspect_if_needed";
  const answerText = [
    `Processed live-source mail packet read: ${observationArtifactId}.`,
    observedFacts.length ? `Observed facts: ${observedFacts.join("; ")}.` : "Observed facts: none supplied.",
    inferredFacts.length ? `Inferred facts: ${inferredFacts.join("; ")}.` : "Inferred facts: none supplied.",
    uncertainties.length ? `Uncertainties: ${uncertainties.join("; ")}.` : "Uncertainties: none supplied.",
    `Recommended next: ${recommendedNext}.`,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: false,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_processed_live_source_mail_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [observationArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "processed_live_source_mail",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    stage_play_processed_mail_packet: packetPayload,
    model_synthesized_answer: {
      schema: "helix.model_synthesized_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      assistant_answer: false,
      raw_content_included: false,
    },
    model_turn_input: {
      schema: "helix.ask_model_turn_input.v1",
      turn_id: turnId,
      prompt_text: promptText,
      available_capabilities: [HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY],
      function_call_outputs: [
        {
          call_id: `${turnId}:call:read_processed_live_source_mail`,
          name: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
          output_ref: observationArtifactId,
          output_kind: "stage_play_processed_mail_packet",
        },
      ],
      model_visible_artifacts: [observationArtifactId, goalSatisfactionArtifact.artifact_id],
      loop_policy: {
        max_model_steps: 1,
        private_runtime_loop_entered: false,
      },
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      source_target: "live_source_mailbox",
      family: "live_environment",
      required_observation_kinds: ["stage_play_processed_mail_packet"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / processed_live_source_mail",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: observationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "stage_play_processed_mail_packet",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: packetPayload,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.model_synthesized_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "processed_live_source_mail",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY,
      observed_artifact_kind: "stage_play_processed_mail_packet",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathVisualCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-visual-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId) ?? "helix-ask:visual-calculator";
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const visualRequestedCapability =
    readString(args.body.visual_requested_capability) ??
    readString(args.body.visualRequestedCapability) ??
    (/\bimage_lens\.inspect\b/i.test(promptText)
      ? HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY
      : HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY);
  const visualSummary = readVisualCaptureSummary(args.body);
  const expression = readCalculatorExpression(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const visualObservationArtifactId = `${turnId}:visual_frame_evidence`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const makeFailurePayload = (params: {
    errorCode: "missing_compact_visual_evidence" | "missing_calculator_expression" | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "observation" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_visual_calculator_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "visual_calculator_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        required_observation_kinds: ["visual_frame_evidence", "calculator_receipt"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / visual_calculator_compound",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        compound_subgoal_count: 2,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: "compound_capability_contract",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "visual_calculator_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!visualSummary) {
    return makeFailurePayload({
      errorCode: "missing_compact_visual_evidence",
      brokenRail: "observation",
      missingRequirement: "visual_frame_evidence",
      text: "I could not complete this golden-path compound turn because no compact visual evidence was provided.",
    });
  }
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path compound turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path compound turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const resultText = formatGoldenPathNumber(result);
  const detectedObjects = readStringArray(args.body.detected_objects ?? args.body.detectedObjects);
  const detectedRelations = readStringArray(args.body.detected_scene_relations ?? args.body.detectedSceneRelations);
  const uncertainty = readStringArray(args.body.uncertainty);
  const sourceId = readString(args.body.source_id) ?? readString(args.body.sourceId) ?? "golden_path_visual_capture";
  const frameId = readString(args.body.frame_id) ?? readString(args.body.frameId) ?? `${turnId}:visual_frame`;
  const visualEvidence = {
    schema: HELIX_VISUAL_FRAME_EVIDENCE_SCHEMA,
    frame_id: frameId,
    evidence_id: visualObservationArtifactId,
    source_id: sourceId,
    thread_id: threadId,
    ts: now.toISOString(),
    image_model: readString(args.body.image_model) ?? readString(args.body.imageModel) ?? "golden_path_compact_visual_evidence",
    model_invoked: true,
    summary: visualSummary,
    detected_objects: detectedObjects,
    detected_scene_relations: detectedRelations,
    uncertainty,
    supports_claims: [],
    raw_image_included: false,
    assistant_answer: false,
    context_policy: "compact_context_pack_only",
  };
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:visual_capture`,
        requested_capability: visualRequestedCapability,
        selected_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        args: { source_id: sourceId, frame_id: frameId },
        observation_kind: "visual_frame_evidence",
        observation_ref: visualObservationArtifactId,
        terminal_contribution_kind: "situation_context_pack",
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:calculator`,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observation_kind: "calculator_receipt",
        observation_ref: calculatorObservationArtifactId,
        terminal_contribution_kind: "workstation_tool_evaluation",
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound visual/calculator synthesis completed.",
    `Visual evidence: ${visualSummary}`,
    detectedObjects.length > 0 ? `Detected objects: ${detectedObjects.slice(0, 8).join(", ")}.` : "Detected objects: none provided.",
    `Calculator expression: ${expression}`,
    `Calculator result: ${resultText}`,
    "The visual capture and calculator receipt are observations supporting this synthesis; neither receipt is promoted as answer authority.",
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_visual_calculator_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      visualObservationArtifactId,
      calculatorObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "visual_calculator_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: visualObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    visual_frame_evidence: visualEvidence,
    calculator_receipt: calculatorReceipt,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["visual_frame_evidence", "calculator_receipt"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / visual_calculator_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: visualObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: visualObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY,
        kind: "visual_frame_evidence",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: visualEvidence,
      },
      {
        artifact_id: calculatorObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        kind: "calculator_receipt",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: calculatorReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_compound_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "visual_calculator_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathDocsCalculatorCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-docs-calculator:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const calculatorObservationArtifactId = `${turnId}:calculator_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);
  const expression = readCalculatorExpression(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches"
      | "missing_calculator_expression"
      | "invalid_calculator_expression";
    brokenRail: "argument_extraction" | "observation" | "capability_execution";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_docs_calculator_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "docs_calculator_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        args: { doc_path: docPath, query, expression },
        required_observation_kinds: ["doc_location_matches", "calculator_receipt"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / docs_calculator_compound",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        compound_subgoal_count: 2,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: "compound_capability_contract",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "docs_calculator_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs/calculator turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs/calculator turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }
  if (!expression) {
    return makeFailurePayload({
      errorCode: "missing_calculator_expression",
      brokenRail: "argument_extraction",
      missingRequirement: "calculator_expression",
      text: "I could not complete this golden-path docs/calculator turn because no calculator expression was provided.",
    });
  }
  const result = evaluateGoldenPathCalculatorExpression(expression);
  if (result === null) {
    return makeFailurePayload({
      errorCode: "invalid_calculator_expression",
      brokenRail: "capability_execution",
      missingRequirement: "calculator_receipt",
      text: `I could not complete this golden-path docs/calculator turn because the expression could not be evaluated: ${expression}`,
    });
  }

  const resultText = formatGoldenPathNumber(result);
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
  const calculatorReceipt = {
    schema: "helix.calculator_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
    expression,
    result,
    result_text: resultText,
    unit: null,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:docs_locate`,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observation_kind: "doc_location_matches",
        observation_ref: docObservationArtifactId,
        terminal_contribution_kind: "doc_location_matches",
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:calculator`,
        requested_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        args: { expression },
        observation_kind: "calculator_receipt",
        observation_ref: calculatorObservationArtifactId,
        terminal_contribution_kind: "workstation_tool_evaluation",
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound docs/calculator synthesis completed.",
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    `Calculator expression: ${expression}`,
    `Calculator result: ${resultText}`,
    "The document evidence and calculator receipt are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_docs_calculator_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      docObservationArtifactId,
      calculatorObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "docs_calculator_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: docObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    doc_location_matches: docLocationMatches,
    calculator_receipt: calculatorReceipt,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["doc_location_matches", "calculator_receipt"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / docs_calculator_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: docObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: docObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        kind: "doc_location_matches",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: docLocationMatches,
      },
      {
        artifact_id: calculatorObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY,
        kind: "calculator_receipt",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: calculatorReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_compound_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "docs_calculator_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathRepoDocsCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-repo-docs:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const repoObservationArtifactId = `${turnId}:repo_code_evidence_observation`;
  const relevanceGateArtifactId = `${turnId}:repo_evidence_relevance_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const concept = readRepoSearchConcept(args.body);
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_repo_search_concept"
      | "repo_evidence_weak_after_repair"
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation" | "evidence_reentry";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_repo_docs_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "repo_docs_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        args: { concept, doc_path: docPath, query },
        required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / repo_docs_compound",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        compound_subgoal_count: 2,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: "compound_capability_contract",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "repo_docs_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!concept) {
    return makeFailurePayload({
      errorCode: "missing_repo_search_concept",
      brokenRail: "argument_extraction",
      missingRequirement: "repo_search_concept",
      text: "I could not complete this golden-path repo/docs turn because no repo concept was provided.",
    });
  }
  const evidence = findGoldenPathRepoEvidence({ concept, files: readGoldenPathRepoSearchFiles(args.body) });
  if (evidence.length === 0) {
    return makeFailurePayload({
      errorCode: "repo_evidence_weak_after_repair",
      brokenRail: "evidence_reentry",
      missingRequirement: "repo_code_evidence_observation",
      text: `I could not find strong repo evidence for: ${concept}`,
    });
  }
  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path repo/docs turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path repo/docs turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }

  const selectedPaths = Array.from(new Set(evidence.map((entry) => entry.file_path)));
  const repoEvidenceObservation = {
    schema: "helix.repo_code_evidence_observation.v1",
    capability_key: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    concept,
    selected_paths: selectedPaths,
    evidence,
    match_count: evidence.length,
    assistant_answer: false,
    raw_content_included: false,
  };
  const repoEvidenceRelevanceGate = {
    schema: "helix.repo_evidence_relevance_gate.v1",
    turn_id: turnId,
    concept,
    selected_paths: selectedPaths,
    coverage: evidence.length >= 2 ? "adequate" : "weak",
    terminal_allowed: true,
    repair_required: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:repo_search`,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        args: { concept },
        observation_kind: "repo_code_evidence_observation",
        observation_ref: repoObservationArtifactId,
        terminal_contribution_kind: "repo_code_evidence_answer",
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:docs_locate`,
        requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observation_kind: "doc_location_matches",
        observation_ref: docObservationArtifactId,
        terminal_contribution_kind: "doc_location_matches",
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound repo/docs synthesis completed.",
    `Repo concept: ${concept}`,
    `Repo evidence: ${evidence[0]?.file_path ?? "unknown"}:${evidence[0]?.line ?? "unknown"} - ${evidence[0]?.snippet ?? ""}`,
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    "The repo evidence, relevance gate, and document matches are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_repo_docs_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      repoObservationArtifactId,
      relevanceGateArtifactId,
      docObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "repo_docs_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: repoObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    repo_code_evidence_observation: repoEvidenceObservation,
    repo_evidence_relevance_gate: repoEvidenceRelevanceGate,
    doc_location_matches: docLocationMatches,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / repo_docs_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: repoObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: repoObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        kind: "repo_code_evidence_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: repoEvidenceObservation,
      },
      {
        artifact_id: relevanceGateArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        kind: "repo_evidence_relevance_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: repoEvidenceRelevanceGate,
      },
      {
        artifact_id: docObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        kind: "doc_location_matches",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: docLocationMatches,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_compound_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "repo_docs_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-research-reflection:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const internetObservationArtifactId = `${turnId}:internet_search_observation`;
  const reflectionObservationArtifactId = `${turnId}:helix_theory_context_reflection_tool_receipt`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const query = readInternetSearchQuery(args.body);
  const results = readCompactInternetSearchResults(args.body);
  const topic = readTheoryReflectionTopic(args.body);
  const anchors = readTheoryReflectionAnchors(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_internet_search_query"
      | "missing_compact_internet_search_evidence"
      | "missing_theory_reflection_topic";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_internet_research_reflection_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "internet_research_reflection_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: params.brokenRail,
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        required_observation_kinds: ["internet_search_observation", "helix_theory_context_reflection_tool_receipt"],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_authority_ok: true,
        route: "golden_path_runtime / internet_research_reflection_compound",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        compound_subgoal_count: 2,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: "compound_capability_contract",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "internet_research_reflection_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_internet_search_query",
      brokenRail: "argument_extraction",
      missingRequirement: "internet_search_query",
      text: "I could not complete this golden-path research/reflection turn because no web search query was provided.",
    });
  }
  if (results.length === 0) {
    return makeFailurePayload({
      errorCode: "missing_compact_internet_search_evidence",
      brokenRail: "observation",
      missingRequirement: "internet_search_observation",
      text: "I could not complete this golden-path research/reflection turn because no compact web result evidence was provided.",
    });
  }
  if (!topic) {
    return makeFailurePayload({
      errorCode: "missing_theory_reflection_topic",
      brokenRail: "argument_extraction",
      missingRequirement: "theory_reflection_topic",
      text: "I could not complete this golden-path research/reflection turn because no reflection topic was provided.",
    });
  }

  const normalizedResults = results.slice(0, 5).map((result, index) => {
    const url = readString(result.url) ?? `https://example.invalid/result-${index + 1}`;
    const evidenceRefs = readStringArray(result.evidence_refs ?? result.evidenceRefs);
    return {
      result_id: readString(result.result_id) ?? readString(result.resultId) ?? `${turnId}:web_result:${index + 1}`,
      title: readString(result.title) ?? url,
      url,
      snippet: readString(result.snippet) ?? undefined,
      content_excerpt: readString(result.content_excerpt) ?? readString(result.contentExcerpt) ?? undefined,
      published_at: readString(result.published_at) ?? readString(result.publishedAt) ?? undefined,
      source_provider: readString(result.source_provider) ?? readString(result.sourceProvider) ?? "tavily",
      rank: readNumber(result.rank) ?? index + 1,
      evidence_refs: evidenceRefs.length ? evidenceRefs : [`internet_search:${index + 1}`],
      confidence: readString(result.confidence) ?? "medium",
    };
  });
  const internetEvidenceRefs = normalizedResults.flatMap((result) =>
    result.evidence_refs.map((ref) => ({
      ref,
      provider: result.source_provider,
      url: result.url,
      retrieved_at_ms: createdAtMs,
    })),
  );
  const internetObservation = {
    schema: HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
    artifact_id: internetObservationArtifactId,
    turn_id: turnId,
    capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
    query,
    providers_considered: readStringArray(args.body.providers_considered ?? args.body.providersConsidered),
    providers_called: readStringArray(args.body.providers_called ?? args.body.providersCalled),
    evidence_refs: internetEvidenceRefs,
    results: normalizedResults,
    missing_requirements: [],
    selected_for_answer: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  const reflectionReceipt = {
    schema: "helix.theory_context_reflection_tool_receipt.v1",
    capability_key: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
    topic,
    anchors,
    source_refs: [internetObservationArtifactId, ...internetEvidenceRefs.map((ref) => ref.ref)].slice(0, 8),
    reflection_mode: "golden_path_research_grounded_context",
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:internet_search`,
        requested_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        args: { query },
        observation_kind: "internet_search_observation",
        observation_ref: internetObservationArtifactId,
        terminal_contribution_kind: "internet_search_answer",
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:theory_reflection`,
        requested_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        args: { topic, anchors },
        observation_kind: "helix_theory_context_reflection_tool_receipt",
        observation_ref: reflectionObservationArtifactId,
        terminal_contribution_kind: "theory_context_reflection_answer",
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound research/reflection synthesis completed.",
    `Research query: ${query}`,
    normalizedResults[0] ? `Top web result: ${normalizedResults[0].title} - ${normalizedResults[0].url}` : "",
    `Reflection topic: ${topic}`,
    anchors.length > 0 ? `Reflection anchors: ${anchors.join(", ")}.` : "Reflection anchors: none provided.",
    "The web observation and theory reflection receipt are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_internet_research_reflection_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      internetObservationArtifactId,
      reflectionObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "internet_research_reflection_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: internetObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    internet_search_observation: internetObservation,
    helix_theory_context_reflection_tool_receipt: reflectionReceipt,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["internet_search_observation", "helix_theory_context_reflection_tool_receipt"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / internet_research_reflection_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: internetObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: internetObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY,
        kind: "internet_search_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: internetObservation,
      },
      {
        artifact_id: reflectionObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY,
        kind: "helix_theory_context_reflection_tool_receipt",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: reflectionReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_compound_synthesis",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "internet_research_reflection_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-civilization-zen:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const civilizationObservationArtifactId = `${turnId}:helix_civilization_bounds_tool_result`;
  const zenObservationArtifactId = `${turnId}:helix_zen_graph_reflection_tool_result`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const civilizationResult = readCompactCivilizationBoundsToolResult(args.body);
  const roadmap = readRecord(civilizationResult?.roadmap);
  const zenResult = readCompactZenGraphReflectionToolResult(args.body);
  const reflection = readRecord(zenResult?.reflection);

  const makeFailurePayload = (params: {
    errorCode: "missing_civilization_bounds_tool_result" | "missing_zen_graph_reflection_tool_result";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: "compound_capability_contract",
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: "compound_capability_contract",
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: "observation",
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
      schema: "helix.ask_golden_path_terminal_result.v1",
      result_id: terminalResultId,
      artifact_id: `${turnId}:typed_failure`,
      artifact_kind: "typed_failure",
      final_answer_source: "typed_failure",
      text: params.text,
      support_refs: [routeGateArtifactId],
      terminal_authority_ok: true,
      route_authority_ok: true,
      assistant_answer: false,
      raw_content_included: false,
    };

    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalResult.artifact_id,
      terminal_error_code: params.errorCode,
      answer: params.text,
      text: params.text,
      assistant_answer: params.text,
      selected_final_answer: params.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        status: "civilization_bounds_zen_reflection_compound_failed",
        flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_result_count: 1,
        first_broken_rail: "observation",
        legacy_route_bypassed: true,
        private_runtime_loop_entered: false,
        route_gate: "enabled_explicit_request",
        assistant_answer: false,
        raw_content_included: false,
      },
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: {
        schema: "helix.ask_capability_plan.v1",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        source_target: "compound",
        family: "compound",
        required_observation_kinds: [
          "helix_civilization_bounds_tool_result",
          "helix_zen_graph_reflection_tool_result",
        ],
        required_terminal_kind: requiredTerminalKind,
        assistant_answer: false,
        raw_content_included: false,
      },
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: {
        schema: "helix.terminal_answer_authority.v1",
        selected_terminal_artifact_kind: "typed_failure",
        terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        selected_final_answer: terminalResult.text,
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_authority_ok: true,
        route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
        server_authoritative: true,
        assistant_answer: false,
        raw_content_included: false,
      },
      terminal_authority_single_writer: {
        schema: "helix.terminal_authority_single_writer.v1",
        selected_terminal_artifact_kind: "typed_failure",
        selected_terminal_artifact_id: terminalResult.artifact_id,
        selected_terminal_result_id: terminalResult.result_id,
        visible_text: terminalResult.text,
        source: "typed_failure",
        assistant_answer: false,
        raw_content_included: false,
      },
      ask_turn_solver_trace: {
        schema: "helix.ask_turn_solver_trace.v1",
        completed_solver_path: false,
        golden_path_runtime: true,
        private_runtime_loop_entered: false,
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: params.errorCode,
        compound_subgoal_count: 2,
        assistant_answer: false,
        raw_content_included: false,
      },
      current_turn_artifact_ledger: [
        {
          artifact_id: routeGateArtifactId,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "golden_path_route_gate",
          terminal_eligible: false,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.golden_path_route_gate.v1",
            route_gate: "enabled_explicit_request",
            requested_capability: "compound_capability_contract",
            assistant_answer: false,
            raw_content_included: false,
          },
        },
        {
          artifact_id: terminalResult.artifact_id,
          turn_id: turnId,
          producer_item_id: "golden_path_runtime",
          kind: "typed_failure",
          terminal_eligible: true,
          created_at_ms: createdAtMs,
          source_scope: "current_turn",
          goal_hash: goalHash,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: "observation",
            support_refs: terminalResult.support_refs,
            assistant_answer: false,
            raw_content_included: false,
          },
        },
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        golden_path_runtime_status: "civilization_bounds_zen_reflection_compound_failed",
        requested_capability: "compound_capability_contract",
        selected_capability: "compound_capability_contract",
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: "observation",
        terminal_error_code: params.errorCode,
        goal_satisfaction_evaluation: goalSatisfactionEvaluation,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

  if (!civilizationResult || !roadmap) {
    return makeFailurePayload({
      errorCode: "missing_civilization_bounds_tool_result",
      missingRequirement: "helix_civilization_bounds_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact civilization-bounds evidence was provided.",
    });
  }
  if (!zenResult || !reflection) {
    return makeFailurePayload({
      errorCode: "missing_zen_graph_reflection_tool_result",
      missingRequirement: "helix_zen_graph_reflection_tool_result",
      text: "I could not complete this golden-path civilization-bounds/reflection turn because no compact zen graph reflection evidence was provided.",
    });
  }

  const roadmapId =
    readString(roadmap.roadmapId) ?? readString(roadmap.roadmap_id) ?? "civilization-bounds:compact";
  const title = readString(roadmap.title) ?? "Civilization Bounds Roadmap";
  const systems = readArray(roadmap.systems);
  const badges = readArray(roadmap.badges);
  const collaborationBounds = readArray(roadmap.collaborationBounds ?? roadmap.collaboration_bounds);
  const civilizationMissingEvidence = readStringArray(roadmap.missingEvidence ?? roadmap.missing_evidence);
  const civilizationBridgeContext = readRecord(civilizationResult.bridgeContext ?? civilizationResult.bridge_context);
  const civilizationEvidenceRefs = [roadmapId, ...civilizationMissingEvidence]
    .filter((ref): ref is string => ref.length > 0)
    .slice(0, 8);
  const reflectionId =
    readString(reflection.reflectionId) ?? readString(reflection.artifactId) ?? "ideology_context_reflection";
  const input = readRecord(reflection.input);
  const inputSummary = readString(input?.summary) ?? readString(input?.text) ?? promptText;
  const activatedTraits = readArray(reflection.activated_traits ?? reflection.activatedTraits);
  const tensions = readArray(reflection.tensions);
  const recommendedActions = readArray(
    reflection.recommended_actions ?? reflection.recommendedActions ?? zenResult.recommendedActions,
  );
  const proceduralClassification = readRecord(zenResult.proceduralClassification ?? zenResult.procedural_classification);
  const proceduralClassifications = readArray(proceduralClassification?.classifications);
  const locator = readRecord(zenResult.locator);
  const locatorMatches = readArray(locator?.matches ?? locator?.badges ?? locator?.paths);
  const fruition = readRecord(zenResult.fruition);
  const admissions = readArray(zenResult.admissions);
  const zenRefs = readStringArray(input?.refs).length > 0 ? readStringArray(input?.refs) : readStringArray(args.body.refs);
  const zenEvidenceRefs = [reflectionId, ...zenRefs].filter((ref): ref is string => ref.length > 0).slice(0, 8);
  const civilizationReceipt = {
    schema: "helix_civilization_bounds_tool_result.v1",
    kind: "helix_civilization_bounds_tool_result",
    tool_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    roadmap,
    bridgeContext: civilizationBridgeContext,
    evidence_refs: civilizationEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const zenReceipt = {
    schema: "helix_zen_graph_reflection_tool_result.v1",
    kind: "helix_zen_graph_reflection_tool_result",
    tool_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
    reflection,
    proceduralClassification,
    locator,
    fruition,
    admissions,
    evidence_refs: zenEvidenceRefs,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:civilization_bounds`,
        requested_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        args: { roadmap_id: roadmapId, title },
        observation_kind: "helix_civilization_bounds_tool_result",
        observation_ref: civilizationObservationArtifactId,
        terminal_contribution_kind: "civilization_bounds_reflection_answer",
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:zen_graph_reflection`,
        requested_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        args: { reflection_id: reflectionId, input_summary: inputSummary },
        observation_kind: "helix_zen_graph_reflection_tool_result",
        observation_ref: zenObservationArtifactId,
        terminal_contribution_kind: "ideology_context_reflection_answer",
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound civilization-bounds/reflection synthesis completed.",
    `Civilization roadmap: ${title} (${roadmapId})`,
    `Roadmap evidence: systems ${systems.length}, badges ${badges.length}, collaboration bounds ${collaborationBounds.length}.`,
    `Ideology reflection: ${reflectionId}`,
    `Reflection evidence: activated lenses ${activatedTraits.length}, tensions ${tensions.length}, recommended actions ${recommendedActions.length}.`,
    `Procedural classifications: ${proceduralClassifications.length}; badge locator matches: ${locatorMatches.length}.`,
    "Both receipts are evidence-only; synthesis is terminal authority only after the civilization-bounds and ideology-reflection subgoals are satisfied.",
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_civilization_bounds_zen_reflection_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      civilizationObservationArtifactId,
      zenObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "civilization_bounds_zen_reflection_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: civilizationObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    helix_civilization_bounds_tool_result: civilizationReceipt,
    helix_zen_graph_reflection_tool_result: zenReceipt,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: [
        "helix_civilization_bounds_tool_result",
        "helix_zen_graph_reflection_tool_result",
      ],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / civilization_bounds_zen_reflection_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: civilizationObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: civilizationObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
        kind: "helix_civilization_bounds_tool_result",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: civilizationReceipt,
      },
      {
        artifact_id: zenObservationArtifactId,
        turn_id: turnId,
        producer_item_id: HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY,
        kind: "helix_zen_graph_reflection_tool_result",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: zenReceipt,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "civilization_bounds_zen_reflection_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

const buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): RecordLike => {
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });
  const now = deps.now();
  const createdAtMs = now.getTime();
  const turnId =
    readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-catalog-workspace:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const catalogObservationArtifactId = `${turnId}:capability_registry`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const workspaceObservationArtifactId =
    readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const counts = readRecord(workspaceObservation.capability_counts) ?? {};
  const workspaceSummary = `Workspace status: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
  const compoundCapabilityContract = {
    schema: "helix.compound_capability_contract.v1",
    turn_id: turnId,
    ordered_subgoals: [
      {
        subgoal_id: `${turnId}:subgoal:capability_catalog`,
        requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        args: {},
        observation_kind: "capability_registry",
        observation_ref: catalogObservationArtifactId,
        satisfaction: "satisfied",
      },
      {
        subgoal_id: `${turnId}:subgoal:workspace_status`,
        requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        executed_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        args: {},
        observation_kind: "workspace_os_status_observation",
        observation_ref: workspaceObservationArtifactId,
        satisfaction: "satisfied",
      },
    ],
    satisfaction: "satisfied",
    assistant_answer: false,
    raw_content_included: false,
  };
  const answerText = [
    "Compound capability/workspace synthesis completed.",
    "Capability catalog observation completed.",
    workspaceSummary,
  ].join("\n");
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: "compound_capability_contract",
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_catalog_workspace_compound_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: "compound_capability_contract",
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
  const terminalResult: HelixAskGoldenPathRuntimeTerminalResult = {
    schema: "helix.ask_golden_path_terminal_result.v1",
    result_id: terminalResultId,
    artifact_id: terminalArtifactId,
    artifact_kind: requiredTerminalKind,
    final_answer_source: requiredTerminalKind,
    text: answerText,
    support_refs: [
      catalogObservationArtifactId,
      workspaceObservationArtifactId,
      routeGateArtifactId,
      goalSatisfactionArtifact.artifact_id,
    ],
    terminal_authority_ok: true,
    route_authority_ok: true,
    assistant_answer: false,
    raw_content_included: false,
  };

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    golden_path_runtime: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      status: "catalog_workspace_compound",
      flag: HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: catalogObservationArtifactId,
      terminal_artifact_ref: terminalArtifactId,
      terminal_result_id: terminalResultId,
      legacy_route_bypassed: true,
      legacy_fallback_possible_when_unhandled: true,
      private_runtime_loop_entered: false,
      route_gate: "enabled_explicit_request",
      terminal_result_count: 1,
      assistant_answer: false,
      raw_content_included: false,
    },
    canonical_goal_frame: canonicalGoalFrame,
    compound_capability_contract: compoundCapabilityContract,
    capability_registry: catalogObservation,
    workspace_os_status_observation: workspaceObservation,
    compound_evidence_synthesis_answer: {
      schema: "helix.compound_evidence_synthesis_answer.v1",
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      satisfied_subgoal_count: 2,
      assistant_answer: false,
      raw_content_included: false,
    },
    capability_plan: {
      schema: "helix.ask_capability_plan.v1",
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      source_target: "compound",
      family: "compound",
      required_observation_kinds: ["capability_registry", "workspace_os_status_observation"],
      required_terminal_kind: requiredTerminalKind,
      assistant_answer: false,
      raw_content_included: false,
    },
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: {
      schema: "helix.terminal_answer_authority.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      selected_final_answer: terminalResult.text,
      final_answer_source: terminalResult.final_answer_source,
      terminal_authority_ok: true,
      route: "golden_path_runtime / catalog_workspace_compound",
      server_authoritative: true,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminal_authority_single_writer: {
      schema: "helix.terminal_authority_single_writer.v1",
      selected_terminal_artifact_kind: terminalResult.artifact_kind,
      selected_terminal_artifact_id: terminalResult.artifact_id,
      selected_terminal_result_id: terminalResult.result_id,
      visible_text: terminalResult.text,
      source: terminalResult.final_answer_source,
      assistant_answer: false,
      raw_content_included: false,
    },
    ask_turn_solver_trace: {
      schema: "helix.ask_turn_solver_trace.v1",
      completed_solver_path: true,
      route_authority_ok: true,
      terminal_authority_ok: true,
      goal_satisfaction: "satisfied",
      golden_path_runtime: true,
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      observed_artifact_kind: "compound_subgoal_observations",
      observed_artifact_ref: catalogObservationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      compound_subgoal_count: 2,
      solver_risk_flags: [],
      solver_short_circuit_flags: [],
      assistant_answer: false,
      raw_content_included: false,
    },
    current_turn_artifact_ledger: [
      {
        artifact_id: routeGateArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "golden_path_route_gate",
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.golden_path_route_gate.v1",
          route_gate: "enabled_explicit_request",
          prompt_text: promptText,
          requested_capability: "compound_capability_contract",
          compound_capability_contract: compoundCapabilityContract,
          goal_satisfaction_artifact: goalSatisfactionArtifact,
          goal_satisfaction_evaluation: goalSatisfactionEvaluation,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
      {
        artifact_id: catalogObservationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "capability_registry",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: catalogObservation,
      },
      {
        artifact_id: workspaceObservationArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: "workspace_os_status_observation",
        terminal_eligible: false,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: workspaceObservation,
      },
      {
        artifact_id: terminalArtifactId,
        turn_id: turnId,
        producer_item_id: "golden_path_runtime",
        kind: requiredTerminalKind,
        terminal_eligible: true,
        created_at_ms: createdAtMs,
        source_scope: "current_turn",
        goal_hash: goalHash,
        payload: {
          schema: "helix.compound_evidence_synthesis_answer.v1",
          text: terminalResult.text,
          answer_text: terminalResult.text,
          terminal_result_id: terminalResult.result_id,
          support_refs: terminalResult.support_refs,
          satisfied_subgoal_count: 2,
          assistant_answer: false,
          raw_content_included: false,
        },
      },
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "catalog_workspace_compound",
      private_runtime_loop_entered: false,
      requested_capability: "compound_capability_contract",
      selected_capability: "compound_capability_contract",
      executed_capability: "compound_capability_contract",
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      compound_capability_contract: compoundCapabilityContract,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};

export const runHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  env?: Record<string, string | undefined>;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
}): HelixAskGoldenPathRuntimeDecision => {
  if (!isHelixAskGoldenPathRuntimeEnabled(args.env)) return { handled: false, reason: "flag_disabled" };
  if (!isHelixAskGoldenPathRequested(args.body)) return { handled: false, reason: "not_requested" };
  const body = readRecord(args.body) ?? {};
  if (isHelixAskGoldenPathCatalogWorkspaceCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCalculatorCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCalculatorCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsCalculatorCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsCalculatorCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoDocsCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoDocsCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetResearchReflectionCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetResearchReflectionCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsZenReflectionCompoundPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathProcessedLiveSourceMailRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathProcessedLiveSourceMailPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathStagePlayReflectionRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathStagePlayReflectionPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathInternetSearchRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathInternetSearchPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathScholarlyResearchRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathScholarlyResearchPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathCivilizationBoundsReflectionRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCivilizationBoundsReflectionPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathZenGraphReflectionRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathZenGraphReflectionPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathTheoryReflectionRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathTheoryReflectionPayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathVisualCaptureRequested(body)) {
    return {
      handled: true,
      payload: buildHelixAskGoldenPathVisualCapturePayload({
        body,
        deps: args.deps,
        now: args.now,
      }),
    };
  }
  if (isHelixAskGoldenPathCalculatorSolveRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCalculatorSolvePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathDocsLocateRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathDocsLocatePayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathRepoSearchConceptRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathRepoSearchConceptPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceDirectoryRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceDirectoryPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathCapabilityCatalogRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathCapabilityCatalogPayload({
        body,
        deps,
      }),
    };
  }
  if (isHelixAskGoldenPathWorkspaceStatusRequested(body)) {
    const deps = createHelixAskGoldenPathRuntimeDependencies({
      ...args.deps,
      ...(args.now ? { now: () => args.now as Date } : {}),
    });
    return {
      handled: true,
      payload: buildHelixAskGoldenPathWorkspaceStatusPayload({
        body,
        deps,
      }),
    };
  }
  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimePayload({
      body,
      deps: args.deps,
      now: args.now,
    }),
  };
};
