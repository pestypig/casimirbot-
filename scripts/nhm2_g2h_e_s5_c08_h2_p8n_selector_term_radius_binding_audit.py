#!/usr/bin/env python3
"""Independent source/build/runtime audit for candidate-neutral H2-P8N."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8n-selector-term-radius-binding.md"
NEXT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8o-representative-term-radius-decision-packet.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8n-selector-term-radius-binding-v1-20260901"
RECEIPT = ARTIFACT / "h2-p8n-independent-audit.v2.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8n-selector-term-radius-binding-fixture:audit-v1"
P8I_IMAGE = "nhm2-g2h-e-s5-c08-h2-p8i-selector-slot3-attribution-fixture:p8n-regression"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8n-selector-term-radius-binding-fixture-v1"
EXPECTED_EXECUTABLE = "de6d8ca83d228a1430270a93416a2c414e751bff43b148d3816cd3f248e2fc3b"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_selector_v1.hpp": "d00b57e461a36e7d2bf1af9107b8f3de93fe5502c51c1dcb9681ef96b4e782c8",
    "mini_boson_star_primary_c08_convolution_selector_v1.cpp": "2b7aa53da1a35670f614c19204fce088d3b64ee05c6a6c7b114368e8d4d172fd",
    "mini_boson_star_primary_c08_h2_p8i_selector_slot3_attribution_fixture_v1.cpp": "0c2375bf1c170a0cb1272d856af36f36993ad740d63b4efbb65e9a2d50949524",
    "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp": "6170f8c1ae540b782784ccb7272e11fec412b25c19e796606bad7109132a6ad6",
    "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.cpp": "11b18ea4dd20e2d28423f3934f99e95a3126415b60b418bd64213cf89d24cf97",
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp": "77b9aa9c1f7af0fc7f626567bc1a1c4986c2936dd4c873a2a000b4d18048298a",
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.cpp": "09b1f707bb1b4c800bb513997f6862c7d503a739f119719947aca1bf38735f3c",
    "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_fixture_v1.cpp": "b562512b9139921c5e4a7938c2e8d1003251aedea24d6137f8c508ab857adc82",
    "Dockerfile.primary.mini-boson-c08-h2-p8n-selector-term-radius-binding-fixture.v1": "c8b2d186547098b0b06767560d62e9b45e5f78893b4bfd4f34ecb01e02216d00",
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

    header = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8n_selector_term_radius_binding_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8n-selector-term-radius-binding-fixture.v1"
    docker_text = dockerfile.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    next_doc = NEXT.read_text(encoding="utf-8")
    body = source[source.index("bool evaluate_prepared_candidate_observed("):]
    producer = body.index("selector::evaluate_prepared_candidate_decomposition(")
    replay = body.index("p8m::evaluate_prepared_observed(")
    checks.update({
        "packet_header": doc.startswith("Program gate:") and "Explicit non-goals:" in doc,
        "receipt_only": "changes receipt semantics only" in doc,
        "nonadditive_channels": "overlapping influence envelopes" in doc,
        "sole_selector_producer": producer < replay,
        "slot3_exact_target": "target_degree != 3U" in body and "jet::second_jet(1U, 2U)" in body,
        "fixed_precision": "constexpr slong kPrecisionBits = 512;" in source,
        "fixed_degree_capacity": (
            "kMaximumGlobalTDegree" in header
            and "static_cast<std::size_t>(kMaximumGlobalTDegree) + 1U" in header
            and "assign(kMaximumDegreeBuckets" in source
        ),
        "serial_panel_order": "for (std::size_t ordinal = 0U; ordinal < panel_count" in body,
        "p8i_count_binding": "p8i_counts_equal" in body and "slot3_integrated_terms_observed" in body,
        "p8i_six_aggregate_binding": body.count("decimal_ball(") >= 6,
        "six_origin_channels": all(token in header for token in ("f_coefficient", "gprime_coefficient", "prepared_moment", "product_rounding", "translation_weight", "absolute_accumulation")),
        "no_scientific_output_after_producer": body.rfind("output->") < replay,
        "fixture_exact_output": "same_output(ordinary_output, observed_output)" in fixture,
        "fixture_exact_result": "same_result(ordinary_result, observed_result)" in fixture,
        "fixture_cross_thread_replay": "input, 2U, 1U, 3U" in fixture and "same_p8n(observation, repeated_observation)" in fixture,
        "fixture_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_build": "@sha256:9e94d19f" in docker_text and "@sha256:8334e977" in docker_text,
        "strict_compile": "-fno-fast-math" in docker_text and "-Werror" in docker_text,
        "p8o_inert_successor": "INERT / NO EXECUTION AUTHORITY" in next_doc and "Evidence-distinguishable outcomes" in next_doc,
        "p8m_audit_preserved": (ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8m-term-radius-attribution-v1-20260901/h2-p8m-independent-audit.v2.json").exists(),
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
            checks[f"fixture_{ordinal}_15_of_15"] = report.get("status") == "PASS" and report.get("checks_passed") == report.get("checks_total") == 15
            checks[f"fixture_{ordinal}_coverage"] = report.get("degree_bucket_capacity") == 514 and report.get("populated_degrees") == 63 and report.get("terms_observed") == 2172 and report.get("boundary_terms_observed") == 44
            checks[f"fixture_{ordinal}_exact"] = report.get("ordinary_observed_equal") is True and report.get("thread_count_replay_equal") is True and report.get("p8i_counts_equal") is True and report.get("p8i_aggregate_equal") is True
            checks[f"fixture_{ordinal}_neutral"] = report.get("representative_input_evaluated") is False and report.get("candidate_evaluations") == 0 and report.get("positive_parameter_samples") == 0 and report.get("candidate_roots_created") is False and report.get("scientific_handler_linked") is False and report.get("authority_promoted") is False
        checks["fixture_repeat_byte_equal"] = outputs[0] == outputs[1]

    p8i_docker = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8i-selector-slot3-attribution-fixture.v1"
    p8i_build = run(["docker", "build", "--pull=false", "--network=none", "--quiet",
                     "--file", str(p8i_docker), "--tag", P8I_IMAGE, "."])
    checks["p8i_offline_build"] = p8i_build.returncode == 0
    if p8i_build.returncode == 0:
        p8i_run = hardened(P8I_IMAGE)
        p8i_report = last_json(p8i_run)
        checks["p8i_regression_14_of_14"] = p8i_run.returncode == 0 and p8i_report.get("status") == "PASS" and p8i_report.get("checks_passed") == p8i_report.get("checks_total") == 14

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8n_selector_term_radius_binding_independent_audit.v2",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "checks": checks,
        "image_id": image_id,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": reports[0] if reports else {},
        "representative_input_evaluated": False,
        "full_selector_executed": False,
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
