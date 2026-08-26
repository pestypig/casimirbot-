#!/usr/bin/env python3
"""Independent audit of candidate-neutral C08 F'/E1'/E2' panel models."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-analytic-factor-derivative-model-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-analytic-factor-derivative-model-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-analytic-factor-derivative-model-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.hpp": "b11c1b2d8e28025d36c1294a8389e41497f141f320c6f4cf59a5f7bc11664bc5",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.cpp": "ef979386d80320db80535914fc6de3e256eb903e5e2a2ba5a282a77eb9b0919c",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_derivative_model_fixture_v1.cpp": "f747377c32e536cc09e23d43c4f7e53a8f681fc298ecabc9a5af007b42f01c3d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-factor-derivative-model-fixture.v1": "f643d30b2c56388b6368df47f7b6c81d77758b2251463332961e8cdb483faa91",
}
EXPECTED_EXECUTABLE = "76a2d56f2517096068204244fb83eefa7f7887350ab44834cf8b88d4bb9bff68"
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
    return process.returncode == 0 and payload.get("status") == "PASS"


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", sha(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_analytic_factor_derivative_model_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_analytic_factor_derivative_model_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("exact_derivative_formulas", "F'=-2*mu" in header
         and "E1'=2*mu*E1" in header
         and "E2'=4*mu*(1+mu*t)*E1" in header),
        ("all_three_source_models_bound", all(token in header for token in (
            "ledger::ModelView f;", "ledger::ModelView e1;", "ledger::ModelView e2;"))),
        ("same_geometry_required", "same_geometry(input.f, input.e1)" in source
         and "same_geometry(input.f, input.e2)" in source),
        ("full_ordered_product_rule", "left.at(analytic::first_jet(a))" in source
         and "right.at(analytic::first_jet(b))" in source
         and "left.at(analytic::first_jet(b))" in source
         and "right.at(analytic::first_jet(a))" in source),
        ("exact_fprime_constant", "arb_mul_si(fprime.at(jet), mu.at(jet), -2L" in source
         and "set_constant_model(input.f, fprime" in source),
        ("e1prime_product", "e1_constant.at(jet), mu.at(jet), 2U" in source
         and "product::evaluate(e1_input" in source),
        ("e2prime_degree_one_product", "e2_linear.at(jet), mu_squared.at(jet), 4U" in source
         and "input.f.left_endpoint" in source and "product::evaluate(e2_input" in source),
        ("no_remainder_differentiation", "never differentiates a source remainder" in header),
        ("fixture_exact_origin_coefficients", "equal(e2p.coefficients+derivative::kJetCount,3,4)" in fixture),
        ("fixture_both_panel_kinds", "ModelKind::origin" in fixture
         and "ModelKind::positive_panel" in fixture),
        ("fixture_corrupt_geometry", "bad.e2=positive.view" in fixture
         and "source_geometry" in fixture),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("digest_pinned_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))
    checks.append(("predecessor_factor_model", passing(
        "scripts/nhm2_g2h_e_s5_c08_analytic_factor_model_runtime_audit.py")))
    checks.append(("predecessor_product", passing(
        "scripts/nhm2_g2h_e_s5_c08_analytic_model_product_runtime_audit.py")))
    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE,
                         "--format", "{{.Id}}"])
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
                (f"fixture_{ordinal}_11_of_11", payload.get("checks_passed") == 11
                 and payload.get("checks_total") == 11),
                (f"fixture_{ordinal}_candidate_inert", payload.get("candidate_evaluations") == 0
                 and payload.get("positive_parameter_samples") == 0
                 and payload.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false", payload.get("scientific_handler_linked") is False
                 and payload.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report", reports[0] == reports[1]))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failed = [name for name, ok in checks if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_analytic_factor_derivative_model_runtime_audit.v1",
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
