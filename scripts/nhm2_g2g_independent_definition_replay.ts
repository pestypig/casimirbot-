#!/usr/bin/env tsx
/** Producer-independent, definition-only replay of the frozen G2G contract. */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type Fraction = { n: bigint; d: bigint };
type Contract = Record<string, any>;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT_PATH = join(ROOT, "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json");
const SIDECAR_PATH = join(ROOT, "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.sha256");

function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) [x, y] = [y, x % y];
  return x;
}

function f(n: bigint, d = 1n): Fraction {
  if (d === 0n) throw new Error("zero denominator");
  const sign = d < 0n ? -1n : 1n;
  const divisor = gcd(n, d);
  return { n: (sign * n) / divisor, d: (sign * d) / divisor };
}

function add(a: Fraction, b: Fraction): Fraction {
  return f(a.n * b.d + b.n * a.d, a.d * b.d);
}

function mul(a: Fraction, b: Fraction): Fraction {
  return f(a.n * b.n, a.d * b.d);
}

function eq(a: Fraction, b: Fraction): boolean {
  return a.n === b.n && a.d === b.d;
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function admissible(p: Contract): boolean {
  return p.scientific_identity === "G2F_TOLMAN_VII_NATURAL_BETA_1_5_SCALAR_HADAMARD_V1"
    && p.frozen_member?.mu === "1"
    && p.frozen_member?.compactness_C_equals_M_over_R === "1/5"
    && p.authority?.candidate_evaluations === 0
    && Object.entries(p.authority ?? {}).every(([key, value]) => key === "candidate_evaluations" || value === false)
    && p.future_proof_program?.implementation_authorized === false
    && p.future_proof_program?.candidate_execution_authorized === false
    && p.sources?.length === 7
    && p.proof_partitions?.adaptive_subdivision === "forbidden";
}

const raw = readFileSync(CONTRACT_PATH);
const payload: Contract = JSON.parse(raw.toString("utf8"));
const frozenCopy = raw.toString("hex");
const sidecar = readFileSync(SIDECAR_PATH, "ascii").trim().split(/\s+/)[0];

// Independent reconstruction: beta_N=1 => C=beta_N^2/5, then integrate RHO.
const betaN = f(1n);
const C = mul(mul(betaN, betaN), f(1n, 5n));
const rho0 = mul(f(15n), C);
const u3 = mul(rho0, f(1n, 6n));
const u5 = mul(rho0, f(-1n, 10n));
const z2 = mul(f(-2n), u3);
const z4 = mul(f(-2n), u5);
const surfaceU = add(u3, u5);
const surfaceZ = add(add(f(1n), z2), z4);
const yMin = f(5n, 6n);
const zMin = add(add(f(1n), mul(f(-1n), yMin)), mul(f(3n, 5n), mul(yMin, yMin)));

const mutate = (change: (copy: Contract) => void): Contract => {
  const copy = JSON.parse(JSON.stringify(payload));
  change(copy);
  return copy;
};

const checks: Record<string, boolean> = {
  contract_digest: sha256(raw) === sidecar,
  frozen_contract_admissible: admissible(payload),
  independent_compactness: eq(C, f(1n, 5n)),
  independent_density_normalization: eq(rho0, f(3n)),
  independent_mass_polynomial: eq(u3, f(1n, 2n)) && eq(u5, f(-3n, 10n)),
  independent_surface: eq(surfaceU, f(1n, 5n)) && eq(surfaceZ, f(3n, 5n)),
  independent_horizon_minimum: eq(zMin, f(7n, 12n)),
  exact_duty_counts: payload.classical_proof_duties.length === 12 && payload.quantum_proof_duties.length === 6,
  state_mean_noise_identity: payload.quantum_control.state.includes("ground state")
    && payload.renormalization_definition.hadamard_length === "ell_H=R"
    && payload.renormalization_definition.source_normalization.startsWith("alpha_4=1/(4*pi^2)")
    && payload.renormalization_definition.v1 === "v1=(1/8)*m_phi^4-(1/24)*m_phi^2*R_scalar+(1/120)*Box*R_scalar+(1/288)*R_scalar^2-(1/720)*R_ab*R^ab+(1/720)*R_abcd*R^abcd"
    && payload.renormalization_definition.mean_stress.startsWith("<T_ab>_ren=(1/(8*pi^2))*(lim_x'_to_x T_ab'[W_H]+2*g_ab*v1)")
    && JSON.stringify(payload.renormalization_definition.finite_ambiguity_coefficients) === JSON.stringify(["0", "0", "0", "0"])
    && payload.connected_noise_definition.renormalization.includes("same Hadamard/OPE"),
  runtime_disjointness: payload.future_proof_program.primary.runtime_lineage.includes("Arb/FLINT/GMP/MPFR")
    && payload.future_proof_program.independent.runtime_lineage.includes("no GMP, MPFR, FLINT, Arb"),
  toolchain_chronology_constructible: payload.future_proof_program.toolchain_pin_rule
    === "source, compiler, dependency and container digests must be frozen in G2H before either implementation is built; each reproducibly built executable digest must then be captured and frozen before that executable or any candidate-capable path is run",
  future_roots_absent: !existsSync(join(ROOT, payload.future_roots.primary)) && !existsSync(join(ROOT, payload.future_roots.independent)),
  identity_mutation_rejected: !admissible(mutate((p) => { p.scientific_identity = "G2D_REBRAND"; })),
  member_mutation_rejected: !admissible(mutate((p) => { p.frozen_member.compactness_C_equals_M_over_R = "1/4"; })),
  authority_mutation_rejected: !admissible(mutate((p) => { p.authority.candidate_admitted = true; })),
  evaluation_mutation_rejected: !admissible(mutate((p) => { p.authority.candidate_evaluations = 1; })),
  source_inventory_mutation_rejected: !admissible(mutate((p) => { p.sources.pop(); })),
  adaptive_partition_mutation_rejected: !admissible(mutate((p) => { p.proof_partitions.adaptive_subdivision = "allowed"; })),
  input_bytes_unchanged: readFileSync(CONTRACT_PATH).toString("hex") === frozenCopy,
};

const result = {
  schema: "nhm2.g2g.independent_definition_replay.v1",
  checks,
  exactRouteResult: { C: "1/5", RHO: "3*(1-x^2)", u: "(5*x^3-3*x^5)/10", Z: "1-x^2+3*x^4/5", ZMin: "7/12" },
  candidateEvaluations: 0,
};

process.stdout.write(`${JSON.stringify(result)}\n`);
process.exit(Object.values(checks).every(Boolean) ? 0 : 1);
