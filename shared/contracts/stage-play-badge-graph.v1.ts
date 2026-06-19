import {
  validateStagePlayPerturbationEventV1,
  type StagePlayPerturbationEventV1,
} from "./stage-play-perturbation-event.v1";
import {
  validateStagePlayCheckpointRequestV1,
  type StagePlayCheckpointRequestV1,
} from "./stage-play-checkpoint-request.v1";

export const STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID =
  "stage_play_badge_graph" as const;

export const STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION =
  "stage_play_badge_graph/v1" as const;

export const STAGE_PLAY_BADGE_KINDS = [
  "observer",
  "source",
  "compact_observation",
  "fusion",
  "interpreter",
  "stage_interpretation",
  "setting",
  "actor",
  "prop",
  "resource",
  "hazard",
  "constraint",
  "goal",
  "world_state",
  "affordance",
  "blocked_affordance",
  "intent_module",
  "procedural_binding",
  "recommended_check",
  "admission_gate",
  "missing_evidence",
  "ask_checkpoint",
  "helix_ask_checkpoint",
  "answer_snapshot",
  "live_output",
  "voice_output",
  "workstation_state_plane",
  "goal_context_update",
  "workstation_dispatch_action",
  "agent_goal_session",
  "perturbation",
  "checkpoint_request",
] as const;

export const STAGE_PLAY_SOURCE_ROUTING_STATUSES = [
  "active",
  "waiting_for_client",
  "permission_required",
  "configured_missing",
  "stale",
  "error",
  "paused",
  "stopped",
] as const;

export const STAGE_PLAY_SOURCE_ROUTES = [
  "world_stage_play",
  "narrative_stage_play",
  "visual_context",
  "live_answer_output",
  "debug_only",
] as const;

export const STAGE_PLAY_BADGE_STATUSES = [
  "observed",
  "inferred",
  "available",
  "blocked",
  "stale",
  "missing_evidence",
  "candidate",
  "admitted_read_only",
  "ask_user_required",
] as const;

export const STAGE_PLAY_EDGE_RELATIONS = [
  "feeds",
  "interprets",
  "observes",
  "located_near",
  "contains",
  "enables",
  "requires",
  "blocks",
  "constrains",
  "targets",
  "uses",
  "preserves",
  "composes_with",
  "produces",
  "recommends",
  "needs_check",
  "admitted_as",
  "sourced_by",
  "supersedes",
] as const;

export const STAGE_PLAY_SOURCE_REF_KINDS = [
  "live_source_descriptor",
  "live_source_producer",
  "live_source_observation",
  "environment_state_snapshot",
  "world_event",
  "world_delta_overlay",
  "chunk_snapshot_sample",
  "navigation_state",
  "route_solver_observation",
  "world_sense_context",
  "stage_play_raw_session_buffer_entry",
  "stage_play_compact_observation",
  "stage_play_perturbation_event",
  "stage_play_checkpoint_request",
  "workstation_goal_context_update",
  "agent_goal_session",
  "synthetic_evidence",
] as const;

export const STAGE_PLAY_LIVE_BINDING_KINDS = [
  "source_descriptor",
  "source_producer",
  "source_modality",
  "source_status",
  "source_cadence",
  "actor_pose",
  "current_block",
  "feet_block",
  "head_block",
  "floor_block",
  "adjacent_block",
  "step_up_candidate",
  "drop_candidate",
  "liquid_nearby",
  "void_or_air_column",
  "door_or_gate",
  "portal_or_gateway",
  "nearby_entity",
  "inventory_item",
  "route_state",
  "hazard_cell",
] as const;

export const STAGE_PLAY_INTENT_VERBS = [
  "observe",
  "move",
  "move_away",
  "step_up",
  "jump",
  "mine",
  "place_block",
  "bridge",
  "retreat",
  "maintain_line_of_sight",
  "equip",
  "open",
  "close",
  "enter_portal",
  "avoid",
  "attack",
  "delay",
  "negotiate",
  "reveal_information",
  "seek_confirmation",
  "deceive",
  "escalate",
  "deescalate",
  "ask_user",
] as const;

export const STAGE_PLAY_RECOMMENDED_ACTION_TYPES = [
  "observe_more",
  "ask_user",
  "explain_candidate",
  "navigation_hint",
  "blocked_move_notice",
  "safe_diagnostic_overlay",
] as const;

export type StagePlayBadgeKindV1 = (typeof STAGE_PLAY_BADGE_KINDS)[number];
export type StagePlaySourceRoutingStatusV1 = (typeof STAGE_PLAY_SOURCE_ROUTING_STATUSES)[number];
export type StagePlaySourceRouteTargetV1 = (typeof STAGE_PLAY_SOURCE_ROUTES)[number];
export type StagePlaySourceRouteV1 = {
  sourceId: string;
  modality: string;
  routeTo: StagePlaySourceRouteTargetV1;
  selected: boolean;
  confidence: number;
  freshness: string;
};
export type StagePlayBadgeStatusV1 = (typeof STAGE_PLAY_BADGE_STATUSES)[number];
export type StagePlayBadgeEdgeRelationV1 = (typeof STAGE_PLAY_EDGE_RELATIONS)[number];
export type StagePlayBadgeSourceRefKindV1 = (typeof STAGE_PLAY_SOURCE_REF_KINDS)[number];
export type StagePlayLiveBindingKindV1 = (typeof STAGE_PLAY_LIVE_BINDING_KINDS)[number];
export type StagePlayIntentVerbV1 = (typeof STAGE_PLAY_INTENT_VERBS)[number];
export type StagePlayRecommendedActionTypeV1 = (typeof STAGE_PLAY_RECOMMENDED_ACTION_TYPES)[number];

