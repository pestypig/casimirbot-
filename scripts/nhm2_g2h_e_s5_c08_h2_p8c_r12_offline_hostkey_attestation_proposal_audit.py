#!/usr/bin/env python3
"""Audit the candidate-neutral P8C-R12 offline host-key attestation proposal."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-r12-offline-hostkey-attestation-v1-20260830"
STARTUP = BASE / "h2-p8c-r12-hostkey-attestor-startup.v1.sh"
CLOUD = BASE / "h2-p8c-r12-offline-hostkey-attestation-cloudshell.v1.sh"
LEDGER = BASE / "h2-p8c-r12-command-ledger.v1.txt"
PROPOSAL = BASE / "h2-p8c-r12-offline-hostkey-attestation-proposal.v1.json"
OUTPUT = BASE / "h2-p8c-r12-offline-hostkey-attestation-proposal-independent-audit.v1.json"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


p = json.loads(PROPOSAL.read_text(encoding="utf-8"))
startup = STARTUP.read_text(encoding="utf-8")
cloud = CLOUD.read_text(encoding="utf-8")
ledger = LEDGER.read_text(encoding="utf-8").splitlines()
bounds = p["execution_bounds"]
resources = p["resources"]

checks = {
    "schema_exact": p["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_r12_offline_hostkey_attestation.proposal.v1",
    "status_cost_confirmation": p["status"] == "FROZEN_READY_UNDER_ACTIVE_CHARTER_PENDING_BROWSER_ACTION_TIME_COST_CONFIRMATION" and bounds["browser_action_time_cost_confirmation_required"] is True,
    "startup_identity": STARTUP.stat().st_size == p["inputs"]["startup_script"]["bytes"] == 2069 and digest(STARTUP) == p["inputs"]["startup_script"]["sha256"] == "f28efc172d7db843e328368fa03e2c5d48c6eea9346cbd3a96cc9a5dbcf7dc6f",
    "cloud_identity": CLOUD.stat().st_size == p["inputs"]["cloudshell_script"]["bytes"] == 5627 and digest(CLOUD) == p["inputs"]["cloudshell_script"]["sha256"] == "58bd563f643b45310f9c6a8a04d088922ec4538ea9427dc6e48fd5e86b8e65c4",
    "ledger_identity": LEDGER.stat().st_size == p["command_ledger"]["bytes"] == 964 and digest(LEDGER) == p["command_ledger"]["sha256"] == "bb76e55a1fb598570366047a1e6d979066e10cea51b8471820668ff423d8a723",
    "ledger_two_commands": len(ledger) == 2,
    "health_identity": len(ledger[0]) == 31 and hashlib.sha256(ledger[0].encode()).hexdigest() == "eedbb90106eaa66288ebeb2952f84ae47186659134f256ae44364af2f77ee27e",
    "execution_identity": len(ledger[1]) == 931 and hashlib.sha256(ledger[1].encode()).hexdigest() == "87f385e3fcc4e784aba876531c5b5c28ed99625e4bf6bfa21acfcc597072f313",
    "charter_authorized": p["charter"] == {"authorization_audit_sha256": "10d2966c339e8bfd6a84addbcd97850cb3f316758e9a7e3d9a675c04a9c13a6d", "authorization_sha256": "4f28231a74f2919aab597dda754acce7f8d43e5ac2f60c110bb3a2b4e47680dc", "proposal_sha256": "5dda0a1a73478e5a9254a31514fbfa6dc15e2dc4d526dd300ba33068dd2ff945"},
    "predecessor_exact": p["predecessor"]["r11_result_sha256"] == "6c386c37ebf5bc4de6eaae0577da42d0c99b3330df3d0685df08b1298bebc8c6" and p["predecessor"]["r11_result_audit_sha256"] == "98117b1d6a194ea9c664e0163797c09e83d20a872b3379ba09bb63532d07c083",
    "project_zone_exact": resources["project"] == "dark-stratum-455714-h4" and resources["zone"] == "us-central1-a",
    "resource_prefix_exact": all(name.startswith("nhm2-h2-") for name in (resources["source_disk"], resources["snapshot"], resources["clone_disk"], resources["helper_vm"])),
    "helper_small_exact": resources["helper_machine_type"] == "e2-small" and resources["helper_boot_disk_gb"] == 10,
    "image_exact": resources["helper_boot_image"] == "projects/debian-cloud/global/images/debian-12-bookworm-v20260817" and resources["helper_boot_image"] in cloud,
    "fingerprint_exact": p["expected_fingerprint"] == "SHA256:ijX48Sh5o6lAfXmhYGrq+anJLuRA19XsvppsOcL3XFw" and p["expected_fingerprint"] in startup and p["expected_fingerprint"] in cloud,
    "source_device_exact": "/dev/disk/by-id/google-nhm2-h2-p8c-rescue-hostkey-clone-20260830" in startup,
    "block_read_only_guards": startup.count("blockdev --getro") == 2 and "R12_SOURCE_DEVICE_READ_ONLY=PASS" in startup,
    "mount_read_only_guards": "ro,noload" in startup and "ro,norecovery" in startup and "R12_SOURCE_MOUNT_READ_ONLY=PASS" in startup,
    "public_key_bounded": "ssh_host_ed25519_key.pub" in startup and "public_key_bytes" in startup and "4096" in startup,
    "serial_channel_only": "get-serial-port-output" in cloud and "R12_ATTESTOR_COMPLETE" in cloud and "R12_ATTESTATION_COMPLETE" in cloud,
    "no_ssh_scp": all(token not in cloud for token in ("compute ssh", "compute scp", "known_hosts")),
    "single_vm_guard": "maximum_running_vms" not in cloud and "status=RUNNING" in cloud and "running_count" in cloud,
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
    "schema": "nhm2.g2h_e_s5.c08_h2_p8c_r12_offline_hostkey_attestation.proposal.independent_audit.v1",
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
