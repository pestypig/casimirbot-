import type { HelixRecommendedActionAdmissionV1 } from "../contracts/helix-recommended-action-admission.v1";
import type { MoralObjectiveBindingV1 } from "../contracts/moral-objective-binding.v1";
import type { MoralGraphReflectionToolResponseV1 } from "../contracts/moral-graph-reflection-tool.v1";
import type { IdeologyContextReflectionV1, IdeologyNodeMatchV1 } from "../ideology-context-reflection";

export const MORAL_GRAPH_DEBUG_TRACE_ARTIFACT_ID = "moral_graph_debug_trace" as const;
export const MORAL_GRAPH_DEBUG_TRACE_SCHEMA_VERSION = "moral_graph_debug_trace/v1" as const;

export type MoralGraphDebugTraceRouteGuardV1 = {
  code: string;
  actionType: string;
  reason: string;
};

export type MoralGraphDebugTraceViewV1 = {
  artifactId: typeof MORAL_GRAPH_DEBUG_TRACE_ARTIFACT_ID;
  schemaVersion: typeof MORAL_GRAPH_DEBUG_TRACE_SCHEMA_VERSION;
  routeId?: string;
  source: {
    inputKind: string;
    sourceKind: string;
    sourceTrust: string;
    refs: string[];
  };
  activatedBadges: Array<{
    badgeId: string;
    principleId?: string;
    role: string;
    weight: number;
    confidence: number;
    source: string;
    pathToRoot: string[];
  }>;
  matchedIdeologyNodes: Array<{
    matchKind: "exact" | "likely" | "inferred_lens";
    nodeId: string;
    label: string;
    score: number;
    reasons: string[];
    pathToRoot: string[];
  }>;
  objectiveBinding: {
    subjectKind: string;
    objectiveStateId: string;
    objectiveStateLabel: string;
    constraints: MoralObjectiveBindingV1["constraints"];
    trace: MoralObjectiveBindingV1["trace"];
  };
  presetOverlays: Array<{
    subjectKind: string;
    objectiveStateId: string;
    objectiveStateLabel: string;
    activatedBadges: Array<{
      badgeId: string;
      role: string;
      weight: number;
      confidence: number;
      pathToRoot: string[];
    }>;
    missingEvidence: MoralObjectiveBindingV1["missingEvidence"];
    authorityBoundary: MoralObjectiveBindingV1["authorityBoundary"];
  }>;
  pathsToRoot: Array<{
    nodeId: string;
    pathToRoot: string[];
  }>;
  tensions: NonNullable<IdeologyContextReflectionV1["tensions"]>;
  missingEvidence: {
    reflection: string[];
    objectiveBinding: MoralObjectiveBindingV1["missingEvidence"];
  };
  recommendedActions: IdeologyContextReflectionV1["recommended_actions"];
  admissionDecisions: Array<{
    admissionId: string;
    actionId: string;
    label: string;
    admission: string;
    risk: string;
    displayPolicy?: string;
    agentExecutable: boolean;
    reasonCode: string;
    reasonCodes: string[];
    evidenceRequirements?: HelixRecommendedActionAdmissionV1["evidenceRequirements"];
  }>;
  authorityBoundary: {
    reflection: IdeologyContextReflectionV1["authority"];
    objectiveBinding: MoralObjectiveBindingV1["authorityBoundary"];
    admissions: HelixRecommendedActionAdmissionV1["authority"][];
  };
  antiPoisonLoop: {
    reflectionId: string;
    parentReflectionId?: string;
    loopDepth: number;
    sourceKind: string;
    sourceTrust: string;
    continuityOnly: boolean;
    confirmationEligible: boolean;
    confidenceCap: number;
  };
  routeGuards?: MoralGraphDebugTraceRouteGuardV1[];
  validationIssues?: string[];
  exposurePolicy: {
    structuredTraceOnly: true;
    rawInputIncluded: false;
    hiddenChainOfThoughtIncluded: false;
    assistantAnswer: false;
  };
};

function matchEntries(
  kind: "exact" | "likely" | "inferred_lens",
  matches: IdeologyNodeMatchV1[],
): MoralGraphDebugTraceViewV1["matchedIdeologyNodes"] {
  return matches.map((match) => ({
    matchKind: kind,
    nodeId: match.nodeId,
    label: match.label,
    score: match.score,
    reasons: [...match.reasons],
    pathToRoot: match.pathToRoot ?? [],
  }));
}

