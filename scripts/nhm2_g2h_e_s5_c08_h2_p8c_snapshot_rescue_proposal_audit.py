#!/usr/bin/env python3
"""Independent audit of the inert H2-P8C snapshot-rescue proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-snapshot-rescue-preflight-v1-20260829"
PROPOSAL = BASE / "h2-p8c-snapshot-rescue-proposal.v1.json"
REMOTE = BASE / "h2-p8c-snapshot-rescue-remote.v1.sh"
CLOUDSHELL = BASE / "h2-p8c-snapshot-rescue-cloudshell.v1.sh"
OUTPUT = BASE / "h2-p8c-snapshot-rescue-proposal-independent-audit.v1.json"
EXPECTED_PROPOSAL_SHA256 = "ea2f7265b5387de70a690e24773dd841afcbea20dcc744bf8cc3c6121221dedb"


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
remote = REMOTE.read_text(encoding="utf-8")
cloudshell = CLOUDSHELL.read_text(encoding="utf-8")

checks = {
    "schema_exact": data.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8c_snapshot_rescue_proposal.v1",
    "inert_status": data.get("status") == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA256,
    "predecessor_bindings_exact": data.get("predecessors") == {
        "diagnostic_proposal_sha256": "7e8f28d755b5dea7cc212c4d0fda263a84374215680b0a94a179fbb2fbca2ace",
        "boot_image_correction_sha256": "aade7e5d8d384500503b4ecd1b2f04f4afcf95bccffd735da309363d01d6c32b",
        "launch_checkpoint_schema": "nhm2.g2h_e_s5.c08_h2_p8c_launch_checkpoint.v1",
        "result_audit_source_sha256": "e733350cdb6fa8ccd8c17eee8b7a73cae84820fd6e81564b7ef937cd8935a227",
    },
    "original_resource_exact": original["project"] == "dark-stratum-455714-h4" and original["vm"] == original["disk"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828" and original["zone"] == "us-central1-a",
    "original_hyperdisk_exact": original["disk_size_gb"] == 30 and original["disk_type"] == "hyperdisk-balanced",
    "original_must_remain_stopped": original["required_vm_status"] == "TERMINATED" and original["restart_attempts_authorized"] == 0,
    "original_disk_immutable": original["required_disk_status"] == "READY" and original["detach_or_modify_original_disk"] is False,
    "one_snapshot_exact": snapshot == {
        "name": "nhm2-h2-p8c-evidence-snapshot-20260829", "count": 1,
        "type": "STANDARD", "storage_location": "us-central1",
        "source_disk": "nhm2-h2-p8c-diagnostic-c4-16-20260828",
    },
    "one_clone_exact": clone["name"] == "nhm2-h2-p8c-evidence-clone-20260829" and clone["count"] == 1 and clone["zone"] == "us-central1-a" and clone["size_gb"] == 30 and clone["type"] == "pd-standard",
    "clone_from_exact_snapshot": clone["source_snapshot"] == snapshot["name"],
    "clone_compute_read_only": clone["attachment_mode"] == "ro" and clone["device_name"] == "nhm2-h2-p8c-evidence-clone",
    "one_rescue_vm_exact": rescue["name"] == "nhm2-h2-p8c-rescue-e2-small-20260829" and rescue["count"] == 1 and rescue["zone"] == "us-central1-a" and rescue["machine_type"] == "e2-small",
    "rescue_runtime_pinned": rescue["boot_image"] == "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" and rescue["boot_disk_size_gb"] == 10 and rescue["boot_disk_type"] == "pd-standard",
    "runtime_and_cost_bounded": rescue["aggregate_runtime_ceiling_seconds"] == 3600 and data["cost_boundary"]["total_ceiling_usd_through_24_hours_after_creation"] == 0.5,
    "storage_retention_disclosed": data["cost_boundary"]["storage_is_prorated_and_continues_until_separate_deletion"] is True and data["cost_boundary"]["retention_decision_required_within_hours"] == 24,
    "no_deletion_authority": data["cost_boundary"]["deletion_authorized_by_this_proposal"] is False and forbidden["evidence_or_resource_deletion"] is True,
    "dual_read_only_guards": guard["compute_attachment_read_only"] is True and guard["ext4_mount_options"] == "ro,noload" and guard["xfs_mount_options"] == "ro,norecovery",
    "filesystem_allowlist_exact": guard["accepted_filesystems"] == ["ext4", "xfs"] and guard["unknown_or_ambiguous_filesystem_fails_closed"] is True,
    "source_and_mount_exact": guard["mount_point"] == "/mnt/nhm2-p8c-rescue" and guard["source_directory"].endswith("/home/pestypig/nhm2-h2-p8c-evidence-v1"),
    "capture_nonclobbering": data["capture"]["archive_must_be_absent_before_creation"] is True and data["capture"]["archive_creation"] == "deterministic_tar_sorted_mtime_zero_owner_zero_piped_to_gzip_n",
    "capture_requires_audit": data["capture"]["capture_resource_chronology_and_sha256"] is True and data["capture"]["run_frozen_result_audit_after_capture"] is True,
    "first_failure_terminal": failure["first_failure_terminal"] is True and failure["creation_retry"] is False and failure["snapshot_or_clone_retry"] is False and failure["mount_recovery_or_repair"] is False,
    "cleanup_and_partial_preservation": failure["cleanup_stop_rescue_vm_on_failure"] is True and failure["preserve_partial_evidence"] is True,
    "no_scientific_or_original_action": forbidden["restart_original_vm"] is True and forbidden["detach_original_disk"] is True and forbidden["modify_original_disk_or_access_mode"] is True and forbidden["numerical_processes"] == 0 and forbidden["frozen_candidate_evaluation"] is True,
    "no_write_or_repair_path": forbidden["mount_original_or_clone_read_write"] is True and forbidden["filesystem_check_or_repair"] is True and forbidden["source_mutation"] is True,
    "remote_script_dual_read_only": all(value in remote for value in ("blockdev --getro", "ro,noload", "ro,norecovery", "SOURCE_EVIDENCE_DIR_MISSING")),
    "remote_script_deterministic_nonclobbering": all(value in remote for value in ("set -o noclobber", "--sort=name", "--mtime='UTC 1970-01-01'", "gzip -n")),
    "cloudshell_script_exact_resources": all(value in cloudshell for value in ("nhm2-h2-p8c-diagnostic-c4-16-20260828", "nhm2-h2-p8c-evidence-snapshot-20260829", "nhm2-h2-p8c-rescue-e2-small-20260829", "nhm2-h2-p8c-evidence-clone-20260829")),
    "cloudshell_script_read_only_clone": "--mode=ro" in cloudshell and "READ_ONLY" in cloudshell,
    "cloudshell_cleanup_stops_only_rescue": "gcloud compute instances stop \"$RESCUE\"" in cloudshell and "gcloud compute instances start \"$ORIG_VM\"" not in cloudshell,
    "cloudshell_proposal_binding_exact": EXPECTED_PROPOSAL_SHA256 in cloudshell,
    "authority_all_false": data.get("authority") and all(value is False for value in data["authority"].values()),
}

result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_snapshot_rescue_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "remote_script_sha256": digest(REMOTE),
    "cloudshell_script_sha256": digest(CLOUDSHELL),
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
