#!/usr/bin/env python3
"""Preserve the candidate-neutral H2-P2 equivalence and timing evidence."""

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
BASELINE_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-timing-calibration-v1"
PREPARED_IMAGE = "nhm2-g2h-e-s5-c08-h2-prepared-calibration:v2"
PREPARED_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-prepared-calibration-v2"
MANUFACTURED_IMAGE = "nhm2-g2h-e-s5-c08-prepared-moment-equivalence:v2"
MANUFACTURED_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-prepared-moment-equivalence-v2"
ORDER128_IMAGE = "nhm2-g2h-e-s5-c08-h2-order128-equivalence:v2"
ORDER128_EXECUTABLE = "/usr/local/bin/mini-boson-star-primary-c08-h2-order128-equivalence-v2"
PROTECTED = (
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-primary",
    ROOT / "artifacts/nhm2/g2h-e-s4/mini-boson-star-independent",
    ROOT / "artifacts/nhm2/g2h-e-s5/authorizations/primary-v1.txt",
    ROOT / "artifacts/nhm2/g2h-e-s5/executions",
)


def run(command: list[str], timeout: int = 1800) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=ROOT, check=False, capture_output=True,
                          text=True, timeout=timeout)


def secure(image: str, executable: str, arguments: list[str] | None = None) \
        -> subprocess.CompletedProcess[str]:
    return run([
        "docker", "run", "--rm", "--network", "none", "--read-only",
        "--cap-drop", "ALL", "--security-opt", "no-new-privileges",
        "--pids-limit", "64", "--entrypoint", executable, image,
        *(arguments or []),
    ])


def sha256(path: pathlib.Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path: pathlib.Path, value: str) -> None:
    path.write_text(value, encoding="utf-8", newline="\n")


def identity(image: str, executable: str) -> dict[str, str]:
    image_process = run(["docker", "image", "inspect", image,
                         "--format", "{{.Id}}"], 60)
    executable_process = secure(image, "/usr/bin/sha256sum", [executable])
    executable_sha = executable_process.stdout.split()[0] \
        if executable_process.returncode == 0 else ""
    return {"image_id": image_process.stdout.strip(),
            "executable_sha256": executable_sha}


