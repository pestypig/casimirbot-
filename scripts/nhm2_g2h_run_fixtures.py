#!/usr/bin/env python3
"""Run the frozen G2H no-candidate fixture harnesses exactly once."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BINDING_PATH = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-build-bindings.v1.json"
BINDING_SIDECAR = BINDING_PATH.with_suffix(".sha256")
OUTPUT_ROOT = ROOT / "artifacts/research/nhm2/g2h-fixtures-v1"
CANDIDATE_ROOTS = [
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-primary-v1",
    ROOT / "artifacts/research/nhm2/g2h/tolman-vii-independent-v1",
]


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical(payload: object) -> bytes:
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode() + b"\n"


def persist(name: str, payload: object) -> dict[str, object]:
    data = canonical(payload)
    path = OUTPUT_ROOT / name
    path.write_bytes(data)
    return {"name": name, "bytes": len(data), "sha256": sha256_bytes(data)}


def command(arguments: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(arguments, text=True, capture_output=True, check=False)


def main() -> int:
    if OUTPUT_ROOT.exists():
        raise SystemExit(f"exclusive fixture root already exists: {OUTPUT_ROOT}")
    if any(path.exists() for path in CANDIDATE_ROOTS):
        raise SystemExit("candidate evidence root exists before fixture execution")

    binding_bytes = BINDING_PATH.read_bytes()
    expected = BINDING_SIDECAR.read_text(encoding="ascii").split()[0]
    if sha256_bytes(binding_bytes) != expected:
        raise SystemExit("build binding digest mismatch")
    binding = json.loads(binding_bytes)
    if binding["candidate_execution_authorized"] or binding["candidate_evaluations"] != 0:
        raise SystemExit("build binding authority mismatch")

    OUTPUT_ROOT.mkdir(parents=True)
    artifacts: list[dict[str, object]] = []
    events: list[dict[str, object]] = []
    sequence = 0

    for lane in ("primary", "independent"):
        image = binding[lane]["image"]
        inspect = command(["docker", "image", "inspect", image, "--format", "{{.Id}}"])
        if inspect.returncode != 0 or inspect.stdout.strip() != binding[lane]["image_id"]:
            payload = {
                "schema": "nhm2.g2h.fixture_terminal.v1",
                "lane": lane,
                "failure": "IMAGE_ID_MISMATCH",
                "candidate_evaluations": 0,
            }
            artifacts.append(persist(f"{sequence:02d}-{lane}-terminal.json", payload))
            return 1
        sequence += 1
        events.append({"sequence": sequence, "lane": lane, "event": "image_identity_verified"})

        for fixture in binding_fixture_inventory():
            run = command(
                [
                    "docker",
                    "run",
                    "--rm",
                    "--network=none",
                    "--read-only",
                    "--cap-drop=ALL",
                    "--security-opt=no-new-privileges",
                    image,
                    "--fixture",
                    fixture,
                ]
            )
            sequence += 1
            try:
                observed = json.loads(run.stdout)
            except json.JSONDecodeError:
                observed = None
            passed = (
                run.returncode == 0
                and isinstance(observed, dict)
                and observed.get("pass") is True
                and observed.get("fixture") == fixture
                and observed.get("candidate_evaluations") == 0
                and observed.get("candidate_execution_authorized") is False
                and observed.get("classical_proof_established") is False
            )
            receipt = {
                "schema": "nhm2.g2h.fixture_receipt.v1",
                "sequence": sequence,
                "lane": lane,
                "image_id": binding[lane]["image_id"],
                "executable_sha256": binding[lane]["executable_sha256"],
                "fixture": fixture,
                "exit_code": run.returncode,
                "stdout_sha256": sha256_bytes(run.stdout.encode()),
                "stderr_sha256": sha256_bytes(run.stderr.encode()),
                "observation": observed,
                "pass": passed,
                "candidate_evaluations": 0,
                "candidate_execution_authorized": False,
            }
            artifacts.append(persist(f"{sequence:02d}-{lane}-{fixture}.json", receipt))
            events.append({"sequence": sequence, "lane": lane, "event": fixture, "pass": passed})
            if not passed:
                break
        if events[-1].get("pass") is False:
            break

    complete = len(artifacts) == 14 and all(event.get("pass", True) for event in events)
    roots_absent = all(not path.exists() for path in CANDIDATE_ROOTS)
    manifest = {
        "schema": "nhm2.g2h.fixture_evidence_manifest.v1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "binding_sha256": expected,
        "events": events,
        "artifacts": artifacts,
        "primary_fixture_count": sum(1 for item in events if item["lane"] == "primary" and "pass" in item),
        "independent_fixture_count": sum(1 for item in events if item["lane"] == "independent" and "pass" in item),
        "complete": complete and roots_absent,
        "candidate_roots_absent": roots_absent,
        "candidate_evaluations": 0,
        "candidate_execution_authorized": False,
        "proof_implementation_complete": False,
        "classical_proof_established": False,
        "geometry_state_accepted": False,
        "diagnostic_lamp": False,
        "physical_viability": False,
        "propulsion_authority": False,
        "transport_authority": False,
    }
    unsigned = canonical(manifest)
    manifest["self_hash"] = sha256_bytes(unsigned)
    artifacts.append(persist("fixture-manifest.json", manifest))
    print(canonical(manifest).decode(), end="")
    return 0 if manifest["complete"] else 1


def binding_fixture_inventory() -> list[str]:
    prebuild = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-prebuild-manifest.v1.json"
    return json.loads(prebuild.read_text(encoding="utf-8"))["fixture_inventory"]


if __name__ == "__main__":
    sys.exit(main())
