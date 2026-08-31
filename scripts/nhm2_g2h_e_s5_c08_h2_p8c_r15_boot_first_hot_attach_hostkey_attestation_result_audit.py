#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RESULT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r15-boot-first-hot-attach-hostkey-attestation-v1-20260830/h2-p8c-r15-boot-first-hot-attach-hostkey-attestation-result.v1.json"

raw = RESULT.read_bytes()
data = json.loads(raw)
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r15_boot_first_hot_attach_hostkey_attestation.result.v1")
check("terminal_status", data["status"] == "EXECUTED_ONCE_EXHAUSTED_MISMATCH")
check("classification", data["classification"] == "BLOCKED_SSH_PRESENTED_HOSTKEY_DIFFERS_FROM_OFFLINE_RESCUE_BOOT_DISK_HOSTKEY")
check("proposal_binding", data["proposal_sha256"] == "4ad78a6fdac069422f3dd2144de156c46bbb87f09a6e65eda0880182862b5d30")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("connection_passed", data["execution"]["connection_marker_observed"] is True)
check("preflight_passed", data["execution"]["preflight_marker_observed"] is True)
check("completion_passed", data["execution"]["completion_marker_observed"] is True)
check("invoked_once", data["action_counts"]["r15_invocations"] == 1)
check("proposal_consumed", data["execution"]["proposal_consumed"] is True)
check("helper_terminated", data["execution"]["helper_status_after_cleanup"] == "TERMINATED")
check("zero_running_afterward", data["execution"]["running_nhm2_vms_afterward"] == 0)
check("one_helper_create", data["action_counts"]["helper_creations"] == 1)
check("one_helper_start", data["action_counts"]["helper_starts"] == 1)
check("one_hot_attach", data["action_counts"]["read_only_hot_attaches"] == 1)
check("source_mode_ro", data["execution"]["source_clone_mode"] == "READ_ONLY")
check("source_still_attached", data["execution"]["source_clone_attached_afterward"] is True)
check("startup_executed", data["execution"]["startup_script_executed"] is True)
check("source_mounted", data["execution"]["source_mount_performed_by_attestor"] is True)
check("fingerprint_evaluated", data["execution"]["source_fingerprint_evaluated"] is True)
check("guest_terminal_complete", data["execution"]["guest_terminal"] == "COMPLETE")
check("mismatch_verdict", data["execution"]["verdict"] == "MISMATCH")
check("expected_fingerprint", data["fingerprint_evidence"]["expected_r8_presented_fingerprint"] == "SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw")
check("observed_fingerprint", data["fingerprint_evidence"]["observed_offline_source_fingerprint"] == "SHA256:+AxR3gjLhTLv3YqhYrJkfcTbsd1hvChsJ1T9UK5v7Ks")
check("fingerprints_differ", data["fingerprint_evidence"]["expected_r8_presented_fingerprint"] != data["fingerprint_evidence"]["observed_offline_source_fingerprint"])
check("public_key_bytes", data["fingerprint_evidence"]["offline_public_key_bytes"] == 123)
check("public_key_sha", data["fingerprint_evidence"]["offline_public_key_sha256"] == "3ed0b57c0afd5013de29ea4202c6d47649f361da37a0a611b5452354b4472511")
check("device_ro", data["fingerprint_evidence"]["source_device_read_only"] == "PASS")
check("mount_ext4", data["fingerprint_evidence"]["source_filesystem"] == "ext4")
check("unmounted", data["fingerprint_evidence"]["source_unmounted"] == "PASS")
check("manifest_bytes", data["observed_evidence"]["evidence_manifest_bytes"] == 787)
check("guest_bytes", data["observed_evidence"]["guest_attributes_json_bytes"] == 1914)
check("terminal_bytes", data["observed_evidence"]["terminal_marker_bytes"] == 25)
check("evidence_hash_count", len(data["observed_evidence_sha256"]) == 11)
check("guest_hash", data["observed_evidence_sha256"]["guest-attributes.json"] == "3a9c6c0c0774c87c8d778ac9381c7c7394f9a73a2ad3a27172fb965972e3a379")
check("terminal_hash", data["observed_evidence_sha256"]["terminal.marker"] == "531485a3c10666637261b606aedcec89cda17e7e65c7116b8ffb8e0eecfd0f00")
check("no_delete", data["action_counts"]["cloud_resource_deletions"] == 0)
check("no_retry", data["action_counts"]["retries"] == 0)
check("no_numerics", data["action_counts"]["numerical_processes"] == 0)
check("no_candidate", data["action_counts"]["candidate_evaluations"] == 0)
check("no_ssh", data["action_counts"]["ssh_or_scp"] == 0)
check("startup_identity", data["staging"]["startup_script_sha256"] == "06b0fdd4d2df03d4135955f5de750efaa79ba755b0cdbbd617af980cc4bbb13d")
check("cloudshell_identity", data["staging"]["cloudshell_script_sha256"] == "df3f4aa4ea02fc67f176152f3e7e4c02c819802621a2d614daabee7892203249")
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
