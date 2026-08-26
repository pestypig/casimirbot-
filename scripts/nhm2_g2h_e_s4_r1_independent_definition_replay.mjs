#!/usr/bin/env node
// Source-language-disjoint manufactured replay of the corrected S4-R1
// endpoint and state/grid definitions. This is not a scientific proof run.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const paths = {
  r2: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-mini-boson-star-contract.v1.json",
  v1: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v1.json",
  v2: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v2.json",
  endpoint: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-sp-endpoint-proof-contract.v1.json",
  flat: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-flat-carrier-remainder-contract.v1.json",
  inverse: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-validated-inverse-radii-contract.v1.json",
  continuation: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-continuation-tube-contract.v1.json",
  mass: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-mass-observable-contract.v1.json",
  stability: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-radial-stability-contract.v1.json",
  quantum: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-quantum-ground-rset-noise-contract.v1.json",
  builders: "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json",
};

const bytes = (relative) => fs.readFileSync(path.join(root, relative));
const json = (relative) => JSON.parse(bytes(relative).toString("utf8"));
const sha256 = (relative) => crypto.createHash("sha256").update(bytes(relative)).digest("hex");
const v1 = json(paths.v1);
const v2 = json(paths.v2);
const endpoint = json(paths.endpoint);
const flat = json(paths.flat);
const inverse = json(paths.inverse);
const continuation = json(paths.continuation);
const mass = json(paths.mass);
const stability = json(paths.stability);
const quantum = json(paths.quantum);
const builders = json(paths.builders);
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

check("r2_hash", sha256(paths.r2) === v2.immutable_predecessors.r2.sha256, sha256(paths.r2));
check("v1_hash_preserved", sha256(paths.v1) === v2.immutable_predecessors.invalidated_v1.raw_sha256, sha256(paths.v1));
check("v1_still_invalidated", v1.status.startsWith("invalidated_before_implementation_") && v1.readiness.replacement_required === true, v1.status);
check("endpoint_binds_v2", endpoint.immutable_predecessors.corrected_state_grid.raw_sha256_at_binding === sha256(paths.v2), sha256(paths.v2));
check("endpoint_schema", endpoint.schema === "nhm2.g2h_e_s4_r1.sp_endpoint_proof_contract.v1", endpoint.schema);
check("v2_schema", v2.schema === "nhm2.g2h_e_s4_r1.classical_state_grid_contract.v2", v2.schema);
const expectedRawHashes = {
  flat: "09ca71e9ea3d93ca31468ceb1a953cd0930b86f1f117211b3e4a5925cf865103",
  inverse: "a180d03a7ea4f2b9499bdce9984b7310d178e777016a48a0809d76768a0ba529",
  continuation: "7a0cdc0e45a09e0291b79a1ef3892e221d6ed71395e3e4cf5e767c0adb1cb16c",
  mass: "431c0d421339ed9a2d689fc522c94b171cfdb4ce01425d93594cdb6797bacb18",
  stability: "36bb62c7f386ce16fda989dc896e862ee23ae9b04c52d936f9363b5b61d156f4",
  quantum: "cf0a49ad816af742f0d1f86acbe6afd33538f126ebf5eb7487dbb154359fe3cc",
  builders: "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf",
};
for (const [role, expected] of Object.entries(expectedRawHashes)) {
  check(`${role}_raw_hash`, sha256(paths[role]) === expected, sha256(paths[role]));
}
check("continuation_binds_inverse", continuation.immutable_predecessors.validated_inverse.raw_sha256 === sha256(paths.inverse), continuation.immutable_predecessors.validated_inverse.raw_sha256);
check("stability_binds_continuation", stability.immutable_predecessors.continuation.raw_sha256 === sha256(paths.continuation), stability.immutable_predecessors.continuation.raw_sha256);
check("stability_binds_mass", stability.immutable_predecessors.mass.raw_sha256 === sha256(paths.mass), stability.immutable_predecessors.mass.raw_sha256);
check("quantum_binds_r2", quantum.immutable_predecessors.r2.raw_sha256 === sha256(paths.r2), quantum.immutable_predecessors.r2.raw_sha256);
check("quantum_binds_v2", quantum.immutable_predecessors.state_grid_v2.raw_sha256 === sha256(paths.v2), quantum.immutable_predecessors.state_grid_v2.raw_sha256);
check("quantum_binds_flat", quantum.immutable_predecessors.flat_carrier.raw_sha256 === sha256(paths.flat), quantum.immutable_predecessors.flat_carrier.raw_sha256);
check("builders_bind_inverse", builders.immutable_predecessors.inverse.raw_sha256 === sha256(paths.inverse), builders.immutable_predecessors.inverse.raw_sha256);
check("builders_bind_continuation", builders.immutable_predecessors.continuation.raw_sha256 === sha256(paths.continuation), builders.immutable_predecessors.continuation.raw_sha256);
check("builders_bind_stability", builders.immutable_predecessors.stability.raw_sha256 === sha256(paths.stability), builders.immutable_predecessors.stability.raw_sha256);
check("builders_bind_quantum", builders.immutable_predecessors.quantum.raw_sha256 === sha256(paths.quantum), builders.immutable_predecessors.quantum.raw_sha256);

