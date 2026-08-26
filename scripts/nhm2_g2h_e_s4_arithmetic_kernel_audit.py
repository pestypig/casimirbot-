#!/usr/bin/env python3
"""Independent audit of bounded G2H-E-S4 P01/R01 arithmetic fixtures."""

from __future__ import annotations

from fractions import Fraction
import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-fixture-build-bindings.v1.json"
MATRIX_PATH = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-producer-completion-matrix.v1.json"
BUILDER_PATH = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-disjoint-builder-algorithms.v1.json"
RUNTIME_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py"
PRIMARY_ARITHMETIC = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_arithmetic_primary.cpp"
PRIMARY_HEADER = PRIMARY_ARITHMETIC.with_suffix(".hpp")
RUST_ARITHMETIC = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_arithmetic_independent.rs"
ROOTS = [
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
]


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: object) -> None:
    checks.append({"name": name, "pass": bool(condition), "detail": detail})


manifest = json.loads(MANIFEST_PATH.read_bytes())
matrix = json.loads(MATRIX_PATH.read_bytes())
builder = json.loads(BUILDER_PATH.read_bytes())
manifest_sidecar = MANIFEST_PATH.with_suffix(".sha256").read_text("ascii").split()[0]
check("manifest_sidecar", sha256(MANIFEST_PATH) == manifest_sidecar, manifest_sidecar)
check("builder_binding", sha256(BUILDER_PATH) == "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf", sha256(BUILDER_PATH))
check(
    "frozen_common_arithmetic",
    builder["common_rules"]["precision"].startswith("512-bit significand directed balls")
    and "nearest dyadic n*2^-448" in builder["common_rules"]["projection"]
    and "ties choose even n" in builder["common_rules"]["projection"],
    builder["common_rules"],
)

primary_source = PRIMARY_ARITHMETIC.read_text("utf-8")
primary_header = PRIMARY_HEADER.read_text("utf-8")
rust_source = RUST_ARITHMETIC.read_text("utf-8")
check(
    "primary_P01_source",
    all(token in primary_source + primary_header for token in (
        "precision_bits = 512", "projection_exponent = -448", "void add(",
        "void subtract(", "void multiply(", "bool divide(",
        "arf_get_fmpq", "fmpz_fdiv_qr", "fmpz_is_odd", "arb_sub(error_ball",
    )),
    {"cpp_sha256": sha256(PRIMARY_ARITHMETIC), "hpp_sha256": sha256(PRIMARY_HEADER)},
)
check(
    "independent_R01_source",
    all(token in rust_source for token in (
        "const LIMBS: usize = 8", "const WIDE_LIMBS: usize = 16", "struct Ball512",
        "fn add(self", "fn sub(self", "fn mul(self", "fn div(self",
        "fn project_midpoint_2m448", "fn divide(numerator: Wide",
    )),
    {"rust_sha256": sha256(RUST_ARITHMETIC)},
)
check("source_disjoint", sha256(PRIMARY_ARITHMETIC) != sha256(RUST_ARITHMETIC), [sha256(PRIMARY_ARITHMETIC), sha256(RUST_ARITHMETIC)])
check("rust_no_unsafe_or_ffi", "unsafe" not in rust_source and all(token not in rust_source for token in ("extern \"C\"", "gmp", "mpfr", "flint", "arb_")), "pure Rust source scan")


def ties_even(value: Fraction) -> int:
    floor = value.numerator // value.denominator
    remainder = value - floor
    if remainder > Fraction(1, 2) or (remainder == Fraction(1, 2) and floor % 2 != 0):
        return floor + 1
    return floor


projection_cases = [(5, 449, 2), (7, 449, 4), (-5, 449, -2), (-7, 449, -4), (9, 450, 2), (11, 450, 3), (-9, 450, -2), (-11, 450, -3)]
projection_observed = [ties_even(Fraction(numerator, 1 << denominator_bits) * (1 << 448)) for numerator, denominator_bits, _ in projection_cases]
check("independent_projection_reference", projection_observed == [expected for _, _, expected in projection_cases], projection_observed)

runtime = json.loads(subprocess.run([sys.executable, str(RUNTIME_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True).stdout)
check("runtime_audit", runtime.get("status") == "PASS" and runtime.get("checks_passed") == 75 == runtime.get("checks_total"), [runtime.get("status"), runtime.get("checks_passed"), runtime.get("checks_total")])
primary_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "primary_fixture_report")
rust_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "independent_fixture_report")
check("primary_arithmetic_fixtures", primary_report.get("arithmetic_checks_passed") == 6 == primary_report.get("arithmetic_checks_total"), primary_report)
check("rust_arithmetic_fixtures", rust_report.get("arithmetic_checks_passed") == 8 == rust_report.get("arithmetic_checks_total") and rust_report.get("arithmetic_check_mask") == "11111111", rust_report)

primary_role = next(role for role in matrix["primary_cpp_arb_flint_gmp_mpfr_roles"] if role["id"].startswith("P01_"))
rust_role = next(role for role in matrix["independent_pure_rust_roles"] if role["id"].startswith("R01_"))
summary = matrix["promotion_summary"]
check("matrix_P01_R01", primary_role["status"] == "complete" and rust_role["status"] == "complete", [primary_role["status"], rust_role["status"]])
check("matrix_fail_closed", summary["primary_complete"] == 5 and summary["independent_complete"] == 5 and summary["S4_implementation_closure"] is False and summary["inert_future_primary_proposal_allowed"] is False, summary)
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("authority_locked", not any(matrix["authority"].values()), matrix["authority"])

passed = sum(item["pass"] for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.arithmetic_kernel_audit.v1",
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
