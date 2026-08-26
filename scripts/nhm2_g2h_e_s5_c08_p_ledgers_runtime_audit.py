#!/usr/bin/env python3
"""Independent audit for candidate-neutral paired C08 P/Pprime ledgers.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: append-only analytic P and Pprime ledger persistence
Current maturity: implemented candidate-neutral audit target
Target maturity: independently audited prerequisite for P2/history integration
Required frozen inputs: coherent B,V,J1,J2 ledgers and acknowledged parameter jets
Required evidence: exact identities, all-source prefix locking, deterministic replay
Stop/fail criteria: partial pair commit, prefix mutation, sampling, roots or authority
Explicit non-goals: P2 completion, candidate execution, token or handler linkage
Downstream gate unlocked: candidate-neutral P2 ledger construction only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-p-ledgers-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-p-ledgers-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-p-ledgers-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p_ledgers_v1.hpp":
        "33dc9af13aeb3f4ae11eb51e2ab51151d1fa75431a2c4f8731cac86ef954f1ae",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p_ledgers_v1.cpp":
        "6556aba088ba0aa743f4f62d9ac87832b0820f8d5af8989b7c614e9af3589108",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p_ledgers_fixture_v1.cpp":
        "12c1b73ef541e3504f9d5173d830eae4582c209ceacfafbdcf301f3ce53d1b7b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-p-ledgers-fixture.v1":
        "20a6a1b15115014505f8b9f6bfc499ea77febad86004d4f591047efb7df45f8e",
}
EXPECTED_EXECUTABLE = "4ae93a2b47dd55b1697e14362e95ecebc61fedd50a0281747435b4b80e752c71"
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
    header = (G2H / "mini_boson_star_primary_c08_p_ledgers_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_p_ledgers_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_p_ledgers_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("complete_scalar_inventory", "kScalarStateCount = 4U" in header
         and "scalar_ledger_identities{};  // B,V,J1,J2" in header
         and "ledger_count != kScalarStateCount" in source),
        ("unique_disjoint_identities", "std::set<std::uint32_t> expected" in source
         and "input.p_ledger_identity == input.pprime_ledger_identity" in source
         and "expected.count(input.p_ledger_identity)" in source),
        ("all_scalar_ledgers_validated", "valid_scalar_ledger((*scalar)[state]->ledger)" in source),
        ("coherent_geometry_all_four", "same_geometry(reference" in source
         and "state = 1U; state < kScalarStateCount" in source),
        ("all_four_prefixes_digest_locked", "scalar_source_digests" in source
         and "state = 0U; state < kScalarStateCount" in source
         and "digest != impl.scalar_source_digests[state][ordinal]" in source),
        ("exact_p_identity", "combine(q_b, -1, beta1_j1, 1" in source
         and "P=-(kappa+t)B+(beta+1)J1" in header),
        ("exact_pprime_identity", "combine(beta_b, 1, q_v, -1" in source
         and "Pprime=beta*B-(kappa+t)V" in header),
        ("left_centered_kappa_plus_t", "b.left_endpoint" in source
         and "arb_one(&q_linear[analytic::value_jet()])" in source),
        ("beta_from_beta_plus_one", "arb_sub_ui(&beta_constant[analytic::value_jet()]" in source),
        ("four_analytic_products_per_pair", all(token in source for token in (
            "q_b_input", "beta1_j1_input", "beta_b_input", "q_v_input"))),
        ("outward_remainder_sum_no_cancellation", "upper_magnitude(left_mag" in source
         and "upper_magnitude(right_mag" in source
         and "arb_add_error(model->remainders.data()" in source),
        ("true_upper_magnitude", "arb_get_ubound_arf" in source
         and "arb_set_arf(output, upper)" in source),
        ("paired_pending_validation", "validate_with_pending(impl.p_models, *p)" in source
         and "validate_with_pending(impl.pprime_models, *pprime)" in source),
        ("paired_atomic_commit", "impl.p_models.push_back(std::move(p))" in source
         and "impl.pprime_models.push_back(std::move(pprime))" in source),
        ("stable_owned_models", "std::vector<std::unique_ptr<OwnedModel>> p_models" in source),
        ("immutable_publications", "std::vector<std::unique_ptr<Publication>> p_publications" in source
         and "pprime_publications.push_back" in source),
        ("typed_parameter_mismatch", "FailureDetail::parameter_identity_or_prefix" in source
         and "!same_parameters(input, impl)" in source),
        ("resource_and_terminal_guards", "ledger::kMaximumLedgerModels" in source
         and "terminal_failure_already_recorded" in source),
        ("fixture_manufactured_identity", "rational(expected.value, -1L, 2L)" in fixture
         and "arb_contains(p_before.models[0].coefficients" in fixture),
        ("fixture_derivative_overlap", "arb_overlaps(" in fixture
         and "pprime_after.models[1].coefficients" in fixture),
        ("fixture_prefix_corruption", "mutable_j2" in fixture
         and "scalar_inventory_or_prefix" in fixture),
        ("fixture_parameter_corruption", "changed_parameter_input" in fixture
         and "parameter_identity_or_prefix" in fixture),
        ("fixture_noop_and_stability", "model_pairs_appended == 0U" in fixture
         and "same_model(p_before.models[0], p_after.models[0])" in fixture),
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
    checks.append(("predecessor_parameter_jets",
                   passing("scripts/nhm2_g2h_e_s5_c08_analytic_parameter_jets_runtime_audit.py")))
    checks.append(("predecessor_model_product",
                   passing("scripts/nhm2_g2h_e_s5_c08_analytic_model_product_runtime_audit.py")))
    checks.append(("predecessor_scalar_ledgers",
                   passing("scripts/nhm2_g2h_e_s5_c08_scalar_ledger_provider_runtime_audit.py")))

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
                (f"fixture_{ordinal}_14_of_14", payload.get("checks_passed") == 14
                 and payload.get("checks_total") == 14),
                (f"fixture_{ordinal}_paired_inventory", payload.get("p_models") == 2
                 and payload.get("pprime_models") == 2),
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
        "schema": "nhm2.g2h_e_s5.c08_p_ledgers_runtime_audit.v1",
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
