#!/usr/bin/env python3
"""Audit the inert P8C-R5 staged-procedure retrieval execution proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral"
PREFLIGHT = BASE / "h2-p8c-r5-staged-procedure-retrieval-execution-preflight-v1-20260829"
R4_PREFLIGHT = BASE / "h2-p8c-r4-staged-iap-retrieval-preflight-v1-20260829"
R4R1_CAPTURE = BASE / "h2-p8c-r4-r1-chunked-staging-capture-v1-20260829"
PROPOSAL = PREFLIGHT / "h2-p8c-r5-staged-procedure-retrieval-execution-proposal.v1.json"
SCRIPT = R4_PREFLIGHT / "h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh"
R4R1_RESULT = R4R1_CAPTURE / "h2-p8c-r4-r1-chunked-staging-result.v1.json"
R4R1_AUDIT = R4R1_CAPTURE / "h2-p8c-r4-r1-chunked-staging-result-independent-audit.v1.json"
OUTPUT = PREFLIGHT / "h2-p8c-r5-staged-procedure-retrieval-execution-proposal-independent-audit.v1.json"
EXPECTED_PROPOSAL_SHA = "a3353a7cb712365268c0a8aa9a59a3834467c4066a32d1858936ca35bb6e6e15"
EXPECTED_SCRIPT_SHA = "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b"
EXPECTED_COMMAND_SHA = "78eda80c8f9c129c081f07203217e8f53189568ac00243a239d513f1eda7eda4"
EXPECTED_ARCHIVE_SHA = "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d"
EXPECTED_R4R1_RESULT_SHA = "78214acdde840d46031956656d591355c579661866a3ae6c9aba4a82f59620b8"
EXPECTED_R4R1_AUDIT_SHA = "6d60f0f9459b788f360d3fe0d6d249a71a610891e51bc67c62ecfc8582c4bc7b"
FORBIDDEN_COMM = ["mini-boson-star", "dockerd", "containerd", "docker", "docker-proxy", "containerd-shim", "runc"]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def digest_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
result = json.loads(R4R1_RESULT.read_text(encoding="utf-8"))
result_audit = json.loads(R4R1_AUDIT.read_text(encoding="utf-8"))
script = SCRIPT.read_text(encoding="utf-8")
procedure = data["staged_procedure"]
execution = data["cloud_shell_execution"]
resources = data["existing_resources"]
retrieval = data["retrieval"]
guards = data["guest_guards"]
failure = data["failure_policy"]
forbidden = data["forbidden_actions"]
process_guard = script.split("if ps -eo comm=", 1)[1].split("; then", 1)[0]

checks = {
    "schema_exact": data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r5_staged_procedure_retrieval_execution_proposal.v1",
    "inert_status": data["status"] == "FROZEN_INERT_AWAITING_SEPARATE_AUTHORIZATION",
    "purpose_exact": data["purpose"] == "execute_once_the_authenticated_staged_procedure_to_retrieve_the_existing_archive_into_cloud_shell",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA,
    "r4r1_result_bound": digest(R4R1_RESULT) == data["predecessors"]["r4_r1_staging_result_sha256"] == EXPECTED_R4R1_RESULT_SHA and result["classification"] == "AUTHENTICATED_CHUNKED_STAGING_PASS",
    "r4r1_audit_bound": digest(R4R1_AUDIT) == data["predecessors"]["r4_r1_staging_result_audit_receipt_sha256"] == EXPECTED_R4R1_AUDIT_SHA and result_audit["verdict"] == "PASS" and result_audit["passed"] == result_audit["total"] == 19,
    "procedure_identity_exact": digest(SCRIPT) == procedure["sha256"] == EXPECTED_SCRIPT_SHA and SCRIPT.stat().st_size == procedure["bytes"] == 4115,
    "procedure_regular_nonsymlink_required": procedure["required_file_type"] == "REGULAR_NON_SYMLINK" and procedure["execution_attempts"] == 1 and procedure["edit_replace_chmod_delete_authorized"] is False,
    "one_exact_command": execution["exact_terminal_commands"] == 1 and execution["blank_or_duplicate_commands_authorized"] == 0 and execution["retry_or_fallback_authorized"] is False,
    "command_identity_exact": len(execution["command"]) == execution["command_characters"] == 497 and digest_text(execution["command"]) == execution["command_sha256"] == EXPECTED_COMMAND_SHA,
    "command_reauthenticates_then_executes": all(token in execution["command"] for token in ("test -f", "test ! -L", "stat -c %s", "sha256sum", EXPECTED_SCRIPT_SHA, "&& bash")) and execution["command"].count("bash ") == 1,
    "project_zone_exact": resources["project"] == "dark-stratum-455714-h4" and resources["zone"] == "us-central1-a",
    "both_initially_terminated": resources["required_initial_original_vm_status"] == "TERMINATED" and resources["required_initial_rescue_vm_status"] == "TERMINATED",
    "resource_identities_exact": resources["original_vm"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828" and resources["rescue_vm"] == "nhm2-h2-p8c-rescue-e2-small-20260829" and resources["snapshot"] == "nhm2-h2-p8c-evidence-snapshot-20260829" and resources["clone_disk"] == "nhm2-h2-p8c-evidence-clone-20260829",
    "zero_new_resource_or_deletion": resources["new_resources_authorized"] == 0 and resources["resource_configuration_mutation_authorized"] is False and resources["resource_deletion_authorized"] is False,
    "one_restart_iap_guard_scp": retrieval["rescue_vm_restart_attempts"] == 1 and retrieval["original_vm_restart_attempts"] == 0 and retrieval["iap_ssh_guard_attempts"] == 1 and retrieval["iap_scp_attempts"] == 1,
    "runtime_cost_wait_bounded": retrieval["fixed_startup_wait_seconds"] == 180 and retrieval["aggregate_rescue_vm_runtime_ceiling_seconds"] == 1200 and retrieval["planning_compute_cost_ceiling_usd"] == 0.1,
    "archive_identity_exact": retrieval["source_archive_size_bytes"] == 16443 and retrieval["source_archive_sha256"] == EXPECTED_ARCHIVE_SHA and retrieval["source_archive"] == retrieval["cloud_shell_archive"],
    "cloudshell_outputs_initially_absent": retrieval["required_initial_cloud_shell_archive_state"] == "ABSENT" and retrieval["required_initial_cloud_shell_stage_state"] == "ABSENT",
    "no_download_or_result_audit_yet": retrieval["download_to_local_workspace_authorized"] is False and retrieval["run_result_audit_authorized"] is False,
    "services_and_comm_guarded": guards["docker_service_must_be_inactive_or_absent"] is True and guards["containerd_service_must_be_inactive_or_absent"] is True and guards["exact_forbidden_process_comm"] == FORBIDDEN_COMM,
    "clone_read_only_unmounted": guards["clone_block_device_must_remain_read_only"] is True and guards["clone_and_partitions_must_be_unmounted"] is True and guards["source_recovery_mountpoint_must_be_unmounted"] is True and guards["filesystem_mount_authorized"] is False,
    "first_failure_terminal_no_retry": failure["first_failure_terminal"] is True and failure["proposal_consumed_by_pass_fail_or_partial"] is True and not failure["restart_retry"] and not failure["ssh_retry"] and not failure["scp_retry"] and not failure["execution_retry"],
    "cleanup_and_evidence_preserved": failure["cleanup_stop_rescue_vm"] is True and failure["preserve_complete_or_partial_evidence"] is True,
    "no_runtime_science_or_promotion": forbidden["restart_original_vm"] is True and forbidden["numerical_processes"] == 0 and forbidden["builds"] == 0 and forbidden["uploads"] == 0 and forbidden["additional_terminal_commands"] == 0 and forbidden["authority_promotion"] is True,
    "script_binds_archive_and_old_source_proposal": EXPECTED_ARCHIVE_SHA in script and 'EXPECTED_BYTES="16443"' in script and data["predecessors"]["r4_source_proposal_sha256_embedded_in_procedure"] in script,
    "script_nonclobbering_outputs": 'test ! -e "$STAGE"' in script and 'test ! -e "$ARCHIVE"' in script and 'mkdir "$STAGE"' in script,
    "script_one_start_ssh_scp": script.count('gcloud compute instances start "$RESCUE"') == 1 and script.count('gcloud compute ssh "$RESCUE"') == 1 and script.count("gcloud compute scp") == 1,
    "script_iap_only": script.count("--tunnel-through-iap") == 2 and "104.197.232.249" not in script,
    "script_fixed_wait_deadline": script.count("sleep 180") == 1 and "START_EPOCH + 1200" in script,
    "script_cleanup_stops_rescue_only": script.count('gcloud compute instances stop "$RESCUE"') >= 2 and 'gcloud compute instances start "$ORIGINAL"' not in script,
    "script_exact_comm_only": "ps -eo comm=" in script and all(f'$1=="{name}"' in process_guard for name in FORBIDDEN_COMM) and "args" not in process_guard and "pgrep" not in process_guard,
    "script_read_only_unmounted_guards": all(token in script for token in ("blockdev --getro", "lsblk -nrpo MOUNTPOINT", "! mountpoint -q /mnt/nhm2-p8c-rescue")),
    "script_no_resource_creation_or_numerics": all(token not in script for token in ("compute instances create", "compute disks create", "compute snapshots create", "firewall-rules create", "docker run")) and script.count('$1=="mini-boson-star"') == 1,
    "authority_all_false": all(value is False for value in data["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r5_staged_procedure_retrieval_execution_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "staged_procedure_sha256": digest(SCRIPT),
    "execution_command_sha256": digest_text(execution["command"]),
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
