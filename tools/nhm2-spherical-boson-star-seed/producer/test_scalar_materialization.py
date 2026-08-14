from __future__ import annotations

from dataclasses import FrozenInstanceError, fields, replace
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

import scalar_materialization as scalar  # noqa: E402


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


def _input() -> scalar.FrozenScalarMaterializationInput:
    u = tuple(0.0 if index == 127 else 1.0 / (index + 1) for index in range(128))
    potential = tuple(0.0 if index == 127 else -0.25 / (index + 1) for index in range(128))
    projected = (*u, *potential, -0.125)
    tail = (1.5, *(0.0 for _ in range(64)))
    return scalar.FrozenScalarMaterializationInput(
        projected_l2_nu=projected[-1],
        projected_l2_v_at_origin=projected[128],
        accepted_tail_c=tail[0],
        projected_l2_archive_f64le_sha256=hashlib.sha256(
            struct.pack("<257d", *projected)
        ).hexdigest(),
        accepted_tail_state_f64le_sha256=hashlib.sha256(
            struct.pack("<65d", *tail)
        ).hexdigest(),
        projection_gate_passed=True,
        immutable_projected_archive=True,
        final_residual_gate_passed=True,
        immutable_accepted_tail_state=True,
    )


class ScalarMaterializationTests(unittest.TestCase):
    def test_exact_values_order_buffers_and_golden(self) -> None:
        result = scalar.materialize_scalar_diagnostic(_input())
        self.assertEqual(result.scalar_order, scalar.SCALAR_ORDER)
        self.assertEqual(len(result.scalar_values), 9)
        self.assertEqual(len(result.scalar_buffers_f64le), 9)
        self.assertEqual(len({id(value) for value in result.scalar_buffers_f64le}), 9)
        self.assertEqual(result.aggregate_f64le, struct.pack("<9d", *result.scalar_values))
        self.assertEqual(
            result.aggregate_f64le_sha256,
            hashlib.sha256(result.aggregate_f64le).hexdigest(),
        )
        self.assertEqual(
            result.aggregate_f64le_sha256,
            "95fb8fbc9729e99f45beec0fe76b451aa57bcdf16548107dad569567099eac5b",
        )
        nu0, vc, n0, c_value, kappa, sigma, lambda_value, nu_star, w_seed = result.scalar_values
        self.assertEqual(struct.pack("<d", nu0), struct.pack("<d", -0.125))
        self.assertEqual(struct.pack("<d", vc), struct.pack("<d", -0.25))
        self.assertEqual(struct.pack("<d", c_value), struct.pack("<d", 1.5))
        self.assertEqual(struct.pack("<d", kappa), struct.pack("<d", 0.5))
        self.assertEqual(struct.pack("<d", sigma), struct.pack("<d", 2.0))
        self.assertEqual(struct.pack("<d", lambda_value), struct.pack("<d", 1.0 / 32.0))
        self.assertEqual(struct.pack("<d", nu_star), struct.pack("<d", -0.125 / 1024.0))
        self.assertEqual(struct.pack("<d", w_seed), struct.pack("<d", math.sqrt(1.0 - 0.25 / 1024.0)))
        self.assertGreater(n0, 0.0)

    def test_literal_operation_and_barrier_order(self) -> None:
        events: list[str] = []
        originals = {
            name: getattr(scalar, name)
            for name in ("_set_d", "_set_si", "_set_ui", "_binary", "_sqrt", "_const_pi", "_get_d")
        }

        def wrap(name: str):
            original = originals[name]

            def observed(*args: object, **kwargs: object) -> object:
                if name == "_binary":
                    events.append(str(args[1]))
                else:
                    events.append(str(args[-1]))
                return original(*args, **kwargs)

            return observed

        with (
            patch.object(scalar, "_set_d", side_effect=wrap("_set_d")),
            patch.object(scalar, "_set_si", side_effect=wrap("_set_si")),
            patch.object(scalar, "_set_ui", side_effect=wrap("_set_ui")),
            patch.object(scalar, "_binary", side_effect=wrap("_binary")),
            patch.object(scalar, "_sqrt", side_effect=wrap("_sqrt")),
            patch.object(scalar, "_const_pi", side_effect=wrap("_const_pi")),
            patch.object(scalar, "_get_d", side_effect=wrap("_get_d")),
        ):
            scalar.materialize_scalar_diagnostic(_input())
        self.assertEqual(
            events,
            [
                "set_nu", "set_Vc", "set_C", "set_minus_two", "mul_minus_two_nu",
                "sqrt_kappa", "div_C_over_kappa", "set_one", "sub_sigma", "set_four",
                "const_pi", "mul_four_pi", "mul_N0", "set_thirty_two", "div_lambda",
                "mul_lambda_squared", "mul_nu_star", "set_two", "mul_two_nu_star",
                "add_w_squared", "sqrt_w_seed", "get_d_nu0", "get_d_Vc", "get_d_N0",
                "get_d_C", "get_d_kappa", "get_d_sigma", "get_d_lambda",
                "get_d_nu_star", "get_d_wSeed",
            ],
        )

    def test_complete_context_precedes_input_read_and_restores(self) -> None:
        ambient = gmpy2.get_context()
        saved = ambient.copy()
        try:
            ambient.precision = 79
            ambient.round = gmpy2.RoundDown
            ambient.emin = -91
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
            observed: list[tuple[object, ...]] = []
            original = scalar._validate_input

            def validate(value: object) -> tuple[float, float, float]:
                observed.append(_context_snapshot(gmpy2.get_context()))
                return original(value)

            with patch.object(scalar, "_validate_input", side_effect=validate):
                scalar.materialize_scalar_diagnostic(_input())
            installed = dict(zip(CONTEXT_FIELDS, observed[0]))
            self.assertEqual(installed["precision"], 256)
            self.assertEqual(installed["round"], gmpy2.RoundToNearest)
            self.assertEqual((installed["emin"], installed["emax"]), (-1_000_000, 1_000_000))
            self.assertEqual(_context_snapshot(ambient), before)

            with patch.object(
                scalar, "_const_pi", side_effect=scalar.ScalarMaterializationError("synthetic_failure")
            ):
                with self.assertRaises(scalar.ScalarMaterializationError):
                    scalar.materialize_scalar_diagnostic(_input())
            self.assertEqual(_context_snapshot(ambient), before)
        finally:
            gmpy2.set_context(saved)

    def test_operation_counts_and_all_flags(self) -> None:
        result = scalar.materialize_scalar_diagnostic(_input())
        self.assertEqual(
            (
                result.set_d_count, result.set_si_count, result.set_ui_count,
                result.multiply_count, result.divide_count, result.subtract_count,
                result.add_count, result.square_root_count, result.const_pi_count,
                result.terminal_get_d_count,
            ),
            (3, 1, 4, 6, 2, 1, 1, 2, 1, 9),
        )

        class FlagProbe:
            def __init__(self) -> None:
                self.reads: list[str] = []

            def __getattribute__(self, name: str) -> object:
                if name in {"underflow", "overflow", "inexact", "invalid", "erange", "divzero"}:
                    object.__getattribute__(self, "reads").append(name)
                    return False
                return object.__getattribute__(self, name)

        probe = FlagProbe()
        scalar._check_flags(probe, "probe")  # type: ignore[arg-type]
        self.assertEqual(probe.reads, list(CONTEXT_FIELDS[11:17]))

    def test_every_zero_destination_uses_the_positive_zero_primitive(self) -> None:
        source = _input()
        zero_case = replace(
            source,
            projected_l2_nu=-0.5,
            projected_l2_v_at_origin=0.0,
            accepted_tail_c=1.0,
        )
        operations: list[str] = []
        original = scalar._set_positive_zero

        def observed(
            context: gmpy2.context, operation: str
        ) -> gmpy2.mpfr:
            operations.append(operation)
            return original(context, operation)

        with patch.object(scalar, "_set_positive_zero", side_effect=observed):
            result = scalar.materialize_scalar_diagnostic(zero_case)
        self.assertEqual(
            operations,
            ["set_Vc.canonical_zero", "sub_sigma.canonical_zero"],
        )
        self.assertEqual(struct.pack("<d", result.scalar_values[1]), bytes(8))
        self.assertEqual(struct.pack("<d", result.scalar_values[5]), bytes(8))

    def test_shape_gate_domain_numeric_and_authority_fail_closed(self) -> None:
        source = _input()
        cases = (
            (object(), "scalar_input_type_invalid"),
            (replace(source, projection_gate_passed=False), "scalar_projection_gate_missing"),
            (replace(source, immutable_projected_archive=False), "scalar_projected_archive_not_immutable"),
            (replace(source, final_residual_gate_passed=False), "scalar_tail_gate_missing"),
            (replace(source, immutable_accepted_tail_state=False), "scalar_tail_state_not_immutable"),
            (replace(source, execution_authority=True), "scalar_input_authority_invalid"),
            (replace(source, projected_l2_v_at_origin=-0.0), "scalar_binary64_negative_zero"),
            (replace(source, projected_l2_nu=0.0), "scalar_projected_nu_domain_invalid"),
            (replace(source, accepted_tail_c=0.0), "scalar_tail_C_domain_invalid"),
            (replace(source, projected_l2_archive_f64le_sha256="0"), "scalar_projected_archive_hash_invalid"),
            (replace(source, projected_l2_archive_f64le_sha256="0" * 64), "scalar_projected_archive_hash_invalid"),
            (replace(source, accepted_tail_state_f64le_sha256="A" * 64), "scalar_tail_state_hash_invalid"),
        )
        for value, code in cases:
            with self.subTest(code=code):
                with self.assertRaises(scalar.ScalarMaterializationError) as caught:
                    scalar.materialize_scalar_diagnostic(value)
                self.assertEqual(caught.exception.code, code)

        extreme = replace(
            source,
            projected_l2_nu=-float.fromhex("0x0.0000000000001p-1022"),
            accepted_tail_c=sys.float_info.max,
        )
        with self.assertRaises(scalar.ScalarMaterializationError) as caught:
            scalar.materialize_scalar_diagnostic(extreme)
        self.assertIn(
            caught.exception.code,
            {"scalar_mpfr_exceptional_flag", "scalar_output_nonfinite"},
        )

    def test_result_is_frozen_and_all_authority_locks_are_false(self) -> None:
        result = scalar.materialize_scalar_diagnostic(_input())
        with self.assertRaises(FrozenInstanceError):
            result.scalar_values = ()  # type: ignore[misc]
        self.assertTrue(all(value is False for value in scalar.AUTHORITY_LOCKS.values()))
        for name in scalar.AUTHORITY_LOCKS:
            self.assertIs(getattr(result, name), False)
        with self.assertRaises(TypeError):
            scalar.AUTHORITY_LOCKS["execution_authorized"] = True  # type: ignore[index]

    def test_primary_identity_and_exact_result_field_surface(self) -> None:
        self.assertEqual(scalar.PRIMARY_NUMERICS_POLICY_SHA256, "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4")
        self.assertEqual(scalar.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES, 80_055)
        self.assertEqual(tuple(field.name for field in fields(scalar.FrozenScalarMaterializationInput)), (
            "projected_l2_nu", "projected_l2_v_at_origin", "accepted_tail_c",
            "projected_l2_archive_f64le_sha256", "accepted_tail_state_f64le_sha256",
            "projection_gate_passed",
            "immutable_projected_archive", "final_residual_gate_passed",
            "immutable_accepted_tail_state", *scalar.INPUT_FALSE_FIELDS,
        ))


if __name__ == "__main__":
    unittest.main()