function uniquePaths(
  entries: Array<{ nodeId: string; pathToRoot?: string[] }>,
): MoralGraphDebugTraceViewV1["pathsToRoot"] {
  const paths = new Map<string, string[]>();
  for (const entry of entries) {
    if (!entry.pathToRoot || entry.pathToRoot.length === 0) continue;
    paths.set(entry.nodeId, [...entry.pathToRoot]);
  }
  return [...paths.entries()]
    .map(([nodeId, pathToRoot]) => ({ nodeId, pathToRoot }))
    .sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

function bindingBadges(binding: MoralObjectiveBindingV1): MoralGraphDebugTraceViewV1["activatedBadges"] {
  return binding.bindings.map((entry) => ({
    badgeId: entry.badgeId,
    ...(entry.principleId ? { principleId: entry.principleId } : {}),
    role: entry.role,
    weight: entry.weight,
    confidence: entry.confidence,
    source: entry.source,
    pathToRoot: entry.pathToRoot ?? [],
  }));
}

function overlaySummary(overlay: MoralObjectiveBindingV1): MoralGraphDebugTraceViewV1["presetOverlays"][number] {
  return {
    subjectKind: overlay.subject.kind,
    objectiveStateId: overlay.objectiveState.id,
    objectiveStateLabel: overlay.objectiveState.label,
    activatedBadges: overlay.bindings.map((entry) => ({
      badgeId: entry.badgeId,
      role: entry.role,
      weight: entry.weight,
      confidence: entry.confidence,
      pathToRoot: entry.pathToRoot ?? [],
    })),
    missingEvidence: overlay.missingEvidence,
    authorityBoundary: overlay.authorityBoundary,
  };
}

function admissionDecisions(admissions: HelixRecommendedActionAdmissionV1[]): MoralGraphDebugTraceViewV1["admissionDecisions"] {
  return admissions.flatMap((admission) =>
    admission.actions.map((action) => ({
      admissionId: admission.admissionId,
      actionId: action.actionId,
      label: action.label,
      admission: action.admission,
      risk: action.risk,
      ...(action.display_policy ? { displayPolicy: action.display_policy } : {}),
      agentExecutable: action.agentExecutable,
      reasonCode: action.reasonCode,
      reasonCodes: action.reasonCodes ?? [],
      ...(action.evidenceRequirements ? { evidenceRequirements: action.evidenceRequirements } : {}),
    })),
  );
}

export function buildMoralGraphDebugTraceViewV1(params: {
  response: MoralGraphReflectionToolResponseV1;
  routeId?: string;
  routeGuards?: MoralGraphDebugTraceRouteGuardV1[];
  validationIssues?: string[];
}): MoralGraphDebugTraceViewV1 {
  const { response } = params;
  const matchedIdeologyNodes = [
    ...matchEntries("exact", response.reflection.matches.exact),
    ...matchEntries("likely", response.reflection.matches.likely),
    ...matchEntries("inferred_lens", response.reflection.matches.inferred_lenses),
  ];

  return {
    artifactId: MORAL_GRAPH_DEBUG_TRACE_ARTIFACT_ID,
    schemaVersion: MORAL_GRAPH_DEBUG_TRACE_SCHEMA_VERSION,
    ...(params.routeId ? { routeId: params.routeId } : {}),
    source: {
      inputKind: response.reflection.input.kind,
      sourceKind: response.provenance.sourceKind,
      sourceTrust: response.provenance.sourceTrust,
      refs: response.reflection.input.refs ?? [],
    },
    activatedBadges: bindingBadges(response.objectiveBinding),
    matchedIdeologyNodes,
    objectiveBinding: {
      subjectKind: response.objectiveBinding.subject.kind,
      objectiveStateId: response.objectiveBinding.objectiveState.id,
      objectiveStateLabel: response.objectiveBinding.objectiveState.label,
      constraints: response.objectiveBinding.constraints,
      trace: response.objectiveBinding.trace,
    },
    presetOverlays: (response.presetOverlays ?? []).map(overlaySummary),
    pathsToRoot: uniquePaths([
      ...matchedIdeologyNodes,
      ...response.objectiveBinding.bindings.map((binding) => ({
        nodeId: binding.badgeId,
        pathToRoot: binding.pathToRoot,
      })),
    ]),
    tensions: response.reflection.tensions ?? [],
    missingEvidence: {
      reflection: response.reflection.claim_boundaries.missing_evidence ?? [],
      objectiveBinding: response.objectiveBinding.missingEvidence,
    },
    recommendedActions: response.recommendedActions,
    admissionDecisions: admissionDecisions(response.admissions),
    authorityBoundary: {
      reflection: response.reflection.authority,
      objectiveBinding: response.objectiveBinding.authorityBoundary,
      admissions: response.admissions.map((admission) => admission.authority),
    },
    antiPoisonLoop: {
      reflectionId: response.provenance.reflectionId,
      ...(response.provenance.parentReflectionId ? { parentReflectionId: response.provenance.parentReflectionId } : {}),
      loopDepth: response.provenance.loopDepth,
      sourceKind: response.provenance.sourceKind,
      sourceTrust: response.provenance.sourceTrust,
      continuityOnly: response.provenance.continuityOnly,
      confirmationEligible: response.provenance.confirmationEligible,
      confidenceCap: response.provenance.confidenceCap,
    },
    ...(params.routeGuards ? { routeGuards: params.routeGuards } : {}),
    ...(params.validationIssues ? { validationIssues: params.validationIssues } : {}),
    exposurePolicy: {
      structuredTraceOnly: true,
      rawInputIncluded: false,
      hiddenChainOfThoughtIncluded: false,
      assistantAnswer: false,
    },
  };
}
