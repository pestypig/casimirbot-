#!/usr/bin/env python3
"""Independent audit for the candidate-neutral C08 analytic model product.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: degree-one analytic-factor times scalar-ledger model
Current maturity: implemented candidate-neutral audit target
Target maturity: independently audited prerequisite for P/Pprime ledgers
Required frozen inputs: audited internal analytic jets and C08 ledger grammar
Required evidence: exact ordered jets, outward discarded/source remainders, replay
Stop/fail criteria: signed cancellation, stale output, sampling, roots or authority
Explicit non-goals: P/P2 ledger completion, candidate execution or handler linkage
Downstream gate unlocked: candidate-neutral P/Pprime ledger persistence only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-analytic-model-product-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-analytic-model-product-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-analytic-model-product-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_model_product_v1.hpp":
        "b108121c0709ba9638af76911a06fef7a1342be3a2f27987d80b56134c3f00f8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_model_product_v1.cpp":
        "d65f4a9f77d4d6237c9577549d4842a20bf811cc44c1ec09f91d62edbc97267a",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_model_product_fixture_v1.cpp":
        "36ae63c84aa7d520e1b7bb0681f8fe1c1a7dcd770c137f8605c46be1496f04dc",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-model-product-fixture.v1":
        "801fc1f70fc3ffffbd58de00fed807ffb03aad64998e69eb976733150ee642e4",
}
EXPECTED_EXECUTABLE = "2f800f05440e86fc6295526bcc3b9de2e6787fda894000ac6e78be2dec9b707a"
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
    header = (G2H / "mini_boson_star_primary_c08_analytic_model_product_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_analytic_model_product_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_analytic_model_product_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("exact_degree_one_factor", "factor_constant" in header
         and "factor_linear" in header and "exact_degree_one_factor" in header),
        ("complete_ordered_product", "terms_for" in source
         and "second_jet(a, b)" in source and "first_jet(a), analytic::first_jet(b)" in source
         and "first_jet(b), analytic::first_jet(a)" in source),
        ("coefficient_convolution", "degree - 1U" in source
         and "input.factor_linear + factor" in source),
        ("source_remainder_outward", "factor_sup, source_mag" in source
         and "source_remainder_terms" in source),
        ("discarded_r_plus_one", "input.source.order + 1U" in source
         and "discarded_degree_terms" in source),
        ("true_upper_magnitude", "arb_get_ubound_arf" in source
         and "arb_set_arf(output, upper)" in source),
        ("origin_and_positive_limits", "ledger::kMaximumOriginOrder" in source
         and "ledger::kMaximumPositiveOrder" in source),
        ("left_centered_only", "arb_equal(source.left_endpoint, source.expansion_center)" in source),
        ("symmetric_source_remainder", "arb_contains_zero(source.remainders + jet)" in source),
        ("stale_output_erased", "if (output != nullptr) reset(*output)" in source
         and "output.coefficients.empty()" in fixture),
        ("mixed_orientation_fixture", "second_jet(1U, 2U)" in fixture
         and "second_jet(2U, 1U)" in fixture),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))
    checks.append(("predecessor_analytic_jets",
                   passing("scripts/nhm2_g2h_e_s5_c08_analytic_parameter_jets_runtime_audit.py")))

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
                (f"fixture_{ordinal}_9_of_9", payload.get("checks_passed") == 9
                 and payload.get("checks_total") == 9),
                (f"fixture_{ordinal}_ordered_seconds", payload.get("ordered_second_outputs") == 9),
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
        "schema": "nhm2.g2h_e_s5.c08_analytic_model_product_runtime_audit.v1",
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
