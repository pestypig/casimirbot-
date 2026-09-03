#!/usr/bin/env python3
"""Independent definition-only audit for the frozen H2-P8P cloud proposal."""

from __future__ import annotations

import hashlib
import json
import subprocess
import tarfile
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-turnaround-cloud-execution-proposal.md"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/h2-p8p-overlay-upload-v1.tar"
MANIFEST = ROOT / "h2-p8p-source-manifest.v1.json"
CONTROLLER = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_turnaround_calibration_cloud_run_v1.sh"
RESULT_AUDIT = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_p8p_turnaround_result_audit.py"
FIXTURE_RECEIPT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-observer-progress-v1-20260901/h2-p8p-independent-audit.v2.json"

EXPECTED = {
    PROPOSAL: (6414, "2b533a983120cd23e6b7bf3b4fbc5f3546e69000c67a91ee4033f98a2b14be80"),
    OVERLAY: (134656, "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"),
    MANIFEST: (2820, "c6ee88481ae7842b176d4c8a2001601c38cc317132c446a086c92b75ddef5aa0"),
    CONTROLLER: (4498, "5af4b629336e166d07a277ae59b0f9776ac9e86b728e762030f27237ed1c8f5b"),
    RESULT_AUDIT: (9214, "cc25e6d79ec2d9fafd725285d39d1be5d6c004c2622884e95ed602bdc22411b9"),
}
EXPECTED_EXECUTABLE = "7c96648911ea74e43199e6c87291e2dd32a73f5d21fee8e20454cc8962e31718"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit() -> dict[str, object]:
    checks: OrderedDict[str, bool] = OrderedDict()
    for path, (size, expected_hash) in EXPECTED.items():
        key = path.name.replace(".", "_")
        checks[f"{key}_regular"] = path.is_file() and not path.is_symlink()
        checks[f"{key}_bytes"] = checks[f"{key}_regular"] and path.stat().st_size == size
        checks[f"{key}_sha256"] = checks[f"{key}_regular"] and digest(path) == expected_hash

    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        entries = manifest["entries"]
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, KeyError):
        manifest, entries = {}, []
    checks["manifest_shape"] = (
        manifest.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8p_source_manifest.v1"
        and manifest.get("candidate_neutral") is True and len(entries) == 11)
    checks["manifest_entries_authenticate"] = bool(entries) and all(
        (ROOT / entry["path"]).is_file()
        and (ROOT / entry["path"]).stat().st_size == entry["bytes"]
        and digest(ROOT / entry["path"]) == entry["sha256"]
        for entry in entries
    )
    try:
        with tarfile.open(OVERLAY, "r:") as archive:
            names = archive.getnames()
            unsafe = any(name.startswith("/") or ".." in Path(name).parts for name in names)
    except (OSError, tarfile.TarError):
        names, unsafe = [], True
    checks["overlay_exact_inventory"] = (
        len(names) == 12 and not unsafe
        and set(names) == {"h2-p8p-source-manifest.v1.json", *(entry["path"] for entry in entries)})

    proposal = PROPOSAL.read_text(encoding="utf-8") if PROPOSAL.is_file() else ""
    checks["required_work_packet_header"] = all(
        label in proposal for label in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:"))
    checks["one_run_resource_bounds"] = all(text in proposal for text in (
        "exactly one P=1024", "c2d-standard-32", "us-east1-c", "18,000-second",
        "$9.00", "14,400 seconds", "First failure is terminal"))
    checks["p8q_rule_preregistered"] = all(text in proposal for text in (
        "P8Q_YES_PROPOSAL_READY", "P8Q_NO_ALGORITHMIC_PERFORMANCE_LEAD",
        "P8Q_STOP_CALIBRATION_NOT_AUTHENTICATED", "It cannot authorize or execute P=65,536"))
    checks["authority_locks_explicit"] = all(text in proposal for text in (
        "No frozen-candidate evaluation", "No G3, SI, metric, lane, replay or lamp work",
        "physical, propulsion"))

    try:
        receipt = json.loads(FIXTURE_RECEIPT.read_text(encoding="utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        receipt = {}
    checks["independent_wrapper_audit_47_of_47"] = (
        receipt.get("status") == "PASS" and receipt.get("checks_passed") == 47
        and receipt.get("checks_total") == 47 and digest(FIXTURE_RECEIPT)
        == "e280a99cf1e4a16374b980d363d5e0b00f01c65edb0b5574c0770d28de9daabd")

    self_test = subprocess.run(
        ["python", str(RESULT_AUDIT), "--self-test"], cwd=ROOT,
        capture_output=True, text=True, check=False)
    checks["result_auditor_self_test_4_of_4"] = self_test.returncode == 0 and "4/4 PASS" in self_test.stdout
    try:
        binary = subprocess.run(
            ["docker", "run", "--rm", "--entrypoint", "sha256sum",
             "nhm2-g2h-e-s5-c08-h2-p8p-turnaround-calibration:preexecution-v1",
             "/usr/local/bin/mini-boson-star-primary-c08-h2-p8p-turnaround-calibration-v1"],
            cwd=ROOT, capture_output=True, text=True, check=False, timeout=120)
    except (OSError, subprocess.TimeoutExpired):
        binary = None
    checks["preexecution_binary_exact_without_calibration"] = (
        binary is not None and binary.returncode == 0
        and binary.stdout.split()[0] == EXPECTED_EXECUTABLE)
    checks["no_calibration_evidence_root"] = not (
        ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-turnaround-calibration-v1-20260901").exists()

    passed = sum(checks.values())
    return {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8p_cloud_proposal_audit.v1",
        "audit_status": "PASS" if passed == len(checks) else "FAIL",
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": checks,
        "proposal_sha256": digest(PROPOSAL) if PROPOSAL.is_file() else None,
        "calibration_executed": False,
        "candidate_evaluated": False,
        "authority": {name: False for name in (
            "candidate", "proof", "geometry_state", "lane", "lamp",
            "physical", "propulsion", "transport")},
    }


def main() -> int:
    result = audit()
    out = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/independent-proposal-audit.v1.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{result['checks_passed']}/{result['checks_total']} {result['audit_status']}")
    print(digest(out))
    return 0 if result["audit_status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
