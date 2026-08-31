#!/usr/bin/env python3
"""Audit the inert P8C-R4 stage-before-restart retrieval proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r4-staged-iap-retrieval-preflight-v1-20260829"
PROPOSAL = BASE / "h2-p8c-r4-staged-iap-retrieval-proposal.v1.json"
PROCEDURE = BASE / "h2-p8c-r4-staged-iap-retrieval-cloudshell.v1.sh"
OUTPUT = BASE / "h2-p8c-r4-staged-iap-retrieval-proposal-independent-audit.v1.json"
EXPECTED_PROPOSAL_SHA256 = "cfd15b9b8b5d502df4788e89dddbd45ac7948328c41c268f85326533d598a11a"
EXPECTED_PROCEDURE_SHA256 = "a4104d492653e1f90e7be72ee0f14fa3b79dfd3599c6f1092a4a86092c3ed79b"
EXPECTED_PROCEDURE_BYTES = 4115
EXPECTED_ARCHIVE_SHA256 = "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


data = json.loads(PROPOSAL.read_text(encoding="utf-8"))
staging = data["procedure_staging"]
future = data["planned_future_execution"]
failure = data["failure_policy"]
forbidden = data["forbidden_during_staging"]
procedure = PROCEDURE.read_text(encoding="utf-8")
process_guard = procedure.split("if ps -eo comm=", 1)[1].split("; then", 1)[0]

checks = {
    "schema_exact": data.get("schema") == "nhm2.g2h_e_s5.c08_h2_p8c_r4_staged_iap_retrieval_proposal.v1",
    "status_inert": data.get("status") == "FROZEN_INERT_AWAITING_PROCEDURE_STAGING_AUTHORIZATION",
    "purpose_stage_before_restart": data.get("purpose") == "stage_and_authenticate_short_cloudshell_procedure_before_any_rescue_restart",
    "proposal_hash_exact": digest(PROPOSAL) == EXPECTED_PROPOSAL_SHA256,
    "procedure_hash_exact": digest(PROCEDURE) == EXPECTED_PROCEDURE_SHA256,
    "procedure_size_exact": PROCEDURE.stat().st_size == EXPECTED_PROCEDURE_BYTES,
    "r3_proposal_bound": data["predecessors"]["exhausted_r3_proposal_sha256"] == "ad21f1ca165da8f89cf48a97d35c95b70f3241a66ca7c1c3c1bbc7cbb5d0efe7",
    "r3_result_bound": data["predecessors"]["r3_result_audit_receipt_sha256"] == "91e647cabb7a16eff49d84b4c75a4ef41cdc7cf25e26b8b905e908ecc23428c4",
    "r3_audit_source_bound": data["predecessors"]["r3_result_audit_source_sha256"] == "ec390a27cd88cc3d974210b0386d5b2e7eb86419632a24277897ade97a8a8b08",
    "r3_diagnosis_exact": data["diagnosis"]["r3_classification"] == "INCOMPLETE_AFTER_IAP_GUARD_BEFORE_SCP_EVIDENCE" and data["diagnosis"]["iap_guest_guard_authenticated"] is True and data["diagnosis"]["scp_execution_authenticated"] is False,
    "truncation_only_inference": data["diagnosis"]["likely_terminal_input_truncation"] == "INFERENCE_NOT_PROMOTED_FACT",
    "correction_exact": data["diagnosis"]["selected_correction"] == "SEPARATELY_STAGE_AND_HASH_VERIFY_PROCEDURE_BEFORE_RESTART",
    "one_exact_upload_and_verification": staging["upload_attempts"] == 1 and staging["verification_commands"] == 1,
    "cloudshell_path_matches_source_basename": Path(staging["cloud_shell_path"]).name == Path(staging["local_source"]).name,
    "initial_stage_path_absent": staging["required_initial_path_state"] == "ABSENT",
    "staging_cannot_execute": staging["execution_authorized"] is False and forbidden["execute_staged_procedure"] is True,
    "staging_cannot_restart_vm": staging["vm_restart_authorized"] is False and forbidden["start_or_restart_any_vm"] is True,
    "staging_cannot_mutate_resources": staging["cloud_resource_mutation_authorized"] is False and forbidden["create_modify_or_delete_cloud_resource"] is True,
    "stage_receipt_precedes_execution_proposal": staging["staging_receipt_required_before_execution_proposal"] is True,
    "future_resources_exact": future["project"] == "dark-stratum-455714-h4" and future["zone"] == "us-central1-a" and future["rescue_vm"] == "nhm2-h2-p8c-rescue-e2-small-20260829" and future["original_vm"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828",
    "future_restart_not_current_authority": future["future_execution_requires_separate_authorization"] is True and staging["vm_restart_authorized"] is False,
    "future_attempts_bounded": future["rescue_restart_attempts"] == 1 and future["iap_ssh_guard_attempts"] == 1 and future["iap_scp_attempts"] == 1,
    "future_runtime_cost_wait_bounded": future["aggregate_runtime_ceiling_seconds"] == 1200 and future["planning_compute_cost_ceiling_usd"] == 0.1 and future["fixed_startup_wait_seconds"] == 180,
    "archive_identity_exact": future["source_archive_size_bytes"] == 16443 and future["source_archive_sha256"] == EXPECTED_ARCHIVE_SHA256,
    "first_failure_no_retry": failure["first_failure_terminal"] is True and not failure["staging_retry"] and not failure["restart_retry"] and not failure["ssh_retry"] and not failure["scp_retry"],
    "no_external_fallback_or_substitution": failure["external_ssh_fallback"] is False and failure["resource_substitution"] is False,
    "no_staging_science_build_or_download": forbidden["numerical_processes"] == 0 and forbidden["builds"] == 0 and forbidden["additional_uploads"] == 0 and forbidden["archive_copy_or_download"] is True,
    "no_candidate_or_downstream_work": forbidden["frozen_candidate_evaluation"] is True and forbidden["positive_sampling"] is True and forbidden["scientific_handler_linkage"] is True and forbidden["rust_g3_si_metric_lane_work"] is True,
    "procedure_binds_proposal_archive": EXPECTED_PROPOSAL_SHA256 in procedure and EXPECTED_ARCHIVE_SHA256 in procedure and 'EXPECTED_BYTES="16443"' in procedure,
    "procedure_has_one_start_ssh_scp": procedure.count('gcloud compute instances start "$RESCUE"') == 1 and procedure.count('gcloud compute ssh "$RESCUE"') == 1 and procedure.count('gcloud compute scp') == 1,
    "procedure_iap_only": procedure.count("--tunnel-through-iap") == 2,
    "procedure_fixed_wait_deadline": procedure.count("sleep 180") == 1 and "DEADLINE_EPOCH" in procedure,
    "procedure_stops_rescue_only": 'gcloud compute instances stop "$RESCUE"' in procedure and 'gcloud compute instances start "$ORIGINAL"' not in procedure,
    "procedure_exact_comm_guard": "ps -eo comm=" in procedure and "args" not in process_guard and "pgrep" not in process_guard,
    "procedure_read_only_unmounted_guards": all(token in procedure for token in ("blockdev --getro", "lsblk -nrpo MOUNTPOINT", "! mountpoint -q /mnt/nhm2-p8c-rescue")),
    "procedure_nonclobber": 'test ! -e "$ARCHIVE"' in procedure and 'test ! -e "$STAGE"' in procedure,
    "procedure_has_no_creation_firewall_iam": all(token not in procedure for token in ("firewall-rules create", "firewall-rules update", "add-iam-policy-binding", "compute instances create", "compute disks create", "compute snapshots create")),
    "authority_all_false": all(value is False for value in data["authority"].values()),
}

result = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r4_staged_iap_retrieval_proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloudshell_procedure_bytes": PROCEDURE.stat().st_size,
    "cloudshell_procedure_sha256": digest(PROCEDURE),
    "cloud_actions_executed": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{result['passed']}/{result['total']} {result['verdict']}")
print(digest(OUTPUT))
raise SystemExit(0 if result["verdict"] == "PASS" else 1)
