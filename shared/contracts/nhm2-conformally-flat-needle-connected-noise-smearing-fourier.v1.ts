import { createHash } from "node:crypto";
import { types as nodeUtilTypes } from "node:util";

import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-numerical-representation-mean-binding.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-connected-noise-two-particle-symbol.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
} from "./nhm2-conformally-flat-needle-fixed-background-observables.v1";
import {
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
} from "./nhm2-conformally-flat-needle-scalar-reference.v1";

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID =
  "nhm2.conformally_flat_needle_connected_noise_smearing_fourier" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION =
  "nhm2_conformally_flat_needle_connected_noise_smearing_fourier/v1" as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256 =
  "5ce5b293559b42b26a1c71dff782aebe5b4daf88ddfcdec131101a3fc4fee57a" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES =
  18025 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256 =
  "11f062d22a66127a3b71c833ea16ff4facf973012203d135bcbdc4bb597610de" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES =
  6473 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SHA256 =
  "32191a882bbe4c4f8f6cd462fe25052e059ed715b5482dda577078b71ea0eaa8" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES =
  25097 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256 =
  "2a0e47935b9101b6b80cb0e53f1e6e1ebff248082c63ee1084f5233a5dc6347b" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES =
  13189 as const;

// Literal drift pins deliberately stay outside the canonical contract bytes.
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SHA256 =
  "d6a41006d48e19e2ebbed206d052609b25283af21fbe4c132c66b7d2771fe1b1" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SIZE_BYTES =
  11760 as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SHA256 =
  "e05e74621a1616fd7d37150f71e98632005938d42f285e30a83e760a5f1d6faf" as const;
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SIZE_BYTES =
  12107 as const;

const CANONICALIZATION = "utf8_lexicographic_object_keys_json_v1" as const;

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
    canonicalization: CANONICALIZATION,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  });
};

