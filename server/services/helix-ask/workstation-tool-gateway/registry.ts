import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

import {
  HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
} from "../workspace-os-status-intent";
import {
  HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  executeWorkspaceOsStatusTool,
} from "../workspace-os-status-tool";
import {
  formatRepoSearchEvidence,
  runRepoSearch,
  type RepoSearchHit,
} from "../repo-search";
import {
  buildDocsSearchDocumentCandidates,
  buildDocsSearchTerms,
  mergeDocsSearchPathCandidates,
  rankDocsSearchHits,
} from "../docs-search";
import {
  HELIX_INTERNET_SEARCH_CAPABILITY,
  HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA,
  type HelixInternetSearchProvider,
} from "@shared/helix-internet-search-observation";
import {
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
  type HelixScholarlyResearchIntentMode,
  type HelixScholarlyResearchProvider,
} from "@shared/helix-scholarly-research-observation";
import { runInternetSearch } from "../retrieval/internet-search";
import { runScholarlyResearchLookup } from "../retrieval/scholarly-research-lookup";
import { runScholarlyFullTextFetch } from "../retrieval/scholarly-full-text-fetch";
import { runScholarlyNumericParameterExtraction } from "../retrieval/scholarly-numeric-parameters";
import { recordInterimVoiceCalloutRequest } from "../interim-voice-callout-store";
import {
  isVoiceClientHandoffReceipt,
  mapInterimVoiceReceiptToGatewayPlaybackStatus,
} from "../voice-playback/status";
import { executeLiveEnvironmentTool } from "../live-environment-tool-adapter";
import {
  WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS,
  workstationContextFeedQuerySpecForCapability,
  type WorkstationContextFeedQueryToolContractSpec,
} from "../workstation-context-feed-query-tool-contracts";
import { buildWorkstationGatewayObservationPacket } from "./observation-packet";
import {
  buildMoralSubstrateReflectionGatewayObservation,
  moralLivingSubstrateReflectionManifest,
} from "./moral-substrate-reflection";
import {
  HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  type HelixLiveEnvironmentToolName,
} from "@shared/helix-live-agent-step";
import {
  HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
  HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
} from "@shared/helix-tool-lifecycle";
import {
  bindScientificCalculatorVariables,
  classifyScientificCalculatorExpression,
} from "@shared/scientific-calculator-workbench";
import {
  CIVILIZATION_LAYER_MODES,
  type CivilizationLayerModeV1,
} from "@shared/civilization-bounds-roadmap";
import { buildNhm2TheoryBadgeGraphV1 } from "@shared/theory/nhm2-theory-badges";
import {
  buildTheoryFrontierConjectureWorkbenchV1,
  theoryFrontierConjectureForbiddenClaimNotes,
} from "@shared/theory/theory-frontier-conjecture-workbench";
import { runHelixTheoryContextReflectionTool } from "@shared/theory/theory-context-reflection-tool";
import { runHelixAskCivilizationBoundsTool } from "../../../skills/helix-ask.civilization-bounds-roadmap";
import type {
  HelixWorkstationGatewayAdmissionRecord,
  HelixWorkstationCapabilityManifest,
  HelixWorkstationGatewayCallInput,
  HelixWorkstationGatewayCallResult,
  HelixWorkstationGatewayListInput,
  HelixWorkstationGatewayListResult,
  HelixWorkstationGatewayMode,
} from "./types";
import type { HelixAgentStepObservationPacket } from "@shared/helix-agent-step-observation-packet";
import type {
  HelixWorkstationTypedAffordance,
  HelixWorkstationTypedAffordanceKind,
} from "@shared/helix-agent-step-observation-packet";
import type {
  HelixToolFollowupDecision,
  HelixToolLifecycleTrace,
} from "@shared/helix-tool-lifecycle";

const DEFAULT_MODE: HelixWorkstationGatewayMode = "observe";
const WORKSTATION_GATEWAY_SCHEMA = "helix.workstation_tool_gateway.v1" as const;
const WORKSTATION_GATEWAY_MANIFEST_VERSION = "read-observe-act.v1" as const;
const WORKSTATION_ACTIVE_CONTEXT_CAPABILITY = "workstation.active_context" as const;
const WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA = "helix.workstation_active_context_observation.v1" as const;
const CALCULATOR_SOLVE_EXPRESSION_CAPABILITY = "scientific-calculator.solve_expression" as const;
const CALCULATOR_SOLVE_OBSERVATION_SCHEMA = "helix.calculator_solve_observation.v1" as const;
const CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY = "scientific-calculator.solve_scalar_expression" as const;
const CALCULATOR_SOLVE_SCALAR_OBSERVATION_SCHEMA = "helix.calculator_scalar_solve_observation.v1" as const;
const CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY = "scientific-calculator.classify_expression" as const;
const CALCULATOR_CLASSIFY_OBSERVATION_SCHEMA = "helix.calculator_expression_classification_observation.v1" as const;
const CALCULATOR_BIND_VARIABLES_CAPABILITY = "scientific-calculator.bind_variables" as const;
const CALCULATOR_BIND_VARIABLES_OBSERVATION_SCHEMA = "helix.calculator_variable_binding_observation.v1" as const;
const CALCULATOR_PREFILL_EXPRESSION_CAPABILITY = "scientific-calculator.prefill_expression" as const;
const CALCULATOR_ACTIVE_CONTEXT_CAPABILITY = "scientific-calculator.active_context" as const;
const CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA = "helix.calculator_active_context_observation.v1" as const;
const READABLE_SURFACE_OBSERVE_CAPABILITY = "workstation.readable_surface.observe" as const;
const READABLE_SURFACE_OBSERVATION_SCHEMA = "helix.workstation_readable_surface_observation.v1" as const;
const DOCS_READ_VISIBLE_SURFACE_CAPABILITY = "docs-viewer.read_visible_surface" as const;
const DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY = "docs-viewer.read_active_translation" as const;
const CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY = "scientific-calculator.read_visible_result" as const;
const CALCULATOR_OPEN_PANEL_CAPABILITY = "scientific-calculator.open_panel" as const;
const CALCULATOR_FOCUS_PANEL_CAPABILITY = "scientific-calculator.focus_panel" as const;
const CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY = "scientific-calculator.show_gateway_solve" as const;
const WORKSTATION_OPEN_PANEL_CAPABILITY = "workstation.open_panel" as const;
const WORKSTATION_FOCUS_PANEL_CAPABILITY = "workstation.focus_panel" as const;
const WORKSTATION_UI_ACTION_RECEIPT_SCHEMA = "helix.workstation_ui_action_receipt.v1" as const;
const REPO_SEARCH_CAPABILITY = "repo.search" as const;
const REPO_SEARCH_OBSERVATION_SCHEMA = "helix.repo_search_observation.v1" as const;
const DOCS_SEARCH_CAPABILITY = "docs.search" as const;
const DOCS_SEARCH_OBSERVATION_SCHEMA = "helix.docs_search_observation.v1" as const;
const DOCS_OPEN_DOC_CAPABILITY = "docs-viewer.open_doc" as const;
const INTERNET_SEARCH_CAPABILITY = HELIX_INTERNET_SEARCH_CAPABILITY;
const INTERNET_SEARCH_OBSERVATION_SCHEMA = HELIX_INTERNET_SEARCH_OBSERVATION_SCHEMA;
const SCHOLARLY_RESEARCH_SEARCH_CAPABILITY = HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
const SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA = HELIX_SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA;
const SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY = HELIX_SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY;
const SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA = HELIX_SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA;
const SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY = HELIX_SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY;
const SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA = HELIX_SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA;
const CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY = "civilization-bounds.reflect_system_bounds" as const;
const CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA =
  "helix.civilization_bounds_reflection_observation.v1" as const;
const THEORY_CONTEXT_REFLECTION_CAPABILITY = "theory-badge-graph.reflect_discussion_context" as const;
const THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA = "helix.theory_context_reflection_observation.v1" as const;
const THEORY_FRONTIER_CONJECTURE_CAPABILITY = "theory-badge-graph.propose_frontier_conjectures" as const;
const THEORY_FRONTIER_CONJECTURE_OBSERVATION_SCHEMA =
  "helix.theory_frontier_conjecture_observation.v1" as const;
const VOICE_INTERIM_CALLOUT_CAPABILITY = "live_env.request_interim_voice_callout" as const;
const VOICE_NARRATOR_SAY_CAPABILITY = "live_env.narrator_say" as const;
const TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY = "text_to_speech.speak_text" as const;
const VOICE_INTERIM_TOOL_RESULT_SCHEMA = "helix.interim_voice_callout_tool_result.v1" as const;
const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);
const SHARED_CONTEXT_FEED_QUERY_CAPABILITIES = new Set<string>([
  "live_env.query_visual_summaries",
  "live_env.query_trace_memory",
  "live_env.query_narrator_events",
  "live_env.query_audio_transcripts",
  "live_env.query_translation_segments",
  "live_env.query_microdeck_outputs",
  "live_env.query_live_answer_state",
  "live_env.query_packet_traces",
  "live_env.query_route_evidence",
  "live_env.query_automation_policies",
  "live_env.query_source_health",
] as const);
const LIVE_SOURCE_STATE_READ_CAPABILITIES = [
  ["live_env.query_live_source_quality", "query_live_source_quality", "Query live-source quality"],
  ["live_env.query_workstation_goal_context", "query_workstation_goal_context", "Query workstation goal context"],
  [
    "live_env.summarize_live_source_current_state",
    "summarize_live_source_current_state",
    "Summarize live-source current state",
  ],
] as const;
const SHARED_LIVE_SOURCE_STATE_READ_CAPABILITIES = new Set<string>(
  LIVE_SOURCE_STATE_READ_CAPABILITIES.map(([capabilityId]) => capabilityId),
);
const SITUATION_STAGE_STATE_READ_CAPABILITIES = [
  ["live_env.query_event_log", "query_event_log", "Query live event log"],
  ["live_env.query_world_events", "query_world_events", "Query world events"],
  ["live_env.query_navigation_state", "query_navigation_state", "Query navigation state"],
  ["live_env.query_stage_sources", "query_stage_sources", "Query stage sources"],
  ["live_env.query_constructs", "query_constructs", "Query situation constructs"],
  ["live_env.query_job_evidence", "query_job_evidence", "Query live job evidence"],
] as const;
const SHARED_SITUATION_STAGE_STATE_READ_CAPABILITIES = new Set<string>(
  SITUATION_STAGE_STATE_READ_CAPABILITIES.map(([capabilityId]) => capabilityId),
);
const LIVE_SOURCE_LOOP_HEALTH_CAPABILITY = "live_env.query_live_source_loop_health" as const;
const LIVE_SOURCE_MAILBOX_READ_CAPABILITIES = [
  ["live_env.check_live_source_mail", "check_live_source_mail", "Check live-source mail"],
  ["live_env.read_live_source_mail", "read_live_source_mail", "Read live-source mail"],
  [
    "live_env.read_processed_live_source_mail",
    "read_processed_live_source_mail",
    "Read processed live-source mail",
  ],
  [
    "live_env.reflect_live_source_mail_loop",
    "reflect_live_source_mail_loop",
    "Reflect live-source mail loop",
  ],
] as const;
const SHARED_LIVE_SOURCE_MAILBOX_READ_CAPABILITIES = new Set<string>(
  LIVE_SOURCE_MAILBOX_READ_CAPABILITIES.map(([capabilityId]) => capabilityId),
);
const LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES = [
  [
    "live_env.compare_mail_to_interpreter_profile",
    "compare_mail_to_interpreter_profile",
    "Compare mail to interpreter profile",
  ],
  [
    "live_env.validate_live_source_prediction",
    "validate_live_source_prediction",
    "Validate live-source prediction",
  ],
  [
    "live_env.predict_live_source_immediate",
    "predict_live_source_immediate",
    "Predict live-source immediate state",
  ],
  [
    "live_env.compare_live_source_prediction",
    "compare_live_source_prediction",
    "Compare live-source prediction",
  ],
] as const;
const SHARED_LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES = new Set<string>(
  LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES.map(([capabilityId]) => capabilityId),
);
const STAGE_PLAY_BUILDER_READ_CAPABILITIES = [
  ["live_env.describe_stage_builder", "describe_stage_builder", "Describe Stage Builder"],
  ["live_env.validate_stage_play_graph", "validate_stage_play_graph", "Validate Stage Play graph"],
  ["live_env.plan_stage_play_job", "plan_stage_play_job", "Plan Stage Play job"],
] as const;
const SHARED_STAGE_PLAY_BUILDER_READ_CAPABILITIES = new Set<string>(
  STAGE_PLAY_BUILDER_READ_CAPABILITIES.map(([capabilityId]) => capabilityId),
);
const MICRO_REASONER_QUERY_PRESETS_CAPABILITY = "live_env.query_micro_reasoner_presets" as const;
const MICRO_REASONER_QUERY_PROMPTS_CAPABILITY = "live_env.query_micro_reasoner_prompts" as const;
const MICRO_REASONER_TEST_PROMPT_CAPABILITY = "live_env.test_micro_reasoner_prompt" as const;
const SHARED_MICRO_REASONER_READ_CAPABILITIES = new Set<string>([
  MICRO_REASONER_QUERY_PRESETS_CAPABILITY,
  MICRO_REASONER_QUERY_PROMPTS_CAPABILITY,
  MICRO_REASONER_TEST_PROMPT_CAPABILITY,
] as const);
const VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY = "live_env.query_visual_observer_profiles" as const;
const VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY = "live_env.test_visual_observer_profile" as const;
const VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY = "live_env.compare_visual_observer_profiles" as const;
const SHARED_VISUAL_OBSERVER_READ_CAPABILITIES = new Set<string>([
  VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY,
  VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY,
  VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
] as const);
const REPO_SEARCH_DEFAULT_PATHS = ["server", "shared", "client/src", "docs"] as const;
const DOCS_SEARCH_DEFAULT_PATHS = ["docs"] as const;
const INTERNET_SEARCH_PROVIDERS = ["tavily", "exa", "google_custom_search"] as const;
const SCHOLARLY_RESEARCH_PROVIDERS = [
  "arxiv",
  "openalex",
  "crossref",
  "semantic_scholar",
  "unpaywall",
  "core",
] as const;
const SCHOLARLY_RESEARCH_MODES = [
  "paper_search",
  "doi_lookup",
  "citation_lookup",
  "reference_lookup",
] as const;
const SAFE_WORKSTATION_PANEL_ACTION_IDS = [
  "docs-viewer",
  "scientific-calculator",
  "image-lens",
  "document-image-lens",
  "workstation-process-graph",
  "workstation-task-manager",
  "workstation-storage-map",
  "workstation-workflow-timeline",
] as const;
const REPO_SEARCH_ALLOWED_PATH_PREFIXES = [
  "server",
  "shared",
  "client",
  "docs",
  "modules",
  "scripts",
  "tools",
  "packages",
] as const;
const DOCS_SEARCH_ALLOWED_PATH_PREFIXES = ["docs"] as const;

const uniqueAffordanceKinds = (
  values: Array<HelixWorkstationTypedAffordanceKind | null | undefined>,
): HelixWorkstationTypedAffordanceKind[] =>
  Array.from(new Set(values.filter((entry): entry is HelixWorkstationTypedAffordanceKind => Boolean(entry))));

const manifestProducesAffordances = (capabilityId: string): HelixWorkstationTypedAffordanceKind[] => {
  if (capabilityId === HELIX_WORKSPACE_OS_STATUS_CAPABILITY) return ["system_status", "source_ref"];
  if (capabilityId === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY || capabilityId === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY) {
    return ["active_surface_ref", "source_ref"];
  }
  if (
    capabilityId === READABLE_SURFACE_OBSERVE_CAPABILITY ||
    capabilityId === DOCS_READ_VISIBLE_SURFACE_CAPABILITY ||
    capabilityId === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
  ) {
    return ["active_surface_ref", "text_evidence", "numeric_value_evidence", "source_ref"];
  }
  if (capabilityId === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY) {
    return ["active_surface_ref", "calculator_result", "numeric_value_evidence", "source_ref"];
  }
  if (capabilityId === CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY) {
    return ["calculator_expression_template", "source_ref"];
  }
  if (capabilityId === CALCULATOR_BIND_VARIABLES_CAPABILITY) {
    return ["bound_calculator_expression", "calculator_expression_template", "source_ref"];
  }
  if (capabilityId === REPO_SEARCH_CAPABILITY) {
    return ["source_ref", "text_evidence", "citation_evidence"];
  }
  if (capabilityId === DOCS_SEARCH_CAPABILITY) {
    return ["source_ref", "text_evidence", "citation_evidence", "numeric_value_evidence"];
  }
  if (capabilityId === INTERNET_SEARCH_CAPABILITY || capabilityId === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) {
    return ["source_ref", "text_evidence", "citation_evidence"];
  }
  if (capabilityId === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) {
    return ["source_ref", "text_evidence", "citation_evidence"];
  }
  if (capabilityId === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY) {
    return ["source_ref", "text_evidence", "citation_evidence", "numeric_value_evidence"];
  }
  if (capabilityId === THEORY_CONTEXT_REFLECTION_CAPABILITY) {
    return ["theory_context", "calculator_expression_template", "claim_boundary", "source_ref"];
  }
  if (capabilityId === THEORY_FRONTIER_CONJECTURE_CAPABILITY) {
    return ["theory_context", "frontier_candidate", "claim_boundary", "source_ref"];
  }
  if (capabilityId === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) {
    return ["theory_context", "claim_boundary", "source_ref"];
  }
  if (
    capabilityId === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ||
    capabilityId === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY
  ) {
    return ["calculator_result", "numeric_value_evidence", "source_ref"];
  }
  if (
    capabilityId === CALCULATOR_OPEN_PANEL_CAPABILITY ||
    capabilityId === CALCULATOR_FOCUS_PANEL_CAPABILITY ||
    capabilityId === CALCULATOR_PREFILL_EXPRESSION_CAPABILITY ||
    capabilityId === CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY ||
    capabilityId === WORKSTATION_OPEN_PANEL_CAPABILITY ||
    capabilityId === WORKSTATION_FOCUS_PANEL_CAPABILITY ||
    capabilityId === DOCS_OPEN_DOC_CAPABILITY
  ) {
    return ["ui_projection_receipt", "source_ref"];
  }
  if (capabilityId === VOICE_INTERIM_CALLOUT_CAPABILITY || capabilityId === VOICE_NARRATOR_SAY_CAPABILITY) {
    return ["ui_projection_receipt", "source_ref"];
  }
  if (SHARED_LIVE_SOURCE_MAILBOX_READ_CAPABILITIES.has(capabilityId)) return ["mail_packet_ref", "source_ref", "text_evidence"];
  if (SHARED_LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES.has(capabilityId)) return ["prediction_evidence", "source_ref", "text_evidence"];
  if (SHARED_STAGE_PLAY_BUILDER_READ_CAPABILITIES.has(capabilityId)) return ["stage_plan", "source_ref", "text_evidence"];
  if (SHARED_MICRO_REASONER_READ_CAPABILITIES.has(capabilityId)) return ["micro_reasoner_eval", "source_ref", "text_evidence"];
  if (SHARED_VISUAL_OBSERVER_READ_CAPABILITIES.has(capabilityId)) return ["visual_observer_eval", "source_ref", "text_evidence"];
  if (capabilityId === LIVE_SOURCE_LOOP_HEALTH_CAPABILITY || SHARED_LIVE_SOURCE_STATE_READ_CAPABILITIES.has(capabilityId)) {
    return ["loop_health_evidence", "source_ref", "text_evidence"];
  }
  if (SHARED_CONTEXT_FEED_QUERY_CAPABILITIES.has(capabilityId) || SHARED_SITUATION_STAGE_STATE_READ_CAPABILITIES.has(capabilityId)) {
    return ["source_ref", "text_evidence", "active_surface_ref"];
  }
  return ["source_ref"];
};

const manifestConsumesAffordances = (capabilityId: string): HelixWorkstationTypedAffordanceKind[] => {
  if (
    capabilityId === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ||
    capabilityId === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY
  ) {
    return ["bound_calculator_expression", "calculator_expression_template", "numeric_value_evidence"];
  }
  if (capabilityId === CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY) return ["text_evidence", "source_ref"];
  if (capabilityId === CALCULATOR_BIND_VARIABLES_CAPABILITY) {
    return ["calculator_expression_template", "numeric_value_evidence", "source_ref"];
  }
  if (capabilityId === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) return ["source_ref"];
  if (capabilityId === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY) return ["text_evidence", "citation_evidence"];
  if (capabilityId === CALCULATOR_PREFILL_EXPRESSION_CAPABILITY) return ["calculator_expression_template", "source_ref"];
  if (capabilityId === CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY) return ["calculator_result"];
  if (capabilityId === DOCS_OPEN_DOC_CAPABILITY) return ["doc_path_ref", "source_ref"];
  if (
    capabilityId === CALCULATOR_OPEN_PANEL_CAPABILITY ||
    capabilityId === CALCULATOR_FOCUS_PANEL_CAPABILITY ||
    capabilityId === WORKSTATION_OPEN_PANEL_CAPABILITY ||
    capabilityId === WORKSTATION_FOCUS_PANEL_CAPABILITY
  ) {
    return ["active_surface_ref"];
  }
  if (capabilityId === VOICE_INTERIM_CALLOUT_CAPABILITY || capabilityId === VOICE_NARRATOR_SAY_CAPABILITY) {
    return ["voice_text_evidence", "text_evidence", "source_ref"];
  }
  if (capabilityId === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) {
    return ["theory_context", "source_ref"];
  }
  return [];
};

