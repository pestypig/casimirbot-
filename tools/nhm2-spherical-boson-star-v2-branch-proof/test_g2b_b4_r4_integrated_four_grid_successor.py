"""Preexecution tests for the audited G2B-B4-R4 successor."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import struct
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("g2b_b4_r4_integrated_four_grid_successor.py")
SPEC = importlib.util.spec_from_file_location("g2b_b4_r4_integrated_four_grid_successor", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def digest(path: Path) -> tuple[int, str]:
    raw = path.read_bytes()
    return len(raw), hashlib.sha256(raw).hexdigest()


class G2BB4R4PreexecutionTests(unittest.TestCase):
    def test_packet_parent_and_receipt_bindings(self) -> None:
        self.assertEqual(digest(MODULE.PACKET_PATH), (MODULE.PACKET_SIZE_BYTES, MODULE.PACKET_SHA256))
        self.assertEqual(digest(MODULE.IMMUTABLE_RUNNER), (MODULE.IMMUTABLE_RUNNER_SIZE, MODULE.IMMUTABLE_RUNNER_SHA256))
        self.assertEqual(digest(MODULE.SUCCESSOR_RECEIPT), (7_212, MODULE.SUCCESSOR_RECEIPT_RAW_HASH))
        self.assertEqual(digest(MODULE.R3_RECEIPT), (5_971, MODULE.R3_RECEIPT_RAW_HASH))

    def test_prerequisite_receipts_and_payload_inventory(self) -> None:
        successor, r3 = MODULE._verify_prerequisite_receipts()
        self.assertEqual(successor["receiptSha256"], MODULE.SUCCESSOR_RECEIPT_SELF_HASH)
        self.assertEqual(r3["receiptSha256"], MODULE.R3_RECEIPT_SELF_HASH)
        self.assertEqual(r3["initializerPayloadTransformation"], "IDENTITY_NO_BYTE_CHANGES")
        self.assertFalse(r3["firstTargetOriginEqualityRequiredBeforeNewton"])

    def test_configuration_preserves_frozen_numerics_and_authority(self) -> None:
        b4 = MODULE.B4
        levels = b4.LEVEL_NODE_COUNTS
        schedule = b4.AMPLITUDE_SCHEDULE
        authority = dict(b4.AUTHORITY_LOCKS)
        radial = b4.RADIAL_SOURCE_BINDINGS
        MODULE.configure()
        self.assertEqual(b4.LEVEL_NODE_COUNTS, levels)
        self.assertEqual(b4.AMPLITUDE_SCHEDULE, schedule)
        self.assertEqual(b4.AUTHORITY_LOCKS, authority)
        self.assertEqual(b4.RADIAL_SOURCE_BINDINGS, radial)
        self.assertTrue(all(value is False for value in b4.AUTHORITY_LOCKS.values()))

    def test_exact_parent_assertion_is_the_only_predictor_source_deletion(self) -> None:
        parent = MODULE.IMMUTABLE_RUNNER.read_text(encoding="utf-8")
        self.assertEqual(parent.count(MODULE.REMOVED_ASSERTION), 1)
        self.assertIn('struct.pack(">d", state.varphi[0]) != struct.pack(">d", 2.0**-16)', parent)
        self.assertNotIn("2.0**-16", MODULE.B4.materialize_lowest_stage_state.__code__.co_consts)

    def test_materialized_predictor_is_unchanged_two_to_minus_ten(self) -> None:
        MODULE.configure()
        grid_module, _continuation, state_module, _cross_grid = MODULE.B4._load_execution_modules()
        rho = grid_module.generate_compactified_lobatto_grid(64).differentiation.rho
        state = MODULE.B4.materialize_lowest_stage_state(rho, state_module.RadialCollocationState)
        self.assertEqual(struct.pack(">d", state.varphi[0]).hex(), "3f50000000000000")
        self.assertEqual(struct.pack(">d", state.F0[0]).hex(), "bf5577dc22559451")
        self.assertEqual(struct.pack(">d", state.F1[0]).hex(), "3f5577dc22559451")

    def test_static_closure_emits_and_reopens_only_actual_root_paths(self) -> None:
        MODULE.configure()
        observed = MODULE._actual_root_static_closure()
        payloads = [item for item in observed if str(item["role"]).startswith("initializer_payload_")]
        self.assertEqual(len(payloads), 6)
        prefix = MODULE.INITIALIZER_ROOT.relative_to(ROOT).as_posix() + "/"
        for item in payloads:
            self.assertTrue(item["path"].startswith(prefix))
            self.assertNotIn("g2b-b1-r1-initializer-v1", item["path"])
            self.assertEqual(digest(ROOT / item["path"]), (item["sizeBytes"], item["rawSha256"]))

    def test_output_is_fresh_and_execution_environment_unchanged(self) -> None:
        self.assertFalse(MODULE.OUTPUT_ROOT.exists())
        self.assertEqual(MODULE.B4.IMAGE_ID, "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1")


if __name__ == "__main__":
    unittest.main()
