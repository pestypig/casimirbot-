import {
  STAGE_PLAY_BADGE_KINDS,
  STAGE_PLAY_EDGE_RELATIONS,
  type StagePlayBadgeKindV1,
  type StagePlayBadgeEdgeRelationV1,
} from "./stage-play-badge-graph.v1";

export const STAGE_PLAY_BUILDER_CATALOG_ARTIFACT_ID =
  "stage_play_builder_catalog" as const;
export const STAGE_PLAY_BUILDER_CATALOG_SCHEMA_VERSION =
  "stage_play_builder_catalog/v1" as const;
export const STAGE_PLAY_SOURCE_QUERY_ARTIFACT_ID =
  "stage_play_source_query" as const;
export const STAGE_PLAY_SOURCE_QUERY_SCHEMA_VERSION =
  "stage_play_source_query/v1" as const;
export const STAGE_PLAY_GRAPH_DRAFT_ARTIFACT_ID =
  "stage_play_graph_draft" as const;
export const STAGE_PLAY_GRAPH_DRAFT_SCHEMA_VERSION =
  "stage_play_graph_draft/v1" as const;
export const STAGE_PLAY_GRAPH_DRAFT_VALIDATION_ARTIFACT_ID =
  "stage_play_graph_draft_validation" as const;
export const STAGE_PLAY_GRAPH_DRAFT_VALIDATION_SCHEMA_VERSION =
  "stage_play_graph_draft_validation/v1" as const;

export const STAGE_PLAY_SOURCE_CLASSES = [
  "world_event",
  "environment_state",
  "environment_affordance",
  "visual_frame",
  "audio_transcript",
  "text_chat",
  "screen_summary",
  "minecraft_world_events",
  "calculator_stream",
  "simulation_stream",
  "document_context",
  "note_context",
  "procedure_graph",
  "process_graph",
] as const;

export const STAGE_PLAY_BUILDER_PORT_KINDS = [
  "source_handle",
  "incoming_compact_window",
  "checkpoint_receipt",
  "interpreted_stage_fact",
  "procedural_candidate",
  "missing_evidence",
  "admission_state",
] as const;

export type StagePlaySourceClassV1 = (typeof STAGE_PLAY_SOURCE_CLASSES)[number];
export type StagePlayBuilderPortKindV1 = (typeof STAGE_PLAY_BUILDER_PORT_KINDS)[number];

