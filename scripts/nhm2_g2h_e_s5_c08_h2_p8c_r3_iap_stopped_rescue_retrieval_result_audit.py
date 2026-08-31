#!/usr/bin/env python3
"""Audit the exhausted P8C-R3 IAP stopped-rescue retrieval attempt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r3-iap-stopped-rescue-retrieval-capture-v1-20260829"
ARCHIVE = CAPTURE / "nhm2-h2-p8c-r3-partial-evidence-capture-v1.tgz"
STAGE = CAPTURE / "extracted/nhm2-h2-p8c-r3-iap-stopped-rescue-retrieval-stage-v1"
OUTPUT = CAPTURE / "h2-p8c-r3-iap-stopped-rescue-retrieval-result-independent-audit.v1.json"

EXPECTED_CAPTURE_BYTES = 2191
EXPECTED_CAPTURE_SHA256 = "4281bf467d6dc2067f3260b511014d0eddedb2285868ccee43cf39080c2707c9"
EXPECTED_PROPOSAL_SHA256 = "ad21f1ca165da8f89cf48a97d35c95b70f3241a66ca7c1c3c1bbc7cbb5d0efe7"
EXPECTED_TERMINAL_SHA256 = "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d"
EXPECTED_FILES = {
    "clone.before.tsv",
    "procedure.exit",
    "proposal.sha256",
    "remote-guard.stderr",
    "remote-guard.stdout",
    "rescue-start.stderr",
    "rescue-start.stdout",
    "rescue-stop.stderr",
    "rescue-stop.stdout",
    "rescue.before.json",
    "snapshot.before.tsv",
}


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


files = {path.name for path in STAGE.iterdir() if path.is_file()}
before = json.loads((STAGE / "rescue.before.json").read_text(encoding="utf-8"))
guard_out = (STAGE / "remote-guard.stdout").read_text(encoding="utf-8")
guard_err = (STAGE / "remote-guard.stderr").read_text(encoding="utf-8")
start_err = (STAGE / "rescue-start.stderr").read_text(encoding="utf-8")
stop_err = (STAGE / "rescue-stop.stderr").read_text(encoding="utf-8")

checks = {
    "partial_capture_archive_exists": ARCHIVE.is_file(),
    "partial_capture_archive_size_exact": ARCHIVE.stat().st_size == EXPECTED_CAPTURE_BYTES,
    "partial_capture_archive_hash_exact": digest(ARCHIVE) == EXPECTED_CAPTURE_SHA256,
    "stage_inventory_exact": files == EXPECTED_FILES,
    "proposal_binding_exact": (STAGE / "proposal.sha256").read_text(encoding="utf-8").strip() == EXPECTED_PROPOSAL_SHA256,
    "procedure_exit_zero_recorded": (STAGE / "procedure.exit").read_text(encoding="utf-8").strip() == "0",
    "rescue_initially_terminated": before.get("status") == "TERMINATED",
    "rescue_identity_exact": before.get("name") == "nhm2-h2-p8c-rescue-e2-small-20260829",
    "clone_attached_read_only": any(
        disk.get("deviceName") == "nhm2-h2-p8c-evidence-clone" and disk.get("mode") == "READ_ONLY"
        for disk in before.get("disks", [])
    ),
    "snapshot_was_ready": (STAGE / "snapshot.before.tsv").read_text(encoding="utf-8").strip() == "nhm2-h2-p8c-evidence-snapshot-20260829\tREADY",
    "clone_was_ready": (STAGE / "clone.before.tsv").read_text(encoding="utf-8").startswith("nhm2-h2-p8c-evidence-clone-20260829\tREADY\t30\t"),
    "one_start_completed": start_err.count("Starting instance(s)") == 1 and start_err.count("done.") == 1,
    "one_stop_completed": stop_err.count("Stopping instance(s)") == 1 and stop_err.count("done.") == 1,
    "iap_guard_archive_identity_exact": "archive_bytes=16443" in guard_out and f"archive_sha256={EXPECTED_TERMINAL_SHA256}" in guard_out,
    "iap_guard_clone_read_only_unmounted": "clone_read_only=1" in guard_out and "clone_mounted=0" in guard_out,
    "iap_transport_warning_recorded": "performance of the tunnel" in guard_err and "installing NumPy" in guard_err,
    "scp_receipts_absent": "scp.stdout" not in files and "scp.stderr" not in files,
    "cloud_archive_receipts_absent": "archive.sha256" not in files and "archive.stat" not in files,
    "terminal_stop_receipt_absent": "rescue.after.json" not in files,
}

verdict = "PASS" if all(checks.values()) else "FAIL"
classification = "INCOMPLETE_AFTER_IAP_GUARD_BEFORE_SCP_EVIDENCE" if verdict == "PASS" else "EVIDENCE_AUDIT_FAIL"
result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r3_iap_stopped_rescue_retrieval.result_audit.v1",
    "verdict": verdict,
    "classification": classification,
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": EXPECTED_PROPOSAL_SHA256,
    "partial_capture_archive_bytes": ARCHIVE.stat().st_size,
    "partial_capture_archive_sha256": digest(ARCHIVE),
    "restart_attempts_consumed": 1,
    "iap_guard_authenticated": True,
    "scp_execution_authenticated": False,
    "terminal_archive_retrieved_locally": False,
    "procedure_zero_is_terminal_success": False,
    "retry_authorized": False,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']} {classification}")
print(digest(OUTPUT))
raise SystemExit(0 if verdict == "PASS" else 1)