const attachManifestAffordanceContract = (
  manifest: HelixWorkstationCapabilityManifest,
): HelixWorkstationCapabilityManifest => {
  const produces = uniqueAffordanceKinds(manifestProducesAffordances(manifest.capability_id));
  const consumes = uniqueAffordanceKinds(manifestConsumesAffordances(manifest.capability_id));
  return {
    ...manifest,
    produces_affordances: produces,
    consumes_affordances: consumes,
    typed_handoff_role: produces.length > 0 && consumes.length > 0
      ? "producer_consumer"
      : produces.length > 0
        ? "producer"
        : consumes.length > 0
          ? "consumer"
          : "none",
  };
};

const cleanString = (value: unknown, fallback = ""): string => {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

const optionalString = (value: unknown): string | null => {
  const cleaned = cleanString(value);
  return cleaned || null;
};

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map((entry) => cleanString(entry)).filter(Boolean).slice(0, 32)
    : [];

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readBoolean = (value: unknown, fallback = false): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  return fallback;
};

const readFiniteNumber = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

const readCivilizationLayerMode = (value: unknown): CivilizationLayerModeV1 | undefined => {
  const cleaned = cleanString(value);
  return (CIVILIZATION_LAYER_MODES as readonly string[]).includes(cleaned)
    ? (cleaned as CivilizationLayerModeV1)
    : undefined;
};

const normalizeMode = (value: unknown): HelixWorkstationGatewayMode => {
  const mode = cleanString(value, DEFAULT_MODE).toLowerCase();
  if (mode === "read" || mode === "observe" || mode === "act" || mode === "verify") return mode;
  return DEFAULT_MODE;
};

const gatewayModeRank: Record<HelixWorkstationGatewayMode, number> = {
  observe: 2,
  read: 2,
  verify: 2,
  act: 3,
};

const permissionProfileRank: Record<HelixWorkstationCapabilityManifest["permission_profile_required"], number> = {
  observe: 1,
  read: 2,
  act: 3,
  write: 4,
  danger: 5,
};

const modeAllowsManifest = (
  mode: HelixWorkstationGatewayMode,
  manifest: HelixWorkstationCapabilityManifest,
): boolean => gatewayModeRank[mode] >= permissionProfileRank[manifest.permission_profile_required];

const normalizeGatewayCapabilityId = (value: string): string => {
  if (value === "internet.search" || value === "web.search" || value === "internet_search.web_research") {
    return INTERNET_SEARCH_CAPABILITY;
  }
  if (
    value === "scholarly.search" ||
    value === "research-papers.search" ||
    value === "research_papers.search"
  ) {
    return SCHOLARLY_RESEARCH_SEARCH_CAPABILITY;
  }
  return value;
};

const readArguments = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readRecordArray = (value: unknown): Array<Record<string, unknown>> =>
  Array.isArray(value)
    ? value.map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry))
    : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const cleaned = cleanString(value).replace(/\s+/g, " ").trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
};

const readVariableSourcePlanEntries = (value: unknown): Array<Record<string, unknown>> =>
  readRecordArray(readRecord(value)?.entries);

const buildScholarlyNumericRecoveryAffordance = (input: {
  requestedVariables: string[];
  missingVariables: string[];
  variableSourcePlan: Record<string, unknown> | null;
  sourceTargetIntent: Record<string, unknown> | null;
  sourceRef: string | null;
  paper: Record<string, unknown> | null;
  extractionMode: string;
  blockedReason: string | null;
}): Record<string, unknown> | null => {
  if (input.missingVariables.length === 0 && !input.blockedReason) return null;
  const entries = readVariableSourcePlanEntries(input.variableSourcePlan);
  const entryForVariable = (variable: string): Record<string, unknown> | null =>
    entries.find((entry) => cleanString(entry.variable).toLowerCase() === variable.toLowerCase()) ?? null;
  const expectedSourceClasses = uniqueStrings(
    input.missingVariables.flatMap((variable) =>
      readStringArray(entryForVariable(variable)?.source_classes)
    ),
  );
  const extractionAliases = uniqueStrings(
    input.missingVariables.flatMap((variable) =>
      readStringArray(entryForVariable(variable)?.extraction_aliases)
    ),
  );
  const searchTerms = uniqueStrings([
    ...input.missingVariables.flatMap((variable) => readStringArray(entryForVariable(variable)?.search_terms)),
    ...readStringArray(input.variableSourcePlan?.query_terms),
    cleanString(input.sourceTargetIntent?.target_kind),
  ]);
  const likelyFusionRate = input.missingVariables.some((variable) => /^(?:n1_m3|n2_m3|sigma_m2|v_m_s)$/i.test(variable)) ||
    searchTerms.some((term) => /\b(?:fusion|thermonuclear|reaction rate|cross section)\b/i.test(term));
  const recoveryQueries = uniqueStrings([
    likelyFusionRate
      ? "D-T fusion plasma deuterium tritium number density cross section relative velocity thermonuclear reaction rate"
      : null,
    likelyFusionRate
      ? "deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table ion density plasma temperature"
      : null,
    searchTerms.length ? searchTerms.slice(0, 12).join(" ") : null,
    input.missingVariables.length ? `${input.missingVariables.join(" ")} cited values units paper table` : null,
  ]).slice(0, 4);
  return {
    schema: "helix.scholarly_numeric_recovery_affordance.v1",
    status: "available",
    reason: input.blockedReason ?? "missing_requested_numeric_variables",
    recommended_next_capability: "scholarly-research.lookup_papers",
    followup_mode: "narrow_requery_or_ask_user",
    source_ref: input.sourceRef,
    paper: input.paper
      ? {
          title: optionalString(input.paper.title),
          url: optionalString(input.paper.url),
          doi: optionalString(readRecord(input.paper.identifiers)?.doi ?? input.paper.doi),
          arxiv_id: optionalString(readRecord(input.paper.identifiers)?.arxiv_id ?? input.paper.arxiv_id),
        }
      : null,
    requested_variables: input.requestedVariables,
    missing_variables: input.missingVariables,
    expected_variables: input.missingVariables.map((variable) => {
      const entry = entryForVariable(variable);
      return {
        variable,
        canonical_quantity: optionalString(entry?.canonical_quantity) ?? variable,
        expected_unit: optionalString(entry?.expected_unit),
        source_classes: readStringArray(entry?.source_classes),
        search_terms: readStringArray(entry?.search_terms),
        extraction_aliases: readStringArray(entry?.extraction_aliases),
      };
    }),
    expected_source_classes: expectedSourceClasses,
    extraction_aliases: extractionAliases,
    recovery_queries: recoveryQueries,
    variable_source_plan: input.variableSourcePlan,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
  };
};

const buildScholarlyFullTextRecoveryAffordance = (input: {
  query: string;
  blockedReason: string;
  paperResultId: string | null;
  paper: Record<string, unknown> | null;
  papers: Record<string, unknown>[];
  variableSourcePlan: Record<string, unknown> | null;
  sourceTargetIntent: Record<string, unknown> | null;
}): Record<string, unknown> => {
  const entries = readVariableSourcePlanEntries(input.variableSourcePlan);
  const sourceClasses = uniqueStrings(entries
    .flatMap((entry) => readStringArray(entry.source_classes)));
  const queryTerms = uniqueStrings([
    ...readStringArray(input.variableSourcePlan?.query_terms),
    ...entries.flatMap((entry) => readStringArray(entry.search_terms)),
    cleanString(input.sourceTargetIntent?.target_kind),
    input.query,
  ]);
  const likelyFusionRate = queryTerms.some((term) =>
    /\b(?:fusion|thermonuclear|reaction rate|cross section|sigma\s*v|reactivity)\b/i.test(term)
  );
  const candidateTitles = uniqueStrings([
    optionalString(input.paper?.title),
    ...input.papers.map((paper) => optionalString(paper.title)),
    input.paperResultId,
  ]).slice(0, 5);
  const recoveryQueries = uniqueStrings([
    likelyFusionRate
      ? "deuterium tritium fusion Maxwellian averaged reactivity sigma v cross section table accessible pdf"
      : null,
    likelyFusionRate
      ? "Bosch Hale fusion reactivity coefficients D T cross section full text"
      : null,
    candidateTitles.length ? candidateTitles.join(" ") : null,
    queryTerms.length ? queryTerms.slice(0, 14).join(" ") : null,
    input.query,
  ]).slice(0, 4);
  return {
    schema: "helix.scholarly_full_text_recovery_affordance.v1",
    status: "available",
    reason: input.blockedReason,
    recommended_next_capability: "scholarly-research.lookup_papers",
    followup_mode: "narrow_requery_for_fetchable_source",
    paper_result_id: input.paperResultId,
    paper: input.paper
      ? {
          title: optionalString(input.paper.title),
          url: optionalString(input.paper.url),
          doi: optionalString(readRecord(input.paper.identifiers)?.doi ?? input.paper.doi),
          arxiv_id: optionalString(readRecord(input.paper.identifiers)?.arxiv_id ?? input.paper.arxiv_id),
        }
      : null,
    candidate_titles: candidateTitles,
    expected_source_classes: sourceClasses,
    recovery_queries: recoveryQueries,
    variable_source_plan: input.variableSourcePlan,
    assistant_answer: false,
    raw_content_included: false,
    terminal_eligible: false,
    post_tool_model_step_required: true,
  };
};

const isLikelyScholarlyFullTextUrl = (value: unknown): boolean => {
  const url = optionalString(value);
  return Boolean(url && /^https?:\/\//i.test(url) && (/\.(?:pdf|html?|txt)(?:[?#].*)?$/i.test(url) || /arxiv\.org\/(?:pdf|abs)\//i.test(url)));
};

const hasFetchableScholarlyPaperIdentity = (paper: Record<string, unknown> | null): boolean => {
  if (!paper) return false;
  const identifiers = readRecord(paper.identifiers);
  return Boolean(
    isLikelyScholarlyFullTextUrl(identifiers?.pdf_url) ||
      isLikelyScholarlyFullTextUrl(identifiers?.full_text_url) ||
      isLikelyScholarlyFullTextUrl(identifiers?.url) ||
      optionalString(identifiers?.arxiv_id),
  );
};

const readSafeWorkstationPanelId = (value: unknown): string | null => {
  const panelId = cleanString(value).replace(/[^a-z0-9_-]/gi, "").trim();
  return SAFE_WORKSTATION_PANEL_ACTION_IDS.some((allowed) => allowed === panelId) ? panelId : null;
};

const readBoundedPanelIdArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => cleanString(entry).replace(/[^a-z0-9_-]/gi, "").trim())
        .filter(Boolean)
        .slice(0, 24)
    : [];

const readBoundedWorkspaceActiveContext = (value: unknown): {
  active_panel: string | null;
  active_group_id: string | null;
  group_count: number | null;
  open_panels: string[];
} => {
  const record = readRecord(value) ?? {};
  const groupCount = Number(record.groupCount ?? record.group_count);
  return {
    active_panel: cleanString(record.activePanel ?? record.active_panel) || null,
    active_group_id: cleanString(record.activeGroupId ?? record.active_group_id) || null,
    group_count: Number.isFinite(groupCount) ? Math.max(0, Math.min(Math.floor(groupCount), 32)) : null,
    open_panels: readBoundedPanelIdArray(record.openPanels ?? record.open_panels),
  };
};

const normalizeNumberText = (value: number): string => {
  if (!Number.isFinite(value)) return String(value);
  if (value !== 0 && (Math.abs(value) >= 1e6 || Math.abs(value) < 1e-3)) {
    return value.toExponential(6).replace(/\.?0+e/, "e");
  }
  return Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(12)));
};

const normalizeCalculatorExpressionForGateway = (expression: string): string => {
  const trimmed = expression.trim();
  if (!trimmed) return "";
  const phrase = trimmed
    .replace(/[?]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const percentOf = phrase.match(
    /^(?:what\s+is\s+)?(-?\d+(?:\.\d+)?)\s*(?:%|percent)\s+of\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/i,
  );
  if (percentOf) {
    return `(${percentOf[1]} / 100) * ${percentOf[2]}`;
  }
  return expression;
};

const solveSafeArithmeticExpression = (expression: string): {
  ok: boolean;
  result?: string;
  normalized_expression?: string;
  blocked_reason?: string;
} => {
  const normalizedExpression = normalizeCalculatorExpressionForGateway(expression);
  const normalized = normalizedExpression.replace(/\s+/g, "");
  if (!normalized) return { ok: false, blocked_reason: "missing_expression" };
  if (normalized.length > 240) return { ok: false, blocked_reason: "expression_too_long" };
  if (!/^[\deE.+\-*/^()%]+$/.test(normalized)) {
    return { ok: false, blocked_reason: "unsupported_expression_syntax" };
  }
  if (!/[+\-*/^%]/.test(normalized)) {
    return { ok: false, blocked_reason: "expression_has_no_operator" };
  }
  try {
    const value = Function(`"use strict"; return (${normalized.replace(/\^/g, "**")});`)();
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, blocked_reason: "expression_result_not_finite" };
    }
    return {
      ok: true,
      result: normalizeNumberText(value),
      normalized_expression: normalizedExpression,
    };
  } catch {
    return { ok: false, blocked_reason: "expression_evaluation_failed" };
  }
};

const extractScalarSolveTarget = (expression: string): {
  expression: string;
  scalar_expression: string;
  result_symbol: string | null;
  blocked_reason?: string;
} => {
  const cleanedExpression = cleanString(expression);
  if (!cleanedExpression) {
    return {
      expression: cleanedExpression,
      scalar_expression: "",
      result_symbol: null,
      blocked_reason: "missing_expression",
    };
  }
  const equationParts = cleanedExpression.split("=");
  if (equationParts.length === 1) {
    return {
      expression: cleanedExpression,
      scalar_expression: cleanedExpression,
      result_symbol: null,
    };
  }
  if (equationParts.length !== 2) {
    return {
      expression: cleanedExpression,
      scalar_expression: "",
      result_symbol: null,
      blocked_reason: "unsupported_expression_syntax",
    };
  }
  const resultSymbol = cleanString(equationParts[0]);
  const scalarExpression = cleanString(equationParts[1]);
  if (!resultSymbol || !scalarExpression) {
    return {
      expression: cleanedExpression,
      scalar_expression: scalarExpression,
      result_symbol: resultSymbol || null,
      blocked_reason: "missing_expression",
    };
  }
  return {
    expression: cleanedExpression,
    scalar_expression: scalarExpression,
    result_symbol: resultSymbol,
  };
};

const CALCULATOR_TEMPLATE_CONSTANTS = new Set(["e_charge", "mu0", "pi", "e"]);

const extractCalculatorTemplateVariables = (expression: string): string[] => {
  const rightHandSide = expression.includes("=") ? expression.split("=").slice(1).join("=") : expression;
  return Array.from(new Set(
    Array.from(rightHandSide.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
      .map((match) => match[0])
      .filter((symbol) => !CALCULATOR_TEMPLATE_CONSTANTS.has(symbol))
      .filter((symbol) => !["sqrt", "ln", "log", "sin", "cos", "tan"].includes(symbol)),
  ));
};

const typedAffordance = (input: {
  kind: HelixWorkstationTypedAffordanceKind;
  role: HelixWorkstationTypedAffordance["role"];
  capabilityId: string;
  status?: HelixWorkstationTypedAffordance["status"];
  expression?: string | null;
  normalizedExpression?: string | null;
  result?: string | null;
  variables?: string[];
  requiredInputs?: string[];
  missingInputs?: string[];
  sourceRefs?: string[];
  claimBoundary?: string | null;
}): HelixWorkstationTypedAffordance => ({
  schema: "helix.workstation_typed_affordance.v1",
  kind: input.kind,
  role: input.role,
  source_capability: input.capabilityId,
  ...(input.expression ? { expression: input.expression } : {}),
  ...(input.normalizedExpression ? { normalized_expression: input.normalizedExpression } : {}),
  ...(input.result !== undefined ? { result: input.result } : {}),
  ...(input.variables?.length ? { variables: input.variables } : {}),
  ...(input.requiredInputs?.length ? { required_inputs: input.requiredInputs } : {}),
  ...(input.missingInputs?.length ? { missing_inputs: input.missingInputs } : {}),
  ...(input.sourceRefs?.length ? { source_refs: input.sourceRefs } : {}),
  ...(input.claimBoundary !== undefined ? { claim_boundary: input.claimBoundary } : {}),
  status: input.status ?? "available",
  assistant_answer: false,
  raw_content_included: false,
});

const buildGatewayProducedAffordances = (input: {
  capabilityId: string;
  observation: Record<string, unknown>;
}): HelixWorkstationTypedAffordance[] => {
  const status = cleanString(input.observation.status);
  const available = status !== "blocked" && status !== "failed" && status !== "missing_input";
  const baseStatus: HelixWorkstationTypedAffordance["status"] = available ? "available" : "blocked";
  if (input.capabilityId === THEORY_CONTEXT_REFLECTION_CAPABILITY) {
    const payloads = readRecordArray(input.observation.calculator_payloads).slice(0, 12);
    return [
      typedAffordance({
        kind: "theory_context",
        role: "producer",
        capabilityId: input.capabilityId,
        status: baseStatus,
        sourceRefs: readStringArray(input.observation.exact_badge_ids).slice(0, 12),
        claimBoundary: readStringArray(input.observation.claim_boundary_notes)[0] ?? null,
      }),
      ...payloads.map((payload): HelixWorkstationTypedAffordance => {
        const expression = cleanString(payload.expression);
        const requiredInputs = extractCalculatorTemplateVariables(expression);
        return typedAffordance({
          kind: "calculator_expression_template",
          role: "producer",
          capabilityId: input.capabilityId,
          status: expression ? "available" : "missing",
          expression,
          variables: requiredInputs,
          requiredInputs,
          sourceRefs: [
            cleanString(payload.badge_id),
            cleanString(payload.payload_id),
          ].filter(Boolean),
          claimBoundary: readStringArray(payload.claim_boundary_notes)[0] ?? null,
        });
      }),
      ...(readStringArray(input.observation.claim_boundary_notes).length > 0
        ? [typedAffordance({
            kind: "claim_boundary",
            role: "producer",
            capabilityId: input.capabilityId,
            status: "available",
            sourceRefs: readStringArray(input.observation.claim_boundary_notes).slice(0, 8),
            claimBoundary: readStringArray(input.observation.claim_boundary_notes)[0] ?? null,
          })]
        : []),
    ];
  }
  if (input.capabilityId === THEORY_FRONTIER_CONJECTURE_CAPABILITY) {
    return [
      typedAffordance({ kind: "frontier_candidate", role: "producer", capabilityId: input.capabilityId, status: baseStatus }),
      typedAffordance({ kind: "claim_boundary", role: "producer", capabilityId: input.capabilityId, status: baseStatus }),
    ];
  }
  if (
    input.capabilityId === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ||
    input.capabilityId === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY
  ) {
    const expression = cleanString(input.observation.expression);
    const normalizedExpression = cleanString(input.observation.normalized_expression);
    const result = cleanString(input.observation.result);
    return [
      typedAffordance({
        kind: "calculator_result",
        role: "producer",
        capabilityId: input.capabilityId,
        status: available ? "available" : "blocked",
        expression,
        normalizedExpression,
        result: result || null,
      }),
      ...(available
        ? [typedAffordance({
            kind: "numeric_value_evidence",
            role: "producer",
            capabilityId: input.capabilityId,
            expression,
            normalizedExpression,
            result,
          })]
        : []),
    ];
  }
  if (input.capabilityId === CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY) {
    const expression = cleanString(input.observation.expression);
    const normalizedExpression = cleanString(input.observation.normalized_expression);
    const variables = readStringArray(input.observation.detected_symbols);
    return [
      typedAffordance({
        kind: "calculator_expression_template",
        role: "producer",
        capabilityId: input.capabilityId,
        status: available ? "available" : "blocked",
        expression,
        normalizedExpression,
        variables,
        requiredInputs: readStringArray(input.observation.missing_variables),
        missingInputs: readStringArray(input.observation.missing_variables),
      }),
      typedAffordance({
        kind: "source_ref",
        role: "producer",
        capabilityId: input.capabilityId,
        status: available ? "available" : "blocked",
      }),
    ];
  }
  if (input.capabilityId === CALCULATOR_BIND_VARIABLES_CAPABILITY) {
    const expression = cleanString(input.observation.expression);
    const normalizedExpression = cleanString(input.observation.bound_expression ?? input.observation.normalized_expression);
    const missingInputs = readStringArray(input.observation.missing_variables);
    const requiredInputs = readStringArray(input.observation.required_symbols);
    return [
      typedAffordance({
        kind: "bound_calculator_expression",
        role: "producer",
        capabilityId: input.capabilityId,
        status: available ? "available" : "blocked",
        expression,
        normalizedExpression,
        variables: requiredInputs,
        requiredInputs,
        missingInputs,
      }),
      typedAffordance({
        kind: "calculator_expression_template",
        role: "producer",
        capabilityId: input.capabilityId,
        status: "available",
        expression,
        normalizedExpression: cleanString(input.observation.normalized_expression),
        variables: requiredInputs,
        requiredInputs,
        missingInputs,
      }),
      typedAffordance({
        kind: "source_ref",
        role: "producer",
        capabilityId: input.capabilityId,
        status: available ? "available" : "blocked",
      }),
    ];
  }
  return manifestProducesAffordances(input.capabilityId).map((kind) =>
    typedAffordance({
      kind,
      role: "producer",
      capabilityId: input.capabilityId,
      status: baseStatus,
    }),
  );
};

const buildGatewayConsumedAffordances = (input: {
  capabilityId: string;
  observation: Record<string, unknown>;
}): HelixWorkstationTypedAffordance[] => {
  const status = cleanString(input.observation.status);
  const blocked = status === "blocked" || status === "failed" || status === "missing_input";
  const consumes = manifestConsumesAffordances(input.capabilityId);
  if (
    input.capabilityId === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY ||
    input.capabilityId === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY
  ) {
    const expression = cleanString(input.observation.expression);
    const requiredKinds = input.capabilityId === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY || /[A-Za-z_]/.test(expression)
      ? ["bound_calculator_expression" as const]
      : [];
    return [
      ...requiredKinds.map((kind) => typedAffordance({
        kind,
        role: "consumer",
        capabilityId: input.capabilityId,
        status: blocked ? "missing" : "available",
        expression,
        missingInputs: blocked ? [kind] : [],
      })),
      ...consumes
        .filter((kind) => !requiredKinds.includes(kind as "bound_calculator_expression"))
        .map((kind) => typedAffordance({
          kind,
          role: "consumer",
          capabilityId: input.capabilityId,
          status: "required",
        })),
    ];
  }
  return consumes.map((kind) =>
    typedAffordance({
      kind,
      role: "consumer",
      capabilityId: input.capabilityId,
      status: "required",
    }),
  );
};

const normalizeRepoSearchQuery = (value: unknown): string => {
  const query = cleanString(value).replace(/\s+/g, " ");
  return query.length > 180 ? query.slice(0, 180).trim() : query;
};

const normalizeExternalSearchQuery = (value: unknown): string => {
  const query = cleanString(value).replace(/\s+/g, " ");
  return query.length > 260 ? query.slice(0, 260).trim() : query;
};

const readInternetSearchProviders = (value: unknown): HelixInternetSearchProvider[] =>
  readStringArray(value)
    .filter((entry): entry is HelixInternetSearchProvider =>
      (INTERNET_SEARCH_PROVIDERS as readonly string[]).includes(entry),
    )
    .slice(0, 3);

const readScholarlyResearchProviders = (value: unknown): HelixScholarlyResearchProvider[] =>
  readStringArray(value)
    .filter((entry): entry is HelixScholarlyResearchProvider =>
      (SCHOLARLY_RESEARCH_PROVIDERS as readonly string[]).includes(entry),
    )
    .slice(0, 6);

const readScholarlyResearchMode = (value: unknown): HelixScholarlyResearchIntentMode | undefined => {
  const mode = cleanString(value);
  return (SCHOLARLY_RESEARCH_MODES as readonly string[]).includes(mode)
    ? (mode as HelixScholarlyResearchIntentMode)
    : undefined;
};

const readCalculatorNumericBindingEvidence = (value: unknown): Array<{
  symbol: string;
  value: string | number;
  unit?: string | null;
  dimension_signature?: string | null;
  source_refs?: string[];
  meaning?: string | null;
}> =>
  readRecordArray(value).map((record) => ({
    symbol: cleanString(record.symbol ?? record.variable ?? record.name),
    value: typeof record.value === "number" ? record.value : cleanString(record.value ?? record.numeric_value ?? record.result),
    unit: optionalString(record.unit),
    dimension_signature: optionalString(record.dimension_signature ?? record.dimension),
    source_refs: readStringArray(record.source_refs ?? record.sourceRefs ?? record.refs),
    meaning: optionalString(record.meaning ?? record.quantity),
  })).filter((entry) => Boolean(entry.symbol));

const readStringRecord = (value: unknown): Record<string, string | null> => {
  const record = readRecord(value);
  if (!record) return {};
  return Object.fromEntries(
    Object.entries(record)
      .map(([key, entry]) => [key, optionalString(entry)] as const),
  );
};

const readExternalSearchLimit = (value: unknown): number => {
  const limit = Number(value);
  return Number.isFinite(limit) ? Math.max(1, Math.min(Math.floor(limit), 10)) : 5;
};

const readInternetSearchRecencyDays = (value: unknown): number | null => {
  const days = Number(value);
  return Number.isFinite(days) && days > 0 ? Math.max(1, Math.min(Math.floor(days), 365)) : null;
};

const readInternetSearchDomains = (value: unknown): string[] =>
  readStringArray(value)
    .map((entry) => entry.toLowerCase().replace(/^site:/i, "").trim())
    .filter((entry) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(entry))
    .slice(0, 8);

const isSafeRelativeRepoPath = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  if (/^[a-z]:\//i.test(normalized)) return false;
  return REPO_SEARCH_ALLOWED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
};

const readRepoSearchPaths = (value: unknown): string[] => {
  const requested = readStringArray(value)
    .map((entry) => entry.replace(/\\/g, "/").replace(/^\/+/, "").trim())
    .filter(isSafeRelativeRepoPath)
    .slice(0, 8);
  return requested.length > 0 ? requested : [...REPO_SEARCH_DEFAULT_PATHS];
};

const readRepoSearchMaxHits = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(Math.floor(parsed), 20)) : 8;
};