const frozen = v2.grid_cardinality.frozen_values;
check("grid_order", JSON.stringify(frozen) === JSON.stringify([64, 96, 128, 256]), frozen);
check("node_count_semantics", v2.grid_cardinality.additive_interpretation === "N is the node count on each patch", v2.grid_cardinality.additive_interpretation);
check("positive_physical_interface", v2.common_patch_geometry.scope === "positive-kappa physical-r chart only" && v2.common_patch_geometry.interface.r === "255", v2.common_patch_geometry.interface);
check("vacuum_scaled_interface", v2.vacuum_scaled_patch_geometry.interface.xi === "255" && v2.vacuum_scaled_patch_geometry.interface.Q === "1/255", v2.vacuum_scaled_patch_geometry.interface);
check("interfaces_not_identified", v2.exact_chart_overlap_map.interface_rule.includes("not identified") && v2.exact_chart_overlap_map.tail_overlap_cover.includes("q in [0,epsilon/255]"), v2.exact_chart_overlap_map);
for (const N of frozen) {
  const positiveState = 8 * N + 2;
  const vacuumState = 8 * N + 1;
  const positiveRows = 4 * (N - 1) + 4 * (N - 1) + 4 + 4 + 1 + 1;
  const vacuumRows = 4 * (N - 1) + 4 * (N - 1) + 4 + 4 + 1;
  check(`positive_square_N${N}`, positiveState === positiveRows, { state: positiveState, rows: positiveRows });
  check(`vacuum_square_N${N}`, vacuumState === vacuumRows, { state: vacuumState, rows: vacuumRows });

  const positiveRanges = [[0, 4 * N - 5], [4 * N - 4, 8 * N - 9], [8 * N - 8, 8 * N - 5], [8 * N - 4, 8 * N - 1], [8 * N, 8 * N], [8 * N + 1, 8 * N + 1]];
  const vacuumRanges = [[0, 4 * N - 5], [4 * N - 4, 8 * N - 9], [8 * N - 8, 8 * N - 5], [8 * N - 4, 8 * N - 1], [8 * N, 8 * N]];
  const covers = (ranges, length) => {
    let expected = 0;
    for (const [first, last] of ranges) {
      if (first !== expected || last < first) return false;
      expected = last + 1;
    }
    return expected === length;
  };
  check(`positive_index_cover_N${N}`, covers(positiveRanges, positiveState), positiveRanges);
  check(`vacuum_index_cover_N${N}`, covers(vacuumRanges, vacuumState), vacuumRanges);
}

// DCT-I endpoint coefficients must be canonicalized before degree changes.
const storedT2 = [0n, 0n, 2n];
const canonicalT2 = [storedT2[0] / 2n, storedT2[1], storedT2[2] / 2n];
const prolongedT2 = [...canonicalT2, 0n, 0n];
check("canonical_T2", canonicalT2.join(",") === "0,0,1", canonicalT2.map(String));
check("canonical_prolongation", prolongedT2.join(",") === "0,0,1,0,0", prolongedT2.map(String));
check("raw_prolongation_differs", [...storedT2, 0n, 0n].join(",") !== prolongedT2.join(","), true);

