import type { HelixCalculatorSetupContext } from "../helix-calculator-setup-context";

export const THEORY_BADGE_GRAPH_ARTIFACT_ID = "theory_badge_graph" as const;
export const THEORY_BADGE_GRAPH_SCHEMA_VERSION = "theory_badge_graph/v1" as const;

export const THEORY_BADGE_LEVELS = [
  "first_principle",
  "law",
  "derived_relation",
  "model",
  "simulation_specific",
  "diagnostic_gate",
  "claim_boundary",
] as const;

export const THEORY_BADGE_STATUSES = [
  "canonical_reference",
  "project_derived",
  "diagnostic",
  "review",
  "blocked",
] as const;

export const THEORY_BADGE_EDGE_RELATIONS = [
  "derives",
  "requires",
  "specializes",
  "approximates",
  "bounds",
  "shares_units",
  "uses_constant",
  "numerically_solves",
  "diagnostic_checks",
  "documents",
  "blocks",
] as const;

const THEORY_BADGE_EQUATION_ROLES = [
  "definition",
  "law",
  "constraint",
  "transform",
  "residual",
  "gate",
  "calculator_demo",
  "noncomputable_reference",
] as const;

const THEORY_BADGE_OPERATOR_KINDS = [
  "scalar_expression",
  "field_sample",
  "tensor_component",
  "region_aggregate",
  "worldline_integral",
  "residual",
  "gate_status",
  "noncomputable_reference",
] as const;

const THEORY_BADGE_SOURCE_KINDS = [
  "repo_module",
  "equation_map_node",
  "visualizer_preset",
  "test",
  "doc",
  "artifact",
  "literature_ref",
] as const;

export const THEORY_BADGE_SCALE_ENVELOPE_BASES = [
  "measured",
  "derived",
  "model_assumption",
  "heuristic",
] as const;

export const THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES = [
  "scalar",
  "vector",
  "tensor",
  "distribution",
  "count",
  "event",
  "relation",
] as const;

export const THEORY_BADGE_OBSERVABLE_BRIDGE_KINDS = [
  "identity",
  "unit_conversion",
  "coordinate_transform",
  "calibrated_response",
  "coarse_graining",
  "approximation",
] as const;

export const THEORY_BADGE_OBSERVABLE_ERROR_KINDS = [
  "exact",
  "bounded",
  "statistical",
] as const;

const THEORY_BADGE_CALCULATOR_ACTIONS = [
  "ingest_latex",
  "solve_expression",
  "solve_with_steps",
] as const;

const FORBIDDEN_THEORY_CLAIM_PATTERNS = [
  /\bvalidated propulsion\b/i,
  /\bworking warp drive\b/i,
  /\bphysical mechanism confirmed\b/i,
  /\bQEI passed\b/i,
  /\bproven warp\b/i,
  /\benergy conditions cleared\b/i,
  /\bexternal paper validates NHM2\b/i,
  /\bsource closure solved\b/i,
] as const;

export type TheoryBadgeLevel = (typeof THEORY_BADGE_LEVELS)[number];
export type TheoryBadgeStatus = (typeof THEORY_BADGE_STATUSES)[number];
export type TheoryBadgeEdgeRelation = (typeof THEORY_BADGE_EDGE_RELATIONS)[number];

export type TheoryBadgeEquationV1 = {
  id: string;
  role:
    | "definition"
    | "law"
    | "constraint"
    | "transform"
    | "residual"
    | "gate"
    | "calculator_demo"
    | "noncomputable_reference";
  displayLatex: string;
  computableExpression?: string | null;
  operatorKind?:
    | "scalar_expression"
    | "field_sample"
    | "tensor_component"
    | "region_aggregate"
    | "worldline_integral"
    | "residual"
    | "gate_status"
    | "noncomputable_reference";
  inputSymbols: string[];
  outputSymbols: string[];
};

export type TheoryBadgeUnitV1 = {
  symbol: string;
  unit?: string | null;
  quantity?: string | null;
  dimensionSignature?: string | null;
};

export type TheoryBadgeSourceRefV1 = {
  kind:
    | "repo_module"
    | "equation_map_node"
    | "visualizer_preset"
    | "test"
    | "doc"
    | "artifact"
    | "literature_ref";
  path?: string | null;
  id?: string | null;
  note?: string | null;
};