def load_oracle() -> Any:
    path = ROOT / "scripts/nhm2_g2h_e_s5_c08_h2_profile_equivalence.py"
    spec = importlib.util.spec_from_file_location("h2_p2_equivalence", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("equivalence oracle unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_single(process: subprocess.CompletedProcess[str]) -> dict[str, Any]:
    lines = process.stdout.splitlines()
    if process.returncode != 0 or len(lines) != 1:
        return {"status": "FAIL", "exit_code": process.returncode,
                "error": "expected one successful JSON record"}
    value = json.loads(lines[0])
    if not isinstance(value, dict):
        raise ValueError("fixture record is not an object")
    return value


def neutral(records: list[dict[str, Any]]) -> bool:
    return all(record.get("candidate_evaluations") == 0
               and record.get("positive_parameter_samples") == 0
               and record.get("candidate_roots_created") is False
               and record.get("scientific_handler_linked") is False
               and record.get("authority_promoted") is False
               for record in records)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", type=pathlib.Path, required=True)
    args = parser.parse_args()
    output_root = (ROOT / args.output_root).resolve() if not args.output_root.is_absolute() \
        else args.output_root.resolve()
    if output_root == ALLOWED_PARENT or ALLOWED_PARENT not in output_root.parents:
        parser.error("output root must be a child of the candidate-neutral evidence parent")
    if output_root.exists():
        parser.error("exclusive output root already exists")
    if any(path.exists() for path in PROTECTED):
        parser.error("protected candidate root or authorization surface exists")
    output_root.mkdir(parents=True)

    identities = {
        "baseline": identity(BASELINE_IMAGE, BASELINE_EXECUTABLE),
        "prepared": identity(PREPARED_IMAGE, PREPARED_EXECUTABLE),
        "manufactured": identity(MANUFACTURED_IMAGE, MANUFACTURED_EXECUTABLE),
        "order128": identity(ORDER128_IMAGE, ORDER128_EXECUTABLE),
    }
    write(output_root / "identities.json",
          json.dumps(identities, sort_keys=True, separators=(",", ":")) + "\n")

    manufactured_process = secure(MANUFACTURED_IMAGE, MANUFACTURED_EXECUTABLE)
    write(output_root / "manufactured.stdout.json", manufactured_process.stdout)
    write(output_root / "manufactured.stderr.txt", manufactured_process.stderr)
    manufactured = parse_single(manufactured_process)

    order128_process = secure(ORDER128_IMAGE, ORDER128_EXECUTABLE)
    write(output_root / "order128.stdout.json", order128_process.stdout)
    write(output_root / "order128.stderr.txt", order128_process.stderr)
    order128 = parse_single(order128_process)

    baseline = secure(BASELINE_IMAGE, BASELINE_EXECUTABLE,
                      ["--max-exponent", "0"])
    prepared0 = secure(PREPARED_IMAGE, PREPARED_EXECUTABLE,
                       ["--max-exponent", "0"])
    prepared2 = secure(PREPARED_IMAGE, PREPARED_EXECUTABLE,
                       ["--max-exponent", "2"])
    for name, process in (("baseline-exp0", baseline),
                          ("prepared-exp0", prepared0),
                          ("prepared-exp2", prepared2)):
        write(output_root / f"{name}.stdout.ndjson", process.stdout)
        write(output_root / f"{name}.stderr.txt", process.stderr)
        write(output_root / f"{name}.exit-code.txt", f"{process.returncode}\n")

    oracle = load_oracle()
    equivalence = oracle.compare(output_root / "baseline-exp0.stdout.ndjson",
                                 output_root / "prepared-exp0.stdout.ndjson")
    write(output_root / "calibration-equivalence.json",
          json.dumps(equivalence, sort_keys=True, separators=(",", ":")) + "\n")
    prepared2_records = oracle.load_records(output_root / "prepared-exp2.stdout.ndjson")
    progress = [record for record in prepared2_records
                if record.get("status") == "PROGRESS"]
    complete = [record for record in prepared2_records
                if record.get("status") == "CALIBRATION_COMPLETE"]
    schedule_ok = (
        len(progress) == 3 and len(complete) == 1
        and [record.get("exponent") for record in progress] == [0, 1, 2]
        and [record.get("cumulative_subpanels") for record in progress] == [1, 3, 7]
        and [record.get("cumulative_elementary_convolutions")
             for record in progress] == [43, 129, 301]
        and complete[0].get("cumulative_subpanels") == 7
        and complete[0].get("cumulative_elementary_convolutions") == 301
        and neutral(prepared2_records)
    )
    oracle_ms = int(order128.get("oracle_milliseconds", 0))
    prepared_ms = int(order128.get("prepared_milliseconds", 0))
    speedup = (oracle_ms / prepared_ms) if prepared_ms > 0 else 0.0
    identities_ok = all(len(value["image_id"]) > 7
                        and len(value["executable_sha256"]) == 64
                        for value in identities.values())
    protected_absent = all(not path.exists() for path in PROTECTED)
    passed = (
        manufactured.get("status") == "PASS"
        and order128.get("status") == "PASS"
        and order128.get("arb_equal_all_outputs") is True
        and order128.get("results_equal") is True
        and baseline.returncode == 0 and prepared0.returncode == 0
        and prepared2.returncode == 0
        and equivalence.get("status") == "PASS"
        and schedule_ok and speedup >= 4.0 and identities_ok
        and protected_absent
    )
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p2_prepared_moment_receipt.v2",
        "status": "PASS" if passed else "FAIL",
        "manufactured_equivalence": manufactured.get("status") == "PASS",
        "order128_arb_equal": order128.get("arb_equal_all_outputs") is True,
        "order128_results_equal": order128.get("results_equal") is True,
        "calibration_semantic_equivalence": equivalence.get("status") == "PASS",
        "prepared_exponent2_schedule_complete": schedule_ok,
        "oracle_milliseconds": oracle_ms,
        "prepared_milliseconds": prepared_ms,
        "measured_speedup": speedup,
        "performance_target": 4.0,
        "performance_target_met": speedup >= 4.0,
        "identities_complete": identities_ok,
        "protected_surfaces_absent": protected_absent,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
    }
    write(output_root / "receipt.json",
          json.dumps(receipt, sort_keys=True, separators=(",", ":")) + "\n")
    evidence = sorted(path for path in output_root.iterdir() if path.is_file())
    write(output_root / "evidence.sha256",
          "".join(f"{sha256(path)}  {path.name}\n" for path in evidence))
    print(json.dumps(receipt, sort_keys=True, separators=(",", ":")))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
