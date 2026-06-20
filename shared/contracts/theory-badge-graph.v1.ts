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
