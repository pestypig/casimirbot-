import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
  NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS,
} from "./nhm2-semiclassical-v2-raw-replay-manifest.v1";
import {
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS,
} from "./nhm2-semiclassical-v2-science-derivation-authority.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256,
} from "./nhm2-spherical-boson-star-coherent-candidate-plan.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS,
  NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256,
} from "./nhm2-spherical-boson-star-v2-candidate-freeze.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256,
} from "./nhm2-spherical-boson-star-v2-classical-structure-functions.v1";

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_ARTIFACT_ID =
  "nhm2.semiclassical_v2.constraint_formulation" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CONTRACT_VERSION =
  "nhm2_semiclassical_v2_constraint_formulation/v1" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_INPUT_ID =
  "constraint_formulation" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_PHASE =
  "stage_2_preexecution_candidate_specific_total_constraint_semantics" as const;

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING_PINS =
  Object.freeze({
    sourceCandidateSha256:
      "9aecb482ee5e78c61b202966c44a25139262f139cb06654094e7e36956e4876d",
    sourceCandidateCanonicalSizeBytes: 93_214,
    v2CandidateFreezeSha256:
      "628092507b7dc1be76722f06a7b591efc59d1799bed0d4b7d1999d852d92f28f",
    v2CandidateFreezeCanonicalSizeBytes: 55_997,
    classicalStructureFunctionsSha256:
      "d6f12f0703f5b756c8c08c424f3af8c06990b59005f404691b5b20f6e71ce700",
    classicalStructureFunctionsCanonicalSizeBytes: 8_870,
    scienceDerivationDagSha256:
      "c0a656b833f380239bed1d3aac321b7a2361fa6b0bf2026355a0dcc4d0d32ce7",
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_AUTHORITY_LOCKS =
  Object.freeze({
    implementationPresent: false,
    probeManifestPresent: false,
    effectiveActionMaterialized: false,
    executionAuthorized: false,
    executionObserved: false,
    arraysPresent: false,
    replayAuthority: false,
    independentAgreement: false,
    diagnosticPass: false,
    theoryGraphPromotion: false,
    physicalViability: false,
    propulsion: false,
    transport: false,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 16_384,
    maximumArrayLength: 4_096,
    maximumObjectPropertyCount: 256,
    maximumPropertyKeyUtf8Bytes: 4_096,
    maximumStringUtf8Bytes: 32_768,
    maximumAggregateUtf8Bytes: 524_288,
  } as const);

const SOURCE = NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN;
const FREEZE = NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE;
const INPUT_INTERFACE =
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_SEMANTIC_INPUT_CONTRACTS.find(
    ({ inputId }) =>
      inputId === NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_INPUT_ID,
  );
const COMPUTED_WITNESS_EDGES = Object.freeze(
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.filter(
    ({ to }) => to === "computed_bracket_operands_witness",
  ).map((edge) => Object.freeze({ ...edge })),
);
const CLASSICAL_WITNESS_EDGES = Object.freeze(
  NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_EDGES.filter(
    ({ to }) => to === "classical_bracket_targets_witness",
  ).map((edge) => Object.freeze({ ...edge })),
);

if (INPUT_INTERFACE == null) {
  throw new Error("spherical_v2_constraint_formulation_interface_missing");
}

const CONTRACT = {
  artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_ARTIFACT_ID,
  contractVersion:
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CONTRACT_VERSION,
  inputId: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_INPUT_ID,
  phase: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_PHASE,
  authority: "canonical_preexecution_scientific_input_bytes_only",
  maturity:
    "stage_2_candidate_specific_total_constraint_and_probe_semantics_without_numeric_evidence",
  candidateIdentity: {
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    geometryId: FREEZE.candidateIdentity.geometryId,
    chartId: FREEZE.candidateIdentity.chartId,
    normalizationId: FREEZE.candidateIdentity.normalizationId,
    samplingBasisId: FREEZE.candidateIdentity.samplingBasisId,
    sourceMode: FREEZE.candidateIdentity.sourceMode,
    declaredLeverOrTileTensorUsed: false,
    failureDisposition: "fail_candidate_without_retuning",
  },
  exactBindings: {
    sourceCandidate: NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_BINDING,
    v2CandidateFreeze: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_BINDING,
    classicalStructureFunctions:
      NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_BINDING,
    approvedV2ReplayPolicy:
      NHM2_SEMICLASSICAL_V2_APPROVED_REPLAY_POLICY_RAW_BINDING,
    scienceDerivationDagSha256:
      NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256,
  },
  approvedInputInterface: {
    inputId: INPUT_INTERFACE.inputId,
    artifactId: INPUT_INTERFACE.artifactId,
    contractVersion: INPUT_INTERFACE.contractVersion,
  },
  formulation: {
    effectiveAction: SOURCE.totalConstraintDuty.formulation,
    actionScope:
      "same_renormalized_gravity_plus_complex_scalar_effective_action_as_the_frozen_self_consistent_candidate_with_no_declared_lever_or_tile_term",
    ADMDecomposition:
      "Legendre_transform_on_tbar_constant_slices_after_all_required_local_renormalization_terms_are_included",
    alternativesAfterFreezeAllowed: false,
    boundaryTerms:
      "only_the_asymptotically_flat_ADM_variational_boundary_terms_required_by_the_same_action;_the_numerical_outer_boundary_is_not_physical",
    producerSelectedConstraintTermAllowed: false,
  },
  dimensionlessNormalization: SOURCE.totalConstraintDuty.normalization,
  canonicalPhaseSpace: {
    gravityVariables: Object.freeze(["qbar_ab", "pibar^ab"] as const),
    stateVariables:
      SOURCE.totalConstraintDuty.canonicalPhaseSpace.stateVariables,
    stateSymplecticForm:
      "Omegabar_state(delta1Psi,delta2Psi)=2*Im(<delta1Psi|delta2Psi>)_pulled_back_to_the_frozen_barred_coherent_Gaussian_coordinates",
    totalBracket: SOURCE.totalConstraintDuty.canonicalPhaseSpace.totalBracket,
    fixedStateDuringGravityVariationAllowed: false,
    lapseAndShiftAreExternalCNumberProbes: true,
  },
  generators: {
    Hamiltonian: "Hbar_total[N]=integral_d3xbar_N*Hbar_total_density",
    momentum: "Dbar_total[X]=integral_d3xbar_X^a*Dbar_total_a_density",
    combined: "Cbar[N,X]=Hbar_total[N]+Dbar_total[X]",
    requiredTerms: Object.freeze([...SOURCE.totalConstraintDuty.requiredTerms]),
    omissionOfVacuumStateOrCrossVariationTermsAllowed: false,
    matterOnlyWardIdentitySufficient: false,
  },
  spatialProbeDefinition: {
    referenceGeometry:
      "qbar_star_is_the_converged_self_consistent_spherical_candidate_geometry_frozen_before_any_constraint_bracket_execution",
    chi: "chi_p_is_the_dimensionless_tbar=0_spatial_factor_of_the_frozen_C_infinity_smear_centered_at_p_and_normalized_once_with_sqrt(det(qbar_star))*d3xbar",
    localCoordinates: "u_p,a=(xbar_a-xbar_p,a)/(1/64)_inside_the_probe_support",
    constructionAndSeal:
      "all_64_probe_families_are_materialized_and_hash_sealed_after_qbar_star_converges_and_before_either_constraint_implementation_starts",
    probeArtifactSha256: null,
    variationalTreatment:
      "chi_p_u_p_and_all_lapse_shift_probe_functions_are_external_c_number_inputs_held_fixed_during_every_inner_outer_forward_reverse_and_nested_Poissonbar_variation",
    metricVariationThroughProbeNormalizationAllowed: false,
    fixedVectors: {
      v: Object.freeze(["1/sqrt(21)", "2/sqrt(21)", "4/sqrt(21)"] as const),
      w: Object.freeze(["4/sqrt(21)", "-2/sqrt(21)", "1/sqrt(21)"] as const),
      basis: Object.freeze(["e_x", "e_y", "e_z"] as const),
    },
  },
  bracketOperands: {
    H_H: "N=chi_p_and_M_a=u_p,a*chi_p_for_the_three_momentum_channels_with_the_hamiltonian_channel_a_separately_derived_structural_zero",
    H_Hi: "N=chi_p_and_X=chi_p*v_for_the_hamiltonian_channel_with_three_separately_derived_structural_zero_momentum_channels",
    Hi_Hj:
      "X_a=chi_p*e_a_and_Y_a=u_p,a*chi_p*v_for_the_three_momentum_channels_with_the_hamiltonian_channel_a_separately_derived_structural_zero",
    componentOrder: Object.freeze([
      "hamiltonian",
      "momentum_x",
      "momentum_y",
      "momentum_z",
    ] as const),
    sampleCount: 64,
    shape: Object.freeze([64, 4] as const),
    unit: "dimensionless",
    noComponentMixing: true,
  },
  classicalDiracTargets: {
    H_H: SOURCE.totalConstraintDuty.targetConstruction.H_H,
    H_Hi: SOURCE.totalConstraintDuty.targetConstruction.H_Hi,
    Hi_Hj: SOURCE.totalConstraintDuty.targetConstruction.Hi_Hj,
    targetMayReadComputedOrResidualArrays: false,
    computedMayReadTargetOrResidualArrays: false,
    residualRecomputedServerSide:
      NHM2_SEMICLASSICAL_V2_RAW_REPLAY_FORMULAS.bracketResidual,
  },
  identityOperands: {
    combinedGeneratorTupleOrder: Object.freeze([
      "dimensionless_lapse_N",
      "dimensionless_shift_X",
    ] as const),
    antisymmetry:
      "forward=Poissonbar_total(Cbar[xi],Cbar[eta]);_reverse=Poissonbar_total(Cbar[eta],Cbar[xi]);_residual=forward+reverse",
    jacobi:
      "term_1=Poissonbar_total(Cbar[xi],Poissonbar_total(Cbar[eta],Cbar[zeta]));_term_2=cyclic_eta_zeta_xi;_term_3=cyclic_zeta_xi_eta;_residual=term_1+term_2+term_3",
    exactProbeTriplesRequiredBeforeExecution: true,
    probeTriples: {
      hamiltonian:
        "xi=(chi_p,chi_p*v);eta=(u_p,x*chi_p,chi_p*w);zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
      momentumX:
        "xi=(chi_p,chi_p*e_x);eta=(u_p,x*chi_p,chi_p*e_y);zeta=(u_p,y*chi_p,u_p,x*chi_p*e_y)",
      momentumY:
        "xi=(chi_p,chi_p*e_y);eta=(u_p,y*chi_p,chi_p*e_z);zeta=(u_p,z*chi_p,u_p,y*chi_p*e_z)",
      momentumZ:
        "xi=(chi_p,chi_p*e_z);eta=(u_p,z*chi_p,chi_p*e_x);zeta=(u_p,x*chi_p,u_p,z*chi_p*e_x)",
    },
    nestedVariationMustRetainAllGeometryAndStateDependence: true,
    everyInnerOuterAndReverseBracketSeparatelyEvaluated: true,
    targetOrResidualArraysMayNotBeRead: true,
    finiteProbeCoverageProvesFullFunctionalIdentity: false,
  },
  derivationAuthority: {
    computedBracketWitnessEdges: COMPUTED_WITNESS_EDGES,
    classicalTargetWitnessEdges: CLASSICAL_WITNESS_EDGES,
    baseDagSufficientForComputedBracketWitness: false,
    candidateSpecificRequiredEdgeOverlay: Object.freeze([
      Object.freeze({
        from: "geometry",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_geometry_and_qbar_star",
      }),
      Object.freeze({
        from: "chart",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_chart_and_probe_coordinates",
      }),
      Object.freeze({
        from: "sampling_basis",
        to: "computed_bracket_operands_witness",
        role: "computed_constraint_sample_centers_and_probe_family",
      }),
    ] as const),
    overlayApprovedByCurrentDerivationAuthority: false,
    derivationAuthoritySuccessorRequired: true,
    additionalDependencyBeyondBaseDagAndExactOverlayAllowed: false,
    derivationWitnessPresent: false,
    complete: false,
  },
  materialization: {
    canonicalScienceBytesPresent: true,
    frozenBeforeCandidateExecution: true,
    effectiveActionBytesPresent: false,
    probeManifestPresent: false,
    implementationPresent: false,
    arraysPresent: false,
    replayReceipt: null,
    independentAgreementReceipt: null,
  },
  blockers: Object.freeze([
    "renormalized_effective_action_and_counterterms_not_yet_hash_bound",
    "exact_operator_ordering_science_input_absent",
    "science_derivation_authority_successor_for_computed_geometry_chart_and_sampling_edges_absent",
    "candidate_geometry_and_state_not_executed",
    "external_probe_manifest_absent",
    "primary_and_independent_constraint_implementations_absent",
    "scientific_manifest_preseal_and_replay_receipts_absent",
  ] as const),
  authorityLocks:
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_AUTHORITY_LOCKS,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object))
    return value;
  seen.add(value as object);
  for (const key of Reflect.ownKeys(value as object)) {
    const descriptor = Object.getOwnPropertyDescriptor(value as object, key);
    if (descriptor != null && "value" in descriptor)
      deepFreeze(descriptor.value, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION =
  deepFreeze(CONTRACT);

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_JSON =
  canonicalJson(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION);
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-v2-constraint-formulation/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256 =
  createHash("sha256")
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256_DOMAIN)
    .update(NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_JSON)
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_JSON,
  );
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_SHA256 =
  "736ce86009ef09e4e7222bebc12638b8889f7129db6443160b1856585aae45ff" as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_CANONICAL_SIZE_BYTES =
  11_571 as const;
export const NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING =
  Object.freeze({
    artifactId: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_ARTIFACT_ID,
    contractVersion:
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CONTRACT_VERSION,
    inputId: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_INPUT_ID,
    candidateId: NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANDIDATE_ID,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256_DOMAIN,
    sha256: NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES,
    mediaType: "application/json" as const,
  });

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };
type Budget = { nodes: number; utf8: number };
const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
]);

