#!/usr/bin/env python3
"""Independent audit of bounded G2H-E-S4 P04/P05/R04/R05 fixtures."""

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
CONTINUATION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s4-r1-continuation-tube-contract.v1.json"
RUNTIME_AUDIT = ROOT / "scripts/nhm2_g2h_e_s4_fixture_runtime_audit.py"
PRIMARY = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_continuation_primary.cpp"
PRIMARY_HEADER = PRIMARY.with_suffix(".hpp")
RUST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_continuation_independent.rs"
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
continuation = json.loads(CONTINUATION.read_bytes())
sidecar = MANIFEST.with_suffix(".sha256").read_text("ascii").split()[0]
check("manifest_sidecar", digest(MANIFEST) == sidecar, sidecar)
check("builder_binding", digest(BUILDER) == "5bd4c47069bf1716acef1bb572af8d1d9aee78d251f6df883f068d9ed75f0abf", digest(BUILDER))
check("continuation_binding", digest(CONTINUATION) == "7a0cdc0e45a09e0291b79a1ef3892e221d6ed71395e3e4cf5e767c0adb1cb16c", digest(CONTINUATION))
inventory = continuation["cell_inventory"]
check(
    "frozen_inventory",
    inventory["cell_count"] == 1024 and inventory["candidate_radii_each"] == 73
    and inventory["adaptive_subdivision"] is False
    and continuation["cell_center_tube"]["degree"] == 2,
    inventory,
)
primary_algorithm = builder["primary_cpp_arb_lineage"]["continuation_builder"]
rust_algorithm = builder["independent_pure_rust_lineage"]["continuation_builder"]
expected_budget = {"cells": 1024, "inverse_builds_per_cell": 1, "radii_per_cell": 73, "adaptive_subdivisions": 0, "alternate_predictors": 0}
check("frozen_continuation_budgets", primary_algorithm["budgets"] == expected_budget and rust_algorithm["budgets"] == expected_budget, [primary_algorithm["budgets"], rust_algorithm["budgets"]])

primary_source = PRIMARY.read_text("utf-8") + PRIMARY_HEADER.read_text("utf-8")
rust_source = RUST.read_text("utf-8")
check(
    "primary_P04_source",
    all(token in primary_source for token in (
        "cell_count = 1024", "radii_per_cell = 73", "second_order_predictor",
        "select_least_radius", "strict_ball_containment", "advance_cell_ordinal",
        "cell_count * radii_per_cell",
    )),
    {"cpp_sha256": digest(PRIMARY), "hpp_sha256": digest(PRIMARY_HEADER)},
)
check(
    "primary_P05_source",
    all(token in primary_source for token in (
        "arb_poly_mul", "fmpz_ui_pow_ui", "coefficient_weight_power",
        "flat_carrier_envelope", "arb_abs",
    )),
    digest(PRIMARY),
)
check(
    "independent_R04_source",
    all(token in rust_source for token in (
        "CELL_COUNT: usize = 1024", "RADII_PER_CELL: usize = 73",
        "second_order_predictor", "select_least_radius", "strict_ball_containment",
        "advance_cell_ordinal", "CELL_COUNT * RADII_PER_CELL",
    )),
    digest(RUST),
)
check(
    "independent_R05_source",
    all(token in rust_source for token in (
        "chebyshev_to_bernstein", "elevate_once", "multiply_tau",
        "bernstein_integer_convolution", "binomial(512, 256)",
        "conversion_remainder", "COEFFICIENT_WEIGHT_POWER",
    )),
    digest(RUST),
)
check(
    "independent_source_is_pure_Rust",
    "unsafe" not in rust_source and all(token not in rust_source.lower() for token in ("extern \"c\"", "#[link", "gmp", "mpfr", "flint", "arb.h")),
    "no unsafe, FFI, C arithmetic, GMP, MPFR, FLINT or Arb tokens",
)
check(
    "source_runtime_disjoint",
    digest(PRIMARY) != digest(RUST)
    and manifest["primary_cpp_fixture"]["runtime"]["image_id"] != manifest["independent_rust_fixture"]["runtime"]["image_id"],
    [manifest["primary_cpp_fixture"]["runtime"]["image_id"], manifest["independent_rust_fixture"]["runtime"]["image_id"]],
)

# Independent exact references for the manufactured fixtures.
h = Fraction(1, 4)
predictor = [Fraction(1) + h * 3 + h * h * 2 / 2, Fraction(-2) + h * 4 + h * h * -2 / 2]
check("predictor_reference", predictor == [Fraction(29, 16), Fraction(-17, 16)], [str(value) for value in predictor])
y = Fraction(3, 2 ** (192 - 17 + 2))
radii = [Fraction(1, 2 ** (192 - index)) for index in range(73)]
passing = [index for index, radius in enumerate(radii) if y - radius < 0 and radius < 1]
check("least_radius_reference", passing[0] == 17 and len(radii) == 73, {"least": passing[0], "evaluated": len(radii)})
weighted = 3 * 1 ** 8 + 10 * 2 ** 8 + 8 * 3 ** 8 + 5
check("weighted_l1_reference", weighted == 55056, weighted)
check("bernstein_reference", [Fraction(-1), Fraction(3)] == [Fraction(1) - 2, Fraction(1) + 2], ["-1", "3"])

runtime = json.loads(subprocess.run(
    [sys.executable, str(RUNTIME_AUDIT)], cwd=ROOT, check=True, capture_output=True, text=True,
).stdout)
check("runtime_audit", runtime.get("status") == "PASS" and runtime.get("checks_passed") == runtime.get("checks_total") == 75, [runtime.get("status"), runtime.get("checks_passed"), runtime.get("checks_total")])
primary_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "primary_fixture_report")
rust_report = next(item["detail"] for item in runtime["checks"] if item["name"] == "independent_fixture_report")
check("primary_continuation_fixtures", primary_report.get("continuation_checks_passed") == primary_report.get("continuation_checks_total") == 10, primary_report)
check(
    "independent_continuation_fixtures",
    rust_report.get("continuation_checks_passed") == rust_report.get("continuation_checks_total") == 9
    and rust_report.get("continuation_check_mask") == "111111111",
    rust_report,
)

primary_roles = {role["id"].split("_", 1)[0]: role for role in matrix["primary_cpp_arb_flint_gmp_mpfr_roles"]}
rust_roles = {role["id"].split("_", 1)[0]: role for role in matrix["independent_pure_rust_roles"]}
check(
    "matrix_P04_P05_R04_R05",
    all(primary_roles[role]["status"] == "complete" for role in ("P04", "P05"))
    and all(rust_roles[role]["status"] == "complete" for role in ("R04", "R05")),
    {role: primary_roles[role]["status"] for role in ("P04", "P05")}
    | {role: rust_roles[role]["status"] for role in ("R04", "R05")},
)
summary = matrix["promotion_summary"]
check(
    "matrix_remains_fail_closed",
    summary["primary_complete"] == 5 and summary["independent_complete"] == 5
    and summary["S4_implementation_closure"] is False
    and summary["inert_future_primary_proposal_allowed"] is False,
    summary,
)
check("candidate_roots_absent", not any(path.exists() for path in ROOTS), [path.exists() for path in ROOTS])
check("authority_locked", not any(matrix["authority"].values()), matrix["authority"])

passed = sum(item["pass"] is True for item in checks)
report = {
    "schema": "nhm2.g2h_e_s4.continuation_kernel_audit.v1",
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
