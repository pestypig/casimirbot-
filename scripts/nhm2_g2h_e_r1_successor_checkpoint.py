#!/usr/bin/env python3
"""One-shot offline G2H-E primary-v2 checkpoint; inert without a new exact AUTHORIZED record."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BINDING_REL = Path(
    "docs/research/nhm2-spherical-boson-star-v2-g2h-e-r1-build-binding.v1.json"
)
BINDING = ROOT / BINDING_REL
CONTRACT_REL = Path(
    "docs/research/nhm2-spherical-boson-star-v2-g2g-candidate-contract.json"
)
CONTRACT = ROOT / CONTRACT_REL
SOURCES_REL = Path(".cal/nhm2-g2h/sources-v1")
SOURCES = ROOT / SOURCES_REL
OUTPUT_PARENT_REL = Path("artifacts/research/nhm2/g2h")
OUTPUT_PARENT = ROOT / OUTPUT_PARENT_REL
AUTHORIZATION_PARENT_REL = Path("artifacts/research/nhm2/g2h-authorizations")
AUTHORIZATION_PARENT = ROOT / AUTHORIZATION_PARENT_REL
EXECUTION_PARENT = ROOT / "artifacts/research/nhm2/g2h-executions"
TOKEN_SHA256 = "d54ee55da5967062bfbc080bcfb3d962b07ed69b08e4316b3973aa5b24d2ff4b"
CONTRACT_SHA256 = "30de966d41d6342e8a047ee655a33e02f68d32a6ba49efcb39b0bbd7981c343d"

LANES = {
    "primary": {
        "image": "nhm2-g2h-primary-proof:v2",
        "image_id": "sha256:8334e9777fd7cb9405d8878b243d0196f3e45d9d51d82df159452dcb430159ab",
        "executable_sha256": "666ba126413e63318275bf0861b860707ce7046bcd278c3ee73b1f65f9369028",
        "output_root": Path("artifacts/research/nhm2/g2h/tolman-vii-primary-v2"),
        "authorization": Path(
            "artifacts/research/nhm2/g2h-authorizations/g2h-e-primary-v2.txt"
        ),
        "container": "nhm2-g2h-e-primary-v2",
    },
    "independent": {
        "image": "nhm2-g2h-independent-proof:v1",
        "image_id": "sha256:03102ead4a5271f8ad85c3b75be25283d61593b5d2934778522eabfe87dbb427",
        "executable_sha256": "c6f9c86da092600b2e4baf03d38d55a11a9c365909ca7cc903ecd24c1c1c6a87",
        "output_root": Path("artifacts/research/nhm2/g2h/tolman-vii-independent-v1"),
        "authorization": Path(
            "artifacts/research/nhm2/g2h-authorizations/g2h-e-independent-v1.txt"
        ),
        "container": "nhm2-g2h-e-independent-v1",
    },
}

SOURCE_FILES = {
    "tolman_vii_exact.pdf": (684526, "a36fe51c5e54b306260f7950a831c527cced0892e24fbc8bd54dce39093f3438"),
    "tolman_vii_independent.pdf": (119321, "81389455a1d94d1b46bc5f16e242f8f1f873a2aa551c41fc4aa34bc7f9aa51ac"),
    "static_hadamard.pdf": (621871, "d65a9f9f82212aeabc1ae99e41315ebea2595d4c2676deeac89e9c188294aea6"),
    "hadamard_rset.pdf": (448374, "676f41aac1dcff7f622ac147936e58e5e2ff60939a9688043d1657b92db29977"),
    "noise_kernel.pdf": (283952, "38f2698b3f1dbefb3eda28d8aa24520818a021fb3f648376c56247c62bf2e820"),
    "renormalized_fluctuations.pdf": (452153, "8642014b6bc46c5965fed0a7de217fd9ad0ffc3786418e684d3b05bba495df3e"),
    "radial_stability.pdf": (968364, "be355176953fa63691948105a7e2e4f0ef3ed63d13adb34265b02c6c76cd509a"),
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def fsync_parent(path: Path) -> None:
    if os.name != "nt":
        descriptor = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(descriptor)
        finally:
            os.close(descriptor)


def write_exclusive(path: Path, value: dict[str, object]) -> None:
    data = (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()
    with path.open("xb") as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
    fsync_parent(path)


def image_id(image: str) -> str:
    result = subprocess.run(
        ["docker", "image", "inspect", image, "--format", "{{.Id}}"],
        text=True,
        encoding="utf-8",
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError("frozen Docker image unavailable")
    return result.stdout.strip()


def container_exists(name: str) -> bool:
    result = subprocess.run(
        ["docker", "container", "inspect", name],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def verify_binding() -> dict[str, object]:
    sidecar = BINDING.with_suffix(".sha256")
    fields = sidecar.read_text(encoding="ascii").strip().split()
    if len(fields) != 2 or fields[0] != sha256(BINDING) or fields[1] != BINDING.name:
        raise RuntimeError("proof binding sidecar rejected")
    binding = json.loads(BINDING.read_text(encoding="utf-8"))
    if binding["contract_sha256"] != CONTRACT_SHA256 or sha256(CONTRACT) != CONTRACT_SHA256:
        raise RuntimeError("contract identity rejected")
    authority = binding["authority"]
    if authority["candidate_evaluations"] != 0 or authority["candidate_execution_authorized"]:
        raise RuntimeError("preexecution authority state rejected")
    return binding


def verify_sources() -> None:
    found = {path.name for path in SOURCES.iterdir() if path.is_file()}
    if found != set(SOURCE_FILES):
        raise RuntimeError("scientific-source inventory rejected")
    for name, (size, digest) in SOURCE_FILES.items():
        path = SOURCES / name
        if path.stat().st_size != size or sha256(path) != digest:
            raise RuntimeError(f"scientific-source identity rejected: {name}")


def parse_authorization(path: Path, lane: str, primary_manifest: str | None) -> None:
    if path.is_symlink() or not path.is_file() or path.stat().st_size > 4096:
        raise RuntimeError("authorization file shape rejected")
    lines = path.read_text(encoding="ascii").splitlines()
    expected = [
        ("schema", "nhm2.g2h_execution_authorization.v2"),
        ("decision", "AUTHORIZED"),
        ("lane", lane),
        ("token_sha256", TOKEN_SHA256),
        ("contract_sha256", CONTRACT_SHA256),
        ("executable_sha256", LANES[lane]["executable_sha256"]),
        ("output_root", LANES[lane]["output_root"].as_posix()),
    ]
    if lane == "independent":
        if primary_manifest is None:
            raise RuntimeError("primary manifest missing")
        expected.append(("primary_manifest_sha256", primary_manifest))
    if lines != [f"{key}={value}" for key, value in expected]:
        raise RuntimeError("exact AUTHORIZED record rejected")


def verify_chronology(lane: str) -> str | None:
    primary_root = ROOT / LANES["primary"]["output_root"]
    exhausted_primary_root = ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1"
    independent_root = ROOT / LANES["independent"]["output_root"]
    if lane == "primary":
        if primary_root.exists() or exhausted_primary_root.exists() or independent_root.exists():
            raise RuntimeError("primary exclusive-root chronology rejected")
        return None
    if independent_root.exists() or not primary_root.is_dir():
        raise RuntimeError("independent exclusive-root chronology rejected")
    manifest = primary_root / "proof-manifest.json"
    if not manifest.is_file() or manifest.is_symlink():
        raise RuntimeError("primary manifest chronology rejected")
    return sha256(manifest)


def docker_command(lane: str, token: str, authorization: Path) -> list[str]:
    lane_data = LANES[lane]
    return [
        "docker",
        "run",
        "--name",
        lane_data["container"],
        "--network",
        "none",
        "--read-only",
        "--cap-drop",
        "ALL",
        "--security-opt",
        "no-new-privileges",
        "--pids-limit",
        "64",
        "--memory",
        "2g",
        "--workdir",
        "/work",
        "--volume",
        f"{CONTRACT}:/work/{CONTRACT_REL.as_posix()}:ro",
        "--volume",
        f"{SOURCES}:/work/{SOURCES_REL.as_posix()}:ro",
        "--volume",
        f"{authorization}:/work/{lane_data['authorization'].as_posix()}:ro",
        "--volume",
        f"{OUTPUT_PARENT}:/work/{OUTPUT_PARENT_REL.as_posix()}:rw",
        lane_data["image"],
        "--candidate",
        "--contract",
        CONTRACT_REL.as_posix(),
        "--sources",
        SOURCES_REL.as_posix(),
        "--output-root",
        lane_data["output_root"].as_posix(),
        "--authorization",
        lane_data["authorization"].as_posix(),
        "--token",
        token,
    ]


def execute_once(lane: str, token: str) -> int:
    if lane != "primary":
        raise RuntimeError("G2H-E-R1 successor checkpoint is primary-only")
    if Path.cwd().resolve() != ROOT.resolve():
        raise RuntimeError("checkpoint must run from the canonical repository root")
    if len(token) != 64 or hashlib.sha256(token.encode("ascii")).hexdigest() != TOKEN_SHA256:
        raise RuntimeError("execution token rejected")
    binding = verify_binding()
    verify_sources()
    lane_data = LANES[lane]
    if image_id(lane_data["image"]) != lane_data["image_id"]:
        raise RuntimeError("Docker image identity rejected")
    primary_manifest = verify_chronology(lane)
    authorization = ROOT / lane_data["authorization"]
    parse_authorization(authorization, lane, primary_manifest)

    invocation = EXECUTION_PARENT / f"g2h-e-{lane}-v2-invocation.json"
    stdout_path = EXECUTION_PARENT / f"g2h-e-{lane}-v2.stdout.log"
    stderr_path = EXECUTION_PARENT / f"g2h-e-{lane}-v2.stderr.log"
    result_path = EXECUTION_PARENT / f"g2h-e-{lane}-v2-result.json"
    if any(path.exists() for path in (invocation, stdout_path, stderr_path, result_path)):
        raise RuntimeError("immutable execution ledger already exists; retry forbidden")
    if container_exists(lane_data["container"]):
        raise RuntimeError("fixed execution container already exists; retry forbidden")

    OUTPUT_PARENT.mkdir(parents=True, exist_ok=True)
    EXECUTION_PARENT.mkdir(parents=True, exist_ok=True)
    command = docker_command(lane, token, authorization)
    write_exclusive(
        invocation,
        {
            "schema": "nhm2.g2h_e_successor.invocation.v2",
            "lane": lane,
            "binding_sha256": sha256(BINDING),
            "authorization_sha256": sha256(authorization),
            "token_sha256": TOKEN_SHA256,
            "image_id": lane_data["image_id"],
            "output_root": lane_data["output_root"].as_posix(),
            "primary_manifest_sha256": primary_manifest,
            "retry_allowed": False,
        },
    )
    with stdout_path.open("xb") as stdout_stream, stderr_path.open("xb") as stderr_stream:
        process = subprocess.run(command, stdout=stdout_stream, stderr=stderr_stream, check=False)
        stdout_stream.flush()
        stderr_stream.flush()
        os.fsync(stdout_stream.fileno())
        os.fsync(stderr_stream.fileno())
    write_exclusive(
        result_path,
        {
            "schema": "nhm2.g2h_e_successor.process_result.v2",
            "lane": lane,
            "returncode": process.returncode,
            "stdout_sha256": sha256(stdout_path),
            "stderr_sha256": sha256(stderr_path),
            "output_root_exists": (ROOT / lane_data["output_root"]).exists(),
            "retry_allowed": False,
        },
    )
    return process.returncode


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lane", choices=("primary",), required=True)
    parser.add_argument("--token", required=True)
    parser.add_argument("--execute", action="store_true")
    arguments = parser.parse_args()
    if not arguments.execute:
        print("INERT: --execute and an exact separately issued AUTHORIZED record are required")
        return 64
    try:
        return execute_once(arguments.lane, arguments.token)
    except (OSError, RuntimeError, UnicodeError, ValueError) as error:
        print(f"G2H-E-R1 successor checkpoint rejected: {error}", file=sys.stderr)
        return 64


if __name__ == "__main__":
    sys.exit(main())


