#!/usr/bin/env python3
"""Source/runtime audit of the acknowledged candidate-neutral C08-002 module."""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-primary-c08-canonical-ingress-fixture:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-canonical-ingress-fixture.v1"

EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_canonical_ingress_v1.hpp":
        "16a11dd810612a831649a5ae057011dc4ef4c864936fa80fc04aad358f8f2946",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_canonical_ingress_v1.cpp":
        "380998de8d51289c06579b4dd4a730a73966db1d6c91427c048d8e498a0014ee",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_canonical_ingress_fixture_v1.cpp":
        "1889db7b2cf7bde99ec145856ba6f7883438b698e9e50c03af303ba9793bdeae",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-canonical-ingress-fixture.v1":
        "e2944936a6cd7d5e50f26537a84f73e105836c170f0df7b597e834e8f58a7ce4",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json":
        "efbff4c1f9490803e7283ff8d1906fbdeedae787d78047d42f3061bd975efc48",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-statement.txt":
        "92ca4c820f879946911e111ca8e7f6c0524947a7e6bab6efa70183850cba53c1",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-acknowledgement-decision.v1.json":
        "ec623997e0f84c05e3d60d66b7609882706b15c4f3643ac7b429f071516e9280",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a-borel-growth-quadrature-contract.v1.json":
        "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
    "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_acknowledgement_gate.py":
        "c77c69e0ac83d46500ed39ec96c745cfcbb248ad024a441f8a9ff3bb7c83a4f8",
}

EXPECTED_EXECUTABLE = "7f7be65aca7ea82d7d78573216be094dd27e7d33ff68ab3738b1aa335edb21c4"

PROTECTED = (
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    "artifacts/nhm2/g2h-e-s5/executions",
)


def digest(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True, text=True)


def json_report(result: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(result.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"parse_failure": result.stdout, "stderr": result.stderr}


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{relative}", digest(ROOT / relative) == expected)
                  for relative, expected in EXPECTED.items())
    checks.append(("protected_absent_before", all(not (ROOT / path).exists() for path in PROTECTED)))

    source = (G2H / "mini_boson_star_primary_c08_canonical_ingress_v1.cpp").read_text(encoding="utf-8")
    header = (G2H / "mini_boson_star_primary_c08_canonical_ingress_v1.hpp").read_text(encoding="utf-8")
    dockerfile = DOCKERFILE.read_text(encoding="utf-8")
    checks.extend((
        ("all_fixed_bounds_embedded", all(token in source for token in (
            "kMaximumRawBytes = 65536U", "kMaximumCanonicalBytes = 65536U",
            "kMaximumDepth = 8U", "kMaximumNodes = 1024U",
            "kMaximumMembers = 64U", "kMaximumElements = 64U",
            "kMaximumStringBytes = 1024U", "kMaximumKeyBytes = 128U",
            "kMaximumCumulativeStringBytes = 65536U", "kMaximumNumberBytes = 64U"))),
        ("exact_identities_embedded", all(token in source for token in (
            "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737",
            "665b6d9ddd9d2108274652414ec9d6a0a2fb43f86f28ab3ab64db70003c7f520",
            "nhm2-g2h-e-s5-a/borel-contract/v1\\n"))),
        ("bounded_growth_arithmetic", "checked_add" in source
         and "before growth" in (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-canonical-ingress-resource-contract.v1.json").read_text(encoding="utf-8")),
        ("rfc8785_number_primitives", "std::from_chars" in source and "std::to_chars" in source
         and "scientific_exponent" in source and "result_out_of_range" in source),
        ("duplicate_and_surrogate_paths", "decoded_keys.insert" in source
         and "scalar >= 0xd800U" in source and "scalar >= 0xdc00U" in source),
        ("no_file_or_state_ingress", "fstream" not in source and "ifstream" not in source
         and "state_storage" not in source and "arb_" not in source),
        ("selected_identity_not_embedded", "shat" not in source.lower() and "6/5" not in source),
        ("candidate_neutral_header", "never performs file I/O" in header
         and "state-coefficient access" in header),
        ("digest_pinned_offline_images", "@sha256:9e94d19f" in dockerfile
         and "@sha256:8334e977" in dockerfile),
        ("exact_contract_copied", "7dd4d30a64d9c7eae8637a79e40f16b19d564b0081aeec21d0cdf886c3094737"
         not in dockerfile and "borel-growth-quadrature-contract.v1.json" in dockerfile),
    ))

    acknowledgement = run([sys.executable,
        "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_acknowledgement_gate.py", "--check-current"])
    acknowledgement_report = json_report(acknowledgement)
    checks.append(("acknowledgement_valid", acknowledgement.returncode == 0
                   and acknowledgement_report.get("status") == "ACKNOWLEDGEMENT_VALID"
                   and acknowledgement_report.get("implementation_eligible") is True
                   and acknowledgement_report.get("candidate_execution_authorized") is False))

    exact_audit = run([sys.executable, "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_audit.py"])
    exact_report = json_report(exact_audit)
    checks.append(("definition_exact_32_of_32", exact_audit.returncode == 0
                   and exact_report.get("checks_passed") == 32
                   and exact_report.get("checks_total") == 32))
    replay = run(["node", "scripts/nhm2_g2h_e_s5_c08_canonical_ingress_definition_replay.mjs"])
    replay_report = json_report(replay)
    checks.append(("definition_replay_30_of_30", replay.returncode == 0
                   and replay_report.get("checks_passed") == 30
                   and replay_report.get("checks_total") == 30))

    built = run(["docker", "build", "--quiet", "--file", str(DOCKERFILE),
                 "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    reports: list[dict[str, object]] = []
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE, "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("local_image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--entrypoint", "sha256sum", IMAGE,
            "/usr/local/bin/mini-boson-star-primary-c08-canonical-ingress-fixture-v1"])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        for _ in range(2):
            executed = run(["docker", "run", "--rm", "--network", "none", "--read-only",
                "--cap-drop", "ALL", "--security-opt", "no-new-privileges", IMAGE])
            report = json_report(executed)
            reports.append(report)
            checks.append(("fixture_exit_zero", executed.returncode == 0))
            checks.append(("fixture_40_of_40", report.get("checks_passed") == 40
                           and report.get("checks_total") == 40))
            checks.append(("fixture_candidate_inert", report.get("candidate_evaluations") == 0
                           and report.get("positive_parameter_samples") == 0
                           and report.get("candidate_roots_created") is False))
            checks.append(("fixture_authority_false", report.get("authority_promoted") is False
                           and report.get("scientific_handler_linked") is False))
        checks.append(("deterministic_fixture_report", len(reports) == 2 and reports[0] == reports[1]))
    else:
        checks.extend((
            ("local_image_identity_recorded", False), ("executable_identity", False),
            ("fixture_exit_zero", False), ("fixture_40_of_40", False),
            ("fixture_candidate_inert", False), ("fixture_authority_false", False),
            ("fixture_exit_zero", False), ("fixture_40_of_40", False),
            ("fixture_candidate_inert", False), ("fixture_authority_false", False),
            ("deterministic_fixture_report", False),
        ))
    checks.append(("protected_absent_after", all(not (ROOT / path).exists() for path in PROTECTED)))

    passed = sum(ok for _, ok in checks)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_canonical_ingress_runtime_audit.v1",
        "status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "failures": [name for name, ok in checks if not ok],
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "fixture_report": reports[0] if reports else {},
        "acknowledgement": acknowledgement_report,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authorization_created": False,
        "authority_promoted": False,
    }
    print(json.dumps(report, sort_keys=True, separators=(",", ":")))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
