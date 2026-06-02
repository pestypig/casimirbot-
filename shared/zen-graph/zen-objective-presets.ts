import {
  buildZenObjectiveBindingV1,
  type ZenObjectiveBindingBadgeBindingV1,
  type ZenObjectiveBindingConstraintTypeV1,
  type ZenObjectiveBindingConstraintV1,
  type ZenObjectiveBindingRoleV1,
  type ZenObjectiveBindingV1,
} from "../contracts/zen-objective-binding.v1";
import type { IdeologyGraph } from "./ideology-graph-types";
import { getIdeologyPathToRoot } from "./traverse-ideology-graph";
import { REINHARD_VON_LOHENGRAMM_PROFILE } from "./character-profiles/reinhard-von-lohengramm";
import { getZenWisdomPrinciple, ZEN_WISDOM_PRINCIPLES } from "./wisdom-principles";

export const ZEN_GRAPH_PRESET_KINDS = ["wisdom", "character_perspective"] as const;
export type ZenGraphPresetKindV1 = (typeof ZEN_GRAPH_PRESET_KINDS)[number];

export type ZenGraphPresetBadgeWeightV1 = {
  badgeId: string;
  weight: number;
  confidence?: number;
  role?: ZenObjectiveBindingRoleV1;
  note?: string;
};

export type ZenGraphObjectivePresetV1 = {
  presetId: string;
  kind: ZenGraphPresetKindV1;
  label: string;
  description: string;
  badgeWeights: ZenGraphPresetBadgeWeightV1[];
  requiredConstraints: string[];
  preferredSafeguards: string[];
  actionGates: string[];
  traceLabels: string[];
  refs?: string[];
};

export type ResolveZenGraphPresetOptionsV1 = {
  situationLabel?: string;
  refs?: string[];
};

