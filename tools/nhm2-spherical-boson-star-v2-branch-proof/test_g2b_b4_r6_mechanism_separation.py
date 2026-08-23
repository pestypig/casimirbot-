"""Preexecution tests for the sealed B4-R6 no-solve benchmark."""

from __future__ import annotations

import ast
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import unittest


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = HERE / "g2b_b4_r6_mechanism_separation.py"
SPEC = importlib.util.spec_from_file_location("g2b_b4_r6_mechanism_separation", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def _sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


class MechanismSeparationPreexecutionTests(unittest.TestCase):
    def test_packet_is_exactly_bound_and_has_required_header(self) -> None:
        raw = MODULE.PACKET.read_bytes()
        self.assertEqual(len(raw), MODULE.PACKET_SIZE)
        self.assertEqual(_sha(raw), MODULE.PACKET_SHA256)
        text = raw.decode("utf-8")
        for label in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        ):
            self.assertIn(label, text)

    def test_every_frozen_input_has_exact_size_and_digest(self) -> None:
        for role, relative, size, digest in MODULE.FROZEN_BINDINGS:
            with self.subTest(role=role):
                raw = (ROOT / relative).read_bytes()
                self.assertEqual(len(raw), size)
                self.assertEqual(_sha(raw), digest)

    def test_parent_receipt_self_hash_and_stop_semantics(self) -> None:
        receipt = json.loads(MODULE.R5_PATH.read_bytes())
        observed = receipt.pop("receiptSha256")
        canonical = MODULE._canonical(receipt)
        expected = _sha(
            MODULE.R5_RECEIPT_DOMAIN
            + struct.pack("<Q", len(canonical))
            + canonical
        )
        self.assertEqual(observed, expected)
        self.assertEqual(receipt["decision"], "NO_UNIQUE_SUCCESSOR_JUSTIFIED")
        self.assertFalse(receipt["b4R4Retried"])
        self.assertTrue(receipt["noRetune"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))

    def test_checkpoint_closes_source_and_test_identity(self) -> None:
        bindings, state_raw, parent = MODULE._closure()
        self.assertEqual(len(state_raw), 1_544)
        self.assertEqual(parent["decision"], "NO_UNIQUE_SUCCESSOR_JUSTIFIED")
        self.assertEqual(bindings[-1]["role"], "execution_checkpoint")

    def test_coordinate_maps_touch_only_frequency_column(self) -> None:
        row = tuple(float(index + 1) for index in range(193))
        matrix = (row,)
        for derivative in (1.0, -1.0, -2.0**-40, 1.0 + 2.0**-40):
            transformed = MODULE._coordinate_matrix(matrix, derivative)[0]
            self.assertEqual(transformed[:192], row[:192])
            self.assertEqual(transformed[192], row[192] * derivative)

    def test_power_two_equilibration_is_deterministic(self) -> None:
        matrix = ((8.0, 2.0), (1.0, 16.0))
        equilibrated, rows, columns = MODULE._equilibrate(matrix)
        self.assertEqual(rows, (2.0**-4, 2.0**-5))
        self.assertEqual(columns, (1.0, 1.0))
        self.assertEqual(equilibrated, ((0.5, 0.125), (0.03125, 0.5)))
        self.assertEqual(MODULE._equilibrate(matrix), (equilibrated, rows, columns))

    def test_decision_table_is_exclusive_and_result_independent(self) -> None:
        names = (
            "COORDINATE_SEPARATION", "SCALING_SEPARATION",
            "PRECISION_SEPARATION", "SPECTRAL_SEPARATION",
            "FIRST_NODE_SEPARATION",
        )
        empty = {name: False for name in names}
        self.assertEqual(
            MODULE._decision(empty),
            ([], "NO_MECHANISM_SEPARATED_STOP_FOR_REVIEW"),
        )
        expected = {
            "COORDINATE_SEPARATION": ("COORDINATE", "COORDINATE_SUCCESSOR_PROPOSAL_SUPPORTED"),
            "SCALING_SEPARATION": ("SCALING", "EQUILIBRATED_SUCCESSOR_PROPOSAL_SUPPORTED"),
            "PRECISION_SEPARATION": ("PRECISION", "MPFR_SUCCESSOR_PROPOSAL_SUPPORTED"),
            "SPECTRAL_SEPARATION": ("DISCRETIZATION", "DISCRETIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"),
            "FIRST_NODE_SEPARATION": ("DISCRETIZATION", "DISCRETIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"),
        }
        for trigger, (family, decision) in expected.items():
            values = dict(empty)
            values[trigger] = True
            self.assertEqual(MODULE._decision(values), ([family], decision))
        multiple = dict(empty)
        multiple["COORDINATE_SEPARATION"] = True
        multiple["PRECISION_SEPARATION"] = True
        self.assertEqual(
            MODULE._decision(multiple),
            (["COORDINATE", "PRECISION"], "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR"),
        )
        same_family = dict(empty)
        same_family["SPECTRAL_SEPARATION"] = True
        same_family["FIRST_NODE_SEPARATION"] = True
        self.assertEqual(
            MODULE._decision(same_family),
            (["DISCRETIZATION"], "DISCRETIZATION_SUCCESSOR_PROPOSAL_SUPPORTED"),
        )

    def test_producer_contains_no_solver_or_update_call(self) -> None:
        tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        forbidden = {
            "solve_spherical_radial_compactified_diagnostic",
            "continue_spherical_radial_compactified_diagnostic",
            "solve_deterministic_dense_lu",
            "_solve_newton_map",
            "newton_step",
            "trial_state",
        }
        called: set[str] = set()
        imported: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                function = node.func
                if isinstance(function, ast.Name):
                    called.add(function.id)
                elif isinstance(function, ast.Attribute):
                    called.add(function.attr)
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                for alias in node.names:
                    imported.add(alias.name)
        self.assertTrue(forbidden.isdisjoint(called | imported))

    def test_execution_identity_and_authority_are_fail_closed(self) -> None:
        self.assertEqual(MODULE.TARGET_AMPLITUDE, 2.0**-16)
        self.assertEqual(MODULE.IMAGE_ID, "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1")
        self.assertEqual(len(MODULE.AUTHORITY_LOCKS), 14)
        self.assertTrue(all(value is False for value in MODULE.AUTHORITY_LOCKS.values()))


if __name__ == "__main__":
    unittest.main()
