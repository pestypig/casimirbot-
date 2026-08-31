#!/usr/bin/env python3
"""Independent audit of the inert H2-P7 snapshot-rescue proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PROPOSAL = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-snapshot-rescue-preflight-v1-20260828/h2-p7-snapshot-rescue-proposal.v1.json"
OUTPUT = PROPOSAL.with_name("h2-p7-snapshot-rescue-proposal-independent-audit.v1.json")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
original = data["original_resource"]
resources = data["recovery_resources"]
snapshot = resources["snapshot"]
clone = resources["clone_disk"]
rescue = resources["rescue_vm"]
guard = data["filesystem_guard"]
failure = data["failure_policy"]
forbidden = data["forbidden_actions"]

checks = {
    "schema_exact": data.get("schema") == "nhm2.g2h_e_s5.c08_h2_p7_snapshot_rescue_proposal.v1",
    "inert_status": data.get("status") == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "predecessor_bindings_exact": data.get("predecessors") == {
        "parent_proposal_sha256": "3f15f387c95079d2049f346e260cd8b31e51732ea903b06ae11f8feb0eabfdc3",
        "first_retrieval_proposal_sha256": "3c581eb9abb9205a520f75f0eb5196a63afd257786a5cc0a7528d6f8e451ee25",
        "first_retrieval_execution_receipt_sha256": "a145c37f72223223614c89c571f00103ace630ba9ab2205c2036f21e654a8060",
    },
    "original_resource_exact": original["project"] == "dark-stratum-455714-h4" and original["vm"] == original["disk"] == "nhm2-h2-p7-parent-c4-16-20260827" and original["zone"] == "us-central1-a",
    "original_hyperdisk_exact": original["disk_size_gb"] == 30 and original["disk_type"] == "hyperdisk-balanced",
    "original_must_remain_stopped": original["required_vm_status"] == "TERMINATED" and original["restart_attempts_authorized"] == 0,
    "original_disk_immutable": original["required_disk_status"] == "READY" and original["detach_or_modify_original_disk"] is False,
    "one_snapshot_exact": snapshot == {
        "name": "nhm2-h2-p7-evidence-snapshot-20260828",
        "count": 1,
        "type": "STANDARD",
        "storage_location": "us-central1",
        "source_disk": "nhm2-h2-p7-parent-c4-16-20260827",
    },
    "one_clone_exact": clone["name"] == "nhm2-h2-p7-evidence-clone-20260828" and clone["count"] == 1 and clone["zone"] == "us-central1-a" and clone["size_gb"] == 30 and clone["type"] == "pd-standard",
    "clone_from_exact_snapshot": clone["source_snapshot"] == snapshot["name"],
    "clone_compute_read_only": clone["attachment_mode"] == "ro" and clone["device_name"] == "nhm2-h2-p7-evidence-clone",
    "one_rescue_vm_exact": rescue["name"] == "nhm2-h2-p7-rescue-e2-small-20260828" and rescue["count"] == 1 and rescue["zone"] == "us-central1-a" and rescue["machine_type"] == "e2-small",
    "rescue_runtime_pinned": rescue["boot_image"] == "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" and rescue["boot_disk_size_gb"] == 10 and rescue["boot_disk_type"] == "pd-standard",
    "runtime_and_cost_bounded": rescue["aggregate_runtime_ceiling_seconds"] == 3600 and data["cost_boundary"]["total_ceiling_usd_through_24_hours_after_creation"] == 0.5,
    "storage_retention_disclosed": data["cost_boundary"]["storage_is_prorated_and_continues_until_separate_deletion"] is True and data["cost_boundary"]["retention_decision_required_within_hours"] == 24,
    "no_deletion_authority": data["cost_boundary"]["deletion_authorized_by_this_proposal"] is False and forbidden["evidence_or_resource_deletion"] is True,
    "dual_read_only_guards": guard["compute_attachment_read_only"] is True and guard["ext4_mount_options"] == "ro,noload" and guard["xfs_mount_options"] == "ro,norecovery",
    "filesystem_allowlist_exact": guard["accepted_filesystems"] == ["ext4", "xfs"] and guard["unknown_or_ambiguous_filesystem_fails_closed"] is True,
    "source_and_mount_exact": guard["mount_point"] == "/mnt/nhm2-p7-rescue" and guard["source_directory"].endswith("/home/pestypig/nhm2-h2-p7-evidence-v1"),
    "capture_nonclobbering": data["capture"]["archive_must_be_absent_before_creation"] is True and data["capture"]["archive_creation"] == "deterministic_tar_sorted_mtime_zero_owner_zero_piped_to_gzip_n",
    "capture_requires_audit": data["capture"]["capture_resource_chronology_and_sha256"] is True and data["capture"]["run_frozen_parent_result_audit_after_capture"] is True,
    "first_failure_terminal": failure["first_failure_terminal"] is True and failure["creation_retry"] is False and failure["snapshot_or_clone_retry"] is False and failure["mount_recovery_or_repair"] is False,
    "cleanup_and_partial_preservation": failure["cleanup_stop_rescue_vm_on_failure"] is True and failure["preserve_partial_evidence"] is True,
    "no_scientific_or_original_action": forbidden["restart_original_vm"] is True and forbidden["detach_original_disk"] is True and forbidden["modify_original_disk_or_access_mode"] is True and forbidden["numerical_processes"] == 0 and forbidden["frozen_candidate_evaluation"] is True,
    "no_write_or_repair_path": forbidden["mount_original_or_clone_read_write"] is True and forbidden["filesystem_check_or_repair"] is True and forbidden["source_mutation"] is True,
    "authority_all_false": data.get("authority") and all(value is False for value in data["authority"].values()),
}

result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p7_snapshot_rescue_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
