"""Produce the candidate-neutral P8F-C2 archive-inventory repair."""

from __future__ import annotations

import hashlib
import json
import pathlib
import shutil
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
G2H = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h"
C1_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c1-cloud-preflight-v1-20260831"
C1_ARCHIVE = C1_ROOT / "h2-p8f-c1-cloud-upload-v2.tar"
OUT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-cloud-preflight-v1-20260831"
STAGING = OUT_ROOT / "staging"
OUT_ARCHIVE = OUT_ROOT / "h2-p8f-c2-cloud-upload-v1.tar"
MEMBERS = OUT_ROOT / "archive-members.v1.txt"
MANIFEST = STAGING / "h2-p8f-c2-source-manifest.v1.json"

EXPECTED_C1 = "c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640"
EXPECTED_BINARY = "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6"
EXPECTED_BASE = "4645ef9f0028a4ae58601a73d8d7cf7cb8f2316578a318ce6ce2257b103624f1"
FIXED_MTIME = 1_788_134_400  # 2026-08-31T00:00:00Z

REPLACEMENTS = (
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.cpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_convolution_jet_v1.hpp",
)
ADDITIONS = (
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c2-cloud-representative.v1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_cloud_run_v1.sh",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def safe_members(tf: tarfile.TarFile) -> list[tarfile.TarInfo]:
    members = tf.getmembers()
    names: set[str] = set()
    for member in members:
        pure = pathlib.PurePosixPath(member.name.replace("\\", "/"))
        if pure.is_absolute() or ".." in pure.parts or not member.isfile():
            raise RuntimeError(f"unsafe C1 member: {member.name}")
        name = pure.as_posix()
        if name in names:
            raise RuntimeError(f"duplicate C1 member: {name}")
        names.add(name)
    return members


def main() -> int:
    if sha(C1_ARCHIVE) != EXPECTED_C1:
        raise RuntimeError("C1 archive identity mismatch")
    if OUT_ROOT.exists():
        raise RuntimeError(f"C2 output root already exists: {OUT_ROOT}")
    STAGING.mkdir(parents=True)

    with tarfile.open(C1_ARCHIVE, "r") as tf:
        members = safe_members(tf)
        tf.extractall(STAGING, members=members, filter="data")

    old: dict[str, str] = {}
    new: dict[str, str] = {}
    for rel in REPLACEMENTS:
        target = STAGING / rel
        old[rel] = sha(target)
        source = ROOT / rel
        shutil.copyfile(source, target)
        new[rel] = sha(target)
    for rel in ADDITIONS:
        shutil.copyfile(ROOT / rel, STAGING / rel)

    files = []
    for path in sorted(p for p in STAGING.rglob("*") if p.is_file()):
        rel = path.relative_to(STAGING).as_posix()
        files.append({"path": rel, "bytes": path.stat().st_size, "sha256": sha(path)})

    controller = STAGING / ADDITIONS[1]
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_source_manifest.v1",
        "candidate_neutral": True,
        "predecessor_archive_sha256": EXPECTED_C1,
        "repair_class": "two_member_archive_inventory_replacement",
        "replacements": [
            {"path": rel, "predecessor_sha256": old[rel], "successor_sha256": new[rel]}
            for rel in REPLACEMENTS
        ],
        "pinned_base_archive_sha256": EXPECTED_BASE,
        "required_binary_sha256": EXPECTED_BINARY,
        "cloud_controller_sha256": sha(controller),
        "files": files,
    }
    MANIFEST.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")

    all_files = sorted(p for p in STAGING.rglob("*") if p.is_file())
    with tarfile.open(OUT_ARCHIVE, "w", format=tarfile.PAX_FORMAT) as tf:
        for path in all_files:
            rel = path.relative_to(STAGING).as_posix()
            info = tf.gettarinfo(str(path), arcname=rel)
            info.uid = 0
            info.gid = 0
            info.uname = ""
            info.gname = ""
            info.mtime = FIXED_MTIME
            with path.open("rb") as stream:
                tf.addfile(info, stream)
    MEMBERS.write_text("\n".join(p.relative_to(STAGING).as_posix() for p in all_files) + "\n", encoding="utf-8", newline="\n")

    result = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_archive_producer.v1",
        "status": "PASS",
        "archive": str(OUT_ARCHIVE.relative_to(ROOT)).replace("\\", "/"),
        "archive_bytes": OUT_ARCHIVE.stat().st_size,
        "archive_sha256": sha(OUT_ARCHIVE),
        "entries": len(all_files),
        "manifest_sha256": sha(MANIFEST),
        "controller_sha256": sha(controller),
        "candidate_evaluations": 0,
        "numerical_executions": 0,
    }
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