/**
 * Stage Play Badge Graph is an evidence-only reflection surface.
 *
 * It may summarize admitted live-world state, expose setting/actors/props/resources/hazards,
 * derive affordances and blocked affordances, compose procedural intent modules, and suggest
 * candidate checks or user-visible guidance.
 *
 * It may not answer for the assistant, create a terminal response, grant execution permission,
 * execute world actions, mutate game/client/server state, include raw chunk payloads, raw NBT,
 * or raw logs, or convert UI labels into instructions.
 *
 * Structural authority rule:
 * assistant_answer:false, raw_content_included:false, raw_payload_included:false,
 * instruction_authority:"none", ask_instruction_authority:"none",
 * context_role:"tool_evidence", ask_context_policy:"evidence_only",
 * terminal_eligible:false, agent_executable:false.
 *
 * The graph is the set designer, not the actor: it paints the stage, labels the trapdoors,
 * and points at the papier-mache dragon. The agent still decides what line to speak.
 */
export type StagePlayBadgeGraphAuthorityV1 = {
  assistant_answer: false;
  raw_content_included: false;
  raw_payload_included: false;
  terminal_eligible: false;
  agent_executable: false;
  context_role: "tool_evidence";
  ask_context_policy: "evidence_only";
  instruction_authority: "none";
  ask_instruction_authority: "none";
};

export type StagePlayBadgeSourceRefV1 = {
  kind: StagePlayBadgeSourceRefKindV1;
  id: string;
  note?: string | null;
};

export type StagePlayLiveBindingV1 = {
  bindingKind: StagePlayLiveBindingKindV1;
  sourceRefIds: string[];
  freshness: "fresh" | "stale" | "missing" | "unknown";
  confidence: number;
  compactValue?: string | number | boolean | null;
};

export type StagePlayBadgeDataTrayV1 = {
  title: string;
  summary: string;
  updatedAt?: string | null;
  freshness?: "fresh" | "stale" | "missing" | "unknown";
  confidence?: number | null;
  evidenceRefs: string[];
  inputRefs?: string[];
  inputPreview?: string | null;
  transformLabel?: string;
  toolRefs?: string[];
  toolPreview?: string | null;
  outputRefs?: string[];
  outputPreview?: string | null;
  skipped?: string[];
  blockedUntil?: string | null;
};

export type StagePlayBadgeCheckpointV1 = {
  askTurnId?: string | null;
  solverTraceRef?: string | null;
  terminalArtifactKind?: string | null;
  finalAnswerSource?: string | null;
  modelReviewed: boolean;
};

export type StagePlayBadgeOutputV1 = {
  lineKey?: string | null;
  text: string;
  state: "draft" | "projected" | "model_reviewed" | "blocked" | "stale";
  voiceEligible: boolean;
};

export type StagePlayBadgeV1 = {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;
  kind: StagePlayBadgeKindV1;
  status: StagePlayBadgeStatusV1;
  subjects: string[];
  tags: string[];
  liveBindings: StagePlayLiveBindingV1[];
  sourceRefs: StagePlayBadgeSourceRefV1[];
  evidenceRefs: string[];
  confidence: number;
  missingEvidence: string[];
  reasonCodes: string[];
  dataTray?: StagePlayBadgeDataTrayV1;
  checkpoint?: StagePlayBadgeCheckpointV1;
  output?: StagePlayBadgeOutputV1;
  intentModule?: {
    verb: StagePlayIntentVerbV1;
    actorId?: string | null;
    targetId?: string | null;
    preserves?: string[];
    requires?: string[];
    blocks?: string[];
  };
  admission?: "auto" | "ask_user" | "blocked" | null;
};

export type StagePlayBadgeEdgeV1 = {
  id: string;
  from: string;
  to: string;
  relation: StagePlayBadgeEdgeRelationV1;
  label: string;
  evidenceRefs: string[];
  reasonCodes: string[];
};

export type StagePlayBadgeGraphRecommendedActionV1 = {
  id: string;
  label: string;
  actionType: StagePlayRecommendedActionTypeV1;
  admission: "auto" | "ask_user" | "blocked";
  agentExecutable: false;
  reasonCodes: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
};

export type StagePlayBadgeGraphSummaryV1 = {
  badgeCount: number;
  edgeCount: number;
  kindCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  affordanceCount: number;
  blockedAffordanceCount: number;
  proceduralBindingCount: number;
  missingEvidenceCount: number;
};

export type StagePlaySourceRoutingEntryV1 = {
  sourceId: string;
  modality:
    | "world_event"
    | "environment_state"
    | "environment_affordance"
    | "visual_frame"
    | "audio_transcript"
    | "text_chat"
    | "procedure_graph"
    | string;
  status: StagePlaySourceRoutingStatusV1;
  contribution: string;
  fidelityScore: number;
  selectedForStagePlay: boolean;
  routeTo: StagePlaySourceRouteTargetV1;
  route?: StagePlaySourceRouteV1;
  cadenceMs?: number | null;
  lastEventTs?: string | null;
  missingReason?: string | null;
  nextRequiredAction?: string | null;
  evidenceRefs: string[];
};

