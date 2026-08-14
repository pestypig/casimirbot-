from __future__ import annotations

import ast
import ctypes
from dataclasses import FrozenInstanceError, replace
import hashlib
import importlib.util
import math
from pathlib import Path
import struct
import sys
from types import ModuleType
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import tail_initializer as initializer  # noqa: E402


EXPECTED_INVARIANT_BITS = (
    "000000000000e03f",  # kappa = 1/2
    "0000000000003040",  # a = 16
    "000000000000e0bf",  # sigma = -1/2
    "000000000000d03f",  # H1 = 1/4
    "0000000000000dc0",  # Hy1 = -29/8
    "000000000000acbf",  # Q1 = -7/128
    "000000000000fb3f",  # Qy1 = 27/16
)

RESULT_FALSE_FIELDS = (
    "production_adapter_available",
    "core_integral_continuation_executed",
    "mass_row_implemented",
    "mass_quadrature_implemented",
    "newton_implemented",
    "solve_performed",
    "projected_source_acceptance_verified",
    "join_receipt_present",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "candidate_execution_authorized",
    "candidate_executed",
    "candidate_output_materialized",
    "output_present",
    "output_accepted",
    "seed_accepted",
    "branch_accepted",
    "nondegeneracy_accepted",
    "replay_authority",
    "independent_agreement",
    "directed_proof_authority",
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)

PRODUCTION_RESULT_FALSE_FIELDS = tuple(
    field
    for field in RESULT_FALSE_FIELDS
    if field
    not in (
        "production_adapter_available",
        "core_integral_continuation_executed",
    )
)

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


def _bits(value: float) -> str:
    return struct.pack("<d", value).hex()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, name) for name in CONTEXT_FIELDS)


def _synthetic_inputs(
    module: ModuleType = initializer,
) -> tuple[tuple[float, ...], object, object]:
    u = (0.125,) * 127 + (0.0,)
    V = (-0.0625,) * 127 + (0.0,)
    projected = (*u, *V, -0.125)
    barriers = module._SyntheticJoinBarriers(
        U=0.25,
        U1=-0.015625,
        V=-0.0625,
        V1=0.00390625,
        barrier_values=(0.25, -0.015625, -0.0625, 0.00390625),
    )
    core = module._SyntheticCoreIntegralBarrier(
        core64=0.25,
        core64_bits="000000000000d03f",
    )
    return projected, barriers, core


def _run_synthetic(
    module: ModuleType = initializer,
    *,
    projected: object | None = None,
    barriers: object | None = None,
    core: object | None = None,
    synthetic_dependencies_used: object = True,
) -> object:
    default_projected, default_barriers, default_core = _synthetic_inputs(module)
    return module._materialize_tail_initializer_graph(
        projected_l2_state=(
            default_projected if projected is None else projected
        ),
        join_barriers=default_barriers if barriers is None else barriers,
        core_integral=default_core if core is None else core,
        synthetic_dependencies_used=synthetic_dependencies_used,
    )


def _production_inputs(
    module: ModuleType = initializer,
) -> tuple[tuple[float, ...], object, object, gmpy2.mpfr]:
    projected, synthetic_join, synthetic_core = _synthetic_inputs(module)
    join_module = module._join_extraction
    core_module = module._core_quadrature
    join = module.FrozenL2JoinBarriers(
        node_count=module.PROJECTED_NODE_COUNT,
        join_x=module.RADIUS,
        join_rho_exact="32/33",
        U=synthetic_join.U,
        U1=synthetic_join.U1,
        V=synthetic_join.V,
        V1=synthetic_join.V1,
        barrier_values=synthetic_join.barrier_values,
        barrier_order=module.JOIN_BARRIER_ORDER,
        primary_numerics_policy_sha256=module.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=join_module.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=join_module.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=join_module.SPECTRAL_N128_PAYLOAD_SHA256,
        mpfr_precision_bits=module.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=module.MPFR_ROUNDING_MODE,
        mpfr_emin=module.MPFR_EMIN,
        mpfr_emax=module.MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )
    projected_u_hash = core_module._f64_payload_sha256(
        core_module.PROJECTED_U_HASH_DOMAIN,
        projected[: module.PROJECTED_NODE_COUNT],
    )
    core = module.FrozenProjectedL2CoreIntegral(
        node_count=module.PROJECTED_NODE_COUNT,
        core_cell_count=core_module.CORE_CELL_COUNT,
        fixture_point_count=core_module.GL_POINT_COUNT,
        domain=(0, module.RADIUS),
        core64=synthetic_core.core64,
        core64_bits=synthetic_core.core64_bits,
        cells_completed=core_module.CORE_CELL_COUNT,
        mapped_points_completed=(
            core_module.CORE_CELL_COUNT * core_module.GL_POINT_COUNT
        ),
        node_integrands_completed=(
            core_module.CORE_CELL_COUNT * core_module.GL_POINT_COUNT
        ),
        exact_node_shortcuts=0,
        projected_rho_f64le_sha256="1" * 64,
        projected_u_f64le_sha256=projected_u_hash,
        primary_numerics_policy_sha256=module.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            module.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=core_module.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=core_module.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=core_module.SPECTRAL_N128_PAYLOAD_SHA256,
        fixture_manifest_sha256=core_module.GL256_MANIFEST_SHA256,
        fixture_manifest_size_bytes=core_module.GL256_MANIFEST_SIZE_BYTES,
        fixture_records_sha256=core_module.GL256_RECORDS_SHA256,
        fixture_records_size_bytes=core_module.GL256_RECORDS_SIZE_BYTES,
        fixture_generator_sha256=core_module.GL256_GENERATOR_SHA256,
        fixture_generator_size_bytes=core_module.GL256_GENERATOR_SIZE_BYTES,
        fixture_independent_test_sha256=(
            core_module.GL256_INDEPENDENT_TEST_SHA256
        ),
        fixture_independent_test_size_bytes=(
            core_module.GL256_INDEPENDENT_TEST_SIZE_BYTES
        ),
        mpfr_precision_bits=module.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=module.MPFR_ROUNDING_MODE,
        mpfr_emin=module.MPFR_EMIN,
        mpfr_emax=module.MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )
    core_sum = gmpy2.mpfr(synthetic_core.core64, module.MPFR_PRECISION_BITS)
    core_module._register_core_integral_continuation(
        core,
        core_sum,
        core.core64,
    )
    return projected, join, core, core_sum


