#!/usr/bin/env python3
"""Fail-closed preexecution audit for the G2H-R2 v3 fixture pair."""

from __future__ import annotations

import hashlib
import json
import struct
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BINDING = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-build-bindings.v3.json"
SIDECAR = BINDING.with_suffix(".sha256")
CONTRACT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"
OUTPUT_ROOT = ROOT / "artifacts/research/nhm2/g2h-fixtures-v3"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def command(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(arguments, text=True, capture_output=True, check=False)


def image(image_name: str) -> dict[str, object] | None:
    result = command(["docker", "image", "inspect", image_name])
    if result.returncode != 0:
        return None
    payload = json.loads(result.stdout)
    return payload[0] if len(payload) == 1 else None


def primary_executable_identity(image_name: str) -> tuple[int, str] | None:
    result = command(
        [
            "docker",
            "run",
            "--rm",
            "--network=none",
            "--entrypoint",
            "/bin/sh",
            image_name,
            "-c",
            "stat -c %s /usr/local/bin/tolman-vii-primary; "
            "sha256sum /usr/local/bin/tolman-vii-primary",
        ]
    )
    if result.returncode != 0:
        return None
    rows = result.stdout.splitlines()
    if len(rows) != 2:
        return None
    return int(rows[0]), rows[1].split()[0]


def is_static_elf_without_forbidden_lineage(path: Path) -> bool:
    data = path.read_bytes()
    if data[:4] != b"\x7fELF" or data[4] != 2 or data[5] != 1:
        return False
    program_offset = struct.unpack_from("<Q", data, 32)[0]
    entry_size = struct.unpack_from("<H", data, 54)[0]
    entry_count = struct.unpack_from("<H", data, 56)[0]
    headers = [
        struct.unpack_from("<IIQQQQQQ", data, program_offset + index * entry_size)
        for index in range(entry_count)
    ]
    program_types = {header[0] for header in headers}
    dynamic_tags: set[int] = set()
    for header in headers:
        if header[0] != 2:
            continue
        dynamic_offset, dynamic_size = header[2], header[5]
        for cursor in range(dynamic_offset, dynamic_offset + dynamic_size, 16):
            tag = struct.unpack_from("<q", data, cursor)[0]
            dynamic_tags.add(tag)
            if tag == 0:
                break
    forbidden = (b"libgmp", b"libmpfr", b"libflint", b"libarb", b"libm.so")
    return 3 not in program_types and 1 not in dynamic_tags and not any(
        marker in data.lower() for marker in forbidden
    )


def main() -> int:
    binding_bytes = BINDING.read_bytes()
    expected_binding = SIDECAR.read_text(encoding="ascii").split()[0]
    binding = json.loads(binding_bytes)
    primary = binding["primary"]
    independent = binding["independent"]
    primary_image = image(primary["image"])
    independent_image = image(independent["image"])
    base_image = image(primary["base_image"])
    independent_executable = ROOT / independent["uncontainerized_executable"]
    primary_identity = primary_executable_identity(primary["image"])

    authority_keys = (
        "candidate_execution_authorized",
        "candidate_admitted",
        "proof_implementation_complete",
        "classical_proof_established",
        "geometry_state_accepted",
        "diagnostic_lamp",
        "physical_viability",
        "propulsion_authority",
        "transport_authority",
    )
    primary_layers = (primary_image or {}).get("RootFS", {}).get("Layers", [])
    base_layers = (base_image or {}).get("RootFS", {}).get("Layers", [])
    independent_layers = (independent_image or {}).get("RootFS", {}).get("Layers", [])

    checks = {
        "binding_sidecar_valid": hashlib.sha256(binding_bytes).hexdigest() == expected_binding,
        "corrected_contract_bound": sha256(CONTRACT) == binding["contract_sha256"],
        "primary_source_bound": sha256(ROOT / primary["source"]) == primary["source_sha256"]
        and (ROOT / primary["source"]).stat().st_size == primary["source_bytes"],
        "primary_recipe_bound": sha256(ROOT / primary["dockerfile"])
        == primary["dockerfile_sha256"]
        and (ROOT / primary["dockerfile"]).stat().st_size == primary["dockerfile_bytes"],
        "fixture_runner_bound": all(
            sha256(ROOT / entry[path_key]) == entry[hash_key]
            and (ROOT / entry[path_key]).stat().st_size == entry[bytes_key]
            for entry, path_key, hash_key, bytes_key in (
                (binding["fixture_runner"], "base_path", "base_sha256", "base_bytes"),
                (binding["fixture_runner"], "wrapper_path", "wrapper_sha256", "wrapper_bytes"),
            )
        ),
        "primary_image_bound": primary_image is not None
        and primary_image["Id"] == primary["image_id"],
        "primary_base_bound": base_image is not None
        and base_image["Id"] == primary["base_image_id"],
        "primary_thin_layer_ancestry": len(primary_layers) > len(base_layers)
        and primary_layers[: len(base_layers)] == base_layers,
        "primary_executable_bound": primary_identity
        == (primary["executable_bytes"], primary["executable_sha256"]),
        "independent_source_bound": sha256(ROOT / independent["source"])
        == independent["source_sha256"]
        and (ROOT / independent["source"]).stat().st_size == independent["source_bytes"],
        "independent_image_bound": independent_image is not None
        and independent_image["Id"] == independent["image_id"],
        "independent_scratch_runtime": independent["runtime_base"] == "scratch"
        and independent["runtime_base_layers"] == []
        and independent_layers == independent["image_payload_layers"],
        "independent_executable_bound": independent_executable.is_file()
        and independent_executable.stat().st_size == independent["executable_bytes"]
        and sha256(independent_executable) == independent["executable_sha256"],
        "independent_no_forbidden_lineage": independent["dependencies"] == []
        and is_static_elf_without_forbidden_lineage(independent_executable),
        "runtime_and_source_disjoint": primary["source_sha256"] != independent["source_sha256"]
        and primary["image_id"] != independent["image_id"]
        and set(primary_layers).isdisjoint(independent_layers),
        "exclusive_fixture_root_absent": not OUTPUT_ROOT.exists(),
        "candidate_roots_absent": all(
            not (ROOT / path).exists() for path in binding["candidate_roots"]
        ),
        "zero_authority": binding["candidate_evaluations"] == 0
        and binding["lanes_complete"] == 0
        and all(binding[key] is False for key in authority_keys),
    }
    print(json.dumps({"schema": "nhm2.g2h_r2.preexecution_audit.v1", "checks": checks}, sort_keys=True))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
