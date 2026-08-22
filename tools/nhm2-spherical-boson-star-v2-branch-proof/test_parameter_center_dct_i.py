"""Focused tests for the calculation-only G2-D parameter-center DCT-I.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: algebraic cosine/DCT-I calculation tests
Current maturity: synthetic, authority-neutral calculation coverage
Target maturity: independent audit before authenticated producer integration
Required frozen inputs: the DCT-I definition and tail input v1 semantic seal
Required evidence: cosine containment, normalization, node-order, bounds, and
    false-authority regressions
Stop/fail criteria: any enclosure miss, convention drift, traversal, or mint
Explicit non-goals: point solve, residual proof, proof run, or candidate result
Downstream gate unlocked: authenticated 1,024-cell parameter-center producer
"""

from __future__ import annotations

from fractions import Fraction
import importlib.util
import inspect
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "parameter_center_dct_i.py"
ROOT = HERE.parents[1]
DCT_DEFINITION = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-d-parameter-center-dct-i-definition.md"
)
TAIL_INPUT = (
    ROOT
    / "shared"
    / "contracts"
    / "nhm2-spherical-boson-star-v2-tail-source-assembler-input.v1.ts"
)


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_parameter_center_dct_i_test_target", SOURCE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load()


def _constant_physical(value: Fraction) -> tuple[tuple[Fraction, ...], ...]:
    coordinate = (value,) * M.NODE_COUNT
    return (coordinate, coordinate, coordinate)