export type StagePlayBadgeGraphV1 = {
  artifactId: typeof STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION;
  generatedAt: string;
  graphId: string;
  title: string;
  description: string;
  sourceWindow: {
    threadId?: string | null;
    roomId?: string | null;
    worldId?: string | null;
    environmentId?: string | null;
    fromTs?: string | null;
    toTs?: string | null;
    latestObservationRefs: string[];
    latestSourceDescriptorRefs?: string[];
    latestSourceProducerRefs?: string[];
    latestRawSessionBufferRefs?: string[];
    sources: StagePlaySourceRoutingEntryV1[];
    sourceRoutes?: StagePlaySourceRouteV1[];
    latestSnapshotRefs: string[];
    latestDeltaOverlayRefs: string[];
    latestNavigationRefs: string[];
    freshness: "fresh" | "stale" | "missing" | "mixed" | "unknown";
  };
  badges: StagePlayBadgeV1[];
  edges: StagePlayBadgeEdgeV1[];
  recommendedActions: StagePlayBadgeGraphRecommendedActionV1[];
  perturbations: StagePlayPerturbationEventV1[];
  checkpointRequests: StagePlayCheckpointRequestV1[];
  summary: StagePlayBadgeGraphSummaryV1;
  authority: StagePlayBadgeGraphAuthorityV1;
};

export type BuildStagePlayBadgeGraphV1Input = Omit<
  StagePlayBadgeGraphV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary" | "authority" | "perturbations" | "checkpointRequests"
> & {
  generatedAt?: string;
  perturbations?: StagePlayPerturbationEventV1[];
  checkpointRequests?: StagePlayCheckpointRequestV1[];
  summary?: Partial<StagePlayBadgeGraphSummaryV1>;
  authority?: Partial<StagePlayBadgeGraphAuthorityV1>;
};

const STAGE_PLAY_AUTHORITY: StagePlayBadgeGraphAuthorityV1 = {
  assistant_answer: false,
  raw_content_included: false,
  raw_payload_included: false,
  terminal_eligible: false,
  agent_executable: false,
  context_role: "tool_evidence",
  ask_context_policy: "evidence_only",
  instruction_authority: "none",
  ask_instruction_authority: "none",
};

const FORBIDDEN_STAGE_PLAY_RAW_CONTENT_PATTERNS = [
  /\braw[_ -]?(?:chunk|chunks)\b/i,
  /\braw[_ -]?nbt\b/i,
  /\bnbt[_ -]?payload\b/i,
  /\braw[_ -]?(?:log|logs)\b/i,
  /\braw[_ -]?user[_ -]?text\b/i,
  /\bfull[_ -]?(?:chunk|chunks|logs|transcript|user[_ -]?text)\b/i,
] as const;

const FORBIDDEN_STAGE_PLAY_AUTHORITY_PATTERNS = [
  /\bagent[_ -]?executable\s*[:=]\s*true\b/i,
  /\bterminal[_ -]?eligible\s*[:=]\s*true\b/i,
  /\bassistant[_ -]?answer\s*[:=]\s*true\b/i,
  /\binstruction[_ -]?authority\s*[:=]\s*(?!none\b)[a-z_ -]+/i,
  /\bexecution permission\b/i,
  /\bexecute(?:s|d)?\s+(?:now|automatically|without confirmation)\b/i,
] as const;

const FORBIDDEN_STAGE_PLAY_RECOMMENDED_ACTION_PATTERNS = [
  /\bbaritone\b/i,
  /\bpathmind\b/i,
  /\bterminal\b/i,
  /\brun[_ -]?command\b/i,
  /\bminecraft[_ -]?movement[_ -]?api\b/i,
  /\binventory[_ -]?mutation\b/i,
  /\bblock[_ -]?placement[_ -]?api\b/i,
  /\bcall[_ -]?external[_ -]?tool\b/i,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const isConfidence = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildStagePlayBadgeGraphSummaryV1(
  badges: StagePlayBadgeV1[],
  edges: StagePlayBadgeEdgeV1[],
): StagePlayBadgeGraphSummaryV1 {
  return {
    badgeCount: badges.length,
    edgeCount: edges.length,
    kindCounts: countBy(badges.map((badge) => badge.kind)),
    statusCounts: countBy(badges.map((badge) => badge.status)),
    affordanceCount: badges.filter((badge) => badge.kind === "affordance").length,
    blockedAffordanceCount: badges.filter((badge) => badge.kind === "blocked_affordance").length,
    proceduralBindingCount: badges.filter((badge) => badge.kind === "procedural_binding").length,
    missingEvidenceCount: badges.reduce((count, badge) => count + badge.missingEvidence.length, 0),
  };
}

export function buildStagePlayBadgeGraphV1(input: BuildStagePlayBadgeGraphV1Input): StagePlayBadgeGraphV1 {
  const sources = Array.isArray(input.sourceWindow.sources) ? input.sourceWindow.sources : [];
  const sourceRoutes = Array.isArray(input.sourceWindow.sourceRoutes)
    ? input.sourceWindow.sourceRoutes
    : sources.map((source) => source.route ?? {
        sourceId: source.sourceId,
        modality: source.modality,
        routeTo: source.routeTo,
        selected: source.selectedForStagePlay,
        confidence: source.fidelityScore,
        freshness: source.status,
      });
  return {
    artifactId: STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    graphId: input.graphId,
    title: input.title,
    description: input.description,
    sourceWindow: {
      ...input.sourceWindow,
      sources,
      sourceRoutes,
    },
    badges: input.badges,
    edges: input.edges,
    recommendedActions: input.recommendedActions,
    perturbations: input.perturbations ?? [],
    checkpointRequests: input.checkpointRequests ?? [],
    summary: {
      ...buildStagePlayBadgeGraphSummaryV1(input.badges, input.edges),
      ...input.summary,
    },
    authority: {
      ...STAGE_PLAY_AUTHORITY,
      ...input.authority,
    },
  };
}

function validateAuthority(value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push("authority must be an object");
    return;
  }
  for (const [key, expected] of Object.entries(STAGE_PLAY_AUTHORITY)) {
    if (value[key] !== expected) issues.push(`authority.${key} must be ${String(expected)}`);
  }
}

