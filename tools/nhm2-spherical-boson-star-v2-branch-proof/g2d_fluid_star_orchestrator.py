#!/usr/bin/env python3
"""Authority-neutral G2D root owner and chronology coordinator.

This source contains no fluid-star equations or interval arithmetic and never
imports either evaluator. Default invocation is read-only preexecution. The
sole ``--execute`` path remains dependent on an exact external token.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from typing import Any, Final


ROOT: Final[Path] = Path(__file__).resolve().parents[2]
TOKEN_ENV: Final[str] = "NHM2_G2D_EXECUTION_TOKEN"
PRIMARY_RUNTIME_ENV: Final[str] = "NHM2_G2D_PRIMARY_RUNTIME_SHA256"
IMAGE_ENV: Final[str] = "NHM2_G2D_INDEPENDENT_IMAGE_ID"
TOKEN_DOMAIN: Final[bytes] = b"nhm2/g2d/fluid-star/one-shot-token/v1\n"
DUTY_IDS: Final[tuple[str, ...]] = (
    "parameter-domain", "origin", "interior", "matter-rails", "surface",
    "exterior", "infinity", "interval-replay",
)


class OrchestrationError(RuntimeError):
    pass


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True,
                      separators=(",", ":")).encode("ascii")


def sha_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def sha_file(path: Path) -> str:
    return sha_bytes(path.read_bytes())


def _ordinary(path: Path) -> None:
    if not path.is_file() or path.is_symlink():
        raise OrchestrationError(f"binding_not_ordinary:{path}")


def _load(path: Path) -> dict[str, Any]:
    raw = path.read_bytes()
    if any(byte > 127 for byte in raw):
        raise OrchestrationError(f"json_not_ascii:{path}")
    value = json.loads(raw.decode("ascii"))
    if not isinstance(value, dict):
        raise OrchestrationError(f"json_not_object:{path}")
    return value


def token_preimage(binding: dict[str, Any]) -> bytes:
    fields = {
        "baseManifestSha256": binding["baseManifestSha256"],
        "independentRuntimeManifestSha256": binding["independentRuntimeManifestSha256"],
        "independentSourceSha256": binding["independentSourceSha256"],
        "orchestratorSourceSha256": binding["orchestratorSourceSha256"],
        "outputRoot": binding["outputRoot"],
        "primaryRuntimeManifestSha256": binding["primaryRuntimeManifestSha256"],
        "primarySourceSha256": binding["primarySourceSha256"],
    }
    return TOKEN_DOMAIN + canonical(fields)


def verify_preexecution(manifest_path: Path) -> dict[str, Any]:
    _ordinary(manifest_path)
    binding = _load(manifest_path)
    if binding.get("schema") != "nhm2.g2d.fluid-star.implementation.v1":
        raise OrchestrationError("implementation_schema_mismatch")
    path_fields = {
        "baseManifestPath": "baseManifestSha256",
        "primarySourcePath": "primarySourceSha256",
        "independentSourcePath": "independentSourceSha256",
        "orchestratorSourcePath": "orchestratorSourceSha256",
        "primaryRuntimeManifestPath": "primaryRuntimeManifestSha256",
        "independentRuntimeManifestPath": "independentRuntimeManifestSha256",
    }
    for path_key, hash_key in path_fields.items():
        path = ROOT / binding[path_key]
        _ordinary(path)
        if sha_file(path) != binding[hash_key]:
            raise OrchestrationError(f"binding_hash_mismatch:{path_key}")
    if sha_bytes(token_preimage(binding)) != binding.get("executionToken"):
        raise OrchestrationError("execution_token_derivation_mismatch")
    authority = binding.get("authority")
    if not isinstance(authority, dict) or not authority or any(v is not False for v in authority.values()):
        raise OrchestrationError("authority_not_all_false")
    output = ROOT / binding["outputRoot"]
    if os.path.lexists(output):
        raise OrchestrationError("future_output_root_exists")
    primary_runtime = _load(ROOT / binding["primaryRuntimeManifestPath"])
    if sha_file(Path(sys.executable).resolve()) != primary_runtime["executableSha256"]:
        raise OrchestrationError("live_primary_runtime_mismatch")
    inspect = subprocess.run(
        ["docker", "image", "inspect", binding["independentImageId"], "--format", "{{.Id}}"],
        cwd=ROOT, capture_output=True, text=True, timeout=60, check=False,
    )
    if inspect.returncode or inspect.stdout.strip() != binding["independentImageId"]:
        raise OrchestrationError("live_independent_image_mismatch")
    return {
        "candidateEvaluated": False,
        "executionAuthorized": False,
        "futureOutputRootAbsent": True,
        "implementationManifestSha256": sha_file(manifest_path),
        "status": "PASS_PREEXECUTION",
    }


def _receipt(payload: dict[str, Any]) -> bytes:
    value = dict(payload)
    value["selfSha256"] = None
    value["selfSha256"] = sha_bytes(canonical(value))
    return canonical(value) + b"\n"


def _write_exclusive(path: Path, raw: bytes) -> None:
    path.parent.mkdir(parents=False, exist_ok=True)
    with path.open("xb") as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())
    if path.read_bytes() != raw:
        raise OrchestrationError(f"persistence_mismatch:{path}")


def _validate_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    duties = payload.get("result", payload).get("duties")
    if not isinstance(duties, list) or len(duties) != len(DUTY_IDS):
        raise OrchestrationError("evaluator_duty_inventory_invalid")
    for ordinal, (expected, duty) in enumerate(zip(DUTY_IDS, duties, strict=True)):
        if duty != {"id": expected, "ordinal": ordinal, "status": "PASS"}:
            raise OrchestrationError(f"evaluator_duty_mismatch:{ordinal}")
    return duties


def execute_once(manifest_path: Path) -> int:
    preflight = verify_preexecution(manifest_path)
    binding = _load(manifest_path)
    if os.environ.get(TOKEN_ENV) != binding["executionToken"]:
        raise OrchestrationError("explicit_execution_token_missing")
    output = ROOT / binding["outputRoot"]
    output.mkdir(parents=True, exist_ok=False)
    _write_exclusive(output / "preexecution-binding.json", _receipt({
        "authority": binding["authority"], "firstFail": None,
        "implementationManifestSha256": preflight["implementationManifestSha256"],
        "schema": "nhm2.g2d.fluid-star.preexecution-receipt.v1", "status": "PASS",
    }))
    lane_payloads: dict[str, dict[str, Any]] = {}
    commands = {
        "primary": [sys.executable, "-I", "-B", str(ROOT / binding["primarySourcePath"]),
                    "--execute", "--implementation-manifest", str(manifest_path),
                    "--lane-root", str(output / "primary")],
        "independent": ["docker", "run", "--rm", "--network", "none",
                    "--memory", "2048m", "--cpus", "1", "--pids-limit", "16",
                    "-e", f"{TOKEN_ENV}={binding['executionToken']}",
                    "-e", f"{IMAGE_ENV}={binding['independentImageId']}",
                    "-v", f"{ROOT}:/workspace", "-w", "/workspace",
                    binding["independentImageId"], "--execute",
                    "--implementation-manifest", "/workspace/" + manifest_path.relative_to(ROOT).as_posix(),
                    "--lane-root", "/workspace/" + (output / "independent").relative_to(ROOT).as_posix()],
    }
    env = dict(os.environ)
    env[PRIMARY_RUNTIME_ENV] = binding["primaryExecutableSha256"]
    for lane in ("primary", "independent"):
        lane_root = output / lane
        lane_root.mkdir(exist_ok=False)
        run = subprocess.run(commands[lane], cwd=ROOT, env=env, capture_output=True,
                             timeout=600, check=False)
        if run.returncode:
            raise OrchestrationError(f"{lane}_evaluator_failed:{run.returncode}")
        payload = json.loads(run.stdout.decode("ascii"))
        duties = _validate_payload(payload)
        lane_payloads[lane] = payload
        for duty in duties:
            name = f"duty-{duty['ordinal']:02d}-{duty['id']}.json"
            _write_exclusive(lane_root / name, _receipt({
                "artifactInventory": [], "authority": binding["authority"],
                "candidateId": binding["candidateId"], "dutyId": duty["id"],
                "dutyOrdinal": duty["ordinal"], "evaluatorPayload": payload if duty["ordinal"] == 0 else None,
                "firstFail": None, "manifestSha256": binding["baseManifestSha256"],
                "runtimeManifestSha256": binding[f"{lane}RuntimeManifestSha256"],
                "schema": "nhm2.g2d.fluid-star.duty-receipt.v1",
                "sourceSha256": binding[f"{lane}SourceSha256"], "status": "PASS",
            }))
    primary_result = lane_payloads["primary"]["result"]
    independent_result = lane_payloads["independent"]
    agreement = (
        primary_result["resolutionOrder"] == independent_result["resolutionOrder"]
        and primary_result["replayResidualCount"] == independent_result["replayResidualCount"]
    )
    if not agreement:
        raise OrchestrationError("independent_agreement_failed")
    runtime_pair_sha = sha_bytes(canonical([
        binding["primaryRuntimeManifestSha256"],
        binding["independentRuntimeManifestSha256"],
    ]))
    _write_exclusive(output / "duty-08-independent-agreement.json", _receipt({
        "artifactInventory": [], "authority": binding["authority"],
        "candidateId": binding["candidateId"], "dutyId": "independent-agreement",
        "dutyOrdinal": 8, "firstFail": None, "agreement": True,
        "intervalOverlapWitness": "zero is enclosed by every corresponding duty-07 interval in both PASS lanes",
        "manifestSha256": binding["baseManifestSha256"],
        "runtimeManifestSha256": runtime_pair_sha,
        "schema": "nhm2.g2d.fluid-star.agreement-receipt.v1",
        "sourceSha256": binding["orchestratorSourceSha256"], "status": "PASS",
    }))
    _write_exclusive(output / "terminal-receipt.json", _receipt({
        "artifactInventory": [], "authority": binding["authority"],
        "candidateAdmitted": False, "candidateId": binding["candidateId"],
        "classicalProofEstablished": False, "dutyId": "terminal",
        "dutyOrdinal": 9, "firstFail": None,
        "manifestSha256": binding["baseManifestSha256"],
        "runtimeManifestSha256": runtime_pair_sha,
        "schema": "nhm2.g2d.fluid-star.terminal-receipt.v1",
        "sourceSha256": binding["orchestratorSourceSha256"],
        "status": "PASS_DIAGNOSTIC_ONLY",
    }))
    return 0


def _args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--implementation-manifest", required=True, type=Path)
    parser.add_argument("--execute", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = _args()
    manifest = args.implementation_manifest.resolve()
    if args.execute:
        try:
            return execute_once(manifest)
        except Exception as exc:
            # Once the exclusive root exists, preserve the reached prefix and
            # append exactly one terminal failure receipt. Never remove, reuse,
            # or retry the root under this candidate identity.
            try:
                binding = _load(manifest)
                output = ROOT / binding["outputRoot"]
                terminal = output / "terminal-receipt.json"
                if output.is_dir() and not os.path.lexists(terminal):
                    _write_exclusive(terminal, _receipt({
                        "artifactInventory": [], "authority": binding["authority"],
                        "candidateAdmitted": False, "candidateId": binding["candidateId"],
                        "classicalProofEstablished": False, "dutyId": "terminal",
                        "dutyOrdinal": 9, "firstFail": str(exc),
                        "manifestSha256": binding["baseManifestSha256"],
                        "runtimeManifestSha256": None,
                        "schema": "nhm2.g2d.fluid-star.terminal-receipt.v1",
                        "sourceSha256": binding["orchestratorSourceSha256"],
                        "status": "FAIL",
                    }))
            except Exception:
                pass
            print(canonical({"firstFail": str(exc), "status": "FAIL"}).decode("ascii"), file=sys.stderr)
            return 1
    print(canonical(verify_preexecution(manifest)).decode("ascii"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
