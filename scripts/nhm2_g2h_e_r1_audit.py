#!/usr/bin/env python3
"""Candidate-neutral G2H-E-R1 source/runtime/proposal closure audit."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
DOCS = ROOT / "docs/research"

OLD_FILES = {
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-execution-proposal.v1.json": "bab85c219be9245b77b6a353b9aa47cebe13153107f7d46e0d0e699071feb46e",
    "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v1.txt": "348dc0f0f7bedf1e825b83218f55f3a20cdf3507b1b04189a8db8618778e87f3",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-invocation.json": "0640623244279e787b74b85980fa7d52a038f4312f006eb7100116849aaeb5c8",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1-result.json": "44ab716de6b2657d549cc6589241fab7a728af3c5baf2e25c184911348913b0f",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1.stdout.log": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v1.stderr.log": "8a51fa06ab6ee3ab86f7d081f8dc62c95d81c17c86ce12b8ae05cf8519be2643",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_proof.c": "8a458dbb599c1ebb2c4bc7fa8263e724651607c7a39a5c458f44b73143613603",
}

NEW_FILES = {
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_proof_v2.c": "2d20513005834ca87885a30ab65a1b4b3c1d835904d3247dc6cebc71e4e59740",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/tolman_vii_primary_self_identity_fixture_v1.c": "df9b407db25556daee3f79f819daf10926cbc4b6a14e9a6e73ba3ffe34353a9a",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.proof.v2": "a6ffc8919712d2f0bf8aff7c623e709ac95c22f232c97d9e32793765a55125f1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.self-identity-fixture.v1": "1eda79032bfa7bbf624dc2691af6685135df2a1011e0c7ed751cbbf00b2cc729",
    "scripts/nhm2_g2h_e_r1_successor_checkpoint.py": "8de58e8a36236168eab39eb43e090a7aafe5ed7c29c983e4d5cbe1bdaffc20f5",
}

PROOF_IMAGE = "nhm2-g2h-primary-proof:v2"
PROOF_IMAGE_ID = "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab"
PROOF_EXECUTABLE = "/usr/local/bin/tolman-vii-primary-proof-v2"
PROOF_EXECUTABLE_SHA256 = "666ba126413e63318275bf0861b860707ce7046bcd278c3ee73b1f65f9369028"
FIXTURE_IMAGE = "nhm2-g2h-primary-self-identity-fixture:v1"
FIXTURE_IMAGE_ID = "sha256:b64c6aa1f2ede1af0fa8cf3617b844712124e66a21ef5e37fdbb9e68588e870e"
FIXTURE_EXECUTABLE = "/usr/local/bin/tolman-vii-primary-self-identity-fixture-v1"
FIXTURE_EXECUTABLE_SHA256 = "9bbf05c06d389829082e3ec3497c873a635e9c9db6e32361344bd08c1545a6bd"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run(command: list[str]) -> str:
    result = subprocess.run(command, cwd=ROOT, text=True, encoding="utf-8",
                            capture_output=True, check=False)
    if result.returncode != 0:
        raise AssertionError(
            f"command failed ({result.returncode}): {' '.join(command)}\n{result.stderr}"
        )
    return result.stdout.strip()


def image_id(image: str) -> str:
    return run(["docker", "image", "inspect", image, "--format", "{{.Id}}"])


def executable_hash(image: str, executable: str) -> str:
    output = run([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--entrypoint", "/usr/bin/sha256sum", image, executable,
    ])
    return output.split()[0]


def main() -> int:
    checks: list[tuple[str, bool]] = []
    checks.append(("old_evidence_byte_identity", all(
        (ROOT / relative).is_file() and sha256(ROOT / relative) == expected
        for relative, expected in OLD_FILES.items()
    )))

    state = json.loads(run([
        "docker", "container", "inspect", "nhm2-g2h-e-primary-v1",
        "--format", "{{json .State}}",
    ]))
    container_id = run([
        "docker", "container", "inspect", "nhm2-g2h-e-primary-v1",
        "--format", "{{.Id}}",
    ])
    checks.append(("old_container_retained_stopped_exit_66",
                   container_id == "ed7ed5fd641507c5457d83943489e0cc2c521a723509a76bcc1fd4668b00270c"
                   and state["Status"] == "exited" and state["ExitCode"] == 66
                   and not state["OOMKilled"]))
    checks.append(("new_source_and_checkpoint_byte_identity", all(
        (ROOT / relative).is_file() and sha256(ROOT / relative) == expected
        for relative, expected in NEW_FILES.items()
    )))

    source = (G2H / "tolman_vii_primary_proof_v2.c").read_text(encoding="utf-8")
    checks.append(("generic_hash_retains_nofollow",
                   "open(path, O_RDONLY | O_CLOEXEC | O_NOFOLLOW)" in source))
    checks.append(("fixed_self_path_only",
                   'open("/proc/self/exe", O_RDONLY | O_CLOEXEC)' in source
                   and 'primary_hash_file("/proc/self/exe"' not in source))
    checks.append(("self_descriptor_regular_file_gate",
                   "fstat(descriptor, &information)" in source
                   and "!S_ISREG(information.st_mode)" in source))
    checks.append(("old_and_new_root_chronology_in_source",
                   "tolman-vii-primary-v2" in source
                   and "EXHAUSTED_PRIMARY_ROOT" in source
                   and "primary_file_is_absent(EXHAUSTED_PRIMARY_ROOT)" in source))

    checks.append(("primary_image_identity", image_id(PROOF_IMAGE) == PROOF_IMAGE_ID))
    checks.append(("primary_executable_identity",
                   executable_hash(PROOF_IMAGE, PROOF_EXECUTABLE)
                   == PROOF_EXECUTABLE_SHA256))
    checks.append(("fixture_image_identity", image_id(FIXTURE_IMAGE) == FIXTURE_IMAGE_ID))
    checks.append(("fixture_executable_identity",
                   executable_hash(FIXTURE_IMAGE, FIXTURE_EXECUTABLE)
                   == FIXTURE_EXECUTABLE_SHA256))

    fixture = json.loads(run([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--pids-limit", "32", "--memory", "256m",
        "--tmpfs", "/tmp:rw,noexec,nosuid,size=16m", FIXTURE_IMAGE,
    ]))
    checks.append(("actual_linux_procfs_eloop_reproduced",
                   fixture["procfs_nofollow_errno"] == 40))
    checks.append(("self_descriptor_hash_agreement",
                   fixture["self_sha256"] == FIXTURE_EXECUTABLE_SHA256
                   and fixture["self_bytes"] > 0))
    checks.append(("adversarial_symlink_rejected",
                   fixture["arbitrary_symlink_rejected"] is True))
    checks.append(("mutation_detected", fixture["mutation_detected"] is True))
    checks.append(("fixture_candidate_entrypoint_not_invoked",
                   fixture["candidate_entrypoint_invocations"] == 0))

    binding = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-r1-build-binding.v1.json"
    proposal = DOCS / "nhm2-spherical-boson-star-v2-g2h-e-r1-successor-proposal.v1.json"
    checks.append(("binding_sidecar", sha256(binding) ==
                   (binding.with_suffix(".sha256").read_text(encoding="ascii").split()[0])))
    checks.append(("proposal_sidecar", sha256(proposal) ==
                   (proposal.with_suffix(".sha256").read_text(encoding="ascii").split()[0])))
    proposal_data = json.loads(proposal.read_text(encoding="utf-8"))
    checks.append(("proposal_inert_and_primary_only",
                   proposal_data["separate_user_authorization_required"] is True
                   and proposal_data["authority"]["candidate_execution_authorized"] is False
                   and proposal_data["authority"]["independent_execution_authorized"] is False
                   and proposal_data["authority"]["candidate_evaluations"] == 0))

    absent = [
        "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
        "artifacts/research/nhm2/g2h/tolman-vii-primary-v2",
        "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v2.txt",
        "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-invocation.json",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2-result.json",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2.stdout.log",
        "artifacts/research/nhm2/g2h-executions/g2h-e-primary-v2.stderr.log",
    ]
    checks.append(("future_and_candidate_roots_absent",
                   all(not (ROOT / relative).exists() for relative in absent)))
    inspect = subprocess.run(
        ["docker", "container", "inspect", "nhm2-g2h-e-primary-v2"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
    )
    checks.append(("future_execution_container_absent", inspect.returncode != 0))

    for name, passed in checks:
        print(f"{'PASS' if passed else 'FAIL'} {name}")
    passed_count = sum(passed for _, passed in checks)
    print(f"SUMMARY {passed_count}/{len(checks)}")
    return 0 if passed_count == len(checks) else 1


if __name__ == "__main__":
    sys.exit(main())
