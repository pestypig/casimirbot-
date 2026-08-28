#!/usr/bin/env python3
"""Independent archive/build audit for the inert H2-P5A-R1 repair."""

from __future__ import annotations

import hashlib
import json
import os
import subprocess
import tarfile
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OLD_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-preflight-v1-20260827"
OUT_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r1-upload-repair-v1-20260827"
OLD_MANIFEST = OLD_DIR / "h2-p5a-source-manifest.json"
OLD_ARCHIVE = OLD_DIR / "h2-p5a-upload-v1.tar"
MANIFEST = OUT_DIR / "h2-p5a-r1-source-manifest.json"
ARCHIVE = OUT_DIR / "h2-p5a-r1-upload-v1.tar"
PROPOSAL = OUT_DIR / "h2-p5a-r1-execution-proposal.json"
PREFLIGHT = OUT_DIR / "h2-p5a-r1-preflight.json"
AUDIT = OUT_DIR / "h2-p5a-r1-audit-v2.json"
DOCKERFILE_REL = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.v1"
BASE_REL = "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827/h2-p4-upload-v1/h2-p4-pinned-base-images.tar"
IMAGE = "nhm2-g2h-e-s5-h2-p5a-r1-upload-audit:v1"
REQUIRED_BINARY = "/usr/local/bin/mini-boson-star-primary-c08-h2-p5a-width-calibration-v1"
REQUIRED_BINARY_SHA256 = "aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def member_sha256(archive: tarfile.TarFile, name: str) -> str:
    stream = archive.extractfile(archive.getmember(name))
    if stream is None:
        return ""
    digest = hashlib.sha256()
    for block in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(block)
    return digest.hexdigest()


def run(args: list[str], cwd: Path | None = None, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd or ROOT, env=env, text=True, capture_output=True, check=False)


