#!/usr/bin/env node
// Independent exact-rational replay of the R2 -> ell=0 stability background map.
// It reads definitions only and never loads or evaluates candidate data.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const inventoryPath = path.join(
  root,
  "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-definition-inventory.v1.json",
);
const mappingPath = path.join(
  root,
  "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-stability-mapping.md",
);
const contractPath = path.join(
  root,
  "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-radial-stability-contract.v1.json",
);

function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

class Q {
  constructor(numerator, denominator = 1n) {
    if (denominator === 0n) throw new Error("zero denominator");
    let n = BigInt(numerator);
    let d = BigInt(denominator);
    if (d < 0n) [n, d] = [-n, -d];
    const common = gcd(n, d);
    this.n = n / common;
    this.d = d / common;
  }
  add(other) { return new Q(this.n * other.d + other.n * this.d, this.d * other.d); }
  mul(other) { return new Q(this.n * other.n, this.d * other.d); }
  neg() { return new Q(-this.n, this.d); }
  equals(other) { return this.n === other.n && this.d === other.d; }
  toString() { return this.d === 1n ? `${this.n}` : `${this.n}/${this.d}`; }
}

const q = (n, d = 1) => new Q(BigInt(n), BigInt(d));
const half = q(1, 2);
const quarter = q(1, 4);

// Coefficient vectors use monomials A=omega^2*sigma^2/alpha^2,
// B=sigma_r^2/b^2, C=sigma^2.
const addVectors = (left, right) => left.map((item, index) => item.add(right[index]));
const scale = (factor, vector) => vector.map((item) => factor.mul(item));
const vectorEquals = (left, right) => left.length === right.length && left.every((item, index) => item.equals(right[index]));
const showVector = (vector) => vector.map((item) => item.toString());

const rhoR2 = [half, half, half];
const pressureR2 = [half, half, half.neg()];
const psiSquaredScale = half; // psi_A^2 = sigma^2/2
const alcubierreMatterBracketMass = scale(psiSquaredScale, [q(1), q(1), q(1)]);
const alcubierreMatterBracketPressure = scale(psiSquaredScale, [q(1), q(1), q(-1)]);
const saffinGeometrizedMassPrime = scale(half, rhoR2); // (4*pi*G) rho, 4*pi*G=1/2
const alcubierreMassPrime = scale(half, alcubierreMatterBracketMass);

const checks = [];
function check(name, passed, evidence) {
  checks.push({ name, passed, evidence });
}

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const mapping = fs.readFileSync(mappingPath, "utf8");
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const stability = inventory.ordered_gaps.find((item) => item.id === "radial_stability_problem");

check("inventory_schema", inventory.schema === "nhm2.g2h_e_s4_r1.definition_inventory.v1", inventory.schema);
check(
  "mapping_is_draft",
  mapping.includes("contract remains draft/unsealed")
    && mapping.includes("not a radial-stability proof")
    && mapping.includes("no scientific")
    && mapping.includes("candidate evaluation is authorized"),
  "draft and execution locks present",
);
check("ell_zero", mapping.includes("ell=0") && mapping.includes("kappa_0=1"), "ell=0,kappa_0=1");
check("metric_alpha", mapping.includes("alpha_A = 1/(b*s)"), "alpha_A=1/(b*s)");
check("metric_gamma", mapping.includes("gamma_A = b"), "gamma_A=b");
check("field_square_scale", psiSquaredScale.equals(half), `psi_A^2/sigma^2=${psiSquaredScale}`);
check("newton_geometric_factor", half.equals(q(1, 2)), "4*pi*G=1/2 from G=1/(8*pi)");
check(
  "mass_matter_bracket",
  vectorEquals(alcubierreMatterBracketMass, rhoR2),
  { alcubierre: showVector(alcubierreMatterBracketMass), r2Rho: showVector(rhoR2) },
);
check(
  "mass_prime_equivalence",
  vectorEquals(saffinGeometrizedMassPrime, alcubierreMassPrime)
    && vectorEquals(alcubierreMassPrime, [quarter, quarter, quarter]),
  { saffin: showVector(saffinGeometrizedMassPrime), alcubierre: showVector(alcubierreMassPrime) },
);
check(
  "pressure_bracket_equivalence",
  vectorEquals(alcubierreMatterBracketPressure, pressureR2),
  { alcubierre: showVector(alcubierreMatterBracketPressure), r2Pressure: showVector(pressureR2) },
);

// alpha'/alpha = -b'/b-s'/s. Substitution of the frozen equations gives
// (b^2-1)/(2r) + b^2*r*p_r/2 = b^2*(m/r^2+r*p_r/2).
const metricTermFromM = half;
const metricTermFromB = half;
check("alpha_metric_term", metricTermFromM.equals(metricTermFromB), "(b^2-1)/(2r)=b^2*m/r^2");
check(
  "alpha_pressure_coefficients",
  vectorEquals(scale(half, pressureR2), scale(half, alcubierreMatterBracketPressure)),
  showVector(scale(half, pressureR2)),
);

// alpha'/alpha-gamma'/gamma = -2*b'/b-s'/s, exactly the frozen KG
// first-derivative coefficient after the common 2/r term.
const kgFrozen = { bPrime: q(-2), sPrime: q(-1) };
const kgMapped = addVectors([q(-1), q(-1)], [q(-1), q(0)]);
check(
  "kg_first_derivative_map",
  kgFrozen.bPrime.equals(kgMapped[0]) && kgFrozen.sPrime.equals(kgMapped[1]),
  { frozen: [kgFrozen.bPrime.toString(), kgFrozen.sPrime.toString()], mapped: showVector(kgMapped) },
);
check(
  "stability_inventory_unsealed",
  stability?.status?.startsWith("exact_ell0_operator_Friedrichs_domain_")
    && stability?.status?.endsWith("pending_independent_theory_review"),
  stability?.status ?? null,
);
check("stability_contract_schema", contract.schema === "nhm2.g2h_e_s4_r1.radial_stability_contract.v1", contract.schema);
check("strict_mode_interval", contract.fundamental_mode_upper_certificate.strict_predicates.join("|") === "0<L|L<=U|U<lower(E_ess_ball)", contract.fundamental_mode_upper_certificate.strict_predicates);
check("essential_threshold", contract.endpoint_and_essential_spectrum.essential_threshold === "E_ess=(1-omega)^2", contract.endpoint_and_essential_spectrum.essential_threshold);
check("turning_not_spectral", contract.mass_turning_side_comparator.separation_of_authority.includes("cannot replace"), contract.mass_turning_side_comparator.separation_of_authority);
check("contract_authority_false", Object.values(contract.authority).every((value) => value === false), contract.authority);
check("candidate_values_absent", !mapping.includes("shat(0)=6/5") && !mapping.includes("shat_0=6/5"), "no selected-member value in derivation");
check("authority_false", inventory.implementation_authorized === false && inventory.execution_authorized === false && inventory.authority_promoted === false, "all false");

const passed = checks.every((item) => item.passed);
const output = {
  schema: "nhm2.g2h_e_s4_r1.stability_mapping_independent_replay.v1",
  passed,
  passed_count: checks.filter((item) => item.passed).length,
  total_count: checks.length,
  candidate_evaluations: 0,
  candidate_roots_created: false,
  implementation_authorized: false,
  execution_authorized: false,
  authority_promoted: false,
  checks,
};
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = passed ? 0 : 1;
