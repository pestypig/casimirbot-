#!/usr/bin/env python3
"""Prepare the inert H2-P5A-R1 upload-inventory repair."""

from __future__ import annotations

import hashlib
import io
import json
import tarfile
from pathlib import Path
from typing import BinaryIO


ROOT = Path(__file__).resolve().parents[1]
OLD_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-preflight-v1-20260827"
OLD_MANIFEST = OLD_DIR / "h2-p5a-source-manifest.json"
OLD_ARCHIVE = OLD_DIR / "h2-p5a-upload-v1.tar"
BLOCKED_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-execution-blocked-v1-20260827"
BLOCKED_RECEIPT = BLOCKED_DIR / "h2-p5a-execution-blocked-receipt.json"
OUT_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r1-upload-repair-v1-20260827"
MANIFEST = OUT_DIR / "h2-p5a-r1-source-manifest.json"
ARCHIVE = OUT_DIR / "h2-p5a-r1-upload-v1.tar"
PROPOSAL = OUT_DIR / "h2-p5a-r1-execution-proposal.json"
PREFLIGHT = OUT_DIR / "h2-p5a-r1-preflight.json"
DOCKERFILE_REL = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.v1"
DOCKERFILE = ROOT / DOCKERFILE_REL
OLD_ARCHIVE_SHA256 = "5a4f6f983fed9b51fb444b115df77001062f24a6d5540f96fae0dc2d101c321d"
OLD_MANIFEST_SHA256 = "7c56923df16e3cae9b82af3581de26a777a0b2b37f561012c40c29d0c2a7a907"
BLOCKED_RECEIPT_SHA256 = "1f7715b8877a8f887fe9bebd714f3ad3519949284da30b3d85006a35039f83cf"
DOCKERFILE_SHA256 = "bf45b37bcac9d10d1d86215e82dc1dd09cb6d200934e48d3cfccdb385058de9c"
REQUIRED_BINARY_SHA256 = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def stream_sha256(stream: BinaryIO) -> str:
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(block)
    return digest.hexdigest()


def normalized_info(name: str, size: int) -> tarfile.TarInfo:
    info = tarfile.TarInfo(name)
    info.size = size
    info.mode = 0o644
    info.mtime = 0
    info.uid = 0
    info.gid = 0
    info.uname = ""
    info.gname = ""
    return info


