#!/usr/bin/env python3
"""Read-only G2D fluid-star preregistration guard.

This module validates frozen definition bytes and absence conditions. It must
never import or execute either future candidate evaluator.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from typing import Any


MANIFEST_RELATIVE = Path(
    "docs/research/nhm2-spherical-boson-star-v2-"
    "g2d-fluid-star-preregistration.v1.json"
)
EXPECTED_MANIFEST_SHA256 = (
    "e39c602925a47caecb2600cd178e664ff53fb6b7900818aad2b8b4ec890afa40"
)
FUTURE_ROOT_RELATIVE = Path(
    "artifacts/nhm2-spherical-boson-star-v2-g2d/"
    "fluid-star-chi-1-over-4-v1"
)
FUTURE_SOURCE_RELATIVES = (
    Path(
        "tools/nhm2-spherical-boson-star-v2-branch-proof/"
        "g2d_fluid_star_primary.py"
    ),
    Path(
        "tools/nhm2-spherical-boson-star-v2-branch-proof/"
        "g2d_fluid_star_independent.c"
    ),
)
EXPECTED_DUTIES = (
    "parameter-domain",
    "origin",
    "interior",
    "matter-rails",
    "surface",
    "exterior",
    "infinity",
    "interval-replay",
    "independent-agreement",
)
EXPECTED_RESOLUTIONS = [64, 96, 128, 256]


class GuardFailure(RuntimeError):
    """A preregistration binding or absence condition failed."""


def _reject_duplicate_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise GuardFailure(f"duplicate_json_key:{key}")
        result[key] = value
    return result


def _load_manifest(path: Path) -> tuple[bytes, dict[str, Any]]:
    raw = path.read_bytes()
    if any(byte > 0x7F for byte in raw):
        raise GuardFailure("manifest_not_ascii")
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_MANIFEST_SHA256:
        raise GuardFailure(f"manifest_hash_mismatch:{digest}")
    try:
        payload = json.loads(
            raw.decode("ascii"), object_pairs_hook=_reject_duplicate_pairs
        )
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise GuardFailure(f"manifest_json_invalid:{exc}") from exc
    if not isinstance(payload, dict):
        raise GuardFailure("manifest_root_not_object")
    return raw, payload


def validate(repo_root: Path) -> dict[str, Any]:
    root = repo_root.resolve(strict=True)
    manifest_path = root / MANIFEST_RELATIVE
    _, payload = _load_manifest(manifest_path)

    if payload.get("schema") != "nhm2.g2d.fluid-star.preregistration.v1":
        raise GuardFailure("schema_mismatch")
    if payload.get("status") != (
        "SEALED_DEFINITION_NO_EXECUTION_IMPLEMENTATION_CHECKPOINT_PENDING"
    ):
        raise GuardFailure("status_mismatch")

    candidate = payload.get("candidate", {})
    if candidate.get("candidateId") != (
        "nhm2-fluid-star-constant-density-chi-1-over-4-v1"
    ):
        raise GuardFailure("candidate_identity_mismatch")
    if candidate.get("parameters") != {
        "M": "1/8",
        "R": "1",
        "chi": "2*M/R=1/4",
        "rhoHat": "3/4",
        "surfaceLapse": "sqrt(3)/2",
    }:
        raise GuardFailure("candidate_parameters_mismatch")

    duties = payload.get("proofDutyOrder")
    if not isinstance(duties, list):
        raise GuardFailure("proof_duties_not_array")
    ids = tuple(duty.get("id") for duty in duties)
    ordinals = tuple(duty.get("ordinal") for duty in duties)
    if ids != EXPECTED_DUTIES or ordinals != tuple(range(len(EXPECTED_DUTIES))):
        raise GuardFailure("proof_duty_order_mismatch")
    if payload.get("replayGrids", {}).get("resolutionOrder") != EXPECTED_RESOLUTIONS:
        raise GuardFailure("replay_grid_mismatch")

    checkpoint = payload.get("executionCheckpoint", {})
    if checkpoint.get("exactCommand") is not None or checkpoint.get("token") is not None:
        raise GuardFailure("premature_command_or_token")
    if checkpoint.get("implementationComplete") is not False:
        raise GuardFailure("premature_implementation_claim")
    if checkpoint.get("runtimeManifestsAdmitted") is not False:
        raise GuardFailure("premature_runtime_admission")

    authority = payload.get("authority")
    if not isinstance(authority, dict) or not authority:
        raise GuardFailure("authority_map_missing")
    if any(value is not False for value in authority.values()):
        raise GuardFailure("authority_not_false")

    future_root = root / FUTURE_ROOT_RELATIVE
    if os.path.lexists(future_root):
        raise GuardFailure("future_output_root_exists")
    for relative in FUTURE_SOURCE_RELATIVES:
        if os.path.lexists(root / relative):
            raise GuardFailure(f"future_candidate_evaluator_exists:{relative.as_posix()}")

    return {
        "authorityAllFalse": True,
        "candidateEvaluatorSourcesAbsent": True,
        "executionAuthorized": False,
        "futureOutputRootAbsent": True,
        "manifestSha256": EXPECTED_MANIFEST_SHA256,
        "proofDutyCount": len(EXPECTED_DUTIES),
        "status": "PASS_NO_EXECUTION",
    }


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    try:
        result = validate(args.repo_root)
    except (GuardFailure, FileNotFoundError, OSError) as exc:
        print(json.dumps({"status": "FAIL", "firstFail": str(exc)}, sort_keys=True))
        return 1
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
