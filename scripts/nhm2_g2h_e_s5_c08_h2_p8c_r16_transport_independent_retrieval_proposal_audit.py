#!/usr/bin/env python3
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r16-transport-independent-retrieval-v1-20260830"
PROPOSAL = BASE / "h2-p8c-r16-transport-independent-retrieval-proposal.v1.json"
STARTUP = BASE / "h2-p8c-r16-transport-retriever-startup.v1.sh"
CLOUDSHELL = BASE / "h2-p8c-r16-transport-independent-retrieval-cloudshell.v1.sh"

data = json.loads(PROPOSAL.read_bytes())
startup_raw = STARTUP.read_bytes()
cloudshell_raw = CLOUDSHELL.read_bytes()
startup = startup_raw.decode("utf-8")
cloudshell = cloudshell_raw.decode("utf-8")
checks = []


def check(name, condition):
    checks.append((name, bool(condition)))


check("schema", data["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r16_transport_independent_retrieval.proposal.v1")
check("frozen_status", data["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER_AND_EXPLICIT_R16_DIRECTION")
check("charter_binding", data["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945")
check("predecessor_binding", data["predecessor"]["r15_result_sha256"] == "cd41d4f67bc92b704f478e0dc52e724cc7b20c79db058dc927afbc902815c24e")
check("startup_bytes", len(startup_raw) == data["inputs"]["startup_script"]["bytes"] == 3389)
check("startup_hash", hashlib.sha256(startup_raw).hexdigest() == data["inputs"]["startup_script"]["sha256"] == "2f2f89a7682c6bbb31ea5823698c980327867d28a87600764dda9c47a781e992")
check("cloudshell_bytes", len(cloudshell_raw) == data["inputs"]["cloudshell_script"]["bytes"] == 9178)
check("cloudshell_hash", hashlib.sha256(cloudshell_raw).hexdigest() == data["inputs"]["cloudshell_script"]["sha256"] == "d5754639ed1e641c2c12c6dfddd9d41c19ceecfe2e2964691f5844bfea5f9eec")
retrieval = data["retrieval"]
check("archive_identity", retrieval["expected_archive_bytes"] == 16443 and retrieval["expected_archive_sha256"] == "9535ce139466f0fc545d987594f8373809c7bfee6b343753a2d9f73810a5bd4d")
check("archive_identity_in_startup", str(retrieval["expected_archive_bytes"]) in startup and retrieval["expected_archive_sha256"] in startup)
check("archive_identity_in_cloudshell", str(retrieval["expected_archive_bytes"]) in cloudshell and retrieval["expected_archive_sha256"] in cloudshell)
check("bounded_guest_chunks", retrieval["expected_base64_bytes"] == 21924 and retrieval["expected_chunks"] == 4 and retrieval["guest_attribute_chunk_max_bytes"] == 6000)
check("guest_namespace", "guest-attributes/nhm2-r16" in startup and '"nhm2-r16"' in cloudshell)
check("metadata_timeouts", "--connect-timeout 5 --max-time 20" in startup)
check("wait_state_first", "record state WAITING_FOR_SOURCE" in startup)
check("source_wait_bounded", "seq 1 300" in startup and "sleep 2" in startup)
check("device_read_only_guard", "blockdev --getro \"$SOURCE_DEVICE\"" in startup)
check("partition_read_only_guard", "blockdev --getro \"$root_partition\"" in startup)
check("ext4_read_only_mount", "mount -t ext4 -o ro,noload" in startup)
check("xfs_read_only_mount", "mount -t xfs -o ro,norecovery" in startup)
check("regular_nonlink_archive", '[[ -f "$archive" && ! -L "$archive" ]]' in startup)
check("source_unmount_before_chunks", startup.index("record source_unmounted PASS") < startup.index('record "archive_chunk_$suffix"'))
check("terminal_after_chunks", startup.index('record "archive_chunk_$suffix"') < startup.index("record terminal COMPLETE"))
detach_r15 = cloudshell.index('gcloud compute instances detach-disk "$R15_HELPER"')
create_start = cloudshell.index('gcloud compute instances create "$HELPER"')
create_end = cloudshell.index('deadline=$((SECONDS + 300))', create_start)
attach_start = cloudshell.index('gcloud compute instances attach-disk "$HELPER"')
check("detach_old_before_create", detach_r15 < create_start)
check("create_has_no_source_disk", "--disk=" not in cloudshell[create_start:create_end])
check("writable_channel_before_attach", cloudshell.index("R16_WRITABLE_BOOT_AND_GUEST_CHANNEL_PASS") < attach_start)
check("hot_attach_after_create", create_start < attach_start)
check("hot_attach_read_only", "--mode=ro" in cloudshell[attach_start:attach_start + 500])
check("one_attach_command", cloudshell.count('gcloud compute instances attach-disk "$HELPER"') == 1)
check("two_bounded_detaches", cloudshell.count("gcloud compute instances detach-disk") == 2)
check("guest_terminal_required", 'values["terminal"] == "COMPLETE"' in cloudshell)
check("cloud_archive_initially_absent", '[[ ! -e "$CLOUD_ARCHIVE" ]]' in cloudshell)
check("cloud_archive_exclusive_write", "assert not target.exists()" in cloudshell and "target.write_bytes(raw)" in cloudshell)
check("helper_termination_required", '[[ "$helper_status" == \'TERMINATED\' ]]' in cloudshell)
check("source_detached_post", 'assert not d.get("users")' in cloudshell and "source-clone.post.json" in cloudshell)
check("one_vm_bound", data["execution_bounds"]["maximum_running_vms"] == 1 and "running_count" in cloudshell)
check("runtime_bound", data["execution_bounds"]["aggregate_runtime_seconds"] == 1800)
check("cost_bound", data["execution_bounds"]["cost_ceiling_usd"] == 1.0)
check("storage_bound", data["execution_bounds"]["new_persistent_disk_gb"] == 10)
check("no_retry", data["execution_bounds"]["retry_or_resource_substitution_authorized"] is False)
check("no_delete", data["execution_bounds"]["resource_deletion_authorized"] is False and "instances delete" not in cloudshell and "disks delete" not in cloudshell)
check("no_ssh_scp", " gcloud compute ssh " not in cloudshell and " gcloud compute scp " not in cloudshell and "known_hosts" not in startup + cloudshell)
check("no_numerics", data["execution_bounds"]["numerical_processes"] == 0 and "mini-boson-star" not in startup + cloudshell)
check("all_authority_false", all(value is False for value in data["authority"].values()))

failed = [name for name, passed in checks if not passed]
raw = PROPOSAL.read_bytes()
print(f"{len(checks) - len(failed)}/{len(checks)} PASS" if not failed else f"{len(checks) - len(failed)}/{len(checks)} FAIL")
print(hashlib.sha256(raw).hexdigest())
if failed:
    print("failed=" + ",".join(failed))
    raise SystemExit(1)
