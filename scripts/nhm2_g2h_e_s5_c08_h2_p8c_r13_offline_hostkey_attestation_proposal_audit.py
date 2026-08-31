#!/usr/bin/env python3
"""Audit the candidate-neutral P8C-R13 offline host-key attestation proposal."""

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r13-offline-hostkey-attestation-v1-20260830"
STARTUP = BASE / "h2-p8c-r13-hostkey-attestor-startup.v1.sh"
CLOUD = BASE / "h2-p8c-r13-offline-hostkey-attestation-cloudshell.v1.sh"
LEDGER = BASE / "h2-p8c-r13-command-ledger.v1.txt"
PROPOSAL = BASE / "h2-p8c-r13-offline-hostkey-attestation-proposal.v1.json"
OUTPUT = BASE / "h2-p8c-r13-offline-hostkey-attestation-proposal-independent-audit.v1.json"

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

p = json.loads(PROPOSAL.read_text(encoding="utf-8"))
startup = STARTUP.read_text(encoding="utf-8")
cloud = CLOUD.read_text(encoding="utf-8")
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
bounds = p["execution_bounds"]
resources = p["resources"]

checks = {
    "schema_exact": p["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r13_offline_hostkey_attestation.proposal.v1",
    "status_exact": p["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER_AND_EXPLICIT_R13_BOUNDS",
    "authorization_exact": p["authorization"]["account_selection_and_read_only_access_verified"] is True and p["authorization"]["browser_action_time_cost_confirmation_satisfied"] is True,
    "startup_identity": STARTUP.stat().st_size == p["inputs"]["startup_script"]["bytes"] == 2073 and digest(STARTUP) == p["inputs"]["startup_script"]["sha256"] == "ce28f18db5f4e8acc2a5a288c23975abae05f169343ef308df8731e3c8a8b040",
    "cloud_identity": CLOUD.stat().st_size == p["inputs"]["cloudshell_script"]["bytes"] == 5716 and digest(CLOUD) == p["inputs"]["cloudshell_script"]["sha256"] == "3368d6332e1340a1622fc490e5da7ca72c452fcd3536682f82c0f224aef08723",
    "ledger_identity": LEDGER.stat().st_size == p["command_ledger"]["bytes"] == 964 and digest(LEDGER) == p["command_ledger"]["sha256"] == "2fe3e2e87aa5cc9347a90779d556427e99837db2867304f6764f136811a5d231",
    "ledger_two_commands": len(ledger) == 2,
    "health_identity": len(ledger[0]) == 31 and hashlib.sha256(ledger[0].encode()).hexdigest() == "5b2f2b1ac490b8642eb6a57489f7a45c811eff93fda8050f86b3ec5d00761534",
    "execution_identity": len(ledger[1]) == 931 and hashlib.sha256(ledger[1].encode()).hexdigest() == "40924d3d434d7ebbb06d23e67788e920bbe49a24dcb1d8b9129b01f7d56ef26b",
    "charter_authorized": p["charter"]["proposal_sha256"] == "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945",
    "predecessor_exact": p["predecessor"]["r12_result_sha256"] == "f7e404f812467c4c03baf1a40ee9e74e5b13e16dcb2bc045da35f8912cd7fc5c" and p["predecessor"]["r12_result_audit_sha256"] == "b4eb0f5337358a974a2c07b8849350ac20ca55aa23425b1b9a6bb6af585b431c",
    "project_zone_exact": resources["project"] == "dark-stratum-455714-h4" and resources["zone"] == "us-central1-a",
    "resource_prefix_exact": all(name.startswith("nhm2-h2-") for name in (resources["source_disk"], resources["snapshot"], resources["clone_disk"], resources["helper_vm"])),
    "new_resource_identity": all("r13" in name for name in (resources["snapshot"], resources["clone_disk"], resources["helper_vm"])),
    "helper_small_exact": resources["helper_machine_type"] == "e2-small" and resources["helper_boot_disk_gb"] == 10,
    "image_exact": resources["helper_boot_image"] == "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" and resources["helper_boot_image"] in cloud,
    "fingerprint_exact": p["expected_fingerprint"] == "SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw" and p["expected_fingerprint"] in startup and p["expected_fingerprint"] in cloud,
    "source_device_exact": "/dev/disk/by-id/google-nhm2-h2-p8c-rescue-hostkey-clone-r13-20260830" in startup,
    "block_read_only_guards": startup.count("blockdev --getro") == 2 and "R13_SOURCE_DEVICE_READ_ONLY=PASS" in startup,
    "mount_read_only_guards": "ro,noload" in startup and "ro,norecovery" in startup and "R13_SOURCE_MOUNT_READ_ONLY=PASS" in startup,
    "public_key_bounded": "ssh_host_ed25519_key.pub" in startup and "public_key_bytes" in startup and "4096" in startup,
    "serial_channel_only": "get-serial-port-output" in cloud and "R13_ATTESTOR_COMPLETE" in cloud and "R13_ATTESTATION_COMPLETE" in cloud,
    "no_ssh_scp": all(token not in cloud for token in ("compute ssh", "compute scp", "known_hosts")),
    "single_vm_guard": "status=RUNNING" in cloud and "running_count" in cloud,
    "helper_cleanup_stop": "trap cleanup_stop EXIT" in cloud and "instances stop" in cloud,
    "no_resource_delete": all(token not in cloud for token in ("instances delete", "disks delete", "snapshots delete")) and bounds["resource_deletion_authorized"] is False,
    "runtime_cost_bounded": bounds["aggregate_runtime_seconds"] == 1800 and bounds["cost_ceiling_usd"] == 1.0 and bounds["maximum_running_vms"] == 1,
    "storage_bounded": bounds["new_persistent_disk_gb"] == 20,
    "no_numerical_work": bounds["numerical_processes"] == 0,
    "no_retry_substitution": bounds["first_failure_terminal"] is True and bounds["retry_or_resource_substitution_authorized"] is False,
    "success_boundary_exact": p["success_boundary"] == "serial_console_authenticated_match_to_r8_presented_fingerprint_with_source_clone_mounted_read_only_and_helper_stopped",
    "authority_all_false": all(value is False for value in p["authority"].values()),
}

audit = {
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r13_offline_hostkey_attestation.proposal.independent_audit.v1",
    "verdict": "PASS" if all(checks.values()) else "FAIL",
    "passed": sum(checks.values()),
    "total": len(checks),
    "checks": checks,
    "proposal_sha256": digest(PROPOSAL),
    "cloud_actions_executed": 0,
    "resource_mutations": 0,
    "numerical_actions_executed": 0,
    "authority_promoted": False,
}
OUTPUT.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n", encoding="utf-8")
print(f"{audit['passed']}/{audit['total']} {audit['verdict']}")
print(digest(PROPOSAL))
print(digest(OUTPUT))
raise SystemExit(0 if audit["verdict"] == "PASS" else 1)
