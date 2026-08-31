"""Add the missing fixture and durable receipt bindings to P8F-C2."""

from __future__ import annotations

import hashlib
import json
import pathlib
import shutil
import tarfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
C2_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-cloud-preflight-v1-20260831"
C2_ARCHIVE = C2_ROOT / "h2-p8f-c2-cloud-upload-v1.tar"
OUT_ROOT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831"
STAGING = OUT_ROOT / "staging"
OUT_ARCHIVE = OUT_ROOT / "h2-p8f-c2-r1-cloud-upload-v1.tar"
MANIFEST = STAGING / "h2-p8f-c2-r1-source-manifest.v1.json"
MEMBERS = OUT_ROOT / "archive-members.v1.txt"

EXPECTED_C2 = "b55dd71dad70396d8a1eb69665f6baaf42703fa52f0a54c0d2a6b062f4054951"
EXPECTED_BINARY = "141408979c900f417409e2bf7fe0c1e0ecec7b859e0063e2eca9e4a36721bad6"
FIXED_MTIME = 1_788_134_400
ADDITIONS = (
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c1-observability-fixture.v1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/mini_boson_star_primary_c08_h2_p8f_c1_observability_fixture_v1.cpp",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/Dockerfile.primary.mini-boson-c08-h2-p8f-c2-r1-cloud-representative.v1",
    "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_cloud_run_v1.sh",
)


def sha(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> int:
    if sha(C2_ARCHIVE) != EXPECTED_C2:
        raise RuntimeError("C2 archive mismatch")
    if OUT_ROOT.exists():
        raise RuntimeError(f"C2-R1 output root already exists: {OUT_ROOT}")
    STAGING.mkdir(parents=True)
    with tarfile.open(C2_ARCHIVE, "r") as tf:
        seen: set[str] = set()
        members = []
        for member in tf.getmembers():
            name = pathlib.PurePosixPath(member.name.replace("\\", "/"))
            if name.is_absolute() or ".." in name.parts or not member.isfile() or name.as_posix() in seen:
                raise RuntimeError(f"unsafe C2 member: {member.name}")
            seen.add(name.as_posix())
            members.append(member)
        tf.extractall(STAGING, members=members, filter="data")

    added = []
    for rel in ADDITIONS:
        source = ROOT / rel
        target = STAGING / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
        added.append({"path": rel, "bytes": target.stat().st_size, "sha256": sha(target)})

    files = []
    for path in sorted(p for p in STAGING.rglob("*") if p.is_file()):
        rel = path.relative_to(STAGING).as_posix()
        files.append({"path": rel, "bytes": path.stat().st_size, "sha256": sha(path)})
    controller = STAGING / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8f_c2_r1_cloud_run_v1.sh"
    payload = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_source_manifest.v1",
        "candidate_neutral": True,
        "predecessor_archive_sha256": EXPECTED_C2,
        "repair_class": "additive_fixture_and_preexecution_evidence_binding",
        "additions": added,
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
            info.uid = info.gid = 0
            info.uname = info.gname = ""
            info.mtime = FIXED_MTIME
            with path.open("rb") as stream:
                tf.addfile(info, stream)
    MEMBERS.write_text("\n".join(p.relative_to(STAGING).as_posix() for p in all_files) + "\n", encoding="utf-8", newline="\n")
    out = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p8f_c2_r1_archive_producer.v1",
        "status": "PASS",
        "archive_bytes": OUT_ARCHIVE.stat().st_size,
        "archive_sha256": sha(OUT_ARCHIVE),
        "entries": len(all_files),
        "manifest_sha256": sha(MANIFEST),
        "controller_sha256": sha(controller),
        "candidate_evaluations": 0,
        "numerical_executions": 0,
    }
    print(json.dumps(out, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
