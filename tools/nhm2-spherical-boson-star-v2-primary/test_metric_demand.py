from __future__ import annotations

import ast
from contextlib import ExitStack, contextmanager
import ctypes
from dataclasses import FrozenInstanceError, fields
from decimal import Decimal, localcontext
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
import unittest


MODULE_PATH = Path(__file__).with_name("metric_demand.py")
SPEC = importlib.util.spec_from_file_location("nhm2_metric_demand", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("metric_demand_import_spec_unavailable")
metric_demand = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = metric_demand
SPEC.loader.exec_module(metric_demand)


class _InjectedFailure(BaseException):
    pass


@contextmanager
def _patched_attribute(target: object, name: str, replacement: object):
    original = getattr(target, name)
    setattr(target, name, replacement)
    try:
        yield original
    finally:
        setattr(target, name, original)


def _word(value: float) -> int:
    return int.from_bytes(struct.pack(">d", value), "big")


def _float_from_le(buffer: bytes, index: int) -> float:
    return struct.unpack_from("<d", buffer, 8 * index)[0]


def _endpoint_from_word(word: int, direction: str) -> dict[str, object]:
    sign_bit = word >> 63
    biased = (word >> 52) & 0x7FF
    fraction = word & ((1 << 52) - 1)
    if biased == 0x7FF:
        raise ValueError("test_endpoint_requires_finite_word")
    if biased == 0 and fraction == 0:
        return {
            "direction": direction,
            "exponent2": "0",
            "mantissaHex": "0",
            "precisionBits": 256,
            "sign": "positive_zero",
        }
    if biased == 0:
        integer = fraction
        exponent2 = -1074
    else:
        integer = (1 << 52) | fraction
        exponent2 = biased - 1023 - 52
    while integer & 1 == 0:
        integer >>= 1
        exponent2 += 1
    return {
        "direction": direction,
        "exponent2": str(exponent2),
        "mantissaHex": format(integer, "x"),
        "precisionBits": 256,
        "sign": "minus" if sign_bit else "plus",
    }


def _endpoint(value: float, direction: str) -> dict[str, object]:
    return _endpoint_from_word(_word(value), direction)


def _quantity(quantity_id: str, value: float) -> dict[str, object]:
    word = _word(value)
    return {
        "centralF64WordHex": f"{word:016x}",
        "centralMpfr256": _endpoint_from_word(word, "MPFR_RNDN"),
        "lowerMpfr256": _endpoint_from_word(word, "MPFR_RNDD"),
        "quantityId": quantity_id,
        "upperMpfr256": _endpoint_from_word(word, "MPFR_RNDU"),
    }


def _payload(
    values: dict[str, float], *, scale_lower: float = 1.0, scale_upper: float = 1.0
) -> dict[str, object]:
    groups = []
    for group_name, _, _ in metric_demand.RADIUS_GROUPS:
        groups.append(
            {
                "quantities": [
                    _quantity(quantity_id, values[quantity_id])
                    for quantity_id in metric_demand.QUANTITY_ORDER
                ],
                "radiusGroup": group_name,
            }
        )
    return {
        "contractVersion": metric_demand.PROGRAM_INPUT_VERSION,
        "radiusGroups": groups,
        "siScale": {
            "stressScaleK2LowerMpfr256": _endpoint(scale_lower, "MPFR_RNDD"),
            "stressScaleK2UpperMpfr256": _endpoint(scale_upper, "MPFR_RNDU"),
            "stressScaleNCentralMpfr256": _endpoint(1.0, "MPFR_RNDN"),
        },
    }


def _canonical_wire(payload: dict[str, object]) -> bytes:
    return json.dumps(
        payload,
        ensure_ascii=False,
        allow_nan=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


ZERO_VALUES = {quantity_id: 0.0 for quantity_id in metric_demand.QUANTITY_ORDER}
ANALYTIC_VALUES = {
    "F1": 0.0,
    "F0_prime": 1.0,
    "F1_prime": 0.0,
    "F0_double_prime": 0.0,
    "F1_double_prime": 0.0,
}


class MetricDemandTests(unittest.TestCase):
    def tearDown(self) -> None:
        metric_demand._RUNTIME.mpfr.mpfr_clear_flags()

    def assert_error(self, wire: bytes, code: str) -> None:
        with self.assertRaises(metric_demand.MetricDemandError) as caught:
            metric_demand.execute_synthetic_metric_demand(wire)
        self.assertEqual(caught.exception.code, code)

    def native_context_snapshot(self) -> tuple[int, int, int]:
        mpfr = metric_demand._RUNTIME.mpfr
        return (
            int(mpfr.mpfr_get_emin()),
            int(mpfr.mpfr_get_emax()),
            int(mpfr.mpfr_flags_save()),
        )

    def set_native_underflow_flag(self) -> None:
        mpfr = metric_demand._RUNTIME.mpfr
        mpfr.mpfr_set_underflow.argtypes = ()
        mpfr.mpfr_set_underflow.restype = None
        mpfr.mpfr_set_underflow()

    def test_zero_fixture_exact_bytes_receipt_trace_and_authority_locks(self) -> None:
        wire = _canonical_wire(_payload(ZERO_VALUES))
        result = metric_demand.execute_synthetic_metric_demand(wire)
        self.assertIs(type(result.metric_demand_f64le), bytes)
        self.assertIs(type(result.absolute_error_f64le), bytes)
        self.assertEqual(len(result.metric_demand_f64le), 5_120)
        self.assertEqual(len(result.absolute_error_f64le), 5_120)
        self.assertEqual(result.metric_demand_f64le, bytes(5_120))
        self.assertEqual(result.absolute_error_f64le, bytes(5_120))
        receipt = result.receipt
        self.assertEqual(
            receipt.program_sha256,
            "c64cd963ec7a8ad2485de2e4ff16e307da61a6fd1e108439ae56eade76b00fee",
        )
        self.assertEqual(receipt.program_canonical_size_bytes, 48_595)
        self.assertEqual(
            receipt.program_raw_sha256,
            "959d8a8b5211f3549e2124ffdf0db36779f83723d9cdacbf15088b2daf4c851c",
        )
        self.assertEqual(receipt.program_raw_size_bytes, 51_850)
        self.assertEqual(receipt.sample_visit_order, metric_demand.SAMPLE_VISIT_ORDER)
        self.assertEqual(sorted(receipt.sample_visit_order), list(range(64)))
        self.assertEqual(receipt.component_order, metric_demand.COMPONENT_ORDER)
        self.assertEqual(receipt.stored_element_count_per_role, 640)
        self.assertEqual(receipt.get_d_observation_count, 1_280)
        self.assertEqual(receipt.trace_event_count, 261_695)
        self.assertEqual(
            receipt.trace_chronology_sha256,
            "9752d2b69cad350293314784201ab94b1472035a824e477d276343ec43fecf19",
        )
        self.assertEqual(receipt.arithmetic_observation_count, 39_769)
        self.assertEqual(receipt.comparison_observation_count, 19_582)
        self.assertEqual(receipt.mpfr_destination_count, 39_769)
        self.assertEqual(receipt.mpz_destination_count, 63)
        self.assertEqual(
            receipt.operation_counts,
            (
                ("mpfr_add", 2_880),
                ("mpfr_clear", 39_769),
                ("mpfr_clear_flags", 121_263),
                ("mpfr_cmp", 17_470),
                ("mpfr_cmp_ui", 2_112),
                ("mpfr_div", 768),
                ("mpfr_div_ui", 192),
                ("mpfr_exp", 192),
                ("mpfr_flags_restore", 1),
                ("mpfr_flags_save", 2),
                ("mpfr_get_d", 1_280),
                ("mpfr_get_emax", 2),
                ("mpfr_get_emin", 2),
                ("mpfr_init2", 39_769),
                ("mpfr_mul", 20_800),
                ("mpfr_mul_2si", 3),
                ("mpfr_mul_si", 64),
                ("mpfr_mul_ui", 256),
                ("mpfr_neg", 384),
                ("mpfr_set", 6_339),
                ("mpfr_set_d", 1_300),
                ("mpfr_set_emax", 2),
                ("mpfr_set_emin", 2),
                ("mpfr_set_si", 832),
                ("mpfr_set_ui", 3_708),
                ("mpfr_set_z", 3),
                ("mpfr_sqrt", 192),
                ("mpfr_sub", 1_472),
                ("mpfr_ui_div", 384),
                ("mpz_clear", 63),
                ("mpz_get_str", 63),
                ("mpz_init", 63),
                ("mpz_set_str", 63),
            ),
        )
        self.assertEqual(
            receipt.metric_demand_sha256, hashlib.sha256(bytes(5_120)).hexdigest()
        )
        self.assertEqual(receipt.absolute_error_sha256, receipt.metric_demand_sha256)
        self.assertTrue(receipt.all_destinations_single_assignment)
        self.assertTrue(receipt.reverse_lifecycle_cleanup_verified)
        self.assertTrue(receipt.caller_context_restored_before_receipt)
        self.assertTrue(receipt.caller_flags_restored_before_receipt)
        self.assertTrue(receipt.primitive_flags_verified)
        self.assertTrue(receipt.serialized_center_enclosure_verified)
        self.assertTrue(receipt.synthetic_input_only)
        self.assertTrue(receipt.calculation_only)
        self.assertTrue(receipt.arithmetic_uses_native_mpfr_gmp_abi)
        self.assertTrue(
            receipt.native_runtime_disk_files_hash_verified_at_module_admission
        )
        self.assertFalse(receipt.exact_loaded_native_module_byte_identity_proved)
        self.assertFalse(receipt.native_module_hash_to_load_toctou_closed)
        self.assertTrue(
            receipt.gmpy2_used_only_for_runtime_location_and_version_metadata
        )
        self.assertFalse(receipt.gmpy2_numeric_arithmetic_used)
        self.assertEqual(
            receipt.implementation_blockers,
            (
                "exact_loaded_native_module_byte_identity_unproved_due_"
                "gmpy2_preload_and_hash_to_load_toctou",
            ),
        )
        authority_fields = (
            "branch_geometry_accepted",
            "metric_demand_tensor_materialized",
            "metric_demand_absolute_error_bound_materialized",
            "derivation_receipt_materialized",
            "interval_trace_server_replayed",
            "si_scale_receipt_verified",
            "scientific_candidate_manifest_authority",
            "scientific_preseal_authority",
            "execution_ready",
            "replay_ready",
            "publication_ready",
            "certification_ready",
            "execution_authority",
            "replay_authority",
            "independent_agreement",
            "semiclassical_stress_noise_lamp",
            "semiclassical_constraint_algebra_lamp",
            "diagnostic_pass",
            "theory_graph_promotion",
            "physical_viability",
            "propulsion",
            "transport",
        )
        self.assertTrue(
            set(authority_fields).issubset(
                {field.name for field in fields(receipt)}
            )
        )
        for field_name in authority_fields:
            self.assertIs(getattr(receipt, field_name), False, field_name)
        with self.assertRaises(FrozenInstanceError):
            result.receipt.execution_authority = True
        with self.assertRaises(FrozenInstanceError):
            result.metric_demand_f64le = b""

    def test_analytic_formula_all_ordinals_components_and_byte_enclosure(self) -> None:
        result = metric_demand.execute_synthetic_metric_demand(
            _canonical_wire(
                _payload(
                    ANALYTIC_VALUES,
                    scale_lower=1.0 - 1e-12,
                    scale_upper=1.0 + 1e-12,
                )
            )
        )
        with localcontext() as context:
            context.prec = 100
            for sample in range(64):
                ix = sample % 4
                iy = (sample // 4) % 4
                iz = sample // 16
                numerators = tuple(
                    Decimal(metric_demand.AXIS_NUMERATORS[index])
                    for index in (ix, iy, iz)
                )
                q = sum(value * value for value in numerators)
                sqrt_q = q.sqrt()
                x = sqrt_q / Decimal(8)
                n = tuple(value / sqrt_q for value in numerators)
                rho = Decimal(0)
                pr = Decimal(2) / x
                pt = Decimal(1) + Decimal(1) / x
                diff = pr - pt
                expected = (
                    rho,
                    Decimal(0),
                    Decimal(0),
                    Decimal(0),
                    pt + diff * n[0] * n[0],
                    diff * n[0] * n[1],
                    diff * n[0] * n[2],
                    pt + diff * n[1] * n[1],
                    diff * n[1] * n[2],
                    pt + diff * n[2] * n[2],
                )
                for component, truth in enumerate(expected):
                    index = 10 * sample + component
                    center = _float_from_le(result.metric_demand_f64le, index)
                    error = _float_from_le(result.absolute_error_f64le, index)
                    self.assertGreaterEqual(error, 0.0)
                    center_exact = Decimal.from_float(center)
                    error_exact = Decimal.from_float(error)
                    self.assertLessEqual(center_exact - error_exact, truth)
                    self.assertLessEqual(truth, center_exact + error_exact)
                    if truth == 0:
                        center_word = int.from_bytes(
                            result.metric_demand_f64le[8 * index : 8 * index + 8],
                            "little",
                        )
                        error_word = int.from_bytes(
                            result.absolute_error_f64le[8 * index : 8 * index + 8],
                            "little",
                        )
                        self.assertEqual(center_word, 0)
                        self.assertEqual(error_word, 0)
                self.assertEqual(
                    _float_from_le(result.metric_demand_f64le, 10 * sample + 5) > 0,
                    numerators[0] * numerators[1] > 0,
                )
                self.assertEqual(
                    _float_from_le(result.metric_demand_f64le, 10 * sample + 6) > 0,
                    numerators[0] * numerators[2] > 0,
                )
                self.assertEqual(
                    _float_from_le(result.metric_demand_f64le, 10 * sample + 8) > 0,
                    numerators[1] * numerators[2] > 0,
                )
        self.assertEqual(result.receipt.get_d_observation_count, 1_280)
        self.assertEqual(result.receipt.stored_element_count_per_role, 640)

    def test_context_activation_guard_closes_post_return_exception_window(self) -> None:
        self.set_native_underflow_flag()
        before = self.native_context_snapshot()
        captured_guards: list[metric_demand._ContextGuard] = []
        original_enter = metric_demand._context_enter

        def injected_after_return(trace, guard):
            original_enter(trace, guard)
            captured_guards.append(guard)
            self.assertTrue(metric_demand._EXECUTION_LOCK.locked())
            raise _InjectedFailure("post_return_activation_window")

        with _patched_attribute(
            metric_demand, "_context_enter", injected_after_return
        ):
            with self.assertRaises(_InjectedFailure):
                metric_demand.execute_synthetic_metric_demand(
                    _canonical_wire(_payload(ZERO_VALUES))
                )
        self.assertEqual(self.native_context_snapshot(), before)
        self.assertEqual(len(captured_guards), 1)
        self.assertTrue(captured_guards[0].restored)
        self.assertFalse(captured_guards[0].active)
        self.assertFalse(metric_demand._EXECUTION_LOCK.locked())
        self.assertFalse(metric_demand._CONTEXT_POISONED)

    def test_context_restore_individual_one_shot_failures_recover(self) -> None:
        cases = (
            ("mpfr_set_emax", 2, "exception"),
            ("mpfr_set_emin", 2, "exception"),
            ("mpfr_set_emax", 2, "status"),
            ("mpfr_set_emin", 2, "status"),
            ("mpfr_get_emax", 2, "exception"),
            ("mpfr_get_emin", 2, "exception"),
            ("mpfr_flags_restore", 1, "exception"),
            ("mpfr_flags_save", 2, "exception"),
        )
        for primitive, fail_at, failure_kind in cases:
            with self.subTest(primitive=primitive, failure_kind=failure_kind):
                metric_demand._RUNTIME.mpfr.mpfr_clear_flags()
                self.set_native_underflow_flag()
                before = self.native_context_snapshot()
                original = getattr(metric_demand._RUNTIME.mpfr, primitive)
                state = {"calls": 0, "locks": []}

                def one_shot(
                    *args,
                    _original=original,
                    _state=state,
                    _failure_kind=failure_kind,
                ):
                    _state["calls"] += 1
                    _state["locks"].append(metric_demand._EXECUTION_LOCK.locked())
                    if _state["calls"] == fail_at:
                        if _failure_kind == "status":
                            return 1
                        raise _InjectedFailure(primitive)
                    return _original(*args)

                with _patched_attribute(
                    metric_demand._RUNTIME.mpfr, primitive, one_shot
                ):
                    with self.assertRaises(metric_demand.MetricDemandError) as caught:
                        metric_demand.execute_synthetic_metric_demand(b"{ }")
                    self.assertEqual(caught.exception.code, "wire_not_canonical")
                self.assertEqual(self.native_context_snapshot(), before)
                self.assertGreater(state["calls"], fail_at)
                self.assertTrue(all(state["locks"]))
                self.assertFalse(metric_demand._EXECUTION_LOCK.locked())
                self.assertFalse(metric_demand._CONTEXT_POISONED)

    def test_context_restore_combined_one_shot_failures_recover(self) -> None:
        self.set_native_underflow_flag()
        before = self.native_context_snapshot()
        fail_at_by_primitive = {
            "mpfr_set_emax": 2,
            "mpfr_set_emin": 2,
            "mpfr_get_emax": 2,
            "mpfr_get_emin": 2,
            "mpfr_flags_restore": 1,
            "mpfr_flags_save": 2,
        }
        states: dict[str, dict[str, object]] = {}
        with ExitStack() as stack:
            for primitive, fail_at in fail_at_by_primitive.items():
                original = getattr(metric_demand._RUNTIME.mpfr, primitive)
                state: dict[str, object] = {"calls": 0, "locks": []}
                states[primitive] = state

                def one_shot(
                    *args,
                    _original=original,
                    _state=state,
                    _primitive=primitive,
                    _fail_at=fail_at,
                ):
                    _state["calls"] = int(_state["calls"]) + 1
                    locks = _state["locks"]
                    assert isinstance(locks, list)
                    locks.append(metric_demand._EXECUTION_LOCK.locked())
                    if _state["calls"] == _fail_at:
                        raise _InjectedFailure(_primitive)
                    return _original(*args)

                stack.enter_context(
                    _patched_attribute(
                        metric_demand._RUNTIME.mpfr, primitive, one_shot
                    )
                )
            with self.assertRaises(metric_demand.MetricDemandError) as caught:
                metric_demand.execute_synthetic_metric_demand(b"{ }")
            self.assertEqual(caught.exception.code, "wire_not_canonical")
        self.assertEqual(self.native_context_snapshot(), before)
        for primitive, state in states.items():
            self.assertGreater(
                int(state["calls"]),
                fail_at_by_primitive[primitive],
                primitive,
            )
            self.assertTrue(all(state["locks"]), primitive)
        self.assertFalse(metric_demand._EXECUTION_LOCK.locked())
        self.assertFalse(metric_demand._CONTEXT_POISONED)

    def test_persistent_restore_failure_poisoning_supersedes_primary(self) -> None:
        runtime = metric_demand._RUNTIME
        runtime.mpfr.mpfr_clear_flags()
        self.set_native_underflow_flag()
        before = self.native_context_snapshot()
        originals = {
            name: getattr(runtime.mpfr, name)
            for name in ("mpfr_set_emax", "mpfr_set_emin", "mpfr_flags_restore")
        }
        states = {
            name: {"calls": 0, "locks": []}
            for name in originals
        }

        def persistent_emax(*args):
            state = states["mpfr_set_emax"]
            state["calls"] += 1
            state["locks"].append(metric_demand._EXECUTION_LOCK.locked())
            if state["calls"] >= 2:
                raise _InjectedFailure("persistent_emax_restore")
            return originals["mpfr_set_emax"](*args)

        def one_shot_emin(*args):
            state = states["mpfr_set_emin"]
            state["calls"] += 1
            state["locks"].append(metric_demand._EXECUTION_LOCK.locked())
            if state["calls"] == 2:
                raise _InjectedFailure("one_shot_emin_restore")
            return originals["mpfr_set_emin"](*args)

        def one_shot_flags(*args):
            state = states["mpfr_flags_restore"]
            state["calls"] += 1
            state["locks"].append(metric_demand._EXECUTION_LOCK.locked())
            if state["calls"] == 1:
                raise _InjectedFailure("one_shot_flags_restore")
            return originals["mpfr_flags_restore"](*args)

        try:
            with ExitStack() as stack:
                stack.enter_context(
                    _patched_attribute(runtime.mpfr, "mpfr_set_emax", persistent_emax)
                )
                stack.enter_context(
                    _patched_attribute(runtime.mpfr, "mpfr_set_emin", one_shot_emin)
                )
                stack.enter_context(
                    _patched_attribute(
                        runtime.mpfr, "mpfr_flags_restore", one_shot_flags
                    )
                )
                with self.assertRaises(metric_demand.MetricDemandError) as caught:
                    metric_demand.execute_synthetic_metric_demand(b"{ }")
                self.assertEqual(
                    caught.exception.code, "mpfr_context_restore_failed"
                )
                self.assertTrue(
                    any(
                        note == "suppressed_primary:wire_not_canonical"
                        for note in caught.exception.__notes__
                    )
                )
                self.assertEqual(int(runtime.mpfr.mpfr_get_emin()), before[0])
                self.assertEqual(int(runtime.mpfr.mpfr_flags_save()), before[2])
                self.assertNotEqual(int(runtime.mpfr.mpfr_get_emax()), before[1])
                self.assertTrue(metric_demand._CONTEXT_POISONED)
                self.assertFalse(metric_demand._EXECUTION_LOCK.locked())
                self.assert_error(
                    _canonical_wire(_payload(ZERO_VALUES)),
                    "mpfr_context_poisoned",
                )
            self.assertGreaterEqual(states["mpfr_set_emax"]["calls"], 3)
            self.assertGreaterEqual(states["mpfr_set_emin"]["calls"], 3)
            self.assertGreaterEqual(states["mpfr_flags_restore"]["calls"], 2)
            for state in states.values():
                self.assertTrue(all(state["locks"]))
        finally:
            originals["mpfr_set_emax"](before[1])
            originals["mpfr_set_emin"](before[0])
            originals["mpfr_flags_restore"](before[2], metric_demand.MPFR_FLAGS_ALL)
            metric_demand._CONTEXT_POISONED = False
            metric_demand._CONTEXT_POISON_REASONS = ()
        self.assertEqual(self.native_context_snapshot(), before)

    def test_canonical_schema_endpoint_and_hostile_words_fail_closed(self) -> None:
        base = _payload(ZERO_VALUES)
        canonical = _canonical_wire(base)
        self.assert_error(b" " + canonical, "wire_not_canonical")
        duplicate = canonical.replace(
            b"{", b'{"contractVersion":"duplicate",', 1
        )
        self.assert_error(duplicate, "wire_duplicate_key")

        extra = _payload(ZERO_VALUES)
        extra["extra"] = "forbidden"
        self.assert_error(_canonical_wire(extra), "wire_object_shape")

        reordered = _payload(ZERO_VALUES)
        reordered["radiusGroups"][0], reordered["radiusGroups"][1] = (
            reordered["radiusGroups"][1],
            reordered["radiusGroups"][0],
        )
        self.assert_error(_canonical_wire(reordered), "radius_group_order_invalid")

        missing = _payload(ZERO_VALUES)
        missing["radiusGroups"][0]["quantities"].pop()
        self.assert_error(_canonical_wire(missing), "wire_array_shape")

        even = _payload(ANALYTIC_VALUES)
        central = even["radiusGroups"][0]["quantities"][1]["centralMpfr256"]
        central["mantissaHex"] = "2"
        central["exponent2"] = "-1"
        self.assert_error(_canonical_wire(even), "endpoint_nonzero_not_normalized")

        mismatch = _payload(ZERO_VALUES)
        mismatch["radiusGroups"][0]["quantities"][0][
            "centralF64WordHex"
        ] = "3ff0000000000000"
        self.assert_error(_canonical_wire(mismatch), "central_f64_identity_mismatch")

        direction = _payload(ZERO_VALUES)
        direction["radiusGroups"][0]["quantities"][0]["lowerMpfr256"][
            "direction"
        ] = "MPFR_RNDU"
        self.assert_error(_canonical_wire(direction), "endpoint_direction_invalid")

        exponent = _payload(ANALYTIC_VALUES)
        endpoint = exponent["radiusGroups"][0]["quantities"][1]["centralMpfr256"]
        endpoint["exponent2"] = "1000000"
        self.assert_error(_canonical_wire(exponent), "endpoint_exponent_range")

        negative_zero = _payload(ZERO_VALUES)
        negative_zero["radiusGroups"][0]["quantities"][0][
            "centralF64WordHex"
        ] = "8000000000000000"
        self.assert_error(_canonical_wire(negative_zero), "central_f64_negative_zero")

        nonfinite = _payload(ZERO_VALUES)
        nonfinite["radiusGroups"][0]["quantities"][0][
            "centralF64WordHex"
        ] = "7ff0000000000000"
        self.assert_error(_canonical_wire(nonfinite), "central_f64_nonfinite")

        bom = b"\xef\xbb\xbf" + canonical
        self.assert_error(bom, "wire_bom_forbidden")
        self.assert_error(b"\xff", "wire_utf8_invalid")

    def test_resource_bounds_and_escaped_surrogate_fail_typed(self) -> None:
        deep = b"[" * 26 + b"null" + b"]" * 26
        self.assert_error(deep, "wire_depth_limit")
        wide = ("[" + ",".join("null" for _ in range(1_025)) + "]").encode()
        self.assert_error(wide, "wire_array_limit")
        long_string = json.dumps("x" * 32_769, separators=(",", ":")).encode()
        self.assert_error(long_string, "wire_string_limit")
        self.assert_error(b'"\\ud800"', "wire_resource_validation_invalid")
        self.assert_error(
            b" " * (metric_demand.MAX_WIRE_UTF8_BYTES + 1), "wire_byte_limit"
        )

    def test_object_key_limits_and_duplicate_errors_never_echo_keys(self) -> None:
        oversized_key = "attacker_" + "x" * metric_demand.MAX_STRING_UTF8_BYTES
        oversized_wire = json.dumps(
            {oversized_key: None},
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode()
        with self.assertRaises(metric_demand.MetricDemandError) as oversized:
            metric_demand.execute_synthetic_metric_demand(oversized_wire)
        self.assertEqual(oversized.exception.code, "wire_object_key_limit")
        self.assertLess(len(str(oversized.exception)), 128)
        self.assertNotIn("attacker_", str(oversized.exception))
        self.assertRegex(
            oversized.exception.detail or "", r"\Akey_sha256=[0-9a-f]{64}\Z"
        )

        duplicate_key = "duplicate_secret_" + "q" * 4_096
        encoded_key = json.dumps(duplicate_key, ensure_ascii=False).encode()
        duplicate_wire = (
            b"{" + encoded_key + b":null," + encoded_key + b":null}"
        )
        with self.assertRaises(metric_demand.MetricDemandError) as duplicate:
            metric_demand.execute_synthetic_metric_demand(duplicate_wire)
        self.assertEqual(duplicate.exception.code, "wire_duplicate_key")
        self.assertLess(len(str(duplicate.exception)), 128)
        self.assertNotIn("duplicate_secret_", str(duplicate.exception))
        self.assertRegex(
            duplicate.exception.detail or "", r"\Akey_sha256=[0-9a-f]{64}\Z"
        )

        over_limit_duplicate = "never_echo_" + "z" * 40_000
        encoded_over_limit = json.dumps(over_limit_duplicate).encode()
        over_limit_wire = (
            b"{"
            + encoded_over_limit
            + b":null,"
            + encoded_over_limit
            + b":null}"
        )
        with self.assertRaises(metric_demand.MetricDemandError) as capped_first:
            metric_demand.execute_synthetic_metric_demand(over_limit_wire)
        self.assertEqual(capped_first.exception.code, "wire_object_key_limit")
        self.assertNotIn("never_echo_", str(capped_first.exception))

    def test_object_pair_hook_enforces_aggregate_before_duplicates(self) -> None:
        hook = metric_demand._make_bounded_object_pairs_hook()
        pairs = [
            (f"{index:02x}" + "k" * (metric_demand.MAX_STRING_UTF8_BYTES - 2), None)
            for index in range(9)
        ]
        with self.assertRaises(metric_demand.MetricDemandError) as caught:
            hook(pairs)
        self.assertEqual(caught.exception.code, "wire_aggregate_utf8_limit")
        self.assertLess(len(str(caught.exception)), 128)
        self.assertRegex(
            caught.exception.detail or "", r"\Akey_sha256=[0-9a-f]{64}\Z"
        )

        surrogate_wire = b'{"\\ud800":null}'
        self.assert_error(surrogate_wire, "wire_object_key_utf8_invalid")

    def test_endpoint_unique_zero_precision_and_quantity_order(self) -> None:
        nonunique_zero = _payload(ZERO_VALUES)
        endpoint = nonunique_zero["radiusGroups"][0]["quantities"][0][
            "centralMpfr256"
        ]
        endpoint["mantissaHex"] = "1"
        self.assert_error(_canonical_wire(nonunique_zero), "endpoint_zero_not_unique")

        precision_string = _payload(ZERO_VALUES)
        precision_string["radiusGroups"][0]["quantities"][0]["centralMpfr256"][
            "precisionBits"
        ] = "256"
        self.assert_error(
            _canonical_wire(precision_string), "endpoint_precision_invalid"
        )

        quantity_order = _payload(ZERO_VALUES)
        quantity_order["radiusGroups"][0]["quantities"][0][
            "quantityId"
        ] = "F0_prime"
        self.assert_error(_canonical_wire(quantity_order), "quantity_order_invalid")

    def test_native_init_registration_windows_clear_exactly_once(self) -> None:
        runtime = metric_demand._RUNTIME
        self.assertTrue(metric_demand._EXECUTION_LOCK.acquire(blocking=False))
        try:
            runtime.mpfr.mpfr_clear_flags()
            original_mpfr_clear = runtime.mpfr.mpfr_clear
            mpfr_clear_calls: list[int] = []

            def count_mpfr_clear(pointer):
                mpfr_clear_calls.append(1)
                return original_mpfr_clear(pointer)

            with _patched_attribute(runtime.mpfr, "mpfr_clear", count_mpfr_clear):
                for failure_point in ("first_post_init", "record"):
                    mpfr_trace = metric_demand._Trace(runtime)
                    original_record = mpfr_trace.record

                    def fail_mpfr_registration(destination_id, raw):
                        raise _InjectedFailure("mpfr_first_post_init")

                    def fail_mpfr_init_record(operation, fields=()):
                        if operation == "mpfr_init2":
                            raise _InjectedFailure("mpfr_init_record")
                        return original_record(operation, fields)

                    if failure_point == "first_post_init":
                        mpfr_trace._mpfr_registration_value = (
                            fail_mpfr_registration
                        )
                    else:
                        mpfr_trace.record = fail_mpfr_init_record
                    with self.assertRaises(_InjectedFailure):
                        mpfr_trace._init("test", failure_point, "C")
                    expected_clear_count = (
                        1 if failure_point == "first_post_init" else 2
                    )
                    self.assertEqual(len(mpfr_clear_calls), expected_clear_count)
                    self.assertEqual(mpfr_trace.values, [])
                    mpfr_trace.record = original_record
                    mpfr_trace.cleanup()
                    self.assertEqual(len(mpfr_clear_calls), expected_clear_count)

            original_mpz_clear = runtime.mpz_clear
            mpz_clear_calls: list[int] = []

            def count_mpz_clear(pointer):
                mpz_clear_calls.append(1)
                return original_mpz_clear(pointer)

            with _patched_attribute(runtime, "mpz_clear", count_mpz_clear):
                for failure_point in ("first_post_init", "record"):
                    mpz_trace = metric_demand._Trace(runtime)
                    original_record = mpz_trace.record

                    def fail_mpz_registration(name, raw):
                        raise _InjectedFailure("mpz_first_post_init")

                    def fail_mpz_init_record(operation, fields=()):
                        if operation == "mpz_init":
                            raise _InjectedFailure("mpz_init_record")
                        return original_record(operation, fields)

                    if failure_point == "first_post_init":
                        mpz_trace._mpz_registration_value = fail_mpz_registration
                    else:
                        mpz_trace.record = fail_mpz_init_record
                    with self.assertRaises(_InjectedFailure):
                        mpz_trace.new_mpz(
                            f"scope.test.{failure_point}.mantissa", "1"
                        )
                    self.assertEqual(
                        len(mpz_clear_calls),
                        1 if failure_point == "first_post_init" else 2,
                    )
                    self.assertEqual(mpz_trace.mpz_values, [])
                    mpz_trace.record = original_record
                    mpz_trace.cleanup()
                    self.assertEqual(
                        len(mpz_clear_calls),
                        1 if failure_point == "first_post_init" else 2,
                    )
        finally:
            metric_demand._EXECUTION_LOCK.release()

    def test_mid_cleanup_failures_attempt_every_item_and_restore_context(self) -> None:
        runtime = metric_demand._RUNTIME
        runtime.mpfr.mpfr_clear_flags()
        self.set_native_underflow_flag()
        before = self.native_context_snapshot()
        original_mpfr_clear = runtime.mpfr.mpfr_clear
        original_mpz_clear = runtime.mpz_clear
        original_record = metric_demand._Trace.record
        original_cleanup = metric_demand._Trace.cleanup
        mpfr_attempts: dict[int, int] = {}
        mpfr_actual: dict[int, int] = {}
        mpz_actual: dict[int, int] = {}
        lock_observations: list[bool] = []
        failed_mpfr_address: list[int] = []
        failed_record = {"done": False}
        captured: dict[str, metric_demand._Trace] = {}

        def pointer_address(pointer) -> int:
            return ctypes.addressof(pointer._obj)

        def one_shot_mpfr_clear(pointer):
            address = pointer_address(pointer)
            mpfr_attempts[address] = mpfr_attempts.get(address, 0) + 1
            lock_observations.append(metric_demand._EXECUTION_LOCK.locked())
            if not failed_mpfr_address and len(mpfr_attempts) == 10:
                failed_mpfr_address.append(address)
                raise _InjectedFailure("mid_mpfr_clear")
            mpfr_actual[address] = mpfr_actual.get(address, 0) + 1
            return original_mpfr_clear(pointer)

        def count_mpz_clear(pointer):
            address = pointer_address(pointer)
            lock_observations.append(metric_demand._EXECUTION_LOCK.locked())
            mpz_actual[address] = mpz_actual.get(address, 0) + 1
            return original_mpz_clear(pointer)

        def one_shot_clear_record(self, operation, fields=()):
            if operation == "mpz_clear" and not failed_record["done"]:
                failed_record["done"] = True
                if not metric_demand._EXECUTION_LOCK.locked():
                    raise AssertionError("cleanup_trace_record_without_lease")
                raise _InjectedFailure("mid_mpz_clear_record")
            return original_record(self, operation, fields)

        def capture_cleanup(self):
            captured["trace"] = self
            return original_cleanup(self)

        with ExitStack() as stack:
            stack.enter_context(
                _patched_attribute(runtime.mpfr, "mpfr_clear", one_shot_mpfr_clear)
            )
            stack.enter_context(
                _patched_attribute(runtime, "mpz_clear", count_mpz_clear)
            )
            stack.enter_context(
                _patched_attribute(
                    metric_demand._Trace, "record", one_shot_clear_record
                )
            )
            stack.enter_context(
                _patched_attribute(metric_demand._Trace, "cleanup", capture_cleanup)
            )
            with self.assertRaises(metric_demand.MetricDemandError) as caught:
                metric_demand.execute_synthetic_metric_demand(
                    _canonical_wire(_payload(ZERO_VALUES))
                )
            self.assertEqual(
                caught.exception.code, "mpfr_lifecycle_cleanup_failed"
            )
            self.assertLess(len(str(caught.exception)), 256)

        trace = captured["trace"]
        self.assertTrue(trace.cleanup_complete)
        self.assertEqual(len(trace.cleared_destination_ids), len(trace.values))
        self.assertEqual(len(trace.cleared_mpz_ids), len(trace.mpz_values))
        self.assertEqual(len(mpfr_actual), len(trace.values))
        self.assertEqual(len(mpz_actual), len(trace.mpz_values))
        self.assertTrue(all(count == 1 for count in mpfr_actual.values()))
        self.assertTrue(all(count == 1 for count in mpz_actual.values()))
        self.assertEqual(len(failed_mpfr_address), 1)
        self.assertEqual(mpfr_attempts[failed_mpfr_address[0]], 2)
        self.assertTrue(failed_record["done"])
        self.assertTrue(all(lock_observations))
        self.assertEqual(self.native_context_snapshot(), before)
        self.assertFalse(metric_demand._EXECUTION_LOCK.locked())
        self.assertFalse(metric_demand._CONTEXT_POISONED)

    def test_scale_interval_must_enclose_central(self) -> None:
        payload = _payload(ZERO_VALUES, scale_lower=2.0, scale_upper=2.0)
        self.assert_error(
            _canonical_wire(payload), "input_interval_does_not_enclose_central"
        )

    def test_full_gmpy2_context_controls_are_unchanged(self) -> None:
        context = metric_demand.gmpy2.get_context()
        names = (
            "precision",
            "real_prec",
            "imag_prec",
            "round",
            "real_round",
            "imag_round",
            "emin",
            "emax",
            "subnormalize",
            "allow_complex",
            "allow_release_gil",
            "rational_division",
            "trap_underflow",
            "trap_overflow",
            "trap_inexact",
            "trap_invalid",
            "trap_erange",
            "trap_divzero",
        )
        before = tuple((name, getattr(context, name)) for name in names)
        self.assert_error(b"{ }", "wire_not_canonical")
        after = tuple((name, getattr(context, name)) for name in names)
        self.assertEqual(after, before)

    def test_disk_pin_mismatch_is_rejected_without_runtime_claim(self) -> None:
        expected = metric_demand.NATIVE_MPFR_DLL_SHA256
        metric_demand.NATIVE_MPFR_DLL_SHA256 = "0" * 64
        try:
            with self.assertRaises(metric_demand.MetricDemandError) as caught:
                metric_demand._NativeRuntime._admit_runtime_files()
            self.assertEqual(caught.exception.code, "native_library_sha256_mismatch")
        finally:
            metric_demand.NATIVE_MPFR_DLL_SHA256 = expected

    def test_overflow_and_validation_failures_restore_context_and_flags(self) -> None:
        runtime = metric_demand._RUNTIME
        mpfr = runtime.mpfr
        before_range = (int(mpfr.mpfr_get_emin()), int(mpfr.mpfr_get_emax()))
        mpfr.mpfr_set_underflow.argtypes = ()
        mpfr.mpfr_set_underflow.restype = None
        mpfr.mpfr_set_underflow()
        before_flags = int(mpfr.mpfr_flags_save())
        self.assertNotEqual(before_flags, 0)
        self.assert_error(b"{ }", "wire_not_canonical")
        self.assertEqual(
            (int(mpfr.mpfr_get_emin()), int(mpfr.mpfr_get_emax())), before_range
        )
        self.assertEqual(int(mpfr.mpfr_flags_save()), before_flags)

        mpfr.mpfr_clear_flags()
        overflow_values = dict(ZERO_VALUES)
        overflow_values["F1"] = -sys.float_info.max
        with self.assertRaises(metric_demand.MetricDemandError) as caught:
            metric_demand.execute_synthetic_metric_demand(
                _canonical_wire(_payload(overflow_values))
            )
        self.assertIn(
            caught.exception.code,
            {"mpfr_disallowed_flag", "mpfr_get_d_nonfinite"},
        )
        self.assertEqual(
            (int(mpfr.mpfr_get_emin()), int(mpfr.mpfr_get_emax())), before_range
        )
        self.assertEqual(int(mpfr.mpfr_flags_save()), 0)

    def test_caller_range_precondition_and_runtime_pin_fail_closed(self) -> None:
        runtime = metric_demand._RUNTIME
        mpfr = runtime.mpfr
        saved_emax = int(mpfr.mpfr_get_emax())
        self.assertEqual(int(mpfr.mpfr_set_emax(999_999)), 0)
        try:
            self.assert_error(
                _canonical_wire(_payload(ZERO_VALUES)),
                "caller_exponent_range_precondition",
            )
            self.assertEqual(int(mpfr.mpfr_get_emax()), 999_999)
        finally:
            self.assertEqual(int(mpfr.mpfr_set_emax(saved_emax)), 0)

        expected = metric_demand.EXPECTED_GMPY2_VERSION
        metric_demand.EXPECTED_GMPY2_VERSION = "0.invalid"
        try:
            self.assert_error(
                _canonical_wire(_payload(ZERO_VALUES)), "gmpy2_runtime_mismatch"
            )
        finally:
            metric_demand.EXPECTED_GMPY2_VERSION = expected

        self.assertTrue(metric_demand._EXECUTION_LOCK.acquire(blocking=False))
        try:
            self.assert_error(
                _canonical_wire(_payload(ZERO_VALUES)),
                "exclusive_mpfr_context_busy",
            )
        finally:
            metric_demand._EXECUTION_LOCK.release()

    def test_source_has_no_publisher_candidate_registry_or_in_place_graph(self) -> None:
        source = MODULE_PATH.read_text(encoding="utf-8")
        tree = ast.parse(source)
        forbidden_calls = {
            "write_bytes",
            "write_text",
            "replace",
            "rename",
            "unlink",
            "remove",
        }
        for node in ast.walk(tree):
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute):
                self.assertNotIn(node.func.attr, forbidden_calls)
        self.assertNotIn("candidate_run", source)
        self.assertNotIn("registry", source.lower())
        self.assertNotIn("casimir", source.lower())
        self.assertNotIn("numpy", source.lower())
        contract_source = (
            Path(__file__)
            .parents[2]
            .joinpath(
                "shared/contracts/"
                "nhm2-spherical-boson-star-v2-metric-demand-program.v1.ts"
            )
            .read_text(encoding="utf-8")
        )
        self.assertIn("sourceDestinationAliasingAllowed: false", contract_source)


if __name__ == "__main__":
    unittest.main()
