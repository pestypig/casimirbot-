#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-011a.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011a typed chronology and append-only controller
Current maturity: implemented candidate-neutral audit target
Target maturity: independently source/runtime-audited C08-011a slice
Required frozen inputs: acknowledged tail selector and audited C08-010
Required evidence: exact schedule, phase order, prefix reuse and failure mapping
Stop/fail criteria: drift, hidden retry, candidate access, root or authority
Explicit non-goals: witness construction, C08-012+, handler or execution
Downstream gate unlocked: C08-011b implementation only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-tail-split-chronology-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-tail-split-chronology-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-tail-split-chronology-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_split_chronology_v1.hpp":
        "a2584c6110b2fae66106ef3c9e34d93f595620c45f48f091f805fd4b1147d56c",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_split_chronology_v1.cpp":
        "a56ff2f1dbcfed21b56b80dfae59f79cd4900168bb7dbb92a1dc0e5a74d9f77d",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_split_chronology_fixture_v1.cpp":
        "d4897e257c025ccad0cd6c2779962a41ac436809e8d8d1ec09577ebc0966f88a",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-tail-split-chronology-fixture.v1":
        "22a3e114458fc42b4f88b923d2fdba86859ddff12d6134401e806f4be7e0db2c",
    "scripts/nhm2_g2h_e_s5_c08_convolution_selector_runtime_audit.py":
        "6855147ccd68be4cb8cc48ae9c63f8d9fbc2f6120ce2a6ef48a4ae4761822499",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
}
EXPECTED_EXECUTABLE = "9bc77bcb57b6cead428f92d7c5fcfed20cbd6ea410f8f8dfdbfa193c8cc91ebe"
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False,
                          capture_output=True, text=True)


