import {
  MORAL_GRAPH_REFLECTION_MAX_LOOP_DEPTH,
  validateMoralGraphReflectionToolRequestV1,
  type MoralGraphReflectionProvenanceV1,
  type MoralGraphReflectionToolRequestV1,
  type MoralGraphReflectionToolResponseV1,
} from "../contracts/moral-graph-reflection-tool.v1";
import type { MoralObjectiveBindingV1 } from "../contracts/moral-objective-binding.v1";
import type { IdeologyGraph } from "./ideology-graph-types";
import { locateMoralBadges } from "./locate-moral-badges";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "./map-ideology-recommendations-to-admission";
import { reflectIdeologyContext } from "./reflect-ideology-context";
import {
  DEFAULT_MORAL_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
  resolveMoralGraphObjectivePresetV1,
  type MoralGraphObjectivePresetV1,
} from "./moral-objective-presets";
import { buildSituationObjectiveBindingFromLocatorV1 } from "./moral-objective-bindings";

const PRESETS: readonly MoralGraphObjectivePresetV1[] = [
  DEFAULT_MORAL_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
] as const;

function presetById(presetId: string): MoralGraphObjectivePresetV1 | undefined {
  return PRESETS.find((preset) => preset.presetId === presetId);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function withTraceOption(binding: MoralObjectiveBindingV1, includeTrace: boolean | undefined): MoralObjectiveBindingV1 {
  if (includeTrace !== false) return binding;
  return {
    ...binding,
    trace: [],
  };
}

function newReflectionId(): string {
  return `moral-graph-reflection:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function buildProvenance(request: MoralGraphReflectionToolRequestV1): MoralGraphReflectionProvenanceV1 {
  if (request.loopDepth > MORAL_GRAPH_REFLECTION_MAX_LOOP_DEPTH) {
    throw new Error(`MoralGraph reflection loop depth exceeded: ${request.loopDepth}`);
  }

  if (request.sourceKind === "assistant_summary") {
    return {
      reflectionId: request.reflectionId ?? newReflectionId(),
      parentReflectionId: request.parentReflectionId,
      loopDepth: request.loopDepth,
      sourceKind: request.sourceKind,
      sourceTrust: "low_trust",
      continuityOnly: false,
      confirmationEligible: false,
      confidenceCap: 0.55,
    };
  }

  if (request.sourceKind === "prior_reflection") {
    return {
      reflectionId: request.reflectionId ?? newReflectionId(),
      parentReflectionId: request.parentReflectionId,
      loopDepth: request.loopDepth,
      sourceKind: request.sourceKind,
      sourceTrust: "derived",
      continuityOnly: true,
      confirmationEligible: false,
      confidenceCap: 0.35,
    };
  }

  return {
    reflectionId: request.reflectionId ?? newReflectionId(),
    parentReflectionId: request.parentReflectionId,
    loopDepth: request.loopDepth,
    sourceKind: request.sourceKind,
    sourceTrust: "primary",
    continuityOnly: false,
    confirmationEligible: true,
    confidenceCap: 1,
  };
}

function capObjectiveBindingConfidence(
  binding: MoralObjectiveBindingV1,
  provenance: MoralGraphReflectionProvenanceV1,
): MoralObjectiveBindingV1 {
  if (provenance.confidenceCap >= 1) return binding;
  return {
    ...binding,
    bindings: binding.bindings.map((entry) => ({
      ...entry,
      confidence: Math.min(entry.confidence, provenance.confidenceCap),
      weight: Math.min(entry.weight, provenance.confidenceCap),
    })),
    trace: [
      ...binding.trace,
      {
        step: "apply_anti_poisoning_loop_guard",
        nodeIds: binding.bindings.map((entry) => entry.badgeId),
        badgeIds: binding.bindings.map((entry) => entry.badgeId),
        reason:
          provenance.sourceKind === "prior_reflection"
            ? "Prior MoralGraph reflection is continuity-only and cannot confirm itself or inflate confidence."
            : "Assistant-derived summary is lower-trust evidence and cannot masquerade as user facts.",
      },
    ],
    missingEvidence: [
      ...binding.missingEvidence,
      {
        id:
          provenance.sourceKind === "prior_reflection"
            ? "fresh_non_recursive_evidence"
            : "primary_user_or_workstation_evidence",
        description:
          provenance.sourceKind === "prior_reflection"
            ? "Fresh non-recursive evidence is required before increasing confidence from a prior MoralGraph reflection."
            : "Primary user or workstation evidence is required before treating an assistant summary as fact.",
        requiredFor: provenance.reflectionId,
      },
    ],
  };
}

function resolvePresetOverlays(
  graph: IdeologyGraph,
  request: MoralGraphReflectionToolRequestV1,
): MoralObjectiveBindingV1[] {
  const presetIds = unique([...(request.requestedPresetIds ?? []), ...(request.comparePresetIds ?? [])]);
  return presetIds.map((presetId) => {
    const preset = presetById(presetId);
    if (!preset) throw new Error(`Unknown MoralGraph preset id: ${presetId}`);
    return resolveMoralGraphObjectivePresetV1(graph, preset, {
      situationLabel: request.text,
      refs: request.refs,
    });
  });
}

export function reflectWithMoralGraphToolV1(
  graph: IdeologyGraph,
  request: MoralGraphReflectionToolRequestV1,
): MoralGraphReflectionToolResponseV1 {
  const issues = validateMoralGraphReflectionToolRequestV1(request);
  if (issues.length > 0) {
    throw new Error(`Invalid MoralGraph reflection tool request: ${issues.join("; ")}`);
  }
  const provenance = buildProvenance(request);

  const reflection = reflectIdeologyContext(graph, {
    kind: request.inputKind,
    text: request.text,
    refs: request.refs,
    reflectionId: provenance.reflectionId,
  });
  const locator = locateMoralBadges(graph, {
    kind: request.inputKind,
    text: request.text,
    refs: request.refs,
    locatorId: `moral-badge-locator:${reflection.reflectionId}`,
  });
  const includeTrace = request.options?.includeTrace;
  const objectiveBinding = withTraceOption(
    capObjectiveBindingConfidence(buildSituationObjectiveBindingFromLocatorV1(locator), provenance),
    includeTrace,
  );
  const presetOverlays = resolvePresetOverlays(graph, request).map((overlay) =>
    withTraceOption(capObjectiveBindingConfidence(overlay, provenance), includeTrace),
  );
  const admission = mapIdeologyReflectionToRecommendedActionAdmission(reflection);
  const allowFreshRecommendations = provenance.sourceKind !== "prior_reflection";

  return {
    provenance,
    reflection,
    locator,
    objectiveBinding,
    ...(presetOverlays.length > 0 ? { presetOverlays } : {}),
    recommendedActions:
      request.options?.includeRecommendedActions === false || !allowFreshRecommendations
        ? []
        : reflection.recommended_actions,
    admissions: request.options?.includeAdmissions === false || !allowFreshRecommendations ? [] : [admission],
  };
}

export function listMoralGraphReflectionToolPresetsV1(): MoralGraphObjectivePresetV1[] {
  return [...PRESETS];
}
