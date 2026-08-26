#!/usr/bin/env python3
"""Independent audit for the candidate-neutral C08 scalar ledger provider.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c4 append-only C08-006..009 scalar provider
Current maturity: implemented candidate-neutral audit target; C08-010 unbound
Target maturity: independently audited scalar prerequisite for full C08-011c
Required frozen inputs: audited origin models and arbitrary-left successor panel
Required evidence: stable publications, atomic four-ledger append, terminal first failure
Stop/fail criteria: prefix mutation, retry, C08-010 false promotion, sampling, roots or authority
Explicit non-goals: complete C08-011c callback, convolution inventory or candidate execution
Downstream gate unlocked: convolution/analytic ledger recipe and callback integration only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-scalar-ledger-provider-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-scalar-ledger-provider-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-scalar-ledger-provider-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp":
        "95f8f579fdc102424f022435e2d1a0b4387e50e926afb49bc1c46a44ccad606b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_scalar_ledger_provider_v1.cpp":
        "832616b3db638b5b46a744b09f18503ab57ad62820a8d050cdb318abfd4b8da2",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_scalar_ledger_provider_fixture_v1.cpp":
        "3b3e20f2077566372252f34faeb38be775ad0aeeb453bd5a688266e78254d86f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-scalar-ledger-provider-fixture.v1":
        "bb227254583d4a91c6b5dc2c996129b4abc3dd3c969bd215255a526e6895269d",
}
EXPECTED_EXECUTABLE = "bab4a3a8feb4a67e0d32a552bf5357d19f9c0be52f87caf9a6893104f11048f1"
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
    header = (G2H / "mini_boson_star_primary_c08_scalar_ledger_provider_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_scalar_ledger_provider_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_scalar_ledger_provider_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("four_unique_identities", "std::set<std::uint32_t> identities" in source
         and "identities.insert(identity).second" in source),
        ("origin_models_only_initially", "copy_origin_model" in source
         and "models_after_per_ledger = 1U" in source),
        ("stable_owned_models", "std::vector<std::unique_ptr<OwnedModel>>" in source),
        ("immutable_publication_objects", "std::vector<std::unique_ptr<Publication>>" in source
         and "publications.push_back" in source),
        ("all_52_left_boxes", "std::array<arb_struct, kStateCount * kJetCount> left_boxes" in source
         and "impl.left_boxes.size()" in source),
        ("successor_exact_target", "impl.current_right, impl.left_boxes.size()" in source
         and "impl.left_boxes.data(), target" in source),
        ("four_models_pending_before_append", "std::array<std::unique_ptr<OwnedModel>, kStateCount> pending" in source),
        ("endpoint_before_commit", source.index("endpoint_boxes(next_boxes.data()")
         < source.index("impl.models[state].push_back(std::move(pending[state]))")),
        ("positive_model_copy_complete", "source.polynomial.at(degree, state, jet)" in source
         and "source.enclosure.remainder(state, jet)" in source),
        ("exact_shared_faces", "source.polynomial.left_endpoint" in source
         and "source.polynomial.right_endpoint" in source),
        ("resource_cap", "ledger::kMaximumLedgerModels" in source),
        ("typed_006_009_mapping", all(token in source for token in (
            "c08_006_origin_series_order_exhaustion",
            "c08_007_positive_panel_denominator_or_coefficient",
            "c08_008_panel_defect_or_exact_zero_replay",
            "c08_009_picard_inflation_or_width_exhaustion"))),
        ("first_failure_stored", "impl.terminal_failure = true" in source
         and "impl.terminal_code" in source),
        ("retry_refused", "terminal_failure_already_recorded" in source),
        ("c08_010_explicit_false", "result->c08_010_passed = false" in source
         and "not yet a valid C08-011c1 callback" in header),
        ("no_midpoint_cancellation_retune", "retry_or_retune_used = false" in source
         and "signed_remainder_cancellation_used = false" in source
         and "midpoint_acceptance_used = false" in source),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("fixture_prefix_byte_values", "same_prefix(before, after)" in fixture
         and "arb_equal(a.coefficients + i" in fixture),
        ("fixture_all_ledgers_validated", "ledger::evaluate(ledger_input" in fixture),
        ("fixture_terminal_replay", "terminal_failure_already_recorded" in fixture),
        ("fixture_determinism", "replay_context" in fixture
         and "deterministic" in fixture),
        ("fixture_c08_010_false", "c08_010_passed\\\":false" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))
    checks.append(("predecessor_origin_models",
                   passing("scripts/nhm2_g2h_e_s5_c08_origin_models_runtime_audit.py")))
    checks.append(("predecessor_successor_panel",
                   passing("scripts/nhm2_g2h_e_s5_c08_successor_panel_runtime_audit.py")))

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
                (f"fixture_{ordinal}_17_of_17", payload.get("checks_passed") == 17
                 and payload.get("checks_total") == 17),
                (f"fixture_{ordinal}_inventory", payload.get("panels_appended") == 2
                 and payload.get("models_per_ledger") == 3
                 and payload.get("endpoint_boxes") == 104),
                (f"fixture_{ordinal}_c08_010_false", payload.get("c08_010_passed") is False),
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
            "fixture_0_exit_zero", "fixture_0_17_of_17", "fixture_0_inventory",
            "fixture_0_c08_010_false", "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_17_of_17", "fixture_1_inventory",
            "fixture_1_c08_010_false", "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failed = [name for name, ok in checks if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_scalar_ledger_provider_runtime_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks), "failed": failed,
        "image_id": image_id, "executable_sha256": executable_hash,
        "c08_010_passed": False, "candidate_evaluations": 0,
        "positive_parameter_samples": 0, "candidate_roots_created": False,
        "scientific_handler_linked": False, "authority_promoted": False,
    }
    print(json.dumps(payload, separators=(",", ":"), sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
