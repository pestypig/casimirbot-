#!/usr/bin/env python3
"""Producer-independent replay of the G2F selection decision.

Intentionally does not import the primary selector.  It independently checks
the protocol bytes, reconstructs eligibility/ranks, and exercises stop behavior.
"""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
DATA_PATH = BASE / "docs/research/nhm2-spherical-boson-star-v2-g2f-evidence-matrix.json"
RULE_PATH = BASE / "docs/research/nhm2-spherical-boson-star-v2-g2f-selection-protocol.md"
FIELDS = ["N", "D", "P", "Q", "B", "V", "R", "F"]
ORDERED = ["Q", "P", "D", "B", "V", "R", "F"]


def replay(rows: list[dict[str, object]]) -> dict[str, object]:
    ranked: list[tuple[list[int], dict[str, object]]] = []
    for item in rows:
        values = item["scores"]
        assert isinstance(values, dict)
        name = str(item["id"]).upper()
        excluded = any(
            word in name
            for word in ("G2D", "CONSTANT_DENSITY", "INTERIOR_SCHWARZSCHILD", "INCOMPRESSIBLE_FLUID")
        )
        passes = (
            not excluded
            and values["N"] == 2
            and values["D"] == 2
            and values["P"] >= 1
            and values["Q"] >= 1
            and values["B"] >= 1
            and item.get("member_rule_available") is True
        )
        if passes:
            vector = [
                min(values[key] for key in ORDERED),
                sum(values[key] for key in FIELDS),
                *[values[key] for key in ORDERED],
            ]
            ranked.append((vector, item))
    if not ranked:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": None}
    best = max(vector for vector, _ in ranked)
    leaders = [item for vector, item in ranked if vector == best]
    if len(leaders) != 1:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": best}
    leader = leaders[0]
    return {
        "verdict": "SELECT_ONE",
        "selected_id": leader["id"],
        "scientific_identity": leader.get("scientific_identity"),
        "rank": best,
    }


def fixture(identifier: str, scores: dict[str, int], member: bool = True) -> dict[str, object]:
    return {"id": identifier, "scores": scores, "member_rule_available": member}


def main() -> int:
    matrix = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    matrix_before = copy.deepcopy(matrix)
    actual_hash = hashlib.sha256(RULE_PATH.read_bytes()).hexdigest()
    final = replay(matrix["candidates"])
    base_score = {"N": 2, "D": 2, "P": 1, "Q": 1, "B": 1, "V": 1, "R": 1, "F": 1}

    excluded = fixture("G2D_CONSTANT_DENSITY_REBRAND", dict(base_score))
    valid = fixture("FRESH", dict(base_score))
    hard_fail = fixture("MISSING_INFINITY", dict(base_score))
    hard_fail["scores"]["D"] = 1
    unique_high = fixture("HIGH", {key: 2 for key in FIELDS})
    unique_low = fixture("LOW", dict(base_score))
    tied_a = fixture("TIE_A", dict(base_score))
    tied_b = fixture("TIE_B", dict(base_score))

    checks = {
        "protocol_digest": actual_hash == matrix["protocol_sha256"],
        "final_matrix": final == matrix["expected_decision"],
        "exclusion_fixture": replay([excluded, valid])["selected_id"] == "FRESH",
        "hard_gate_fixture": replay([hard_fail])["verdict"] == "NO_SELECTION",
        "unique_winner_fixture": replay([unique_low, unique_high])["selected_id"] == "HIGH",
        "exact_tie_fixture": replay([tied_a, tied_b])["verdict"] == "NO_SELECTION",
        "no_member_rule_fixture": replay([fixture("NO_MEMBER", dict(base_score), False)])["verdict"] == "NO_SELECTION",
        "authority_fixture": all(flag is False for flag in matrix["authority"].values()),
        "matrix_unchanged_by_replay": matrix == matrix_before,
    }
    print(json.dumps({"schema": "nhm2.g2f.independent_replay.v1", "checks": checks, "decision": final}, sort_keys=True, separators=(",", ":")))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
