#!/usr/bin/env python3
"""Freeze the candidate-neutral H2-P5A-R2 clean-daemon binding repair."""

from __future__ import annotations

import hashlib
import io
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R1_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r1-upload-repair-v1-20260827"
R1_ARCHIVE = R1_DIR / "h2-p5a-r1-upload-v1.tar"
R1_MANIFEST = R1_DIR / "h2-p5a-r1-source-manifest.json"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-binding-repair-v1-20260827"
ARCHIVE = OUT / "h2-p5a-r2-upload-v1.tar"
MANIFEST = OUT / "h2-p5a-r2-source-manifest.json"
PREFLIGHT = OUT / "h2-p5a-r2-preflight.json"
DOCKERFILE_REL = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p5a-width-calibration.r2"
GUARD_REL = "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p5a_r2_offline_build_guard_v1.sh"
R1_ARCHIVE_SHA256 = "a8b660522087c820aa23f7e11737aa55b944b7f6a048f867cabdeb4d8ccb6422"
R1_MANIFEST_SHA256 = "dc33dec0fac549e4f72591b23d44b3355f6aee9b759fbbe1ee7086875709de91"
BASE_ARCHIVE_SHA256 = "4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1"
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


def normalized(name: str, size: int, mode: int = 0o644) -> tarfile.TarInfo:
    info = tarfile.TarInfo(name)
    info.size = size
    info.mode = mode
    info.mtime = info.uid = info.gid = 0
    info.uname = info.gname = ""
    return info


def main() -> None:
    r1 = json.loads(R1_MANIFEST.read_text(encoding="utf-8"))
    r1_file_names = [item["path"] for item in r1["files"]]
    r1_dockerfile = r1["inventory_lineage"]["additive_entries"][0]
    r1_names = (
        [name for name in r1_file_names if name != r1_dockerfile]
        + [r1["pinned_base_images_archive"]["path"]]
        + [r1_dockerfile]
    )
    additions = [DOCKERFILE_REL, GUARD_REL]
    checks = {
        "r1_archive_exact": sha256(R1_ARCHIVE) == R1_ARCHIVE_SHA256,
        "r1_manifest_exact": sha256(R1_MANIFEST) == R1_MANIFEST_SHA256,
        "r1_entry_count_37": len(r1_names) == 37,
        "new_files_exist": all((ROOT / name).is_file() for name in additions),
        "base_archive_bound": r1["pinned_base_images_archive"]["sha256"] == BASE_ARCHIVE_SHA256,
    }
    with tarfile.open(R1_ARCHIVE, "r") as source:
        checks["r1_inventory_exact"] = source.getnames() == r1_names
        checks["r1_member_hashes_exact"] = all(
            source.getmember(item["path"]).size == item["bytes"]
            and member_sha256(source, item["path"]) == item["sha256"]
            for item in r1["files"]
        )
    if not all(checks.values()):
        raise SystemExit(f"frozen R1 mismatch: {[k for k, v in checks.items() if not v]}")

    OUT.mkdir(parents=True, exist_ok=True)
    added_entries = [
        {"bytes": (ROOT / name).stat().st_size, "path": name, "sha256": sha256(ROOT / name)}
        for name in additions
    ]
    payload = {
        "files": r1["files"] + added_entries,
        "inventory_lineage": {
            "additive_entries": additions,
            "r1_archive_entry_count": 37,
            "r1_archive_sha256": R1_ARCHIVE_SHA256,
            "r1_manifest_sha256": R1_MANIFEST_SHA256,
            "r2_archive_entry_count": 39,
            "unchanged_r1_entry_order_and_bytes": True,
        },
        "pinned_base_images_archive": r1["pinned_base_images_archive"],
        "required_binary_sha256": REQUIRED_BINARY_SHA256,
        "restored_identity_acceptance": {
            "builder": [
                "sha256:9e94d19f9014938b510e95c776778d164cce120777adfc2d495c1812de5221a1",
                "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c",
            ],
            "runtime": [
                "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab",
                "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e",
            ],
        },
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_source_manifest.v1",
        "status": "PREPARED_INERT_BINDING_REPAIR",
    }
    MANIFEST.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(R1_ARCHIVE, "r") as source, tarfile.open(ARCHIVE, "w", format=tarfile.GNU_FORMAT) as target:
        for name in r1_names:
            member = source.getmember(name)
            stream = source.extractfile(member)
            if stream is None:
                raise SystemExit(f"missing R1 member: {name}")
            target.addfile(normalized(name, member.size, member.mode), stream)
        for name in additions:
            data = (ROOT / name).read_bytes()
            target.addfile(normalized(name, len(data), 0o755 if name == GUARD_REL else 0o644), io.BytesIO(data))

    with tarfile.open(ARCHIVE, "r") as archive, tarfile.open(R1_ARCHIVE, "r") as r1_archive:
        actual_names = archive.getnames()
        checks.update({
            "r2_inventory_exact": actual_names == r1_names + additions,
            "r2_inventory_unique": len(actual_names) == len(set(actual_names)) == 39,
            "r1_bytes_preserved": all(
                member_sha256(archive, name) == member_sha256(r1_archive, name)
                for name in r1_names
            ),
            "no_execution_proposal_created": not (OUT / "h2-p5a-r2-execution-proposal.json").exists(),
        })
    receipt = {
        "archive_entry_count": 39,
        "archive_sha256": sha256(ARCHIVE),
        "authority_promoted": False,
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "cloud_actions": 0,
        "manifest_sha256": sha256(MANIFEST),
        "numerical_runs": 0,
        "schema": "nhm2.g2h_e_s5.c08_h2_p5a_r2_preflight.v1",
        "status": "PASS" if all(checks.values()) else "FAIL",
    }
    PREFLIGHT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{receipt['status']} {receipt['checks_passed']}/{receipt['checks_total']}")
    print(f"manifest_sha256={receipt['manifest_sha256']}")
    print(f"archive_sha256={receipt['archive_sha256']}")


if __name__ == "__main__":
    main()
