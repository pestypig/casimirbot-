#!/usr/bin/env python3
"""Materialize the frozen P8P-R3 browser-ingress chunks from the immutable base."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8f-c2-r1-cloud-preflight-v1-20260831/h2-p8f-c2-r1-cloud-upload-v1.tar"
OVERLAY = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-cloud-preflight-v1-20260901/h2-p8p-overlay-upload-v1.tar"
MANIFEST = ROOT / "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/h2_p8p_r3_base_chunk_manifest_v1.json"
DEFAULT_OUTPUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r3-browser-ingress-v1-20260901/chunks"
OVERLAY_BYTES = 134656
OVERLAY_SHA256 = "4ab0921f2bc7d6bfe85b8b45e294c2058b2f29644fe072e48e2064c7be772b8e"


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def file_digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(block)
    return hasher.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    assert manifest["schema"] == "nhm2.g2h_e_s5.c08_h2_p8p_r3_base_chunk_manifest.v1"
    assert manifest["candidate_neutral"] is True
    assert SOURCE.is_file() and not SOURCE.is_symlink()
    assert SOURCE.stat().st_size == manifest["source"]["bytes"]
    assert file_digest(SOURCE) == manifest["source"]["sha256"]
    assert OVERLAY.is_file() and not OVERLAY.is_symlink()
    assert OVERLAY.stat().st_size == OVERLAY_BYTES
    assert file_digest(OVERLAY) == OVERLAY_SHA256

    output = args.output.resolve()
    chunks = manifest["chunks"]
    if args.verify_only:
        assert output.is_dir()
        for entry in chunks:
            target = output / entry["name"]
            assert target.is_file() and not target.is_symlink()
            assert target.stat().st_size == entry["bytes"]
            assert file_digest(target) == entry["sha256"]
        staged_overlay = output / OVERLAY.name
        assert staged_overlay.is_file() and not staged_overlay.is_symlink()
        assert staged_overlay.stat().st_size == OVERLAY_BYTES
        assert file_digest(staged_overlay) == OVERLAY_SHA256
        assert len(tuple(output.iterdir())) == len(chunks) + 1
        print(f"P8P_R3_INGRESS_VERIFIED {len(chunks) + 1}/{len(chunks) + 1}")
        return 0

    assert not output.exists(), f"output already exists: {output}"
    output.mkdir(parents=True, exist_ok=False)
    with SOURCE.open("rb") as source:
        for entry in chunks:
            raw = source.read(entry["bytes"])
            assert len(raw) == entry["bytes"]
            assert digest(raw) == entry["sha256"]
            target = output / entry["name"]
            with target.open("xb") as handle:
                handle.write(raw)
            assert file_digest(target) == entry["sha256"]
        assert source.read(1) == b""
    staged_overlay = output / OVERLAY.name
    with OVERLAY.open("rb") as source, staged_overlay.open("xb") as target:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            target.write(block)
    assert staged_overlay.stat().st_size == OVERLAY_BYTES
    assert file_digest(staged_overlay) == OVERLAY_SHA256
    assert len(tuple(output.iterdir())) == len(chunks) + 1
    print(f"P8P_R3_INGRESS_MATERIALIZED {len(chunks) + 1}/{len(chunks) + 1}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
