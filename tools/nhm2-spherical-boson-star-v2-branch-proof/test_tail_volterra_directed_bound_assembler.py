"""Focused calculation-only tests for the directed Volterra algebra.

Program gate: G2 — classical branch proof and terminal state
Workstream: exact proof-definition implementation
Capability or component: directed interval/projected-model algebra tests
Current maturity: synthetic calculation-only tests
Target maturity: focused plus independent audit of the complete assembler
Required frozen inputs: the source-envelope calculus and pinned MPFR runtime
Required evidence: outward containment, overflow, analytic-tail, and lock tests
Stop/fail criteria: any containment miss, omitted overflow, drift, or promotion
Explicit non-goals: proof/candidate execution, radius selection, or authority
Downstream gate unlocked: endpoint-cap and exact source-DAG implementation
"""

from __future__ import annotations

from fractions import Fraction
import importlib.util
import inspect
from pathlib import Path
import sys
import unittest


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "tail_volterra_directed_bound_assembler.py"


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_tail_volterra_directed_bound_assembler_test_target", SOURCE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load()


def _evaluate_at_one(model: object) -> tuple[object, object]:
    with M._rounded(M.gmpy2.RoundDown, "test_eval_one.L"):
        lower = sum(
            (coefficient.lower for coefficient in model.coefficients),
            M.gmpy2.mpfr(0),
        ) - model.residual_norm
    with M._rounded(M.gmpy2.RoundUp, "test_eval_one.U"):
        upper = sum(
            (coefficient.upper for coefficient in model.coefficients),
            M.gmpy2.mpfr(0),
        ) + model.residual_norm
    return lower, upper


