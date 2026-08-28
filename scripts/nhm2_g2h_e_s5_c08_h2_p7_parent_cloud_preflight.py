#!/usr/bin/env python3
"""Freeze the candidate-neutral H2-P7 parent cloud upload and preflight."""

from __future__ import annotations

import hashlib
import io
import json
import tarfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
R2_DIR = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p5a-r2-binding-repair-v1-20260827"
R2_ARCHIVE = R2_DIR / "h2-p5a-r2-upload-v1.tar"
R2_MANIFEST = R2_DIR / "h2-p5a-r2-source-manifest.json"
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p7-parent-cloud-preflight-v1-20260827"
ARCHIVE = OUT / "h2-p7-parent-upload-r1.tar"
MANIFEST = OUT / "h2-p7-parent-source-manifest.r1.json"
PREFLIGHT = OUT / "h2-p7-parent-preflight.r1.json"
R2_ARCHIVE_SHA256 = "e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87"
R2_MANIFEST_SHA256 = "2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce"
BASE_ARCHIVE_SHA256 = "4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1"
REQUIRED_BINARY_SHA256 = "e6dfc3409a83504143b12cfdf023aa42318d89579d33275fd59643cc69788f56"
ADDITIONS = [
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.hpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_v1.cpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_ledger_fixture_v1.cpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-parent-p7.r1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p7_parent_offline_build_guard_r1.sh",
]


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


def main() -> int:
    r2 = json.loads(R2_MANIFEST.read_text(encoding="utf-8"))
    with tarfile.open(R2_ARCHIVE, "r") as source:
        r2_names = source.getnames()
    checks = {
        "r2_archive_exact": sha256(R2_ARCHIVE) == R2_ARCHIVE_SHA256,
        "r2_manifest_exact": sha256(R2_MANIFEST) == R2_MANIFEST_SHA256,
        "r2_entry_count_39": len(r2_names) == 39,
        "r2_inventory_unique": len(r2_names) == len(set(r2_names)),
        "base_archive_bound": r2["pinned_base_images_archive"]["sha256"] == BASE_ARCHIVE_SHA256,
        "additions_exist": all((ROOT / name).is_file() for name in ADDITIONS),
        "additions_not_in_r2": all(name not in r2_names for name in ADDITIONS),
    }
    if not all(checks.values()):
        raise SystemExit(f"frozen predecessor mismatch: {[key for key, value in checks.items() if not value]}")

    OUT.mkdir(parents=True, exist_ok=True)
    added_entries = [
        {"bytes": (ROOT / name).stat().st_size, "path": name, "sha256": sha256(ROOT / name)}
        for name in ADDITIONS
    ]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_parent_source_manifest.r1",
        "status": "PREPARED_INERT_PARENT_EXECUTION_INPUT",
        "files": r2["files"] + added_entries,
        "pinned_base_images_archive": r2["pinned_base_images_archive"],
        "required_binary_sha256": REQUIRED_BINARY_SHA256,
        "inventory_lineage": {
            "predecessor_archive_sha256": R2_ARCHIVE_SHA256,
            "predecessor_manifest_sha256": R2_MANIFEST_SHA256,
            "predecessor_entry_count": 39,
            "additive_entries": ADDITIONS,
            "entry_count": 44,
            "predecessor_entries_preserved_byte_for_byte": True,
        },
        "runtime_binding": {
            "selector_threads": 16,
            "full_selector_invocations": 2,
            "projected_hours": 22.40694015842014,
            "external_timeout_seconds": 100800,
        },
        "authority": {
            "candidate": False, "proof": False, "geometry_state": False,
            "lane": False, "lamp": False, "physical": False,
            "propulsion": False, "transport": False,
        },
    }
    MANIFEST.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    with tarfile.open(R2_ARCHIVE, "r") as source, tarfile.open(ARCHIVE, "w", format=tarfile.GNU_FORMAT) as target:
        for name in r2_names:
            member = source.getmember(name)
            stream = source.extractfile(member)
            if stream is None:
                raise SystemExit(f"missing predecessor member: {name}")
            target.addfile(normalized(name, member.size, member.mode), stream)
        for name in ADDITIONS:
            data = (ROOT / name).read_bytes()
            mode = 0o755 if name.endswith(".sh") else 0o644
            target.addfile(normalized(name, len(data), mode), io.BytesIO(data))

    with tarfile.open(R2_ARCHIVE, "r") as predecessor, tarfile.open(ARCHIVE, "r") as produced:
        names = produced.getnames()
        checks.update({
            "inventory_exact": names == r2_names + ADDITIONS,
            "inventory_unique_44": len(names) == len(set(names)) == 44,
            "predecessor_bytes_preserved": all(member_sha256(produced, name) == member_sha256(predecessor, name) for name in r2_names),
            "added_hashes_exact": all(member_sha256(produced, item["path"]) == item["sha256"] for item in added_entries),
            "no_execution_record": not (OUT / "h2-p7-parent-execution.json").exists(),
        })
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p7_parent_preflight.r1",
        "status": "PASS" if all(checks.values()) else "FAIL",
        "checks": checks,
        "checks_passed": sum(checks.values()),
        "checks_total": len(checks),
        "archive_entry_count": 44,
        "archive_bytes": ARCHIVE.stat().st_size,
        "archive_sha256": sha256(ARCHIVE),
        "manifest_sha256": sha256(MANIFEST),
        "required_binary_sha256": REQUIRED_BINARY_SHA256,
        "cloud_actions": 0,
        "numerical_runs": 0,
        "full_selector_executed": False,
        "frozen_candidate_evaluated": False,
        "authority_promoted": False,
    }
    PREFLIGHT.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"{receipt['status']} {receipt['checks_passed']}/{receipt['checks_total']}")
    print(f"archive_sha256={receipt['archive_sha256']}")
    print(f"manifest_sha256={receipt['manifest_sha256']}")
    return 0 if receipt["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
