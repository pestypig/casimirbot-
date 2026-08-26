#!/usr/bin/env python3
"""Independent audit for candidate-neutral C08 F/E1/E2 panel models.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: analytic factor panel models F,E1,E2
Current maturity: implemented candidate-neutral audit target
Target maturity: audited primitive for analytic-factor convolution ledgers
Required frozen inputs: acknowledged parameter jets and exact factor formulas
Required evidence: all 13 jets, directed panel tails, replay and corruption
Stop/fail criteria: omitted mixed jet, heuristic tail, sampling, roots or authority
Explicit non-goals: factor persistence, H2/P2 closure or candidate execution
Downstream gate unlocked: candidate-neutral F/E1/E2 ledger persistence only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-analytic-factor-model-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-analytic-factor-model-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-analytic-factor-model-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_model_v1.hpp":
        "c2eb77cc942134812e2fcef2f1b08f5e1ac7c0595f00a5c2a6336af8d1a02893",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_model_v1.cpp":
        "7889c3e25796179c19dc9e59a39af7a205e8de3cedf50756afe815b9a2b1e531",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_analytic_factor_model_fixture_v1.cpp":
        "ba09aa3e2be7c9d7f23b3602854b01588227b314de3e057387e5ce9527b38660",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-analytic-factor-model-fixture.v1":
        "44d7eb01172041a346f57549f15f3037551d4582605435f2c4242c98d2b33e59",
}
EXPECTED_EXECUTABLE = "14333eb89f4e516f23faf771ddc4fc2db114673215423ea909e353871584f7b1"
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
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_analytic_factor_model_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_analytic_factor_model_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_analytic_factor_model_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("exact_acknowledged_formulas", "F=1-2*mu*t" in header
         and "E1=exp(2*mu*t)" in header
         and "E2=(1+2*mu*t)*exp(2*mu*t)" in header),
        ("full_13_jet_inventory", "kJetCount = analytic::kJetCount" in header
         and "analytic::second_jet(a, b)" in source),
        ("ordered_product_rule", "left.at(analytic::first_jet(a))" in source
         and "right.at(analytic::first_jet(b))" in source
         and "left.at(analytic::first_jet(b))" in source
         and "right.at(analytic::first_jet(a))" in source),
        ("exact_exp_jet_rule", "jet_exp" in source
         and "source.at(analytic::second_jet(a, b))" in source),
        ("left_centered_e1_recurrence", "jet_exp(e_coefficient, za)" in source
         and "jet_mul(e_next, e_coefficient, z)" in source
         and "degree + 1U" in source),
        ("e2_polynomial_factor", "jet_add(l0, one, za)" in source
         and "jet_mul(term, l1, previous_e)" in source),
        ("exact_linear_f", "jet_neg(f1, z)" in source
         and "jet_add(f0, one, term)" in source),
        ("directed_full_panel_tail", "arb_union(t_interval" in source
         and "polynomial_range(polynomial" in source
         and "upper_magnitude(magnitude, difference)" in source),
        ("true_upper_magnitude", "arb_get_ubound_arf" in source
         and "arb_set_arf(output, upper)" in source),
        ("symmetric_remainder", "arb_add_error(remainder, magnitude)" in source
         and "arb_contains_zero(remainder)" in source),
        ("fixed_order_grammar", "32U, 48U, 64U, 96U, 128U, 192U, 256U" in source
         and "24U, 32U, 48U, 64U, 96U, 128U, 192U" in source),
        ("origin_positive_chronology", "input.ordinal == 0U" in source
         and "input.ordinal > 0U" in source),
        ("stale_output_erased", "reset(*output)" in source
         and "output.coefficients[0].empty()" in fixture),
        ("fixture_exact_coefficients", "1U, mu_first), 4L, 1L" in fixture
         and "p2" not in fixture),
        ("fixture_both_panel_kinds", "ModelKind::origin" in fixture
         and "ModelKind::positive_panel" in fixture),
        ("fixture_mixed_symmetry", "second_jet(1U, 2U)" in fixture
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
    predecessor = run([sys.executable,
        "scripts/nhm2_g2h_e_s5_c08_analytic_parameter_jets_runtime_audit.py"])
    predecessor_payload = parse(predecessor)
    checks.append(("predecessor_parameter_jets", predecessor.returncode == 0
                   and predecessor_payload.get("status") == "PASS"))

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
                (f"fixture_{ordinal}_orders", payload.get("origin_order") == 32
                 and payload.get("positive_order") == 24),
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
        "schema": "nhm2.g2h_e_s5.c08_analytic_factor_model_runtime_audit.v1",
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
