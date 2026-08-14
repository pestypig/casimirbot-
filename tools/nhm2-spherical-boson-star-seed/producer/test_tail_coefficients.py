from __future__ import annotations

from dataclasses import FrozenInstanceError
import hashlib
import math
from pathlib import Path
import struct
import sys
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import tail_coefficients as coefficients  # noqa: E402


CONTEXT_FIELDS = (
    "precision",
    "round",
    "emin",
    "emax",
    "subnormalize",
    "trap_underflow",
    "trap_overflow",
    "trap_inexact",
    "trap_invalid",
    "trap_erange",
    "trap_divzero",
    "underflow",
    "overflow",
    "inexact",
    "invalid",
    "erange",
    "divzero",
    "allow_complex",
    "rational_division",
    "allow_release_gil",
)


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


def _state() -> tuple[float, ...]:
    h = tuple(0.0 if index % 5 == 0 else (index - 11.0) / 32.0 for index in range(32))
    q = tuple(0.0 if index % 7 == 0 else (17.0 - index) / 64.0 for index in range(32))
    return (1.25, *h, *q)


class TailCoefficientTests(unittest.TestCase):
    def test_exact_terminal_barrier_and_fresh_payloads(self) -> None:
        state = _state()
        result = coefficients.materialize_tail_coefficient_diagnostic(state)
        self.assertEqual(
            struct.pack("<32d", *result.h),
            struct.pack("<32d", *state[1:33]),
        )
        self.assertEqual(
            struct.pack("<32d", *result.q),
            struct.pack("<32d", *state[33:65]),
        )
        self.assertEqual(result.h_f64le, struct.pack("<32d", *result.h))
        self.assertEqual(result.q_f64le, struct.pack("<32d", *result.q))
        self.assertIsNot(result.h_f64le, result.q_f64le)
        self.assertEqual(len(result.h_f64le), 256)
        self.assertEqual(len(result.q_f64le), 256)
        self.assertEqual(
            result.h_f64le_sha256,
            hashlib.sha256(result.h_f64le).hexdigest(),
        )
        self.assertEqual(
            result.q_f64le_sha256,
            hashlib.sha256(result.q_f64le).hexdigest(),
        )
        self.assertEqual(result.set_d_count, 64)
        self.assertEqual(result.get_d_count, 64)
        self.assertEqual(result.observed_gmpy2_version, gmpy2.version())
        self.assertEqual(result.observed_mpfr_version, gmpy2.mpfr_version())

    def test_literal_h_then_q_operation_order_and_one_get_d_each(self) -> None:
        events: list[str] = []
        original_set = coefficients._set_d
        original_get = coefficients._get_d

        def observed_set(
            context: gmpy2.context, value: float, operation: str
        ) -> gmpy2.mpfr:
            events.append(operation)
            return original_set(context, value, operation)

        def observed_get(
            context: gmpy2.context, value: gmpy2.mpfr, operation: str
        ) -> float:
            events.append(operation)
            return original_get(context, value, operation)

        with (
            patch.object(coefficients, "_set_d", side_effect=observed_set),
            patch.object(coefficients, "_get_d", side_effect=observed_get),
        ):
            coefficients.materialize_tail_coefficient_diagnostic(_state())
        expected = []
        for label in ("h", "q"):
            for index in range(32):
                expected.extend(
                    [f"{label}[{index}].set_d", f"{label}[{index}].get_d"]
                )
        self.assertEqual(events, expected)

    def test_complete_context_is_installed_and_restored_on_success_and_failure(self) -> None:
        ambient = gmpy2.get_context()
        saved = ambient.copy()
        try:
            ambient.precision = 71
            ambient.round = gmpy2.RoundDown
            ambient.emin = -89
            ambient.emax = 97
            ambient.subnormalize = True
            ambient.trap_underflow = True
            ambient.trap_overflow = True
            ambient.trap_inexact = True
            ambient.trap_invalid = True
            ambient.trap_erange = True
            ambient.trap_divzero = True
            ambient.underflow = True
            ambient.overflow = True
            ambient.inexact = True
            ambient.invalid = True
            ambient.erange = True
            ambient.divzero = True
            ambient.allow_complex = True
            ambient.rational_division = True
            ambient.allow_release_gil = True
            before = _context_snapshot(ambient)
            result = coefficients.materialize_tail_coefficient_diagnostic(_state())
            self.assertEqual(len(result.h), 32)
            self.assertEqual(_context_snapshot(ambient), before)

            validation_contexts: list[tuple[object, ...]] = []
            original_validate = coefficients._validate_state

            def observed_validate(value: object) -> tuple[float, ...]:
                validation_contexts.append(_context_snapshot(gmpy2.get_context()))
                return original_validate(value)

            with patch.object(
                coefficients, "_validate_state", side_effect=observed_validate
            ):
                coefficients.materialize_tail_coefficient_diagnostic(_state())
            self.assertEqual(len(validation_contexts), 1)
            installed = dict(zip(CONTEXT_FIELDS, validation_contexts[0]))
            self.assertEqual(installed["precision"], 256)
            self.assertEqual(installed["round"], gmpy2.RoundToNearest)
            self.assertEqual((installed["emin"], installed["emax"]), (-1_000_000, 1_000_000))

            with patch.object(
                coefficients,
                "_materialize_group",
                side_effect=coefficients.TailCoefficientError("synthetic_failure"),
            ):
                with self.assertRaises(coefficients.TailCoefficientError) as caught:
                    coefficients.materialize_tail_coefficient_diagnostic(_state())
                self.assertEqual(caught.exception.code, "synthetic_failure")
            self.assertEqual(_context_snapshot(ambient), before)
        finally:
            gmpy2.set_context(saved)

    def test_every_mpfr_flag_is_sampled(self) -> None:
        class FlagProbe:
            def __init__(self) -> None:
                self.reads: list[str] = []

            def __getattribute__(self, name: str) -> object:
                if name in {
                    "underflow",
                    "overflow",
                    "inexact",
                    "invalid",
                    "erange",
                    "divzero",
                }:
                    object.__getattribute__(self, "reads").append(name)
                    return False
                return object.__getattribute__(self, name)

        probe = FlagProbe()
        coefficients._check_flags(probe, "probe")  # type: ignore[arg-type]
        self.assertEqual(probe.reads, list(CONTEXT_FIELDS[11:17]))

    def test_hostile_shape_numeric_and_domain_inputs_fail_closed(self) -> None:
        state = _state()
        cases = (
            (list(state), "tail_coefficient_state_shape_invalid"),
            (state[:-1], "tail_coefficient_state_shape_invalid"),
            ((0.0, *state[1:]), "tail_coefficient_C_domain_invalid"),
            ((-1.0, *state[1:]), "tail_coefficient_C_domain_invalid"),
            ((1, *state[1:]), "tail_coefficient_binary64_type_invalid"),
            ((*state[:8], float("nan"), *state[9:]), "tail_coefficient_binary64_nonfinite"),
            ((*state[:8], float("inf"), *state[9:]), "tail_coefficient_binary64_nonfinite"),
            ((*state[:8], -0.0, *state[9:]), "tail_coefficient_binary64_negative_zero"),
        )
        for value, code in cases:
            with self.subTest(code=code):
                with self.assertRaises(coefficients.TailCoefficientError) as caught:
                    coefficients.materialize_tail_coefficient_diagnostic(value)
                self.assertEqual(caught.exception.code, code)

    def test_zero_is_canonical_positive_zero(self) -> None:
        operations: list[str] = []
        original = coefficients._set_positive_zero

        def observed(
            context: gmpy2.context, operation: str
        ) -> gmpy2.mpfr:
            operations.append(operation)
            return original(context, operation)

        with patch.object(
            coefficients, "_set_positive_zero", side_effect=observed
        ):
            result = coefficients.materialize_tail_coefficient_diagnostic(
                (1.0, *(0.0 for _ in range(64)))
            )
        self.assertEqual(
            operations,
            [
                *(f"h[{index}].set_d.canonical_zero" for index in range(32)),
                *(f"q[{index}].set_d.canonical_zero" for index in range(32)),
            ],
        )
        self.assertEqual(result.h_f64le, bytes(256))
        self.assertEqual(result.q_f64le, bytes(256))
        self.assertTrue(all(math.copysign(1.0, value) > 0 for value in (*result.h, *result.q)))

    def test_result_is_frozen_and_every_authority_lock_is_false(self) -> None:
        result = coefficients.materialize_tail_coefficient_diagnostic(_state())
        with self.assertRaises(FrozenInstanceError):
            result.h = ()  # type: ignore[misc]
        self.assertTrue(coefficients.AUTHORITY_LOCKS)
        self.assertTrue(all(value is False for value in coefficients.AUTHORITY_LOCKS.values()))
        for key in coefficients.AUTHORITY_LOCKS:
            self.assertIs(getattr(result, key), False)
        with self.assertRaises(TypeError):
            coefficients.AUTHORITY_LOCKS["execution_authorized"] = True  # type: ignore[index]

    def test_policy_identity_and_graph_are_literal(self) -> None:
        self.assertEqual(
            coefficients.PRIMARY_NUMERICS_POLICY_SHA256,
            "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
        )
        self.assertEqual(
            coefficients.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            80_055,
        )
        self.assertIn("h_0_through_31_then_q_0_through_31", coefficients.TAIL_COEFFICIENT_OPERATION_GRAPH)
        self.assertIn("enter_complete_owned_MPFR256_RNDN_context;validate", coefficients.TAIL_COEFFICIENT_OPERATION_GRAPH)
        self.assertIn("set_positive_zero_exactly_once", coefficients.TAIL_COEFFICIENT_OPERATION_GRAPH)
        self.assertIn("no_binary64_arithmetic_or_direct_bit_copy", coefficients.TAIL_COEFFICIENT_OPERATION_GRAPH)


if __name__ == "__main__":
    unittest.main()