function validateSourceRefs(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  for (const [index, rawRef] of value.entries()) {
    const refPrefix = `${prefix}[${index}]`;
    if (!isRecord(rawRef)) {
      issues.push(`${refPrefix} must be an object`);
      continue;
    }
    if (!includes(STAGE_PLAY_SOURCE_REF_KINDS, rawRef.kind)) issues.push(`${refPrefix}.kind is invalid`);
    if (!isNonEmptyString(rawRef.id)) issues.push(`${refPrefix}.id must be a non-empty string`);
  }
}

function validateLiveBindings(prefix: string, value: unknown, issues: string[]): void {
  if (!Array.isArray(value)) {
    issues.push(`${prefix} must be an array`);
    return;
  }
  for (const [index, rawBinding] of value.entries()) {
    const bindingPrefix = `${prefix}[${index}]`;
    if (!isRecord(rawBinding)) {
      issues.push(`${bindingPrefix} must be an object`);
      continue;
    }
    if (!includes(STAGE_PLAY_LIVE_BINDING_KINDS, rawBinding.bindingKind)) {
      issues.push(`${bindingPrefix}.bindingKind is invalid`);
    }
    if (!isStringArray(rawBinding.sourceRefIds)) issues.push(`${bindingPrefix}.sourceRefIds must be strings`);
    if (!["fresh", "stale", "missing", "unknown"].includes(String(rawBinding.freshness ?? ""))) {
      issues.push(`${bindingPrefix}.freshness is invalid`);
    }
    if (!isConfidence(rawBinding.confidence)) {
      issues.push(`${bindingPrefix}.confidence must be between 0 and 1`);
    }
  }
}

function validateSourceRoute(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.sourceId)) issues.push(`${prefix}.sourceId must be a non-empty string`);
  if (!isNonEmptyString(value.modality)) issues.push(`${prefix}.modality must be a non-empty string`);
  if (!includes(STAGE_PLAY_SOURCE_ROUTES, value.routeTo)) {
    issues.push(`${prefix}.routeTo is invalid`);
  }
  if (typeof value.selected !== "boolean") {
    issues.push(`${prefix}.selected must be boolean`);
  }
  if (!isConfidence(value.confidence)) {
    issues.push(`${prefix}.confidence must be between 0 and 1`);
  }
  if (!isNonEmptyString(value.freshness)) {
    issues.push(`${prefix}.freshness must be a non-empty string`);
  }
}

function validateDataTray(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(value.title)) issues.push(`${prefix}.title must be a non-empty string`);
  if (!isNonEmptyString(value.summary)) issues.push(`${prefix}.summary must be a non-empty string`);
  if (value.updatedAt != null && typeof value.updatedAt !== "string") {
    issues.push(`${prefix}.updatedAt must be a string or null`);
  }
  if (value.freshness != null && !["fresh", "stale", "missing", "unknown"].includes(String(value.freshness))) {
    issues.push(`${prefix}.freshness is invalid`);
  }
  if (value.confidence != null && !isConfidence(value.confidence)) {
    issues.push(`${prefix}.confidence must be between 0 and 1`);
  }
  if (!isStringArray(value.evidenceRefs)) issues.push(`${prefix}.evidenceRefs must be strings`);
  if (value.inputRefs != null && !isStringArray(value.inputRefs)) {
    issues.push(`${prefix}.inputRefs must be strings`);
  }
  if (value.inputPreview != null && typeof value.inputPreview !== "string") {
    issues.push(`${prefix}.inputPreview must be a string or null`);
  }
  if (value.transformLabel != null && !isNonEmptyString(value.transformLabel)) {
    issues.push(`${prefix}.transformLabel must be a non-empty string`);
  }
  if (value.toolRefs != null && !isStringArray(value.toolRefs)) {
    issues.push(`${prefix}.toolRefs must be strings`);
  }
  if (value.toolPreview != null && typeof value.toolPreview !== "string") {
    issues.push(`${prefix}.toolPreview must be a string or null`);
  }
  if (value.outputRefs != null && !isStringArray(value.outputRefs)) {
    issues.push(`${prefix}.outputRefs must be strings`);
  }
  if (value.outputPreview != null && typeof value.outputPreview !== "string") {
    issues.push(`${prefix}.outputPreview must be a string or null`);
  }
  if (value.skipped != null && !isStringArray(value.skipped)) {
    issues.push(`${prefix}.skipped must be strings`);
  }
  if (value.blockedUntil != null && typeof value.blockedUntil !== "string") {
    issues.push(`${prefix}.blockedUntil must be a string or null`);
  }
}

