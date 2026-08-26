#!/usr/bin/env python3
"""Deterministic selector for the frozen NHM2 G2H-E-S3-R2 matrix.

This program evaluates literature metadata only. It does not solve, implement,
admit, or execute a scientific candidate.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MATRIX = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json"
PROTOCOL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md"
PROTOCOL_SUM = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.sha256"
AXES = ("S", "D", "L", "V", "K", "Q", "P", "B", "R", "F")
RANK_AXES = ("Q", "P", "K", "B", "R", "F", "S", "D", "L", "V")
FROZEN_IDS = {
    "MINI_BOSON_STAR_ELL0_SCALAR_QFT_CONTROL",
    "SOLITONIC_BOSON_STAR_SCALAR_QFT_CONTROL",
    "FUNDAMENTAL_SPHERICAL_PROCA_STAR_SCALAR_QFT_CONTROL",
    "FUNDAMENTAL_SPHERICAL_DIRAC_STAR_SCALAR_QFT_CONTROL",
    "SOURCE_DEFINED_C_INFINITY_COMPACT_FLUID_STAR_SCALAR_QFT_CONTROL",
    "QUADRATIC_REAL_SCALAR_OSCILLATON_QFT_CONTROL",
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def eligible(row: dict[str, object]) -> bool:
    score = row["scores"]
    assert isinstance(score, dict)
    return bool(
        score["S"] == 2
        and score["D"] == 2
        and score["L"] == 2
        and score["V"] == 2
        and score["K"] >= 1
        and score["Q"] >= 1
        and score["P"] >= 1
        and row.get("member_rule_available") is True
    )


def rank(scores: dict[str, int]) -> tuple[int, ...]:
    return (
        scores["Q"],
        min(scores[name] for name in AXES),
        sum(scores[name] for name in AXES),
        *(scores[name] for name in RANK_AXES[1:]),
    )


def select(rows: list[dict[str, object]]) -> dict[str, object]:
    ranked = [(row, rank(row["scores"])) for row in rows if eligible(row)]
    if not ranked:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": None}
    best = max(vector for _, vector in ranked)
    winners = [row for row, vector in ranked if vector == best]
    if len(winners) != 1:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": list(best)}
    winner = winners[0]
    return {
        "verdict": "SELECT_ONE",
        "selected_id": winner["id"],
        "scientific_identity": winner.get("scientific_identity"),
        "rank": list(best),
    }


def main() -> int:
    payload = json.loads(MATRIX.read_text(encoding="utf-8"))
    protocol_digest = sha256(PROTOCOL)
    sidecar_digest = PROTOCOL_SUM.read_text(encoding="ascii").split()[0]
    rows = payload["candidates"]
    checks = {
        "protocol_digest_matches_matrix": protocol_digest == payload["protocol_sha256"],
        "protocol_digest_matches_sidecar": protocol_digest == sidecar_digest,
        "candidate_pool_exact": {row["id"] for row in rows} == FROZEN_IDS,
        "candidate_count_exact": len(rows) == 6,
        "score_schema_exact": all(
            set(row["scores"]) == set(AXES)
            and all(type(row["scores"][axis]) is int and 0 <= row["scores"][axis] <= 2 for axis in AXES)
            for row in rows
        ),
        "r2_candidate_evaluations_zero": payload["r2_candidate_evaluations"] == 0,
        "historical_tolman_count_preserved": payload["historical_tolman_candidate_evaluations"] == 1,
        "execution_not_authorized": payload["candidate_execution_authorized"] is False,
        "authority_locked": all(value is False for value in payload["authority"].values()),
    }
    decision = select(rows)
    checks["decision_matches_frozen_expectation"] = decision == payload["expected_decision"]
    print(json.dumps({"schema": "nhm2.g2h_e_s3_r2.primary_selection.v1", "checks": checks, "decision": decision}, sort_keys=True, separators=(",", ":")))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