const weight = (k) => BigInt(1 + k) ** 8n;
let sumModesBounded = true;
let differenceModesBounded = true;
for (let m = 0; m <= 256; m += 1) {
  for (let n = 0; n <= 256; n += 1) {
    sumModesBounded &&= weight(m + n) <= weight(m) * weight(n);
    differenceModesBounded &&= weight(Math.abs(m - n)) <= weight(m) * weight(n);
  }
}
check("polynomial_weight_sum_modes", sumModesBounded, true);
check("polynomial_weight_difference_modes", differenceModesBounded, true);
check("exponential_weight_removed", v2.coefficient_spaces_and_cross_grid_norms.full_function_weight === "w_k=(1+k)^8", v2.coefficient_spaces_and_cross_grid_norms.full_function_weight);
const uCoefficientSum = (k) => {
  if (k === 0) return 0n;
  let sum = 0n;
  for (let index = k - 1; index >= 0; index -= 2) sum += BigInt(index === 0 ? 1 : 2);
  return BigInt(k) * sum;
};
check("U_basis_coefficient_sum", Array.from({ length: 257 }, (_, k) => uCoefficientSum(k) === BigInt(k * k)).every(Boolean), "sum |coeff(T_k')|=k^2");
check("derivative_loss_majorant", Array.from({ length: 257 }, (_, k) => BigInt(k * k) * BigInt(1 + k) ** 6n <= BigInt(1 + k) ** 8n).every(Boolean), "k^2*(1+k)^6 <= (1+k)^8");
check("coordinate_derivative_constants", v2.coefficient_spaces_and_cross_grid_norms.coordinate_derivative_constants.positive_tail.includes("260100") && v2.coefficient_spaces_and_cross_grid_norms.coordinate_derivative_constants.vacuum_tail.includes("260100"), v2.coefficient_spaces_and_cross_grid_norms.coordinate_derivative_constants);

// Exponents are pairs [coefficient of beta, constant power of epsilon].
const addExponent = (...items) => items.reduce(([b0, e0], [b1, e1]) => [b0 + b1, e0 + e1], [0, 0]);
const aPhysicalExponent = [-1, 0];
const hPositiveExponent = [1, 2];
const dPositiveExponent = [2, 3];
check("overlap_sigma_epsilon_power", JSON.stringify(addExponent(aPhysicalExponent, hPositiveExponent)) === JSON.stringify([0, 2]), addExponent(aPhysicalExponent, hPositiveExponent));
check("overlap_p_epsilon_power", JSON.stringify(addExponent(aPhysicalExponent, hPositiveExponent, [0, 1])) === JSON.stringify([0, 3]), addExponent(aPhysicalExponent, hPositiveExponent, [0, 1]));
check("overlap_D_epsilon_power", JSON.stringify(addExponent([-2, 0], [0, -2], dPositiveExponent)) === JSON.stringify([0, 1]), addExponent([-2, 0], [0, -2], dPositiveExponent));
check("overlap_K_chain", v2.exact_chart_overlap_map.factored_map.some((row) => row.includes("K(q)=sqrt(2)*epsilon^(beta+1)")), v2.exact_chart_overlap_map.factored_map);

// Exact dyadic radii inventory and strict synthetic radii behavior.
const radii = Array.from({ length: 73 }, (_, index) => 192 - index);
check("endpoint_radius_count", radii.length === endpoint.validation_map.candidate_radii.count, radii.length);
check("endpoint_radius_bounds", radii[0] === 192 && radii.at(-1) === 120, radii);
check("endpoint_radius_order", radii.every((exponent, index) => index === 0 || exponent === radii[index - 1] - 1), true);
const strictPass = ({ y, z0, z1, z2, r }) => z2 * r * r - (1 - z0 - z1) * r + y < 0 && z0 + z1 + z2 * r < 1;
check("synthetic_radii_pass", strictPass({ y: 2 ** -200, z0: 1 / 8, z1: 1 / 8, z2: 1 / 8, r: 2 ** -160 }), true);
check("synthetic_polynomial_touch_fails", !strictPass({ y: 2 ** -160, z0: 0, z1: 0, z2: 0, r: 2 ** -160 }), true);
check("synthetic_contraction_touch_fails", !strictPass({ y: 0, z0: 1, z1: 0, z2: 0, r: 2 ** -160 }), true);

