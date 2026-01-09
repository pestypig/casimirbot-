import type {
  TruthFunction,
  TruthFunctionStage,
  TruthInputKind,
  TruthPredicateKind,
} from "./contributions.schema";
import type {
  IdeologyVerifierPack,
  NodeVerifierMapping,
  Risk,
  Tier,
} from "../ideology/ideology-verifiers.schema";
import type { EvidenceRecord } from "./evidence-registry.schema";

export type TruthFunctionCompileError = {
  kind:
    | "DUPLICATE_NODE"
    | "UNKNOWN_NODE"
    | "UNKNOWN_INPUT_REF"
    | "UNKNOWN_PREDICATE_REF"
    | "MISSING_NON_MODEL_EVIDENCE";
  message: string;
  nodeId?: string;
  ref?: string;
};

export type TruthFunctionCompilerOptions = {
  allowUnknownRefs?: boolean;
  knownInputRefs?: Partial<Record<TruthInputKind, Set<string>>>;
  knownPredicateRefs?: Partial<Record<TruthPredicateKind, Set<string>>>;
  stageTierCaps?: Partial<Record<TruthFunctionStage, Tier>>;
  evidenceByRef?: Map<string, EvidenceRecord>;
};

export type TruthFunctionExecutionPlanStep = {
  kind: "test" | "query" | "rule";
  ref: string;
};

export type TruthFunctionExecutionPlan = {
  truthFunctionId: string;
  claim: string;
  nodeIds: string[];
  stage: TruthFunctionStage;
  tier: Tier;
  risk: Risk;
  inputs: TruthFunction["inputs"];
  predicate: TruthFunction["predicate"];
  steps: TruthFunctionExecutionPlanStep[];
};

const TIER_ORDER: Tier[] = ["L0", "L1", "L2", "L3"];
const RISK_ORDER: Risk[] = ["low", "medium", "high", "systemic"];
const NON_MODEL_INPUT_KINDS: TruthInputKind[] = [
  "metric",
  "audit",
  "attestation",
];
const NON_MODEL_MIN_TIER: Tier = "L2";
const DEFAULT_STAGE_TIER_CAP: Record<TruthFunctionStage, Tier> = {
  "exploratory": "L0",
  "reduced-order": "L1",
  "diagnostic": "L2",
  "certified": "L3",
};

const rankOf = <T extends string>(value: T, order: T[]): number =>
  Math.max(0, order.indexOf(value));

const pickHighest = <T extends string>(
  current: T | null,
  candidate: T,
  order: T[],
): T => {
  if (!current) return candidate;
  return rankOf(candidate, order) > rankOf(current, order) ? candidate : current;
};

const buildNodeIndex = (pack: IdeologyVerifierPack) => {
  const index = new Map<string, NodeVerifierMapping>();
  for (const mapping of pack.mappings) {
    index.set(mapping.nodeId, mapping);
  }
  return index;
};

const applyStageTierCap = (
  tier: Tier,
  stage: TruthFunctionStage,
  caps?: Partial<Record<TruthFunctionStage, Tier>>,
): Tier => {
  const cap = caps?.[stage] ?? DEFAULT_STAGE_TIER_CAP[stage];
  return rankOf(cap, TIER_ORDER) < rankOf(tier, TIER_ORDER) ? cap : tier;
};

const isNonModelLineage = (
  origin?: string,
  lineage?: string[],
): boolean =>
  Boolean(origin && origin !== "model" && (lineage?.length ?? 0) > 0);

const hasNonModelEvidence = (
  inputs: TruthFunction["inputs"],
  evidenceByRef?: Map<string, EvidenceRecord>,
): boolean =>
  inputs.some((input) => {
    if (!NON_MODEL_INPUT_KINDS.includes(input.kind)) return false;
    if (isNonModelLineage(input.source?.origin, input.source?.lineage)) {
      return true;
    }
    if (!evidenceByRef) return false;
    return input.refs.some((ref) => {
      const record = evidenceByRef.get(ref);
      if (!record) return false;
      if (record.kind !== input.kind) return false;
      return isNonModelLineage(record.source.origin, record.source.lineage);
    });
  });

