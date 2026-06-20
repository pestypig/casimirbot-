import type {
  TheoryBadgeEdgeRelation,
  TheoryBadgeScaleEnvelopeBasisV1,
  TheoryBadgeSourceRefV1,
} from "./theory-badge-graph.v1";

export const THEORY_FRONTIER_VECTOR_FIELD_ARTIFACT_ID = "theory_frontier_vector_field" as const;
export const THEORY_FRONTIER_VECTOR_FIELD_SCHEMA_VERSION = "theory_frontier_vector_field/v1" as const;
export const THEORY_BADGE_COORDINATE_BASIS_VERSION = "theory_badge_coordinate_basis/v1" as const;

export const THEORY_FRONTIER_VECTOR_METHOD_ANCHORS_V1 = [
  {
    id: "shannon_entropy",
    label: "Shannon information entropy",
    url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
    claim: "Method precedent for entropy as information uncertainty, not truth probability.",
  },
  {
    id: "nist_uncertainty",
    label: "NIST measurement uncertainty guidance",
    url: "https://emtoolbox.nist.gov/publications/nisttechnicalnote1297s.pdf",
    claim: "Method precedent for separating uncertainty components by model role.",
  },
  {
    id: "mit_tensor_gr",
    label: "MIT tensor calculus for GR",
    url: "https://web.mit.edu/edbert/GR/gr1.pdf",
    claim: "Method precedent for tensors as coordinate-basis transformation objects.",
  },
  {
    id: "gourgoulhon_3p1",
    label: "3+1 formalism and numerical relativity",
    url: "https://people-lux.obspm.fr/gourgoulhon/pdf/form3p1.pdf",
    claim: "Method precedent for separating coordinate basis, constraints, and evolution-like updates.",
  },
  {
    id: "rasmussen_williams_gp",
    label: "Gaussian processes and covariance functions",
    url: "https://gaussianprocess.org/gpml/chapters/RW.pdf",
    claim: "Method precedent for covariance as an uncertainty structure over fields.",
  },
  {
    id: "perlin_image_synthesizer",
    label: "Perlin procedural noise",
    url: "https://dl.acm.org/doi/10.1145/325165.325247",
    claim: "Method precedent for seeded procedural fields.",
  },
  {
    id: "cubiomes",
    label: "Cubiomes deterministic seed finding",
    url: "https://github.com/Cubitect/cubiomes",
    claim: "Method precedent for deterministic staged seed search and replay.",
  },
  {
    id: "minecraft_caves_cliffs_ii",
    label: "Minecraft Caves & Cliffs II",
    url: "https://www.minecraft.net/en-us/article/caves---cliffs-part-ii-the-features",
    claim: "Method precedent for multi-resolution terrain and biome distribution.",
  },
  {
    id: "red_blob_terrain_noise",
    label: "Red Blob terrain noise",
    url: "https://www.redblobgames.com/maps/terrain-from-noise/",
    claim: "Method precedent for independent procedural fields defining region classes.",
  },
] as const;

export type TheoryFrontierVectorMethodAnchorV1 = (typeof THEORY_FRONTIER_VECTOR_METHOD_ANCHORS_V1)[number];

export type TheoryBadgeCoordinateVectorV1 = {
  badgeId: string;
  basisVersion: string;
  scaleEnvelopeLog10M: {
    characteristic: number | null;
    min: number | null;
    max: number | null;
    basis: TheoryBadgeScaleEnvelopeBasisV1;
  };
  unitDimensionSignatures: string[];
  equationFamilyCoordinates: string[];
  domainCoordinates: string[];
  fidelityCoordinate: string;
  claimPressureCoordinate: number;
  evidenceDensityCoordinate: number;
  firstPrinciplesDepthCoordinate: number;
  coordinateProvenance: string[];
  uncertaintyBudget: string[];
  entropyContributionBits: number;
  sourceReferences: TheoryBadgeSourceRefV1[];
};

export type TheoryFrontierVectorDeltaV1 = {
  scaleGapLog10M: number | null;
  scaleOverlapLog10M: number | null;
  dimensionalDistance: number;
  equationFamilyDistance: number;
  domainDistance: number;
  fidelityMismatch: number;
  claimPressureIncrease: number;
  evidenceDensityDelta: number;
  firstPrinciplesDepthDelta: number;
};

