#!/usr/bin/env python3
"""Independent candidate-neutral audit for the H2-P8B parent binding."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8b-parent-diagnostic-v1-20260828"
RECEIPT = ARTIFACT / "h2-p8b-independent-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8b-parent-diagnostic-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8b-parent-diagnostic-fixture-v1"
EXPECTED_EXECUTABLE = "d3cf79e3ddd1658962adec6ddaba5d24583967bab004f2e3cd70bcd0dc9d70d6"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_selector_v1.hpp": "82d0a55982b426bbb16d42a340dd057d5753a78d0fb274ff47ec0748d166202f",
    "mini_boson_star_primary_c08_convolution_selector_v1.cpp": "54dc4ed5009e9ad168c6de493f7f8c9bebaa0ecbf2f72bf577299522fe3900c5",
    "mini_boson_star_primary_c08_h2_ledger_v1.hpp": "545fa45420d90a2ba359eef13a0d494faeca3d75176777d9f230af5b9546f24f",
    "mini_boson_star_primary_c08_h2_ledger_v1.cpp": "7a17a6404fd66291e7460ebbdf62ecf090d4535de42ab96658335ca256c3858c",
    "mini_boson_star_primary_c08_h2_p8b_parent_diagnostic_fixture_v1.cpp": "20a0e0521b0d775020443ca4c450a1f7de406aab6a29b35c887994176681410d",
    "Dockerfile.primary.mini-boson-c08-h2-p8b-parent-diagnostic-fixture.v1": "ebb8e227c9c4130a4aaff087f445d8aad98d30c462e34b99a74c4e2285b22148",
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

    header = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8b_parent_diagnostic_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8b-parent-diagnostic-fixture.v1"
    docker_text = dockerfile.read_text(encoding="utf-8")
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8b-parent-diagnostic-binding.md").read_text(encoding="utf-8")
    checks.update({
        "packet_header": packet.startswith("Program gate:") and "Explicit non-goals:" in packet,
        "receipt_runtime_only": "changes receipt semantics and optional parent runtime binding only" in packet,
        "ordinary_initialize_retained": "bool initialize(const Input &input, Context *context, Result *result);" in header,
        "ordinary_extend_retained": "bool extend(const Input &input, Context *context, Result *result);" in header,
        "diagnostic_entrypoints_additive": "initialize_diagnostic" in header and "extend_diagnostic" in header,
        "ordinary_parent_null_sink": "extend_impl(input, impl, result, true, nullptr)" in source and "extend_impl(input, *context->impl_, result, false, nullptr)" in source,
        "diagnostic_selector_binding": "selector::evaluate_prepared_parallel_diagnostic(" in source,
        "ordinary_selector_binding": "selector::evaluate_prepared_parallel(" in source,
        "diagnostic_not_decision_input": "replay_width_decisions" not in source,
        "last_selector_only": "selector::WidthDiagnostics width;" in header and "std::vector<ParentDiagnostics>" not in header and "std::vector<ParentDiagnostics>" not in source,
        "frozen_string_cap": "kMaximumDiagnosticStringBytes = 256U" in header,
        "frozen_record_cap": "kMaximumDiagnosticRecordBytes = 65536U" in header,
        "observation_cap_17": "diagnostics.width.observations > selector::kUPanelCandidateCount" in source,
        "candidate_chronology_checked": "observation.candidate_index != expected_index" in source and "observation.panel_count != selector::kUPanelCandidates[expected_index]" in source,
        "verdict_consistency_checked": "diagnostics.selector_passed != last.passed" in source,
        "serializer_no_file_io": all(token not in source for token in ("ofstream", "fopen", "filesystem")),
        "canonical_schema": "nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic.v1" in source,
        "fixture_parent_equivalence": "same_result(ordinary_result, diagnostic_result)" in fixture and "same_model(ordinary_models.models[0]" in fixture,
        "fixture_corruption_rejection": "kUPanelCandidateCount + 1U" in fixture,
        "fixture_null_rejection": "null_diagnostic_result" in fixture,
        "fixture_candidate_neutral": "ordinary_result.candidate_evaluations" not in fixture or "neutral(ordinary_result)" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in docker_text,
        "digest_pinned_runtime": "@sha256:8334e977" in docker_text,
        "strict_compile_flags": "-fno-fast-math" in docker_text and "-Werror" in docker_text,
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
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
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
            checks[f"fixture_{ordinal}_13_of_13"] = report.get("status") == "PASS" and report.get("checks_passed") == report.get("checks_total") == 13
            checks[f"fixture_{ordinal}_parent_equal"] = report.get("ordinary_diagnostic_equal") is True
            checks[f"fixture_{ordinal}_bounded"] = isinstance(report.get("canonical_bytes"), int) and 0 < report["canonical_bytes"] <= 65536 and report.get("selector_observations") == 1
            checks[f"fixture_{ordinal}_neutral"] = report.get("candidate_evaluations") == 0 and report.get("positive_parameter_samples") == 0 and report.get("candidate_roots_created") is False
            checks[f"fixture_{ordinal}_authority_false"] = report.get("scientific_handler_linked") is False and report.get("authority_promoted") is False
        checks["fixture_repeat_byte_equal"] = len(raw_outputs) == 2 and raw_outputs[0] == raw_outputs[1]

    checks["protected_absent_after"] = all(
        not (ROOT / path).exists() for path in PROTECTED)
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8b_parent_diagnostic_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "image_id": image_id,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "bounded_selector_fixture_executed": True,
        "long_exhaustion_selector_executed": False,
        "h2_parent_diagnostic_observed_p7": False,
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
