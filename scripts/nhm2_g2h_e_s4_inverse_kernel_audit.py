#!/usr/bin/env python3
"""Independent audit of bounded G2H-E-S4 P02/P03/R02/R03 fixtures."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json"
MATRIX = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
BUILDER = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json"
RUNTIME_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py"
PRIMARY = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_inverse_primary.cpp"
PRIMARY_HEADER = PRIMARY.with_suffix(".hpp")
RUST_ARITHMETIC = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_arithmetic_independent.rs"
RUST_INVERSE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_inverse_independent.rs"
RUST_DETERMINANT = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_determinant_independent.rs"
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
sidecar = MANIFEST.with_suffix(".sha256").read_text("ascii").split()[0]
check("manifest_sidecar", digest(MANIFEST) == sidecar, sidecar)
check(
    "builder_binding",
    digest(BUILDER) == "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf",
    digest(BUILDER),
)

primary_algorithm = builder["primary_cpp_arb_lineage"]["classical_inverse_builder"]
rust_algorithm = builder["independent_pure_rust_lineage"]["classical_inverse_builder"]
check(
    "frozen_inverse_algorithms",
    primary_algorithm["budgets"] == {
        "maximum_dimension": 2050,
        "LU_factorizations": 1,
        "triangular_solves": 2050,
        "projection_retries": 0,
        "Bareiss_determinants": 2,
    }
    and rust_algorithm["budgets"] == {
        "maximum_dimension": 2050,
        "QR_factorizations": 1,
        "triangular_solves": 2050,
        "projection_retries": 0,
        "maximum_modular_primes_per_determinant": 32768,
        "determinants": 2,
    },
    {"primary": primary_algorithm["budgets"], "independent": rust_algorithm["budgets"]},
)

primary_source = PRIMARY.read_text("utf-8") + PRIMARY_HEADER.read_text("utf-8")
rust_arithmetic = RUST_ARITHMETIC.read_text("utf-8")
rust_inverse = RUST_INVERSE.read_text("utf-8")
rust_determinant = RUST_DETERMINANT.read_text("utf-8")
check(
    "primary_P02_source",
    all(token in primary_source for token in (
        "maximum_dimension = 2050", "factor_complete_pivot", "arb_get_abs_lbound_arf",
        "first_pivot_original_ordinal", "solve_column", "project_matrix",
    )),
    {"cpp_sha256": digest(PRIMARY), "hpp_sha256": digest(PRIMARY_HEADER)},
)
check(
    "primary_P03_source",
    all(token in primary_source for token in (
        "bareiss_integer", "fmpz_divisible", "fmpz_divexact",
        "bareiss_determinant", "finite_z0_row_sum", "arb_mat_mul", "arb_abs",
    )),
    digest(PRIMARY),
)
check(
    "independent_R02_source",
    all(token in rust_inverse for token in (
        "MAXIMUM_DIMENSION: usize = 2050", "column_pivoted_householder_inverse",
        "lower_nonnegative_cmp", "apply_reflector", "permutation", "zero_diagonal",
    )),
    digest(RUST_INVERSE),
)
check(
    "independent_R03_source",
    all(token in rust_determinant for token in (
        "MAXIMUM_MODULAR_PRIMES: usize = 32_768", "determinant_mod",
        "hadamard_bound_bits", "reconstruct_determinant", "next_prime",
        "finite_z0_row_sum",
    )),
    digest(RUST_DETERMINANT),
)
combined_rust = rust_arithmetic + rust_inverse + rust_determinant
check(
    "independent_source_is_pure_Rust",
    "unsafe" not in combined_rust
    and all(token not in combined_rust.lower() for token in ("extern \"c\"", "#[link", "gmp", "mpfr", "flint", "arb.h")),
    "no unsafe, FFI, C arithmetic, GMP, MPFR, FLINT or Arb tokens",
)
check(
    "source_runtime_disjoint",
    digest(PRIMARY) not in {digest(RUST_ARITHMETIC), digest(RUST_INVERSE), digest(RUST_DETERMINANT)}
    and manifest["primary_cpp_fixture"]["runtime"]["image_id"]
    != manifest["independent_rust_fixture"]["runtime"]["image_id"],
    [manifest["primary_cpp_fixture"]["runtime"]["image_id"], manifest["independent_rust_fixture"]["runtime"]["image_id"]],
)

# Independent exact reference for the manufactured [[2,1],[1,1]] fixture.
scale = 1 << 448
projected = [[2 * scale, scale], [scale, scale]]
exact_determinant = projected[0][0] * projected[1][1] - projected[0][1] * projected[1][0]
check(
    "exact_projection_determinant_reference",
    exact_determinant == 1 << 896,
    {"bit_length": exact_determinant.bit_length(), "is_power_of_two": exact_determinant & (exact_determinant - 1) == 0},
)
exact_inverse = [[1, -1], [-1, 2]]
product = [[sum(exact_inverse[i][k] * [[2, 1], [1, 1]][k][j] for k in range(2)) for j in range(2)] for i in range(2)]
check("exact_Z0_reference", product == [[1, 0], [0, 1]], product)

runtime = json.loads(subprocess.run(
    [sys.executable, str(RUNTIME_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)
check(
    "runtime_audit",
    runtime.get("status") == "PASS" and runtime.get("checks_passed") == runtime.get("checks_total") == 75,
    [runtime.get("status"), runtime.get("checks_passed"), runtime.get("checks_total")],
)
primary_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "primary_fixture_report")
rust_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "independent_fixture_report")
check(
    "primary_inverse_fixtures",
    primary_report.get("inverse_checks_passed") == primary_report.get("inverse_checks_total") == 5,
    primary_report,
)
check(
    "independent_inverse_fixtures",
    rust_report.get("inverse_checks_passed") == rust_report.get("inverse_checks_total") == 8
    and rust_report.get("inverse_check_mask") == "11111111",
    rust_report,
)
check(
    "independent_determinant_Z0_fixtures",
    rust_report.get("determinant_checks_passed") == rust_report.get("determinant_checks_total") == 6
    and rust_report.get("determinant_check_mask") == "111111",
    rust_report,
)

primary_roles = {role["id"].split("_", 1)[0]: role for role in matrix["primary_cpp_arb_flint_gmp_mpfr_roles"]}
rust_roles = {role["id"].split("_", 1)[0]: role for role in matrix["independent_pure_rust_roles"]}
check(
    "matrix_P02_P03_R02_R03",
    all(primary_roles[role]["status"] == "complete" for role in ("P02", "P03"))
    and all(rust_roles[role]["status"] == "complete" for role in ("R02", "R03")),
    {role: primary_roles[role]["status"] for role in ("P02", "P03")}
    | {role: rust_roles[role]["status"] for role in ("R02", "R03")},
)
summary = matrix["promotion_summary"]
check(
    "matrix_remains_fail_closed",
    summary["primary_complete"] == 5
    and summary["independent_complete"] == 5
    and summary["S4_implementation_closure"] is False
    and summary["inert_future_primary_proposal_allowed"] is False,
    summary,
)
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("authority_locked", not any(matrix["authority"].values()), matrix["authority"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.inverse_kernel_audit.v1",
    "status": "PASS" if passed == len(checks) else "FAIL",
    "checks_passed": passed,
    "checks_total": len(checks),
    "checks": checks,
    "primary_roles_complete": 5,
    "independent_roles_complete": 5,
    "candidate_evaluations": 0,
    "positive_parameter_samples": 0,
    "candidate_roots_created": False,
    "scientific_builder_executed": False,
    "execution_authorized": False,
    "authority_promoted": False,
    "S4_implementation_closure": False,
    "next_role": "P06/P07 then R06/R07 stability builders",
}
print(json.dumps(report, sort_keys=True, separators=(",", ":")))
raise SystemExit(0 if report["status"] == "PASS" else 1)