export type TheoryBadgeRelationTensorV1 = {
  tensorId: string;
  fromBadgeId: string;
  toBadgeId: string;
  relation: TheoryBadgeEdgeRelation | "candidate_frontier";
  sourceBasisVersion: string;
  targetBasisVersion: string;
  transformKind:
    | "identity"
    | "projection"
    | "dimensional_map"
    | "jacobian"
    | "covariance_transfer"
    | "candidate_delta";
  axes: [
    "scale_log10_m",
    "unit_dimension_signature",
    "equation_family",
    "domain",
    "fidelity",
    "claim_pressure",
    "evidence_density",
    "first_principles_depth",
  ];
  matrix: number[][];
  vectorDelta: TheoryFrontierVectorDeltaV1;
  dimensionalChecks: string[];
  equationVariableMap: Array<{
    fromSymbol: string;
    toSymbol: string;
    status: "shared" | "mapped" | "missing";
  }>;
  uncertaintyPropagation: {
    inputEntropyBits: number;
    outputEntropyBits: number;
    entropyDeltaBits: number;
    covarianceDiagonal: number[];
    interpretation: "placement_uncertainty_not_truth_probability";
  };
  typedEdgeSemantics: Array<TheoryBadgeEdgeRelation | "candidate_frontier">;
  falsifierRequirements: string[];
  evidenceRequirements: string[];
  evidenceRefs: string[];
  claimBoundary: {
    validatesTheory: false;
    solvesPhysicalMechanism: false;
    promotionAllowed: false;
  };
};

export type TheoryFrontierVectorCandidateTraceV1 = {
  candidateId: string;
  badgeIds: string[];
  vectorDelta: TheoryFrontierVectorDeltaV1;
  relationTensorIds: string[];
  entropyContributors: string[];
  evidenceGaps: string[];
  exactVerificationRequirements: string[];
  uncertaintyReductionPotential: number;
  expectedEvidenceClosureCost: number;
  verifiedFrontierYieldPerBudget: number;
};

export type TheoryFrontierVectorFieldTraceV1 = {
  artifactId: typeof THEORY_FRONTIER_VECTOR_FIELD_ARTIFACT_ID;
  schemaVersion: typeof THEORY_FRONTIER_VECTOR_FIELD_SCHEMA_VERSION;
  generatedAt: string;
  traceId: string;
  graphId: string;
  graphHash: string;
  query: string;
  searchSeed: string;
  basisVersion: string;
  scoringVersion: string;
  taxonomyVersion: string;
  vectors: TheoryBadgeCoordinateVectorV1[];
  relationTensors: TheoryBadgeRelationTensorV1[];
  candidateTraces: TheoryFrontierVectorCandidateTraceV1[];
  replay: {
    graphHash: string;
    query: string;
    searchSeed: string;
    basisVersion: string;
    scoringVersion: string;
    taxonomyVersion: string;
    evidenceReferenceIds: string[];
  };
  methodAnchors: readonly TheoryFrontierVectorMethodAnchorV1[];
  interpretation: {
    renderProjectionOnlyForXY: true;
    entropyIsPlacementAndBoundaryUncertaintyOnly: true;
    tensorsAreRelationTransformsOnly: true;
    noTheoryValidation: true;
    noAutomaticEdgePromotion: true;
  };
};

export type BuildTheoryFrontierVectorFieldTraceV1Input = Omit<
  TheoryFrontierVectorFieldTraceV1,
  "artifactId" | "schemaVersion" | "generatedAt" | "methodAnchors" | "interpretation"