const snapshot = (
  value: unknown,
  ancestors = new Set<object>(),
  depth = 0,
  budget: Budget = { nodes: 0, utf8: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth || ++budget.nodes > limits.maximumNodes)
    return { ok: false, violation: "resource_limit" };
  if (value === null || typeof value === "boolean") return { ok: true, value };
  if (typeof value === "number")
    return Number.isFinite(value) && !Object.is(value, -0)
      ? { ok: true, value }
      : { ok: false, violation: "invalid_number" };
  if (typeof value === "string") {
    const bytes = Buffer.byteLength(value);
    budget.utf8 += bytes;
    return bytes <= limits.maximumStringUtf8Bytes &&
      budget.utf8 <= limits.maximumAggregateUtf8Bytes
      ? { ok: true, value }
      : { ok: false, violation: "string_limit" };
  }
  if (typeof value !== "object" || isProxy(value) || ancestors.has(value))
    return { ok: false, violation: "non_plain_or_cyclic" };
  ancestors.add(value);
  if (Array.isArray(value)) {
    if (
      Object.getPrototypeOf(value) !== Array.prototype ||
      value.length > limits.maximumArrayLength
    )
      return { ok: false, violation: "array_surface" };
    const keys = Reflect.ownKeys(value);
    if (
      keys.some((key) => typeof key !== "string") ||
      keys.length !== value.length + 1
    )
      return { ok: false, violation: "array_surface" };
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        !descriptor.enumerable
      )
        return { ok: false, violation: "array_surface" };
      const nested = snapshot(descriptor.value, ancestors, depth + 1, budget);
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }
  if (Object.getPrototypeOf(value) !== Object.prototype)
    return { ok: false, violation: "object_surface" };
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => typeof key !== "string") ||
    keys.length > limits.maximumObjectPropertyCount
  )
    return { ok: false, violation: "object_surface" };
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    const keyBytes = Buffer.byteLength(key);
    budget.utf8 += keyBytes;
    if (
      FORBIDDEN_KEYS.has(key) ||
      keyBytes > limits.maximumPropertyKeyUtf8Bytes ||
      budget.utf8 > limits.maximumAggregateUtf8Bytes
    )
      return { ok: false, violation: "object_surface" };
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      !descriptor.enumerable
    )
      return { ok: false, violation: "object_surface" };
    const nested = snapshot(descriptor.value, ancestors, depth + 1, budget);
    if (!nested.ok) return nested;
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
    });
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

