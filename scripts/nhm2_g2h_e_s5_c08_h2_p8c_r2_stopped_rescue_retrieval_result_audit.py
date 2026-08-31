#!/usr/bin/env python3
"""Audit the exhausted P8C-R2 stopped-rescue retrieval attempt."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CAPTURE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r2-stopped-rescue-retrieval-capture-v1-20260829"
ARCHIVE = CAPTURE / "nhm2-h2-p8c-r2-partial-evidence-capture-v1.tgz"
STAGE = CAPTURE / "extracted/nhm2-h2-p8c-r2-stopped-rescue-retrieval-stage-v1"
OUTPUT = CAPTURE / "h2-p8c-r2-stopped-rescue-retrieval-result-independent-audit.v1.json"

EXPECTED_ARCHIVE_BYTES = 2184
EXPECTED_ARCHIVE_SHA256 = "c7ac1ac43bf4aba04dd2e54a895affc44243625fa6bf3e2b2336c925d8727cfd"
EXPECTED_PROPOSAL_SHA256 = "adcb66eaf6be3519bf6ae2208e542d2edae3d8dc408e8a8732bcc60cc70e66f0"
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
guard_stderr = (STAGE / "remote-guard.stderr").read_text(encoding="utf-8")
start_stderr = (STAGE / "rescue-start.stderr").read_text(encoding="utf-8")
stop_stderr = (STAGE / "rescue-stop.stderr").read_text(encoding="utf-8")

checks = {
    "partial_capture_archive_exists": ARCHIVE.is_file(),
    "partial_capture_archive_size_exact": ARCHIVE.stat().st_size == EXPECTED_ARCHIVE_BYTES,
    "partial_capture_archive_hash_exact": digest(ARCHIVE) == EXPECTED_ARCHIVE_SHA256,
    "stage_inventory_exact": files == EXPECTED_FILES,
    "proposal_binding_exact": (STAGE / "proposal.sha256").read_text(encoding="utf-8").strip() == EXPECTED_PROPOSAL_SHA256,
    "procedure_exit_is_ssh_255": (STAGE / "procedure.exit").read_text(encoding="utf-8").strip() == "255",
    "rescue_initially_terminated": before.get("status") == "TERMINATED",
    "rescue_identity_exact": before.get("name") == "nhm2-h2-p8c-rescue-e2-small-20260829",
    "clone_attached_read_only": any(
        disk.get("deviceName") == "nhm2-h2-p8c-evidence-clone" and disk.get("mode") == "READ_ONLY"
        for disk in before.get("disks", [])
    ),
    "snapshot_was_ready": (STAGE / "snapshot.before.tsv").read_text(encoding="utf-8").strip() == "nhm2-h2-p8c-evidence-snapshot-20260829\tREADY",
    "clone_was_ready": (STAGE / "clone.before.tsv").read_text(encoding="utf-8").startswith("nhm2-h2-p8c-evidence-clone-20260829\tREADY\t30\t"),
    "one_start_completed": start_stderr.count("Starting instance(s)") == 1 and start_stderr.count("done.") == 1,
    "one_stop_completed": stop_stderr.count("Stopping instance(s)") == 1 and stop_stderr.count("done.") == 1,
    "guard_stdout_empty": (STAGE / "remote-guard.stdout").stat().st_size == 0,
    "guard_stderr_is_port_22_timeout": "ssh: connect to host 104.197.232.249 port 22: Connection timed out" in guard_stderr,
    "gcloud_ssh_exit_255": "[/usr/bin/ssh] exited with return code [255]" in guard_stderr,
    "scp_not_reached": "scp.stdout" not in files and "scp.stderr" not in files,
    "cloud_archive_receipts_not_reached": "archive.sha256" not in files and "archive.stat" not in files,
    "terminal_result_audit_not_reached_in_cloud": "result-audit.json" not in files,
}

verdict = "PASS" if all(checks.values()) else "FAIL"
classification = "BLOCKED_PRETRANSFER_SSH_PORT_22_TIMEOUT" if verdict == "PASS" else "EVIDENCE_AUDIT_FAIL"
result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r2_stopped_rescue_retrieval.result_audit.v1",
    "verdict": verdict,
    "classification": classification,
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": EXPECTED_PROPOSAL_SHA256,
    "partial_capture_archive_bytes": ARCHIVE.stat().st_size,
    "partial_capture_archive_sha256": digest(ARCHIVE),
    "restart_attempts_consumed": 1,
    "scp_attempts_executed": 0,
    "terminal_archive_retrieved": False,
    "unchanged_p8c_result_audit_status": "FAIL_1_OF_25_AUDIT_FAIL",
    "unchanged_p8c_result_audit_sha256": "92ff8791b8e8b5d2d7c34a658e3238d74c451039a8d17bf0b78671e5618bc30b",
    "retry_authorized": False,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']} {classification}")
print(digest(OUTPUT))
raise SystemExit(0 if verdict == "PASS" else 1)
