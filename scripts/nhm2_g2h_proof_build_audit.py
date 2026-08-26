#!/usr/bin/env python3
"""Producer-independent audit of final unexecuted G2H proof images."""

from __future__ import annotations

import hashlib
import json
import shutil
import struct
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-proof-build-binding.v1.json"
SIDECAR = BINDING.with_suffix(".sha256")
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def docker_inspect(image: str) -> dict[str, object]:
    raw = subprocess.check_output(
        ["docker", "image", "inspect", image], text=True, encoding="utf-8"
    )
    values = json.loads(raw)
    if len(values) != 1:
        raise RuntimeError("non-singleton Docker inspection")
    return values[0]


def extract_image_file(image: str, source: str, destination: Path) -> None:
    name = f"nhm2-g2h-audit-{uuid.uuid4().hex}"
    created = False
    try:
        subprocess.run(
            ["docker", "create", "--name", name, image],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        created = True
        subprocess.run(
            ["docker", "cp", f"{name}:{source}", str(destination)],
            check=True,
            stdout=subprocess.DEVNULL,
        )
    finally:
        if created:
            subprocess.run(
                ["docker", "rm", name],
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )


def elf64_linkage(path: Path) -> tuple[set[int], set[int]]:
    data = path.read_bytes()
    if len(data) < 64 or data[:4] != b"\x7fELF":
        raise RuntimeError("independent payload is not ELF")
    if data[4] != 2 or data[5] != 1:
        raise RuntimeError("independent payload is not little-endian ELF64")
    program_offset = struct.unpack_from("<Q", data, 32)[0]
    entry_size = struct.unpack_from("<H", data, 54)[0]
    entry_count = struct.unpack_from("<H", data, 56)[0]
    if entry_size < 56 or entry_count > 256:
        raise RuntimeError("ELF program-header inventory rejected")
    end = program_offset + entry_size * entry_count
    if end > len(data):
        raise RuntimeError("ELF program-header bounds rejected")
    program_types: set[int] = set()
    dynamic_tags: set[int] = set()
    for index in range(entry_count):
        offset = program_offset + entry_size * index
        program_type = struct.unpack_from("<I", data, offset)[0]
        program_types.add(program_type)
        if program_type != 2:
            continue
        dynamic_offset = struct.unpack_from("<Q", data, offset + 8)[0]
        dynamic_size = struct.unpack_from("<Q", data, offset + 32)[0]
        if dynamic_offset + dynamic_size > len(data) or dynamic_size % 16 != 0:
            raise RuntimeError("ELF dynamic-segment bounds rejected")
        for item in range(dynamic_size // 16):
            tag = struct.unpack_from("<Q", data, dynamic_offset + item * 16)[0]
            dynamic_tags.add(tag)
            if tag == 0:
                break
    return program_types, dynamic_tags


def exact_sidecar_digest() -> bool:
    fields = SIDECAR.read_text(encoding="ascii").strip().split()
    return len(fields) == 2 and fields[0] == sha256(BINDING) and fields[1] == BINDING.name


def source_frozen(section: dict[str, object], prefix: str) -> bool:
    keys = (
        ("proof_source", "proof_source_bytes", "proof_source_sha256"),
        ("surface_source", "surface_source_bytes", "surface_source_sha256"),
        ("dockerfile", "dockerfile_bytes", "dockerfile_sha256"),
    )
    for path_key, bytes_key, hash_key in keys:
        path = ROOT / str(section[path_key])
        if path.stat().st_size != section[bytes_key] or sha256(path) != section[hash_key]:
            return False
    return str(section["proof_source"]).endswith(prefix)


def main() -> int:
    binding = json.loads(BINDING.read_text(encoding="utf-8"))
    primary = binding["primary"]
    independent = binding["independent"]
    primary_image = docker_inspect(primary["image"])
    independent_image = docker_inspect(independent["image"])
    base_image = docker_inspect(primary["base_image"])
    primary_source = (ROOT / primary["proof_source"]).read_text(encoding="utf-8")
    independent_source = (ROOT / independent["proof_source"]).read_text(encoding="utf-8")

    with tempfile.TemporaryDirectory(prefix="nhm2-g2h-proof-audit-") as directory:
        temporary = Path(directory)
        primary_binary = temporary / "primary"
        independent_binary = temporary / "independent"
        extract_image_file(primary["image"], primary["executable_path"], primary_binary)
        extract_image_file(
            independent["image"], independent["executable_path"], independent_binary
        )
        program_types, dynamic_tags = elf64_linkage(independent_binary)
        independent_bytes = independent_binary.read_bytes().lower()
        forbidden_runtime = (
            b"libgmp.so",
            b"libmpfr.so",
            b"libflint",
            b"libarb",
            b"ld-linux",
        )

        base_layers = base_image["RootFS"]["Layers"]
        primary_layers = primary_image["RootFS"]["Layers"]
        independent_layers = independent_image["RootFS"]["Layers"]
        authority_keys = (
            "candidate_execution_authorized",
            "candidate_admitted",
            "classical_proof_established",
            "geometry_state_accepted",
            "lane_execution_authorized",
            "diagnostic_lamp",
            "physical_viability",
            "propulsion_authority",
            "transport_authority",
        )
        checks = {
            "binding_sidecar_exact": exact_sidecar_digest(),
            "current_contract_exact": sha256(CONTRACT) == binding["contract_sha256"],
            "superseded_contract_only_historical": binding[
                "historical_superseded_contract_sha256"
            ]
            == "eaf9dac168445f3013b952ca986bd4bd100cfe2bc35cd18476b8ceff7f86b433"
            and binding["contract_sha256"]
            == "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d",
            "prebuild_manifest_exact": sha256(ROOT / binding["prebuild_manifest"])
            == binding["prebuild_manifest_sha256"],
            "primary_sources_exact": source_frozen(primary, "tolman_vii_primary_proof.c"),
            "independent_sources_exact": source_frozen(
                independent, "tolman_vii_independent_proof.rs"
            ),
            "image_ids_exact": primary_image["Id"] == primary["image_id"]
            and independent_image["Id"] == independent["image_id"],
            "image_sizes_exact": primary_image["Size"] == primary["image_size_bytes"]
            and independent_image["Size"] == independent["image_size_bytes"],
            "platforms_exact": all(
                image["Architecture"] == "amd64" and image["Os"] == "linux"
                for image in (primary_image, independent_image)
            ),
            "entrypoints_exact": primary_image["Config"]["Entrypoint"]
            == primary["entrypoint"]
            and independent_image["Config"]["Entrypoint"]
            == independent["entrypoint"],
            "primary_ancestry_exact": base_image["Id"] == primary["base_image_id"]
            and len(base_layers) == primary["base_layer_count"]
            and primary_layers[: len(base_layers)] == base_layers
            and primary_layers == primary["layers"],
            "independent_scratch_single_layer": independent["runtime_base"] == "scratch"
            and len(independent_layers) == 1
            and independent_layers == independent["layers"],
            "primary_executable_exact": primary_binary.stat().st_size
            == primary["executable_bytes"]
            and sha256(primary_binary) == primary["executable_sha256"],
            "independent_executable_exact": independent_binary.stat().st_size
            == independent["executable_bytes"]
            and sha256(independent_binary) == independent["executable_sha256"],
            "independent_static_elf": 3 not in program_types and 1 not in dynamic_tags,
            "independent_forbidden_runtime_absent": all(
                marker not in independent_bytes for marker in forbidden_runtime
            ),
            "source_lineages_disjoint": primary["proof_source_sha256"]
            != independent["proof_source_sha256"]
            and primary["surface_source_sha256"] != independent["surface_source_sha256"],
            "independent_forbidden_imports_absent": all(
                marker not in independent_source.lower()
                for marker in ("gmp", "mpfr", "flint", "arb_sys", "libm", "extern \"c\"")
            ),
            "token_and_contract_guards_exact": all(
                value in source
                for value in (binding["execution_token_sha256"], binding["contract_sha256"])
                for source in (primary_source, independent_source)
            ),
            "fixed_18_duty_order": all(
                primary_source.count(f'"G2G-C{index:02d}"') == 1
                and independent_source.count(f'"G2G-C{index:02d}"') == 1
                for index in range(1, 13)
            )
            and all(
                primary_source.count(f'"G2G-Q{index:02d}"') == 1
                and independent_source.count(f'"G2G-Q{index:02d}"') == 1
                for index in range(1, 7)
            ),
            "hard_authorization_guards_present": "strcmp(authorization.decision, \"AUTHORIZED\")"
            in primary_source
            and '("decision", "AUTHORIZED")' in independent_source
            and "argc != 12" in primary_source
            and "arguments.len() != 11" in independent_source,
            "exclusive_chronology_guards_present": "!primary_file_is_absent(PRIMARY_ROOT)"
            in primary_source
            and "!primary_file_is_absent(INDEPENDENT_ROOT)" in primary_source
            and "Path::new(INDEPENDENT_ROOT).exists()" in independent_source
            and "!Path::new(PRIMARY_ROOT).is_dir()" in independent_source,
            "surface_first_fail_and_ineligibility_present": all(
                marker in source
                for marker in (
                    "GLOBAL_STATIC_STATE_FAIL",
                    "INELIGIBLE_AFTER_FIRST_FAIL",
                    "first_disjoint_order",
                )
                for source in (primary_source, independent_source)
            ),
            "candidate_roots_absent": all(
                not (ROOT / path).exists() for path in binding["candidate_roots"]
            ),
            "zero_candidate_evaluations": binding["candidate_evaluations"] == 0,
            "all_authority_locked": all(binding[key] is False for key in authority_keys),
        }

    print(
        json.dumps(
            {
                "schema": "nhm2.g2h.proof_build_audit.v1",
                "passed": sum(checks.values()),
                "total": len(checks),
                "checks": checks,
            },
            sort_keys=True,
        )
    )
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
