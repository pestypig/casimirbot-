#!/usr/bin/env python3
"""Producer-independent replay for the R2 smooth-family selection.

This file intentionally does not import the primary selector.
"""

from __future__ import annotations

import copy
import hashlib
import json
import sys
from pathlib import Path


BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-evidence-matrix.json"
RULE = BASE / "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s3-r2-selection-protocol.md"
FIELDS = ["S", "D", "L", "V", "K", "Q", "P", "B", "R", "F"]


def replay(rows: list[dict[str, object]]) -> dict[str, object]:
    admitted: list[tuple[list[int], dict[str, object]]] = []
    for item in rows:
        value = item["scores"]
        assert isinstance(value, dict)
        passes = (
            value["S"] == value["D"] == value["L"] == value["V"] == 2
            and value["K"] >= 1
            and value["Q"] >= 1
            and value["P"] >= 1
            and item.get("member_rule_available") is True
        )
        if passes:
            vector = [
                value["Q"],
                min(value[field] for field in FIELDS),
                sum(value[field] for field in FIELDS),
                value["P"], value["K"], value["B"], value["R"], value["F"],
                value["S"], value["D"], value["L"], value["V"],
            ]
            admitted.append((vector, item))
    if not admitted:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": None}
    best = max(vector for vector, _ in admitted)
    winners = [row for vector, row in admitted if vector == best]
    if len(winners) != 1:
        return {"verdict": "NO_SELECTION", "selected_id": None, "rank": best}
    winner = winners[0]
    return {
        "verdict": "SELECT_ONE",
        "selected_id": winner["id"],
        "scientific_identity": winner.get("scientific_identity"),
        "rank": best,
    }


def fixture(name: str, changes: dict[str, int] | None = None, member: bool = True) -> dict[str, object]:
    scores = {field: 2 for field in FIELDS}
    if changes:
        scores.update(changes)
    return {"id": name, "scores": scores, "member_rule_available": member}


def main() -> int:
    matrix = json.loads(DATA.read_text(encoding="utf-8"))
    before = copy.deepcopy(matrix)
    actual = replay(matrix["candidates"])
    hard_fixtures = {
        axis: replay([fixture(f"FAIL_{axis}", {axis: 1 if axis in ("S", "D", "L", "V") else 0})])["verdict"] == "NO_SELECTION"
        for axis in ("S", "D", "L", "V", "K", "Q", "P")
    }
    lower = fixture("LOW", {"Q": 1, "B": 1, "R": 1, "F": 1})
    higher = fixture("HIGH")
    tied_a = fixture("TIE_A", {"Q": 1})
    tied_b = fixture("TIE_B", {"Q": 1})
    checks = {
        "protocol_digest": hashlib.sha256(RULE.read_bytes()).hexdigest() == matrix["protocol_sha256"],
        "final_decision": actual == matrix["expected_decision"],
        "each_hard_gate_fails_closed": all(hard_fixtures.values()),
        "hard_fixture_count": len(hard_fixtures) == 7,
        "missing_member_fails_closed": replay([fixture("NO_MEMBER", member=False)])["verdict"] == "NO_SELECTION",
        "unique_winner_fixture": replay([lower, higher])["selected_id"] == "HIGH",
        "exact_tie_fixture": replay([tied_a, tied_b])["verdict"] == "NO_SELECTION",
        "authority_locked": all(flag is False for flag in matrix["authority"].values()),
        "matrix_unchanged": matrix == before,
    }
    print(json.dumps({"schema": "nhm2.g2h_e_s3_r2.independent_replay.v1", "checks": checks, "hard_fixtures": hard_fixtures, "decision": actual}, sort_keys=True, separators=(",", ":")))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
