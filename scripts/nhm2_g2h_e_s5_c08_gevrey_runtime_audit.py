#!/usr/bin/env python3
"""Independent source/runtime audit for candidate-neutral C08-005."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-gevrey-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-gevrey-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-gevrey-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_gevrey_v1.hpp":
        "113d888e9cad84bc1a36cf653ea840781b34200d56f97594fdcc526a296dc2cd",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_gevrey_v1.cpp":
        "f81c02d58366362b62860d482eea8802359057513bb02d5258df71bd643aad7b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_gevrey_fixture_v1.cpp":
        "6e1af9c1d46a6561665b01a73a38981ddc6def9269b70d041d20f57f74b227ca",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-gevrey-fixture.v1":
        "b3224d5c426f94ef5c561d2868eedaf01673b7bfd7214b8539561f41153e9c6b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_margins_v1.hpp":
        "ab68946c846a89b56f5aa00179cc3531084ff04d1ef85215d8e1248d355de2f5",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_margins_v1.cpp":
        "9732f50149d60f0ef45c9a1647cbf6b6ad9565e62bd77b502c8de9d23c312d6b",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-state-jet-system.v1.json":
        "75eff0131c357480c938e466fe6338793fbdb980dc41cf7f3218a6f5acb6cffc",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt":
        "8fb6486066bcb44b361e7d37df44c7549713cfde03b0038d09548c511fb01bd9",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-decision.v1.json":
        "67d438ccaa7b8600afac21ceda8faacd6802d2f8dae6d47c8ea2507a0ed10932",
}

EXPECTED_EXECUTABLE = "83f4d833e68bc9b253d7df235cc56fa62d4c05177d76672490353640aaec36b0"

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

    source = (G2H / "mini_boson_star_primary_c08_gevrey_v1.cpp").read_text(
        encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_gevrey_v1.hpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_gevrey_fixture_v1.cpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in source),
        ("frozen_13_component_order", "kJetCount = 13U" in header
         and "return 4U + kParameterCount * a + b" in source),
        ("full_ordered_second_product", all(token in source for token in (
            "left.values + index", "left.values + first_index(a)",
            "right.values + first_index(b)", "left.values + first_index(b)",
            "right.values + first_index(a)", "right.values + index"))),
        ("alias_safe_jet_product", "Jet product;" in source
         and "jet_set(target, product)" in source),
        ("reciprocal_value_guard", "arb_contains_zero(source.values + value_index)"
         in source),
        ("positive_vacuum_theta2_chain", "arb_one(mu.values + first_index(2U))"
         in source and "arb_set(mu.values + first_index(2U), input.margins.eta)"
         in source),
        ("three_exact_scalar_recurrence_lags", all(token in source for token in (
            "jet_set(polynomial[0][0], one)",
            "jet_scale_si(polynomial[1][0], mu, -4L)",
            "jet_scale_si(polynomial[2][0], mu2, 4L)"))),
        ("matrix_normal_form_inventory", all(token in header for token in (
            "arb_struct a2", "arb_struct a1", "arb_struct a0",
            "kLagCount", "kMatrixEntries"))),
        ("matrix_product_rule", "fill_multiplication_matrix" in source
         and "matrix_index(row, first_index(b))" in source
         and "matrix_index(row, first_index(a))" in source),
        ("directed_magnitude_not_midpoint", "arb_get_ubound_arf" in source
         and "arb_get_mid_arf" not in source and "arb_midref(" not in source),
        ("row_sum_majorants", "upper_magnitude(magnitude, coefficient)" in source
         and "arb_gt(row_sum, output.gevrey_majorants + lag)" in source),
        ("ascending_dyadic_rate_selector",
         "exponent <= kMaximumRateExponent; ++exponent" in source
         and "arb_mul_2exp_si(output.selected_rate" in source
         and "if (arb_le(sum, half))" in source),
        ("rate_cap_1024", "kMaximumRateExponent = 1024U" in header
         and "rate_attempts == 1025U" in fixture),
        ("base_indices_0_1_2", "Jet states[3]" in source
         and "for (unsigned n = 0U; n < 2U; ++n)" in source
         and "if (base == 2U) arb_mul_2exp_si" in source),
        ("reference_positive_majorants", all(token in fixture for token in (
            "311L, 8L", "755L, 8L", "5297L, 64L"))),
        ("reference_vacuum_majorants", all(token in fixture for token in (
            "289L, 8L", "593L, 8L", "2103L, 64L"))),
        ("mixed_orientation_fixture", "mixed_orientations" in fixture
         and "matrix_index(5U, value)" in fixture
         and "matrix_index(7U, value)" in fixture),
        ("compact_box_fixture", "compact_box" in fixture
         and "arb_add_error_2exp_si" in fixture),
        ("rate_exhaustion_fixture", "tiny_kappa" in fixture
         and "-2000L" in fixture
         and "FailureDetail::rate_exhaustion" in fixture),
        ("predecessor_gate_before_output",
         source.find("primary_c08_margins_v1::evaluate")
         < source.find("if (output == nullptr)")),
        ("no_state_or_file_ingress", "state_storage" not in source
         and "fstream" not in source and "ifstream" not in source
         and "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "no state-vector read" in header
         and "parameter sampling" in header
         and "candidate-neutral" in header and "evaluation." in header),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
    ))

    acknowledgement = run([
        sys.executable, "scripts/nhm2_g2h_e_s5_borel_acknowledgement_gate.py",
        "--statement-file",
        "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-definition-replacement-acknowledgement-statement.txt",
    ])
    acknowledgement_report = parse_report(acknowledgement)
    checks.append(("parent_acknowledgement_valid", acknowledgement.returncode == 0
                   and acknowledgement_report.get("status") == "ACKNOWLEDGEMENT_VALID"
                   and acknowledgement_report.get("authorization_created") is False
                   and acknowledgement_report.get("authority_promoted") is False))
    exact = run([sys.executable, "scripts/nhm2_g2h_e_s5_formal_germ_growth_audit.py"])
    exact_report = parse_report(exact)
    checks.append(("parent_exact_64_of_64", exact.returncode == 0
                   and exact_report.get("checks_passed") == 64
                   and exact_report.get("checks_total") == 64))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs"])
    replay_report = parse_report(replay)
    checks.append(("parent_replay_27_of_27", replay.returncode == 0
                   and replay_report.get("checks_passed") == 27
                   and replay_report.get("checks_total") == 27))
    predecessor = run([sys.executable,
                       "scripts/nhm2_g2h_e_s5_c08_margins_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_004_predecessor_45_of_45", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 45
                   and predecessor_report.get("checks_total") == 45))

    built = run(["docker", "build", "--quiet", "--file", str(DOCKERFILE),
                 "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("local_image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                          IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        for ordinal in range(2):
            executed = run(["docker", "run", "--rm", "--network", "none",
                            "--read-only", "--cap-drop", "ALL", "--security-opt",
                            "no-new-privileges", IMAGE])
            report = parse_report(executed)
            reports.append(report)
            checks.extend((
                (f"fixture_{ordinal}_exit_zero", executed.returncode == 0),
                (f"fixture_{ordinal}_24_of_24", report.get("checks_passed") == 24
                 and report.get("checks_total") == 24),
                (f"fixture_{ordinal}_no_midpoint",
                 report.get("midpoint_acceptance_used") is False),
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
        checks.extend((
            ("local_image_identity_recorded", False), ("executable_identity", False),
            ("fixture_0_exit_zero", False), ("fixture_0_24_of_24", False),
            ("fixture_0_no_midpoint", False), ("fixture_0_zero_state_reads", False),
            ("fixture_0_candidate_inert", False), ("fixture_0_authority_false", False),
            ("fixture_1_exit_zero", False), ("fixture_1_24_of_24", False),
            ("fixture_1_no_midpoint", False), ("fixture_1_zero_state_reads", False),
            ("fixture_1_candidate_inert", False), ("fixture_1_authority_false", False),
            ("deterministic_fixture_report", False),
        ))

    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_gevrey_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "parent_acknowledgement": acknowledgement_report,
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
