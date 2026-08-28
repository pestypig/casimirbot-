#!/usr/bin/env python3
"""Versioned H2 profiler runner with an explicit writable gmon prefix."""

from __future__ import annotations

import argparse
import importlib.util
import json
import pathlib
import subprocess
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
V1_PATH = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_phase_profile.py"


def load(path: pathlib.Path, name: str) -> Any:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"unable to load {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


V1 = load(V1_PATH, "h2_phase_profile_v1")
EQUIVALENCE = V1.load_equivalence()
CONTAINER = "nhm2-c08-h2-phase-profile-v2-run"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=pathlib.Path, required=True)
    parser.add_argument("--max-exponent", type=int, choices=(0, 1, 2), default=0)
    args = parser.parse_args()

    output_root = (ROOT / args.output_root).resolve() if not args.output_root.is_absolute() \
        else args.output_root.resolve()
    if output_root == V1.ALLOWED_PARENT or V1.ALLOWED_PARENT not in output_root.parents:
        parser.error("--output-root must be a child of artifacts/nhm2/g2h-e-s5/candidate-neutral")
    if output_root.exists():
        parser.error("exclusive output root already exists")
    if any(path.exists() for path in V1.PROTECTED):
        parser.error("protected candidate root or authorization surface exists")
    if V1.run(["docker", "container", "inspect", CONTAINER], 30).returncode == 0:
        parser.error("fixed profiling container already exists")

    output_root.mkdir(parents=True)
    invocation = {
        "schema": "nhm2.g2h_e_s5.c08_h2_phase_profile_invocation.v2",
        "predecessor_failure_root":
            "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-phase-profile-v1-exp0-20260827",
        "sole_repair": "set_GMON_OUT_PREFIX_on_writable_tmpfs",
        "baseline_image": V1.BASELINE_IMAGE,
        "profile_image": V1.PROFILE_IMAGE,
        "baseline_executable": V1.BASELINE_EXECUTABLE,
        "profile_executable": V1.PROFILE_EXECUTABLE,
        "max_exponent": args.max_exponent,
        "candidate_neutral": True,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    V1.write_text(output_root / "invocation.json",
                  json.dumps(invocation, sort_keys=True, separators=(",", ":")) + "\n")

    baseline_image_id = V1.image_identity(V1.BASELINE_IMAGE)
    profile_image_id = V1.image_identity(V1.PROFILE_IMAGE)
    baseline_executable_sha = V1.executable_identity(
        V1.BASELINE_IMAGE, V1.BASELINE_EXECUTABLE)
    profile_executable_sha = V1.executable_identity(
        V1.PROFILE_IMAGE, V1.PROFILE_EXECUTABLE)

    baseline = V1.run(V1.secure_run_prefix(V1.BASELINE_IMAGE, V1.BASELINE_EXECUTABLE)
                      + ["--max-exponent", str(args.max_exponent)])
    V1.write_text(output_root / "baseline.stdout.ndjson", baseline.stdout)
    V1.write_text(output_root / "baseline.stderr.txt", baseline.stderr)
    V1.write_text(output_root / "baseline.exit_code.txt", f"{baseline.returncode}\n")

    profile_command = [
        "docker", "run", "--name", CONTAINER, "--network", "none",
        "--read-only", "--cap-drop", "ALL", "--security-opt",
        "no-new-privileges", "--pids-limit", "64", "--tmpfs",
        "/profile:rw,exec,nosuid,size=64m,mode=1777", "--workdir", "/profile",
        "--env", "GMON_OUT_PREFIX=/profile/gmon", "--entrypoint",
        V1.PROFILE_EXECUTABLE, V1.PROFILE_IMAGE,
        "--max-exponent", str(args.max_exponent),
    ]
    profile = V1.run(profile_command)
    V1.write_text(output_root / "profile.stdout.ndjson", profile.stdout)
    V1.write_text(output_root / "profile.stderr.txt", profile.stderr)
    V1.write_text(output_root / "profile.exit_code.txt", f"{profile.returncode}\n")

    copied = V1.run(["docker", "cp", f"{CONTAINER}:/profile/gmon.1",
                     str(output_root / "gmon.out")], 120)
    V1.write_text(output_root / "gmon-copy.stdout.txt", copied.stdout)
    V1.write_text(output_root / "gmon-copy.stderr.txt", copied.stderr)
    removed = V1.run(["docker", "rm", CONTAINER], 120)
    V1.write_text(output_root / "container-removal.txt", removed.stdout + removed.stderr)

    gprof = subprocess.CompletedProcess([], 1, "", "gmon.out unavailable")
    if copied.returncode == 0:
        mount = f"type=bind,source={output_root},target=/evidence,readonly"
        gprof = V1.run([
            "docker", "run", "--rm", "--network", "none", "--read-only",
            "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--pids-limit", "64", "--mount", mount, "--entrypoint", "gprof",
            V1.PROFILE_IMAGE, V1.PROFILE_EXECUTABLE, "/evidence/gmon.out",
        ], 300)
    V1.write_text(output_root / "gprof-report.txt", gprof.stdout)
    V1.write_text(output_root / "gprof.stderr.txt", gprof.stderr)

    try:
        equivalence = EQUIVALENCE.compare(
            output_root / "baseline.stdout.ndjson",
            output_root / "profile.stdout.ndjson")
    except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
        equivalence = {"status": "FAIL", "error": str(exc)}
    V1.write_text(output_root / "equivalence.json",
                  json.dumps(equivalence, sort_keys=True, separators=(",", ":")) + "\n")

    protected_absent = all(not path.exists() for path in V1.PROTECTED)
    passed = (
        baseline.returncode == 0
        and profile.returncode == 0
        and copied.returncode == 0
        and gprof.returncode == 0
        and equivalence.get("status") == "PASS"
        and bool(baseline_image_id)
        and bool(profile_image_id)
        and len(baseline_executable_sha) == 64
        and len(profile_executable_sha) == 64
        and protected_absent
    )
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_phase_profile_receipt.v2",
        "status": "PASS" if passed else "FAIL",
        "sole_repair": "set_GMON_OUT_PREFIX_on_writable_tmpfs",
        "baseline_image_id": baseline_image_id,
        "profile_image_id": profile_image_id,
        "baseline_executable_sha256": baseline_executable_sha,
        "profile_executable_sha256": profile_executable_sha,
        "baseline_exit_code": baseline.returncode,
        "profile_exit_code": profile.returncode,
        "gmon_preserved": copied.returncode == 0,
        "gprof_exit_code": gprof.returncode,
        "semantic_equivalence": equivalence.get("status") == "PASS",
        "protected_surfaces_absent": protected_absent,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    V1.write_text(output_root / "receipt.json",
                  json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n")
    evidence = sorted(path for path in output_root.iterdir() if path.is_file())
    V1.write_text(output_root / "evidence.sha256",
                  "".join(f"{V1.sha256(path)}  {path.name}\n" for path in evidence))
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