def parse_report(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", digest(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    header = (G2H / "mini_boson_star_primary_c08_tail_split_chronology_v1.hpp").read_text(
        encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_tail_split_chronology_v1.cpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_tail_split_chronology_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("attempt_count_13", "kTailSplitAttemptCount = 13U" in header),
        ("onset_schedule_exact", all(token in header for token in (
            "{1U, 2U, 4U, 8U, 16U, 32U, 64U,",
            "128U, 256U, 512U, 1024U, 2048U, 4096U}"))),
        ("laplace_split_exact", "2U * attempt.t0" in source),
        ("digest_exact_32", "kDigestBytes = 32U" in header),
        ("ledger_bound_inherited", "kMaximumLedgerModels" in header
         and "primary_c08_convolution_ledger_v1::kMaximumLedgerModels" in header),
        ("all_early_reasons_typed", all(name in header for name in (
            "parameter_margin", "lyapunov_construction", "compact_box_lmi",
            "k1_selector", "k2_selector"))),
        ("all_late_reasons_typed", all(name in header for name in (
            "scalar_onset_constants", "weighted_edge_history",
            "realized_scalar_witness", "metric_forcing_witness",
            "record_inventory"))),
        ("finite_codes_006_to_010", all(name in header for name in (
            "c08_006_origin_series_order_exhaustion",
            "c08_007_positive_panel_denominator_or_coefficient",
            "c08_008_panel_defect_or_exact_zero_replay",
            "c08_009_picard_inflation_or_width_exhaustion",
            "c08_010_volterra_convolution_or_u_refinement_exhaustion"))),
        ("fixed_resource_origin_preserved",
         "fixed_resource_failure_at_originating_producer" in header),
        ("attempts_in_ordinal_order", "attempt.ordinal != index" in source),
        ("early_first_missing_order", source.index("parameter_margins_verified")
         < source.index("lyapunov_constructed")
         < source.index("compact_box_lmi_verified")
         < source.index("k1_verified") < source.index("k2_verified")),
        ("no_finite_before_early", "no_late_phase(attempt)" in source),
        ("finite_request_required", "!attempt.finite_continuation_requested" in source),
        ("finite_failure_terminal", "AttemptDisposition::finite_terminal_failure" in source
         and "index + 1U != input.attempt_count" in source),
        ("late_phase_ordered", "late_phase_ordered(attempt)" in source),
        ("complete_inventory_required", "record_inventory_complete" in source),
        ("first_pass_terminal", "AttemptDisposition::complete_pass" in source
         and "Outcome::selected" in source),
        ("true_exhaustion_only_at_13",
         "input.attempt_count == kTailSplitAttemptCount" in source),
        ("partial_distinct_from_exhaustion", "Outcome::incomplete_attempt_ledger" in source),
        ("fixed_exhaustion_code", "C08-011_TAIL_SPLIT_EXHAUSTION" in source),
        ("no_exhaustion_retune", "exhaustion_retuned = false" in source),
        ("ledger_count_never_shrinks",
         "attempt.ledger_models_after < attempt.ledger_models_before" in source),
        ("ledger_chain_count", "previous.ledger_models_after" in source),
        ("ledger_chain_digest", "previous.ledger_digest_after" in source),
        ("reused_prefix_digest_required", "attempt.reused_prefix_digest" in source),
        ("early_reject_no_extension", "attempt.ledger_models_after != attempt.ledger_models_before" in source),
        ("ordered_reasons_stored", "ordered_rejection_reasons.push_back" in source),
        ("final_digest_stored", "copy_digest(output->final_ledger_digest" in source),
        ("candidate_neutral_no_file_ingress", "fstream" not in source
         and "ifstream" not in source and "filesystem" not in source),
        ("candidate_identity_absent", "shat" not in source.lower()
         and "6/5" not in source),
        ("fixture_immediate_pass", "immediate_output.selected_t0 == 1U" in fixture),
        ("fixture_early_then_post_then_pass", "compact_box_lmi" in fixture
         and "weighted_edge_history" in fixture and "selected_t0 == 4U" in fixture),
        ("fixture_terminal_finite_failure",
         "finite_terminal_failure" in fixture
         and "c08_010_volterra_convolution_or_u_refinement_exhaustion" in fixture),
        ("fixture_true_exhaustion", "exhaustion_attempts" in fixture
         and "rejected_witnesses_recorded == 13U" in fixture),
        ("fixture_partial", "incomplete_attempt_ledger" in fixture
         and "attempts_validated == 12U" in fixture),
        ("fixture_determinism", "same_output(ordered_output, replay_output)" in fixture),
        ("fixture_schedule_corruption", "saved_t0" in fixture and "saved_t" in fixture),
        ("fixture_reason_corruption", "saved_reason" in fixture),
        ("fixture_finite_before_early", "finite_continuation_requested = true" in fixture),
        ("fixture_prefix_corruption", "ordered.reused[1U][0U] ^= 1U" in fixture),
        ("fixture_count_corruption", "saved_before" in fixture and "saved_after" in fixture),
        ("fixture_phase_corruption", "saved_history" in fixture),
        ("fixture_inventory_corruption", "saved_record" in fixture),
        ("fixture_after_terminal_corruption", "{4U, ordered.attempts.data()}" in fixture),
        ("fixture_missing_terminal_code", "finite_failure = chronology::FiniteFailureCode::none" in fixture),
        ("fixture_pointer_and_resource_guards", "kTailSplitAttemptCount + 1U" in fixture
         and "{1U, nullptr}" in fixture),
        ("fixture_zero_candidate_activity", "candidate_evaluations\\\":0" in fixture
         and "positive_parameter_samples\\\":0" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile_flags", "-fno-fast-math" in dockerfile
         and "-Werror" in dockerfile),
    ))

    predecessor = run([sys.executable,
        "scripts/nhm2_g2h_e_s5_c08_convolution_selector_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_010_predecessor_87_of_87", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 87
                   and predecessor_report.get("checks_total") == 87))

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
            executed = run(["docker", "run", "--rm", "--network", "none",
                            "--read-only", "--cap-drop", "ALL", "--security-opt",
                            "no-new-privileges", "--pids-limit", "64", IMAGE])
            report = parse_report(executed)
            reports.append(report)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_26_of_26", report.get("checks_passed") == 26
                 and report.get("checks_total") == 26),
                (f"fixture_{ordinal}_fixed_selected_t0", report.get("selected_t0") == 4),
                (f"fixture_{ordinal}_complete_exhaustion",
                 report.get("exhaustion_attempts") == 13),
                (f"fixture_{ordinal}_append_only",
                 report.get("append_only_prefix_reuse") is True),
                (f"fixture_{ordinal}_early_before_finite",
                 report.get("early_tail_before_finite") is True),
                (f"fixture_{ordinal}_zero_state_reads",
                 report.get("state_coefficients_read") == 0),
                (f"fixture_{ordinal}_candidate_inert",
                 report.get("candidate_evaluations") == 0
                 and report.get("positive_parameter_samples") == 0
                 and report.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 report.get("authority_promoted") is False
                 and report.get("scientific_handler_linked") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_26_of_26",
            "fixture_0_fixed_selected_t0", "fixture_0_complete_exhaustion",
            "fixture_0_append_only", "fixture_0_early_before_finite",
            "fixture_0_zero_state_reads", "fixture_0_candidate_inert",
            "fixture_0_authority_false", "fixture_1_exit_zero",
            "fixture_1_26_of_26", "fixture_1_fixed_selected_t0",
            "fixture_1_complete_exhaustion", "fixture_1_append_only",
            "fixture_1_early_before_finite", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_tail_split_chronology_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "predecessor_audit": predecessor_report,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authorization_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
