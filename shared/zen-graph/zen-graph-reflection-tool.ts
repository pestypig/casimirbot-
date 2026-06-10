import {
  ZEN_GRAPH_REFLECTION_MAX_LOOP_DEPTH,
  validateZenGraphReflectionToolRequestV1,
  type ZenGraphReflectionProvenanceV1,
  type ZenGraphReflectionToolRequestV1,
  type ZenGraphReflectionToolResponseV1,
} from "../contracts/zen-graph-reflection-tool.v1";
import type { ZenObjectiveBindingV1 } from "../contracts/zen-objective-binding.v1";
import type { IdeologyGraph } from "./ideology-graph-types";
import { locateZenBadges } from "./locate-zen-badges";
import { mapIdeologyReflectionToRecommendedActionAdmission } from "./map-ideology-recommendations-to-admission";
import { reflectIdeologyContext } from "./reflect-ideology-context";
import {
  DEFAULT_ZEN_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
  resolveZenGraphObjectivePresetV1,
  type ZenGraphObjectivePresetV1,
} from "./zen-objective-presets";
import { buildSituationObjectiveBindingFromLocatorV1 } from "./zen-objective-bindings";

const PRESETS: readonly ZenGraphObjectivePresetV1[] = [
  DEFAULT_ZEN_WISDOM_PRESET,
  REINHARD_CHARACTER_PERSPECTIVE_PRESET,
] as const;

function presetById(presetId: string): ZenGraphObjectivePresetV1 | undefined {
  return PRESETS.find((preset) => preset.presetId === presetId);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function withTraceOption(binding: ZenObjectiveBindingV1, includeTrace: boolean | undefined): ZenObjectiveBindingV1 {
  if (includeTrace !== false) return binding;
  return {
    ...binding,
    trace: [],
  };
}

function newReflectionId(): string {
  return `zen-graph-reflection:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function buildProvenance(request: ZenGraphReflectionToolRequestV1): ZenGraphReflectionProvenanceV1 {
  if (request.loopDepth > ZEN_GRAPH_REFLECTION_MAX_LOOP_DEPTH) {
    throw new Error(`ZenGraph reflection loop depth exceeded: ${request.loopDepth}`);
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
  binding: ZenObjectiveBindingV1,
  provenance: ZenGraphReflectionProvenanceV1,
): ZenObjectiveBindingV1 {
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
            ? "Prior ZenGraph reflection is continuity-only and cannot confirm itself or inflate confidence."
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
            ? "Fresh non-recursive evidence is required before increasing confidence from a prior ZenGraph reflection."
            : "Primary user or workstation evidence is required before treating an assistant summary as fact.",
        requiredFor: provenance.reflectionId,
      },
    ],
  };
}

function resolvePresetOverlays(
  graph: IdeologyGraph,
  request: ZenGraphReflectionToolRequestV1,
): ZenObjectiveBindingV1[] {
  const presetIds = unique([...(request.requestedPresetIds ?? []), ...(request.comparePresetIds ?? [])]);
  return presetIds.map((presetId) => {
    const preset = presetById(presetId);
    if (!preset) throw new Error(`Unknown ZenGraph preset id: ${presetId}`);
    return resolveZenGraphObjectivePresetV1(graph, preset, {
      situationLabel: request.text,
      refs: request.refs,
    });
  });
}

export function reflectWithZenGraphToolV1(
  graph: IdeologyGraph,
  request: ZenGraphReflectionToolRequestV1,
): ZenGraphReflectionToolResponseV1 {
  const issues = validateZenGraphReflectionToolRequestV1(request);
  if (issues.length > 0) {
    throw new Error(`Invalid ZenGraph reflection tool request: ${issues.join("; ")}`);
  }
  const provenance = buildProvenance(request);

  const reflection = reflectIdeologyContext(graph, {
    kind: request.inputKind,
    text: request.text,
    refs: request.refs,
    reflectionId: provenance.reflectionId,
  });
  const locator = locateZenBadges(graph, {
    kind: request.inputKind,
    text: request.text,
    refs: request.refs,
    locatorId: `zen-badge-locator:${reflection.reflectionId}`,
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

export function listZenGraphReflectionToolPresetsV1(): ZenGraphObjectivePresetV1[] {
  return [...PRESETS];
}
