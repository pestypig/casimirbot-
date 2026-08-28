#!/usr/bin/env python3
"""Independently audit the inert H2-P5A-R2 cloud timing proposal."""

from __future__ import annotations

import hashlib
import json
import tarfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parents[1]
R2 = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-binding-repair-v1-20260827"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-cloud-proposal-v1-20260827"
ARCHIVE = R2 / "h2-p5a-r2-upload-v1.tar"
MANIFEST = R2 / "h2-p5a-r2-source-manifest.json"
R2_AUDIT = R2 / "h2-p5a-r2-independent-audit.json"
PROPOSAL = OUT / "h2-p5a-r2-cloud-execution-proposal.json"
PREFLIGHT = OUT / "h2-p5a-r2-cloud-proposal-preflight.json"
AUDIT = OUT / "h2-p5a-r2-cloud-proposal-independent-audit.json"
ARCHIVE_SHA256 = "e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87"
MANIFEST_SHA256 = "2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce"
R2_AUDIT_SHA256 = "d01ec55934a4be929952799c2a91fed2b423c278ba2e92e967ce42a5097c852c"
BINARY_SHA256 = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def member_hash(archive: tarfile.TarFile, name: str) -> str:
    stream = archive.extractfile(archive.getmember(name))
    if stream is None:
        return ""
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(block)
    return digest.hexdigest()


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    r2_audit = json.loads(R2_AUDIT.read_text(encoding="utf-8"))
    expected = (
        [item["path"] for item in manifest["files"][:-3]]
        + [manifest["pinned_base_images_archive"]["path"]]
        + [item["path"] for item in manifest["files"][-3:]]
    )
    checks: dict[str, bool] = {
        "r2_archive_exact": sha256(ARCHIVE) == ARCHIVE_SHA256,
        "r2_manifest_exact": sha256(MANIFEST) == MANIFEST_SHA256,
        "r2_audit_exact_and_pass": sha256(R2_AUDIT) == R2_AUDIT_SHA256 and r2_audit["status"] == "PASS" and r2_audit["checks_passed"] == 28,
        "producer_preflight_pass": preflight["status"] == "PASS" and preflight["checks_passed"] == preflight["checks_total"],
        "proposal_hash_bound": sha256(PROPOSAL) == preflight["execution_proposal_sha256"],
        "program_gate_exact": proposal["program_gate"] == "G2H-E-S5",
        "new_vm_exact": proposal["machine"]["name"] == "nhm2-h2-p5a-r2-c4-16-20260827",
        "one_creation_attempt": proposal["machine"]["creation_attempts"] == 1,
        "machine_exact": proposal["machine"]["type"] == "c4-standard-16" and proposal["machine"]["zone"] == "us-central1-a" and proposal["machine"]["boot_disk_type"] == "hyperdisk-balanced" and proposal["machine"]["boot_disk_gb"] == 30,
        "cost_and_runtime_exact": proposal["machine"]["aggregate_runtime_ceiling_seconds"] == 7200 and proposal["machine"]["total_cost_ceiling_usd"] == "2.00",
        "run_sequence_exact": [item["threads"] for item in proposal["runs"]] == [1, 4, 8, 16, 16] and proposal["runs"][-1]["repeat_of"] == 4,
        "run_timeout_exact": proposal["external_timeout_seconds_per_run"] == 3600,
        "offline_runtime_command": "--network=none" in proposal["command_template"] and "--cpus=16" in proposal["command_template"] and "--memory=12g" in proposal["command_template"],
        "build_guard_bound": "h2_p5a_r2_offline_build_guard_v1.sh" in proposal["build_checkpoint"]["command"],
        "binary_bound": proposal["build_checkpoint"]["required_binary_sha256"] == BINARY_SHA256,
        "turnaround_acceptance_exact": proposal["semantic_acceptance"]["slower_16_thread_milliseconds_max"] == 337502 and proposal["semantic_acceptance"]["two_selector_projection_hours_max"] == 24,
        "semantic_replay_required": proposal["semantic_acceptance"]["semantic_sha256_equal_across_all_runs"] is True,
        "immutable_evidence": proposal["evidence_policy"]["complete_fail_timeout_or_partial_is_immutable"] is True and proposal["evidence_policy"]["delete_or_overwrite_permitted"] is False and proposal["evidence_policy"]["alternate_output_root_permitted"] is False,
        "awaits_separate_authorization": proposal["status"] == "FROZEN_AWAITING_SEPARATE_EXPLICIT_AUTHORIZATION",
        "authority_all_false": not any(proposal["authority"].values()),
        "zero_cloud_action": preflight["cloud_actions"] == 0 and preflight["uploads"] == 0 and preflight["vm_created_or_started"] is False,
        "zero_numerical_runs": preflight["numerical_runs"] == 0,
    }
    with tarfile.open(ARCHIVE, "r") as archive:
        names = archive.getnames()
        checks["archive_inventory_exact"] = names == expected and len(names) == len(set(names)) == 39
        checks["archive_paths_safe"] = all(not PurePosixPath(name).is_absolute() and ".." not in PurePosixPath(name).parts for name in names)
        file_map = {item["path"]: item for item in manifest["files"]}
        checks["all_source_members_exact"] = all(archive.getmember(name).size == item["bytes"] and member_hash(archive, name) == item["sha256"] for name, item in file_map.items())
        base = manifest["pinned_base_images_archive"]
        checks["base_archive_exact"] = archive.getmember(base["path"]).size == base["bytes"] and member_hash(archive, base["path"]) == base["sha256"]
    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "authority_promoted": False,
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "cloud_actions": 0,
        "execution_proposal_sha256": sha256(PROPOSAL),
        "failed": failed,
        "numerical_runs": 0,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_cloud_proposal_independent_audit.v1",
        "status": "PASS" if not failed else "FAIL",
        "uploads": 0,
        "vm_created_or_started": False,
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    print(f"proposal_sha256={payload['execution_proposal_sha256']}")
    if failed:
        print("failed=" + ",".join(failed))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