function validateCheckpoint(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["askTurnId", "solverTraceRef", "terminalArtifactKind", "finalAnswerSource"] as const) {
    const maybe = value[field];
    if (maybe != null && typeof maybe !== "string") {
      issues.push(`${prefix}.${field} must be a string or null`);
    }
  }
  if (typeof value.modelReviewed !== "boolean") {
    issues.push(`${prefix}.modelReviewed must be boolean`);
  }
}

function validateOutput(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  if (value.lineKey != null && typeof value.lineKey !== "string") {
    issues.push(`${prefix}.lineKey must be a string or null`);
  }
  if (!isNonEmptyString(value.text)) issues.push(`${prefix}.text must be a non-empty string`);
  if (!["draft", "projected", "model_reviewed", "blocked", "stale"].includes(String(value.state ?? ""))) {
    issues.push(`${prefix}.state is invalid`);
  }
  if (typeof value.voiceEligible !== "boolean") {
    issues.push(`${prefix}.voiceEligible must be boolean`);
  }
}

const stringArrayValues = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];

const badgeReferenceTokens = (badge: Record<string, unknown>): Set<string> => {
  const sourceRefs = Array.isArray(badge.sourceRefs)
    ? badge.sourceRefs.filter(isRecord)
    : [];
  const dataTray = isRecord(badge.dataTray) ? badge.dataTray : null;
  return new Set([
    typeof badge.id === "string" ? badge.id : "",
    ...(typeof badge.id === "string" ? [`badge:${badge.id}`, `stage_play_badge:${badge.id}`] : []),
    ...stringArrayValues(badge.evidenceRefs),
    ...stringArrayValues(dataTray?.evidenceRefs),
    ...sourceRefs.map((ref) => typeof ref.id === "string" ? ref.id : "").filter(Boolean),
    ...sourceRefs.map((ref) =>
      typeof ref.kind === "string" && typeof ref.id === "string" ? `${ref.kind}:${ref.id}` : ""
    ).filter(Boolean),
  ].filter(Boolean));
};

const hasModelReviewedAnswerSnapshotMark = (badge: Record<string, unknown>): boolean => {
  if (badge.kind !== "answer_snapshot") return false;
  const output = isRecord(badge.output) ? badge.output : null;
  if (output?.state !== "model_reviewed" || !isNonEmptyString(output.text)) return false;
  const checkpoint = isRecord(badge.checkpoint) ? badge.checkpoint : null;
  const markers = [
    ...stringArrayValues(badge.tags),
    ...stringArrayValues(badge.reasonCodes),
  ].join(" ");
  return checkpoint?.modelReviewed === true ||
    /model_reviewed|model_authored|answer_snapshot_from_checkpoint|answer_snapshot_from_model_authored_checkpoint/i.test(markers);
};

const hasExplicitVoicePolicyMark = (badge: Record<string, unknown>): boolean =>
  [
    ...stringArrayValues(badge.tags),
    ...stringArrayValues(badge.reasonCodes),
  ].some((value) =>
    /(?:explicit_)?voice(?:_output)?_(?:policy|eligible|allowed)|voice_policy/i.test(value)
  );

const citesModelReviewedAnswerSnapshot = (
  badge: Record<string, unknown>,
  answerSnapshots: Record<string, unknown>[],
): boolean => {
  const refs = badgeReferenceTokens(badge);
  return answerSnapshots.some((snapshot) => {
    const snapshotId = typeof snapshot.id === "string" ? snapshot.id : "";
    if (snapshotId && (
      refs.has(snapshotId) ||
      refs.has(`badge:${snapshotId}`) ||
      refs.has(`stage_play_badge:${snapshotId}`)
    )) {
      return true;
    }
    return Array.from(badgeReferenceTokens(snapshot)).some((ref) =>
      refs.has(ref) && /answer_snapshot/i.test(ref)
    );
  });
};

