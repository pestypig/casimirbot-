#!/usr/bin/env python3
"""Independent candidate-neutral audit for the H2-P6 parent runtime binding."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
ARTIFACT_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p6-parent-runtime-binding-v1-20260827"
AUDIT = ARTIFACT_DIR / "h2-p6-parent-runtime-binding-audit.v1.json"
IMAGE = "nhm2-g2h-e-s5-c08-p2-ledger-fixture:p6-audit"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-p2-ledger-fixture-v1"
EXPECTED_EXECUTABLE = "d350e3531092b5659056a3a81d171b2888bb8abd713b2fe26d853a24b7915384"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.hpp":
        "2184475ffa66fc83311c3650b939f02326102d361e79a87880765b21275d10d8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.cpp":
        "b27f410d8fcffbb8fae0f42cde5a07463dfc2d4e971909aa2ae75728777b27d9",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_fixture_v1.cpp":
        "1fa85bacb439fb8b623ec02ddce283fbebdc880ee662ea3d298c316f1c4b6faf",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p2_ledger_v1.hpp":
        "4efa580a4feb3c7190adbb1dd161bba785b04653bbfdd33dc841d5dc5a77ddf8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p2_ledger_v1.cpp":
        "833fe501a9df34dbd4f8886cbb3ffbf518a7e62746fb75beb03627561e843db4",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_p2_ledger_fixture_v1.cpp":
        "62b34d2852cc563c132894f79f7fd89fbb9758b9bb0e66aff0365596a5443e69",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-p2-ledger-fixture.v1":
        "6527604cfb815a23f8a4fdf63fce2eb0d6aa3a6df42bb4de6c7bd50de1a148fa",
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
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True)


def parse_last_json(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    checks: dict[str, bool] = {}
    for path, expected in EXPECTED.items():
        checks[f"hash:{path}"] = sha(ROOT / path) == expected
    checks["protected_roots_absent_before"] = all(not (ROOT / path).exists() for path in PROTECTED)

    header = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.hpp").read_text(encoding="utf-8")
    source = (G2H / "mini_boson_star_primary_c08_h2_ledger_v1.cpp").read_text(encoding="utf-8")
    p2_header = (G2H / "mini_boson_star_primary_c08_p2_ledger_v1.hpp").read_text(encoding="utf-8")
    p2_source = (G2H / "mini_boson_star_primary_c08_p2_ledger_v1.cpp").read_text(encoding="utf-8")
    h2_fixture = (G2H / "mini_boson_star_primary_c08_h2_ledger_fixture_v1.cpp").read_text(encoding="utf-8")
    p2_fixture = (G2H / "mini_boson_star_primary_c08_p2_ledger_fixture_v1.cpp").read_text(encoding="utf-8")
    selector_source = (G2H / "mini_boson_star_primary_c08_convolution_selector_v1.cpp").read_text(encoding="utf-8")
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p6-parent-runtime-binding-packet.md").read_text(encoding="utf-8")
    p5a = json.loads((ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-cloud-execution-v1-20260827/h2-p5a-r2-independent-audit.v1.json").read_text(encoding="utf-8"))

    checks.update({
        "packet_has_required_header": packet.startswith("Program gate:") and "Explicit non-goals:" in packet,
        "p5a_runtime_binding_passed": p5a.get("verdict") == "PASS" and p5a.get("checks_passed") == 50,
        "fixed_compile_time_thread_count": "kSelectorThreadCount = 16U" in header,
        "h2_result_records_thread_count": "selector_thread_count = 0U" in header,
        "parallel_selector_is_parent_call": "selector::evaluate_prepared_parallel(" in source,
        "parent_passes_exact_thread_constant": "selector_input, kSelectorThreadCount" in source,
        "serial_parent_call_removed": "selector::evaluate(\n            selector_input" not in source,
        "p2_result_records_thread_count": "selector_thread_count = 0U" in p2_header,
        "p2_propagates_thread_count": "target->selector_thread_count = source.selector_thread_count" in p2_source,
        "h2_fixture_asserts_binding": h2_fixture.count("== h2::kSelectorThreadCount") == 2,
        "p2_fixture_asserts_binding": "== p2::h2::kSelectorThreadCount" in p2_fixture,
        "refinement_candidates_remain_sequential": "for (std::size_t candidate_index = 0U;" in selector_source,
        "ordinal_reduction_preserved": (
            "for (std::size_t offset = 0U;" in selector_source
            and "const std::size_t ordinal = batch_begin + offset;" in selector_source
        ),
        "nested_flint_parallelism_disabled": "flint_set_num_threads(1);" in selector_source,
        "no_environment_thread_selection": all(token not in source for token in ("getenv", "std::getenv", "hardware_concurrency")),
        "candidate_neutral_parent_source": all(token not in source for token in ("shat", "6/5", "fopen", "ofstream", "filesystem")),
    })

    dockerfile = G2H / "Dockerfile.primary.mini-boson-c08-p2-ledger-fixture.v1"
    build = run(["docker", "build", "--pull=false", "--network=none", "--quiet", "--file", str(dockerfile), "--tag", IMAGE, "."])
    checks["offline_fixture_build_passed"] = build.returncode == 0
    image_id = ""
    executable_sha = ""
    report: dict[str, object] = {}
    if build.returncode == 0:
        inspect = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspect.stdout.strip()
        checks["image_identity_recorded"] = inspect.returncode == 0 and image_id.startswith("sha256:")
        executable = run(["docker", "run", "--rm", "--network", "none", "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_sha = executable.stdout.strip().split()[0]
        checks["fixture_executable_identity"] = executable_sha == EXPECTED_EXECUTABLE
        fixture = run(["docker", "run", "--rm", "--network", "none", "--read-only", "--cap-drop", "ALL", "--security-opt", "no-new-privileges", "--pids-limit", "64", IMAGE])
        report = parse_last_json(fixture)
        checks["fixture_exit_zero"] = fixture.returncode == 0
        checks["fixture_11_of_11_pass"] = report.get("status") == "PASS" and report.get("checks_passed") == report.get("checks_total") == 11
        checks["fixture_exact_quarter"] = report.get("p2_origin_contains_quarter") is True
        checks["fixture_candidate_neutral"] = report.get("candidate_evaluations") == 0 and report.get("positive_parameter_samples") == 0 and report.get("candidate_roots_created") is False
        checks["fixture_authority_false"] = report.get("scientific_handler_linked") is False and report.get("authority_promoted") is False

    checks["protected_roots_absent_after"] = all(not (ROOT / path).exists() for path in PROTECTED)
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p6_parent_runtime_binding_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "failed": failed,
        "selector_thread_count": 16,
        "fixture_executable_sha256": executable_sha,
        "fixture_report": report,
        "full_selector_executed": False,
        "frozen_candidate_evaluated": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
