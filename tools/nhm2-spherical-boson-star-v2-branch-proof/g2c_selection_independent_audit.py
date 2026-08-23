"""Independent, no-network replay of the frozen G2C selection table."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RESULT = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2c-selection-result.md"
PROTOCOL = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2c-evidence-and-selection-protocol.md"

ORDER = ("Q", "P", "C", "V", "E", "R", "F")
MINIMUM = (1, 1, 2, 1, 2, 1, 1)
EXPECTED = "sub-Buchdahl constant-density fluid star + scalar-QFT control"


def parse_rows(text: str) -> dict[str, tuple[int, ...]]:
    rows: dict[str, tuple[int, ...]] = {}
    pattern = re.compile(
        r"^\| (?P<name>[^|]+?) \| (?P<q>[0-2]) \| (?P<p>[0-2]) \|"
        r" (?P<c>[0-2]) \| (?P<v>[0-2]) \| (?P<e>[0-2]) \|"
        r" (?P<r>[0-2]) \| (?P<f>[0-2]) \|",
        re.MULTILINE,
    )
    for match in pattern.finditer(text):
        name = match.group("name").strip()
        rows[name] = tuple(int(match.group(key)) for key in ("q", "p", "c", "v", "e", "r", "f"))
    return rows


def audit() -> tuple[str, tuple[int, ...]]:
    protocol = PROTOCOL.read_text(encoding="utf-8")
    result = RESULT.read_text(encoding="utf-8")
    assert "(Q,P,C,V,E,R,F)" in protocol.replace(" ", "")
    assert "STOP_NO_ADMISSIBLE_FAMILY" in protocol
    assert "STOP_UNRESOLVED_EVIDENCE_TIE" in protocol

    rows = parse_rows(result)
    assert len(rows) == 4, rows
    survivors = {
        name: scores
        for name, scores in rows.items()
        if all(score >= floor for score, floor in zip(scores, MINIMUM, strict=True))
    }
    assert survivors
    maximum = max(survivors.values())
    winners = [name for name, scores in survivors.items() if scores == maximum]
    assert winners == [EXPECTED], winners
    assert maximum == (2, 2, 2, 2, 2, 2, 2)
    assert "Every candidate, proof, SI, lane, replay, lamp, Theory Graph, physical," in result
    return winners[0], maximum


if __name__ == "__main__":
    winner, vector = audit()
    print(f"PASS G2C independent selection audit: {winner} {dict(zip(ORDER, vector, strict=True))}")
