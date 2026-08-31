#!/usr/bin/env python3
"""Audit the inert corrected P8C-R2 stopped-rescue retrieval proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r2-stopped-rescue-retrieval-preflight-v1-20260829"
PROPOSAL = BASE / "h2-p8c-r2-stopped-rescue-retrieval-proposal.v1.json"
SCRIPT = BASE / "h2-p8c-r2-stopped-rescue-retrieval-cloudshell.v1.sh"
OUTPUT = BASE / "h2-p8c-r2-stopped-rescue-retrieval-proposal-independent-audit.v1.json"
EXPECTED_PROPOSAL_SHA256 = "adcb66eaf6be3519bf6ae2208e542d2edae3d8dc408e8a8732bcc60cc70e66f0"
EXPECTED_ARCHIVE_SHA256 = "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d"
FORBIDDEN_COMM = ["mini-boson-star", "dockerd", "containerd", "docker", "docker-proxy", "containerd-shim", "runc"]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
resources = data["existing_resources"]
retrieval = data["retrieval"]
guards = data["guest_guards"]
failure = data["failure_policy"]
forbidden = data["forbidden_actions"]
script = SCRIPT.read_text(encoding="utf-8")
process_guard = script.split("if ps -eo comm=", 1)[1].split("; then", 1)[0]

checks = {
    "schema_exact": data.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8c_r2_stopped_rescue_retrieval_proposal.v1",
    "inert_status": data.get("status") == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "purpose_exact": data.get("purpose") == "retrieve_one_existing_archive_with_exact_process_identity_guards",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA256,
    "r1_exhaustion_bound": data["predecessors"]["exhausted_r1_proposal_sha256"] == "41f227b7aaa31616abfe4d8361635f3f8082a7481f1b97284fc3f0c320fef186",
    "r1_audit_bound": data["predecessors"]["r1_result_audit_receipt_sha256"] == "d879f2a7599538cc6e4c52268fa3e00b57ba46765c7ab88e021606dd0fd8ba0f",
    "project_zone_exact": resources["project"] == "dark-stratum-455714-h4" and resources["zone"] == "us-central1-a",
    "existing_rescue_exact": resources["rescue_vm"] == "nhm2-h2-p8c-rescue-e2-small-20260829" and resources["required_initial_rescue_vm_status"] == "TERMINATED",
    "original_remains_stopped": resources["original_vm"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828" and resources["required_original_vm_status"] == "TERMINATED",
    "zero_new_resources_or_deletion": resources["new_resources_authorized"] == 0 and resources["resource_deletion_authorized"] is False,
    "one_restart_ssh_scp": retrieval["rescue_vm_restart_attempts"] == 1 and retrieval["ssh_guard_attempts"] == 1 and retrieval["scp_attempts"] == 1,
    "runtime_and_cost_bounded": retrieval["aggregate_rescue_vm_runtime_ceiling_seconds"] == 1200 and retrieval["planning_compute_cost_ceiling_usd"] == 0.1,
    "archive_identity_exact": retrieval["source_archive_size_bytes"] == 16443 and retrieval["source_archive_sha256"] == EXPECTED_ARCHIVE_SHA256,
    "archive_not_created_or_mutated": retrieval["archive_creation_authorized"] is False and retrieval["source_archive_mutation_authorized"] is False,
    "unchanged_audit_required": retrieval["run_unchanged_frozen_result_audit"] is True,
    "services_guarded": guards["docker_service_must_be_inactive_or_absent"] is True and guards["containerd_service_must_be_inactive_or_absent"] is True,
    "exact_comm_inventory": guards["exact_forbidden_process_comm"] == FORBIDDEN_COMM,
    "full_args_matching_forbidden": guards["full_command_line_or_path_substring_matching_forbidden"] is True,
    "clone_read_only_unmounted": guards["clone_block_device_must_remain_read_only"] is True and guards["clone_and_partitions_must_be_unmounted"] is True,
    "no_mount_authority": guards["filesystem_mount_authorized"] is False and forbidden["mount_any_filesystem"] is True,
    "first_failure_terminal_no_retry": failure["first_failure_terminal"] is True and not failure["restart_retry"] and not failure["ssh_retry"] and not failure["scp_retry"],
    "cleanup_preserves_evidence": failure["cleanup_stop_rescue_vm"] is True and failure["preserve_complete_or_partial_evidence"] is True,
    "no_resource_mutation": forbidden["restart_original_vm"] is True and forbidden["create_snapshot_disk_or_vm"] is True and forbidden["attach_detach_or_modify_disks"] is True,
    "no_runtime_science_or_promotion": forbidden["numerical_processes"] == 0 and forbidden["builds"] == 0 and forbidden["uploads"] == 0 and forbidden["authority_promotion"] is True,
    "script_binds_proposal_archive": EXPECTED_PROPOSAL_SHA256 in script and EXPECTED_ARCHIVE_SHA256 in script and 'EXPECTED_BYTES="16443"' in script,
    "script_one_start_ssh_scp": script.count('gcloud compute instances start "$RESCUE"') == 1 and script.count('gcloud compute ssh "$RESCUE"') == 1 and script.count('gcloud compute scp') == 1,
    "script_stops_rescue_only": 'gcloud compute instances stop "$RESCUE"' in script and 'gcloud compute instances start "$ORIGINAL"' not in script,
    "script_exact_comm_only": "ps -eo comm=" in script and all(f'$1=="{name}"' in process_guard for name in FORBIDDEN_COMM),
    "script_process_guard_avoids_args": "args" not in process_guard and "pgrep" not in process_guard and "nhm2-h2-p8c" not in process_guard,
    "script_has_read_only_unmounted_guards": all(token in script for token in ("blockdev --getro", "lsblk -nrpo MOUNTPOINT", "! mountpoint -q /mnt/nhm2-p8c-rescue")),
    "script_has_deadline_nonclobber": "DEADLINE_EPOCH" in script and 'test ! -e "$ARCHIVE"' in script and 'test ! -e "$STAGE"' in script,
    "authority_all_false": all(value is False for value in data["authority"].values()),
}

result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r2_stopped_rescue_retrieval_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloudshell_script_sha256": digest(SCRIPT),
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
