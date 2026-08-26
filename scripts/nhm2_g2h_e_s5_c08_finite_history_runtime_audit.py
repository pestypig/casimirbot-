#!/usr/bin/env python3
"""Independent source/runtime audit for partial candidate-neutral C08-011c.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08-011c1 append-only admission and onset/history kernel
Current maturity: implemented candidate-neutral audit target; actual successor-panel provider absent
Target maturity: independently audited partial kernel without claiming complete C08-011c
Required frozen inputs: acknowledged Borel definition, audited C08-010 ledger and C08-011b witness
Required evidence: exact prefix bytes/digests, onset P-norms, weighted panel contributions
Stop/fail criteria: changed schedule, prefix mutation, cancellation, sampling, roots or authority
Explicit non-goals: arbitrary-left-endpoint finite continuation, C08-011c completion, handler or execution
Downstream gate unlocked: only the versioned successor-panel continuation implementation
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-finite-history-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-finite-history-fixture.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-finite-history-fixture-v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_finite_history_v1.hpp":
        "542def46fc4be14bef0bd08f898756a2a0ffd24e3c69dd6fc6e7bd7de37d8abf",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_finite_history_v1.cpp":
        "4046b63af437d24d5337e6c95cb9f6b95f55f6a8911c32071f9d906418886bb2",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_finite_history_fixture_v1.cpp":
        "c428d5adb39ae89bec6da37f307b1c2bce1735208a09b7dee73796678e889204",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-finite-history-fixture.v1":
        "fe140761f19f193cb901a6bda969db4e17977fe1979a170f8195ae891c2661fe",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.hpp":
        "68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_ledger_v1.cpp":
        "6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_lyapunov_v1.hpp":
        "63d6f1b9353770b673f0e80e8af244a6f3e27917376c97b801748319282af473",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_tail_lyapunov_v1.cpp":
        "a1bf7f1d7da7bc7cf960b7a8c2e2dec2a5d9ee660b7eeaf5d245a50a043ab9a0",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
}
EXPECTED_EXECUTABLE = "aac2bbd82942704ed6450bbd11ae1a7f5912b35b86f299324d0eae2358ca20f9"
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

    header = (G2H / "mini_boson_star_primary_c08_finite_history_v1.hpp").read_text(
        encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_finite_history_v1.cpp").read_text(
        encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_finite_history_fixture_v1.cpp").read_text(
        encoding="utf-8")
    ledger_source = (G2H / "mini_boson_star_primary_c08_convolution_ledger_v1.cpp").read_text(
        encoding="utf-8")
    panel_header = (G2H / "mini_boson_star_primary_c08_positive_panel_v1.hpp").read_text(
        encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("precision_512", "kPrecisionBits = 512" in header),
        ("state_count_four", "kStateCount = 4U" in header),
        ("jet_count_thirteen", "kJetCount = ledger::kJetCount" in header),
        ("tail_witness_onset_bound", "tail_witness_t0" in header
         and "input.tail_witness_t0 != input.t0" in source),
        ("fixed_onset_schedule", "kOnsets = chronology::kTailWitnessOnsets" in source),
        ("exact_double_split", "terminal_t == 2U * t0" in source),
        ("accepted_011b_before_provider", source.index("input.tail_result->accepted")
         < source.index("input.continuation_provider(")),
        ("provider_receives_t0_and_t", "input.t0, input.terminal_t, input.accepted_before" in source),
        ("all_finite_predecessors_required", all(token in source for token in (
            "response.c08_006_passed", "response.c08_007_passed",
            "response.c08_008_passed", "response.c08_009_passed",
            "response.c08_010_passed"))),
        ("typed_finite_failure", "propagated_finite_failure" in header
         and "FiniteFailureCode::none" in source
         and "FailureDetail::finite_producer_failure" in source),
        ("canonical_arb_bytes", "arb_dump_str" in source
         and "flint_free(dump)" in source),
        ("domain_separated_ledger_digest",
         "nhm2-g2h-e-s5/c08-011c-ledger/v1\\n" in source
         and "sha256_v1::text(bytes)" in source),
        ("complete_model_serialization", all(token in source for token in (
            "model.ordinal", "model.kind", "model.order",
            "model.coefficient_count", "model.remainder_count",
            "model.left_endpoint", "model.right_endpoint",
            "model.expansion_center", "model.coefficients + i",
            "model.remainders + i"))),
        ("ordered_unique_ledger_ids", "tagged.identity <= prior" in source),
        ("model_count_nonshrink", "after.ledger.model_count < before.ledger.model_count" in source),
        ("byte_exact_prefix_comparison", "prefix_bytes != before_bytes" in source),
        ("all_three_digests_recorded", all(token in header for token in (
            "ledger_digest_before", "reused_prefix_digest", "ledger_digest_after"))),
        ("terminal_coverage_replayed", "ledger::evaluate(input, &coverage, &result)" in source
         and "input.terminal_t" in source),
        ("ledger_exact_faces", "arb_equal(model.left_endpoint" in ledger_source),
        ("four_unique_scalar_ledgers", "std::set<std::uint32_t> identities" in source
         and "!identities.insert(identity).second" in source),
        ("closed_face_onset_hulling", "arb_le(model.left_endpoint, point)" in source
         and "arb_le(point, model.right_endpoint)" in source
         and "arb_union(value, value, candidate" in source),
        ("complete_taylor_onset", "degree <= model.order" in source
         and "model.remainders + jet" in source),
        ("p_norm_all_16_terms", "fmpq_mat_entry(input.tail_witness->p_lyap" in source
         and "arb_mul(term, term, yj" in source),
        ("directed_norm_upper", "arb_get_ubound_arf" in source
         and "arb_sqrt(root, sum" in source),
        ("c0o_c1o_c2o_ranges", all(token in source for token in (
            "output->c0o", "jet <= 3U", "output->c2o", "jet < kJetCount"))),
        ("history_orientation_unique", "std::set<std::uint32_t> orientations" in source
         and "orientations.insert(item.orientation)" in source),
        ("sigma_zero_or_strict_positive", "arb_is_zero(item.sigma) || arb_is_positive(item.sigma)" in source),
        ("exact_zero_sigma_moment", "arb_pow_ui(output, h, degree + 1U" in source
         and "arb_div_ui(output, output, degree + 1U" in source),
        ("directed_incomplete_gamma_moment", "arb_hypgeom_gamma_lower" in source
         and "arb_pow_ui(denominator, sigma, degree + 1U" in source),
        ("exponential_left_weight", "arb_mul(sigma_left, request.sigma, model.left_endpoint" in source
         and "arb_exp(exponential" in source),
        ("coefficient_magnitudes", "arb_abs(coefficient_mag" in source),
        ("remainder_magnitude_separate", "arb_abs(remainder_mag, model.remainders + jet)" in source),
        ("increasing_model_chronology", "model_index < tagged.ledger.model_count" in source
         and "if (!arb_lt(model.left_endpoint, onset)) break" in source),
        ("every_panel_contribution_recorded", "PanelContribution contribution" in source
         and "panel_contributions.push_back" in source),
        ("totals_positive_addition", "output->history_total(request_ordinal, jet), panel_sum" in source),
        ("no_signed_remainder_cancellation", "signed_remainder_cancellation_used = false" in source),
        ("candidate_neutral_no_files", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "shat", "6/5"))),
        ("authority_defaults_false", "candidate_evaluations = 0U" in header
         and "authority_promoted = false" in header),
        ("provider_boundary_explicit", "FiniteContinuationProvider" in header
         and "actual successor-panel provider absent" in __doc__),
        ("existing_panel_api_origin_only", "primary_c08_origin_series_v1::Input origin" in panel_header
         and "accepted_before" not in panel_header),
        ("fixture_manufactured_extension", "ledger_models_before == 8U" in fixture
         and "ledger_models_after == 12U" in fixture),
        ("fixture_p_norm_30", "arb_contains_si(output.onset_qp.data(), 30)" in fixture),
        ("fixture_both_moment_branches", "zero_sigma_exact_history" in fixture
         and "positive_sigma_incomplete_gamma_history" in fixture),
        ("fixture_early_tail_guard", "early_tail_guard" in fixture
         and "tail_onset_binding_guard" in fixture),
        ("fixture_finite_failure", "typed_finite_failure_propagated" in fixture),
        ("fixture_prefix_corruption", "prefix_mutation_rejected" in fixture
         and "ledger_shrink_rejected" in fixture),
        ("fixture_terminal_coverage", "terminal_coverage_rejected" in fixture),
        ("fixture_inventory_guards", "duplicate_scalar_inventory_rejected" in fixture
         and "missing_history_ledger_rejected" in fixture),
        ("fixture_sigma_and_orientation_guards", "touching_sigma_rejected" in fixture
         and "duplicate_orientation_rejected" in fixture),
        ("fixture_determinism", "deterministic_replay" in fixture
         and "arb_equal(output_a.history_total" in fixture),
        ("fixture_null_guards", "null_output_guard" in fixture
         and "null_result_guard" in fixture),
        ("digest_pinned_builder", "@sha256:9e94d19f" in dockerfile),
        ("digest_pinned_runtime", "@sha256:8334e977" in dockerfile),
        ("strict_compile", "-fno-fast-math" in dockerfile and "-Werror" in dockerfile),
        ("arb_flint_mpfr_gmp_bound", all(token in dockerfile for token in (
            "-lflint-arb", "-lflint", "-lgmp", "-lmpfr"))),
    ))

    predecessor = run([sys.executable,
        "scripts/nhm2_g2h_e_s5_c08_tail_lyapunov_runtime_audit.py"])
    predecessor_report = parse_report(predecessor)
    checks.append(("c08_011b_predecessor_92_of_92", predecessor.returncode == 0
                   and predecessor_report.get("checks_passed") == 92
                   and predecessor_report.get("checks_total") == 92))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_borel_growth_independent_replay.mjs"])
    replay_report = parse_report(replay)
    checks.append(("acknowledged_definition_replay_27_of_27", replay.returncode == 0
                   and replay_report.get("checks_passed") == 27
                   and replay_report.get("checks_total") == 27))

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
                (f"fixture_{ordinal}_25_of_25", report.get("checks_passed") == 25
                 and report.get("checks_total") == 25),
                (f"fixture_{ordinal}_prefix_counts",
                 report.get("ledger_models_before") == 8
                 and report.get("ledger_models_after") == 12),
                (f"fixture_{ordinal}_onset_inventory", report.get("onset_boxes") == 52),
                (f"fixture_{ordinal}_history_inventory",
                 report.get("history_panel_contributions") == 52),
                (f"fixture_{ordinal}_candidate_inert",
                 report.get("candidate_evaluations") == 0
                 and report.get("positive_parameter_samples") == 0
                 and report.get("candidate_roots_created") is False),
                (f"fixture_{ordinal}_authority_false",
                 report.get("scientific_handler_linked") is False
                 and report.get("authority_promoted") is False),
            ))
        checks.append(("deterministic_fixture_report",
                       len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend((name, False) for name in (
            "local_image_identity_recorded", "executable_identity",
            "fixture_0_exit_zero", "fixture_0_25_of_25",
            "fixture_0_prefix_counts", "fixture_0_onset_inventory",
            "fixture_0_history_inventory", "fixture_0_candidate_inert",
            "fixture_0_authority_false", "fixture_1_exit_zero",
            "fixture_1_25_of_25", "fixture_1_prefix_counts",
            "fixture_1_onset_inventory", "fixture_1_history_inventory",
            "fixture_1_candidate_inert", "fixture_1_authority_false",
            "deterministic_fixture_report"))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_finite_history_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "maturity": "partial_c08_011c_history_admission_kernel_only",
        "actual_successor_panel_provider_bound": False,
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "predecessor_audit": predecessor_report,
        "definition_replay": replay_report,
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
