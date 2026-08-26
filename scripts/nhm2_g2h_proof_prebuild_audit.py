#!/usr/bin/env python3
"""Audit frozen G2H proof sources and toolchains before final image builds."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-proof-prebuild.v1.json"
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def composite(paths: list[Path], relative_to: Path) -> str:
    rows = [f"{sha256(path)} {path.relative_to(relative_to).as_posix()}" for path in paths]
    return hashlib.sha256(("\n".join(rows) + "\n").encode()).hexdigest()


def image_id(name: str) -> str | None:
    result = subprocess.run(
        ["docker", "image", "inspect", name, "--format", "{{.Id}}"],
        text=True,
        capture_output=True,
        check=False,
    )
    return result.stdout.strip() if result.returncode == 0 else None


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    primary = manifest["primary"]
    independent = manifest["independent"]
    source_root = ROOT / manifest["source_pdf_root"]
    source_pdfs = sorted(source_root.glob("*.pdf"), key=lambda path: path.name)
    rustc = Path.home() / ".cargo/bin/rustc.exe"
    rust_sysroot = Path(
        subprocess.check_output([str(rustc), "--print", "sysroot"], text=True).strip()
    )
    rust_lld = rust_sysroot / "lib/rustlib/x86_64-pc-windows-msvc/bin/rust-lld.exe"
    target_root = rust_sysroot / "lib/rustlib" / independent["target"]
    target_files = sorted(
        (path for path in target_root.rglob("*") if path.is_file()),
        key=lambda path: path.as_posix(),
    )
    primary_text = (ROOT / primary["proof_source"]).read_text(encoding="utf-8")
    independent_text = (ROOT / independent["proof_source"]).read_text(encoding="utf-8")
    primary_surface = (ROOT / primary["surface_source"]).read_text(encoding="utf-8")
    independent_surface = (ROOT / independent["surface_source"]).read_text(encoding="utf-8")
    roots = [ROOT / path for path in manifest["candidate_roots"]]
    authority = {
        key: value
        for key, value in manifest.items()
        if key
        in {
            "candidate_execution_authorized",
            "candidate_admitted",
            "classical_proof_established",
            "geometry_state_accepted",
            "lane_execution_authorized",
            "diagnostic_lamp",
            "physical_viability",
            "propulsion_authority",
            "transport_authority",
        }
    }

    checks = {
        "contract_digest": sha256(CONTRACT) == manifest["contract_sha256"],
        "seven_sources_exact": len(source_pdfs) == manifest["source_pdf_count"]
        and sum(path.stat().st_size for path in source_pdfs) == manifest["source_pdf_bytes"]
        and composite(source_pdfs, source_root)
        == manifest["source_pdf_index_composite_sha256"],
        "primary_sources_frozen": all(
            sha256(ROOT / primary[path_key]) == primary[hash_key]
            and (ROOT / primary[path_key]).stat().st_size == primary[bytes_key]
            for path_key, hash_key, bytes_key in (
                ("proof_source", "proof_source_sha256", "proof_source_bytes"),
                ("surface_source", "surface_source_sha256", "surface_source_bytes"),
                ("dockerfile", "dockerfile_sha256", "dockerfile_bytes"),
            )
        ),
        "independent_sources_frozen": all(
            sha256(ROOT / independent[path_key]) == independent[hash_key]
            and (ROOT / independent[path_key]).stat().st_size == independent[bytes_key]
            for path_key, hash_key, bytes_key in (
                ("proof_source", "proof_source_sha256", "proof_source_bytes"),
                ("surface_source", "surface_source_sha256", "surface_source_bytes"),
                ("dockerfile", "dockerfile_sha256", "dockerfile_bytes"),
            )
        ),
        "primary_base_image_frozen": image_id(primary["base_image"])
        == primary["base_image_id"],
        "rust_compiler_frozen": sha256(rustc) == independent["rustc_executable_sha256"]
        and sha256(rust_lld) == independent["rust_lld_executable_sha256"],
        "rust_target_frozen": len(target_files) == independent["target_component_files"]
        and composite(target_files, target_root)
        == independent["target_component_composite_sha256"],
        "both_token_guards_frozen": manifest["execution_token_sha256"] in primary_text
        and manifest["execution_token_sha256"] in independent_text,
        "both_exact_contract_guards_frozen": manifest["contract_sha256"] in primary_text
        and manifest["contract_sha256"] in independent_text,
        "fixed_duty_inventories": all(
            primary_text.count(f'"G2G-C{index:02d}"') == 1
            and independent_text.count(f'"G2G-C{index:02d}"') == 1
            for index in range(1, 13)
        )
        and all(
            primary_text.count(f'"G2G-Q{index:02d}"') == 1
            and independent_text.count(f'"G2G-Q{index:02d}"') == 1
            for index in range(1, 7)
        ),
        "surface_algorithms_independent": "fmpq_t" in primary_surface
        and "Rational" in independent_surface
        and "fmpq" not in independent_surface
        and sha256(ROOT / primary["surface_source"])
        != sha256(ROOT / independent["surface_source"]),
        "independent_forbidden_imports_absent": all(
            marker not in independent_text.lower()
            for marker in ("gmp", "mpfr", "flint", "arb_sys", "libm", "extern \"c\"")
        ),
        "source_lineages_disjoint": sha256(ROOT / primary["proof_source"])
        != sha256(ROOT / independent["proof_source"]),
        "final_images_absent_before_build": image_id("nhm2-g2h-primary-proof:v1") is None
        and image_id("nhm2-g2h-independent-proof:v1") is None
        and primary["final_image_id"] is None
        and independent["final_image_id"] is None,
        "candidate_roots_absent": all(not path.exists() for path in roots),
        "zero_authority": manifest["candidate_evaluations"] == 0
        and all(value is False for value in authority.values()),
    }
    print(json.dumps({"schema": "nhm2.g2h.proof_prebuild_audit.v1", "checks": checks}, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
