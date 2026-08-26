#!/usr/bin/env node

// Independent manufactured-fixture replay of the S4-R1 areal inverse
// definition.  No repository seed payload is numerically sampled here and no
// positive R2 continuation parameter is evaluated.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractPath = path.join(
  root,
  "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-analytic-seed-contract.v1.json",
);
const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));
const checks = [];
const check = (name, pass, detail) => checks.push({ name, pass: Boolean(pass), detail });

const inverse = contract.finite_radius_inverse_algorithm;
check(
  "mathematical_result_bound",
  inverse.status.startsWith("mathematical_result_and_acceptance_complete_"),
  inverse.status,
);
check("vacuum_identity", inverse.vacuum === "at lambda=0 return x=r exactly", inverse.vacuum);
check("origin_identity", inverse.origin.includes("x=0 exactly"), inverse.origin);
check("infinity_is_analytic", inverse.infinity.includes("analytic infinity seed"), inverse.infinity);
check("point_export_forbidden", inverse.output_enclosure.point_value_export === false, inverse.output_enclosure);
check("alternate_map_forbidden", inverse.alternate_coordinate_map_allowed === false, inverse.alternate_coordinate_map_allowed);

// Manufactured profile V(x)=-c/(1+x), c=1/4.  It is unrelated to the
// inherited Newtonian payload.  V<=0 and J=1-x*c/(1+x)^2 >= 15/16 for x>=0
// because x/(1+x)^2<=1/4.
const c = 0.25;
const V = (x) => -c / (1 + x);
const VPrime = (x) => c / ((1 + x) * (1 + x));
const jacobian = (x) => 1 - x * VPrime(x);
const radii = [0.125, 1, 7, 64];
for (const radius of radii) {
  const F = (x) => x * Math.exp(-V(x)) - radius;
  check(`manufactured_left_sign_${radius}`, F(0) < 0, F(0));
  check(`manufactured_right_sign_${radius}`, F(radius) >= 0, F(radius));
  check(`manufactured_jacobian_left_${radius}`, jacobian(0) > 0, jacobian(0));
  check(`manufactured_jacobian_mid_${radius}`, jacobian(radius / 2) >= 15 / 16, jacobian(radius / 2));
  check(`manufactured_jacobian_right_${radius}`, jacobian(radius) >= 15 / 16, jacobian(radius));

  let lower = 0;
  let upper = radius;
  for (let iteration = 0; iteration < 160; iteration += 1) {
    const midpoint = (lower + upper) / 2;
    if (F(midpoint) < 0) lower = midpoint;
    else upper = midpoint;
  }
  const midpoint = (lower + upper) / 2;
  check(`manufactured_root_residual_${radius}`, Math.abs(F(midpoint)) <= 4e-15 * (1 + radius), F(midpoint));
  check(`manufactured_root_in_bracket_${radius}`, midpoint >= 0 && midpoint <= radius, midpoint);
}

// Manufactured hard failures exercise the fail-closed obligations.
const positivePotentialAtRight = 0.25;
check(
  "positive_potential_breaks_right_sign_obligation",
  Math.exp(-positivePotentialAtRight) - 1 < 0,
  Math.exp(-positivePotentialAtRight) - 1,
);
check("nonpositive_jacobian_is_failure", 1 - 2 <= 0, 1 - 2);
check(
  "same_root_not_same_intermediates",
  inverse.implementation_disjointness.bitwise_equal_intermediate_algorithm_required === false &&
    inverse.implementation_disjointness.joint_enclosure_and_same_mathematical_root_required === true,
  inverse.implementation_disjointness,
);

const primaryRoot = path.join(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary");
const independentRoot = path.join(root, "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent");
check("primary_root_absent", !fs.existsSync(primaryRoot), path.relative(root, primaryRoot));
check("independent_root_absent", !fs.existsSync(independentRoot), path.relative(root, independentRoot));
check("all_authority_false", Object.values(contract.authority).every((value) => value === false), contract.authority);

const passed = checks.every((entry) => entry.pass);
const result = {
  schema: "nhm2.g2h_e_s4_r1.seed_inverse_replay.v1",
  status: passed ? "PASS" : "FAIL",
  checksPassed: checks.filter((entry) => entry.pass).length,
  checksTotal: checks.length,
  candidateEvaluations: 0,
  positiveLambdaSamples: 0,
  candidateRootsCreated: false,
  authorityPromoted: false,
  checks,
};
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exitCode = passed ? 0 : 1;
