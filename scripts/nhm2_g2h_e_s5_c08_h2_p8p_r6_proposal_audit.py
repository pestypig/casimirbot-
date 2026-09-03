#!/usr/bin/env python3
"""Independent static audit of the candidate-neutral P8P-R6 proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r6-ssh-stability-native-picker-successor-proposal.md"
R5_RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r5-ssh-drop-preexecution-result.md"
R5_AUDITOR = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_r5_result_audit.py"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
STAGE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r3-browser-ingress-v1-20260901/chunks"


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


text = PROPOSAL.read_text(encoding="utf-8")
flat = " ".join(text.split())
manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
expected = {entry["name"]: (entry["bytes"], entry["sha256"]) for entry in manifest["chunks"]}
expected["h2-p8p-overlay-upload-v1.tar"] = (
    134656,
    "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e",
)
actual = {path.name: path for path in STAGE.iterdir()} if STAGE.is_dir() else {}

checks = {
    "required_header": all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:")),
    "r5_result_identity": digest(R5_RESULT) == "f078b95a667a7e54168c5526bf330beef23dd0fb9b2c465542e8e48dd049ef34",
    "r5_auditor_identity": digest(R5_AUDITOR) == "33120f4da9b27749870cfd0f4786c70a56c22a1927f62c2bff77157bf27b3f02",
    "stage_exact_inventory": set(actual) == set(expected) and len(actual) == 16,
    "stage_exact_identities": set(actual) == set(expected) and all(
        path.is_file() and not path.is_symlink()
        and path.stat().st_size == expected[name][0]
        and digest(path) == expected[name][1]
        for name, path in actual.items()),
    "causal_scope": all(value in flat for value in (
        "transport-stability discriminator", "not an optimization",
        "native file picker was not tested")),
    "one_resource": all(value in flat for value in (
        "dark-stratum-455714-h4", "nhm2-h2-p8p-r3-c2d-32-20260901",
        "637527339076077505", "us-east1-d", "c2d-standard-32",
        "debian-12-bookworm-v20260826", "30 GB `pd-standard`")),
    "ceilings": "18,000 seconds" in flat and "$9.00" in flat and "14,400-second external timeout" in flat,
    "one_restart_ssh": "Authorize one restart only" in flat and "exactly one new authenticated browser-SSH surface" in flat,
    "native_command_path": "only the native UI keyboard-control path" in flat and "no preliminary browser accessibility/API typing attempt" in flat,
    "roundtrip_marker": "printf '%s\\n' R6_SSH_ROUNDTRIP_READY" in text and "Require exact output `R6_SSH_ROUNDTRIP_READY`" in flat,
    "passive_interval": "exactly 30 passive seconds" in flat,
    "absence_guard": "R4_REMOTE_ABSENT_16" in text and "unchanged absence guard exactly once" in flat,
    "single_picker_batch": all(value in flat for value in (
        "visible Upload control once", "one native Windows file-open dialog",
        "exactly sixteen successful transfer items")),
    "archive_bindings": all(value in text for value in (
        "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978",
        "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e")),
    "guest_bindings": all(value in text for value in (
        "f7112c5a547b48814ee63961cc6b441cd67f147b0bc47feb6ea8f98cddf8ca96",
        "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718",
        "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9")),
    "bounded_docker": "if and only if the unchanged ledger's exact presence check proves it absent" in flat,
    "single_process": "exactly one candidate-neutral P=1024 controller process" in flat,
    "first_failure": "First failure is terminal" in flat,
    "automatic_stop": "stop the VM automatically" in flat,
    "p8q_trinary": all(value in text for value in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED")),
    "no_full_run": "No result authorizes P=65,536" in flat,
    "authority_locks": all(value in flat for value in (
        "Candidate evaluations and positive samples remain zero",
        "physical, propulsion and transport authority remain false")),
    "authorization_text": "## Exact authorization text" in text and "PROPOSAL_SHA256" in text,
}

for name, passed in checks.items():
    print(f"{'PASS' if passed else 'FAIL'} {name}")
passed = sum(checks.values())
print(f"SUMMARY {passed}/{len(checks)}")
print(f"PROPOSAL_SHA256 {digest(PROPOSAL)}")
raise SystemExit(0 if passed == len(checks) else 1)
