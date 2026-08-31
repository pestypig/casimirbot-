#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r14-guest-attribute-hostkey-attestation-v1-20260830/h2-p8c-r14-guest-attribute-hostkey-attestation-result.v1.json"

raw = RESULT.read_bytes()
data = json.loads(raw)
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r14_guest_attribute_hostkey_attestation.result.v1")
check("terminal_status", data["status"] == "EXECUTED_ONCE_EXHAUSTED_BLOCKED")
check("classification", data["classification"] == "BLOCKED_READ_ONLY_SOURCE_CLONE_SELECTED_AS_ROOT_BEFORE_STARTUP_EXECUTION")
check("proposal_binding", data["proposal_sha256"] == "e1261d7351b12c806d2aadeea940dcdc7a61c24dc8f68ac10bdb24d187e01fa2")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("connection_passed", data["execution"]["connection_marker_observed"] is True)
check("preflight_passed", data["execution"]["preflight_marker_observed"] is True)
check("invoked_once", data["action_counts"]["r14_invocations"] == 1)
check("proposal_consumed", data["execution"]["proposal_consumed"] is True)
check("first_failure_terminal", data["execution"]["first_failure_terminal"] is True)
check("no_completion", data["execution"]["completion_marker_observed"] is False)
check("helper_terminated", data["execution"]["helper_status_after_cleanup"] == "TERMINATED")
check("zero_running_afterward", data["execution"]["running_nhm2_vms_afterward"] == 0)
check("one_helper_create", data["action_counts"]["helper_creations"] == 1)
check("one_helper_start", data["action_counts"]["helper_starts"] == 1)
check("no_delete", data["action_counts"]["cloud_resource_deletions"] == 0)
check("no_retry", data["action_counts"]["retries"] == 0)
check("no_numerics", data["action_counts"]["numerical_processes"] == 0)
check("no_candidate", data["action_counts"]["candidate_evaluations"] == 0)
check("no_ssh", data["action_counts"]["ssh_or_scp"] == 0)
check("startup_not_executed", data["execution"]["startup_script_executed"] is False)
check("source_not_mounted", data["execution"]["source_mount_performed_by_attestor"] is False)
check("fingerprint_not_evaluated", data["execution"]["source_fingerprint_evaluated"] is False)
check("no_guest_receipt", data["observed_evidence"]["nhm2_r14_guest_attribute_count"] == 0)
check("guest_file_empty_array", data["observed_evidence"]["guest_attributes_json_bytes"] == 3)
check("terminal_marker_absent", data["observed_evidence"]["terminal_marker_present"] is False)
check("boot_config_rw", data["root_cause_evidence"]["boot_disk_configuration_mode"] == "READ_WRITE")
check("clone_config_ro", data["root_cause_evidence"]["source_clone_configuration_mode"] == "READ_ONLY")
check("root_on_sdb1", data["root_cause_evidence"]["kernel_root_device_observed"] == "sdb1")
check("remount_failed", data["root_cause_evidence"]["systemd_remount_root_result"] == "FAILED")
check("metadata_runner_blocked", "read-only root filesystem" in data["root_cause_evidence"]["metadata_runner_error"])
check("chronology_deviation_recorded", data["action_counts"]["out_of_ledger_read_only_commands_queued_during_active_invocation"] == 1)
check("startup_identity", data["staging"]["startup_script_sha256"] == "e76e4104934cd3d16a1cc8de53e0ec5dbd2fb0dfce069ec1a8dc12ef8b27c86f")
check("cloudshell_identity", data["staging"]["cloudshell_script_sha256"] == "518edbe9bf8ae4ede18f7a943ae82034aaea9aaf3d9e1e4798c93fa740a7d3ca")
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
