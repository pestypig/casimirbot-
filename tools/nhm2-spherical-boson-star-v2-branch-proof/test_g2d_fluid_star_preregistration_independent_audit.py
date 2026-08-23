"""Source-independent read-only audit of the G2D preregistration seal.

This test intentionally does not import the primary guard.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import unittest


HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
MANIFEST = REPO / (
    "docs/research/nhm2-spherical-boson-star-v2-"
    "g2d-fluid-star-preregistration.v1.json"
)
CHECKPOINT = REPO / (
    "docs/research/nhm2-spherical-boson-star-v2-"
    "g2d-fluid-star-preregistration-checkpoint.md"
)
EXPECTED_SHA256 = "e39c602925a47caecb2600cd178e664ff53fb6b7900818aad2b8b4ec890afa40"
FUTURE_ROOT = REPO / (
    "artifacts/nhm2-spherical-boson-star-v2-g2d/"
    "fluid-star-chi-1-over-4-v1"
)
FUTURE_SOURCES = (
    REPO / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/"
        "g2d_fluid_star_primary.py"
    ),
    REPO / (
        "tools/nhm2-spherical-boson-star-v2-branch-proof/"
        "g2d_fluid_star_independent.c"
    ),
)


class G2DFluidStarIndependentAudit(unittest.TestCase):
    def test_definition_hash_schema_and_authority(self) -> None:
        raw = MANIFEST.read_bytes()
        self.assertEqual(hashlib.sha256(raw).hexdigest(), EXPECTED_SHA256)
        self.assertTrue(all(byte < 128 for byte in raw))
        payload = json.loads(raw.decode("ascii"))
        self.assertEqual(payload["schema"], "nhm2.g2d.fluid-star.preregistration.v1")
        self.assertEqual(payload["candidate"]["parameters"]["chi"], "2*M/R=1/4")
        self.assertEqual(
            [entry["ordinal"] for entry in payload["proofDutyOrder"]],
            list(range(9)),
        )
        self.assertTrue(all(value is False for value in payload["authority"].values()))
        self.assertFalse(payload["executionCheckpoint"]["implementationComplete"])
        self.assertFalse(payload["executionCheckpoint"]["runtimeManifestsAdmitted"])

    def test_absence_is_reimplemented_without_guard_import(self) -> None:
        self.assertFalse(os.path.lexists(FUTURE_ROOT))
        for source in FUTURE_SOURCES:
            self.assertFalse(os.path.lexists(source), source)

    def test_manifest_has_no_accidental_float_values(self) -> None:
        payload = json.loads(MANIFEST.read_text("ascii"))

        def walk(value: object) -> None:
            self.assertNotIsInstance(value, float)
            if isinstance(value, dict):
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(payload)

    def test_checkpoint_inventory_rehashes_without_guard_import(self) -> None:
        inventory: dict[str, str] = {}
        inside = False
        for line in CHECKPOINT.read_text("utf-8").splitlines():
            if line == "```text checkpoint-inventory":
                inside = True
                continue
            if inside and line == "```":
                break
            if inside and line:
                digest, relative = line.split("  ", 1)
                inventory[relative] = digest
        self.assertEqual(len(inventory), 5)
        for relative, expected in inventory.items():
            self.assertEqual(
                hashlib.sha256((REPO / relative).read_bytes()).hexdigest(),
                expected,
                relative,
            )


if __name__ == "__main__":
    unittest.main()
