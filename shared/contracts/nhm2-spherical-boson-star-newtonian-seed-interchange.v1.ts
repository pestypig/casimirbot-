import { createHash } from "node:crypto";
import { isProxy } from "node:util/types";

import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-operation-policy.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof.v1";
import {
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES,
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256,
} from "./nhm2-spherical-boson-star-newtonian-seed-directed-proof-operator.v1";

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_ARTIFACT_ID =
  "nhm2.spherical_boson_star_newtonian_seed_interchange" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VERSION =
  "nhm2_spherical_boson_star_newtonian_seed_interchange/v1" as const;

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS =
  Object.freeze({
    semanticSeed: Object.freeze({
      sha256:
        "b2a89c8065bd6865b26aa1c4365d0f48edbd40e9c4f43e0cfbaca49db29a6c2c",
      canonicalSizeBytes: 18894,
    }),
    operationPrepolicy: Object.freeze({
      sha256:
        "3aaadad7b8bec8d7883c172c380e10d3100c9e4c64404740b963e5820762de24",
      canonicalSizeBytes: 32308,
    }),
    directedProofArchitecture: Object.freeze({
      sha256:
        "c8832ae77d1279d400f1fffbc587e413659c111ae90283cb34a016fb7e08ea99",
      canonicalSizeBytes: 42778,
    }),
    primaryNumericsPolicy: Object.freeze({
      sha256:
        "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
      canonicalSizeBytes: 80055,
    }),
    directedProofOperator: Object.freeze({
      sha256:
        "511609501b01560c7e8a15f99a5b94176b51fb0e9add9bf5aa1045ef51d2342b",
      canonicalSizeBytes: 34695,
    }),
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VALIDATOR_LIMITS =
  Object.freeze({
    maximumDepth: 32,
    maximumNodes: 32768,
    maximumArrayLength: 8192,
    maximumObjectPropertyCount: 256,
    maximumStringUtf8Bytes: 65536,
  } as const);

export type Nhm2SphericalDirectedEndpointV1 = Readonly<{
  direction: "RNDD" | "RNDU";
  exponent2: number;
  mantissaLowercaseHex: string;
  precisionBits: 256;
  sign: "minus" | "plus" | "zero";
}>;

export type Nhm2SphericalDirectedIntervalV1 = readonly [
  Nhm2SphericalDirectedEndpointV1,
  Nhm2SphericalDirectedEndpointV1,
];

export type Nhm2SphericalNamedIntervalV1 = Readonly<{
  interval: Nhm2SphericalDirectedIntervalV1;
  name: string;
}>;

export type Nhm2SphericalHashBindingV1 = Readonly<{
  mediaType: string;
  path: string;
  sha256: string;
  sizeBytes: number;
}>;

export type Nhm2SphericalPolicyBindingV1 = Readonly<{
  artifactId: string;
  canonicalSizeBytes: number;
  policyVersion: string;
  sha256: string;
  sha256Domain: string;
}>;

type Nhm2SphericalOriginCoefficientIdV1 =
  | "a0"
  | "b0"
  | "a2"
  | "b2"
  | "a4"
  | "b4"
  | "a6"
  | "b6"
  | "a8"
  | "b8"
  | "a10"
  | "b10"
  | "a12"
  | "b12"
  | "a14"
  | "b14"
  | "a16"
  | "b16"
  | "a18"
  | "b18"
  | "a20"
  | "b20"
  | "a22"
  | "b22"
  | "a24"
  | "b24"
  | "a26"
  | "b26"
  | "a28"
  | "b28"
  | "a30"
  | "b30"
  | "a32"
  | "b32";

type Nhm2SphericalOriginBoundsV1 = Readonly<{
  YUpper: Nhm2SphericalDirectedEndpointV1;
  Z0Upper: Nhm2SphericalDirectedEndpointV1;
  Z1Upper: Nhm2SphericalDirectedEndpointV1;
  ZAtRadiusUpper: Nhm2SphericalDirectedEndpointV1;
  pUpper: Nhm2SphericalDirectedEndpointV1;
}>;

type Nhm2SphericalOriginCoefficientDutyPayloadV1 = Readonly<{
  bounds: null;
  coefficientId: Nhm2SphericalOriginCoefficientIdV1;
  coefficientInterval: Nhm2SphericalDirectedIntervalV1;
  entryKind: "coefficient";
  predicate: "coefficient_enclosed";
  predicateSatisfied: boolean;
  radiusExact: null;
  recurrenceTerms: readonly Nhm2SphericalNamedIntervalV1[];
  tag: "origin_recurrence_and_remainder/v1";
}>;

type Nhm2SphericalOriginRadiusDutyPayloadV1 = Readonly<{
  bounds: Nhm2SphericalOriginBoundsV1;
  coefficientId: null;
  coefficientInterval: null;
  entryKind: "radius";
  predicate: "radius_strictly_valid";
  predicateSatisfied: boolean;
  radiusExact: string;
  recurrenceTerms: null;
  tag: "origin_recurrence_and_remainder/v1";
}>;

export type Nhm2SphericalOriginDutyPayloadV1 =
  | Nhm2SphericalOriginCoefficientDutyPayloadV1
  | Nhm2SphericalOriginRadiusDutyPayloadV1;

type Nhm2SphericalCoreDutyPayloadV1<
  Tag extends string,
  ExpressionId extends string,
  Predicate extends string,
  Normalization extends Nhm2SphericalDirectedIntervalV1 | null,
> = Readonly<{
  coordinateOrder: readonly ["x"];
  expressionId: ExpressionId;
  normalizationInterval: Normalization;
  predicate: Predicate;
  predicateSatisfied: boolean;
  quantityInterval: Nhm2SphericalDirectedIntervalV1;
  tag: Tag;
  termIntervals: readonly Nhm2SphericalNamedIntervalV1[];
}>;

type Nhm2SphericalTailDutyPayloadV1<
  Tag extends string,
  Predicate extends string,
> = Readonly<{
  coordinateOrder: readonly ["y", "gamma"];
  fiberGammaOrder: readonly [0, 1, 2];
  flatEnvelopeIntervals: readonly (readonly Nhm2SphericalNamedIntervalV1[])[];
  predicate: Predicate;
  predicateSatisfied: boolean;
  quantityInterval: Nhm2SphericalDirectedIntervalV1;
  tag: Tag;
}> &
  (
    | Readonly<{
        deltaExact: string;
        entryKind: "endpoint_candidate";
      }>
    | Readonly<{
        deltaExact: null;
        entryKind: "interval_cover";
      }>
  );

export type Nhm2SphericalRadiiDutyPayloadV1 = Readonly<{
  YUpper: Nhm2SphericalDirectedEndpointV1;
  Z0Upper: Nhm2SphericalDirectedEndpointV1;
  Z1Upper: Nhm2SphericalDirectedEndpointV1;
  ZAtRadiusUpper: Nhm2SphericalDirectedEndpointV1;
  inverseDefectUpper: Nhm2SphericalDirectedEndpointV1;
  pUpper: Nhm2SphericalDirectedEndpointV1;
  projectionTailUpper: Nhm2SphericalDirectedEndpointV1;
  radiusExact: string;
  resonanceMargins: readonly Nhm2SphericalNamedIntervalV1[];
  selected: boolean;
  strictlyValid: boolean;
  tag: "exterior_projected_radii_polynomial/v1";
}>;

export type Nhm2SphericalJoinDutyPayloadV1 = Readonly<{
  H1: Nhm2SphericalDirectedIntervalV1;
  Hy1: Nhm2SphericalDirectedIntervalV1;
  Q1: Nhm2SphericalDirectedIntervalV1;
  Qy1: Nhm2SphericalDirectedIntervalV1;
  U: Nhm2SphericalDirectedIntervalV1;
  U1: Nhm2SphericalDirectedIntervalV1;
  V: Nhm2SphericalDirectedIntervalV1;
  V1: Nhm2SphericalDirectedIntervalV1;
  leftPdeLimits: readonly [
    Nhm2SphericalNamedIntervalV1,
    Nhm2SphericalNamedIntervalV1,
  ];
  predicateSatisfied: boolean;
  rightPdeLimits: readonly [
    Nhm2SphericalNamedIntervalV1,
    Nhm2SphericalNamedIntervalV1,
  ];
  tag: "C1_join_and_one_sided_limits/v1";
  valueDerivativeJumps: readonly [
    Nhm2SphericalNamedIntervalV1,
    Nhm2SphericalNamedIntervalV1,
    Nhm2SphericalNamedIntervalV1,
    Nhm2SphericalNamedIntervalV1,
  ];
}>;

export type Nhm2SphericalMassSummaryValuesV1 = Readonly<{
  C: Nhm2SphericalDirectedIntervalV1;
  N: Nhm2SphericalDirectedIntervalV1;
  NCore: Nhm2SphericalDirectedIntervalV1;
  NTail: Nhm2SphericalDirectedIntervalV1;
  massDefect: Nhm2SphericalDirectedIntervalV1;
  normalizedMassDefect: Nhm2SphericalDirectedIntervalV1;
}>;

export type Nhm2SphericalIdentityResidualsV1 = Readonly<{
  eigenvalue: Nhm2SphericalDirectedIntervalV1;
  gaussFlux: Nhm2SphericalDirectedIntervalV1;
  poissonEnergy: Nhm2SphericalDirectedIntervalV1;
  virial: Nhm2SphericalDirectedIntervalV1;
}>;

export type Nhm2SphericalGlobalIdentitySummaryValuesV1 = Readonly<{
  C: Nhm2SphericalDirectedIntervalV1;
  N: Nhm2SphericalDirectedIntervalV1;
  T: Nhm2SphericalDirectedIntervalV1;
  W: Nhm2SphericalDirectedIntervalV1;
  gaussFlux: Nhm2SphericalDirectedIntervalV1;
  identityResiduals: Nhm2SphericalIdentityResidualsV1;
  potentialGradient: Nhm2SphericalDirectedIntervalV1;
}>;

type Nhm2SphericalIntegralDutyPayloadV1<
  Tag extends string,
  CoreIntegralId extends string,
  TailIntegralId extends string,
  SummaryIntegralId extends string,
  SummaryPredicate extends string,
  SummaryValues,
> =
  | Readonly<{
      combinedInterval: Nhm2SphericalDirectedIntervalV1;
      coreInterval: Nhm2SphericalDirectedIntervalV1;
      integralId: CoreIntegralId;
      integrationRegion: "core_box";
      normalizationInterval: null;
      predicate: "integral_cell_enclosed";
      predicateSatisfied: null;
      residualInterval: null;
      summaryValues: null;
      tag: Tag;
      tailInterval: null;
    }>
  | Readonly<{
      combinedInterval: Nhm2SphericalDirectedIntervalV1;
      coreInterval: null;
      integralId: TailIntegralId;
      integrationRegion: "tail_box";
      normalizationInterval: null;
      predicate: "integral_cell_enclosed";
      predicateSatisfied: null;
      residualInterval: null;
      summaryValues: null;
      tag: Tag;
      tailInterval: Nhm2SphericalDirectedIntervalV1;
    }>
  | Readonly<{
      combinedInterval: Nhm2SphericalDirectedIntervalV1;
      coreInterval: null;
      integralId: SummaryIntegralId;
      integrationRegion: "summary";
      normalizationInterval: Nhm2SphericalDirectedIntervalV1;
      predicate: SummaryPredicate;
      predicateSatisfied: boolean;
      residualInterval: Nhm2SphericalDirectedIntervalV1;
      summaryValues: SummaryValues;
      tag: Tag;
      tailInterval: null;
    }>;

export type Nhm2SphericalScalingDutyPayloadV1 = Readonly<{
  CStar: Nhm2SphericalDirectedIntervalV1;
  analyticBvpMapBinding: Nhm2SphericalHashBindingV1;
  continuousMaximum: Nhm2SphericalDirectedIntervalV1;
  kappaStar: Nhm2SphericalDirectedIntervalV1;
  lambda: Nhm2SphericalDirectedIntervalV1;
  nuStar: Nhm2SphericalDirectedIntervalV1;
  potentialScalingDefect: Nhm2SphericalDirectedIntervalV1;
  predicateSatisfied: boolean;
  scalarScalingDefect: Nhm2SphericalDirectedIntervalV1;
  sigmaStar: Nhm2SphericalDirectedIntervalV1;
  tag: "target_scaling_maximum_and_bvp_map/v1";
  targetAmplitude: Nhm2SphericalDirectedIntervalV1;
  wSeed: Nhm2SphericalDirectedIntervalV1;
}>;

type Nhm2SphericalDutyRecordV1<
  Ordinal extends number,
  DutyId extends string,
  RecordTag extends string,
  RecordKind extends string,
  Decision extends string,
  Payload,
> = Readonly<{
  candidateId: string;
  decision: Decision;
  depth: number | null;
  directedProofOperatorBinding: Nhm2SphericalPolicyBindingV1;
  directedProofPolicyBinding: Nhm2SphericalPolicyBindingV1;
  domainBox: readonly Nhm2SphericalDirectedIntervalV1[] | null;
  dutyId: DutyId;
  dutyOrdinal: Ordinal;
  implementationRole: "primary_verifier" | "independent_verifier";
  inputBindingSha256: string;
  interchangePolicyBinding: Nhm2SphericalPolicyBindingV1;
  operationPrepolicyBinding: Nhm2SphericalPolicyBindingV1;
  parentRecordOrdinal: number | null;
  payload: Payload;
  payloadSha256: string;
  recordKind: RecordKind;
  recordOrdinal: number;
  recordTag: RecordTag;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_directed_record/v1";
  semanticSeedBinding: Nhm2SphericalPolicyBindingV1;
}>;

type Nhm2SphericalTailDutyRecordV1<
  Ordinal extends number,
  DutyId extends string,
  RecordTag extends string,
  Predicate extends string,
> =
  | Nhm2SphericalDutyRecordV1<
      Ordinal,
      DutyId,
      RecordTag,
      "endpoint_candidate",
      "accept" | "reject",
      Extract<
        Nhm2SphericalTailDutyPayloadV1<RecordTag, Predicate>,
        { entryKind: "endpoint_candidate" }
      >
    >
  | Nhm2SphericalDutyRecordV1<
      Ordinal,
      DutyId,
      RecordTag,
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Extract<
        Nhm2SphericalTailDutyPayloadV1<RecordTag, Predicate>,
        { entryKind: "interval_cover" }
      >
    >;

type Nhm2SphericalIntegralDutyRecordV1<
  Ordinal extends number,
  DutyId extends string,
  RecordTag extends string,
  CoreIntegralId extends string,
  TailIntegralId extends string,
  SummaryIntegralId extends string,
  SummaryPredicate extends string,
  SummaryValues,
> =
  | Nhm2SphericalDutyRecordV1<
      Ordinal,
      DutyId,
      RecordTag,
      "integral_box",
      "accept" | "budget_exhausted" | "reject" | "split",
      Extract<
        Nhm2SphericalIntegralDutyPayloadV1<
          RecordTag,
          CoreIntegralId,
          TailIntegralId,
          SummaryIntegralId,
          SummaryPredicate,
          SummaryValues
        >,
        { integrationRegion: "core_box" | "tail_box" }
      >
    >
  | Nhm2SphericalDutyRecordV1<
      Ordinal,
      DutyId,
      RecordTag,
      "summary",
      "accept" | "reject",
      Extract<
        Nhm2SphericalIntegralDutyPayloadV1<
          RecordTag,
          CoreIntegralId,
          TailIntegralId,
          SummaryIntegralId,
          SummaryPredicate,
          SummaryValues
        >,
        { integrationRegion: "summary" }
      >
    >;

export type Nhm2SphericalDirectedProofRecordV1 =
  | Nhm2SphericalDutyRecordV1<
      0,
      "origin_recurrence_and_remainder",
      "origin_recurrence_and_remainder/v1",
      "coefficient",
      "accept" | "reject",
      Nhm2SphericalOriginCoefficientDutyPayloadV1
    >
  | Nhm2SphericalDutyRecordV1<
      0,
      "origin_recurrence_and_remainder",
      "origin_recurrence_and_remainder/v1",
      "radius",
      "invalid_radius" | "selected_radius" | "valid_not_selected",
      Nhm2SphericalOriginRadiusDutyPayloadV1
    >
  | Nhm2SphericalDutyRecordV1<
      1,
      "core_normalized_schrodinger",
      "core_normalized_schrodinger/v1",
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Nhm2SphericalCoreDutyPayloadV1<
        "core_normalized_schrodinger/v1",
        "core_normalized_schrodinger",
        "absolute_upper_less_than_or_equal_to_1e-10",
        Nhm2SphericalDirectedIntervalV1
      >
    >
  | Nhm2SphericalDutyRecordV1<
      2,
      "core_normalized_poisson",
      "core_normalized_poisson/v1",
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Nhm2SphericalCoreDutyPayloadV1<
        "core_normalized_poisson/v1",
        "core_normalized_poisson",
        "absolute_upper_less_than_or_equal_to_1e-10",
        Nhm2SphericalDirectedIntervalV1
      >
    >
  | Nhm2SphericalDutyRecordV1<
      3,
      "core_scalar_strict_positivity",
      "core_scalar_strict_positivity/v1",
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Nhm2SphericalCoreDutyPayloadV1<
        "core_scalar_strict_positivity/v1",
        "core_scalar_u",
        "lower_strictly_positive",
        null
      >
    >
  | Nhm2SphericalDutyRecordV1<
      4,
      "core_scalar_strict_decrease",
      "core_scalar_strict_decrease/v1",
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Nhm2SphericalCoreDutyPayloadV1<
        "core_scalar_strict_decrease/v1",
        "negative_core_scalar_derivative",
        "lower_strictly_positive",
        null
      >
    >
  | Nhm2SphericalDutyRecordV1<
      5,
      "core_potential_strict_negativity",
      "core_potential_strict_negativity/v1",
      "interval_cover",
      "accept" | "budget_exhausted" | "reject" | "split",
      Nhm2SphericalCoreDutyPayloadV1<
        "core_potential_strict_negativity/v1",
        "core_potential_V",
        "upper_strictly_negative",
        null
      >
    >
  | Nhm2SphericalDutyRecordV1<
      6,
      "exterior_projected_radii_polynomial",
      "exterior_projected_radii_polynomial/v1",
      "radii_polynomial",
      "invalid_radius" | "selected_radius" | "valid_not_selected",
      Nhm2SphericalRadiiDutyPayloadV1
    >
  | Nhm2SphericalTailDutyRecordV1<
      7,
      "exterior_full_scaled_schrodinger",
      "exterior_full_scaled_schrodinger/v1",
      "quantity_interval_contains_zero"
    >
  | Nhm2SphericalTailDutyRecordV1<
      8,
      "exterior_full_scaled_poisson",
      "exterior_full_scaled_poisson/v1",
      "quantity_interval_contains_zero"
    >
  | Nhm2SphericalTailDutyRecordV1<
      9,
      "exterior_H_strict_positivity",
      "exterior_H_strict_positivity/v1",
      "lower_strictly_positive"
    >
  | Nhm2SphericalTailDutyRecordV1<
      10,
      "exterior_scalar_strict_decrease",
      "exterior_scalar_strict_decrease/v1",
      "lower_strictly_positive"
    >
  | Nhm2SphericalTailDutyRecordV1<
      11,
      "exterior_potential_open_endpoint_negativity",
      "exterior_potential_open_endpoint_negativity/v1",
      "upper_strictly_negative_on_the_declared_open_domain"
    >
  | Nhm2SphericalDutyRecordV1<
      12,
      "C1_join_and_one_sided_limits",
      "C1_join_and_one_sided_limits/v1",
      "join",
      "accept" | "reject",
      Nhm2SphericalJoinDutyPayloadV1
    >
  | Nhm2SphericalIntegralDutyRecordV1<
      13,
      "mass_and_coulomb_consistency",
      "mass_and_coulomb_consistency/v1",
      "N_core",
      "N_tail",
      "mass_coulomb_summary",
      "directed_relative_mass_and_Coulomb_residual_at_most_1e-9",
      Nhm2SphericalMassSummaryValuesV1
    >
  | Nhm2SphericalIntegralDutyRecordV1<
      14,
      "global_integral_identities",
      "global_integral_identities/v1",
      "T_core" | "W_core" | "potentialGradient_core",
      "T_tail" | "W_tail" | "potentialGradient_tail",
      "global_identity_summary",
      "all_four_directed_relative_identity_residuals_at_most_1e-9",
      Nhm2SphericalGlobalIdentitySummaryValuesV1
    >
  | Nhm2SphericalDutyRecordV1<
      15,
      "target_scaling_maximum_and_bvp_map",
      "target_scaling_maximum_and_bvp_map/v1",
      "scaling_and_bvp",
      "accept" | "reject",
      Nhm2SphericalScalingDutyPayloadV1
    >;

type Nhm2SphericalPrimaryPayloadBindingForV1<
  Path extends string,
  SemanticRole extends string,
  ElementCount extends number,
  SizeBytes extends number,
> = Readonly<{
  elementCount: ElementCount;
  elementType: "IEEE754_binary64_little_endian";
  path: Path;
  payloadSha256: string;
  rawSha256: string;
  semanticRole: SemanticRole;
  sizeBytes: SizeBytes;
}>;

export type Nhm2SphericalPrimaryPayloadBindingV1 =
  | Nhm2SphericalPrimaryPayloadBindingForV1<
      "scalars.f64le",
      "primary_scalar_operands",
      9,
      72
    >
  | Nhm2SphericalPrimaryPayloadBindingForV1<
      "coefficients/core_L2_u.f64le",
      "primary_L2_scalar_Chebyshev_coefficients",
      128,
      1024
    >
  | Nhm2SphericalPrimaryPayloadBindingForV1<
      "coefficients/core_L2_V.f64le",
      "primary_L2_potential_Chebyshev_coefficients",
      128,
      1024
    >
  | Nhm2SphericalPrimaryPayloadBindingForV1<
      "coefficients/tail_H.f64le",
      "primary_tail_H_Chebyshev_coefficients",
      32,
      256
    >
  | Nhm2SphericalPrimaryPayloadBindingForV1<
      "coefficients/tail_Q.f64le",
      "primary_tail_Q_Chebyshev_coefficients",
      32,
      256
    >;

export type Nhm2SphericalFileStatV1 = Readonly<{
  changeTimeNanoseconds: string;
  device: string;
  inode: string;
  modeOctal: string;
  modifyTimeNanoseconds: string;
  sha256: string;
  sizeBytes: number;
}>;

export type Nhm2SphericalFreshnessObservationV1 = Readonly<{
  path: string;
  postread: Nhm2SphericalFileStatV1;
  preopen: Nhm2SphericalFileStatV1;
  stable: true;
}>;

export type Nhm2SphericalRunTimingV1 = Readonly<{
  monotonicElapsedNanoseconds: string;
  monotonicEndNanoseconds: string;
  monotonicStartNanoseconds: string;
  wallEndUtc: string;
  wallStartUtc: string;
}>;

export type Nhm2SphericalRunProvenanceV1 = Readonly<{
  commandArgv: readonly [string, ...string[]];
  commit40: string;
  dirtyTreeDigestSha256: string;
  executableBinding: Nhm2SphericalHashBindingV1;
  freshnessObservations: readonly Nhm2SphericalFreshnessObservationV1[];
  outputRootIdentitySha256: string;
  preexecutionPresealBinding: Nhm2SphericalHashBindingV1;
  runtimeManifestBinding: Nhm2SphericalHashBindingV1;
  sourceManifestBinding: Nhm2SphericalHashBindingV1;
  timing: Nhm2SphericalRunTimingV1;
  toolchainManifestBinding: Nhm2SphericalHashBindingV1;
}>;

export type Nhm2SphericalPolicyBindingsV1 = Readonly<{
  directedProofArchitecture: Nhm2SphericalPolicyBindingV1;
  directedProofOperator: Nhm2SphericalPolicyBindingV1;
  interchangePolicy: Nhm2SphericalPolicyBindingV1;
  operationPrepolicy: Nhm2SphericalPolicyBindingV1;
  primaryNumericsPolicy: Nhm2SphericalPolicyBindingV1;
  semanticSeed: Nhm2SphericalPolicyBindingV1;
}>;

export type Nhm2SphericalPrimaryPayloadBindingsTupleV1 = readonly [
  Extract<Nhm2SphericalPrimaryPayloadBindingV1, { path: "scalars.f64le" }>,
  Extract<
    Nhm2SphericalPrimaryPayloadBindingV1,
    { path: "coefficients/core_L2_u.f64le" }
  >,
  Extract<
    Nhm2SphericalPrimaryPayloadBindingV1,
    { path: "coefficients/core_L2_V.f64le" }
  >,
  Extract<
    Nhm2SphericalPrimaryPayloadBindingV1,
    { path: "coefficients/tail_H.f64le" }
  >,
  Extract<
    Nhm2SphericalPrimaryPayloadBindingV1,
    { path: "coefficients/tail_Q.f64le" }
  >,
];

export type Nhm2SphericalPrimaryCandidateDescriptorV1 = Readonly<{
  attemptOrdinal: 1;
  authorityFalse: true;
  candidateId: string;
  orderedPayloadBindings: Nhm2SphericalPrimaryPayloadBindingsTupleV1;
  policyBindings: Nhm2SphericalPolicyBindingsV1;
  provenance: Nhm2SphericalRunProvenanceV1;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_descriptor/v1";
}>;

export type Nhm2SphericalProvenanceManifestRoleV1 =
  | "primary_source"
  | "primary_toolchain"
  | "primary_runtime"
  | "independent_source"
  | "independent_toolchain"
  | "independent_runtime";

export type Nhm2SphericalProvenanceManifestV1 = Readonly<{
  aggregateSha256: string;
  authorityFalse: true;
  entries: readonly [
    Nhm2SphericalHashBindingV1,
    ...Nhm2SphericalHashBindingV1[],
  ];
  role: Nhm2SphericalProvenanceManifestRoleV1;
  schemaVersion: "nhm2_spherical_seed_provenance_manifest/v1";
}>;

export type Nhm2SphericalPreexecutionPresealV1 = Readonly<{
  attemptOrdinal: 1;
  authorityFalse: true;
  candidateId: string;
  commandArgvSha256: string;
  commit40: string;
  createdMonotonicNanoseconds: string;
  createdWallUtc: string;
  dirtyTreeDigestSha256: string;
  executableBinding: Nhm2SphericalHashBindingV1;
  policyBindings: Nhm2SphericalPolicyBindingsV1;
  runtimeManifestBinding: Nhm2SphericalHashBindingV1;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_preexecution_preseal/v1";
  sourceManifestBinding: Nhm2SphericalHashBindingV1;
  staticInputAggregateSha256: string;
  toolchainManifestBinding: Nhm2SphericalHashBindingV1;
}>;

export type Nhm2SphericalPreparedPublicationV1 = Readonly<{
  finalRoot: string;
  parentDirectoryFsyncRequired: true;
  publicationMethod: "renameat2_RENAME_NOREPLACE_then_parent_fsync";
  publicationPreparedWallUtc: string;
  tempRootNonceSha256: string;
}>;

export type Nhm2SphericalPrimaryCandidateReceiptV1 = Readonly<{
  authorityFalse: true;
  candidateId: string;
  descriptorBinding: Nhm2SphericalHashBindingV1;
  inputBindingSha256: string;
  orderedPayloadBindings: Nhm2SphericalPrimaryPayloadBindingsTupleV1;
  publication: Nhm2SphericalPreparedPublicationV1;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_receipt/v1";
}>;

export type Nhm2SphericalProofConclusionV1 =
  | Readonly<{
      authorityFalse: true;
      selectedRadiusExact: string;
      tag: "all_directed_duties_passed_without_seed_or_solution_authority";
    }>
  | Readonly<{
      authorityFalse: true;
      code: string;
      detailSha256: string | null;
      dutyId: string;
      dutyOrdinal: number;
      recordOrdinal: number | null;
      tag: "first_failure";
    }>;

export type Nhm2SphericalRouteStreamBindingV1 = Readonly<{
  firstRecordOrdinalByDuty: readonly (number | null)[];
  lastRecordOrdinalByDuty: readonly (number | null)[];
  path:
    | "proof/origin.jsonl"
    | "proof/core-intervals.jsonl"
    | "proof/tail-intervals.jsonl"
    | "proof/integrals.jsonl"
    | "proof/scaling-and-bvp-init.jsonl";
  rawSha256: string;
  recordCount: number;
  routeStreamSha256: string;
  sizeBytes: number;
}>;

export type Nhm2SphericalDutyCountV1 = Readonly<{
  acceptedCount: number;
  dutyId: string;
  dutyOrdinal: number;
  recordCount: number;
  splitCount: number;
  terminalFailureCount: number;
}>;

export type Nhm2SphericalDirectedProofSummaryV1 = Readonly<{
  authorityFalse: true;
  candidateId: string;
  directedProofOperatorBinding: Nhm2SphericalPolicyBindingV1;
  directedProofPolicyBinding: Nhm2SphericalPolicyBindingV1;
  dutyCounts: readonly [
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
    Nhm2SphericalDutyCountV1,
  ];
  firstFailureOrAllPassed: Nhm2SphericalProofConclusionV1;
  implementationRole: "primary_verifier" | "independent_verifier";
  inputBindingSha256: string;
  interchangePolicyBinding: Nhm2SphericalPolicyBindingV1;
  operationPrepolicyBinding: Nhm2SphericalPolicyBindingV1;
  provenance: Nhm2SphericalRunProvenanceV1;
  routeStreamBindings: readonly [
    Nhm2SphericalRouteStreamBindingV1,
    Nhm2SphericalRouteStreamBindingV1,
    Nhm2SphericalRouteStreamBindingV1,
    Nhm2SphericalRouteStreamBindingV1,
    Nhm2SphericalRouteStreamBindingV1,
  ];
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_directed_proof_summary/v1";
  semanticSeedBinding: Nhm2SphericalPolicyBindingV1;
}>;

export type Nhm2SphericalAgreementConclusionV1 =
  | Readonly<{
      authorityFalse: true;
      normalizedRecordCount: number;
      tag: "all_normalized_proof_records_and_conclusions_identical_without_candidate_authority";
    }>
  | Readonly<{
      authorityFalse: true;
      dutyOrdinal: number | null;
      fieldPath: string;
      independentValueSha256: string;
      primaryValueSha256: string;
      recordOrdinal: number | null;
      tag: "first_normalized_mismatch";
    }>;

export type Nhm2SphericalAgreementReceiptV1 = Readonly<{
  agreementSha256: string;
  authorityFalse: true;
  candidateId: string;
  comparisonConclusion: Nhm2SphericalAgreementConclusionV1;
  directedProofOperatorBinding: Nhm2SphericalPolicyBindingV1;
  directedProofPolicyBinding: Nhm2SphericalPolicyBindingV1;
  independentSummaryBinding: Nhm2SphericalHashBindingV1;
  inputBindingSha256: string;
  interchangePolicyBinding: Nhm2SphericalPolicyBindingV1;
  operationPrepolicyBinding: Nhm2SphericalPolicyBindingV1;
  primarySummaryBinding: Nhm2SphericalHashBindingV1;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_proof_agreement/v1";
  semanticSeedBinding: Nhm2SphericalPolicyBindingV1;
}>;

export type Nhm2SphericalFailureStageV1 =
  | "binding"
  | "inventory"
  | "json_parse"
  | "forbidden_role"
  | "provenance"
  | "freshness"
  | "numeric_decode"
  | "primary_execution"
  | "primary_publication"
  | "directed_proof"
  | "independent_replay"
  | "agreement"
  | "failure_publication";

export type Nhm2SphericalFailureCodeV1 =
  | "policy_binding_mismatch"
  | "inventory_mismatch"
  | "path_or_file_metadata_violation"
  | "json_not_strict_utf8_or_canonical"
  | "json_duplicate_key"
  | "parser_limit_exceeded"
  | "json_schema_mismatch"
  | "forbidden_lever_or_tile_role"
  | "source_manifest_mismatch"
  | "toolchain_manifest_mismatch"
  | "executable_or_runtime_closure_mismatch"
  | "preexecution_preseal_mismatch"
  | "commit_or_dirty_tree_mismatch"
  | "command_or_timing_mismatch"
  | "freshness_mismatch"
  | "numeric_payload_hash_or_shape_mismatch"
  | "numeric_payload_nonfinite"
  | "numeric_payload_negative_zero"
  | "resource_preflight_failure"
  | "primary_execution_failure"
  | "primary_publication_failure"
  | "directed_operator_failure"
  | "directed_proof_budget_exhausted"
  | "directed_proof_predicate_failure"
  | "independent_replay_failure"
  | "independent_agreement_failure"
  | "failure_publication_failure";

export type Nhm2SphericalFailureReceiptV1 = Readonly<{
  attemptOrdinal: 1;
  authorityFalse: true;
  candidateId: string;
  commandArgvSha256: string;
  commit40: string;
  detailSha256: string | null;
  failureCode: Nhm2SphericalFailureCodeV1;
  failureStage: Nhm2SphericalFailureStageV1;
  interchangePolicyBinding: Nhm2SphericalPolicyBindingV1;
  monotonicElapsedNanoseconds: string;
  primaryInputBindingSha256: string | null;
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_failure_receipt/v1";
  wallEndUtc: string;
  wallStartUtc: string;
}>;

const SEMANTIC_SEED_POLICY_BINDING = Object.freeze({
  artifactId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.artifactId,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.canonicalSizeBytes,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.contractVersion,
  sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.sha256,
  sha256Domain:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING.sha256Domain,
} as const);

const OPERATION_PREPOLICY_POLICY_BINDING = Object.freeze({
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING.artifactId,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING.canonicalSizeBytes,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING.policyVersion,
  sha256:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING.sha256,
  sha256Domain:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_BINDING.sha256Domain,
} as const);

const DIRECTED_PROOF_POLICY_BINDING = Object.freeze({
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.artifactId,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.canonicalSizeBytes,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.policyVersion,
  sha256:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.sha256,
  sha256Domain:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_BINDING.sha256Domain,
} as const);

const PRIMARY_NUMERICS_POLICY_BINDING = Object.freeze({
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.artifactId,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.canonicalSizeBytes,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.policyVersion,
  sha256:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256,
  sha256Domain:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_BINDING.sha256Domain,
} as const);

const DIRECTED_PROOF_OPERATOR_POLICY_BINDING = Object.freeze({
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.artifactId,
  canonicalSizeBytes:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.canonicalSizeBytes,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.policyVersion,
  sha256:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.sha256,
  sha256Domain:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_BINDING.sha256Domain,
} as const);

const DUTY_DEFINITIONS = Object.freeze([
  Object.freeze({
    ordinal: 0,
    dutyId: "origin_recurrence_and_remainder",
    payloadTag: "origin_recurrence_and_remainder/v1",
    route: "proof/origin.jsonl",
    recordKinds: Object.freeze(["coefficient", "radius"]),
    allowedDecisions: Object.freeze([
      "accept",
      "reject",
      "invalid_radius",
      "selected_radius",
      "valid_not_selected",
    ]),
    population:
      "exactly_34_coefficient_records_then_exactly_61_radius_records_equals_95",
    payloadExactKeys: Object.freeze([
      "bounds",
      "coefficientId",
      "coefficientInterval",
      "entryKind",
      "predicate",
      "predicateSatisfied",
      "radiusExact",
      "recurrenceTerms",
      "tag",
    ]),
  }),
  Object.freeze({
    ordinal: 1,
    dutyId: "core_normalized_schrodinger",
    payloadTag: "core_normalized_schrodinger/v1",
    route: "proof/core-intervals.jsonl",
    recordKinds: Object.freeze(["interval_cover"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population: "one_per_popped_box_minimum_1_maximum_262144",
    payloadExactKeys: Object.freeze([
      "coordinateOrder",
      "expressionId",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "quantityInterval",
      "tag",
      "termIntervals",
    ]),
  }),
  Object.freeze({
    ordinal: 2,
    dutyId: "core_normalized_poisson",
    payloadTag: "core_normalized_poisson/v1",
    route: "proof/core-intervals.jsonl",
    recordKinds: Object.freeze(["interval_cover"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population: "one_per_popped_box_minimum_1_maximum_262144",
    payloadExactKeys: Object.freeze([
      "coordinateOrder",
      "expressionId",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "quantityInterval",
      "tag",
      "termIntervals",
    ]),
  }),
  Object.freeze({
    ordinal: 3,
    dutyId: "core_scalar_strict_positivity",
    payloadTag: "core_scalar_strict_positivity/v1",
    route: "proof/core-intervals.jsonl",
    recordKinds: Object.freeze(["interval_cover"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population: "one_per_popped_box_minimum_1_maximum_262144",
    payloadExactKeys: Object.freeze([
      "coordinateOrder",
      "expressionId",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "quantityInterval",
      "tag",
      "termIntervals",
    ]),
  }),
  Object.freeze({
    ordinal: 4,
    dutyId: "core_scalar_strict_decrease",
    payloadTag: "core_scalar_strict_decrease/v1",
    route: "proof/core-intervals.jsonl",
    recordKinds: Object.freeze(["interval_cover"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population: "one_per_popped_box_minimum_1_maximum_262144",
    payloadExactKeys: Object.freeze([
      "coordinateOrder",
      "expressionId",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "quantityInterval",
      "tag",
      "termIntervals",
    ]),
  }),
  Object.freeze({
    ordinal: 5,
    dutyId: "core_potential_strict_negativity",
    payloadTag: "core_potential_strict_negativity/v1",
    route: "proof/core-intervals.jsonl",
    recordKinds: Object.freeze(["interval_cover"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population: "one_per_popped_box_minimum_1_maximum_262144",
    payloadExactKeys: Object.freeze([
      "coordinateOrder",
      "expressionId",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "quantityInterval",
      "tag",
      "termIntervals",
    ]),
  }),
  Object.freeze({
    ordinal: 6,
    dutyId: "exterior_projected_radii_polynomial",
    payloadTag: "exterior_projected_radii_polynomial/v1",
    route: "proof/tail-intervals.jsonl",
    recordKinds: Object.freeze(["radii_polynomial"]),
    allowedDecisions: Object.freeze([
      "invalid_radius",
      "selected_radius",
      "valid_not_selected",
    ]),
    population: "exactly_61_records_in_radius_order_2^-80_through_2^-20",
    payloadExactKeys: Object.freeze([
      "YUpper",
      "Z0Upper",
      "Z1Upper",
      "ZAtRadiusUpper",
      "inverseDefectUpper",
      "pUpper",
      "projectionTailUpper",
      "radiusExact",
      "resonanceMargins",
      "selected",
      "strictlyValid",
      "tag",
    ]),
  }),
  ...[
    [7, "exterior_full_scaled_schrodinger"],
    [8, "exterior_full_scaled_poisson"],
    [9, "exterior_H_strict_positivity"],
    [10, "exterior_scalar_strict_decrease"],
    [11, "exterior_potential_open_endpoint_negativity"],
  ].map(([ordinal, dutyId]) =>
    Object.freeze({
      ordinal: ordinal as number,
      dutyId: dutyId as string,
      payloadTag: `${dutyId}/v1`,
      route: "proof/tail-intervals.jsonl",
      recordKinds: Object.freeze(["endpoint_candidate", "interval_cover"]),
      allowedDecisions: Object.freeze([
        "accept",
        "split",
        "reject",
        "budget_exhausted",
      ]),
      population:
        "exactly_61_endpoint_candidate_records_then_one_per_popped_cover_box_minimum_1_maximum_262144",
      payloadExactKeys: Object.freeze([
        "coordinateOrder",
        "deltaExact",
        "entryKind",
        "fiberGammaOrder",
        "flatEnvelopeIntervals",
        "predicate",
        "predicateSatisfied",
        "quantityInterval",
        "tag",
      ]),
    }),
  ),
  Object.freeze({
    ordinal: 12,
    dutyId: "C1_join_and_one_sided_limits",
    payloadTag: "C1_join_and_one_sided_limits/v1",
    route: "proof/tail-intervals.jsonl",
    recordKinds: Object.freeze(["join"]),
    allowedDecisions: Object.freeze(["accept", "reject"]),
    population: "exactly_1",
    payloadExactKeys: Object.freeze([
      "H1",
      "Hy1",
      "Q1",
      "Qy1",
      "U",
      "U1",
      "V",
      "V1",
      "leftPdeLimits",
      "predicateSatisfied",
      "rightPdeLimits",
      "tag",
      "valueDerivativeJumps",
    ]),
  }),
  Object.freeze({
    ordinal: 13,
    dutyId: "mass_and_coulomb_consistency",
    payloadTag: "mass_and_coulomb_consistency/v1",
    route: "proof/integrals.jsonl",
    recordKinds: Object.freeze(["integral_box", "summary"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population:
      "exactly_1_summary_plus_1_through_196000_N_core_boxes_plus_1_through_196000_N_tail_boxes",
    payloadExactKeys: Object.freeze([
      "combinedInterval",
      "coreInterval",
      "integralId",
      "integrationRegion",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "residualInterval",
      "summaryValues",
      "tag",
      "tailInterval",
    ]),
  }),
  Object.freeze({
    ordinal: 14,
    dutyId: "global_integral_identities",
    payloadTag: "global_integral_identities/v1",
    route: "proof/integrals.jsonl",
    recordKinds: Object.freeze(["integral_box", "summary"]),
    allowedDecisions: Object.freeze([
      "accept",
      "split",
      "reject",
      "budget_exhausted",
    ]),
    population:
      "exactly_1_summary_plus_1_through_196000_boxes_for_each_of_T_core_T_tail_W_core_W_tail_potentialGradient_core_potentialGradient_tail",
    payloadExactKeys: Object.freeze([
      "combinedInterval",
      "coreInterval",
      "integralId",
      "integrationRegion",
      "normalizationInterval",
      "predicate",
      "predicateSatisfied",
      "residualInterval",
      "summaryValues",
      "tag",
      "tailInterval",
    ]),
  }),
  Object.freeze({
    ordinal: 15,
    dutyId: "target_scaling_maximum_and_bvp_map",
    payloadTag: "target_scaling_maximum_and_bvp_map/v1",
    route: "proof/scaling-and-bvp-init.jsonl",
    recordKinds: Object.freeze(["scaling_and_bvp"]),
    allowedDecisions: Object.freeze(["accept", "reject"]),
    population: "exactly_1",
    payloadExactKeys: Object.freeze([
      "CStar",
      "analyticBvpMapBinding",
      "continuousMaximum",
      "kappaStar",
      "lambda",
      "nuStar",
      "potentialScalingDefect",
      "predicateSatisfied",
      "scalarScalingDefect",
      "sigmaStar",
      "tag",
      "targetAmplitude",
      "wSeed",
    ]),
  }),
] as const);

const CORE_COVER_PAYLOAD_FIELD_TYPES = Object.freeze({
  coordinateOrder: "literal_tuple_[x]",
  expressionId: "duty-specific_closed_ASCII_literal",
  normalizationInterval: "directedInterval_or_null_as_declared_by_duty",
  predicate: "duty-specific_closed_ASCII_literal",
  predicateSatisfied: "boolean_recomputed_from_the_whole_quantityInterval",
  quantityInterval: "directedInterval",
  tag: "literal_payloadTag",
  termIntervals: "ordered_tuple_of_namedInterval_in_frozen_expression_order",
});

const TAIL_COVER_PAYLOAD_FIELD_TYPES = Object.freeze({
  coordinateOrder: "literal_tuple_[y,gamma]",
  deltaExact: "exactDyadic_or_null_with_nonnull_exactly_for_endpoint_candidate",
  entryKind: "endpoint_candidate|interval_cover",
  fiberGammaOrder: "literal_tuple_[0,1,2]",
  flatEnvelopeIntervals:
    "ordered_tuple_of_namedInterval_in_gamma_order_outer_then_expression_component_inner",
  predicate: "duty-specific_closed_ASCII_literal",
  predicateSatisfied: "boolean_recomputed_from_the_whole_quantityInterval",
  quantityInterval: "directedInterval",
  tag: "literal_payloadTag",
});

const INTEGRAL_PAYLOAD_FIELD_TYPES = Object.freeze({
  combinedInterval: "directedInterval",
  coreInterval: "directedInterval_or_null_for_a_tail-only_box",
  integralId: "duty-specific_closed_ASCII_literal",
  integrationRegion: "core_box|tail_box|summary",
  normalizationInterval: "directedInterval_or_null",
  predicate: "duty-specific_closed_ASCII_literal",
  predicateSatisfied:
    "boolean_or_null_with_boolean_required_only_for_the_summary_record",
  residualInterval: "directedInterval_or_null_for_non-summary_box_records",
  summaryValues: "duty-specific_exact_summary_object_or_null_for_box_records",
  tag: "literal_payloadTag",
  tailInterval: "directedInterval_or_null_for_a_core-only_box",
});

const DUTY_PAYLOAD_FIELD_TYPES = Object.freeze({
  origin_recurrence_and_remainder: Object.freeze({
    bounds:
      "exact_bounds_object_or_null_with_nonnull_exactly_for_entryKind_radius",
    coefficientId:
      "a0|b0|a2|b2|...|a32|b32_or_null_with_nonnull_exactly_for_entryKind_coefficient",
    coefficientInterval:
      "directedInterval_or_null_with_nonnull_exactly_for_entryKind_coefficient",
    entryKind: "coefficient|radius",
    predicate: "coefficient_enclosed|radius_strictly_valid",
    predicateSatisfied: "boolean_recomputed_from_the_bound_intervals",
    radiusExact:
      "exactDyadic_or_null_with_nonnull_exactly_for_entryKind_radius",
    recurrenceTerms:
      "ordered_tuple_of_namedInterval_or_null_with_nonnull_exactly_for_entryKind_coefficient",
    tag: "literal_origin_recurrence_and_remainder/v1",
  }),
  core_normalized_schrodinger: Object.freeze({
    ...CORE_COVER_PAYLOAD_FIELD_TYPES,
    expressionId: "literal_core_normalized_schrodinger",
    predicate: "literal_absolute_upper_less_than_or_equal_to_1e-10",
  }),
  core_normalized_poisson: Object.freeze({
    ...CORE_COVER_PAYLOAD_FIELD_TYPES,
    expressionId: "literal_core_normalized_poisson",
    predicate: "literal_absolute_upper_less_than_or_equal_to_1e-10",
  }),
  core_scalar_strict_positivity: Object.freeze({
    ...CORE_COVER_PAYLOAD_FIELD_TYPES,
    expressionId: "literal_core_scalar_u",
    normalizationInterval: "literal_null",
    predicate: "literal_lower_strictly_positive",
  }),
  core_scalar_strict_decrease: Object.freeze({
    ...CORE_COVER_PAYLOAD_FIELD_TYPES,
    expressionId: "literal_negative_core_scalar_derivative",
    normalizationInterval: "literal_null",
    predicate: "literal_lower_strictly_positive",
  }),
  core_potential_strict_negativity: Object.freeze({
    ...CORE_COVER_PAYLOAD_FIELD_TYPES,
    expressionId: "literal_core_potential_V",
    normalizationInterval: "literal_null",
    predicate: "literal_upper_strictly_negative",
  }),
  exterior_projected_radii_polynomial: Object.freeze({
    YUpper: "directedEndpoint_RNDU_finite_nonnegative",
    Z0Upper: "directedEndpoint_RNDU_finite_nonnegative",
    Z1Upper: "directedEndpoint_RNDU_finite_nonnegative",
    ZAtRadiusUpper: "directedEndpoint_RNDU_finite_nonnegative",
    inverseDefectUpper: "directedEndpoint_RNDU_finite_nonnegative",
    pUpper: "directedEndpoint_RNDU_finite",
    projectionTailUpper: "directedEndpoint_RNDU_finite_nonnegative",
    radiusExact: "one_of_the_exact_61_dyadics_2^-80_through_2^-20",
    resonanceMargins:
      "ordered_tuple_of_namedInterval_for_every_declared_principal_multiplier_margin",
    selected: "boolean_with_exactly_one_true_across_the_duty_on_success",
    strictlyValid:
      "boolean_recomputed_from_pUpper_strictly_negative_ZAtRadiusUpper_strictly_below_one_and_all_margins",
    tag: "literal_exterior_projected_radii_polynomial/v1",
  }),
  exterior_full_scaled_schrodinger: Object.freeze({
    ...TAIL_COVER_PAYLOAD_FIELD_TYPES,
    predicate: "literal_quantity_interval_contains_zero",
  }),
  exterior_full_scaled_poisson: Object.freeze({
    ...TAIL_COVER_PAYLOAD_FIELD_TYPES,
    predicate: "literal_quantity_interval_contains_zero",
  }),
  exterior_H_strict_positivity: Object.freeze({
    ...TAIL_COVER_PAYLOAD_FIELD_TYPES,
    predicate: "literal_lower_strictly_positive",
  }),
  exterior_scalar_strict_decrease: Object.freeze({
    ...TAIL_COVER_PAYLOAD_FIELD_TYPES,
    predicate: "literal_lower_strictly_positive",
  }),
  exterior_potential_open_endpoint_negativity: Object.freeze({
    ...TAIL_COVER_PAYLOAD_FIELD_TYPES,
    predicate: "literal_upper_strictly_negative_on_the_declared_open_domain",
  }),
  C1_join_and_one_sided_limits: Object.freeze({
    H1: "directedInterval",
    Hy1: "directedInterval",
    Q1: "directedInterval",
    Qy1: "directedInterval",
    U: "directedInterval",
    U1: "directedInterval",
    V: "directedInterval",
    V1: "directedInterval",
    leftPdeLimits:
      "exact_tuple_[schrodinger_limit,poisson_limit]_of_namedInterval",
    predicateSatisfied:
      "boolean_recomputed_from_all_jumps_and_one-sided_limits",
    rightPdeLimits:
      "exact_tuple_[schrodinger_limit,poisson_limit]_of_namedInterval",
    tag: "literal_C1_join_and_one_sided_limits/v1",
    valueDerivativeJumps:
      "exact_tuple_[u_jump,u_x_jump,V_jump,V_x_jump]_of_namedInterval",
  }),
  mass_and_coulomb_consistency: Object.freeze({
    ...INTEGRAL_PAYLOAD_FIELD_TYPES,
    integralId: "N_core|N_tail|mass_coulomb_summary",
    predicate:
      "integral_cell_enclosed_for_box_or_literal_directed_relative_mass_and_Coulomb_residual_at_most_1e-9_for_summary",
    summaryValues:
      "null_for_box_or_exact_object_{C,N,NCore,NTail,massDefect,normalizedMassDefect}_all_directedInterval_for_summary",
  }),
  global_integral_identities: Object.freeze({
    ...INTEGRAL_PAYLOAD_FIELD_TYPES,
    integralId:
      "T_core|T_tail|W_core|W_tail|potentialGradient_core|potentialGradient_tail|global_identity_summary",
    predicate:
      "integral_cell_enclosed_for_box_or_literal_all_four_directed_relative_identity_residuals_at_most_1e-9_for_summary",
    summaryValues:
      "null_for_box_or_exact_object_{C,N,T,W,gaussFlux,identityResiduals,potentialGradient}_with_identityResiduals_exact_object_{eigenvalue,gaussFlux,poissonEnergy,virial}_all_directedInterval_for_summary",
  }),
  target_scaling_maximum_and_bvp_map: Object.freeze({
    CStar: "directedInterval",
    analyticBvpMapBinding: "rawArtifactBinding",
    continuousMaximum: "directedInterval",
    kappaStar: "directedInterval",
    lambda: "degenerate_directedInterval_exactly_2^-5",
    nuStar: "directedInterval",
    potentialScalingDefect: "directedInterval",
    predicateSatisfied:
      "boolean_recomputed_from_every_scaling_maximum_frequency_and_binding_condition",
    scalarScalingDefect: "directedInterval",
    sigmaStar: "directedInterval",
    tag: "literal_target_scaling_maximum_and_bvp_map/v1",
    targetAmplitude: "directedInterval",
    wSeed: "directedInterval_with_strictly_positive_lower_and_upper_below_one",
  }),
} as const);

const PRIMARY_PAYLOADS = Object.freeze([
  Object.freeze({
    path: "scalars.f64le",
    semanticRole: "primary_scalar_operands",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 9,
    sizeBytes: 72,
    elementOrder: Object.freeze([
      "nu0",
      "Vc",
      "N0",
      "C",
      "kappa",
      "sigma",
      "lambda",
      "nu_star",
      "wSeed",
    ]),
  }),
  Object.freeze({
    path: "coefficients/core_L2_u.f64le",
    semanticRole: "primary_L2_scalar_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 128,
    sizeBytes: 1024,
    elementOrder: "coefficient_n_increasing_0_through_127",
  }),
  Object.freeze({
    path: "coefficients/core_L2_V.f64le",
    semanticRole: "primary_L2_potential_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 128,
    sizeBytes: 1024,
    elementOrder: "coefficient_n_increasing_0_through_127",
  }),
  Object.freeze({
    path: "coefficients/tail_H.f64le",
    semanticRole: "primary_tail_H_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 32,
    sizeBytes: 256,
    elementOrder: "coefficient_n_increasing_0_through_31",
  }),
  Object.freeze({
    path: "coefficients/tail_Q.f64le",
    semanticRole: "primary_tail_Q_Chebyshev_coefficients",
    elementType: "IEEE754_binary64_little_endian",
    elementCount: 32,
    sizeBytes: 256,
    elementOrder: "coefficient_n_increasing_0_through_31",
  }),
] as const);

const ROUTES = Object.freeze([
  Object.freeze({
    path: "proof/origin.jsonl",
    dutyOrdinals: Object.freeze([0]),
  }),
  Object.freeze({
    path: "proof/core-intervals.jsonl",
    dutyOrdinals: Object.freeze([1, 2, 3, 4, 5]),
  }),
  Object.freeze({
    path: "proof/tail-intervals.jsonl",
    dutyOrdinals: Object.freeze([6, 7, 8, 9, 10, 11, 12]),
  }),
  Object.freeze({
    path: "proof/integrals.jsonl",
    dutyOrdinals: Object.freeze([13, 14]),
  }),
  Object.freeze({
    path: "proof/scaling-and-bvp-init.jsonl",
    dutyOrdinals: Object.freeze([15]),
  }),
] as const);

const POLICY_BINDING_SCHEMA = Object.freeze({
  exactCanonicalKeyOrder: Object.freeze([
    "artifactId",
    "canonicalSizeBytes",
    "policyVersion",
    "sha256",
    "sha256Domain",
  ]),
  fieldTypes: Object.freeze({
    artifactId: "nonempty_UTF8_string",
    canonicalSizeBytes: "safe_nonnegative_integer",
    policyVersion: "nonempty_UTF8_string",
    sha256: "lowercase_64_hex",
    sha256Domain: "nonempty_UTF8_string_ending_single_LF",
  }),
});

const RAW_BINDING_SCHEMA = Object.freeze({
  exactCanonicalKeyOrder: Object.freeze([
    "mediaType",
    "path",
    "sha256",
    "sizeBytes",
  ]),
  fieldTypes: Object.freeze({
    mediaType: "registered_nonempty_ASCII_media_type",
    path: "canonical_relative_POSIX_path",
    sha256: "lowercase_64_hex_plain_SHA256_of_raw_bytes",
    sizeBytes: "safe_nonnegative_integer_exact_raw_byte_length",
  }),
});

const ENDPOINT_SCHEMA = Object.freeze({
  exactCanonicalKeyOrder: Object.freeze([
    "direction",
    "exponent2",
    "mantissaLowercaseHex",
    "precisionBits",
    "sign",
  ]),
  interpretation: "finite_value=sign*integer(mantissaLowercaseHex)*2^exponent2",
  nonzeroNormalization:
    "sign_is_minus_or_plus;_mantissa_is_1_to_64_lowercase_hex_digits_with_first_digit_nonzero_and_final_hex_digit_odd_so_no_factor_of_two_remains;_exponent2_is_safe_integer_in_closed_[-1048576,1048576]",
  zeroNormalization:
    "sign=zero_mantissaLowercaseHex=0_exponent2=0_and_direction_still_identifies_the_endpoint_side",
  precisionBits: 256,
  lowerDirection: "RNDD",
  upperDirection: "RNDU",
  negativeZeroRepresentable: false,
  NaNOrInfinityRepresentable: false,
});

const AUTHORITY_LOCKS = Object.freeze({
  proofInterchangeComplete: true,
  implementationClosureComplete: false,
  runtimeClosureComplete: false,
  preexecutionPresealPresent: false,
  executionAuthorized: false,
  executionObserved: false,
  primaryOperandsAccepted: false,
  directedDutiesAccepted: false,
  outputAccepted: false,
  seedAccepted: false,
  branchAccepted: false,
  nondegeneracyAccepted: false,
  runReplayAccepted: false,
  independentAgreementAccepted: false,
  semiclassicalStressNoiseLamp: false,
  semiclassicalConstraintAlgebraLamp: false,
  diagnosticPass: false,
  candidateAuthority: false,
  theoryGraphAuthority: false,
  physicalViability: false,
  propulsion: false,
  transport: false,
} as const);

const BLOCKERS = Object.freeze([
  "primary_and_independent_hash_bound_implementations_absent",
  "source_toolchain_executable_runtime_and_preseal_instances_absent",
  "candidate_execution_and_replay_receipts_absent",
] as const);

const FAILURE_CODES_BY_STAGE = Object.freeze({
  binding: Object.freeze(["policy_binding_mismatch"]),
  inventory: Object.freeze([
    "inventory_mismatch",
    "path_or_file_metadata_violation",
  ]),
  json_parse: Object.freeze([
    "json_not_strict_utf8_or_canonical",
    "json_duplicate_key",
    "parser_limit_exceeded",
    "json_schema_mismatch",
  ]),
  forbidden_role: Object.freeze(["forbidden_lever_or_tile_role"]),
  provenance: Object.freeze([
    "source_manifest_mismatch",
    "toolchain_manifest_mismatch",
    "executable_or_runtime_closure_mismatch",
    "preexecution_preseal_mismatch",
    "commit_or_dirty_tree_mismatch",
    "command_or_timing_mismatch",
  ]),
  freshness: Object.freeze(["freshness_mismatch"]),
  numeric_decode: Object.freeze([
    "numeric_payload_hash_or_shape_mismatch",
    "numeric_payload_nonfinite",
    "numeric_payload_negative_zero",
  ]),
  primary_execution: Object.freeze([
    "resource_preflight_failure",
    "primary_execution_failure",
  ]),
  primary_publication: Object.freeze(["primary_publication_failure"]),
  directed_proof: Object.freeze([
    "resource_preflight_failure",
    "directed_operator_failure",
    "directed_proof_budget_exhausted",
    "directed_proof_predicate_failure",
  ]),
  independent_replay: Object.freeze([
    "resource_preflight_failure",
    "independent_replay_failure",
  ]),
  agreement: Object.freeze(["independent_agreement_failure"]),
  failure_publication: Object.freeze(["failure_publication_failure"]),
} as const);

const POLICY = {
  artifactId:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_ARTIFACT_ID,
  policyVersion:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VERSION,
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  maturity:
    "stage_2_closed_interchange_and_receipt_grammar_with_exact_primary_numerics_and_directed_operator_policies_bound_without_implementation_or_execution_authority",
  frozenBeforeCandidateExecution: true,
  bindings: {
    semanticSeed:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.semanticSeed,
    operationPrepolicy:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.operationPrepolicy,
    directedProofArchitecture:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.directedProofArchitecture,
    primaryNumericsPolicy:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.primaryNumericsPolicy,
    directedProofOperator:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS.directedProofOperator,
  },
  scopeBoundary: {
    closes:
      "the_byte_interchange_receipt_schema_parser_caps_hash_domains_provenance_shapes_and_atomic_publication_protocol_only",
    doesNotClose:
      "the_missing_primary_or_independent_hash-bound_implementation_runtime_preseal_execution_candidate_acceptance_branch_or_semiclassical_replay;_the_directed_operator_policy_is_bound_but_no_operator_implementation_is_present",
    primaryBytesAreUntrustedCandidateOperands: true,
    producerDerivedMetricsAccepted: false,
    verifierRecomputesAllDerivedValuesFromAcceptedBytes: true,
    candidateExecutionPerformedByThisModule: false,
    runtimeImplementationProvidedByThisModule: false,
    declaredLeverOrTileTensorUsed: false,
    retuningOrRetryAuthorized: false,
  },
  directedArchitectureSuccessorClosure: {
    predecessorBlocker:
      "closed_receipt_common_summary_and_duty_specific_value_types_nested_shapes_field_order_endpoint_mantissa_normalization_conditional_null_semantics_and_parser_ABI_absent",
    predecessorBlockerClosedByThisSchema: true,
    closedCommonRecordFieldTypes: true,
    closedSixteenDutyTaggedPayloadTypes: true,
    closedSummaryConclusionRouteFileAndAggregateTypes: true,
    closedEndpointMantissaAndIntervalNormalization: true,
    closedConditionalNullAndDecisionRules: true,
    closedBoundedParserAndForbiddenRoleAdmission: true,
    closedPrimaryCandidatePayloadDescriptorAndProvenanceShapes: true,
    closedAtomicPublicationAndAuthorityFalseFailureShapes: true,
    primaryToVerifierStructuralAbiSchemaComplete: true,
    primaryToVerifierActivated: true,
    activationRequiresReplacementPrimaryNumericsPolicyBinding: false,
    directedProofOperatorPolicyBindingSatisfied: true,
    predecessorDirectedOperatorMathematicalBlockersClosedByBoundSuccessorPolicy: true,
    proofInterchangeComplete: true,
  },
  primitiveSchemas: {
    policyBinding: POLICY_BINDING_SCHEMA,
    rawArtifactBinding: RAW_BINDING_SCHEMA,
    directedEndpoint: ENDPOINT_SCHEMA,
    directedInterval: {
      type: "exact_two_element_tuple_[lower,upper]",
      lower: "directedEndpoint_with_direction_RNDD",
      upper: "directedEndpoint_with_direction_RNDU",
      relation:
        "decode_exact_dyadics_then_require_lower_less_than_or_equal_to_upper_without_binary_floating_conversion",
    },
    exactDyadic: {
      type: "canonical_ASCII_string",
      grammar:
        "^(?:0\\*2\\^0|(?:-[1-9][0-9]*|[1-9][0-9]*)\\*2\\^(?:0|-[1-9][0-9]*|[1-9][0-9]*))$",
      normalization:
        "integer_coefficient_and_power_are_base10_without_plus_sign_leading_zero_or_negative-zero_exponent;_nonzero_integer_coefficient_is_odd;_zero_is_exactly_0*2^0",
    },
    namedInterval: {
      exactCanonicalKeyOrder: Object.freeze(["interval", "name"]),
      name: "closed_schema_literal_or_ASCII_identifier_maximum_128_bytes",
      interval: "directedInterval",
    },
    hash256: "lowercase_64_hex",
    relativePath: {
      encoding: "valid_UTF8_without_NUL_or_unpaired_surrogate",
      grammar:
        "one_or_more_POSIX_segments_joined_by_single_forward_slash_with_no_leading_or_trailing_slash_empty_segment_dot_dotdot_backslash_drive_prefix_or_absolute_form",
      segmentGrammar:
        "1_through_255_UTF8_bytes_each_and_total_path_1_through_4096_UTF8_bytes",
      normalization:
        "raw_path_bytes_are_authoritative_and_NFC_is_required_so_distinct_Unicode_normalizations_cannot_alias",
      caseRule:
        "case-sensitive_exact_bytes_and_duplicate_or_case-fold-colliding_inventory_entries_are_rejected",
    },
    decimalCounter:
      "canonical_unsigned_base10_string_0_or_nonzero_without_leading_zero_maximum_39_digits",
    utcTimestamp:
      "RFC3339_UTC_YYYY-MM-DDTHH:mm:ss.sssssssssZ_exactly_9_fractional_digits",
  },
  jsonAndParserAbi: {
    byteEncoding:
      "strict_UTF8_RFC8785_canonical_JSON_no_BOM_no_prefix_or_suffix_whitespace_no_trailing_bytes",
    duplicateKeys:
      "reject_during_tokenization_before_object_materialization_including_escaped_key_collisions",
    objectPolicy:
      "exact_key_sets_only_no_prototypes_accessors_symbols_proxies_or_non_enumerable_properties_in_in-memory_conformance_helpers",
    numbers: {
      allowed:
        "JSON_numbers_only_for_schema_ordinals_counts_sizes_depths_precisionBits_and_other_fields_explicitly_typed_safe_integer",
      require: "Number.isSafeInteger_and_not_negative_zero",
      forbidden:
        "all_scientific_real_values_floating_metrics_NaN_infinities_fractional_numbers_and_exponent_notation",
      largeCounters:
        "device_inode_nanoseconds_and_other_potentially_unsafe_counters_are_canonical_decimal_strings",
    },
    strings:
      "valid_Unicode_scalar_values_only_no_unpaired_surrogates_no_NUL_and_each_schema-specific_UTF8_byte_cap_applies",
    limits: {
      maximumNestingDepth: 32,
      maximumTokensPerDocument: 1048576,
      maximumDescriptorBytes: 1048576,
      maximumManifestBytes: 8388608,
      maximumPresealBytes: 8388608,
      maximumSummaryBytes: 1048576,
      maximumFailureReceiptBytes: 262144,
      maximumProofRecordBytes: 65536,
      maximumProofRecordsAcrossAllRoutes: 4194304,
      maximumArrayLength: 8192,
      maximumObjectProperties: 256,
      maximumStringUtf8Bytes: 65536,
      maximumPathUtf8Bytes: 4096,
      maximumManifestEntries: 8192,
      maximumArgvEntries: 256,
      maximumFreshnessEntries: 8192,
    },
    rawAdmissionOrder: [
      "open_parent_and_candidate_root_by_directory_file_descriptors_with_O_NOFOLLOW",
      "lstat_exact_inventory_and_reject_links_nonregular_files_wrong_owner_or_group_or_modes_and_size_caps",
      "read_each_JSON_file_to_a_fresh_exact_length_buffer_without_opening_any_numeric_payload",
      "strict_UTF8_tokenize_with_duplicate-key_depth_token_string_and_number_caps",
      "require_raw_JSON_bytes_equal_the_exact_RFC8785_reserialization",
      "enforce_closed_exact-key_schemas_then_scan_every_key_and_role-bearing_string_for_forbidden_lever_or_tile_tokens",
      "validate_all_policy_source_toolchain_executable_runtime_preseal_commit_command_timing_hash_and_freshness_bindings",
      "only_then_open_hash_and_decode_the_five_numeric_payloads",
    ],
    validationFailureDisposition:
      "typed_authority-false_failure_receipt_and_fail_the_single_frozen_candidate_without_numeric_promotion_or_retry",
  },
  forbiddenRoleAdmission: {
    exactForbiddenTokens: Object.freeze([
      "declared_lever_tensor",
      "declaredlevertensor",
      "lever",
      "lever_tensor",
      "levertensor",
      "lever_tensor_role",
      "declared_tile_tensor",
      "declaredtiletensor",
      "tile",
      "tiles",
      "tile_id",
      "tileid",
      "tile_role",
      "tilerole",
      "tile_tensor",
      "tiletensor",
      "tile_weight",
      "tileweight",
      "tile_gain",
      "tilegain",
      "tile_schedule",
      "tileschedule",
      "warp_control_tensor",
      "external_source_tensor",
    ]),
    keyRule:
      "NFKC_then_ASCII_lowercase_every_object_key_and_reject_if_the_normalized_identifier_is_an_exact_forbidden_token_or_has_a_camel_snake_kebab_dot_segment_equal_to_lever_or_tile",
    roleBearingStringKeys: Object.freeze([
      "finalRoot",
      "id",
      "name",
      "outputRoot",
      "path",
      "role",
      "roleId",
      "rolePath",
      "role_id",
      "role_path",
      "semanticRole",
      "semantic_role",
    ]),
    stringRule:
      "for_values_under_role-bearing_keys_apply_the_same_normalization_and_reject_any_forbidden_token_or_lever_or_tile_identifier_segment",
    traversal:
      "depth-first_object-keys-in-RFC8785-order_and_array-indices-increasing_after_safe_plain-data_snapshot",
    timing: "must_complete_before_any_numeric_payload_open_or_decode",
    failureCode: "forbidden_lever_or_tile_role",
  },
  primaryCandidateDescriptor: {
    path: "descriptor.json",
    schemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_descriptor/v1",
    exactCanonicalKeyOrder: Object.freeze([
      "attemptOrdinal",
      "authorityFalse",
      "candidateId",
      "orderedPayloadBindings",
      "policyBindings",
      "provenance",
      "schemaVersion",
    ]),
    fieldTypes: {
      attemptOrdinal: "literal_safe_integer_1",
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      orderedPayloadBindings:
        "exact_five_element_tuple_of_primaryPayloadBinding_in_PRIMARY_PAYLOADS_order",
      policyBindings: "exact_policyBindingsSchema",
      provenance: "exact_runProvenanceSchema",
      schemaVersion: "literal_schema_version",
    },
    policyBindingsSchema: {
      exactCanonicalKeyOrder: Object.freeze([
        "directedProofArchitecture",
        "directedProofOperator",
        "interchangePolicy",
        "operationPrepolicy",
        "primaryNumericsPolicy",
        "semanticSeed",
      ]),
      everyValue: "policyBinding",
      futureInstanceNullAllowed: false,
      currentPolicyPrimaryNumericsBinding: PRIMARY_NUMERICS_POLICY_BINDING,
      currentPolicyDirectedProofOperatorBinding:
        DIRECTED_PROOF_OPERATOR_POLICY_BINDING,
      consequence:
        "the_exact_six-policy_descriptor_ABI_is_activated_but_candidate_execution_remains_separately_blocked_by_hash-bound_primary_and_independent_implementations_runtime_closure_a_concrete_preseal_and_outer-controller_authorization",
    },
    payloadBindingSchema: {
      exactCanonicalKeyOrder: Object.freeze([
        "elementCount",
        "elementType",
        "path",
        "payloadSha256",
        "rawSha256",
        "semanticRole",
        "sizeBytes",
      ]),
      payloadSha256:
        "domain-separated_role_and_path_binding_hash_not_the_plain_raw_hash",
      rawSha256: "plain_SHA256_of_exact_payload_bytes",
      allOtherFields: "must_equal_the_literal_PRIMARY_PAYLOADS_entry",
    },
    primaryPayloadsInOrder: PRIMARY_PAYLOADS,
    payloadDecode:
      "fresh_exact-size_full-view_little-endian_decode_in_element_order_reject_every_nonfinite_value_and_binary64_negative-zero_bit-pattern_0x8000000000000000",
    payloadHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-interchange/primary-payload/v1\n",
    payloadHashRecipe:
      "SHA256(domain_utf8||u64le(path_utf8_length)||path_utf8||u64le(sizeBytes)||rawSha256_32_bytes)",
    derivedValuesForbiddenFromDescriptorOrPayloads: Object.freeze([
      "U_U1_V_V1",
      "kappa_sigma_a_sC_recomputations",
      "S_P_and_low_mode_coefficients",
      "origin_or_projection_bounds",
      "Y_Z0_Z1_Z_p_and_selected_radius",
      "sign_integral_identity_scaling_or_BVP_verdicts",
      "seed_candidate_branch_lamp_or_physical_acceptance",
    ]),
  },
  provenanceSchemas: {
    rawBinding: RAW_BINDING_SCHEMA,
    manifestEntry: {
      exactCanonicalKeyOrder: Object.freeze([
        "mediaType",
        "path",
        "sha256",
        "sizeBytes",
      ]),
      type: "rawArtifactBinding",
    },
    manifest: {
      exactCanonicalKeyOrder: Object.freeze([
        "aggregateSha256",
        "authorityFalse",
        "entries",
        "role",
        "schemaVersion",
      ]),
      schemaVersion: "nhm2_spherical_seed_provenance_manifest/v1",
      fieldTypes: {
        aggregateSha256: "lowercase_64_hex_recomputed_manifest_aggregate_hash",
        authorityFalse: "literal_true",
        entries:
          "nonempty_tuple_of_manifestEntry_maximum_8192_in_strict_path_order",
        role: "one_literal_from_roles",
        schemaVersion: "literal_manifest_schema_version",
      },
      roles: Object.freeze([
        "primary_source",
        "primary_toolchain",
        "primary_runtime",
        "independent_source",
        "independent_toolchain",
        "independent_runtime",
      ]),
      entryOrder: "strict_UTF8_bytewise_path_order_without_duplicates",
      aggregateDomain:
        "nhm2-spherical-boson-star-newtonian-seed-interchange/manifest/v1\n",
      aggregateRecipe:
        "SHA256(domain_utf8||u64le(entryCount)||for_each_entry_in_order(u64le(canonical_entry_byte_length)||canonical_entry_bytes))",
      authorityFalse: true,
    },
    executableBinding: {
      type: "rawArtifactBinding",
      requireRegularExecutableOwnedFile: true,
      sharedLibraryClosure:
        "runtime_manifest_must_include_the_executable_loader_and_every_transitively_loaded_shared_object_as_raw_entries",
    },
    runProvenance: {
      exactCanonicalKeyOrder: Object.freeze([
        "commandArgv",
        "commit40",
        "dirtyTreeDigestSha256",
        "executableBinding",
        "freshnessObservations",
        "outputRootIdentitySha256",
        "preexecutionPresealBinding",
        "runtimeManifestBinding",
        "sourceManifestBinding",
        "timing",
        "toolchainManifestBinding",
      ]),
      fieldTypes: {
        commandArgv:
          "nonempty_exact_UTF8_argv_tuple_no_shell_reparse_no_NUL_maximum_256_entries",
        commit40: "lowercase_40_hex_git_commit",
        dirtyTreeDigestSha256: "lowercase_64_hex",
        executableBinding: "rawArtifactBinding",
        freshnessObservations:
          "nonempty_tuple_of_exact_freshnessObservation_in_UTF8_path_order",
        outputRootIdentitySha256:
          "lowercase_64_hex_domain-separated_identity_hash_of_the_predeclared_absolute_output_root",
        preexecutionPresealBinding: "rawArtifactBinding",
        runtimeManifestBinding: "rawArtifactBinding",
        sourceManifestBinding: "rawArtifactBinding",
        timing: "exact_runTiming",
        toolchainManifestBinding: "rawArtifactBinding",
      },
      outputRootIdentityHashDomain:
        "nhm2-spherical-boson-star-newtonian-seed-interchange/output-root/v1\n",
      outputRootIdentityHash:
        "SHA256(domain_utf8||u64le(absolute_root_UTF8_byte_length)||absolute_root_UTF8_bytes)_with_the_outer_controller_requiring_distinct_hashes_for_primary_and_independent_verifiers",
      roleConsistency:
        "summary_implementationRole_primary_verifier_requires_primary_source_toolchain_runtime_manifest_roles;_independent_verifier_requires_the_three_independent_roles;_the_executable_and_preseal_bindings_must_match_that_same_role_and_output root",
    },
    runTiming: {
      exactCanonicalKeyOrder: Object.freeze([
        "monotonicElapsedNanoseconds",
        "monotonicEndNanoseconds",
        "monotonicStartNanoseconds",
        "wallEndUtc",
        "wallStartUtc",
      ]),
      monotonicCounters: "canonical_decimalCounter_strings",
      relation:
        "end_greater_than_or_equal_to_start_and_elapsed_equals_exact_base10_integer_subtraction_end_minus_start",
      wallTimes: "utcTimestamp_and_wallEnd_not_before_wallStart",
    },
    fileStat: {
      exactCanonicalKeyOrder: Object.freeze([
        "changeTimeNanoseconds",
        "device",
        "inode",
        "modeOctal",
        "modifyTimeNanoseconds",
        "sha256",
        "sizeBytes",
      ]),
      decimalStringFields: Object.freeze([
        "changeTimeNanoseconds",
        "device",
        "inode",
        "modifyTimeNanoseconds",
      ]),
      modeOctal: "exact_four_ASCII_octal_digits",
      sha256: "lowercase_64_hex",
      sizeBytes: "safe_nonnegative_integer",
    },
    freshnessObservation: {
      exactCanonicalKeyOrder: Object.freeze([
        "path",
        "postread",
        "preopen",
        "stable",
      ]),
      path: "canonical_relative_POSIX_path",
      preopen: "fileStat",
      postread: "fileStat",
      stable:
        "literal_true_and_every_fileStat_field_must_match_exactly_with_the_descriptor_or_manifest_binding",
    },
    preexecutionPreseal: {
      path: "provenance/preexecution-preseal.json",
      exactCanonicalKeyOrder: Object.freeze([
        "attemptOrdinal",
        "authorityFalse",
        "candidateId",
        "commandArgvSha256",
        "commit40",
        "createdMonotonicNanoseconds",
        "createdWallUtc",
        "dirtyTreeDigestSha256",
        "executableBinding",
        "policyBindings",
        "runtimeManifestBinding",
        "schemaVersion",
        "sourceManifestBinding",
        "staticInputAggregateSha256",
        "toolchainManifestBinding",
      ]),
      schemaVersion:
        "nhm2_spherical_boson_star_newtonian_seed_preexecution_preseal/v1",
      attemptOrdinal: 1,
      authorityFalse: true,
      fieldTypes: {
        attemptOrdinal: "literal_safe_integer_1",
        authorityFalse: "literal_true",
        candidateId: "literal_frozen_candidate_id",
        commandArgvSha256:
          "lowercase_64_hex_hash_of_the_length-delimited_exact_command_argv",
        commit40: "lowercase_40_hex_git_commit",
        createdMonotonicNanoseconds: "canonical_decimalCounter",
        createdWallUtc: "utcTimestamp",
        dirtyTreeDigestSha256: "lowercase_64_hex",
        executableBinding: "rawArtifactBinding",
        policyBindings:
          "exact_descriptor_policyBindings_with_all_six_nonnull_bound_policies",
        runtimeManifestBinding: "rawArtifactBinding",
        schemaVersion: "literal_preseal_schema_version",
        sourceManifestBinding: "rawArtifactBinding",
        staticInputAggregateSha256:
          "lowercase_64_hex_length-delimited_aggregate_of_every_fresh_static_input_binding",
        toolchainManifestBinding: "rawArtifactBinding",
      },
      hashRule:
        "the_descriptor_preexecutionPresealBinding_plain-hashes_the_exact_canonical_preseal_bytes;_the_preseal_contains_no_self_hash",
      creationBoundary:
        "must_be_written_fsynced_reopened_rehashed_and_closed_before_either_primary_or_independent_process_launch",
      immutableAfterCreation: true,
    },
    dirtyTreeDigest: {
      domain:
        "nhm2-spherical-boson-star-newtonian-seed-interchange/dirty-tree/v1\n",
      scope:
        "exact_union_of_all_source_manifest_entries_build_recipes_lockfiles_contracts_fixtures_and_static_inputs",
      recipe:
        "SHA256(domain_utf8||u64le(entryCount)||each_UTF8_path_sorted_entry_with_length-delimited_git_porcelain_v2_status_and_raw_worktree_bytes)",
    },
  },
  primaryInputBindingAndReceipt: {
    exactInventoryOrder: Object.freeze([
      "descriptor.json",
      "scalars.f64le",
      "coefficients/core_L2_u.f64le",
      "coefficients/core_L2_V.f64le",
      "coefficients/tail_H.f64le",
      "coefficients/tail_Q.f64le",
      "receipt.json",
    ]),
    descriptorHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-interchange/descriptor/v1\n",
    descriptorHash:
      "SHA256(domain_utf8||u64le(canonical_descriptor_byte_length)||canonical_descriptor_bytes)",
    inputBindingDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/input-binding/v1\n",
    inputBindingHash:
      "SHA256(domain_utf8||descriptorHash_32_bytes||for_each_payload_in_literal_order(u64le(path_utf8_length)||path_utf8||u64le(sizeBytes)||rawSha256_32_bytes))",
    receiptPath: "receipt.json",
    receiptSchemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_primary_candidate_receipt/v1",
    receiptExactCanonicalKeyOrder: Object.freeze([
      "authorityFalse",
      "candidateId",
      "descriptorBinding",
      "inputBindingSha256",
      "orderedPayloadBindings",
      "publication",
      "schemaVersion",
    ]),
    receiptFieldTypes: {
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      descriptorBinding: "rawArtifactBinding_for_literal_descriptor.json",
      inputBindingSha256: "lowercase_64_hex_recomputed_inputBindingHash",
      orderedPayloadBindings:
        "exact_five_element_tuple_byte-identical_to_descriptor_orderedPayloadBindings",
      publication: "exact_publication_object",
      schemaVersion: "literal_receipt_schema_version",
    },
    publicationExactCanonicalKeyOrder: Object.freeze([
      "finalRoot",
      "parentDirectoryFsyncRequired",
      "publicationMethod",
      "publicationPreparedWallUtc",
      "tempRootNonceSha256",
    ]),
    publicationFieldTypes: {
      finalRoot:
        "absolute_predeclared_UTF8_path_string_with_no_numeric_semantics",
      parentDirectoryFsyncRequired: "literal_true",
      publicationMethod: "literal_renameat2_RENAME_NOREPLACE_then_parent_fsync",
      publicationPreparedWallUtc: "utcTimestamp_not_later_than_the_rename",
      tempRootNonceSha256:
        "lowercase_64_hex_SHA256_of_the_32-hex_nonce_not_the_nonce_itself",
    },
    publicationObjectSemantics:
      "prepared_and_fsynced_inside_the_temp_root_before_rename_and_therefore_records_the_required_method_and_preparation_time_but_never_claims_that_the_later_rename_or_parent_fsync_has_already_occurred",
    authorityFalse: true,
    receiptConveysCandidateAcceptance: false,
  },
  proofRecordUnion: {
    exactDutyCount: 16,
    derivedMaximumProofRecordCount: 4189905,
    derivedMaximumProofRecordCountFormula:
      "95_origin+5*262144_core+61_radii+5*(61+262144)_tail+1_join+(1+2*196000)_mass+(1+6*196000)_identities+1_scaling=4189905",
    dutyDefinitions: DUTY_DEFINITIONS,
    payloadFieldTypesByDutyId: DUTY_PAYLOAD_FIELD_TYPES,
    commonExactCanonicalKeyOrder: Object.freeze([
      "candidateId",
      "decision",
      "depth",
      "directedProofOperatorBinding",
      "directedProofPolicyBinding",
      "domainBox",
      "dutyId",
      "dutyOrdinal",
      "implementationRole",
      "inputBindingSha256",
      "interchangePolicyBinding",
      "operationPrepolicyBinding",
      "parentRecordOrdinal",
      "payload",
      "payloadSha256",
      "recordKind",
      "recordOrdinal",
      "recordTag",
      "schemaVersion",
      "semanticSeedBinding",
    ]),
    commonFieldTypes: {
      candidateId: "literal_frozen_candidate_id",
      decision:
        "accept|split|reject|invalid_radius|selected_radius|valid_not_selected|budget_exhausted",
      depth: "safe_integer_0_through_56_or_null",
      directedProofOperatorBinding:
        "exact_DIRECTED_PROOF_OPERATOR_POLICY_BINDING",
      directedProofPolicyBinding: "exact_DIRECTED_PROOF_POLICY_BINDING",
      domainBox: "tuple_of_directedIntervals_or_null",
      dutyId: "literal_for_dutyOrdinal",
      dutyOrdinal: "safe_integer_0_through_15",
      implementationRole: "primary_verifier|independent_verifier",
      inputBindingSha256: "lowercase_64_hex",
      interchangePolicyBinding: "exact_this_policyBinding",
      operationPrepolicyBinding: "exact_OPERATION_PREPOLICY_POLICY_BINDING",
      parentRecordOrdinal: "safe_nonnegative_integer_or_null",
      payload: "exact_tagged_payload_for_dutyOrdinal",
      payloadSha256: "lowercase_64_hex_record_hash",
      recordKind: "literal_recordKind_allowed_for_dutyOrdinal",
      recordOrdinal: "safe_nonnegative_integer_monotone_within_duty",
      recordTag: "literal_payloadTag_for_dutyOrdinal",
      schemaVersion:
        "literal_nhm2_spherical_boson_star_newtonian_seed_directed_record/v1",
      semanticSeedBinding: "exact_SEMANTIC_SEED_POLICY_BINDING",
    },
    nestedSchemas: {
      bounds: {
        exactCanonicalKeyOrder: Object.freeze([
          "YUpper",
          "Z0Upper",
          "Z1Upper",
          "ZAtRadiusUpper",
          "pUpper",
        ]),
        eachField: "directedEndpoint_RNDU",
      },
      analyticBvpMapBinding: RAW_BINDING_SCHEMA,
      coordinateOrder:
        "closed_nonempty_tuple_of_literal_coordinate_identifiers",
      recurrenceTerms: "tuple_of_namedInterval_in_literal_formula_order",
      flatEnvelopeIntervals:
        "rectangular_tuple_gamma_order_outer_then_expression_component_inner_of_namedInterval",
      valueDerivativeJumps:
        "exact_tuple_[u_jump,u_x_jump,V_jump,V_x_jump]_of_namedInterval",
      pdeLimits:
        "exact_tuple_[schrodinger_limit,poisson_limit]_of_namedInterval",
      massSummaryValues: {
        exactCanonicalKeyOrder: Object.freeze([
          "C",
          "N",
          "NCore",
          "NTail",
          "massDefect",
          "normalizedMassDefect",
        ]),
        everyField: "directedInterval",
      },
      identityResiduals: {
        exactCanonicalKeyOrder: Object.freeze([
          "eigenvalue",
          "gaussFlux",
          "poissonEnergy",
          "virial",
        ]),
        everyField: "directedInterval",
      },
      globalIdentitySummaryValues: {
        exactCanonicalKeyOrder: Object.freeze([
          "C",
          "N",
          "T",
          "W",
          "gaussFlux",
          "identityResiduals",
          "potentialGradient",
        ]),
        scalarFields: "directedInterval",
        identityResiduals: "exact_identityResiduals_object",
      },
    },
    recordVariantDecisionRules: {
      coefficient: "accept|reject",
      radius: "invalid_radius|selected_radius|valid_not_selected",
      interval_cover: "accept|split|reject|budget_exhausted",
      endpoint_candidate: "accept|reject",
      radii_polynomial: "invalid_radius|selected_radius|valid_not_selected",
      join: "accept|reject",
      integral_box: "accept|split|reject|budget_exhausted",
      summary: "accept|reject",
      scaling_and_bvp: "accept|reject",
    },
    conditionalRules: Object.freeze([
      "depth_is_null_domainBox_is_null_and_parentRecordOrdinal_is_null_exactly_for_non-box_coefficient_radius_join_summary_and_scaling_records",
      "for_a_root_box_depth_is_0_and_parentRecordOrdinal_is_null;_for_depth_1_through_56_parentRecordOrdinal_is_a_strictly_smaller_recordOrdinal;_no_other_depth_is_admissible",
      "core_interval_cover_domainBox_has_exactly_one_x_interval;_tail_interval_cover_domainBox_has_exactly_two_intervals_in_[y,gamma]_order;_integral_box_domainBox_has_exactly_one_x_or_y_interval_as_fixed_by_integrationRegion",
      "recordKind_and_decision_must_match_recordVariantDecisionRules_and_the_payload_discriminant_exactly",
      "split_requires_a_nonnull_domainBox_is_never_terminal_and_requires_predicateSatisfied_false_when_that_field_is_boolean_but_integral_box_predicateSatisfied_is_literal_null",
      "accept_requires_predicateSatisfied_true_for_every_payload_where_that_field_is_boolean;_integral_box_accept_keeps_predicateSatisfied_literal_null_and_means_only_that_the_cell_enclosure_met_the_frozen_integrator_error_rule",
      "reject_or_budget_exhausted_on_an_interval_cover_or_integral_box_requires_predicateSatisfied_false_when_boolean_and_causes_the_duty_and_candidate_to_fail;_endpoint_candidate_reject_is_nonterminal_and_only_marks_that_delta_invalid",
      "duty_0_entryKind_coefficient_requires_nonnull_coefficientId_coefficientInterval_recurrenceTerms_and_null_radiusExact_bounds;_entryKind_radius_requires_the_exact_opposite",
      "duty_6_decision_selected_radius_iff_selected=true_and_strictlyValid=true;_valid_not_selected_iff_selected=false_and_strictlyValid=true;_invalid_radius_iff_both_false",
      "duties_7_through_11_entryKind_endpoint_candidate_requires_recordKind_endpoint_candidate_nonnull_deltaExact_null_domainBox_and_decision_accept_iff_predicateSatisfied_true_else_reject;_interval_cover_requires_recordKind_interval_cover_null_deltaExact_and_nonnull_domainBox",
      "duties_13_and_14_integrationRegion_core_box_requires_nonnull_coreInterval_null_tailInterval_normalizationInterval_residualInterval_summaryValues_and_integralId_with_core_suffix;_tail_box_requires_the_exact_mirror_and_integralId_with_tail_suffix",
      "duties_13_and_14_integrationRegion_summary_requires_recordKind_summary_null_coreInterval_and_tailInterval_nonnull_normalizationInterval_residualInterval_and_exact_duty-specific_summaryValues;_integralId_is_mass_coulomb_summary_or_global_identity_summary_respectively",
      "all_interval_endpoints_are_recomputed_by_the_verifier_and_no_primary-supplied_interval_or_predicate_is_admissible",
    ]),
    recordHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/record/v1\n",
    recordHash:
      "SHA256(domain_utf8||u16le(dutyOrdinal)||u64le(canonical_record_without_payloadSha256_byte_length)||canonical_record_without_payloadSha256_bytes)",
    fileEncoding:
      "one_exact_RFC8785_canonical_record_per_strict_UTF8_line_with_one_LF_no_CR_no_blank_line_and_terminal_LF_required",
    fileOrder:
      "dutyOrdinal_increasing_then_recordOrdinal_increasing_with_no_gaps_inside_each_duty_and_routes_concatenating_only_the_declared_duties",
  },
  proofRouteAndSummarySchemas: {
    exactProofInventoryOrder: Object.freeze([
      "proof/origin.jsonl",
      "proof/core-intervals.jsonl",
      "proof/tail-intervals.jsonl",
      "proof/integrals.jsonl",
      "proof/scaling-and-bvp-init.jsonl",
      "proof/directed-proof-summary.json",
      "proof/receipt.json",
    ]),
    routes: ROUTES,
    routeStreamBindingExactCanonicalKeyOrder: Object.freeze([
      "firstRecordOrdinalByDuty",
      "lastRecordOrdinalByDuty",
      "path",
      "rawSha256",
      "recordCount",
      "routeStreamSha256",
      "sizeBytes",
    ]),
    routeStreamBindingFieldTypes: {
      firstRecordOrdinalByDuty:
        "exact_tuple_aligned_with_the_route_dutyOrdinals_of_safe_nonnegative_integer_or_null_when_duty_has_no_record",
      lastRecordOrdinalByDuty:
        "exact_tuple_aligned_with_the_route_dutyOrdinals_of_safe_nonnegative_integer_or_null_when_duty_has_no_record",
      path: "literal_route_path",
      rawSha256: "lowercase_64_hex_plain_SHA256_of_complete_route_bytes",
      recordCount: "safe_nonnegative_integer_recomputed_from_LF_records",
      routeStreamSha256: "lowercase_64_hex_domain-separated_route_hash",
      sizeBytes: "safe_nonnegative_integer_exact_complete_route_byte_length",
    },
    routeStreamHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-directed-proof/route-stream/v1\n",
    routeStreamHash:
      "SHA256(domain_utf8||u64le(recordCount)||for_each_record_in_file_order(u64le(record_canonical_byte_length)||record_canonical_bytes))",
    rawSha256: "plain_SHA256_of_the_complete_LF-terminated_route_file_bytes",
    summaryPath: "proof/directed-proof-summary.json",
    summarySchemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_directed_proof_summary/v1",
    summaryExactCanonicalKeyOrder: Object.freeze([
      "authorityFalse",
      "candidateId",
      "directedProofOperatorBinding",
      "directedProofPolicyBinding",
      "dutyCounts",
      "firstFailureOrAllPassed",
      "implementationRole",
      "inputBindingSha256",
      "interchangePolicyBinding",
      "operationPrepolicyBinding",
      "provenance",
      "routeStreamBindings",
      "schemaVersion",
      "semanticSeedBinding",
    ]),
    summaryFieldTypes: {
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      directedProofOperatorBinding:
        "exact_DIRECTED_PROOF_OPERATOR_POLICY_BINDING",
      directedProofPolicyBinding: "exact_DIRECTED_PROOF_POLICY_BINDING",
      dutyCounts: "exact_16_element_dutyCount_tuple",
      firstFailureOrAllPassed: "exact_conclusionTaggedUnion",
      implementationRole: "primary_verifier|independent_verifier",
      inputBindingSha256: "lowercase_64_hex_same_accepted_input_binding",
      interchangePolicyBinding: "exact_this_policyBinding",
      operationPrepolicyBinding: "exact_OPERATION_PREPOLICY_POLICY_BINDING",
      provenance: "exact_runProvenanceSchema",
      routeStreamBindings: "exact_five_element_tuple_in_literal_route_order",
      schemaVersion: "literal_summary_schema_version",
      semanticSeedBinding: "exact_SEMANTIC_SEED_POLICY_BINDING",
    },
    summaryHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-interchange/proof-summary/v1\n",
    summaryHash:
      "SHA256(domain_utf8||u64le(canonical_summary_byte_length)||canonical_summary_bytes)_with_no_self_or_aggregate_hash_field",
    dutyCountExactCanonicalKeyOrder: Object.freeze([
      "acceptedCount",
      "dutyId",
      "dutyOrdinal",
      "recordCount",
      "splitCount",
      "terminalFailureCount",
    ]),
    dutyCountFieldTypes: {
      acceptedCount: "safe_nonnegative_integer",
      dutyId: "literal_for_dutyOrdinal",
      dutyOrdinal: "safe_integer_0_through_15",
      recordCount: "safe_nonnegative_integer",
      splitCount: "safe_nonnegative_integer",
      terminalFailureCount: "safe_nonnegative_integer",
    },
    dutyCounts:
      "exact_16_element_tuple_in_dutyOrdinal_order_with_counts_recomputed_from_routes",
    conclusionTaggedUnion: {
      allPassedExactCanonicalKeyOrder: Object.freeze([
        "authorityFalse",
        "selectedRadiusExact",
        "tag",
      ]),
      allPassedFieldTypes: {
        authorityFalse: "literal_true",
        selectedRadiusExact:
          "exactDyadic_and_exactly_the_unique_selected_duty_6_radius",
        tag: "literal_allPassedTag",
      },
      allPassedTag:
        "all_directed_duties_passed_without_seed_or_solution_authority",
      allPassedConditions:
        "all_16_duties_have_zero_terminalFailureCount_every_terminal_record_is_accept_or_valid_not_selected_or_selected_radius_exactly_one_radius_is_selected_and_all_counts_hashes_and_predicates_recompute",
      firstFailureExactCanonicalKeyOrder: Object.freeze([
        "authorityFalse",
        "code",
        "detailSha256",
        "dutyId",
        "dutyOrdinal",
        "recordOrdinal",
        "tag",
      ]),
      firstFailureFieldTypes: {
        authorityFalse: "literal_true",
        code: "closed_failure_code_from_the_bound_operator_registry",
        detailSha256: "lowercase_64_hex_or_null",
        dutyId: "literal_for_dutyOrdinal",
        dutyOrdinal: "safe_integer_0_through_15",
        recordOrdinal: "safe_nonnegative_integer_or_null",
        tag: "literal_first_failure",
      },
      firstFailureTag: "first_failure",
      firstFailureOrder:
        "lowest_dutyOrdinal_then_lowest_recordOrdinal_with_null_only_for_pre-record_duty_failure",
      authorityFalse: true,
    },
    aggregateHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-interchange/proof-aggregate/v1\n",
    aggregateHash:
      "SHA256(domain_utf8||inputBindingSha256_32_bytes||summaryHash_32_bytes||for_each_route_in_literal_order(u64le(path_utf8_length)||path_utf8||u64le(sizeBytes)||rawSha256_32_bytes||routeStreamSha256_32_bytes))",
    proofReceiptPath: "proof/receipt.json",
    proofReceiptSchemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_directed_proof_receipt/v1",
    proofReceiptExactCanonicalKeyOrder: Object.freeze([
      "aggregateBindingSha256",
      "authorityFalse",
      "candidateId",
      "inputBindingSha256",
      "routeStreamBindings",
      "schemaVersion",
      "summaryBinding",
    ]),
    summaryBindingExactCanonicalKeyOrder: Object.freeze([
      "path",
      "plainSha256",
      "sizeBytes",
      "summarySha256",
    ]),
    summaryBindingFieldTypes: {
      path: "literal_proof/directed-proof-summary.json",
      plainSha256: "lowercase_64_hex_plain_SHA256_of_summary_bytes",
      sizeBytes: "safe_nonnegative_integer_exact_summary_byte_length",
      summarySha256: "lowercase_64_hex_domain-separated_summaryHash",
    },
    proofReceiptFieldTypes: {
      aggregateBindingSha256: "lowercase_64_hex_recomputed_proofAggregate_hash",
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      inputBindingSha256: "lowercase_64_hex_same_accepted_input_binding",
      routeStreamBindings:
        "exact_five_element_tuple_byte-identical_to_summary_routeStreamBindings",
      schemaVersion: "literal_proof_receipt_schema_version",
      summaryBinding: "exact_summaryBinding_object",
    },
    hashGraphAcyclicity:
      "records_bind_no_file;_routes_bind_records;_summary_binds_routes_but_no_aggregate;_aggregate_binds_summary_and_routes;_proof_receipt_binds_the_aggregate_and_is_not_itself_bound",
    summaryMaySetSeedOrSolutionAuthority: false,
  },
  independentAgreementReceiptSchema: {
    path: "agreement/receipt.json",
    exactInventoryOrder: Object.freeze(["agreement/receipt.json"]),
    schemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_proof_agreement/v1",
    exactCanonicalKeyOrder: Object.freeze([
      "agreementSha256",
      "authorityFalse",
      "candidateId",
      "comparisonConclusion",
      "directedProofOperatorBinding",
      "directedProofPolicyBinding",
      "independentSummaryBinding",
      "inputBindingSha256",
      "interchangePolicyBinding",
      "operationPrepolicyBinding",
      "primarySummaryBinding",
      "schemaVersion",
      "semanticSeedBinding",
    ]),
    fieldTypes: {
      agreementSha256:
        "lowercase_64_hex_domain-separated_hash_of_the_canonical_receipt_without_agreementSha256",
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      comparisonConclusion: "exact_agreementConclusion_tagged_union",
      directedProofOperatorBinding:
        "exact_DIRECTED_PROOF_OPERATOR_POLICY_BINDING",
      directedProofPolicyBinding: "exact_DIRECTED_PROOF_POLICY_BINDING",
      independentSummaryBinding:
        "rawArtifactBinding_for_the_independent_summary_with_distinct_source_executable_runtime_and_output_root",
      inputBindingSha256:
        "lowercase_64_hex_identical_in_both_admitted_summaries",
      interchangePolicyBinding: "exact_this_policyBinding",
      operationPrepolicyBinding: "exact_OPERATION_PREPOLICY_POLICY_BINDING",
      primarySummaryBinding:
        "rawArtifactBinding_for_the_primary-verifier_summary",
      schemaVersion: "literal_agreement_schema_version",
      semanticSeedBinding: "exact_SEMANTIC_SEED_POLICY_BINDING",
    },
    normalizedRecordProjectionExactCanonicalKeyOrder: Object.freeze([
      "candidateId",
      "decision",
      "depth",
      "directedProofOperatorBinding",
      "directedProofPolicyBinding",
      "domainBox",
      "dutyId",
      "dutyOrdinal",
      "inputBindingSha256",
      "interchangePolicyBinding",
      "operationPrepolicyBinding",
      "parentRecordOrdinal",
      "payload",
      "recordKind",
      "recordOrdinal",
      "recordTag",
      "schemaVersion",
      "semanticSeedBinding",
    ]),
    normalization:
      "parse_and_recompute_each_admitted_record_then_remove_only_implementationRole_and_payloadSha256;_recanonicalize_the_exact_remaining_projection;_payloadSha256_is_recomputed_before_removal_and_must_be_valid_in_each_source",
    comparisonOrder:
      "route_literal_order_then_dutyOrdinal_then_recordOrdinal_then_RFC8785_field_path_byte_order",
    requiredExactMatches: Object.freeze([
      "same_inputBindingSha256_candidateId_semantic-seed_operation-prepolicy_directed-proof_operator_and_interchange_bindings",
      "same_route_population_duty_counts_record_ordinals_recordKinds_parent_tree_domain_boxes_decisions_and_payload_tags",
      "same_canonical_MPFR_endpoints_intervals_nested_operands_predicates_selected_radius_and_conclusion",
      "different_implementationRole_source_manifest_toolchain_executable_runtime_and_output_root_bindings",
    ]),
    allMatchedExactCanonicalKeyOrder: Object.freeze([
      "authorityFalse",
      "normalizedRecordCount",
      "tag",
    ]),
    allMatchedFieldTypes: {
      authorityFalse: "literal_true",
      normalizedRecordCount:
        "safe_nonnegative_integer_equal_to_each_summary_total_record_count",
      tag: "literal_all_normalized_proof_records_and_conclusions_identical_without_candidate_authority",
    },
    firstMismatchExactCanonicalKeyOrder: Object.freeze([
      "authorityFalse",
      "dutyOrdinal",
      "fieldPath",
      "independentValueSha256",
      "primaryValueSha256",
      "recordOrdinal",
      "tag",
    ]),
    firstMismatchFieldTypes: {
      authorityFalse: "literal_true",
      dutyOrdinal:
        "safe_integer_0_through_15_or_null_for_a_summary-level_mismatch",
      fieldPath: "canonical_RFC6901_JSON_pointer_maximum_4096_UTF8_bytes",
      independentValueSha256:
        "lowercase_64_hex_plain_SHA256_of_the_independent_canonical_projected_value",
      primaryValueSha256:
        "lowercase_64_hex_plain_SHA256_of_the_primary_canonical_projected_value",
      recordOrdinal:
        "safe_nonnegative_integer_or_null_for_a_summary-level_mismatch",
      tag: "literal_first_normalized_mismatch",
    },
    agreementHashDomain:
      "nhm2-spherical-boson-star-newtonian-seed-interchange/agreement/v1\n",
    agreementHash:
      "SHA256(domain_utf8||u64le(canonical_receipt_without_agreementSha256_byte_length)||canonical_receipt_without_agreementSha256_bytes)",
    allMatchedStillAuthorityFalse: true,
    allMatchedMaySetSeedLampOrPhysicalClaims: false,
  },
  failureReceiptSchema: {
    path: "failure/receipt.json",
    exactInventoryOrder: Object.freeze(["failure/receipt.json"]),
    schemaVersion:
      "nhm2_spherical_boson_star_newtonian_seed_failure_receipt/v1",
    exactCanonicalKeyOrder: Object.freeze([
      "attemptOrdinal",
      "authorityFalse",
      "candidateId",
      "commandArgvSha256",
      "commit40",
      "detailSha256",
      "failureCode",
      "failureStage",
      "interchangePolicyBinding",
      "monotonicElapsedNanoseconds",
      "primaryInputBindingSha256",
      "schemaVersion",
      "wallEndUtc",
      "wallStartUtc",
    ]),
    failureStages: Object.freeze([
      "binding",
      "inventory",
      "json_parse",
      "forbidden_role",
      "provenance",
      "freshness",
      "numeric_decode",
      "primary_execution",
      "primary_publication",
      "directed_proof",
      "independent_replay",
      "agreement",
      "failure_publication",
    ]),
    failureCodes: Object.freeze([
      "policy_binding_mismatch",
      "inventory_mismatch",
      "path_or_file_metadata_violation",
      "json_not_strict_utf8_or_canonical",
      "json_duplicate_key",
      "parser_limit_exceeded",
      "json_schema_mismatch",
      "forbidden_lever_or_tile_role",
      "source_manifest_mismatch",
      "toolchain_manifest_mismatch",
      "executable_or_runtime_closure_mismatch",
      "preexecution_preseal_mismatch",
      "commit_or_dirty_tree_mismatch",
      "command_or_timing_mismatch",
      "freshness_mismatch",
      "numeric_payload_hash_or_shape_mismatch",
      "numeric_payload_nonfinite",
      "numeric_payload_negative_zero",
      "resource_preflight_failure",
      "primary_execution_failure",
      "primary_publication_failure",
      "directed_operator_failure",
      "directed_proof_budget_exhausted",
      "directed_proof_predicate_failure",
      "independent_replay_failure",
      "independent_agreement_failure",
      "failure_publication_failure",
    ]),
    allowedFailureCodesByStage: FAILURE_CODES_BY_STAGE,
    failureCode:
      "exactly_one_literal_from_allowedFailureCodesByStage[failureStage]_with_operator-specific_detail_carried_only_by_detailSha256",
    primaryInputBindingSha256:
      "lowercase_64_hex_or_null_exactly_when_failure_precedes_input-binding_construction",
    detailSha256:
      "lowercase_64_hex_hash_of_non-authoritative_bounded_diagnostic_bytes_stored_outside_the_candidate_numeric_root_or_null_if_no_detail_exists",
    fieldTypes: {
      attemptOrdinal: "literal_safe_integer_1",
      authorityFalse: "literal_true",
      candidateId: "literal_frozen_candidate_id",
      commandArgvSha256:
        "lowercase_64_hex_hash_of_the_length-delimited_exact_argv_tuple",
      commit40: "lowercase_40_hex_git_commit",
      detailSha256: "lowercase_64_hex_or_null",
      failureCode: "one_literal_from_failureCodes",
      failureStage: "one_literal_from_failureStages",
      interchangePolicyBinding: "exact_this_policyBinding",
      monotonicElapsedNanoseconds: "canonical_decimalCounter",
      primaryInputBindingSha256: "lowercase_64_hex_or_null",
      schemaVersion: "literal_failure_schema_version",
      wallEndUtc: "utcTimestamp",
      wallStartUtc: "utcTimestamp",
    },
    noCandidateNumericValuesIntervalsMetricsOrVerdicts: true,
    authorityFalse: true,
    candidateDisposition:
      "fail_this_one_frozen_candidate_without_retune_retry_precision_escalation_grid_change_or_branch_fallback",
  },
  atomicDirectoryPublication: {
    supportedKernelContract:
      "Linux_openat2_renameat2_fsync_semantics_on_one_local_filesystem",
    currentWindowsHostExecutionAdmissible: false,
    roots: {
      primaryOperandsFinalRoot:
        "predeclared_absolute_absent_root_owned_by_the_outer_controller",
      primaryProofFinalRoot:
        "predeclared_absolute_absent_root_disjoint_from_operands_and_independent_roots",
      independentProofFinalRoot:
        "predeclared_absolute_absent_root_disjoint_from_primary_roots",
      failureFinalRoot:
        "predeclared_absolute_absent_root_disjoint_from_all_numeric_and_proof_roots",
    },
    tempRoot:
      "private_sibling_dot_finalbasename.tmp.dot_32_lowercase_hex_getrandom_nonce_created_by_mkdirat_on_an_open_parent_fd_with_mode0700_and_absence_required",
    pathSafety: [
      "resolve_the_parent_once_to_an_owned_directory_fd_and_never_concatenate_an_absolute_child_path_after_that_point",
      "all_components_are_canonical_relative_POSIX_segments_and_openat2_uses_RESOLVE_BENEATH|RESOLVE_NO_SYMLINKS|RESOLVE_NO_MAGICLINKS|RESOLVE_NO_XDEV",
      "every_directory_is_new_mode0700_and_every_file_is_new_O_CREAT|O_EXCL|O_NOFOLLOW_mode0600_with_umask_077",
      "final_root_temp_root_and_failure_root_must_share_the_verified_parent_device_but_have_distinct_inodes_and_names",
    ],
    writeAndSyncOrder: [
      "validate_the_static_closed_inventory_paths_schema_caps_resource_preflight_and_all_descriptor_or_request_forbidden-role_surfaces_before_creating_the_temp_root_or_opening_numeric_inputs",
      "create_all_child_directories_then_write_non-descriptor_non-summary_non-receipt_payloads_in_literal_inventory_order_with_complete_write_loops",
      "stream_each_bounded_payload_or_proof_record_once_through_its_closed_validator_and_hash_accumulators_without_requiring_the_maximum_route_population_to_fit_in_memory",
      "fdatasync_then_fsync_each_file_reopen_by_openat2_rehash_and_require_identical_fstat_before_and_after_read",
      "write_fsync_reopen_and_rehash_descriptor_or_proof_summary_after_all_of_its_bound_payloads_are_stable",
      "write_fsync_reopen_and_rehash_the_authority-false_receipt_last",
      "fsync_every_child_directory_bottom-up_then_fsync_the_temp_root_directory_then_fsync_the_parent_directory",
      "renameat2_temp_to_absent_final_with_RENAME_NOREPLACE_then_fsync_the_parent_directory_again",
      "reopen_the_final_root_by_parent_fd_recheck_inventory_owner_modes_device_inodes_sizes_hashes_and_receipt_before_returning_publication_success",
    ],
    publicationPoint:
      "only_the_successful_RENAME_NOREPLACE_followed_by_parent_fsync_and_final-root_readback_can_make_the_directory_visible_as_a_non-authoritative_complete_artifact",
    partialOutputAuthority: false,
    overwriteOrReuseAllowed: false,
    tempFailureDisposition:
      "on_any_pre-rename_failure_close_child_file_fds_fchmod_the_still-open_exact_temp-directory-fd_to_mode000_fsync_that_directory_fsync_parent_then_close_and_leave_the_exact_nonce_temp_root_as_non-authoritative_quarantine;_never_rename_reuse_scan_or_accept_it_and_only_the_outer_controller_may_later_remove_that_exact_inode_by_a_separate_directory-fd_policy",
    failurePublication:
      "publish_exactly_one_failure_receipt_to_the_disjoint_failure_root_by_the_same_file_and_directory_fsync_RENAME_NOREPLACE_parent-fsync_and_readback_protocol_without_copying_candidate_numeric_bytes",
  },
  verifierBoundary: {
    primaryAndIndependentInputBytesIdentical: true,
    implementationsMustUseDisjointSourceTreesLanguagesExecutablesRuntimeClosuresAndOutputRoots: true,
    implementationsMayImportInvokeLinkOrShareGeneratedProofCode: false,
    primaryOutputMayBeModifiedByVerifier: false,
    derivedRecomputationsRequired: Object.freeze([
      "join_values_and_derivatives",
      "kappa_sigma_a_sC",
      "origin_recurrence_and_remainder",
      "all_core_and_tail_interval_operands",
      "Y_Z0_Z1_Z_p_and_radius_selection",
      "C1_one-sided_limits",
      "mass_Coulomb_and_global_integrals",
      "target_scaling_continuous_maximum_and_analytic_BVP_map",
      "every_predicate_count_route_hash_summary_and_first-failure_decision",
    ]),
    agreement:
      "compare_primary-verifier_and_independent-verifier_normalized_directed_records_counts_hashes_and_conclusions_from_the_same_inputBindingSha256_without_accepting_a_shared_cached_operand",
    agreementReceiptSchema:
      "independentAgreementReceiptSchema_exact_closed_authority-false_schema",
    agreementPolicyPresent: true,
  },
  attemptPolicy: {
    maximumCandidateAttempts: 1,
    retryAllowed: false,
    retuneAllowed: false,
    alternateGridJoinBasisTailOrderPrecisionToleranceRadiusAlgorithmOrInitializerAllowed: false,
    failureDisposition: "fail_the_frozen_candidate",
  },
  completionBoundary: {
    semanticSeedBound: true,
    operationPrepolicyBound: true,
    directedProofArchitectureBound: true,
    closedPrimaryPayloadSchemaComplete: true,
    closedDescriptorProvenancePresealSchemasComplete: true,
    closedDirectedEndpointAndIntervalSchemasComplete: true,
    closedSixteenDutyRecordUnionComplete: true,
    closedSummaryRouteAndHashSchemasComplete: true,
    closedIndependentAgreementReceiptSchemaComplete: true,
    closedAtomicPublicationAndFailureSchemasComplete: true,
    primaryNumericsPolicyBound: true,
    directedProofOperatorBound: true,
    proofInterchangeComplete: true,
    exactPrimaryToVerifierAbiComplete: true,
    exactReceiptSchemasComplete: true,
    implementationComplete: false,
    runtimeClosureComplete: false,
    preexecutionPresealComplete: false,
    executionAuthorized: false,
    executionObserved: false,
    seedAccepted: false,
  },
  blockers: BLOCKERS,
  unresolved: {
    primaryImplementationBinding: null,
    independentImplementationBinding: null,
    primaryRuntimeBinding: null,
    independentRuntimeBinding: null,
    preexecutionPresealBinding: null,
    executionReceipt: null,
    agreementReceipt: null,
  },
  authorityLocks: AUTHORITY_LOCKS,
  claimLockKeys: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLockKeys,
  claimLocks: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.claimLocks,
} as const;

const deepFreeze = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1 =
  deepFreeze(POLICY);

const assertInvariants = (): void => {
  const pins = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_PINS;
  const policy = NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;
  if (
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
      pins.semanticSeed.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
      pins.semanticSeed.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_SHA256 !==
      pins.operationPrepolicy.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1_CANONICAL_SIZE_BYTES !==
      pins.operationPrepolicy.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_SHA256 !==
      pins.directedProofArchitecture.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1_CANONICAL_SIZE_BYTES !==
      pins.directedProofArchitecture.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 !==
      pins.primaryNumericsPolicy.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES !==
      pins.primaryNumericsPolicy.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_SHA256 !==
      pins.directedProofOperator.sha256 ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1_CANONICAL_SIZE_BYTES !==
      pins.directedProofOperator.canonicalSizeBytes ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_OPERATION_POLICY_V1.candidateId !==
      policy.candidateId ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.candidateId !==
      policy.candidateId ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1.candidateId !==
      policy.candidateId ||
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_OPERATOR_V1.candidateId !==
      policy.candidateId ||
    policy.proofRecordUnion.dutyDefinitions.length !== 16 ||
    policy.proofRecordUnion.derivedMaximumProofRecordCount !== 4189905 ||
    policy.proofRecordUnion.derivedMaximumProofRecordCount >
      policy.jsonAndParserAbi.limits.maximumProofRecordsAcrossAllRoutes ||
    new Set(policy.proofRecordUnion.dutyDefinitions.map((duty) => duty.ordinal))
      .size !== 16 ||
    new Set(policy.proofRecordUnion.dutyDefinitions.map((duty) => duty.dutyId))
      .size !== 16 ||
    new Set(
      policy.proofRecordUnion.dutyDefinitions.map((duty) => duty.payloadTag),
    ).size !== 16 ||
    Object.keys(policy.proofRecordUnion.payloadFieldTypesByDutyId).length !==
      16 ||
    policy.proofRecordUnion.dutyDefinitions.some(
      (duty) =>
        !(duty.dutyId in policy.proofRecordUnion.payloadFieldTypesByDutyId) ||
        Object.keys(
          policy.proofRecordUnion.payloadFieldTypesByDutyId[
            duty.dutyId as keyof typeof policy.proofRecordUnion.payloadFieldTypesByDutyId
          ],
        )
          .sort()
          .join("\u0000") !== [...duty.payloadExactKeys].sort().join("\u0000"),
    ) ||
    policy.primaryCandidateDescriptor.primaryPayloadsInOrder.length !== 5 ||
    policy.primaryInputBindingAndReceipt.inputBindingDomain !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1
        .primaryToVerifierAbi.inputBindingDomain ||
    policy.proofRecordUnion.recordHashDomain !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.receiptSchemas
        .recordHashDomain ||
    policy.proofRouteAndSummarySchemas.routeStreamHashDomain !==
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_DIRECTED_PROOF_V1.receiptSchemas
        .routeStreamHashDomain ||
    policy.bindings.primaryNumericsPolicy !== pins.primaryNumericsPolicy ||
    policy.bindings.directedProofOperator !== pins.directedProofOperator ||
    policy.completionBoundary.primaryNumericsPolicyBound !== true ||
    policy.completionBoundary.directedProofOperatorBound !== true ||
    policy.completionBoundary.proofInterchangeComplete !== true ||
    policy.completionBoundary.exactPrimaryToVerifierAbiComplete !== true ||
    policy.completionBoundary.exactReceiptSchemasComplete !== true ||
    policy.completionBoundary.executionAuthorized !== false ||
    policy.authorityLocks.proofInterchangeComplete !== true ||
    Object.entries(policy.authorityLocks).some(
      ([key, value]) => key !== "proofInterchangeComplete" && value !== false,
    ) ||
    Object.values(policy.claimLocks).some((value) => value !== false) ||
    Object.values(policy.unresolved).some((value) => value !== null)
  ) {
    throw new Error(
      "nhm2_spherical_boson_star_newtonian_seed_interchange_v1_invariant_violation",
    );
  }
};

assertInvariants();

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

const FORBIDDEN_OBJECT_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  depth = 0,
  budget = { nodes: 0 },
): SnapshotResult => {
  const limits =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VALIDATOR_LIMITS;
  if (depth > limits.maximumDepth) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_depth_limit:${pointer || "/"}`,
    });
  }
  budget.nodes += 1;
  if (budget.nodes > limits.maximumNodes) {
    return Object.freeze({
      ok: false,
      violation: `snapshot_node_limit:${pointer || "/"}`,
    });
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    if (
      Buffer.byteLength(value, "utf8") > limits.maximumStringUtf8Bytes ||
      value.includes("\u0000") ||
      /[\ud800-\udfff]/u.test(value)
    ) {
      return Object.freeze({
        ok: false,
        violation: `invalid_string:${pointer || "/"}`,
      });
    }
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : Object.freeze({
          ok: false,
          violation: `invalid_json_number:${pointer || "/"}`,
        });
  }
  if (typeof value !== "object") {
    return Object.freeze({
      ok: false,
      violation: `non_json_value:${pointer || "/"}`,
    });
  }
  if (isProxy(value)) {
    return Object.freeze({
      ok: false,
      violation: `proxy_forbidden:${pointer || "/"}`,
    });
  }
  if (ancestors.has(value)) {
    return Object.freeze({
      ok: false,
      violation: `cycle:${pointer || "/"}`,
    });
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `non_plain_array:${pointer || "/"}`,
      });
    }
    const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
    const length =
      lengthDescriptor != null && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      typeof length !== "number" ||
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > limits.maximumArrayLength
    ) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `array_length_limit:${pointer || "/"}`,
      });
    }
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `symbol_key:${pointer || "/"}`,
      });
    }
    const indices = (keys as string[]).filter((key) => key !== "length");
    if (
      keys.length !== length + 1 ||
      indices.length !== length ||
      indices.some((key) => {
        if (!/^(0|[1-9][0-9]*)$/.test(key)) return true;
        const index = Number(key);
        return !Number.isSafeInteger(index) || index < 0 || index >= length;
      })
    ) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `array_surface:${pointer || "/"}`,
      });
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
      if (
        descriptor == null ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        ancestors.delete(value);
        return Object.freeze({
          ok: false,
          violation: `array_entry_surface:${pointer}/${index}`,
        });
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        depth + 1,
        budget,
      );
      if (!nested.ok) {
        ancestors.delete(value);
        return nested;
      }
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    ancestors.delete(value);
    return Object.freeze({
      ok: false,
      violation: `non_plain_object:${pointer || "/"}`,
    });
  }
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    ancestors.delete(value);
    return Object.freeze({
      ok: false,
      violation: `symbol_key:${pointer || "/"}`,
    });
  }
  if (keys.length > limits.maximumObjectPropertyCount) {
    ancestors.delete(value);
    return Object.freeze({
      ok: false,
      violation: `object_property_count_limit:${pointer || "/"}`,
    });
  }
  const output: Record<string, unknown> = {};
  for (const key of keys as string[]) {
    if (
      Buffer.byteLength(key, "utf8") > limits.maximumStringUtf8Bytes ||
      key.includes("\u0000") ||
      /[\ud800-\udfff]/u.test(key)
    ) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `invalid_object_key:${pointer || "/"}`,
      });
    }
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `forbidden_key:${pointer}/${key}`,
      });
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (
      descriptor == null ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      ancestors.delete(value);
      return Object.freeze({
        ok: false,
        violation: `object_property_surface:${pointer}/${key}`,
      });
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      depth + 1,
      budget,
    );
    if (!nested.ok) {
      ancestors.delete(value);
      return nested;
    }
    Object.defineProperty(output, key, {
      value: nested.value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  }
  ancestors.delete(value);
  return Object.freeze({ ok: true, value: output });
};

export const nhm2SphericalSeedInterchangeCanonicalJsonV1 = (
  value: unknown,
): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value
      .map((entry) => nhm2SphericalSeedInterchangeCanonicalJsonV1(entry))
      .join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${nhm2SphericalSeedInterchangeCanonicalJsonV1(
          record[key],
        )}`,
    )
    .join(",")}}`;
};

const unsignedLittleEndian = (value: number, byteLength: 2 | 8): Buffer => {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("spherical_seed_interchange_unsigned_integer_invalid");
  }
  const output = Buffer.alloc(byteLength);
  let remaining = BigInt(value);
  for (let index = 0; index < byteLength; index += 1) {
    output[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  if (remaining !== 0n) {
    throw new Error("spherical_seed_interchange_unsigned_integer_overflow");
  }
  return output;
};

export const nhm2SphericalSeedInterchangeProofRecordHashV1 = (
  dutyOrdinal: number,
  recordWithoutPayloadSha256: unknown,
): string => {
  if (
    !Number.isSafeInteger(dutyOrdinal) ||
    dutyOrdinal < 0 ||
    dutyOrdinal >= 16
  ) {
    throw new Error("spherical_seed_interchange_duty_ordinal_invalid");
  }
  const snapshot = snapshotPlainData(recordWithoutPayloadSha256);
  if (snapshot.ok === false) {
    throw new Error(
      `spherical_seed_interchange_record_invalid:${snapshot.violation}`,
    );
  }
  if (
    snapshot.value == null ||
    typeof snapshot.value !== "object" ||
    Array.isArray(snapshot.value) ||
    Object.prototype.hasOwnProperty.call(snapshot.value, "payloadSha256")
  ) {
    throw new Error("spherical_seed_interchange_record_hash_surface_invalid");
  }
  const record = snapshot.value as Record<string, unknown>;
  const expectedKeys =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.proofRecordUnion.commonExactCanonicalKeyOrder.filter(
      (key) => key !== "payloadSha256",
    );
  const actualKeys = Object.keys(record).sort();
  const duty =
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.proofRecordUnion
      .dutyDefinitions[dutyOrdinal];
  const payload = record.payload;
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index]) ||
    record.dutyOrdinal !== dutyOrdinal ||
    record.dutyId !== duty.dutyId ||
    record.recordTag !== duty.payloadTag ||
    typeof record.recordKind !== "string" ||
    !duty.recordKinds.includes(record.recordKind as never) ||
    typeof record.decision !== "string" ||
    !duty.allowedDecisions.includes(record.decision as never) ||
    payload == null ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    (payload as Record<string, unknown>).tag !== duty.payloadTag
  ) {
    throw new Error("spherical_seed_interchange_record_hash_surface_invalid");
  }
  const canonical = Buffer.from(
    nhm2SphericalSeedInterchangeCanonicalJsonV1(record),
    "utf8",
  );
  return createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.proofRecordUnion
        .recordHashDomain,
      "utf8",
    )
    .update(unsignedLittleEndian(dutyOrdinal, 2))
    .update(unsignedLittleEndian(canonical.byteLength, 8))
    .update(canonical)
    .digest("hex");
};

const hasExactKeys = (
  value: Record<string, unknown>,
  exactCanonicalKeys: readonly string[],
): boolean => {
  const keys = Object.keys(value).sort();
  return (
    keys.length === exactCanonicalKeys.length &&
    keys.every((key, index) => key === exactCanonicalKeys[index])
  );
};

const isLowerHex = (value: unknown, length: number): value is string =>
  typeof value === "string" &&
  value.length === length &&
  new RegExp(`^[0-9a-f]{${length}}$`).test(value);

export const nhm2SphericalSeedInterchangeDirectedEndpointV1Violations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  if (snapshot.value == null || typeof snapshot.value !== "object") {
    return ["endpoint_not_object"];
  }
  const endpoint = snapshot.value as Record<string, unknown>;
  if (
    !hasExactKeys(
      endpoint,
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1.primitiveSchemas
        .directedEndpoint.exactCanonicalKeyOrder,
    )
  ) {
    return ["endpoint_exact_keys"];
  }
  if (endpoint.direction !== "RNDD" && endpoint.direction !== "RNDU") {
    return ["endpoint_direction"];
  }
  if (endpoint.precisionBits !== 256) return ["endpoint_precision"];
  if (
    !Number.isSafeInteger(endpoint.exponent2) ||
    (endpoint.exponent2 as number) < -1048576 ||
    (endpoint.exponent2 as number) > 1048576
  ) {
    return ["endpoint_exponent"];
  }
  if (endpoint.sign === "zero") {
    return endpoint.mantissaLowercaseHex === "0" && endpoint.exponent2 === 0
      ? []
      : ["endpoint_zero_normalization"];
  }
  if (endpoint.sign !== "minus" && endpoint.sign !== "plus") {
    return ["endpoint_sign"];
  }
  if (
    typeof endpoint.mantissaLowercaseHex !== "string" ||
    !/^[1-9a-f][0-9a-f]{0,63}$/.test(endpoint.mantissaLowercaseHex) ||
    !/[13579bdf]$/.test(endpoint.mantissaLowercaseHex)
  ) {
    return ["endpoint_mantissa_normalization"];
  }
  return [];
};

const compareCanonicalEndpointValues = (
  left: Nhm2SphericalDirectedEndpointV1,
  right: Nhm2SphericalDirectedEndpointV1,
): number => {
  const signRank = (sign: Nhm2SphericalDirectedEndpointV1["sign"]): number =>
    sign === "minus" ? -1 : sign === "plus" ? 1 : 0;
  const leftSign = signRank(left.sign);
  const rightSign = signRank(right.sign);
  if (leftSign !== rightSign) return leftSign < rightSign ? -1 : 1;
  if (leftSign === 0) return 0;

  const leftMantissa = BigInt(`0x${left.mantissaLowercaseHex}`);
  const rightMantissa = BigInt(`0x${right.mantissaLowercaseHex}`);
  const bitLength = (value: bigint): number => value.toString(2).length;
  const leftTopExponent = bitLength(leftMantissa) + left.exponent2;
  const rightTopExponent = bitLength(rightMantissa) + right.exponent2;
  let magnitudeComparison: number;
  if (leftTopExponent !== rightTopExponent) {
    magnitudeComparison = leftTopExponent < rightTopExponent ? -1 : 1;
  } else {
    const commonExponent = Math.min(left.exponent2, right.exponent2);
    const leftScaled = leftMantissa << BigInt(left.exponent2 - commonExponent);
    const rightScaled =
      rightMantissa << BigInt(right.exponent2 - commonExponent);
    magnitudeComparison =
      leftScaled === rightScaled ? 0 : leftScaled < rightScaled ? -1 : 1;
  }
  return leftSign < 0 ? -magnitudeComparison : magnitudeComparison;
};

export const nhm2SphericalSeedInterchangeDirectedIntervalV1Violations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  if (!Array.isArray(snapshot.value) || snapshot.value.length !== 2) {
    return ["interval_exact_two_element_tuple"];
  }
  const lowerViolations =
    nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(snapshot.value[0]);
  if (lowerViolations.length > 0) {
    return [`interval_lower:${lowerViolations[0]}`];
  }
  const upperViolations =
    nhm2SphericalSeedInterchangeDirectedEndpointV1Violations(snapshot.value[1]);
  if (upperViolations.length > 0) {
    return [`interval_upper:${upperViolations[0]}`];
  }
  const lower = snapshot.value[0] as Nhm2SphericalDirectedEndpointV1;
  const upper = snapshot.value[1] as Nhm2SphericalDirectedEndpointV1;
  if (lower.direction !== "RNDD") return ["interval_lower_direction"];
  if (upper.direction !== "RNDU") return ["interval_upper_direction"];
  return compareCanonicalEndpointValues(lower, upper) <= 0
    ? []
    : ["interval_lower_greater_than_upper"];
};

const normalizedIdentifierSegments = (value: string): readonly string[] => {
  const normalized = value
    .normalize("NFKC")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
  return Object.freeze(
    normalized.split(/[^a-z0-9]+/).filter((entry) => entry.length > 0),
  );
};

const forbiddenRoleViolation = (
  value: unknown,
  roleBearing = false,
  pointer = "",
): string | null => {
  const forbidden = new Set(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1
      .forbiddenRoleAdmission.exactForbiddenTokens,
  );
  const roleKeys = new Set(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1
      .forbiddenRoleAdmission.roleBearingStringKeys,
  );
  if (typeof value === "string") {
    if (!roleBearing) return null;
    const normalized = value.normalize("NFKC").toLowerCase();
    const segments = normalizedIdentifierSegments(value);
    return forbidden.has(normalized) ||
      segments.includes("lever") ||
      segments.includes("tile")
      ? `forbidden_lever_or_tile_role:${pointer || "/"}`
      : null;
  }
  if (value === null || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const violation = forbiddenRoleViolation(
        value[index],
        roleBearing,
        `${pointer}/${index}`,
      );
      if (violation != null) return violation;
    }
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record).sort()) {
    const normalized = key.normalize("NFKC").toLowerCase();
    const segments = normalizedIdentifierSegments(key);
    if (
      forbidden.has(normalized) ||
      segments.includes("lever") ||
      segments.includes("tile")
    ) {
      return `forbidden_lever_or_tile_role:${pointer}/${key}`;
    }
    const violation = forbiddenRoleViolation(
      record[key],
      roleKeys.has(key),
      `${pointer}/${key}`,
    );
    if (violation != null) return violation;
  }
  return null;
};

export const nhm2SphericalSeedInterchangeForbiddenRoleV1Violations = (
  value: unknown,
): string[] => {
  const snapshot = snapshotPlainData(value);
  if (snapshot.ok === false) return [snapshot.violation];
  const violation = forbiddenRoleViolation(snapshot.value);
  return violation == null ? [] : [violation];
};

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON =
  nhm2SphericalSeedInterchangeCanonicalJsonV1(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1,
  );
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256_DOMAIN =
  "nhm2-spherical-boson-star-newtonian-seed-interchange/v1\n" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256 =
  createHash("sha256")
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON,
    "utf8",
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING =
  Object.freeze({
    artifactId:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_ARTIFACT_ID,
    canonicalSizeBytes:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES,
    policyVersion:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_VERSION,
    sha256: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256,
    sha256Domain:
      NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256_DOMAIN,
  } as const);

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_SHA256 =
  "827eb79c27137dd1649b35884c945c2d6809483acf25c7fd68d2a3ed80936f95" as const;
export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  67853 as const;

if (
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256 !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_SHA256 ||
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES !==
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    `nhm2_spherical_seed_interchange_literal_pin_mismatch:${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SHA256}/${NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_SIZE_BYTES}`,
  );
}

const EXPECTED_CANONICAL_JSON =
  NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_CANONICAL_JSON;

export const nhm2SphericalBosonStarNewtonianSeedInterchangeV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1) {
    return [];
  }
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["spherical_seed_interchange_plain_data_snapshot_invalid"];
  }
  if (snapshot.ok === false) return [snapshot.violation];
  try {
    return nhm2SphericalSeedInterchangeCanonicalJsonV1(snapshot.value) ===
      EXPECTED_CANONICAL_JSON
      ? ["spherical_seed_interchange_external_copy_not_authoritative"]
      : ["spherical_seed_interchange_semantic_mismatch"];
  } catch {
    return ["spherical_seed_interchange_plain_data_snapshot_invalid"];
  }
};

export const isNhm2SphericalBosonStarNewtonianSeedInterchangeV1 = (
  value: unknown,
): value is typeof NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1 =>
  value === NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1;

const SYNTHETIC_UPPER_ENDPOINT = Object.freeze({
  direction: "RNDU",
  exponent2: -2,
  mantissaLowercaseHex: "5",
  precisionBits: 256,
  sign: "plus",
} as const);

const SYNTHETIC_PROOF_RECORD_WITHOUT_HASH = deepFreeze({
  candidateId: NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_V1.candidateId,
  decision: "invalid_radius",
  depth: null,
  directedProofOperatorBinding: DIRECTED_PROOF_OPERATOR_POLICY_BINDING,
  directedProofPolicyBinding: DIRECTED_PROOF_POLICY_BINDING,
  domainBox: null,
  dutyId: "exterior_projected_radii_polynomial",
  dutyOrdinal: 6,
  implementationRole: "independent_verifier",
  inputBindingSha256:
    "1111111111111111111111111111111111111111111111111111111111111111",
  interchangePolicyBinding:
    NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_BINDING,
  operationPrepolicyBinding: OPERATION_PREPOLICY_POLICY_BINDING,
  parentRecordOrdinal: null,
  payload: {
    YUpper: SYNTHETIC_UPPER_ENDPOINT,
    Z0Upper: SYNTHETIC_UPPER_ENDPOINT,
    Z1Upper: SYNTHETIC_UPPER_ENDPOINT,
    ZAtRadiusUpper: SYNTHETIC_UPPER_ENDPOINT,
    inverseDefectUpper: SYNTHETIC_UPPER_ENDPOINT,
    pUpper: SYNTHETIC_UPPER_ENDPOINT,
    projectionTailUpper: SYNTHETIC_UPPER_ENDPOINT,
    radiusExact: "1*2^-20",
    resonanceMargins: [],
    selected: false,
    strictlyValid: false,
    tag: "exterior_projected_radii_polynomial/v1",
  },
  recordKind: "radii_polynomial",
  recordOrdinal: 0,
  recordTag: "exterior_projected_radii_polynomial/v1",
  schemaVersion: "nhm2_spherical_boson_star_newtonian_seed_directed_record/v1",
  semanticSeedBinding: SEMANTIC_SEED_POLICY_BINDING,
} as const);

const SYNTHETIC_PROOF_RECORD_CANONICAL_JSON =
  nhm2SphericalSeedInterchangeCanonicalJsonV1(
    SYNTHETIC_PROOF_RECORD_WITHOUT_HASH,
  );

export const NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_INTERCHANGE_V1_SYNTHETIC_GOLDEN =
  deepFreeze({
    candidateDataUsed: false,
    lowerEndpoint: {
      direction: "RNDD",
      exponent2: -3,
      mantissaLowercaseHex: "3",
      precisionBits: 256,
      sign: "minus",
    },
    upperEndpoint: {
      direction: "RNDU",
      exponent2: -2,
      mantissaLowercaseHex: "5",
      precisionBits: 256,
      sign: "plus",
    },
    zeroLowerEndpoint: {
      direction: "RNDD",
      exponent2: 0,
      mantissaLowercaseHex: "0",
      precisionBits: 256,
      sign: "zero",
    },
    canonicalIntervalJson:
      '[{"direction":"RNDD","exponent2":-3,"mantissaLowercaseHex":"3","precisionBits":256,"sign":"minus"},{"direction":"RNDU","exponent2":-2,"mantissaLowercaseHex":"5","precisionBits":256,"sign":"plus"}]',
    canonicalIntervalPlainSha256:
      "f3a2e0aa81cd9c1df70f4164f6d7306b522e50b75b7cc977ca92e66604c12e45",
    proofRecordWithoutPayloadSha256: SYNTHETIC_PROOF_RECORD_WITHOUT_HASH,
    proofRecordCanonicalJson: SYNTHETIC_PROOF_RECORD_CANONICAL_JSON,
    proofRecordSha256:
      "6db24711626961bdbcb22aa34fe6db3c459dc4b50de673d96073b9348aa34933",
  } as const);
