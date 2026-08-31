#!/usr/bin/env python3
"""Independent inert audit for the P8C boot-image-only correction."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8c-boot-image-correction-v1-20260828"
CORRECTION = OUT / "h2-p8c-boot-image-correction.v1.json"
AUDIT = OUT / "h2-p8c-boot-image-correction-independent-audit.v1.json"
EXPECTED_CORRECTION = "aade7e5d8d384500503b4ecd1b2f04f4afcf95bccffd735da309363d01d6c32b"
EXPECTED_PARENT = "7e8f28d755b5dea7cc212c4d0fda263a84374215680b0a94a179fbb2fbca2ace"
EXPECTED_ARCHIVE = "f0a0fabf608949d6755465ddc8f35075631818f383d6ba5eb78ab297152d3c4c"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    if AUDIT.exists():
        raise SystemExit("immutable audit output already exists")
    data = json.loads(CORRECTION.read_text(encoding="utf-8"))
    resource = data["resource_unchanged"]
    upload = data["upload_unchanged"]
    execution = data["execution_unchanged"]
    checks = {
        "correction_hash_exact": sha(CORRECTION) == EXPECTED_CORRECTION,
        "parent_proposal_exact": data["parent_proposal_sha256"] == EXPECTED_PARENT,
        "status_inert": data["status"] == "FROZEN_INERT_AWAITING_SEPARATE_CORRECTION_AUTHORIZATION",
        "scope_boot_image_only": data["correction_scope"] == "BOOT_IMAGE_BINDING_ONLY",
        "image_exact": data["boot_image"]["self_link"] == "projects/debian-cloud/global/images/debian-12-bookworm-v20260817",
        "image_observed_ready": data["boot_image"]["observed_status"] == "READY",
        "resource_name_exact": resource["name"] == "nhm2-h2-p8c-diagnostic-c4-16-20260828",
        "resource_shape_exact": resource["project"] == "dark-stratum-455714-h4" and resource["zone"] == "us-central1-a" and resource["machine_type"] == "c4-standard-16",
        "disk_exact": resource["boot_disk_gb"] == 30 and resource["boot_disk_type"] == "hyperdisk-balanced",
        "ceilings_unchanged": resource["aggregate_vm_runtime_ceiling_seconds"] == 54000 and resource["total_cost_ceiling_usd"] == 13.0,
        "archive_exact": upload["bytes"] == 236349440 and upload["sha256"] == EXPECTED_ARCHIVE,
        "cloud_archive_verified": upload["cloud_verified"] is True,
        "additional_upload_forbidden": upload["additional_uploads_allowed"] is False,
        "execution_exact": execution["process_count"] == 1 and execution["selector_threads"] == 16 and execution["external_timeout_seconds"] == 50400,
        "retry_retune_false": execution["retry_allowed"] is False and execution["retune_allowed"] is False,
        "no_creation_attempt": data["precreation_state"]["vm_absent"] is True and data["precreation_state"]["creation_attempts"] == 0,
        "no_numerical_run": data["precreation_state"]["numerical_runs"] == 0,
        "all_authority_false": all(value is False for value in data["authority"].values()),
    }
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8c_boot_image_correction_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "checks_passed": len(checks) - len(failed),
        "checks_total": len(checks),
        "checks": checks,
        "failed": failed,
        "correction_sha256": EXPECTED_CORRECTION,
        "parent_proposal_sha256": EXPECTED_PARENT,
        "creation_attempts": 0,
        "numerical_runs": 0,
        "authority_promoted": False,
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['checks_passed']}/{payload['checks_total']} {payload['status']}")
    print(sha(AUDIT))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
