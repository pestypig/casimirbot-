from __future__ import annotations

from dataclasses import FrozenInstanceError, replace
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

import output_arrays as arrays  # noqa: E402


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


def _fixture() -> arrays.FrozenOutputArrayInput:
    with arrays._owned_mpfr256_context() as context:
        nodes = {
            level: arrays._nodes(context, count, level)[1]
            for level, count in arrays.LEVELS
        }
    archives: list[arrays.FrozenProjectedArchive] = []
    for level, count in arrays.ARCHIVE_LEVELS:
        u = tuple(
            (count - 1 - index) / count * 0.02 for index in range(count - 1)
        ) + (0.0,)
        potential = tuple(
            -(count - 1 - index) / count * 0.01
            for index in range(count - 1)
        ) + (0.0,)
        archives.append(
            arrays.FrozenProjectedArchive(
                level_id=level,
                node_count=count,
                projected_state=u + potential + (-0.1,),
                projection_gate_passed=True,
                immutable_projected_archive=True,
            )
        )
    return arrays.FrozenOutputArrayInput(
        projected_archives=tuple(archives),
        immutable_l2_rho_source_support=nodes["L2"],
        join_barriers_u_u1_v_v1=(0.02, -0.001, -0.01, 0.001),
        accepted_tail_state=(0.05,) + (0.0,) * 64,
        final_residual_gate_passed=True,
        immutable_accepted_tail_state=True,
        primary_numerics_policy_sha256=arrays.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            arrays.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
    )


class _EqualitySpoof:
    def __eq__(self, _other: object) -> bool:
        return True

    def __ne__(self, _other: object) -> bool:
        return False


class OutputArrayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.input = _fixture()
        cls.result = arrays.materialize_output_array_diagnostic(cls.input)

    def test_exact_inventory_order_sizes_and_golden(self) -> None:
        result = self.result
        self.assertEqual(result.array_count, 20)
        self.assertEqual(result.value_count, 2_720)
        self.assertEqual(result.byte_length, 21_760)
        self.assertEqual(
            tuple((item.level_id, item.role) for item in result.arrays),
            tuple(
                (level, role)
                for level, _count in arrays.LEVELS
                for role in arrays.ROLE_ORDER
            ),
        )
        self.assertEqual(
            tuple(item.ordinal for item in result.arrays), tuple(range(20))
        )
        self.assertEqual(
            tuple(item.size_bytes for item in result.arrays),
            tuple(8 * count for _level, count in arrays.LEVELS for _ in range(5)),
        )
        self.assertEqual(
            result.aggregate_f64le_sha256,
            "aad768c9f7dd233a94055f0db4990fb9797abfe0848ba07453f04a71eff3914a",
        )
        self.assertEqual(
            result.arrays[0].f64le_sha256,
            "1f42876204af11c7eebab8bba8cbcd8694270e106f19479bbbd74fc47521ecab",
        )
        self.assertEqual(
            result.arrays[-1].f64le_sha256,
            "34a4bab4ef9a7cd385ebd6350fda398297580e3e1154b4fe416f89eb9ea7fdf4",
        )

    def test_same_level_base_arrays_are_exact_archive_bits(self) -> None:
        for level_ordinal, archive in enumerate(self.input.projected_archives):
            count = archive.node_count
            role_base = level_ordinal * 5
            self.assertEqual(
                self.result.arrays[role_base + 1].f64le,
                arrays._f64le(archive.projected_state[:count]),
            )
            self.assertEqual(
                self.result.arrays[role_base + 2].f64le,
                arrays._f64le(archive.projected_state[count : 2 * count]),
            )
        self.assertEqual(
            self.result.arrays[10].f64le,
            arrays._f64le(self.input.immutable_l2_rho_source_support),
        )

    def test_target_origin_scaling_and_every_infinity_barrier(self) -> None:
        l2 = self.input.projected_archives[2].projected_state
        expected_u = math.ldexp(l2[0], -10)
        expected_v = math.ldexp(l2[128], -10)
        for level_ordinal in range(4):
            role_base = level_ordinal * 5
            target_u = self.result.arrays[role_base + 3].values
            target_v = self.result.arrays[role_base + 4].values
            self.assertEqual(
                struct.pack("<d", target_u[0]), struct.pack("<d", expected_u)
            )
            self.assertEqual(
                struct.pack("<d", target_v[0]), struct.pack("<d", expected_v)
            )
            for role_offset in range(5):
                last = self.result.arrays[role_base + role_offset].values[-1]
                if role_offset == 0:
                    self.assertEqual(last, 1.0)
                else:
                    self.assertEqual(struct.pack("<d", last), bytes(8))

    def test_all_values_are_finite_and_negative_zero_free(self) -> None:
        for item in self.result.arrays:
            self.assertEqual(len(item.f64le), 8 * item.node_count)
            self.assertTrue(all(math.isfinite(value) for value in item.values))
            self.assertFalse(any(arrays._negative_zero(value) for value in item.values))

    def test_hostile_shape_domain_binding_and_authority_fail_closed(self) -> None:
        cases = (
            (
                replace(
                    self.input,
                    projected_archives=self.input.projected_archives[:2],
                ),
                "output_array_archive_inventory_invalid",
            ),
            (
                replace(self.input, final_residual_gate_passed=False),
                "output_array_final_tail_gate_invalid",
            ),
            (
                replace(self.input, execution_authority=True),
                "output_array_input_authority_invalid",
            ),
            (
                replace(self.input, primary_numerics_policy_sha256="0" * 64),
                "output_array_policy_binding_invalid",
            ),
            (
                replace(
                    self.input,
                    accepted_tail_state=(0.0,)
                    + self.input.accepted_tail_state[1:],
                ),
                "output_array_tail_C_domain_invalid",
            ),
            (
                replace(
                    self.input,
                    accepted_tail_state=(
                        self.input.accepted_tail_state[0],
                        -0.0,
                    )
                    + self.input.accepted_tail_state[2:],
                ),
                "output_array_binary64_negative_zero",
            ),
        )
        for hostile, expected in cases:
            with self.subTest(expected=expected):
                with self.assertRaises(arrays.OutputArrayError) as caught:
                    arrays.materialize_output_array_diagnostic(hostile)
                self.assertEqual(caught.exception.code, expected)

        rho = list(self.input.immutable_l2_rho_source_support)
        rho[17] = math.nextafter(rho[17], math.inf)
        hostile_rho = replace(
            self.input, immutable_l2_rho_source_support=tuple(rho)
        )
        with self.assertRaises(arrays.OutputArrayError) as caught:
            arrays.materialize_output_array_diagnostic(hostile_rho)
        self.assertEqual(caught.exception.code, "output_array_l2_rho_support_mismatch")

        for field in (
            "primary_numerics_policy_sha256",
            "primary_numerics_policy_canonical_size_bytes",
        ):
            with self.subTest(field=field):
                hostile = replace(self.input, **{field: _EqualitySpoof()})
                with self.assertRaises(arrays.OutputArrayError) as caught:
                    arrays.materialize_output_array_diagnostic(hostile)
                self.assertEqual(
                    caught.exception.code, "output_array_policy_binding_invalid"
                )

    def test_literal_role_barriers_infinity_and_tail_constant_chronology(self) -> None:
        get_d_operations: list[str] = []
        zero_operations: list[str] = []
        dictionary_events: list[tuple[str, str]] = []
        set_ui_values: list[tuple[str, int]] = []
        tail_constant_calls = 0
        original_get_d = arrays._get_d
        original_positive_zero = arrays._positive_zero
        original_set_ui = arrays._set_ui
        original_copy = arrays._copy
        original_binary = arrays._binary
        original_unary = arrays._unary
        original_cmp = arrays._cmp
        original_tail_constants = arrays._tail_constants

        def observed_get_d(
            context: gmpy2.context, value: gmpy2.mpfr, operation: str
        ) -> float:
            get_d_operations.append(operation)
            return original_get_d(context, value, operation)

        def observed_positive_zero(
            context: gmpy2.context, operation: str
        ) -> gmpy2.mpfr:
            zero_operations.append(operation)
            return original_positive_zero(context, operation)

        def observed_set_ui(
            context: gmpy2.context, value: int, operation: str
        ) -> gmpy2.mpfr:
            dictionary_events.append(("set_ui", operation))
            set_ui_values.append((operation, value))
            return original_set_ui(context, value, operation)

        def observed_copy(
            context: gmpy2.context, value: gmpy2.mpfr, operation: str
        ) -> gmpy2.mpfr:
            dictionary_events.append(("copy", operation))
            return original_copy(context, value, operation)

        def observed_binary(
            context: gmpy2.context,
            left: gmpy2.mpfr,
            right: gmpy2.mpfr,
            operation: str,
            kind: str,
        ) -> gmpy2.mpfr:
            dictionary_events.append((kind, operation))
            return original_binary(context, left, right, operation, kind)

        def observed_unary(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
            kind: str,
        ) -> gmpy2.mpfr:
            dictionary_events.append((kind, operation))
            return original_unary(context, value, operation, kind)

        def observed_cmp(
            context: gmpy2.context,
            left: gmpy2.mpfr,
            right: gmpy2.mpfr,
            operation: str,
        ) -> int:
            dictionary_events.append(("cmp", operation))
            return original_cmp(context, left, right, operation)

        def observed_tail_constants(*args: object, **kwargs: object) -> object:
            nonlocal tail_constant_calls
            tail_constant_calls += 1
            return original_tail_constants(*args, **kwargs)

        with (
            patch.object(arrays, "_get_d", side_effect=observed_get_d),
            patch.object(
                arrays, "_positive_zero", side_effect=observed_positive_zero
            ),
            patch.object(arrays, "_set_ui", side_effect=observed_set_ui),
            patch.object(arrays, "_copy", side_effect=observed_copy),
            patch.object(arrays, "_binary", side_effect=observed_binary),
            patch.object(arrays, "_unary", side_effect=observed_unary),
            patch.object(arrays, "_cmp", side_effect=observed_cmp),
            patch.object(
                arrays, "_tail_constants", side_effect=observed_tail_constants
            ),
        ):
            observed = arrays.materialize_output_array_diagnostic(self.input)
        self.assertEqual(
            observed.aggregate_f64le_sha256,
            self.result.aggregate_f64le_sha256,
        )
        self.assertEqual(len(get_d_operations), arrays.TOTAL_VALUE_COUNT)

        def role(operation: str) -> str:
            level = operation.split("[", maxsplit=1)[0].split(".", maxsplit=1)[0]
            if ".node.get_d" in operation:
                return f"{level}:rho"
            if ".base.u.get_d" in operation:
                return f"{level}:base_u"
            if ".base.V.get_d" in operation:
                return f"{level}:base_V"
            if ".target.u.get_d" in operation:
                return f"{level}:target_u"
            if ".target.V.get_d" in operation:
                return f"{level}:target_V"
            self.fail(f"unexpected get_d operation: {operation}")

        compressed: list[tuple[str, int]] = []
        for operation in get_d_operations:
            observed_role = role(operation)
            if compressed and compressed[-1][0] == observed_role:
                prior_role, prior_count = compressed[-1]
                compressed[-1] = (prior_role, prior_count + 1)
            else:
                compressed.append((observed_role, 1))
        self.assertEqual(
            tuple(compressed),
            tuple(
                (f"{level}:{role_name}", count)
                for level, count in arrays.LEVELS
                for role_name in ("rho", "base_u", "base_V", "target_u", "target_V")
            ),
        )
        for suffix in (
            "target.base.u.infinity",
            "target.base.V.infinity",
            "target.u.infinity",
            "target.V.infinity",
        ):
            self.assertEqual(
                sum(operation.endswith(suffix) for operation in zero_operations),
                len(arrays.LEVELS),
            )
        self.assertEqual(tail_constant_calls, 37)

        positions: dict[tuple[str, str], list[int]] = {}
        for event_index, event in enumerate(dictionary_events):
            positions.setdefault(event, []).append(event_index)

        def one_position(kind: str, operation: str) -> int:
            observed_positions = positions.get((kind, operation), [])
            self.assertEqual(
                len(observed_positions),
                1,
                f"expected one {kind} event for {operation}",
            )
            return observed_positions[0]

        weight_prefixes = tuple(
            operation.removesuffix(".weight_magnitude")
            for operation, _value in set_ui_values
            if operation.endswith(".weight_magnitude")
        )
        self.assertGreater(len(weight_prefixes), 0)
        self.assertEqual(len(weight_prefixes), len(set(weight_prefixes)))
        for prefix in weight_prefixes:
            magnitude_position = one_position(
                "set_ui", f"{prefix}.weight_magnitude"
            )
            two_position = one_position("set_ui", f"{prefix}.set_two")
            divide_position = one_position("div", f"{prefix}.weight_div_two")
            self.assertLess(magnitude_position, two_position)
            self.assertLess(two_position, divide_position)
            term_index = int(prefix.rsplit("[", maxsplit=1)[1][:-1])
            if term_index % 2:
                signed_position = one_position("neg", f"{prefix}.weight_neg")
                self.assertNotIn(("copy", f"{prefix}.weight_even_copy"), positions)
            else:
                signed_position = one_position(
                    "copy", f"{prefix}.weight_even_copy"
                )
                self.assertNotIn(("neg", f"{prefix}.weight_neg"), positions)
            self.assertLess(divide_position, signed_position)

        required_set_ui_zero_operations = tuple(
            operation
            for operation, value in set_ui_values
            if value == 0
            and operation.endswith(
                (
                    ".numerator.zero",
                    ".denominator.zero",
                    ".Ah.zero",
                    ".Aq.zero",
                    ".infinity_u",
                    ".infinity_V",
                )
            )
        )
        self.assertGreater(len(required_set_ui_zero_operations), 0)
        for operation in required_set_ui_zero_operations:
            one_position("set_ui", operation)
            self.assertNotIn(operation, zero_operations)
        self.assertEqual(
            sum(operation.endswith(".Ah.zero") for operation in required_set_ui_zero_operations),
            tail_constant_calls,
        )
        self.assertEqual(
            sum(operation.endswith(".Aq.zero") for operation in required_set_ui_zero_operations),
            tail_constant_calls,
        )
        self.assertEqual(
            sum(operation.endswith(".infinity_u") for operation in required_set_ui_zero_operations),
            1,
        )
        self.assertEqual(
            sum(operation.endswith(".infinity_V") for operation in required_set_ui_zero_operations),
            1,
        )

        target_coordinate_compares = tuple(
            operation
            for kind, operation in dictionary_events
            if kind == "cmp" and operation.endswith(".target_coordinate.cmp_infinity")
        )
        self.assertEqual(len(target_coordinate_compares), 256)
        self.assertTrue(
            all(operation.startswith("AUDIT[") for operation in target_coordinate_compares)
        )
        self.assertFalse(
            any(
                kind == "cmp"
                and (
                    operation.endswith(".core.u.cmp_infinity")
                    or operation.endswith(".core.V.cmp_infinity")
                )
                for kind, operation in dictionary_events
            )
        )
        self.assertFalse(
            any(operation.endswith(".target.set_one") for operation, _ in set_ui_values)
        )
        target_thirty_two_operations = tuple(
            operation
            for operation, value in set_ui_values
            if value == 32 and operation.endswith(".target.set_thirty_two")
        )
        self.assertEqual(
            len(target_thirty_two_operations),
            sum(count for _level, count in arrays.LEVELS) - len(arrays.LEVELS),
        )
        for operation in target_thirty_two_operations:
            target_prefix = operation.removesuffix(".set_thirty_two")
            coordinate_prefix = target_prefix.removesuffix(".target")
            one_at = one_position(
                "set_ui", f"{coordinate_prefix}.target_coordinate.set_one"
            )
            thirty_two_at = one_position("set_ui", operation)
            lambda_at = one_position("div", f"{target_prefix}.lambda")
            self.assertLess(one_at, thirty_two_at)
            self.assertLess(thirty_two_at, lambda_at)

    def test_sqrt_and_log_domain_checks_precede_the_primitive(self) -> None:
        events: list[tuple[str, str]] = []
        original_positive_zero = arrays._positive_zero
        original_cmp = arrays._cmp
        original_sqrt = gmpy2.sqrt
        original_log = gmpy2.log

        def observed_positive_zero(
            context: gmpy2.context, operation: str
        ) -> gmpy2.mpfr:
            events.append(("zero", operation))
            return original_positive_zero(context, operation)

        def observed_cmp(
            context: gmpy2.context,
            left: gmpy2.mpfr,
            right: gmpy2.mpfr,
            operation: str,
        ) -> int:
            events.append(("cmp", operation))
            return original_cmp(context, left, right, operation)

        def observed_sqrt(value: gmpy2.mpfr) -> gmpy2.mpfr:
            events.append(("primitive", "sqrt"))
            return original_sqrt(value)

        def observed_log(value: gmpy2.mpfr) -> gmpy2.mpfr:
            events.append(("primitive", "log"))
            return original_log(value)

        with arrays._owned_mpfr256_context() as context:
            four = arrays._set_ui(context, 4, "domain_fixture.four")
            two = arrays._set_ui(context, 2, "domain_fixture.two")
            zero = arrays._positive_zero(context, "domain_fixture.zero")
            negative_one = arrays._set_si(context, -1, "domain_fixture.negative_one")
            with (
                patch.object(
                    arrays, "_positive_zero", side_effect=observed_positive_zero
                ),
                patch.object(arrays, "_cmp", side_effect=observed_cmp),
                patch.object(gmpy2, "sqrt", side_effect=observed_sqrt),
                patch.object(gmpy2, "log", side_effect=observed_log),
            ):
                square_root = arrays._unary(context, four, "probe.sqrt", "sqrt")
                logarithm = arrays._unary(context, two, "probe.log", "log")
                self.assertEqual(float(square_root), 2.0)
                self.assertGreater(float(logarithm), 0.0)
                self.assertEqual(
                    events,
                    [
                        ("zero", "probe.sqrt.domain.set_positive_zero"),
                        ("cmp", "probe.sqrt.domain.cmp_zero"),
                        ("primitive", "sqrt"),
                        ("zero", "probe.log.domain.set_positive_zero"),
                        ("cmp", "probe.log.domain.cmp_zero"),
                        ("primitive", "log"),
                    ],
                )

                events.clear()
                with self.assertRaises(arrays.OutputArrayError) as caught:
                    arrays._unary(
                        context, negative_one, "probe.sqrt_negative", "sqrt"
                    )
                self.assertEqual(
                    caught.exception.code, "output_array_mpfr_sqrt_domain_invalid"
                )
                self.assertEqual(
                    events,
                    [
                        (
                            "zero",
                            "probe.sqrt_negative.domain.set_positive_zero",
                        ),
                        ("cmp", "probe.sqrt_negative.domain.cmp_zero"),
                    ],
                )

                for hostile, operation in (
                    (zero, "probe.log_zero"),
                    (negative_one, "probe.log_negative"),
                ):
                    events.clear()
                    with self.subTest(operation=operation):
                        with self.assertRaises(arrays.OutputArrayError) as caught:
                            arrays._unary(context, hostile, operation, "log")
                        self.assertEqual(
                            caught.exception.code,
                            "output_array_mpfr_log_domain_invalid",
                        )
                        self.assertEqual(
                            events,
                            [
                                (
                                    "zero",
                                    f"{operation}.domain.set_positive_zero",
                                ),
                                ("cmp", f"{operation}.domain.cmp_zero"),
                            ],
                        )

    def test_compare_wrapper_checks_flags_immediately(self) -> None:
        with arrays._owned_mpfr256_context() as context:
            left = arrays._set_ui(context, 1, "cmp_fixture.left")
            right = arrays._set_ui(context, 1, "cmp_fixture.right")

            def inexact_compare(
                _left: gmpy2.mpfr, _right: gmpy2.mpfr
            ) -> int:
                self.assertFalse(context.inexact)
                context.inexact = True
                return 0

            with patch.object(gmpy2, "cmp", side_effect=inexact_compare):
                with self.assertRaises(arrays.OutputArrayError) as caught:
                    arrays._cmp(context, left, right, "probe.cmp_inexact")
            self.assertEqual(
                caught.exception.code, "output_array_mpfr_compare_inexact"
            )

            def invalid_compare(
                _left: gmpy2.mpfr, _right: gmpy2.mpfr
            ) -> int:
                self.assertFalse(context.invalid)
                context.invalid = True
                return 0

            with patch.object(gmpy2, "cmp", side_effect=invalid_compare):
                with self.assertRaises(arrays.OutputArrayError) as caught:
                    arrays._cmp(context, left, right, "probe.cmp_invalid")
            self.assertEqual(
                caught.exception.code, "output_array_mpfr_exceptional_flag"
            )

    def test_complete_mpfr_context_is_restored(self) -> None:
        ambient = gmpy2.get_context()
        saved = ambient.copy()
        try:
            ambient.precision = 37
            ambient.round = gmpy2.RoundDown
            ambient.emin = -99
            ambient.emax = 99
            ambient.trap_inexact = True
            ambient.inexact = True
            ambient.allow_complex = True
            before = _context_snapshot(ambient)
            observed = arrays.materialize_output_array_diagnostic(self.input)
            self.assertEqual(
                observed.aggregate_f64le_sha256,
                self.result.aggregate_f64le_sha256,
            )
            self.assertEqual(_context_snapshot(ambient), before)
            with self.assertRaises(arrays.OutputArrayError):
                arrays.materialize_output_array_diagnostic(
                    replace(self.input, accepted_tail_state=(0.0,) * 65)
                )
            self.assertEqual(_context_snapshot(ambient), before)
        finally:
            gmpy2.set_context(saved)

    def test_result_is_frozen_and_all_authority_locks_are_false(self) -> None:
        self.assertTrue(all(value is False for value in arrays.AUTHORITY_LOCKS.values()))
        self.assertFalse(self.result.materialization_is_acceptance)
        for field in (
            "implementation_closure_complete",
            "runtime_closure_complete",
            "scientific_preseal_present",
            "candidate_execution_authorized",
            "candidate_executed",
            "output_present",
            "output_accepted",
            "replay_authority",
            "independent_agreement",
            "diagnostic_pass_authority",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(self.result, field), False)
        self.assertTrue(self.result.diagnostic_dynamic_numeric_storage_used)
        self.assertFalse(self.result.fixed_native_arenas_used)
        self.assertFalse(self.result.exact_runtime_resource_model_satisfied)
        self.assertEqual(self.result.runtime_blockers, arrays.RUNTIME_BLOCKERS)
        with self.assertRaises(FrozenInstanceError):
            self.result.array_count = 19  # type: ignore[misc]
        with self.assertRaises(TypeError):
            replace(self.result, physical_authority=True)

    def test_literal_graph_and_source_disjointness(self) -> None:
        self.assertIn("retained_exact_rhoMp", arrays.BASE_GRAPH)
        self.assertIn("lambda=1/32", arrays.TARGET_GRAPH)
        self.assertIn("reuse_coordinate_one", arrays.TARGET_GRAPH)
        source = (HERE / "output_arrays.py").read_text(encoding="utf-8")
        self.assertEqual(source.count("gmpy2.cmp("), 1)
        self.assertIn(
            'f"{operation}.term[{index}].set_two"',
            source,
        )
        self.assertIn(
            'f"{operation}.term[{index}].weight_even_copy"',
            source,
        )
        self.assertNotIn(
            'f"{level_id}[{index}].target.set_one"',
            source,
        )
        for forbidden_positive_zero_destination in (
            'f"{operation}.numerator.zero"',
            'f"{operation}.denominator.zero"',
            'f"{operation}.Ah.zero"',
            'f"{operation}.Aq.zero"',
            'f"{operation}.infinity_u"',
            'f"{operation}.infinity_V"',
        ):
            self.assertNotIn(
                f"_positive_zero(context, {forbidden_positive_zero_destination})",
                source,
            )
        for forbidden in (
            "import spectral",
            "import core_operator",
            "import tail_operator",
            "numpy",
            "scipy",
        ):
            self.assertNotIn(forbidden, source)


if __name__ == "__main__":
    unittest.main()
