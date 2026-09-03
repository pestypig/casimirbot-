#!/usr/bin/env python3
"""Independent source/build/runtime audit for candidate-neutral H2-P8P."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-observer-progress-turnaround-calibration.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-observer-progress-v1-20260901"
RECEIPT = ARTIFACT / "h2-p8p-independent-audit.v2.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8p-observer-progress-fixture:audit-v1"
P8N_IMAGE = "nhm2-g2h-e-s5-c08-h2-p8n-selector-term-radius-binding-fixture:p8p-regression"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8p-observer-progress-fixture-v1"
EXPECTED_EXECUTABLE = "4c518627acd4144307132ea6a4383b98d469b70428ed8b1a4bc7991a087b4c17"
EXPECTED = {
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp": "77b9aa9c1f7af0fc7f626567bc1a1c4986c2936dd4c873a2a000b4d18048298a",
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.cpp": "09b1f707bb1b4c800bb513997f6862c7d503a739f119719947aca1bf38735f3c",
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_fixture_v1.cpp": "b562512b9139921c5e4a7938c2e8d1003251aedea24d6137f8c508ab857adc82",
    "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.hpp": "fded2b6ab3e942820030da0339cff61e4a0a4ce44d97c67e06a9c5425c2980e3",
    "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.cpp": "ffc2b489255650e3611ae9bd8378de3014d7f0fe661c957d5b27445e7c3f202f",
    "mini_boson_star_primary_c08_h2_p8p_observer_progress_fixture_v1.cpp": "99666fdeb65cbeead14bf239a203e5e00175b9abba03a628557a44651ad3124b",
    "Dockerfile.primary.mini-boson-c08-h2-p8p-observer-progress-fixture.v1": "7f3da637502fd8697dac6502d73b982440c9722bfddcd0d491574caf6b22ee4a",
}


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True)


def last_json(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def hardened(image: str) -> subprocess.CompletedProcess[str]:
    return run(["docker", "run", "--rm", "--network", "none",
                "--read-only", "--cap-drop", "ALL", "--security-opt",
                "no-new-privileges", "--pids-limit", "64", "--memory",
                "1g", "--cpus", "2", image])


def main() -> int:
    if RECEIPT.exists():
        raise RuntimeError(f"immutable audit receipt exists: {RECEIPT}")
    checks: dict[str, bool] = {}
    for name, expected in EXPECTED.items():
        checks[f"hash:{name}"] = sha256(G2H / name) == expected

    header = (G2H / "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_p8p_observer_progress_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8p_observer_progress_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8p-observer-progress-fixture.v1"
    docker_text = dockerfile.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    normalized_doc = " ".join(doc.split())
    selector_call = source.index("selector::evaluate_prepared_candidate_decomposition(")
    serial_loop = source.index("for (std::size_t ordinal = 0U;")
    observer_call = source.index("p8m::evaluate_prepared_observed(")
    degree_loop = source.index("for (std::size_t degree = 0U;")
    panel_commit = source.index("++observation->panels_observed;")
    callback_call = source.index("callback(event, callback_context);")
    checks.update({
        "packet_header": doc.startswith("Program gate:") and "Explicit non-goals:" in doc,
        "receipt_semantics_only": "Change classification: receipt semantics only" in doc,
        "p8n_immutable_documented": all(value in doc for value in EXPECTED.values() if value.startswith(("77b9", "09b1", "b562"))),
        "separate_versioned_namespace": "primary_c08_h2_p8p_observer_progress_v1" in header and "p8n::Observation" in header,
        "return_free_noexcept_callback": "using ProgressCallback = void (*)(const ProgressEvent &, void *) noexcept;" in header,
        "aggregate_only_event": all(token in header for token in ("Phase phase", "completed_panels", "total_panels", "monotonic_nanoseconds")) and "arb_" not in header[header.index("struct ProgressEvent"):header.index("using ProgressCallback")],
        "fixed_target_and_precision": "target_degree != 3U" in source and "jet::second_jet(1U, 2U)" in source and "constexpr slong kPrecisionBits = 512;" in source,
        "unchanged_selector_precedes_observer": selector_call < serial_loop < observer_call,
        "serial_panel_order": "ordinal < panel_count && ok; ++ordinal" in source,
        "callback_after_complete_panel_commit": observer_call < degree_loop < panel_commit < callback_call,
        "fixed_p8n_inventory": "p8n::kMaximumDegreeBuckets" in source and "== p8n::kMaximumDegreeBuckets" in source,
        "six_p8n_totals": all(token in source for token in ("f_coefficient_total", "gprime_coefficient_total", "prepared_moment_total", "product_rounding_total", "translation_weight_total", "absolute_accumulation_total")),
        "separate_phase_timing": "selector_nanoseconds" in source and "observer_nanoseconds" in source and "total_nanoseconds" in source,
        "time_not_scientific_input": "TimingObservation" not in source[observer_call:degree_loop],
        "bounded_progress": "events_emitted == panel_count" in source and "events_emitted <= timing.last_completed_panels" in source,
        "fixture_exact_output": "same_output(baseline_output, null_output)" in fixture,
        "fixture_exact_result": "same_result(baseline_result, null_result)" in fixture,
        "fixture_exact_p8i": "same_p8i(baseline_p8i, null_p8i)" in fixture,
        "fixture_exact_514_and_six": "same_p8n(baseline_p8n, null_p8n)" in fixture and "six_totals_equal" in fixture and "== 514U" in fixture,
        "fixture_success_failure_chronology": "chronological(recorder, 2U)" in fixture and "invalid_null" in fixture and "invalid_callback" in fixture,
        "fixture_neutral": "representative_input_evaluated\\\":false" in fixture and "calibration_executed\\\":false" in fixture and "candidate_evaluations\\\":0" in fixture,
        "digest_pinned_build": "@sha256:9e94d19f" in docker_text and "@sha256:8334e977" in docker_text,
        "strict_compile": "-fno-fast-math" in docker_text and "-Werror" in docker_text,
        "calibration_still_gated": "separately frozen proposal" in normalized_doc and "not that execution authorization" in normalized_doc,
    })

    build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                 "--file", str(dockerfile), "--tag", IMAGE, "."])
    checks["offline_build"] = build.returncode == 0
    image_id = ""
    executable_sha = ""
    reports: list[dict[str, object]] = []
    outputs: list[str] = []
    if build.returncode == 0:
        inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspect.stdout.strip()
        checks["image_identity"] = inspect.returncode == 0 and image_id.startswith("sha256:")
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_sha = executable.stdout.strip().split()[0]
        checks["executable_identity"] = executable_sha == EXPECTED_EXECUTABLE
        for ordinal in range(2):
            process = hardened(IMAGE)
            report = last_json(process)
            reports.append(report)
            outputs.append(process.stdout)
            checks[f"fixture_{ordinal}_exit"] = process.returncode == 0
            checks[f"fixture_{ordinal}_16_of_16"] = report.get("status") == "PASS" and report.get("checks_passed") == report.get("checks_total") == 16
            checks[f"fixture_{ordinal}_exact"] = report.get("baseline_null_callback_equal") is True and report.get("null_recording_callback_equal") is True and report.get("p8i_equal") is True and report.get("six_totals_equal") is True and report.get("chronology_equal") is True
            checks[f"fixture_{ordinal}_coverage"] = report.get("degree_bucket_capacity") == 514 and report.get("progress_events") == 2 and report.get("terms_observed") == 2172 and report.get("boundary_terms_observed") == 44
            checks[f"fixture_{ordinal}_neutral"] = report.get("representative_input_evaluated") is False and report.get("calibration_executed") is False and report.get("candidate_evaluations") == 0 and report.get("positive_parameter_samples") == 0 and report.get("candidate_roots_created") is False and report.get("scientific_handler_linked") is False and report.get("authority_promoted") is False
        checks["fixture_repeat_byte_equal"] = outputs[0] == outputs[1]

    p8n_docker = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8n-selector-term-radius-binding-fixture.v1"
    p8n_build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                     "--file", str(p8n_docker), "--tag", P8N_IMAGE, "."])
    checks["p8n_offline_build"] = p8n_build.returncode == 0
    if p8n_build.returncode == 0:
        p8n_run = hardened(P8N_IMAGE)
        p8n_report = last_json(p8n_run)
        checks["p8n_regression_15_of_15"] = p8n_run.returncode == 0 and p8n_report.get("status") == "PASS" and p8n_report.get("checks_passed") == p8n_report.get("checks_total") == 15

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_observer_progress_independent_audit.v2",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "image_id": image_id,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "p8n_immutable": True,
        "mathematical_semantics_changed": False,
        "receipt_semantics_changed": True,
        "representative_input_evaluated": False,
        "calibration_executed": False,
        "cloud_resource_created": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    ARTIFACT.mkdir(parents=True, exist_ok=True)
    RECEIPT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n",
                       encoding="utf-8", newline="\n")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha256(RECEIPT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
