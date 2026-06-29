import { HELIX_INTERNET_SEARCH_CAPABILITY } from "../../../../shared/helix-internet-search-observation";
import { HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY } from "../../../../shared/helix-scholarly-research-observation";

export type RecordLike = Record<string, unknown>;

export const HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA = "helix.ask_golden_path_runtime.v1";
export const HELIX_ASK_GOLDEN_PATH_RUNTIME_FLAG = "HELIX_ASK_GOLDEN_PATH_RUNTIME";
export const HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY =
  "helix_ask.inspect_capability_catalog" as const;
export const HELIX_GOLDEN_PATH_CALCULATOR_SOLVE_CAPABILITY =
  "scientific-calculator.solve_expression" as const;
export const HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY = "docs-viewer.locate_in_doc" as const;
export const HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY = "repo-code.search_concept" as const;
export const HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY = "workspace_os.status" as const;
export const HELIX_GOLDEN_PATH_READ_PROCESSED_LIVE_SOURCE_MAIL_CAPABILITY =
  "live_env.read_processed_live_source_mail" as const;
export const HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY =
  "live_env.reflect_stage_play_context" as const;
export const HELIX_GOLDEN_PATH_THEORY_REFLECTION_CAPABILITY =
  "helix_ask.reflect_theory_context" as const;
export const HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY =
  "helix_ask.reflect_civilization_bounds" as const;
export const HELIX_GOLDEN_PATH_ZEN_GRAPH_REFLECTION_CAPABILITY =
  "helix_ask.reflect_ideology_context" as const;
export const HELIX_GOLDEN_PATH_IMAGE_LENS_INSPECT_CAPABILITY = "image_lens.inspect" as const;
export const HELIX_GOLDEN_PATH_VISUAL_CAPTURE_DESCRIBE_CAPABILITY =
  "situation-room.describe_visual_capture" as const;
export const HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY =
  HELIX_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY;
export const HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY =
  "internet_search.web_research" as const;
export const HELIX_GOLDEN_PATH_INTERNET_SEARCH_EXECUTE_CAPABILITY =
  HELIX_INTERNET_SEARCH_CAPABILITY;

export type HelixAskGoldenPathRuntimeTerminalResult = {
  schema: "helix.ask_golden_path_terminal_result.v1";
  result_id: string;
  artifact_id: string;
  artifact_kind:
    | "golden_path_contract_answer"
    | "capability_help_summary"
    | "doc_location_matches"
    | "repo_code_evidence_answer"
    | "internet_search_answer"
    | "situation_context_pack"
    | "workstation_tool_evaluation"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "model_synthesized_answer"
    | "scholarly_research_answer"
    | "stage_play_reflection_answer"
    | "theory_context_reflection_answer"
    | "civilization_bounds_reflection_answer"
    | "ideology_context_reflection_answer"
    | "typed_failure"
    | "compound_evidence_synthesis_answer";
  final_answer_source:
    | "helix_ask_golden_path_runtime"
    | "capability_help_summary"
    | "doc_location_matches"
    | "repo_code_evidence_answer"
    | "internet_search_answer"
    | "situation_context_pack"
    | "workstation_tool_evaluation"
    | "workspace_directory_resolution"
    | "workspace_status_answer"
    | "model_synthesized_answer"
    | "scholarly_research_answer"
    | "stage_play_reflection_answer"
    | "theory_context_reflection_answer"
    | "civilization_bounds_reflection_answer"
    | "ideology_context_reflection_answer"
    | "typed_failure"
    | "compound_evidence_synthesis_answer";
  text: string;
  support_refs: string[];
  terminal_authority_ok: true;
  route_authority_ok: true;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixAskGoldenPathRuntimeDecision =
  | { handled: false; reason: "flag_disabled" | "not_requested" }
  | { handled: true; payload: RecordLike };

export const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

export const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

export const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

export const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

export const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => readString(item)).filter((item): item is string => Boolean(item));
};

export const readHelixAskGoldenPathRequestedCapabilities = (body: RecordLike): string[] =>
  readStringArray(body.requested_capabilities ?? body.requestedCapabilities);

export const readHelixAskGoldenPathRequestedCapability = (body: RecordLike): string | null =>
  readString(body.requested_capability) ??
  readString(body.requestedCapability) ??
  readString(body.capability) ??
  readString(body.tool_name) ??
  readString(body.toolName);

export const isHelixAskGoldenPathCapabilityExplicitlyRequested = (
  body: RecordLike,
  capabilities: readonly string[],
): boolean => {
  const requestedCapabilities = readHelixAskGoldenPathRequestedCapabilities(body);
  if (capabilities.some((capability) => requestedCapabilities.includes(capability))) return true;
  const requestedCapability = readHelixAskGoldenPathRequestedCapability(body);
  return Boolean(requestedCapability && capabilities.includes(requestedCapability));
};

export const isHelixAskGoldenPathCapabilityNamedInRequest = (
  body: RecordLike,
  capabilities: readonly string[],
): boolean => {
  if (isHelixAskGoldenPathCapabilityExplicitlyRequested(body, capabilities)) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return capabilities.some((capability) => prompt.includes(capability.toLowerCase()));
};

export const buildHelixAskGoldenPathRouteGateArtifactId = (turnId: string): string =>
  `${turnId}:golden_path_route_gate`;

export const buildHelixAskGoldenPathTerminalResultId = (turnId: string): string =>
  `${turnId}:golden_path_terminal_result`;

export const flagEnabled = (value: unknown): boolean => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "enabled";
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as RecordLike;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
};

export const defaultHashGoalFrame = (value: unknown): string => {
  let hash = 0x811c9dc5;
  const text = stableStringify(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `golden_path:${hash.toString(16).padStart(8, "0")}`;
};

export const readHelixAskGoldenPathPrompt = (body: RecordLike): string => {
  return (
    readString(body.prompt) ??
    readString(body.question) ??
    readString(body.transcript) ??
    readString(body.raw_user_prompt) ??
    ""
  );
};

export type HelixAskGoldenPathTurnContext = {
  now: Date;
  createdAtMs: number;
  turnId: string;
  traceId: string;
  sessionId: string | null;
  threadId: string | null;
  promptText: string;
};

export const readHelixAskGoldenPathTurnContext = (args: {
  body: RecordLike;
  now: Date;
  fallbackTurnIdPrefix: string;
}): HelixAskGoldenPathTurnContext => {
  const createdAtMs = args.now.getTime();
  const turnId =
    readString(args.body.turn_id) ??
    readString(args.body.turnId) ??
    `${args.fallbackTurnIdPrefix}:${createdAtMs}`;
  return {
    now: args.now,
    createdAtMs,
    turnId,
    traceId: readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId,
    sessionId: readString(args.body.session_id) ?? readString(args.body.sessionId),
    threadId: readString(args.body.thread_id) ?? readString(args.body.threadId),
    promptText: readHelixAskGoldenPathPrompt(args.body),
  };
};

export const isHelixAskGoldenPathRequested = (body: RecordLike): boolean => {
  if (readBoolean(body.goldenPathRuntime) === true) return true;
  if (readBoolean(body.golden_path_runtime) === true) return true;
  if (readBoolean(body.helixAskGoldenPathRuntime) === true) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return prompt.includes("helix_ask_golden_path_runtime") || prompt.includes("helix ask golden path runtime");
};