export function compileTruthFunction(
  truthFunction: TruthFunction,
  pack: IdeologyVerifierPack,
  options: TruthFunctionCompilerOptions = {},
): { ok: true; plan: TruthFunctionExecutionPlan } | { ok: false; errors: TruthFunctionCompileError[] } {
  const errors: TruthFunctionCompileError[] = [];
  const seenNodes = new Set<string>();
  const mappingIndex = buildNodeIndex(pack);

  let derivedTier: Tier | null = null;
  let derivedRisk: Risk | null = null;

  for (const nodeId of truthFunction.nodeIds) {
    if (seenNodes.has(nodeId)) {
      errors.push({
        kind: "DUPLICATE_NODE",
        nodeId,
        message: `Duplicate nodeId "${nodeId}" in TruthFunction.`,
      });
      continue;
    }
    seenNodes.add(nodeId);

    const mapping = mappingIndex.get(nodeId);
    if (!mapping) {
      errors.push({
        kind: "UNKNOWN_NODE",
        nodeId,
        message: `No ideology verifier mapping found for nodeId "${nodeId}".`,
      });
      continue;
    }

    derivedTier = pickHighest(derivedTier, mapping.defaultTier, TIER_ORDER);
    derivedRisk = pickHighest(derivedRisk, mapping.risk, RISK_ORDER);
  }

  const allowUnknownRefs = options.allowUnknownRefs ?? true;
  for (const input of truthFunction.inputs) {
    const knownRefs = options.knownInputRefs?.[input.kind];
    if (!knownRefs || allowUnknownRefs) continue;
    for (const ref of input.refs) {
      if (!knownRefs.has(ref)) {
        errors.push({
          kind: "UNKNOWN_INPUT_REF",
          ref,
          message: `Unknown input ref "${ref}" for kind "${input.kind}".`,
        });
      }
    }
  }

  const predicateRefs = options.knownPredicateRefs?.[truthFunction.predicate.kind];
  if (predicateRefs && !allowUnknownRefs && !predicateRefs.has(truthFunction.predicate.ref)) {
    errors.push({
      kind: "UNKNOWN_PREDICATE_REF",
      ref: truthFunction.predicate.ref,
      message: `Unknown predicate ref "${truthFunction.predicate.ref}" for kind "${truthFunction.predicate.kind}".`,
    });
  }

  if (!derivedTier || !derivedRisk) {
    return { ok: false, errors };
  }

  const tier = applyStageTierCap(
    derivedTier,
    truthFunction.stage,
    options.stageTierCaps,
  );
  const requiresNonModelEvidence =
    rankOf(tier, TIER_ORDER) >= rankOf(NON_MODEL_MIN_TIER, TIER_ORDER);
  if (
    requiresNonModelEvidence &&
    !hasNonModelEvidence(truthFunction.inputs, options.evidenceByRef)
  ) {
    errors.push({
      kind: "MISSING_NON_MODEL_EVIDENCE",
      message:
        "L2/L3 truth functions require at least one non-model evidence input (metric/audit/attestation) with source lineage.",
    });
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }
  const steps: TruthFunctionExecutionPlanStep[] = [];
  const stepIndex = new Set<string>();
  const pushStep = (kind: TruthFunctionExecutionPlanStep["kind"], ref: string) => {
    const key = `${kind}:${ref}`;
    if (stepIndex.has(key)) return;
    stepIndex.add(key);
    steps.push({ kind, ref });
  };

  pushStep(truthFunction.predicate.kind, truthFunction.predicate.ref);
  for (const testRef of truthFunction.tests) {
    pushStep("test", testRef);
  }

  return {
    ok: true,
    plan: {
      truthFunctionId: truthFunction.id,
      claim: truthFunction.claim,
      nodeIds: [...seenNodes],
      stage: truthFunction.stage,
      tier,
      risk: derivedRisk,
      inputs: truthFunction.inputs,
      predicate: truthFunction.predicate,
      steps,
    },
  };
}
