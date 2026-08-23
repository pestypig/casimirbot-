"""Preexecution tests for the sealed G2B-B4 integrated runner."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "g2b_b4_integrated_four_grid_runner.py"
SPEC = importlib.util.spec_from_file_location("_g2b_b4_runner_test", SOURCE)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("runner import unavailable")
b4 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = b4
SPEC.loader.exec_module(b4)


class _State:
    def __init__(self) -> None:
        self.F0 = (0.0, 1.0)
        self.F1 = (0.0, -1.0)
        self.varphi = (2.0**-16, 0.0)
        self.w = 0.75


class G2BB4RunnerTests(unittest.TestCase):
    def test_packet_and_all_static_source_payload_bindings_are_exact(self) -> None:
        observed = b4._verify_static_closure()
        self.assertEqual(len(observed), 7 + 11 + 6 + 1)
        self.assertEqual(observed[0]["rawSha256"], b4.PACKET_SHA256)
        self.assertEqual(observed[-2]["sizeBytes"], 32)
        self.assertEqual(observed[-1]["role"], "execution_checkpoint")

    def test_persisted_scalar_payload_fails_frozen_evaluator_graph_exactly(self) -> None:
        observation = b4._initializer_scalar_contract_observation()
        self.assertFalse(observation["allRequiredBitsEqual"])
        self.assertEqual(observation["firstMismatch"], "N0")
        comparisons = {item["field"]: item for item in observation["comparisons"]}
        self.assertEqual(comparisons["N0"]["recomputedBinary64Word"], "40485fa24bc6145c")
        self.assertEqual(comparisons["N0"]["payloadBinary64Word"], "40485fa24bc6145b")
        self.assertFalse(comparisons["sigma"]["bitEqual"])
        self.assertEqual(comparisons["sigma"]["recomputedBinary64Word"], "40025ff41467e26d")
        self.assertEqual(comparisons["sigma"]["payloadBinary64Word"], "3fe815d49929ae09")
        for field in ("kappa", "lambda", "nu_star", "wSeed"):
            self.assertTrue(comparisons[field]["bitEqual"])
        with self.assertRaisesRegex(
            b4.G2BB4Error,
            r"^g2b_b4_initializer_scalar_recomputation_mismatch:",
        ):
            b4._validate_initializer_scalar_contract()

    def test_mpfr_context_is_restored_after_scalar_observation(self) -> None:
        before = b4.gmpy2.get_context().copy()
        b4._initializer_scalar_contract_observation()
        after = b4.gmpy2.get_context()
        for field in (
            "precision", "round", "emin", "emax", "subnormalize",
            "trap_underflow", "trap_overflow", "trap_inexact", "trap_invalid",
            "trap_erange", "trap_divzero", "allow_complex", "rational_division",
            "allow_release_gil",
        ):
            self.assertEqual(getattr(after, field), getattr(before, field), field)

    def test_state_packing_is_exact_f64le_in_frozen_order(self) -> None:
        raw = b4._pack_state(_State())
        self.assertEqual(
            struct.unpack("<7d", raw),
            (0.0, 1.0, 0.0, -1.0, 2.0**-16, 0.0, 0.75),
        )

    def test_terminal_receipt_is_self_hashed_and_authority_locked(self) -> None:
        preexecution = {"receiptSha256": "a" * 64}
        raw = b4._terminal_receipt(
            status="FAIL",
            decision="STOPPED_AT_FIRST_EXECUTION_EXCEPTION",
            first_failure={"code": "x"},
            preexecution=preexecution,
            level_receipts=[],
            cross_grid_binding=None,
        )
        receipt = json.loads(raw)
        self_hash = receipt.pop("receiptSha256")
        unsigned = b4._canonical(receipt)
        expected = hashlib.sha256(
            b4.TERMINAL_DOMAIN + struct.pack("<Q", len(unsigned)) + unsigned
        ).hexdigest()
        self.assertEqual(self_hash, expected)
        self.assertFalse(receipt["vacuumContinuationWorkUnlocked"])
        self.assertTrue(receipt["noRetry"])
        self.assertTrue(receipt["noRetune"])
        self.assertFalse(receipt["coarseGridStateUsedAsPredictor"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))

    def test_prerequisite_validation_precedes_grid_loop_and_solver_call_is_single(self) -> None:
        tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        execute = next(
            node for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name == "execute_once"
        )
        calls = [
            node for node in ast.walk(execute)
            if isinstance(node, ast.Call)
        ]
        validation_lines = [
            node.lineno for node in calls
            if isinstance(node.func, ast.Name)
            and node.func.id == "_validate_initializer_scalar_contract"
        ]
        grid_lines = [
            node.lineno for node in calls
            if isinstance(node.func, ast.Attribute)
            and node.func.attr == "generate_compactified_lobatto_grid"
        ]
        solve_calls = [
            node for node in calls
            if isinstance(node.func, ast.Attribute)
            and node.func.attr == "continue_spherical_radial_compactified_diagnostic"
        ]
        cross_calls = [
            node for node in calls
            if isinstance(node.func, ast.Attribute)
            and node.func.attr == "evaluate_radial_cross_grid_convergence"
        ]
        self.assertEqual(len(validation_lines), 1)
        self.assertEqual(len(grid_lines), 1)
        self.assertLess(validation_lines[0], grid_lines[0])
        self.assertEqual(len(solve_calls), 1)
        self.assertEqual(len(cross_calls), 1)

    def test_packet_has_required_development_header_and_non_goals(self) -> None:
        text = b4.PACKET_PATH.read_text(encoding="utf-8")
        for label in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        ):
            self.assertIn(label, text)
        self.assertIn("physical viability", text)
        self.assertIn("coarser grid may initialize", text)


if __name__ == "__main__":
    unittest.main()
