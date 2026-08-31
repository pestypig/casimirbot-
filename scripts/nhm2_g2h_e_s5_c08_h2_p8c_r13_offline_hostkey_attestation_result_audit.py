#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r13-offline-hostkey-attestation-v1-20260830/h2-p8c-r13-offline-hostkey-attestation-result.v1.json"

raw = RESULT.read_bytes()
data = json.loads(raw)
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r13_offline_hostkey_attestation.result.v1")
check("terminal_status", data["status"] == "EXECUTED_ONCE_EXHAUSTED_BLOCKED")
check("classification", data["classification"] == "BLOCKED_EMPTY_SERIAL_EVIDENCE_AFTER_HELPER_TERMINATION")
check("proposal_binding", data["proposal_sha256"] == "87df2de9fdd0c5a23a5bbcafd534f90a9a0f72837f8273bc60175f54944c547f")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("authorization_binding", data["charter"]["authorization_sha256"] == "4f28231a74f2919aab597dda754acce7f8d43e5ac2f60c110bb3a2b4e47680dc")
check("connection_passed", data["execution"]["connection_marker_observed"] is True)
check("preflight_passed", data["execution"]["preflight_marker_observed"] is True)
check("invoked_once", data["action_counts"]["r13_invocations"] == 1)
check("proposal_consumed", data["execution"]["proposal_consumed"] is True)
check("first_failure_terminal", data["execution"]["first_failure_terminal"] is True)
check("no_completion", data["execution"]["completion_marker_observed"] is False)
check("helper_terminated", data["execution"]["helper_status"] == "TERMINATED")
check("zero_running_afterward", data["execution"]["running_nhm2_vms_afterward"] == 0)
check("three_resources_created", data["action_counts"]["cloud_resource_creations"] == 3)
check("one_helper_start", data["action_counts"]["helper_starts"] == 1)
check("no_explicit_stop_call", data["action_counts"]["explicit_helper_stop_calls"] == 0)
check("no_cloud_delete", data["action_counts"]["cloud_resource_deletions"] == 0)
check("no_retry", data["action_counts"]["retries"] == 0)
check("no_numerics", data["action_counts"]["numerical_processes"] == 0)
check("no_candidate", data["action_counts"]["candidate_evaluations"] == 0)
check("no_ssh", data["action_counts"]["ssh_or_scp"] == 0)
check("serial_capture_empty", data["observed_evidence"]["helper_serial_port_1_bytes"] == 0)
check("post_stop_serials_empty", data["observed_evidence"]["post_stop_serial_port_1_bytes"] == 0 and data["observed_evidence"]["post_stop_serial_port_2_bytes"] == 0)
check("terminal_marker_absent", data["observed_evidence"]["terminal_marker_present"] is False)
check("startup_identity", data["staging"]["startup_script_sha256"] == "ce28f18db5f4e8acc2a5a288c23975abae05f169343ef308df8731e3c8a8b040")
check("startup_bytes", data["staging"]["startup_script_bytes"] == 2073)
check("clone_read_only", data["resource_state"]["clone_mode_on_helper"] == "READ_ONLY")
check("retained_resources_ready", data["resource_state"]["snapshot_status"] == "READY" and data["resource_state"]["clone_status"] == "READY")
check("helper_keys_not_source_attestation", data["helper_guest_attributes"]["classification"] == "HELPER_VM_HOST_KEYS_ONLY_NOT_SOURCE_DISK_ATTESTATION")
check("source_target_not_in_helper_keys", data["helper_guest_attributes"]["expected_source_rescue_fingerprint_present"] is False)
check("chronology_deviation_recorded", data["action_counts"]["read_only_out_of_ledger_commands_during_active_invocation"] == 1)
check("bounded_post_stop_diagnosis", data["action_counts"]["post_stop_read_only_diagnostic_commands"] == 4)
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
