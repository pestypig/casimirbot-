#!/usr/bin/env python3
"""Independent build/static audit for candidate-neutral H2 timing calibration.

Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08 H2 timing calibration
Current maturity: implemented candidate-neutral calibration target
Target maturity: independently build-checked, runtime-unexecuted calibration
Required frozen inputs: unchanged C08-010c/d and H2 producer definitions
Required evidence: pinned hashes, exact cost counts, isolated executable identity
Stop/fail criteria: core drift, selected-member ingress, protected roots or authority
Explicit non-goals: H2 proof PASS, candidate execution, timing projection authority
Downstream gate unlocked: separately authorized isolated timing calibration only
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
IMAGE = "nhm2-g2h-e-s5-c08-h2-timing-calibration:v1-audit"
DOCKERFILE = G2H / "Dockerfile.primary.mini-boson-c08-h2-timing-calibration.v1"
EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-timing-calibration-v1"
EXPECTED_EXECUTABLE = "0afc791ec06d1d9870f77b4a0cc95460a3d0dca61a103e47a106e9415c2b2b73"
EXPECTED = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_timing_calibration_v1.cpp":
        "e6f12606590636297f93ae02cd632209020063be62ec4709ca96b177b72676a9",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-timing-calibration.v1":
        "3651125374f90ee8330f5227b46ab27daaa6bb499b24dd095cdb8d56ebd73dfb",
    "scripts/nhm2_g2h_e_s5_c08_h2_cost_model.py":
        "9d7aa36c41d4e8f6fe15b6f7402bac60aa89822b479f8ad9594fd1e680d37c30",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2h_e_s5_c08_h2_cost_model.py":
        "24ad22ffd43136e852b04bcda0ddc998852c9460734d5c07ff509efdf1e86c81",
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-h2-timing-calibration-packet.md":
        "e34bf3472b4d9fe4bf1c59cc416b396ffc60d914081a275f775d3fae148ee16b",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.hpp":
        "48344536a2ec09c510c71c02c1cd62cdd82e6612f0412223e0735e99c9d9e45f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_selector_v1.cpp":
        "057ddf85b0aaf68f9ef2f538c07687a48c910b3f62c4355449e673df15b903a7",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.hpp":
        "219fbbfd9e5056cda99dc00108ee003a22286311be9fc409695e444780f02b6f",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.cpp":
        "eccf43d23ae6667816441bbcbb0185630cbbec981d88206a54771e72dfe196d2",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.hpp":
        "55ef49529b8f9fdd4625e3844476503d85ebb4acf3a637275d8c78568df0cdb8",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.cpp":
        "cbfcae5357d7b7b6f80a6f28199088b3c49d58c9a8a6eab1647e3e4bf8135d7f",
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
    return subprocess.run(command, cwd=ROOT, check=False,
                          capture_output=True, text=True)


def parse(process: subprocess.CompletedProcess[str]) -> dict[str, object]:
    try:
        return json.loads(process.stdout.strip().splitlines()[-1])
    except (IndexError, json.JSONDecodeError):
        return {"stdout": process.stdout, "stderr": process.stderr}


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.extend((f"hash:{path}", sha(ROOT / path) == expected)
                  for path, expected in EXPECTED.items())
    checks.append(("protected_absent_before",
                   all(not (ROOT / path).exists() for path in PROTECTED)))

    source = (G2H / "mini_boson_star_primary_c08_h2_timing_calibration_v1.cpp").read_text(
        encoding="utf-8")
    packet = (ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-c08-h2-timing-calibration-packet.md").read_text(
        encoding="utf-8")
    checks.extend((
        ("separate_executable_name", "h2-timing-calibration-v1" in DOCKERFILE.read_text(encoding="utf-8")),
        ("fixed_precision_and_order", "precision_bits\\\":" in source
         and "order\\\":128" in source and "scalar::kPrecisionBits" in source),
        ("fixed_maximum_exponent", "kMaximumExponent = 16U" in source),
        ("exact_worst_case_panels", "kWorstCasePanels = 131071U" in source),
        ("exact_elementary_count", "kWorstCasePanels * jet::kElementaryConvolutions" in source),
        ("flushed_progress", "status\\\":\\\"PROGRESS" in source and "std::endl" in source),
        ("bounded_cli", "--max-exponent" in source and "parse_exponent" in source),
        ("candidate_neutral", "candidate_evaluations\\\":0" in source
         and "positive_parameter_samples\\\":0" in source),
        ("no_candidate_identity", "shat" not in source.lower() and "6/5" not in source),
        ("no_file_or_root_io", all(token not in source for token in (
            "fstream", "ifstream", "filesystem", "fopen", "artifacts/"))),
        ("packet_runtime_boundary", "isolated compute" in packet
         and "non-authority flag" in packet),
    ))

    tests = run([sys.executable, "-m", "unittest",
                 "tools.nhm2-spherical-boson-star-v2-branch-proof.test_g2h_e_s5_c08_h2_cost_model"])
    checks.append(("cost_model_tests", tests.returncode == 0))
    model_process = run([sys.executable,
                         "scripts/nhm2_g2h_e_s5_c08_h2_cost_model.py"])
    model = parse(model_process)
    checks.extend((
        ("cost_model_exit_zero", model_process.returncode == 0),
        ("cost_model_structural_only", model.get("status") == "STRUCTURAL_ONLY"),
        ("cost_model_exact_panels", model.get("cumulative_subpanels_per_selector") == 131071),
        ("cost_model_exact_elementary", model.get("elementary_convolutions_per_selector") == 5636053),
        ("cost_model_zero_authority", model.get("authority_promoted") is False),
    ))

    built = run(["docker", "build", "--network=none", "--quiet", "--file",
                 str(DOCKERFILE), "--tag", IMAGE, "."])
    checks.append(("docker_build", built.returncode == 0))
    image_id = ""
    executable_hash = ""
    description: dict[str, object] = {}
    if built.returncode == 0:
        inspected = run(["docker", "image", "inspect", IMAGE,
                         "--format", "{{.Id}}"])
        image_id = inspected.stdout.strip()
        checks.append(("image_identity_recorded", inspected.returncode == 0
                       and image_id.startswith("sha256:") and len(image_id) == 71))
        executable = run(["docker", "run", "--rm", "--network", "none",
                          "--entrypoint", "sha256sum", IMAGE, EXECUTABLE])
        if executable.returncode == 0:
            executable_hash = executable.stdout.strip().split()[0]
        checks.append(("executable_identity", executable_hash == EXPECTED_EXECUTABLE))
        described = run(["docker", "run", "--rm", "--network", "none",
                         "--read-only", "--cap-drop", "ALL", "--security-opt",
                         "no-new-privileges", "--pids-limit", "64", IMAGE,
                         "--describe"])
        description = parse(described)
        checks.extend((
            ("describe_exit_zero", described.returncode == 0),
            ("describe_structural_counts",
             description.get("status") == "DESCRIPTION"
             and description.get("worst_case_cumulative_subpanels_per_selector") == 131071
             and description.get("worst_case_elementary_convolutions_per_selector") == 5636053),
            ("describe_inert", description.get("candidate_evaluations") == 0
             and description.get("authority_promoted") is False),
        ))
    checks.append(("protected_absent_after",
                   all(not (ROOT / path).exists() for path in PROTECTED)))
    failures = [name for name, ok in checks if not ok]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_timing_calibration_audit.v1",
        "status": "PASS" if not failures else "FAIL",
        "checks_passed": len(checks) - len(failures),
        "checks_total": len(checks),
        "failures": failures,
        "image_id": image_id,
        "executable_sha256": executable_hash,
        "description": description,
        "arithmetic_calibration_executed": False,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    print(json.dumps(payload, sort_keys=True, separators=(",", ":")))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
