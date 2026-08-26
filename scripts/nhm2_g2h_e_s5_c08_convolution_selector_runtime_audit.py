#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-010d.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-010d fixed dyadic selector and integrated output
Current maturity: implemented candidate-neutral audit target
Target maturity: independently source/runtime-audited C08-010d slice
Required frozen inputs: acknowledged Borel definitions and audited C08-010c
Required evidence: fixed chronology, width rule, output, exhaustion and guards
Stop/fail criteria: drift, retune, candidate access, protected root or authority
Explicit non-goals: candidate execution, handler, C08-011+, Rust, G3 or lanes
Downstream gate unlocked: integrated C08-010 closure audit only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-convolution-selector-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-convolution-selector-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-convolution-selector-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.hpp":
        "48344536a2ec09c510c71c02c1cd62cdd82e6612f0412223e0735e99c9d9e45f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.cpp":
        "057ddf85b0aaf68f9ef2f538c07687a48c910b3f62c4355449e673df15b903a7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_fixture_v1.cpp":
        "0448473b451a4ff09f8ec47376eebab254cf1ba856182c5e08fc2b8e3480d628",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-convolution-selector-fixture.v1":
        "ebf9e3dca54802950c2d5e989b54a1c6af0b92c3d96a299e48a0749b2a01216a",
    "scripts/nhm2_g2h_e_s5_c08_convolution_jet_runtime_audit.py":
        "ff5f945cc6460cde88019044f41a66ff4096b9c83ab1fa1fcee45f35b8f0dc55",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
}
EXPECTED_EXECUTABLE = "d2e7e3178c038d808a4a19b4fc6b1914587d738f21bbe7d171eb98b6c106daed"
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

    header = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp").read_text(
        encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_convolution_selector_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("width_exponent_minus_180", "kNumericalWidthExponent = -180L" in header),
        ("candidate_count_17", "kUPanelCandidateCount = 17U" in header),
        ("candidate_schedule_exact", all(token in header for token in (
            "{1U, 2U, 4U, 8U, 16U, 32U, 64U, 128U, 256U,",
            "512U, 1024U, 2048U, 4096U, 8192U, 16384U, 32768U,",
            "65536U}"))),
        ("candidate_loop_increasing", "++candidate_index" in source
         and "kUPanelCandidates[candidate_index]" in source),
        ("subpanel_loop_increasing", "++ordinal" in source
         and "ordinal < panel_count" in source),
        ("dyadic_left_exact", "arb_set_ui(u_left" in source
         and "arb_mul_2exp_si(u_left" in source),
        ("dyadic_right_exact", "ordinal + 1U" in source
         and "arb_mul_2exp_si(u_right" in source),
        ("first_passing_policy", "if (passes[index])" in source
         and "selected_u_panels = kUPanelCandidates[index]" in source),
        ("partial_not_exhausted", "evaluated_count == kUPanelCandidateCount" in source),
        ("fixed_exhaustion_code",
         "C08-010_VOLTERRA_CONVOLUTION_OR_U_REFINEMENT_EXHAUSTION" in source),
        ("no_exhaustion_retune", "exhaustion_retuned = false" in source),
        ("boundary_only_ordinal_zero", "ordinal == 0U" in source
         and "zero_boundary.data()" in source),
        ("zero_boundary_exact", "arb_zero(&value)" in source),
        ("boundary_once_reported", "boundary_applied_once = true" in source),
        ("jet_predecessor_invoked", "jet::evaluate(jet_input" in source),
        ("all_coefficients_accumulated", "degree <= candidate.retained_order" in source
         and "jet_index < jet::kJetCount" in source
         and "panel.coefficient(degree, jet_index)" in source),
        ("all_remainders_accumulated", "panel.remainder(jet_index)" in source),
        ("direct_coverage_replayed", "f_coverage.direct_intersecting_ordinals" in source),
        ("reflected_coverage_replayed",
         "g_coverage.reflected_intersecting_ordinals" in source),
        ("coverage_offsets_stored", "direct_coverage_offsets.push_back" in source
         and "reflected_coverage_offsets.push_back" in source),
        ("target_geometry_stored", "target_left" in header and "target_right" in header
         and "target_center" in header and "target_half_width" in header),
        ("selected_p_stored", "selected_u_panels" in header),
        ("complete_coefficient_output", "retained_xi_coefficients" in header),
        ("complete_remainder_output", "uniform_remainder_bounds" in header),
        ("coefficient_margins_stored", "coefficient_width_margins" in header),
        ("remainder_margins_stored", "remainder_width_margins" in header),
        ("radius_extracted", "arb_get_rad_arb(radius, value)" in source),
        ("magnitude_upper_directed", "arb_get_ubound_arf" in source),
        ("scale_max_one", "if (arb_lt(scale, one)) arb_one(scale)" in source),
        ("fixed_width_threshold",
         "arb_mul_2exp_si(threshold, scale, kNumericalWidthExponent)" in source),
        ("width_inequality", "arb_le(radius, threshold)" in source),
        ("coefficient_width_checked", "output.coefficient_margin" in source),
        ("remainder_width_checked", "output.remainder_margin" in source),
        ("failed_candidate_not_published", "Output candidate" in source
         and "copy_output(candidate, *output)" in source),
        ("failed_output_reset", "reset(*output)" in source),
        ("nonfinite_fail_detail", "FailureDetail::nonfinite_accumulation" in source),
        ("no_signed_remainder_cancellation",
         "signed_remainder_cancellation_used = false" in source),
        ("no_midpoint_or_sampling", "midpoint_selection_used = false" in source
         and "point_sampling_used = false" in source and "arb_get_mid" not in source),
        ("candidate_neutral_no_file_ingress", "fstream" not in source
         and "ifstream" not in source and "filesystem" not in source),
        ("candidate_identity_absent", "shat" not in source.lower()
         and "6/5" not in source),
        ("fixture_symbolic_replay", "first_exact" in fixture
         and "second_exact" in fixture),
        ("fixture_complete_width_count", "338U" in fixture),
        ("fixture_coverage_ledgers", "direct_coverage_offsets" in fixture
         and "reflected_coverage_offsets" in fixture),
        ("fixture_schedule_doubling", "doubled" in fixture),
        ("fixture_first_pass_policy", "policy[3U] = true" in fixture
         and "selected_u_panels == 8U" in fixture),
        ("fixture_resource_exhaustion", "exhausted.exhausted" in fixture
         and "candidates_visited == 17U" in fixture),
        ("fixture_partial_chronology", "partial.exhausted" in fixture
         and "candidates_visited == 16U" in fixture),
        ("fixture_determinism", "same_output(output, replay)" in fixture),
        ("fixture_corruption_matrix", "short_boundary" in fixture
         and "null_boundary" in fixture and "arb_indeterminate" in fixture
         and "f_models[2U].left_endpoint" in fixture and "bad_order" in fixture),
        ("fixture_missing_output_and_result", "missing_output" in fixture
         and "&output, nullptr" in fixture),
        ("fixture_zero_candidate_activity", "candidate_evaluations\\\":0" in fixture
         and "positive_parameter_samples\\\":0" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile_flags", "-fno-fast-math" in dockerfile
         and "-Werror" in dockerfile),
    ))

    predecessor = run([sys.executable,
                       "scripts/nhm2_g2h_e_s5_c08_convolution_jet_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_010c_predecessor_62_of_62", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 62
                   and predecessor_report.get("checks_total") == 62))

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
                (f"fixture_{ordinal}_23_of_23", report.get("checks_passed") == 23
                 and report.get("checks_total") == 23),
                (f"fixture_{ordinal}_first_passing_p1",
                 report.get("selected_u_panels") == 1),
                (f"fixture_{ordinal}_complete_jet_terms",
                 report.get("elementary_convolutions") == 43),
                (f"fixture_{ordinal}_complete_width_checks",
                 report.get("numerical_width_checks") == 338),
                (f"fixture_{ordinal}_boundary_once",
                 report.get("boundary_applied_once") is True),
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
            "fixture_0_exit_zero", "fixture_0_23_of_23",
            "fixture_0_first_passing_p1", "fixture_0_complete_jet_terms",
            "fixture_0_complete_width_checks", "fixture_0_boundary_once",
            "fixture_0_zero_state_reads", "fixture_0_candidate_inert",
            "fixture_0_authority_false", "fixture_1_exit_zero",
            "fixture_1_23_of_23", "fixture_1_first_passing_p1",
            "fixture_1_complete_jet_terms", "fixture_1_complete_width_checks",
            "fixture_1_boundary_once", "fixture_1_zero_state_reads",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_convolution_selector_runtime_audit.v1",
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
