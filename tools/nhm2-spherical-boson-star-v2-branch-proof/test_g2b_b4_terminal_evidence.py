"""Independent read-only audit of the immutable G2B-B4 terminal evidence."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
import struct
import unittest


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "artifacts" / "nhm2-spherical-boson-star-v2-g2" / "g2b-b4-four-grid-v1"
PREEXECUTION = OUTPUT / "preexecution-binding.json"
TERMINAL = OUTPUT / "terminal-receipt.json"
CHECKPOINT = ROOT / "docs" / "research" / "nhm2-spherical-boson-star-v2-g2b-b4-execution-checkpoint.md"
RUNNER = ROOT / "tools" / "nhm2-spherical-boson-star-v2-branch-proof" / "g2b_b4_integrated_four_grid_runner.py"
SEALED_TEST = ROOT / "tools" / "nhm2-spherical-boson-star-v2-branch-proof" / "test_g2b_b4_integrated_four_grid_runner.py"


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=True, allow_nan=False, sort_keys=True, separators=(",", ":")).encode("ascii")


def digest(path: Path) -> tuple[int, str]:
    raw = path.read_bytes()
    return len(raw), hashlib.sha256(raw).hexdigest()


class G2BB4TerminalEvidenceTests(unittest.TestCase):
    def test_exact_output_inventory_and_raw_hashes(self) -> None:
        self.assertEqual(sorted(path.name for path in OUTPUT.iterdir()), ["preexecution-binding.json", "terminal-receipt.json"])
        self.assertEqual(digest(PREEXECUTION), (6_781, "7ec34f65e4999b9cd96be90bd3e5e2c8c61880e88c73fb31556995eeb3c2978e"))
        self.assertEqual(digest(TERMINAL), (2_222, "871dd86266e77b85ce55552e319ea39f29736ee6a4b4260bc51dc4527b95f9eb"))

    def test_preexecution_self_hash_and_transitive_implementation_binding(self) -> None:
        raw = PREEXECUTION.read_bytes()
        receipt = json.loads(raw)
        self.assertEqual(canonical(receipt), raw)
        observed = receipt.pop("receiptSha256")
        unsigned = canonical(receipt)
        expected = hashlib.sha256(
            b"nhm2-spherical-boson-star-v2/g2b-b4-preexecution-binding/v1\n"
            + struct.pack("<Q", len(unsigned)) + unsigned
        ).hexdigest()
        self.assertEqual(observed, expected)
        bindings = {item["role"]: item for item in receipt["sourceAndPayloadBindings"]}
        self.assertEqual(bindings["execution_checkpoint"]["rawSha256"], "e92aa03bcadeff63ae7338b462ec62cfd545f6c3ef3c6a627714c41c13b60b6e")
        self.assertEqual(digest(CHECKPOINT), (3_189, bindings["execution_checkpoint"]["rawSha256"]))
        checkpoint = CHECKPOINT.read_text(encoding="utf-8")
        self.assertEqual(digest(RUNNER), (39_362, "f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f"))
        self.assertEqual(digest(SEALED_TEST), (6_292, "d9c8b339603c5137a4a976a591d902b5d58a0bbd0882924230d425b7475e7337"))
        self.assertIn("f7045b47d61f7eb875c5ce8d9f3c60bbc424bf7c15690bb153029961adedf77f", checkpoint)
        self.assertIn("d9c8b339603c5137a4a976a591d902b5d58a0bbd0882924230d425b7475e7337", checkpoint)

    def test_terminal_self_hash_first_failure_and_locks(self) -> None:
        raw = TERMINAL.read_bytes()
        receipt = json.loads(raw)
        self.assertEqual(canonical(receipt), raw)
        observed = receipt.pop("receiptSha256")
        unsigned = canonical(receipt)
        expected = hashlib.sha256(
            b"nhm2-spherical-boson-star-v2/g2b-b4-terminal-receipt/v1\n"
            + struct.pack("<Q", len(unsigned)) + unsigned
        ).hexdigest()
        self.assertEqual(observed, expected)
        self.assertEqual(receipt["status"], "FAIL")
        self.assertEqual(receipt["attemptedLevelCount"], 0)
        self.assertEqual(receipt["levelReceipts"], [])
        self.assertFalse(receipt["allFourLevelsCompleted"])
        self.assertFalse(receipt["allThreeAdjacentPairsEvaluated"])
        self.assertFalse(receipt["vacuumContinuationWorkUnlocked"])
        self.assertTrue(receipt["noRetry"])
        self.assertTrue(receipt["noRetune"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))
        failure = receipt["firstFailure"]
        self.assertEqual(failure["code"], "g2b_b4_initializer_scalar_recomputation_mismatch")
        self.assertEqual(failure["levelIndex"], 0)
        detail = json.loads(failure["detail"])
        self.assertEqual(detail["firstMismatch"], "N0")
        comparisons = {item["field"]: item for item in detail["comparisons"]}
        self.assertEqual(comparisons["N0"]["recomputedBinary64Word"], "40485fa24bc6145c")
        self.assertEqual(comparisons["N0"]["payloadBinary64Word"], "40485fa24bc6145b")
        self.assertEqual(comparisons["sigma"]["recomputedBinary64Word"], "40025ff41467e26d")
        self.assertEqual(comparisons["sigma"]["payloadBinary64Word"], "3fe815d49929ae09")


if __name__ == "__main__":
    unittest.main()

