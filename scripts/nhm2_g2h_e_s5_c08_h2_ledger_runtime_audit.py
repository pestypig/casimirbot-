#!/usr/bin/env python3
"""Independent audit for the candidate-neutral C08 H2 ledger producer.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: H2=B diamond B append-only ledger
Current maturity: implemented candidate-neutral audit target
Target maturity: independently audited H2 prerequisite for metric histories
Required frozen inputs: coherent B,V,J1,J2 ledgers and C08-010 selector
Required evidence: full-order typed fixture, prefix locking, terminal replay
Stop/fail criteria: swapped orientation, partial commit, sampling, roots or authority
Explicit non-goals: selected-member evaluation, complete C08 or claim promotion
Downstream gate unlocked: P2 parent acknowledgement and history integration only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-h2-ledger-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-ledger-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-ledger-fixture-v1"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.hpp":
        "55ef49529b8f9fdd4625e3844476503d85ebb4acf3a637275d8c78568df0cdb8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.cpp":
        "cbfcae5357d7b7b6f80a6f28199088b3c49d58c9a8a6eab1647e3e4bf8135d7f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_fixture_v1.cpp":
        "b6e90509525c610a5c124580bfe418ad65281ed9595c4064395ba4780e111d9d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-ledger-fixture.v1":
        "7b4f316d598b76e462ed650573b3ab58f35e5772002b50d90250050f3ee40cd0",
}
EXPECTED_EXECUTABLE = "568d27b6dc1d32ea418b1bd8dcd1a5fab23f6d2a1037b2fef36f5fb66ff58107"
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
    header = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_ledger_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("complete_scalar_inventory", "kScalarStateCount = 4U" in header
         and "scalar_ledger_identities{};  // B,V,J1,J2" in header),
        ("all_four_ledgers_validated", "valid_scalar_ledger((*scalar)[state]->ledger)" in source),
        ("coherent_geometry_all_four", "same_geometry(reference" in source
         and "state = 1U; state < kScalarStateCount" in source),
        ("exact_orientation", "H2 = B diamond B" in header
         and "const auto *b = scalar[0]" in source
         and "const auto *v = scalar[1]" in source),
        ("complete_boundary_inventory", "std::array<arb_struct, kJetCount> b_at_zero" in source
         and "impl.b_at_zero.data()" in source),
        ("ordered_selector_input", "const ledger::LedgerView b_prefix" in source
         and "const ledger::LedgerView v_prefix" in source
         and "selector::Input selector_input{b_prefix, v_prefix" in source),
        ("full_source_prefix_lock", "scalar_source_digests" in source
         and "state = 0U; state < kScalarStateCount" in source
         and "digest != impl.scalar_source_digests[state][ordinal]" in source),
        ("exact_left_translation", "fmpz_bin_uiui" in source
         and "arb_pow_ui(power, delta" in source
         and "centered_to_left_exact_binomial = true" in source),
        ("translated_remainder_preserved", "arb_add_error(model->remainders.data()" in source),
        ("pending_validation_before_commit", source.index("validate_with_pending(impl.models, *translated)")
         < source.index("impl.models.push_back(std::move(translated))")),
        ("stable_owned_publications", "std::vector<std::unique_ptr<OwnedModel>> models" in source
         and "std::vector<std::unique_ptr<Publication>> publications" in source),
        ("fixed_resource_bound", "ledger::kMaximumLedgerModels" in source),
        ("terminal_first_failure", "impl.terminal_failure = true" in source
         and "terminal_failure_already_recorded" in source),
        ("fixture_unused_sources_bound", "mutable_j1_prefix" in fixture
         and "mutable_j2_remainder" in fixture),
        ("fixture_terminal_replay", "terminal_failure_already_recorded" in fixture
         and "first_failure_terminal" in fixture),
        ("fixture_full_orders", "h2_before.models[0].order == 128U" in fixture
         and "h2_after.models[1].kind" in fixture),
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
    checks.append(("predecessor_selector",
                   passing("scripts/nhm2_g2h_e_s5_c08_convolution_selector_runtime_audit.py")))
    checks.append(("predecessor_scalar_ledgers",
                   passing("scripts/nhm2_g2h_e_s5_c08_scalar_ledger_provider_runtime_audit.py")))

    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    report: dict[str, object] = {}
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
        process = run(["docker", "run", "--rm", "--network", "none",
                       "--read-only", "--cap-drop", "ALL", "--security-opt",
                       "no-new-privileges", "--pids-limit", "64", IMAGE])
        report = parse(process)
        checks.extend((
            ("fixture_exit_zero", process.returncode == 0),
            ("fixture_typed_pass_record",
             report.get("schema") == "nhm2.g2h_e_s5.c08_h2_ledger_fixture.v1"
             and report.get("status") == "PASS"),
            ("fixture_19_of_19", report.get("checks_passed") == 19
             and report.get("checks_total") == 19),
            ("fixture_two_model_inventory", report.get("h2_models") == 2
             and report.get("origin_order") == 128),
            ("fixture_c08_010_passed", report.get("h2_c08_010_passed") is True),
            ("fixture_candidate_inert", report.get("candidate_evaluations") == 0
             and report.get("positive_parameter_samples") == 0
             and report.get("candidate_roots_created") is False),
            ("fixture_authority_false", report.get("scientific_handler_linked") is False
             and report.get("authority_promoted") is False),
        ))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failed = [name for name, ok in checks if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_ledger_runtime_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks), "failed": failed,
        "image_id": image_id, "executable_sha256": executable_hash,
        "fixture_report": report,
        "candidate_evaluations": 0, "positive_parameter_samples": 0,
        "candidate_roots_created": False, "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, separators=(",", ":"), sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
