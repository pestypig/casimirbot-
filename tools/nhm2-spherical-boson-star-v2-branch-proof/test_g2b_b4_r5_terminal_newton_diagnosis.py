"""Preexecution tests for the sealed B4-R5 read-only diagnosis."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
from pathlib import Path
import sys
import unittest


ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).with_name("g2b_b4_r5_terminal_newton_diagnosis.py")
SPEC = importlib.util.spec_from_file_location("g2b_b4_r5_terminal_newton_diagnosis", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = MODULE
SPEC.loader.exec_module(MODULE)


def digest(path: Path) -> tuple[int, str]:
    raw = path.read_bytes()
    return len(raw), hashlib.sha256(raw).hexdigest()


class G2BB4R5PreexecutionTests(unittest.TestCase):
    def test_packet_and_all_frozen_bindings(self) -> None:
        self.assertEqual(digest(MODULE.PACKET), (MODULE.PACKET_SIZE, MODULE.PACKET_SHA256))
        for role, relative, size, expected in MODULE.FROZEN_BINDINGS:
            self.assertEqual(digest(ROOT / relative), (size, expected), role)

    def test_parent_terminal_is_immutable_fail_closed_evidence(self) -> None:
        terminal = MODULE._json((MODULE.B4_ROOT / "terminal-receipt.json").read_bytes(), "terminal")
        self.assertEqual(terminal["receiptSha256"], "361116765976f0ebb4e8236780f09d77ee17a6dff7f6e640975e8687bfa10c28")
        self.assertEqual(terminal["firstFailure"]["code"], "armijo_schedule_exhausted_without_retry")
        self.assertTrue(terminal["noRetry"] and terminal["noRetune"])
        self.assertTrue(all(value is False for value in terminal["authorityLocks"].values()))

    def test_producer_does_not_call_newton_or_continuation_chronology(self) -> None:
        tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        forbidden = {
            "solve_spherical_radial_compactified_diagnostic",
            "_solve_newton_map",
            "continue_spherical_radial_compactified_diagnostic",
        }
        called: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    called.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    called.add(node.func.attr)
        self.assertTrue(forbidden.isdisjoint(called))

    def test_frozen_row_labels_cover_exact_square_order(self) -> None:
        self.assertEqual(MODULE._row_label(0), {"block": "F0", "kind": "origin_derivative", "node": 0})
        self.assertEqual(MODULE._row_label(1), {"block": "F0", "kind": "Et_t", "node": 1})
        self.assertEqual(MODULE._row_label(64), {"block": "F1", "kind": "origin_derivative", "node": 0})
        self.assertEqual(MODULE._row_label(129), {"block": "varphi", "kind": "KG", "node": 1})
        self.assertEqual(MODULE._row_label(192), {"block": "amplitude", "kind": "varphi_origin_minus_target", "node": 0})

    def test_decision_mapping_is_frozen_for_all_families(self) -> None:
        base = {
            "EXTREME_LINEAR_SENSITIVITY": False,
            "BINARY64_TRIAL_STAGNATION": False,
            "UNUSED_CONSTRAINT_SEPARATION": False,
            "NODAL_MONOTONICITY_DEFECT": False,
            "NON_DESCENT_NEWTON_DIRECTION": False,
            "ARMIJO_GLOBALIZATION_CONFLICT": False,
        }
        self.assertEqual(MODULE._mechanism_decision(base), "NO_UNIQUE_SUCCESSOR_JUSTIFIED")
        for key, expected in (
            ("BINARY64_TRIAL_STAGNATION", "PRECISION_SUCCESSOR_PROPOSAL_SUPPORTED"),
            ("ARMIJO_GLOBALIZATION_CONFLICT", "GLOBALIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"),
            ("NON_DESCENT_NEWTON_DIRECTION", "FORMULATION_OR_DISCRETIZATION_REVIEW_REQUIRED"),
            ("UNUSED_CONSTRAINT_SEPARATION", "FORMULATION_OR_DISCRETIZATION_REVIEW_REQUIRED"),
        ):
            triggers = dict(base)
            triggers[key] = True
            self.assertEqual(MODULE._mechanism_decision(triggers), expected)
        mixed = dict(base)
        mixed["BINARY64_TRIAL_STAGNATION"] = True
        mixed["UNUSED_CONSTRAINT_SEPARATION"] = True
        self.assertEqual(MODULE._mechanism_decision(mixed), "SEPARATE_BENCHMARKS_REQUIRED_BEFORE_SUCCESSOR")

    def test_resource_bounds_and_authority_locks(self) -> None:
        self.assertEqual(MODULE.MAX_BACKTRACK_EXPONENT, 24)
        self.assertEqual(MODULE.TARGET_AMPLITUDE, 2.0**-16)
        self.assertEqual(MODULE.ARMIJO_C, 2.0**-12)
        self.assertEqual(MODULE.RESIDUAL_THRESHOLD, 2.0**-40)
        self.assertEqual(MODULE.STEP_THRESHOLD, 2.0**-42)
        self.assertTrue(all(value is False for value in MODULE.AUTHORITY_LOCKS.values()))

    def test_production_root_is_fresh(self) -> None:
        self.assertFalse(MODULE.OUTPUT_ROOT.exists())


if __name__ == "__main__":
    unittest.main()