export const validateNhm2SphericalBosonStarV2ConstraintFormulationV1 = (
  value: unknown,
): Readonly<{ ok: true }> | Readonly<{ ok: false; violation: string }> => {
  const result = snapshot(value);
  if (!result.ok) return Object.freeze(result);
  return canonicalJson(result.value) ===
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_JSON
    ? Object.freeze({ ok: true as const })
    : Object.freeze({ ok: false as const, violation: "semantic_mismatch" });
};

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_BINDING_PINS;
  if (
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_SHA256 !==
      pins.sourceCandidateSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_COHERENT_CANDIDATE_PLAN_CANONICAL_SIZE_BYTES !==
      pins.sourceCandidateCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_SHA256 !==
      pins.v2CandidateFreezeSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_CANONICAL_SIZE_BYTES !==
      pins.v2CandidateFreezeCanonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_SHA256 !==
      pins.classicalStructureFunctionsSha256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CLASSICAL_STRUCTURE_FUNCTIONS_CANONICAL_SIZE_BYTES !==
      pins.classicalStructureFunctionsCanonicalSizeBytes ||
    NHM2_SEMICLASSICAL_V2_SCIENCE_DERIVATION_DAG_SHA256 !==
      pins.scienceDerivationDagSha256
  )
    throw new Error("spherical_v2_constraint_formulation_dependency_pin_drift");
  if (
    INPUT_INTERFACE.artifactId !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_ARTIFACT_ID ||
    INPUT_INTERFACE.contractVersion !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CONTRACT_VERSION ||
    !NHM2_SPHERICAL_BOSON_STAR_V2_CANDIDATE_FREEZE_MISSING_INPUT_IDS.includes(
      "constraint_formulation",
    ) ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION.classicalDiracTargets
      .targetMayReadComputedOrResidualArrays !== false ||
    Object.values(
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_AUTHORITY_LOCKS,
    ).some(Boolean)
  )
    throw new Error("spherical_v2_constraint_formulation_authority_invariant");
  if (
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_SHA256 !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_SHA256 ||
    NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_CANONICAL_SIZE_BYTES !==
      NHM2_SPHERICAL_BOSON_STAR_V2_CONSTRAINT_FORMULATION_EXPECTED_CANONICAL_SIZE_BYTES
  )
    throw new Error("spherical_v2_constraint_formulation_literal_pin_mismatch");
};

assertInvariants();
