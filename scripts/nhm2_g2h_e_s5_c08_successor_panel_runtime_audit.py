#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-011c2.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c2 arbitrary-left successor panel
Current maturity: implemented candidate-neutral single-panel audit target
Target maturity: independently audited without claiming complete C08-011c
Required frozen inputs: audited C08-006..009 definitions and fixed selector schedules
Required evidence: arbitrary-left p0 replay, full interval selector chronology, deterministic fixture
Stop/fail criteria: origin p0 reuse, premature selector failure, sampling, roots or authority
Explicit non-goals: full finite continuation, candidate execution, handler, token or authority
Downstream gate unlocked: origin-model exposure and C08-011c finite provider integration
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-successor-panel-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-successor-panel-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-successor-panel-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_successor_panel_v1.hpp":
        "85c35365b23e52cff8b9fcd6e989cbd0b9b6e505b7d2dc99140498da9932eca8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_successor_panel_v1.cpp":
        "936defb305c71d363f972b845bd15becf78d56826a79bf4458db95859b26aa25",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_successor_panel_fixture_v1.cpp":
        "e86b92465fdd3638da29fec702892ad6f4f15b63b7df4c6628522cd98cde9b55",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-successor-panel-fixture.v1":
        "96f0e3479f46e6f18d4eba00ea4a91e8dc39183d8479d21126df7b3f60b69eff",
}
EXPECTED_EXECUTABLE = "7fdade46a12c018a88ce05edc7c455d4cadc5dd80e1b284f7ad30cdc030c1fc7"
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


def report(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def passing_audit(path: str) -> bool:
    process = run([sys.executable, path])
    payload = report(process)
    return (process.returncode == 0 and payload.get("status") == "PASS"
            and payload.get("checks_passed") == payload.get("checks_total"))


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", digest(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))

    header = (G2H / "mini_boson_star_primary_c08_successor_panel_v1.hpp").read_text(
        encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_successor_panel_v1.cpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_successor_panel_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in header),
        ("four_states_thirteen_jets", "kStateCount * kJetCount" in header
         and "kLeftStateBoxCount" in header),
        ("arbitrary_exact_positive_left", all(token in source for token in (
            "arb_is_exact(context.left_endpoint)",
            "arb_is_positive(context.left_endpoint)",
            "arb_lt(context.left_endpoint, input.target_endpoint)"))),
        ("all_52_left_boxes_admitted", "context.left_state_box_count != kStateCount * kJetCount" in source
         and "state * kJetCount + jet" in source),
        ("successor_p0_from_caller", "arb_set(output.at(0U, state, jet), value)" in source),
        ("origin_p0_not_reused", "origin.enclosed_values" not in source),
        ("same_equation_polynomials", "build_equation_polynomials" in source),
        ("same_exact_recurrence", "generate_successor_coefficients" in source
         and "jet_div(next, rhs, denominator)" in source),
        ("fixed_order_schedule_reused", "for (const unsigned order : raw_picard::kOrders)" in source),
        ("fixed_halving_schedule_reused", "halving <= raw_picard::kMaximumPanelHalvings" in source),
        ("fixed_inflation_schedule_reused", "exponent <= raw_picard::kMaximumInflationExponent" in source),
        ("panel_failure_continues", "if (!raw_panel::evaluate_successor_injected(" in source
         and "panel_input, &panel_output, &panel_result))\n                continue;" in source),
        ("defect_failure_continues", "if (!primary_c08_panel_defect_v1::evaluate_successor_injected(" in source
         and "defect_input, &defect_output, &defect_result))\n                continue;" in source),
        ("inflation_failure_continues", "if (!raw_picard::try_inflation(" in source
         and "output->enclosure, &strict_checks, &width_checks))\n                    continue;" in source),
        ("first_pass_returns", source.count("return FailureDetail::none;") >= 2),
        ("exhaustion_typed_by_stage", all(token in source for token in (
            "if (!any_panel)", "if (!any_defect)",
            "picard_inflation_or_width_exhaustion"))),
        ("accepted_panel_replayed", "accepted_panel_input" in source
         and "panel_replayed" in source),
        ("left_state_byte_value_replay", "replay_left_state" in source
         and "arb_equal(output.at(0U, state, jet)" in source
         and "input.left_state_boxes + state * kJetCount + jet" in source),
        ("thread_context_cleared_success", "raw_panel::g_successor_context = nullptr;" in source),
        ("no_midpoint_or_signed_cancellation", "midpoint_acceptance_used = false" in source
         and "signed_cancellation_used = false" in source),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("fixture_three_successor_panels", all(token in fixture for token in (
            "first_accepted", "second_accepted", "third_result"))),
        ("fixture_p0_replay", "p0_equal" in fixture),
        ("fixture_selector_skip_chronology", "order_attempts == 36U" in fixture
         and "panel_halving_attempts == 6U" in fixture),
        ("fixture_corruption_guards", all(token in fixture for token in (
            "wrong_count", "nonfinite", "invalid_left", "blocked_predecessor"))),
        ("fixture_determinism", "deterministic_accept_a" in fixture
         and "deterministic_accept_b" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_gmp_mpfr_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))

    predecessors = (
        "scripts/nhm2_g2h_e_s5_c08_origin_series_runtime_audit.py",
        "scripts/nhm2_g2h_e_s5_c08_positive_panel_runtime_audit.py",
        "scripts/nhm2_g2h_e_s5_c08_panel_defect_runtime_audit.py",
        "scripts/nhm2_g2h_e_s5_c08_picard_runtime_audit.py",
    )
    checks.extend((f"predecessor:{path}", passing_audit(path))
                  for path in predecessors)

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
            payload = report(executed)
            reports.append(payload)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_17_of_17", payload.get("checks_passed") == 17
                 and payload.get("checks_total") == 17),
                (f"fixture_{ordinal}_fixed_selection",
                 payload.get("accepted_order") == 24
                 and payload.get("accepted_halvings") == 5
                 and payload.get("accepted_inflation") == 2),
                (f"fixture_{ordinal}_all_left_boxes", payload.get("left_state_boxes") == 52),
                (f"fixture_{ordinal}_candidate_inert",
                 payload.get("candidate_evaluations") == 0
                 and payload.get("positive_parameter_samples") == 0
                 and payload.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 payload.get("scientific_handler_linked") is False
                 and payload.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_17_of_17", "fixture_0_fixed_selection",
            "fixture_0_all_left_boxes", "fixture_0_candidate_inert", "fixture_0_authority_false",
            "fixture_1_exit_zero", "fixture_1_17_of_17", "fixture_1_fixed_selection",
            "fixture_1_all_left_boxes", "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))

    failed = [name for name, passed in checks if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_successor_panel_runtime_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, separators=(",", ":"), sort_keys=True))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
