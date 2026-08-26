#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08 origin models.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c3 canonical four-state origin models
Current maturity: implemented candidate-neutral audit target
Target maturity: independently audited prerequisite for full C08-011c provider
Required frozen inputs: audited C08-006 recurrence and C08-010 ledger grammar
Required evidence: exact factorial/integral normalization, outward remainder replay, four valid ledgers
Stop/fail criteria: recurrence change, invalid order, cancellation, sampling, roots or authority
Explicit non-goals: positive continuation, full provider, candidate execution or authority
Downstream gate unlocked: full origin-plus-successor provider integration only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-origin-models-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-origin-models-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-origin-models-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_models_v1.hpp":
        "f3fcafbcce7c097129c325080bf6d0748fbc976c5ddd58688501712d3797b68b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_models_v1.cpp":
        "55c0e324ff49e633b7d655631c23d07d422999cae8a9d0cd7815328db23c26fe",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_origin_models_fixture_v1.cpp":
        "c6a9489fb981c19b42bef650b4531a22504a805bc9242aefa2eccc3da1b390f8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-origin-models-fixture.v1":
        "fc839fea9f4084b9664c933390871f8ca9dc7bbbab718fcab013a0443876f185",
}
EXPECTED_EXECUTABLE = "ad1a6503991d6e4a72e40f483ed373c87b8a50d160f44b3ff982008658f12878"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False,
                          capture_output=True, text=True)


def parse(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def passing(path: str) -> bool:
    process = run([sys.executable, path])
    payload = parse(process)
    return (process.returncode == 0 and payload.get("status") == "PASS"
            and payload.get("checks_passed") == payload.get("checks_total"))


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", sha(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_origin_models_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_origin_models_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_origin_models_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("separately_versioned_adapter", '#include "mini_boson_star_primary_c08_origin_series_v1.cpp"' in source),
        ("audited_recurrence_replayed", "origin::initialize_origin" in source
         and "origin::generate_next" in source),
        ("selected_order_bound", "model.order = model_order(state, selected)" in source),
        ("common_frozen_origin_order", "return selected;" in source),
        ("ordinary_factorial_normalization", "arb_fac_ui(target, degree" in source
         and "arb_inv(target, target" in source),
        ("v_derivative_shift", "source = degree + 1U" in source),
        ("j1_exact_integral_shift", "degree >= 1U" in source
         and "source = degree - 1U" in source),
        ("j2_exact_integral_shift", "degree >= 2U" in source
         and "source = degree - 2U" in source),
        ("exact_zero_integration_constants", "arb_zero(target)" in source),
        ("tail_bounds_outward", "arb_add_error(model.remainder(jet)" in source
         and "origin_enclosure.tail_bounds" in source),
        ("known_truncation_outward", "add_omitted_known_terms" in source
         and "arb_pow_ui(power, t0, degree" in source),
        ("rounding_replay_outward", "add_endpoint_replay_discrepancy" in source
         and "origin::upper_magnitude" in source),
        ("endpoint_contains_original", "arb_contains(value, expected)" in source),
        ("four_origin_model_views", "std::array<Model, kStateCount>" in header
         and "ledger::ModelKind::origin" in source),
        ("no_midpoint_or_cancellation", "midpoint_acceptance_used = false" in source
         and "signed_remainder_cancellation_used = false" in source),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("fixture_selected_128", "selected_origin_order == 128U" in fixture),
        ("fixture_all_four_ledgers", "state < models::kStateCount" in fixture
         and "models::ledger::evaluate" in fixture),
        ("fixture_exact_initial_normalizations", "j1.coefficient(1U, 0U)" in fixture
         and "j2.coefficient(2U, 0U)" in fixture),
        ("fixture_predecessor_and_null_guards", "blocked_result" in fixture
         and "null_output_result" in fixture),
        ("fixture_determinism", "models::Output replay" in fixture
         and "replay_result.model_coefficient_balls" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))
    checks.append(("predecessor_origin_audit",
                   passing("scripts/nhm2_g2h_e_s5_c08_origin_series_runtime_audit.py")))
    checks.append(("predecessor_ledger_audit",
                   passing("scripts/nhm2_g2h_e_s5_c08_convolution_ledger_runtime_audit.py")))

    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("local_image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--network", "none",
                          "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        for ordinal in range(2):
            process = run(["docker", "run", "--rm", "--network", "none",
                           "--read-only", "--cap-drop", "ALL", "--security-opt",
                           "no-new-privileges", "--pids-limit", "64", IMAGE])
            payload = parse(process)
            reports.append(payload)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", process.returncode == 0),
                (f"fixture_{ordinal}_13_of_13", payload.get("checks_passed") == 13
                 and payload.get("checks_total") == 13),
                (f"fixture_{ordinal}_inventory", payload.get("selected_order") == 128
                 and payload.get("model_coefficients") == 6708
                 and payload.get("model_remainders") == 52
                 and payload.get("endpoint_checks") == 52),
                (f"fixture_{ordinal}_candidate_inert", payload.get("candidate_evaluations") == 0
                 and payload.get("positive_parameter_samples") == 0
                 and payload.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false", payload.get("scientific_handler_linked") is False
                 and payload.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report", reports[0] == reports[1]))
    else:
        checks.extend((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_13_of_13", "fixture_0_inventory",
            "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_13_of_13", "fixture_1_inventory",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failed = [name for name, passed_check in checks if not passed_check]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_origin_models_runtime_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks), "failed": failed,
        "image_id": image_id, "executable_sha256": executable_hash,
        "candidate_evaluations": 0, "positive_parameter_samples": 0,
        "candidate_roots_created": False, "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, separators=(",", ":"), sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
