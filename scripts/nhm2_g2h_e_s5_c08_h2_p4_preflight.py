#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
EVIDENCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-preflight-v1-20260827"
UPLOAD = EVIDENCE / "h2-p4-upload-v1"
BUNDLE = EVIDENCE / "h2-p4-upload-v1.tar.gz"
MANIFEST = UPLOAD / "h2-p4-upload-manifest-v1.json"
BASE_ARCHIVE = UPLOAD / "h2-p4-pinned-base-images.tar"

DOCKERFILES = (
    G2H / "Dockerfile.primary.mini-boson-c08-convolution-selector-parallel-fixture.v3",
    G2H / "Dockerfile.primary.mini-boson-c08-h2-parallel-calibration.v3",
)
BASE_IMAGES = {
    "nhm2-g2h-s4-primary-fixture-builder:v2":
        "sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1",
    "nhm2-g2h-primary-proof:v2":
        "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def run(command: list[str]) -> str:
    completed = subprocess.run(command, cwd=ROOT, text=True,
                               stdout=subprocess.PIPE,
                               stderr=subprocess.STDOUT, check=False)
    if completed.returncode != 0:
        raise RuntimeError(
            f"command failed ({completed.returncode}): {' '.join(command)}\n"
            f"{completed.stdout}")
    return completed.stdout.strip()


def docker_copy_inventory() -> list[Path]:
    paths: set[Path] = set()
    pattern = re.compile(r"^COPY\s+(tools/[^\s]+)\s+", re.MULTILINE)
    for dockerfile in DOCKERFILES:
        for match in pattern.finditer(dockerfile.read_text(encoding="utf-8")):
            paths.add(ROOT / Path(match.group(1)))
    return sorted(paths, key=lambda path: path.as_posix())


def copy_payload(source: Path) -> Path:
    relative = source.relative_to(ROOT)
    target = UPLOAD / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    return target


def main() -> int:
    if EVIDENCE.exists():
        raise RuntimeError(f"immutable preflight root exists: {EVIDENCE}")
    UPLOAD.mkdir(parents=True)

    observed_images = {
        tag: run(["docker", "image", "inspect", tag, "--format", "{{.Id}}"])
        for tag in BASE_IMAGES
    }
    if observed_images != BASE_IMAGES:
        raise RuntimeError(
            f"pinned base-image identity mismatch: {observed_images}")

    sources = docker_copy_inventory()
    missing = [str(path) for path in sources if not path.is_file()]
    if missing:
        raise RuntimeError(f"Docker COPY inventory is missing: {missing}")

    payloads: list[Path] = []
    for path in (*DOCKERFILES, *sources):
        payloads.append(copy_payload(path))

    run(["docker", "image", "save", "-o", str(BASE_ARCHIVE),
         *BASE_IMAGES.keys()])
    payloads.append(BASE_ARCHIVE)

    files = {}
    for path in sorted(payloads, key=lambda item: item.relative_to(UPLOAD).as_posix()):
        relative = path.relative_to(UPLOAD).as_posix()
        files[relative] = {"bytes": path.stat().st_size,
                           "sha256": sha256(path)}
    manifest = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p4_upload_manifest.v1",
        "candidate_neutral": True,
        "vm_name": "nhm2-h2-p4-c4-16-20260827",
        "region": "us-central1",
        "machine_type": "c4-standard-16",
        "disk": "30GB pd-balanced",
        "runtime_cap_seconds": 7200,
        "cost_ceiling_usd": 2.0,
        "base_images": BASE_IMAGES,
        "dockerfiles": [path.relative_to(ROOT).as_posix() for path in DOCKERFILES],
        "files": files,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n",
                        encoding="utf-8", newline="\n")

    with tarfile.open(BUNDLE, "w:gz") as archive:
        archive.add(UPLOAD, arcname=UPLOAD.name)

    with tarfile.open(BUNDLE, "r:gz") as archive:
        members = sorted(member.name for member in archive.getmembers()
                         if member.isfile())
    expected = sorted(
        [f"{UPLOAD.name}/{relative}" for relative in files]
        + [f"{UPLOAD.name}/{MANIFEST.name}"])
    if members != expected:
        raise RuntimeError(
            f"bundle inventory mismatch: expected {expected}, observed {members}")

    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p4_local_preflight.v1",
        "verdict": "PASS",
        "upload_file_count": len(files) + 1,
        "upload_manifest_sha256": sha256(MANIFEST),
        "bundle_bytes": BUNDLE.stat().st_size,
        "bundle_sha256": sha256(BUNDLE),
        "base_images": observed_images,
        "archive_members_exact": True,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    receipt_path = EVIDENCE / "local-preflight-receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n",
                            encoding="utf-8", newline="\n")
    print(json.dumps({"receipt": str(receipt_path), **receipt}, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
