#!/usr/bin/env python3
"""Audit the fail-closed H2-P5A C4 storage compatibility correction."""

from __future__ import annotations

import hashlib
import json
import pathlib
import sys


ROOT = pathlib.Path(__file__).resolve().parents[1]
CORRECTION = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p5a-storage-correction-v1-20260827"
)
RECEIPT = CORRECTION / "h2-p5a-vm-creation-blocked-receipt.json"
PROPOSAL = CORRECTION / "h2-p5a-storage-correction-proposal.json"
AUDIT = CORRECTION / "h2-p5a-storage-correction-audit.json"
ORIGINAL = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p5a-preflight-v1-20260827/h2-p5a-execution-proposal.json"
)
MANIFEST = ROOT / (
    "artifacts/nhm2/g2h-e-s5/candidate-neutral/"
    "h2-p5a-preflight-v1-20260827/h2-p5a-source-manifest.json"
)


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    threads = [entry["threads"] for entry in proposal["runs"]]
    checks = {
        "blocked_receipt_schema":
            receipt["schema"].endswith("vm_creation_blocked_receipt.v1"),
        "blocked_preexecution_not_numerical":
            receipt["status"]
            == "BLOCKED_PREEXECUTION_STORAGE_INCOMPATIBILITY",
        "exact_platform_error_bound":
            receipt["error"]
            == "pd-balanced disk type cannot be used by c4-standard-16 machine type.",
        "no_instance_created": receipt["instance_created"] is False,
        "no_orphan_disk_created": receipt["orphan_disk_created"] is False,
        "resource_absence_verified":
            receipt["resource_absence_verified_after_failure"] is True,
        "no_numerical_run": receipt["numerical_runs_executed"] == 0,
        "no_candidate_evaluation": receipt["candidate_evaluations"] == 0,
        "no_positive_sampling": receipt["positive_parameter_samples"] == 0,
        "no_authority_promotion": receipt["authority_promoted"] is False,
        "uploaded_archive_hash_bound":
            receipt["upload_archive_sha256"]
            == proposal["preuploaded_inventory"]["archive_sha256"],
        "uploaded_archive_inventory_bound":
            receipt["upload_archive_entries"]
            == proposal["preuploaded_inventory"]["archive_entries"] == 36,
        "original_proposal_hash_exact":
            sha256(ORIGINAL) == proposal["original_execution_proposal_sha256"]
            == receipt["execution_proposal_sha256"],
        "source_manifest_hash_exact":
            sha256(MANIFEST) == proposal["container"]["source_manifest_sha256"]
            == receipt["source_manifest_sha256"],
        "proposal_awaits_new_authorization":
            proposal["status"]
            == "FROZEN_AWAITING_EXPLICIT_STORAGE_AMENDMENT_AUTHORIZATION",
        "machine_identity_unchanged":
            proposal["machine"]["name"]
            == "nhm2-h2-p5a-c4-16-20260827"
            and proposal["machine"]["type"] == "c4-standard-16"
            and proposal["machine"]["zone"] == "us-central1-a",
        "only_storage_class_corrected":
            proposal["machine"]["boot_disk_gb"] == 30
            and proposal["machine"]["boot_disk_type"]
            == "hyperdisk-balanced",
        "cost_ceiling_unchanged":
            proposal["machine"]["total_cost_ceiling_usd"] == "2.00",
        "aggregate_runtime_ceiling_present":
            proposal["machine"]["aggregate_vm_runtime_ceiling_seconds"]
            == 7200,
        "run_sequence_unchanged": threads == [1, 4, 8, 16, 16],
        "repeat_binding_unchanged": proposal["runs"][4]["repeat_of"] == 4,
        "per_run_timeout_unchanged":
            proposal["external_timeout_seconds_per_run"] == 3600,
        "turnaround_rule_unchanged":
            proposal["semantic_acceptance"]
            ["slower_16_thread_milliseconds_max"] == 337502
            and proposal["semantic_acceptance"]
            ["two_selector_projection_hours_max"] == 24,
        "binary_identity_unchanged":
            proposal["container"]["required_remote_binary_sha256"]
            == "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7",
        "no_new_upload":
            proposal["preuploaded_inventory"]["new_upload_authorized_or_required"]
            is False,
        "authority_all_false": not any(proposal["authority"].values()),
    }
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_storage_correction_audit.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "checks": checks,
        "blocked_receipt_sha256": sha256(RECEIPT),
        "storage_correction_proposal_sha256": sha256(PROPOSAL),
        "numerical_runs_executed": 0,
        "instance_created": False,
        "authority_promoted": False,
    }
    AUDIT.write_text(
        json.dumps(payload, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload, indent=2, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
