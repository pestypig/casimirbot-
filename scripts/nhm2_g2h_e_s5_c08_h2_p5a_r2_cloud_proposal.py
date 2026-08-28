#!/usr/bin/env python3
"""Freeze the inert H2-P5A-R2 representative-width cloud proposal."""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R2_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-binding-repair-v1-20260827"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-cloud-proposal-v1-20260827"
ARCHIVE = R2_DIR / "h2-p5a-r2-upload-v1.tar"
MANIFEST = R2_DIR / "h2-p5a-r2-source-manifest.json"
R2_PREFLIGHT = R2_DIR / "h2-p5a-r2-preflight.json"
R2_AUDIT = R2_DIR / "h2-p5a-r2-independent-audit.json"
PROPOSAL = OUT / "h2-p5a-r2-cloud-execution-proposal.json"
PREFLIGHT = OUT / "h2-p5a-r2-cloud-proposal-preflight.json"

ARCHIVE_SHA256 = "e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87"
MANIFEST_SHA256 = "2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce"
R2_PREFLIGHT_SHA256 = "032b9227553ef0a90d52db44a38f0467d24e5ca419a93c03eabaf82deb24e7a6"
R2_AUDIT_SHA256 = "d01ec55934a4be929952799c2a91fed2b423c278ba2e92e967ce42a5097c852c"
DOCKERFILE = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.r2"
GUARD = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p5a_r2_offline_build_guard_v1.sh"
BASE_ARCHIVE = "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
IMAGE = "nhm2-g2h-e-s5-h2-p5a-r2-width-calibration:v1"
BINARY = "/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1"
BINARY_SHA256 = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    r2_preflight = json.loads(R2_PREFLIGHT.read_text(encoding="utf-8"))
    r2_audit = json.loads(R2_AUDIT.read_text(encoding="utf-8"))
    expected_names = (
        [item["path"] for item in manifest["files"][:-3]]
        + [manifest["pinned_base_images_archive"]["path"]]
        + [item["path"] for item in manifest["files"][-3:]]
    )
    with tarfile.open(ARCHIVE, "r") as archive:
        actual_names = archive.getnames()

    predecessor_checks = {
        "r2_archive_exact": sha256(ARCHIVE) == ARCHIVE_SHA256,
        "r2_manifest_exact": sha256(MANIFEST) == MANIFEST_SHA256,
        "r2_preflight_exact": sha256(R2_PREFLIGHT) == R2_PREFLIGHT_SHA256,
        "r2_audit_exact": sha256(R2_AUDIT) == R2_AUDIT_SHA256,
        "r2_archive_size_exact": ARCHIVE.stat().st_size == 236267520,
        "r2_inventory_exact": actual_names == expected_names,
        "r2_inventory_unique_39": len(actual_names) == len(set(actual_names)) == 39,
        "r2_preflight_pass": r2_preflight["status"] == "PASS" and r2_preflight["checks_passed"] == 11,
        "r2_audit_pass": r2_audit["status"] == "PASS" and r2_audit["checks_passed"] == 28,
        "r2_binary_exact": r2_audit["binary_sha256"] == BINARY_SHA256,
    }
    if not all(predecessor_checks.values()):
        raise SystemExit(f"R2 predecessor mismatch: {[k for k, v in predecessor_checks.items() if not v]}")

    OUT.mkdir(parents=True, exist_ok=True)
    run_sequence = [
        {"ordinal": 1, "threads": 1},
        {"ordinal": 2, "threads": 4},
        {"ordinal": 3, "threads": 8},
        {"ordinal": 4, "threads": 16},
        {"ordinal": 5, "repeat_of": 4, "threads": 16},
    ]
    proposal = {
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
        "build_checkpoint": {
            "base_archive_path_after_extraction": BASE_ARCHIVE,
            "command": f"sh {GUARD} {BASE_ARCHIVE} {IMAGE}",
            "dockerfile_path": DOCKERFILE,
            "guard_path": GUARD,
            "required_binary_path": BINARY,
            "required_binary_sha256": BINARY_SHA256,
            "required_guard_stdout_terminal": "PASS",
            "required_guard_stderr": "",
            "tag": IMAGE,
        },
        "command_template": f"docker run --rm --network=none --cpus=16 --memory=12g {IMAGE} --threads {{threads}}",
        "evidence_policy": {
            "alternate_output_root_permitted": False,
            "complete_fail_timeout_or_partial_is_immutable": True,
            "delete_or_overwrite_permitted": False,
            "remote_root": "/var/lib/nhm2-h2-p5a-r2-cloud-evidence-v1",
            "retry_after_numerical_invocation_permitted": False,
        },
        "external_timeout_seconds_per_run": 3600,
        "lineage": {
            "r1_blocker_preserved": True,
            "r2_archive_sha256": ARCHIVE_SHA256,
            "r2_binding_audit_sha256": R2_AUDIT_SHA256,
            "r2_manifest_sha256": MANIFEST_SHA256,
            "r2_preflight_sha256": R2_PREFLIGHT_SHA256,
            "repair_scope": "use_the_independently_audited_clean_daemon_R2_build_binding_only",
        },
        "machine": {
            "aggregate_runtime_ceiling_seconds": 7200,
            "boot_disk_gb": 30,
            "boot_disk_type": "hyperdisk-balanced",
            "creation_attempts": 1,
            "name": "nhm2-h2-p5a-r2-c4-16-20260827",
            "on_demand_planning_rate_usd_per_hour": "0.79068",
            "provider": "Google Compute Engine",
            "stop_after_evidence_capture": True,
            "total_cost_ceiling_usd": "2.00",
            "type": "c4-standard-16",
            "zone": "us-central1-a",
        },
        "program_gate": "G2H-E-S5",
        "runs": run_sequence,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_cloud_execution_proposal.v1",
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
            "creation rejection or resource substitution",
            "upload archive identity, size, count, order, path-safety, or member mismatch",
            "pre-existing frozen base-image tag in the clean daemon",
            "guard failure, registry pull, networked build, or restored-image identity mismatch",
            "remote binary hash mismatch",
            "any numerical mismatch, timeout, partial result, or nonempty stderr",
            "any authority lock nonzero or true",
            "aggregate runtime or total cost ceiling reached",
        ],
        "upload_boundary": {
            "additional_files_permitted": False,
            "archive_bytes": 236267520,
            "archive_entry_count": 39,
            "only_archive_permitted": "h2-p5a-r2-upload-v1.tar",
            "upload_archive_sha256": ARCHIVE_SHA256,
            "upload_source_path": str(ARCHIVE.relative_to(ROOT)).replace("\\", "/"),
        },
    }
    PROPOSAL.write_text(json.dumps(proposal, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    checks = {
        **predecessor_checks,
        "new_machine_identity": proposal["machine"]["name"] == "nhm2-h2-p5a-r2-c4-16-20260827",
        "machine_surface_exact": proposal["machine"]["type"] == "c4-standard-16" and proposal["machine"]["zone"] == "us-central1-a" and proposal["machine"]["boot_disk_type"] == "hyperdisk-balanced" and proposal["machine"]["boot_disk_gb"] == 30,
        "runtime_cost_bounded": proposal["machine"]["aggregate_runtime_ceiling_seconds"] == 7200 and proposal["machine"]["total_cost_ceiling_usd"] == "2.00",
        "run_sequence_exact": [item["threads"] for item in run_sequence] == [1, 4, 8, 16, 16],
        "single_archive_boundary": proposal["upload_boundary"]["additional_files_permitted"] is False and proposal["upload_boundary"]["archive_entry_count"] == 39,
        "guard_and_binary_bound": proposal["build_checkpoint"]["guard_path"] == GUARD and proposal["build_checkpoint"]["required_binary_sha256"] == BINARY_SHA256,
        "turnaround_boundary_unchanged": proposal["semantic_acceptance"]["slower_16_thread_milliseconds_max"] == 337502 and proposal["semantic_acceptance"]["projection_multiplier_from_p1024"] == "255.998046875",
        "immutable_evidence_required": proposal["evidence_policy"]["complete_fail_timeout_or_partial_is_immutable"] is True and proposal["evidence_policy"]["delete_or_overwrite_permitted"] is False,
        "authority_all_false": not any(proposal["authority"].values()),
        "awaits_separate_authorization": proposal["status"] == "FROZEN_AWAITING_SEPARATE_EXPLICIT_AUTHORIZATION",
    }
    receipt = {
        "authority_promoted": False,
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "cloud_actions": 0,
        "execution_proposal_sha256": sha256(PROPOSAL),
        "numerical_runs": 0,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_cloud_proposal_preflight.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "uploads": 0,
        "vm_created_or_started": False,
    }
    PREFLIGHT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{receipt['status']} {receipt['checks_passed']}/{receipt['checks_total']}")
    print(f"proposal_sha256={receipt['execution_proposal_sha256']}")


if __name__ == "__main__":
    main()