function clampUnit(value: number | undefined, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function roleFromBadgeId(badgeId: string): ZenObjectiveBindingRoleV1 {
  const principle = getZenWisdomPrinciple(badgeId);
  if (principle?.proceduralRole === "constraint") return "constraint";
  if (principle?.proceduralRole === "action_gate") return "action_gate";
  if (principle?.proceduralRole === "balancer") return "safeguard";
  if (principle?.proceduralRole === "objective_view") return "lens";
  return "core";
}

function constraintTypeForBadgeId(badgeId: string): ZenObjectiveBindingConstraintTypeV1 {
  const normalized = badgeId.toLowerCase();
  if (normalized.includes("non-harm") || normalized.includes("harm")) return "non_harm";
  if (normalized.includes("speech")) return "right_speech";
  if (normalized.includes("consent")) return "consent_required";
  if (normalized.includes("uncertainty") || normalized.includes("revision")) return "uncertainty_required";
  if (normalized.includes("review") || normalized.includes("approval") || normalized.includes("due-process")) {
    return "review_required";
  }
  return "evidence_required";
}

function constraintForBadgeId(badgeId: string, role: ZenObjectiveBindingRoleV1): ZenObjectiveBindingConstraintV1 {
  return {
    id: `preset.constraint.${badgeId}`,
    type: constraintTypeForBadgeId(badgeId),
    label: `Preset ${role.replace("_", " ")}: ${badgeId}`,
    severity: role === "action_gate" ? "hard" : role === "tension" ? "high" : "medium",
  };
}

function bindingForBadge(
  graph: IdeologyGraph,
  preset: ZenGraphObjectivePresetV1,
  weight: ZenGraphPresetBadgeWeightV1,
  role: ZenObjectiveBindingRoleV1,
): ZenObjectiveBindingBadgeBindingV1 {
  const principle = getZenWisdomPrinciple(weight.badgeId);
  const pathToRoot = getIdeologyPathToRoot(graph, weight.badgeId);
  return {
    badgeId: weight.badgeId,
    principleId: principle?.id,
    role,
    weight: clampUnit(weight.weight, 1),
    confidence: clampUnit(weight.confidence, preset.kind === "wisdom" ? 1 : 0.86),
    source: "preset",
    pathToRoot: pathToRoot.length > 0 ? pathToRoot : [weight.badgeId],
  };
}

function collectReferencedBadgeIds(preset: ZenGraphObjectivePresetV1): string[] {
  return unique([
    ...preset.badgeWeights.map((weight) => weight.badgeId),
    ...preset.requiredConstraints,
    ...preset.preferredSafeguards,
    ...preset.actionGates,
  ]);
}

export function validateZenGraphObjectivePresetV1(
  graph: IdeologyGraph,
  preset: ZenGraphObjectivePresetV1,
): string[] {
  const issues: string[] = [];

  if (!preset.presetId.trim()) issues.push("presetId must be a non-empty string");
  if (!ZEN_GRAPH_PRESET_KINDS.includes(preset.kind)) issues.push("kind is invalid");
  if (!preset.label.trim()) issues.push("label must be a non-empty string");
  if (!preset.description.trim()) issues.push("description must be a non-empty string");
  if (preset.badgeWeights.length === 0) issues.push("badgeWeights must contain at least one badge");

  preset.badgeWeights.forEach((weight, index) => {
    if (!weight.badgeId.trim()) issues.push(`badgeWeights[${index}].badgeId must be a non-empty string`);
    if (typeof weight.weight !== "number" || !Number.isFinite(weight.weight) || weight.weight < 0 || weight.weight > 1) {
      issues.push(`badgeWeights[${index}].weight must be between 0 and 1`);
    }
    if (
      weight.confidence !== undefined &&
      (typeof weight.confidence !== "number" || !Number.isFinite(weight.confidence) || weight.confidence < 0 || weight.confidence > 1)
    ) {
      issues.push(`badgeWeights[${index}].confidence must be between 0 and 1`);
    }
  });

  for (const badgeId of collectReferencedBadgeIds(preset)) {
    if (!graph.nodeById.has(badgeId)) issues.push(`missing ideology badge reference: ${badgeId}`);
  }

  return issues;
}

export function resolveZenGraphObjectivePresetV1(
  graph: IdeologyGraph,
  preset: ZenGraphObjectivePresetV1,
  options?: ResolveZenGraphPresetOptionsV1,
): ZenObjectiveBindingV1 {
  const issues = validateZenGraphObjectivePresetV1(graph, preset);
  if (issues.length > 0) {
    throw new Error(`Invalid ZenGraph objective preset ${preset.presetId}: ${issues.join("; ")}`);
  }

  const weightedBindings = preset.badgeWeights.map((weight) =>
    bindingForBadge(graph, preset, weight, weight.role ?? roleFromBadgeId(weight.badgeId)),
  );
  const weightedBadgeIds = new Set(weightedBindings.map((binding) => binding.badgeId));
  const extraBindings: ZenObjectiveBindingBadgeBindingV1[] = [
    ...preset.requiredConstraints.map((badgeId) => ({ badgeId, role: "constraint" as const })),
    ...preset.preferredSafeguards.map((badgeId) => ({ badgeId, role: "safeguard" as const })),
    ...preset.actionGates.map((badgeId) => ({ badgeId, role: "action_gate" as const })),
  ]
    .filter((entry) => !weightedBadgeIds.has(entry.badgeId))
    .map((entry) =>
      bindingForBadge(
        graph,
        preset,
        {
          badgeId: entry.badgeId,
          weight: entry.role === "action_gate" ? 1 : 0.84,
          confidence: 0.9,
        },
        entry.role,
      ),
    );

  const bindings = [...weightedBindings, ...extraBindings];
  const constraintIds = unique([...preset.requiredConstraints, ...preset.preferredSafeguards, ...preset.actionGates]);

  return buildZenObjectiveBindingV1({
    subject: {
      kind: preset.kind === "wisdom" ? "wisdom_preset" : "character_preset",
      label: options?.situationLabel ? `${preset.label} applied to: ${options.situationLabel}` : preset.label,
      refs: unique([...(preset.refs ?? []), ...(options?.refs ?? [])]),
    },
    objectiveState: {
      id: `${preset.presetId}.objective_state`,
      label: `${preset.label} objective binding`,
      description: preset.description,
    },
    bindings,
    constraints: constraintIds.map((badgeId) =>
      constraintForBadgeId(
        badgeId,
        preset.actionGates.includes(badgeId)
          ? "action_gate"
          : preset.preferredSafeguards.includes(badgeId)
            ? "safeguard"
            : "constraint",
      ),
    ),
    trace: preset.traceLabels.map((label, index) => ({
      step: `preset_trace_${index + 1}`,
      nodeIds: collectReferencedBadgeIds(preset),
      badgeIds: bindings.map((binding) => binding.badgeId),
      reason: label,
    })),
    missingEvidence: bindings.flatMap((binding) => {
      const principle = getZenWisdomPrinciple(binding.badgeId);
      return (principle?.evidenceNeeds ?? []).map((need) => ({
        id: need,
        description: `Preset ${preset.label} requires evidence for ${binding.badgeId}: ${need}.`,
        requiredFor: preset.presetId,
      }));
    }),
  });
}

export const DEFAULT_ZEN_WISDOM_PRESET: ZenGraphObjectivePresetV1 = {
  presetId: "zen.preset.wisdom.default",
  kind: "wisdom",
  label: "Default Zen wisdom",
  description: "Default first-principles wisdom preset for reflection over the Zen badge graph.",
  badgeWeights: ZEN_WISDOM_PRINCIPLES.map((principle) => ({
    badgeId: principle.id,
    weight: 1,
    confidence: 1,
    role: roleFromBadgeId(principle.id),
    note: principle.actionEffect,
  })),
  requiredConstraints: [
    "right-speech-and-accurate-formulation",
    "non-harm-and-compassionate-constraint",
  ],
  preferredSafeguards: [
    "interdependence-yin-yang-balance",
    "falsifiability-and-truth-convergence",
  ],
  actionGates: [
    "fairness-due-process-and-justification",
    "skillful-action-under-uncertainty",
  ],
  traceLabels: [
    "Start from wisdom first principles.",
    "Preserve diagnostic-only authority and missing-evidence checks.",
  ],
  refs: ["docs/ethos/ideology.json"],
};

export const REINHARD_CHARACTER_PERSPECTIVE_PRESET: ZenGraphObjectivePresetV1 = {
  presetId: "zen.preset.character.logh.reinhard_von_lohengramm",
  kind: "character_perspective",
  label: "Reinhard von Lohengramm perspective",
  description:
    "Named character perspective preset that weights Zen principles for comparison without asserting anything about a real person.",
  badgeWeights: REINHARD_VON_LOHENGRAMM_PROFILE.zenBadgeWeights.map((weight) => ({
    badgeId: weight.nodeId,
    weight: weight.weight,
    confidence: 0.86,
    role: roleFromBadgeId(weight.nodeId),
    note: weight.note,
  })),
  requiredConstraints: [
    "right-speech-and-accurate-formulation",
    "non-harm-and-compassionate-constraint",
  ],
  preferredSafeguards: [
    "interdependence-yin-yang-balance",
    "falsifiability-and-truth-convergence",
  ],
  actionGates: [
    "fairness-due-process-and-justification",
    "skillful-action-under-uncertainty",
  ],
  traceLabels: [
    "Resolve named character perspective as badge weights over the Zen graph.",
    "Avoid character judgment, moral finality, canon certainty, and execution authority.",
  ],
  refs: [
    REINHARD_VON_LOHENGRAMM_PROFILE.character.id,
    REINHARD_VON_LOHENGRAMM_PROFILE.character.series,
  ],
};