export type TheoryBadgeScaleEnvelopeBasisV1 = (typeof THEORY_BADGE_SCALE_ENVELOPE_BASES)[number];

export type TheoryBadgeObservableMathematicalTypeV1 =
  (typeof THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES)[number];
export type TheoryBadgeObservableBridgeKindV1 =
  (typeof THEORY_BADGE_OBSERVABLE_BRIDGE_KINDS)[number];
export type TheoryBadgeObservableErrorKindV1 =
  (typeof THEORY_BADGE_OBSERVABLE_ERROR_KINDS)[number];

/**
 * Stable, source-backed binding from a badge-local quantity to a canonical
 * observable identity. A shared word, symbol, or unit is not such a binding.
 */
export type TheoryBadgeObservableV1 = {
  id: string;
  canonicalObservableId: string;
  symbol: string;
  quantity: string;
  mathematicalType: TheoryBadgeObservableMathematicalTypeV1;
  unit: string | null;
  dimensionSignature: string | null;
  coordinateFrame: string | null;
  operationalDefinitionRef: string;
  responseModelRef: string | null;
};

/**
 * A governed cross-observable transformation stored on a canonical graph edge.
 * Agent-proposed relations cannot create this record during a reasoning turn.
 */
export type TheoryBadgeObservableBridgeV1 = {
  fromObservableId: string;
  toObservableId: string;
  kind: TheoryBadgeObservableBridgeKindV1;
  authority: "registered";
  reversible: boolean;
  assumptions: string[];
  sourceRefs: string[];
  validityDomain: {
    scaleLog10M: { min: number | null; max: number | null } | null;
    coordinateFrames: string[];
    conditions: string[];
  };
  errorContract: {
    kind: TheoryBadgeObservableErrorKindV1;
    expression: string | null;
  };
};

export type TheoryBadgeScaleEnvelopeV1 = {
  characteristicLog10M: number | null;
  minLog10M: number | null;
  maxLog10M: number | null;
  basis: TheoryBadgeScaleEnvelopeBasisV1;
  sourceRefs: TheoryBadgeSourceRefV1[];
};

export type TheoryBadgeCalculatorPayloadV1 = {
  id: string;
  expression: string;
  displayLatex: string;
  preferredAction: "ingest_latex" | "solve_expression" | "solve_with_steps";
  targetVariable?: string | null;
  setupContext?: HelixCalculatorSetupContext | null;
};

export type TheoryBadgeClaimBoundaryV1 = {
  diagnosticOnly: boolean;
  doesValidateNHM2: false;
  validationClaimAllowed: false;
  physicalMechanismClaimAllowed: false;
  promotionAllowed: false;
};

export type TheoryBadgeV1 = {
  id: string;
  title: string;
  plainMeaning: string;
  whyItMatters: string;

  subjects: string[];
  level: TheoryBadgeLevel;
  status: TheoryBadgeStatus;

  simulationOwners: string[];
  equationFamilies: string[];
  tags: string[];

  equations: TheoryBadgeEquationV1[];
  units: TheoryBadgeUnitV1[];
  assumptions: string[];

  calculatorPayloads: TheoryBadgeCalculatorPayloadV1[];
  sourceRefs: TheoryBadgeSourceRefV1[];
  scaleEnvelope?: TheoryBadgeScaleEnvelopeV1 | null;
  observables?: TheoryBadgeObservableV1[];

  hintKeys: {
    subjects: string[];
    symbols: string[];
    unitSignatures: string[];
    repoPaths: string[];
    equationFamilies: string[];
    simulationOwners: string[];
  };

  claimBoundary: TheoryBadgeClaimBoundaryV1;
};

export type TheoryBadgeEdgeV1 = {
  id: string;
  from: string;
  to: string;
  relation: TheoryBadgeEdgeRelation;
  label: string;
  claimBoundaryNote: string;
  observableBridge?: TheoryBadgeObservableBridgeV1 | null;
};

