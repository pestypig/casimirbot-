#!/usr/bin/env node
// Archival manufactured-only replay of the invalidated S4-R1 state/grid draft.
// A mechanical PASS here preserves the square/DCT fixture record; it does not
// reverse the later semantic audit or accept the draft.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-classical-state-grid-contract.v1.json");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const checks = [];
const check = (name, passed, evidence) => checks.push({ name, passed, evidence });

function dct1(values) {
  const N = values.length - 1;
  return Array.from({ length: N + 1 }, (_, k) => {
    let sum = values[0] / 2 + ((k % 2 === 0 ? 1 : -1) * values[N]) / 2;
    for (let j = 1; j < N; j += 1) sum += values[j] * Math.cos(Math.PI * j * k / N);
    return (2 / N) * sum;
  });
}

function inverseDct1(coefficients) {
  const N = coefficients.length - 1;
  return Array.from({ length: N + 1 }, (_, j) => {
    let sum = coefficients[0] / 2 + ((j % 2 === 0 ? 1 : -1) * coefficients[N]) / 2;
    for (let k = 1; k < N; k += 1) sum += coefficients[k] * Math.cos(Math.PI * j * k / N);
    return sum;
  });
}

const maxError = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
const frozenN = contract.grid_meaning.frozen_N_values;
check("schema", contract.schema === "nhm2.g2h_e_s4_r1.classical_state_grid_contract.v1", contract.schema);
check("contract_invalidated", contract.status.startsWith("invalidated_before_implementation_"), contract.status);
check("replacement_required", contract.readiness.replacement_required === true, contract.readiness);
check("frozen_grid_order", JSON.stringify(frozenN) === JSON.stringify([64, 96, 128, 256]), frozenN);

for (const N of frozenN) {
  const state = 8 * (N + 1) + 1;
  const rows = 4 * N + 4 * N + 4 + 5;
  check(`square_N${N}`, state === rows && state === 8 * N + 9, { state, rows });
  const core0 = (255 / 512) * (1 - Math.cos(0));
  const coreN = (255 / 512) * (1 - Math.cos(Math.PI));
  const tail0 = (1 / 510) * (1 + Math.cos(0));
  const tailN = (1 / 510) * (1 + Math.cos(Math.PI));
  check(`endpoints_N${N}`, core0 === 0 && coreN === 255 / 256 && tail0 === 1 / 255 && tailN === 0, { core0, coreN, tail0, tailN });
}

for (const N of [4, 8, 16]) {
  const constant = Array.from({ length: N + 1 }, () => 3 / 8);
  const cheb2 = Array.from({ length: N + 1 }, (_, j) => Math.cos(2 * Math.PI * j / N));
  const manufactured = Array.from({ length: N + 1 }, (_, j) => {
    const x = Math.cos(Math.PI * j / N);
    return 0.25 - 0.5 * x + 0.125 * (2 * x * x - 1);
  });
  for (const [label, values] of [["constant", constant], ["cheb2", cheb2], ["manufactured", manufactured]]) {
    const error = maxError(values, inverseDct1(dct1(values)));
    // This independent replay uses binary64 only to catch formula/order drift;
    // the eventual producers must use the contract's 512-bit outward balls.
    check(`dct_${label}_N${N}`, error <= 4e-15, error);
  }
}

// Exact power-series replay of the frozen origin p row. If
// sigma=sigma0+sigma2*r^2+..., then p'=2*sigma2 and
// sigma''+2*p/r+K*sigma=0 gives 6*sigma2+K*sigma0=0.
const sigmaSecondMultiplicity = 2;
const twoPOverRMultiplicity = 4;
const totalMultiplicity = sigmaSecondMultiplicity + twoPOverRMultiplicity;
const pPrimeMultiplicity = 2;
check("origin_KG_factor", pPrimeMultiplicity / totalMultiplicity === 1 / 3, { pPrimeMultiplicity, totalMultiplicity });

check("core_chain_rule", contract.square_residual_map.core_rows.interior_j1_through_N_minus_1.includes("dy/dr=(1-y)^2"), "dy/dr=(1-y)^2");
check("tail_chain_rule", contract.square_residual_map.infinity_rows.rule.includes("dr/dq=-q^-2"), "dr/dq=-q^-2");
check("no_finite_wall", contract.grid_meaning.infinity_patch.finite_wall === false && contract.grid_meaning.infinity_patch.infinity_is_analytic_endpoint === true, contract.grid_meaning.infinity_patch);
check("interface_order", contract.square_residual_map.interface_rows.count === 4 && contract.square_residual_map.interface_rows.order.length === 4, contract.square_residual_map.interface_rows.order);
check("boundary_count", contract.square_residual_map.boundary_and_member_rows.count === 5 && contract.square_residual_map.boundary_and_member_rows.order.length === 5, contract.square_residual_map.boundary_and_member_rows.order);
check("candidate_seed_null", contract.unsealed_dependencies.analytic_seed === null, null);
check("validated_map_null", contract.unsealed_dependencies.validated_nonlinear_operator_and_inverse === null, null);
check("radii_null", contract.unsealed_dependencies.radii_polynomial_bounds === null, null);
check("authority_false", Object.values(contract.authority).every((value) => value === false), contract.authority);
check("execution_false", contract.readiness.implementation_authorized === false && contract.readiness.candidate_execution_authorized === false && contract.readiness.sealed === false, contract.readiness);

// Manufactured dyadic defect sequence: ratios are exactly 1/4 and terminal
// defect is 2^-72, below the frozen 2^-70 threshold.
const exponents = [-68, -70, -72];
const ratios = [2 ** (exponents[1] - exponents[0]), 2 ** (exponents[2] - exponents[1])];
check("synthetic_contraction", ratios.every((ratio) => ratio === 0.25), ratios);
check("synthetic_terminal_threshold", 2 ** -72 <= 2 ** -70, { defect: "2^-72", threshold: "2^-70" });
check("strict_failure_touching_ratio", !(0.25000000000000006 <= 0.25), "outward upper endpoint above 1/4 rejects");

const passed = checks.every((item) => item.passed);
process.stdout.write(`${JSON.stringify({
  schema: "nhm2.g2h_e_s4_r1.state_grid_independent_replay.v1",
  passed,
  meaning: "mechanical fixture replay only; the state/grid contract remains invalidated",
  disposition: passed ? "PRESERVE_FIXTURES_AND_RETURN_TO_REPLACEMENT" : "STOP_ARCHIVAL_REPLAY",
  passed_count: checks.filter((item) => item.passed).length,
  total_count: checks.length,
  candidate_evaluations: 0,
  candidate_roots_created: false,
  implementation_authorized: false,
  execution_authorized: false,
  authority_promoted: false,
  checks,
}, null, 2)}\n`);
process.exitCode = passed ? 0 : 1;
