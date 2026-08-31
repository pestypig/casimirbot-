#!/usr/bin/env python3
"""Independent candidate-neutral audit for H2-P8A diagnostics."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8a-additive-diagnostic-v1-20260828"
RECEIPT = ARTIFACT / "h2-p8a-independent-audit.r2.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8a-diagnostic-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8a-diagnostic-fixture-v1"
EXPECTED_EXECUTABLE = "6115bc5233859f12372d90253a4453f54652768f97f27f1119d542052eed53b2"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_selector_v1.hpp":
        "82d0a55982b426bbb16d42a340dd057d5753a78d0fb274ff47ec0748d166202f",
    "mini_boson_star_primary_c08_convolution_selector_v1.cpp":
        "54dc4ed5009e9ad168c6de493f7f8c9bebaa0ecbf2f72bf577299522fe3900c5",
    "mini_boson_star_primary_c08_h2_p8a_diagnostic_fixture_v1.cpp":
        "feb51a569514583105153e68305c54bb9c4a4712950335e3933d5cb024d20e87",
    "Dockerfile.primary.mini-boson-c08-h2-p8a-diagnostic-fixture.v1":
        "1f33f8d0bfc33d7fd60b81bf48513b07273418eafc8cfc7657ebfa708572c889",
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

    header = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8a_diagnostic_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8a-diagnostic-fixture.v1"
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8a-additive-diagnostic-definition.md").read_text(encoding="utf-8")
    checks.update({
        "packet_header": packet.startswith("Program gate:") and "Explicit non-goals:" in packet,
        "receipt_semantics_only": "changes receipt semantics only" in packet,
        "fixed_schedule_17": "kUPanelCandidateCount = 17U" in header,
        "width_exponent_unchanged": "kNumericalWidthExponent = -180L" in header,
        "observation_fields_complete": all(token in header for token in (
            "first_failed_radius", "first_failed_threshold", "first_failed_ratio",
            "worst_radius", "worst_threshold", "worst_ratio")),
        "ordinary_entrypoint_retained": "bool evaluate_prepared_parallel(" in header,
        "diagnostic_entrypoint_additive": "evaluate_prepared_parallel_diagnostic" in header,
        "null_sink_for_ordinary": "output, result,\n                                           nullptr" in source,
        "decision_uses_width_passes": "replay_width_decisions(\n            width_passes" in source,
        "diagnostic_not_policy_input": "replay_width_decisions(\n            diagnostics" not in source,
        "observation_after_width_decision": "const bool passed = width_rule(output, checks, observation);" in source,
        "fixed_decimal_rendering": "arb_get_str(value, 80, 0U)" in source,
        "ratio_is_radius_over_threshold": "arb_div(ratio, radius, threshold, kPrecisionBits)" in source,
        "fixture_coefficient_failure": "coefficient_observation.first_failed_kind" in fixture,
        "fixture_remainder_failure": "remainder_observation.first_failed_kind" in fixture,
        "fixture_exact_equivalence": "same_result(ordinary_result, diagnostic_result)" in fixture and "same_output(ordinary_output, diagnostic_output)" in fixture,
        "fixture_candidate_neutral": (
            "ordinary_result.candidate_evaluations == 0U" in fixture
            and "diagnostic_result.candidate_evaluations == 0U" in fixture
            and "ordinary_result.positive_parameter_samples == 0U" in fixture
            and "diagnostic_result.positive_parameter_samples == 0U" in fixture),
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
            checks[f"fixture_{ordinal}_17_of_17"] = (
                report.get("status") == "PASS"
                and report.get("checks_passed") == 17
                and report.get("checks_total") == 17)
            checks[f"fixture_{ordinal}_equivalent"] = report.get("ordinary_diagnostic_equal") is True
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
        "schema": "nhm2.g2h_e_s5.c08_h2_p8a_diagnostic_independent_audit.v1",
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
