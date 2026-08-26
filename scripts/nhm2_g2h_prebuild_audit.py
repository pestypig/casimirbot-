#!/usr/bin/env python3
"""Audit G2H v1 fixture-harness inputs without building or running them."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-prebuild-manifest.v1.json"
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def composite(paths: list[Path], relative_to: Path) -> str:
    rows = [f"{sha256(path)} {path.relative_to(relative_to).as_posix()}" for path in paths]
    return hashlib.sha256(("\n".join(rows) + "\n").encode()).hexdigest()


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    primary = manifest["primary"]
    independent = manifest["independent"]
    deb_root = ROOT / primary["offline_deb_cache"]
    debs = sorted(deb_root.glob("*.deb"), key=lambda path: path.name)
    rustc = Path.home() / ".cargo" / "bin" / "rustc.exe"
    sysroot_text = __import__("subprocess").check_output(
        [str(rustc), "--print", "sysroot"], text=True
    ).strip()
    target_root = Path(sysroot_text) / "lib" / "rustlib" / independent["target"]
    rust_lld = Path(sysroot_text) / "lib" / "rustlib" / "x86_64-pc-windows-msvc" / "bin" / "rust-lld.exe"
    target_files = sorted(
        (path for path in target_root.rglob("*") if path.is_file()),
        key=lambda path: path.as_posix(),
    )
    authority = manifest["authority"]
    roots = [ROOT / path for path in manifest["candidate_roots"]]

    checks = {
        "contract_digest": sha256(CONTRACT) == manifest["contract_sha256"],
        "primary_source_frozen": sha256(ROOT / primary["source"]) == primary["source_sha256"]
        and (ROOT / primary["source"]).stat().st_size == primary["source_bytes"],
        "primary_recipe_frozen": sha256(ROOT / primary["dockerfile"]) == primary["dockerfile_sha256"],
        "primary_dependencies_frozen": len(debs) == primary["offline_deb_count"]
        and sum(path.stat().st_size for path in debs) == primary["offline_deb_bytes"]
        and composite(debs, deb_root) == primary["offline_deb_index_composite_sha256"],
        "independent_source_frozen": sha256(ROOT / independent["source"]) == independent["source_sha256"]
        and (ROOT / independent["source"]).stat().st_size == independent["source_bytes"],
        "independent_recipe_frozen": sha256(ROOT / independent["dockerfile"]) == independent["dockerfile_sha256"],
        "rustc_frozen": sha256(rustc) == independent["rustc_executable_sha256"],
        "rust_lld_frozen": sha256(rust_lld) == independent["rust_lld_executable_sha256"],
        "rust_target_frozen": len(target_files) == independent["target_component_files"]
        and composite(target_files, target_root) == independent["target_component_composite_sha256"],
        "runtime_bases_disjoint": set(primary["base_rootfs_layers"]).isdisjoint(independent["runtime_base_layers"]),
        "candidate_paths_hard_blocked": "refuse_candidate_execution" in (ROOT / primary["source"]).read_text()
        and "candidate execution is unavailable in G2H" in (ROOT / independent["source"]).read_text(),
        "candidate_roots_absent": all(not path.exists() for path in roots),
        "no_executable_bound_before_build": primary["executable_sha256"] is None
        and independent["executable_sha256"] is None,
        "zero_authority": authority["candidate_evaluations"] == 0
        and all(value is False for key, value in authority.items() if key != "candidate_evaluations"),
    }
    print(json.dumps({"schema": "nhm2.g2h.prebuild_audit.v1", "checks": checks}, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
