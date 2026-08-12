import { createHash } from "node:crypto";

import {
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
  NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
} from "./nhm2-prolate-boson-star-branch-bvp.v1";
import {
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
  NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
} from "./nhm2-prolate-boson-star-coherent-candidate-plan.v2";
import {
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
} from "./nhm2-semiclassical-v3-replay-epoch.v1";

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID =
  "nhm2.prolate_boson_star_newtonian_seed" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION =
  "nhm2_prolate_boson_star_newtonian_seed/v1" as const;

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS = Object.freeze(
  [
    "seed_solver_source_and_build_closure_absent",
    "seed_dependency_and_runtime_closure_absent",
    "resource_and_network_enforcement_not_implemented",
    "newtonian_seed_not_executed",
    "server_recomputed_seed_gates_not_evaluated",
    "continuous_nodeless_interval_proof_absent",
    "continuous_peak_interval_proof_absent",
    "numerical_origin_series_defect_gate_absent",
    "newtonian_seed_output_artifact_and_sha256_absent",
    "boson_star_branch_not_solved",
  ] as const,
);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE =
  Object.freeze([
    { stage: 0, exact: "2^-16", value: 2 ** -16 },
    { stage: 1, exact: "2^-15", value: 2 ** -15 },
    { stage: 2, exact: "2^-14", value: 2 ** -14 },
    { stage: 3, exact: "2^-13", value: 2 ** -13 },
    { stage: 4, exact: "2^-12", value: 2 ** -12 },
    { stage: 5, exact: "2^-11", value: 2 ** -11 },
    { stage: 6, exact: "2^-10", value: 2 ** -10 },
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS =
  Object.freeze([
    {
      id: "L0",
      radialNodeCount: 64,
      angularNodeCount: 32,
      duty: "production_base_solve",
    },
    {
      id: "L1",
      radialNodeCount: 96,
      angularNodeCount: 48,
      duty: "production_refinement",
    },
    {
      id: "L2",
      radialNodeCount: 128,
      angularNodeCount: 64,
      duty: "production_refinement_and_seed_payload",
    },
    {
      id: "AUDIT",
      radialNodeCount: 256,
      angularNodeCount: 128,
      duty: "independent_recomputation_only_no_solve_no_retune",
    },
  ] as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES =
  Object.freeze([
    {
      role: "newtonian_seed.grid.rho_nodes",
      dtype: "float64",
      shape: "[Nr]",
      multiplicity: "one_per_grid_level",
    },
    {
      role: "newtonian_seed.grid.theta_nodes",
      dtype: "float64",
      shape: "[Ntheta]",
      multiplicity: "one_per_grid_level",
    },
    {
      role: "newtonian_seed.base.scalar_u0",
      dtype: "float64",
      shape: "[Nr,Ntheta]",
      multiplicity: "one_per_grid_level",
    },
    {
      role: "newtonian_seed.base.potential_V0",
      dtype: "float64",
      shape: "[Nr,Ntheta]",
      multiplicity: "one_per_grid_level",
    },
    {
      role: "newtonian_seed.target.scalar_u_A",
      dtype: "float64",
      shape: "[7,Nr,Ntheta]",
      multiplicity: "one_per_grid_level_in_frozen_amplitude_order",
    },
    {
      role: "newtonian_seed.target.potential_V_A",
      dtype: "float64",
      shape: "[7,Nr,Ntheta]",
      multiplicity: "one_per_grid_level_in_frozen_amplitude_order",
    },
    {
      role: "newtonian_seed.multipole.scalar_odd",
      dtype: "float64",
      shape: "[Nr,ceil(Ntheta/2)]",
      multiplicity: "one_per_grid_level_ell_ascending",
    },
    {
      role: "newtonian_seed.multipole.potential_even",
      dtype: "float64",
      shape: "[Nr,ceil(Ntheta/2)]",
      multiplicity: "one_per_grid_level_ell_ascending",
    },
  ] as const);

const OUTPUT_ROLE_PATH_STEMS = Object.freeze([
  "rho_nodes",
  "theta_nodes",
  "base_scalar_u0",
  "base_potential_V0",
  "target_scalar_u_A",
  "target_potential_V_A",
  "multipole_scalar_odd",
  "multipole_potential_even",
] as const);

const outputArrayShape = (
  roleIndex: number,
  radialNodeCount: number,
  angularNodeCount: number,
): readonly number[] => {
  if (roleIndex === 0) return Object.freeze([radialNodeCount]);
  if (roleIndex === 1) return Object.freeze([angularNodeCount]);
  if (roleIndex === 4 || roleIndex === 5) {
    return Object.freeze([7, radialNodeCount, angularNodeCount]);
  }
  if (roleIndex === 6 || roleIndex === 7) {
    return Object.freeze([radialNodeCount, Math.ceil(angularNodeCount / 2)]);
  }
  return Object.freeze([radialNodeCount, angularNodeCount]);
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY =
  Object.freeze(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS.flatMap(
      (level, levelIndex) =>
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES.map(
          (role, roleIndex) => {
            const shape = outputArrayShape(
              roleIndex,
              level.radialNodeCount,
              level.angularNodeCount,
            );
            const elementCount = shape.reduce(
              (product, extent) => product * extent,
              1,
            );
            return Object.freeze({
              inventoryIndex:
                levelIndex *
                  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES.length +
                roleIndex,
              levelIndex,
              roleIndex,
              levelId: level.id,
              role: role.role,
              relativePath: `arrays/${level.id}/${String(roleIndex).padStart(2, "0")}-${OUTPUT_ROLE_PATH_STEMS[roleIndex]}.f64le`,
              dtype: "float64_le",
              order: "C_row_major",
              shape,
              elementCount,
              byteLength: elementCount * 8,
            });
          },
        ),
    ),
  );

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS =
  Object.freeze({
    arrayCount:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.length,
    float64ElementCount:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.reduce(
        (sum, entry) => sum + entry.elementCount,
        0,
      ),
    byteLength:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.reduce(
        (sum, entry) => sum + entry.byteLength,
        0,
      ),
  });

if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.arrayCount !==
    32 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.float64ElementCount !==
    810288 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS.byteLength !==
    6482304
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_v1_output_inventory_invariant_violation",
  );
}

const canonicalJsonForBinding = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value
      .map((entry) => canonicalJsonForBinding(entry))
      .join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map(
      (key) => `${JSON.stringify(key)}:${canonicalJsonForBinding(record[key])}`,
    )
    .join(",")}}`;
};

const deepFreezeEarly = <T>(value: T, seen = new Set<object>()): T => {
  if (value == null || typeof value !== "object" || seen.has(value as object)) {
    return value;
  }
  seen.add(value as object);
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreezeEarly(child, seen);
  }
  return Object.freeze(value);
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY =
  deepFreezeEarly({
    registryVersion:
      "nhm2.prolate_boson_star.newtonian_seed.derived_hash_registry/v1",
    hashAlgorithm: "SHA-256",
    digestEncoding: "lowercase_hex_64",
    hashRecipe: "sha256(utf8(domain)+u64be(payload_byte_length)+payload_bytes)",
    payloadRecipe:
      "concatenate_fields_in_the_declared_order_each_as_u16be(tag_utf8_byte_length)+tag_utf8+u64be(value_byte_length)+value_bytes",
    primitiveEncodings: {
      rawSha256: "decode_exact_lowercase_hex_to_32_bytes",
      finiteF64:
        "IEEE754_binary64_big_endian_bits_finite_only_negative_zero_rejected_positive_zero_canonical",
      nonnegativeU64: "unsigned_64_bit_big_endian",
      exactUtf8: "UTF8_without_BOM_or_normalization_change",
      canonicalJson:
        "RFC8785_UTF8_after_recursive_closed_schema_validation_and_negative_zero_rejection",
      interval: "finiteF64(lower)+finiteF64(upper)_with_lower<=upper",
      f64Tuple: "nonnegativeU64(element_count)+concatenated_finiteF64_elements",
      intervalTuple:
        "nonnegativeU64(element_count)+concatenated_interval_elements",
      strictRecordStream:
        "the_encoding_name_must_be_strictRecordStream:<schemaId>;_encode_nonnegativeU64(record_count)_then_each_record_in_the_schema_total_order_as_u64be(record_byte_length)+the_concatenation_of_fields_in_exactKeys_order_using_that_schema_fields_primitive_encodings",
      nonnegativeDyadic:
        "nonnegativeU64(numerator)+u32be(denominator_power)_in_reduced_form_with_denominator_power=0_or_numerator_odd_and_zero_encoded_only_as_0/2^0",
      closedEnum: "u16be(zero_based_index_in_the_declared_values_order)",
      f64Bits:
        "decode_exact_16_lowercase_hex_IEEE754_binary64_big_endian_bits_then_require_finite_and_not_negative_zero",
      boundedExactUtf8:
        "u64be(utf8_byte_length)+exact_UTF8_bytes_with_the_schema_length_and_enum_constraints",
    },
    sourceFieldSemantics: {
      sourceL2ScalarSha256:
        "array_hash_of_the_L2_scalar_odd_multipole_array_that_defines_the_authoritative_interior_scalar_reconstruction",
      sourceL2PotentialSha256:
        "array_hash_of_the_L2_potential_even_multipole_array_that_defines_the_authoritative_interior_potential_reconstruction",
    },
    strictRecordSchemas: [
      {
        schemaId: "coverRecord/v1",
        exactKeys: [
          "ordinal",
          "treeDepth",
          "sDepth",
          "etaDepth",
          "sLower",
          "sUpper",
          "etaLower",
          "etaUpper",
          "disposition",
          "gInterval",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<262144" },
          treeDepth: { encoding: "nonnegativeU64", constraint: "value<=48" },
          sDepth: { encoding: "nonnegativeU64", constraint: "value<=24" },
          etaDepth: { encoding: "nonnegativeU64", constraint: "value<=24" },
          sLower: { encoding: "nonnegativeDyadic", constraint: "0<=value<=1" },
          sUpper: { encoding: "nonnegativeDyadic", constraint: "0<=value<=1" },
          etaLower: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          etaUpper: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          disposition: {
            encoding: "closedEnum",
            values: ["split_s", "split_eta", "accepted_positive"],
          },
          gInterval: { encoding: "interval", constraint: "lower<=upper" },
        },
        recordInvariants: [
          "treeDepth=sDepth+etaDepth",
          "sLower<sUpper_and_etaLower<etaUpper",
          "accepted_positive_implies_gInterval.lower>0",
        ],
        totalOrder:
          "contiguous_ordinal_starting_at_zero_and_queue_pop_records_follow_ascending_treeDepth_then_lexicographic_sLower_etaLower_sUpper_etaUpper_with_each_parent_before_its_lower_then_upper_children",
      },
      {
        schemaId: "selectorRecord/v1",
        exactKeys: [
          "ordinal",
          "depth",
          "cLower",
          "cUpper",
          "fInterval",
          "newtonImageInterval",
          "disposition",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<65536" },
          depth: { encoding: "nonnegativeU64", constraint: "value<=32" },
          cLower: {
            encoding: "nonnegativeDyadic",
            constraint: "2^-32<=value<=2^16",
          },
          cUpper: {
            encoding: "nonnegativeDyadic",
            constraint: "2^-32<=value<=2^16",
          },
          fInterval: { encoding: "interval", constraint: "lower<=upper" },
          newtonImageInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          disposition: {
            encoding: "closedEnum",
            values: ["excluded", "split", "unique_root"],
          },
        },
        recordInvariants: [
          "cLower<cUpper",
          "unique_root_implies_newtonImageInterval_is_strictly_inside_[cLower,cUpper]",
        ],
        totalOrder:
          "contiguous_ordinal_starting_at_zero_then_ascending_depth_then_cLower_then_cUpper_with_lower_child_before_upper_child",
      },
      {
        schemaId: "liftDerivationRecord/v1",
        exactKeys: [
          "ordinal",
          "field",
          "angularModeEll",
          "coefficientIndex",
          "boundaryValueInterval",
          "boundarySDerivativeInterval",
          "boundaryXDerivativeInterval",
          "formulaId",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<32" },
          field: { encoding: "closedEnum", values: ["scalar", "potential"] },
          angularModeEll: {
            encoding: "nonnegativeU64",
            constraint: "even_value<=62",
          },
          coefficientIndex: {
            encoding: "nonnegativeU64",
            constraint: "value<=31",
          },
          boundaryValueInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          boundarySDerivativeInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          boundaryXDerivativeInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          formulaId: {
            encoding: "closedEnum",
            values: ["H_boundary_lift/v1", "Q_boundary_lift/v1"],
          },
        },
        recordInvariants: [
          "angularModeEll=2*coefficientIndex",
          "field=scalar_iff_formulaId=H_boundary_lift/v1",
          "field=potential_iff_formulaId=Q_boundary_lift/v1",
        ],
        totalOrder:
          "within_each_separate_scalar_or_potential_digest_stream_contiguous_ordinal_starting_at_zero_then_angularModeEll_then_coefficientIndex",
      },
      {
        schemaId: "roundingRecord/v1",
        exactKeys: [
          "ordinal",
          "arrayRole",
          "relativePath",
          "flatIndex",
          "exactInterval",
          "selectedF64BitsHex",
          "classification",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<524288" },
          arrayRole: {
            encoding: "closedEnum",
            values: [
              "newtonian_seed.base.scalar_u0",
              "newtonian_seed.base.potential_V0",
              "newtonian_seed.target.scalar_u_A",
              "newtonian_seed.target.potential_V_A",
            ],
          },
          relativePath: {
            encoding: "boundedExactUtf8",
            constraint: "1<=byte_length<=127_and_exact_inventory_path",
          },
          flatIndex: { encoding: "nonnegativeU64", constraint: "value<229376" },
          exactInterval: { encoding: "interval", constraint: "lower<=upper" },
          selectedF64BitsHex: {
            encoding: "f64Bits",
            constraint: "exactly_16_lowercase_hex",
          },
          classification: {
            encoding: "closedEnum",
            values: [
              "strict_finite",
              "certified_positive_zero_underflow",
              "prescribed_boundary_positive_zero",
              "negative_potential",
              "analytic_infinity_positive_zero",
            ],
          },
        },
        recordInvariants: [
          "relativePath_has_the_declared_arrayRole_and_flatIndex_is_in_that_inventory_shape",
          "selectedF64BitsHex_is_the_unique_RN_even_rounding_of_exactInterval",
        ],
        totalOrder:
          "contiguous_ordinal_starting_at_zero_then_inventory_relativePath_order_then_flatIndex_ascending",
      },
      {
        schemaId: "extractionRecord/v1",
        exactKeys: [
          "ordinal",
          "field",
          "radialOrder",
          "ell",
          "coefficientInterval",
          "quadratureRemainderInterval",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<320" },
          field: { encoding: "closedEnum", values: ["scalar", "potential"] },
          radialOrder: { encoding: "nonnegativeU64", constraint: "value<=4" },
          ell: { encoding: "nonnegativeU64", constraint: "value<=63" },
          coefficientInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          quadratureRemainderInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
        },
        recordInvariants: [
          "quadratureRemainderInterval_contains_zero",
          "field=scalar_implies_ell_is_one_of_1,3,...,63_and_field=potential_implies_ell_is_one_of_0,2,...,62",
        ],
        totalOrder:
          "exactly_320_records_with_contiguous_ordinal_starting_at_zero_then_field_scalar_before_potential_then_radialOrder_0_through_4_then_each_fields_32_represented_ell_values_ascending",
      },
      {
        schemaId: "stationaryRecord/v1",
        exactKeys: [
          "ordinal",
          "treeDepth",
          "regionId",
          "candidateKind",
          "domainFace",
          "derivativeEvidenceKind",
          "sDepth",
          "etaDepth",
          "sLower",
          "sUpper",
          "etaLower",
          "etaUpper",
          "valueInterval",
          "radialGradientInterval",
          "regularTransverseGradientInterval",
          "radialHessianInterval",
          "mixedHessianInterval",
          "regularTransverseHessianInterval",
          "disposition",
        ],
        extraKeysAllowed: false,
        fields: {
          ordinal: { encoding: "nonnegativeU64", constraint: "value<262144" },
          treeDepth: { encoding: "nonnegativeU64", constraint: "value<=108" },
          regionId: {
            encoding: "closedEnum",
            values: [
              "origin_value_cover",
              "physical_derivative",
              "c1_join_value_cover",
            ],
          },
          candidateKind: {
            encoding: "closedEnum",
            values: [
              "value_cover",
              "interior",
              "axis",
              "equator",
              "radial_boundary",
              "corner",
            ],
          },
          domainFace: {
            encoding: "closedEnum",
            values: [
              "interior",
              "originSlab",
              "c1JoinSlab",
              "theta0",
              "thetaPiOver2",
              "corner",
            ],
          },
          derivativeEvidenceKind: {
            encoding: "closedEnum",
            values: [
              "physical_regular",
              "not_applicable_value_cover_origin_slab",
              "not_applicable_value_cover_c1_join_slab",
            ],
          },
          sDepth: { encoding: "nonnegativeU64", constraint: "value<=52" },
          etaDepth: { encoding: "nonnegativeU64", constraint: "value<=56" },
          sLower: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          sUpper: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          etaLower: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          etaUpper: {
            encoding: "nonnegativeDyadic",
            constraint: "0<=value<=1",
          },
          valueInterval: { encoding: "interval", constraint: "lower<=upper" },
          radialGradientInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          regularTransverseGradientInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          radialHessianInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          mixedHessianInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          regularTransverseHessianInterval: {
            encoding: "interval",
            constraint: "lower<=upper",
          },
          disposition: {
            encoding: "closedEnum",
            values: [
              "split",
              "excluded",
              "stationary_other",
              "unique_axis_global_maximum",
            ],
          },
        },
        normalizedCoordinates: {
          s: "s=rho/(32/33)=33*rho/32",
          eta: "eta=2*theta/pi",
          storedBoxEndpoints:
            "sLower_sUpper_etaLower_etaUpper_are_reduced_dyadics_in_the_closed_unit_square",
        },
        physicalFaceMap: {
          interior: "2^-12<=s<=1-2^-12_and_0<eta<1",
          originSlab: "0<=s<=2^-12_including_the_physical_rho=0_face",
          c1JoinSlab: "1-2^-12<=s<=1_including_rho=32/33_x=32_C1_join_face",
          theta0: "eta=0_maps_to_theta=0",
          thetaPiOver2: "eta=1_maps_to_theta=pi/2",
          corner:
            "an_angular_face_intersection_with_the_closed_physical_derivative_middle_region_endpoint_with_both_equalities_recorded_by_the_box_endpoints",
        },
        derivativeCoordinateMap: {
          physicalCoordinates:
            "rho=(32/33)*s_theta=(pi/2)*eta_x=rho/(1-rho)_and_the_physical_regular_record_frame_is_the_orthonormal_radial_e_x_and_meridional_transverse_e_theta_frame",
          gradient:
            "radialGradient=partial_x(u)=(1-rho)^2*partial_rho(u)=(1-rho)^2*(33/32)*partial_s(u)_and_regularTransverseGradient=partial_theta(u)/x=(2/pi)*partial_eta(u)/x",
          radialHessian:
            "radialHessian=partial_x_x(u)=(1-rho)^4*partial_rho_rho(u)-2*(1-rho)^3*partial_rho(u)_with_partial_rho=(33/32)*partial_s_and_partial_rho_rho=(33/32)^2*partial_s_s",
          mixedHessian:
            "mixedHessian=partial_x_theta(u)/x-partial_theta(u)/x^2=((1-rho)^2*(33/32)*(2/pi)*partial_s_eta(u))/x-((2/pi)*partial_eta(u))/x^2",
          regularTransverseHessian:
            "regularTransverseHessian=partial_x(u)/x+partial_theta_theta(u)/x^2=((1-rho)^2*(33/32)*partial_s(u))/x+((2/pi)^2*partial_eta_eta(u))/x^2",
          regularAxisTransverse:
            "at_theta=0_and_rho>0_regularTransverseGradientInterval_is_exactly_[0,0]_by_even_axis_parity_regularTransverseHessianInterval_encloses_partial_x(u)/x+partial_theta_theta(u)/x^2_in_each_local_Cartesian_transverse_direction_and_mixedHessianInterval_is_[0,0]_by_parity",
          storedDerivativeIntervals:
            "when_derivativeEvidenceKind=physical_regular_all_gradient_and_Hessian_fields_are_physical_orthonormal_(e_x,e_theta)_intervals_after_these_directed_MPFR256_coordinate_and_connection_transformations_not_s_eta_derivatives",
          originSlabValueCover:
            "every_origin_value_cover_record_on_0<=sLower<sUpper<=2^-12_has_derivativeEvidenceKind=not_applicable_value_cover_origin_slab_domainFace=originSlab_candidateKind=value_cover_and_all_five_derivative_intervals_exactly_canonical_[+0,+0];_split_records_have_no_derivative_authority_and_every_terminal_leaf_has_disposition=excluded_with_valueInterval.upper<the_stationary_trace_header_interiorCandidateValueLower",
          c1JoinSlabValueCover:
            "every_c1_join_value_cover_record_on_1-2^-12<=sLower<sUpper<=1_has_derivativeEvidenceKind=not_applicable_value_cover_c1_join_slab_domainFace=c1JoinSlab_candidateKind=value_cover_and_all_five_derivative_intervals_exactly_canonical_[+0,+0];_split_records_have_no_derivative_authority_and_every_terminal_leaf_has_disposition=excluded_with_valueInterval.upper<the_stationary_trace_header_interiorCandidateValueLower_because_the_piecewise_continuum_is_only_C1_at_s=1",
        },
        recordInvariants: [
          "treeDepth=sDepth+etaDepth_with_each_region_root_at_treeDepth=sDepth=etaDepth=0",
          "sLower<=sUpper_and_etaLower<=etaUpper",
          "domainFace_and_candidateKind_equal_the_frozen_physicalFaceMap_of_the_normalized_box",
          "regionId=origin_value_cover_if_and_only_if_0<=sLower<sUpper<=2^-12_candidateKind=value_cover_domainFace=originSlab_derivativeEvidenceKind=not_applicable_value_cover_origin_slab_disposition_is_split_or_excluded_and_all_five_derivative_intervals_are_exactly_[+0,+0]",
          "regionId=c1_join_value_cover_if_and_only_if_1-2^-12<=sLower<sUpper<=1_candidateKind=value_cover_domainFace=c1JoinSlab_derivativeEvidenceKind=not_applicable_value_cover_c1_join_slab_disposition_is_split_or_excluded_and_all_five_derivative_intervals_are_exactly_[+0,+0]",
          "every_terminal_value_cover_leaf_has_disposition=excluded_and_valueInterval.upper<stationary_trace_header.interiorCandidateValueLower_while_every_nonterminal_value_cover_record_has_disposition=split",
          "regionId=physical_derivative_if_and_only_if_2^-12<=sLower<=sUpper<=1-2^-12_derivativeEvidenceKind=physical_regular_candidateKind_is_not_value_cover_and_all_derivative_intervals_enclose_the_declared_physical_regular_coordinate_quantities",
          "unique_axis_global_maximum_implies_candidateKind=axis_domainFace=theta0_and_both_gradient_intervals_contain_zero",
        ],
        totalOrder:
          "after_all_three_deterministic_region_queues_complete_serialize_with_contiguous_ordinal_starting_at_zero_then_ascending_treeDepth=sDepth+etaDepth_then_regionId_order_origin_value_cover_physical_derivative_c1_join_value_cover_then_lexicographic_sLower_etaLower_sUpper_etaUpper_candidateKind_domainFace",
      },
    ],
    entries: [
      {
        receiptField: "coverTraceSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/cover-trace/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2ScalarSha256", "rawSha256"],
          ["coverRecords", "strictRecordStream:coverRecord/v1"],
        ],
        streamPopulation:
          "exactly_one_coverRecord_for_every_deterministic_compactCover_queue_pop_including_each_split_parent_and_each_accepted_leaf_in_queue_pop_order;_the_root_has_treeDepth=sDepth=etaDepth=0_each_split_child_increments_exactly_the_selected_sDepth_or_etaDepth_by_one_and_treeDepth=sDepth+etaDepth;_no_omitted_or_duplicate_pop;_ordinals_are_0_through_coverRecordCount-1_and_the_nodeless_receipt_coverRecordCount_equals_the_stream_record_count",
      },
      {
        receiptField: "coulombSelectorTraceSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/coulomb-selector-trace/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2ScalarSha256", "rawSha256"],
          ["sourceL2PotentialSha256", "rawSha256"],
          ["CInterval", "interval"],
          ["CRepresentative", "finiteF64"],
          ["pRepresentative", "finiteF64"],
          ["totalNInterval", "interval"],
          ["totalNRepresentative", "finiteF64"],
          ["interiorNInterval", "interval"],
          ["tailMassInterval", "interval"],
          ["coulombSearchIntervalCount", "nonnegativeU64"],
          ["coulombSearchMaximumDepth", "nonnegativeU64"],
          ["selectorRecords", "strictRecordStream:selectorRecord/v1"],
        ],
        streamPopulation:
          "exactly_one_selectorRecord_for_every_deterministic_Coulomb_search_queue_pop_including_excluded_split_and_unique_root_intervals_in_queue_pop_order;_no_omitted_or_duplicate_pop;_ordinals_are_0_through_coulombSearchIntervalCount-1_and_the_receipt_count_equals_the_stream_record_count",
      },
      {
        receiptField: "scalarBoundaryLiftSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/scalar-boundary-lift/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2ScalarSha256", "rawSha256"],
          ["CRepresentative", "finiteF64"],
          ["pRepresentative", "finiteF64"],
          ["formulaId", "exactUtf8:H_boundary_lift/v1"],
          [
            "liftDerivationRecords",
            "strictRecordStream:liftDerivationRecord/v1",
          ],
        ],
        streamPopulation:
          "exactly_32_scalar_records_only_with_field=scalar_formulaId=H_boundary_lift/v1_ordinal=coefficientIndex=0..31_and_angularModeEll=2*coefficientIndex;_no_potential_record_no_omission_and_no_duplicate;_the_nodeless_receipt_scalarBoundaryLiftRecordCount_equals_32",
      },
      {
        receiptField: "potentialBoundaryLiftSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/potential-boundary-lift/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2PotentialSha256", "rawSha256"],
          ["CRepresentative", "finiteF64"],
          ["pRepresentative", "finiteF64"],
          ["formulaId", "exactUtf8:Q_boundary_lift/v1"],
          [
            "liftDerivationRecords",
            "strictRecordStream:liftDerivationRecord/v1",
          ],
        ],
        streamPopulation:
          "exactly_32_potential_records_only_with_field=potential_formulaId=Q_boundary_lift/v1_ordinal=coefficientIndex=0..31_and_angularModeEll=2*coefficientIndex;_no_scalar_record_no_omission_and_no_duplicate;_the_nodeless_receipt_potentialBoundaryLiftRecordCount_equals_32",
      },
      {
        receiptField: "tailCoefficientInventorySha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/tail-coefficient-inventory/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["tailScalarRepresentativeCoefficients", "f64Tuple"],
          ["tailPotentialRepresentativeCoefficients", "f64Tuple"],
          ["tailScalarContinuationCoefficientIntervals", "intervalTuple"],
          ["tailPotentialContinuationCoefficientIntervals", "intervalTuple"],
        ],
      },
      {
        receiptField: "representativeContinuumSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/representative-continuum/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2ScalarSha256", "rawSha256"],
          ["sourceL2PotentialSha256", "rawSha256"],
          ["CRepresentative", "finiteF64"],
          ["pRepresentative", "finiteF64"],
          ["scalarBoundaryLiftSha256", "rawSha256"],
          ["potentialBoundaryLiftSha256", "rawSha256"],
          ["tailCoefficientInventorySha256", "rawSha256"],
          ["formulaId", "exactUtf8:piecewise_L2_HQ_lifted_tail/v1"],
        ],
      },
      {
        receiptField: "exteriorRoundingTraceSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/exterior-rounding-trace/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["representativeContinuumSha256", "rawSha256"],
          ["auditGridDefinition", "canonicalJson"],
          ["roundingRecords", "strictRecordStream:roundingRecord/v1"],
        ],
        auditGridDefinitionSource: {
          exactValue: {
            gridLevel: {
              id: "AUDIT",
              radialNodeCount: 256,
              angularNodeCount: 128,
              radialLobattoIndexAscending: true,
              angularLobattoIndexAscending: true,
            },
            rhoNodeFormula: {
              expression: "rho_i=(1-cos(pi*i/255))/2",
              indexMinimum: 0,
              indexMaximum: 255,
              order: "i_ascending",
            },
            thetaNodeFormula: {
              expression: "theta_j=(pi/4)*(1-cos(pi*j/127))",
              indexMinimum: 0,
              indexMaximum: 127,
              order: "j_ascending",
            },
            roundingProtocol: {
              evaluator: "MPFR_binary256",
              mapping: "unique_IEEE754_binary64_RN_even",
              zeroSign: "positive",
            },
            fieldArrayInventory: [
              {
                arrayRole: "newtonian_seed.base.scalar_u0",
                relativePath: "arrays/AUDIT/02-base_scalar_u0.f64le",
                shape: [256, 128],
                elementCount: 32768,
                flatIndex: "i*128+j",
              },
              {
                arrayRole: "newtonian_seed.base.potential_V0",
                relativePath: "arrays/AUDIT/03-base_potential_V0.f64le",
                shape: [256, 128],
                elementCount: 32768,
                flatIndex: "i*128+j",
              },
              {
                arrayRole: "newtonian_seed.target.scalar_u_A",
                relativePath: "arrays/AUDIT/04-target_scalar_u_A.f64le",
                shape: [7, 256, 128],
                elementCount: 229376,
                flatIndex: "stage*32768+i*128+j",
              },
              {
                arrayRole: "newtonian_seed.target.potential_V_A",
                relativePath: "arrays/AUDIT/05-target_potential_V_A.f64le",
                shape: [7, 256, 128],
                elementCount: 229376,
                flatIndex: "stage*32768+i*128+j",
              },
            ],
          },
          exactValueRequiredWithNoExtraKeysAtAnyDepth: true,
          canonicalJsonKeysInOrder:
            "canonical_JSON_lexicographic_object_key_order_and_preserved_array_order",
        },
        streamPopulation:
          "exactly_524288_rounding_records_covering_every_element_once_and_only_once_in_the_four_declared_AUDIT_field_role_arrays_in_exactArrayInventoryOrder_then_flatIndex_ascending;_ordinals_are_0..524287_no_omission_or_duplicate_and_the_nodeless_receipt_exteriorRoundingRecordCount_equals_524288",
      },
      {
        receiptField: "derivativeMultipoleTraceSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/origin-derivative-multipole-trace/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceL2ScalarSha256", "rawSha256"],
          ["sourceL2PotentialSha256", "rawSha256"],
          ["a1Interval", "interval"],
          ["VcInterval", "interval"],
          ["a3Interval", "interval"],
          ["b2Interval", "interval"],
          ["b4Interval", "interval"],
          ["normalizedDefectsInSchemaOrder", "f64Tuple"],
          ["extractionRecords", "strictRecordStream:extractionRecord/v1"],
        ],
        streamPopulation:
          "exactly_320_records:_scalar_then_potential_outer_field_order_each_radialOrder=0..4_then_scalar_ell=1,3,...,63_or_potential_ell=0,2,...,62_ascending;_these_are_all_and_only_the_5_times_32_coefficients_of_each_authoritative_finite_parity_basis;_unrepresented_and_opposite_parity_modes_are_symbolically_zero_by_the_basis_and_are_not_optional_stream_records;_no_omission_or_duplicate_and_the_origin_receipt_extractionRecordCount_equals_320",
      },
      {
        receiptField: "stationaryTraceSha256",
        domain:
          "nhm2-prolate-boson-star-newtonian-seed/derived/stationary-trace/v1\n",
        orderedFields: [
          ["protocolBinding", "canonicalJson"],
          ["sourceRepresentativeContinuumSha256", "rawSha256"],
          ["stationaryRecordCount", "nonnegativeU64"],
          ["originValueCoverRecordCount", "nonnegativeU64"],
          ["physicalDerivativeRecordCount", "nonnegativeU64"],
          ["c1JoinValueCoverRecordCount", "nonnegativeU64"],
          ["uniquePeakBoxIndex", "nonnegativeU64"],
          ["rhoPeakInterval", "interval"],
          ["thetaPeakInterval", "interval"],
          ["xPeakInterval", "interval"],
          ["A0Interval", "interval"],
          ["interiorCandidateValueLower", "finiteF64"],
          ["radialHessianEigenvalueUpper", "finiteF64"],
          ["regularTransverseHessianEigenvalueUpper", "finiteF64"],
          ["hessianDeterminantLower", "finiteF64"],
          ["globalDominanceMarginLower", "finiteF64"],
          ["exteriorTailSupremumUpper", "finiteF64"],
          ["stationaryRecords", "strictRecordStream:stationaryRecord/v1"],
        ],
        streamPopulation:
          "the_three_exact_closed_cover_roots_are_origin_value_cover_[0,2^-12]x[0,1]_physical_derivative_[2^-12,1-2^-12]x[0,1]_and_c1_join_value_cover_[1-2^-12,1]x[0,1];_emit_exactly_one_stationaryRecord_for_every_deterministic_region_queue_pop_with_no_omission_or_duplicate_within_a_region;_children_are_created_only_by_exact_dyadic_midpoint_splits_with_sDepth<=52_etaDepth<=56_treeDepth=sDepth+etaDepth<=108_no_contracted_interval_Newton_or_Krawczyk_box_is_a_record_and_total_record_count<=262144;_the_s_root_denominator_exponent_12_plus_sDepth_never_exceeds_64_so_every_reduced_nonnegativeDyadic_numerator_fits_u64;_the_only_cross-region_overlap_is_the_shared_s=2^-12_or_s=1-2^-12_face_and_both_adjoining_value_enclosures_must_be_consistent_and_both_gates_pass;_stationaryRecordCount_equals_the_stream_count_and_the_exact_sum_of_the_three_region_counts;_after_queue_completion_records_are_canonically_sorted_by_treeDepth_regionId_and_the_declared_lexicographic_order_with_ordinals_0_through_stationaryRecordCount-1;_uniquePeakBoxIndex_is_the_actual_stream_ordinal_of_the_one_unique_axis_global_maximum_record",
      },
    ],
    entryDomainsMustBeUnique: true,
    receiptFieldsMustBeUnique: true,
    strictRecordSchemaIdsMustBeUnique: true,
    everyStrictRecordStreamMustReferenceExactlyOneDeclaredSchemaId: true,
    everyRecordObjectMustHaveExactKeysInDeclaredOrderAndNoExtras: true,
    everyRecordOrdinalMustBeContiguousFromZeroInTheDeclaredTotalOrder: true,
    everyStrictRecordStreamPopulationMustBeExactCompleteAndReceiptCountBound: true,
    everyCanonicalJsonRegistrySourceMustEqualItsDeclaredExactValue: true,
    schemaFieldOrderOrEnumOrderMutationChangesDigest: true,
    extraOrReorderedPreimageFieldsAllowed: false,
    producerSuppliedDigestWithoutServerPreimageReplayPasses: false,
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL =
  deepFreezeEarly({
    artifactId: "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol",
    protocolVersion:
      "nhm2.prolate_boson_star_newtonian_seed.proof_replay_protocol/v1",
    authority: "server_replayed_certificate_protocol_only",
    implementationClosureInputId: "seed_continuous_nodeless_proof_kernel",
    proofKernelArtifactBindingRequired: true,
    proofKernelSha256AndCanonicalSizeRequired: true,
    producerKernelOrReceiptHasAuthority: false,
    derivedHashRegistry:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_DERIVED_HASH_REGISTRY,
    arithmetic: {
      engine: "MPFR_binary256",
      rounding: "directed_outward_for_every_primitive_and_transcendental",
      binary64Inputs: "exact_bit_pattern_injection",
      nonfiniteAllowed: false,
      negativeZeroAllowed: false,
    },
    interpolant: {
      subject:
        "unique_radial_Chebyshev_times_parity_Legendre_polynomial_defined_by_the_final_post_projection_L2_scalar_odd_and_potential_even_multipole_arrays;_the_L2_nodal_field_arrays_are_only_the_unique_RN_even_resampling_of_that_same_polynomial",
      nodalToCoefficientTransform:
        "for_each_parity_Legendre_mode_apply_radial_DCT_I_on_the_frozen_rho_Lobatto_nodes_with_every_radial_coefficient_outward_enclosed_in_MPFR_binary256;_no_theta_Chebyshev_polynomial_has_continuum_authority",
      intervalExtension:
        "radial_interval_Clenshaw_combined_with_even_or_odd_Legendre_Clenshaw_evaluation_of_the_outward_coefficient_boxes",
      derivatives:
        "analytically_differentiate_the_enclosed_radial_Chebyshev_and_angular_Legendre_coefficients_then_use_the_same_interval_Clenshaw_evaluators",
      radialBarycentricEquivalenceRequired: true,
      nodalResamplingIdentityRequired: true,
      scalarOddLegendreModes: "ell=1,3,...,63_for_L2",
      potentialEvenLegendreModes: "ell=0,2,...,62_for_L2",
      exactAngularFactors:
        "odd_P_ell(cos(theta))_have_an_exact_symbolic_cos(theta)_factor_and_even_P_ell(cos(theta))_have_exact_axis_and_equator_Neumann_parity",
      raw_barycentric_denominator_interval_division_allowed: false,
    },
    compactCover: {
      normalizedCoordinates: ["s=rho/(32/33)", "eta=2*theta/pi"],
      initialBox: "[0,1]_s_times_[0,1]_eta",
      endpointEncoding: "reduced_dyadic_integer_numerator_and_power_of_two",
      queueOrder:
        "ascending_treeDepth=sDepth+etaDepth_then_lexicographic_(sLower,etaLower,sUpper,etaUpper)",
      splitDimension:
        "largest_normalized_width_with_s_before_eta_on_an_exact_tie",
      splitPoint: "exact_dyadic_midpoint",
      childOrder: "lower_child_then_upper_child",
      depthTransition:
        "the_root_has_sDepth=etaDepth=treeDepth=0_and_each_split_increments_exactly_one_of_sDepth_or_etaDepth_by_one_so_every_record_has_treeDepth=sDepth+etaDepth",
      maximumAdaptiveBoxes: 262144,
      maximumSubdivisionDepthPerCoordinate: 24,
      coverCompleteness:
        "accepted_leaf_boxes_must_have_pairwise_disjoint_interiors_and_their_exact_dyadic_union_must_equal_the_initial_box",
      traceCompleteness:
        "emit_exactly_one_coverRecord_for_every_queue_pop_including_split_parents_and_accepted_leaves_with_contiguous_ordinal_and_bind_the_total_to_nodelessProofReceipt.coverRecordCount;_acceptedCompactBoxCount_counts_exactly_the_accepted_positive_leaf_dispositions",
      unresolvedBoxPasses: false,
    },
    removableFactorEvaluation: {
      factoredField: "g=u/(x*cos(theta))",
      origin:
        "the_scalar_multipole_radial_polynomials_have_exact_positive_zero_at_rho=0_and_are_symbolically_divided_by_rho_then_multiplied_by_(1-rho)_to_remove_x=rho/(1-rho);_the_endpoint_value_equals_partial_x(u)(0,theta)/cos(theta)_without_claiming_higher_radial_regularity",
      equator:
        "symbolically_divide_each_odd_Legendre_P_ell(cos(theta))_by_its_exact_cos(theta)_factor;_the_equator_limit_equals_minus_partial_theta(u)(x,pi/2)/x",
      originEquatorCorner:
        "define_g(0,pi/2)=-partial_x_partial_theta(u)(0,pi/2)_by_the_joint_derivative_limit",
      rawDivisionByIntervalsContainingZeroAllowed: false,
    },
    coulombTail: {
      interiorTailJoin:
        "xTail=32_exactly_and_rhoTail=32/33_exactly_independent_of_every_grid",
      representabilityReason:
        "the_base_exp(-kappa0*xTail)=exp(-32)_scale_is_binary64_representable",
      tailCoordinate: "y=1/x_on_[0,1/32]",
      liftingCoordinate: "s=32/x=32*y_on_[0,1]_with_the_join_at_s=1",
      definitions: [
        "N_rep=RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_server_MPFR256_outward_integral_interval_for_the_single_deterministic_piecewise_representative",
        "C_rep=the_unique_RN_even_binary64_value_selected_by_the_frozen_Coulomb_consistency_isolation_and_enclosing_N_rep/(4*pi)",
        "kappa=sqrt(-2*nu)_with_kappa0=1_for_the_base_gauge",
        "p_rep=the_unique_RN_even_binary64_result_of_MPFR256(C_rep/kappa-1)_without_an_independent_producer_choice",
        "H_J(theta)=u_L2(32,theta)/(exp(-kappa*32)*32^p_rep*cos(theta))_with_axis_and_equator_regular_quotient_limits_and_H_sJ=partial_s_of_that_scaled_quotient_derived_from_exact_L2_u_and_partial_x_u",
        "H_rep(s,theta)=H_J(theta)+(s-1)*H_sJ(theta)+(1-s)^2*sum_(n=0..16,q=0..63)(cU_rep[n,q]*s^n*P_(2q)(cos(theta)))",
        "u_rep=exp(-kappa*x)*x^p_rep*cos(theta)*H_rep(32/x,theta)",
        "Q_J(theta)=32^3*(V_L2(32,theta)+C_rep/32)_and_Q_sJ=partial_s((V_L2+C_rep/x)*x^3)_at_s=1_from_exact_L2_V_and_partial_x_V",
        "Q_rep(s,theta)=Q_J(theta)+(s-1)*Q_sJ(theta)+(1-s)^2*sum_(n=0..16,q=0..63)(cV_rep[n,q]*s^n*P_(2q)(cos(theta)))",
        "V_rep=-C_rep/x+Q_rep(32/x,theta)/x^3",
        "H_u=u_rep/(exp(-kappa*x)*x^p_rep*cos(theta))",
        "D_tail=-partial_x(u_rep)/(exp(-kappa*x)*x^p_rep*cos(theta))",
      ],
      deterministicCoulombSelector: {
        admissibleSearchDomain: {
          exact: "[2^-32,2^16]",
          lower: 2 ** -32,
          upper: 2 ** 16,
          endpointsAreAdmissibleRoots: false,
        },
        consistencyFunction:
          "F_enclosure(C)=C-N_enclosure(C)/(4*pi)_for_the_continuous_interval_tail_continuation_before_any_binary64_representatives_are_selected",
        isolation:
          "MPFR256_directed_interval_Newton_with_the_same_dyadic_queue_split_and_tie_rules_isolates_one_C_interval_of_width_at_most_2^-48_proves_no_other_admissible_root_and_requires_the_whole_interval_to_round_to_one_binary64_value",
        deterministicSearch:
          "start_with_exactly_the_one_frozen_search_interval_then_process_by_ascending_depth_and_lower_endpoint_split_only_at_exact_dyadic_midpoints_lower_child_first_with_maximum_65536_intervals_and_depth_32",
        traceCompleteness:
          "emit_exactly_one_selectorRecord_for_every_search_queue_pop_with_contiguous_ordinal_and_bind_the_stream_count_exactly_to_nodelessProofReceipt.coulombSearchIntervalCount",
        admissibleRoot:
          "one_simple_strictly_interior_root_box_whose_interval_Newton_image_is_strictly_inside_the_box_and_whose_derivative_interval_excludes_zero",
        failure:
          "zero_roots_multiple_roots_any_boundary_touching_or_unresolved_root_box_budget_exhaustion_or_any_need_to_widen_or_shift_the_search_domain_fails_closed",
        postRunBracketAdjustmentAllowed: false,
        representative:
          "C_rep_is_the_unique_RN_even_binary64_rounding_of_the_isolated_C_interval_with_zero_sign_canonicalized_positive",
        replay:
          "after_selecting_C_rep_the_server_resynthesizes_all_tail_coefficient_intervals_at_that_exact_binary64_value_then_selects_each_coefficient_by_the_frozen_midpoint_rule_and_recomputes_N_rep_once_from_the_result_without_a_circular_reselection",
        consistencyGate:
          "CInterval_contains_C_rep_totalNInterval_contains_N_rep_and_abs(4*pi*C_rep-N_rep)/max(N_rep,1e-300)<=1e-12",
        producerChosenFixedPointOrRepresentativeAllowed: false,
      },
      scaledRadialDecreaseField: {
        field: "D_tail",
        domain: "x>=32_and_0<=theta<=pi/2",
        axisLimit: "direct_limit_with_cos(0)=1",
        equatorLimit: "partial_x_partial_theta(u)/(exp(-kappa*x)*x^p)",
        infinityLimit: "kappa*a_infinity(theta)/cos(theta)>0",
        originLimit: "not_applicable_because_the_frozen_domain_starts_at_x=32",
        strictAcceptance: "global_interval_lower_bound_of_D_tail>0",
      },
      angularWitness:
        "the_regular_even_Legendre_quotient_H_infinity(theta)=H_J(theta)-H_sJ(theta)+sum_q_cU_rep[0,q]*P_(2q)(cos(theta))_equals_a_infinity(theta)/cos(theta)_and_is_directly_interval_evaluated_with_the_boundary_lift_and_correction_enclosures_to_prove_strict_positivity",
      legendreNormalization: "P_ell(1)=1",
      tailTaylorModelOrder: 16,
      regularQuotientAngularModeMaximum: 126,
      coefficientIndex: "flat_index=n*64+q_with_n_outer_q_inner",
      scalarCoefficientSemantics:
        "cU[n,q]_multiplies_the_even_Legendre_mode_P_(2q)_of_the_regular_H_correction_in_s^n_after_the_(1-s)^2_C1_lifting_factor",
      potentialCoefficientSemantics:
        "cV[n,q]_multiplies_the_even_Legendre_mode_P_(2q)_of_the_regular_Q_correction_in_s^n_after_the_(1-s)^2_C1_lifting_factor",
      potentialMonopoleRule:
        "the_-C*y_term_is_fixed_and_subtracted_before_the_y^3_even_Legendre_expansion_no_y^2_term_is_allowed",
      construction:
        "server_constructs_a_finite_approximate_coupled_u_V_tail_representative_in_s_from_exact_real_L2_C1_boundary_lifts_and_hash_bound_correction_coefficients",
      rawJoinValueAndDerivativeAloneSufficient: false,
      fixedBoundaryData:
        "the_boundary_values_and_first_x_derivatives_are_the_exact_real_evaluations_of_the_unique_L2_radial_Chebyshev_times_parity_Legendre_reconstructions_at_x=32_not_free_overlap_variables",
      exactBoundaryLifting:
        "H_J_H_sJ_Q_J_Q_sJ_are_hash_bound_exact_real_functions_derived_from_the_L2_polynomials_and_the_selected_C_rep_p_rep;_the_(1-s)^2_correction_factor_makes_rounded_correction_coefficients_unable_to_change_either_join_value_or_first_derivative",
      continuationWitness:
        "1088_scalar_and_1088_potential_outward_interval_coefficients_in_tail_order_outer_angular_mode_inner_order_plus_radii_and_remainder_bounds",
      representativeSelection:
        "for_each_server_recomputed_coefficient_interval_store_RN_even_binary64_of_its_exact_dyadic_midpoint_and_canonicalize_either_zero_sign_to_positive_zero",
      remainderEvaluation: {
        scalar:
          "R_U_is_only_an_outward_weighted_error_enclosure_around_u_rep_and_its_required_derivatives_never_an_additive_or_selectable_function_value",
        potential:
          "R_V_is_only_an_outward_error_enclosure_around_V_rep_after_fixed_monopole_subtraction_and_y^3_factoring_never_an_additive_or_selectable_function_value",
      },
      representativeAuthority:
        "u_rep_and_V_rep_with_no_free_remainder_term_are_the_only_exterior_values_used_for_AUDIT_arrays_N_T_W_P_V_flux_peak_nodeless_scaling_and_BVP_initialization",
      outputRounding:
        "evaluate_the_piecewise_continuum_in_MPFR256_then_require_a_unique_RN_even_binary64_value_for_every_AUDIT_and_BVP_initialization_component_with_zero_sign_canonicalized_positive",
      matchConditions: [
        "the_H_boundary_lift_makes_tail_u_equal_the_fixed_exact_real_L2_u_at_x=32",
        "the_H_s_boundary_lift_makes_tail_partial_x_u_equal_the_fixed_exact_real_L2_partial_x_u_at_x=32",
        "the_Q_boundary_lift_makes_tail_V_equal_the_fixed_exact_real_L2_V_at_x=32",
        "the_Q_s_boundary_lift_makes_tail_partial_x_V_equal_the_fixed_exact_real_L2_partial_x_V_at_x=32",
      ],
      joinRegularity:
        "exact_C1_equality_is_imposed_second_x_derivative_jumps_are_allowed_and_no_distributional_delta_term_is_permitted",
      joinIntervalsRole:
        "outward_intervals_only_enclose_the_fixed_exact_boundary_data_and_do_not_admit_a_free_splice",
      enclosureProof:
        "a_radii_polynomial_Y_plus_Z_of_r_less_than_or_equal_to_r_with_strict_Zprime_less_than_one_certifies_evaluation_and_remainder_enclosures_of_the_finite_tail_representation_not_an_exact_elliptic_Cauchy_solution",
      radiiPolynomialSemantics: {
        commonNorm:
          "for_dimensionless_H_and_Q_correction_vectors_delta_c_define_norm_w=max_over_both_fields_and_n=0..16_q=0..63_of_2^n*(65/64)^(2q)*abs(delta_c[n,q])",
        units: "dimensionless_for_Y_Z_r_and_Zprime",
        Y: "tailRadiiY_is_the_directed_outward_upper_bound_of_the_common_norm_of_the_fixed_point_defect",
        Z: "tailRadiiZ_is_the_directed_outward_upper_bound_Z(tailRadius)_in_the_same_common_norm",
        radius: "tailRadius_is_the_positive_radius_r_in_the_same_common_norm",
        contraction:
          "tailContractionUpper_is_the_directed_outward_upper_bound_of_Zprime(tailRadius)_in_the_same_common_norm",
        acceptance:
          "tailRadiiY+tailRadiiZ<=tailRadius_and_tailContractionUpper<1",
      },
      residualDuty:
        "server_recomputes_normalized_Schrodinger_and_Poisson_residuals_throughout_x_greater_than_or_equal_to_32_and_at_both_one_sided_join_limits_each_with_maximum_1e-10",
      positivityProof:
        "global_lower_bound_of_H_u_is_strictly_positive_global_lower_bound_of_a_infinity_over_cos_is_strictly_positive_and_the_global_absolute_remainder_ratio_is_strictly_less_than_one",
      retryWithDifferentOrderNormOrJoinAllowed: false,
    },
    stationaryAndPeakReplay: {
      closedRegionCover: {
        originValueCover: {
          regionId: "origin_value_cover",
          exactDomain: "[0,2^-12]_s_times_[0,1]_eta",
          derivativeAuthority: false,
        },
        physicalDerivative: {
          regionId: "physical_derivative",
          exactDomain: "[2^-12,1-2^-12]_s_times_[0,1]_eta",
          derivativeAuthority: true,
        },
        c1JoinValueCover: {
          regionId: "c1_join_value_cover",
          exactDomain: "[1-2^-12,1]_s_times_[0,1]_eta",
          derivativeAuthority: false,
        },
        originCutoff: { exact: "2^-12", value: 2 ** -12 },
        joinCutoff: { exact: "1-2^-12", value: 1 - 2 ** -12 },
        overlapAndGapRule:
          "this_is_a_three-region_closed_cover_not_a_disjoint_closed_partition;_region_interiors_are_disjoint_the_only_overlaps_are_the_complete_s=2^-12_and_s=1-2^-12_faces_the_two_adjoining_directed_value_enclosures_must_have_nonempty_consistent_intersection_and_both_adjoining_gates_must_pass_and_there_is_no_other_overlap_or_gap",
        queueAndDepthRule:
          "each_region_root_has_sDepth=etaDepth=treeDepth=0_every_child_is_created_only_by_an_exact_dyadic_midpoint_split_in_exactly_one_selected_coordinate_sDepth_is_at_most_52_etaDepth_is_at_most_56_treeDepth=sDepth+etaDepth_is_at_most_108_the_s_root_denominator_exponent_12_plus_sDepth_is_at_most_64_for_the_u64_dyadic_numerator_encoding_and_the_combined_three-region_record_budget_is_262144",
        contractedNewtonOrKrawczykBoxBecomesARecordAllowed: false,
        cutoffRetuneWidenOrShiftAllowed: false,
      },
      normalizedRecordCoordinates: {
        s: "s=rho/(32/33)=33*rho/32_on_[0,1]",
        eta: "eta=2*theta/pi_on_[0,1]",
        dyadicDuty:
          "only_s_and_eta_box_endpoints_are_stored_as_reduced_dyadics_in_stationaryRecord/v1",
        physicalFaceMap:
          "s=0_is_rho0_s=1_is_rhoTail_eta=0_is_theta0_eta=1_is_thetaPiOver2_and_intersections_are_corner;_the_exterior_infinity_face_is_excluded_by_the_separate_D_tail_proof_not_encoded_as_a_compact_stationary_record",
      },
      directedDerivativeMap: {
        gradient:
          "partial_x=(1-rho)^2*(33/32)*partial_s_and_the_orthonormal_transverse_gradient_is_(2/pi)*partial_eta/x",
        hessian:
          "H_xx=(1-rho)^4*(33/32)^2*partial_s_s-2*(1-rho)^3*(33/32)*partial_s_H_xT=((1-rho)^2*(33/32)*(2/pi)*partial_s_eta)/x-((2/pi)*partial_eta)/x^2_and_H_TT=((1-rho)^2*(33/32)*partial_s)/x+((2/pi)^2*partial_eta_eta)/x^2_with_every_operation_outward_rounded_in_MPFR256",
        regularAxis:
          "at_theta=0_and_rho>0_the_regular_local_Cartesian_transverse_gradient_and_radial_transverse_mixed_Hessian_are_exact_zero_by_the_even_axis_basis_and_each_transverse_Hessian_eigenvalue_is_the_directed_limit_partial_x(u)/x+partial_theta_theta(u)/x^2",
        originSlabValueCover:
          "every_origin_slab_record_uses_not_applicable_value_cover_origin_slab_with_all_derivative_and_Hessian_intervals_canonical_[+0,+0]_and_zero_authority;_records_may_split_by_the_frozen_queue_rule_but_every_terminal_leaf_must_be_value-excluded_below_the_same_interiorCandidateValueLower",
        c1JoinSlabValueCover:
          "every_C1_join_slab_record_uses_not_applicable_value_cover_c1_join_slab_with_all_derivative_and_Hessian_intervals_canonical_[+0,+0]_and_zero_authority;_records_may_split_by_the_frozen_queue_rule_but_every_terminal_leaf_must_be_value-excluded_below_the_same_interiorCandidateValueLower_and_no_gradient_or_Hessian_exclusion_is_allowed",
        receiptCoordinates:
          "rhoPeakInterval_thetaPeakInterval_and_xPeakInterval_remain_physical_coordinates_and_are_directed_images_of_the_unique_normalized_axis_box",
      },
      stationaryOperator:
        "interval_gradient_in_regular_local_coordinates_with_boundary_KT_candidates",
      executionAndCanonicalTraceOrder:
        "first_run_the_physical_derivative_middle_region_queue_to_isolate_the_candidate_and_its_lower_bound_then_run_the_origin_and_C1_join_value-cover_queues_against_that_fixed_bound;_after_all_queues_complete_canonically_serialize_every_queue-pop_record_by_treeDepth=sDepth+etaDepth_then_regionId_order_origin_value_cover_physical_derivative_c1_join_value_cover_then_the_frozen_dyadic_lexicographic_fields;_execution_phase_order_has_no_effect_on_ordinals",
      isolationMethod:
        "interval_Newton_then_Krawczyk_may_only_certify_exclusion_or_uniqueness_of_the_current_dyadic_box;_every_recorded_child_box_is_created_only_by_the_frozen_exact_midpoint_split_and_no_contracted_Newton_or_Krawczyk_image_may_replace_a_record_box",
      axisSecondDerivative: "regular_local_Cartesian_transverse_Hessian_limit",
      uniqueness:
        "all_stationary_and_boundary_candidate_boxes_isolated_before_one_strict_negative_definite_global_maximum_is_admitted",
      dominance:
        "candidate_value_lower_bound_strictly_exceeds_every_other_compact_box_upper_bound_and_the_verified_exterior_tail_supremum_upper_bound",
      exteriorTailDuty:
        "prove_D_tail>0_with_regular_axis_equator_and_infinity_limits_to_exclude_every_exterior_stationary_maximizer_and_bound_sup_x_greater_than_or_equal_to_32_abs_u_strictly_below_the_interior_candidate_lower_bound",
      traceCompleteness:
        "emit_exactly_one_stationaryRecord_for_every_queue_pop_in_each_of_the_three_region_queues_including_every_split_and_terminal_disposition_with_no_omission_or_duplicate_within_a_region_bind_each_region_count_and_their_sum_to_peakProofReceipt_define_treeDepth=sDepth+etaDepth_for_each_region_root_enforce_sDepth<=52_etaDepth<=56_treeDepth<=108_and_define_uniquePeakBoxIndex_as_the_actual_canonical_stream_ordinal_of_the_unique_axis_global_maximum_record",
      valueCoverFailure:
        "any_origin_or_C1_join_slab_terminal_leaf_not_strictly_below_the_same_interiorCandidateValueLower_any_budget_exhaustion_any_inconsistent_shared-face_value_enclosure_or_any_need_to_adjust_either_cutoff_fails_closed",
    },
    globalObservableReplay: {
      subject: "the_single_deterministic_L2_piecewise_representative_only",
      integrationClosure:
        "the_hash_bound_proof_kernel_recomputes_directed_MPFR256_outward_intervals_for_N_T_W_and_P_V_on_the_exact_interior_plus_s=32/x_tail_partition_with_analytic_endpoint_limits",
      flux: "N_flux_is_recomputed_both_from_the_analytic_V_rep_asymptotic_limit_4*pi*C_rep_and_from_the_directed_tail_flux_limit_enclosure",
      acceptance:
        "each_N_T_W_P_V_N_flux_interval_has_width_at_most_2^-40_and_the_stored_binary64_representative_is_RN_even_of_its_exact_dyadic_midpoint_with_zero_sign_canonicalized_positive",
      lowerLevelRestriction:
        "L0_L1_and_AUDIT_never_supply_an_independent_full_space_observable_or_identity_subject",
      producerObservableSummaryHasAuthority: false,
    },
    originSeriesDefectReplay: {
      subject:
        "the_same_authoritative_L2_radial_Chebyshev_times_parity_Legendre_interior_reconstruction_at_x=0",
      extraction:
        "analytically_differentiate_the_outward_radial_Chebyshev_coefficient_boxes_through_x_order_4_and_read_the_already_frozen_parity_Legendre_coefficients_with_MPFR256_directed_rounding",
      extractionTracePopulation: {
        scalar:
          "radialOrder=0,1,2,3,4_cross_ell=1,3,...,63_in_that_order_for_160_records",
        potential:
          "radialOrder=0,1,2,3,4_cross_ell=0,2,...,62_in_that_order_for_160_records_after_all_scalar_records",
        total:
          "exactly_320_records_with_ordinals_0..319_no_omission_or_duplicate_and_originSeriesDefectReceipt.extractionRecordCount=320",
        symbolicZeros:
          "opposite_parity_and_unrepresented_modes_are_exactly_absent_from_the_authoritative_finite_basis_and_are_not_optional_extraction_records",
      },
      angularQuadratureOrder: 256,
      exhaustiveReferenceCoefficientInventoryThroughX4: [
        "scalar_x1_only_ell1_target_with_a1_as_the_axis_representative",
        "scalar_x2_all_odd_and_even_multipoles_forbidden",
        "scalar_x3_ell1_identity_and_free_ell3_target_with_all_other_including_ell_ge_5_forbidden",
        "scalar_x4_all_multipoles_forbidden",
        "potential_x0_only_ell0_target_Vc_with_all_nonell0_forbidden",
        "potential_x1_all_multipoles_forbidden",
        "potential_x2_free_ell2_target_with_ell0_and_ell_ge_4_forbidden",
        "potential_x3_all_multipoles_forbidden",
        "potential_x4_ell0_and_ell2_identities_free_ell4_target_with_ell_ge_6_and_all_other_multipoles_forbidden",
      ],
      freeFiniteCoefficients: ["a3_for_x3_P3", "b2_for_x2_P2", "b4_for_x4_P4"],
      extractedCoefficientDefinition:
        "U_n(theta)=partial_x^n(u)(0,theta)/n!_and_V_n(theta)=partial_x^n(V)(0,theta)/n!_from_the_accepted_polynomial;_U_nell_and_V_nell_are_the_exact_Legendre_projection_coefficients;_all_suprema_below_are_direct_interval_suprema_of_the_remaining_angular_function_and_include_the_rigorous_projection_tail",
      receiptIntervalBindings: {
        a1Interval:
          "the_exact_outward_MPFR256_interval_evaluation_of_partial_x(u_L2)(0,0)",
        VcInterval:
          "the_exact_outward_MPFR256_interval_evaluation_of_V_L2(0,0);_the_potentialX0NonEll0Defect_separately_bounds_its_difference_from_the_ell0_projection_without_claiming_exact_origin_regularity",
        a3Interval:
          "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_U_3,3",
        b2Interval:
          "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_V_2,2",
        b4Interval:
          "the_exact_outward_MPFR256_interval_for_the_same_replay_extraction_of_V_4,4",
        serialization:
          "each_lower_endpoint_is_the_greatest_binary64_not_above_the_MPFR256_lower_bound_and_each_upper_endpoint_is_the_least_binary64_not_below_the_MPFR256_upper_bound_with_no_optional_widening_and_positive_zero_canonicalization",
        producerChosenOrPostHocRetunedIntervalAllowed: false,
      },
      defectDefinitions: {
        scalarX1Ell1AxisRepresentativeDefect:
          "abs(U_1,1-a1)/(1+abs(U_1,1)+abs(a1))",
        scalarX1NonEll1Defect: "sup_theta_abs(U_1(theta)-U_1,1*P1(cos(theta)))",
        scalarX2AllMultipoleDefect: "sup_theta_abs(U_2(theta))",
        scalarX3P1IdentityDefect:
          "abs(U_3,1-(Vc-nu0)*a1/5)/(1+abs(U_3,1)+abs((Vc-nu0)*a1/5))",
        scalarX3NonEll1Ell3Defect:
          "sup_theta_abs(U_3(theta)-U_3,1*P1(cos(theta))-a3*P3(cos(theta)))",
        scalarX4AllMultipoleDefect: "sup_theta_abs(U_4(theta))",
        potentialX0NonEll0Defect: "sup_theta_abs(V_0(theta)-Vc*P0(cos(theta)))",
        potentialX1AllMultipoleDefect: "sup_theta_abs(V_1(theta))",
        potentialX2Ell0AndEllGe4Defect:
          "sup_theta_abs(V_2(theta)-b2*P2(cos(theta)))",
        potentialX3AllMultipoleDefect: "sup_theta_abs(V_3(theta))",
        potentialX4P0IdentityDefect:
          "abs(V_4,0-a1^2/60)/(1+abs(V_4,0)+abs(a1^2/60))",
        potentialX4P2IdentityDefect:
          "abs(V_4,2-a1^2/21)/(1+abs(V_4,2)+abs(a1^2/21))",
        potentialX4NonEll0Ell2Ell4Defect:
          "sup_theta_abs(V_4(theta)-V_4,0*P0(cos(theta))-V_4,2*P2(cos(theta))-b4*P4(cos(theta)))",
      },
      zeroTargetDefectsUseAbsoluteDimensionlessCoefficientOrSupremum: true,
      nonzeroIdentityDefectsUseOnePlusSumAbsoluteTermsDenominator: true,
      normalizedDefectMaximum: 1e-10,
      unresolvedAngularOrDerivativeIntervalPasses: false,
      establishesExactRegularityOrPdeSeriesEquality: false,
    },
    deterministicFailure:
      "any_budget_exhaustion_zero_containing_nodeless_box_unisolated_physical-middle_stationary_box_unexcluded_origin-or-C1-join_value-cover_leaf_inconsistent_shared-face_enclosure_cutoff_adjustment_noncontractive_tail_or_nonpositive_margin_fails_closed",
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-proof-replay-protocol/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON =
  canonicalJsonForBinding(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL.artifactId,
    protocolVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL.protocolVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_SHA256 =
  "c6a97e35d9838ff8c5a49f75b4bdc7b5b3adc59df8d32a3d17bd96ef14ecd29b" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_CANONICAL_SIZE_BYTES =
  46365 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_v1_proof_protocol_binding_drift",
  );
}

const FINITE_F64_SCHEMA = Object.freeze({
  kind: "number",
  encoding: "IEEE754_binary64",
  finiteRequired: true,
  negativeZeroAllowed: false,
});
const POSITIVE_F64_SCHEMA = Object.freeze({
  ...FINITE_F64_SCHEMA,
  constraint: "value>0",
});
const NONNEGATIVE_F64_SCHEMA = Object.freeze({
  ...FINITE_F64_SCHEMA,
  constraint: "value>=0",
});
const UNIT_INTERVAL_F64_SCHEMA = Object.freeze({
  ...FINITE_F64_SCHEMA,
  constraint: "0<=value<=1",
});
const INTERVAL_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: ["lower", "upper"],
  extraKeysAllowed: false,
  fields: { lower: FINITE_F64_SCHEMA, upper: FINITE_F64_SCHEMA },
  invariant: "lower<=upper",
});
const POSITIVE_INTERVAL_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: ["lower", "upper"],
  extraKeysAllowed: false,
  fields: { lower: POSITIVE_F64_SCHEMA, upper: POSITIVE_F64_SCHEMA },
  invariant: "0<lower<=upper",
});
const ZERO_INTERVAL_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: ["lower", "upper"],
  extraKeysAllowed: false,
  fields: {
    lower: { kind: "literal", value: 0 },
    upper: { kind: "literal", value: 0 },
  },
  invariant: "lower=upper=0",
});
const RHO_PEAK_INTERVAL_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: ["lower", "upper"],
  extraKeysAllowed: false,
  fields: {
    lower: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<32/33" },
    upper: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<32/33" },
  },
  invariant: "0<lower<=upper<32/33",
});
const SHA256_SCHEMA = Object.freeze({
  kind: "string",
  exactPattern: "^[0-9a-f]{64}$",
});
const TRUE_SCHEMA = Object.freeze({ kind: "literal", value: true });

const RUNTIME_BINDING_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "artifactId",
    "contractVersion",
    "sha256Domain",
    "sha256",
    "canonicalSizeBytes",
  ],
  extraKeysAllowed: false,
  fields: {
    artifactId: { kind: "nonempty_string" },
    contractVersion: { kind: "nonempty_string" },
    sha256Domain: { kind: "nonempty_string" },
    sha256: SHA256_SCHEMA,
    canonicalSizeBytes: { kind: "safe_integer", constraint: "value>0" },
  },
});

const TARGET_METADATA_ITEM_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "stage",
    "amplitudeExact",
    "amplitude",
    "lambda",
    "nu",
    "wSeed",
    "rhoPeak",
  ],
  extraKeysAllowed: false,
  fields: {
    stage: { kind: "safe_integer", constraint: "0<=value<=6" },
    amplitudeExact: {
      kind: "enum",
      values: ["2^-16", "2^-15", "2^-14", "2^-13", "2^-12", "2^-11", "2^-10"],
    },
    amplitude: POSITIVE_F64_SCHEMA,
    lambda: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<1" },
    nu: { ...FINITE_F64_SCHEMA, constraint: "-1/2<value<0" },
    wSeed: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<1" },
    rhoPeak: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<1" },
  },
});

const INTERIOR_SOLVE_METADATA_ITEM_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: ["levelId", "A32", "N32", "T32", "W32"],
  extraKeysAllowed: false,
  fields: {
    levelId: { kind: "enum", values: ["L0", "L1", "L2"] },
    A32: POSITIVE_F64_SCHEMA,
    N32: POSITIVE_F64_SCHEMA,
    T32: POSITIVE_F64_SCHEMA,
    W32: { ...FINITE_F64_SCHEMA, constraint: "value<0" },
  },
});

const AUTHORITATIVE_GLOBAL_OBSERVABLES_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "subject",
    "NInterval",
    "N",
    "TInterval",
    "T",
    "WInterval",
    "W",
    "P_VInterval",
    "P_V",
    "NFluxInterval",
    "N_flux",
  ],
  extraKeysAllowed: false,
  fields: {
    subject: {
      kind: "literal",
      value: "deterministic_L2_piecewise_representative_only",
    },
    NInterval: POSITIVE_INTERVAL_SCHEMA,
    N: POSITIVE_F64_SCHEMA,
    TInterval: POSITIVE_INTERVAL_SCHEMA,
    T: POSITIVE_F64_SCHEMA,
    WInterval: INTERVAL_SCHEMA,
    W: { ...FINITE_F64_SCHEMA, constraint: "value<0" },
    P_VInterval: POSITIVE_INTERVAL_SCHEMA,
    P_V: POSITIVE_F64_SCHEMA,
    NFluxInterval: POSITIVE_INTERVAL_SCHEMA,
    N_flux: POSITIVE_F64_SCHEMA,
  },
  invariants: [
    "WInterval.upper<0",
    "each_representative_N_T_W_P_V_N_flux_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_its_corresponding_interval",
    "every_five_observable_interval_width_is_at_most_2^-40",
  ],
});

const SCALAR_METADATA_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "A0",
    "nu0",
    "a1",
    "Vc",
    "xPeak0",
    "rhoPeak0",
    "kappa0",
    "C0",
    "aInfinityOverCosThetaInterval",
    "xTail",
    "rhoTail",
    "perTarget",
    "perSolveInterior",
    "authoritativeGlobalObservables",
  ],
  extraKeysAllowed: false,
  fields: {
    A0: POSITIVE_F64_SCHEMA,
    nu0: { kind: "literal", value: -0.5 },
    a1: POSITIVE_F64_SCHEMA,
    Vc: { ...FINITE_F64_SCHEMA, constraint: "value<0" },
    xPeak0: POSITIVE_F64_SCHEMA,
    rhoPeak0: { ...POSITIVE_F64_SCHEMA, constraint: "0<value<1" },
    kappa0: { kind: "literal", value: 1 },
    C0: POSITIVE_F64_SCHEMA,
    aInfinityOverCosThetaInterval: POSITIVE_INTERVAL_SCHEMA,
    xTail: { kind: "literal", value: 32 },
    rhoTail: {
      kind: "literal",
      value: 32 / 33,
      exactRational: "32/33",
    },
    perTarget: {
      kind: "tuple",
      exactLength: 7,
      extraEntriesAllowed: false,
      order: "frozen_amplitude_stage_order",
      itemSchema: TARGET_METADATA_ITEM_SCHEMA,
    },
    perSolveInterior: {
      kind: "tuple",
      exactLength: 3,
      extraEntriesAllowed: false,
      order: "L0_L1_L2",
      itemSchema: INTERIOR_SOLVE_METADATA_ITEM_SCHEMA,
    },
    authoritativeGlobalObservables: AUTHORITATIVE_GLOBAL_OBSERVABLES_SCHEMA,
  },
  invariants: [
    "A0_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_continuousPeakProofReceipt.A0Interval",
    "rhoPeak0_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_continuousPeakProofReceipt.rhoPeakInterval",
    "xPeak0_is_the_unique_RN_even_binary64_result_of_MPFR256(rhoPeak0/(1-rhoPeak0))_and_lies_in_continuousPeakProofReceipt.xPeakInterval",
    "a1_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_numericalOriginSeriesDefectReceipt.a1Interval",
    "Vc_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_numericalOriginSeriesDefectReceipt.VcInterval",
    "perTarget_stage_amplitudeExact_and_amplitude_equal_the_frozen_amplitude_schedule_in_order",
    "each_perTarget_lambda_is_the_unique_RN_even_binary64_result_of_MPFR256_sqrt(amplitude/A0)_using_the_selected_A0",
    "each_perTarget_nu_is_the_unique_RN_even_binary64_result_of_MPFR256(-lambda^2/2)",
    "each_perTarget_wSeed_is_the_unique_RN_even_binary64_result_of_MPFR256_sqrt(1-lambda^2)",
    "each_perTarget_rhoPeak_is_the_unique_RN_even_binary64_result_of_MPFR256(rhoPeak0/(lambda+(1-lambda)*rhoPeak0))",
    "every_target_array_is_evaluated_from_the_exact_scaling_map_using_the_selected_A0_and_its_selected_lambda",
    "perSolveInterior_has_exact_level_order_L0_L1_L2_and_each_A32_N32_T32_W32_is_integrated_only_on_0<=x<=32",
    "C0=continuousNodelessProofReceipt.CRepresentative_and_authoritativeGlobalObservables.N=continuousNodelessProofReceipt.totalNRepresentative",
    "authoritativeGlobalObservables_are_recomputed_only_from_the_deterministic_L2_piecewise_representative_and_never_from_L0_L1_or_AUDIT",
    "authoritativeGlobalObservables.NInterval_equals_continuousNodelessProofReceipt.totalNInterval_and_each_global_observable_representative_uses_the_frozen_interval_midpoint_RN_even_selector",
    "aInfinityOverCosThetaInterval_contains_the_server_nodeless_receipt_global_angular_enclosure",
  ],
});

const INTERIOR_LEVEL_GATE_ITEM_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "levelId",
    "scope",
    "schrodingerNormalizedLInf",
    "poissonNormalizedLInf",
    "boundaryAndParityLInf",
    "radialTailRelative",
    "angularTailRelative",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    levelId: { kind: "enum", values: ["L0", "L1", "L2"] },
    scope: { kind: "literal", value: "0<=x<=32_only" },
    schrodingerNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    poissonNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    boundaryAndParityLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-12",
    },
    radialTailRelative: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    angularTailRelative: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    passed: TRUE_SCHEMA,
  },
});

const AUDIT_GATE_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "scope",
    "schrodingerNormalizedLInf",
    "poissonNormalizedLInf",
    "boundaryAndParityLInf",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    scope: {
      kind: "literal",
      value: "resampling_of_deterministic_L2_piecewise_representative",
    },
    schrodingerNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    poissonNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    boundaryAndParityLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-12",
    },
    passed: TRUE_SCHEMA,
  },
});

const GLOBAL_IDENTITY_GATE_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "subject",
    "virialRelativeDefect",
    "eigenvalueRelativeDefect",
    "poissonEnergyRelativeDefect",
    "gaussFluxRelativeDefect",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    subject: {
      kind: "literal",
      value: "deterministic_L2_piecewise_representative_only",
    },
    virialRelativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-9",
    },
    eigenvalueRelativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-9",
    },
    poissonEnergyRelativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-9",
    },
    gaussFluxRelativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-9",
    },
    passed: TRUE_SCHEMA,
  },
});

const TARGET_GATE_ITEM_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "stage",
    "scope",
    "amplitudeAbsoluteError",
    "scalarScalingRelativeLInf",
    "potentialScalingRelativeLInf",
    "targetBoundStatePassed",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    stage: { kind: "safe_integer", constraint: "0<=value<=6" },
    scope: {
      kind: "literal",
      value: "authoritative_piecewise_L2_and_AUDIT_only",
    },
    amplitudeAbsoluteError: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=2^-30",
    },
    scalarScalingRelativeLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-12",
    },
    potentialScalingRelativeLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-12",
    },
    targetBoundStatePassed: TRUE_SCHEMA,
    passed: TRUE_SCHEMA,
  },
});

const GATE_REPORT_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "schemaVersion",
    "interiorLevelGates",
    "auditGate",
    "authoritativeGlobalIdentityGate",
    "targetGates",
    "D01",
    "D12",
    "differenceRatio",
    "L1ToL2FieldRelativeLInf",
    "L1ToL2InteriorObservableRelativeDifference",
    "auditDiscreteNodelessPassed",
    "auditNegativePotentialPassed",
    "continuousNodelessProofPassed",
    "continuousPeakProofPassed",
    "numericalOriginSeriesDefectPassed",
    "allPassed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: {
      kind: "literal",
      value: "nhm2.newtonian_seed.gate_report/v1",
    },
    interiorLevelGates: {
      kind: "tuple",
      exactLength: 3,
      extraEntriesAllowed: false,
      order: "L0_L1_L2",
      itemSchema: INTERIOR_LEVEL_GATE_ITEM_SCHEMA,
    },
    auditGate: AUDIT_GATE_SCHEMA,
    authoritativeGlobalIdentityGate: GLOBAL_IDENTITY_GATE_SCHEMA,
    targetGates: {
      kind: "tuple",
      exactLength: 7,
      extraEntriesAllowed: false,
      order: "frozen_amplitude_stage_order",
      itemSchema: TARGET_GATE_ITEM_SCHEMA,
    },
    D01: NONNEGATIVE_F64_SCHEMA,
    D12: NONNEGATIVE_F64_SCHEMA,
    differenceRatio: NONNEGATIVE_F64_SCHEMA,
    L1ToL2FieldRelativeLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-8",
    },
    L1ToL2InteriorObservableRelativeDifference: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-9",
    },
    auditDiscreteNodelessPassed: TRUE_SCHEMA,
    auditNegativePotentialPassed: TRUE_SCHEMA,
    continuousNodelessProofPassed: TRUE_SCHEMA,
    continuousPeakProofPassed: TRUE_SCHEMA,
    numericalOriginSeriesDefectPassed: TRUE_SCHEMA,
    allPassed: TRUE_SCHEMA,
  },
  invariants: [
    "interiorLevelGates_have_exact_levelId_order_L0_L1_L2_and_every_metric_is_restricted_to_0<=x<=32",
    "every_interior_level_schrodingerNormalizedLInf<=1e-10_and_poissonNormalizedLInf<=1e-10",
    "every_interior_level_boundaryAndParityLInf<=1e-12",
    "every_interior_level_radialTailRelative<=1e-10_and_angularTailRelative<=1e-10",
    "auditGate_is_only_a_resampling_gate_for_the_deterministic_L2_piecewise_representative_with_both_residuals<=1e-10_and_boundaryAndParityLInf<=1e-12",
    "authoritativeGlobalIdentityGate_is_recomputed_only_from_the_deterministic_L2_piecewise_representative_and_each_relative_defect<=1e-9",
    "if_D12=0_then_D01=0_and_differenceRatio=0_otherwise_differenceRatio=D01/D12_and_differenceRatio>=4",
    "L1ToL2FieldRelativeLInf_is_bitwise_the_same_binary64_value_as_D12_and_is_derived_once_from_the_frozen_0<=x<=32_field_norm_then_L1ToL2FieldRelativeLInf<=1e-8",
    "L1ToL2InteriorObservableRelativeDifference<=1e-9_and_compares_only_A32_N32_T32_W32_on_0<=x<=32",
    "targetGates_have_exact_stage_order_0_through_6",
    "every_target_amplitudeAbsoluteError<=2^-30_scalarScalingRelativeLInf<=1e-12_potentialScalingRelativeLInf<=1e-12_and_targetBoundStatePassed=true",
    "allPassed=true_if_and_only_if_every_nested_passed_and_every_discrete_and_proof_boolean_is_true_and_every_numeric_invariant_passes",
  ],
});

const NODELESS_PROOF_RECEIPT_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "schemaVersion",
    "proofKernelBinding",
    "protocolBinding",
    "sourceL2ScalarSha256",
    "sourceL2PotentialSha256",
    "xTail",
    "rhoTail",
    "acceptedCompactBoxCount",
    "coverRecordCount",
    "maximumDepthUsed",
    "coverTraceSha256",
    "minimumCompactLowerBound",
    "scaledExteriorVariable",
    "totalNInterval",
    "totalNRepresentative",
    "CInterval",
    "CRepresentative",
    "pRepresentative",
    "coulombConsistencyRelativeDefect",
    "coulombSelectorTraceSha256",
    "coulombSearchIntervalCount",
    "coulombSearchMaximumDepth",
    "interiorNInterval",
    "tailMassInterval",
    "scalarBoundaryLiftSha256",
    "scalarBoundaryLiftRecordCount",
    "potentialBoundaryLiftSha256",
    "potentialBoundaryLiftRecordCount",
    "leadingScalarCorrectionCoefficientIntervals",
    "aInfinityOverCosThetaGlobalInterval",
    "tailScalarRepresentativeCoefficients",
    "tailPotentialRepresentativeCoefficients",
    "tailScalarContinuationCoefficientIntervals",
    "tailPotentialContinuationCoefficientIntervals",
    "tailCoefficientInventorySha256",
    "representativeContinuumSha256",
    "scalarWeightedRemainderRatioUpper",
    "potentialWeightedRemainderAbsoluteUpper",
    "tailRadiiY",
    "tailRadiiZ",
    "tailRadius",
    "tailContractionUpper",
    "joinValueDefectUpper",
    "joinDerivativeDefectUpper",
    "tailSchrodingerNormalizedLInf",
    "tailPoissonNormalizedLInf",
    "interiorJoinSchrodingerNormalizedLimit",
    "exteriorJoinSchrodingerNormalizedLimit",
    "interiorJoinPoissonNormalizedLimit",
    "exteriorJoinPoissonNormalizedLimit",
    "auditBaseScalarEntryCount",
    "prescribedBoundaryPositiveZeroNodeCount",
    "eligibleNonBoundaryNodeCount",
    "strictPositiveEligibleNodeCount",
    "certifiedTailUnderflowPositiveZeroEligibleNodeCount",
    "negativeOrNegativeZeroNodeCount",
    "exteriorRoundingTraceSha256",
    "exteriorRoundingRecordCount",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: {
      kind: "literal",
      value: "nhm2.newtonian_seed.nodeless_proof_receipt/v1",
    },
    proofKernelBinding: RUNTIME_BINDING_SCHEMA,
    protocolBinding: {
      kind: "literal_object",
      exactValueSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
      extraKeysAllowed: false,
    },
    sourceL2ScalarSha256: SHA256_SCHEMA,
    sourceL2PotentialSha256: SHA256_SCHEMA,
    xTail: { kind: "literal", value: 32 },
    rhoTail: { kind: "literal", value: 32 / 33, exactRational: "32/33" },
    acceptedCompactBoxCount: {
      kind: "safe_integer",
      constraint: "1<=value<=262144",
    },
    coverRecordCount: {
      kind: "safe_integer",
      constraint: "acceptedCompactBoxCount<=value<=262144",
    },
    maximumDepthUsed: { kind: "safe_integer", constraint: "0<=value<=24" },
    coverTraceSha256: SHA256_SCHEMA,
    minimumCompactLowerBound: POSITIVE_F64_SCHEMA,
    scaledExteriorVariable: {
      kind: "literal",
      value: "H_u=u_rep/(exp(-kappa*x)*x^pRepresentative*cos(theta))",
    },
    totalNInterval: POSITIVE_INTERVAL_SCHEMA,
    totalNRepresentative: POSITIVE_F64_SCHEMA,
    CInterval: POSITIVE_INTERVAL_SCHEMA,
    CRepresentative: POSITIVE_F64_SCHEMA,
    pRepresentative: FINITE_F64_SCHEMA,
    coulombConsistencyRelativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-12",
    },
    coulombSelectorTraceSha256: SHA256_SCHEMA,
    coulombSearchIntervalCount: {
      kind: "safe_integer",
      constraint: "1<=value<=65536",
    },
    coulombSearchMaximumDepth: {
      kind: "safe_integer",
      constraint: "0<=value<=32",
    },
    interiorNInterval: POSITIVE_INTERVAL_SCHEMA,
    tailMassInterval: POSITIVE_INTERVAL_SCHEMA,
    scalarBoundaryLiftSha256: SHA256_SCHEMA,
    scalarBoundaryLiftRecordCount: { kind: "literal", value: 32 },
    potentialBoundaryLiftSha256: SHA256_SCHEMA,
    potentialBoundaryLiftRecordCount: { kind: "literal", value: 32 },
    leadingScalarCorrectionCoefficientIntervals: {
      kind: "tuple",
      exactLength: 64,
      extraEntriesAllowed: false,
      itemSchema: INTERVAL_SCHEMA,
    },
    aInfinityOverCosThetaGlobalInterval: POSITIVE_INTERVAL_SCHEMA,
    tailScalarRepresentativeCoefficients: {
      kind: "tuple",
      exactLength: 1088,
      extraEntriesAllowed: false,
      order:
        "n_0_through_16_outer_then_q_0_through_63_inner_for_even_P_(2q)_regular_H_correction",
      itemSchema: FINITE_F64_SCHEMA,
    },
    tailPotentialRepresentativeCoefficients: {
      kind: "tuple",
      exactLength: 1088,
      extraEntriesAllowed: false,
      order:
        "n_0_through_16_outer_then_q_0_through_63_inner_for_even_P_(2q)_regular_Q_correction",
      itemSchema: FINITE_F64_SCHEMA,
    },
    tailScalarContinuationCoefficientIntervals: {
      kind: "tuple",
      exactLength: 1088,
      extraEntriesAllowed: false,
      order:
        "n_0_through_16_outer_then_q_0_through_63_inner_for_even_P_(2q)_regular_H_correction",
      itemSchema: INTERVAL_SCHEMA,
    },
    tailPotentialContinuationCoefficientIntervals: {
      kind: "tuple",
      exactLength: 1088,
      extraEntriesAllowed: false,
      order:
        "n_0_through_16_outer_then_q_0_through_63_inner_for_even_P_(2q)_regular_Q_correction",
      itemSchema: INTERVAL_SCHEMA,
    },
    tailCoefficientInventorySha256: SHA256_SCHEMA,
    representativeContinuumSha256: SHA256_SCHEMA,
    scalarWeightedRemainderRatioUpper: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<1",
    },
    potentialWeightedRemainderAbsoluteUpper: NONNEGATIVE_F64_SCHEMA,
    tailRadiiY: NONNEGATIVE_F64_SCHEMA,
    tailRadiiZ: NONNEGATIVE_F64_SCHEMA,
    tailRadius: POSITIVE_F64_SCHEMA,
    tailContractionUpper: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<1",
    },
    joinValueDefectUpper: { kind: "literal", value: 0 },
    joinDerivativeDefectUpper: { kind: "literal", value: 0 },
    tailSchrodingerNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    tailPoissonNormalizedLInf: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    interiorJoinSchrodingerNormalizedLimit: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    exteriorJoinSchrodingerNormalizedLimit: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    interiorJoinPoissonNormalizedLimit: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    exteriorJoinPoissonNormalizedLimit: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    auditBaseScalarEntryCount: { kind: "literal", value: 32768 },
    prescribedBoundaryPositiveZeroNodeCount: {
      kind: "literal",
      value: 510,
    },
    eligibleNonBoundaryNodeCount: { kind: "literal", value: 32258 },
    strictPositiveEligibleNodeCount: {
      kind: "safe_integer",
      constraint: "value>=0",
    },
    certifiedTailUnderflowPositiveZeroEligibleNodeCount: {
      kind: "safe_integer",
      constraint: "value>=0",
    },
    negativeOrNegativeZeroNodeCount: { kind: "literal", value: 0 },
    exteriorRoundingTraceSha256: SHA256_SCHEMA,
    exteriorRoundingRecordCount: { kind: "literal", value: 524288 },
    passed: TRUE_SCHEMA,
  },
  invariants: [
    "CInterval_contains_CRepresentative_and_totalNInterval_contains_totalNRepresentative",
    "sourceL2ScalarSha256_and_sourceL2PotentialSha256_hash_the_final_post_projection_L2_scalar_odd_and_potential_even_multipole_array_bytes_that_define_every_reconstruction_lift_and_proof",
    "totalNRepresentative_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_totalNInterval",
    "CRepresentative_is_the_unique_RN_even_binary64_rounding_of_the_server_isolated_Coulomb_consistency_interval_of_width_at_most_2^-48",
    "CInterval_is_strictly_inside_the_frozen_[2^-32,2^16]_search_domain_and_the_selector_trace_proves_exactly_one_admissible_simple_root_with_no_unresolved_or_boundary_box",
    "coverRecordCount_is_exactly_the_coverTrace_queue_pop_record_count_acceptedCompactBoxCount_is_the_number_of_accepted_positive_leaf_records_and_no_queue_pop_or_leaf_is_omitted_or_duplicated",
    "coulombSearchIntervalCount_is_exactly_the_coulombSelectorTrace_queue_pop_record_count_is_at_most_65536_coulombSearchMaximumDepth<=32_and_no_search_domain_widening_or_post_run_bracket_adjustment_occurred",
    "pRepresentative_is_the_unique_RN_even_binary64_result_of_MPFR256(CRepresentative/kappa0-1)_with_kappa0=1",
    "coulombConsistencyRelativeDefect=abs(4*pi*CRepresentative-totalNRepresentative)/max(totalNRepresentative,1e-300)<=1e-12",
    "totalNInterval_equals_the_unique_outward_binary64_enclosure_of_interiorNInterval_plus_tailMassInterval_under_the_frozen_MPFR256_quadrature_and_endpoint_rounding_recipe",
    "totalNRepresentative_and_the_Coulomb_selector_use_that_same_summed_totalNInterval",
    "scalarBoundaryLiftSha256_and_potentialBoundaryLiftSha256_close_the_exact_H_J_H_sJ_and_Q_J_Q_sJ_functions_derived_from_the_two_L2_source_polynomials_CRepresentative_and_pRepresentative",
    "scalarBoundaryLiftRecordCount=32_and_the_scalar_lift_stream_contains_exactly_one_H_record_for_each_even_ell_0_through_62_while_potentialBoundaryLiftRecordCount=32_and_the_potential_lift_stream_contains_exactly_one_Q_record_for_each_even_ell_0_through_62",
    "leadingScalarCorrectionCoefficientIntervals_equal_the_n_equals_0_slice_of_tailScalarContinuationCoefficientIntervals",
    "aInfinityOverCosThetaGlobalInterval_is_the_server_interval_evaluation_of_H_J-H_sJ+sum_q_cU[0,q]*P_(2q)(cos(theta))",
    "the_fixed_-C*y_potential_monopole_is_not_in_the_coefficient_tuples_and_no_y2_term_exists",
    "every_representative_coefficient_is_RN_even_binary64_of_the_exact_dyadic_midpoint_of_its_same_index_server_recomputed_interval_with_zero_sign_canonicalized_positive",
    "tailCoefficientInventorySha256_closes_both_representative_and_both_interval_tuples_in_declared_order",
    "representativeContinuumSha256_closes_the_two_L2_source_hashes_CRepresentative_pRepresentative_both_boundary_lift_hashes_both_representative_coefficient_tuples_and_the_exact_u_rep_V_rep_formulas",
    "R_U_and_R_V_are_outward_error_enclosures_only_and_never_additive_or_selectable_representative_values",
    "each_exterior_binary64_array_value_is_the_unique_RN_even_rounding_of_its_verified_interval",
    "exteriorRoundingRecordCount=524288_and_the_exteriorRoundingTrace_contains_exactly_one_record_for_every_element_of_the_AUDIT_base_scalar_base_potential_target_scalar_and_target_potential_arrays_in_frozen_inventory_path_then_flat_index_order",
    "positive_zero_is_allowed_only_on_the_510_exact_projected_prescribed_boundary_entries_or_when_a_strictly_positive_certified_tail_interval_rounds_uniquely_to_positive_zero",
    "strictPositiveEligibleNodeCount+certifiedTailUnderflowPositiveZeroEligibleNodeCount=eligibleNonBoundaryNodeCount=32258_and_neither_class_contains_a_prescribed_boundary_entry",
    "auditBaseScalarEntryCount=32768=prescribedBoundaryPositiveZeroNodeCount+eligibleNonBoundaryNodeCount",
    "the_exact_C1_join_has_zero_value_and_first_derivative_defect_while_second_derivative_jumps_are_allowed",
    "tailRadiiY_tailRadiiZ_and_tailRadius_share_the_frozen_dimensionless_weighted_norm_tailRadiiZ=Z(tailRadius)_and_the_directed_outward_sum_satisfies_tailRadiiY+tailRadiiZ<=tailRadius",
    "tailContractionUpper_equals_the_directed_outward_upper_bound_of_Zprime(tailRadius)_and_is_strictly_less_than_one",
    "both_tail_PDE_residuals_and_all_four_one_sided_join_residual_limits_are_at_most_1e-10",
    "minimumCompactLowerBound>0_aInfinityOverCosThetaGlobalInterval.lower>0_negativeOrNegativeZeroNodeCount=0_and_all_count_fields_respect_the_frozen_budgets",
    "width(totalNInterval)_width(CInterval)_width(interiorNInterval)_width(tailMassInterval)_width(aInfinityOverCosThetaGlobalInterval)_and_every_stored_tail_coefficient_interval_width_are_each_at_most_2^-40",
  ],
});

const ORIGIN_SERIES_DEFECT_RECEIPT_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "schemaVersion",
    "proofKernelBinding",
    "protocolBinding",
    "sourceL2ScalarSha256",
    "sourceL2PotentialSha256",
    "a1Interval",
    "VcInterval",
    "a3Interval",
    "b2Interval",
    "b4Interval",
    "scalarX1Ell1AxisRepresentativeDefect",
    "scalarX1NonEll1Defect",
    "scalarX2AllMultipoleDefect",
    "scalarX3P1IdentityDefect",
    "scalarX3NonEll1Ell3Defect",
    "scalarX4AllMultipoleDefect",
    "potentialX0NonEll0Defect",
    "potentialX1AllMultipoleDefect",
    "potentialX2Ell0AndEllGe4Defect",
    "potentialX3AllMultipoleDefect",
    "potentialX4P0IdentityDefect",
    "potentialX4P2IdentityDefect",
    "potentialX4NonEll0Ell2Ell4Defect",
    "derivativeMultipoleTraceSha256",
    "extractionRecordCount",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: {
      kind: "literal",
      value: "nhm2.newtonian_seed.numerical_origin_series_defect_receipt/v1",
    },
    proofKernelBinding: RUNTIME_BINDING_SCHEMA,
    protocolBinding: {
      kind: "literal_object",
      exactValueSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
      extraKeysAllowed: false,
    },
    sourceL2ScalarSha256: SHA256_SCHEMA,
    sourceL2PotentialSha256: SHA256_SCHEMA,
    a1Interval: POSITIVE_INTERVAL_SCHEMA,
    VcInterval: INTERVAL_SCHEMA,
    a3Interval: INTERVAL_SCHEMA,
    b2Interval: INTERVAL_SCHEMA,
    b4Interval: INTERVAL_SCHEMA,
    scalarX1Ell1AxisRepresentativeDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    scalarX1NonEll1Defect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    scalarX2AllMultipoleDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    scalarX3P1IdentityDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    scalarX3NonEll1Ell3Defect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    scalarX4AllMultipoleDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX0NonEll0Defect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX1AllMultipoleDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX2Ell0AndEllGe4Defect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX3AllMultipoleDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX4P0IdentityDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX4P2IdentityDefect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    potentialX4NonEll0Ell2Ell4Defect: {
      ...NONNEGATIVE_F64_SCHEMA,
      constraint: "0<=value<=1e-10",
    },
    derivativeMultipoleTraceSha256: SHA256_SCHEMA,
    extractionRecordCount: { kind: "literal", value: 320 },
    passed: TRUE_SCHEMA,
  },
  invariants: [
    "VcInterval.upper<0",
    "width(a1Interval)_width(VcInterval)_width(a3Interval)_width(b2Interval)_and_width(b4Interval)_are_each_at_most_2^-40",
    "a1Interval_equals_the_frozen_directed_interval_evaluation_of_partial_x(u_L2)(0,0)",
    "VcInterval_equals_the_frozen_directed_interval_evaluation_of_V_L2(0,0)",
    "a3Interval_equals_the_frozen_directed_projection_interval_for_U_3,3",
    "b2Interval_equals_the_frozen_directed_projection_interval_for_V_2,2",
    "b4Interval_equals_the_frozen_directed_projection_interval_for_V_4,4",
    "all_five_interval_endpoints_are_the_unique_outward_binary64_serializations_of_the_same_MPFR256_extraction_with_no_producer_widening_or_post_hoc_selection",
    "extractionRecordCount=320_and_derivativeMultipoleTraceSha256_contains_exactly_every_field_radialOrder_and_represented_parity_ell_tuple_once_in_scalar_then_potential_radialOrder_then_ell_order_with_no_omission_or_duplicate",
    "scalarMetadata.a1_lies_in_a1Interval",
    "scalarMetadata.Vc_lies_in_VcInterval",
    "all_thirteen_exhaustive_through_x4_normalized_defects_are_at_most_1e-10",
    "receipt_is_a_numerical_defect_gate_and_establishes_no_exact_regularity_or_PDE_series_equality",
  ],
});

const PEAK_PROOF_RECEIPT_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "schemaVersion",
    "proofKernelBinding",
    "protocolBinding",
    "sourceL2ScalarSha256",
    "sourceL2PotentialSha256",
    "sourceTailCoefficientInventorySha256",
    "sourceRepresentativeContinuumSha256",
    "stationaryCandidateCount",
    "stationaryRecordCount",
    "originValueCoverRecordCount",
    "physicalDerivativeRecordCount",
    "c1JoinValueCoverRecordCount",
    "uniquePeakBoxIndex",
    "acceptedBoxCount",
    "maximumDepthUsed",
    "stationaryTraceSha256",
    "rhoPeakInterval",
    "thetaPeakInterval",
    "xPeakInterval",
    "A0Interval",
    "largestHessianEigenvalueUpper",
    "radialHessianEigenvalueUpper",
    "regularTransverseHessianEigenvalueUpper",
    "hessianDeterminantLower",
    "globalDominanceMarginLower",
    "interiorCandidateValueLower",
    "exteriorTailSupremumUpper",
    "scaledExteriorRadialDecreaseLower",
    "exteriorStationaryMaximizerCount",
    "passed",
  ],
  extraKeysAllowed: false,
  fields: {
    schemaVersion: {
      kind: "literal",
      value: "nhm2.newtonian_seed.peak_proof_receipt/v1",
    },
    proofKernelBinding: RUNTIME_BINDING_SCHEMA,
    protocolBinding: {
      kind: "literal_object",
      exactValueSource:
        "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING",
      extraKeysAllowed: false,
    },
    sourceL2ScalarSha256: SHA256_SCHEMA,
    sourceL2PotentialSha256: SHA256_SCHEMA,
    sourceTailCoefficientInventorySha256: SHA256_SCHEMA,
    sourceRepresentativeContinuumSha256: SHA256_SCHEMA,
    stationaryCandidateCount: { kind: "safe_integer", constraint: "value>=1" },
    stationaryRecordCount: {
      kind: "safe_integer",
      constraint: "stationaryCandidateCount<=value<=262144",
    },
    originValueCoverRecordCount: {
      kind: "safe_integer",
      constraint: "1<=value<stationaryRecordCount",
    },
    physicalDerivativeRecordCount: {
      kind: "safe_integer",
      constraint: "1<=value<stationaryRecordCount",
    },
    c1JoinValueCoverRecordCount: {
      kind: "safe_integer",
      constraint: "1<=value<stationaryRecordCount",
    },
    uniquePeakBoxIndex: {
      kind: "safe_integer",
      constraint:
        "value_is_the_actual_stationaryTrace_record_ordinal_and_0<=value<stationaryRecordCount",
    },
    acceptedBoxCount: {
      kind: "safe_integer",
      constraint:
        "stationaryCandidateCount<=value<=stationaryRecordCount<=262144",
    },
    maximumDepthUsed: { kind: "safe_integer", constraint: "0<=value<=56" },
    stationaryTraceSha256: SHA256_SCHEMA,
    rhoPeakInterval: RHO_PEAK_INTERVAL_SCHEMA,
    thetaPeakInterval: ZERO_INTERVAL_SCHEMA,
    xPeakInterval: POSITIVE_INTERVAL_SCHEMA,
    A0Interval: POSITIVE_INTERVAL_SCHEMA,
    largestHessianEigenvalueUpper: {
      ...FINITE_F64_SCHEMA,
      constraint: "value<0",
    },
    radialHessianEigenvalueUpper: {
      ...FINITE_F64_SCHEMA,
      constraint: "value<0",
    },
    regularTransverseHessianEigenvalueUpper: {
      ...FINITE_F64_SCHEMA,
      constraint: "value<0",
    },
    hessianDeterminantLower: {
      ...POSITIVE_F64_SCHEMA,
      meaning:
        "directed_lower_bound_of_the_2_by_2_meridional_orthonormal-frame_determinant_H_xx*H_TT-H_xT^2_not_the_full_3_by_3_determinant",
    },
    globalDominanceMarginLower: POSITIVE_F64_SCHEMA,
    interiorCandidateValueLower: POSITIVE_F64_SCHEMA,
    exteriorTailSupremumUpper: NONNEGATIVE_F64_SCHEMA,
    scaledExteriorRadialDecreaseLower: POSITIVE_F64_SCHEMA,
    exteriorStationaryMaximizerCount: { kind: "literal", value: 0 },
    passed: TRUE_SCHEMA,
  },
  invariants: [
    "width(A0Interval)_width(rhoPeakInterval)_width(thetaPeakInterval)_and_width(xPeakInterval)_are_each_at_most_2^-40",
    "maximumDepthUsed_is_the_maximum_of_all_stationary_sDepth_and_etaDepth_values_is_at_most_56_every_sDepth<=52_every_etaDepth<=56_every_treeDepth<=108_and_every_peak_interval_width_is_obtained_from_the_recorded_exact-midpoint_dyadic_boxes_and_directed_coordinate_images_without_an_unrecorded_contracted-box_shortcut",
    "A0Interval_and_rhoPeakInterval_have_exact_dyadic_endpoints_and_their_midpoints_select_scalarMetadata_A0_and_rhoPeak0_by_RN_even_binary64",
    "stationaryRecordCount_is_exactly_originValueCoverRecordCount+physicalDerivativeRecordCount+c1JoinValueCoverRecordCount_and_each_count_equals_its_complete_region_queue-pop_population_with_no_omission_or_duplicate_within_a_region",
    "stationaryCandidateCount_counts_only_physical_derivative_stationary_other_plus_unique_axis_global_maximum_dispositions_acceptedBoxCount_counts_all_non_split_terminal_records_and_stationaryCandidateCount<=acceptedBoxCount<=stationaryRecordCount",
    "uniquePeakBoxIndex_is_the_actual_stationaryTrace_record_ordinal_is_less_than_stationaryRecordCount_and_the_selected_record_has_disposition=unique_axis_global_maximum_candidateKind=axis_domainFace=theta0_derivativeEvidenceKind=physical_regular",
    "the_selected_unique_peak_record_has_regionId=physical_derivative_and_2^-12<sLower<=sUpper<1-2^-12_and_never_uses_either_value-cover_branch",
    "rhoPeakInterval_is_exactly_the_directed_physical_rho_image_of_the_selected_records_s_interval_thetaPeakInterval_is_exactly_the_directed_physical_theta_image_of_its_eta_interval_xPeakInterval_is_exactly_the_directed_x=rho/(1-rho)_image_and_A0Interval_equals_that_same_records_valueInterval",
    "thetaPeakInterval.lower=thetaPeakInterval.upper=0_and_0<rhoPeakInterval.lower<=rhoPeakInterval.upper<32/33",
    "(32/33)*2^-12<rhoPeakInterval.lower<=rhoPeakInterval.upper<(32/33)*(1-2^-12)_so_the_selected_peak_box_is_strictly_inside_the_physical_derivative_middle_region_and_both_closed-cover_overlap_faces_are_excluded_by_the_adjoining_gates",
    "xPeakInterval_is_the_directed_MPFR256_image_of_rhoPeakInterval_under_x=rho/(1-rho)",
    "A0Interval_is_the_directed_enclosure_of_the_authoritative_piecewise_scalar_L2_parity_Legendre_interior_branch_on_that_same_unique_axis_candidate_and_interiorCandidateValueLower_is_its_same_directed_value_lower_bound",
    "radialHessianEigenvalueUpper<0_regularTransverseHessianEigenvalueUpper<0_largestHessianEigenvalueUpper=max_of_those_two_upper_bounds<0_and_hessianDeterminantLower>0",
    "hessianDeterminantLower_is_the_directed_lower_bound_of_H_xx*H_TT-H_xT^2_for_the_2_by_2_meridional_(e_x,e_theta)_Hessian_at_the_selected_axis_box_and_is_not_a_full_3_by_3_determinant",
    "full_3D_negative_definiteness_follows_from_the_negative_definite_2_by_2_meridional_block_H_xx<0_H_TT<0_positive_2_by_2_determinant_and_the_same_strictly_negative_H_TT_eigenvalue_repeated_in_the_second_axis-transverse_direction",
    "exteriorTailSupremumUpper<interiorCandidateValueLower",
    "globalDominanceMarginLower<=interiorCandidateValueLower-exteriorTailSupremumUpper",
    "the_global_interval_lower_bound_of_D_tail_is_scaledExteriorRadialDecreaseLower_and_is_strictly_positive",
  ],
});

const ARRAY_ENTRY_SCHEMA = Object.freeze({
  kind: "object",
  exactKeys: [
    "inventoryIndex",
    "levelIndex",
    "roleIndex",
    "levelId",
    "role",
    "relativePath",
    "dtype",
    "order",
    "shape",
    "elementCount",
    "byteLength",
    "sha256",
  ],
  extraKeysAllowed: false,
  staticFieldsMustEqualFrozenInventory: true,
  fields: {
    inventoryIndex: { kind: "safe_integer", constraint: "0<=value<=31" },
    levelIndex: { kind: "safe_integer", constraint: "0<=value<=3" },
    roleIndex: { kind: "safe_integer", constraint: "0<=value<=7" },
    levelId: { kind: "enum", values: ["L0", "L1", "L2", "AUDIT"] },
    role: {
      kind: "enum",
      values: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES.map(
        ({ role }) => role,
      ),
    },
    relativePath: {
      kind: "enum",
      values:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
          ({ relativePath }) => relativePath,
        ),
    },
    dtype: { kind: "literal", value: "float64_le" },
    order: { kind: "literal", value: "C_row_major" },
    shape: { kind: "literal_by_inventory_index", extraEntriesAllowed: false },
    elementCount: { kind: "literal_by_inventory_index" },
    byteLength: { kind: "literal_by_inventory_index" },
    sha256: SHA256_SCHEMA,
  },
});

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA =
  deepFreezeEarly({
    artifactId:
      "nhm2.prolate_boson_star_newtonian_seed.output_descriptor_schema",
    schemaVersion:
      "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor_schema/v1",
    authority: "strict_closed_runtime_descriptor_grammar",
    recursiveRules: {
      extraKeysAllowedAtAnyObjectDepth: false,
      sparseArraysAllowed: false,
      extraArrayEntriesAllowed: false,
      nonfiniteNumbersAllowed: false,
      negativeZeroAllowedInJsonOrRawArrays: false,
      stringsRequireExactUtf8: true,
    },
    topLevel: {
      kind: "object",
      exactKeys: [
        "schemaVersion",
        "artifactKind",
        "seedContractBinding",
        "candidatePlanV2Binding",
        "branchBvpV1Binding",
        "levelOrder",
        "gridDefinitions",
        "amplitudeOrder",
        "scalarMetadata",
        "serverRecomputedGateReport",
        "continuousNodelessProofReceipt",
        "continuousPeakProofReceipt",
        "numericalOriginSeriesDefectReceipt",
        "arrayInventory",
        "arrayCount",
        "float64ElementCount",
        "arrayByteLength",
      ],
      extraKeysAllowed: false,
      fields: {
        schemaVersion: {
          kind: "literal",
          value:
            "nhm2.prolate_boson_star.newtonian_2p_seed.output_descriptor/v1",
        },
        artifactKind: {
          kind: "literal",
          value: "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
        },
        seedContractBinding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING",
          schema: RUNTIME_BINDING_SCHEMA,
        },
        candidatePlanV2Binding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING",
          extraKeysAllowed: false,
        },
        branchBvpV1Binding: {
          kind: "authoritative_literal_binding",
          source: "NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING",
          schema: RUNTIME_BINDING_SCHEMA,
        },
        levelOrder: {
          kind: "literal_tuple",
          exactLength: 4,
          value: ["L0", "L1", "L2", "AUDIT"],
          extraEntriesAllowed: false,
        },
        gridDefinitions: {
          kind: "authoritative_literal_tuple",
          source: "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS",
          exactLength: 4,
          extraEntriesAllowed: false,
          extraKeysAllowedInEntries: false,
        },
        amplitudeOrder: {
          kind: "authoritative_literal_tuple",
          source:
            "NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE",
          exactLength: 7,
          extraEntriesAllowed: false,
          extraKeysAllowedInEntries: false,
        },
        scalarMetadata: SCALAR_METADATA_SCHEMA,
        serverRecomputedGateReport: GATE_REPORT_SCHEMA,
        continuousNodelessProofReceipt: NODELESS_PROOF_RECEIPT_SCHEMA,
        continuousPeakProofReceipt: PEAK_PROOF_RECEIPT_SCHEMA,
        numericalOriginSeriesDefectReceipt: ORIGIN_SERIES_DEFECT_RECEIPT_SCHEMA,
        arrayInventory: {
          kind: "tuple",
          exactLength: 32,
          extraEntriesAllowed: false,
          order: "level_outer_role_inner",
          itemSchema: ARRAY_ENTRY_SCHEMA,
        },
        arrayCount: { kind: "literal", value: 32 },
        float64ElementCount: { kind: "literal", value: 810288 },
        arrayByteLength: { kind: "literal", value: 6482304 },
      },
      crossFieldInvariants: [
        "all_three_binding_objects_equal_their_authoritative_exports",
        "every_array_static_field_equals_the_same_inventoryIndex_entry_in_the_frozen_inventory",
        "every_array_sha256_recomputes_under_the_frozen_length_delimited_array_hash_recipe",
        "every_rho_nodes_and_theta_nodes_array_is_bitwise_equal_in_inventory_order_to_the_frozen_MPFR256_to_RN_even_grid_formula_values",
        "at_L0_L1_L2_each_base_nodal_field_array_is_bitwise_the_unique_RN_even_resampling_of_its_same_level_post_projection_parity_multipole_reconstruction_and_has_no_independent_continuum_authority",
        "every_target_scalar_and_potential_array_at_all_four_levels_is_a_direct_RN_even_sample_of_the_scaled_deterministic_L2_piecewise_continuum_using_the_selected_A0_and_no_L0_or_L1_solve_field",
        "nodeless_and_peak_receipt_sourceL2ScalarSha256_equal_the_L2_scalar_odd_multipole_inventory_sha256",
        "nodeless_and_peak_receipt_sourceL2PotentialSha256_equal_the_L2_potential_even_multipole_inventory_sha256",
        "peak_receipt_sourceTailCoefficientInventorySha256_and_sourceRepresentativeContinuumSha256_equal_the_corresponding_nodeless_receipt_hashes",
        "all_three_proof_receipt_protocolBinding_objects_equal_the_authoritative_proof_protocol_binding",
        "all_three_proof_receipt_proofKernelBinding_objects_equal_the_hash_bound_implementation_closure_entry",
        "origin_receipt_source_hashes_equal_the_L2_scalar_odd_and_potential_even_multipole_inventory_hashes",
        "nodeless_receipt_coverRecordCount_coulombSearchIntervalCount_scalarBoundaryLiftRecordCount_potentialBoundaryLiftRecordCount_and_exteriorRoundingRecordCount_equal_their_respective_strict_record_stream_counts_with_exact_populations_while_origin_receipt_extractionRecordCount=320_and_peak_receipt_stationaryRecordCount_equals_its_complete_queue_pop_stream",
        "nodeless_receipt_exteriorRoundingRecordCount=524288_equals_the_sum_of_the_four_frozen_AUDIT_field_array_element_counts_and_every_rounding_record_path_role_flatIndex_and_ordinal_matches_that_inventory_order",
        "peak_receipt_physical_rhoPeakInterval_thetaPeakInterval_and_xPeakInterval_are_the_directed_physical_images_of_the_same_unique_normalized_(s,eta)_stationary_record_box",
        "origin_and_C1_join_value-cover_stationary_records_use_the_frozen_2^-12_cutoffs_every_terminal_leaf_is_excluded_by_value_against_the_same_peak_candidate_lower_bound_their_canonical_zero_derivative_payloads_have_no_authority_the_two_shared_faces_have_consistent_adjoining_value_enclosures_and_the_unique_peak_record_is_strictly_inside_the_physical_middle_region_with_physical_regular_derivative_evidence",
        "peak_receipt_stationaryRecordCount_equals_the_sum_of_the_three_exact_region_record_counts_and_uniquePeakBoxIndex_is_the_actual_ordinal_after_treeDepth_regionId_lexicographic_stream_sorting",
        "serverRecomputedGateReport_allPassed_is_true_and_every_nested_passed_literal_is_true",
        "serverRecomputedGateReport.auditDiscreteNodelessPassed_requires_exact_AUDIT_scalar_counts_262144_total_4080_projected_positive_zero_258064_strict_positive_or_certified_tail_underflow_and_zero_negative_or_negative_zero",
        "scalarMetadata.A0_rhoPeak0_xPeak0_a1_and_Vc_equal_the_frozen_midpoint_RN_even_selections_from_the_peak_and_origin_receipts",
        "scalarMetadata.C0_equals_nodeless.CRepresentative_and_scalarMetadata.authoritativeGlobalObservables.N_equals_nodeless.totalNRepresentative",
        "scalarMetadata.authoritativeGlobalObservables.NInterval_equals_nodeless.totalNInterval_and_all_five_global_observable_intervals_and_midpoint_representatives_are_server_recomputed_from_the_same_piecewise_subject",
        "scalarMetadata.perSolveInterior_and_gate_report_D01_D12_field_and_observable_comparisons_are_restricted_to_0<=x<=32_with_no_full_space_L0_or_L1_claim",
        "nodeless.coulombConsistencyRelativeDefect_equals_abs(4*pi*CRepresentative-totalNRepresentative)/max(totalNRepresentative,1e-300)_and_is_at_most_1e-12",
        "every_scalarMetadata_target_value_and_every_target_array_is_recomputed_from_the_selected_A0_and_the_frozen_MPFR256_RN_even_scaling_protocol",
        "continuousPeakProofReceipt.scaledExteriorRadialDecreaseLower>0_and_its_exterior_bounds_are_derived_from_the_same_nodeless_tail_coefficients",
      ],
    },
  } as const);

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed-output-descriptor-schema/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON =
  canonicalJsonForBinding(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA,
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256 =
  createHash("sha256")
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256_DOMAIN,
      "utf8",
    )
    .update(
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON,
      "utf8",
    )
    .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING =
  Object.freeze({
    artifactId:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.artifactId,
    schemaVersion:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA.schemaVersion,
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256_DOMAIN,
    sha256:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256,
    canonicalSizeBytes:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_SIZE_BYTES,
  });
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_SHA256 =
  "deb52c3d2d80f63a4b98dfb8e6ec9180a0d5063e27d2310d59ec0cddf294ab58" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES =
  56194 as const;
if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_v1_output_descriptor_schema_binding_drift",
  );
}

const REQUIRED_IMPLEMENTATION_INPUTS = Object.freeze([
  {
    id: "seed_solver_source_archive",
    duty: "complete_solver_and_discretization_source",
  },
  {
    id: "seed_solver_build_recipe",
    duty: "reproducible_noninteractive_build_commands",
  },
  {
    id: "seed_dependency_lock",
    duty: "exact_transitive_dependency_versions_and_hashes",
  },
  {
    id: "seed_runtime_identity_manifest",
    duty: "os_arch_compiler_interpreter_and_math_library_identity",
  },
  {
    id: "seed_spectral_operator_fixture",
    duty: "nodes_derivative_matrices_and_endpoint_limit_rules",
  },
  {
    id: "seed_quadrature_fixture",
    duty: "volume_multipole_and_asymptotic_flux_quadrature",
  },
  {
    id: "seed_barycentric_prolongation_fixture",
    duty: "coarse_to_fine_and_target_scaling_interpolation",
  },
  {
    id: "seed_independent_verifier_source_archive",
    duty: "server_side_reassembly_of_all_gates_without_producer_diagnostics",
  },
  {
    id: "seed_continuous_nodeless_proof_kernel",
    duty: "directed_rounding_interval_root_isolation_for_the_factored_scalar_and_asymptotic_tail",
  },
  {
    id: "seed_canonical_artifact_serializer",
    duty: "canonical_json_descriptor_and_little_endian_float64_array_hashing",
  },
  {
    id: "seed_resource_enforcement_wrapper",
    duty: "rss_wall_process_thread_blas_and_network_limits",
  },
] as const);

const CONTRACT = {
  artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
  contractVersion: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
  authority: "initializer_only",
  maturity: "preregistered_newtonian_initializer_contract_no_execution",
  solverImplemented: false,
  executionAuthorized: false,
  bindings: {
    candidatePlanV2: {
      authoritativeSingletonIdentityRequired: true,
      artifactId:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_ARTIFACT_ID,
      contractVersion:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CONTRACT_VERSION,
      candidateId:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_CANDIDATE_ID,
      bindingPins:
        NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS,
      binding: NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING,
    },
    branchBvpV1: {
      authoritativeSingletonIdentityRequired: true,
      artifactId: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_ARTIFACT_ID,
      contractVersion: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_CONTRACT_VERSION,
      binding: NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING,
      requiredSeedKind:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
          .newtonianSeed.requiredKind,
      requiredRuntimeSeedSha256Domain:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
          .newtonianSeed.sha256Domain,
    },
  },
  purposeAndAuthorityBoundary: {
    solePurpose:
      "initialize_the_frozen_relativistic_branch_BVP_without_supplying_branch_evidence",
    mayInitializeFirstRelativisticAmplitudeStageExact: "2^-16",
    relativisticBvpMustResolveFrequencyAgain: true,
    literatureFrequencyMaySelectBranch: false,
    mayClearBosonStarBranchNotSolved: false,
    mayEstablishRelativisticRegularityOrConvergence: false,
    mayEstablishCandidateAdmissibility: false,
    mayEstablishAnySemiclassicalV3Claim: false,
  },
  branchIdentity: {
    convention: "multipolar_boson_star_(N,ell,m)",
    quantumNumbers: { N: 2, ell: 1, m: 0 },
    radialNodeCount: 0,
    parityAcrossEquator: "scalar_odd_potential_even",
    northLobePhase: "positive",
    vacuumConnectedWeakFieldDuty: true,
  },
  nondimensionalization: {
    definitions: {
      x: "mu*r",
      tau: "mu*t",
      u: "sqrt(8*pi*G)*phi",
      V: "Newtonian_limit_of_F0_with_V(infinity)=0",
      nu: "((omega/mu)^2-1)/2",
      wSeed: "omegaSeed/mu=sqrt(1+2*nu)",
    },
    scalarCompatibilityWithRelativisticBvp:
      "u_is_the_weak_field_limit_of_varphi",
    frozenCandidateCoupling: {
      exact: "8*pi*G*mu^2=2^-40",
      role: "conversion_and_later_semiclassical_accounting_only",
      appearsInDimensionlessSeedPde: false,
    },
    targetBoundStateConditions: ["nu_A<0", "1+2*nu_A>0", "0<wSeed_A<1"],
    baseGaugeFrequencyBoundary: {
      nu0: -0.5,
      w0: 0,
      role: "mathematical_SP_scale_gauge_only",
      exemptFromTargetBoundStateConditions: true,
      suppliesRelativisticFrequencyAuthority: false,
    },
  },
  continuumProblem: {
    unknowns: ["u(x,theta)", "V(x,theta)"],
    domain: { x: "[0,infinity)", theta: "[0,pi/2]" },
    axisymmetricLaplacian:
      "Delta_axi(q)=partial_x^2(q)+(2/x)*partial_x(q)+(1/x^2)*(partial_theta^2(q)+cot(theta)*partial_theta(q))",
    schrodingerEquation: "R_S:=-(1/2)*Delta_axi(u)+V*u-nu*u=0",
    poissonEquation: "R_P:=Delta_axi(V)-u^2=0",
    fullSpaceMeasure:
      "d^3x=4*pi*x^2*sin(theta)*dx*dtheta_on_the_north_half_domain_after_parity_reconstruction",
    signConvention: {
      positiveMassDensity: "u^2",
      localizedPotential: "V<0_in_the_interior_and_V(infinity)=0",
      asymptoticMonopole: "V=-N/(4*pi*x)+o(x^-1)",
    },
    singularCoordinateTerms:
      "all_x=0_and_theta=0_limits_must_be_taken_from_the_regular_series_never_by_raw_division",
  },
  authoritativeSeedContinuum: {
    id: "piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
    baseInterior:
      "accepted_L2_radial_Chebyshev_times_scalar_odd_or_potential_even_Legendre_reconstruction_from_the_post_projection_multipole_arrays_on_0<=x<=32",
    exactJoin: { xTail: 32, rhoTailExact: "32/33", rhoTail: 32 / 33 },
    baseExterior:
      "the_frozen_u_rep_V_rep_finite_Legendre_tail_sums_at_the_unique_C_rep_p_rep_and_coefficient_representatives_on_x>=32_with_remainders_used_only_as_outward_error_bounds",
    deterministicRepresentativeRule:
      "the_proof_protocol_alone_selects_C_rep_p_rep_and_every_tail_coefficient_representative_by_MPFR256_interval_isolation_exact_dyadic_midpoints_and_RN_even_binary64;_no_producer_value_inside_an_interval_is_selectable",
    scaledTargets:
      "apply_the_exact_SP_scaling_map_to_this_entire_piecewise_base_continuum_including_its_exterior",
    soleAuthorityFor: [
      "AUDIT_array_generation",
      "continuous_nodeless_proof",
      "continuous_peak_proof",
      "all_global_observables",
      "all_target_scaling",
      "relativistic_BVP_initialization",
    ],
    raw_L2_values_for_x_greater_than_32_have_continuum_authority: false,
    alternateProducerChosenContinuumAllowed: false,
    intervalRemainderMayChangeRepresentativeValues: false,
  },
  scaleFixingAndContinuation: {
    baseScaleGauge: {
      nu0Exact: "-1/2",
      nu0: -0.5,
      impliedW0: 0,
      mathematicalNonphysicalScaleRepresentative: true,
      frequencyAuthority: false,
    },
    baseAmplitude:
      "A0=max_over_the_single_authoritative_piecewise_continuum(abs(u0))",
    exactScalingSymmetry: {
      scalar: "u_lambda(x,theta)=lambda^2*u0(lambda*x,theta)",
      potential: "V_lambda(x,theta)=lambda^2*V0(lambda*x,theta)",
      eigenvalue: "nu_lambda=lambda^2*nu0",
      amplitude: "A_lambda=lambda^2*A0",
      particleNumber: "N_lambda=lambda*N0",
      kineticAndPotentialEnergy:
        "T_lambda=lambda^3*T0_and_W_lambda=lambda^3*W0",
      compactCoordinatePullback: "rho_lambda=lambda*rho/(1-(1-lambda)*rho)",
    },
    targetRule: {
      lambda: "sqrt(A_target/A0)",
      nu: "-lambda^2/2",
      wSeed: "sqrt(1-lambda^2)",
      hardDomain: "0<lambda<1",
      frequencyIsInitializerNotRelativisticBranchSelector: true,
    },
    amplitudes: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_AMPLITUDE_SCHEDULE,
    noLiteratureOmegaSubstitution: true,
  },
  domainAndDiscretization: {
    halfDomain: {
      rho: { minimum: 0, maximum: 1 },
      theta: { minimum: 0, maximumExact: "pi/2" },
    },
    compactification: {
      forward: "rho=x/(1+x)",
      inverse: "x=rho/(1-rho)",
      firstDerivative: "partial_x=(1-rho)^2*partial_rho",
      secondDerivative:
        "partial_x^2=(1-rho)^4*partial_rho^2-2*(1-rho)^3*partial_rho",
      northHalfVolumeMeasure:
        "d^3x=4*pi*rho^2*sin(theta)/(1-rho)^4*d_rho*d_theta",
    },
    solverCollocationBasis:
      "tensor_product_Chebyshev_Lobatto_nodes_mapped_to_the_half_domain",
    authoritativeInteriorReconstructionBasis:
      "radial_Chebyshev_Lobatto_polynomials_times_scalar_odd_or_potential_even_Legendre_modes_from_the_frozen_multipole_arrays",
    mappedNodes: {
      rho: "rho_j=(1-cos(pi*j/(Nr-1)))/2",
      theta: "theta_k=(pi/4)*(1-cos(pi*k/(Ntheta-1)))",
      indexOrder: "j_then_k_with_theta_contiguous",
      arrayLinearIndex: "j*Ntheta+k",
      serialization:
        "evaluate_each_formula_in_MPFR256_from_the_exact_integer_indices_and_correctly_rounded_pi_then_store_the_unique_RN_even_binary64_value_in_ascending_index_order_with_either_zero_canonicalized_positive",
      nodeArraysMustBeBitwiseEqualToTheseValues: true,
      producerSuppliedOrPlatformLibmNodeValuesAllowed: false,
    },
    levels: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_GRID_LEVELS,
    auditGridRule:
      "AUDIT_is_evaluation_of_the_single_authoritative_piecewise_continuum_and_must_not_be_solved_or_retuned",
    acceptedContinuumRepresentation: {
      compactInterior:
        "the_accepted_L2_radial_Chebyshev_times_parity_Legendre_reconstruction_from_the_post_projection_L2_multipole_arrays_on_0<=x<=32",
      tail: "the_deterministic_finite_u_rep_V_rep_Coulomb_tail_on_x>=32_with_R_U_R_V_only_as_outward_error_enclosures",
      join: "exact_value_and_first_x_derivative_equality_at_x=32",
      auditSampling:
        "nodes_with_x<=32_evaluate_the_L2_interior_polynomial_nodes_with_x>32_evaluate_u_rep_V_rep_and_rho=1_uses_the_analytic_zero_limit_all_with_frozen_MPFR256_to_binary64_rounding",
    },
  },
  boundaryAndRegularityConditions: {
    originRho0: ["u=0", "partial_rho(V)=0"],
    infinityRho1: ["u=0", "V=0"],
    northAxisTheta0: ["partial_theta(u)=0", "partial_theta(V)=0"],
    equatorThetaPiOver2: ["u=0", "partial_theta(V)=0"],
    postSolveDirichletProjection: {
      exactCanonicalPositiveZeroRowsAtEveryLevel: [
        "every_scalar_odd_multipole_at_rho=0",
        "every_scalar_odd_multipole_at_rho=1",
        "every_potential_even_multipole_at_rho=1",
        "base_scalar_u0_at_rho=0",
        "base_scalar_u0_at_rho=1",
        "base_scalar_u0_at_theta=pi/2",
        "all_seven_target_scalar_u_A_at_rho=0",
        "all_seven_target_scalar_u_A_at_rho=1",
        "all_seven_target_scalar_u_A_at_theta=pi/2",
        "base_potential_V0_at_rho=1",
        "all_seven_target_potential_V_A_at_rho=1",
      ],
      deterministicOrder:
        "after_each_solve_project_to_the_frozen_parity_Legendre_multipoles_set_the_declared_multipole_Dirichlet_entries_to_exact_IEEE754_positive_zero_radially_reconstruct_the_unique_polynomial_then_resample_all_nodal_field_rows_with_symbolic_endpoint_values_before_every_hash_proof_or_gate",
      acceptedL2ScalarAndPotentialSourceHashesUsePostProjectionBytes: true,
      acceptedL2InteriorPolynomialUsesPostProjectionMultipoleArrays: true,
      nodalBaseArraysAreUniqueRnEvenResamplingNotIndependentPolynomialData: true,
      targetScalingUsesPostProjectionBaseContinuum: true,
      serverReplaysAllResidualBoundaryParityScalingAndProofGatesAfterProjection: true,
      postHashOrPostGateProjectionAllowed: false,
      angularAxisAndEquatorNeumannParityIsExactByLegendreBasis: true,
      radialPotentialOriginNeumannProjectedOrClaimedExact: false,
      removableFactorAuthority:
        "the_exact_scalar_multipole_rho=0_zeros_supply_the_radial_factor_and_the_odd_Legendre_basis_supplies_the_exact_cos(theta)_factor_used_for_g_and_H_J;_no_numerical_radial_origin_Neumann_row_is_treated_as_exact",
      exactFieldEntryCounts: {
        perLevel: [
          {
            levelId: "L0",
            scalarPerField: 126,
            scalarAcrossBaseAndSevenTargets: 1008,
            potentialAcrossBaseAndSevenTargets: 256,
            allProjectedEntries: 1264,
          },
          {
            levelId: "L1",
            scalarPerField: 190,
            scalarAcrossBaseAndSevenTargets: 1520,
            potentialAcrossBaseAndSevenTargets: 384,
            allProjectedEntries: 1904,
          },
          {
            levelId: "L2",
            scalarPerField: 254,
            scalarAcrossBaseAndSevenTargets: 2032,
            potentialAcrossBaseAndSevenTargets: 512,
            allProjectedEntries: 2544,
          },
          {
            levelId: "AUDIT",
            scalarPerField: 510,
            scalarAcrossBaseAndSevenTargets: 4080,
            potentialAcrossBaseAndSevenTargets: 1024,
            allProjectedEntries: 5104,
          },
        ],
        allLevelsScalarAcrossBaseAndSevenTargets: 8640,
        allLevelsPotentialAcrossBaseAndSevenTargets: 2176,
        allLevelsProjectedEntries: 10816,
        multipoleProjectedEntriesPerLevel: [
          { levelId: "L0", scalar: 32, potential: 16, total: 48 },
          { levelId: "L1", scalar: 48, potential: 24, total: 72 },
          { levelId: "L2", scalar: 64, potential: 32, total: 96 },
          { levelId: "AUDIT", scalar: 128, potential: 64, total: 192 },
        ],
        allLevelsMultipoleProjectedEntries: 408,
        scalarPerFieldFormula: "2*Ntheta+Nr-2",
        potentialPerFieldFormula: "Ntheta",
        duplicateCornerEntriesCountedOnce: true,
      },
    },
    rowMap: {
      scalarInterior: "R_S_for_1<=j<=Nr-2_and_1<=k<=Ntheta-2",
      potentialInterior: "R_P_for_1<=j<=Nr-2_and_1<=k<=Ntheta-2",
      radialBoundaryPrecedence:
        "rho=0_and_rho=1_rows_replace_angular_rows_at_all_four_corners",
      angularRows: "theta=0_and_theta=pi/2_rows_apply_only_for_1<=j<=Nr-2",
      rowAveragingOrFallbackAllowed: false,
    },
    fullDomainParity: {
      scalar: "u(x,pi-theta)=-u(x,theta)",
      potential: "V(x,pi-theta)=V(x,theta)",
      y10AxisConsequence: "partial_theta(u)=0_at_theta=0",
    },
    continuumReferenceSeries: {
      legendreConvention: "P_ell=P_ell(cos(theta))",
      scalar: "u=a1*x*P1+x^3*(((Vc-nu)*a1/5)*P1+a3*P3)+O(x^5)",
      potential: "V=Vc+b2*x^2*P2+x^4*((a1^2/60)*P0+(a1^2/21)*P2+b4*P4)+O(x^6)",
      finiteFreeCoefficients: ["Vc", "a3", "b2", "b4"],
      phaseCoefficient: "a1>0",
      authority:
        "analytic_reference_for_a_numerical_defect_gate_not_exact_regularity_or_PDE_authority",
      forbiddenTerms: [
        "scalar_x^0",
        "scalar_x^2",
        "potential_x^1",
        "potential_x^2_P0",
      ],
    },
    infinitySeries: {
      kappa: "sqrt(-2*nu)",
      coulombCoefficient: "C=N/(4*pi)",
      scalar: "u=exp(-kappa*x)*x^(C/kappa-1)*(a_infinity(theta)+O(1/x))",
      potential: "V=-N/(4*pi*x)+O(x^-3)",
    },
  },
  angularExpansionAndMultipoleDuty: {
    scalarExpansion: "u(x,theta)=sum_(k>=0) u_(2k+1)(x)*P_(2k+1)(cos(theta))",
    potentialExpansion: "V(x,theta)=sum_(k>=0) V_(2k)(x)*P_(2k)(cos(theta))",
    coefficientDefinition:
      "q_ell(x)=((2*ell+1)/2)*integral_(-1)^1 q(x,acos(z))*P_ell(z)*dz",
    auditScalarEllOrder: "1,3,...,127",
    auditPotentialEllOrder: "0,2,...,126",
    nonlinearClosure: {
      scalarSquareDuty: "P1^2=(P0+2*P2)/3_sources_even_P0_and_P2_potential",
      potentialTimesScalarDuty:
        "V_even_times_u_odd_generates_higher_odd_scalar_multipoles",
      radialY10OnlyTruncationValid: false,
      rejectionReason:
        "a_Y10_only_scalar_with_spherical_or_Y10_only_gravity_is_not_closed_under_the_nonlinear_SP_equations",
    },
    prohibitedApproximation:
      "no_single_radial_Y10_scalar_truncation_may_be_used_as_the_authoritative_seed",
  },
  nodePhaseAndPeakConditions: {
    phase:
      "a1=partial_x_u(0,0)>0_is_the_axis_representative_and_the_interval_g_proof_sets_the_continuum_north_phase",
    prescribedZerosOnly: ["x=0", "x=infinity", "theta=pi/2"],
    discreteNodelessGate:
      "forbid_negative_and_negative_zero_everywhere_require_exact_canonical_positive_zero_on_the_prescribed_projected_scalar_Dirichlet_rows_require_strict_positive_binary64_at_every_other_eligible_node_where_the_certified_exact_value_exceeds_min_subnormal/2_and_allow_other_positive_zero_only_for_certified_strictly_positive_tail_underflow_with_unique_RN_even_rounding",
    discreteNodelessEligibleNodeCounts: {
      auditBaseScalarTotal: 32768,
      auditBasePrescribedBoundaryPositiveZero: 510,
      auditBaseEligibleNonBoundary: 32258,
      auditBaseAndSevenTargetsTotal: 262144,
      auditBaseAndSevenTargetsPrescribedBoundaryPositiveZero: 4080,
      auditBaseAndSevenTargetsEligibleNonBoundary: 258064,
      negativeOrNegativeZeroAllowedCount: 0,
      underflowPositiveZeroMayOverlapPrescribedBoundary: false,
    },
    continuousNodelessProof: {
      requiredBeforeNodelessArtifactEmission: true,
      replayProtocolBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      proofKernelBinding: null,
      proofSubject:
        "piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
      factoredField: "g(rho,theta)=u(x,theta)/(x*cos(theta))",
      openDomainClaim:
        "g>0_for_0<=rho<1_and_0<=theta<=pi/2_after_taking_regular_endpoint_limits",
      endpointLimits: {
        origin:
          "g(0,theta)=partial_x(u)(0,theta)/cos(theta)_with_interval_positive_quotient",
        equator: "g(rho,pi/2)=-partial_theta(u)(rho,pi/2)/x_for_0<rho<1",
        originEquatorCorner: "g(0,pi/2)=-partial_x_partial_theta(u)(0,pi/2)>0",
        infinity:
          "g_has_the_Coulomb_tail_sign_of_a_infinity(theta)/cos(theta)_and_tends_to_zero_from_the_positive_side",
      },
      compactInteriorProof:
        "directed_rounding_radial_Chebyshev_times_parity_Legendre_interval_enclosures_of_the_authoritative_interior_must_exclude_zero_on_an_adaptive_cover_of_0<=x<=32_and_0<=theta<=pi/2",
      tailProof:
        "a_directed_rounding_scaled_enclosure_of_the_deterministic_u_rep_tail_must_prove_H_u>0_a_infinity(theta)/cos(theta)>0_and_that_all_outward_evaluation_and_continuation_error_bounds_are_strictly_dominated_for_x>=32",
      rhoTailSelection:
        "rhoTail=32/33_is_derived_only_from_the_exact_frozen_xTail=32_and_may_not_be_retuned",
      rhoTailExact: "32/33",
      intervalReplayPolicy: {
        arithmetic: "MPFR_binary256_with_directed_outward_rounding",
        binary64ArrayValuesEnclosedByExactBitPattern: true,
        analyticRemovalOfOriginAndEquatorFactorsRequired: true,
        strictAcceptanceRule: "lower_bound_of_g_is_strictly_greater_than_zero",
        maximumAdaptiveBoxes: 262144,
        maximumSubdivisionDepthPerCoordinate: 24,
        retryWithMorePrecisionOrBoxesAllowed: false,
      },
      rootIsolationFailurePolicy:
        "any_interval_containing_zero_after_the_frozen_subdivision_budget_rejects_the_artifact",
      targetPropagation:
        "lambda^2>0_and_the_monotone_rho_to_rho_lambda_map_transport_the_base_proof_to_all_seven_scaled_targets",
      producerProofReceiptHasAuthority: false,
      serverReplayRequired: true,
      proofReceipt: null,
      established: false,
    },
    continuousPeakProof: {
      requiredBeforeAmplitudeScalingOrArtifactEmission: true,
      replayProtocolBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      proofKernelBinding: null,
      proofSubject:
        "piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
      absoluteValueReduction:
        "after_the_continuous_nodeless_proof_abs(u0)=u0_on_the_open_north_half_domain",
      stationaryIsolation:
        "directed_rounding_interval_Newton_or_Krawczyk_replay_must_isolate_every_stationary_point_and_angular_boundary_KKT_candidate_only_on_the_closed_physical-derivative_middle_s_in_[2^-12,1-2^-12]_while_the_two_closed_adjoining_slabs_are_complete_value-only_covers",
      boundaryInventory: [
        "origin_value_cover_s_in_[0,2^-12]",
        "physical_middle_theta=0_regular_axis",
        "physical_middle_theta=pi/2",
        "C1_join_value_cover_s_in_[1-2^-12,1]",
        "both_closed-cover_shared_faces_s=2^-12_and_s=1-2^-12_with_consistent_adjoining_value_enclosures",
        "exterior_x>=32_including_infinity_by_the_scaled_D_tail_proof",
      ],
      uniquenessRule:
        "exactly_one_physical-middle_candidate_box_on_theta=0_is_a_strictly_positive_local_maximum_with_strictly_negative_radial_and_repeated_regular_transverse_Hessian_eigenvalue_upper_bounds_and_positive_2_by_2_meridional_H_xx*H_TT-H_xT^2_determinant_lower_bound",
      axisPeakRequired: true,
      offAxisMaximumBlocksArtifactAndBvpInitialization: true,
      axisHessianRule:
        "at_theta=0_use_H_TT=partial_x(u)/x+partial_theta_theta(u)/x^2_and_H_xT=partial_x_theta(u)/x-partial_theta(u)/x^2_in_the_regular_orthonormal_frame;_the_full_3D_axis_Hessian_repeats_the_strictly_negative_H_TT_eigenvalue_and_hessianDeterminantLower_never_denotes_the_full_3_by_3_determinant",
      globalDominanceRule:
        "the_candidate_value_lower_bound_must_strictly_exceed_the_value_upper_bound_of_every_other_physical-middle_stationary_or_boundary_box_every_terminal_leaf_of_both_frozen_value-cover_slabs_and_the_exterior_tail_bound",
      enclosureOutputs: [
        "A0_interval",
        "rhoPeak0_interval",
        "thetaPeak0_exact_[0,0]",
        "xPeak0_interval",
      ],
      maximumA0IntervalWidthExact: "2^-40",
      maximumA0IntervalWidth: 2 ** -40,
      maximumRhoPeakIntervalWidthExact: "2^-40",
      maximumRhoPeakIntervalWidth: 2 ** -40,
      maximumThetaPeakIntervalWidthExact: "2^-40",
      maximumThetaPeakIntervalWidth: 2 ** -40,
      maximumXPeakIntervalWidthExact: "2^-40",
      maximumXPeakIntervalWidth: 2 ** -40,
      metadataSelection: {
        A0: "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_A0_interval",
        rhoPeak0:
          "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_rhoPeak0_interval",
        xPeak0:
          "unique_RN_even_binary64_result_of_MPFR256(rhoPeak0/(1-rhoPeak0))_which_must_lie_in_the_xPeak0_interval",
        producerSelectionInsideAnIntervalAllowed: false,
      },
      intervalReplayPolicy: {
        arithmetic: "MPFR_binary256_with_directed_outward_rounding",
        maximumAdaptiveBoxes: 262144,
        maximumRadialSubdivisionDepth: 52,
        maximumAngularSubdivisionDepth: 56,
        maximumTreeDepth: 108,
        childConstruction: "exact_dyadic_midpoint_only",
        contractedIntervalNewtonOrKrawczykBoxAcceptedAsARecord: false,
        originCutoffExact: "2^-12",
        joinCutoffExact: "1-2^-12",
        cutoffWidenRetuneOrShiftAllowed: false,
        exactRegionRecordCountsAndTreeDepthRegionOrderRequired: true,
        unresolvedStationaryOrDominanceBoxPasses: false,
        retryWithRetunedPrecisionOrBudgetAllowed: false,
      },
      producerPeakSummaryHasAuthority: false,
      serverReplayRequired: true,
      proofReceipt: null,
      established: false,
    },
    numericalOriginSeriesDefectGate: {
      requiredBeforeArtifactEmission: true,
      replayProtocolBinding:
        NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
      proofKernelBinding: null,
      proofSubject:
        "authoritative_L2_interior_of_piecewise_L2_interior_x_le_32_plus_verified_Coulomb_tail/v1",
      metadataBindings: ["a1", "Vc"],
      metadataSelection: {
        a1: "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_a1_interval",
        Vc: "RN_even_binary64_of_the_exact_dyadic_midpoint_of_the_Vc_interval",
        producerSelectionInsideAnIntervalAllowed: false,
      },
      producerOriginSummaryHasAuthority: false,
      serverReplayRequired: true,
      proofReceipt: null,
      passed: false,
      establishesExactRegularityOrPdeSeriesEquality: false,
    },
    peak: "exactly_one_server_certified_non_degenerate_global_north_half_domain_max_of_abs(u)_in_the_single_authoritative_piecewise_continuum",
    targetAmplitudeDefinition: "A=max(abs(u))",
  },
  deterministicSchedule: {
    step1:
      "solve_the_coupled_base_SP_BVP_at_nu0=-1/2_on_L0_with_the_frozen_phase_and_node_conditions",
    step2:
      "barycentrically_prolong_the_accepted_L0_fields_to_L1_then_solve_the_same_base_BVP_without_retuning",
    step3:
      "barycentrically_prolong_the_accepted_L1_fields_to_L2_then_solve_the_same_base_BVP_without_retuning",
    step4:
      "construct_and_server_replay_the_unique_deterministic_piecewise_L2_representative_then_pass_the_nodeless_peak_origin_tail_and_global_identity_gates_and_select_all_scalar_metadata",
    step5:
      "derive_all_seven_target_amplitudes_in_ascending_order_only_by_the_exact_SP_scaling_map_using_the_selected_A0",
    step6:
      "evaluate_L2_fields_and_all_targets_on_AUDIT_then_independently_reassemble_every_gate_without_a_solve",
    branchSwitchRetryOrPhysicsRetuneAllowed: false,
    auditSolveAllowed: false,
    failedStagePolicy: "fail_closed_with_no_seed_output_artifact",
  },
  relativisticBvpInitializationMap: {
    authority: "initial_guess_only_no_branch_or_equation_authority",
    sourceContinuum:
      "the_single_deterministic_u_rep_V_rep_piecewise_L2_continuum_after_exact_target_amplitude_scaling_from_the_selected_A0",
    perAmplitudeFieldMap: {
      varphi_init: "u_A",
      F0_init: "V_A",
      F1_init: "-V_A",
      F2_init: "-V_A",
      w_init: "sqrt(1-lambda^2)",
      rhoPeak_init:
        "selected_rho_coordinate_of_the_server_certified_unique_theta=0_global_peak_of_u_A_not_a_discrete_node_maximum",
    },
    peakScalingIdentity: {
      xPeak_A: "xPeak_0/lambda",
      rhoPeak_A: "rhoPeak_0/(lambda+(1-lambda)*rhoPeak_0)",
      directContinuousPeakRecomputationRequired: true,
    },
    peakReceiptCrossBinding: {
      baseThetaPeakRequiredExact: "[0,0]",
      baseRhoPeakMustEqualSelectedReceiptMidpoint: true,
      baseXPeakMustEqualDirectedRhoImageSelection: true,
      scaledRhoPeakMustUseTheSameCertifiedAxisCandidate: true,
      bvpNormalizationPoint:
        "varphi(rhoPeak_init,theta=0)=A_with_partial_rho_varphi=0",
      offAxisReceiptAccepted: false,
    },
    bvpL0Destination: {
      radialNodeCount:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.levels[0]
          .radialNodeCount,
      angularNodeCount:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.levels[0]
          .angularNodeCount,
      rhoNodes:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.mappedNodes
          .rho,
      thetaNodes:
        NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.mappedNodes
          .theta,
      evaluation:
        "evaluate_the_scaled_single_authoritative_piecewise_continuum_directly_at_BVP_L0_nodes",
      producerChosenIntermediateGridAllowed: false,
      AUDITGridMaySupplyInitializationValues: false,
    },
    bvpConsumptionRule: {
      seedInitializedAmplitudeExact: "2^-16",
      laterAmplitudeRule:
        "each_later_BVP_amplitude_uses_only_the_immediately_preceding_accepted_relativistic_solution",
      seedMayReplaceLaterRelativisticContinuation: false,
    },
    relativisticFrequencyMustBeSolvedAgain: true,
    satisfiesRelativisticEquationsByConstruction: false,
    establishesRelativisticBranchIdentity: false,
    establishesRelativisticResidualOrConvergence: false,
  },
  observablesAndIdentities: {
    authorityScope:
      "full_space_observables_and_all_four_global_identities_are_defined_and_gated_only_for_the_single_deterministic_L2_piecewise_representative;_AUDIT_is_resampling_and_L0_L1_have_no_full_space_observable_authority",
    definitions: {
      N: "integral(u^2*d^3x)",
      T: "(1/2)*integral(((partial_x(u))^2+(partial_theta(u))^2/x^2)*d^3x)",
      W: "(1/2)*integral(V*u^2*d^3x)",
      potentialGradientIntegral:
        "P_V=integral(((partial_x(V))^2+(partial_theta(V))^2/x^2)*d^3x)",
      energy: "E=T+W",
      asymptoticFlux:
        "N_flux=4*pi*lim_(x->infinity)(x^2*integral_0^(pi/2)(sin(theta)*partial_x(V))*dtheta)",
    },
    virialIdentity: "2*T+W=0",
    eigenvalueIdentity: "nu*N=T+2*W",
    poissonEnergyIdentity: "P_V+2*W=0",
    gaussIdentity: "N_flux=N",
    endpointRule:
      "quadrature_uses_analytic_compactified_endpoint_limits_and_must_never_evaluate_zero_times_infinity",
    lowerSolveDiagnostics:
      "L0_L1_and_the_L2_interior_comparison_use_only_A32_N32_T32_W32_integrated_on_0<=x<=32_and_never_extrapolate_their_compactified_polynomial_to_full_space",
  },
  serverRecomputedGates: {
    authority:
      "independent_verifier_reassembles_from_raw_field_arrays_and_frozen_operators",
    producerResidualOrObservableArraysHaveAuthority: false,
    normalizedResiduals: {
      schrodinger:
        "abs(R_S)/(1+abs(partial_x^2(u)/2)+abs(partial_x(u)/x)+abs(partial_theta^2(u)/(2*x^2))+abs(cot(theta)*partial_theta(u)/(2*x^2))+abs(V*u)+abs(nu*u))",
      poisson:
        "abs(R_P)/(1+abs(partial_x^2(V))+abs(2*partial_x(V)/x)+abs(partial_theta^2(V)/x^2)+abs(cot(theta)*partial_theta(V)/x^2)+u^2)",
      coordinateLimitsUseRegularSeries: true,
    },
    thresholds: {
      productionSchrodingerNormalizedLInfMaximum: 1e-10,
      productionPoissonNormalizedLInfMaximum: 1e-10,
      auditSchrodingerNormalizedLInfMaximum: 1e-10,
      auditPoissonNormalizedLInfMaximum: 1e-10,
      boundaryAndParityLInfMaximum: 1e-12,
      targetAmplitudeAbsoluteErrorMaximumExact: "2^-30",
      targetAmplitudeAbsoluteErrorMaximum: 2 ** -30,
      L1ToL2FieldRelativeLInfMaximum: 1e-8,
      minimumObservedDifferenceRatioD01OverD12: 4,
      L1ToL2InteriorObservableRelativeDifferenceMaximum: 1e-9,
      virialRelativeDefectMaximum: 1e-9,
      eigenvalueIdentityRelativeDefectMaximum: 1e-9,
      poissonEnergyRelativeDefectMaximum: 1e-9,
      gaussFluxRelativeDefectMaximum: 1e-9,
      radialSpectralTailRelativeMaximum: 1e-10,
      angularMultipoleTailRelativeMaximum: 1e-10,
      targetScalingRelativeLInfMaximum: 1e-12,
    },
    convergenceDefinitions: {
      fieldDifference:
        "D_ab=max_q_in_{u0,V0}(normInf_on_0<=x<=32(q_b-prolong(q_a))/max(normInf_on_0<=x<=32(q_b),1e-300))",
      differenceRatio: "if_D12>0_require_D01/D12>=4;_if_D12=0_require_D01=0",
      interiorObservableDifference:
        "max_q_in_{A32,N32,T32,W32}(abs(q_L2-q_L1)/max(abs(q_L2),1e-300))_with_every_integral_truncated_at_x=32",
      radialTail:
        "max_abs_last_8_radial_Chebyshev_coefficients/max_abs_all_radial_coefficients_for_each_field",
      angularTail:
        "max_abs_last_8_parity_allowed_Legendre_coefficients/max_abs_all_allowed_coefficients_for_each_field",
    },
    identityNormalizations: {
      authoritySubject: "deterministic_L2_piecewise_representative_only",
      virial: "abs(2*T+W)/(2*T+abs(W))",
      eigenvalue: "abs(nu*N-T-2*W)/(abs(nu)*N+T+2*abs(W))",
      poissonEnergy: "abs(P_V+2*W)/(P_V+2*abs(W))",
      gaussFlux: "abs(N_flux-N)/N",
    },
    hardDiscreteConditions: [
      "base_nu0=-1/2_is_a_frequency_exempt_mathematical_scale_gauge",
      "for_every_scaled_target_nu_A<0_and_1+2*nu_A>0_and_0<wSeed_A<1",
      "A0>0",
      "0<lambda<1_for_every_target",
      "a1>0",
      "AUDIT_scalar_values_obey_certified_RN_even_positive_or_positive_zero_tail_rounding_and_are_never_negative_or_negative_zero",
      "all_AUDIT_interior_potential_values_are_strictly_negative",
      "server_replayed_continuous_factored_field_nodeless_proof_passed",
      "one_non_degenerate_global_peak_of_the_authoritative_piecewise_continuum",
      "server_replayed_continuous_peak_existence_uniqueness_and_global_dominance_proof_passed",
      "server_replayed_numerical_origin_series_defect_gate_passed_without_exact_regularity_authority",
      "all_gates_are_conjunctive",
    ],
  },
  outputArtifactPolicy: {
    artifactKind: "nodeless_Newtonian_Schrodinger_Poisson_2p_seed",
    sha256Domain:
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
        .newtonianSeed.sha256Domain,
    canonicalDescriptor:
      "RFC8785_JSON_Canonicalization_Scheme_UTF8_after_recursive_rejection_of_nonfinite_numbers_and_negative_zero",
    arrayEncoding:
      "raw_little_endian_IEEE754_binary64_C_order_with_shape_and_role_in_descriptor_all_values_finite_and_negative_zero_forbidden",
    arraySha256Domain:
      "nhm2.prolate_boson_star.newtonian_2p_seed.array.sha256.v1\n",
    arrayHashRecipe:
      "sha256(utf8(arraySha256Domain)+u64be(path_utf8_byte_length)+path_utf8+u64be(role_utf8_byte_length)+role_utf8+u64be(array_byte_length)+raw_array_bytes)",
    artifactHashRecipe:
      "sha256(utf8(sha256Domain)+0x0a+u64be(canonical_descriptor_utf8_byte_length)+canonical_descriptor_utf8)",
    closedInventoryRule:
      "the_canonical_descriptor_contains_every_static_inventory_field_plus_each_array_sha256_and_byteLength_so_the_artifact_hash_closes_all_array_bytes",
    outputRoles: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ROLES,
    perLevelArraySemantics: {
      L0: "rho_theta_are_frozen_RN_even_nodes;_multipole_arrays_are_post_projection_raw_solve_diagnostics_and_base_nodal_arrays_are_their_unique_RN_even_resampling_with_no_continuum_authority;_all_target_u_A_V_A_arrays_are_direct_RN_even_samples_of_the_scaled_deterministic_L2_piecewise_continuum_on_L0_nodes",
      L1: "rho_theta_are_frozen_RN_even_nodes;_multipole_arrays_are_post_projection_raw_refinement_diagnostics_and_base_nodal_arrays_are_their_unique_RN_even_resampling_with_no_continuum_authority;_all_target_u_A_V_A_arrays_are_direct_RN_even_samples_of_the_scaled_deterministic_L2_piecewise_continuum_on_L1_nodes",
      L2: "rho_theta_are_frozen_RN_even_nodes;_post_projection_multipole_arrays_define_the_authoritative_radial_Chebyshev_times_parity_Legendre_interior_and_base_nodal_arrays_are_their_unique_RN_even_resampling;_all_target_arrays_are_direct_RN_even_samples_of_the_scaled_deterministic_piecewise_representative",
      AUDIT:
        "rho_theta_are_frozen_RN_even_nodes;_all_base_field_target_and_multipole_arrays_are_direct_RN_even_resampling_or_deterministic_transform_of_the_deterministic_piecewise_L2_representative_and_never_a_fourth_solution",
    },
    exactRoleSourceMatrix: {
      rho_nodes: "frozen_MPFR256_to_RN_even_grid_formula_at_every_level",
      theta_nodes: "frozen_MPFR256_to_RN_even_grid_formula_at_every_level",
      base_scalar_u0:
        "unique_RN_even_resampling_of_same_level_post_projection_scalar_odd_multipole_reconstruction_at_L0_L1_L2_and_piecewise_L2_resampling_at_AUDIT",
      base_potential_V0:
        "unique_RN_even_resampling_of_same_level_post_projection_potential_even_multipole_reconstruction_at_L0_L1_L2_and_piecewise_L2_resampling_at_AUDIT",
      target_scalar_u_A:
        "scaled_deterministic_L2_piecewise_continuum_directly_sampled_at_every_level",
      target_potential_V_A:
        "scaled_deterministic_L2_piecewise_continuum_directly_sampled_at_every_level",
      multipole_scalar_odd:
        "post_projection_primary_solve_or_refinement_diagnostic_at_L0_L1_authoritative_interior_source_at_L2_and_deterministic_piecewise_transform_at_AUDIT",
      multipole_potential_even:
        "post_projection_primary_solve_or_refinement_diagnostic_at_L0_L1_authoritative_interior_source_at_L2_and_deterministic_piecewise_transform_at_AUDIT",
      alternateRoleSourceAllowed: false,
    },
    levelOuterRoleInnerInventory:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY,
    inventoryTotals:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_TOTALS,
    containerClosure: {
      ruleVersion:
        "nhm2.prolate_boson_star.newtonian_2p_seed.container_closure/v1",
      containerKind: "ordinary_directory_tree_with_implicit_root",
      descriptorRelativePath: "seed-descriptor.canonical.json",
      descriptorRawByteIdentityRule:
        "the_descriptor_file_raw_bytes_must_equal_the_exact_RFC8785_canonical_UTF8_serialization_byte_for_byte_with_no_BOM_whitespace_prefix_suffix_or_trailing_bytes",
      descriptorSizeRule:
        "the_regular_file_size_must_equal_the_UTF8_byte_length_of_that_exact_canonical_serialization_before_hashing_or_admission",
      differentlyFormattedEquivalentJsonAllowed: false,
      requiredFileCount: 33,
      requiredFilePathOrder: [
        "seed-descriptor.canonical.json",
        ...NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_ARRAY_INVENTORY.map(
          ({ relativePath }) => relativePath,
        ),
      ],
      requiredExplicitDirectoryPathOrder: [
        "arrays",
        "arrays/L0",
        "arrays/L1",
        "arrays/L2",
        "arrays/AUDIT",
      ],
      extraFilesAllowed: false,
      extraDirectoriesAllowed: false,
      symlinksAllowed: false,
      reparsePointsAllowed: false,
      hardlinksAllowed: false,
      alternateDataStreamsAllowed: false,
      pathRules: {
        separator: "/",
        characterSet: "printable_ASCII_only",
        unicodeNormalization: "NFC_and_ASCII_identity_required",
        caseSensitiveExactMatchRequired: true,
        absoluteDriveDotDotDotPercentEncodedOrNulPathAllowed: false,
        duplicateCaseFoldUnicodeNormalizeOrSeparatorAliasAllowed: false,
      },
      hardlinkCheck:
        "every_required_regular_file_must_have_a_unique_platform_file_identity_and_link_count_one",
      admissionRule:
        "enumerate_without_following_links_then_require_exact_order_independent_set_equality_for_the_33_files_and_5_explicit_directories_after_raw_path_validation_then_compare_the_bounded_descriptor_raw_bytes_to_the_exact_canonical_serialization_before_hashing_or_opening_arrays",
      anyExtraMissingAliasOrSpecialEntryFailsClosed: true,
    },
    runtimeDescriptorSchemaAuthoritativeSingletonIdentityRequired: true,
    runtimeDescriptorSchemaBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING,
    proofReplayProtocolBinding:
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING,
    producerSuppliedDiagnosticsAcceptedAsAuthority: false,
  },
  dependencyRuntimeAndResourceClosure: {
    requiredImplementationInputs: REQUIRED_IMPLEMENTATION_INPUTS,
    everyInputRequiresArtifactSha256AndByteLength: true,
    implementationClosureManifest: null,
    proofKernelBinding: null,
    implementationClosureComplete: false,
    runtimeReceipt: null,
    runtimeClosureComplete: false,
    resourcePolicy: {
      maximumChildRssMiB: 768,
      maximumWallSeconds: 1800,
      maximumProcesses: 1,
      maximumThreads: 1,
      maximumBlasThreads: 1,
      minimumHostReserveGiB: 2,
      network: "denied",
      osLevelEnforcementImplemented: false,
      executionBlockedUntilEnforced: true,
    },
  },
  executionState: {
    executionPresent: false,
    solverImplementation: null,
    implementationClosureManifest: null,
    resourceEnforcementReceipt: null,
    baseSolutions: null,
    targetSeedArrays: null,
    multipoleArrays: null,
    continuousNodelessProofReceipt: null,
    continuousNodelessProofEstablished: false,
    continuousPeakProofReceipt: null,
    continuousPeakProofEstablished: false,
    numericalOriginSeriesDefectReceipt: null,
    numericalOriginSeriesDefectGatePassed: false,
    observableReport: null,
    serverRecomputedGateReport: null,
    runtimeReceipt: null,
    outputArtifact: null,
    outputArtifactSha256: null,
    structurallyAdmissible: false,
  },
  structuralAuthorityLocks: {
    authority: "initializer_only",
    initializer_only: true,
    relativisticBranchSolved: false,
    boson_star_branch_not_solved: true,
    candidateAdmissible: false,
    seedMayClearBosonStarBranchNotSolved: false,
    allV3ClaimLocksFalse: true,
  },
  blockers: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BLOCKERS,
  v3ClaimLocksExhaustive: true,
  claimLockKeys: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS,
  claimLocks: NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS,
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

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1 = deepFreeze(CONTRACT);

const assertInvariants = (): void => {
  const contract = NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1;
  const bvpSeed =
    NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.initializationAndContinuation
      .newtonianSeed;
  if (
    contract.bindings.candidatePlanV2.bindingPins !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING_PINS ||
    contract.bindings.candidatePlanV2.binding !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2_BINDING ||
    contract.bindings.candidatePlanV2.binding.sha256 !==
      "945290005dced13762a8972e725ac72bb2006eda88f5537ec3a231c848122f14" ||
    contract.bindings.candidatePlanV2.binding.canonicalSizeBytes !== 134951 ||
    contract.bindings.candidatePlanV2.candidateId !==
      NHM2_PROLATE_BOSON_STAR_COHERENT_CANDIDATE_PLAN_V2.candidateIdentity
        .candidateId ||
    contract.bindings.branchBvpV1.binding !==
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1_BINDING ||
    contract.bindings.branchBvpV1.binding.sha256 !==
      "4c6d460b8dc83719c590cc24caed9f8e8ad91474528efaacb334226a391c6747" ||
    contract.bindings.branchBvpV1.binding.canonicalSizeBytes !== 17355 ||
    contract.bindings.branchBvpV1.requiredSeedKind !== bvpSeed.requiredKind ||
    contract.outputArtifactPolicy.artifactKind !== bvpSeed.requiredKind ||
    contract.outputArtifactPolicy.sha256Domain !== bvpSeed.sha256Domain ||
    contract.outputArtifactPolicy.runtimeDescriptorSchemaBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_OUTPUT_DESCRIPTOR_SCHEMA_BINDING ||
    contract.outputArtifactPolicy.proofReplayProtocolBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    contract.nodePhaseAndPeakConditions.continuousNodelessProof
      .replayProtocolBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    contract.nodePhaseAndPeakConditions.continuousPeakProof
      .replayProtocolBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    contract.nodePhaseAndPeakConditions.numericalOriginSeriesDefectGate
      .replayProtocolBinding !==
      NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_PROOF_REPLAY_PROTOCOL_BINDING ||
    contract.nodePhaseAndPeakConditions.continuousNodelessProof
      .proofKernelBinding !== null ||
    contract.nodePhaseAndPeakConditions.continuousPeakProof
      .proofKernelBinding !== null ||
    contract.nodePhaseAndPeakConditions.numericalOriginSeriesDefectGate
      .proofKernelBinding !== null ||
    contract.scaleFixingAndContinuation.amplitudes.length !== 7 ||
    contract.domainAndDiscretization.levels.length !== 4 ||
    contract.domainAndDiscretization.levels[3].radialNodeCount !== 256 ||
    contract.relativisticBvpInitializationMap.bvpL0Destination
      .radialNodeCount !==
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.levels[0]
        .radialNodeCount ||
    contract.relativisticBvpInitializationMap.bvpL0Destination
      .angularNodeCount !==
      NHM2_PROLATE_BOSON_STAR_BRANCH_BVP_V1.domainAndCollocation.levels[0]
        .angularNodeCount ||
    contract.relativisticBvpInitializationMap.perAmplitudeFieldMap.F1_init !==
      "-V_A" ||
    contract.relativisticBvpInitializationMap.perAmplitudeFieldMap.F2_init !==
      "-V_A" ||
    contract.relativisticBvpInitializationMap
      .establishesRelativisticBranchIdentity !== false ||
    contract.angularExpansionAndMultipoleDuty.nonlinearClosure
      .radialY10OnlyTruncationValid !== false ||
    contract.executionState.executionPresent !== false ||
    contract.executionState.outputArtifact !== null ||
    contract.structuralAuthorityLocks.relativisticBranchSolved !== false ||
    contract.structuralAuthorityLocks.boson_star_branch_not_solved !== true ||
    contract.structuralAuthorityLocks.candidateAdmissible !== false ||
    contract.claimLockKeys !==
      NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCK_KEYS ||
    contract.claimLocks !== NHM2_SEMICLASSICAL_V3_REPLAY_EPOCH_CLAIM_LOCKS ||
    Object.values(contract.claimLocks).some((value) => value !== false)
  ) {
    throw new Error(
      "nhm2_prolate_boson_star_newtonian_seed_v1_invariant_violation",
    );
  }
};

assertInvariants();

export type Nhm2ProlateBosonStarNewtonianSeedV1 =
  typeof NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1;

type SnapshotResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; violation: string }>;

type SnapshotBudget = {
  nodes: number;
  keys: number;
  stringCodeUnits: number;
};

const SNAPSHOT_LIMITS = Object.freeze({
  maximumDepth: 64,
  maximumNodes: 20_000,
  maximumKeys: 40_000,
  maximumArrayLength: 20_000,
  maximumStringCodeUnits: 131_072,
  maximumTotalStringCodeUnits: 1_000_000,
});

const FORBIDDEN_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "toString",
  "valueOf",
  "hasOwnProperty",
]);

const invalid = (violation: string): SnapshotResult =>
  Object.freeze({ ok: false, violation });

const snapshotPlainData = (
  value: unknown,
  pointer = "",
  ancestors = new Set<object>(),
  budget: SnapshotBudget = { nodes: 0, keys: 0, stringCodeUnits: 0 },
  depth = 0,
): SnapshotResult => {
  const at = pointer || "/";
  if (depth > SNAPSHOT_LIMITS.maximumDepth) {
    return invalid(`snapshot_depth_limit:${at}`);
  }
  budget.nodes += 1;
  if (budget.nodes > SNAPSHOT_LIMITS.maximumNodes) {
    return invalid(`snapshot_node_limit:${at}`);
  }
  if (value === null || typeof value === "boolean") {
    return Object.freeze({ ok: true, value });
  }
  if (typeof value === "string") {
    budget.stringCodeUnits += value.length;
    return value.length <= SNAPSHOT_LIMITS.maximumStringCodeUnits &&
      budget.stringCodeUnits <= SNAPSHOT_LIMITS.maximumTotalStringCodeUnits
      ? Object.freeze({ ok: true, value })
      : invalid(`snapshot_string_limit:${at}`);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) && !Object.is(value, -0)
      ? Object.freeze({ ok: true, value })
      : invalid(`invalid_number:${at}`);
  }
  if (typeof value !== "object") {
    return invalid(`non_json_value:${at}`);
  }
  if (ancestors.has(value)) {
    return invalid(`cyclic_value:${at}`);
  }
  ancestors.add(value);

  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype) {
      return invalid(`non_plain_array:${at}`);
    }
    const descriptors = Object.getOwnPropertyDescriptors(value) as Record<
      string,
      PropertyDescriptor
    >;
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string")) {
      return invalid(`symbol_key:${at}`);
    }
    budget.keys += keys.length;
    if (budget.keys > SNAPSHOT_LIMITS.maximumKeys) {
      return invalid(`snapshot_key_limit:${at}`);
    }
    const lengthDescriptor = descriptors.length;
    const length =
      lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value
        : null;
    if (
      !Number.isSafeInteger(length) ||
      length < 0 ||
      length > SNAPSHOT_LIMITS.maximumArrayLength
    ) {
      return invalid(`array_length:${at}`);
    }
    const expected = new Set([
      "length",
      ...Array.from({ length }, (_, index) => String(index)),
    ]);
    if (
      keys.length !== expected.size ||
      keys.some((key) => !expected.has(key as string))
    ) {
      return invalid(`array_surface:${at}`);
    }
    const output: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = descriptors[String(index)];
      if (
        !descriptor ||
        !("value" in descriptor) ||
        descriptor.enumerable !== true
      ) {
        return invalid(`array_entry_surface:${pointer}/${index}`);
      }
      const nested = snapshotPlainData(
        descriptor.value,
        `${pointer}/${index}`,
        ancestors,
        budget,
        depth + 1,
      );
      if (!nested.ok) return nested;
      output.push(nested.value);
    }
    ancestors.delete(value);
    return Object.freeze({ ok: true, value: output });
  }

  if (Object.getPrototypeOf(value) !== Object.prototype) {
    return invalid(`non_plain_object:${at}`);
  }
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Reflect.ownKeys(value);
  if (keys.some((key) => typeof key !== "string")) {
    return invalid(`symbol_key:${at}`);
  }
  budget.keys += keys.length;
  if (budget.keys > SNAPSHOT_LIMITS.maximumKeys) {
    return invalid(`snapshot_key_limit:${at}`);
  }
  const output = Object.create(null) as Record<string, unknown>;
  for (const key of keys as string[]) {
    if (FORBIDDEN_KEYS.has(key)) {
      return invalid(`forbidden_key:${pointer}/${key}`);
    }
    const descriptor = descriptors[key];
    if (
      !descriptor ||
      !("value" in descriptor) ||
      descriptor.enumerable !== true
    ) {
      return invalid(`object_property_surface:${pointer}/${key}`);
    }
    const nested = snapshotPlainData(
      descriptor.value,
      `${pointer}/${key}`,
      ancestors,
      budget,
      depth + 1,
    );
    if (!nested.ok) return nested;
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

const canonicalJson = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
    .join(",")}}`;
};

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON =
  canonicalJson(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1);
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN =
  "nhm2-prolate-boson-star-newtonian-seed/v1\n" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 = createHash(
  "sha256",
)
  .update(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN, "utf8")
  .update(NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON, "utf8")
  .digest("hex");
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES =
  Buffer.byteLength(
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON,
    "utf8",
  );
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256 =
  "e839a670e57fad1a445d61d88d2ebc49796af33f78fb752103bded74bbd121ea" as const;
