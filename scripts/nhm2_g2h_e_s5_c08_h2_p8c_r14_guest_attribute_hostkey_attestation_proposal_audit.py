#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r14-guest-attribute-hostkey-attestation-v1-20260830"
PROPOSAL = BASE / "h2-p8c-r14-guest-attribute-hostkey-attestation-proposal.v1.json"
STARTUP = BASE / "h2-p8c-r14-hostkey-attestor-startup.v1.sh"
CLOUDSHELL = BASE / "h2-p8c-r14-guest-attribute-hostkey-attestation-cloudshell.v1.sh"

data = json.loads(PROPOSAL.read_bytes())
startup_raw = STARTUP.read_bytes()
cloudshell_raw = CLOUDSHELL.read_bytes()
startup = startup_raw.decode("utf-8")
cloudshell = cloudshell_raw.decode("utf-8")
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r14_guest_attribute_hostkey_attestation.proposal.v1")
check("frozen_status", data["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("predecessor_binding", data["predecessor"]["r13_result_sha256"] == "7fb529b9b356418acd6e4b214489eb35482a3a4e872666da44d37e6415e89872")
check("startup_bytes", len(startup_raw) == data["inputs"]["startup_script"]["bytes"] == 2675)
check("startup_hash", hashlib.sha256(startup_raw).hexdigest() == data["inputs"]["startup_script"]["sha256"] == "e76e4104934cd3d16a1cc8de53e0ec5dbd2fb0dfce069ec1a8dc12ef8b27c86f")
check("cloudshell_bytes", len(cloudshell_raw) == data["inputs"]["cloudshell_script"]["bytes"] == 5696)
check("cloudshell_hash", hashlib.sha256(cloudshell_raw).hexdigest() == data["inputs"]["cloudshell_script"]["sha256"] == "518edbe9bf8ae4ede18f7a943ae82034aaea9aaf3d9e1e4798c93fa740a7d3ca")
check("expected_fingerprint_bound", data["expected_fingerprint"] in startup and data["expected_fingerprint"] in cloudshell)
check("source_clone_bound", data["resources"]["source_clone"] in startup and data["resources"]["source_clone"] in cloudshell)
check("guest_attribute_namespace", "guest-attributes/nhm2-r14" in startup and "nhm2-r14" in cloudshell)
check("redundant_receipt", "RECEIPT_DIR='/var/lib/nhm2-r14'" in startup and 'RECEIPT="$RECEIPT_DIR/receipt.v1.txt"' in startup)
check("serial_not_acceptance", data["result_channel"]["serial_console_required"] is False and "get-serial-port-output" not in cloudshell)
check("device_read_only_guard", "blockdev --getro \"$SOURCE_DEVICE\"" in startup)
check("partition_read_only_guard", "blockdev --getro \"$root_partition\"" in startup)
check("ext4_read_only_mount", "mount -t ext4 -o ro,noload" in startup)
check("xfs_read_only_mount", "mount -t xfs -o ro,norecovery" in startup)
check("bounded_public_key", "public_key_bytes" in startup and "-le 4096" in startup)
check("match_mismatch_total", "record verdict MATCH" in startup and "record verdict MISMATCH" in startup)
check("unmount_before_terminal", startup.index('record source_unmounted PASS') < startup.index('record terminal COMPLETE'))
check("guest_terminal_required", 'values["terminal"] == "COMPLETE"' in cloudshell)
check("helper_termination_required", "[[ \"$helper_status\" == 'TERMINATED' ]]" in cloudshell)
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
