import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_fixed_background_observables" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_fixed_background_observables/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SHA256 =
  "d3c4992df47055e37e2181b3ba1a1a33a0c2598a6b379d370b2536e4805a4b08" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SIZE_BYTES =
  12850 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;

const canonicalJson = (value: unknown): string => {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value) || Object.is(value, -0)) {
      throw new TypeError(
        "Canonical JSON requires finite, non-negative-zero numbers.",
      );
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  if (
    value == null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    throw new TypeError("Canonical JSON requires plain JSON objects.");
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

const canonicalBinding = (value: unknown) => {
  const bytes = Buffer.from(canonicalJson(value), "utf8");
  return Object.freeze({
    canonicalization: "utf8_lexicographic_object_keys_json_v1" as const,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  });
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value))
    return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_BLOCKERS =
  Object.freeze([
    "renormalization_sign_and_boxR_convention_not_frozen",
    "wald_conservation_correction_not_derived",
    "primary_implementation_absent",
    "independent_implementation_absent",
    "deterministic_tail_and_cubature_budget_not_frozen",
    "full_adm_constraint_theory_not_selected",
    "retarded_commutator_and_contact_kernel_absent",
    "canonical_phase_space_and_ordering_absent",
    "constraint_target_and_joint_uncertainty_absent",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CLAIM_LOCKS =
  Object.freeze({
    meanRsetDiagnosticPass: false as const,
    connectedNoiseDiagnosticPass: false as const,
    fixedBackgroundWardIdentityDiagnosticPass: false as const,
    independentAgreementDiagnosticPass: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    experimentReadyTheoryClosure: false as const,
    empiricalValidation: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const REFERENCE = NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE;
const REFERENCE_BINDING = canonicalBinding(REFERENCE);
if (
  REFERENCE_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SHA256 ||
  REFERENCE_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_REFERENCE_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_observables_reference_literal_pin_mismatch",
  );
}

const identityBinding = (value: unknown) => {
  const binding = canonicalBinding(value);
  return {
    sha256: binding.sha256,
    sizeBytes: binding.sizeBytes,
    canonicalization: binding.canonicalization,
  } as const;
};

const CONTENT = {
  maturity: "diagnostic_fixed_background_plan_only",
  status: "blocked_pending_renormalization_convention_freeze",
  executionAdmissible: false,
  referenceBinding: {
    artifactId: NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
    contractVersion:
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
    canonicalSha256: REFERENCE_BINDING.sha256,
    canonicalSizeBytes: REFERENCE_BINDING.sizeBytes,
    canonicalization: REFERENCE_BINDING.canonicalization,
    exactReferenceRequired: true,
    semanticRelabelingAllowed: false,
    currentNhm2ShiftLapseMetric: false,
  },
  frozenInputIdentities: {
    geometry: {
      geometryId: "conformally_flat_needle_reference",
      ...identityBinding(REFERENCE.geometry),
    },
    state: {
      stateId: REFERENCE.state.stateId,
      stateClass: REFERENCE.state.stateClass,
      minkowskiTwoPointFunction: REFERENCE.state.minkowskiTwoPointFunction,
      curvedTwoPointFunction: REFERENCE.state.curvedTwoPointFunction,
      ...identityBinding(REFERENCE.state),
    },
    chart: {
      chartId: "inertial_conformal_X0_X_Y_Z",
      coordinates: REFERENCE.geometry.inertialConformalCoordinates,
      ...identityBinding(REFERENCE.geometry.inertialConformalCoordinates),
    },
    tetrad: {
      tetradId: REFERENCE.geometry.tetrad.tetradId,
      basis: REFERENCE.tensorConvention.basis,
      ...identityBinding(REFERENCE.geometry.tetrad),
    },
    samples: {
      sampleSetId: "needle_reference_64_z_y_x_v1",
      count: REFERENCE.sampling.sampleCount,
      enumerationOrder: REFERENCE.sampling.enumerationOrder,
      ordinalFormula: REFERENCE.sampling.ordinalFormula,
      ...identityBinding(REFERENCE.sampling.samplePoints),
    },
    smearing: {
      smearingId: REFERENCE.sampling.smearing.smearingId,
      normalization: REFERENCE.sampling.smearing.normalization,
      halfWidthsM: REFERENCE.sampling.smearing.halfWidthsM,
      ...identityBinding(REFERENCE.sampling.smearing),
    },
    tensorConvention: {
      componentOrder: REFERENCE.tensorConvention.symmetricTensorComponentOrder,
      noisePairOrder: REFERENCE.tensorConvention.noiseKernelComponentPairOrder,
      ...identityBinding(REFERENCE.tensorConvention),
    },
  },
  sourceBoundary: {
    sourceMode: "state_derived_quantum_expectation",
    declaredLeverTensorPresent: false,
    declaredLeverTensorInputAllowed: false,
    declaredLeverTensorForbidden: true,
    metricDemandSubstitutionForQuantumExpectationAllowed: false,
    coordinateFlow: {
      kind: "pure_coordinate_compact_y_flow",
      spacetimeMap: REFERENCE.geometry.coordinateFlow.spacetimeMap,
      pureDiffeomorphism: true,
      materialMotion: false,
      actuation: false,
      propulsionInterpretationAllowed: false,
    },
  },
  renormalizationConventionPlan: {
    status: "blocked_pending_renormalization_convention_freeze",
    authoritativeConventionFrozen: false,
    primarySourceAudit: {
      sourceId: "moretti_comments_stress_energy_curved_spacetime_2002",
      sourceVersion: "arXiv:gr-qc/0109048v2",
      sourceUrl: "https://arxiv.org/abs/gr-qc/0109048v2",
      equationAnchors: ["10", "18", "19", "20", "21", "22"],
      finding:
        "source_supports_a_conserved_baseline_but_does_not_select_this_projects_finite_R_squared_Box_R_scheme_or_two_point_Hadamard_relative_normalization",
      authoritativelySelectsProjectConvention: false,
    },
    conventionPiecesAlreadyFixed: {
      metricSignature: "(-,+,+,+)",
      connection: "torsion_free_metric_compatible_levi_civita",
      riemannProposal:
        "R^rho_{ sigma mu nu}=partial_mu Gamma^rho_{nu sigma}-partial_nu Gamma^rho_{mu sigma}+Gamma^rho_{mu lambda}Gamma^lambda_{nu sigma}-Gamma^rho_{nu lambda}Gamma^lambda_{mu sigma}",
      ricciProposal: "R_{sigma nu}=R^rho_{ sigma rho nu}",
      scalarCurvatureProposal: "R=g^{ab}R_ab",
      boxProposal: "Box f=g^{ab}nabla_a_nabla_b f",
      syngeWorldFunctionProposal:
        "sigma(x,y)=one_half_of_signed_squared_geodesic_distance_with_timelike_sigma_negative",
      proposalsPrimarySourceCrosschecked: false,
      hadamardLengthScale: { symbol: "ell", value: 1, unit: "m" },
      twoPointFunction: REFERENCE.state.minkowskiTwoPointFunction,
      siRestoration: {
        meanRset: "multiply_geometric_unit_tetrad_components_by_hbar*c",
        connectedNoise:
          "multiply_geometric_unit_tetrad_component_pairs_by_(hbar*c)^2",
      },
    },
    pointSplitProposal: {
      expectationFormula:
        "<T_ab>_ell=[D_ab^(1/3)(W-H_ell)]_{y=x}+alpha0*g_ab+alpha1*G_ab+alpha2*I_ab+alpha3*J_ab",
      morettiBaselineSelectedForExecution: false,
      twoPointFunctionKind: "Wightman",
      hadamardParametrixNormalization: null,
      twoPointHadamardRelativeNormalization: null,
      improvedOperatorParameter: {
        spacetimeDimension: 4,
        formula: "eta=D/(2*(D+2))",
        numerator: 1,
        denominator: 3,
      },
      sourceOperatorConventions: {
        signature: "(-,+,+,+)",
        delta: "Delta=nabla^a*nabla_a",
        conformalScalarOperator: "P=-Delta+R/6",
        eta: "1/3",
      },
      etaZeroAlternativeCorrectionAuditOnly:
        "Q_(0,1/3)=-(c4/3)*U2*g_ab_in_Moretti_normalization",
      exactBidifferentialOperatorFormula: null,
      conservationCorrectionFormula: null,
      conservationCorrectionCoefficient: null,
      executionAllowedWithNullFormulaOrCoefficient: false,
    },
    finiteWaldAmbiguityBasis: [
      {
        name: "g_ab",
        definingFunctional: "integral_sqrt(-g)",
        componentDefinition: "g_ab",
        coefficient: 0,
      },
      {
        name: "G_ab",
        definingFunctional: "integral_sqrt(-g)*R",
        componentDefinition: "G_ab=R_ab-(1/2)*g_ab*R",
        coefficient: 0,
      },
      {
        name: "I_ab",
        definingFunctional: "integral_sqrt(-g)*R^2",
        componentDefinition:
          "candidate_common_convention_only:2*nabla_a*nabla_b*R-2*g_ab*Box*R-(1/2)*g_ab*R^2+2*R*R_ab",
        coefficient: 0,
      },
      {
        name: "J_ab",
        definingFunctional: "integral_sqrt(-g)*R_cd*R^cd",
        componentDefinition: null,
        coefficient: 0,
      },
    ],
    finiteBasisPolicy: {
      namedCoefficientsFixedToZero: true,
      unnamedTermsAllowed: false,
      variationalSignNormalizationPrimarySourceCrosschecked: false,
      zeroMeansChosenFiniteConventionNotAbsenceOfAmbiguity: true,
    },
    traceAnomalyCrossCheckOnly: {
      authoritative: false,
      rsetCandidate: "<T_ab>=(2880*pi^2)^-1*(-I_ab/6+K_ab)",
      kTensorCandidate:
        "K_ab=-R_a^c*R_bc+(2/3)*R*R_ab+(1/2)*g_ab*R_cd*R^cd-(1/4)*g_ab*R^2",
      traceCandidate:
        "<T^a_a>=(2880*pi^2)^-1*(Box*R+R_ab*R^ab-R^2/3)_for_conformally_flat_geometry",
      boxRCoefficientSchemeDependent: true,
      sealedForExecution: false,
    },
    exactChoiceNeededBeforeExecution: [
      "select_and_hash_the_Moretti_baseline_or_an_explicit_alternative_baseline",
      "pin_and_hash_the_primary_source_equation_version_for_D_ab^(1/3)",
      "crosswalk_that_source_to_the_declared_Riemann_Ricci_Box_and_Synge_signs",
      "freeze_the_Wightman_and_Hadamard_parametrix_relative_normalization",
      "transcribe_the_complete_bidifferential_operator_and_H_ell_recursion",
      "derive_the_conservation_restoring_local_term_and_its_coefficient",
      "freeze_the_finite_R_squared_Box_R_scheme_and_I_ab_J_ab_variational_signs",
    ],
  },
  implementationSeparation: {
    primary: {
      implementationId: "anomaly_wess_zumino_arb_spectral_primary",
      meanAlgorithm: "anomaly_wess_zumino_local_curvature_with_Arb_balls",
      noiseAlgorithm: "spectral_mode_noise_kernel_with_rigorous_tail_bounds",
      status: "absent",
    },
    independent: {
      implementationId: "hadamard_ad_mpfr_two_particle_independent",
      meanAlgorithm: "direct_Hadamard_point_split_with_AD_and_MPFR_intervals",
      noiseAlgorithm:
        "independent_two_particle_phase_space_bilocal_integration",
      status: "absent",
    },
    lineagePolicy: {
      sharedDerivedSourceFilesAllowed: false,
      sharedEquationTranscriptionAllowed: false,
      sharedRuntimeAllowed: false,
      sharedDependencyGraphAllowed: false,
      sharedExecutableAllowed: false,
      sharedIntermediateCachesAllowed: false,
      onlyFrozenContractAndExactInputBytesMayBeShared: true,
      executorObservedSourceDependencyExecutableHashesRequired: true,
    },
  },
  deterministicNumericsPlan: {
    policyVersion: "needle_fixed_background_interval_policy/v1_pending",
    policyFrozen: false,
    postFreezeMutationAllowed: false,
    arithmetic: "directed_rounding_interval_or_ball_arithmetic",
    precisionLadderBits: [192, 256, 384],
    spectralCutoffK: null,
    spectralCutoffScaleDerivation: null,
    tailDerivativeOrder: 12,
    tailBound: "abs(Q(z))<=min(norm_1(q),norm_1(d^12q/du^12)/abs(z)^12)",
    integrationByPartsOrder: 12,
    cubatureRuleId: null,
    maximumAdaptiveCells: null,
    maximumFunctionEvaluations: null,
    maximumWallClockMs: null,
    meanAbsoluteToleranceByComponent: null,
    noiseAbsoluteToleranceByComponentPair: null,
    wardResidualTolerance: null,
    refinementDeltaAloneIsProof: false,
    workLimitDisposition: "fail_candidate_without_retuning",
    nullBudgetValuesExecutionAllowed: false,
    blocker: "deterministic_tail_and_cubature_budget_not_frozen",
  },
  outputBoundary: {
    allowedArrayOutputs: [
      {
        role: "fixed_background_mean_rset",
        shape: [64, 10],
        unit: "J/m^3",
        encoding: "raw_ieee754_float64_little_endian",
      },
      {
        role: "fixed_background_mean_rset_absolute_uncertainty95",
        shape: [64, 10],
        unit: "J/m^3",
        encoding: "raw_ieee754_float64_little_endian",
      },
      {
        role: "fixed_background_connected_noise_kernel",
        shape: [64, 64, 100],
        unit: "(J/m^3)^2",
        encoding: "raw_ieee754_float64_little_endian",
      },
      {
        role: "fixed_background_connected_noise_absolute_uncertainty95",
        shape: [64, 64, 100],
        unit: "(J/m^3)^2",
        encoding: "raw_ieee754_float64_little_endian",
      },
      {
        role: "fixed_background_sample_weights",
        shape: [64],
        unit: "1",
        encoding: "raw_ieee754_float64_little_endian",
      },
    ],
    sidecarSchemas: [
      {
        role: "fixed_background_derivation_receipt",
        contractVersion:
          "nhm2_conformally_flat_needle_fixed_background_derivation_receipt/v1",
        mediaType: "application/json",
      },
      {
        role: "fixed_background_interval_trace",
        contractVersion:
          "nhm2_conformally_flat_needle_fixed_background_interval_trace/v1",
        mediaType: "application/jsonl",
      },
      {
        role: "fixed_background_execution_provenance",
        contractVersion:
          "nhm2_conformally_flat_needle_fixed_background_execution_provenance/v1",
        mediaType: "application/json",
      },
    ],
    sidecarsAreAuthorityByThemselves: false,
    constraintArraysAuthorized: false,
    forbiddenArrayRoles: [
      "H",
      "H_i",
      "hamiltonian_constraint",
      "momentum_constraint",
      "constraint_bracket",
      "constraint_antisymmetry",
      "constraint_jacobi",
    ],
  },
  constraintBoundary: {
    fixedBackgroundWardIdentity: {
      target: "nabla^a<T_ab>_ren=0_on_the_frozen_background",
      diagnosticOnly: true,
      status: "blocked_not_computed",
      establishesFullConstraintClosure: false,
    },
    fullAdmConstraintClosure: false,
    fullHamiltonianGeneratorDerived: false,
    fullMomentumGeneratorsDerived: false,
    fullPoissonBracketStructureFunctionsDerived: false,
    exactBlockers: [
      "full_adm_constraint_theory_not_selected",
      "retarded_commutator_and_contact_kernel_absent",
      "canonical_phase_space_and_ordering_absent",
      "constraint_target_and_joint_uncertainty_absent",
    ],
  },
  authority: {
    status: "blocked",
    firstBlocker: "renormalization_sign_and_boxR_convention_not_frozen",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_BLOCKERS,
    candidateRetuningAfterLimitFailureAllowed: false,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_observables_content_literal_pin_mismatch",
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleFixedBackgroundObservablesV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES;

export const canonicalNhm2ConformallyFlatNeedleFixedBackgroundObservablesJson =
  (value: Nhm2ConformallyFlatNeedleFixedBackgroundObservablesV1): string =>
    canonicalJson(value);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON =
  canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES);
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    "nhm2_fixed_background_observables_contract_literal_pin_mismatch",
  );
}

type SnapshotResult =
  { ok: true; value: unknown } | { ok: false; violation: string };

const FORBIDDEN_DATA_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
): SnapshotResult => {
  const at = pointer || "/";
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      return { ok: false, violation: `nonfinite_number:${at}` };
    if (Object.is(value, -0))
      return { ok: false, violation: `negative_zero:${at}` };
    return { ok: true, value };
  }
  if (typeof value !== "object") {
    return { ok: false, violation: `non_json_value:${at}` };
  }
  if (nodeUtilTypes.isProxy(value)) {
    return { ok: false, violation: `proxy_forbidden:${at}` };
  }
  if (ancestors.has(value)) {
    return { ok: false, violation: `cycle_forbidden:${at}` };
  }
  ancestors.add(value);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
    if (
      keys.some(
        (key) => key !== "length" && !/^(?:0|[1-9][0-9]*)$/.test(key as string),
      )
    ) {
      ancestors.delete(value);
      return { ok: false, violation: `array_keys_invalid:${at}` };
    }
    const output: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return {
          ok: false,
          violation: `accessor_sparse_or_hidden_array_entry:${pointer}/${index}`,
        };
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return { ok: true, value: output };
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    ancestors.delete(value);
    return { ok: false, violation: `non_plain_object:${at}` };
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    if (FORBIDDEN_DATA_KEYS.has(key)) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `forbidden_data_key:${pointer}/${key}`,
      };
    }
    const descriptor = descriptors[key];
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
      return {
        ok: false,
        violation: `accessor_or_hidden_property_forbidden:${pointer}/${key}`,
      };
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
    );
    if (!nested.ok) {
      ancestors.delete(value);
      return nested;
    }
    output[key] = nested.value;
  }
  ancestors.delete(value);
  return { ok: true, value: output };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const exactDifferences = (
  actual: unknown,
  expected: unknown,
  pointer = "",
): string[] => {
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    if (actual.length !== expected.length) {
      violations.push(`array_length_drift:${pointer || "/"}`);
    }
    for (
      let index = 0;
      index < Math.min(actual.length, expected.length);
      index += 1
    ) {
      violations.push(
        ...exactDifferences(
          actual[index],
          expected[index],
          `${pointer}/${index}`,
        ),
      );
    }
    return violations;
  }
  if (isRecord(actual) || isRecord(expected)) {
    if (!isRecord(actual) || !isRecord(expected)) {
      return [`type_drift:${pointer || "/"}`];
    }
    const violations: string[] = [];
    const actualKeys = Object.keys(actual);
    const expectedKeys = Object.keys(expected);
    for (const key of actualKeys) {
      if (!expectedKeys.includes(key))
        violations.push(`extra_key:${pointer}/${key}`);
    }
    for (const key of expectedKeys) {
      if (!actualKeys.includes(key)) {
        violations.push(`missing_key:${pointer}/${key}`);
      } else {
        violations.push(
          ...exactDifferences(actual[key], expected[key], `${pointer}/${key}`),
        );
      }
    }
    return violations;
  }
  return Object.is(actual, expected) ? [] : [`value_drift:${pointer || "/"}`];
};

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  const violations = exactDifferences(
    snapshot.value,
    NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  );
  const root = isRecord(snapshot.value) ? snapshot.value : null;
  const content = root != null && isRecord(root.content) ? root.content : null;
  const source =
    content != null && isRecord(content.sourceBoundary)
      ? content.sourceBoundary
      : null;
  if (
    source == null ||
    source.declaredLeverTensorPresent !== false ||
    source.declaredLeverTensorInputAllowed !== false ||
    source.declaredLeverTensorForbidden !== true
  ) {
    violations.push("declared_lever_tensor_forbidden");
  }
  const convention =
    content != null && isRecord(content.renormalizationConventionPlan)
      ? content.renormalizationConventionPlan
      : null;
  if (
    convention == null ||
    convention.status !== "blocked_pending_renormalization_convention_freeze" ||
    convention.authoritativeConventionFrozen !== false
  ) {
    violations.push("renormalization_authority_must_remain_blocked");
  }
  const numerics =
    content != null && isRecord(content.deterministicNumericsPlan)
      ? content.deterministicNumericsPlan
      : null;
  if (
    exactDifferences(numerics, CONTENT.deterministicNumericsPlan).length > 0
  ) {
    violations.push("deterministic_numeric_policy_drift");
  }
  const outputs =
    content != null && isRecord(content.outputBoundary)
      ? content.outputBoundary
      : null;
  const arrayOutputs = Array.isArray(outputs?.allowedArrayOutputs)
    ? outputs.allowedArrayOutputs
    : [];
  if (
    outputs?.constraintArraysAuthorized !== false ||
    arrayOutputs.some((entry) => {
      const role = isRecord(entry) ? entry.role : null;
      return (
        typeof role !== "string" ||
        /(?:^H$|^H_i$|constraint|hamiltonian|momentum|jacobi|antisymmetry)/i.test(
          role,
        )
      );
    })
  ) {
    violations.push("constraint_arrays_forbidden");
  }
  const locks =
    content != null && isRecord(content.claimLocks) ? content.claimLocks : null;
  if (locks == null) {
    violations.push("claim_locks_invalid");
  } else {
    for (const [key, lock] of Object.entries(locks)) {
      if (lock !== false)
        violations.push(`claim_lock_must_remain_false:${key}`);
    }
  }
  if (
    content == null ||
    exactDifferences(content.referenceBinding, CONTENT.referenceBinding)
      .length > 0
  ) {
    violations.push("reference_binding_invalid");
  }
  return unique(violations);
};

export const isNhm2ConformallyFlatNeedleFixedBackgroundObservablesV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleFixedBackgroundObservablesV1 =>
  nhm2ConformallyFlatNeedleFixedBackgroundObservablesViolations(value)
    .length === 0;
