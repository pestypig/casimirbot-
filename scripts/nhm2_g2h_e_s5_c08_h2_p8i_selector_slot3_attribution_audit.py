#!/usr/bin/env python3
"""Independent source/build/runtime audit for candidate-neutral P8I."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8i-selector-slot3-attribution-binding.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8i-selector-slot3-attribution-v1-20260831"
RECEIPT = ARTIFACT / "h2-p8i-independent-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8i-selector-slot3-attribution:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8i-selector-slot3-attribution-fixture-v1"
EXPECTED_EXECUTABLE = "445e6a277c4071abd73beec61fcac317e1b8048dd0e54439e9157cd94f504ab2"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_jet_v1.hpp": "537868a3eeaaf57dee3cfeddb7e33ecadc5db600c0eb3c8d5fa525f3dd2f8f1c",
    "mini_boson_star_primary_c08_convolution_jet_v1.cpp": "56044eae8cce48613f9106e87a01fa04ce3601ed0478804adb8cbbba824d5700",
    "mini_boson_star_primary_c08_convolution_selector_v1.hpp": "d00b57e461a36e7d2bf1af9107b8f3de93fe5502c51c1dcb9681ef96b4e782c8",
    "mini_boson_star_primary_c08_convolution_selector_v1.cpp": "2b7aa53da1a35670f614c19204fce088d3b64ee05c6a6c7b114368e8d4d172fd",
    "mini_boson_star_primary_c08_h2_p8i_selector_slot3_attribution_fixture_v1.cpp": "0c2375bf1c170a0cb1272d856af36f36993ad740d63b4efbb65e9a2d50949524",
    "Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1": "134619ec451b0759eca25440869b3225c3923bdbb6fb0d5a0c00eefe58c4f4a2",
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


def main() -> int:
    if RECEIPT.exists():
        raise RuntimeError(f"immutable audit receipt exists: {RECEIPT}")
    checks: dict[str, bool] = {}
    for name, expected in EXPECTED.items():
        checks[f"hash:{name}"] = sha256(G2H / name) == expected
    jet_header = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.hpp").read_text(encoding="utf-8")
    jet_source = (G2H / "mini_boson_star_primary_c08_convolution_jet_v1.cpp").read_text(encoding="utf-8")
    selector_header = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.hpp").read_text(encoding="utf-8")
    selector_source = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8i_selector_slot3_attribution_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1"
    docker_text = dockerfile.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    checks.update({
        "packet_header": doc.startswith("Program gate:") and "Explicit non-goals:" in doc,
        "slot3_only_contract": "slot3_attribution, 3U" in jet_source,
        "additive_entrypoint": "evaluate_prepared_decomposed_slot3_attributed" in jet_header,
        "ordinary_null_sinks": (
            "evaluate_impl(input, false, output, result, nullptr, nullptr, 0U)" in jet_source
            and "evaluate_impl(input, true, output, result, nullptr, nullptr, 0U)" in jet_source),
        "selector_uses_additive_path": "evaluate_prepared_decomposed_slot3_attributed" in selector_source,
        "bounded_observation": all(token in selector_header for token in (
            "slot3_integrated_terms_observed", "slot3_boundary_terms_observed",
            "slot3_f_source_hull_radius_sum", "slot3_boundary_component_radius_sum")),
        "no_per_panel_history": "vector<CoefficientAttribution" not in selector_header + selector_source,
        "serial_aggregate": "accumulate_slot3" in selector_source,
        "precision_unchanged": "constexpr slong kPrecisionBits = 512;" in jet_source and "constexpr slong kPrecisionBits = 512;" in selector_source,
        "fixture_exact_output": "same_output(ordinary_output, observed_output)" in fixture,
        "fixture_deterministic": "attribution_equal(observation, repeated_observation)" in fixture,
        "fixture_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in docker_text,
        "digest_pinned_runtime": "@sha256:8334e977" in docker_text,
        "offline_strict_build": "-fno-fast-math" in docker_text and "-Werror" in docker_text,
    })

    build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                 "--file", str(dockerfile), "--tag", IMAGE, "."])
    checks["offline_build"] = build.returncode == 0
    executable_sha = ""
    reports: list[dict[str, object]] = []
    outputs: list[str] = []
    if build.returncode == 0:
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum",
                          IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_sha = executable.stdout.strip().split()[0]
        checks["executable_identity"] = executable_sha == EXPECTED_EXECUTABLE
        for ordinal in range(2):
            process = run(["docker", "run", "--rm", "--network", "none",
                           "--read-only", "--cap-drop", "ALL", "--security-opt",
                           "no-new-privileges", "--pids-limit", "64", IMAGE])
            report = last_json(process)
            reports.append(report); outputs.append(process.stdout)
            checks[f"fixture_{ordinal}_pass"] = process.returncode == 0 and report.get("status") == "PASS" and report.get("checks_passed") == report.get("checks_total") == 14
            checks[f"fixture_{ordinal}_bounded"] = report.get("panel_count") == 2 and report.get("slot3_integrated_terms") == 2172 and report.get("slot3_boundary_terms") == 44
            checks[f"fixture_{ordinal}_equivalent"] = report.get("ordinary_attributed_equal") is True and report.get("deterministic_repeat") is True
            checks[f"fixture_{ordinal}_neutral"] = report.get("candidate_evaluations") == 0 and report.get("positive_parameter_samples") == 0 and report.get("candidate_roots_created") is False and report.get("scientific_handler_linked") is False and report.get("authority_promoted") is False
        checks["fixture_repeat_byte_equal"] = len(outputs) == 2 and outputs[0] == outputs[1]

    regression = run(["docker", "run", "--rm", "--network", "none",
                      "nhm2-p8i-compile-check:v1"])
    regression_report = last_json(regression)
    checks["p8e_regression_13_of_13"] = regression.returncode == 0 and regression_report.get("checks_passed") == regression_report.get("checks_total") == 13

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8i_selector_slot3_attribution_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed), "checks_total": len(checks),
        "failed": failed, "checks": checks,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "representative_input_evaluated": False, "full_selector_executed": False,
        "candidate_evaluations": 0, "positive_parameter_samples": 0,
        "candidate_roots_created": False, "scientific_handler_linked": False,
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
