#!/usr/bin/env python3
"""Static audit of candidate-neutral H2-P8P-R28."""
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r28-forward-hostkey-path-successor-proposal.md"
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r27-terminal-hostkey-receipt-result.md"
R27 = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r27_native_openssh_controller_v1.ps1"
R28 = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r28_forward_path_controller_v1.ps1"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


text = PACKET.read_text(encoding="utf-8")
flat = " ".join(text.split())
r27 = R27.read_text(encoding="utf-8")
r28 = R28.read_text(encoding="utf-8")
normalized = r28.replace("r28", "r27").replace("R28", "R27")
normalization_block = "    $KnownHostsOpenSsh = $KnownHosts.Replace('\\', '/')\n    if ($KnownHostsOpenSsh -notmatch '^[A-Za-z]:/') { throw 'forward-slash known_hosts path grammar mismatch' }\n"
normalized = normalized.replace(normalization_block, "")
normalized = normalized.replace("UserKnownHostsFile=$KnownHostsOpenSsh", "UserKnownHostsFile=$KnownHosts")
checks = {
    "required_header": all(item in text for item in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:",
    )),
    "r27_result_identity": digest(RESULT) == "d919944dc84839649be0801400b1df9ab33230ef07de6cda1f41e06681b63e41",
    "r28_identity": R28.stat().st_size == 14541 and digest(R28) == "479e59f066d6cba8367b4955a08c1c830e98c9eee68f1333c5e653cc7ccd6f50",
    "derived_only": normalized.strip() == r27.strip(),
    "path_conversion": "$KnownHosts.Replace('\\', '/')" in r28 and "forward-slash known_hosts path grammar mismatch" in r28,
    "converted_both_calls": r28.count("UserKnownHostsFile=$KnownHostsOpenSsh") == 2,
    "new_remote_name": "/home/dan/h2-p8p-r28-upload-v1.tar" in r28 and "/home/dan/h2-p8p-r27-upload-v1.tar" not in r28,
    "new_evidence_root": "h2-p8p-r28-native-openssh-execution-v1-20260903" in r28,
    "retained_vm": "4290604153416687194" in text and "nhm2-h2-p8p-r26-c2d-32-20260903" in text,
    "one_restart": "exactly one restart" in flat and "'compute','instances','start'" in r28,
    "no_new_resource": "no resource is created or deleted" in flat and "bulk','create" not in r28,
    "one_scp_ssh": "exactly one SCP" in flat and "one SSH handoff" in flat,
    "r27_preserved": "Preserve and do not use, replace or delete the retained R27 remote archive" in flat,
    "scientific_binding": "P=1024" in text and "32 CPUs" in text and "14,400-second" in text and "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718" in text,
    "cost_runtime": "18,000 seconds" in text and "`$9.00`" in text,
    "automatic_stop": "stops automatically or through the bounded failure handler" in flat,
    "first_failure": "First failure is terminal and consumes R28" in flat,
    "no_retry": "No retry, second restart" in flat and "I do not authorize retry" in flat,
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