// Independent exact arithmetic checks for the stability proof predicates.
const pd2 = (a, b, d) => a > 0n && a * d - b * b > 0n;
const psd2 = (a, b, d) => a >= 0n && d >= 0n && a * d - b * b >= 0n;
check("stability_Riccati_pass", pd2(3n, 1n, 5n), true);
check("stability_Riccati_touch_fails", !pd2(0n, 0n, 5n), true);
check("stability_jump_zero_passes", psd2(0n, 0n, 0n), true);
check("stability_jump_negative_fails", !psd2(-1n, 0n, 1n), true);
// At omega=1/2 and k=0, the diagonal is 7/4,3/4 and the
// off-diagonal square is 3/4.  Derive, rather than assume, its invariants.
const symbolTopNumerator = 7n;
const symbolBottomNumerator = 3n;
const symbolDenominator = 4n;
const offDiagonalSquareNumerator = 3n;
const offDiagonalSquareDenominator = 4n;
const traceNumerator = symbolTopNumerator + symbolBottomNumerator;
const determinantNumeratorOver16 = symbolTopNumerator * symbolBottomNumerator
  - offDiagonalSquareNumerator * (symbolDenominator ** 2n / offDiagonalSquareDenominator);
check("stability_symbol_trace", traceNumerator === 10n && symbolDenominator === 4n, `${traceNumerator}/${symbolDenominator}`);
check("stability_symbol_determinant", determinantNumeratorOver16 === 9n, `${determinantNumeratorOver16}/16`);
check("stability_essential_threshold", stability.endpoint_and_essential_spectrum.essential_threshold === "E_ess=(1-omega)^2", stability.endpoint_and_essential_spectrum.essential_threshold);
check("stability_strict_predicates", stability.fundamental_mode_upper_certificate.strict_predicates.join("|") === "0<L|L<=U|U<lower(E_ess_ball)", stability.fundamental_mode_upper_certificate.strict_predicates);
check("turning_comparator_separate", stability.mass_turning_side_comparator.separation_of_authority.includes("cannot replace"), stability.mass_turning_side_comparator.separation_of_authority);
check("mass_proper_volume_excluded", mass.integrated_energy_mass.proper_volume_comparator.includes("not one of the three R2-C09 equality masses"), mass.integrated_energy_mass.proper_volume_comparator);

// Independent structural replay of the quantum finite-product definition.
check("quantum_radial_measure", quantum.positive_spatial_operator.spherical_reduction.radial_measure === "dmu_r=b^2*s*r^2 dr=alpha^(-1)*b*r^2 dr", quantum.positive_spatial_operator.spherical_reduction.radial_measure);
check("quantum_bound_accumulation_retained", quantum.positive_spatial_operator.spherical_reduction.bound_spectrum_rule.includes("countably infinite") && quantum.positive_spatial_operator.spherical_reduction.bound_spectrum_rule.includes("not assumed"), quantum.positive_spatial_operator.spherical_reduction.bound_spectrum_rule);
check("quantum_negative_axis_route", quantum.complete_spectral_measure.negative_axis_route.includes("K_ell+kappa^2") && quantum.complete_spectral_measure.negative_axis_route.includes("no physical-axis pole crossing"), quantum.complete_spectral_measure.negative_axis_route);
check("quantum_optical_completeness", quantum.spacetime_and_field.global_hyperbolicity_certificate.includes("optical metric") && quantum.spacetime_and_field.global_hyperbolicity_certificate.includes("alpha_max<infinity"), quantum.spacetime_and_field.global_hyperbolicity_certificate);
check("quantum_time_products_full_measure", quantum.finite_validated_products.resolvent_realization.includes("complete Weyl--Titchmarsh measure") && quantum.finite_validated_products.resolvent_realization.includes("limiting absorption"), quantum.finite_validated_products.resolvent_realization);
check("quantum_mean_shape", JSON.stringify(quantum.declared_smearings.mean_shape) === JSON.stringify([64, 4]), quantum.declared_smearings.mean_shape);
check("quantum_noise_shape", JSON.stringify(quantum.declared_smearings.noise_shape) === JSON.stringify([256, 256]), quantum.declared_smearings.noise_shape);
check("quantum_gram_positive_type", quantum.connected_noise.gram_identity.startsWith("N_(pI)(qJ)=Re") && quantum.connected_noise.positivity.includes(">=0"), quantum.connected_noise.gram_identity);
check("quantum_no_clipping", quantum.connected_noise.verification.includes("not by clipping"), quantum.connected_noise.verification);
check("quantum_selector_prebound", quantum.finite_validated_products.selector_rule.includes("before selected-background ingress"), quantum.finite_validated_products.selector_rule);
check("builder_precision", builders.common_rules.precision.startsWith("512-bit") && builders.common_rules.projection.includes("2^-448"), builders.common_rules);
check("builder_inverse_disjoint", builders.primary_cpp_arb_lineage.classical_inverse_builder.finite_matrix.includes("Arb LU") && builders.independent_pure_rust_lineage.classical_inverse_builder.finite_matrix.includes("Householder QR"), true);
check("builder_stability_disjoint", builders.primary_cpp_arb_lineage.stability_builder.Riccati_K.includes("Chebyshev") && builders.independent_pure_rust_lineage.stability_builder.Riccati_K.includes("Bernstein"), true);
check("builder_quantum_disjoint", builders.primary_cpp_arb_lineage.quantum_builder.radial.includes("Chebyshev") && builders.independent_pure_rust_lineage.quantum_builder.radial.includes("Taylor models"), true);
check("builder_fixed_continuation", [builders.primary_cpp_arb_lineage, builders.independent_pure_rust_lineage].every((lane) => lane.continuation_builder.budgets.cells === 1024 && lane.continuation_builder.budgets.radii_per_cell === 73 && lane.continuation_builder.budgets.adaptive_subdivisions === 0), true);
check("builder_fixed_quantum_width", [builders.primary_cpp_arb_lineage, builders.independent_pure_rust_lineage].every((lane) => lane.quantum_builder.budgets.target_total_width === "2^-120" && lane.quantum_builder.budgets.adaptive_panels === 0), true);
check("builder_exhaustion_terminal", builders.common_rules.budget_exhaustion.includes("terminates") && builders.common_rules.budget_exhaustion.includes("no fallback"), builders.common_rules.budget_exhaustion);

