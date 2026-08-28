#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p4-cloud-scaling-v1-20260827"
EVIDENCE = OUT / "nhm2-h2-p4-evidence-v1-20260827"
ARCHIVE = OUT / "nhm2-h2-p4-evidence-v1-20260827.tar.gz"
EXPECTED_ARCHIVE_SHA = "b3a8a5b0b5e2a8b26779a873585d6475cac99be5b495d6404d83d6872c56c51d"
EXPECTED_BASE_CONFIGS = {
    "sha256:540d7039743d1fa2d285c2ec2570fef20954339fcb0a48453f187cf80c0c304c",
    "sha256:17043e9f1891cb2026c3a959de47af3d5c75ed9918d32e44455148dfaff2057e",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ndjson(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip()]


def semantic(rows: list[dict]) -> list[dict]:
    excluded = {"candidate_milliseconds", "cumulative_milliseconds", "threads"}
    return [{key: value for key, value in row.items() if key not in excluded}
            for row in rows]


def candidate_ms(rows: list[dict]) -> int:
    return sum(int(row["candidate_milliseconds"])
               for row in rows if row["status"] == "PROGRESS")


def wall_seconds(path: Path) -> float:
    match = re.search(r"Elapsed \(wall clock\) time \(h:mm:ss or m:ss\): ([0-9:.]+)",
                      path.read_text(encoding="utf-8"))
    if match is None:
        raise ValueError(f"missing elapsed time: {path}")
    parts = [float(part) for part in match.group(1).split(":")]
    if len(parts) == 2:
        return parts[0] * 60.0 + parts[1]
    return parts[0] * 3600.0 + parts[1] * 60.0 + parts[2]


def main() -> int:
    if not EVIDENCE.is_dir():
        raise RuntimeError(f"missing evidence root: {EVIDENCE}")
    receipt_path = OUT / "receipt.json"
    audit_path = OUT / "independent-audit.json"
    if receipt_path.exists() or audit_path.exists():
        raise RuntimeError("immutable H2-P4 receipt/audit already exists")

    checks: list[tuple[str, bool]] = []
    checks.append(("archive_sha256", sha256(ARCHIVE) == EXPECTED_ARCHIVE_SHA))

    manifest_ok = True
    for line in (EVIDENCE / "raw-evidence-sha256.txt").read_text(encoding="utf-8").splitlines():
        expected, relative = line.split(maxsplit=1)
        relative = relative.removeprefix("./")
        path = EVIDENCE / relative
        manifest_ok = manifest_ok and path.is_file() and sha256(path) == expected
    checks.append(("raw_manifest_hashes", manifest_ok))

    fixture_a = json.loads((EVIDENCE / "selector-fixture-a.ndjson").read_text(encoding="utf-8"))
    fixture_b = json.loads((EVIDENCE / "selector-fixture-b.ndjson").read_text(encoding="utf-8"))
    checks.append(("fixture_a_31_pass", fixture_a["status"] == "PASS"
                   and fixture_a["checks_passed"] == fixture_a["checks_total"] == 31))
    checks.append(("fixture_b_31_pass", fixture_b["status"] == "PASS"
                   and fixture_b["checks_passed"] == fixture_b["checks_total"] == 31))
    checks.append(("fixture_byte_equal",
                   (EVIDENCE / "selector-fixture-a.ndjson").read_bytes()
                   == (EVIDENCE / "selector-fixture-b.ndjson").read_bytes()))

    labels = ["1", "2", "4", "8", "16-a", "16-b"]
    rows = {label: ndjson(EVIDENCE / f"calibration-threads-{label}.ndjson")
            for label in labels}
    for label in labels:
        expected_threads = 16 if label.startswith("16") else int(label)
        complete = rows[label][-1]
        checks.append((f"calibration_{label}_complete",
                       len(rows[label]) == 4
                       and complete["status"] == "CALIBRATION_COMPLETE"
                       and complete["maximum_exponent"] == 2
                       and complete["threads"] == expected_threads
                       and complete["cumulative_subpanels"] == 7
                       and complete["cumulative_elementary_convolutions"] == 301))
        locks = all(row["candidate_evaluations"] == 0
                    and row["positive_parameter_samples"] == 0
                    and row["candidate_roots_created"] is False
                    and row["scientific_handler_linked"] is False
                    and row["authority_promoted"] is False
                    for row in rows[label])
        checks.append((f"calibration_{label}_locks", locks))
        checks.append((f"calibration_{label}_stderr_empty",
                       (EVIDENCE / f"calibration-threads-{label}.stderr").stat().st_size == 0))
        time_text = (EVIDENCE / f"calibration-threads-{label}.time").read_text(encoding="utf-8")
        checks.append((f"calibration_{label}_exit_zero", "Exit status: 0" in time_text))

    reference = semantic(rows["1"])
    checks.append(("all_thread_semantics_equal",
                   all(semantic(rows[label]) == reference for label in labels[1:])))
    checks.append(("six_calibrations_exact", len(rows) == 6))
    checks.append(("repeated_16_semantics_equal",
                   semantic(rows["16-a"]) == semantic(rows["16-b"])))

    flint = (EVIDENCE / "flint-threading.txt").read_text(encoding="utf-8")
    checks.append(("flint_pthread", "#define FLINT_USES_PTHREAD 1" in flint))
    checks.append(("flint_tls", "#define FLINT_USES_TLS 1" in flint))
    base_images = json.loads((EVIDENCE / "base-images-loaded.json").read_text(encoding="utf-8"))
    checks.append(("base_config_ids", {image["Id"] for image in base_images}
                   == EXPECTED_BASE_CONFIGS))
    vm = json.loads((EVIDENCE / "vm-metadata.json").read_text(encoding="utf-8"))
    checks.append(("vm_name", vm["name"] == "nhm2-h2-p4-c4-16-20260827"))
    checks.append(("vm_machine", vm["machineType"].endswith("/c4-standard-16")))
    checks.append(("vm_zone", vm["zone"].endswith("/us-central1-a")))
    checks.append(("vm_on_demand", vm["preempted"] == "FALSE"
                   and vm["scheduling"]["preemptible"] == "FALSE"))
    checks.append(("vm_balanced_disk", vm["disks"][0]["type"] == "HYPERDISK-BALANCED"))

    milliseconds = {label: candidate_ms(rows[label]) for label in labels}
    wall = {label: wall_seconds(EVIDENCE / f"calibration-threads-{label}.time")
            for label in labels}
    speedup = {label: milliseconds["1"] / value for label, value in milliseconds.items()}
    efficiency = {
        label: speedup[label] / (16 if label.startswith("16") else int(label))
        for label in labels
    }
    passed = sum(value for _, value in checks)
    verdict = "PASS" if passed == len(checks) else "FAIL"
    receipt = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p4_cloud_scaling_receipt.v1",
        "verdict": verdict,
        "candidate_neutral": True,
        "vm": {
            "name": vm["name"], "zone": "us-central1-a",
            "machine_type": "c4-standard-16", "cpu_platform": vm["cpuPlatform"],
            "external_ip": vm["networkInterfaces"][0]["accessConfigs"][0]["externalIp"],
            "disk_type": vm["disks"][0]["type"],
        },
        "archive_sha256": sha256(ARCHIVE),
        "fixture": {"checks_passed": 31, "checks_total": 31,
                    "repeat_byte_equal": fixture_a == fixture_b},
        "tested_threads": [1, 2, 4, 8, 16, 16],
        "calibration_count": 6,
        "all_thread_semantics_equal": all(semantic(rows[label]) == reference
                                            for label in labels),
        "candidate_milliseconds": milliseconds,
        "wall_seconds_with_oracle_and_container": wall,
        "candidate_speedup": speedup,
        "parallel_efficiency": efficiency,
        "base_config_sha256": sorted(EXPECTED_BASE_CONFIGS),
        "flint_uses_pthread": True,
        "flint_uses_tls": True,
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "scientific_handler_linked": False,
        "authority_promoted": False,
        "physical_authority": False,
        "propulsion_authority": False,
        "transport_authority": False,
    }
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n",
                            encoding="utf-8", newline="\n")
    audit = {
        "schema": "nhm2.g2h_e_s5.c08_h2_p4_independent_audit.v1",
        "verdict": verdict,
        "checks_passed": passed,
        "checks_total": len(checks),
        "checks": {name: value for name, value in checks},
        "receipt_sha256": sha256(receipt_path),
        "candidate_evaluations": 0,
        "positive_parameter_samples": 0,
        "candidate_roots_created": False,
        "authority_promoted": False,
    }
    audit_path.write_text(json.dumps(audit, indent=2, sort_keys=True) + "\n",
                          encoding="utf-8", newline="\n")
    print(json.dumps({"receipt": str(receipt_path),
                      "receipt_sha256": sha256(receipt_path),
                      "audit": str(audit_path),
                      "audit_sha256": sha256(audit_path),
                      **audit}, sort_keys=True))
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
