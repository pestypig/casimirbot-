#!/usr/bin/env python3
"""Normalize the authenticated P8C rescue archive for the frozen result audit."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

EXPECTED_ARCHIVE = "f0a0fabf608949d6755465ddc8f35075631818f383d6ba5eb78ab297152d3c4c"
EXPECTED_BINARY = "7e7d78393f933ac103208476f6e8c5beefb5de66b58d93a6b2a080bdf80deb25"
EXPECTED_PROPOSAL = "7e8f28d755b5dea7cc212c4d0fda263a84374215680b0a94a179fbb2fbca2ace"
EXPECTED_CORRECTION = "aade7e5d8d384500503b4ecd1b2f04f4afcf95bccffd735da309363d01d6c32b"
EXPECTED_MANIFEST = "78fdff467f3ededee3a18be0d6c2f94176a90b65b9e94da140f701f95d2fd868"
EXPECTED_VM = "nhm2-h2-p8c-diagnostic-c4-16-20260828"
EXPECTED_PROCESS = "nhm2-h2-p8c-diagnostic-process"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def first_hash(path: Path) -> str:
    return path.read_text(encoding="utf-8").split()[0]


def replay_raw_manifest(raw: Path) -> None:
    lines = (raw / "evidence-files.sha256").read_text(encoding="utf-8").splitlines()
    assert lines
    seen: set[str] = set()
    for line in lines:
        expected, name = line.split(maxsplit=1)
        name = name.removeprefix("./")
        candidate = raw / name
        assert name not in seen and not Path(name).is_absolute() and ".." not in Path(name).parts
        assert candidate.is_file() and sha256(candidate) == expected
        seen.add(name)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw", required=True, type=Path)
    parser.add_argument("--resource-stage", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    raw = args.raw.resolve()
    stage = args.resource_stage.resolve()
    output = args.output.resolve()
    assert raw.is_dir() and stage.is_dir() and not output.exists()

    replay_raw_manifest(raw)
    assert first_hash(raw / "archive.sha256") == EXPECTED_ARCHIVE
    assert first_hash(raw / "binary.sha256") == EXPECTED_BINARY
    bindings = dict(
        line.split("=", 1)
        for line in (raw / "authorization-bindings.txt").read_text(encoding="utf-8").splitlines()
        if "=" in line
    )
    assert bindings["proposal_sha256"] == EXPECTED_PROPOSAL
    assert bindings["correction_sha256"] == EXPECTED_CORRECTION
    assert bindings["vm"] == EXPECTED_VM

    run_lines = (raw / "run.stdout").read_text(encoding="utf-8").splitlines()
    assert len(run_lines) == 1
    record = json.loads(run_lines[0])
    assert record["schema"] == "nhm2.g2h_e_s5.c08_h2_p8c_diagnostic_run.v1"
    assert record["status"] == "FAIL" and record["phase"] == "h2_extend"
    assert record["candidate_evaluations"] == record["positive_parameter_samples"] == 0
    assert record["candidate_roots_created"] is False
    assert record["scientific_handler_linked"] is False
    assert record["authority_promoted"] is False
    assert (raw / "run.exit").read_text(encoding="utf-8").strip() == "1"
    assert (raw / "orchestrator.exit").read_text(encoding="utf-8").strip() == "1"
    assert (raw / "run.stderr").read_bytes() == b""

    instance = json.loads((stage / "original-instance-before.json").read_text(encoding="utf-8"))
    disk = json.loads((stage / "original-disk-before.json").read_text(encoding="utf-8"))
    assert instance["name"] == disk["name"] == EXPECTED_VM
    assert instance["status"] == "TERMINATED" and disk["status"] == "READY"
    assert str(instance["machineType"]).endswith("/machineTypes/c4-standard-16")
    assert str(instance["zone"]).endswith("/zones/us-central1-a")
    assert instance["scheduling"]["provisioningModel"] == "STANDARD"
    assert str(disk["type"]).endswith("/diskTypes/hyperdisk-balanced")
    assert str(disk["sizeGb"]) == "30"
    stopped = datetime.fromisoformat(instance["lastStopTimestamp"]).astimezone(timezone.utc)
    stop_utc = stopped.strftime("%Y-%m-%dT%H:%M:%SZ")

    output.mkdir(parents=True)
    for name in ("run.started.utc", "run.finished.utc", "run.stdout", "run.stderr", "run.exit"):
        shutil.copyfile(raw / name, output / name)
    for name, payload in (
        ("instance-prestop.json", instance),
        ("instance-poststop.json", instance),
        ("disk-prestop.json", disk),
        ("disk-poststop.json", disk),
    ):
        (output / name).write_text(json.dumps(payload, sort_keys=True) + "\n", encoding="utf-8")

    authority = {
        name: False
        for name in ("candidate", "proof", "geometry_state", "lane", "lamp", "physical", "propulsion", "transport")
    }
    disposition = {
        "additional_uploads": 0,
        "authority": authority,
        "forced_vm_stop": False,
        "frozen_candidate_evaluated": False,
        "protected_roots_created": 0,
        "result_kind": "FAIL",
        "retry_count": 0,
        "retune_used": False,
        "stop_capture_utc": stop_utc,
    }
    (output / "capture-disposition.json").write_text(
        json.dumps(disposition, sort_keys=True) + "\n", encoding="utf-8"
    )
    (output / "frozen-binding.txt").write_text(
        f"proposal_sha256={EXPECTED_PROPOSAL}\n"
        f"correction_sha256={EXPECTED_CORRECTION}\n"
        f"archive_sha256={EXPECTED_ARCHIVE}\n"
        f"manifest_sha256={EXPECTED_MANIFEST}\n"
        f"binary_sha256={EXPECTED_BINARY}\n"
        f"process_name={EXPECTED_PROCESS}\n",
        encoding="utf-8",
    )
    (output / "process-count.txt").write_text("1\n", encoding="utf-8")
    names = sorted(path.name for path in output.iterdir() if path.is_file())
    (output / "capture-files.sha256").write_text(
        "".join(f"{sha256(output / name)}  {name}\n" for name in names), encoding="utf-8"
    )
    print("P8C_R17_CAPTURE_NORMALIZED")
    print(stop_utc)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
