#!/usr/bin/env python3
"""Static audit of candidate-neutral H2-P8P-R29."""
from __future__ import annotations

import hashlib
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r29-no-space-hostkey-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r28-terminal-spaced-hostkey-result.md"
R28 = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r28_forward_path_controller_v1.ps1"
R29 = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r29_no_space_hostkey_controller_v1.ps1"
SSH = Path(r"C:\Windows\System32\OpenSSH\ssh.exe")
SHORT = Path(r"C:\Users\dan\AppData\Local\NHM2\p8p-r29-known-hosts")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
r28 = R28.read_text(encoding="utf-8")
r29 = R29.read_text(encoding="utf-8")
parsed = subprocess.run(
    [str(SSH), "-G", "-o", "UserKnownHostsFile=C:/Users/dan/AppData/Local/NHM2/p8p-r29-known-hosts", "example.invalid"],
    check=False, capture_output=True, text=True,
)
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "r28_result_identity": digest(RESULT) == "0eecabbb9c2d763e0e9c082b23101d47fa1a87119791d053640d223029a41fb9",
    "r29_identity": R29.stat().st_size == 14891 and digest(R29) == "e7163c720f6850fae9dd4a42499e0ee9f9d880823fd575d80384dec27de88e8e",
    "short_path_absent": not SHORT.exists(),
    "ssh_option_parse": parsed.returncode == 0 and "userknownhostsfile C:/Users/dan/AppData/Local/NHM2/p8p-r29-known-hosts" in parsed.stdout,
    "no_space_path": "C:\\Users\\dan\\AppData\\Local\\NHM2\\p8p-r29-known-hosts" in r29,
    "receipt_copy": "known_hosts.r29.copy" in r29 and "known_hosts evidence copy hash mismatch" in r29,
    "new_remote_name": "/home/dan/h2-p8p-r29-upload-v1.tar" in r29 and "/home/dan/h2-p8p-r28-upload-v1.tar" not in r29,
    "new_evidence": "h2-p8p-r29-native-openssh-execution-v1-20260903" in r29,
    "retained_vm": "4290604153416687194" in text and "nhm2-h2-p8p-r26-c2d-32-20260903" in text,
    "one_restart": "exactly one restart" in flat and "'compute','instances','start'" in r29,
    "no_new_resource": "R29 creates no cloud resource" in flat and "bulk','create" not in r29,
    "one_scp_ssh": "exactly one native SCP" in flat and "One SSH handoff" in flat,
    "partials_preserved": "Preserve and do not use, replace or delete the retained R27/R28 remote archives" in flat,
    "scientific_binding": "P=1024" in text and "32 CPUs" in text and "14,400-second" in text and "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
    "cost_runtime": "18,000 seconds" in text and "`$9.00`" in text,
    "automatic_stop": "stopped automatically or by the failure handler" in flat,
    "first_failure": "First failure is terminal and consumes R29" in flat,
    "no_retry": "No second restart" in flat and "I do not authorize retry" in flat,
    "p8q_only": "only produce the frozen P8Q resource-bounded yes/no decision" in flat,
    "authority_locks": "Candidate evaluations and positive samples remain zero" in flat and "physical, propulsion and transport authority remain false" in flat,
    "no_cloud_action": "RETAINED VM REMAINS TERMINATED" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PACKET_SHA256 {digest(PACKET)}")
raise SystemExit(0 if passed == len(checks) else 1)
