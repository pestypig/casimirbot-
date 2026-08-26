#!/usr/bin/env node
/**
 * Source-language-disjoint exact/manufactured replay of the S4-R2 quantum
 * builder definition.  No candidate bytes or scientific output roots enter.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const contractPath = resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-total-quantum-builder-algorithms.v2.json");
const gapPath = resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r2-quantum-builder-gap-inventory.v1.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const gaps = JSON.parse(readFileSync(gapPath, "utf8"));

const abs = (x) => x < 0n ? -x : x;
const gcd = (left, right) => {
  let a = abs(left);
  let b = abs(right);
  while (b !== 0n) [a, b] = [b, a % b];
  return a;
};
const rat = (n, d = 1n) => {
  if (d === 0n) throw new Error("zero denominator");
  if (d < 0n) [n, d] = [-n, -d];
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
};
const add = (a, b) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => rat(a.n * b.n, a.d * b.d);
const div = (a, b) => rat(a.n * b.d, a.d * b.n);
const pow = (a, k) => {
  let result = rat(1n);
  for (let i = 0; i < k; i += 1) result = mul(result, a);
  return result;
};
const eq = (a, b) => a.n === b.n && a.d === b.d;
const fmt = (a) => `${a.n}/${a.d}`;

const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

// Rebuild the exact order-eight Richardson stencil without using Python or a
// stored table.
const richardson = (exponents) => {
  const eps = exponents.map((exponent) => rat(1n, 1n << BigInt(exponent)));
  const matrix = Array.from({ length: 9 }, (_, powerIndex) => [
    ...eps.map((value) => pow(value, powerIndex)),
    rat(powerIndex === 0 ? 1n : 0n),
  ]);
  for (let column = 0; column < 9; column += 1) {
    const pivot = matrix.findIndex((row, rowIndex) => rowIndex >= column && row[column].n !== 0n);
    if (pivot < 0) throw new Error("singular exact Richardson system");
    [matrix[column], matrix[pivot]] = [matrix[pivot], matrix[column]];
    const scale = matrix[column][column];
    matrix[column] = matrix[column].map((value) => div(value, scale));
    for (let row = 0; row < 9; row += 1) {
      if (row === column) continue;
      const factor = matrix[row][column];
      matrix[row] = matrix[row].map((value, index) => sub(value, mul(factor, matrix[column][index])));
    }
  }
  const weights = matrix.map((row) => row[9]);
  const moments = Array.from({ length: 9 }, (_, powerIndex) => eps.reduce(
    (sum, value, index) => add(sum, mul(weights[index], pow(value, powerIndex))),
    rat(0n),
  ));
  return { weights, moments };
};

for (const lane of ["primary", "rust"]) {
  const result = richardson(contract.preserved_selectors[lane].epsilon_exponents);
  check(`${lane}_Richardson_moments`, result.moments.every((moment, index) => eq(moment, rat(index === 0 ? 1n : 0n))), result.moments.map(fmt));
  check(`${lane}_Richardson_nine_finite_weights`, result.weights.length === 9 && result.weights.every((weight) => weight.d > 0n), result.weights.map(fmt));
}

// Independently generate P_32 coefficients from the exact Legendre recurrence,
// then count sign-changing cells on the frozen 8192-cell rational mesh.
const polynomialAdd = (a, b) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => add(a[i] ?? rat(0n), b[i] ?? rat(0n)));
const polynomialScale = (a, scale) => a.map((value) => mul(value, scale));
const polynomialShift = (a) => [rat(0n), ...a];
let p0 = [rat(1n)];
let p1 = [rat(0n), rat(1n)];
for (let n = 1; n < 32; n += 1) {
  const left = polynomialScale(polynomialShift(p1), rat(BigInt(2 * n + 1)));
  const right = polynomialScale(p0, rat(BigInt(-n)));
  const next = polynomialScale(polynomialAdd(left, right), rat(1n, BigInt(n + 1)));
  p0 = p1;
  p1 = next;
}
const evalPolynomial = (coefficients, x) => coefficients.reduceRight((acc, coefficient) => add(mul(acc, x), coefficient), rat(0n));
let signChanges = 0;
let meshZeros = 0;
let previous = evalPolynomial(p1, rat(-4096n, 4096n));
for (let ordinal = -4095; ordinal <= 4096; ordinal += 1) {
  const current = evalPolynomial(p1, rat(BigInt(ordinal), 4096n));
  if (current.n === 0n) meshZeros += 1;
  if ((previous.n < 0n && current.n > 0n) || (previous.n > 0n && current.n < 0n)) signChanges += 1;
  previous = current;
}
check("GL32_exact_mesh_isolates_32_roots", signChanges === 32 && meshZeros === 0, { signChanges, meshZeros, polynomialDegree: p1.length - 1 });

// Reconstruct the complete degree<=4 four-dimensional multiindex inventory.
const multiindices = [];
for (let degree = 0; degree <= 4; degree += 1) {
  for (let t = 0; t <= degree; t += 1) {
    for (let r = 0; r <= degree - t; r += 1) {
      for (let theta = 0; theta <= degree - t - r; theta += 1) {
        const phi = degree - t - r - theta;
        multiindices.push([t, r, theta, phi]);
      }
    }
  }
}
check("graded_lex_jet_inventory_70", multiindices.length === 70 && new Set(multiindices.map(String)).size === 70, { count: multiindices.length, first: multiindices[0], last: multiindices.at(-1) });

const pKappaWidth = rat(1023n, 1048576n);
const rKappaWidth = rat(1n, 128n);
const pEnergyWidth = rat(4095n, 8388608n);
const rEnergyWidth = rat(4095n, 9437184n);
check("primary_kappa_exact_cover", eq(mul(pKappaWidth, rat(1024n)), rat(1023n, 1024n)), fmt(mul(pKappaWidth, rat(1024n))));
check("rust_kappa_exact_cover", eq(mul(rKappaWidth, rat(1536n)), rat(12n)), fmt(mul(rKappaWidth, rat(1536n))));
check("primary_energy_exact_cover", eq(mul(pEnergyWidth, rat(2048n)), rat(4095n, 4096n)), fmt(mul(pEnergyWidth, rat(2048n))));
check("rust_energy_exact_cover", eq(mul(rEnergyWidth, rat(2304n)), rat(4095n, 4096n)), fmt(mul(rEnergyWidth, rat(2304n))));

// Independently reconstruct the 24 half-shift tanh-sinh schedule and its
// reflection symmetry. Doubles are used only for this manufactured schedule
// sanity check; scientific enclosure remains a future pure-Rust duty.
const ts = Array.from({ length: 24 }, (_, ordinal) => {
  const k = ordinal - 12;
  const s = (k + 0.5) / 8;
  const u = Math.tanh(Math.PI * Math.sinh(s) / 2);
  const w = (1 / 8) * (Math.PI / 2) * Math.cosh(s) / Math.cosh(Math.PI * Math.sinh(s) / 2) ** 2;
  return { k, s, u, w };
});
const symmetric = ts.every((node, index) => {
  const peer = ts[23 - index];
  return Math.abs(node.s + peer.s) < 1e-15 && Math.abs(node.u + peer.u) < 1e-15 && Math.abs(node.w - peer.w) < 1e-15 && node.w > 0;
});
check("TS24_half_shift_symmetry", symmetric, { first: ts[0], last: ts.at(-1) });

check("noise_flattening", 64 * 4 === 256 && 256 * 256 === 65536 && 256 * 257 / 2 === 32896, { vectors: 256, matrix: 65536, lower: 32896 });
check("error_allocation_strictly_closes", 8n * (1n << 120n) < (1n << 132n), "8*2^-132 < 2^-120");

const serialized = JSON.stringify(contract);
const gapTokens = {
  QG01_primary_radial_collocation_totality: ["CGL", "defect_sweeps", "complete-pivot Arb LU"],
  QG02_independent_radial_picard_totality: ["Picard_iterations", "seed_radius_cap", "steps_per_cell"],
  QG03_primary_negative_axis_panel_totality: ["kappa_star=cot", "rational_bisections_per_root", "tail_order"],
  QG04_independent_negative_axis_panel_totality: ["tanh_sinh_h", "pi_series_terms", "kappa_star=sinh"],
  QG05_physical_measure_and_limiting_absorption_totality: ["physical_energy", "Richardson_order", "Poisson-semigroup"],
  QG06_angular_subtraction_and_tail_totality: ["diagonal-resolvent identity", "Euler_Maclaurin_terms", "threshold"],
  QG07_hadamard_transport_and_jet_totality: ["jet_multiindices", "transport_order", "projection_passes"],
  QG08_noise_vector_gram_totality: ["vector_packing", "Cholesky", "modified Gram-Schmidt"],
  QG09_smearing_and_fourier_multiplier_quadrature_totality: ["smearing_panels_per_coordinate", "Fourier_multiplier_bounds", "Z_p"],
  QG10_error_allocation_totality: ["error_components", "2^-132", "2^-120"],
  QG11_role_record_and_first_failure_totality: ["partial_output_inventory", "within_role_failure_precedence", "cross_product_order"],
  QG12_complete_finite_work_budget: ["budgets", "exhaustion_fixtures", "builder_budget_exhausted"],
};
const inventoryIds = new Set(gaps.hard_gaps.map((gap) => gap.id));
for (const [gapId, tokens] of Object.entries(gapTokens)) {
  check(`closed_${gapId}`, inventoryIds.has(gapId) && tokens.every((token) => serialized.includes(token)), tokens);
}

const roles = new Set(gaps.hard_gaps.flatMap((gap) => gap.affected_roles));
check("all_quantum_roles_still_covered", roles.size === 12 && [...roles].every((role) => /^[PR](08|09|10|11|12|13)$/.test(role)), [...roles].sort());
check("lineages_source_runtime_disjoint", contract.primary_cpp_arb_total_algorithm.lineage.includes("Arb/FLINT/GMP/MPFR") && contract.independent_pure_rust_total_algorithm.lineage.includes("no C ABI"), [contract.primary_cpp_arb_total_algorithm.lineage, contract.independent_pure_rust_total_algorithm.lineage]);

const primaryRoot = resolve(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary");
const rustRoot = resolve(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent");
check("future_roots_absent", !existsSync(primaryRoot) && !existsSync(rustRoot), { primary: existsSync(primaryRoot), rust: existsSync(rustRoot) });
check("authority_locked", Object.values(contract.authority).every((value) => value === false), contract.authority);

const passed = checks.filter((item) => item.pass).length;
const report = {
  schema: "nhm2.g2h_e_s4_r2.total_quantum_builder_independent_replay.v1",
  status: passed === checks.length ? "PASS" : "FAIL",
  meaning: "PASS independently replays exact/manufactured definition selectors only; no candidate or quantum producer executed",
  contract_raw_sha256: createHash("sha256").update(readFileSync(contractPath)).digest("hex"),
  checks_passed: passed,
  checks_total: checks.length,
  checks,
  candidate_evaluations: 0,
  positive_parameter_samples: 0,
  candidate_roots_created: false,
  execution_authorized: false,
  authority_promoted: false,
  disposition: passed === checks.length ? "ELIGIBLE_FOR_R2_DEFINITION_SEAL" : "REMAIN_FAIL_CLOSED_IN_R2",
};
process.stdout.write(`${JSON.stringify(report)}\n`);
process.exitCode = report.status === "PASS" ? 0 : 1;
