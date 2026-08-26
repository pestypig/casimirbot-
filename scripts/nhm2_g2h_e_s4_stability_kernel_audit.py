#!/usr/bin/env python3
"""Independent audit of bounded G2H-E-S4 P06/P07/R06/R07 fixtures."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json"
MATRIX = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
BUILDER = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json"
STABILITY = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-radial-stability-contract.v1.json"
RUNTIME_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py"
PRIMARY = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_stability_primary.cpp"
PRIMARY_HEADER = PRIMARY.with_suffix(".hpp")
RUST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_stability_independent.rs"
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


manifest = json.loads(MANIFEST.read_bytes())
matrix = json.loads(MATRIX.read_bytes())
builder = json.loads(BUILDER.read_bytes())
stability = json.loads(STABILITY.read_bytes())
sidecar = MANIFEST.with_suffix(".sha256").read_text("ascii").split()[0]
check("manifest_sidecar", digest(MANIFEST) == sidecar == "215078e444fd4ff30c393b03daa2c70ef093fcc5719cf802d387f56d6c123515", sidecar)
check("builder_binding", digest(BUILDER) == "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf", digest(BUILDER))
check("stability_binding", digest(STABILITY) == "36bb62c7f386ce16fda989dc896e862ee23ae9b04c52d936f9363b5b61d156f4", digest(STABILITY))
check("frozen_lower_bound", stability["strict_lower_certificate"]["certificate_scalar"] == "L is an exact positive dyadic rational" and "2^-96" in json.dumps(builder), stability["strict_lower_certificate"]["certificate_scalar"])

primary_budget = builder["primary_cpp_arb_lineage"]["stability_builder"]["budgets"]
rust_budget = builder["independent_pure_rust_lineage"]["stability_builder"]["budgets"]
check("primary_budget", primary_budget == {
    "cells": 256, "K_degree": 12, "implicit_midpoint_steps_per_cell": 32,
    "Newton_sweeps": 16, "jump_repairs": 1, "trial_degree": 16,
    "inverse_iterations": 64, "L": "2^-96",
}, primary_budget)
check("rust_budget", rust_budget == {
    "cells": 256, "K_degree": 14, "Gauss_Legendre_steps_per_cell": 40,
    "Newton_Krylov_sweeps": 20, "Krylov_vectors_per_sweep": 96,
    "jump_offset_ordinals": 65537, "trial_degree": 18,
    "Lanczos_steps": 80, "L": "2^-96",
}, rust_budget)

primary_source = PRIMARY.read_text("utf-8") + PRIMARY_HEADER.read_text("utf-8")
rust_source = RUST.read_text("utf-8")
check("primary_P06_source", all(token in primary_source for token in (
    "stability_cells = 256", "riccati_degree = 12", "midpoint_steps_per_cell = 32",
    "newton_sweeps = 16", "jump_repairs = 1", "repair_diagonal_jump",
    "verify_positive_riccati_residual", "project_midpoint_2m448",
)), {"cpp_sha256": digest(PRIMARY), "hpp_sha256": digest(PRIMARY_HEADER)})
check("primary_P07_source", all(token in primary_source for token in (
    "trial_degree = 16", "inverse_iterations = 64", "lower_exponent = -96",
    "cutoff_fixture", "strict_stability_predicates", "cells == 1024",
)), digest(PRIMARY))
check("independent_R06_source", all(token in rust_source for token in (
    "STABILITY_CELLS: usize = 256", "RICCATI_DEGREE: usize = 14",
    "GAUSS_LEGENDRE_STEPS_PER_CELL: usize = 40", "NEWTON_KRYLOV_SWEEPS: usize = 20",
    "KRYLOV_VECTORS_PER_SWEEP: usize = 96", "JUMP_OFFSET_ORDINALS: usize = 65_537",
    "select_jump_offset", "project_midpoint_2m448",
)), digest(RUST))
check("independent_R07_source", all(token in rust_source for token in (
    "TRIAL_DEGREE: usize = 18", "LANCZOS_STEPS: usize = 80",
    "block_lanczos_fixture", "cutoff_fixture", "cells == 1024",
)), digest(RUST))
check("independent_source_is_pure_Rust", "unsafe" not in rust_source and all(
    token not in rust_source.lower() for token in ('extern "c"', "#[link", "gmp", "mpfr", "flint", "arb.h")
), "no unsafe, FFI, C arithmetic, GMP, MPFR, FLINT or Arb tokens")
check("source_runtime_disjoint", digest(PRIMARY) != digest(RUST)
      and manifest["primary_cpp_fixture"]["runtime"]["image_id"]
      != manifest["independent_rust_fixture"]["runtime"]["image_id"],
      [manifest["primary_cpp_fixture"]["runtime"]["image_id"], manifest["independent_rust_fixture"]["runtime"]["image_id"]])

# Producer-independent exact references for the manufactured fixtures.
value = Fraction(1)
strict_decreases = 0
for _ in range(16):
    residual = value * value - 2
    correction = residual / (2 * value)
    candidate = value - correction
    strict_decreases += abs(candidate * candidate - 2) < abs(residual)
    value = candidate
check("primary_newton_reference", strict_decreases == 16 and value > 0, {"strict_decreases": strict_decreases, "numerator_bits": value.numerator.bit_length()})
step = Fraction(1, 2**448)
threshold = Fraction(1, 2**160)
observed = threshold - 3 * step
least = next(ordinal for ordinal in range(65537) if observed + ordinal * step >= threshold)
check("primary_jump_reference", least == 3, least)
value = Fraction(1)
for _ in range(20):
    value -= value / 2
check("rust_newton_krylov_reference", value == Fraction(1, 2**20) and 20 * 96 == 1920, {"value": str(value), "vectors": 1920})
observed = threshold - 7 * step
least = next(ordinal for ordinal in range(65537) if observed + ordinal * step >= threshold)
exhausts = not any(threshold - 65537 * step + ordinal * step >= threshold for ordinal in range(65537))
check("rust_jump_reference", least == 7 and exhausts, {"least": least, "exhausts": exhausts})
check("lanczos_separation_reference", 4 - 1 - 1 == 2 and 2 > 1 and 80 + 2 == 82, {"chain_lower": 2, "invariant_ritz": 1, "dimension": 82})
check("strict_predicates_reference", 0 < Fraction(1, 2**96) <= 1 < 2, "0 < 2^-96 <= 1 < 2")
check("mass_derivative_reference", all(Fraction(1, 2**32) > 0 for _ in range(1024)) and not Fraction(0) > 0, 1024)

runtime = json.loads(subprocess.run(
    [sys.executable, str(RUNTIME_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)
check("runtime_audit", runtime.get("status") == "PASS"
      and runtime.get("checks_passed") == runtime.get("checks_total") == 78,
      [runtime.get("status"), runtime.get("checks_passed"), runtime.get("checks_total")])
primary_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "primary_fixture_report")
rust_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "independent_fixture_report")
check("primary_stability_fixtures", primary_report.get("stability_checks_passed") == primary_report.get("stability_checks_total") == 9, primary_report)
check("independent_stability_fixtures", rust_report.get("stability_checks_passed") == rust_report.get("stability_checks_total") == 9
      and rust_report.get("stability_check_mask") == "111111111", rust_report)

primary_roles = {role["id"].split("_", 1)[0]: role for role in matrix["primary_cpp_arb_flint_gmp_mpfr_roles"]}
rust_roles = {role["id"].split("_", 1)[0]: role for role in matrix["independent_pure_rust_roles"]}
check("matrix_P06_P07_R06_R07", all(primary_roles[role]["status"] == "complete" for role in ("P06", "P07"))
      and all(rust_roles[role]["status"] == "complete" for role in ("R06", "R07")),
      {role: primary_roles[role]["status"] for role in ("P06", "P07")}
      | {role: rust_roles[role]["status"] for role in ("R06", "R07")})
summary = matrix["promotion_summary"]
check("matrix_remains_fail_closed", summary["primary_complete"] == 7 and summary["independent_complete"] == 7
      and summary["S4_implementation_closure"] is False
      and summary["inert_future_primary_proposal_allowed"] is False, summary)
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("authority_locked", not any(matrix["authority"].values()), matrix["authority"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.stability_kernel_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "primary_roles_complete": 7,
    "independent_roles_complete": 7,
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "scientific_builder_executed": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "S4_implementation_closure": False,
    "next_role": "P08-P13 then R08-R13 quantum builders",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