export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES =
  50226 as const;

if (
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256 !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_SHA256 ||
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES !==
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_EXPECTED_CANONICAL_SIZE_BYTES
) {
  throw new Error(
    "nhm2_prolate_boson_star_newtonian_seed_v1_canonical_binding_drift",
  );
}

export const NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_BINDING = Object.freeze({
  artifactId: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_ARTIFACT_ID,
  contractVersion: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CONTRACT_VERSION,
  sha256Domain: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256_DOMAIN,
  sha256: NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_SHA256,
  canonicalSizeBytes:
    NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_SIZE_BYTES,
});

const EXPECTED_CANONICAL_JSON =
  NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1_CANONICAL_JSON;

export const nhm2ProlateBosonStarNewtonianSeedV1Violations = (
  value: unknown,
): string[] => {
  if (value === NHM2_PROLATE_BOSON_STAR_NEWTONIAN_SEED_V1) return [];
  let snapshot: SnapshotResult;
  try {
    snapshot = snapshotPlainData(value);
  } catch {
    return ["newtonian_seed_v1_plain_data_snapshot_invalid"];
  }
  if (!snapshot.ok) return [snapshot.violation];
  try {
    return canonicalJson(snapshot.value) === EXPECTED_CANONICAL_JSON
      ? ["newtonian_seed_v1_external_copy_not_authoritative"]
      : ["newtonian_seed_v1_semantic_mismatch"];
  } catch {
    return ["newtonian_seed_v1_plain_data_snapshot_invalid"];
  }
};

export const isNhm2ProlateBosonStarNewtonianSeedV1 = (
  value: unknown,
): value is Nhm2ProlateBosonStarNewtonianSeedV1 =>
  nhm2ProlateBosonStarNewtonianSeedV1Violations(value).length === 0;