def main() -> None:
    old_manifest = json.loads(OLD_MANIFEST.read_text(encoding="utf-8"))
    old_files = old_manifest["files"]
    base = old_manifest["pinned_base_images_archive"]
    expected_old_names = [item["path"] for item in old_files] + [base["path"]]

    checks: dict[str, bool] = {
        "old_manifest_exact": sha256(OLD_MANIFEST) == OLD_MANIFEST_SHA256,
        "old_archive_exact": sha256(OLD_ARCHIVE) == OLD_ARCHIVE_SHA256,
        "blocked_receipt_exact": sha256(BLOCKED_RECEIPT) == BLOCKED_RECEIPT_SHA256,
        "dockerfile_exact": sha256(DOCKERFILE) == DOCKERFILE_SHA256,
    }

    with tarfile.open(OLD_ARCHIVE, "r") as source_tar:
        old_names = source_tar.getnames()
        checks["old_inventory_exact"] = old_names == expected_old_names
        checks["old_inventory_omits_dockerfile"] = DOCKERFILE_REL not in old_names
        for item in old_files:
            member = source_tar.getmember(item["path"])
            stream = source_tar.extractfile(member)
            checks[f"old_member_{len(checks):02d}"] = (
                stream is not None
                and member.size == item["bytes"]
                and stream_sha256(stream) == item["sha256"]
            )
        base_member = source_tar.getmember(base["path"])
        base_stream = source_tar.extractfile(base_member)
        checks["old_base_member_exact"] = (
            base_stream is not None
            and base_member.size == base["bytes"]
            and stream_sha256(base_stream) == base["sha256"]
        )

    if not all(checks.values()):
        failed = [name for name, passed in checks.items() if not passed]
        raise SystemExit(f"frozen predecessor mismatch: {failed}")

    docker_entry = {
        "bytes": DOCKERFILE.stat().st_size,
        "path": DOCKERFILE_REL,
        "sha256": DOCKERFILE_SHA256,
    }
    repaired_names = expected_old_names + [DOCKERFILE_REL]
    manifest_payload = {
        "files": old_files + [docker_entry],
        "inventory_lineage": {
            "additive_entries": [DOCKERFILE_REL],
            "blocked_receipt_sha256": BLOCKED_RECEIPT_SHA256,
            "old_archive_entry_count": len(expected_old_names),
            "old_archive_sha256": OLD_ARCHIVE_SHA256,
            "old_source_manifest_sha256": OLD_MANIFEST_SHA256,
            "repaired_archive_entry_count": len(repaired_names),
            "unchanged_old_entry_order": True,
        },
        "pinned_base_images_archive": base,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r1_source_manifest.v1",
        "status": "PREPARED_INERT_UPLOAD_REPAIR",
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest_payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(OLD_ARCHIVE, "r") as source_tar, tarfile.open(
        ARCHIVE, "w", format=tarfile.GNU_FORMAT
    ) as output_tar:
        for name in expected_old_names:
            member = source_tar.getmember(name)
            stream = source_tar.extractfile(member)
            if stream is None:
                raise SystemExit(f"missing frozen member stream: {name}")
            output_tar.addfile(normalized_info(name, member.size), stream)
        docker_bytes = DOCKERFILE.read_bytes()
        output_tar.addfile(normalized_info(DOCKERFILE_REL, len(docker_bytes)), io.BytesIO(docker_bytes))

    proposal_payload = {
        "authority": {
            "authority_promotion": False,
            "candidate_or_output_root_creation": False,
            "frozen_candidate_evaluation": False,
            "full_selector_execution": False,
            "g3_si_metric_lane_work": False,
            "positive_sampling": False,
            "retuning_or_numerical_retry": False,
            "scientific_handler_linkage": False,
        },
        "command_template": "docker run --rm --cpus=16 --memory=12g nhm2-g2h-e-s5-h2-p5a-width-calibration:v1 --threads {threads}",
        "container": {
            "binary": "/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1",
            "dockerfile_path": DOCKERFILE_REL,
            "dockerfile_sha256": DOCKERFILE_SHA256,
            "required_remote_binary_sha256": REQUIRED_BINARY_SHA256,
            "source_manifest_sha256": sha256(MANIFEST),
            "tag": "nhm2-g2h-e-s5-h2-p5a-width-calibration:v1",
            "upload_archive_path": "h2-p5a-r1-upload-v1.tar",
            "upload_archive_sha256": sha256(ARCHIVE),
        },
        "external_timeout_seconds_per_run": 3600,
        "lineage": {
            "blocked_predecessor_attempt_exhausted": True,
            "blocked_receipt_sha256": BLOCKED_RECEIPT_SHA256,
            "numerical_runs_in_predecessor": 0,
            "repair_scope": "add_exact_frozen_dockerfile_to_upload_inventory_only",
        },
        "machine": {
            "aggregate_runtime_ceiling_seconds": 7200,
            "boot_disk_gb": 30,
            "boot_disk_type": "hyperdisk-balanced",
            "name": "nhm2-h2-p5a-r1-c4-16-20260827",
            "on_demand_rate_usd_per_hour": "0.79068",
            "provider": "Google Compute Engine",
            "total_cost_ceiling_usd": "2.00",
            "type": "c4-standard-16",
            "zone": "us-central1-a",
        },
        "program_gate": "G2H-E-S5",
        "runs": [
            {"ordinal": 1, "threads": 1},
            {"ordinal": 2, "threads": 4},
            {"ordinal": 3, "threads": 8},
            {"ordinal": 4, "threads": 16},
            {"ordinal": 5, "repeat_of": 4, "threads": 16},
        ],
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r1_execution_proposal.v1",
        "semantic_acceptance": {
            "all_runs_complete": True,
            "projection_multiplier_from_p1024": "255.998046875",
            "semantic_sha256_equal_across_all_runs": True,
            "slower_16_thread_milliseconds_max": 337502,
            "stderr_empty": True,
            "two_selector_projection_hours_max": 24,
        },
        "status": "FROZEN_AWAITING_SEPARATE_EXPLICIT_AUTHORIZATION",
        "stop_fail": [
            "upload archive or manifest identity mismatch",
            "missing or extra archive member",
            "remote binary hash mismatch",
            "any numerical mismatch",
            "any timeout or partial output",
            "any nonempty stderr",
            "any authority lock nonzero or true",
            "aggregate runtime or cost ceiling reached",
        ],
        "upload_boundary": {
            "additional_files_permitted": False,
            "archive_entry_count": len(repaired_names),
            "only_archive_permitted": "h2-p5a-r1-upload-v1.tar",
        },
    }
    PROPOSAL.write_text(json.dumps(proposal_payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(ARCHIVE, "r") as repaired_tar:
        actual_names = repaired_tar.getnames()
    producer_checks = {
        "all_predecessor_checks_pass": all(checks.values()),
        "manifest_adds_one_file": len(manifest_payload["files"]) == len(old_files) + 1,
        "manifest_adds_only_dockerfile": manifest_payload["inventory_lineage"]["additive_entries"] == [DOCKERFILE_REL],
        "archive_inventory_exact": actual_names == repaired_names,
        "archive_has_37_entries": len(actual_names) == 37,
        "dockerfile_present_once": actual_names.count(DOCKERFILE_REL) == 1,
        "proposal_binds_manifest": proposal_payload["container"]["source_manifest_sha256"] == sha256(MANIFEST),
        "proposal_binds_archive": proposal_payload["container"]["upload_archive_sha256"] == sha256(ARCHIVE),
        "proposal_binds_dockerfile": proposal_payload["container"]["dockerfile_sha256"] == DOCKERFILE_SHA256,
        "proposal_binds_binary": proposal_payload["container"]["required_remote_binary_sha256"] == REQUIRED_BINARY_SHA256,
        "run_sequence_unchanged": [item["threads"] for item in proposal_payload["runs"]] == [1, 4, 8, 16, 16],
        "machine_is_new_and_exact": proposal_payload["machine"]["name"] == "nhm2-h2-p5a-r1-c4-16-20260827",
        "storage_is_corrected": proposal_payload["machine"]["boot_disk_type"] == "hyperdisk-balanced",
        "authority_all_false": not any(proposal_payload["authority"].values()),
        "no_vm_or_upload_authorized": proposal_payload["status"] == "FROZEN_AWAITING_SEPARATE_EXPLICIT_AUTHORIZATION",
    }
    preflight_payload = {
        "archive_entry_count": len(actual_names),
        "archive_sha256": sha256(ARCHIVE),
        "authority_promoted": False,
        "checks": producer_checks,
        "checks_passed": sum(producer_checks.values()),
        "checks_total": len(producer_checks),
        "execution_proposal_sha256": sha256(PROPOSAL),
        "numerical_runs_executed": 0,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r1_preflight.v1",
        "source_manifest_sha256": sha256(MANIFEST),
        "status": "PASS" if all(producer_checks.values()) else "FAIL",
        "uploads_performed": 0,
        "vm_created_or_started": False,
    }
    PREFLIGHT.write_text(json.dumps(preflight_payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{preflight_payload['status']} {preflight_payload['checks_passed']}/{preflight_payload['checks_total']}")
    print(f"manifest_sha256={preflight_payload['source_manifest_sha256']}")
    print(f"archive_sha256={preflight_payload['archive_sha256']}")
    print(f"proposal_sha256={preflight_payload['execution_proposal_sha256']}")


if __name__ == "__main__":
    main()
