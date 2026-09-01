#!/usr/bin/env python3
"""Independent source/build/runtime audit for candidate-neutral P8H."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOC = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8h-slot3-upstream-enclosure-attribution.md"
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8h-slot3-attribution-v1-20260831"
RECEIPT = ARTIFACT / "h2-p8h-independent-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-h2-p8h-slot3-attribution-fixture:audit-v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-p8h-slot3-attribution-fixture-v1"
EXPECTED_EXECUTABLE = "cf6b32d69b34ce94316336b70328fc0956c0b7d1291510e2597568c0129b31d9"
EXPECTED = {
    "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp":
        "4b85f07bc14b09cfbbbb30844fb3f1aee1c801c5e3a3520b6bb8c55d7dc9f132",
    "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp":
        "8fd618213793fc9726aa86e96944ddac076711701f98135e4e3a8d67611cc7f6",
    "mini_boson_star_primary_c08_h2_p8h_slot3_attribution_fixture_v1.cpp":
        "395e6e9a0c51cb118bd34bbb8f95eb2e0d1f4d7e5c4992245baab9da7071b56c",
    "Dockerfile.primary.mini-boson-c08-h2-p8h-slot3-attribution-fixture.v1":
        "467accc60fcd2303b1ddf8ba597663f6010aa168c482ff1cd4a5f311215ffe62",
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
    header = (G2H / "mini_boson_star_primary_c08_convolution_bivariate_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_convolution_bivariate_v1.cpp").read_text(encoding="utf-8")
    fixture = (G2H / "mini_boson_star_primary_c08_h2_p8h_slot3_attribution_fixture_v1.cpp").read_text(encoding="utf-8")
    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-h2-p8h-slot3-attribution-fixture.v1"
    doc = DOC.read_text(encoding="utf-8")
    checks.update({
        "packet_header": doc.startswith("Program gate:") and "Explicit non-goals:" in doc,
        "receipt_only": "changes receipt semantics only" in doc,
        "target_pair_exact": "value_jet * second_jet(1,2)" in doc,
        "ordinary_entrypoints_retained": (
            "bool evaluate(const Input &input" in header
            and "bool evaluate_prepared(const Input &input" in header),
        "additive_entrypoint_present": "evaluate_prepared_attributed" in header,
        "ordinary_null_sink": (
            "return evaluate_impl(input, nullptr, output, result, 0U, nullptr);" in source
            and "return evaluate_impl(input, &prepared, output, result, 0U, nullptr);" in source),
        "precision_unchanged": "constexpr slong kPrecisionBits = 512;" in source,
        "bounded_aggregate_struct": all(token in header for token in (
            "integrated_centered_component", "boundary_centered_component",
            "direct_integrated_radius_sum", "boundary_radius_sum",
            "f_source_hull_radius_bound", "gprime_source_hull_radius_bound")),
        "no_attribution_history_vector": "std::vector<CoefficientAttribution" not in header + source,
        "exact_reconstruction_check": "final_reconstruction_equal = arb_equal(" in source,
        "fixture_slot3_jets": "zero.value, one.value, 0U, 9U, boundary.value" in fixture,
        "fixture_degree3": "input, prepared, 3U" in fixture,
        "fixture_exact_equivalence": "same_output(ordinary, observed)" in fixture,
        "fixture_neutral": "candidate_evaluations == 0U" in fixture and "positive_parameter_samples == 0U" in fixture,
        "digest_pinned_builder": "@sha256:9e94d19f" in dockerfile.read_text(encoding="utf-8"),
        "digest_pinned_runtime": "@sha256:8334e977" in dockerfile.read_text(encoding="utf-8"),
        "strict_compile": "-fno-fast-math" in dockerfile.read_text(encoding="utf-8") and "-Werror" in dockerfile.read_text(encoding="utf-8"),
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
            reports.append(report); outputs.append(process.stdout)
            checks[f"fixture_{ordinal}_exit"] = process.returncode == 0
            checks[f"fixture_{ordinal}_11_of_11"] = (
                report.get("status") == "PASS"
                and report.get("checks_passed") == report.get("checks_total") == 11)
            checks[f"fixture_{ordinal}_target"] = (
                report.get("target_degree") == 3 and report.get("f_jet") == 0
                and report.get("gprime_jet") == 9)
            checks[f"fixture_{ordinal}_bounded_terms"] = (
                report.get("integrated_terms_observed") == 1086
                and report.get("boundary_terms_observed") == 22)
            checks[f"fixture_{ordinal}_equivalent"] = (
                report.get("ordinary_attributed_equal") is True
                and report.get("final_reconstruction_equal") is True)
            checks[f"fixture_{ordinal}_neutral"] = (
                report.get("candidate_evaluations") == 0
                and report.get("positive_parameter_samples") == 0
                and report.get("candidate_roots_created") is False
                and report.get("scientific_handler_linked") is False
                and report.get("authority_promoted") is False)
        checks["fixture_repeat_byte_equal"] = len(outputs) == 2 and outputs[0] == outputs[1]

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8h_slot3_attribution_independent_audit.v1",
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