def main() -> None:
    old_manifest = json.loads(OLD_MANIFEST.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    proposal = json.loads(PROPOSAL.read_text(encoding="utf-8"))
    preflight = json.loads(PREFLIGHT.read_text(encoding="utf-8"))
    old_names = [item["path"] for item in old_manifest["files"]] + [old_manifest["pinned_base_images_archive"]["path"]]
    expected_names = old_names + [DOCKERFILE_REL]
    file_map = {item["path"]: item for item in manifest["files"]}
    checks: dict[str, bool] = {}

    with tarfile.open(OLD_ARCHIVE, "r") as old_tar, tarfile.open(ARCHIVE, "r") as repaired_tar:
        repaired_names = repaired_tar.getnames()
        checks["old_archive_inventory_preserved"] = old_tar.getnames() == old_names
        checks["repaired_inventory_exact"] = repaired_names == expected_names
        checks["repaired_inventory_unique"] = len(repaired_names) == len(set(repaired_names)) == 37
        checks["only_dockerfile_additive"] = repaired_names[:-1] == old_names and repaired_names[-1] == DOCKERFILE_REL
        checks["old_member_bytes_identical"] = all(
            old_tar.getmember(name).size == repaired_tar.getmember(name).size
            and member_sha256(old_tar, name) == member_sha256(repaired_tar, name)
            for name in old_names
        )
        checks["manifest_covers_all_build_files"] = set(file_map) == set(item["path"] for item in old_manifest["files"]) | {DOCKERFILE_REL}
        checks["manifest_member_hashes_exact"] = all(
            repaired_tar.getmember(path).size == item["bytes"]
            and member_sha256(repaired_tar, path) == item["sha256"]
            for path, item in file_map.items()
        )
        base = manifest["pinned_base_images_archive"]
        checks["base_archive_hash_exact"] = member_sha256(repaired_tar, BASE_REL) == base["sha256"]

    checks["preflight_pass"] = preflight["status"] == "PASS" and preflight["checks_passed"] == preflight["checks_total"]
    checks["manifest_hash_bound"] = sha256(MANIFEST) == preflight["source_manifest_sha256"] == proposal["container"]["source_manifest_sha256"]
    checks["archive_hash_bound"] = sha256(ARCHIVE) == preflight["archive_sha256"] == proposal["container"]["upload_archive_sha256"]
    checks["proposal_hash_bound"] = sha256(PROPOSAL) == preflight["execution_proposal_sha256"]
    checks["dockerfile_hash_bound"] = file_map[DOCKERFILE_REL]["sha256"] == proposal["container"]["dockerfile_sha256"]
    checks["binary_hash_frozen"] = proposal["container"]["required_remote_binary_sha256"] == REQUIRED_BINARY_SHA256
    checks["new_vm_identity"] = proposal["machine"]["name"] == "nhm2-h2-p5a-r1-c4-16-20260827"
    checks["machine_surface_unchanged"] = proposal["machine"]["type"] == "c4-standard-16" and proposal["machine"]["zone"] == "us-central1-a" and proposal["machine"]["boot_disk_type"] == "hyperdisk-balanced" and proposal["machine"]["boot_disk_gb"] == 30
    checks["runtime_and_cost_bounded"] = proposal["machine"]["aggregate_runtime_ceiling_seconds"] == 7200 and proposal["machine"]["total_cost_ceiling_usd"] == "2.00"
    checks["run_sequence_unchanged"] = [item["threads"] for item in proposal["runs"]] == [1, 4, 8, 16, 16]
    checks["turnaround_boundary_unchanged"] = proposal["semantic_acceptance"]["slower_16_thread_milliseconds_max"] == 337502 and proposal["semantic_acceptance"]["projection_multiplier_from_p1024"] == "255.998046875"
    checks["awaits_separate_authorization"] = proposal["status"] == "FROZEN_AWAITING_SEPARATE_EXPLICIT_AUTHORIZATION"
    checks["upload_boundary_single_archive"] = proposal["upload_boundary"]["additional_files_permitted"] is False and proposal["upload_boundary"]["archive_entry_count"] == 37
    checks["authority_all_false"] = not any(proposal["authority"].values())
    checks["zero_execution"] = preflight["numerical_runs_executed"] == 0 and preflight["uploads_performed"] == 0 and preflight["vm_created_or_started"] is False

    load_result: subprocess.CompletedProcess[str] | None = None
    build_result: subprocess.CompletedProcess[str] | None = None
    binary_result: subprocess.CompletedProcess[str] | None = None
    with tempfile.TemporaryDirectory(prefix="nhm2-h2-p5a-r1-") as temp_name:
        context = Path(temp_name)
        with tarfile.open(ARCHIVE, "r") as archive:
            for member in archive.getmembers():
                if member.name not in expected_names or member.isdir() or ".." in Path(member.name).parts or Path(member.name).is_absolute():
                    raise SystemExit(f"unsafe or unexpected archive member: {member.name}")
                destination = context / member.name
                destination.parent.mkdir(parents=True, exist_ok=True)
                stream = archive.extractfile(member)
                if stream is None:
                    raise SystemExit(f"missing member stream: {member.name}")
                with destination.open("wb") as output:
                    for block in iter(lambda: stream.read(1024 * 1024), b""):
                        output.write(block)
        load_result = run(["docker", "load", "-i", str(context / BASE_REL)], cwd=context)
        build_env = dict(os.environ)
        build_env["DOCKER_BUILDKIT"] = "0"
        build_result = run(
            ["docker", "build", "--network=none", "-f", DOCKERFILE_REL, "-t", IMAGE, "."],
            cwd=context,
            env=build_env,
        )
        if build_result.returncode == 0:
            binary_result = run(
                ["docker", "run", "--rm", "--entrypoint", "/usr/bin/sha256sum", IMAGE, REQUIRED_BINARY]
            )

    (OUT_DIR / "h2-p5a-r1-docker-load-v2.stdout.log").write_text(load_result.stdout if load_result else "", encoding="utf-8")
    (OUT_DIR / "h2-p5a-r1-docker-load-v2.stderr.log").write_text(load_result.stderr if load_result else "", encoding="utf-8")
    (OUT_DIR / "h2-p5a-r1-docker-build-v2.stdout.log").write_text(build_result.stdout if build_result else "", encoding="utf-8")
    (OUT_DIR / "h2-p5a-r1-docker-build-v2.stderr.log").write_text(build_result.stderr if build_result else "", encoding="utf-8")
    (OUT_DIR / "h2-p5a-r1-binary-sha256-v2.log").write_text(binary_result.stdout if binary_result else "", encoding="utf-8")
    checks["pinned_images_load"] = load_result is not None and load_result.returncode == 0
    checks["offline_build_pass"] = build_result is not None and build_result.returncode == 0
    checks["offline_build_stderr_is_known_deprecation_only"] = (
        build_result is not None
        and "DEPRECATED: The legacy builder is deprecated" in build_result.stderr
        and "error" not in build_result.stderr.lower()
    )
    checks["binary_hash_reproduced"] = binary_result is not None and binary_result.returncode == 0 and binary_result.stderr == "" and binary_result.stdout.split()[0] == REQUIRED_BINARY_SHA256
    binary_args = binary_result.args if binary_result is not None and isinstance(binary_result.args, list) else []
    checks["no_numerical_entrypoint_invoked"] = (
        binary_result is not None
        and "--entrypoint" in binary_args
        and binary_args[binary_args.index("--entrypoint") + 1] == "/usr/bin/sha256sum"
        and binary_args[-1] == REQUIRED_BINARY
    )

    failed = [name for name, passed in checks.items() if not passed]
    payload = {
        "archive_sha256": sha256(ARCHIVE),
        "authority_promoted": False,
        "binary_sha256": binary_result.stdout.split()[0] if binary_result and binary_result.stdout.split() else None,
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "execution_proposal_sha256": sha256(PROPOSAL),
        "failed": failed,
        "numerical_runs_executed": 0,
        "preserved_v1_failure_sha256": "388daa6836cb3c080eac11cd970f3a8eb42c71ee9a31617c1e8bf5a7f479dd74",
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r1_inventory_repair_audit.v2",
        "source_manifest_sha256": sha256(MANIFEST),
        "status": "PASS" if not failed else "FAIL",
        "uploads_performed": 0,
        "vm_created_or_started": False,
    }
    AUDIT.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{payload['status']} {payload['checks_passed']}/{payload['checks_total']}")
    if failed:
        print("failed=" + ",".join(failed))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