export function validateStagePlayBadgeGraphV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["graph must be an object"];

  if (value.artifactId !== STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID) {
    issues.push(`artifactId must be ${STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.graphId)) issues.push("graphId must be a non-empty string");
  if (!isNonEmptyString(value.title)) issues.push("title must be a non-empty string");
  if (!isNonEmptyString(value.description)) issues.push("description must be a non-empty string");
  if (!isRecord(value.sourceWindow)) {
    issues.push("sourceWindow must be an object");
  } else {
    for (const field of [
      "latestObservationRefs",
      "latestSourceDescriptorRefs",
      "latestSourceProducerRefs",
      "latestRawSessionBufferRefs",
      "latestSnapshotRefs",
      "latestDeltaOverlayRefs",
      "latestNavigationRefs",
    ] as const) {
      const maybe = value.sourceWindow[field];
      const required = field === "latestObservationRefs" || field === "latestSnapshotRefs" || field === "latestDeltaOverlayRefs" || field === "latestNavigationRefs";
      if ((required || maybe != null) && !isStringArray(maybe)) {
        issues.push(`sourceWindow.${field} must be strings`);
      }
    }
    if (!Array.isArray(value.sourceWindow.sources)) {
      issues.push("sourceWindow.sources must be an array");
    } else {
      for (const [index, rawSource] of value.sourceWindow.sources.entries()) {
        const sourcePrefix = `sourceWindow.sources[${index}]`;
        if (!isRecord(rawSource)) {
          issues.push(`${sourcePrefix} must be an object`);
          continue;
        }
        if (!isNonEmptyString(rawSource.sourceId)) issues.push(`${sourcePrefix}.sourceId must be a non-empty string`);
        if (!isNonEmptyString(rawSource.modality)) issues.push(`${sourcePrefix}.modality must be a non-empty string`);
        if (!includes(STAGE_PLAY_SOURCE_ROUTING_STATUSES, rawSource.status)) {
          issues.push(`${sourcePrefix}.status is invalid`);
        }
        if (!isNonEmptyString(rawSource.contribution)) issues.push(`${sourcePrefix}.contribution must be a non-empty string`);
        if (!isConfidence(rawSource.fidelityScore)) {
          issues.push(`${sourcePrefix}.fidelityScore must be between 0 and 1`);
        }
        if (typeof rawSource.selectedForStagePlay !== "boolean") {
          issues.push(`${sourcePrefix}.selectedForStagePlay must be boolean`);
        }
        if (!includes(STAGE_PLAY_SOURCE_ROUTES, rawSource.routeTo)) {
          issues.push(`${sourcePrefix}.routeTo is invalid`);
        }
        if (rawSource.route != null) {
          validateSourceRoute(`${sourcePrefix}.route`, rawSource.route, issues);
        }
        if (rawSource.cadenceMs != null && (typeof rawSource.cadenceMs !== "number" || !Number.isFinite(rawSource.cadenceMs) || rawSource.cadenceMs < 0)) {
          issues.push(`${sourcePrefix}.cadenceMs must be a non-negative number or null`);
        }
        if (rawSource.lastEventTs != null && typeof rawSource.lastEventTs !== "string") {
          issues.push(`${sourcePrefix}.lastEventTs must be a string or null`);
        }
        if (rawSource.missingReason != null && typeof rawSource.missingReason !== "string") {
          issues.push(`${sourcePrefix}.missingReason must be a string or null`);
        }
        if (rawSource.nextRequiredAction != null && typeof rawSource.nextRequiredAction !== "string") {
          issues.push(`${sourcePrefix}.nextRequiredAction must be a string or null`);
        }
        if (!isStringArray(rawSource.evidenceRefs)) {
          issues.push(`${sourcePrefix}.evidenceRefs must be strings`);
        }
      }
    }
    if (value.sourceWindow.sourceRoutes != null) {
      if (!Array.isArray(value.sourceWindow.sourceRoutes)) {
        issues.push("sourceWindow.sourceRoutes must be an array");
      } else {
        for (const [index, rawRoute] of value.sourceWindow.sourceRoutes.entries()) {
          validateSourceRoute(`sourceWindow.sourceRoutes[${index}]`, rawRoute, issues);
        }
      }
    }
    if (!["fresh", "stale", "missing", "mixed", "unknown"].includes(String(value.sourceWindow.freshness ?? ""))) {
      issues.push("sourceWindow.freshness is invalid");
    }
  }
  const sourceWindowHasAdmittedRefs =
    isRecord(value.sourceWindow) &&
    (
      (Array.isArray(value.sourceWindow.latestObservationRefs) && value.sourceWindow.latestObservationRefs.length > 0) ||
      (Array.isArray(value.sourceWindow.latestSourceDescriptorRefs) && value.sourceWindow.latestSourceDescriptorRefs.length > 0) ||
      (Array.isArray(value.sourceWindow.latestSourceProducerRefs) && value.sourceWindow.latestSourceProducerRefs.length > 0) ||
      (Array.isArray(value.sourceWindow.latestSnapshotRefs) && value.sourceWindow.latestSnapshotRefs.length > 0) ||
      (Array.isArray(value.sourceWindow.latestDeltaOverlayRefs) && value.sourceWindow.latestDeltaOverlayRefs.length > 0) ||
      (Array.isArray(value.sourceWindow.latestNavigationRefs) && value.sourceWindow.latestNavigationRefs.length > 0)
    );
  if (!Array.isArray(value.badges)) {
    issues.push("badges must be an array");
  } else if (value.badges.length === 0 && sourceWindowHasAdmittedRefs) {
    issues.push("badges may be empty only when there is no admitted source window");
  }
  if (!Array.isArray(value.edges)) issues.push("edges must be an array");
  if (!Array.isArray(value.recommendedActions)) issues.push("recommendedActions must be an array");
  if (!Array.isArray(value.perturbations)) issues.push("perturbations must be an array");
  if (!Array.isArray(value.checkpointRequests)) issues.push("checkpointRequests must be an array");
  validateAuthority(value.authority, issues);

  const badges = Array.isArray(value.badges) ? value.badges : [];
  const edges = Array.isArray(value.edges) ? value.edges : [];
  const badgeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const modelReviewedAnswerSnapshots = badges
    .filter(isRecord)
    .filter(hasModelReviewedAnswerSnapshotMark);

  for (const [index, rawBadge] of badges.entries()) {
    const prefix = `badges[${index}]`;
    if (!isRecord(rawBadge)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    const badgeId = rawBadge.id;
    if (!isNonEmptyString(badgeId)) {
      issues.push(`${prefix}.id must be a non-empty string`);
    } else if (badgeIds.has(badgeId)) {
      issues.push(`duplicate badge id: ${badgeId}`);
    } else {
      badgeIds.add(badgeId);
    }
    for (const field of ["title", "plainMeaning", "whyItMatters"] as const) {
      if (!isNonEmptyString(rawBadge[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
    }
    if (!includes(STAGE_PLAY_BADGE_KINDS, rawBadge.kind)) issues.push(`${prefix}.kind is invalid`);
    if (!includes(STAGE_PLAY_BADGE_STATUSES, rawBadge.status)) issues.push(`${prefix}.status is invalid`);
    for (const field of ["subjects", "tags", "evidenceRefs", "missingEvidence", "reasonCodes"] as const) {
      if (!isStringArray(rawBadge[field])) issues.push(`${prefix}.${field} must be an array of strings`);
    }
    if (!isConfidence(rawBadge.confidence)) {
      issues.push(`${prefix}.confidence must be between 0 and 1`);
    }
    validateLiveBindings(`${prefix}.liveBindings`, rawBadge.liveBindings, issues);
    validateSourceRefs(`${prefix}.sourceRefs`, rawBadge.sourceRefs, issues);
    if (rawBadge.intentModule != null) {
      if (!isRecord(rawBadge.intentModule)) {
        issues.push(`${prefix}.intentModule must be an object`);
      } else {
        if (!includes(STAGE_PLAY_INTENT_VERBS, rawBadge.intentModule.verb)) {
          issues.push(`${prefix}.intentModule.verb is invalid`);
        }
        for (const field of ["preserves", "requires", "blocks"] as const) {
          const maybe = rawBadge.intentModule[field];
          if (maybe != null && !isStringArray(maybe)) issues.push(`${prefix}.intentModule.${field} must be strings`);
        }
      }
    }
    if (rawBadge.admission != null && !["auto", "ask_user", "blocked"].includes(String(rawBadge.admission))) {
      issues.push(`${prefix}.admission is invalid`);
    }
    if (rawBadge.dataTray != null) {
      validateDataTray(`${prefix}.dataTray`, rawBadge.dataTray, issues);
    }
    if (rawBadge.checkpoint != null) {
      validateCheckpoint(`${prefix}.checkpoint`, rawBadge.checkpoint, issues);
      if (!["ask_checkpoint", "helix_ask_checkpoint", "answer_snapshot"].includes(String(rawBadge.kind))) {
        issues.push(`${prefix}.checkpoint may only appear on ask_checkpoint, helix_ask_checkpoint, or answer_snapshot badges`);
      }
    }
    if (rawBadge.output != null) {
      validateOutput(`${prefix}.output`, rawBadge.output, issues);
      if (!["answer_snapshot", "live_output", "voice_output"].includes(String(rawBadge.kind))) {
        issues.push(`${prefix}.output may only appear on answer_snapshot, live_output, or voice_output badges`);
      }
      if (isRecord(rawBadge.output) && rawBadge.output.voiceEligible === true) {
        if (rawBadge.kind === "answer_snapshot") {
          issues.push(`${prefix}.output.voiceEligible is only allowed on live_output or voice_output badges`);
        }
        if (rawBadge.kind !== "live_output" && rawBadge.kind !== "voice_output") {
          issues.push(`${prefix}.output.voiceEligible may only appear on live_output or voice_output badges`);
        }
        if (rawBadge.output.state !== "model_reviewed") {
          issues.push(`${prefix}.output.voiceEligible requires model_reviewed output state`);
        }
        if (!hasExplicitVoicePolicyMark(rawBadge)) {
          issues.push(`${prefix}.output.voiceEligible requires explicit voice policy evidence`);
        }
        if (!citesModelReviewedAnswerSnapshot(rawBadge, modelReviewedAnswerSnapshots)) {
          issues.push(`${prefix}.output.voiceEligible requires citation to a model-reviewed answer_snapshot`);
        }
      }
    }
    if (rawBadge.admission === "auto" && rawBadge.kind === "blocked_affordance") {
      issues.push(`${prefix}.blocked affordance must not auto-admit as executable action`);
    }
    if (isRecord(rawBadge)) {
      if (rawBadge.agentExecutable === true || rawBadge.agent_executable === true) {
        issues.push(`${prefix} must not claim agent execution permission`);
      }
      if (rawBadge.terminal_eligible === true || rawBadge.terminalEligible === true) {
        issues.push(`${prefix} must not claim terminal eligibility`);
      }
      if (rawBadge.assistant_answer === true || rawBadge.assistantAnswer === true) {
        issues.push(`${prefix} must not claim assistant-answer authority`);
      }
    }
  }

  for (const [index, rawEdge] of edges.entries()) {
    const prefix = `edges[${index}]`;
    if (!isRecord(rawEdge)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawEdge.id)) {
      issues.push(`${prefix}.id must be a non-empty string`);
    } else if (edgeIds.has(rawEdge.id)) {
      issues.push(`duplicate edge id: ${rawEdge.id}`);
    } else {
      edgeIds.add(rawEdge.id);
    }
    if (!isNonEmptyString(rawEdge.from)) {
      issues.push(`${prefix}.from must be a non-empty string`);
    } else if (!badgeIds.has(rawEdge.from)) {
      issues.push(`${prefix}.from references missing badge: ${rawEdge.from}`);
    }
    if (!isNonEmptyString(rawEdge.to)) {
      issues.push(`${prefix}.to must be a non-empty string`);
    } else if (!badgeIds.has(rawEdge.to)) {
      issues.push(`${prefix}.to references missing badge: ${rawEdge.to}`);
    }
    if (!includes(STAGE_PLAY_EDGE_RELATIONS, rawEdge.relation)) issues.push(`${prefix}.relation is invalid`);
    if (!isNonEmptyString(rawEdge.label)) issues.push(`${prefix}.label must be a non-empty string`);
    if (!isStringArray(rawEdge.evidenceRefs)) issues.push(`${prefix}.evidenceRefs must be strings`);
    if (!isStringArray(rawEdge.reasonCodes)) issues.push(`${prefix}.reasonCodes must be strings`);
  }

  for (const [index, rawAction] of (Array.isArray(value.recommendedActions) ? value.recommendedActions : []).entries()) {
    const prefix = `recommendedActions[${index}]`;
    if (!isRecord(rawAction)) {
      issues.push(`${prefix} must be an object`);
      continue;
    }
    if (!isNonEmptyString(rawAction.id)) issues.push(`${prefix}.id must be a non-empty string`);
    if (!isNonEmptyString(rawAction.label)) issues.push(`${prefix}.label must be a non-empty string`);
    if (!includes(STAGE_PLAY_RECOMMENDED_ACTION_TYPES, rawAction.actionType)) {
      issues.push(`${prefix}.actionType is invalid`);
    }
    if (!["auto", "ask_user", "blocked"].includes(String(rawAction.admission ?? ""))) {
      issues.push(`${prefix}.admission is invalid`);
    }
    if (rawAction.agentExecutable !== false) issues.push(`${prefix}.agentExecutable must be false`);
    if (rawAction.terminal_eligible === true || rawAction.terminalEligible === true) {
      issues.push(`${prefix} must not claim terminal eligibility`);
    }
    if (rawAction.assistant_answer === true || rawAction.assistantAnswer === true) {
      issues.push(`${prefix} must not claim assistant-answer authority`);
    }
    for (const field of ["reasonCodes", "evidenceRefs", "missingEvidence"] as const) {
      if (!isStringArray(rawAction[field])) issues.push(`${prefix}.${field} must be strings`);
    }
    const serializedAction = JSON.stringify(rawAction);
    for (const pattern of FORBIDDEN_STAGE_PLAY_RECOMMENDED_ACTION_PATTERNS) {
      if (pattern.test(serializedAction)) {
        issues.push(`${prefix} must not reference execution tooling: ${pattern.source}`);
      }
    }
  }

  for (const [index, rawPerturbation] of (Array.isArray(value.perturbations) ? value.perturbations : []).entries()) {
    for (const issue of validateStagePlayPerturbationEventV1(rawPerturbation)) {
      issues.push(`perturbations[${index}].${issue}`);
    }
  }
  for (const [index, rawRequest] of (Array.isArray(value.checkpointRequests) ? value.checkpointRequests : []).entries()) {
    for (const issue of validateStagePlayCheckpointRequestV1(rawRequest)) {
      issues.push(`checkpointRequests[${index}].${issue}`);
    }
  }

  if (!isRecord(value.summary)) {
    issues.push("summary must be an object");
  } else {
    const expected = buildStagePlayBadgeGraphSummaryV1(
      badges.filter(isRecord) as StagePlayBadgeV1[],
      edges.filter(isRecord) as StagePlayBadgeEdgeV1[],
    );
    for (const field of [
      "badgeCount",
      "edgeCount",
      "affordanceCount",
      "blockedAffordanceCount",
      "proceduralBindingCount",
      "missingEvidenceCount",
    ] as const) {
      if (value.summary[field] !== expected[field]) issues.push(`summary.${field} must be ${expected[field]}`);
    }
  }

  const serialized = JSON.stringify(value);
  for (const pattern of FORBIDDEN_STAGE_PLAY_RAW_CONTENT_PATTERNS) {
    if (pattern.test(serialized)) {
      issues.push(`forbidden raw-content phrase matched: ${pattern.source}`);
    }
  }
  for (const pattern of FORBIDDEN_STAGE_PLAY_AUTHORITY_PATTERNS) {
    if (pattern.test(serialized)) {
      issues.push(`forbidden execution/answer authority phrase matched: ${pattern.source}`);
    }
  }

  return issues;
}

export function isStagePlayBadgeGraphV1(value: unknown): value is StagePlayBadgeGraphV1 {
  return validateStagePlayBadgeGraphV1(value).length === 0;
}