const deepFreeze = <T>(value: T, seen = new WeakSet<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value)) {
    return value;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze((value as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
};

const assertBinding = (
  label: string,
  value: unknown,
  expectedSha256: string,
  expectedSizeBytes: number,
  reportedSha256?: string,
  reportedSizeBytes?: number,
): void => {
  const actual = canonicalBinding(value);
  if (
    actual.sha256 !== expectedSha256 ||
    actual.sizeBytes !== expectedSizeBytes ||
    (reportedSha256 != null && reportedSha256 !== expectedSha256) ||
    (reportedSizeBytes != null && reportedSizeBytes !== expectedSizeBytes)
  ) {
    throw new Error(
      `nhm2_connected_noise_smearing_fourier_${label}_literal_pin_mismatch`,
    );
  }
};

assertBinding(
  "two_particle_symbol",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_SIZE_BYTES,
);
assertBinding(
  "mean_binding",
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_SIZE_BYTES,
);
assertBinding(
  "scalar_reference",
  NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
);
assertBinding(
  "observables",
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SHA256,
  NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_SIZE_BYTES,
);

if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
    .executionAdmissible !== false ||
  Object.values(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL.content
      .authority.locks,
  ).some((value) => value !== false)
) {
  throw new Error(
    "nhm2_connected_noise_smearing_fourier_symbol_blocked_state_drift",
  );
}

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS =
  Object.freeze([
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_BLOCKERS,
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS =
  Object.freeze([
    "certified_q0_enclosure_not_frozen",
    "certified_sample_normalization_enclosures_and_receipt_not_frozen",
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS =
  Object.freeze([
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
    ...NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
  ] as const);

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_AUTHORITY_LOCKS =
  Object.freeze({
    sourceByteAuthority: false as const,
    distributionalEquivalenceAuthority: false as const,
    numericalNormalizationAuthority: false as const,
    fourierEnclosureAuthority: false as const,
    deterministicErrorAuthority: false as const,
    jointPsdAuthority: false as const,
    executionAuthority: false as const,
    replayAuthority: false as const,
    agreementAuthority: false as const,
    lampAuthority: false as const,
    admConstraintAuthority: false as const,
    physicalClaimAuthority: false as const,
    propulsionAuthority: false as const,
    transportAuthority: false as const,
    certificateAuthority: false as const,
  });

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CLAIM_LOCKS =
  Object.freeze({
    numericalNormalizationComputed: false as const,
    fourierTransformEvaluated: false as const,
    fourierDecayCertified: false as const,
    deterministicTailCertified: false as const,
    primaryExecutionPass: false as const,
    independentExecutionPass: false as const,
    independentAgreementPass: false as const,
    connectedNoiseDiagnosticPass: false as const,
    fixedBackgroundNoiseLamp: false as const,
    semiclassicalStressNoiseLamp: false as const,
    constraintClosureLamp: false as const,
    admConstraintClosure: false as const,
    theoryGraphPromotion: false as const,
    theoryClosure: false as const,
    physicalViability: false as const,
    propulsion: false as const,
    transport: false as const,
    certificateEligibility: false as const,
    certificateIssued: false as const,
  });

const upstreamBinding = (
  artifactId: string,
  contractVersion: string,
  canonicalSha256: string,
  canonicalSizeBytes: number,
  role: string,
) => ({
  artifactId,
  contractVersion,
  canonicalSha256,
  canonicalSizeBytes,
  canonicalization: CANONICALIZATION,
  exactUpstreamBytesRequired: true,
  exactIdentityVerifiedAtModuleInitialization: true,
  semanticSubstitutionAllowed: false,
  role,
});

const CONTENT = {
  maturity: "stage_2_blocked_exact_smearing_fourier_convention",
  status: "blocked_analytic_smearing_fourier_identities_frozen",
  executionAdmissible: false,
  scopeBoundary: {
    role: "additive_exact_smearing_fourier_identity_overlay_only",
    fieldTheory: "free_massless_conformally_coupled_real_scalar",
    background: "one_frozen_conformally_flat_needle_candidate",
    modifiesAnyUpstreamContract: false,
    replacesAnyUpstreamContract: false,
    freezesNumericalQuadrature: false,
    suppliesNumericalArrayValues: false,
    declaredLeverTensorInputAllowed: false,
    metricDemandSubstitutionAllowed: false,
    constraintObservable: false,
    fullSemiclassicalBackreaction: false,
    grantsExecutionAuthority: false,
  },
  upstreamBindings: {
    twoParticleSymbol: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_TWO_PARTICLE_SYMBOL_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SYMBOL_EXPECTED_SIZE_BYTES,
      "exact_mode_measure_stress_symbol_Gram_and_Fourier_phase_convention",
    ),
    numericalRepresentationMeanBinding: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_NUMERICAL_REPRESENTATION_MEAN_BINDING_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_MEAN_BINDING_EXPECTED_SIZE_BYTES,
      "blocked_exact_mean_binding_and_numerical_representation_baseline",
    ),
    scalarReference: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_SCALAR_REFERENCE_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SCALAR_REFERENCE_EXPECTED_SIZE_BYTES,
      "frozen_geometry_conformal_factor_sample_centers_and_product_bump",
    ),
    fixedBackgroundObservables: upstreamBinding(
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_ARTIFACT_ID,
      NHM2_CONFORMALLY_FLAT_NEEDLE_FIXED_BACKGROUND_OBSERVABLES_CONTRACT_VERSION,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SHA256,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_OBSERVABLES_EXPECTED_SIZE_BYTES,
      "frozen_sample_smearing_tensor_and_connected_noise_output_boundary",
    ),
  },
  oneDimensionalBump: {
    symbol: "q",
    interiorDefinition: "q(u)=exp(-u^2/(1-u^2)) for abs(u)<1",
    exteriorDefinition: "q(u)=0 for abs(u)>=1",
    support: "[-1,1]",
    positiveOnInterior: true,
    realValued: true,
    even: true,
    regularity: "C_infinity_with_every_boundary_jet_zero_at_u=plus_or_minus_1",
    endpointValues: { minusOne: 0, plusOne: 0 },
    numericalEvaluatorPresent: false,
  },
  halfWidthsAndVolume: {
    coordinateOrder: ["X0", "X", "Y", "Z"],
    halfWidthsM: [0.002, 0.01, 0.002, 0.002],
    halfWidthSymbols: ["a0", "ax", "ay", "az"],
    exactRationalMeters: ["2/1000", "1/100", "2/1000", "2/1000"],
    productSymbol: "V",
    productDefinition: "V=a0*ax*ay*az",
    exactProductRationalM4: "8/100000000000",
    productM4: 8e-11,
    positive: true,
  },
  oneDimensionalFourierTransform: {
    symbol: "Q",
    argument: "z_dimensionless",
    definition: "Q(z)=integral_-1^1_du*q(u)*exp(-i*z*u)",
    realEvenReduction: "Q(z)=2*integral_0^1_du*q(u)*cos(z*u)",
    zeroModeDefinition: "Q0=Q(0)=integral_-1^1_du*q(u)",
    realValuedForRealZ: true,
    evenForRealZ: true,
    conjugationIdentity: "conjugate(Q(z))=Q(z)=Q(-z) for real z",
    noTwoPiFactorInForwardTransform: true,
    exactIdentityFrozen: true,
    numericalQ0: null,
    numericalQ0Enclosure: null,
    numericalEvaluator: null,
    numericalEnclosureEvaluator: null,
  },
  curvedNormalization: {
    conformalAmplitude: 0.000001,
    conformalFactor: "Omega=1+1e-6*b(s)",
    conformalFactorBounds: ["1", "1+1e-6"],
    sampleSpatialNormalizationIntegral:
      "S_p=integral_[-1,1]^3_du_x_du_y_du_z*q(u_x)*q(u_y)*q(u_z)*Omega(X_p+ax*u_x,Y_p+ay*u_y,Z_p+az*u_z)^4",
    normalizationConstant: "C_p=1/[V*Q0*S_p] with V=a0*ax*ay*az and C_p>0",
    normalizationIdentity: "integral_R4_d4X*Omega(X)^4*bar_f_p(X)=1",
    exactSBounds: ["Q0^3", "(1+1e-6)^4*Q0^3"],
    exactCBounds: ["1/[V*Q0^4*(1+1e-6)^4]", "1/[V*Q0^4]"],
    normalizedAgainstCurvedVolume: true,
    normalizedAgainstFlatLebesgueMeasure: false,
    omegaInsertedInsideFlatFourierTransform: false,
    omegaDependenceAfterConformalStressVolumeCancellation:
      "only_through_the_sample_normalization_constant_C_p",
    numericalSampleNormalizationValues: null,
    numericalSampleNormalizationEnclosures: null,
    numericalNormalizationReceipt: null,
  },
  productSmearingFourierTransform: {
    scalarSmearing:
      "bar_f_p(X)=C_p*q((X0-X0_p)/a0)*q((X-X_p)/ax)*q((Y-Y_p)/ay)*q((Z-Z_p)/az)",
    exactTransform:
      "bar_f_hat_p(K)=C_p*V*exp(-i*K_dot_X_p)*Q(a0*K0)*Q(ax*Kx)*Q(ay*Ky)*Q(az*Kz)",
    upstreamForwardConvention: "f_hat(K)=integral_d4X*f(X)*exp(-i*K_dot_X)",
    dotProduct: "K_dot_X=-K0*X0+Kx*X+Ky*Y+Kz*Z",
    sampleTimeCentersM: 0,
    frozenCenterPhase: "exp(-i*(Kx*X_p+Ky*Y_p+Kz*Z_p)) because every X0_p=0",
    dimensionOfC: "L^-4",
    dimensionOfV: "L^4",
    transformDimension: "1",
    realSmearingConjugation: "bar_f_hat_p(-K)=conjugate(bar_f_hat_p(K))",
    transformFactorizesExactly: true,
    omegaCenterFactoringUsed: false,
    numericalTransformValues: null,
    numericalTransformEnclosures: null,
    evaluatorPresent: false,
  },
  zeroModeBoundary: {
    identity: "bar_f_hat_p(0)=Q0^3/S_p",
    exactInclusiveBounds: ["(1+1e-6)^-4", "1"],
    exactLowerEquivalentRationalPower: "(1000000/1000001)^4",
    followsFromCurvedNormalization: true,
    assertedEqualToOne: false,
    flatLebesgueNormalizationClaimAllowed: false,
    numericalZeroModes: null,
    numericalZeroModeEnclosures: null,
  },
  sampleAndDisplacementMapping: {
    sampleCount: 64,
    sampleOrdinalFormula: "p=16*i_z+4*i_y+i_x",
    enumerationOrder: ["z_outer", "y_middle", "x_inner"],
    xVariesFastest: true,
    allSampleTimeCentersM: "0",
    centerCoordinatesInheritedExactly: true,
    xCenterCoordinatesM: ["-0.125", "-0.05", "0.05", "0.125"],
    yzCenterCoordinatesM: ["-0.025", "-0.01", "0.01", "0.025"],
    xDisplacementsM: [
      "-0.25",
      "-0.175",
      "-0.1",
      "-0.075",
      "0",
      "0.075",
      "0.1",
      "0.175",
      "0.25",
    ],
    yAndZDisplacementsM: [
      "-0.05",
      "-0.035",
      "-0.02",
      "-0.015",
      "0",
      "0.015",
      "0.02",
      "0.035",
      "0.05",
    ],
    uniqueSpatialDisplacementTripleCount: 729,
    translationIdentity:
      "conjugate(bar_f_hat_p(K))*bar_f_hat_q(K)=C_p*C_q*V^2*product_mu(Q(a_mu*K_mu)^2)*exp(i*K_spatial_dot_(x_p-x_q))",
    pairDependenceOutsideNormalizationConstants:
      "only_through_the_spatial_center_displacement_x_p_minus_x_q",
    normalizationReflectionSymmetry:
      "C_(sigma_x*x,sigma_y*y,sigma_z*z)=C_(x,y,z) for independent sigma_i in {minus_1,plus_1}",
    normalizationYZExchangeSymmetry: "C_(x,y,z)=C_(x,z,y)",
    mappingAuthorizesNumericalReduction: false,
  },
  analyticFreezeBoundary: {
    exactBumpFrozen: true,
    exactHalfWidthsAndVolumeFrozen: true,
    exactFourierDefinitionFrozen: true,
    exactCurvedNormalizationFormulaFrozen: true,
    exactProductTransformFrozen: true,
    exactZeroModeBoundsFrozen: true,
    exactSampleAndDisplacementMappingFrozen: true,
    resolvesAnyTwoParticleSymbolBlocker: false,
    numericalEvaluationPerformed: false,
    numericalProofProduced: false,
    executionAuthorized: false,
  },
  blockerAccounting: {
    inheritedBlockerCount: 10,
    inheritedBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
    addedBlockerCount: 2,
    addedBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
    totalBlockerCount: 12,
    totalBlockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
    inheritedBlockerOrderPreservedExactly: true,
    addedBlockerOrderFrozen: true,
    resolvesAnyInheritedBlocker: false,
    analyticFreezeAuthorizesNumericalNormalization: false,
  },
  plannedDecayBoundary: {
    plannedIntegrationByPartsDerivativeOrder: 12,
    derivativeOrderIsPlannedNotCertified: true,
    derivativeOrderAuthority: false,
    exactDerivativeFormula: null,
    certifiedDerivativeL1NormD12: null,
    certifiedDerivativeL1NormEnclosure: null,
    integrationByPartsBoundaryProofArtifact: null,
    fourierDecayCertificate: null,
    plannedOrderResolvesCertifiedDerivativeBlocker: false,
  },
  unresolvedNumericalAndExecutionFreeze: {
    sourceArtifactByteBindingSet: null,
    executableDistributionalEquivalenceProof: null,
    Q0Enclosure: null,
    sampleNormalizationEnclosures: null,
    derivativeOrderCertification: null,
    D12Enclosure: null,
    primaryCoreCutoff: null,
    independentCoreCutoff: null,
    tailSectorCutoffs: null,
    cubatureRules: null,
    workLimits: null,
    absoluteAndRelativeTolerances: null,
    primaryExecutorLineage: null,
    independentExecutorLineage: null,
    executionContract: null,
    executionReceipt: null,
    replayReceipt: null,
    allFieldsRequiredBeforeExecution: true,
    nullFieldExecutionAllowed: false,
  },
  implementationBoundary: {
    builderPresent: false,
    evaluatorPresent: false,
    executorPresent: false,
    outputWriterPresent: false,
    executionContractPresent: false,
    executionReceiptPresent: false,
    replayReceiptPresent: false,
    certificatePresent: false,
  },
  authority: {
    status: "blocked",
    firstBlocker: "primary_source_artifact_bytes_not_verified",
    blockers:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
    locks:
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_AUTHORITY_LOCKS,
  },
  claimLocks:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CLAIM_LOCKS,
} as const;

const CONTENT_BINDING = canonicalBinding(CONTENT);
if (
  CONTENT_BINDING.sha256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SHA256 ||
  CONTENT_BINDING.sizeBytes !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTENT_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_smearing_fourier_content_literal_pin_mismatch:${CONTENT_BINDING.sha256}/${CONTENT_BINDING.sizeBytes}`,
  );
}

const CONTRACT = {
  artifactId:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ARTIFACT_ID,
  contractVersion:
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CONTRACT_VERSION,
  contentBinding: CONTENT_BINDING,
  content: CONTENT,
} as const;

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER =
  deepFreeze(CONTRACT);

export type Nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierV1 =
  typeof NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER;

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
    if (!Number.isFinite(value)) {
      return { ok: false, violation: `nonfinite_number:${at}` };
    }
    if (Object.is(value, -0)) {
      return { ok: false, violation: `negative_zero:${at}` };
    }
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
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return { ok: false, violation: `symbol_key_forbidden:${at}` };
  }
  const stringKeys = keys as string[];
  const forbiddenKey = stringKeys.find((key) => FORBIDDEN_DATA_KEYS.has(key));
  if (forbiddenKey != null) {
    ancestors.delete(value);
    return {
      ok: false,
      violation: `forbidden_data_key:${pointer}/${forbiddenKey}`,
    };
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return { ok: false, violation: `non_plain_array:${at}` };
    }
    if (
      stringKeys.length !== value.length + 1 ||
      !stringKeys.includes("length") ||
      stringKeys.some((key) => {
        if (key === "length") return false;
        if (!/^(?:0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index >= value.length;
      })
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
  for (const key of stringKeys) {
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

export const canonicalNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierJson =
  (value: unknown): string => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) {
      throw new TypeError(
        `Cannot canonicalize unsafe plain data: ${snapshot.violation}`,
      );
    }
    return canonicalJson(snapshot.value);
  };

export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON =
  canonicalJson(NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER);
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256 =
  createHash("sha256")
    .update(
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_CANONICAL_JSON,
    "utf8",
  );
if (
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256 !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SHA256 ||
  NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES !==
    NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_EXPECTED_SIZE_BYTES
) {
  throw new Error(
    `nhm2_connected_noise_smearing_fourier_contract_literal_pin_mismatch:${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SHA256}/${NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_SIZE_BYTES}`,
  );
}

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
      if (!expectedKeys.includes(key)) {
        violations.push(`extra_key:${pointer}/${key}`);
      }
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

const sameStrings = (
  left: readonly string[],
  right: readonly string[],
): boolean =>
  left.length === right.length &&
  left.every((entry, index) => entry === right[index]);

const unique = (values: readonly string[]): string[] => [...new Set(values)];

export const nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations =
  (value: unknown): string[] => {
    const snapshot = snapshotPlainData(value);
    if (snapshot.ok === false) return [snapshot.violation];

    const violations = exactDifferences(
      snapshot.value,
      NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER,
    );
    const root = isRecord(snapshot.value) ? snapshot.value : null;
    const content =
      root != null && isRecord(root.content) ? root.content : null;

    if (content != null) {
      try {
        const actualBinding = canonicalBinding(content);
        const declared = isRecord(root?.contentBinding)
          ? root.contentBinding
          : null;
        if (
          declared == null ||
          declared.sha256 !== actualBinding.sha256 ||
          declared.sizeBytes !== actualBinding.sizeBytes ||
          declared.canonicalization !== CANONICALIZATION
        ) {
          violations.push("content_binding_invalid");
        }
      } catch {
        violations.push("content_binding_invalid");
      }
    } else {
      violations.push("content_binding_invalid");
    }

    const upstream =
      content != null && isRecord(content.upstreamBindings)
        ? content.upstreamBindings
        : null;
    const expectedUpstream = CONTENT.upstreamBindings;
    if (exactDifferences(upstream, expectedUpstream).length > 0) {
      violations.push("upstream_bindings_invalid");
    }

    const analytic =
      content != null && isRecord(content.analyticFreezeBoundary)
        ? content.analyticFreezeBoundary
        : null;
    if (
      analytic == null ||
      analytic.exactBumpFrozen !== true ||
      analytic.exactHalfWidthsAndVolumeFrozen !== true ||
      analytic.exactFourierDefinitionFrozen !== true ||
      analytic.exactCurvedNormalizationFormulaFrozen !== true ||
      analytic.exactProductTransformFrozen !== true ||
      analytic.exactZeroModeBoundsFrozen !== true ||
      analytic.exactSampleAndDisplacementMappingFrozen !== true ||
      analytic.resolvesAnyTwoParticleSymbolBlocker !== false ||
      analytic.numericalEvaluationPerformed !== false ||
      analytic.numericalProofProduced !== false ||
      analytic.executionAuthorized !== false
    ) {
      violations.push("analytic_freeze_boundary_invalid");
    }

    const planned =
      content != null && isRecord(content.plannedDecayBoundary)
        ? content.plannedDecayBoundary
        : null;
    if (
      planned == null ||
      planned.plannedIntegrationByPartsDerivativeOrder !== 12 ||
      planned.derivativeOrderIsPlannedNotCertified !== true ||
      planned.derivativeOrderAuthority !== false ||
      planned.certifiedDerivativeL1NormD12 !== null ||
      planned.certifiedDerivativeL1NormEnclosure !== null ||
      planned.fourierDecayCertificate !== null ||
      planned.plannedOrderResolvesCertifiedDerivativeBlocker !== false
    ) {
      violations.push("planned_derivative_order_must_remain_uncertified");
    }

    const blockerAccounting =
      content != null && isRecord(content.blockerAccounting)
        ? content.blockerAccounting
        : null;
    const inheritedBlockers =
      blockerAccounting != null &&
      Array.isArray(blockerAccounting.inheritedBlockers)
        ? blockerAccounting.inheritedBlockers
        : null;
    const addedBlockers =
      blockerAccounting != null &&
      Array.isArray(blockerAccounting.addedBlockers)
        ? blockerAccounting.addedBlockers
        : null;
    const totalBlockers =
      blockerAccounting != null &&
      Array.isArray(blockerAccounting.totalBlockers)
        ? blockerAccounting.totalBlockers
        : null;
    if (
      inheritedBlockers == null ||
      inheritedBlockers.some((entry) => typeof entry !== "string") ||
      !sameStrings(
        inheritedBlockers.filter(
          (entry): entry is string => typeof entry === "string",
        ),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_INHERITED_BLOCKERS,
      ) ||
      addedBlockers == null ||
      addedBlockers.some((entry) => typeof entry !== "string") ||
      !sameStrings(
        addedBlockers.filter(
          (entry): entry is string => typeof entry === "string",
        ),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_ADDED_BLOCKERS,
      ) ||
      totalBlockers == null ||
      totalBlockers.some((entry) => typeof entry !== "string") ||
      !sameStrings(
        totalBlockers.filter(
          (entry): entry is string => typeof entry === "string",
        ),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
      ) ||
      blockerAccounting?.inheritedBlockerCount !== 10 ||
      blockerAccounting?.addedBlockerCount !== 2 ||
      blockerAccounting?.totalBlockerCount !== 12 ||
      blockerAccounting?.inheritedBlockerOrderPreservedExactly !== true ||
      blockerAccounting?.addedBlockerOrderFrozen !== true ||
      blockerAccounting?.resolvesAnyInheritedBlocker !== false ||
      blockerAccounting?.analyticFreezeAuthorizesNumericalNormalization !==
        false
    ) {
      violations.push("smearing_fourier_blocker_accounting_invalid");
    }

    const unresolved =
      content != null && isRecord(content.unresolvedNumericalAndExecutionFreeze)
        ? content.unresolvedNumericalAndExecutionFreeze
        : null;
    if (
      unresolved == null ||
      Object.entries(unresolved).some(([key, entry]) => {
        if (key === "allFieldsRequiredBeforeExecution") return entry !== true;
        if (key === "nullFieldExecutionAllowed") return entry !== false;
        return entry !== null;
      })
    ) {
      violations.push("numerical_and_execution_freeze_must_remain_unresolved");
    }

    const authority =
      content != null && isRecord(content.authority) ? content.authority : null;
    const blockers =
      authority != null && Array.isArray(authority.blockers)
        ? authority.blockers
        : null;
    const locks =
      authority != null && isRecord(authority.locks) ? authority.locks : null;
    if (
      authority?.status !== "blocked" ||
      authority?.firstBlocker !==
        "primary_source_artifact_bytes_not_verified" ||
      blockers == null ||
      blockers.some((entry) => typeof entry !== "string") ||
      !sameStrings(
        blockers.filter((entry): entry is string => typeof entry === "string"),
        NHM2_CONFORMALLY_FLAT_NEEDLE_CONNECTED_NOISE_SMEARING_FOURIER_BLOCKERS,
      ) ||
      locks == null ||
      Object.values(locks).some((entry) => entry !== false)
    ) {
      violations.push("authority_must_remain_blocked");
    }

    const claims =
      content != null && isRecord(content.claimLocks)
        ? content.claimLocks
        : null;
    if (
      claims == null ||
      Object.values(claims).some((entry) => entry !== false)
    ) {
      violations.push("claim_locks_must_remain_false");
    }

    const implementation =
      content != null && isRecord(content.implementationBoundary)
        ? content.implementationBoundary
        : null;
    if (
      implementation == null ||
      Object.values(implementation).some((entry) => entry !== false)
    ) {
      violations.push("builder_evaluator_executor_outputs_must_remain_absent");
    }

    if (content == null || content.executionAdmissible !== false) {
      violations.push("execution_must_remain_blocked");
    }

    return unique(violations);
  };

export const isNhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierV1 = (
  value: unknown,
): value is Nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierV1 =>
  nhm2ConformallyFlatNeedleConnectedNoiseSmearingFourierViolations(value)
    .length === 0;
