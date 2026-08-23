from __future__ import annotations

import ast
import math
from pathlib import Path
import unittest

import g2b_b4_r9_formulation_proposal as proposal


ROOT = Path(__file__).resolve().parents[2]


class G2BB4R9FormulationProposalTests(unittest.TestCase):
    def test_frozen_bindings_reopen_without_candidate_evaluation(self) -> None:
        observed = proposal.verify_frozen_bindings(ROOT)
        self.assertEqual(len(observed), 27)
        self.assertFalse((ROOT / proposal.FUTURE_OUTPUT_ROOT_RELATIVE).exists())

    def test_equilibration_is_power_two_and_algebraically_equivalent(self) -> None:
        matrix = ((2.0**20, 2.0**-8), (2.0**12, -2.0**-16))
        rhs = (3.0, -5.0)
        scaled = proposal.equilibrate_linear_system(matrix, rhs)
        for scale in scaled.row_scales + scaled.column_scales:
            mantissa, _exponent = math.frexp(scale)
            self.assertEqual(mantissa, 0.5)
        y = (2.0**7, -2.0**9)
        direction = proposal.recover_unscaled_direction(y, scaled.column_scales)
        raw_product = tuple(math.fsum(row[j] * direction[j] for j in range(2)) for row in matrix)
        scaled_product = tuple(math.fsum(scaled.matrix[i][j] * y[j] for j in range(2)) for i in range(2))
        self.assertEqual(scaled_product, tuple(scaled.row_scales[i] * raw_product[i] for i in range(2)))

    def test_mpfr_prefix_reproduces_exact_polynomial_integrals(self) -> None:
        nodes = (0.0, 0.1, 0.4, 0.75, 1.0)
        constant = proposal.interpolatory_prefix_mpfr512(nodes, (3.0,) * len(nodes))
        quadratic_values = tuple(2.0 + 3.0 * x + 5.0 * x * x for x in nodes)
        quadratic = proposal.interpolatory_prefix_mpfr512(nodes, quadratic_values)
        for node, observed_constant, observed_quadratic in zip(nodes, constant, quadratic, strict=True):
            self.assertAlmostEqual(observed_constant, 3.0 * node, places=14)
            self.assertAlmostEqual(observed_quadratic, 2.0 * node + 1.5 * node**2 + (5.0 / 3.0) * node**3, places=14)

    def test_scale_free_contraction_rule_is_fail_closed(self) -> None:
        self.assertTrue(proposal.contracts_without_threshold((4.0, 2.0, 1.0)))
        self.assertTrue(proposal.contracts_without_threshold((1.0, 0.0, 0.0)))
        self.assertTrue(proposal.contracts_without_threshold((0.0, 0.0, 0.0)))
        self.assertFalse(proposal.contracts_without_threshold((4.0, 4.0, 1.0)))
        self.assertFalse(proposal.contracts_without_threshold((1.0, 2.0, 0.5)))

    def test_manifest_fixes_single_class_and_all_authority_false(self) -> None:
        manifest = proposal.proposal_manifest()
        self.assertEqual(manifest["continuumRows"], ["Et_t", "Etheta_theta", "KGbar"])
        self.assertEqual(manifest["frequencyCoordinate"], "direct_binary64_w_with_strict_0_lt_w_lt_1")
        self.assertEqual(manifest["levelNodeCounts"], [64, 96, 128, 256])
        self.assertFalse(manifest["candidateExecutionAuthorized"])
        self.assertTrue(all(value is False for value in manifest["authorityLocks"].values()))

    def test_source_has_no_candidate_runner_import_or_write_surface(self) -> None:
        source_path = Path(proposal.__file__).resolve()
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported = {
            alias.name
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for alias in node.names
        }
        self.assertNotIn("g2b_b4_r4_integrated_four_grid_successor", imported)
        self.assertNotIn("radial_continuation", imported)
        self.assertNotIn("deterministic_newton", imported)
        self.assertNotIn("radial_compactified_system", imported)
        forbidden_attributes = {"write_bytes", "write_text", "mkdir", "unlink", "rmdir", "rename", "replace"}
        observed_attributes = {
            node.attr for node in ast.walk(tree) if isinstance(node, ast.Attribute)
        }
        self.assertTrue(forbidden_attributes.isdisjoint(observed_attributes))


if __name__ == "__main__":
    unittest.main()
