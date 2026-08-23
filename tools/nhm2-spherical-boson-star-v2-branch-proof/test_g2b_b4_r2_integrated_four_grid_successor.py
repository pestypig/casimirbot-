"""Preexecution tests for the additive G2B-B4-R2 four-grid successor."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("g2b_b4_r2_integrated_four_grid_successor.py")
SPEC = importlib.util.spec_from_file_location("g2b_b4_r2_integrated_four_grid_successor", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def digest(path: Path) -> tuple[int, str]:
    raw = path.read_bytes()
    return len(raw), hashlib.sha256(raw).hexdigest()


class G2BB4R2PreexecutionTests(unittest.TestCase):
    def test_packet_runner_and_successor_bindings(self) -> None:
        self.assertEqual(digest(MODULE.PACKET_PATH), (3_641, MODULE.PACKET_SHA256))
        self.assertEqual(digest(MODULE.IMMUTABLE_RUNNER), (39_362, MODULE.IMMUTABLE_RUNNER_SHA256))
        self.assertEqual(digest(MODULE.SUCCESSOR_RECEIPT), (7_212, MODULE.SUCCESSOR_RECEIPT_RAW_HASH))

    def test_successor_receipt_and_inventory(self) -> None:
        receipt = MODULE._verify_successor_receipt()
        self.assertEqual(receipt["receiptSha256"], MODULE.SUCCESSOR_RECEIPT_SELF_HASH)
        self.assertFalse(receipt["fourGridExecutionAuthorized"])
        self.assertTrue(receipt["successorPacketPreparationUnlocked"])

    def test_configuration_changes_only_preregistered_binding_surface(self) -> None:
        b4 = MODULE.B4
        original_levels = b4.LEVEL_NODE_COUNTS
        original_schedule = b4.AMPLITUDE_SCHEDULE
        original_authority = dict(b4.AUTHORITY_LOCKS)
        MODULE.configure()
        self.assertEqual(b4.LEVEL_NODE_COUNTS, original_levels)
        self.assertEqual(b4.AMPLITUDE_SCHEDULE, original_schedule)
        self.assertEqual(b4.AUTHORITY_LOCKS, original_authority)
        self.assertEqual(b4.OUTPUT_ROOT, MODULE.OUTPUT_ROOT)
        self.assertEqual(b4.INITIALIZER_ROOT, MODULE.INITIALIZER_ROOT)
        self.assertEqual(b4.PAYLOAD_BINDINGS, MODULE.PAYLOAD_BINDINGS)
        self.assertEqual(b4.EXECUTION_TOKEN_ENV, MODULE.EXECUTION_TOKEN_ENV)

    def test_corrected_initializer_passes_immutable_scalar_contract(self) -> None:
        MODULE.configure()
        observation = MODULE.B4._validate_initializer_scalar_contract()
        self.assertTrue(observation["allRequiredBitsEqual"])
        self.assertIsNone(observation["firstMismatch"])
        self.assertTrue(all(item["bitEqual"] for item in observation["comparisons"]))

    def test_no_solver_or_materializer_is_imported_by_wrapper(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("radial_continuation.py", text)
        self.assertNotIn("materialize_initializer_from_m5", text)
        self.assertNotIn("g2b_m5_r1_initializer_materializer", text)

    def test_original_b4_failure_and_runner_are_immutable(self) -> None:
        terminal = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-four-grid-v1/terminal-receipt.json"
        self.assertEqual(digest(terminal), (2_222, "871dd86266e77b85ce55552e319ea39f29736ee6a4b4260bc51dc4527b95f9eb"))
        self.assertEqual(digest(MODULE.IMMUTABLE_RUNNER), (39_362, MODULE.IMMUTABLE_RUNNER_SHA256))

    def test_production_output_absent(self) -> None:
        self.assertFalse(MODULE.OUTPUT_ROOT.exists())


if __name__ == "__main__":
    unittest.main()