class ParameterCenterDctITests(unittest.TestCase):
    def test_public_surface_is_zero_argument_and_blocked(self) -> None:
        self.assertEqual(
            M.__all__,
            ["ParameterCenterDctIError", "observe_parameter_center_dct_i"],
        )
        self.assertEqual(tuple(inspect.signature(M.observe_parameter_center_dct_i).parameters), ())
        with self.assertRaises(M.ParameterCenterDctIError) as observed:
            M.observe_parameter_center_dct_i()
        self.assertEqual(
            observed.exception.code,
            "parameter_center_point_solve_and_residual_evidence_absent",
        )

    def test_public_extra_argument_does_not_traverse(self) -> None:
        class Hostile:
            reads = 0

            def __getattribute__(self, name: str) -> object:
                if name != "reads":
                    type(self).reads += 1
                raise AssertionError("hostile_object_traversed")

        with self.assertRaises(TypeError):
            M.observe_parameter_center_dct_i(Hostile())
        self.assertEqual(Hostile.reads, 0)

    def test_frozen_source_bindings_match(self) -> None:
        import hashlib

        self.assertEqual(
            hashlib.sha256(DCT_DEFINITION.read_bytes()).hexdigest(),
            M.DCT_DEFINITION_SHA256,
        )
        self.assertEqual(DCT_DEFINITION.stat().st_size, M.DCT_DEFINITION_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(TAIL_INPUT.read_bytes()).hexdigest(),
            M.TAIL_INPUT_SOURCE_SHA256,
        )
        self.assertEqual(TAIL_INPUT.stat().st_size, M.TAIL_INPUT_SOURCE_SIZE_BYTES)

    def test_algebraic_cosine_table_contains_high_precision_oracle(self) -> None:
        table = M._cosine_table()
        self.assertEqual(len(table), 33)
        with M.gmpy2.context(M.gmpy2.get_context(), precision=1024):
            pi = M.gmpy2.const_pi()
            for ordinal, interval in enumerate(table):
                oracle = M.gmpy2.cos(M.gmpy2.mpq(ordinal, 32) * pi)
                self.assertLessEqual(interval.lower, oracle, ordinal)
                self.assertGreaterEqual(interval.upper, oracle, ordinal)
        self.assertTrue(table[0].contains(1))
        self.assertTrue(table[16].contains(0))
        self.assertTrue(table[32].contains(-1))

    def test_literal_halving_uses_directed_integer_division(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("def _i_divide_by_two", source)
        self.assertIn('value.lower / 2', source)
        self.assertIn('value.upper / 2', source)
        self.assertNotIn("_HALF", source)

    def test_constant_vector_has_exact_dct_i_normalization(self) -> None:
        value = Fraction(7, 5)
        receipt = M._test_only_calculate_parameter_center_dct_i(
            0, _constant_physical(value), M._TEST_MARKER
        )
        table = M._cosine_table()
        coefficients = M._dct_i_coordinate(
            tuple(M._Interval.exact(value) for _ in range(33)), table
        )
        self.assertTrue(coefficients[0].contains(value))
        for ordinal, coefficient in enumerate(coefficients[1:], 1):
            self.assertTrue(coefficient.contains(0), ordinal)
        self.assertEqual(receipt.physical_to_mathematical_node_order, tuple(range(32, -1, -1)))

    def test_each_chebyshev_basis_vector_is_recovered(self) -> None:
        table = M._cosine_table()
        for degree in (0, 1, 7, 16, 31, 32):
            nodes = tuple(M._cosine_entry(table, j, degree) for j in range(33))
            coefficients = M._dct_i_coordinate(nodes, table)
            for ordinal, coefficient in enumerate(coefficients):
                self.assertTrue(coefficient.contains(1 if ordinal == degree else 0), (degree, ordinal))

    def test_physical_order_is_reversed_before_transform(self) -> None:
        physical = tuple(Fraction(index, 17) for index in range(33))
        values = (physical, physical, physical)
        receipt = M._test_only_calculate_parameter_center_dct_i(
            812, values, M._TEST_MARKER
        )
        direct = M._dct_i_coordinate(
            tuple(M._Interval.exact(value) for value in reversed(physical)),
            M._cosine_table(),
        )
        self.assertEqual(
            receipt.coefficients[0],
            tuple(value.encoded() for value in direct),
        )
        self.assertEqual(receipt.cell_ordinal, 812)

    def test_private_ingress_is_exact_and_bounded(self) -> None:
        with self.assertRaises(M.ParameterCenterDctIError) as observed:
            M._test_only_calculate_parameter_center_dct_i(
                True, _constant_physical(Fraction(1)), M._TEST_MARKER
            )
        self.assertEqual(observed.exception.code, "cell_ordinal_invalid")
        with self.assertRaises(M.ParameterCenterDctIError) as observed:
            M._test_only_calculate_parameter_center_dct_i(
                0, ((Fraction(1),),) * 3, M._TEST_MARKER
            )
        self.assertEqual(observed.exception.code, "synthetic_node_count_invalid")

    def test_receipt_cannot_claim_residual_or_authority(self) -> None:
        receipt = M._test_only_calculate_parameter_center_dct_i(
            0, _constant_physical(Fraction(1)), M._TEST_MARKER
        )
        false_fields = (
            "point_solve_observations_authenticated",
            "residual_proof_admitted",
            "sealed_tail_input_emitted",
            "producer_runtime_authenticated",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, name) is False for name in false_fields))
        values = {name: getattr(receipt, name) for name in receipt.__dataclass_fields__}
        values["residual_proof_admitted"] = True
        with self.assertRaises(M.ParameterCenterDctIError):
            M._CalculationReceipt(**values)

    def test_operations_restore_ambient_mpfr_context(self) -> None:
        context = M.gmpy2.get_context()
        before = (context.precision, context.round, context.emin, context.emax)
        M._test_only_calculate_parameter_center_dct_i(
            0, _constant_physical(Fraction(3, 11)), M._TEST_MARKER
        )
        after = (context.precision, context.round, context.emin, context.emax)
        self.assertEqual(after, before)

    def test_static_surface_has_no_solver_or_output_authority(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("PARAMETER_DEGREE: Final[int] = 32", source)
        self.assertIn("CELL_COUNT: Final[int] = 1024", source)
        for forbidden in (
            "subprocess",
            "os.environ",
            "candidate_output",
            "registry",
            "casimir",
            "mpfr_cos",
            "gmpy2.cos",
            "sealed_tail_input_emitted=True",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