def _clear_pending_continuations(module: ModuleType = initializer) -> None:
    tail_token = module._pending_tail_initializer_continuation
    if tail_token is not None:
        module._consume_tail_initializer_continuation(tail_token.result)
    core_module = module._core_quadrature
    core_token = core_module._pending_core_integral_continuation
    if core_token is not None:
        core_module._consume_core_integral_continuation(core_token.result)


class TailInitializerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.projected, cls.barriers, cls.core = _synthetic_inputs()
        cls.result = _run_synthetic()

    def tearDown(self) -> None:
        _clear_pending_continuations()

    def test_exact_vector_and_c1_lift_bit_goldens(self) -> None:
        result = self.result
        self.assertEqual(result.tail_unknown_count, 65)
        self.assertEqual(result.tail_unknown_order, "C,h[0..31],q[0..31]")
        self.assertEqual(len(result.initial_state), 65)
        self.assertEqual(result.initial_state_bits[0], self.core.core64_bits)
        self.assertEqual(result.initial_state[0], self.core.core64)
        self.assertEqual(
            result.initial_state_bits[1:], ("0000000000000000",) * 64
        )
        self.assertEqual(result.h_positive_zero_count, 32)
        self.assertEqual(result.q_positive_zero_count, 32)
        self.assertEqual(result.core64_barrier_consumption_count, 1)
        self.assertEqual(result.core64_barrier_copy_count, 1)

        self.assertEqual(result.projected_l2_nu_bits, "000000000000c0bf")
        self.assertEqual(
            result.join_barrier_bits,
            (
                "000000000000d03f",
                "00000000000090bf",
                "000000000000b0bf",
                "000000000000703f",
            ),
        )
        self.assertEqual(result.invariant_order, initializer.INVARIANT_ORDER)
        self.assertEqual(result.invariant_bits, EXPECTED_INVARIANT_BITS)
        self.assertEqual(
            tuple(_bits(value) for value in result.invariant_values),
            EXPECTED_INVARIANT_BITS,
        )
        self.assertEqual(
            (
                result.kappa,
                result.a,
                result.sigma,
                result.H1,
                result.Hy1,
                result.Q1,
                result.Qy1,
            ),
            result.invariant_values,
        )

        expected_initial_digest = hashlib.sha256(
            initializer.INITIAL_STATE_HASH_DOMAIN
        )
        expected_initial_digest.update(struct.pack("<65d", *result.initial_state))
        self.assertEqual(
            result.initial_state_f64le_sha256,
            expected_initial_digest.hexdigest(),
        )

    def test_literal_core_copy_and_c1_operation_chronology(self) -> None:
        calls: list[tuple[str, str]] = []

        def recorder(name: str, original: object):
            def wrapped(*args: object) -> object:
                operation = args[-1]
                self.assertIs(type(operation), str)
                calls.append((name, operation))
                return original(*args)

            return wrapped

        originals = {
            name: getattr(initializer, name)
            for name in ("_copy", "_add", "_sub", "_mul", "_div", "_neg", "_cr_sqrt64")
        }
        patches = [
            patch.object(initializer, name, side_effect=recorder(name, original))
            for name, original in originals.items()
        ]
        for active in patches:
            active.start()
        try:
            observed = _run_synthetic()
        finally:
            for active in reversed(patches):
                active.stop()
        self.assertEqual(observed.invariant_bits, EXPECTED_INVARIANT_BITS)
        self.assertEqual(
            calls,
            [
                ("_copy", "initial.C.copy"),
                ("_mul", "diagnostic.minus_two_nu"),
                ("_cr_sqrt64", "diagnostic.kappa"),
                ("_mul", "diagnostic.a"),
                ("_div", "diagnostic.C_over_kappa"),
                ("_sub", "diagnostic.sigma"),
                ("_copy", "diagnostic.H1"),
                ("_neg", "diagnostic.Hy1.negative_a"),
                ("_add", "diagnostic.Hy1.t0"),
                ("_mul", "diagnostic.Hy1.t1"),
                ("_mul", "diagnostic.Hy1.t2"),
                ("_sub", "diagnostic.Hy1"),
                ("_div", "diagnostic.Q1.C_over_R"),
                ("_copy", "diagnostic.Q1.V"),
                ("_add", "diagnostic.Q1"),
                ("_mul", "diagnostic.Qy1.negative_two_a"),
                ("_mul", "diagnostic.Qy1.two_sigma"),
                ("_add", "diagnostic.Qy1.t0"),
                ("_mul", "diagnostic.Qy1.t1"),
                ("_div", "diagnostic.Qy1.t2_C_over_R"),
                ("_mul", "diagnostic.Qy1.t3"),
                ("_add", "diagnostic.Qy1.t1_plus_t2"),
                ("_sub", "diagnostic.Qy1"),
            ],
        )
        self.assertEqual(
            [entry for entry in calls if entry == ("_copy", "initial.C.copy")],
            [("_copy", "initial.C.copy")],
        )

    def test_independent_literal_formula_check(self) -> None:
        C = self.core.core64
        nu = self.projected[-1]
        U, U1, V, V1 = self.barriers.barrier_values
        minus_two_nu = -2.0 * nu
        kappa = math.sqrt(minus_two_nu)
        a = kappa * 32.0
        sigma = (C / kappa) - 1.0
        H1 = U
        Hy1 = ((-a) + sigma) * H1 - (32.0 * U1)
        Q1 = V + (C / 32.0)
        Qy1 = (((-2.0 * a) + (2.0 * sigma)) * Q1) + (C / 32.0) - (
            32.0 * V1
        )
        expected = (kappa, a, sigma, H1, Hy1, Q1, Qy1)
        self.assertEqual(
            tuple(_bits(value) for value in expected), EXPECTED_INVARIANT_BITS
        )
        self.assertEqual(self.result.invariant_values, expected)

    def test_complete_mpfr_and_native_fenv_are_invariant_and_restored(self) -> None:
        environment = initializer._binary64_environment
        mpfr = gmpy2.get_context()
        saved_mpfr = mpfr.copy()
        original_native = environment._capture_native_environment()
        production_projected, production_join, production_core, _ = (
            _production_inputs()
        )
        try:
            mpfr.precision = 71
            mpfr.round = gmpy2.RoundDown
            mpfr.emin = -89
            mpfr.emax = 97
            mpfr.subnormalize = True
            mpfr.trap_underflow = True
            mpfr.trap_overflow = True
            mpfr.trap_inexact = True
            mpfr.trap_invalid = True
            mpfr.trap_erange = True
            mpfr.trap_divzero = True
            mpfr.underflow = True
            mpfr.overflow = True
            mpfr.inexact = True
            mpfr.invalid = True
            mpfr.erange = True
            mpfr.divzero = True
            mpfr.allow_complex = True
            mpfr.rational_division = True
            mpfr.allow_release_gil = True
            mpfr_before = _context_snapshot(mpfr)

            if sys.platform == "win32":
                native = ctypes.CDLL("ucrtbase")
                setter = native._controlfp_s
                setter.argtypes = [
                    ctypes.POINTER(ctypes.c_uint),
                    ctypes.c_uint,
                    ctypes.c_uint,
                ]
                setter.restype = ctypes.c_int
                observed_control = ctypes.c_uint()
                self.assertEqual(
                    setter(
                        ctypes.byref(observed_control),
                        0x03000300 | 0x00080017,
                        environment.WINDOWS_CONTROLFP_MASK,
                    ),
                    0,
                )
            else:
                hostile = environment._capture_native_environment()
                hostile.x87_control = 0x0F3F
                hostile.mxcsr = 0x0000FF80
                environment._restore_native_environment(hostile)
            native_before = environment.observed_binary64_environment()

            observed = _run_synthetic()
            self.assertEqual(observed.invariant_bits, EXPECTED_INVARIANT_BITS)
            self.assertEqual(_context_snapshot(mpfr), mpfr_before)
            self.assertEqual(
                environment.observed_binary64_environment(), native_before
            )

            production = initializer.materialize_primary_tail_initializer(
                projected_l2_state=production_projected,
                join_barriers=production_join,
                core_integral=production_core,
            )
            self.assertEqual(production.invariant_bits, EXPECTED_INVARIANT_BITS)
            initializer._consume_tail_initializer_continuation(production)
            self.assertEqual(_context_snapshot(mpfr), mpfr_before)
            self.assertEqual(
                environment.observed_binary64_environment(), native_before
            )

            with patch.object(
                initializer,
                "_build_c1_diagnostics",
                side_effect=initializer.TailInitializerError(
                    "test_forced_diagnostic_failure"
                ),
            ):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    _run_synthetic()
                self.assertEqual(
                    raised.exception.code, "test_forced_diagnostic_failure"
                )
            self.assertEqual(_context_snapshot(mpfr), mpfr_before)
            self.assertEqual(
                environment.observed_binary64_environment(), native_before
            )
        finally:
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(original_native)

    def test_every_mpfr_flag_including_inexact_is_sampled(self) -> None:
        class FlagProbe:
            def __init__(self) -> None:
                self.names: list[str] = []

            def __getattr__(self, name: str) -> bool:
                self.names.append(name)
                return False

        probe = FlagProbe()
        initializer._check_mpfr_flags(probe, "test.flags")
        self.assertEqual(
            probe.names,
            [
                "underflow",
                "overflow",
                "inexact",
                "invalid",
                "erange",
                "divzero",
            ],
        )

    def test_hostile_shapes_bits_domains_and_authority_fail_closed(self) -> None:
        negative_zero_state = list(self.projected)
        negative_zero_state[8] = -0.0
        bad_u_infinity = list(self.projected)
        bad_u_infinity[127] = 1.0
        bad_v_infinity = list(self.projected)
        bad_v_infinity[255] = -1.0
        nonfloat_state = list(self.projected)
        nonfloat_state[4] = 1
        nan_state = list(self.projected)
        nan_state[9] = float("nan")
        projected_cases = (
            (list(self.projected), "tail_initializer_projected_state_shape_invalid"),
            (self.projected[:-1], "tail_initializer_projected_state_shape_invalid"),
            (tuple(negative_zero_state), "tail_initializer_binary64_negative_zero_input"),
            (tuple(nonfloat_state), "tail_initializer_binary64_type_invalid"),
            (tuple(nan_state), "tail_initializer_binary64_nonfinite_input"),
            (tuple(bad_u_infinity), "tail_initializer_projected_u_infinity_not_positive_zero"),
            (tuple(bad_v_infinity), "tail_initializer_projected_V_infinity_not_positive_zero"),
            ((*self.projected[:-1], 0.0), "tail_initializer_projected_nu_domain_invalid"),
            ((*self.projected[:-1], 0.125), "tail_initializer_projected_nu_domain_invalid"),
        )
        for selected, code in projected_cases:
            with self.subTest(projected=code):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    _run_synthetic(projected=selected)
                self.assertEqual(raised.exception.code, code)

        join_cases = (
            (object(), "tail_initializer_synthetic_join_type_invalid"),
            (
                replace(self.barriers, node_count=127),
                "tail_initializer_synthetic_join_binding_invalid",
            ),
            (
                replace(self.barriers, barrier_order=("U1", "U", "V", "V1")),
                "tail_initializer_synthetic_join_binding_invalid",
            ),
            (
                replace(self.barriers, barrier_values=self.barriers.barrier_values[:-1]),
                "tail_initializer_synthetic_join_shape_invalid",
            ),
            (
                replace(
                    self.barriers,
                    barrier_values=(0.25, -0.0, -0.0625, 0.00390625),
                ),
                "tail_initializer_binary64_negative_zero_input",
            ),
            (
                replace(self.barriers, U=0.5),
                "tail_initializer_synthetic_join_named_value_mismatch",
            ),
            (
                replace(self.barriers, candidate_authority=True),
                "tail_initializer_synthetic_join_authority_lock_invalid",
            ),
        )
        for selected, code in join_cases:
            with self.subTest(join=code):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    _run_synthetic(barriers=selected)
                self.assertEqual(raised.exception.code, code)

        core_cases = (
            (object(), "tail_initializer_synthetic_core_type_invalid"),
            (
                replace(self.core, core64_bits="0" * 15),
                "tail_initializer_synthetic_core_binding_invalid",
            ),
            (
                replace(self.core, core64_bits="0" * 16),
                "tail_initializer_core64_bit_mismatch",
            ),
            (
                replace(self.core, core64=0.0, core64_bits="0" * 16),
                "tail_initializer_core64_domain_invalid",
            ),
            (
                replace(
                    self.core,
                    core64=-0.0,
                    core64_bits="0000000000000080",
                ),
                "tail_initializer_binary64_negative_zero_input",
            ),
            (
                replace(self.core, core64=float("inf")),
                "tail_initializer_binary64_nonfinite_input",
            ),
            (
                replace(self.core, diagnostic_pass_authority=True),
                "tail_initializer_synthetic_core_authority_lock_invalid",
            ),
        )
        for selected, code in core_cases:
            with self.subTest(core=code):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    _run_synthetic(core=selected)
                self.assertEqual(raised.exception.code, code)

        with self.assertRaises(initializer.TailInitializerError) as raised:
            _run_synthetic(synthetic_dependencies_used=False)
        self.assertEqual(
            raised.exception.code, "tail_initializer_synthetic_flag_invalid"
        )

    def test_production_adapter_transfers_original_retained_integral_once(self) -> None:
        projected, join, core, core_sum = _production_inputs()
        core_module = initializer._core_quadrature
        original_consume = core_module._consume_core_integral_continuation
        with (
            patch.object(
                core_module,
                "_get_d",
                side_effect=AssertionError("cached core64 must be reused"),
            ),
            patch.object(
                core_module,
                "_consume_core_integral_continuation",
                wraps=original_consume,
            ) as consume,
        ):
            result = initializer.materialize_primary_tail_initializer(
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
            )
        consume.assert_called_once_with(core)
        self.assertIs(result.production_adapter_available, True)
        self.assertIs(result.core_integral_continuation_executed, True)
        self.assertIs(result.synthetic_dependencies_used, False)
        self.assertEqual(result.core64_bits, core.core64_bits)
        for field in PRODUCTION_RESULT_FALSE_FIELDS:
            self.assertIs(getattr(result, field), False, field)

        pending = initializer._pending_tail_initializer_continuation
        self.assertIsNotNone(pending)
        lookalike = replace(result)
        with self.assertRaises(initializer.TailInitializerError) as mismatch:
            initializer._consume_tail_initializer_continuation(lookalike)
        self.assertEqual(
            mismatch.exception.code,
            "tail_initializer_continuation_identity_mismatch",
        )
        self.assertIs(initializer._pending_tail_initializer_continuation, pending)

        continuation = initializer._consume_tail_initializer_continuation(result)
        self.assertIs(continuation.result, result)
        self.assertIs(continuation.core_integral_result, core)
        self.assertIs(continuation.core_integral_continuation.core_sum, core_sum)
        self.assertIs(continuation.core_sum, core_sum)
        self.assertIs(continuation.core64, core.core64)
        self.assertEqual(_bits(continuation.core64), core.core64_bits)
        self.assertIsNone(initializer._pending_tail_initializer_continuation)
        with self.assertRaises(initializer.TailInitializerError) as unavailable:
            initializer._consume_tail_initializer_continuation(result)
        self.assertEqual(
            unavailable.exception.code,
            "tail_initializer_continuation_unavailable",
        )

        with self.assertRaises(initializer.TailInitializerError) as reused:
            initializer.materialize_primary_tail_initializer(
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
            )
        self.assertEqual(
            reused.exception.code,
            "tail_initializer_core_continuation_unavailable",
        )

    def test_failed_graph_preserves_core_ownership_without_tail_leak(self) -> None:
        projected, join, core, _ = _production_inputs()
        core_module = initializer._core_quadrature
        pending = core_module._pending_core_integral_continuation
        original_consume = core_module._consume_core_integral_continuation
        with (
            patch.object(
                initializer,
                "_build_c1_diagnostics",
                side_effect=initializer.TailInitializerError(
                    "test_forced_diagnostic_failure"
                ),
            ),
            patch.object(
                core_module,
                "_consume_core_integral_continuation",
                wraps=original_consume,
            ) as consume,
        ):
            with self.assertRaises(initializer.TailInitializerError) as raised:
                initializer.materialize_primary_tail_initializer(
                    projected_l2_state=projected,
                    join_barriers=join,
                    core_integral=core,
                )
        self.assertEqual(raised.exception.code, "test_forced_diagnostic_failure")
        consume.assert_not_called()
        self.assertIs(core_module._pending_core_integral_continuation, pending)
        self.assertIsNone(initializer._pending_tail_initializer_continuation)

    def test_owned_consumed_core_hook_preserves_exact_lineage_without_core_calls(
        self,
    ) -> None:
        projected, join, core, core_sum = _production_inputs()
        core_module = initializer._core_quadrature
        owned = core_module._consume_core_integral_continuation(core)
        self.assertIsNone(core_module._pending_core_integral_continuation)

        forbidden = AssertionError("owned handoff must not call core producer")
        with (
            patch.object(core_module, "_get_d", side_effect=forbidden),
            patch.object(
                core_module,
                "_consume_core_integral_continuation",
                side_effect=forbidden,
            ),
            patch.object(
                core_module,
                "_register_core_integral_continuation",
                side_effect=forbidden,
            ),
            patch.object(
                core_module,
                "materialize_projected_l2_core_integral",
                side_effect=forbidden,
            ),
        ):
            result = (
                initializer
                ._materialize_primary_tail_initializer_from_owned_core_continuation(
                    owner_core_quadrature_module=core_module,
                    projected_l2_state=projected,
                    join_barriers=join,
                    core_integral=core,
                    core_integral_continuation=owned,
                )
            )

        self.assertIs(result.production_adapter_available, True)
        self.assertIs(result.core_integral_continuation_executed, True)
        self.assertIs(result.synthetic_dependencies_used, False)
        pending = initializer._pending_tail_initializer_continuation
        self.assertIsNotNone(pending)
        self.assertIs(pending.core_integral_result, core)
        self.assertIs(pending.core_integral_continuation, owned)
        self.assertIs(pending.core_sum, core_sum)
        self.assertIs(pending.core64, owned.core64)
        self.assertIsNone(core_module._pending_core_integral_continuation)
        transferred = initializer._consume_tail_initializer_continuation(result)
        self.assertIs(transferred, pending)

        copied_token = replace(owned)
        with self.assertRaises(initializer.TailInitializerError) as replay:
            initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=core_module,
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
                core_integral_continuation=copied_token,
            )
        self.assertEqual(
            replay.exception.code,
            "tail_initializer_owned_core_continuation_already_spent",
        )
        self.assertIsNone(initializer._pending_tail_initializer_continuation)

    def test_owned_core_hook_rejects_foreign_identity_and_nonempty_owner_slot(
        self,
    ) -> None:
        projected, join, core, _ = _production_inputs()
        core_module = initializer._core_quadrature
        owned = core_module._consume_core_integral_continuation(core)

        with self.assertRaises(initializer.TailInitializerError) as owner_error:
            initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=ModuleType("foreign_core_owner"),
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
                core_integral_continuation=owned,
            )
        self.assertEqual(
            owner_error.exception.code,
            "tail_initializer_owned_core_owner_identity_mismatch",
        )
        self.assertFalse(initializer._owned_core_continuation_was_spent(owned))
        self.assertIsNone(initializer._pending_tail_initializer_continuation)

        foreign_result = replace(core)
        foreign_token = replace(owned, result=foreign_result)
        with self.assertRaises(initializer.TailInitializerError) as token_error:
            initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=core_module,
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
                core_integral_continuation=foreign_token,
            )
        self.assertEqual(
            token_error.exception.code,
            "tail_initializer_core_continuation_identity_mismatch",
        )
        self.assertFalse(initializer._owned_core_continuation_was_spent(owned))
        self.assertIsNone(initializer._pending_tail_initializer_continuation)

        _production_inputs()
        with self.assertRaises(initializer.TailInitializerError) as pending_error:
            initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=core_module,
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
                core_integral_continuation=owned,
            )
        self.assertEqual(
            pending_error.exception.code,
            "tail_initializer_owned_core_pending_slot_not_empty",
        )
        self.assertFalse(initializer._owned_core_continuation_was_spent(owned))
        self.assertIsNone(initializer._pending_tail_initializer_continuation)

    def test_owned_core_hook_failure_leaves_token_retryable_and_no_tail_leak(
        self,
    ) -> None:
        projected, join, core, _ = _production_inputs()
        core_module = initializer._core_quadrature
        owned = core_module._consume_core_integral_continuation(core)
        spent_count = len(initializer._spent_owned_core_continuations)
        with patch.object(
            initializer,
            "_build_c1_diagnostics",
            side_effect=initializer.TailInitializerError(
                "test_forced_owned_handoff_failure"
            ),
        ):
            with self.assertRaises(initializer.TailInitializerError) as failed:
                initializer._materialize_primary_tail_initializer_from_owned_core_continuation(
                    owner_core_quadrature_module=core_module,
                    projected_l2_state=projected,
                    join_barriers=join,
                    core_integral=core,
                    core_integral_continuation=owned,
                )
        self.assertEqual(failed.exception.code, "test_forced_owned_handoff_failure")
        self.assertEqual(
            len(initializer._spent_owned_core_continuations),
            spent_count,
        )
        self.assertFalse(initializer._owned_core_continuation_was_spent(owned))
        self.assertIsNone(initializer._pending_tail_initializer_continuation)
        self.assertIsNone(core_module._pending_core_integral_continuation)

        result = (
            initializer
            ._materialize_primary_tail_initializer_from_owned_core_continuation(
                owner_core_quadrature_module=core_module,
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
                core_integral_continuation=owned,
            )
        )
        self.assertTrue(initializer._owned_core_continuation_was_spent(owned))
        initializer._consume_tail_initializer_continuation(result)

    def test_pending_tail_slot_collision_preserves_next_core_ownership(self) -> None:
        projected, join, core, _ = _production_inputs()
        first = initializer.materialize_primary_tail_initializer(
            projected_l2_state=projected,
            join_barriers=join,
            core_integral=core,
        )
        first_pending = initializer._pending_tail_initializer_continuation
        self.assertIsNotNone(first_pending)

        next_projected, next_join, next_core, _ = _production_inputs()
        next_core_pending = (
            initializer._core_quadrature._pending_core_integral_continuation
        )
        with self.assertRaises(initializer.TailInitializerError) as collision:
            initializer.materialize_primary_tail_initializer(
                projected_l2_state=next_projected,
                join_barriers=next_join,
                core_integral=next_core,
            )
        self.assertEqual(
            collision.exception.code,
            "tail_initializer_continuation_pending",
        )
        self.assertIs(initializer._pending_tail_initializer_continuation, first_pending)
        self.assertIs(
            initializer._core_quadrature._pending_core_integral_continuation,
            next_core_pending,
        )
        initializer._consume_tail_initializer_continuation(first)

    def test_production_result_abi_and_authority_inputs_fail_closed(self) -> None:
        projected, join, core, _ = _production_inputs()
        pending = initializer._core_quadrature._pending_core_integral_continuation

        class Hostile:
            def __getattribute__(self, name: str) -> object:
                raise AssertionError(f"hostile attribute access: {name}")

        opaque_cases = (
            (
                Hostile(),
                join,
                core,
                "tail_initializer_projected_state_shape_invalid",
            ),
            (
                projected,
                Hostile(),
                core,
                "tail_initializer_join_result_type_invalid",
            ),
            (
                projected,
                join,
                Hostile(),
                "tail_initializer_core_result_type_invalid",
            ),
        )
        for selected_projected, selected_join, selected_core, code in opaque_cases:
            with self.subTest(code=code):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    initializer.materialize_primary_tail_initializer(
                        projected_l2_state=selected_projected,
                        join_barriers=selected_join,
                        core_integral=selected_core,
                    )
                self.assertEqual(raised.exception.code, code)
                self.assertIs(
                    initializer._core_quadrature._pending_core_integral_continuation,
                    pending,
                )

        hostile_cases = (
            (
                replace(join, candidate_authority=True),
                core,
                "tail_initializer_join_result_authority_lock_invalid",
            ),
            (
                join,
                replace(core, diagnostic_pass_authority=True),
                "tail_initializer_core_result_authority_lock_invalid",
            ),
            (
                join,
                replace(core, projected_u_f64le_sha256="2" * 64),
                "tail_initializer_core_projected_u_hash_mismatch",
            ),
            (
                join,
                replace(core, domain=(False, initializer.RADIUS)),
                "tail_initializer_core_result_binding_invalid",
            ),
        )
        for selected_join, selected_core, code in hostile_cases:
            with self.subTest(code=code):
                with self.assertRaises(initializer.TailInitializerError) as raised:
                    initializer.materialize_primary_tail_initializer(
                        projected_l2_state=projected,
                        join_barriers=selected_join,
                        core_integral=selected_core,
                    )
                self.assertEqual(raised.exception.code, code)
                self.assertIs(
                    initializer._core_quadrature._pending_core_integral_continuation,
                    pending,
                )

    def test_authenticated_dependency_bytes_ignore_exact_path_preloads(self) -> None:
        module_path = HERE / "tail_initializer.py"
        fake_fenv = ModuleType("binary64_environment")
        fake_fenv.__file__ = str(HERE / "binary64_environment.py")
        fake_join = ModuleType("join_extraction")
        fake_join.__file__ = str(HERE / "join_extraction.py")
        fake_core = ModuleType("core_quadrature")
        fake_core.__file__ = str(HERE / "core_quadrature.py")
        fake_spectral = ModuleType("spectral")
        fake_spectral.__file__ = str(HERE / "spectral.py")
        injected = {
            "binary64_environment": fake_fenv,
            initializer._PRIVATE_FENV_MODULE_NAME: fake_fenv,
            "join_extraction": fake_join,
            initializer._PRIVATE_JOIN_EXTRACTION_MODULE_NAME: fake_join,
            "core_quadrature": fake_core,
            initializer._PRIVATE_CORE_QUADRATURE_MODULE_NAME: fake_core,
            "spectral": fake_spectral,
            "_nhm2_spherical_seed_join_spectral_e9b2509b0c4a5d41": (
                fake_spectral
            ),
            "_nhm2_spherical_seed_core_quadrature_spectral_e9b2509b0c4a5d41": (
                fake_spectral
            ),
        }
        previous = {name: sys.modules.get(name) for name in injected}
        sys.modules.update(injected)
        fresh_name = "_hostile_tail_initializer_exact_path_preload"
        try:
            spec = importlib.util.spec_from_file_location(fresh_name, module_path)
            self.assertIsNotNone(spec)
            self.assertIsNotNone(spec.loader)
            fresh = importlib.util.module_from_spec(spec)
            sys.modules[fresh_name] = fresh
            spec.loader.exec_module(fresh)
            self.assertIsNot(fresh._binary64_environment, fake_fenv)
            self.assertIsNot(fresh._join_extraction, fake_join)
            self.assertIsNot(fresh._core_quadrature, fake_core)
            for name, fake in injected.items():
                self.assertIs(sys.modules[name], fake)
            observed = _run_synthetic(fresh)
            self.assertEqual(observed.invariant_bits, EXPECTED_INVARIANT_BITS)
            projected, join, core, core_sum = _production_inputs(fresh)
            production = fresh.materialize_primary_tail_initializer(
                projected_l2_state=projected,
                join_barriers=join,
                core_integral=core,
            )
            continuation = fresh._consume_tail_initializer_continuation(
                production
            )
            self.assertIs(continuation.core_sum, core_sum)
        finally:
            if "fresh" in locals():
                _clear_pending_continuations(fresh)
            sys.modules.pop(fresh_name, None)
            for name, old in previous.items():
                if old is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = old

        mismatch_cases = (
            (
                "BINARY64_ENVIRONMENT_SOURCE_SHA256",
                "tail_initializer_binary64_environment_source_mismatch",
            ),
            (
                "JOIN_EXTRACTION_SOURCE_SHA256",
                "tail_initializer_join_extraction_source_mismatch",
            ),
            (
                "CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256",
                "tail_initializer_core_quadrature_source_mismatch",
            ),
        )
        for constant, code in mismatch_cases:
            with self.subTest(constant=constant):
                with patch.object(initializer, constant, "0" * 64):
                    with self.assertRaises(
                        initializer.TailInitializerError
                    ) as raised:
                        _run_synthetic()
                self.assertEqual(raised.exception.code, code)

    def test_immutability_authority_locks_and_static_scope(self) -> None:
        result = self.result
        for field in RESULT_FALSE_FIELDS:
            self.assertIs(getattr(result, field), False, field)
        self.assertIs(result.synthetic_dependencies_used, True)
        self.assertIs(result.calculation_implemented, True)
        self.assertIs(result.initializer_vector_computed, True)
        self.assertIs(result.c1_lift_diagnostic_computed, True)
        self.assertEqual(
            initializer.JOIN_EXTRACTION_SOURCE_SHA256,
            "d2b86dffeaa9e56aabed044f688d89c6b282600b435aa8b3491ce51ca07d7d6b",
        )
        self.assertEqual(initializer.JOIN_EXTRACTION_SOURCE_SIZE_BYTES, 26_780)
        self.assertEqual(
            initializer.CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256,
            "78d56665839c0c50c7ee3a013595ac5b30baf67ea9194e062a930554eeb302e1",
        )
        self.assertEqual(
            initializer.CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES,
            47_738,
        )
        self.assertIs(initializer.PRODUCTION_DEPENDENCIES_SEALED, True)
        self.assertTrue(all(value is False for value in initializer.AUTHORITY_LOCKS.values()))
        self.assertNotIn("productionAdapterAvailable", initializer.AUTHORITY_LOCKS)
        self.assertNotIn(
            "coreIntegralContinuationExecuted",
            initializer.AUTHORITY_LOCKS,
        )
        self.assertTrue(
            all(
                value is False
                for value in initializer._join_extraction.AUTHORITY_LOCKS.values()
            )
        )
        self.assertTrue(
            all(
                value is False
                for value in initializer._core_quadrature.AUTHORITY_LOCKS.values()
            )
        )
        with self.assertRaises(FrozenInstanceError):
            result.core64 = 1.0
        with self.assertRaises(TypeError):
            initializer.AUTHORITY_LOCKS["outputPresent"] = True

        source_path = HERE / "tail_initializer.py"
        source = source_path.read_text(encoding="utf-8")
        ast.parse(source, filename=str(source_path))
        self.assertNotIn("import join_extraction", source)
        self.assertNotIn("from join_extraction", source)
        self.assertNotIn("import core_quadrature", source)
        self.assertNotIn("from core_quadrature", source)
        self.assertNotIn("tail_pde_operator", source)
        self.assertNotIn("tail_newton", source)
        self.assertNotIn("dense_lu", source)
        self.assertNotIn("mass_quadrature", initializer.__all__)
        self.assertNotIn("_materialize_tail_initializer_graph", initializer.__all__)
        self.assertNotIn(
            "_materialize_primary_tail_initializer_from_owned_core_continuation",
            initializer.__all__,
        )
        self.assertNotIn("_consume_tail_initializer_continuation", initializer.__all__)
        self.assertNotIn("_TailInitializerContinuationToken", initializer.__all__)
        self.assertNotIn("_SyntheticJoinBarriers", initializer.__all__)
        self.assertNotIn("_SyntheticCoreIntegralBarrier", initializer.__all__)


if __name__ == "__main__":
    unittest.main()
