"""Exact tests for the G2-D finite core Green operators.

Program gate: G2 — classical branch proof and terminal state
Workstream: finite proof-center point-solver implementation
Capability or component: exact J_1/q and J_2/q reference tests
Current maturity: exact arithmetic oracle coverage; no proof authority
Target maturity: independently audited oracle for directed MPFR implementation
Required frozen inputs: packing proposal, finite/infinite audit, degree 255
Required evidence: basis identities, differential recovery, degree-255 route,
    hostile bounds, deterministic digests, and false authority
Stop/fail criteria: any exact mismatch, non-total ingress, or authority drift
Explicit non-goals: tail joins, Newton iteration, proof run, or candidate output
Downstream gate unlocked: directed MPFR finite core residual evaluator
"""

from __future__ import annotations

from fractions import Fraction
import hashlib
import importlib.util
import inspect
from pathlib import Path
import random
import sys
import unittest


HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
SOURCE = HERE / "core_green_operator_exact.py"
PACKING = (
    ROOT
    / "docs"
    / "research"
    / "nhm2-spherical-boson-star-v2-g2-d-core-tail-packing-proposal.md"
)


def _load() -> object:
    specification = importlib.util.spec_from_file_location(
        "_nhm2_core_green_operator_exact_test_target", SOURCE
    )
    if specification is None or specification.loader is None:
        raise RuntimeError("test_target_spec_unavailable")
    module = importlib.util.module_from_spec(specification)
    sys.modules[specification.name] = module
    specification.loader.exec_module(module)
    return module


M = _load()


def _power_evaluate(coefficients: tuple[Fraction, ...], q: Fraction) -> Fraction:
    accumulator = Fraction(0)
    for coefficient in reversed(coefficients):
        accumulator = accumulator * q + coefficient
    return accumulator


def _differentiate(coefficients: tuple[Fraction, ...]) -> tuple[Fraction, ...]:
    if len(coefficients) == 1:
        return (Fraction(0),)
    return tuple(index * coefficients[index] for index in range(1, len(coefficients)))


def _recover_raw_power(
    operator_p: int, green_power: tuple[Fraction, ...]
) -> tuple[Fraction, ...]:
    q_green = (Fraction(0),) + green_power
    first = _differentiate(q_green)
    second = _differentiate(first)
    result = [Fraction(0) for _ in green_power]
    if operator_p == 1:
        for power in range(len(result)):
            result[power] += first[power] / 1024
            if power > 0:
                result[power] += second[power - 1] / 1024
    else:
        for power in range(len(result)):
            result[power] += 3 * first[power] / 2048
            if power > 0:
                result[power] += 2 * second[power - 1] / 2048
    return tuple(result)