class TailVolterraDirectedBoundAssemblerTests(unittest.TestCase):
    def test_public_surface_is_zero_argument_and_permanently_blocked(self) -> None:
        self.assertEqual(
            M.__all__,
            [
                "TailVolterraBoundAssemblerError",
                "observe_tail_volterra_bound_assembler",
            ],
        )
        self.assertEqual(
            tuple(
                inspect.signature(
                    M.observe_tail_volterra_bound_assembler
                ).parameters
            ),
            (),
        )
        with self.assertRaises(M.TailVolterraBoundAssemblerError) as observed:
            M.observe_tail_volterra_bound_assembler()
        self.assertEqual(
            observed.exception.code,
            "tail_source_envelope_calculus_independent_audit_not_installed",
        )

    def test_public_rejects_extra_argument_without_traversal(self) -> None:
        class Hostile:
            reads = 0

            def __getattribute__(self, name: str) -> object:
                if name != "reads":
                    type(self).reads += 1
                raise AssertionError("hostile_object_traversed")

        with self.assertRaises(TypeError):
            M.observe_tail_volterra_bound_assembler(Hostile())
        self.assertEqual(Hostile.reads, 0)

    def test_runtime_and_closed_kernel_constants_are_bound(self) -> None:
        receipt = M._test_only_kernel_receipt(
            Fraction(3, 5), Fraction(8, 15), M._TEST_MARKER
        )
        constants = M._kernel_constants(
            M._Interval.exact(Fraction(3, 5)),
            M._Interval.exact(Fraction(8, 15)),
        )
        expected_alpha = Fraction(71, 60)
        expected_cg = Fraction(262_350, 357_911)
        expected_ck0 = Fraction(25, 144)
        for interval, expected in (
            (constants.alpha, expected_alpha),
            (constants.c_g1, expected_cg),
            (constants.c_g2, expected_cg),
            (constants.c_k0, expected_ck0),
        ):
            self.assertLessEqual(interval.lower, M._mpq(expected))
            self.assertGreaterEqual(interval.upper, M._mpq(expected))
        self.assertTrue(all(Path(path).is_file() for path in receipt.runtime_paths))

    def test_interval_arithmetic_contains_exact_rational_oracles(self) -> None:
        left = M._Interval.exact(Fraction(-7, 13))
        right = M._Interval.exact(Fraction(11, 17))
        fixtures = (
            (M._i_add(left, right), Fraction(-7, 13) + Fraction(11, 17)),
            (M._i_sub(left, right), Fraction(-7, 13) - Fraction(11, 17)),
            (M._i_mul(left, right), Fraction(-7, 13) * Fraction(11, 17)),
            (M._i_div(left, right), Fraction(-7, 13) / Fraction(11, 17)),
        )
        for interval, exact in fixtures:
            self.assertLessEqual(interval.lower, M._mpq(exact))
            self.assertGreaterEqual(interval.upper, M._mpq(exact))

    def test_chebyshev_overflow_is_retained(self) -> None:
        coefficients = [M._ZERO for _ in range(M.PARAMETER_DEGREE + 1)]
        coefficients[M.PARAMETER_DEGREE] = M._ONE
        source = M._Model32(tuple(coefficients), M._ZERO.upper)
        product = M._m_mul(source, source)
        self.assertLessEqual(product.coefficients[0].lower, M._mpq(Fraction(1, 2)))
        self.assertGreaterEqual(product.coefficients[0].upper, M._mpq(Fraction(1, 2)))
        expected_drop = M._directed(
            M.gmpy2.RoundDown,
            "expected_drop",
            lambda: M._mpq(Fraction(1, 2)) * M._mpq(M.CHI) ** 64,
        )
        self.assertGreaterEqual(product.residual_norm, expected_drop)

    def test_shortened_analytic_oracles_prove_the_implemented_rules(self) -> None:
        original = M.ANALYTIC_ORDER
        M.ANALYTIC_ORDER = 12
        try:
            value = M._Model32.constant(Fraction(201, 100))
            with M._rounded(M.gmpy2.RoundToNearest, "test_exact"):
                exact = M.gmpy2.mpfr(M.gmpy2.mpq(201, 100))
                oracles = (
                    M.gmpy2.mpfr(M.gmpy2.mpq(100, 201)),
                    M.gmpy2.log(exact),
                    M.gmpy2.sqrt(exact),
                    M.gmpy2.expm1(exact) / exact,
                )
            for model, oracle in zip(
                (
                    M._m_reciprocal(value),
                    M._m_log_positive(value),
                    M._m_sqrt_positive(value),
                    M._m_phi1(value),
                ),
                oracles,
            ):
                lower, upper = _evaluate_at_one(model)
                self.assertLessEqual(lower, oracle)
                self.assertGreaterEqual(upper, oracle)

            zero_extension = M._m_q0(
                M._Model32.constant(0), M._Model32.constant(Fraction(3, 2))
            )
            lower, upper = _evaluate_at_one(zero_extension)
            self.assertLessEqual(lower, -3)
            self.assertGreaterEqual(upper, -3)
        finally:
            M.ANALYTIC_ORDER = original

    def test_receipt_cannot_promote_any_authority(self) -> None:
        receipt = M._test_only_kernel_receipt(
            Fraction(3, 5), Fraction(8, 15), M._TEST_MARKER
        )
        fields = (
            "source_envelope_calculus_implemented",
            "endpoint_cap_implemented",
            "source_dag_implemented",
            "independent_audit_clear",
            "proof_execution_authorized",
            "candidate_executed",
            "proof_receipt_ready",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, field) is False for field in fields))
        values = {
            field: getattr(receipt, field) for field in receipt.__dataclass_fields__
        }
        values["physical_authority"] = True
        with self.assertRaises(M.TailVolterraBoundAssemblerError):
            M._CalculationReceipt(**values)

    def test_static_scope_has_no_candidate_or_execution_surface(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        self.assertIn("ANALYTIC_ORDER: Final[int] = 512", source)
        self.assertIn("PARAMETER_DEGREE: Final[int] = 32", source)
        for forbidden in (
            "subprocess",
            "os.environ",
            "candidate_output",
            "registry",
            "casimir",
            "WeakSet",
            "proofExecutionAuthorized = True",
        ):
            self.assertNotIn(forbidden, source)

    def test_private_operations_restore_the_ambient_mpfr_context(self) -> None:
        context = M.gmpy2.get_context()
        before = (
            context.precision,
            context.round,
            context.emin,
            context.emax,
            context.subnormalize,
        )
        M._test_only_kernel_receipt(
            Fraction(3, 5), Fraction(8, 15), M._TEST_MARKER
        )
        after = (
            context.precision,
            context.round,
            context.emin,
            context.emax,
            context.subnormalize,
        )
        self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
