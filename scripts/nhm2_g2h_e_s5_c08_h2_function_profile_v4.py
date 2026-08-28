#!/usr/bin/env python3
"""Run the candidate-neutral H2 v4 function profile and preserve evidence."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib
import re
import subprocess
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
ALLOWED_PARENT = (ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral").resolve()
BASELINE_IMAGE = "nhm2-g2h-e-s5-c08-h2-timing-calibration:v1-audit"
PROFILE_IMAGE = "nhm2-g2h-e-s5-c08-h2-function-profile:v4"
BASELINE_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-timing-calibration-v1"
PROFILE_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-function-profile-v4"
PROFILE_PATTERN = re.compile(
    r"^H2_PROFILE_V4\|(0x[0-9a-f]+)\|([0-9]+)\|([0-9]+)\|([0-9]+)$"
)
META_PATTERN = re.compile(r"^H2_PROFILE_V4_META\|([0-9]+)\|([0-9]+)\|([0-9]+)$")
PROTECTED = (
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    ROOT / "artifacts/nhm2/g2h-e-s5/executions",
)


def run(command: list[str], timeout: int = 3600) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True, timeout=timeout)


def write_text(path: pathlib.Path, value: str) -> None:
    path.write_text(value, encoding="utf-8", newline="\n")


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_equivalence() -> Any:
    path = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_profile_equivalence.py"
    spec = importlib.util.spec_from_file_location("h2_profile_equivalence_v4", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("equivalence oracle unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def image_identity(image: str) -> str:
    process = run(["docker", "image", "inspect", image, "--format", "{{.Id}}"], 60)
    return process.stdout.strip() if process.returncode == 0 else ""


def executable_identity(image: str, executable: str) -> str:
    process = run(["docker", "run", "--rm", "--network", "none",
                   "--entrypoint", "sha256sum", image, executable], 60)
    return process.stdout.split()[0] if process.returncode == 0 else ""


def secure_run(image: str, executable: str, maximum_exponent: int) \
        -> subprocess.CompletedProcess[str]:
    return run([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--pids-limit", "64", "--entrypoint", executable, image,
        "--max-exponent", str(maximum_exponent),
    ])


def parse_profile(stderr: str) -> tuple[list[dict[str, Any]], dict[str, int]]:
    records: list[dict[str, Any]] = []
    metadata: list[dict[str, int]] = []
    for line in stderr.splitlines():
        match = PROFILE_PATTERN.fullmatch(line)
        if match:
            records.append({
                "address": match.group(1),
                "calls": int(match.group(2)),
                "inclusive_ns": int(match.group(3)),
                "self_ns": int(match.group(4)),
            })
            continue
        meta = META_PATTERN.fullmatch(line)
        if meta:
            metadata.append({
                "depth_overflow": int(meta.group(1)),
                "bucket_overflow": int(meta.group(2)),
                "remaining_depth": int(meta.group(3)),
            })
    if not records:
        raise ValueError("no H2_PROFILE_V4 function records")
    if len(metadata) != 1:
        raise ValueError(f"expected one H2_PROFILE_V4_META record, got {len(metadata)}")
    return records, metadata[0]


def symbolize(records: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[str]]:
    diagnostics: list[str] = []
    by_address: dict[str, tuple[str, str]] = {}
    addresses = [record["address"] for record in records]
    for start in range(0, len(addresses), 256):
        chunk = addresses[start:start + 256]
        process = run([
            "docker", "run", "--rm", "--network", "none", "--read-only",
            "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--pids-limit", "64", "--entrypoint", "addr2line", PROFILE_IMAGE,
            "-C", "-f", "-e", PROFILE_EXECUTABLE, *chunk,
        ], 300)
        if process.returncode != 0:
            diagnostics.append(process.stderr.strip() or
                               f"addr2line failed for chunk {start // 256}")
            continue
        lines = process.stdout.splitlines()
        if len(lines) != 2 * len(chunk):
            diagnostics.append(
                f"addr2line returned {len(lines)} lines for {len(chunk)} addresses")
            continue
        for offset, address in enumerate(chunk):
            by_address[address] = (lines[2 * offset], lines[2 * offset + 1])
    enriched: list[dict[str, Any]] = []
    for record in records:
        function, location = by_address.get(record["address"], ("??", "??:0"))
        enriched.append({**record, "function": function, "location": location})
    enriched.sort(key=lambda value: (-value["self_ns"], -value["inclusive_ns"],
                                     value["address"]))
    return enriched, diagnostics


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=pathlib.Path, required=True)
    parser.add_argument("--max-exponent", type=int, choices=(0,), default=0)
    args = parser.parse_args()

    output_root = (ROOT / args.output_root).resolve() if not args.output_root.is_absolute() \
        else args.output_root.resolve()
    if output_root == ALLOWED_PARENT or ALLOWED_PARENT not in output_root.parents:
        parser.error("--output-root must be a child of artifacts/nhm2/g2h-e-s5/candidate-neutral")
    if output_root.exists():
        parser.error("exclusive output root already exists")
    if any(path.exists() for path in PROTECTED):
        parser.error("protected candidate root or authorization surface exists")

    output_root.mkdir(parents=True)
    source_path = ROOT / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
        "mini_boson_star_primary_c08_h2_function_profile_v4.cpp")
    dockerfile_path = ROOT / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/g2h/"
        "Dockerfile.primary.mini-boson-c08-h2-function-profile.v4")
    invocation = {
        "schema": "nhm2.g2h_e_s5.c08_h2_function_profile_invocation.v4",
        "baseline_image": BASELINE_IMAGE,
        "profile_image": PROFILE_IMAGE,
        "baseline_executable": BASELINE_EXECUTABLE,
        "profile_executable": PROFILE_EXECUTABLE,
        "max_exponent": args.max_exponent,
        "profiler_source_sha256": sha256(source_path),
        "dockerfile_sha256": sha256(dockerfile_path),
        "candidate_neutral": True,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    write_text(output_root / "invocation.json",
               json.dumps(invocation, sort_keys=True, separators=(",", ":")) + "\n")

    baseline_image_id = image_identity(BASELINE_IMAGE)
    profile_image_id = image_identity(PROFILE_IMAGE)
    baseline_executable_sha = executable_identity(BASELINE_IMAGE, BASELINE_EXECUTABLE)
    profile_executable_sha = executable_identity(PROFILE_IMAGE, PROFILE_EXECUTABLE)

    baseline = secure_run(BASELINE_IMAGE, BASELINE_EXECUTABLE, args.max_exponent)
    write_text(output_root / "baseline.stdout.ndjson", baseline.stdout)
    write_text(output_root / "baseline.stderr.txt", baseline.stderr)
    write_text(output_root / "baseline.exit_code.txt", f"{baseline.returncode}\n")

    profile = secure_run(PROFILE_IMAGE, PROFILE_EXECUTABLE, args.max_exponent)
    write_text(output_root / "profile.stdout.ndjson", profile.stdout)
    write_text(output_root / "profile.stderr.txt", profile.stderr)
    write_text(output_root / "profile.exit_code.txt", f"{profile.returncode}\n")

    oracle = load_equivalence()
    try:
        equivalence = oracle.compare(output_root / "baseline.stdout.ndjson",
                                     output_root / "profile.stdout.ndjson")
    except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
        equivalence = {"status": "FAIL", "error": str(exc)}
    write_text(output_root / "equivalence.json",
               json.dumps(equivalence, sort_keys=True, separators=(",", ":")) + "\n")

    profile_error = ""
    metadata = {"depth_overflow": -1, "bucket_overflow": -1, "remaining_depth": -1}
    records: list[dict[str, Any]] = []
    diagnostics: list[str] = []
    try:
        raw_records, metadata = parse_profile(profile.stderr)
        records, diagnostics = symbolize(raw_records)
    except ValueError as exc:
        profile_error = str(exc)
    report = {
        "schema": "nhm2.g2h_e_s5.c08_h2_function_profile_report.v4",
        "status": "PASS" if records and not profile_error and not diagnostics else "FAIL",
        "metadata": metadata,
        "record_count": len(records),
        "symbolization_diagnostics": diagnostics,
        "error": profile_error or None,
        "functions_by_self_time": records,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    write_text(output_root / "function-profile.json",
               json.dumps(report, sort_keys=True, separators=(",", ":")) + "\n")
    tsv = "rank\tself_ns\tinclusive_ns\tcalls\taddress\tfunction\tlocation\n"
    for rank, record in enumerate(records, 1):
        tsv += (f"{rank}\t{record['self_ns']}\t{record['inclusive_ns']}\t"
                f"{record['calls']}\t{record['address']}\t{record['function']}\t"
                f"{record['location']}\n")
    write_text(output_root / "function-profile.tsv", tsv)

    protected_absent = all(not path.exists() for path in PROTECTED)
    profile_clean = (bool(records) and not profile_error and not diagnostics
                     and metadata == {"depth_overflow": 0, "bucket_overflow": 0,
                                      "remaining_depth": 0})
    passed = (
        baseline.returncode == 0
        and profile.returncode == 0
        and equivalence.get("status") == "PASS"
        and profile_clean
        and bool(baseline_image_id)
        and bool(profile_image_id)
        and len(baseline_executable_sha) == 64
        and len(profile_executable_sha) == 64
        and protected_absent
    )
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_function_profile_receipt.v4",
        "status": "PASS" if passed else "FAIL",
        "baseline_image_id": baseline_image_id,
        "profile_image_id": profile_image_id,
        "baseline_executable_sha256": baseline_executable_sha,
        "profile_executable_sha256": profile_executable_sha,
        "baseline_exit_code": baseline.returncode,
        "profile_exit_code": profile.returncode,
        "semantic_equivalence": equivalence.get("status") == "PASS",
        "profile_record_count": len(records),
        "profile_metadata": metadata,
        "profile_complete": profile_clean,
        "protected_surfaces_absent": protected_absent,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    write_text(output_root / "receipt.json",
               json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n")
    evidence = sorted(path for path in output_root.iterdir() if path.is_file())
    write_text(output_root / "evidence.sha256",
               "".join(f"{sha256(path)}  {path.name}\n" for path in evidence))
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