> & {
  generatedAt?: string;
  methodAnchors?: readonly TheoryFrontierVectorMethodAnchorV1[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNumberOrNull = (value: unknown): value is number | null =>
  value === null || isFiniteNumber(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item: unknown) => typeof item === "string");

function validateUnitInterval(prefix: string, value: unknown, issues: string[]): void {
  if (!isFiniteNumber(value)) {
    issues.push(`${prefix} must be a finite number`);
  } else if (value < 0 || value > 1) {
    issues.push(`${prefix} must be between 0 and 1`);
  }
}

function validateVectorDelta(prefix: string, value: unknown, issues: string[]): void {
  if (!isRecord(value)) {
    issues.push(`${prefix} must be an object`);
    return;
  }
  for (const field of ["scaleGapLog10M", "scaleOverlapLog10M"] as const) {
    if (!isNumberOrNull(value[field])) issues.push(`${prefix}.${field} must be a finite number or null`);
  }
  for (
    const field of [
      "dimensionalDistance",
      "equationFamilyDistance",
      "domainDistance",
      "fidelityMismatch",
      "claimPressureIncrease",
      "evidenceDensityDelta",
      "firstPrinciplesDepthDelta",
    ] as const
  ) {
    if (!isFiniteNumber(value[field])) issues.push(`${prefix}.${field} must be a finite number`);
  }
}

export function buildTheoryFrontierVectorFieldTraceV1(
  input: BuildTheoryFrontierVectorFieldTraceV1Input,
): TheoryFrontierVectorFieldTraceV1 {
  return {
    artifactId: THEORY_FRONTIER_VECTOR_FIELD_ARTIFACT_ID,
    schemaVersion: THEORY_FRONTIER_VECTOR_FIELD_SCHEMA_VERSION,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    ...input,
    methodAnchors: input.methodAnchors ?? THEORY_FRONTIER_VECTOR_METHOD_ANCHORS_V1,
    interpretation: {
      renderProjectionOnlyForXY: true,
      entropyIsPlacementAndBoundaryUncertaintyOnly: true,
      tensorsAreRelationTransformsOnly: true,
      noTheoryValidation: true,
      noAutomaticEdgePromotion: true,
    },
  };
}

export function validateTheoryFrontierVectorFieldTraceV1(value: unknown): string[] {
  const issues: string[] = [];
  if (!isRecord(value)) return ["vector field trace must be an object"];

  if (value.artifactId !== THEORY_FRONTIER_VECTOR_FIELD_ARTIFACT_ID) {
    issues.push(`artifactId must be ${THEORY_FRONTIER_VECTOR_FIELD_ARTIFACT_ID}`);
  }
  if (value.schemaVersion !== THEORY_FRONTIER_VECTOR_FIELD_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be ${THEORY_FRONTIER_VECTOR_FIELD_SCHEMA_VERSION}`);
  }
  for (
    const field of ["generatedAt", "traceId", "graphId", "graphHash", "query", "searchSeed", "basisVersion", "scoringVersion", "taxonomyVersion"] as const
  ) {
    if (!isNonEmptyString(value[field])) issues.push(`${field} must be a non-empty string`);
  }

  if (!Array.isArray(value.vectors) || value.vectors.length === 0) {
    issues.push("vectors must be a non-empty array");
  } else {
    for (const [index, vector] of value.vectors.entries()) {
      const prefix = `vectors[${index}]`;
      if (!isRecord(vector)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(vector.badgeId)) issues.push(`${prefix}.badgeId must be a non-empty string`);
      if (!isNonEmptyString(vector.basisVersion)) issues.push(`${prefix}.basisVersion must be a non-empty string`);
      if (!isRecord(vector.scaleEnvelopeLog10M)) {
        issues.push(`${prefix}.scaleEnvelopeLog10M must be an object`);
      } else {
        for (const field of ["characteristic", "min", "max"] as const) {
          if (!isNumberOrNull(vector.scaleEnvelopeLog10M[field])) {
            issues.push(`${prefix}.scaleEnvelopeLog10M.${field} must be a finite number or null`);
          }
        }
        if (!isNonEmptyString(vector.scaleEnvelopeLog10M.basis)) {
          issues.push(`${prefix}.scaleEnvelopeLog10M.basis must be a non-empty string`);
        }
      }
      for (const field of ["unitDimensionSignatures", "equationFamilyCoordinates", "domainCoordinates", "coordinateProvenance", "uncertaintyBudget"] as const) {
        if (!isStringArray(vector[field])) issues.push(`${prefix}.${field} must be an array of strings`);
      }
      if (!isNonEmptyString(vector.fidelityCoordinate)) issues.push(`${prefix}.fidelityCoordinate must be a non-empty string`);
      validateUnitInterval(`${prefix}.claimPressureCoordinate`, vector.claimPressureCoordinate, issues);
      validateUnitInterval(`${prefix}.evidenceDensityCoordinate`, vector.evidenceDensityCoordinate, issues);
      if (!isFiniteNumber(vector.firstPrinciplesDepthCoordinate)) {
        issues.push(`${prefix}.firstPrinciplesDepthCoordinate must be a finite number`);
      }
      if (!isFiniteNumber(vector.entropyContributionBits) || vector.entropyContributionBits < 0) {
        issues.push(`${prefix}.entropyContributionBits must be a non-negative finite number`);
      }
      if (!Array.isArray(vector.sourceReferences)) issues.push(`${prefix}.sourceReferences must be an array`);
    }
  }

  if (!Array.isArray(value.relationTensors)) {
    issues.push("relationTensors must be an array");
  } else {
    for (const [index, tensor] of value.relationTensors.entries()) {
      const prefix = `relationTensors[${index}]`;
      if (!isRecord(tensor)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      for (const field of ["tensorId", "fromBadgeId", "toBadgeId", "relation", "sourceBasisVersion", "targetBasisVersion", "transformKind"] as const) {
        if (!isNonEmptyString(tensor[field])) issues.push(`${prefix}.${field} must be a non-empty string`);
      }
      if (!Array.isArray(tensor.matrix)) issues.push(`${prefix}.matrix must be an array`);
      validateVectorDelta(`${prefix}.vectorDelta`, tensor.vectorDelta, issues);
      if (!isRecord(tensor.uncertaintyPropagation)) {
        issues.push(`${prefix}.uncertaintyPropagation must be an object`);
      } else if (tensor.uncertaintyPropagation.interpretation !== "placement_uncertainty_not_truth_probability") {
        issues.push(`${prefix}.uncertaintyPropagation.interpretation is invalid`);
      }
      if (!isRecord(tensor.claimBoundary)) {
        issues.push(`${prefix}.claimBoundary must be an object`);
      } else {
        if (tensor.claimBoundary.validatesTheory !== false) issues.push(`${prefix}.claimBoundary.validatesTheory must be false`);
        if (tensor.claimBoundary.solvesPhysicalMechanism !== false) {
          issues.push(`${prefix}.claimBoundary.solvesPhysicalMechanism must be false`);
        }
        if (tensor.claimBoundary.promotionAllowed !== false) issues.push(`${prefix}.claimBoundary.promotionAllowed must be false`);
      }
    }
  }

  if (!Array.isArray(value.candidateTraces)) {
    issues.push("candidateTraces must be an array");
  } else {
    for (const [index, trace] of value.candidateTraces.entries()) {
      const prefix = `candidateTraces[${index}]`;
      if (!isRecord(trace)) {
        issues.push(`${prefix} must be an object`);
        continue;
      }
      if (!isNonEmptyString(trace.candidateId)) issues.push(`${prefix}.candidateId must be a non-empty string`);
      if (!isStringArray(trace.badgeIds) || trace.badgeIds.length === 0) {
        issues.push(`${prefix}.badgeIds must be a non-empty array of strings`);
      }
      validateVectorDelta(`${prefix}.vectorDelta`, trace.vectorDelta, issues);
      for (const field of ["relationTensorIds", "entropyContributors", "evidenceGaps", "exactVerificationRequirements"] as const) {
        if (!isStringArray(trace[field])) issues.push(`${prefix}.${field} must be an array of strings`);
      }
      validateUnitInterval(`${prefix}.uncertaintyReductionPotential`, trace.uncertaintyReductionPotential, issues);
      if (!isFiniteNumber(trace.expectedEvidenceClosureCost) || trace.expectedEvidenceClosureCost < 0) {
        issues.push(`${prefix}.expectedEvidenceClosureCost must be a non-negative finite number`);
      }
      if (!isFiniteNumber(trace.verifiedFrontierYieldPerBudget)) {
        issues.push(`${prefix}.verifiedFrontierYieldPerBudget must be a finite number`);
      }
    }
  }

  if (!isRecord(value.replay)) {
    issues.push("replay must be an object");
  } else {
    for (const field of ["graphHash", "query", "searchSeed", "basisVersion", "scoringVersion", "taxonomyVersion"] as const) {
      if (!isNonEmptyString(value.replay[field])) issues.push(`replay.${field} must be a non-empty string`);
    }
    if (!isStringArray(value.replay.evidenceReferenceIds)) {
      issues.push("replay.evidenceReferenceIds must be an array of strings");
    }
  }

  if (!Array.isArray(value.methodAnchors) || value.methodAnchors.length !== THEORY_FRONTIER_VECTOR_METHOD_ANCHORS_V1.length) {
    issues.push("methodAnchors must contain the required vector-field methodology anchors");
  }

  if (!isRecord(value.interpretation)) {
    issues.push("interpretation must be an object");
  } else {
    for (
      const field of [
        "renderProjectionOnlyForXY",
        "entropyIsPlacementAndBoundaryUncertaintyOnly",
        "tensorsAreRelationTransformsOnly",
        "noTheoryValidation",
        "noAutomaticEdgePromotion",
      ] as const
    ) {
      if (value.interpretation[field] !== true) issues.push(`interpretation.${field} must be true`);
    }
  }

  return issues;
}

export function isTheoryFrontierVectorFieldTraceV1(
  value: unknown,
): value is TheoryFrontierVectorFieldTraceV1 {
  return validateTheoryFrontierVectorFieldTraceV1(value).length === 0;
}
