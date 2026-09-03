#!/usr/bin/env python3
"""Independent audit of the exact P8P-R2 browser guest ledger."""

from __future__ import annotations

import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LEDGER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r2_browser_guest_sequence_v1.sh"
PACKET = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r2-browser-guest-ledger.md"
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r2-zone-capacity-successor-proposal.md"
GIT_BASH = Path(r"C:\Program Files\Git\bin\bash.exe")


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


raw = LEDGER.read_bytes()
text = raw.decode("utf-8")
flat = " ".join(text.split())
packet = PACKET.read_text(encoding="utf-8")
packet_flat = " ".join(packet.split())
proposal = PROPOSAL.read_text(encoding="utf-8")

syntax = subprocess.run(
    [str(GIT_BASH), "-n", str(LEDGER)],
    check=False,
    capture_output=True,
    text=True,
) if GIT_BASH.is_file() else None

checks = {
    "ledger_identity": len(raw) == 2845 and digest(raw) == "d7f98f542ee776eec9f6d24173031f2b671bb54e59fd74d44d5b637990f536a6",
    "line_count": len(text.splitlines()) == 79,
    "syntax": syntax is not None and syntax.returncode == 0,
    "packet_identity": all(value in packet for value in ("2,845 bytes", "79 lines", digest(raw))),
    "proposal_binding": "0068d40da22fa8f3e9b8dc8a2924ae08c18fcf7c0f726bde8a8ab40f9bde483e" in packet,
    "guest_identity": '[[ "$(id -un)" == pestypig ]]' in text,
    "archive_paths": all(value in text and value in proposal for value in ("h2-p8f-c2-r1-cloud-upload-v1.tar", "h2-p8p-overlay-upload-v1.tar")),
    "archive_bytes": all(value in text for value in ("BASE_BYTES=236492800", "OVERLAY_BYTES=134656"))
    and all(value in proposal for value in ("236,492,800", "134,656")),
    "archive_hashes": all(value in text and value in proposal for value in ("fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978", "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")),
    "absence_atomic": '[[ ! -e "$ROOT" && ! -e "$EVIDENCE" && ! -e "$EXPORT" ]]' in text,
    "docker_narrow": all(value in text for value in ("if ! command -v docker", "apt-get install -y docker.io", "systemctl enable --now docker", "docker version")),
    "no_extra_package_repo": all(value not in text for value in ("apt-key", "add-apt-repository", "download.docker.com", "curl ", "wget ")),
    "extract_order": text.index('tar -xf "$BASE"') < text.index('tar -xf "$OVERLAY"'),
    "manifest_identity": all(value in text for value in ("MANIFEST_BYTES=2820", "c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0")),
    "manifest_replay": all(value in text for value in ('assert len(entries) == 11', 'manifest["candidate_neutral"] is True', 'manifest["calibration_panel_count"] == 1024', 'manifest["thread_count"] == 32', 'hashlib.sha256(raw).hexdigest() == entry["sha256"]')),
    "authority_exact": all(f'"{name}": False' in text for name in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")),
    "controller_identity": "CONTROLLER_BYTES=4498" in text
    and "4,498-byte controller" in proposal
    and "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b" in text
    and "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b" in proposal,
    "controller_syntax": 'bash -n "$CONTROLLER"' in text,
    "single_controller_invocation": text.count('sudo bash "$CONTROLLER"') == 1 and text.rstrip().endswith('sudo bash "$CONTROLLER"'),
    "no_cloud_or_candidate_action": all(value in packet_flat for value in ("creates no resource", "authorizes no execution", "No candidate, proof, geometry/state, lane, lamp, physical, propulsion or transport authority is promoted.")),
    "confirmation_bound": "action-time confirmation immediately before entering the ledger" in packet_flat,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")

passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"LEDGER_SHA256 {digest(raw)}")
print(f"PACKET_SHA256 {digest(PACKET.read_bytes())}")
raise SystemExit(0 if passed == len(checks) else 1)
