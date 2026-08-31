#!/usr/bin/env python3
"""Independent candidate-neutral audit for H2-P8E decomposition."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8e-decomposition-v1-20260830"
RECEIPT = ARTIFACT / "h2-p8e-independent-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8e-decomposition-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8e-decomposition-fixture-v1"
EXPECTED_EXECUTABLE = "66cc142576a79b0a5bbfd36f940491f801c83fee8bb6f1d9d8feb5d76b56b7fa"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_jet_v1.hpp":
        "907f4f42c48e7659653d458ff1bf6c46116ee751b15d37a24e088081b480ebc4",
    "mini_boson_star_primary_c08_convolution_jet_v1.cpp":
        "5cca40e060d243d7edfd977bfe35fa35bddb6319c9ba42306cb371873469d010",
    "mini_boson_star_primary_c08_convolution_selector_v1.hpp":
        "4b6a92e33ecb85febafddac326984f4e7a6f50555ddf1bd5e74a5bb89fd60db3",
    "mini_boson_star_primary_c08_convolution_selector_v1.cpp":
        "c07014702ca84c32269eca5ea431640e3926873ad1d45db4c4fc4a37761c9e04",
    "mini_boson_star_primary_c08_h2_p8e_decomposition_fixture_v1.cpp":
        "963f9d7fbec6df07e6d721125b8e0b6820a13de51c94481f72e1be7a5578dd00",
    "Dockerfile.primary.mini-boson-c08-h2-p8e-decomposition-fixture.v1":
        "42e5afda7c4d5f33e9a230e271167ea9352f85f1906891d01c0d2c2e85cd6736",
}
PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True)


def last_json(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    if RECEIPT.exists():
        raise RuntimeError(f"immutable audit receipt exists: {RECEIPT}")
    checks: dict[str, bool] = {}
    for name, expected in EXPECTED.items():
        checks[f"hash:{name}"] = sha(G2H / name) == expected
    checks["protected_absent_before"] = all(
        not (ROOT / path).exists() for path in PROTECTED)

    jet_header = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.hpp").read_text(encoding="utf-8")
    jet_source = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.cpp").read_text(encoding="utf-8")
    selector_header = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp").read_text(encoding="utf-8")
    selector_source = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8e_decomposition_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8e-decomposition-fixture.v1"
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8e-coefficient-constituent-decomposition.md").read_text(encoding="utf-8")
    checks.update({
        "packet_header": packet.startswith("Program gate:") and "Explicit non-goals:" in packet,
        "receipt_semantics_only": "changes receipt semantics only" in packet,
        "p8c_immutable": "P8C remains immutable" in packet,
        "precision_unchanged": "constexpr slong kPrecisionBits = 512;" in selector_source,
        "width_exponent_unchanged": "kNumericalWidthExponent = -180L" in selector_header,
        "fixed_schedule_unchanged": "kUPanelCandidateCount = 17U" in selector_header,
        "four_term_inventory": "kSecondJetTermCount = 4U" in jet_header,
        "ordered_second_jet_formula": "return 4U + a * kParameterCount + b;" in jet_header,
        "ordinary_jet_entrypoint_retained": "bool evaluate_prepared(const Input &input" in jet_header,
        "additive_jet_entrypoint": "evaluate_prepared_decomposed" in jet_header,
        "ordinary_jet_null_sink": "return evaluate_impl(input, true, output, result, nullptr);" in jet_source,
        "ordered_slots_bound": all(token in jet_source for token in (
            "*result, decomposition, 0U)", "decomposition, 1U)",
            "decomposition, 2U)", "decomposition, 3U)")),
        "ordinary_selector_entrypoint_retained": "bool evaluate_prepared_candidate(" in selector_header,
        "additive_selector_entrypoint": "evaluate_prepared_candidate_decomposition" in selector_header,
        "bounded_slot_arrays": (
            "std::array<std::string, jet::kSecondJetTermCount> slot_radius_sums" in selector_header
            and "std::array<arb_struct, jet::kSecondJetTermCount>" in selector_source),
        "no_p8e_panel_history_vector": "std::vector<CoefficientDecomposition" not in selector_header + selector_source,
        "per_panel_exact_reconstruction": "arb_equal(reconstructed_panel" in selector_source,
        "final_exact_reconstruction": "decomposition.reconstructed_candidate" in selector_source,
        "diagnostic_not_selection_input": "replay_width_decisions(\n            observation" not in selector_source,
        "ratio_is_unchanged_width_quantity": "width_margin(margin," in selector_source,
        "fixture_targets_jet8": "jet::second_jet(1U, 1U)" in fixture,
        "fixture_targets_jet9": "jet::second_jet(1U, 2U)" in fixture,
        "fixture_exact_output_equivalence": "same_output(ordinary_output, jet8_output)" in fixture and "same_output(ordinary_output, jet9_output)" in fixture,
        "fixture_reconstruction_checks": "all_panel_reconstructions_equal" in fixture and "final_reconstruction_equal" in fixture,
        "fixture_candidate_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in dockerfile.read_text(encoding="utf-8"),
        "digest_pinned_runtime": "@sha256:8334e977" in dockerfile.read_text(encoding="utf-8"),
        "strict_compile_flags": "-fno-fast-math" in dockerfile.read_text(encoding="utf-8") and "-Werror" in dockerfile.read_text(encoding="utf-8"),
    })

    build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                 "--file", str(dockerfile), "--tag", IMAGE, "."])
    checks["offline_build"] = build.returncode == 0
    image_id = ""
    executable_sha = ""
    reports: list[dict[str, object]] = []
    raw_outputs: list[str] = []
    if build.returncode == 0:
        inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspect.stdout.strip()
        checks["image_identity"] = inspect.returncode == 0 and image_id.startswith("sha256:")
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                          IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_sha = executable.stdout.strip().split()[0]
        checks["executable_identity"] = executable_sha == EXPECTED_EXECUTABLE
        for ordinal in range(2):
            executed = run(["docker", "run", "--rm", "--network", "none",
                            "--read-only", "--cap-drop", "ALL", "--security-opt",
                            "no-new-privileges", "--pids-limit", "64", IMAGE])
            report = last_json(executed)
            reports.append(report)
            raw_outputs.append(executed.stdout)
            checks[f"fixture_{ordinal}_exit"] = executed.returncode == 0
            checks[f"fixture_{ordinal}_13_of_13"] = (
                report.get("status") == "PASS"
                and report.get("checks_passed") == 13
                and report.get("checks_total") == 13)
            checks[f"fixture_{ordinal}_reconstructed"] = (
                report.get("jet8_reconstructed") is True
                and report.get("jet9_reconstructed") is True)
            checks[f"fixture_{ordinal}_equivalent"] = report.get("ordinary_decomposed_equal") is True
            checks[f"fixture_{ordinal}_neutral"] = (
                report.get("candidate_evaluations") == 0
                and report.get("positive_parameter_samples") == 0
                and report.get("candidate_roots_created") is False)
            checks[f"fixture_{ordinal}_authority_false"] = (
                report.get("scientific_handler_linked") is False
                and report.get("authority_promoted") is False)
        checks["fixture_repeat_byte_equal"] = len(raw_outputs) == 2 and raw_outputs[0] == raw_outputs[1]

    checks["protected_absent_after"] = all(
        not (ROOT / path).exists() for path in PROTECTED)
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8e_decomposition_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "image_id": image_id,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "full_selector_executed": False,
        "h2_parent_executed": False,
        "frozen_candidate_evaluated": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authorization_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(RECEIPT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
