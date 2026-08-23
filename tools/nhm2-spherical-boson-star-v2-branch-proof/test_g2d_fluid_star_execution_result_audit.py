"""Producer-independent audit of the immutable G2D one-shot output prefix.

This audit imports and executes none of the candidate implementation sources.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1"
PREEXECUTION = OUTPUT / "preexecution-binding.json"
TERMINAL = OUTPUT / "terminal-receipt.json"
PRIMARY = OUTPUT / "primary"
IMPLEMENTATION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json"
BASE = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-fluid-star-preregistration.v1.json"
EXPECTED_FILES = {
    "preexecution-binding.json": "dfde4d74b7fbe6b73216cf0b263fc165c127820411b6f8ab61ffedd38acbf76c",
    "terminal-receipt.json": "25bc26daa110d7de50b2657325bb9d5c6c767482887ba79211c97c7f514ccc83",
}


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True,
                      separators=(",", ":")).encode("ascii")


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict[str, object]:
    value = json.loads(path.read_text("ascii"))
    if not isinstance(value, dict):
        raise ValueError(f"object required: {path}")
    return value


def verify_self_hash(value: dict[str, object]) -> None:
    expected = value["selfSha256"]
    preimage = dict(value)
    preimage["selfSha256"] = None
    actual = hashlib.sha256(canonical(preimage)).hexdigest()
    if actual != expected:
        raise AssertionError(f"self hash mismatch: {actual} != {expected}")


class G2DExecutionResultAudit(unittest.TestCase):
    def test_exact_immutable_prefix_inventory(self) -> None:
        self.assertTrue(OUTPUT.is_dir())
        entries = {path.relative_to(OUTPUT).as_posix(): path
                   for path in OUTPUT.rglob("*")}
        self.assertEqual(set(entries), {"preexecution-binding.json", "primary",
                                        "terminal-receipt.json"})
        self.assertTrue(PRIMARY.is_dir())
        self.assertFalse(PRIMARY.is_symlink())
        self.assertEqual(list(PRIMARY.iterdir()), [])
        for relative, expected in EXPECTED_FILES.items():
            self.assertEqual(sha(entries[relative]), expected, relative)

    def test_preexecution_binding_is_authentic(self) -> None:
        receipt = load(PREEXECUTION)
        verify_self_hash(receipt)
        self.assertEqual(receipt["schema"], "nhm2.g2d.fluid-star.preexecution-receipt.v1")
        self.assertEqual(receipt["status"], "PASS")
        self.assertIsNone(receipt["firstFail"])
        self.assertEqual(receipt["implementationManifestSha256"], sha(IMPLEMENTATION))
        self.assertTrue(all(value is False for value in receipt["authority"].values()))

    def test_terminal_failure_is_authentic_and_authority_neutral(self) -> None:
        receipt = load(TERMINAL)
        binding = load(IMPLEMENTATION)
        verify_self_hash(receipt)
        self.assertEqual(receipt["schema"], "nhm2.g2d.fluid-star.terminal-receipt.v1")
        self.assertEqual(receipt["status"], "FAIL")
        self.assertEqual(receipt["firstFail"], "primary_evaluator_failed:1")
        self.assertEqual(receipt["candidateId"], binding["candidateId"])
        self.assertEqual(receipt["manifestSha256"], sha(BASE))
        self.assertEqual(receipt["sourceSha256"], binding["orchestratorSourceSha256"])
        self.assertIsNone(receipt["runtimeManifestSha256"])
        self.assertIs(receipt["candidateAdmitted"], False)
        self.assertIs(receipt["classicalProofEstablished"], False)
        self.assertEqual(receipt["authority"], binding["authority"])
        self.assertTrue(all(value is False for value in receipt["authority"].values()))

    def test_chronology_stopped_before_any_duty_or_independent_lane(self) -> None:
        files = {path.name for path in OUTPUT.rglob("*") if path.is_file()}
        self.assertFalse(any(name.startswith("duty-") for name in files))
        self.assertFalse(os.path.lexists(OUTPUT / "independent"))
        terminal = load(TERMINAL)
        self.assertEqual(terminal["dutyId"], "terminal")
        self.assertEqual(terminal["dutyOrdinal"], 9)
        self.assertEqual(terminal["artifactInventory"], [])

    def test_failure_detail_is_not_present_in_the_evidence(self) -> None:
        terminal = load(TERMINAL)
        self.assertEqual(set(terminal).intersection({"stderr", "stdout", "exception"}), set())
        self.assertEqual(terminal["firstFail"], "primary_evaluator_failed:1")


if __name__ == "__main__":
    unittest.main()
