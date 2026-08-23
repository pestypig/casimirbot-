"""Preexecution tests for the sealed B4-R7 causal review."""

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
SOURCE = HERE / "g2b_b4_r7_causal_interaction_review.py"
SPEC = importlib.util.spec_from_file_location("g2b_b4_r7_causal_interaction_review", SOURCE)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


class CausalInteractionPreexecutionTests(unittest.TestCase):
    def test_packet_binding_and_required_header(self) -> None:
        raw = MODULE.PACKET.read_bytes()
        self.assertEqual((len(raw), sha(raw)), (MODULE.PACKET_SIZE, MODULE.PACKET_SHA256))
        text = raw.decode("utf-8")
        for label in (
            "Program gate:", "Workstream:", "Capability or component:",
            "Current maturity:", "Target maturity:", "Required frozen inputs:",
            "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
            "Downstream gate unlocked:",
        ):
            self.assertIn(label, text)

    def test_every_frozen_input_rehashes(self) -> None:
        for role, relative, size, digest in MODULE.FROZEN_BINDINGS:
            with self.subTest(role=role):
                raw = (ROOT / relative).read_bytes()
                self.assertEqual((len(raw), sha(raw)), (size, digest))

    def test_parent_r6_self_hash_and_semantics(self) -> None:
        receipt = json.loads(MODULE.R6_PATH.read_bytes())
        observed = receipt.pop("receiptSha256")
        encoded = MODULE._canonical(receipt)
        expected = sha(MODULE.R6_RECEIPT_DOMAIN + struct.pack("<Q", len(encoded)) + encoded)
        self.assertEqual(observed, expected)
        self.assertEqual(observed, "0430266c9efe338fecc4c4c01fd2e25d168f481611d2676d023ba6e211a0c001")
        self.assertEqual(receipt["decision"], "MULTIPLE_MECHANISMS_SEPARATED_NO_UNIQUE_SUCCESSOR")
        self.assertEqual(receipt["activeMechanismFamilies"], ["SCALING", "DISCRETIZATION"])
        self.assertTrue(all(value is False for value in receipt["authorityLocks"].values()))

    def test_checkpoint_closes_source_and_tests(self) -> None:
        bindings, state, receipt = MODULE._closure()
        self.assertEqual(len(state), 1_544)
        self.assertEqual(receipt["status"], "PASS")
        self.assertEqual(bindings[-1]["role"], "execution_checkpoint")

    def test_intervention_cells_are_exact_and_controlled(self) -> None:
        self.assertEqual(MODULE.INTERVENTIONS, (("FULL", None), ("DROP_FIRST", 1), ("DROP_MIDDLE", 32), ("DROP_LAST", 62)))
        matrix = tuple(tuple(float(row * 193 + column + 1) for column in range(193)) for row in range(193))
        self.assertIs(MODULE._excise(matrix, None), matrix)
        for node in (1, 32, 62):
            reduced = MODULE._excise(matrix, node)
            removed = {node, 64 + node, 128 + node}
            self.assertEqual((len(reduced), len(reduced[0])), (190, 190))
            expected_first = tuple(matrix[0][column] for column in range(193) if column not in removed)
            self.assertEqual(reduced[0], expected_first)
            expected_rows = [row for row in range(193) if row not in removed]
            self.assertEqual(reduced[-1][0], matrix[expected_rows[-1]][0])

    def test_equilibration_and_ratio_helpers_are_deterministic(self) -> None:
        matrix = ((8.0, 2.0), (1.0, 16.0))
        balanced, rows, columns = MODULE._equilibrate(matrix)
        self.assertEqual(rows, (2.0**-4, 2.0**-5))
        self.assertEqual(columns, (1.0, 1.0))
        self.assertEqual(balanced, ((0.5, 0.125), (0.03125, 0.5)))
        values = tuple(float(index + 1) for index in range(62))
        record = MODULE._ratio_record(values)
        self.assertEqual(MODULE._from_word(record["medianBinary64Word"]), 31.5)
        self.assertEqual(MODULE._from_word(record["node1ToMedianBinary64Word"]), 1.0 / 31.5)

    def test_classification_precedence_is_total(self) -> None:
        base = {
            "SCALING_MAIN_EFFECT": False,
            "FIRST_BLOCK_CONDITIONING_LEVERAGE": False,
            "LOCALIZATION_ROBUST": False,
            "SCALING_ABSORBS_LOCALIZATION": False,
            "LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION": False,
        }
        boundary = dict(base, FIRST_BLOCK_CONDITIONING_LEVERAGE=True, LOCALIZATION_ROBUST=True)
        self.assertEqual(MODULE._classification(boundary), ("BOUNDARY_DISCRETIZATION_UPSTREAM", "BOUNDARY_FORMULATION_PROPOSAL"))
        scaling = dict(base, SCALING_MAIN_EFFECT=True, SCALING_ABSORBS_LOCALIZATION=True)
        self.assertEqual(MODULE._classification(scaling), ("SCALING_UPSTREAM_OF_APPARENT_LOCALIZATION", "EQUILIBRATED_SCALING_PROPOSAL"))
        term = dict(base, SCALING_MAIN_EFFECT=True, LOCAL_TERM_SCALE_ABSORBS_LOCALIZATION=True)
        self.assertEqual(MODULE._classification(term), ("SCALING_UPSTREAM_OF_APPARENT_LOCALIZATION", "EQUILIBRATED_SCALING_PROPOSAL"))
        independent = dict(base, SCALING_MAIN_EFFECT=True, LOCALIZATION_ROBUST=True)
        self.assertEqual(MODULE._classification(independent), ("INDEPENDENT_SCALING_AND_LOCALIZATION", "COMBINED_ORTHOGONAL_FORMULATION_PROPOSAL"))
        overlap = dict(independent, FIRST_BLOCK_CONDITIONING_LEVERAGE=True, SCALING_ABSORBS_LOCALIZATION=True)
        self.assertEqual(MODULE._classification(overlap), ("BOUNDARY_DISCRETIZATION_UPSTREAM", "BOUNDARY_FORMULATION_PROPOSAL"))
        self.assertEqual(MODULE._classification(base), ("CAUSAL_INTERACTION_UNRESOLVED_STOP", None))

    def test_producer_has_no_solver_update_or_trial_call(self) -> None:
        tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        forbidden = {
            "solve_spherical_radial_compactified_diagnostic",
            "continue_spherical_radial_compactified_diagnostic",
            "solve_deterministic_dense_lu", "_solve_newton_map",
            "newton_step", "trial_state", "trial_merit",
        }
        observed: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    observed.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    observed.add(node.func.attr)
            elif isinstance(node, (ast.Import, ast.ImportFrom)):
                observed.update(alias.name for alias in node.names)
        self.assertTrue(forbidden.isdisjoint(observed))

    def test_runtime_identity_and_authority_are_fail_closed(self) -> None:
        self.assertEqual(MODULE.TARGET_AMPLITUDE, 2.0**-16)
        self.assertEqual(MODULE.IMAGE_ID, "sha256:715f6ea4674ace8cd1758954b09fda66e7f4ca9373a28af7a796fe1f9926dfd1")
        self.assertEqual(len(MODULE.AUTHORITY_LOCKS), 14)
        self.assertTrue(all(value is False for value in MODULE.AUTHORITY_LOCKS.values()))


if __name__ == "__main__":
    unittest.main()
