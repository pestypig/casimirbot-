#!/usr/bin/env python3
"""Independent audit for the candidate-neutral C08 analytic parameter jets.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: internal kappa, mu and beta+1 ordered 13-jets
Current maturity: implemented candidate-neutral audit target
Target maturity: independently audited analytic prerequisite for P/Pprime ledgers
Required frozen inputs: acknowledged growth contract and state-jet definition
Required evidence: exact jet algebra, both mixed orientations, offline replay
Stop/fail criteria: formula drift, missing ordered Hessian, sampling, roots or authority
Explicit non-goals: P/P2 ledger completion, candidate execution or handler linkage
Downstream gate unlocked: candidate-neutral P/Pprime analytic ledger realization only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-analytic-parameter-jets-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-analytic-parameter-jets-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-analytic-parameter-jets-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp":
        "1ec56b59596d49f15cfc3e8ac3dbbb84a645cd051c929c6554db0496301f2fbf",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_parameter_jets_v1.cpp":
        "3f4804425edb8a9cf13eddc25ee589b41bbe5f081876891798b1c2faf06799ce",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_parameter_jets_fixture_v1.cpp":
        "43be69140570947fc4fd8058fa7bbdcbc68eda0393d1f2640f0139c53935620e",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-parameter-jets-fixture.v1":
        "da60ff03bcdff78412ad4dfbe48a93607a389ff2008bbe78b0e1f0645400011d",
}
PREDECESSORS = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "000141ac0867f402a9737aaea2dd69744ff0040c82c6a7051136999540900017"
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


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", sha(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.extend((f"predecessor:{path}", sha(ROOT / path) == expected)
                  for path, expected in PREDECESSORS.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_analytic_parameter_jets_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_analytic_parameter_jets_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_analytic_parameter_jets_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("fixed_13_jet_layout", "kJetCount = 13U" in header
         and "second_jet" in header and "a * kParameterCount + b" in header),
        ("positive_internal_tuple", "arb_set(&output->mu[value_jet()], input.theta2)" in source
         and "arb_one(&output->mu[first_jet(2U)])" in source),
        ("vacuum_eta_fixed_tuple", "arb_mul(&output->mu[value_jet()], input.eta, input.theta2" in source
         and "arb_set(&output->mu[first_jet(2U)], input.eta)" in source),
        ("beta_plus_one_exact_formula", "factor[index]" in source
         and "arb_mul_2exp_si(&factor[index], &output->kappa[index], 1)" in source
         and "multiply(output->mu, factor, output->beta_plus_one)" in source),
        ("full_product_hessian", "left[second_jet(a, b)]" in source
         and "left[first_jet(a)]" in source and "left[first_jet(b)]" in source
         and "right[second_jet(a, b)]" in source),
        ("reciprocal_solved_in_order", source.index("for (std::size_t a = 0U; a < kParameterCount; ++a)")
         < source.index("for (std::size_t a = 0U; a < kParameterCount; ++a) {", source.index("bool reciprocal"))),
        ("strict_kappa_and_eta", "arb_is_positive(input.kappa)" in source
         and "arb_is_nonnegative(input.eta)" in source),
        ("invalid_chart_rejected", "input.chart != Chart::positive" in source
         and "input.chart != Chart::vacuum" in source
         and "invalid_chart" in fixture),
        ("ordered_mixed_fixture", "second_jet(1U, 2U)" in fixture
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
                (f"fixture_{ordinal}_10_of_10", payload.get("checks_passed") == 10
                 and payload.get("checks_total") == 10),
                (f"fixture_{ordinal}_inventory", payload.get("jet_components") == 39
                 and payload.get("ordered_second_components") == 27),
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
        "schema": "nhm2.g2h_e_s5.c08_analytic_parameter_jets_runtime_audit.v1",
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
