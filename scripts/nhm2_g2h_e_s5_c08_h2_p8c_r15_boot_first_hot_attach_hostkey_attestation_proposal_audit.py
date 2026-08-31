#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r15-boot-first-hot-attach-hostkey-attestation-v1-20260830"
PROPOSAL = BASE / "h2-p8c-r15-boot-first-hot-attach-hostkey-attestation-proposal.v1.json"
STARTUP = BASE / "h2-p8c-r15-hostkey-attestor-startup.v1.sh"
CLOUDSHELL = BASE / "h2-p8c-r15-boot-first-hot-attach-hostkey-attestation-cloudshell.v1.sh"

data = json.loads(PROPOSAL.read_bytes())
startup_raw = STARTUP.read_bytes()
cloudshell_raw = CLOUDSHELL.read_bytes()
startup = startup_raw.decode("utf-8")
cloudshell = cloudshell_raw.decode("utf-8")
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r15_boot_first_hot_attach_hostkey_attestation.proposal.v1")
check("frozen_status", data["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("predecessor_binding", data["predecessor"]["r14_result_sha256"] == "52d685963208bdf2d1f39771e14108797a52ddea1b6fdbf601a79e13e55aaed0")
check("startup_bytes", len(startup_raw) == data["inputs"]["startup_script"]["bytes"] == 2764)
check("startup_hash", hashlib.sha256(startup_raw).hexdigest() == data["inputs"]["startup_script"]["sha256"] == "06b0fdd4d2df03d4135955f5de750efaa79ba755b0cdbbd617af980cc4bbb13d")
check("cloudshell_bytes", len(cloudshell_raw) == data["inputs"]["cloudshell_script"]["bytes"] == 6977)
check("cloudshell_hash", hashlib.sha256(cloudshell_raw).hexdigest() == data["inputs"]["cloudshell_script"]["sha256"] == "df3f4aa4ea02fc67f176152f3e7e4c02c819802621a2d614daabee7892203249")
check("expected_fingerprint_bound", data["expected_fingerprint"] in startup and data["expected_fingerprint"] in cloudshell)
check("guest_namespace", "guest-attributes/nhm2-r15" in startup and "nhm2-r15" in cloudshell)
check("metadata_timeouts", "--connect-timeout 5 --max-time 15" in startup)
check("wait_state_first", "record state WAITING_FOR_SOURCE" in startup)
check("source_wait_bounded", "seq 1 300" in startup and "sleep 2" in startup)
check("device_read_only_guard", "blockdev --getro \"$SOURCE_DEVICE\"" in startup)
check("partition_read_only_guard", "blockdev --getro \"$root_partition\"" in startup)
check("ext4_read_only_mount", "mount -t ext4 -o ro,noload" in startup)
check("xfs_read_only_mount", "mount -t xfs -o ro,norecovery" in startup)
check("bounded_public_key", "public_key_bytes" in startup and "-le 4096" in startup)
check("match_mismatch_total", "record verdict MATCH" in startup and "record verdict MISMATCH" in startup)
check("unmount_before_terminal", startup.index('record source_unmounted PASS') < startup.index('record terminal COMPLETE'))
create_start = cloudshell.index('gcloud compute instances create "$HELPER"')
create_end = cloudshell.index('deadline=$((SECONDS + 300))', create_start)
attach_start = cloudshell.index('gcloud compute instances attach-disk "$HELPER"')
check("create_has_no_source_disk", "--disk=" not in cloudshell[create_start:create_end])
check("writable_channel_before_attach", cloudshell.index("R15_WRITABLE_BOOT_AND_GUEST_CHANNEL_PASS") < attach_start)
check("hot_attach_after_create", create_start < attach_start)
check("hot_attach_read_only", "--mode=ro" in cloudshell[attach_start:attach_start + 500])
check("one_attach_command", cloudshell.count('gcloud compute instances attach-disk "$HELPER"') == 1)
check("guest_terminal_required", 'values["terminal"] == "COMPLETE"' in cloudshell)
check("helper_termination_required", "[[ \"$helper_status\" == 'TERMINATED' ]]" in cloudshell)
check("serial_not_acceptance", data["result_channel"]["serial_console_required"] is False and "get-serial-port-output" not in cloudshell)
check("one_vm_bound", data["execution_bounds"]["maximum_running_vms"] == 1 and "running_count" in cloudshell)
check("runtime_bound", data["execution_bounds"]["aggregate_runtime_seconds"] == 1800)
check("cost_bound", data["execution_bounds"]["cost_ceiling_usd"] == 1.0)
check("storage_bound", data["execution_bounds"]["new_persistent_disk_gb"] == 10)
check("no_retry", data["execution_bounds"]["retry_or_resource_substitution_authorized"] is False)
check("no_delete", data["execution_bounds"]["resource_deletion_authorized"] is False and "instances delete" not in cloudshell)
check("no_ssh_scp", " gcloud compute ssh " not in cloudshell and " gcloud compute scp " not in cloudshell)
check("no_numerics", data["execution_bounds"]["numerical_processes"] == 0 and "mini-boson-star" not in startup + cloudshell)
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
raw = PROPOSAL.read_bytes()
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
