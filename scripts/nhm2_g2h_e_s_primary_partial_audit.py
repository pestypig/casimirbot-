#!/usr/bin/env python3
"""Read-only audit of the sole G2H-E-S primary-v2 partial execution."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_proof_v2.c"
CHECKPOINT = ROOT / "scripts/nhm2_g2h_e_r1_successor_checkpoint.py"
AUTHORIZATION = ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v2.txt"
PRIMARY_ROOT = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v2"
INDEPENDENT_ROOT = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1"
INDEPENDENT_AUTH = ROOT / "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt"
LEDGER = {
    "invocation": ("artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-invocation.json", "2b6e57dc5a9586f16737f6dc2d190d2d8f22f92ac09328e989112e035aaccdd2"),
    "result": ("artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-result.json", "0d3987694b1b47d5eb92cee644bff9458ec80185a819f8764f6de94b7bcb79c9"),
    "stdout": ("artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2.stdout.log", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
    "stderr": ("artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2.stderr.log", "8a51fa06ab6ee3ab86f7d081f8dc62c95d81c17c86ce12b8ae05cf8519be2643"),
}
OLD_LEDGER = {
    "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt": "348dc0f0f7bedf1e825b83218f55f3a20cdf3507b1b04189a8db8618778e87f3",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-invocation.json": "0640623244279e787b74b85980fa7d52a038f4312f006eb7100116849aaeb5c8",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-result.json": "44ab716de6b2657d549cc6589241fab7a728af3c5baf2e25c184911348913b0f",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1.stdout.log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1.stderr.log": "8a51fa06ab6ee3ab86f7d081f8dc62c95d81c17c86ce12b8ae05cf8519be2643",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def docker_value(arguments: list[str]) -> str:
    result = subprocess.run(arguments, cwd=ROOT, text=True, encoding="utf-8",
                            capture_output=True, check=False)
    if result.returncode != 0:
        raise AssertionError(result.stderr)
    return result.stdout.strip()


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.append(("authorization_identity",
                   AUTHORIZATION.stat().st_size == 380
                   and sha256(AUTHORIZATION) == "452537efaf5ae64260122fac63cc8817b3babb4eb15668dfe8dc92bcbb16cc10"))
    checks.append(("v2_ledger_identity", all(
        (ROOT / relative).is_file() and sha256(ROOT / relative) == expected
        for relative, expected in LEDGER.values()
    )))
    invocation = json.loads((ROOT / LEDGER["invocation"][0]).read_text(encoding="utf-8"))
    result = json.loads((ROOT / LEDGER["result"][0]).read_text(encoding="utf-8"))
    checks.append(("invocation_binding",
                   invocation["authorization_sha256"] == sha256(AUTHORIZATION)
                   and invocation["binding_sha256"] == "e7865e334dc35f795120ac1d1d0d29c7c7d965bc006eae028fa6952e5c008388"
                   and invocation["image_id"] == "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab"
                   and invocation["retry_allowed"] is False))
    checks.append(("process_result_exit_66",
                   result["returncode"] == 66 and result["output_root_exists"] is False
                   and result["retry_allowed"] is False))
    checks.append(("stderr_exact",
                   (ROOT / LEDGER["stderr"][0]).read_bytes()
                   == b"digest, source, runtime or authorization preflight rejected\n"))

    state = json.loads(docker_value([
        "docker", "container", "inspect", "nhm2-g2h-e-primary-v2",
        "--format", "{{json .State}}",
    ]))
    container_id = docker_value([
        "docker", "container", "inspect", "nhm2-g2h-e-primary-v2",
        "--format", "{{.Id}}",
    ])
    checks.append(("v2_container_retained",
                   container_id == "6ffbd649062affbfdc231cd3ae4fb5965d4f87b56bf06eb9596270ce07a9644b"
                   and state["Status"] == "exited" and state["ExitCode"] == 66
                   and not state["OOMKilled"]))
    checks.append(("candidate_root_absent", not PRIMARY_ROOT.exists()))
    checks.append(("independent_lane_absent",
                   not INDEPENDENT_ROOT.exists() and not INDEPENDENT_AUTH.exists()))
    checks.append(("old_evidence_preserved", all(
        (ROOT / relative).is_file() and sha256(ROOT / relative) == expected
        for relative, expected in OLD_LEDGER.items()
    )))

    source = SOURCE.read_text(encoding="utf-8")
    checkpoint = CHECKPOINT.read_text(encoding="utf-8")
    checks.append(("binary_parser_requires_v1_schema",
                   'strcmp(value, "nhm2.g2h_execution_authorization.v1") == 0' in source))
    checks.append(("checkpoint_requires_v2_schema",
                   '("schema", "nhm2.g2h_execution_authorization.v2")' in checkpoint))
    checks.append(("persisted_authorization_is_v2",
                   AUTHORIZATION.read_text(encoding="ascii").splitlines()[0]
                   == "schema=nhm2.g2h_execution_authorization.v2"))
    checks.append(("other_input_bindings_match",
                   sha256(ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json")
                   == "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d"
                   and sha256(SOURCE) == "2d20513005834ca87885a30ab65a1b4b3c1d835904d3247dc6cebc71e4e59740"))

    fixture = json.loads(docker_value([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--pids-limit", "32", "--memory", "256m",
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m",
        "nhm2-g2h-primary-authorization-schema-fixture:v1",
    ]))
    checks.append(("actual_c_parser_schema_reproduction",
                   fixture == {"candidate_entrypoint_invocations": 0,
                               "v1_admitted": True, "v2_rejected": True}))
    checks.append(("fixture_image_identity",
                   docker_value(["docker", "image", "inspect",
                                 "nhm2-g2h-primary-authorization-schema-fixture:v1",
                                 "--format", "{{.Id}}"])
                   == "sha256:4d87dc36a34227f0614ccf3b6132455d003d5af33ab8cf9d357adee898ea1c3d"))
    checks.append(("candidate_evaluations_zero",
                   not PRIMARY_ROOT.exists() and fixture["candidate_entrypoint_invocations"] == 0))

    for name, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    passed_count = sum(passed for _, passed in checks)
    print(f"SUMMARY {passed_count}/{len(checks)}")
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
