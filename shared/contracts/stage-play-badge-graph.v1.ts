export const STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID =
  "stage_play_badge_graph" as const;

export const STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION =
  "stage_play_badge_graph/v1" as const;

export const STAGE_PLAY_BADGE_KINDS = [
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
] as const;

export const STAGE_PLAY_SOURCE_REF_KINDS = [
  "live_source_observation",
  "environment_state_snapshot",
  "world_event",
  "world_delta_overlay",
  "chunk_snapshot_sample",
  "navigation_state",
  "route_solver_observation",
  "world_sense_context",
  "synthetic_evidence",
] as const;

export const STAGE_PLAY_LIVE_BINDING_KINDS = [
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
export type StagePlayBadgeStatusV1 = (typeof STAGE_PLAY_BADGE_STATUSES)[number];
export type StagePlayBadgeEdgeRelationV1 = (typeof STAGE_PLAY_EDGE_RELATIONS)[number];
export type StagePlayBadgeSourceRefKindV1 = (typeof STAGE_PLAY_SOURCE_REF_KINDS)[number];
export type StagePlayLiveBindingKindV1 = (typeof STAGE_PLAY_LIVE_BINDING_KINDS)[number];
export type StagePlayIntentVerbV1 = (typeof STAGE_PLAY_INTENT_VERBS)[number];
export type StagePlayRecommendedActionTypeV1 = (typeof STAGE_PLAY_RECOMMENDED_ACTION_TYPES)[number];

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
    latestSnapshotRefs: string[];
    latestDeltaOverlayRefs: string[];
    latestNavigationRefs: string[];
    freshness: "fresh" | "stale" | "missing" | "mixed" | "unknown";
  };
  badges: StagePlayBadgeV1[];
  edges: StagePlayBadgeEdgeV1[];
  recommendedActions: StagePlayBadgeGraphRecommendedActionV1[];
  summary: StagePlayBadgeGraphSummaryV1;
  authority: StagePlayBadgeGraphAuthorityV1;
};

export type BuildStagePlayBadgeGraphV1Input = Omit<
  StagePlayBadgeGraphV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary" | "authority"
> & {
  generatedAt?: string;
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
  return {
    artifactId: STAGE_PLAY_BADGE_GRAPH_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_BADGE_GRAPH_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    graphId: input.graphId,
    title: input.title,
    description: input.description,
    sourceWindow: input.sourceWindow,
    badges: input.badges,
    edges: input.edges,
    recommendedActions: input.recommendedActions,
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
      "latestSnapshotRefs",
      "latestDeltaOverlayRefs",
      "latestNavigationRefs",
    ] as const) {
      if (!isStringArray(value.sourceWindow[field])) issues.push(`sourceWindow.${field} must be strings`);
    }
    if (!["fresh", "stale", "missing", "mixed", "unknown"].includes(String(value.sourceWindow.freshness ?? ""))) {
      issues.push("sourceWindow.freshness is invalid");
    }
  }
  const sourceWindowHasAdmittedRefs =
    isRecord(value.sourceWindow) &&
    (
      (Array.isArray(value.sourceWindow.latestObservationRefs) && value.sourceWindow.latestObservationRefs.length > 0) ||
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
  validateAuthority(value.authority, issues);

  const badges = Array.isArray(value.badges) ? value.badges : [];
  const edges = Array.isArray(value.edges) ? value.edges : [];
  const badgeIds = new Set<string>();
  const edgeIds = new Set<string>();

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
