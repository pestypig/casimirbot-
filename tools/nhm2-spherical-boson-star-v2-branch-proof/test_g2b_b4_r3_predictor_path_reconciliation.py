"""Preexecution tests for the B4-R3 predictor/path reconciliation."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import sys
import unittest

import gmpy2


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("g2b_b4_r3_predictor_path_reconciliation.py")
SPEC = importlib.util.spec_from_file_location("g2b_b4_r3_predictor_path_reconciliation", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


class G2BB4R3PreexecutionTests(unittest.TestCase):
    def test_static_and_payload_closure(self) -> None:
        for role, relative, size, expected in MODULE.STATIC_BINDINGS:
            raw = (ROOT / relative).read_bytes()
            self.assertEqual((len(raw), digest(raw)), (size, expected), role)
        for relative, size, expected in MODULE.PAYLOAD_BINDINGS:
            raw = (MODULE.INITIALIZER_ROOT / relative).read_bytes()
            self.assertEqual((len(raw), digest(raw)), (size, expected), relative)

    def test_policy_and_interfaces_support_identity_predictor(self) -> None:
        sources = {role: (ROOT / relative).read_text(encoding="utf-8") for role, relative, _size, _hash in MODULE.STATIC_BINDINGS if role in {"branch_selection_policy", "continuation_interface", "newton_interface", "immutable_b4_spine"}}
        MODULE._verify_semantics(sources["branch_selection_policy"], sources["continuation_interface"], sources["newton_interface"], sources["immutable_b4_spine"])

    def test_origin_words_are_exact_at_mpfr256_and_mpfr512(self) -> None:
        expected = {
            "baseU": "3ff0000000000000",
            "varphi": "3f50000000000000",
            "firstTargetAmplitude": "3ef0000000000000",
            "terminalTargetAmplitude": "3f50000000000000",
        }
        words256 = MODULE.derive_origin_words(256)
        words512 = MODULE.derive_origin_words(512)
        self.assertEqual(words512, words256)
        for key, word in expected.items():
            self.assertEqual(words256[key], word)

    def test_mpfr_context_restored(self) -> None:
        before = gmpy2.get_context().copy()
        MODULE.derive_origin_words()
        after = gmpy2.get_context()
        self.assertEqual((after.precision, after.round, after.emin, after.emax), (before.precision, before.round, before.emin, before.emax))

    def test_actual_root_path_formula_rehashes_every_payload(self) -> None:
        for relative, size, expected in MODULE.PAYLOAD_BINDINGS:
            actual = MODULE.INITIALIZER_ROOT / relative
            emitted = actual.relative_to(ROOT).as_posix()
            self.assertIn("g2b-b4-r1-initializer-scalar-abi-v1", emitted)
            self.assertNotIn("g2b-b1-r1-initializer-v1", emitted)
            raw = (ROOT / emitted).read_bytes()
            self.assertEqual((len(raw), digest(raw)), (size, expected))

    def test_r2_remains_immutable_and_fail_closed(self) -> None:
        terminal = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2/g2b-b4-r2-four-grid-v1/terminal-receipt.json"
        raw = terminal.read_bytes()
        value = json.loads(raw)
        self.assertEqual((len(raw), digest(raw)), (1_161, "16d9f8e2914076ed31e00b37df8b4fd135c81b36a45b9f4f092612c85420d474"))
        self.assertEqual(value["firstFailure"]["code"], "g2b_b4_initializer_origin_amplitude_mismatch")
        self.assertEqual(value["attemptedLevelCount"], 0)

    def test_no_grid_solver_or_payload_write_surface(self) -> None:
        text = SOURCE.read_text(encoding="utf-8")
        self.assertNotIn("generate_compactified_lobatto_grid", text)
        self.assertNotIn("continue_spherical_radial", text)
        self.assertNotIn("solve_spherical_radial", text)
        self.assertNotIn("radial_lobatto_grid", text)
        self.assertFalse(MODULE.OUTPUT_ROOT.exists())


if __name__ == "__main__":
    unittest.main()
