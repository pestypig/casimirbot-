#!/usr/bin/env python3
"""Deterministic primary selector for the frozen NHM2 G2F evidence matrix.

This program performs no scientific candidate evaluation.  It validates the
pre-literature protocol binding and applies the frozen evidence-ranking rule.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2f-evidence-matrix.json"
PROTOCOL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2f-selection-protocol.md"
PROTOCOL_SUM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2f-selection-protocol.sha256"
AXES = ("N", "D", "P", "Q", "B", "V", "R", "F")
RANK_AXES = ("Q", "P", "D", "B", "V", "R", "F")
FROZEN_IDS = {
    "TOLMAN_VII_ISOTROPIC_FLUID_SCALAR_QFT_CONTROL",
    "BUCHDAHL_GASEOUS_FLUID_SCALAR_QFT_CONTROL",
    "GROUND_STATE_ELL1_BOSON_STAR_SCALAR_QFT_CONTROL",
    "FUNDAMENTAL_SPHERICAL_PROCA_STAR_SCALAR_QFT_CONTROL",
    "QUADRATIC_REAL_SCALAR_OSCILLATON_QFT_CONTROL",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def rank(scores: dict[str, int]) -> tuple[int, ...]:
    minimum = min(scores[name] for name in RANK_AXES)
    total = sum(scores[name] for name in AXES)
    return (minimum, total, *(scores[name] for name in RANK_AXES))


def eligible(row: dict[str, object]) -> bool:
    score = row["scores"]
    assert isinstance(score, dict)
    identifier = str(row["id"]).upper()
    immutable_exclusion = any(
        token in identifier
        for token in ("G2D", "CONSTANT_DENSITY", "INTERIOR_SCHWARZSCHILD", "INCOMPRESSIBLE_FLUID")
    )
    return bool(
        not immutable_exclusion
        and score["N"] == 2
        and score["D"] == 2
        and score["P"] >= 1
        and score["Q"] >= 1
        and score["B"] >= 1
        and row["member_rule_available"] is True
    )


def select(rows: list[dict[str, object]]) -> dict[str, object]:
    admitted = [(row, rank(row["scores"])) for row in rows if eligible(row)]
    if not admitted:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": None}
    maximum = max(item[1] for item in admitted)
    winners = [row for row, row_rank in admitted if row_rank == maximum]
    if len(winners) != 1:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": list(maximum)}
    winner = winners[0]
    return {
        "verdict": "SELECT_ONE",
        "selected_id": winner["id"],
        "scientific_identity": winner.get("scientific_identity"),
        "rank": list(maximum),
    }


def main() -> int:
    payload = json.loads(MATRIX.read_text(encoding="utf-8"))
    digest = sha256(PROTOCOL)
    sidecar = PROTOCOL_SUM.read_text(encoding="ascii").split()[0]
    checks = {
        "protocol_digest_matches_matrix": digest == payload["protocol_sha256"],
        "protocol_digest_matches_sidecar": digest == sidecar,
        "candidate_pool_exact": {row["id"] for row in payload["candidates"]} == FROZEN_IDS,
        "candidate_count_exact": len(payload["candidates"]) == 5,
        "zero_candidate_evaluations": payload["candidate_evaluations"] == 0,
        "execution_not_authorized": payload["candidate_execution_authorized"] is False,
        "scores_are_total_bounded_integers": all(
            set(row["scores"]) == set(AXES)
            and all(type(row["scores"][name]) is int and 0 <= row["scores"][name] <= 2 for name in AXES)
            for row in payload["candidates"]
        ),
        "g2d_identity_absent": all(
            "G2D" not in row["id"]
            and "CONSTANT_DENSITY" not in row["id"]
            and "INTERIOR_SCHWARZSCHILD" not in row["id"]
            and "INCOMPRESSIBLE_FLUID" not in row["id"]
            for row in payload["candidates"]
        ),
        "authority_locked": all(value is False for value in payload["authority"].values()),
    }
    decision = select(payload["candidates"])
    checks["decision_matches_frozen_expectation"] = decision == payload["expected_decision"]
    result = {"schema": "nhm2.g2f.primary_selection.v1", "checks": checks, "decision": decision}
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
