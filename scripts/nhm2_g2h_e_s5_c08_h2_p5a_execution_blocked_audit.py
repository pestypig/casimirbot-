#!/usr/bin/env python3
"""Independent audit of the H2-P5A upload-inventory preexecution stop."""

from __future__ import annotations

import hashlib
import json
import tarfile
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-execution-blocked-v1-20260827"
EVIDENCE = ARTIFACT / "h2-p5a-evidence"
RECEIPT = ARTIFACT / "h2-p5a-execution-blocked-receipt.json"
UPLOAD = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-preflight-v1-20260827/h2-p5a-upload-v1.tar"
DOCKERFILE_NAME = "Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.v1"
DOCKERFILE_PATH = f"tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/{DOCKERFILE_NAME}"
SOURCE_PATH = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_p5a_width_calibration_v1.cpp"
BASE_IMAGES_PATH = "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value)


def main() -> None:
    receipt = json.loads(RECEIPT.read_text(encoding="utf-8"))
    with tarfile.open(UPLOAD, "r") as archive:
        inventory = archive.getnames()

    checks: list[tuple[str, bool]] = []

    def check(name: str, condition: bool) -> None:
        checks.append((name, bool(condition)))

    check("receipt_schema", receipt["schema"] == "nhm2.g2h_e_s5.c08_h2_p5a_execution_blocked_receipt.v1")
    check("blocked_status", receipt["status"] == "BLOCKED_PREEXECUTION")
    check("blocked_decision", receipt["decision"] == "BLOCKED_PREEXECUTION_UPLOAD_INVENTORY_INCOMPLETE")
    check("upload_sha", sha256(UPLOAD) == receipt["frozen_bindings"]["archive_sha256"])
    check("bundle_sha", sha256(ARTIFACT / "h2-p5a-evidence-partial.tgz") == receipt["evidence"]["bundle_sha256"])
    check("entry_count", len(inventory) == receipt["frozen_bindings"]["archive_entry_count"] == 36)
    check("calibration_source_present", SOURCE_PATH in inventory)
    check("base_images_present", BASE_IMAGES_PATH in inventory)
    check("dockerfile_absent", DOCKERFILE_PATH not in inventory and not receipt["build"]["dockerfile_present_in_frozen_archive"])
    check("remote_archive_sha", (EVIDENCE / "remote-archive-sha256.txt").read_text(encoding="utf-8").split()[0] == receipt["frozen_bindings"]["archive_sha256"])
    check("build_log_names_missing_dockerfile", DOCKERFILE_NAME in (EVIDENCE / "docker-build.log").read_text(encoding="utf-8") and "no such file or directory" in (EVIDENCE / "docker-build.log").read_text(encoding="utf-8"))
    load_log = (EVIDENCE / "docker-load.log").read_text(encoding="utf-8")
    check("builder_image_loaded", "Loaded image: nhm2-g2h-s4-primary-fixture-builder:v2" in load_log)
    check("runtime_image_loaded", "Loaded image: nhm2-g2h-primary-proof:v2" in load_log)
    check("binary_not_built", receipt["build"]["binary_built"] is False and receipt["build"]["binary_sha256_verified"] is False)
    check("zero_calibrations", receipt["execution"]["candidate_only_calibrations_executed"] == 0 and receipt["execution"]["run_outputs_created"] == 0)
    check("no_run_files", not any(path.name.startswith("run-") for path in EVIDENCE.iterdir()))
    blocker = (EVIDENCE / "pre-run-blocker.txt").read_text(encoding="utf-8")
    check("blocker_names_zero_runs", "zero numerical calibrations executed" in blocker)
    check("vm_stopped", receipt["machine"]["status_after_capture"] == "TERMINATED")
    start = parse_time(receipt["machine"]["last_start_timestamp"])
    stop = parse_time(receipt["machine"]["last_stop_timestamp"])
    runtime = (stop - start).total_seconds()
    check("runtime_recomputed", abs(runtime - float(receipt["machine"]["runtime_seconds"])) < 0.001)
    check("runtime_below_ceiling", runtime < receipt["machine"]["aggregate_runtime_ceiling_seconds"])
    check("cost_below_ceiling", float(receipt["machine"]["conservative_creation_to_stop_cost_estimate_usd"]) < float(receipt["machine"]["total_cost_ceiling_usd"]))
    check("machine_identity", receipt["machine"]["name"] == "nhm2-h2-p5a-c4-16-20260827" and receipt["machine"]["type"] == "c4-standard-16" and receipt["machine"]["zone"] == "us-central1-a")
    check("storage_identity", receipt["machine"]["boot_disk_type"] == "hyperdisk-balanced" and receipt["machine"]["boot_disk_gb"] == 30)
    check("frozen_run_order", receipt["execution"]["requested_threads"] == [1, 4, 8, 16, 16])
    check("all_authority_false", all(value is False for value in receipt["authority"].values()))

    failed = [name for name, passed in checks if not passed]
    output = {
        "checks": [{"name": name, "pass": passed} for name, passed in checks],
        "failed": failed,
        "pass_count": sum(passed for _, passed in checks),
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_execution_blocked_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "total_count": len(checks),
    }
    destination = ARTIFACT / "h2-p5a-execution-blocked-audit.json"
    destination.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{output['status']} {output['pass_count']}/{output['total_count']}")
    if failed:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
