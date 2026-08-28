#!/usr/bin/env python3
"""Run one exclusive candidate-neutral H2 phase profile and preserve evidence."""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import pathlib
import subprocess
from typing import Any


ROOT = pathlib.Path(__file__).resolve().parents[1]
ALLOWED_PARENT = (ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral").resolve()
BASELINE_IMAGE = "nhm2-g2h-e-s5-c08-h2-timing-calibration:v1-audit"
PROFILE_IMAGE = "nhm2-g2h-e-s5-c08-h2-phase-profile:v1"
BASELINE_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-timing-calibration-v1"
PROFILE_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-phase-profile-v1"
CONTAINER = "nhm2-c08-h2-phase-profile-v1-run"
PROTECTED = (
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    ROOT / "artifacts/nhm2/g2h-e-s5/executions",
)


def load_equivalence() -> Any:
    path = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_profile_equivalence.py"
    spec = importlib.util.spec_from_file_location("h2_profile_equivalence", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("equivalence oracle unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(command: list[str], timeout: int = 3600) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True, timeout=timeout)


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_text(path: pathlib.Path, value: str) -> None:
    path.write_text(value, encoding="utf-8", newline="\n")


def image_identity(image: str) -> str:
    process = run(["docker", "image", "inspect", image, "--format", "{{.Id}}"], 60)
    return process.stdout.strip() if process.returncode == 0 else ""


def executable_identity(image: str, executable: str) -> str:
    process = run(["docker", "run", "--rm", "--network", "none",
                   "--entrypoint", "sha256sum", image, executable], 60)
    return process.stdout.split()[0] if process.returncode == 0 else ""


def secure_run_prefix(image: str, executable: str) -> list[str]:
    return [
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--pids-limit", "64", "--entrypoint", executable, image,
    ]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=pathlib.Path, required=True)
    parser.add_argument("--max-exponent", type=int, choices=(0, 1, 2), default=0)
    args = parser.parse_args()

    output_root = (ROOT / args.output_root).resolve() if not args.output_root.is_absolute() \
        else args.output_root.resolve()
    if output_root == ALLOWED_PARENT or ALLOWED_PARENT not in output_root.parents:
        parser.error("--output-root must be a child of artifacts/nhm2/g2h-e-s5/candidate-neutral")
    if output_root.exists():
        parser.error("exclusive output root already exists")
    if any(path.exists() for path in PROTECTED):
        parser.error("protected candidate root or authorization surface exists")
    if run(["docker", "container", "inspect", CONTAINER], 30).returncode == 0:
        parser.error("fixed profiling container already exists")

    output_root.mkdir(parents=True)
    invocation = {
        "schema": "nhm2.g2h_e_s5.c08_h2_phase_profile_invocation.v1",
        "baseline_image": BASELINE_IMAGE,
        "profile_image": PROFILE_IMAGE,
        "baseline_executable": BASELINE_EXECUTABLE,
        "profile_executable": PROFILE_EXECUTABLE,
        "max_exponent": args.max_exponent,
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

    baseline = run(secure_run_prefix(BASELINE_IMAGE, BASELINE_EXECUTABLE)
                   + ["--max-exponent", str(args.max_exponent)])
    write_text(output_root / "baseline.stdout.ndjson", baseline.stdout)
    write_text(output_root / "baseline.stderr.txt", baseline.stderr)
    write_text(output_root / "baseline.exit_code.txt", f"{baseline.returncode}\n")

    profile_command = [
        "docker", "run", "--name", CONTAINER, "--network", "none",
        "--read-only", "--cap-drop", "ALL", "--security-opt",
        "no-new-privileges", "--pids-limit", "64", "--tmpfs",
        "/profile:rw,exec,nosuid,size=64m,mode=1777", "--workdir", "/profile",
        "--entrypoint", PROFILE_EXECUTABLE, PROFILE_IMAGE,
        "--max-exponent", str(args.max_exponent),
    ]
    profile = run(profile_command)
    write_text(output_root / "profile.stdout.ndjson", profile.stdout)
    write_text(output_root / "profile.stderr.txt", profile.stderr)
    write_text(output_root / "profile.exit_code.txt", f"{profile.returncode}\n")

    copied = run(["docker", "cp", f"{CONTAINER}:/profile/gmon.out",
                  str(output_root / "gmon.out")], 120)
    write_text(output_root / "gmon-copy.stdout.txt", copied.stdout)
    write_text(output_root / "gmon-copy.stderr.txt", copied.stderr)
    removed = run(["docker", "rm", CONTAINER], 120)
    write_text(output_root / "container-removal.txt", removed.stdout + removed.stderr)

    gprof = subprocess.CompletedProcess([], 1, "", "gmon.out unavailable")
    if copied.returncode == 0:
        mount = f"type=bind,source={output_root},target=/evidence,readonly"
        gprof = run([
            "docker", "run", "--rm", "--network", "none", "--read-only",
            "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
            "--pids-limit", "64", "--mount", mount, "--entrypoint", "gprof",
            PROFILE_IMAGE, PROFILE_EXECUTABLE, "/evidence/gmon.out",
        ], 300)
    write_text(output_root / "gprof-report.txt", gprof.stdout)
    write_text(output_root / "gprof.stderr.txt", gprof.stderr)

    oracle = load_equivalence()
    try:
        equivalence = oracle.compare(output_root / "baseline.stdout.ndjson",
                                     output_root / "profile.stdout.ndjson")
    except (OSError, UnicodeError, ValueError, json.JSONDecodeError) as exc:
        equivalence = {"status": "FAIL", "error": str(exc)}
    write_text(output_root / "equivalence.json",
               json.dumps(equivalence, sort_keys=True, separators=(",", ":")) + "\n")

    protected_absent = all(not path.exists() for path in PROTECTED)
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
        "schema": "nhm2.g2h_e_s5.c08_h2_phase_profile_receipt.v1",
        "status": "PASS" if passed else "FAIL",
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
    write_text(output_root / "receipt.json",
               json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n")
    evidence = sorted(path for path in output_root.iterdir() if path.is_file())
    write_text(output_root / "evidence.sha256",
               "".join(f"{sha256(path)}  {path.name}\n" for path in evidence))
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