export type TheoryBadgeGraphV1 = {
  artifactId: typeof THEORY_BADGE_GRAPH_ARTIFACT_ID;
  schemaVersion: typeof THEORY_BADGE_GRAPH_SCHEMA_VERSION;
  generatedAt: string;
  graphId: string;
  title: string;
  description: string;
  badges: TheoryBadgeV1[];
  edges: TheoryBadgeEdgeV1[];
  summary: {
    badgeCount: number;
    edgeCount: number;
    subjects: Record<string, number>;
    levels: Record<string, number>;
    statuses: Record<string, number>;
    calculatorLoadableCount: number;
  };
};

type BuildTheoryBadgeGraphV1Input = Omit<
  TheoryBadgeGraphV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "summary"
> & {
  generatedAt?: string;
  summary?: Partial<TheoryBadgeGraphV1["summary"]>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

const includes = <T extends readonly string[]>(items: T, value: unknown): value is T[number] =>
  typeof value === "string" && items.includes(value);

const isFiniteNumberOrNull = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((acc: Record<string, number>, value: string) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildTheoryBadgeGraphV1(input: BuildTheoryBadgeGraphV1Input): TheoryBadgeGraphV1 {
  const summary = {
    badgeCount: input.badges.length,
    edgeCount: input.edges.length,
    subjects: countBy(input.badges.flatMap((badge: TheoryBadgeV1) => badge.subjects)),
    levels: countBy(input.badges.map((badge: TheoryBadgeV1) => badge.level)),
    statuses: countBy(input.badges.map((badge: TheoryBadgeV1) => badge.status)),
    calculatorLoadableCount: input.badges.filter((badge: TheoryBadgeV1) => badge.calculatorPayloads.length > 0).length,
    ...input.summary,
  };

  return {
    artifactId: THEORY_BADGE_GRAPH_ARTIFACT_ID,
    schemaVersion: THEORY_BADGE_GRAPH_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    graphId: input.graphId,
    title: input.title,
    description: input.description,
    badges: input.badges,
    edges: input.edges,
    summary,
  };
}

export function validateTheoryBadgeGraphV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) {
    return ["graph must be an object"];
  }

  if (value.artifactId !== THEORY_BADGE_GRAPH_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_BADGE_GRAPH_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_BADGE_GRAPH_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_BADGE_GRAPH_SCHEMA_VERSION}`);
  }
  if (!isNonEmptyString(value.generatedAt)) issues.push("generatedAt must be a non-empty string");
  if (!isNonEmptyString(value.graphId)) issues.push("graphId must be a non-empty string");
  if (!isNonEmptyString(value.title)) issues.push("title must be a non-empty string");
  if (!isNonEmptyString(value.description)) issues.push("description must be a non-empty string");
  if (!Array.isArray(value.badges) || value.badges.length === 0) issues.push("badges must be a non-empty array");
  if (!Array.isArray(value.edges)) issues.push("edges must be an array");

  const badges: unknown[] = Array.isArray(value.badges) ? value.badges : [];
  const edges: unknown[] = Array.isArray(value.edges) ? value.edges : [];
  const badgeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const observablesByBadgeId = new Map<string, TheoryBadgeObservableV1[]>();
  const sourceRefIdsByBadgeId = new Map<string, Set<string>>();

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
    if (!Array.isArray(rawBadge.subjects) || rawBadge.subjects.length === 0) {
      issues.push(`${prefix}.subjects must be a non-empty array`);
    } else if (!isStringArray(rawBadge.subjects)) {
      issues.push(`${prefix}.subjects must contain only strings`);
    }
    if (!includes(THEORY_BADGE_LEVELS, rawBadge.level)) issues.push(`${prefix}.level is invalid`);
    if (!includes(THEORY_BADGE_STATUSES, rawBadge.status)) issues.push(`${prefix}.status is invalid`);
    for (const field of ["simulationOwners", "equationFamilies", "tags", "assumptions"] as const) {
      if (!isStringArray(rawBadge[field])) issues.push(`${prefix}.${field} must be an array of strings`);
    }

    const equations = Array.isArray(rawBadge.equations) ? rawBadge.equations : [];
    if (!Array.isArray(rawBadge.equations)) issues.push(`${prefix}.equations must be an array`);
    for (const [equationIndex, rawEquation] of equations.entries()) {
      const equationPrefix = `${prefix}.equations[${equationIndex}]`;
      if (!isRecord(rawEquation)) {
        issues.push(`${equationPrefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(rawEquation.id)) issues.push(`${equationPrefix}.id must be a non-empty string`);
      if (!includes(THEORY_BADGE_EQUATION_ROLES, rawEquation.role)) issues.push(`${equationPrefix}.role is invalid`);
      if (!isNonEmptyString(rawEquation.displayLatex)) {
        issues.push(`${equationPrefix}.displayLatex must be a non-empty string`);
      }
      if (rawEquation.operatorKind != null && !includes(THEORY_BADGE_OPERATOR_KINDS, rawEquation.operatorKind)) {
        issues.push(`${equationPrefix}.operatorKind is invalid`);
      }
      if (!isStringArray(rawEquation.inputSymbols)) issues.push(`${equationPrefix}.inputSymbols must be strings`);
      if (!isStringArray(rawEquation.outputSymbols)) issues.push(`${equationPrefix}.outputSymbols must be strings`);
    }

    if (!Array.isArray(rawBadge.units)) issues.push(`${prefix}.units must be an array`);
    for (const [unitIndex, rawUnit] of (Array.isArray(rawBadge.units) ? rawBadge.units : []).entries()) {
      const unitPrefix = `${prefix}.units[${unitIndex}]`;
      if (!isRecord(rawUnit)) {
        issues.push(`${unitPrefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(rawUnit.symbol)) issues.push(`${unitPrefix}.symbol must be a non-empty string`);
    }

    const calculatorPayloads = Array.isArray(rawBadge.calculatorPayloads) ? rawBadge.calculatorPayloads : [];
    if (!Array.isArray(rawBadge.calculatorPayloads)) issues.push(`${prefix}.calculatorPayloads must be an array`);
    for (const [payloadIndex, rawPayload] of calculatorPayloads.entries()) {
      const payloadPrefix = `${prefix}.calculatorPayloads[${payloadIndex}]`;
      if (!isRecord(rawPayload)) {
        issues.push(`${payloadPrefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(rawPayload.id)) issues.push(`${payloadPrefix}.id must be a non-empty string`);
      if (!isNonEmptyString(rawPayload.expression)) issues.push(`${payloadPrefix}.expression must be a non-empty string`);
      if (!isNonEmptyString(rawPayload.displayLatex)) issues.push(`${payloadPrefix}.displayLatex must be a non-empty string`);
      if (!includes(THEORY_BADGE_CALCULATOR_ACTIONS, rawPayload.preferredAction)) {
        issues.push(`${payloadPrefix}.preferredAction is invalid`);
      }
    }

    const validateSourceRefs = (sourceRefs: unknown, sourcePrefixBase: string): void => {
      if (!Array.isArray(sourceRefs)) {
        issues.push(`${sourcePrefixBase} must be an array`);
        return;
      }
      for (const [sourceIndex, rawSource] of sourceRefs.entries()) {
        const sourcePrefix = `${sourcePrefixBase}[${sourceIndex}]`;
        if (!isRecord(rawSource)) {
          issues.push(`${sourcePrefix} must be an object`);
          continue;
        }
        if (!includes(THEORY_BADGE_SOURCE_KINDS, rawSource.kind)) issues.push(`${sourcePrefix}.kind is invalid`);
      }
    };

    validateSourceRefs(rawBadge.sourceRefs, `${prefix}.sourceRefs`);

    const rawObservables = rawBadge.observables;
    if (rawObservables !== undefined && !Array.isArray(rawObservables)) {
      issues.push(`${prefix}.observables must be an array when present`);
    }
    const observableIds = new Set<string>();
    const typedObservables: TheoryBadgeObservableV1[] = [];
    const badgeSourceRefIds = new Set(
      (Array.isArray(rawBadge.sourceRefs) ? rawBadge.sourceRefs : [])
        .filter(isRecord)
        .flatMap((ref) => [ref.path, ref.id])
        .filter(isNonEmptyString),
    );
    if (isNonEmptyString(badgeId)) sourceRefIdsByBadgeId.set(badgeId, badgeSourceRefIds);
    for (const [observableIndex, rawObservable] of (
      Array.isArray(rawObservables) ? rawObservables : []
    ).entries()) {
      const observablePrefix = `${prefix}.observables[${observableIndex}]`;
      if (!isRecord(rawObservable)) {
        issues.push(`${observablePrefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(rawObservable.id)) {
        issues.push(`${observablePrefix}.id must be a non-empty string`);
      } else if (observableIds.has(rawObservable.id)) {
        issues.push(`${observablePrefix}.id must be unique within the badge`);
      } else {
        observableIds.add(rawObservable.id);
      }
      for (const field of [
        "canonicalObservableId",
        "symbol",
        "quantity",
        "operationalDefinitionRef",
      ] as const) {
        if (!isNonEmptyString(rawObservable[field])) {
          issues.push(`${observablePrefix}.${field} must be a non-empty string`);
        }
      }
      if (!includes(THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES, rawObservable.mathematicalType)) {
        issues.push(`${observablePrefix}.mathematicalType is invalid`);
      }
      for (const field of ["unit", "dimensionSignature", "coordinateFrame", "responseModelRef"] as const) {
        if (rawObservable[field] !== null && typeof rawObservable[field] !== "string") {
          issues.push(`${observablePrefix}.${field} must be a string or null`);
        }
      }
      if (
        isNonEmptyString(rawObservable.operationalDefinitionRef) &&
        !badgeSourceRefIds.has(rawObservable.operationalDefinitionRef)
      ) {
        issues.push(`${observablePrefix}.operationalDefinitionRef must identify a badge sourceRef`);
      }
      if (
        isNonEmptyString(rawObservable.responseModelRef) &&
        !badgeSourceRefIds.has(rawObservable.responseModelRef)
      ) {
        issues.push(`${observablePrefix}.responseModelRef must identify a badge sourceRef`);
      }
      if (
        isNonEmptyString(rawObservable.id) &&
        isNonEmptyString(rawObservable.canonicalObservableId) &&
        isNonEmptyString(rawObservable.symbol) &&
        isNonEmptyString(rawObservable.quantity) &&
        includes(THEORY_BADGE_OBSERVABLE_MATHEMATICAL_TYPES, rawObservable.mathematicalType)
      ) {
        typedObservables.push(rawObservable as TheoryBadgeObservableV1);
      }
    }
    if (isNonEmptyString(badgeId)) observablesByBadgeId.set(badgeId, typedObservables);

    if (rawBadge.scaleEnvelope != null) {
      const envelopePrefix = `${prefix}.scaleEnvelope`;
      if (!isRecord(rawBadge.scaleEnvelope)) {
        issues.push(`${envelopePrefix} must be an object`);
      } else {
        const envelope = rawBadge.scaleEnvelope;
        if (!isFiniteNumberOrNull(envelope.characteristicLog10M)) {
          issues.push(`${envelopePrefix}.characteristicLog10M must be a finite number or null`);
        }
        if (!isFiniteNumberOrNull(envelope.minLog10M)) {
          issues.push(`${envelopePrefix}.minLog10M must be a finite number or null`);
        }
        if (!isFiniteNumberOrNull(envelope.maxLog10M)) {
          issues.push(`${envelopePrefix}.maxLog10M must be a finite number or null`);
        }
        if (!includes(THEORY_BADGE_SCALE_ENVELOPE_BASES, envelope.basis)) {
          issues.push(`${envelopePrefix}.basis is invalid`);
        }
        validateSourceRefs(envelope.sourceRefs, `${envelopePrefix}.sourceRefs`);
        if (
          typeof envelope.minLog10M === "number" &&
          typeof envelope.maxLog10M === "number" &&
          envelope.minLog10M > envelope.maxLog10M
        ) {
          issues.push(`${envelopePrefix}.minLog10M must be <= maxLog10M`);
        }
        if (
          typeof envelope.characteristicLog10M === "number" &&
          typeof envelope.minLog10M === "number" &&
          envelope.characteristicLog10M < envelope.minLog10M
        ) {
          issues.push(`${envelopePrefix}.characteristicLog10M must be >= minLog10M`);
        }
        if (
          typeof envelope.characteristicLog10M === "number" &&
          typeof envelope.maxLog10M === "number" &&
          envelope.characteristicLog10M > envelope.maxLog10M
        ) {
          issues.push(`${envelopePrefix}.characteristicLog10M must be <= maxLog10M`);
        }
      }
    }

    if (!isRecord(rawBadge.hintKeys)) {
      issues.push(`${prefix}.hintKeys must be an object`);
    } else {
      for (const field of [
        "subjects",
        "symbols",
        "unitSignatures",
        "repoPaths",
        "equationFamilies",
        "simulationOwners",
      ] as const) {
        if (!isStringArray(rawBadge.hintKeys[field])) {
          issues.push(`${prefix}.hintKeys.${field} must be an array of strings`);
        }
      }
    }

    if (!isRecord(rawBadge.claimBoundary)) {
      issues.push(`${prefix}.claimBoundary must be an object`);
    } else {
      const boundary = rawBadge.claimBoundary;
      if (typeof boundary.diagnosticOnly !== "boolean") issues.push(`${prefix}.claimBoundary.diagnosticOnly must be boolean`);
      if (boundary.doesValidateNHM2 !== false) issues.push(`${prefix}.claimBoundary.doesValidateNHM2 must be false`);
      if (boundary.validationClaimAllowed !== false) issues.push(`${prefix}.claimBoundary.validationClaimAllowed must be false`);
      if (boundary.physicalMechanismClaimAllowed !== false) {
        issues.push(`${prefix}.claimBoundary.physicalMechanismClaimAllowed must be false`);
      }
      if (boundary.promotionAllowed !== false) issues.push(`${prefix}.claimBoundary.promotionAllowed must be false`);

      const owners = isStringArray(rawBadge.simulationOwners) ? rawBadge.simulationOwners : [];
      const isNhm2Badge =
        typeof badgeId === "string" &&
        (badgeId.startsWith("nhm2.") ||
          owners.some((owner: string) => /\bNHM2\b|needle-hull-mark2/i.test(owner)));
      if (isNhm2Badge && boundary.diagnosticOnly !== true) {
        issues.push(`${prefix}.claimBoundary.diagnosticOnly must be true for NHM2 badges`);
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
    if (rawEdge.relation === "validates") {
      issues.push(`${prefix}.relation must not use forbidden validates relation`);
    } else if (!includes(THEORY_BADGE_EDGE_RELATIONS, rawEdge.relation)) {
      issues.push(`${prefix}.relation is invalid`);
    }
    if (!isNonEmptyString(rawEdge.label)) issues.push(`${prefix}.label must be a non-empty string`);
    if (!isNonEmptyString(rawEdge.claimBoundaryNote)) {
      issues.push(`${prefix}.claimBoundaryNote must be a non-empty string`);
    }
    if (rawEdge.observableBridge != null) {
      const bridgePrefix = `${prefix}.observableBridge`;
      if (!isRecord(rawEdge.observableBridge)) {
        issues.push(`${bridgePrefix} must be an object or null`);
      } else {
        const bridge = rawEdge.observableBridge;
        for (const field of ["fromObservableId", "toObservableId"] as const) {
          if (!isNonEmptyString(bridge[field])) issues.push(`${bridgePrefix}.${field} must be a non-empty string`);
        }
        if (!includes(THEORY_BADGE_OBSERVABLE_BRIDGE_KINDS, bridge.kind)) {
          issues.push(`${bridgePrefix}.kind is invalid`);
        }
        if (bridge.authority !== "registered") issues.push(`${bridgePrefix}.authority must be registered`);
        if (typeof bridge.reversible !== "boolean") issues.push(`${bridgePrefix}.reversible must be boolean`);
        if (!isStringArray(bridge.assumptions)) issues.push(`${bridgePrefix}.assumptions must be strings`);
        if (!isStringArray(bridge.sourceRefs) || bridge.sourceRefs.length === 0) {
          issues.push(`${bridgePrefix}.sourceRefs must be a non-empty string array`);
        } else {
          const admittedSourceRefs = new Set([
            ...(isNonEmptyString(rawEdge.from) ? sourceRefIdsByBadgeId.get(rawEdge.from) ?? [] : []),
            ...(isNonEmptyString(rawEdge.to) ? sourceRefIdsByBadgeId.get(rawEdge.to) ?? [] : []),
          ]);
          for (const sourceRef of bridge.sourceRefs) {
            if (!admittedSourceRefs.has(sourceRef)) {
              issues.push(`${bridgePrefix}.sourceRefs must identify a sourceRef on an endpoint badge`);
              break;
            }
          }
        }
        const fromObservables = isNonEmptyString(rawEdge.from)
          ? observablesByBadgeId.get(rawEdge.from) ?? []
          : [];
        const toObservables = isNonEmptyString(rawEdge.to)
          ? observablesByBadgeId.get(rawEdge.to) ?? []
          : [];
        const fromObservable = fromObservables.find(
          (observable) => observable.canonicalObservableId === bridge.fromObservableId,
        );
        const toObservable = toObservables.find(
          (observable) => observable.canonicalObservableId === bridge.toObservableId,
        );
        if (!fromObservable) {
          issues.push(`${bridgePrefix}.fromObservableId must be registered on the from badge`);
        }
        if (!toObservable) {
          issues.push(`${bridgePrefix}.toObservableId must be registered on the to badge`);
        }
        if (bridge.kind === "identity" && bridge.fromObservableId !== bridge.toObservableId) {
          issues.push(`${bridgePrefix}.identity bridge requires the same canonical observable id`);
        }
        if (
          (bridge.kind === "identity" || bridge.kind === "unit_conversion" || bridge.kind === "coordinate_transform") &&
          fromObservable?.dimensionSignature &&
          toObservable?.dimensionSignature &&
          fromObservable.dimensionSignature !== toObservable.dimensionSignature
        ) {
          issues.push(`${bridgePrefix}.${String(bridge.kind)} requires matching dimensions`);
        }
        if (!isRecord(bridge.validityDomain)) {
          issues.push(`${bridgePrefix}.validityDomain must be an object`);
        } else {
          if (!isStringArray(bridge.validityDomain.coordinateFrames)) {
            issues.push(`${bridgePrefix}.validityDomain.coordinateFrames must be strings`);
          }
          if (!isStringArray(bridge.validityDomain.conditions)) {
            issues.push(`${bridgePrefix}.validityDomain.conditions must be strings`);
          }
          const scale = bridge.validityDomain.scaleLog10M;
          if (scale !== null) {
            if (!isRecord(scale)) {
              issues.push(`${bridgePrefix}.validityDomain.scaleLog10M must be an object or null`);
            } else {
              if (!isFiniteNumberOrNull(scale.min)) {
                issues.push(`${bridgePrefix}.validityDomain.scaleLog10M.min must be finite or null`);
              }
              if (!isFiniteNumberOrNull(scale.max)) {
                issues.push(`${bridgePrefix}.validityDomain.scaleLog10M.max must be finite or null`);
              }
              if (typeof scale.min === "number" && typeof scale.max === "number" && scale.min > scale.max) {
                issues.push(`${bridgePrefix}.validityDomain.scaleLog10M.min must be <= max`);
              }
            }
          }
        }
        if (!isRecord(bridge.errorContract)) {
          issues.push(`${bridgePrefix}.errorContract must be an object`);
        } else {
          if (!includes(THEORY_BADGE_OBSERVABLE_ERROR_KINDS, bridge.errorContract.kind)) {
            issues.push(`${bridgePrefix}.errorContract.kind is invalid`);
          }
          if (bridge.errorContract.expression !== null && typeof bridge.errorContract.expression !== "string") {
            issues.push(`${bridgePrefix}.errorContract.expression must be a string or null`);
          }
          if (
            ["coarse_graining", "approximation", "calibrated_response"].includes(String(bridge.kind)) &&
            (bridge.errorContract.kind === "exact" || !isNonEmptyString(bridge.errorContract.expression))
          ) {
            issues.push(`${bridgePrefix}.${String(bridge.kind)} requires a bounded/statistical error expression`);
          }
        }
      }
    }
  }

  const serialized = JSON.stringify(value);
  for (const pattern of FORBIDDEN_THEORY_CLAIM_PATTERNS) {
    if (pattern.test(serialized)) {
      issues.push(`forbidden validation claim phrase matched: ${pattern.source}`);
    }
  }

  return issues;
}

export function isTheoryBadgeGraphV1(value: unknown): value is TheoryBadgeGraphV1 {
  return validateTheoryBadgeGraphV1(value).length === 0;
}
