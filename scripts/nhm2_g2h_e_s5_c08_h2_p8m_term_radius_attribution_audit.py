#!/usr/bin/env python3
"""Independent source/build/runtime audit for candidate-neutral P8M."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8m-term-radius-attribution-fixture.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8m-term-radius-attribution-v1-20260901"
RECEIPT = ARTIFACT / "h2-p8m-independent-audit.v2.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8m-term-radius-attribution-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8m-term-radius-attribution-fixture-v1"
EXPECTED_EXECUTABLE = "74e8b9016d3a5bf1c5dc993eb2100189031a4a2c2c81496ae18dc635ce810259"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_ledger_v1.hpp": "68f10eba4d35d09630c4343fde425cd216e9da79a2d450d852e828f2fb345b46",
    "mini_boson_star_primary_c08_convolution_ledger_v1.cpp": "6a077eeca8554cf65861747d545cfdb7b44cd6b100d442d5bc096a6712c585d7",
    "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp": "4b85f07bc14b09cfbbbb30844fb3f1aee1c801c5e3a3520b6bb8c55d7dc9f132",
    "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp": "8fd618213793fc9726aa86e96944ddac076711701f98135e4e3a8d67611cc7f6",
    "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp": "6170f8c1ae540b782784ccb7272e11fec412b25c19e796606bad7109132a6ad6",
    "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.cpp": "11b18ea4dd20e2d28423f3934f99e95a3126415b60b418bd64213cf89d24cf97",
    "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_fixture_v1.cpp": "abfdccb8d838710f966bfcf18bff3989b2ef77095cf7cebda36f71938c338820",
    "Dockerfile.primary.mini-boson-c08-h2-p8m-term-radius-attribution-fixture.v1": "f014655527f58fa95dfe14071bdd2ade9889108a2480893eba7119d2758807af",
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

    header = (G2H / "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8m_term_radius_attribution_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8m-term-radius-attribution-fixture.v1"
    docker_text = dockerfile.read_text(encoding="utf-8")
    doc = DOC.read_text(encoding="utf-8")
    observer_body = source[source.index("bool evaluate_prepared_observed("):]
    checks.update({
        "packet_header": doc.startswith("Program gate:") and "Explicit non-goals:" in doc,
        "receipt_only": "changes receipt semantics only" in doc,
        "nonadditive_boundary": "overlapping influence envelopes" in doc and "not an additive" in doc,
        "sole_scientific_producer": "evaluate_prepared_attributed(" in source,
        "observer_after_predecessor": observer_body.index("evaluate_prepared_attributed(") < observer_body.index("translated_source_hull("),
        "fixed_precision": "constexpr slong kPrecisionBits = 512;" in source,
        "degree_indexed": "by_global_t_degree" in header and "maximum_degree" in source,
        "six_origin_channels": all(token in header for token in (
            "f_coefficient", "gprime_coefficient", "prepared_moment",
            "product_rounding", "translation_weight", "absolute_accumulation")),
        "bounded_capped_allocation": "allocate_capped" in source and "std::sort(requests.begin()" in source,
        "exact_integrated_match": "exact_observed_integrated_match = arb_equal(" in source,
        "no_output_mutation_after_observer": observer_body.rfind("output->") < observer_body.index("translated_source_hull("),
        "fixture_exact_output": "same_output(ordinary, observed)" in fixture,
        "fixture_exact_result": "same_result(ordinary_result, observed_result)" in fixture,
        "fixture_deterministic": "same_attribution(attribution, repeated_attribution)" in fixture,
        "fixture_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in docker_text,
        "digest_pinned_runtime": "@sha256:8334e977" in docker_text,
        "strict_compile": "-fno-fast-math" in docker_text and "-Werror" in docker_text,
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
            reports.append(report)
            outputs.append(process.stdout)
            checks[f"fixture_{ordinal}_exit"] = process.returncode == 0
            checks[f"fixture_{ordinal}_12_of_12"] = (
                report.get("status") == "PASS"
                and report.get("checks_passed") == report.get("checks_total") == 12)
            checks[f"fixture_{ordinal}_coverage"] = (
                report.get("target_degree") == 3
                and report.get("global_degree_count") == 63
                and report.get("terms_observed") == 1086)
            checks[f"fixture_{ordinal}_exact"] = (
                report.get("ordinary_observed_equal") is True
                and report.get("exact_observed_integrated_match") is True
                and report.get("deterministic_repeat") is True)
            checks[f"fixture_{ordinal}_origins"] = (
                report.get("origin_channels_complete") is True
                and report.get("manufactured_coefficient_origin_positive") is True
                and report.get("exact_radius_reconstruction") is False)
            checks[f"fixture_{ordinal}_neutral"] = (
                report.get("candidate_evaluations") == 0
                and report.get("positive_parameter_samples") == 0
                and report.get("candidate_roots_created") is False
                and report.get("scientific_handler_linked") is False
                and report.get("authority_promoted") is False)
        checks["fixture_repeat_byte_equal"] = len(outputs) == 2 and outputs[0] == outputs[1]

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8m_term_radius_attribution_independent_audit.v2",
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