class CoreGreenOperatorExactTests(unittest.TestCase):
    def test_public_surface_and_signature_are_narrow(self) -> None:
        self.assertEqual(
            M.__all__,
            ["CoreGreenOperatorError", "apply_core_green_operator_exact"],
        )
        self.assertEqual(
            tuple(inspect.signature(M.apply_core_green_operator_exact).parameters),
            ("operator_p", "coefficients"),
        )

    def test_packing_proposal_binding_matches(self) -> None:
        self.assertEqual(PACKING.stat().st_size, M.PACKING_PROPOSAL_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(PACKING.read_bytes()).hexdigest(),
            M.PACKING_PROPOSAL_SHA256,
        )

    def test_shifted_chebyshev_columns_through_512_match_recurrence(self) -> None:
        previous = (Fraction(1),)
        current = (Fraction(-1), Fraction(2))
        self.assertEqual(M._shifted_chebyshev_power_column(0), previous)
        self.assertEqual(M._shifted_chebyshev_power_column(1), current)
        x = (Fraction(-1), Fraction(2))
        for degree in range(1, M.MAXIMUM_INPUT_DEGREE):
            following = tuple(
                2 * value for value in M._power_product(x, current)
            )
            following = M._power_subtract(following, previous)
            self.assertEqual(
                M._shifted_chebyshev_power_column(degree + 1), following, degree
            )
            previous, current = current, following

    def test_q_power_conversion_is_exact(self) -> None:
        powers = M._q_powers_shifted_chebyshev(64)
        probes = (
            Fraction(0),
            Fraction(1, 7),
            Fraction(1, 2),
            Fraction(9, 11),
            Fraction(1),
        )
        for power, coefficients in enumerate(powers):
            power_basis = M._to_power_basis(coefficients)
            expected = (Fraction(0),) * power + (Fraction(1),)
            self.assertEqual(power_basis, expected, power)
            for q in probes:
                self.assertEqual(_power_evaluate(power_basis, q), q**power)

    def test_green_multiplier_recovers_raw_differential_rows(self) -> None:
        generator = random.Random(0x4E484D32)
        for degree in (0, 1, 2, 7, 16, 32):
            source = tuple(
                Fraction(generator.randint(-9, 9), generator.randint(1, 9))
                for _ in range(degree + 1)
            )
            for operator_p in (1, 2):
                receipt = M.apply_core_green_operator_exact(operator_p, source)
                recovered = _recover_raw_power(
                    operator_p, receipt.power_coefficients_after_multiplier
                )
                self.assertEqual(
                    recovered, receipt.power_coefficients_before_multiplier
                )
                self.assertEqual(
                    M._to_power_basis(receipt.output_coefficients),
                    receipt.power_coefficients_after_multiplier,
                )

    def test_every_basis_mode_through_64_recovers_exactly(self) -> None:
        for mode in range(65):
            source = (Fraction(0),) * mode + (Fraction(1),)
            for operator_p in (1, 2):
                receipt = M.apply_core_green_operator_exact(operator_p, source)
                self.assertEqual(
                    _recover_raw_power(
                        operator_p, receipt.power_coefficients_after_multiplier
                    ),
                    receipt.power_coefficients_before_multiplier,
                    (mode, operator_p),
                )

    def test_physical_degree_255_route_is_exact_and_deterministic(self) -> None:
        source = tuple(
            Fraction((-1) ** mode, (mode + 1) * (mode + 2))
            for mode in range(M.PHYSICAL_CENTER_DEGREE + 1)
        )
        first = M.apply_core_green_operator_exact(2, source)
        second = M.apply_core_green_operator_exact(2, source)
        self.assertEqual(first, second)
        self.assertEqual(len(first.output_coefficients), 256)
        self.assertEqual(
            _recover_raw_power(2, first.power_coefficients_after_multiplier),
            first.power_coefficients_before_multiplier,
        )

    def test_ingress_is_bounded_and_proxy_trap_free(self) -> None:
        class Hostile:
            reads = 0

            def __getattribute__(self, name: str) -> object:
                if name != "reads":
                    type(self).reads += 1
                raise AssertionError("hostile_traversal")

        with self.assertRaises(M.CoreGreenOperatorError) as observed:
            M.apply_core_green_operator_exact(1, Hostile())
        self.assertEqual(observed.exception.code, "coefficient_tuple_required")
        self.assertEqual(Hostile.reads, 0)
        with self.assertRaises(M.CoreGreenOperatorError):
            M.apply_core_green_operator_exact(3, (Fraction(1),))
        with self.assertRaises(M.CoreGreenOperatorError):
            M.apply_core_green_operator_exact(1, (Fraction(0),) * 514)
        with self.assertRaises(M.CoreGreenOperatorError):
            M.apply_core_green_operator_exact(1, (True,))

    def test_receipt_locks_all_unearned_authority(self) -> None:
        receipt = M.apply_core_green_operator_exact(1, (Fraction(3, 7),))
        false_fields = (
            "independent_mpfr_replay_complete",
            "tail_join_implemented",
            "point_solver_implemented",
            "proof_execution_authorized",
            "candidate_executed",
            "branch_accepted",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        )
        self.assertTrue(all(getattr(receipt, field) is False for field in false_fields))
        values = {name: getattr(receipt, name) for name in receipt.__dataclass_fields__}
        values["physical_authority"] = True
        with self.assertRaises(M.CoreGreenOperatorError):
            M._CoreGreenOperatorReceipt(**values)

    def test_static_scope_has_no_runtime_or_output_surface(self) -> None:
        source = SOURCE.read_text(encoding="utf-8")
        for forbidden in (
            "gmpy2",
            "subprocess",
            "os.environ",
            "candidate_output",
            "registry",
            "casimir",
            "proof_execution_authorized=True",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