export type StagePlayBuilderAuthorityV1 = {
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

export type StagePlaySourceHandleV1 = {
  sourceId: string;
  sourceClass: string;
  status: string;
  label?: string | null;
  descriptorId?: string | null;
  producerId?: string | null;
  surface?: string | null;
  origin?: string | null;
  cadenceMs?: number | null;
  latestEvidenceRefs: string[];
};

export type StagePlayBuilderCatalogV1 = {
  artifactId: typeof STAGE_PLAY_BUILDER_CATALOG_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_BUILDER_CATALOG_SCHEMA_VERSION;
  generatedAt: string;
  nodeKinds: StagePlayBadgeKindV1[];
  edgeRelations: StagePlayBadgeEdgeRelationV1[];
  sourceClasses: readonly string[];
  portKinds: readonly StagePlayBuilderPortKindV1[];
  requiredFlow: string[];
  authority: StagePlayBuilderAuthorityV1;
};

export type StagePlaySourceQueryV1 = {
  artifactId: typeof STAGE_PLAY_SOURCE_QUERY_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_SOURCE_QUERY_SCHEMA_VERSION;
  generatedAt: string;
  threadId: string;
  environmentId?: string | null;
  sourceHandles: StagePlaySourceHandleV1[];
  authority: StagePlayBuilderAuthorityV1;
};

export type StagePlayGraphDraftNodeV1 = {
  id: string;
  kind: StagePlayBadgeKindV1;
  title?: string | null;
  bind?: {
    sourceClass?: string | null;
    sourceId?: string | null;
  } | null;
  parameters?: Record<string, string | number | boolean | null>;
  evidenceRefs?: string[];
};

export type StagePlayGraphDraftEdgeV1 = {
  from: string;
  to: string;
  relation: StagePlayBadgeEdgeRelationV1;
  label?: string | null;
};

export type StagePlayGraphDraftCheckpointPolicyV1 = {
  cadenceMs?: number | null;
  completeEachWindow: boolean;
  standingJobRemainsOpen: boolean;
};

export type StagePlayGraphDraftV1 = {
  artifactId: typeof STAGE_PLAY_GRAPH_DRAFT_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_GRAPH_DRAFT_SCHEMA_VERSION;
  draftId: string;
  objective: string;
  nodes: StagePlayGraphDraftNodeV1[];
  edges: StagePlayGraphDraftEdgeV1[];
  checkpointPolicy: StagePlayGraphDraftCheckpointPolicyV1;
  authority: StagePlayBuilderAuthorityV1;
};

export type StagePlayGraphDraftValidationV1 = {
  artifactId: typeof STAGE_PLAY_GRAPH_DRAFT_VALIDATION_ARTIFACT_ID;
  schemaVersion: typeof STAGE_PLAY_GRAPH_DRAFT_VALIDATION_SCHEMA_VERSION;
  generatedAt: string;
  ok: boolean;
  draftId?: string | null;
  issues: string[];
  warnings: string[];
  resolvedSourceIds: string[];
  evidenceRefs: string[];
  missingEvidence: string[];
  authority: StagePlayBuilderAuthorityV1;
};

export const STAGE_PLAY_BUILDER_AUTHORITY: StagePlayBuilderAuthorityV1 = {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? Array.from(new Set(value.map(readString).filter((entry): entry is string => Boolean(entry))))
    : [];

const hashString = (value: string): string => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(16);
};

const forbiddenAuthorityPattern =
  /\b(?:execute|run command|terminal)\b|["']?(?:agent[_ -]?executable|agentExecutable|terminal[_ -]?eligible|terminalEligible|assistant[_ -]?answer|assistantAnswer)["']?\s*[:=]\s*true/i;

export function buildStagePlayBuilderCatalogV1(input: {
  generatedAt?: string;
  sourceClasses?: string[];
} = {}): StagePlayBuilderCatalogV1 {
  return {
    artifactId: STAGE_PLAY_BUILDER_CATALOG_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_BUILDER_CATALOG_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    nodeKinds: [...STAGE_PLAY_BADGE_KINDS],
    edgeRelations: [...STAGE_PLAY_EDGE_RELATIONS],
    sourceClasses: Array.from(new Set([...(input.sourceClasses ?? []), ...STAGE_PLAY_SOURCE_CLASSES])),
    portKinds: STAGE_PLAY_BUILDER_PORT_KINDS,
    requiredFlow: [
      "source feeds interpreter",
      "interpreter produces checkpoint receipt",
      "checkpoint evidence interprets into stage facts",
      "stage facts constrain affordances and procedures",
      "procedures emit recommendations or missing checks",
      "all outputs remain evidence-only",
    ],
    authority: STAGE_PLAY_BUILDER_AUTHORITY,
  };
}

export function buildStagePlaySourceQueryV1(input: {
  threadId: string;
  environmentId?: string | null;
  sourceHandles: StagePlaySourceHandleV1[];
  generatedAt?: string;
}): StagePlaySourceQueryV1 {
  return {
    artifactId: STAGE_PLAY_SOURCE_QUERY_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_SOURCE_QUERY_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    sourceHandles: input.sourceHandles,
    authority: STAGE_PLAY_BUILDER_AUTHORITY,
  };
}

export function normalizeStagePlayGraphDraftV1(value: unknown): {
  draft: StagePlayGraphDraftV1 | null;
  issues: string[];
} {
  const issues: string[] = [];
  const candidate = isRecord(value) && isRecord(value.draft) ? value.draft : value;
  if (!isRecord(candidate)) return { draft: null, issues: ["draft must be an object"] };
  const objective = readString(candidate.objective) ?? "Assemble a Stage Play evidence graph.";
  const rawNodes = Array.isArray(candidate.nodes) ? candidate.nodes : [];
  const rawEdges = Array.isArray(candidate.edges) ? candidate.edges : [];
  if (!Array.isArray(candidate.nodes)) issues.push("nodes must be an array");
  if (!Array.isArray(candidate.edges)) issues.push("edges must be an array");
  const nodeIds = new Set<string>();
  const nodes: StagePlayGraphDraftNodeV1[] = [];
  for (const [index, rawNode] of rawNodes.entries()) {
    if (!isRecord(rawNode)) {
      issues.push(`nodes[${index}] must be an object`);
      continue;
    }
    const id = readString(rawNode.id) ?? `draft_node:${index + 1}`;
    if (nodeIds.has(id)) issues.push(`duplicate node id: ${id}`);
    nodeIds.add(id);
    const kind = readString(rawNode.kind);
    if (!kind || !STAGE_PLAY_BADGE_KINDS.includes(kind as StagePlayBadgeKindV1)) {
      issues.push(`nodes[${index}].kind is invalid`);
    }
    const bind = isRecord(rawNode.bind)
      ? {
          sourceClass: readString(rawNode.bind.sourceClass ?? rawNode.bind.source_class),
          sourceId: readString(rawNode.bind.sourceId ?? rawNode.bind.source_id),
        }
      : null;
    nodes.push({
      id,
      kind: (kind && STAGE_PLAY_BADGE_KINDS.includes(kind as StagePlayBadgeKindV1) ? kind : "world_state") as StagePlayBadgeKindV1,
      title: readString(rawNode.title),
      bind,
      parameters: isRecord(rawNode.parameters)
        ? Object.fromEntries(Object.entries(rawNode.parameters).filter(([, entry]) =>
            typeof entry === "string" ||
            typeof entry === "number" ||
            typeof entry === "boolean" ||
            entry === null
          )) as StagePlayGraphDraftNodeV1["parameters"]
        : {},
      evidenceRefs: readStringArray(rawNode.evidenceRefs ?? rawNode.evidence_refs),
    });
  }
  const edges: StagePlayGraphDraftEdgeV1[] = [];
  for (const [index, rawEdge] of rawEdges.entries()) {
    if (!isRecord(rawEdge)) {
      issues.push(`edges[${index}] must be an object`);
      continue;
    }
    const from = readString(rawEdge.from);
    const to = readString(rawEdge.to);
    const relation = readString(rawEdge.relation);
    if (!from) issues.push(`edges[${index}].from must be a string`);
    if (!to) issues.push(`edges[${index}].to must be a string`);
    if (from && !nodeIds.has(from)) issues.push(`edges[${index}].from references missing node: ${from}`);
    if (to && !nodeIds.has(to)) issues.push(`edges[${index}].to references missing node: ${to}`);
    if (!relation || !STAGE_PLAY_EDGE_RELATIONS.includes(relation as StagePlayBadgeEdgeRelationV1)) {
      issues.push(`edges[${index}].relation is invalid`);
    }
    if (from && to && relation && STAGE_PLAY_EDGE_RELATIONS.includes(relation as StagePlayBadgeEdgeRelationV1)) {
      edges.push({
        from,
        to,
        relation: relation as StagePlayBadgeEdgeRelationV1,
        label: readString(rawEdge.label),
      });
    }
  }
  const checkpoint = isRecord(candidate.checkpointPolicy ?? candidate.checkpoint_policy)
    ? candidate.checkpointPolicy ?? candidate.checkpoint_policy as Record<string, unknown>
    : {};
  const draft: StagePlayGraphDraftV1 = {
    artifactId: STAGE_PLAY_GRAPH_DRAFT_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_GRAPH_DRAFT_SCHEMA_VERSION,
    draftId: readString(candidate.draftId ?? candidate.draft_id) ?? `stage_play_graph_draft:${hashString(JSON.stringify(candidate))}`,
    objective,
    nodes,
    edges,
    checkpointPolicy: {
      cadenceMs: typeof checkpoint.cadenceMs === "number"
        ? checkpoint.cadenceMs
        : typeof checkpoint.cadence_ms === "number"
          ? checkpoint.cadence_ms
          : null,
      completeEachWindow: checkpoint.completeEachWindow !== false && checkpoint.complete_each_window !== false,
      standingJobRemainsOpen: checkpoint.standingJobRemainsOpen !== false && checkpoint.standing_job_remains_open !== false,
    },
    authority: STAGE_PLAY_BUILDER_AUTHORITY,
  };
  const serialized = JSON.stringify(candidate);
  if (forbiddenAuthorityPattern.test(serialized)) {
    issues.push("draft must not request execution, terminal, or assistant-answer authority");
  }
  return { draft, issues };
}

export function validateStagePlayGraphDraftV1(input: {
  draft: StagePlayGraphDraftV1 | null;
  initialIssues?: string[];
  sourceHandles?: StagePlaySourceHandleV1[];
  generatedAt?: string;
}): StagePlayGraphDraftValidationV1 {
  const issues = [...(input.initialIssues ?? [])];
  const warnings: string[] = [];
  const sourceHandles = input.sourceHandles ?? [];
  const sourceIds = new Set(sourceHandles.map((source) => source.sourceId));
  const sourceClasses = new Set([
    ...STAGE_PLAY_SOURCE_CLASSES,
    ...sourceHandles.map((source) => source.sourceClass),
  ]);
  const resolvedSourceIds: string[] = [];
  const evidenceRefs: string[] = [];
  if (!input.draft) {
    issues.push("draft is missing");
  } else {
    if (input.draft.nodes.length === 0) issues.push("draft must include at least one node");
    if (!input.draft.nodes.some((node) => node.kind === "source")) warnings.push("draft has no source node");
    if (!input.draft.nodes.some((node) => node.kind === "interpreter")) warnings.push("draft has no interpreter node");
    for (const [index, node] of input.draft.nodes.entries()) {
      if (node.kind === "source") {
        const sourceClass = node.bind?.sourceClass ?? node.parameters?.source_class;
        const sourceId = node.bind?.sourceId ?? node.parameters?.source_id;
        if (typeof sourceClass === "string" && sourceClass && !sourceClasses.has(sourceClass)) {
          issues.push(`nodes[${index}].bind.sourceClass is not available: ${sourceClass}`);
        }
        if (typeof sourceId === "string" && sourceId) {
          if (!sourceIds.has(sourceId)) {
            issues.push(`nodes[${index}].bind.sourceId is not available: ${sourceId}`);
          } else {
            resolvedSourceIds.push(sourceId);
            const handle = sourceHandles.find((source) => source.sourceId === sourceId);
            evidenceRefs.push(...(handle?.latestEvidenceRefs ?? []));
          }
        }
      }
      evidenceRefs.push(...(node.evidenceRefs ?? []));
    }
    if (input.draft.checkpointPolicy.completeEachWindow !== true) {
      warnings.push("checkpoint completion is disabled; live interpretation should complete each compact window");
    }
    if (input.draft.checkpointPolicy.standingJobRemainsOpen !== true) {
      issues.push("standingJobRemainsOpen must stay true for live Stage Play jobs");
    }
  }
  return {
    artifactId: STAGE_PLAY_GRAPH_DRAFT_VALIDATION_ARTIFACT_ID,
    schemaVersion: STAGE_PLAY_GRAPH_DRAFT_VALIDATION_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    ok: issues.length === 0,
    draftId: input.draft?.draftId ?? null,
    issues,
    warnings,
    resolvedSourceIds: Array.from(new Set(resolvedSourceIds)),
    evidenceRefs: Array.from(new Set(evidenceRefs)),
    missingEvidence: issues.length > 0 ? issues : [],
    authority: STAGE_PLAY_BUILDER_AUTHORITY,
  };
}