const isSafeRelativeDocsPath = (value: string): boolean => {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+/, "").trim();
  if (!normalized) return false;
  if (normalized.includes("..")) return false;
  if (/^[a-z]:\//i.test(normalized)) return false;
  return DOCS_SEARCH_ALLOWED_PATH_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
};

const readDocsSearchPaths = (value: unknown): string[] => {
  const requested = readStringArray(value)
    .map((entry) => entry.replace(/\\/g, "/").replace(/^\/+/, "").trim())
    .filter(isSafeRelativeDocsPath)
    .slice(0, 8);
  return requested.length > 0 ? requested : [...DOCS_SEARCH_DEFAULT_PATHS];
};

const readDocsActionPath = (value: unknown): string | null => {
  const path = cleanString(value).replace(/\\/g, "/").replace(/^\/+/, "").trim();
  return isSafeRelativeDocsPath(path) ? path : null;
};

const readDocsActionAnchor = (value: unknown): string | null => {
  const anchor = cleanString(value).replace(/[\r\n]/g, " ").trim();
  return anchor ? anchor.slice(0, 180) : null;
};

const clipObservationText = (value: unknown, maxChars = 800): string | null => {
  const text = cleanString(value).replace(/\s+/g, " ");
  return text ? text.slice(0, maxChars).trim() : null;
};

const readBoundedCalculatorActiveContext = (value: unknown): {
  current_latex: string | null;
  last_result_text: string | null;
  last_normalized_expression: string | null;
  last_trace_id: string | null;
  last_ok: boolean | null;
  step_count: number | null;
  recent_debug_events: Record<string, unknown>[];
} => {
  const record = readRecord(value) ?? {};
  const stepCount = Number(record.step_count ?? record.stepCount);
  const recentDebugEventsValue = record.recent_debug_events ?? record.recentDebugEvents;
  const recentDebugEvents = Array.isArray(recentDebugEventsValue)
    ? recentDebugEventsValue
        .map(readRecord)
        .filter((entry): entry is Record<string, unknown> => Boolean(entry))
        .slice(0, 5)
        .map((entry) => ({
          action_id: clipObservationText(entry.action_id, 120),
          ok: typeof entry.ok === "boolean" ? entry.ok : null,
          input_latex: clipObservationText(entry.input_latex, 400),
          result_text: clipObservationText(entry.result_text, 400),
          normalized_expression: clipObservationText(entry.normalized_expression, 400),
          message: clipObservationText(entry.message, 240),
          ts: clipObservationText(entry.ts, 120),
        }))
    : [];
  return {
    current_latex: clipObservationText(record.current_latex ?? record.currentLatex),
    last_result_text: clipObservationText(record.last_result_text ?? record.lastResultText),
    last_normalized_expression: clipObservationText(record.last_normalized_expression ?? record.lastNormalizedExpression),
    last_trace_id: clipObservationText(record.last_trace_id ?? record.lastTraceId, 240),
    last_ok: typeof record.last_ok === "boolean" ? record.last_ok : typeof record.lastOk === "boolean" ? record.lastOk : null,
    step_count: Number.isFinite(stepCount) ? Math.max(0, Math.min(Math.floor(stepCount), 200)) : null,
    recent_debug_events: recentDebugEvents,
  };
};

