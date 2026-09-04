#!/usr/bin/env python3
"""Static audit of the candidate-neutral H2-P8P-R27 proposal."""
from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r27-native-openssh-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r26-terminal-transport-result.md"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r27_native_openssh_controller_v1.ps1"
ARCHIVE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r16-regional-bulk-ingress-v1-20260902/h2-p8p-r16-regional-bulk-upload-v1.tar"
SSH = Path(r"C:\Windows\System32\OpenSSH\ssh.exe")
SCP = Path(r"C:\Windows\System32\OpenSSH\scp.exe")
SSH_KEYGEN = Path(r"C:\Windows\System32\OpenSSH\ssh-keygen.exe")
PRIVATE = Path(r"C:\Users\dan\.ssh\google_compute_engine")
PUBLIC = Path(r"C:\Users\dan\.ssh\google_compute_engine.pub")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
controller = CONTROLLER.read_text(encoding="utf-8")
derived = subprocess.run(
    [str(SSH_KEYGEN), "-y", "-f", str(PRIVATE)],
    check=False, capture_output=True, text=True,
)
public_prefix = " ".join(PUBLIC.read_text(encoding="utf-8").split()[:2])
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "r26_result_identity": digest(RESULT) == "2342d09450b8bbb71b65de3a8d1af54d422b00a4789a58e3f6dee96a1b4e6dd7",
    "controller_identity": CONTROLLER.stat().st_size == 14360 and digest(CONTROLLER) == "4fdb40027927f8d0006cfcb6e604fe7dad44b8ed481c484161b215434af14911",
    "ssh_identity": SSH.stat().st_size == 1255424 and digest(SSH) == "6250fd52163fe99a0dc49403ed1b4bbef9b764bdb7bada017a93d057d9376a42",
    "scp_identity": SCP.stat().st_size == 432128 and digest(SCP) == "63b7118d8e1a8a84398cf4ce1584dc6b146606092fe9c68bbaf110bbdcfb480a",
    "private_identity": PRIVATE.stat().st_size == 1675 and digest(PRIVATE) == "37e1a9dab99f498aa6d01e335e5351088247cb307175b60ee71f9f37c88b2b95",
    "public_identity": PUBLIC.stat().st_size == 417 and digest(PUBLIC) == "d5035122b18833ab736834cc388af852317573913804a32d233326afd2bb5bc7",
    "key_derivation": derived.returncode == 0 and derived.stdout.strip() == public_prefix,
    "archive_identity": ARCHIVE.stat().st_size == 236640768 and digest(ARCHIVE) == "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5",
    "retained_vm": "4290604153416687194" in text and "nhm2-h2-p8p-r26-c2d-32-20260903" in text,
    "one_restart": "exactly one restart" in flat and "'compute','instances','start'" in controller,
    "no_new_resource": "No new VM" in flat and "bulk','create" not in controller,
    "one_scp_one_ssh": "exactly one SCP" in flat and "exactly one SSH handoff" in flat,
    "native_capture": "$PSNativeCommandUseErrorActionPreference = $false" in controller and "native command failed" in controller,
    "explicit_dan": "exact guest identity `dan`" in flat and '"dan@${ip}:$remoteArchive"' in controller,
    "isolated_hostkey": "StrictHostKeyChecking=accept-new" in controller and "StrictHostKeyChecking=yes" in controller and "known_hosts.r27" in controller,
    "pestypig_required": "getent passwd pestypig" in controller and "useradd" not in controller,
    "unchanged_inputs": all(value in controller for value in (
        "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
        "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6",
    )),
    "scientific_binding": "P=1024" in text and "32 CPUs" in text and "14,400-second" in text and "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
    "automatic_stop": "stops the exact VM on any failure" in flat and "failure-stop.txt" in controller,
    "cost_runtime": "18,000 seconds" in text and "`$9.00`" in text and "$RuntimeCeilingSeconds = 18000" in controller,
    "first_failure": "First failure is terminal and consumes R27" in flat,
    "no_retry": "No second restart" in flat and "I do not authorize a retry" in flat,
    "p8q_only": "only supply the frozen P8Q resource-bounded yes/no decision" in flat,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
    "no_cloud_action": "RETAINED VM REMAINS TERMINATED" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
