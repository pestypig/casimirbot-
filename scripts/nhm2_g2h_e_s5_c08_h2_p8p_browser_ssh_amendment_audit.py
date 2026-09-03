#!/usr/bin/env python3
"""Independent preexecution audit for the P8P browser-SSH amendment."""

from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
AMENDMENT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-browser-ssh-transport-amendment.md"
ORIGINAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-turnaround-cloud-execution-proposal.md"
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/h2-p8p-overlay-upload-v1.tar"
MANIFEST = ROOT / "h2-p8p-source-manifest.v1.json"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_turnaround_calibration_cloud_run_v1.sh"
RESULT_AUDIT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py"
PREAUDIT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/independent-proposal-audit.v1.json"

EXPECTED = {
    AMENDMENT: (7867, "373cc75ffba5f944feda351b2e91f99d792edbced0f2e52ed555de63adddb682"),
    ORIGINAL: (6414, "2b533a983120cd23e6b7bf3b4fbc5f3546e69000c67a91ee4033f98a2b14be80"),
    BASE: (236492800, "fa8d8c994b08fe8a31050feb125eb1d6e4ebb33c9f5de18d5f9e189716936978"),
    OVERLAY: (134656, "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"),
    MANIFEST: (2820, "c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0"),
    CONTROLLER: (4498, "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b"),
    RESULT_AUDIT: (9214, "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9"),
    PREAUDIT: (2050, "39152066f38d7557be9a07d6cec57a204cc7016d7440530c2d56d158d858835b"),
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    checks: OrderedDict[str, bool] = OrderedDict()
    for path, (size, expected_hash) in EXPECTED.items():
        key = path.name.replace(".", "_").replace("-", "_")
        checks[f"{key}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{key}_bytes"] = checks[f"{key}_regular"] and path.stat().st_size == size
        checks[f"{key}_sha256"] = checks[f"{key}_regular"] and digest(path) == expected_hash

    text = AMENDMENT.read_text(encoding="utf-8") if AMENDMENT.is_file() else ""
    normalized = " ".join(text.split())
    checks["required_work_packet_header"] = all(label in text for label in (
        "Program gate:", "Workstream:", "Capability or component:",
        "Current maturity:", "Target maturity:", "Required frozen inputs:",
        "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
        "Downstream gate unlocked:"))
    checks["transport_only_binding"] = all(value in normalized for value in (
        "changes transport only", "Every original term not explicitly replaced",
        "same authenticated base bytes", "same 12-entry overlay"))
    checks["resource_identity_unchanged"] = all(value in text for value in (
        "nhm2-h2-p8p-c1-c2d-32-20260901", "us-east1-c", "c2d-standard-32",
        "debian-12-bookworm-v20260817", "30 GB `pd-standard`", "18,000-second", "$9.00"))
    checks["exact_two_uploads"] = (
        "upload exactly these two local files" in text
        and "No other file upload is permitted" in text
        and text.count("236,492,800") >= 2 and text.count("134,656") >= 2)
    checks["ingress_and_output_absence_guards"] = all(value in text for value in (
        "initially absent regular paths", "nhm2-h2-p8p-source-v1",
        "nhm2-h2-p8p-evidence-v1", "nhm2-h2-p8p-evidence-export-v1.tgz"))
    checks["guest_identity_fail_closed"] = (
        "Require guest username `pestypig` and fail closed otherwise" in text
        and "require `whoami` to equal `pestypig`" in text)
    checks["docker_install_narrow"] = (
        "install only Debian's `docker.io` package if Docker is absent" in normalized
        and "without adding a repository, key or unrelated package" in normalized)
    checks["one_controller_one_process"] = all(value in normalized for value in (
        "invoke the unchanged 4,498-byte controller exactly once", "single P=1024 process",
        "14,400-second numerical timeout", "First failure is terminal"))
    checks["serial_recovery_fail_closed"] = all(value in text for value in (
        "P8P_EVIDENCE_BASE64_BEGIN", "P8P_EVIDENCE_BASE64_END",
        "absent, duplicated, truncated or hash-inconsistent", "Do not restart the VM"))
    checks["forbidden_substitutions_explicit"] = all(value in text for value in (
        "Cloud Workstations", "Cloud Storage", "local gcloud installation",
        "IAM/firewall mutation", "resource substitution"))
    checks["scientific_and_authority_locks"] = all(value in text for value in (
        "does not change the P8P source", "scientific changes or retuning",
        "P=65,536 execution", "Candidate, proof, geometry/state, lane, lamp, physical, propulsion and transport"))
    try:
        prior = json.loads(PREAUDIT.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        prior = {}
    checks["original_preexecution_audit_26_of_26"] = (
        prior.get("audit_status") == "PASS" and prior.get("checks_passed") == 26
        and prior.get("checks_total") == 26)
    checks["no_local_calibration_evidence"] = not (
        ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-turnaround-calibration-v1-20260901").exists()

    passed = sum(checks.values())
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_browser_ssh_amendment_audit.v1",
        "audit_status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "amendment_sha256": digest(AMENDMENT) if AMENDMENT.is_file() else None,
        "cloud_resource_created": False,
        "calibration_executed": False,
        "candidate_evaluated": False,
        "authority": {name: False for name in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport")},
    }
    output = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-browser-ssh-amendment-v1-20260901/independent-amendment-audit.v1.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{passed}/{len(checks)} {payload['audit_status']}")
    print(digest(output))
    return 0 if payload["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