check("v2_square_ready_only", v2.readiness.square_residual_packing_complete === true && v2.readiness.flat_remainder_bounds_complete === false && v2.readiness.independent_definition_audit_complete === false, v2.readiness);
check("endpoint_not_proved", endpoint.readiness.coefficient_realization_complete === true && endpoint.readiness.approximate_inverse_realization_complete === false && endpoint.readiness.endpoint_proved === false, endpoint.readiness);
check("primary_root_absent", !fs.existsSync(path.join(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary")), false);
check("independent_root_absent", !fs.existsSync(path.join(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent")), false);
check("v2_authority_false", Object.values(v2.authority).every((value) => value === false), v2.authority);
check("endpoint_authority_false", Object.values(endpoint.authority).every((value) => value === false), endpoint.authority);
check("mass_authority_false", Object.values(mass.authority).every((value) => value === false), mass.authority);
check("stability_authority_false", Object.values(stability.authority).every((value) => value === false), stability.authority);
check("quantum_authority_false", Object.values(quantum.authority).every((value) => value === false), quantum.authority);
check("builder_authority_false", Object.values(builders.authority).every((value) => value === false), builders.authority);

const passedCount = checks.filter((item) => item.pass).length;
const report = {
  schema: "nhm2.g2h_e_s4_r1.independent_definition_replay.v1",
  status: passedCount === checks.length ? "PASS" : "FAIL",
  meaning: "source-language-disjoint definition and manufactured-fixture replay only; no endpoint, continuation, mass, eigenvalue, quantum state, RSET, noise or candidate proof",
  bindings: {
    r2_sha256: sha256(paths.r2),
    v1_sha256: sha256(paths.v1),
    v2_sha256: sha256(paths.v2),
    endpoint_sha256: sha256(paths.endpoint),
    flat_sha256: sha256(paths.flat),
    inverse_sha256: sha256(paths.inverse),
    continuation_sha256: sha256(paths.continuation),
    mass_sha256: sha256(paths.mass),
    stability_sha256: sha256(paths.stability),
    quantum_sha256: sha256(paths.quantum),
    builders_sha256: sha256(paths.builders),
  },
  checks_passed: passedCount,
  checks_total: checks.length,
  checks,
  endpoint_scientific_evaluations: 0,
  positive_parameter_samples: 0,
  candidate_roots_created: false,
  authority_promoted: false,
  disposition: "CONTINUE_INDEPENDENT_THEORY_REVIEW_BEFORE_IMPLEMENTATION",
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
process.exitCode = report.status === "PASS" ? 0 : 1;
