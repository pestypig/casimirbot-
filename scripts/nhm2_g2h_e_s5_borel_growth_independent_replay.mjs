#!/usr/bin/env node
/*
Program gate: G2H-E-S5
Workstream: authenticated classical and quantum control branch
Capability or component: cross-language replay of the S5-A Borel growth/quadrature definition
Current maturity: candidate-neutral definition replay only
Target maturity: byte-bound evidence suitable for independent parent acknowledgement
Required frozen inputs: the unsealed S5-A Borel contracts and canonical status documents
Required evidence: predecessor hashes, exact integer kernels, fixed selectors/resources, false authority locks
Stop/fail criteria: byte drift, algebra mismatch, missing selector/resource, candidate ingress or authority promotion
Explicit non-goals: acknowledgement, implementation authority, candidate evaluation, C08 execution or physical claims
Downstream gate unlocked: none; this replay is evidence for a separate acknowledgement
*/

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = join(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json");
const stateJetsPath = join(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json");
const stagedPlanPath = join(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-staged-delivery-plan.md");
const workProgramPath = join(root, "docs/research/nhm2-spherical-boson-star-v2-work-program.md");

const raw = (path) => readFileSync(path);
const json = (path) => JSON.parse(raw(path).toString("utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const contract = json(contractPath);
const stateJets = json(stateJetsPath);
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const factorial = (n) => {
  let value = 1n;
  for (let k = 2n; k <= BigInt(n); k += 1n) value *= k;
  return value;
};
const binomial = (n, k) => factorial(n) / (factorial(k) * factorial(n - k));
const polynomialAdd = (left, right) => {
  const result = Array(Math.max(left.length, right.length)).fill(0n);
  for (let index = 0; index < result.length; index += 1) {
    result[index] = (left[index] ?? 0n) + (right[index] ?? 0n);
  }
  while (result.length > 1 && result.at(-1) === 0n) result.pop();
  return result;
};
const polynomialScale = (poly, scale) => poly.map((value) => value * scale);
const oneMinusXPow = (order) => Array.from({ length: order + 1 }, (_, k) =>
  (k % 2 === 0 ? 1n : -1n) * binomial(order, k));
const equalArrays = (left, right) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

const predecessorResults = {};
for (const [name, predecessor] of Object.entries(contract.immutable_predecessors)) {
  const path = join(root, predecessor.path);
  const actual = sha256(raw(path));
  predecessorResults[name] = { expected: predecessor.raw_sha256, actual, match: actual === predecessor.raw_sha256 };
}
check("predecessor_hashes", Object.keys(predecessorResults).length === 7
  && Object.values(predecessorResults).every((item) => item.match), predecessorResults);

const rows = [[1n]];
for (let j = 0; j < 12; j += 1) {
  const next = Array(j + 2).fill(0n);
  rows[j].forEach((coefficient, m) => {
    next[m] -= BigInt(j + m + 1) * coefficient;
    next[m + 1] += coefficient;
  });
  rows.push(next);
}
check("coordinate_low_rows", equalArrays(rows[0], [1n])
  && equalArrays(rows[1], [-1n, 1n])
  && equalArrays(rows[2], [2n, -4n, 1n]), rows.slice(0, 3).map((row) => row.map(String)));

const kernelIdentities = rows.map((row, j) => {
  let numerator = [0n];
  row.forEach((coefficient, m) => {
    numerator = polynomialAdd(numerator,
      polynomialScale(oneMinusXPow(j - m), coefficient * factorial(m)));
  });
  const expected = Array(j + 1).fill(0n);
  expected[j] = factorial(j);
  return equalArrays(numerator, expected);
});
check("coordinate_kernel_identities_0_12", kernelIdentities.every(Boolean), kernelIdentities);
check("borel_endpoint_factorial_normalization", contract.coordinate_derivative_laplace_kernels.endpoint_x_zero
  .includes("F(t)=sum_(n>=0) f_n*t^n/n!")
  && Array.from({ length: 13 }, (_, n) => factorial(n) / factorial(n) === 1n).every(Boolean),
contract.coordinate_derivative_laplace_kernels.endpoint_x_zero);
const realization = contract.all_orders_borel_laplace_realization;
check("all_orders_realization_definition", realization.local_egf_remainder.includes("every integer N>=0")
  && realization.far_ray_flatness.includes("exp(-z)<=L!/z^L")
  && realization.cinfinity_endpoint.includes("every integer j>=0")
  && realization.product_homomorphism.includes("L_(F diamond G)(x)=L_F(x)*L_G(x)")
  && realization.equation_replay.includes("exact-zero positive/vacuum H,K,D,S"), realization);

const originOrders = contract.finite_positive_ray_algorithm.origin_localization.orders;
const panelOrders = contract.finite_positive_ray_algorithm.positive_panel_continuation.orders;
const tailOnsets = contract.finite_positive_ray_algorithm.tail_split_selector.T0_candidates;
const laplaceSplit = contract.finite_positive_ray_algorithm.tail_split_selector.laplace_split;
const outerPanels = contract.finite_laplace_projection_algorithm.outer_chebyshev_projection.panel_candidates;
check("fixed_order_schedules", JSON.stringify(originOrders) === JSON.stringify([32, 48, 64, 96, 128, 192, 256])
  && JSON.stringify(panelOrders) === JSON.stringify([24, 32, 48, 64, 96, 128, 192])
  && contract.finite_positive_ray_algorithm.origin_localization.borel_derivative_tails.includes("DTail(m,r,z)")
  && contract.finite_positive_ray_algorithm.origin_localization.integral_state_tails.includes("J2 tail"), { originOrders, panelOrders });
check("dyadic_schedules", tailOnsets.every((value, index) => value === 2 ** index)
  && laplaceSplit === "T=2*T0, so T ranges from 2 through 8192"
  && contract.finite_positive_ray_algorithm.tail_split_selector.chronology.some((entry) => entry.includes("append-only"))
  && contract.finite_positive_ray_algorithm.tail_split_selector.failure_mapping.includes("C08-012_LYAPUNOV_OR_OPERATOR_BOUND is reserved")
  && outerPanels.every((value, index) => value === 2 ** index), { tailOnsets, laplaceSplit, outerPanels });

const resources = contract.fixed_resource_bounds;
check("fixed_resources", resources.precision_bits === 512
  && resources.origin_max_order === Math.max(...originOrders)
  && resources.maximum_origin_borel_derivative_order === 2
  && resources.maximum_gevrey_rate_exponent === 1024
  && resources.maximum_growth_polynomial_degree === 64
  && resources.maximum_tail_operator_bound_exponent === 1024
  && resources.tail_operator_bound_attempts_per_constant === 1025
  && resources.picard_inflation_attempts_per_order === 16
  && resources.continuation_max_order === Math.max(...panelOrders)
  && resources.maximum_tail_witness_onset === tailOnsets.at(-1)
  && resources.maximum_laplace_split === 2 * tailOnsets.at(-1)
  && resources.maximum_convolution_u_subpanels_per_target_panel === 65536
  && resources.maximum_convolution_u_refinement_levels === 16
  && resources.maximum_bivariate_xi_degree === resources.continuation_max_order
  && resources.tail_split_attempts === tailOnsets.length
  && resources.outer_gl_order === 6
  && resources.maximum_outer_theta_panels === outerPanels.at(-1)
  && resources.maximum_coordinate_derivative_order === 12
  && resources.parameter_jet_components_per_borel_component === 13
  && resources.maximum_grid_node_count === 256
  && resources.resource_exhaustion.startsWith("FAIL"), resources);

const gevrey = contract.gevrey_witness_producer;
check("gevrey_witness_producer", gevrey.jet_count === 13
  && gevrey.ordered_jet_components.length === 13
  && gevrey.linear_majorant_matrices.entry_normal_form.startsWith("each entry is (a2*n^2+a1*n+a0)/(n+1)")
  && gevrey.linear_majorant_matrices.matrix_majorant
    === "G_s=max_row sum_column (mag(a2)+mag(a1)+mag(a0)) for s=0,1,2; G0,G1,G2 are Gevrey majorants and the predecessor scalar-equation coefficients retain the distinct names P0,P1,P2"
  && gevrey.dyadic_rate_selector.candidates === "A=2^e in increasing e for e=0..1024"
  && gevrey.dyadic_rate_selector.predicate === "G0/A+G1/A^2+G2/A^3<=1/2"
  && gevrey.base_constant.base_indices.join(",") === "0,1,2"
  && gevrey.candidate_sampling_or_post_result_rate_change === "FAIL", gevrey);

const growthTiers = contract.growth_tiers;
check("internal_growth_tiers", JSON.stringify(growthTiers.internal_scalar_definitions) === JSON.stringify([
  "sigma0=2*mu_upper+g/8 for scalar values",
  "sigma1=2*mu_upper+3*g/8 for scalar first parameter derivatives",
  "sigma2=2*mu_upper+5*g/8 for scalar second parameter derivatives",
]) && JSON.stringify(growthTiers.definitions) === JSON.stringify([
  "tau0=2*mu_upper+2*g/8",
  "tau1=2*mu_upper+4*g/8",
  "tau2=2*mu_upper+6*g/8",
]) && growthTiers.strict_internal_gaps.length === 5
  && growthTiers.strict_laplace_margin === "delta=255-tau2=g/4>0", growthTiers);

const tailClosure = contract.tail_augmented_systems_and_growth_closure;
check("explicit_tail_systems", JSON.stringify(tailClosure.scalar_base_system.state_order)
  === JSON.stringify(["B", "V", "J1", "J2"])
  && tailClosure.scalar_base_system.matrix_rows[1]
    === "[-P0/P2,-P1/P2,-PJ1/P2,-PJ2/P2]"
  && tailClosure.scalar_base_system.asymptotic_matrix_rows[1]
    === "[-4*mu^2,4*mu,0,0]"
  && tailClosure.scalar_lyapunov_verifier.compact_box_enclosure.includes("fixed variable order u,h0,kappa,theta2")
  && tailClosure.scalar_lyapunov_verifier.operator_bound_selector.includes("e=0..1024")
  && tailClosure.scalar_lyapunov_verifier.p_norm_component_extraction.includes("abs(y_i)<=EP*norm_(P_lyap)(y)")
  && tailClosure.symbol_namespace.includes("bare wire/member name P is forbidden")
  && Object.hasOwn(tailClosure.analytic_and_scalar_derived_inputs, "BP")
  && !Object.hasOwn(tailClosure.analytic_and_scalar_derived_inputs, "P")
  && tailClosure.analytic_and_scalar_derived_inputs.component_ingress.includes("recorded EP")
  && tailClosure.analytic_and_scalar_derived_inputs.derivative_convolution_orientation.length === 5
  && tailClosure.analytic_and_scalar_derived_inputs.orientation_rule.includes("swapping operands")
  && tailClosure.analytic_and_scalar_derived_inputs.analytic_mu_parameter_jets.length === 3
  && tailClosure.analytic_and_scalar_derived_inputs.vacuum_mu_chain.includes("eta^2*X_mumu")
  && tailClosure.metric_integral_systems.equations.length === 2
  && tailClosure.metric_integral_systems.parameter_bound_selector.includes("e=0..1024")
  && tailClosure.metric_integral_systems.parameter_bounds.includes("KM0")
  && tailClosure.metric_integral_systems.output_value_constant === "CBM0=KM0*CM0+qT*CR0"
  && tailClosure.metric_integral_systems.output_second_constant
    === "CBM2=KM0*CM2+2*KM1*CM1+KM2*CM0+qT*CR2+2*KM1*CR1+KM2*CR0"
  && tailClosure.metric_integral_systems.homogeneous_rate === "rhoM=tau0/2", {
  scalar: tailClosure.scalar_base_system,
  metric: tailClosure.metric_integral_systems,
});
check("fixed_growth_absorption", tailClosure.finite_growth_bound_algebra.maximum_degree === 64
  && tailClosure.finite_growth_bound_algebra.bound_type.includes("G_a(C,d,sigma)")
  && tailClosure.finite_growth_bound_algebra.derivative_convolution_tail_split
    .startsWith("for t>=T=2*T0 split integral_0^t")
  && tailClosure.finite_growth_bound_algebra.finite_history_constants
    .includes("H_(F|sigmaG)=integral_0^T0")
  && tailClosure.finite_growth_bound_algebra.derivative_convolution
    .includes("CGprime*H_(F|sigmaG)")
  && tailClosure.finite_growth_bound_algebra.derivative_convolution
    .includes("CF*H_(Gprime|sigmaF)")
  && tailClosure.finite_growth_bound_algebra.rational_multiplier
    .includes("r=max(0,degree_t(N)-degree_t(D))")
  && tailClosure.finite_growth_bound_algebra.finite_history_panel_algorithm
    .includes("directed incomplete-gamma moments")
  && tailClosure.polynomial_to_exponential_absorption.definition
    === "Absorb(d,epsilon)=sum_(k=0)^d binom(d,k)*k!/epsilon^k"
  && tailClosure.polynomial_to_exponential_absorption.post_absorption_degree === 0
  && tailClosure.polynomial_to_exponential_absorption.free_polynomial_degree_selector === false
  && tailClosure.polynomial_degree_after_tail_verification === 0,
tailClosure.polynomial_to_exponential_absorption);

const scalarConstants = tailClosure.scalar_jet_constants;
check("onset_anchored_scalar_tail_constants", scalarConstants.boundary_norms.every((entry) => entry.includes("onset T0"))
  && scalarConstants.interval_p_norm_upper.includes("normP_upper(Y)=sqrt(qP) outward")
  && scalarConstants.definitions.includes("C0=D0*exp(-sigma0*T0)")
  && scalarConstants.definitions.includes("C2=D2*exp(-sigma2*T0)")
  && scalarConstants.proved_bounds.every((entry) => entry.includes("for t>=T0"))
  && tailClosure.metric_integral_systems.boundary_constants.startsWith("CMT0=exp(-tau0*T)"), {
  scalarConstants,
  metricBoundary: tailClosure.metric_integral_systems.boundary_constants,
});

const picard = contract.validated_picard_enclosure;
check("validated_picard_definition", picard.inflation_candidates
  === "lambda=2^j in increasing j for j=1..16"
  && picard.defect.startsWith("d(xi)=p'(xi)-F(tL+xi,p(xi))")
  && picard.correction_operator.startsWith("T(E)(xi)=integral_0^xi")
  && picard.candidate_box.includes("common symmetric radius lambda*h*Dmax")
  && picard.acceptance.includes("strict subset")
  && picard.acceptance.includes("touching")
  && picard.first_failure.split(", ").length === 8, picard);

const convolutionPanels = contract.finite_positive_ray_algorithm.derivative_convolution_panels;
check("volterra_convolution_definition", convolutionPanels.identity
  === "(F diamond G)(t)=F(t)*G(0)+t*integral_0^1 F(t*u)*G'(t*(1-u))du"
  && convolutionPanels.u_panel_candidates.every((value, index) => value === 2 ** index)
  && convolutionPanels.u_panel_candidates.at(-1) === 65536
  && convolutionPanels.polynomial_order.startsWith("rC=min(r_target,r_F,r_Gprime)")
  && convolutionPanels.remainder_cross_terms.includes("mag(PF)*RG+mag(PGprime)*RF+RF*RG")
  && convolutionPanels.selector.includes("first P candidate")
  && convolutionPanels.point_sampling_or_midpoint_convolution === "FAIL", convolutionPanels);

const glNumerator = factorial(6) ** 4n;
const glDenominator = 13n * factorial(12) ** 3n;
check("gl6_error_constant", glNumerator === 268738560000n
  && glDenominator === 1428743424166223413248000000n
  && contract.finite_laplace_projection_algorithm.outer_chebyshev_projection.order_six_error
    .includes("(6!)^4/(13*(12!)^3)"), { glNumerator: String(glNumerator), glDenominator: String(glDenominator) });

const coefficientTail = contract.finite_laplace_projection_algorithm.coefficient_tail;
check("separate_truncated_coefficient_tail", coefficientTail.separate_infinite_tail
  === "Tail8(N)=512*B_theta_12/(3*(N-1)^3) for N>=2"
  && coefficientTail.tail_proof.length === 3
  && coefficientTail.realized_weighted_norm.includes("Tail8(N)")
  && coefficientTail.state_jet_rule.includes("second-parameter")
  && coefficientTail.tail_is_not_556_total_bound === true, coefficientTail);

const endpointIngress = contract.endpoint_observable_ingress;
const endpointIndexChecks = endpointIngress.grid_node_counts.map((nodes) => {
  const first = 6 * nodes;
  const last = 7 * nodes - 1;
  return last - first + 1 === nodes && last < 8 * nodes + 2 && last < 8 * nodes + 1;
});
const chebyshevAtOne = [1n, 1n];
for (let order = 2; order <= 256; order += 1) {
  chebyshevAtOne.push(2n * chebyshevAtOne[order - 1] - chebyshevAtOne[order - 2]);
}
check("endpoint_observable_ingress", endpointIndexChecks.every(Boolean)
  && chebyshevAtOne.every((value) => value === 1n)
  && endpointIngress.finite_gradient
    === "d_h0/d_state_i=1 for 6*N<=i<7*N and 0 for every other finite flat index"
  && endpointIngress.finite_hessian
    === "d2_h0/d_state_i_d_state_j=0 for every ordered finite index pair"
  && endpointIngress.infinite_tail_operator_norm === 1
  && endpointIngress.full_banach_derivative.includes("infinite-tail norm-one contribution"), {
  endpointIndexChecks,
  chebyshevOrdersChecked: [0, 256],
  endpointIngress,
});

const wireCompatibility = contract.wire_compatibility_and_canonical_hashing;
const legacyField = wireCompatibility.legacy_field_reconciliation.formal_germ_truncation_order;
const failureCodes = wireCompatibility.c08_failure_precedence;
check("wire_and_canonical_hashing", legacyField.kind
  === "not_applicable_infinite_borel_laplace_realization"
  && legacyField.value === null
  && wireCompatibility.legacy_field_reconciliation.additive_realization_order_ledger.length === 6
  && wireCompatibility.canonical_json.encoding.includes("unpaired high or low UTF-16 surrogates")
  && wireCompatibility.canonical_json.algorithm.startsWith("RFC8785-compatible JCS")
  && wireCompatibility.canonical_json.canonical_domain === "nhm2-g2h-e-s5-a/borel-contract/v1\n"
  && failureCodes.length === 21
  && new Set(failureCodes).size === 21
  && failureCodes.every((code, index) => code.startsWith(`C08-${String(index + 1).padStart(3, "0")}_`))
  && wireCompatibility.retry_retune_deletion_alternate_root === false, wireCompatibility);

const compressed = stateJets.compressed_parameter_jet_realization;
check("compressed_parameter_inventory", compressed.integrated_inventory_per_borel_component
  .startsWith("one value, three ordered first parameter partials and nine ordered second parameter partials")
  && compressed.full_state_first_composition === "F_i=sum_(a=0)^2 F_a*theta_(a,i)"
  && compressed.full_state_second_composition.includes("sum_(b=0)^2 F_ab*theta_(a,i)*theta_(b,j)")
  && compressed.eta_rule.includes("zero state derivatives"), compressed);

const extensions = contract.required_extensions;
check("definition_cross_references", extensions.coordinate_derivative_kernel_bounds === "coordinate_derivative_laplace_kernels"
  && extensions.finite_continuation_algorithm === "finite_positive_ray_algorithm"
  && extensions.finite_quadrature_algorithm === "finite_laplace_projection_algorithm"
  && extensions.fixed_resource_bounds === "fixed_resource_bounds"
  && extensions.record_wire_fields === "record_wire_fields"
  && extensions.independent_acknowledgement === null, extensions);
check("readiness_boundary", contract.readiness.finite_continuation_defined === true
  && contract.readiness.coordinate_derivative_tails_defined === true
  && contract.readiness.finite_quadrature_defined === true
  && contract.readiness.order_selector_defined === true
  && contract.readiness.resource_bounds_defined === true
  && contract.readiness.wire_record_defined === true
  && contract.readiness.global_growth_budget_proved === false
  && contract.readiness.directed_runtime_algorithm_defined === true
  && contract.readiness.preacknowledgement_completeness_passed === true
  && contract.readiness.independently_acknowledged === false
  && contract.readiness.implementation_authorized === false
  && contract.readiness.candidate_execution_authorized === false, contract.readiness);
check("authority_false", Object.values(contract.authority).every((value) => value === false), contract.authority);
check("preacknowledgement_failure_boundary",
  contract.preacknowledgement_completeness.verdict === "FAIL_DEFINITION_UNDER_SPECIFIED"
  && contract.preacknowledgement_completeness.repair_verdict
    === "PASS_TOTAL_DEFINITION_AUDITED_PENDING_INDEPENDENT_ACKNOWLEDGEMENT"
  && contract.preacknowledgement_completeness.remaining_open_bindings.length === 0
  && contract.preacknowledgement_completeness.acknowledgement_request_withdrawn === true
  && contract.preacknowledgement_completeness.acknowledgement_occurred === false
  && Object.keys(contract.preacknowledgement_completeness.binding_closure).length === 23
  && Object.values(contract.preacknowledgement_completeness.binding_closure)
    .every((value) => value === "audited_complete"), contract.preacknowledgement_completeness);
check("no_candidate_identity_ingress", !raw(contractPath).toString("utf8").includes("6/5")
  && contract.finite_positive_ray_algorithm.candidate_result_dependent_retuning === false, "candidate-neutral definition bytes");

const protectedPaths = [
  "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
  "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
  "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
  "artifacts/nhm2/g2h-e-s5/executions",
];
const protectedState = Object.fromEntries(protectedPaths.map((path) => [path, existsSync(join(root, path))]));
check("protected_paths_absent", Object.values(protectedState).every((value) => value === false), protectedState);

const stagedPlan = raw(stagedPlanPath).toString("utf8");
const workProgram = raw(workProgramPath).toString("utf8");
check("canonical_status_reconciled", stagedPlan.includes("| A2 | Prove a global growth budget")
  && stagedPlan.includes("| complete-unsealed;")
  && stagedPlan.includes("A3 | Obtain independent parent acknowledgement")
  && stagedPlan.includes("| **active**;")
  && workProgram.includes("repaired 23 total-definition bindings"), "A2 complete-unsealed; A3 active");

const passed = checks.filter((item) => item.pass).length;
const report = {
  schema: "nhm2.g2h_e_s5.borel_growth_independent_replay.v1",
  status: passed === checks.length ? "PASS" : "FAIL",
  checks_passed: passed,
  checks_total: checks.length,
  contract_raw_sha256: sha256(raw(contractPath)),
  state_jet_raw_sha256: sha256(raw(stateJetsPath)),
  candidate_evaluations: 0,
  positive_parameter_samples: 0,
  candidate_roots_created: false,
  authorization_created: false,
  authority_promoted: false,
  independent_parent_acknowledgement: false,
  checks,
};
process.stdout.write(`${JSON.stringify(report)}\n`);
process.exit(report.status === "PASS" ? 0 : 1);