const normalizeDocsObservationLine = (line: string): string => {
  const normalized = line
    .normalize("NFKC")
    .replace(/[\u200b\u200c\u200d\ufeff]/g, "")
    .replace(/[ \t]+/g, " ")
    .trimEnd();
  const codeSpanMatches = [...normalized.matchAll(/`([^`\n]{1,120})`/g)];
  if (codeSpanMatches.length < 2) return normalized;

  let deduped = normalized;
  const seen = new Map<string, string>();
  for (const match of codeSpanMatches) {
    const full = match[0];
    const body = match[1] ?? "";
    const key = body.replace(/\s+/g, "").toLowerCase();
    if (!key) continue;
    const prior = seen.get(key);
    if (!prior) {
      seen.set(key, full);
      continue;
    }
    deduped = deduped.replace(full, "");
  }
  return deduped.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trimEnd();
};

export const normalizeDocsObservationExcerptText = (text: string): string => {
  const normalizedLines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(normalizeDocsObservationLine)
    .filter((line) => line.trim().length > 0);
  return normalizedLines.join("\n").trim();
};

const readBoundedDocsExcerpt = (paths: string[]): {
  path: string;
  excerpt: string;
  excerpt_char_count: number;
  truncated: boolean;
} | null => {
  const exactPath = paths.find((entry) => /^docs\/.+\.md$/i.test(entry));
  if (!exactPath) return null;
  const workspaceRoot = process.cwd();
  const absolutePath = path.resolve(workspaceRoot, exactPath);
  const docsRoot = path.resolve(workspaceRoot, "docs");
  if (absolutePath !== docsRoot && !absolutePath.startsWith(`${docsRoot}${path.sep}`)) return null;
  let text = "";
  try {
    text = readFileSync(absolutePath, "utf8");
  } catch {
    return null;
  }
  const cleaned = normalizeDocsObservationExcerptText(text)
    .split("\n")
    .slice(0, 60)
    .join("\n")
    .trim();
  if (!cleaned) return null;
  const maxChars = 3200;
  const excerpt = cleaned.length > maxChars ? cleaned.slice(0, maxChars).trimEnd() : cleaned;
  return {
    path: exactPath,
    excerpt,
    excerpt_char_count: excerpt.length,
    truncated: cleaned.length > excerpt.length || text.length > cleaned.length,
  };
};

const readBoundedTranslationBlocks = (value: unknown): Array<Record<string, unknown>> => {
  const entries = Array.isArray(value) ? value : [];
  return entries
    .map(readRecord)
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .slice(0, 12)
    .map((entry) => ({
      unit_id: clipObservationText(entry.unit_id ?? entry.unitId, 160),
      source_unit_id: clipObservationText(entry.source_unit_id ?? entry.sourceUnitId ?? entry.unit_id ?? entry.unitId, 160),
      source_text: clipObservationText(entry.source_text ?? entry.sourceText, 700),
      translated_text: clipObservationText(entry.translated_text ?? entry.translatedText ?? entry.text, 900),
      locale: clipObservationText(entry.locale ?? entry.target_locale ?? entry.targetLocale, 80),
      status: clipObservationText(entry.status, 80),
    }))
    .filter((entry) => Boolean(entry.translated_text));
};

const readSurfaceTextFromArgs = (args: Record<string, unknown>): string | null =>
  clipObservationText(
    args.text ??
      args.surface_text ??
      args.surfaceText ??
      args.visible_text ??
      args.visibleText ??
      args.selected_text ??
      args.selectedText ??
      args.hovered_text ??
      args.hoveredText ??
      args.translated_text ??
      args.translatedText,
    1200,
  );

const buildReadableSurfacePayload = (input: {
  capabilityId: string;
  args: Record<string, unknown>;
  fallbackPanelId: string;
  fallbackActionId: string;
}): {
  observation: Record<string, unknown>;
  ok: boolean;
  blockedReason?: string;
  summaryText: string;
  panelId: string;
  actionId: string;
} => {
  const args = input.args;
  const requestedSurface = cleanString(args.surface ?? args.surface_id ?? args.surfaceId ?? args.label);
  const panelId = cleanString(args.panel_id ?? args.panelId, input.fallbackPanelId);
  const actionId = cleanString(args.action_id ?? args.actionId, input.fallbackActionId);
  const selectionRef = optionalString(
    args.selection_ref ??
      args.selectionRef ??
      args.narrator_source_id ??
      args.narratorSourceId ??
      args.source_id ??
      args.sourceId,
  );
  const selectionKind = cleanString(args.selection_kind ?? args.selectionKind).toLowerCase();
  const selectedOrHoveredRequested = Boolean(
    args.selected_text ??
      args.selectedText ??
      args.hovered_text ??
      args.hoveredText ??
      (
        /\b(?:selected|hovered|highlighted|narrator[-_\s]?source)\b/i.test(requestedSurface) ||
        selectionKind === "selected" ||
        selectionKind === "hovered"
      ),
  );
  const sourceDocPath = readDocsActionPath(args.source_doc_path ?? args.sourceDocPath ?? args.path);
  const activeDocExcerpt = sourceDocPath ? readBoundedDocsExcerpt([sourceDocPath]) : null;
  const translationBlocks = readBoundedTranslationBlocks(args.translation_blocks ?? args.translationBlocks);
  const activeContext = readBoundedCalculatorActiveContext(args.active_context ?? args.activeContext);
  const visibleResult = clipObservationText(
    args.result ??
      args.visible_result ??
      args.visibleResult ??
      activeContext.last_result_text,
    700,
  );
  const expression = clipObservationText(
    args.expression ??
      args.current_expression ??
      args.currentExpression ??
      activeContext.last_normalized_expression ??
      activeContext.current_latex,
    700,
  );
  const translatedBlocksText = translationBlocks
    .map((entry) => optionalString(entry.translated_text))
    .filter(Boolean)
    .join("\n")
    .trim();
  const translatedText = readSurfaceTextFromArgs(args) ?? (translatedBlocksText || null);
  const surfaceText =
    input.capabilityId === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY
      ? visibleResult
      : input.capabilityId === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
        ? translatedText
        : readSurfaceTextFromArgs(args) ?? activeDocExcerpt?.excerpt ?? translatedText ?? visibleResult;
  const missingReason =
    input.capabilityId === DOCS_READ_VISIBLE_SURFACE_CAPABILITY && selectedOrHoveredRequested && !selectionRef
      ? "registered_surface_ref_missing"
      : input.capabilityId === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY && !surfaceText
      ? "translation_surface_missing"
      : input.capabilityId === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY && !visibleResult
        ? "calculator_visible_result_missing"
        : !surfaceText
          ? "registered_surface_text_missing"
          : null;
  const sourceRefs = readStringArray(args.source_refs ?? args.sourceRefs);
  const unitRefs = readStringArray(args.unit_refs ?? args.unitRefs);
  const lineRefs = readStringArray(args.line_refs ?? args.lineRefs);
  const locale = clipObservationText(args.locale ?? args.target_locale ?? args.targetLocale, 80);
  const observation = {
    schema: READABLE_SURFACE_OBSERVATION_SCHEMA,
    capability_key: input.capabilityId,
    canonical_capability_key: READABLE_SURFACE_OBSERVE_CAPABILITY,
    panel_id: panelId,
    action_id: actionId,
    surface_id: requestedSurface || `${panelId}:${actionId}`,
    label: clipObservationText(args.label ?? requestedSurface, 180),
    status: missingReason ? "blocked" : "succeeded",
    blocked_reason: missingReason,
    text: surfaceText,
    text_char_count: surfaceText?.length ?? 0,
    max_chars: 1200,
    truncated: Boolean(surfaceText && surfaceText.length >= 1200),
    source_refs: sourceRefs,
    line_refs: lineRefs,
    unit_refs: unitRefs,
    selection_ref: selectionRef,
    selection_kind: selectedOrHoveredRequested ? selectionKind || "selected_or_hovered" : null,
    source_doc_path: sourceDocPath ?? activeDocExcerpt?.path ?? null,
    source_excerpt_available: Boolean(activeDocExcerpt),
    translation: input.capabilityId === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY
      ? {
          locale,
          status: missingReason ? "missing" : "ready",
          blocks: translationBlocks,
          missing_unit_info: readStringArray(args.missing_unit_info ?? args.missingUnitInfo),
          source_unit_ids: translationBlocks.map((entry) => optionalString(entry.source_unit_id)).filter(Boolean),
        }
      : null,
    calculator: input.capabilityId === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY
      ? {
          expression,
          result: visibleResult,
          result_source: visibleResult ? "visible_result_region" : null,
          draft_input_distinguished: true,
        }
      : null,
    sensitive_blocked: false,
    observation_role: "evidence_not_assistant_answer",
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    observation,
    ok: !missingReason,
    blockedReason: missingReason ?? undefined,
    summaryText: missingReason
      ? `Readable surface observation blocked: ${missingReason}.`
      : `Readable surface observation materialized ${surfaceText?.length ?? 0} bounded character(s) from ${panelId}.`,
    panelId,
    actionId,
  };
};

const readCompoundReadAloudResolvedDocsPath = (
  sourceTargetIntent: unknown,
  documentCandidates: Array<{ path?: string }>,
): string | null => {
  const intent = readRecord(sourceTargetIntent);
  if (intent?.compound_outcome !== "read_aloud_doc_excerpt" && intent?.compound_outcome !== "read_aloud_surface") return null;
  const pathCandidate = documentCandidates
    .map((candidate) => cleanString(candidate.path))
    .find((candidate) => /^docs\/.+\.md$/i.test(candidate));
  return pathCandidate ?? null;
};

const clipRepoSearchHit = (hit: RepoSearchHit): RepoSearchHit => ({
  ...hit,
  filePath: hit.filePath.replace(/\\/g, "/"),
  text: hit.text.length > 180 ? `${hit.text.slice(0, 177)}...` : hit.text,
});

const buildAdmission = (input: {
  capabilityId: string;
  agentRuntime: string;
  permissionProfile: HelixWorkstationGatewayAdmissionRecord["permission_profile"];
  status: HelixWorkstationGatewayAdmissionRecord["admission_status"];
  reason: string;
  blockedReason?: string;
  sourceTargetIntent?: unknown;
}): HelixWorkstationGatewayAdmissionRecord => ({
  schema: "helix.workstation_tool_gateway.admission.v1",
  requested_capability: input.capabilityId,
  selected_agent_provider: input.agentRuntime,
  permission_profile: input.permissionProfile,
  source_target_intent: input.sourceTargetIntent,
  admission_status: input.status,
  admission_reason: input.reason,
  blocked_reason: input.blockedReason,
  assistant_answer: false,
  raw_content_included: false,
});

const buildGatewayTrace = (input: {
  turnId: string;
  capabilityId: string;
  agentRuntime: string;
  admission: HelixWorkstationGatewayAdmissionRecord;
  observationPacket: HelixAgentStepObservationPacket;
  error?: string;
}): {
  tool_lifecycle_trace: HelixToolLifecycleTrace;
  tool_followup_decision: HelixToolFollowupDecision;
} => {
  const status = input.observationPacket.status;
  const completed = status === "succeeded";
  const failed = status === "failed";
  const blocked = !failed && (status === "blocked" || input.admission.admission_status === "blocked");
  const traceRef = `${input.turnId}:workstation_gateway:${input.capabilityId}:tool_lifecycle_trace`;
  const observationRefs = input.observationPacket.produced_artifact_refs;
  const retryRecommendation = blocked
    ? "ask_user"
    : failed
      ? "retry_same_tool"
      : "allow_terminal";
  const nextAction = blocked
    ? "ask_user"
    : failed
      ? "retry"
      : "continue_reasoning";
  const lifecycleTrace: HelixToolLifecycleTrace = {
    schema: HELIX_TOOL_LIFECYCLE_TRACE_SCHEMA,
    turn_id: input.turnId,
    tool_call_id: input.observationPacket.call_id,
    tool_family: "workstation_tool_gateway",
    requested_capability: input.admission.requested_capability,
    admitted_capability: input.admission.admission_status === "admitted" ? input.capabilityId : null,
    executed_capability: blocked ? null : input.capabilityId,
    lifecycle_stage: blocked ? "blocked" : completed ? "completed" : failed ? "failed" : "started",
    status: blocked ? "blocked" : completed ? "completed" : failed ? "failed" : "running",
    session_ref: input.agentRuntime,
    process_ref: null,
    observation_refs: observationRefs,
    receipt_refs: [],
    evidence_refs: observationRefs,
    failure_reason: input.error ?? input.admission.blocked_reason ?? null,
    retry_recommendation: retryRecommendation,
    fallback_used: false,
    fallback_equivalent: false,
    terminal_eligible: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const followupDecision: HelixToolFollowupDecision = {
    schema: HELIX_TOOL_FOLLOWUP_DECISION_SCHEMA,
    turn_id: input.turnId,
    prior_tool_trace_ref: traceRef,
    observation_summary: input.observationPacket.observation_summary,
    next_action: nextAction,
    reason: blocked
      ? input.admission.blocked_reason ?? "gateway_call_blocked"
      : failed
        ? input.error ?? "gateway_call_failed"
        : "gateway_observation_requires_provider_reasoning_reentry",
    external_change_required: false,
    terminal_blockers: ["post_tool_model_step_required", "terminal_authority_not_evaluated"],
    required_surface_satisfied: completed,
    evidence_reentered: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  return {
    tool_lifecycle_trace: lifecycleTrace,
    tool_followup_decision: followupDecision,
  };
};

const workspaceOsStatusManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: HELIX_WORKSPACE_OS_STATUS_CAPABILITY,
  label: "Workspace OS status",
  description:
    "Reads sanitized workspace capability, binding, fallback, and runtime-memory status. It does not execute browser, clipboard, shell, filesystem, or workstation actions.",
  panel_id: "workspace-os",
  action_id: "status",
  mode: "observe",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "observe",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      thread_id: { type: "string" },
      room_id: { type: "string" },
      capability_ids: { type: "array", items: { type: "string" } },
    },
  },
  output_observation_schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  observation_schema: HELIX_WORKSPACE_OS_STATUS_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "diagnostic_only", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const workstationActiveContextManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: WORKSTATION_ACTIVE_CONTEXT_CAPABILITY,
  label: "Workstation active context",
  description:
    "Reads bounded active/open workstation panel identity supplied by the Ask turn context snapshot. It is observation-only and cannot mutate or answer.",
  panel_id: "workstation",
  action_id: "active_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      workspace_context: { type: "object" },
    },
  },
  output_observation_schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  observation_schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "workstation_context", "active_context", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorSolveExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator solve expression",
  description:
    "Evaluates a simple arithmetic expression as read-only calculator evidence. It does not run shell code, mutate files, or become a final answer.",
  panel_id: "scientific-calculator",
  action_id: "solve_expression",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression"],
    properties: {
      expression: { type: "string" },
    },
  },
  output_observation_schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorSolveScalarExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator solve scalar expression",
  description:
    "Evaluates a fully numeric or already-bound scalar expression as read-only calculator evidence. Symbolic variables must be bound before this capability can produce result evidence.",
  panel_id: "scientific-calculator",
  action_id: "solve_scalar_expression",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression"],
    properties: {
      expression: { type: "string" },
      bound_expression: { type: "string" },
      source_refs: { type: "array", items: { type: "string" } },
    },
  },
  output_observation_schema: CALCULATOR_SOLVE_SCALAR_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_SOLVE_SCALAR_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_or_observe",
    "calculator",
    "bound_scalar_expression",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorClassifyExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator classify expression",
  description:
    "Classifies calculator input for the workbench without solving it. It reports parse status, symbols, routes, assumptions, and blocked reasons as non-terminal observation evidence.",
  panel_id: "scientific-calculator",
  action_id: "classify_expression",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression"],
    properties: {
      expression: { type: "string" },
      latex: { type: "string" },
      text: { type: "string" },
      source_refs: { type: "array", items: { type: "string" } },
      paper_context: { type: "object" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: CALCULATOR_CLASSIFY_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_CLASSIFY_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "classification", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorBindVariablesManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_BIND_VARIABLES_CAPABILITY,
  label: "Scientific Calculator bind variables",
  description:
    "Binds calculator expression symbols from explicit numeric evidence with units and source refs. It fails closed for missing variables, ambiguous units, incompatible dimensions, missing source refs, or unsupported symbol semantics.",
  panel_id: "scientific-calculator",
  action_id: "bind_variables",
  mode: "verify",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression", "numeric_evidence"],
    properties: {
      expression: { type: "string" },
      latex: { type: "string" },
      text: { type: "string" },
      numeric_evidence: { type: "array", items: { type: "object" } },
      numeric_value_evidence: { type: "array", items: { type: "object" } },
      expected_units: { type: "object" },
      expected_dimensions: { type: "object" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: CALCULATOR_BIND_VARIABLES_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_BIND_VARIABLES_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "variable_binding", "typed_affordance", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorActiveContextManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_ACTIVE_CONTEXT_CAPABILITY,
  label: "Scientific Calculator active context",
  description:
    "Reads bounded active Scientific Calculator panel state supplied by the workstation context snapshot. It is observation-only and cannot solve, mutate, or answer.",
  panel_id: "scientific-calculator",
  action_id: "active_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      active_context: { type: "object" },
    },
  },
  output_observation_schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  observation_schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "calculator", "active_context", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const makeReadableSurfaceManifest = (input: {
  capabilityId: typeof READABLE_SURFACE_OBSERVE_CAPABILITY |
    typeof DOCS_READ_VISIBLE_SURFACE_CAPABILITY |
    typeof DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY |
    typeof CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY;
  label: string;
  description: string;
  panelId: string | null;
  actionId: string;
}): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: input.capabilityId,
  label: input.label,
  description: input.description,
  panel_id: input.panelId,
  action_id: input.actionId,
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      surface: { type: "string" },
      surface_id: { type: "string" },
      panel_id: { type: "string" },
      action_id: { type: "string" },
      label: { type: "string" },
      text: { type: "string" },
      surface_text: { type: "string" },
      visible_text: { type: "string" },
      selected_text: { type: "string" },
      hovered_text: { type: "string" },
      selection_ref: { type: "string" },
      selection_kind: { type: "string" },
      narrator_source_id: { type: "string" },
      source_id: { type: "string" },
      translated_text: { type: "string" },
      translation_blocks: { type: "array", items: { type: "object" } },
      missing_unit_info: { type: "array", items: { type: "string" } },
      locale: { type: "string" },
      target_locale: { type: "string" },
      source_doc_path: { type: "string" },
      path: { type: "string" },
      source_refs: { type: "array", items: { type: "string" } },
      line_refs: { type: "array", items: { type: "string" } },
      unit_refs: { type: "array", items: { type: "string" } },
      expression: { type: "string" },
      result: { type: "string" },
      visible_result: { type: "string" },
      active_context: { type: "object" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: READABLE_SURFACE_OBSERVATION_SCHEMA,
  observation_schema: READABLE_SURFACE_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_or_observe",
    "readable_surface",
    "bounded_observation",
    "no_dom_scrape",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
});

const readableSurfaceObserveManifest = makeReadableSurfaceManifest({
  capabilityId: READABLE_SURFACE_OBSERVE_CAPABILITY,
  label: "Readable workstation surface observation",
  description:
    "Resolves a registered user-facing workstation surface into a bounded observation packet. It never reads arbitrary DOM, exposes secrets, or becomes terminal answer authority.",
  panelId: null,
  actionId: "observe",
});

const docsReadVisibleSurfaceManifest = makeReadableSurfaceManifest({
  capabilityId: DOCS_READ_VISIBLE_SURFACE_CAPABILITY,
  label: "Docs Viewer readable visible surface",
  description:
    "Reads a registered visible, selected, hovered, or narrator-source Docs Viewer surface as bounded document evidence with source refs.",
  panelId: "docs-viewer",
  actionId: "read_visible_surface",
});

const docsReadActiveTranslationManifest = makeReadableSurfaceManifest({
  capabilityId: DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY,
  label: "Docs Viewer active translation surface",
  description:
    "Reads registered active inline translation blocks from the Docs Viewer as bounded translated text with source unit ids and locale metadata.",
  panelId: "docs-viewer",
  actionId: "read_active_translation",
});

const calculatorReadVisibleResultManifest = makeReadableSurfaceManifest({
  capabilityId: CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY,
  label: "Scientific Calculator visible result",
  description:
    "Reads the current visible calculator result region as bounded evidence and distinguishes solver result from draft input.",
  panelId: "scientific-calculator",
  actionId: "read_visible_result",
});

const makeCalculatorPanelActionManifest = (
  capabilityId: typeof CALCULATOR_OPEN_PANEL_CAPABILITY | typeof CALCULATOR_FOCUS_PANEL_CAPABILITY,
  action: "open_panel" | "focus_panel",
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: capabilityId,
  label: action === "open_panel" ? "Scientific Calculator open panel" : "Scientific Calculator focus panel",
  description:
    "Requests a governed, non-mutating workstation UI action for the Scientific Calculator panel. It is a non-terminal action receipt and cannot answer the user.",
  panel_id: "scientific-calculator",
  action_id: action,
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "calculator", "panel_action", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
});

const calculatorOpenPanelManifest = makeCalculatorPanelActionManifest(
  CALCULATOR_OPEN_PANEL_CAPABILITY,
  "open_panel",
);
const calculatorFocusPanelManifest = makeCalculatorPanelActionManifest(
  CALCULATOR_FOCUS_PANEL_CAPABILITY,
  "focus_panel",
);

const calculatorShowGatewaySolveManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY,
  label: "Scientific Calculator show gateway solve",
  description:
    "Projects an already-observed calculator gateway solve into the Scientific Calculator panel as a governed, non-mutating UI action receipt. It cannot answer the user.",
  panel_id: "scientific-calculator",
  action_id: "show_gateway_solve",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression", "result"],
    properties: {
      expression: { type: "string" },
      normalized_expression: { type: "string" },
      result: { type: "string" },
      source_capability: { type: "string" },
      observation_ref: { type: "string" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "calculator", "gateway_projection", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const calculatorPrefillExpressionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CALCULATOR_PREFILL_EXPRESSION_CAPABILITY,
  label: "Scientific Calculator prefill expression",
  description:
    "Projects a symbolic, incomplete, or numeric expression into the Scientific Calculator workbench input as a governed UI action receipt. It does not solve and cannot produce calculator result evidence.",
  panel_id: "scientific-calculator",
  action_id: "prefill_expression",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["expression"],
    properties: {
      expression: { type: "string" },
      latex: { type: "string" },
      text: { type: "string" },
      source_refs: { type: "array", items: { type: "string" } },
      source_path: { type: "string" },
      anchor: { type: "string" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "calculator", "expression_prefill", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const makeWorkstationPanelActionManifest = (
  capabilityId: typeof WORKSTATION_OPEN_PANEL_CAPABILITY | typeof WORKSTATION_FOCUS_PANEL_CAPABILITY,
  action: "open_panel" | "focus_panel",
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: capabilityId,
  label: action === "open_panel" ? "Workstation open panel" : "Workstation focus panel",
  description:
    "Requests a governed, non-mutating workstation UI action for a safe read/observe panel allowlist. It is a non-terminal action receipt and cannot answer the user.",
  panel_id: null,
  action_id: action,
  dynamic_panel_id_arg: "panel_id",
  allowed_panel_ids: [...SAFE_WORKSTATION_PANEL_ACTION_IDS],
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["panel_id"],
    properties: {
      panel_id: { type: "string" },
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "workstation_panel", "panel_action", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
});

const workstationOpenPanelManifest = makeWorkstationPanelActionManifest(
  WORKSTATION_OPEN_PANEL_CAPABILITY,
  "open_panel",
);
const workstationFocusPanelManifest = makeWorkstationPanelActionManifest(
  WORKSTATION_FOCUS_PANEL_CAPABILITY,
  "focus_panel",
);

const docsOpenDocManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: DOCS_OPEN_DOC_CAPABILITY,
  label: "Docs Viewer open document",
  description:
    "Requests a governed, non-mutating Docs Viewer UI action to open a safe docs/ path. It produces an action receipt only and cannot answer document content.",
  panel_id: "docs-viewer",
  action_id: "open_doc",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["path"],
    properties: {
      path: { type: "string" },
      anchor: { type: "string" },
      reason: { type: "string" },
    },
  },
  output_observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  observation_schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
  safety_tags: ["non_mutating_ui_action", "docs_viewer", "open_doc", "action_receipt", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const repoSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: REPO_SEARCH_CAPABILITY,
  label: "Repo search",
  description:
    "Searches bounded repository paths for current code or documentation evidence. It returns non-terminal evidence observations and cannot write files or run shell commands for the agent.",
  panel_id: "repo-evidence",
  action_id: "search",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      paths: { type: "array", items: { type: "string" } },
      max_hits: { type: "number" },
    },
  },
  output_observation_schema: REPO_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: REPO_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "repo_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const docsSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: DOCS_SEARCH_CAPABILITY,
  label: "Docs search",
  description:
    "Searches bounded workspace documentation paths for current document evidence. It returns non-terminal evidence observations and cannot open files, write files, or execute shell commands for the agent.",
  panel_id: "docs-viewer",
  action_id: "search_docs",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      paths: { type: "array", items: { type: "string" } },
      max_hits: { type: "number" },
    },
  },
  output_observation_schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "docs_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const internetSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: INTERNET_SEARCH_CAPABILITY,
  label: "Internet search",
  description:
    "Runs the existing Helix internet search retriever as bounded, read-only external web evidence. It returns observations only and cannot browse the UI, scrape hidden pages, mutate files, or answer by itself.",
  panel_id: "internet-search",
  action_id: "search_web",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      providers: { type: "array", items: { type: "string" } },
      domains: { type: "array", items: { type: "string" } },
      recency_days: { type: "number" },
      limit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
  observation_schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "internet_search", "external_web_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const scholarlyResearchSearchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: SCHOLARLY_RESEARCH_SEARCH_CAPABILITY,
  label: "Scholarly research search",
  description:
    "Runs the existing Helix scholarly paper lookup as bounded, read-only research-paper evidence. It returns metadata/abstract observations only and cannot fetch hidden full text, mutate files, or answer by itself.",
  panel_id: "scholarly-research",
  action_id: "lookup_papers",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["query"],
    properties: {
      query: { type: "string" },
      mode: { type: "string" },
      providers: { type: "array", items: { type: "string" } },
      limit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  observation_schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "scholarly_research", "paper_evidence", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const scholarlyFullTextFetchManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY,
  label: "Scholarly full text fetch",
  description:
    "Fetches accessible paper full text from structured paper refs, DOI/arXiv-derived URLs, or explicit source URLs into bounded text chunks. It returns compact evidence only and cannot answer by itself.",
  panel_id: "scholarly-research",
  action_id: "fetch_full_text",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      query: { type: "string" },
      paper: { type: "object" },
      papers: { type: "array", items: { type: "object" } },
      paper_result_id: { type: "string" },
      source_ref: { type: "string" },
      source_url: { type: "string" },
      max_pages: { type: "number" },
      max_chunks: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
  observation_schema: SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "scholarly_research", "paper_full_text", "compact_context", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const scholarlyNumericParameterExtractManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY,
  label: "Scholarly numeric parameter extraction",
  description:
    "Extracts cited numeric values with units from bounded scholarly text evidence. It returns typed numeric affordances and fail-closed diagnostics for missing, ambiguous, uncited, or incompatible values.",
  panel_id: "scholarly-research",
  action_id: "extract_numeric_parameters",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: [],
    properties: {
      requested_variables: { type: "array", items: { type: "string" } },
      variables: { type: "array", items: { type: "string" } },
      extraction_mode: { type: "string" },
      full_text_observation: { type: "object" },
      text_evidence: { type: "string" },
      source_ref: { type: "string" },
      paper: { type: "object" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
  observation_schema: SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "scholarly_research", "numeric_value_evidence", "typed_affordance", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const civilizationBoundsReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  label: "Civilization Bounds reflect system bounds",
  description:
    "Reflects the prompt through the existing Civilization Bounds Roadmap as bounded, evidence-only situational context. It does not write files, run shell commands, authorize actions, or become a final answer.",
  panel_id: "civilization-bounds-roadmap",
  action_id: "reflect_system_bounds",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      scenario_id: { type: "string" },
      phase_id: { type: "string" },
      layer_mode: { type: "string" },
      selected_system_ids: { type: "array", items: { type: "string" } },
      selected_badge_ids: { type: "array", items: { type: "string" } },
      theory_reflection_ref: { type: "string" },
      ideology_reflection_ref: { type: "string" },
      include_bridge_context: { type: "boolean" },
      include_collaboration_bounds: { type: "boolean" },
      include_falsification_hooks: { type: "boolean" },
    },
  },
  output_observation_schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "civilization_bounds", "reflection", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const theoryContextReflectionManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: THEORY_CONTEXT_REFLECTION_CAPABILITY,
  label: "Theory Badge Graph reflect discussion context",
  description:
    "Reflects the prompt against the existing Theory Badge Graph as bounded, evidence-only context. It does not solve, mutate files, run shell commands, or become a final answer.",
  panel_id: "theory-badge-graph",
  action_id: "reflect_discussion_context",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      conversation_context: { type: "string" },
      mentioned_equations: { type: "array", items: { type: "string" } },
      mentioned_symbols: { type: "array", items: { type: "string" } },
      mentioned_domains: { type: "array", items: { type: "string" } },
      build_explanation_plan: { type: "boolean" },
      limit: { type: "number" },
    },
  },
  output_observation_schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
  observation_schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
  safety_tags: ["read_or_observe", "theory_badge_graph", "reflection", "non_terminal", "no_shell", "no_code_mutation"],
  assistant_answer: false,
  raw_content_included: false,
};

const theoryFrontierConjectureManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: THEORY_FRONTIER_CONJECTURE_CAPABILITY,
  label: "Theory Badge Graph propose frontier conjectures",
  description:
    "Builds bounded frontier conjecture candidates from theory badge graph, biome, probability, and frontier-search evidence. It returns evidence-only obligations and cannot validate, promote, or become a final answer.",
  panel_id: "theory-badge-graph",
  action_id: "propose_frontier_conjectures",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: true,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["prompt"],
    properties: {
      prompt: { type: "string" },
      query: { type: "string" },
      text: { type: "string" },
      conversation_context: { type: "string" },
      mentioned_equations: { type: "array", items: { type: "string" } },
      mentioned_symbols: { type: "array", items: { type: "string" } },
      mentioned_domains: { type: "array", items: { type: "string" } },
      frontier_search_seed: { type: "string" },
      build_explanation_plan: { type: "boolean" },
      limit: { type: "number" },
    },
  },
  output_observation_schema: THEORY_FRONTIER_CONJECTURE_OBSERVATION_SCHEMA,
  observation_schema: THEORY_FRONTIER_CONJECTURE_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_or_observe",
    "theory_badge_graph",
    "frontier_conjecture",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
    "no_auto_promotion",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const makeVoiceGatewayManifest = (
  capabilityId:
    | typeof VOICE_INTERIM_CALLOUT_CAPABILITY
    | typeof VOICE_NARRATOR_SAY_CAPABILITY
    | typeof TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY,
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: capabilityId,
  label: capabilityId === VOICE_NARRATOR_SAY_CAPABILITY
    ? "Narrator say request"
    : capabilityId === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY
      ? "Text to speech request"
      : "Interim voice callout request",
  description:
    "Creates a structured, non-terminal voice request/receipt for host-side playback projection. It wraps the existing voice service lane, does not prove heard audio without a client receipt, scrape final prose, mutate files, run shell commands, or become a final answer.",
  panel_id: "voice-delivery",
  action_id: capabilityId === VOICE_NARRATOR_SAY_CAPABILITY
    ? "narrator_say"
    : capabilityId === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY
      ? "speak_text"
      : "request_interim_voice_callout",
  mode: "act",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: true,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "act",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      text: { type: "string" },
      message: { type: "string" },
      voice: { type: "string" },
      profile: { type: "string" },
      locale: { type: "string" },
      source_observation_ref: { type: "string" },
      sourceObservationRef: { type: "string" },
      thread_id: { type: "string" },
      turn_id: { type: "string" },
      kind: { type: "string" },
      source: { type: "string" },
      max_chars: { type: "number" },
      maxChars: { type: "number" },
      timing_hint_ms: { type: "number" },
      timingHintMs: { type: "number" },
      voice_playback_kind: { type: "string" },
      voicePlaybackKind: { type: "string" },
      requires_confirmation: { type: "boolean" },
      requiresConfirmation: { type: "boolean" },
      evidence_refs: { type: "array", items: { type: "string" } },
      evidenceRefs: { type: "array", items: { type: "string" } },
      reason_codes: { type: "array", items: { type: "string" } },
      reasonCodes: { type: "array", items: { type: "string" } },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: VOICE_INTERIM_TOOL_RESULT_SCHEMA,
  observation_schema: VOICE_INTERIM_TOOL_RESULT_SCHEMA,
  safety_tags: [
    "voice_delivery",
    "host_side_projection",
    "action_receipt",
    "requires_confirmation",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
});

const voiceInterimCalloutManifest = makeVoiceGatewayManifest(VOICE_INTERIM_CALLOUT_CAPABILITY);
const voiceNarratorSayManifest = makeVoiceGatewayManifest(VOICE_NARRATOR_SAY_CAPABILITY);
const textToSpeechSpeakTextManifest = makeVoiceGatewayManifest(TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY);

const makeContextFeedQueryGatewayManifest = (
  spec: WorkstationContextFeedQueryToolContractSpec,
): HelixWorkstationCapabilityManifest => ({
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: spec.capability,
  label: `Query ${spec.label}`,
  description:
    "Queries an existing Helix live-environment context feed as bounded, read-only workstation evidence. It returns an observation packet only and cannot mutate workstation state, run shell commands, or become a final answer.",
  panel_id: "live-answer-environment",
  action_id: spec.actuator,
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      thread_id: { type: "string" },
      environment_id: { type: "string" },
      room_id: { type: "string" },
      source_id: { type: "string" },
      sourceId: { type: "string" },
      source_ref: { type: "string" },
      sourceRef: { type: "string" },
      goal_id: { type: "string" },
      goalId: { type: "string" },
      freshness_status: { type: "string" },
      freshnessStatus: { type: "string" },
      freshness: { type: "string" },
      limit: { type: "number" },
      mail_limit: { type: "number" },
      mailLimit: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_or_observe",
    "live_environment",
    "context_feed",
    spec.feedKind,
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
});

const contextFeedQueryGatewayManifests = WORKSTATION_CONTEXT_FEED_QUERY_TOOL_CONTRACT_SPECS
  .filter((spec) => SHARED_CONTEXT_FEED_QUERY_CAPABILITIES.has(spec.capability))
  .map(makeContextFeedQueryGatewayManifest);

const liveSourceLoopHealthManifest: HelixWorkstationCapabilityManifest = {
  schema: "helix.workstation_tool_gateway.capability.v1",
  capability_id: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY,
  label: "Query live-source loop health",
  description:
    "Queries the existing Helix live-source loop health observation as bounded, read-only workstation evidence. It returns an observation packet only and cannot configure, repair, pause, resume, or mutate any live-source loop.",
  panel_id: "live-answer-environment",
  action_id: "query_live_source_loop_health",
  mode: "read",
  mutating: false,
  code_mutation: false,
  shell_access: false,
  requires_confirmation: false,
  requires_source: false,
  terminal_eligible: false,
  permission_profile_required: "read",
  post_tool_model_step_required: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      thread_id: { type: "string" },
      environment_id: { type: "string" },
      room_id: { type: "string" },
      source_id: { type: "string" },
      sourceId: { type: "string" },
      source_ref: { type: "string" },
      sourceRef: { type: "string" },
      expected_cadence_ms: { type: "number" },
      expectedCadenceMs: { type: "number" },
      source_target_intent: { type: "object" },
    },
  },
  output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
  safety_tags: [
    "read_or_observe",
    "live_environment",
    "source_health",
    "loop_health",
    "non_terminal",
    "no_shell",
    "no_code_mutation",
  ],
  assistant_answer: false,
  raw_content_included: false,
};

const liveSourceStateReadManifests: HelixWorkstationCapabilityManifest[] =
  LIVE_SOURCE_STATE_READ_CAPABILITIES.map(([capabilityId, actionId, label]) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Runs an existing Helix live-source state read as bounded workstation evidence. It returns an observation packet only and cannot configure, repair, pause, resume, bind, unbind, or mutate any live-source loop.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ref: { type: "string" },
        sourceRef: { type: "string" },
        goal_id: { type: "string" },
        goalId: { type: "string" },
        limit: { type: "number" },
        mail_limit: { type: "number" },
        mailLimit: { type: "number" },
        include_sessions: { type: "boolean" },
        includeSessions: { type: "boolean" },
        include_updates: { type: "boolean" },
        includeUpdates: { type: "boolean" },
        freshness_status: { type: "string" },
        freshnessStatus: { type: "string" },
        expected_cadence_ms: { type: "number" },
        expectedCadenceMs: { type: "number" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "live_source_state",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

const situationStageStateReadManifests: HelixWorkstationCapabilityManifest[] =
  SITUATION_STAGE_STATE_READ_CAPABILITIES.map(([capabilityId, actionId, label]) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Runs an existing Helix situation/stage state read as bounded workstation evidence. It returns an observation packet only and cannot configure watches, enqueue jobs, process mail, or mutate live workstation state.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ref: { type: "string" },
        sourceRef: { type: "string" },
        route_id: { type: "string" },
        routeId: { type: "string" },
        job_id: { type: "string" },
        jobId: { type: "string" },
        stage_id: { type: "string" },
        stageId: { type: "string" },
        construct_id: { type: "string" },
        constructId: { type: "string" },
        since_ms: { type: "number" },
        sinceMs: { type: "number" },
        limit: { type: "number" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "situation_stage_state",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

const liveSourceMailboxReadManifests: HelixWorkstationCapabilityManifest[] =
  LIVE_SOURCE_MAILBOX_READ_CAPABILITIES.map(([capabilityId, actionId, label]) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Reads existing Helix live-source mailbox state as bounded workstation evidence. It returns an observation packet only and cannot process new mail, mutate live-source state, speak aloud, or become a final answer.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        ui_thread_id: { type: "string" },
        uiThreadId: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ref: { type: "string" },
        sourceRef: { type: "string" },
        source_kind: { type: "string" },
        sourceKind: { type: "string" },
        mail_ids: { type: "array", items: { type: "string" } },
        mailIds: { type: "array", items: { type: "string" } },
        limit: { type: "number" },
        batch_cap: { type: "number" },
        batchCap: { type: "number" },
        include_read: { type: "boolean" },
        includeRead: { type: "boolean" },
        read_only: { type: "boolean" },
        readOnly: { type: "boolean" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "live_source_mailbox",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

const liveSourceInterpreterPredictionReadManifests: HelixWorkstationCapabilityManifest[] =
  LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES.map(([capabilityId, actionId, label]) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Reads or compares existing live-source interpreter/prediction evidence as a bounded workstation observation. It cannot configure interpreter profiles, record mailbox decisions, project narrative state, mutate live-source state, or become a final answer.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        ui_thread_id: { type: "string" },
        uiThreadId: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ref: { type: "string" },
        sourceRef: { type: "string" },
        source_kind: { type: "string" },
        sourceKind: { type: "string" },
        mailbox_thread_id: { type: "string" },
        mailboxThreadId: { type: "string" },
        mail_ids: { type: "array", items: { type: "string" } },
        mailIds: { type: "array", items: { type: "string" } },
        profile_id: { type: "string" },
        profileId: { type: "string" },
        job_id: { type: "string" },
        jobId: { type: "string" },
        policy_id: { type: "string" },
        policyId: { type: "string" },
        current_scene_summary: { type: "string" },
        currentSceneSummary: { type: "string" },
        running_story_summary: { type: "string" },
        runningStorySummary: { type: "string" },
        limit: { type: "number" },
        read_only: { type: "boolean" },
        readOnly: { type: "boolean" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "live_source_interpreter_prediction",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

const stagePlayBuilderReadManifests: HelixWorkstationCapabilityManifest[] =
  STAGE_PLAY_BUILDER_READ_CAPABILITIES.map(([capabilityId, actionId, label]) => ({
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Reads, validates, or plans Stage Play builder structure as bounded workstation evidence. It cannot queue checkpoints, mutate live-source state, update live answer projections, or become a final answer.",
    panel_id: "stage-play-badge-graph",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ref: { type: "string" },
        sourceRef: { type: "string" },
        objective: { type: "string" },
        user_intent: { type: "string" },
        intent: { type: "string" },
        draft: { type: "object" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "stage_play_builder",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  }));

const makeMicroReasonerReadManifest = (
  capabilityId:
    | typeof MICRO_REASONER_QUERY_PRESETS_CAPABILITY
    | typeof MICRO_REASONER_QUERY_PROMPTS_CAPABILITY
    | typeof MICRO_REASONER_TEST_PROMPT_CAPABILITY,
): HelixWorkstationCapabilityManifest => {
  const actionId =
    capabilityId === MICRO_REASONER_QUERY_PRESETS_CAPABILITY
      ? "query_micro_reasoner_presets"
      : capabilityId === MICRO_REASONER_QUERY_PROMPTS_CAPABILITY
        ? "query_micro_reasoner_prompts"
        : "test_micro_reasoner_prompt";
  const label =
    capabilityId === MICRO_REASONER_QUERY_PRESETS_CAPABILITY
      ? "Query MicroDeck presets"
      : capabilityId === MICRO_REASONER_QUERY_PROMPTS_CAPABILITY
        ? "Query MicroDeck prompts"
        : "Dry-run MicroDeck prompt test";
  return {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Runs the existing Helix MicroDeck read/evaluation tool as bounded workstation evidence. It returns an observation packet only and cannot create, apply, update, or route MicroDeck presets/prompts.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ids: { type: "array", items: { type: "string" } },
        sourceIds: { type: "array", items: { type: "string" } },
        source_kind: { type: "string" },
        sourceKind: { type: "string" },
        role: { type: "string" },
        limit: { type: "number" },
        goal_id: { type: "string" },
        goalId: { type: "string" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "micro_reasoner",
      "microdeck",
      capabilityId === MICRO_REASONER_TEST_PROMPT_CAPABILITY ? "dry_run_evaluation" : "catalog_read",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
};

const microReasonerReadManifests = [
  makeMicroReasonerReadManifest(MICRO_REASONER_QUERY_PRESETS_CAPABILITY),
  makeMicroReasonerReadManifest(MICRO_REASONER_QUERY_PROMPTS_CAPABILITY),
  makeMicroReasonerReadManifest(MICRO_REASONER_TEST_PROMPT_CAPABILITY),
];

const makeVisualObserverReadManifest = (
  capabilityId:
    | typeof VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY
    | typeof VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY
    | typeof VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY,
): HelixWorkstationCapabilityManifest => {
  const actionId =
    capabilityId === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY
      ? "query_visual_observer_profiles"
      : capabilityId === VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY
        ? "test_visual_observer_profile"
        : "compare_visual_observer_profiles";
  const label =
    capabilityId === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY
      ? "Query visual observer profiles"
      : capabilityId === VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY
        ? "Dry-run visual observer profile test"
        : "Compare visual observer profile output";
  return {
    schema: "helix.workstation_tool_gateway.capability.v1",
    capability_id: capabilityId,
    label,
    description:
      "Runs the existing Helix visual observer read/evaluation tool as bounded workstation evidence. It returns an observation packet only and cannot configure/apply visual observer profiles, request replay, capture frames, or enqueue live-source mail.",
    panel_id: "live-answer-environment",
    action_id: actionId,
    mode: "read",
    mutating: false,
    code_mutation: false,
    shell_access: false,
    requires_confirmation: false,
    requires_source: false,
    terminal_eligible: false,
    permission_profile_required: "read",
    post_tool_model_step_required: true,
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        thread_id: { type: "string" },
        environment_id: { type: "string" },
        room_id: { type: "string" },
        source_id: { type: "string" },
        sourceId: { type: "string" },
        source_ids: { type: "array", items: { type: "string" } },
        sourceIds: { type: "array", items: { type: "string" } },
        profile_id: { type: "string" },
        profileId: { type: "string" },
        domain: { type: "string" },
        status: { type: "string" },
        include_presets: { type: "boolean" },
        includePresets: { type: "boolean" },
        generic_summary: { type: "string" },
        genericSummary: { type: "string" },
        profile_summary: { type: "string" },
        profileSummary: { type: "string" },
        generic_output: { type: "object" },
        genericOutput: { type: "object" },
        profile_output: { type: "object" },
        profileOutput: { type: "object" },
        summary: { type: "string" },
        limit: { type: "number" },
        source_target_intent: { type: "object" },
      },
    },
    output_observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    observation_schema: HELIX_LIVE_ENVIRONMENT_TOOL_OBSERVATION_SCHEMA,
    safety_tags: [
      "read_or_observe",
      "live_environment",
      "visual_observer",
      capabilityId === VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY ? "catalog_read" : "dry_run_evaluation",
      "non_terminal",
      "no_shell",
      "no_code_mutation",
    ],
    assistant_answer: false,
    raw_content_included: false,
  };
};

const visualObserverReadManifests = [
  makeVisualObserverReadManifest(VISUAL_OBSERVER_QUERY_PROFILES_CAPABILITY),
  makeVisualObserverReadManifest(VISUAL_OBSERVER_TEST_PROFILE_CAPABILITY),
  makeVisualObserverReadManifest(VISUAL_OBSERVER_COMPARE_PROFILES_CAPABILITY),
];

const rawCapabilities = new Map<string, HelixWorkstationCapabilityManifest>([
  [workspaceOsStatusManifest.capability_id, workspaceOsStatusManifest],
  [workstationActiveContextManifest.capability_id, workstationActiveContextManifest],
  [calculatorSolveExpressionManifest.capability_id, calculatorSolveExpressionManifest],
  [calculatorSolveScalarExpressionManifest.capability_id, calculatorSolveScalarExpressionManifest],
  [calculatorClassifyExpressionManifest.capability_id, calculatorClassifyExpressionManifest],
  [calculatorBindVariablesManifest.capability_id, calculatorBindVariablesManifest],
  [calculatorActiveContextManifest.capability_id, calculatorActiveContextManifest],
  [readableSurfaceObserveManifest.capability_id, readableSurfaceObserveManifest],
  [docsReadVisibleSurfaceManifest.capability_id, docsReadVisibleSurfaceManifest],
  [docsReadActiveTranslationManifest.capability_id, docsReadActiveTranslationManifest],
  [calculatorReadVisibleResultManifest.capability_id, calculatorReadVisibleResultManifest],
  [calculatorOpenPanelManifest.capability_id, calculatorOpenPanelManifest],
  [calculatorFocusPanelManifest.capability_id, calculatorFocusPanelManifest],
  [calculatorShowGatewaySolveManifest.capability_id, calculatorShowGatewaySolveManifest],
  [calculatorPrefillExpressionManifest.capability_id, calculatorPrefillExpressionManifest],
  [workstationOpenPanelManifest.capability_id, workstationOpenPanelManifest],
  [workstationFocusPanelManifest.capability_id, workstationFocusPanelManifest],
  [docsOpenDocManifest.capability_id, docsOpenDocManifest],
  [repoSearchManifest.capability_id, repoSearchManifest],
  [docsSearchManifest.capability_id, docsSearchManifest],
  [internetSearchManifest.capability_id, internetSearchManifest],
  [scholarlyResearchSearchManifest.capability_id, scholarlyResearchSearchManifest],
  [scholarlyFullTextFetchManifest.capability_id, scholarlyFullTextFetchManifest],
  [scholarlyNumericParameterExtractManifest.capability_id, scholarlyNumericParameterExtractManifest],
  [civilizationBoundsReflectionManifest.capability_id, civilizationBoundsReflectionManifest],
  [theoryContextReflectionManifest.capability_id, theoryContextReflectionManifest],
  [theoryFrontierConjectureManifest.capability_id, theoryFrontierConjectureManifest],
  [moralLivingSubstrateReflectionManifest.capability_id, moralLivingSubstrateReflectionManifest],
  [textToSpeechSpeakTextManifest.capability_id, textToSpeechSpeakTextManifest],
  [voiceInterimCalloutManifest.capability_id, voiceInterimCalloutManifest],
  [voiceNarratorSayManifest.capability_id, voiceNarratorSayManifest],
  ...contextFeedQueryGatewayManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  [liveSourceLoopHealthManifest.capability_id, liveSourceLoopHealthManifest],
  ...liveSourceStateReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...situationStageStateReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...liveSourceMailboxReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...liveSourceInterpreterPredictionReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...stagePlayBuilderReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...microReasonerReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
  ...visualObserverReadManifests.map((manifest) => [manifest.capability_id, manifest] as const),
]);

const capabilities = new Map<string, HelixWorkstationCapabilityManifest>(
  Array.from(rawCapabilities.entries()).map(([capabilityId, manifest]) => [
    capabilityId,
    attachManifestAffordanceContract(manifest),
  ]),
);

export const listWorkstationGatewayCapabilities = (
  input: HelixWorkstationGatewayListInput = {},
): HelixWorkstationGatewayListResult => ({
  schema: WORKSTATION_GATEWAY_SCHEMA,
  manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
  agent_runtime: cleanString(input.agentRuntime, "codex"),
  mode: normalizeMode(input.mode),
  capabilities: Array.from(capabilities.values()),
  assistant_answer: false,
  raw_content_included: false,
});

export const callWorkstationGatewayCapability = async (
  input: HelixWorkstationGatewayCallInput,
): Promise<HelixWorkstationGatewayCallResult> => {
  const mode = normalizeMode(input.mode);
  const agentRuntime = cleanString(input.agentRuntime, "codex");
  const turnId = cleanString(input.turnId, `workstation-gateway:${Date.now()}`);
  const iteration = typeof input.iteration === "number" && Number.isFinite(input.iteration)
    ? Math.max(0, Math.floor(input.iteration))
    : 0;
  const capabilityId = normalizeGatewayCapabilityId(cleanString(input.capabilityId));
  const manifest = capabilities.get(capabilityId);

  if (!manifest) {
    const admission = buildAdmission({
      capabilityId: capabilityId || "unknown",
      agentRuntime,
      permissionProfile: "observe",
      status: "blocked",
      reason: "capability_not_registered",
      blockedReason: "capability_not_registered",
    });
    const observation = {
      schema: "helix.workstation_tool_gateway.unknown_capability.v1",
      capability_id: capabilityId || "unknown",
      reason: "capability_not_registered",
      terminal_eligible: false,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: capabilityId || "unknown",
      panelId: "workstation-gateway",
      action: "call",
      status: "failed",
      summary: `Workstation gateway rejected unknown capability ${capabilityId || "unknown"}.`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: capabilityId || "unknown",
      agentRuntime,
      admission,
      observationPacket,
      error: "capability_not_registered",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: false,
      agent_runtime: agentRuntime,
      capability_id: capabilityId || "unknown",
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: "capability_not_registered",
    };
  }

  if (!modeAllowsManifest(mode, manifest)) {
    const blockedReason = `permission_profile_${mode}_does_not_allow_${manifest.permission_profile_required}`;
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "blocked",
      reason: "permission_profile_insufficient",
      blockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: "helix.workstation_tool_gateway.permission_blocked.v1",
      capability_key: manifest.capability_id,
      requested_mode: mode,
      required_permission_profile: manifest.permission_profile_required,
      status: "blocked",
      blocked_reason: blockedReason,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workstation-gateway",
      action: "permission_check",
      status: "blocked",
      summary: `Workstation gateway blocked ${manifest.capability_id}: ${blockedReason}.`,
      observation,
      missingRequirements: [{
        code: blockedReason,
        message: `Capability ${manifest.capability_id} requires ${manifest.permission_profile_required} permission.`,
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: blockedReason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: false,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: blockedReason,
    };
  }

  if (manifest.capability_id === WORKSTATION_ACTIVE_CONTEXT_CAPABILITY) {
    const args = readArguments(input.arguments);
    const activeContext = readBoundedWorkspaceActiveContext(args.workspace_context ?? args.workspaceContext);
    const hasContext = Boolean(activeContext.active_panel || activeContext.open_panels.length > 0);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasContext ? "admitted" : "blocked",
      reason: hasContext ? "read_only_gateway_capability" : "workstation_active_context_missing",
      blockedReason: hasContext ? undefined : "workstation_active_context_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: WORKSTATION_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      status: hasContext ? "succeeded" : "blocked",
      blocked_reason: hasContext ? null : "workstation_active_context_missing",
      ...activeContext,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const summary = hasContext
      ? `Workstation active context observed active panel ${activeContext.active_panel ?? "unknown"} with ${activeContext.open_panels.length} open panel(s).`
      : "Workstation active context was requested but no bounded panel state was supplied.";
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workstation",
      action: "active_context",
      status: hasContext ? "succeeded" : "blocked",
      summary,
      observation,
      missingRequirements: hasContext ? [] : [{
        code: "workstation_active_context_missing",
        message: "Attach workspace context with active/open panel identity before asking about the current workstation layout.",
        repair_action: "ask_user",
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: hasContext ? [] : manifest.consumes_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasContext ? undefined : "workstation_active_context_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasContext,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasContext ? undefined : "workstation_active_context_missing",
    };
  }

  if (manifest.capability_id === HELIX_WORKSPACE_OS_STATUS_CAPABILITY) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const result = await executeWorkspaceOsStatusTool({
      thread_id: optionalString(args.thread_id),
      room_id: optionalString(args.room_id),
      capability_ids: readStringArray(args.capability_ids),
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "workspace-os",
      action: "status",
      status: "succeeded",
      summary: `Workspace OS status returned ${result.observation.capability_count} capability record(s).`,
      observation: result.observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: result.observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === CALCULATOR_SOLVE_EXPRESSION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression);
    const solved = solveSafeArithmeticExpression(expression);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: solved.ok ? "admitted" : "blocked",
      reason: solved.ok ? "read_only_gateway_capability" : "calculator_expression_blocked",
      blockedReason: solved.blocked_reason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: CALCULATOR_SOLVE_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      expression: expression || null,
      normalized_expression: solved.normalized_expression ?? (expression || null),
      rejected_expression: solved.ok ? null : expression || null,
      result: solved.result ?? null,
      status: solved.ok ? "succeeded" : "blocked",
      blocked_reason: solved.blocked_reason,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "solve_expression",
      status: solved.ok ? "succeeded" : "blocked",
      summary: solved.ok
        ? `Calculator evaluated ${expression} = ${solved.result}.`
        : `Calculator gateway blocked expression: ${solved.blocked_reason}.`,
      observation,
      missingRequirements: solved.ok ? [] : [{
        code: solved.blocked_reason ?? "calculator_expression_blocked",
        message: "Provide a simple arithmetic expression using numbers and arithmetic operators only.",
        repair_action: "ask_user",
        rejected_expression: expression || null,
        normalized_expression: solved.normalized_expression ?? (expression || null),
        required_affordance_kind: /[A-Za-z_]/.test(expression) ? "bound_calculator_expression" : null,
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: solved.ok ? [] : consumedAffordances
        .filter((affordance) => affordance.status === "missing")
        .map((affordance) => affordance.kind),
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: solved.ok ? undefined : solved.blocked_reason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: solved.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: solved.ok ? undefined : solved.blocked_reason,
    };
  }

  if (manifest.capability_id === CALCULATOR_SOLVE_SCALAR_EXPRESSION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.bound_expression ?? args.expression);
    const sourceRefs = readStringArray(args.source_refs);
    const scalarTarget = extractScalarSolveTarget(expression);
    const solved = scalarTarget.blocked_reason
      ? { ok: false as const, blocked_reason: scalarTarget.blocked_reason }
      : solveSafeArithmeticExpression(scalarTarget.scalar_expression);
    const missingSourceRefs = sourceRefs.length === 0;
    const ok = solved.ok && !missingSourceRefs;
    const primaryBlockedReason = missingSourceRefs
      ? "missing_source_refs"
      : solved.blocked_reason ?? "calculator_scalar_expression_blocked";
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: ok ? "admitted" : "blocked",
      reason: ok ? "read_only_gateway_capability" : "calculator_scalar_expression_blocked",
      blockedReason: ok ? undefined : primaryBlockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: CALCULATOR_SOLVE_SCALAR_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      expression: expression || null,
      scalar_expression: scalarTarget.scalar_expression || null,
      result_symbol: scalarTarget.result_symbol,
      normalized_expression: solved.normalized_expression ?? (scalarTarget.scalar_expression || expression || null),
      rejected_expression: ok ? null : expression || null,
      result: ok ? solved.result ?? null : null,
      source_refs: sourceRefs,
      status: ok ? "succeeded" : "blocked",
      blocked_reason: ok ? null : primaryBlockedReason,
      blocked_reasons: ok ? [] : [primaryBlockedReason],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "solve_scalar_expression",
      status: ok ? "succeeded" : "blocked",
      summary: ok
        ? `Calculator evaluated bound scalar ${expression} = ${solved.result}.`
        : `Calculator scalar solve blocked: ${primaryBlockedReason}.`,
      observation,
      missingRequirements: ok ? [] : [{
        code: primaryBlockedReason,
        message: primaryBlockedReason === "missing_source_refs"
          ? "Provide source refs for the bound scalar expression before producing result evidence."
          : "Provide a fully numeric bound scalar expression using numbers and arithmetic operators only.",
        repair_action: primaryBlockedReason === "missing_source_refs" ? "provide_source_ref" : "bind_variables",
        rejected_expression: expression || null,
        normalized_expression: solved.normalized_expression ?? (scalarTarget.scalar_expression || expression || null),
        required_affordance_kind: primaryBlockedReason === "missing_source_refs"
          ? "source_ref"
          : "bound_calculator_expression",
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: ok ? [] : consumedAffordances
        .filter((affordance) => affordance.status === "missing")
        .map((affordance) => affordance.kind),
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: ok ? undefined : primaryBlockedReason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: ok ? undefined : primaryBlockedReason,
    };
  }

  if (manifest.capability_id === CALCULATOR_CLASSIFY_EXPRESSION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression ?? args.latex ?? args.text);
    const classification = classifyScientificCalculatorExpression(expression);
    const ok = classification.parse_status !== "error";
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: ok ? "admitted" : "blocked",
      reason: ok ? "read_only_gateway_capability" : "calculator_expression_classification_blocked",
      blockedReason: ok ? undefined : classification.blocked_reasons[0] ?? "calculator_expression_classification_blocked",
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      capability_key: manifest.capability_id,
      status: ok ? "succeeded" : "blocked",
      blocked_reason: ok ? null : classification.blocked_reasons[0] ?? "calculator_expression_classification_blocked",
      ...classification,
      schema: CALCULATOR_CLASSIFY_OBSERVATION_SCHEMA,
      source_refs: readStringArray(args.source_refs),
      paper_context_supplied: Boolean(readRecord(args.paper_context)),
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "classify_expression",
      status: ok ? "succeeded" : "blocked",
      summary: ok
        ? `Calculator classified ${classification.expression} as ${classification.calculation_type}; routes: ${classification.possible_routes.join(", ")}.`
        : "Calculator classification was blocked because no expression was supplied.",
      observation,
      missingRequirements: ok ? [] : [{
        code: classification.blocked_reasons[0] ?? "missing_expression",
        message: "Provide a calculator expression to classify.",
        repair_action: "ask_user",
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: ok ? [] : manifest.consumes_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: ok ? undefined : classification.blocked_reasons[0] ?? "missing_expression",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: ok ? undefined : classification.blocked_reasons[0] ?? "missing_expression",
    };
  }

  if (manifest.capability_id === CALCULATOR_BIND_VARIABLES_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression ?? args.latex ?? args.text);
    const numericEvidence = [
      ...readCalculatorNumericBindingEvidence(args.numeric_evidence),
      ...readCalculatorNumericBindingEvidence(args.numeric_value_evidence),
    ];
    const binding = bindScientificCalculatorVariables({
      expression,
      numericEvidence,
      expectedUnits: readStringRecord(args.expected_units),
      expectedDimensions: readStringRecord(args.expected_dimensions),
    });
    const ok = binding.status === "succeeded";
    const primaryBlockedReason = binding.blocked_reasons[0] ?? (expression ? "missing_variables" : "missing_expression");
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: ok ? "admitted" : "blocked",
      reason: ok ? "read_only_gateway_capability" : "calculator_variable_binding_blocked",
      blockedReason: ok ? undefined : primaryBlockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      capability_key: manifest.capability_id,
      status: binding.status,
      blocked_reason: ok ? null : primaryBlockedReason,
      ...binding,
      schema: CALCULATOR_BIND_VARIABLES_OBSERVATION_SCHEMA,
      evidence_count: numericEvidence.length,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "bind_variables",
      status: ok ? "succeeded" : "blocked",
      summary: ok
        ? `Calculator bound ${binding.required_symbols.length} variable(s) for ${binding.expression}.`
        : `Calculator variable binding blocked: ${binding.blocked_reasons.join(", ") || primaryBlockedReason}.`,
      observation,
      missingRequirements: ok ? [] : binding.missing_variables.map((variable) => ({
        code: primaryBlockedReason,
        message: `Provide numeric evidence with units and source refs for ${variable}.`,
        repair_action: "provide_numeric_value_evidence",
        required_affordance_kind: "numeric_value_evidence",
      })),
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: ok ? [] : ["numeric_value_evidence"],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: ok ? undefined : primaryBlockedReason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: ok ? undefined : primaryBlockedReason,
    };
  }

  if (manifest.capability_id === CALCULATOR_ACTIVE_CONTEXT_CAPABILITY) {
    const args = readArguments(input.arguments);
    const activeContext = readBoundedCalculatorActiveContext(args.active_context ?? args.activeContext);
    const hasContext = Boolean(
      activeContext.current_latex ||
      activeContext.last_result_text ||
      activeContext.last_normalized_expression ||
      activeContext.recent_debug_events.length > 0
    );
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasContext ? "admitted" : "blocked",
      reason: hasContext ? "read_only_gateway_capability" : "calculator_active_context_missing",
      blockedReason: hasContext ? undefined : "calculator_active_context_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: CALCULATOR_ACTIVE_CONTEXT_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "scientific-calculator",
      status: hasContext ? "succeeded" : "blocked",
      blocked_reason: hasContext ? null : "calculator_active_context_missing",
      ...activeContext,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const summary = hasContext
      ? `Calculator active context observed${activeContext.current_latex ? ` expression ${activeContext.current_latex}` : ""}${activeContext.last_result_text ? ` with result ${activeContext.last_result_text}` : ""}.`
      : "Calculator active context was requested but no bounded calculator state was supplied.";
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "active_context",
      status: hasContext ? "succeeded" : "blocked",
      summary,
      observation,
      missingRequirements: hasContext ? [] : [{
        code: "calculator_active_context_missing",
        message: "Focus the Scientific Calculator panel with an active expression or result before asking about the current calculation.",
        repair_action: "ask_user",
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: hasContext ? [] : manifest.consumes_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasContext ? undefined : "calculator_active_context_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasContext,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasContext ? undefined : "calculator_active_context_missing",
    };
  }

  if (
    manifest.capability_id === READABLE_SURFACE_OBSERVE_CAPABILITY ||
    manifest.capability_id === DOCS_READ_VISIBLE_SURFACE_CAPABILITY ||
    manifest.capability_id === DOCS_READ_ACTIVE_TRANSLATION_CAPABILITY ||
    manifest.capability_id === CALCULATOR_READ_VISIBLE_RESULT_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const surface = buildReadableSurfacePayload({
      capabilityId: manifest.capability_id,
      args,
      fallbackPanelId: manifest.panel_id ?? "workstation",
      fallbackActionId: manifest.action_id,
    });
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: surface.ok ? "admitted" : "blocked",
      reason: surface.ok ? "read_only_gateway_capability" : "readable_surface_missing",
      blockedReason: surface.blockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: surface.panelId,
      action: surface.actionId,
      status: surface.ok ? "succeeded" : "blocked",
      summary: surface.summaryText,
      observation: surface.observation,
      missingRequirements: surface.ok ? [] : [{
        code: surface.blockedReason ?? "registered_surface_text_missing",
        message: "Provide a registered readable surface reference with bounded visible text or surface state.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: surface.blockedReason,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: surface.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: surface.observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: surface.blockedReason,
    };
  }

  if (
    manifest.capability_id === CALCULATOR_OPEN_PANEL_CAPABILITY ||
    manifest.capability_id === CALCULATOR_FOCUS_PANEL_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const action = manifest.capability_id === CALCULATOR_OPEN_PANEL_CAPABILITY ? "open_panel" : "focus_panel";
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "non_mutating_workstation_ui_action",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = {
      schema_version: "helix.workstation.action/v1",
      action,
      panel_id: "scientific-calculator",
    };
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: action,
      panel_id: "scientific-calculator",
      status: "succeeded",
      dispatch_status: "admitted",
      workstation_action: workstationAction,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action,
      status: "succeeded",
      summary: `Admitted non-mutating Scientific Calculator ${action.replace(/_/g, " ")} action.`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === CALCULATOR_PREFILL_EXPRESSION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression ?? args.latex ?? args.text);
    const hasExpression = Boolean(expression);
    const classification = classifyScientificCalculatorExpression(expression);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasExpression ? "admitted" : "blocked",
      reason: hasExpression ? "non_mutating_workstation_ui_action" : "calculator_prefill_expression_missing",
      blockedReason: hasExpression ? undefined : "calculator_prefill_expression_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasExpression
      ? {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "prefill_expression",
          args: {
            expression,
            source_path: cleanString(args.source_path ?? args.path ?? args.source) || null,
            anchor: cleanString(args.anchor) || null,
            source_refs: readStringArray(args.source_refs),
            classification,
          },
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: "prefill_expression",
      status: hasExpression ? "succeeded" : "blocked",
      dispatch_status: hasExpression ? "admitted" : "blocked",
      workstation_action: workstationAction,
      expression: expression || null,
      classification,
      produced_calculator_receipt: false,
      produced_numeric_value_evidence: false,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "prefill_expression",
      status: hasExpression ? "succeeded" : "blocked",
      summary: hasExpression
        ? `Admitted Scientific Calculator expression prefill for ${expression}. No calculation receipt was produced.`
        : "Scientific Calculator expression prefill was blocked because no expression was supplied.",
      observation,
      missingRequirements: hasExpression ? [] : [{
        code: "calculator_prefill_expression_missing",
        message: "Provide a calculator expression to load into the workbench.",
        repair_action: "ask_user",
      }],
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
      missingAffordanceKinds: hasExpression ? [] : manifest.consumes_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasExpression ? undefined : "calculator_prefill_expression_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasExpression,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasExpression ? undefined : "calculator_prefill_expression_missing",
    };
  }

  if (manifest.capability_id === CALCULATOR_SHOW_GATEWAY_SOLVE_CAPABILITY) {
    const args = readArguments(input.arguments);
    const expression = cleanString(args.expression);
    const resultText = cleanString(args.result);
    const normalizedExpression = cleanString(args.normalized_expression ?? args.normalizedExpression, expression);
    const hasSolveObservation = Boolean(expression && resultText);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasSolveObservation ? "admitted" : "blocked",
      reason: hasSolveObservation ? "non_mutating_workstation_ui_action" : "calculator_gateway_solve_observation_missing",
      blockedReason: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasSolveObservation
      ? {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "scientific-calculator",
          action_id: "show_gateway_solve",
          args: {
            expression,
            normalized_expression: normalizedExpression,
            result: resultText,
            source_capability: cleanString(args.source_capability, CALCULATOR_SOLVE_EXPRESSION_CAPABILITY),
            observation_ref: cleanString(args.observation_ref, `${turnId}:${CALCULATOR_SOLVE_EXPRESSION_CAPABILITY}`),
          },
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: "run_panel_action",
      panel_id: "scientific-calculator",
      action_id: "show_gateway_solve",
      status: hasSolveObservation ? "succeeded" : "blocked",
      dispatch_status: hasSolveObservation ? "admitted" : "blocked",
      workstation_action: workstationAction,
      source_capability: CALCULATOR_SOLVE_EXPRESSION_CAPABILITY,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scientific-calculator",
      action: "show_gateway_solve",
      status: hasSolveObservation ? "succeeded" : "blocked",
      summary: hasSolveObservation
        ? `Admitted non-mutating Scientific Calculator gateway solve projection for ${expression} = ${resultText}.`
        : "Scientific Calculator gateway solve projection was blocked because no solve observation was supplied.",
      observation,
      missingRequirements: hasSolveObservation ? [] : [{
        code: "calculator_gateway_solve_observation_missing",
        message: "Provide an observed calculator expression and result from scientific-calculator.solve_expression.",
        repair_action: "run_required_tool",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasSolveObservation,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasSolveObservation ? undefined : "calculator_gateway_solve_observation_missing",
    };
  }

  if (
    manifest.capability_id === WORKSTATION_OPEN_PANEL_CAPABILITY ||
    manifest.capability_id === WORKSTATION_FOCUS_PANEL_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const action = manifest.capability_id === WORKSTATION_OPEN_PANEL_CAPABILITY ? "open_panel" : "focus_panel";
    const panelId = readSafeWorkstationPanelId(args.panel_id ?? args.panelId ?? args.target_panel_id ?? args.targetPanelId);
    const hasPanel = Boolean(panelId);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPanel ? "admitted" : "blocked",
      reason: hasPanel ? "non_mutating_workstation_ui_action" : "workstation_panel_not_in_safe_allowlist",
      blockedReason: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasPanel
      ? {
          schema_version: "helix.workstation.action/v1",
          action,
          panel_id: panelId,
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: action,
      panel_id: panelId,
      status: hasPanel ? "succeeded" : "blocked",
      dispatch_status: hasPanel ? "admitted" : "blocked",
      workstation_action: workstationAction,
      allowed_panel_ids: [...SAFE_WORKSTATION_PANEL_ACTION_IDS],
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: panelId ?? "workstation",
      action,
      status: hasPanel ? "succeeded" : "blocked",
      summary: hasPanel
        ? `Admitted non-mutating workstation ${action.replace(/_/g, " ")} action for ${panelId}.`
        : "Workstation panel action was blocked because the panel is not in the safe allowlist.",
      observation,
      missingRequirements: hasPanel ? [] : [{
        code: "workstation_panel_not_in_safe_allowlist",
        message: "Provide a safe read/observe workstation panel id.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasPanel,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasPanel ? undefined : "workstation_panel_not_in_safe_allowlist",
    };
  }

  if (manifest.capability_id === DOCS_OPEN_DOC_CAPABILITY) {
    const args = readArguments(input.arguments);
    const path = readDocsActionPath(args.path ?? args.doc_path ?? args.target);
    const anchor = readDocsActionAnchor(args.anchor);
    const hasPath = Boolean(path);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPath ? "admitted" : "blocked",
      reason: hasPath ? "non_mutating_workstation_ui_action" : "docs_open_doc_path_missing_or_unsafe",
      blockedReason: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
      sourceTargetIntent: args.source_target_intent,
    });
    const workstationAction = hasPath
      ? {
          schema_version: "helix.workstation.action/v1",
          action: "run_panel_action",
          panel_id: "docs-viewer",
          action_id: "open_doc",
          args: {
            path,
            ...(anchor ? { anchor } : {}),
          },
        }
      : null;
    const observation = {
      schema: WORKSTATION_UI_ACTION_RECEIPT_SCHEMA,
      capability_key: manifest.capability_id,
      action_kind: "open_doc",
      panel_id: "docs-viewer",
      status: hasPath ? "succeeded" : "blocked",
      dispatch_status: hasPath ? "admitted" : "blocked",
      path,
      anchor,
      workstation_action: workstationAction,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "docs-viewer",
      action: "open_doc",
      status: hasPath ? "succeeded" : "blocked",
      summary: hasPath
        ? `Docs Viewer open document action admitted for ${path}.`
        : "Docs Viewer open document action was blocked because no safe docs path was supplied.",
      observation,
      missingRequirements: hasPath ? [] : [{
        code: "docs_open_doc_path_missing_or_unsafe",
        message: "Provide a relative docs/ path to open in the Docs Viewer.",
        repair_action: "ask_user",
      }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: hasPath,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: hasPath ? undefined : "docs_open_doc_path_missing_or_unsafe",
    };
  }

  if (manifest.capability_id === REPO_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeRepoSearchQuery(args.query);
    const paths = readRepoSearchPaths(args.paths);
    const maxHits = readRepoSearchMaxHits(args.max_hits ?? args.maxHits);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9_./-]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "repo_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: REPO_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        query: query || null,
        paths,
        hits: [],
        hit_count: 0,
        truncated: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "repo-evidence",
        action: "search",
        status: "blocked",
        summary: `Repo search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific repo/code/documentation search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const result = await runRepoSearch({
      rawQuestion: query,
      terms: [query],
      paths,
      explicit: true,
      reason: "workstation_gateway_repo_search",
      mode: "explicit",
      intentDomain: "repo",
      topicTags: [],
    });
    const hits = result.hits.slice(0, maxHits).map(clipRepoSearchHit);
    const truncated = result.truncated || result.hits.length > hits.length;
    const evidence = formatRepoSearchEvidence(
      {
        ...result,
        hits,
        truncated,
      },
      {
        lane: "repo_search",
        query,
        sourceStage: "fallback_repo_search",
      },
    );
    const observation = {
      schema: REPO_SEARCH_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      query,
      terms: [query],
      paths,
      hits,
      hit_count: hits.length,
      file_paths: evidence.filePaths,
      evidence_observations: evidence.observations,
      truncated,
      error: result.error,
      search_backend: result.search_backend,
      search_backend_bin: result.search_backend_bin,
      search_backend_reason: result.search_backend_reason,
      status: result.error ? "failed" : "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "repo-evidence",
      action: "search",
      status: result.error ? "failed" : "succeeded",
      summary: result.error
        ? `Repo search failed with ${result.error}.`
        : `Repo search returned ${hits.length} evidence hit(s) for ${query}.`,
      observation,
      missingRequirements: result.error
        ? [{
            code: result.error,
            message: "Repo search could not complete; retry with a narrower query or available repo path.",
            repair_action: "repair",
          }]
        : [],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: result.error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: !result.error,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: result.error,
    };
  }

  if (manifest.capability_id === DOCS_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeRepoSearchQuery(args.query);
    const paths = readDocsSearchPaths(args.paths);
    const maxHits = readRepoSearchMaxHits(args.max_hits ?? args.maxHits);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9_./-]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "docs_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        query: query || null,
        paths,
        hits: [],
        hit_count: 0,
        truncated: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "docs-viewer",
        action: "search_docs",
        status: "blocked",
        summary: `Docs search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific documentation search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchTerms = buildDocsSearchTerms(query);
    const result = await runRepoSearch({
      rawQuestion: query,
      terms: searchTerms,
      paths,
      explicit: true,
      reason: "workstation_gateway_docs_search",
      mode: "explicit",
      intentDomain: "repo",
      topicTags: [],
    });
    const docsHits = mergeDocsSearchPathCandidates(result.hits, paths, query);
    const rankedHits = rankDocsSearchHits(docsHits, query);
    const hits = rankedHits.slice(0, maxHits).map(clipRepoSearchHit);
    const documentCandidates = buildDocsSearchDocumentCandidates(rankedHits, query, maxHits);
    const truncated = result.truncated || rankedHits.length > hits.length;
    const compoundReadAloudResolvedPath = readCompoundReadAloudResolvedDocsPath(
      args.source_target_intent,
      documentCandidates,
    );
    const activeDocumentObservation = readBoundedDocsExcerpt(paths) ??
      (compoundReadAloudResolvedPath ? readBoundedDocsExcerpt([compoundReadAloudResolvedPath]) : null);
    const evidence = formatRepoSearchEvidence(
      {
        ...result,
        hits,
        truncated,
      },
      {
        lane: "repo_search",
        query,
        sourceStage: "fallback_repo_search",
      },
    );
    const observation = {
      schema: DOCS_SEARCH_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      query,
      terms: searchTerms,
      paths,
      hits,
      hit_count: hits.length,
      document_candidates: documentCandidates,
      unique_document_count: documentCandidates.length,
      file_paths: evidence.filePaths,
      active_document_observation: activeDocumentObservation
        ? {
            schema: "helix.docs_active_document_observation.v1",
            path: activeDocumentObservation.path,
            excerpt: activeDocumentObservation.excerpt,
            excerpt_char_count: activeDocumentObservation.excerpt_char_count,
            truncated: activeDocumentObservation.truncated,
            observation_role: "evidence_not_assistant_answer",
            terminal_eligible: false,
            assistant_answer: false,
            raw_content_included: false,
          }
        : null,
      evidence_observations: evidence.observations,
      truncated,
      error: result.error,
      search_backend: result.search_backend,
      search_backend_bin: result.search_backend_bin,
      search_backend_reason: result.search_backend_reason,
      status: result.error ? "failed" : "succeeded",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "docs-viewer",
      action: "search_docs",
      status: result.error ? "failed" : "succeeded",
      summary: result.error
        ? `Docs search failed with ${result.error}.`
        : activeDocumentObservation
          ? `Docs search materialized a bounded active-document excerpt from ${activeDocumentObservation.path}.`
          : `Docs search returned ${documentCandidates.length} document candidate(s) and ${hits.length} evidence hit(s) for ${query}.`,
      observation,
      missingRequirements: result.error
        ? [{
            code: result.error,
            message: "Docs search could not complete; retry with a narrower query or available docs path.",
            repair_action: "repair",
          }]
        : [],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: result.error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: !result.error,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: result.error,
    };
  }

  if (manifest.capability_id === INTERNET_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeExternalSearchQuery(args.query ?? args.search_query ?? args.prompt);
    const providers = readInternetSearchProviders(args.providers);
    const domains = readInternetSearchDomains(args.domains);
    const recencyDays = readInternetSearchRecencyDays(args.recency_days ?? args.recencyDays);
    const limit = readExternalSearchLimit(args.limit ?? args.max_results ?? args.maxResults);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "internet_search_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: INTERNET_SEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        capability: manifest.capability_id,
        query: query || null,
        providers_considered: providers,
        providers_called: [],
        domains,
        recency_days: recencyDays,
        evidence_refs: [],
        results: [],
        missing_requirements: [blockedReason],
        selected_for_answer: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "internet-search",
        action: "search_web",
        status: "blocked",
        summary: `Internet search gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific internet search query.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchObservation = await runInternetSearch({
      turnId,
      callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
      query,
      providers: providers.length ? providers : undefined,
      domains,
      recencyDays,
      limit,
    });
    const observation = {
      ...searchObservation,
      capability_key: manifest.capability_id,
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "internet-search",
      action: "search_web",
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      summary: searchObservation.selected_for_answer
        ? `Internet search returned ${searchObservation.results.length} result(s) for ${query}.`
        : `Internet search returned no usable results for ${query}.`,
      observation,
      missingRequirements: searchObservation.selected_for_answer
        ? []
        : searchObservation.missing_requirements.map((code) => ({
            code,
            message: "Internet search could not produce usable bounded evidence for this query.",
            repair_action: "repair" as const,
          })),
    });
    const error = searchObservation.selected_for_answer
      ? undefined
      : searchObservation.missing_requirements[0] ?? "no_internet_search_results_returned";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: searchObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (
    manifest.capability_id === VOICE_INTERIM_CALLOUT_CAPABILITY ||
    manifest.capability_id === VOICE_NARRATOR_SAY_CAPABILITY ||
    manifest.capability_id === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY
  ) {
    const args = readArguments(input.arguments);
    const text = cleanString(args.text ?? args.message);
    const explicitThreadId = cleanString(args.thread_id ?? args.threadId);
    const effectiveThreadId = explicitThreadId || "helix-ask:desktop";
    const requiresConfirmation = readBoolean(args.requires_confirmation ?? args.requiresConfirmation, false);
    const sourceObservationRef = optionalString(args.source_observation_ref ?? args.sourceObservationRef);
    const result = recordInterimVoiceCalloutRequest({
      turnId: cleanString(args.turn_id ?? args.turnId, turnId),
      threadId: effectiveThreadId,
      source: cleanString(args.source, "ask_tool_loop"),
      kind: manifest.capability_id === VOICE_NARRATOR_SAY_CAPABILITY
        ? "narrator_read"
        : cleanString(args.kind, manifest.capability_id === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY ? "tool_result" : "tool_progress"),
      text,
      maxChars: readFiniteNumber(args.max_chars ?? args.maxChars),
      timingHintMs: readFiniteNumber(args.timing_hint_ms ?? args.timingHintMs),
      voicePlaybackKind: manifest.capability_id === VOICE_NARRATOR_SAY_CAPABILITY
        ? "narrator_read"
        : cleanString(args.voice_playback_kind ?? args.voicePlaybackKind),
      requiresConfirmation,
      evidenceRefs: [
        ...readStringArray(args.evidence_refs),
        ...readStringArray(args.evidenceRefs),
        ...(sourceObservationRef ? [sourceObservationRef] : []),
      ],
      reasonCodes: [
        "provider_gateway_voice_request",
        ...(manifest.capability_id === TEXT_TO_SPEECH_SPEAK_TEXT_CAPABILITY ? ["text_to_speech_speak_text_lane"] : []),
        ...readStringArray(args.reason_codes ?? args.reasonCodes),
      ],
    });
    const ok = isVoiceClientHandoffReceipt(result.receipt);
    const blockedReason = ok ? null : result.receipt.status;
    const voiceModelId = cleanString(process.env.ELEVENLABS_MODEL_ID, "eleven_multilingual_v2");
    const sourceTextHash = hashShort(text ?? "");
    const audioBytesObserved = result.receipt.delivery?.playbackStatus === "client_confirmed";
    const audioRef = result.receipt.delivery?.utteranceId ?? null;
    const normalizedPlaybackStatus = mapInterimVoiceReceiptToGatewayPlaybackStatus(result.receipt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: ok ? "admitted" : "blocked",
      reason: ok ? "voice_gateway_receipt_created" : "voice_gateway_receipt_blocked",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });
    const observation = {
      schema: VOICE_INTERIM_TOOL_RESULT_SCHEMA,
      capability_key: manifest.capability_id,
      capability: manifest.capability_id,
      selected_model_or_service: voiceModelId,
      resolved_model_or_service: voiceModelId,
      model_id: voiceModelId,
      voice_model_id: voiceModelId,
      status: ok ? "succeeded" : "blocked",
      blocked_reason: blockedReason,
      request: result.request,
      receipt: {
        ...result.receipt,
        tool: manifest.capability_id,
        utterance_id: result.receipt.delivery?.utteranceId ?? null,
        playback_status: normalizedPlaybackStatus,
        audio_ref: audioRef,
        audio_url: null,
        audio_bytes_observed: audioBytesObserved,
        delivered_at_ms: result.receipt.status === "delivered" ? Date.now() : null,
        source_text_hash: sourceTextHash,
        backend_provider: "existing_voice_service",
        selected_model_or_service: voiceModelId,
        resolved_model_or_service: voiceModelId,
        model_id: voiceModelId,
        voice_model_id: voiceModelId,
      },
      host_projection: {
        kind: "voice_playback_request",
        request_id: result.request.requestId,
        receipt_id: result.receipt.receiptId,
        selected_model_or_service: voiceModelId,
        resolved_model_or_service: voiceModelId,
        model_id: voiceModelId,
        voice_model_id: voiceModelId,
        playback_status: result.receipt.status,
        normalized_playback_status: normalizedPlaybackStatus,
        audio_ref: audioRef,
        audio_bytes_observed: audioBytesObserved,
        source_text_hash: sourceTextHash,
        source_observation_ref: sourceObservationRef,
        locale: cleanString(args.locale),
        voice_profile: cleanString(args.profile ?? args.voice),
        assistant_answer: false,
        terminal_eligible: false,
        raw_content_included: false,
      },
      post_tool_model_step_required: true,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
      context_role: "tool_evidence",
      ask_context_policy: "evidence_only",
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "voice-delivery",
      action: manifest.action_id,
      status: ok ? "succeeded" : "blocked",
      summary: ok
        ? `Voice gateway created ${result.receipt.status} receipt ${result.receipt.receiptId}.`
        : `Voice gateway blocked request: ${blockedReason ?? "unknown"}.`,
      observation,
      missingRequirements: ok ? [] : [{
        code: blockedReason ?? "voice_gateway_blocked",
        message: result.receipt.delivery?.message ?? "Voice request did not produce a playable receipt.",
        repair_action: blockedReason === "blocked_missing_text" ? "ask_user" : "repair",
      }],
    });
    observationPacket.state_delta = {
      ...observationPacket.state_delta,
      text_to_speech_client_playback_handoff: observation,
    };
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: blockedReason ?? undefined,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error: blockedReason ?? undefined,
    };
  }

  const contextFeedQuerySpec = workstationContextFeedQuerySpecForCapability(manifest.capability_id);
  if (contextFeedQuerySpec && SHARED_CONTEXT_FEED_QUERY_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? args
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const nestedObservation = readRecord(liveObservation.observation);
    const missingRequirements = readStringArray(
      nestedObservation?.missing_requirements ?? nestedObservation?.missingRequirements,
    ).map((requirement) => ({
      code: requirement,
      message: `Context feed query ${manifest.capability_id} requires ${requirement}.`,
      repair_action: "ask_user" as const,
    }));
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: contextFeedQuerySpec.actuator,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
      missingRequirements,
    });
    const error = liveObservation.ok ? undefined : "context_feed_query_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === LIVE_SOURCE_LOOP_HEALTH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? args
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: LIVE_SOURCE_LOOP_HEALTH_CAPABILITY as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "live_source_loop_health_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_LIVE_SOURCE_STATE_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? args
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "live_source_state_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_SITUATION_STAGE_STATE_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? args
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "situation_stage_state_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_LIVE_SOURCE_MAILBOX_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? {
          ...args,
          read_only: true,
          readOnly: true,
        }
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
          read_only: true,
          readOnly: true,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "live_source_mailbox_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_LIVE_SOURCE_INTERPRETER_PREDICTION_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? {
          ...args,
          read_only: true,
          readOnly: true,
        }
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
          read_only: true,
          readOnly: true,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "live_source_interpreter_prediction_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_STAGE_PLAY_BUILDER_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceRef =
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef) ??
      optionalString(args.source_id) ??
      optionalString(args.sourceId);
    const toolArgs = suppliedSourceRef
      ? {
          ...args,
          read_only: true,
          readOnly: true,
        }
      : {
          ...args,
          source_ref: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
          read_only: true,
          readOnly: true,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "stage-play-badge-graph",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "stage_play_builder_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_MICRO_REASONER_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceId =
      optionalString(args.source_id) ??
      optionalString(args.sourceId) ??
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef);
    const toolArgs = suppliedSourceId
      ? args
      : {
          ...args,
          source_id: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "micro_reasoner_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (SHARED_VISUAL_OBSERVER_READ_CAPABILITIES.has(manifest.capability_id)) {
    const args = readArguments(input.arguments);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: "admitted",
      reason: "read_only_gateway_capability",
      sourceTargetIntent: args.source_target_intent,
    });
    const threadIdForTool = optionalString(args.thread_id) ?? turnId;
    const suppliedSourceId =
      optionalString(args.source_id) ??
      optionalString(args.sourceId) ??
      optionalString(args.source_ref) ??
      optionalString(args.sourceRef);
    const toolArgs = suppliedSourceId
      ? args
      : {
          ...args,
          source_id: `workstation_gateway:${threadIdForTool}:${manifest.capability_id}`,
        };
    const liveObservation = executeLiveEnvironmentTool({
      tool_name: manifest.capability_id as HelixLiveEnvironmentToolName,
      thread_id: threadIdForTool,
      environment_id: optionalString(args.environment_id),
      args: toolArgs,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: manifest.panel_id ?? "live-answer-environment",
      action: manifest.action_id,
      status: liveObservation.ok ? "succeeded" : "blocked",
      summary: liveObservation.summary,
      observation: liveObservation,
    });
    const error = liveObservation.ok ? undefined : "visual_observer_read_unavailable";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: liveObservation.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: liveObservation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === SCHOLARLY_RESEARCH_SEARCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeExternalSearchQuery(args.query ?? args.search_query ?? args.prompt ?? args.doi ?? args.arxiv_id);
    const providers = readScholarlyResearchProviders(args.providers);
    const scholarlyMode = readScholarlyResearchMode(args.mode);
    const limit = readExternalSearchLimit(args.limit ?? args.max_results ?? args.maxResults);
    const blockedReason = !query
      ? "missing_query"
      : query.length < 3 || !/[a-z0-9]/i.test(query)
        ? "query_too_broad"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "scholarly_research_query_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });

    if (blockedReason) {
      const observation = {
        schema: SCHOLARLY_RESEARCH_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        capability: manifest.capability_id,
        query: query || null,
        intent: scholarlyMode ?? "paper_search",
        providers_considered: providers,
        providers_called: [],
        evidence_refs: [],
        papers: [],
        missing_requirements: [blockedReason],
        selected_for_answer: false,
        status: "blocked",
        blocked_reason: blockedReason,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "scholarly-research",
        action: "lookup_papers",
        status: "blocked",
        summary: `Scholarly research gateway blocked query: ${blockedReason}.`,
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: "Provide a specific scholarly search query, DOI, or arXiv id.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: blockedReason,
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }

    const searchObservation = await runScholarlyResearchLookup({
      turnId,
      callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
      query,
      mode: scholarlyMode,
      providers: providers.length ? providers : undefined,
      limit,
    });
    const observation = {
      ...searchObservation,
      capability_key: manifest.capability_id,
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scholarly-research",
      action: "lookup_papers",
      status: searchObservation.selected_for_answer ? "succeeded" : "failed",
      summary: searchObservation.selected_for_answer
        ? `Scholarly research lookup returned ${searchObservation.papers.length} paper(s) for ${query}.`
        : `Scholarly research lookup returned no usable papers for ${query}.`,
      observation,
      missingRequirements: searchObservation.selected_for_answer
        ? []
        : searchObservation.missing_requirements.map((code) => ({
            code,
            message: "Scholarly research lookup could not produce usable bounded paper evidence for this query.",
            repair_action: "repair" as const,
          })),
    });
    const error = searchObservation.selected_for_answer
      ? undefined
      : searchObservation.missing_requirements[0] ?? "no_scholarly_results_returned";
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: searchObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === SCHOLARLY_FULL_TEXT_FETCH_CAPABILITY) {
    const args = readArguments(input.arguments);
    const query = normalizeExternalSearchQuery(args.query ?? args.prompt ?? args.paper_result_id ?? args.source_url ?? "paper full text");
    const sourceUrl = optionalString(args.source_url ?? args.sourceUrl);
    const paperResultId = optionalString(args.paper_result_id ?? args.paperResultId ?? args.source_ref ?? args.sourceRef);
    const paper = readRecord(args.paper);
    const papers = readArray(args.papers).map(readRecord).filter((entry): entry is Record<string, unknown> => Boolean(entry));
    const hasFetchableSource =
      Boolean(sourceUrl) ||
      hasFetchableScholarlyPaperIdentity(paper) ||
      papers.some((entry) => {
        if (!paperResultId) return hasFetchableScholarlyPaperIdentity(entry);
        const identifiers = readRecord(entry.identifiers);
        return (
          (optionalString(entry.result_id) === paperResultId ||
            optionalString(identifiers?.doi) === paperResultId ||
            optionalString(identifiers?.arxiv_id) === paperResultId) &&
          hasFetchableScholarlyPaperIdentity(entry)
        );
      });
    const blockedReason = !hasFetchableSource
      ? paperResultId || paper || papers.length > 0
        ? "fetchable_paper_identity_required"
        : "paper_result_or_source_required"
      : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "scholarly_full_text_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });
    if (blockedReason) {
      const variableSourcePlan = readRecord(args.variable_source_plan ?? args.variableSourcePlan);
      const sourceTargetIntent = readRecord(args.source_target_intent ?? args.sourceTargetIntent);
      const fullTextRecoveryAffordance = buildScholarlyFullTextRecoveryAffordance({
        query,
        blockedReason,
        paperResultId,
        paper,
        papers,
        variableSourcePlan,
        sourceTargetIntent,
      });
      const observation = {
        schema: SCHOLARLY_FULL_TEXT_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        capability: manifest.capability_id,
        query,
        ...(variableSourcePlan ? { variable_source_plan: variableSourcePlan } : {}),
        source_kind: "unknown",
        pages_parsed: 0,
        page_text_refs: [],
        selected_chunks: [],
        visual_candidates: [],
        missing_requirements: [blockedReason],
        scholarly_full_text_recovery_affordance: fullTextRecoveryAffordance,
        recovery_affordances: [fullTextRecoveryAffordance],
        selected_for_answer: false,
        status: "blocked",
        blocked_reason: blockedReason,
        context_policy: "compact_context_pack_only",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "scholarly-research",
        action: "fetch_full_text",
        status: "blocked",
        summary: blockedReason === "fetchable_paper_identity_required"
          ? "Scholarly full-text fetch was blocked because the paper identity was not fetchable from the current turn evidence."
          : "Scholarly full-text fetch was blocked because no paper ref or source URL was supplied.",
        observation,
        missingRequirements: [{
          code: blockedReason,
          message: blockedReason === "fetchable_paper_identity_required"
            ? "Provide a paper result or source_ref from a lookup observation that includes a DOI/arXiv/PDF/full-text URL, or run lookup_papers again for the target title."
            : "Provide a paper result, paper_result_id with papers, or an accessible source_url.",
          repair_action: "ask_user",
        }],
      });
      observationPacket.state_delta = {
        ...observationPacket.state_delta,
        scholarly_full_text_recovery_affordance: fullTextRecoveryAffordance,
        recovery_affordances: [
          ...readArray(observationPacket.state_delta?.recovery_affordances),
          fullTextRecoveryAffordance,
        ],
      };
      observationPacket.suggested_next_steps = Array.from(new Set([
        ...observationPacket.suggested_next_steps,
        "use_another_tool",
        "repair",
        "ask_user",
      ]));
      const trace = buildGatewayTrace({ turnId, capabilityId: manifest.capability_id, agentRuntime, admission, observationPacket, error: blockedReason });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: blockedReason,
      };
    }
    const fullTextObservation = await runScholarlyFullTextFetch({
      turnId,
      callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
      query,
      paper: paper as never,
      papers: papers as never,
      paperResultId,
      sourceUrl,
      maxPages: readFiniteNumber(args.max_pages ?? args.maxPages),
      maxChunks: readFiniteNumber(args.max_chunks ?? args.maxChunks),
      cachePdf: false,
    });
    const observation = {
      ...fullTextObservation,
      capability_key: manifest.capability_id,
      status: fullTextObservation.selected_for_answer ? "succeeded" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scholarly-research",
      action: "fetch_full_text",
      status: fullTextObservation.selected_for_answer ? "succeeded" : "failed",
      summary: fullTextObservation.selected_for_answer
        ? `Scholarly full-text fetch selected ${fullTextObservation.selected_chunks.length} bounded chunk(s).`
        : "Scholarly full-text fetch did not produce usable bounded text evidence.",
      observation,
      missingRequirements: fullTextObservation.selected_for_answer
        ? []
        : fullTextObservation.missing_requirements.map((code) => ({
            code,
            message: "Scholarly full text could not be fetched or parsed into bounded text evidence.",
            repair_action: "repair" as const,
          })),
      producedAffordances: buildGatewayProducedAffordances({ capabilityId: manifest.capability_id, observation }),
      consumedAffordances: buildGatewayConsumedAffordances({ capabilityId: manifest.capability_id, observation }),
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
    });
    const error = fullTextObservation.selected_for_answer ? undefined : fullTextObservation.missing_requirements[0] ?? "scholarly_full_text_unavailable";
    const trace = buildGatewayTrace({ turnId, capabilityId: manifest.capability_id, agentRuntime, admission, observationPacket, error });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: fullTextObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: observationPacket.produced_affordances,
      consumed_affordances: observationPacket.consumed_affordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === SCHOLARLY_NUMERIC_PARAMETER_EXTRACT_CAPABILITY) {
    const args = readArguments(input.arguments);
    const requestedVariables = readStringArray(args.requested_variables ?? args.requestedVariables ?? args.variables);
    const extractionMode = cleanString(args.extraction_mode ?? args.extractionMode) === "open_supported_parameters" || requestedVariables.length === 0
      ? "open_supported_parameters"
      : "requested_variables";
    const fullTextObservation = readRecord(args.full_text_observation ?? args.fullTextObservation);
    const textEvidence = optionalString(args.text_evidence ?? args.textEvidence ?? args.text);
    const sourceRef = optionalString(args.source_ref ?? args.sourceRef);
    const variableSourcePlan = readRecord(args.variable_source_plan ?? args.variableSourcePlan);
    const sourceTargetIntent = readRecord(args.source_target_intent ?? args.sourceTargetIntent);
    const blockedReason = !fullTextObservation && !textEvidence
        ? "text_evidence_required"
        : null;
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: blockedReason ? "blocked" : "admitted",
      reason: blockedReason ? "scholarly_numeric_parameter_blocked" : "read_only_gateway_capability",
      blockedReason: blockedReason ?? undefined,
      sourceTargetIntent: args.source_target_intent,
    });
    const numericObservation = blockedReason
      ? {
          schema: SCHOLARLY_NUMERIC_PARAMETER_OBSERVATION_SCHEMA,
          artifact_id: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}:scholarly_numeric_parameter_observation`,
          turn_id: turnId,
          capability: manifest.capability_id,
          capability_key: manifest.capability_id,
          source_ref: sourceRef,
          paper: {},
          requested_variables: requestedVariables,
          parameters: [],
          missing_variables: extractionMode === "open_supported_parameters" ? [] : requestedVariables,
          rejected_candidates: [],
          missing_requirements: [blockedReason],
          variable_source_plan: variableSourcePlan,
          selected_for_answer: false,
          extraction_mode: extractionMode,
          status: "blocked",
          blocked_reason: blockedReason,
          terminal_eligible: false,
          post_tool_model_step_required: true,
          assistant_answer: false,
          raw_content_included: false,
        }
      : {
          ...runScholarlyNumericParameterExtraction({
            turnId,
            callId: `${turnId}:workstation_gateway:${manifest.capability_id}:${iteration}`,
            requestedVariables,
            extractionMode,
            fullTextObservation: fullTextObservation as never,
            textEvidence,
            sourceRef,
            paper: readRecord(args.paper) as never,
          }),
        };
    const numericRecoveryAffordance = buildScholarlyNumericRecoveryAffordance({
      requestedVariables,
      missingVariables: readStringArray(numericObservation.missing_variables),
      variableSourcePlan,
      sourceTargetIntent,
      sourceRef,
      paper: readRecord(numericObservation.paper) ?? readRecord(args.paper),
      extractionMode,
      blockedReason,
    });
    const observation = {
      ...numericObservation,
      ...(variableSourcePlan ? { variable_source_plan: variableSourcePlan } : {}),
      ...(numericRecoveryAffordance ? {
        scholarly_numeric_recovery_affordance: numericRecoveryAffordance,
        recovery_affordances: [
          ...readArray((numericObservation as Record<string, unknown>).recovery_affordances),
          numericRecoveryAffordance,
        ],
      } : {}),
      status: numericObservation.selected_for_answer ? "succeeded" : blockedReason ? "blocked" : "failed",
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const status = numericObservation.selected_for_answer ? "succeeded" : blockedReason ? "blocked" : "failed";
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "scholarly-research",
      action: "extract_numeric_parameters",
      status,
      summary: numericObservation.selected_for_answer
        ? `Scholarly numeric extraction found ${numericObservation.parameters.length} cited parameter value(s).`
        : `Scholarly numeric extraction is missing ${numericObservation.missing_variables.length || requestedVariables.length} requested variable(s).`,
      observation,
      missingRequirements: numericObservation.selected_for_answer
        ? []
        : numericObservation.missing_requirements.map((code) => ({
            code,
            message: "Required numeric paper evidence is missing, ambiguous, uncited, or unit-incompatible.",
            repair_action: blockedReason ? "ask_user" as const : "repair" as const,
          })),
      producedAffordances: buildGatewayProducedAffordances({ capabilityId: manifest.capability_id, observation }),
      consumedAffordances: buildGatewayConsumedAffordances({ capabilityId: manifest.capability_id, observation }),
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
    });
    if (numericRecoveryAffordance) {
      observationPacket.state_delta = {
        ...observationPacket.state_delta,
        scholarly_numeric_recovery_affordance: numericRecoveryAffordance,
        recovery_affordances: [
          ...readArray(observationPacket.state_delta?.recovery_affordances),
          numericRecoveryAffordance,
        ],
      };
      observationPacket.suggested_next_steps = Array.from(new Set([
        ...observationPacket.suggested_next_steps,
        "use_another_tool",
        "ask_user",
      ]));
    }
    const error = numericObservation.selected_for_answer ? undefined : numericObservation.missing_requirements[0] ?? "missing_requested_numeric_variables";
    const trace = buildGatewayTrace({ turnId, capabilityId: manifest.capability_id, agentRuntime, admission, observationPacket, error });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: numericObservation.selected_for_answer,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: observationPacket.produced_affordances,
      consumed_affordances: observationPacket.consumed_affordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      error,
    };
  }

  if (manifest.capability_id === CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const prompt = cleanString(args.prompt ?? args.query ?? args.text);
    const hasPrompt = Boolean(prompt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPrompt ? "admitted" : "blocked",
      reason: hasPrompt ? "read_only_gateway_capability" : "civilization_bounds_prompt_missing",
      blockedReason: hasPrompt ? undefined : "civilization_bounds_prompt_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    if (!hasPrompt) {
      const observation = {
        schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        status: "blocked",
        blocked_reason: "civilization_bounds_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "civilization-bounds-roadmap",
        action: "reflect_system_bounds",
        status: "blocked",
        summary: "Civilization Bounds reflection was blocked because no prompt was supplied.",
        observation,
        missingRequirements: [{
          code: "civilization_bounds_prompt_missing",
          message: "Provide a prompt or scenario context to reflect through Civilization Bounds.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: "civilization_bounds_prompt_missing",
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: "civilization_bounds_prompt_missing",
      };
    }

    const output = await runHelixAskCivilizationBoundsTool({
      prompt,
      scenarioId: optionalString(args.scenario_id ?? args.scenarioId) ?? undefined,
      phaseId: optionalString(args.phase_id ?? args.phaseId) ?? undefined,
      layerMode: readCivilizationLayerMode(args.layer_mode ?? args.layerMode),
      selectedSystemIds: readStringArray(args.selected_system_ids ?? args.selectedSystemIds),
      selectedBadgeIds: readStringArray(args.selected_badge_ids ?? args.selectedBadgeIds),
      theoryReflectionRef: optionalString(args.theory_reflection_ref ?? args.theoryReflectionRef) ?? undefined,
      ideologyReflectionRef: optionalString(args.ideology_reflection_ref ?? args.ideologyReflectionRef) ?? undefined,
      options: {
        includeBridgeContext: args.include_bridge_context === true || args.includeBridgeContext === true,
        includeCollaborationBounds:
          args.include_collaboration_bounds === true || args.includeCollaborationBounds === true,
        includeFalsificationHooks: args.include_falsification_hooks === true || args.includeFalsificationHooks === true,
      },
    });
    const roadmap = output.roadmap;
    const parameterScopeKinds = output.parameterScopes.map((scope) => scope.kind).slice(0, 12);
    const actionChannelKinds = output.actionChannels.map((channel) => channel.kind).slice(0, 12);
    const missingEvidence = (output.bridgeContext?.missingEvidence ?? [])
      .map((entry) => cleanString(entry))
      .filter(Boolean)
      .slice(0, 12);
    const observation = {
      schema: CIVILIZATION_BOUNDS_REFLECTION_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "civilization-bounds-roadmap",
      action_id: "reflect_system_bounds",
      status: "succeeded",
      prompt,
      roadmap_id: roadmap.roadmapId,
      scenario_id: roadmap.scenarioId,
      parameter_scope_kinds: parameterScopeKinds,
      action_channel_kinds: actionChannelKinds,
      dependency_chain_count: output.dependencyChains.length,
      comparison_case_count: output.comparisonCases.length,
      hypothesis_claim_count: output.hypothesisClaims.length,
      missing_evidence: missingEvidence,
      bridge_context_included: Boolean(output.bridgeContext),
      procedural_scaffold_id: output.proceduralScaffold.scaffoldId,
      authority: roadmap.authority,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "civilization-bounds-roadmap",
      action: "reflect_system_bounds",
      status: "succeeded",
      summary: `Civilization Bounds reflection produced ${parameterScopeKinds.length} parameter scope(s), ${actionChannelKinds.length} action channel(s), and ${missingEvidence.length} missing-evidence hook(s).`,
      observation,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === THEORY_CONTEXT_REFLECTION_CAPABILITY) {
    const args = readArguments(input.arguments);
    const prompt = cleanString(args.prompt ?? args.query ?? args.text);
    const conversationContext = optionalString(args.conversation_context ?? args.conversationContext);
    const limitRaw = Number(args.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 12) : undefined;
    const hasPrompt = Boolean(prompt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPrompt ? "admitted" : "blocked",
      reason: hasPrompt ? "read_only_gateway_capability" : "theory_reflection_prompt_missing",
      blockedReason: hasPrompt ? undefined : "theory_reflection_prompt_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    if (!hasPrompt) {
      const observation = {
        schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        status: "blocked",
        blocked_reason: "theory_reflection_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "theory-badge-graph",
        action: "reflect_discussion_context",
        status: "blocked",
        summary: "Theory Badge Graph reflection was blocked because no prompt was supplied.",
        observation,
        missingRequirements: [{
          code: "theory_reflection_prompt_missing",
          message: "Provide a prompt or discussion context to reflect against the Theory Badge Graph.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: "theory_reflection_prompt_missing",
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: "theory_reflection_prompt_missing",
      };
    }

    const receipt = runHelixTheoryContextReflectionTool({
      graph: buildNhm2TheoryBadgeGraphV1(),
      turnId,
      threadId: optionalString(args.thread_id ?? args.threadId),
      prompt,
      conversationContext,
      mentionedEquations: readStringArray(args.mentioned_equations ?? args.mentionedEquations),
      mentionedSymbols: readStringArray(args.mentioned_symbols ?? args.mentionedSymbols),
      mentionedDomains: readStringArray(args.mentioned_domains ?? args.mentionedDomains),
      limit,
      buildExplanationPlan: args.build_explanation_plan === true || args.buildExplanationPlan === true,
      panelSync: {
        requested: false,
        applied: false,
        openPanel: false,
        overlayMode: "none",
      },
    });
    const reflection = receipt.reflectionV1;
    const observation = {
      schema: THEORY_CONTEXT_REFLECTION_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "theory-badge-graph",
      action_id: "reflect_discussion_context",
      status: "succeeded",
      prompt,
      conversation_context_included: Boolean(conversationContext),
      reflection_id: reflection.reflectionId,
      summary: reflection.evidenceForAsk.summary,
      exact_badge_ids: reflection.overlay.exactBadgeIds.slice(0, 12),
      likely_badge_ids: reflection.overlay.likelyBadgeIds.slice(0, 12),
      highlighted_badge_ids: reflection.overlay.highlightedBadgeIds.slice(0, 12),
      claim_boundary_notes: reflection.evidenceForAsk.claimBoundaries.slice(0, 8),
      calculator_payloads: reflection.evidenceForAsk.calculatorPayloads.slice(0, 12).map((payload) => ({
        badge_id: payload.badgeId,
        badge_title: payload.badgeTitle,
        payload_id: payload.payloadId,
        expression: payload.expression,
        display_latex: payload.displayLatex,
        target_variable: payload.targetVariable,
        claim_boundary_notes: payload.claimBoundaryNotes.slice(0, 4),
      })),
      recommended_action_ids: receipt.recommendedNextActions.map((action) => action.actionId).slice(0, 12),
      recommended_actions_solve: receipt.recommendedNextActions.some((action) => action.solves === true),
      receipt_schema: receipt.schemaVersion,
      reflection_terminal_eligible: reflection.terminal_eligible,
      authority: receipt.authority,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "theory-badge-graph",
      action: "reflect_discussion_context",
      status: "succeeded",
      summary: `Theory Badge Graph reflection produced ${observation.exact_badge_ids.length} exact badge match(es), ${observation.likely_badge_ids.length} likely match(es), and ${observation.claim_boundary_notes.length} claim-boundary note(s).`,
      observation,
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: true,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
  }

  if (manifest.capability_id === moralLivingSubstrateReflectionManifest.capability_id) {
    const args = readArguments(input.arguments);
    const gatewayResult = buildMoralSubstrateReflectionGatewayObservation(args);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: gatewayResult.admissionStatus,
      reason: gatewayResult.admissionReason,
      blockedReason: gatewayResult.blockedReason,
      sourceTargetIntent: args.source_target_intent,
    });
    const producedAffordances = buildGatewayProducedAffordances({
      capabilityId: manifest.capability_id,
      observation: gatewayResult.observation,
    });
    const consumedAffordances = buildGatewayConsumedAffordances({
      capabilityId: manifest.capability_id,
      observation: gatewayResult.observation,
    });
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: gatewayResult.panelId,
      action: gatewayResult.action,
      status: gatewayResult.observationStatus,
      summary: gatewayResult.summary,
      observation: gatewayResult.observation,
      missingRequirements: gatewayResult.missingRequirements,
      producedAffordances,
      consumedAffordances,
      requiredAffordanceKinds: manifest.consumes_affordances,
      producedAffordanceKinds: manifest.produces_affordances,
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: gatewayResult.error,
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: gatewayResult.ok,
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation: gatewayResult.observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      produced_affordances: producedAffordances,
      consumed_affordances: consumedAffordances,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      ...(gatewayResult.error ? { error: gatewayResult.error } : {}),
    };
  }

  if (manifest.capability_id === THEORY_FRONTIER_CONJECTURE_CAPABILITY) {
    const args = readArguments(input.arguments);
    const prompt = cleanString(args.prompt ?? args.query ?? args.text);
    const conversationContext = optionalString(args.conversation_context ?? args.conversationContext);
    const limitRaw = Number(args.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 12) : undefined;
    const hasPrompt = Boolean(prompt);
    const admission = buildAdmission({
      capabilityId: manifest.capability_id,
      agentRuntime,
      permissionProfile: manifest.permission_profile_required,
      status: hasPrompt ? "admitted" : "blocked",
      reason: hasPrompt ? "read_only_gateway_capability" : "theory_frontier_conjecture_prompt_missing",
      blockedReason: hasPrompt ? undefined : "theory_frontier_conjecture_prompt_missing",
      sourceTargetIntent: args.source_target_intent,
    });
    if (!hasPrompt) {
      const observation = {
        schema: THEORY_FRONTIER_CONJECTURE_OBSERVATION_SCHEMA,
        capability_key: manifest.capability_id,
        status: "blocked",
        blocked_reason: "theory_frontier_conjecture_prompt_missing",
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
      };
      const observationPacket = buildWorkstationGatewayObservationPacket({
        turnId,
        iteration,
        capabilityId: manifest.capability_id,
        panelId: "theory-badge-graph",
        action: "propose_frontier_conjectures",
        status: "blocked",
        summary: "Theory Badge Graph conjecture workbench was blocked because no prompt was supplied.",
        observation,
        missingRequirements: [{
          code: "theory_frontier_conjecture_prompt_missing",
          message: "Provide a prompt or discussion context before proposing frontier conjecture candidates.",
          repair_action: "ask_user",
        }],
      });
      const trace = buildGatewayTrace({
        turnId,
        capabilityId: manifest.capability_id,
        agentRuntime,
        admission,
        observationPacket,
        error: "theory_frontier_conjecture_prompt_missing",
      });
      return {
        schema: "helix.workstation_tool_gateway.call_result.v1",
        manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
        ok: false,
        agent_runtime: agentRuntime,
        capability_id: manifest.capability_id,
        mode,
        gateway_admission: admission,
        observation_packet: observationPacket,
        tool_lifecycle_trace: trace.tool_lifecycle_trace,
        tool_followup_decision: trace.tool_followup_decision,
        observation,
        artifact_refs: observationPacket.produced_artifact_refs,
        terminal_eligible: false,
        post_tool_model_step_required: true,
        assistant_answer: false,
        raw_content_included: false,
        error: "theory_frontier_conjecture_prompt_missing",
      };
    }

    const receipt = runHelixTheoryContextReflectionTool({
      graph: buildNhm2TheoryBadgeGraphV1(),
      turnId,
      threadId: optionalString(args.thread_id ?? args.threadId),
      prompt,
      conversationContext,
      mentionedEquations: readStringArray(args.mentioned_equations ?? args.mentionedEquations),
      mentionedSymbols: readStringArray(args.mentioned_symbols ?? args.mentionedSymbols),
      mentionedDomains: readStringArray(args.mentioned_domains ?? args.mentionedDomains),
      limit,
      buildExplanationPlan: args.build_explanation_plan !== false && args.buildExplanationPlan !== false,
      buildFrontierSearch: true,
      frontierSearchSeed: optionalString(args.frontier_search_seed ?? args.frontierSearchSeed),
      panelSync: {
        requested: false,
        applied: false,
        openPanel: false,
        overlayMode: "none",
      },
    });
    const frontierSearch = receipt.frontierSearchV1;
    const forbiddenClaimNotes = theoryFrontierConjectureForbiddenClaimNotes(prompt);
    const workbench = frontierSearch
      ? buildTheoryFrontierConjectureWorkbenchV1(frontierSearch, receipt.recommendedNextActions, forbiddenClaimNotes)
      : null;
    const observation = {
      schema: THEORY_FRONTIER_CONJECTURE_OBSERVATION_SCHEMA,
      capability_key: manifest.capability_id,
      panel_id: "theory-badge-graph",
      action_id: "propose_frontier_conjectures",
      status: workbench ? "succeeded" : "blocked",
      prompt,
      conversation_context_included: Boolean(conversationContext),
      reflection_id: receipt.reflectionV1.reflectionId,
      search_id: workbench?.search_id ?? null,
      graph_id: workbench?.graph_id ?? receipt.reflectionV1.graphId,
      frontier_candidate_count: workbench?.candidates.length ?? 0,
      candidates: workbench?.candidates ?? [],
      candidate_status_counts: workbench?.candidate_status_counts ?? {},
      top_candidate_id: workbench?.top_candidate_id ?? null,
      scholarly_lookup_request_count: workbench?.scholarly_lookup_request_count ?? 0,
      exact_verification_result_count: receipt.frontierExactVerificationResultsV1.length,
      probability_terrain: workbench?.probability_terrain ?? null,
      claim_boundary_notes: receipt.reflectionV1.evidenceForAsk.claimBoundaries.slice(0, 12),
      forbidden_claim_scan_notes: forbiddenClaimNotes,
      recommended_action_ids: receipt.recommendedNextActions.map((action) => action.actionId).slice(0, 12),
      recommended_actions_solve: false,
      receipt_schema: receipt.schemaVersion,
      authority: receipt.authority,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
    };
    const observationPacket = buildWorkstationGatewayObservationPacket({
      turnId,
      iteration,
      capabilityId: manifest.capability_id,
      panelId: "theory-badge-graph",
      action: "propose_frontier_conjectures",
      status: workbench ? "succeeded" : "blocked",
      summary: workbench
        ? `Theory Badge Graph conjecture workbench produced ${workbench.candidates.length} bounded frontier candidate(s).`
        : "Theory Badge Graph conjecture workbench did not produce frontier candidates.",
      observation,
      missingRequirements: workbench
        ? undefined
        : [{
            code: "theory_frontier_conjecture_no_candidates",
            message: "No frontier conjecture candidates were produced for the prompt.",
            repair_action: "ask_user",
          }],
    });
    const trace = buildGatewayTrace({
      turnId,
      capabilityId: manifest.capability_id,
      agentRuntime,
      admission,
      observationPacket,
      error: workbench ? undefined : "theory_frontier_conjecture_no_candidates",
    });
    return {
      schema: "helix.workstation_tool_gateway.call_result.v1",
      manifest_version: WORKSTATION_GATEWAY_MANIFEST_VERSION,
      ok: Boolean(workbench),
      agent_runtime: agentRuntime,
      capability_id: manifest.capability_id,
      mode,
      gateway_admission: admission,
      observation_packet: observationPacket,
      tool_lifecycle_trace: trace.tool_lifecycle_trace,
      tool_followup_decision: trace.tool_followup_decision,
      observation,
      artifact_refs: observationPacket.produced_artifact_refs,
      terminal_eligible: false,
      post_tool_model_step_required: true,
      assistant_answer: false,
      raw_content_included: false,
      ...(workbench ? {} : { error: "theory_frontier_conjecture_no_candidates" }),
    };
  }

  throw new Error(`unhandled_workstation_gateway_capability:${manifest.capability_id}`);
};
