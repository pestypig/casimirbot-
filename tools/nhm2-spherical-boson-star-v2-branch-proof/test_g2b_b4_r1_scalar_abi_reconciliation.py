"""Preexecution tests for the bounded G2B-B4-R1 scalar-ABI repair."""

from __future__ import annotations

import hashlib
import importlib.util
from pathlib import Path
import struct
import sys
import unittest

import gmpy2


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("g2b_b4_r1_scalar_abi_reconciliation.py")
SPEC = importlib.util.spec_from_file_location("g2b_b4_r1_scalar_abi_reconciliation", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


class G2BB4R1ScalarABIReconciliationTests(unittest.TestCase):
    def test_static_evidence_closure_is_exact(self) -> None:
        for role, relative, size, expected in MODULE.STATIC_BINDINGS:
            raw = (ROOT / relative).read_bytes()
            self.assertEqual((len(raw), digest(raw)), (size, expected), role)
        for relative, size, expected in MODULE.INPUT_PAYLOADS:
            raw = (MODULE.INPUT_ROOT / relative).read_bytes()
            self.assertEqual((len(raw), digest(raw)), (size, expected), relative)

    def test_parent_receipts_remain_fail_closed_and_self_hashed(self) -> None:
        MODULE._verify_parent_receipts()

    def test_corrected_graph_has_frozen_words_and_hash(self) -> None:
        scalars = (MODULE.INPUT_ROOT / "scalars.f64le").read_bytes()
        join = (MODULE.INPUT_ROOT / "initializer/core_L2_join_barrier.f64le").read_bytes()
        raw, words, diagnostics = MODULE.derive_corrected_scalars(scalars, join)
        self.assertEqual(words, MODULE.EXPECTED_WORDS)
        self.assertEqual(digest(raw), MODULE.EXPECTED_SCALAR_SHA256)
        self.assertEqual(diagnostics["legacyAmplitudeWord"], "400f088c787f495b")
        self.assertEqual(diagnostics["correctedCWord"], "40007f765a3009fd")
        self.assertEqual(diagnostics["joinResidualWord"], "bc70000000000000")

    def test_mpfr512_independent_precision_reaches_same_binary64_bins(self) -> None:
        scalars = (MODULE.INPUT_ROOT / "scalars.f64le").read_bytes()
        join = (MODULE.INPUT_ROOT / "initializer/core_L2_join_barrier.f64le").read_bytes()
        raw256, words256, _ = MODULE.derive_corrected_scalars(scalars, join, 256)
        raw512, words512, _ = MODULE.derive_corrected_scalars(scalars, join, 512)
        self.assertEqual(words512, words256)
        self.assertEqual(raw512, raw256)

    def test_mass_recovery_is_exact_binary_scaling(self) -> None:
        join = (MODULE.INPUT_ROOT / "initializer/core_L2_join_barrier.f64le").read_bytes()
        v1 = struct.unpack("<4d", join)[3]
        recovered = v1 * (2.0 ** 10)
        self.assertEqual(struct.pack(">d", recovered).hex(), "40007f765a3009fd")
        self.assertEqual(recovered / (2.0 ** 10), v1)

    def test_mpfr_context_is_restored(self) -> None:
        before = gmpy2.get_context().copy()
        scalars = (MODULE.INPUT_ROOT / "scalars.f64le").read_bytes()
        join = (MODULE.INPUT_ROOT / "initializer/core_L2_join_barrier.f64le").read_bytes()
        MODULE.derive_corrected_scalars(scalars, join)
        after = gmpy2.get_context()
        self.assertEqual(after.precision, before.precision)
        self.assertEqual(after.round, before.round)
        self.assertEqual(after.emin, before.emin)
        self.assertEqual(after.emax, before.emax)

    def test_producer_has_no_parent_execution_or_grid_solver_import(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("importlib", text)
        self.assertNotIn("subprocess", text)
        self.assertNotIn("radial_continuation", text)
        self.assertNotIn("materialize_initializer_from_m5", text)

    def test_production_output_is_not_created_by_tests(self) -> None:
        self.assertFalse(MODULE.OUTPUT_ROOT.exists())


if __name__ == "__main__":
    unittest.main()
