from __future__ import annotations

import ast
import ctypes
from dataclasses import FrozenInstanceError, replace
import hashlib
import importlib.util
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

import join_extraction as public_join  # noqa: E402
import tail_mass_operator as mass  # noqa: E402


CONTEXT_FIELDS = (
    "precision",
    "round",
    "real_prec",
    "imag_prec",
    "real_round",
    "imag_round",
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

RESULT_FALSE_FIELDS = (
    "full_4096_cell_execution_observed",
    "full_4096_cell_golden_verified",
    "production_adapter_available",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "core_integral_continuation_executed_here",
    "pde_rows_evaluated_here",
    "combined_operator_evaluated",
    "newton_implemented",
    "solve_performed",
    "projected_source_acceptance_verified",
    "join_receipt_present",
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
    "semiclassical_stress_noise_lamp",
    "semiclassical_constraint_algebra_lamp",
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)

EXPECTED_TAIL_BITS = "d44033e2f9ff1f40"
EXPECTED_TAIL_DERIVATIVE_PREFIX_BITS = (
    "d6638e30cdcf3fc5",
    "bc5c5724cdcfbf42",
    "5c44e80bcdcfbfc2",
    "347b9bc2cccfbf42",
)
EXPECTED_MASS_BITS = "d43c33e2f9ff1fc0"
EXPECTED_JACOBIAN_PREFIX_BITS = (
    "d6638e30cdcf3f45",
    "bc5c5724cdcfbfc2",
    "5c44e80bcdcfbf42",
    "347b9bc2cccfbfc2",
    "1b817248cccfbf42",
)
EXPECTED_CHRONOLOGY_EVENT_COUNT = 17_552
EXPECTED_CHRONOLOGY_SHA256 = (
    "da5f889ebdf3ad505db0829fcfe3de5eea073625090ad30d09ad80655afa9fb4"
)


def _bits(value: float) -> str:
    return struct.pack("<d", value).hex()


def _big_endian_bits(value: float) -> str:
    return struct.pack(">d", value).hex()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, name) for name in CONTEXT_FIELDS)


def _synthetic_inputs(
    module: ModuleType = mass,
) -> tuple[tuple[float, ...], object, object, tuple[float, ...]]:
    kappa = 2.0**-40
    projected = (0.0,) * 256 + (-(2.0**-81),)
    U = 1.0
    U1 = -0.0625 - kappa
    barriers = module._SyntheticJoinBarriers(
        U=U,
        U1=U1,
        V=0.0,
        V1=0.0,
        barrier_values=(U, U1, 0.0, 0.0),
    )
    core = module._SyntheticCoreContinuation(
        core64=0.0,
        core64_bits="0000000000000000",
    )
    state = (kappa, 1.0, *((0.0,) * 31), *((0.125,) * 32))
    return projected, barriers, core, state


def _run_synthetic(
    module: ModuleType = mass,
    *,
    projected: object | None = None,
    barriers: object | None = None,
    core: object | None = None,
    state: object | None = None,
    cell_count: object = 1,
    synthetic_dependencies_used: object = True,
) -> object:
    defaults = _synthetic_inputs(module)
    return module._evaluate_tail_mass_graph(
        projected_l2_state=defaults[0] if projected is None else projected,
        join_barriers=defaults[1] if barriers is None else barriers,
        core_continuation=defaults[2] if core is None else core,
        state=defaults[3] if state is None else state,
        synthetic_cell_count=cell_count,
        synthetic_dependencies_used=synthetic_dependencies_used,
    )


def _owned_join() -> public_join.FrozenL2JoinBarriers:
    values = _synthetic_inputs()[1].barrier_values
    return public_join.FrozenL2JoinBarriers(
        node_count=128,
        join_x=32,
        join_rho_exact="32/33",
        U=values[0],
        U1=values[1],
        V=values[2],
        V1=values[3],
        barrier_values=values,
        barrier_order=mass.JOIN_BARRIER_ORDER,
        primary_numerics_policy_sha256=mass.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            mass.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=public_join.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=public_join.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=public_join.SPECTRAL_N128_PAYLOAD_SHA256,
        mpfr_precision_bits=mass.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=mass.MPFR_ROUNDING_MODE,
        mpfr_emin=mass.MPFR_EMIN,
        mpfr_emax=mass.MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


def _install_hostile_native(environment: ModuleType) -> None:
    if sys.platform == "win32":
        native = ctypes.CDLL("ucrtbase")
        setter = native._controlfp_s
        setter.argtypes = [
            ctypes.POINTER(ctypes.c_uint),
            ctypes.c_uint,
            ctypes.c_uint,
        ]
        setter.restype = ctypes.c_int
        observed = ctypes.c_uint()
        return_code = setter(
            ctypes.byref(observed),
            0x03000300 | 0x00080017,
            environment.WINDOWS_CONTROLFP_MASK,
        )
        if return_code != 0:
            raise AssertionError(f"hostile_controlfp_failed:{return_code}")
    else:
        hostile = environment._capture_native_environment()
        hostile.x87_control = 0x0F3F
        hostile.mxcsr = 0x0000FF80
        environment._restore_native_environment(hostile)


def _native_restore_snapshot(environment: ModuleType) -> tuple[int, ...]:
    """Capture the exact surface used by the bound restore verification.

    On Windows, ``observed_binary64_environment`` queries ``_controlfp_s``
    after capturing the UCRT fenv.  That diagnostic query can itself alter
    sticky status bits, so it cannot be placed between the before-snapshot and
    entry into the boundary under test.
    """

    captured = environment._capture_native_environment()
    if sys.platform == "win32":
        return environment._windows_raw_projection(captured)
    return environment._linux_restore_projection(captured)


def _install_hostile_mpfr(context: gmpy2.context) -> None:
    context.precision = 71
    context.round = gmpy2.RoundDown
    context.real_prec = 73
    context.imag_prec = 79
    context.real_round = gmpy2.RoundUp
    context.imag_round = gmpy2.RoundDown
    context.emin = -89
    context.emax = 97
    context.subnormalize = True
    context.trap_underflow = True
    context.trap_overflow = True
    context.trap_inexact = True
    context.trap_invalid = True
    context.trap_erange = True
    context.trap_divzero = True
    context.underflow = True
    context.overflow = True
    context.inexact = True
    context.invalid = True
    context.erange = True
    context.divzero = True
    context.allow_complex = True
    context.rational_division = True
    context.allow_release_gil = True


class TailMassOperatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        environment = mass._binary64_environment
        ambient = gmpy2.get_context()
        saved_mpfr = ambient.copy()
        saved_native = environment._capture_native_environment()
        inputs = _synthetic_inputs()
        try:
            _install_hostile_mpfr(ambient)
            _install_hostile_native(environment)
            cls.hostile_mpfr_before = _context_snapshot(ambient)
            cls.hostile_native_before = _native_restore_snapshot(environment)
            cls.result = mass._evaluate_tail_mass_graph(
                projected_l2_state=inputs[0],
                join_barriers=inputs[1],
                core_continuation=inputs[2],
                state=inputs[3],
                synthetic_cell_count=1,
                synthetic_dependencies_used=True,
            )
            cls.hostile_mpfr_after = _context_snapshot(ambient)
            cls.hostile_native_after = _native_restore_snapshot(environment)
        finally:
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(saved_native)

    def test_reduced_fixed_partition_graph_has_exact_bit_goldens(self) -> None:
        result = self.result
        self.assertEqual(result.full_tail_cell_count, 4096)
        self.assertEqual(result.synthetic_cells_completed, 1)
        self.assertEqual(result.gl_point_count, 256)
        self.assertEqual(result.points_completed, 256)
        self.assertEqual(result.basis_entries_completed, 256 * 32)
        self.assertEqual(result.basis_entries_cleared, 256 * 32)
        self.assertEqual(result.node_integrands_completed, 256)
        self.assertEqual(result.tail_unknown_count, 65)
        self.assertEqual(result.active_mass_derivative_count, 33)
        self.assertEqual(result.tail_unknown_order, "C,h[0..31],q[0..31]")

        self.assertEqual(result.tail64_bits, EXPECTED_TAIL_BITS)
        self.assertEqual(_bits(result.tail64), EXPECTED_TAIL_BITS)
        self.assertEqual(
            result.tail_derivative64_bits[:4],
            EXPECTED_TAIL_DERIVATIVE_PREFIX_BITS,
        )
        self.assertEqual(result.mass_residual_bits, EXPECTED_MASS_BITS)
        self.assertEqual(_bits(result.mass_residual), EXPECTED_MASS_BITS)
        self.assertEqual(
            result.mass_jacobian_row_bits[:5],
            EXPECTED_JACOBIAN_PREFIX_BITS,
        )
        self.assertEqual(result.chronology_event_count, EXPECTED_CHRONOLOGY_EVENT_COUNT)
        self.assertEqual(result.chronology_sha256, EXPECTED_CHRONOLOGY_SHA256)

        self.assertEqual(len(result.tail_derivative64), 65)
        self.assertEqual(len(result.mass_jacobian_row), 65)
        self.assertEqual(
            result.tail_derivative64_bits[33:],
            ("0000000000000000",) * 32,
        )
        self.assertEqual(
            result.mass_jacobian_row_bits[33:],
            ("0000000000000000",) * 32,
        )
        self.assertEqual(result.get_d_barrier_count, 34)
        self.assertEqual(result.exact_q_zero_barrier_count, 32)
        self.assertEqual(
            result.barrier_order,
            (
                "tail.v",
                "tail.d[C]",
                *(f"tail.d[h{index}]" for index in range(32)),
                *(
                    f"tail.d[q{index}].positive_zero"
                    for index in range(32)
                ),
            ),
        )

    def test_residual_only_graph_is_scalar_and_bound_wrappers_force_4096(self) -> None:
        projected, barriers, core, state = _synthetic_inputs()
        with (
            patch.object(
                mass, "_dual_unknown", side_effect=AssertionError("dual graph touched")
            ),
            patch.object(mass, "_get_d", wraps=mass._get_d) as get_d,
        ):
            residual = mass._evaluate_tail_mass_residual_graph(
                projected_l2_state=projected,
                join_barriers=barriers,
                core_continuation=core,
                state=state,
                synthetic_cell_count=1,
                synthetic_dependencies_used=True,
            )
        self.assertEqual(residual.tail64_bits, self.result.tail64_bits)
        self.assertEqual(residual.mass_residual_bits, self.result.mass_residual_bits)
        self.assertEqual(get_d.call_count, 1)
        self.assertEqual(residual.get_d_barrier_count, 1)
        self.assertFalse(hasattr(residual, "tail_derivative64"))
        self.assertFalse(hasattr(residual, "mass_jacobian_row"))
        self.assertIs(residual.derivative_graph_executed, False)
        self.assertIs(residual.jacobian_computed, False)

        owned_join = _owned_join()
        self.assertEqual(
            mass._validate_owned_join(public_join, owned_join),
            barriers.barrier_values,
        )
        sentinel_full = object()
        sentinel_residual = object()
        with patch.object(
            mass, "_evaluate_tail_mass_graph", return_value=sentinel_full
        ) as full_graph:
            self.assertIs(
                mass._evaluate_bound_tail_mass_graph(
                    projected_l2_state=projected,
                    owner_join_module=public_join,
                    join_barriers=owned_join,
                    retained_core64=core.core64,
                    state=state,
                ),
                sentinel_full,
            )
        full_kwargs = full_graph.call_args.kwargs
        self.assertIs(full_kwargs["join_barriers"], owned_join)
        self.assertIs(full_kwargs["_bound_join_owner"], public_join)
        self.assertEqual(full_kwargs["synthetic_cell_count"], 4096)
        self.assertIs(full_kwargs["synthetic_dependencies_used"], False)
        self.assertIs(full_kwargs["core_continuation"], None)
        self.assertIs(full_kwargs["_bound_authority"], mass._BOUND_MASS_AUTHORITY)

        with patch.object(
            mass,
            "_evaluate_tail_mass_residual_graph",
            return_value=sentinel_residual,
        ) as residual_graph:
            self.assertIs(
                mass._evaluate_bound_tail_mass_residual_graph(
                    projected_l2_state=projected,
                    owner_join_module=public_join,
                    join_barriers=owned_join,
                    retained_core64=core.core64,
                    state=state,
                ),
                sentinel_residual,
            )
        residual_kwargs = residual_graph.call_args.kwargs
        self.assertIs(residual_kwargs["join_barriers"], owned_join)
        self.assertIs(residual_kwargs["_bound_join_owner"], public_join)
        self.assertEqual(residual_kwargs["synthetic_cell_count"], 4096)
        self.assertIs(residual_kwargs["synthetic_dependencies_used"], False)
        self.assertIs(residual_kwargs["core_continuation"], None)
        self.assertIs(
            residual_kwargs["_bound_authority"], mass._BOUND_MASS_AUTHORITY
        )

    def test_binary64_mass_and_jacobian_chronology_is_independent(self) -> None:
        projected, barriers, core, state = _synthetic_inputs()
        del projected, barriers
        tail = self.result.tail64
        derivatives = self.result.tail_derivative64
        c_minus_core = state[0] - core.core64
        expected_mass = c_minus_core - tail
        expected_jacobian = (
            1.0 - derivatives[0],
            *(-derivatives[index] for index in range(1, 33)),
            *((0.0,) * 32),
        )
        self.assertEqual(_bits(c_minus_core), "000000000000703d")
        self.assertEqual(_bits(expected_mass), EXPECTED_MASS_BITS)
        self.assertEqual(self.result.mass_residual, expected_mass)
        self.assertEqual(self.result.mass_jacobian_row, expected_jacobian)
        self.assertTrue(
            all(_bits(value) == "0000000000000000" for value in expected_jacobian[33:])
        )

    def test_policy_binary64_three_variable_dual_golden_is_separate(self) -> None:
        value, derivatives = mass._evaluate_policy_binary64_tail_dual_n3_fixture()
        self.assertEqual(_big_endian_bits(value), "4062c155b8213cf3")
        self.assertEqual(
            tuple(_big_endian_bits(item) for item in derivatives),
            (
                "40609f655ff28dfc",
                "4042c155b8213cf3",
                "0000000000000000",
            ),
        )

    def test_mapping_and_chebyshev_table_use_fixed_global_y_graph(self) -> None:
        records = mass._verify_bound_sources_and_load_records()
        with mass._binary64_environment.nearest_binary64_environment():
            with mass._owned_mpfr256_context() as context:
                fixture = mass._materialize_fixture_values(context, records)
                trace = mass._ChronologyTrace()
                mid, half = mass._mapped_cell(context, 0, trace)
                denominator = mass._set_ui(context, 8192, "test.denominator")
                expected_mid = mass._div(
                    context,
                    mass._set_ui(context, 1, "test.one"),
                    denominator,
                    "test.mid",
                )
                self.assertEqual(mid, expected_mid)
                self.assertEqual(half, expected_mid)
                points = mass._mapped_points(
                    context,
                    cell_index=0,
                    mid=mid,
                    half=half,
                    fixture=fixture,
                    trace=trace,
                )
                upper = mass._div(
                    context,
                    mass._set_ui(context, 1, "test.upper.one"),
                    mass._set_ui(context, 4096, "test.upper.denominator"),
                    "test.upper",
                )
                self.assertTrue(all(0 < point < upper for point in points))
                self.assertTrue(
                    all(points[index - 1] < points[index] for index in range(1, 256))
                )
                table = mass._tail_cell_basis_table(
                    context,
                    cell_index=0,
                    points=points,
                    trace=trace,
                )
                row = table[17]
                one = mass._set_ui(context, 1, "test.T.one")
                two = mass._set_ui(context, 2, "test.T.two")
                t = mass._sub(
                    context,
                    mass._mul(context, two, points[17], "test.T.two_y"),
                    one,
                    "test.T.t",
                )
                t2 = mass._sub(
                    context,
                    mass._mul(
                        context,
                        mass._mul(context, two, t, "test.T.two_t"),
                        t,
                        "test.T.product",
                    ),
                    one,
                    "test.T2",
                )
                self.assertEqual(row[0], one)
                self.assertEqual(row[1], t)
                self.assertEqual(row[2], t2)
                cleared = mass._clear_basis_table(
                    context, cell_index=0, table=table, trace=trace
                )
                self.assertEqual(cleared, 256 * 32)
                self.assertTrue(
                    all(
                        gmpy2.is_zero(item) and not gmpy2.is_signed(item)
                        for table_row in table
                        for item in table_row
                    )
                )

    def test_hostile_shapes_bits_domains_and_authority_fail_closed(self) -> None:
        projected, barriers, core, state = _synthetic_inputs()

        cases = (
            ({"cell_count": True}, "tail_mass_synthetic_cell_count_invalid"),
            ({"cell_count": 0}, "tail_mass_synthetic_cell_count_invalid"),
            ({"cell_count": 4097}, "tail_mass_synthetic_cell_count_invalid"),
            ({"state": list(state)}, "tail_mass_state_shape_invalid"),
            (
                {"state": (-0.0, *state[1:])},
                "tail_mass_binary64_negative_zero_input",
            ),
            (
                {"projected": projected[:-1]},
                "tail_mass_projected_state_shape_invalid",
            ),
            (
                {"projected": (*projected[:127], -0.0, *projected[128:])},
                "tail_mass_binary64_negative_zero_input",
            ),
            (
                {"projected": (*projected[:-1], 0.0)},
                "tail_mass_projected_nu_domain_invalid",
            ),
            (
                {"barriers": replace(barriers, barrier_order=("U1", "U", "V", "V1"))},
                "tail_mass_synthetic_join_binding_invalid",
            ),
            (
                {"barriers": replace(barriers, output_present=True)},
                "tail_mass_synthetic_join_authority_lock_invalid",
            ),
            (
                {"core": replace(core, core64_bits="000000000000f03f")},
                "tail_mass_core64_bit_mismatch",
            ),
            (
                {"core": replace(core, candidate_executed=True)},
                "tail_mass_synthetic_core_authority_lock_invalid",
            ),
            (
                {"synthetic_dependencies_used": False},
                "tail_mass_synthetic_flag_invalid",
            ),
        )
        for arguments, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(mass.TailMassOperatorError) as raised:
                    _run_synthetic(**arguments)
                self.assertEqual(raised.exception.code, expected_code)

    def test_public_adapter_fails_before_input_traversal_for_pending_sources(self) -> None:
        class Hostile:
            def __getattribute__(self, name: str) -> object:
                raise AssertionError(f"input_traversed:{name}")

        hostile = Hostile()
        with self.assertRaises(mass.TailMassOperatorError) as pending:
            mass.evaluate_primary_tail_mass_operator(
                projected_l2_state=hostile,
                join_barriers=hostile,
                core_continuation=hostile,
                state=hostile,
            )
        self.assertEqual(
            pending.exception.code, "tail_mass_production_dependencies_unsealed"
        )
        self.assertIsNone(mass.CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256)
        self.assertIsNone(mass.CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES)
        self.assertIsNone(mass.JOIN_EXTRACTION_SOURCE_SHA256)
        self.assertIsNone(mass.JOIN_EXTRACTION_SOURCE_SIZE_BYTES)
        self.assertIsNone(mass.COMBINED_TAIL_OPERATOR_SOURCE_SHA256)
        self.assertIsNone(mass.COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES)
        self.assertIs(mass.PRODUCTION_DEPENDENCIES_SEALED, False)

        with (
            patch.object(mass, "PRODUCTION_DEPENDENCIES_SEALED", True),
            patch.object(mass, "CORE_INTEGRAL_CONTINUATION_SOURCE_SHA256", "1" * 64),
            patch.object(mass, "CORE_INTEGRAL_CONTINUATION_SOURCE_SIZE_BYTES", 1),
            patch.object(mass, "JOIN_EXTRACTION_SOURCE_SHA256", "2" * 64),
            patch.object(mass, "JOIN_EXTRACTION_SOURCE_SIZE_BYTES", 2),
            patch.object(mass, "COMBINED_TAIL_OPERATOR_SOURCE_SHA256", "3" * 64),
            patch.object(mass, "COMBINED_TAIL_OPERATOR_SOURCE_SIZE_BYTES", 3),
        ):
            with self.assertRaises(mass.TailMassOperatorError) as unimplemented:
                mass.evaluate_primary_tail_mass_operator(
                    projected_l2_state=hostile,
                    join_barriers=hostile,
                    core_continuation=hostile,
                    state=hostile,
                )
            self.assertEqual(
                unimplemented.exception.code,
                "tail_mass_production_adapter_unimplemented",
            )

    def test_owned_mpfr_and_native_environments_restore_on_success_and_failure(self) -> None:
        self.assertEqual(self.hostile_mpfr_after, self.hostile_mpfr_before)
        self.assertEqual(self.hostile_native_after, self.hostile_native_before)

        environment = mass._binary64_environment
        ambient = gmpy2.get_context()
        saved_mpfr = ambient.copy()
        saved_native = environment._capture_native_environment()
        inputs = _synthetic_inputs()
        try:
            _install_hostile_mpfr(ambient)
            _install_hostile_native(environment)
            mpfr_before = _context_snapshot(ambient)
            native_before = _native_restore_snapshot(environment)
            forced = mass.TailMassOperatorError("test_forced_mapping_failure")
            with patch.object(mass, "_mapped_cell", side_effect=forced):
                with self.assertRaises(mass.TailMassOperatorError) as raised:
                    mass._evaluate_tail_mass_graph(
                        projected_l2_state=inputs[0],
                        join_barriers=inputs[1],
                        core_continuation=inputs[2],
                        state=inputs[3],
                        synthetic_cell_count=1,
                        synthetic_dependencies_used=True,
                    )
            self.assertEqual(raised.exception.code, "test_forced_mapping_failure")
            self.assertEqual(_context_snapshot(ambient), mpfr_before)
            self.assertEqual(_native_restore_snapshot(environment), native_before)

            class HostileFlag:
                def __repr__(self) -> str:
                    active = gmpy2.get_context()
                    active.precision = 19
                    active.real_prec = 23
                    active.inexact = True
                    tiny = float.fromhex("0x1p-1022")
                    _ = tiny * tiny
                    return "hostile_flag"

            mpfr_before = _context_snapshot(ambient)
            native_before = _native_restore_snapshot(environment)
            with self.assertRaises(mass.TailMassOperatorError) as invalid_flag:
                mass._evaluate_tail_mass_graph(
                    projected_l2_state=inputs[0],
                    join_barriers=inputs[1],
                    core_continuation=inputs[2],
                    state=inputs[3],
                    synthetic_cell_count=1,
                    synthetic_dependencies_used=HostileFlag(),  # type: ignore[arg-type]
                )
            self.assertEqual(
                invalid_flag.exception.code, "tail_mass_synthetic_flag_invalid"
            )
            self.assertEqual(_context_snapshot(ambient), mpfr_before)
            self.assertEqual(_native_restore_snapshot(environment), native_before)
        finally:
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(saved_native)

        class FlagProbe:
            def __init__(self) -> None:
                self.names: list[str] = []

            def __getattr__(self, name: str) -> bool:
                self.names.append(name)
                return False

        probe = FlagProbe()
        mass._check_flags(probe, "test.flags")
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

    def test_exact_source_bindings_and_public_preload_spoof_resistance(self) -> None:
        expected = (
            (
                mass._POLICY_PATH,
                mass.PRIMARY_NUMERICS_POLICY_SOURCE_SIZE_BYTES,
                mass.PRIMARY_NUMERICS_POLICY_SOURCE_SHA256,
            ),
            (
                mass._BINARY64_ENVIRONMENT_PATH,
                mass.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
                mass.BINARY64_ENVIRONMENT_SOURCE_SHA256,
            ),
            (
                mass._REPOSITORY_ROOT / mass.GL256_MANIFEST_RELATIVE_PATH,
                mass.GL256_MANIFEST_SIZE_BYTES,
                mass.GL256_MANIFEST_SHA256,
            ),
            (
                mass._REPOSITORY_ROOT / mass.GL256_RECORDS_RELATIVE_PATH,
                mass.GL256_RECORDS_SIZE_BYTES,
                mass.GL256_RECORDS_SHA256,
            ),
            (
                mass._REPOSITORY_ROOT / mass.GL256_GENERATOR_RELATIVE_PATH,
                mass.GL256_GENERATOR_SIZE_BYTES,
                mass.GL256_GENERATOR_SHA256,
            ),
            (
                mass._REPOSITORY_ROOT / mass.GL256_INDEPENDENT_TEST_RELATIVE_PATH,
                mass.GL256_INDEPENDENT_TEST_SIZE_BYTES,
                mass.GL256_INDEPENDENT_TEST_SHA256,
            ),
        )
        for path, expected_size, expected_sha in expected:
            with self.subTest(path=path.name):
                raw = path.read_bytes()
                self.assertEqual(len(raw), expected_size)
                self.assertEqual(hashlib.sha256(raw).hexdigest(), expected_sha)

        module_path = HERE / "tail_mass_operator.py"
        fenv_path = HERE / "binary64_environment.py"
        fake = ModuleType("binary64_environment")
        fake.__file__ = str(fenv_path)
        fake.AUTHORITY_LOCKS = {"forged": False}
        fake.BINARY64_ENVIRONMENT_VERSION = (
            "nhm2_spherical_boson_star_seed_producer_binary64_environment/v1"
        )
        public_previous = sys.modules.get("binary64_environment")
        private_previous = sys.modules.get(mass._PRIVATE_FENV_MODULE_NAME)
        fresh_name = "_hostile_tail_mass_exact_path_preload"
        sys.modules["binary64_environment"] = fake
        sys.modules[mass._PRIVATE_FENV_MODULE_NAME] = fake
        try:
            spec = importlib.util.spec_from_file_location(fresh_name, module_path)
            self.assertIsNotNone(spec)
            self.assertIsNotNone(spec.loader)
            fresh = importlib.util.module_from_spec(spec)
            sys.modules[fresh_name] = fresh
            spec.loader.exec_module(fresh)
            self.assertIsNot(fresh._binary64_environment, fake)
            self.assertIs(sys.modules["binary64_environment"], fake)
            self.assertIs(sys.modules[mass._PRIVATE_FENV_MODULE_NAME], fake)
            self.assertEqual(len(fresh._verify_bound_sources_and_load_records()), 256)
        finally:
            sys.modules.pop(fresh_name, None)
            if public_previous is None:
                sys.modules.pop("binary64_environment", None)
            else:
                sys.modules["binary64_environment"] = public_previous
            if private_previous is None:
                sys.modules.pop(mass._PRIVATE_FENV_MODULE_NAME, None)
            else:
                sys.modules[mass._PRIVATE_FENV_MODULE_NAME] = private_previous

        with patch.object(mass, "GL256_RECORDS_SHA256", "0" * 64):
            with self.assertRaises(mass.TailMassOperatorError) as mismatch:
                mass._verify_bound_sources_and_load_records()
            self.assertEqual(mismatch.exception.code, "tail_mass_bound_file_mismatch")

    def test_immutability_authority_locks_and_static_scope(self) -> None:
        result = self.result
        self.assertIs(result.synthetic_dependencies_used, True)
        self.assertIs(result.synthetic_reduced_cell_graph_executed, True)
        self.assertIs(result.same_fixed_4096_cell_partition_used, True)
        self.assertIs(result.tail_sum_is_partial, True)
        for field in RESULT_FALSE_FIELDS:
            self.assertIs(getattr(result, field), False, field)
        self.assertTrue(all(value is False for value in mass.AUTHORITY_LOCKS.values()))
        with self.assertRaises(FrozenInstanceError):
            result.mass_residual = 0.0
        with self.assertRaises(TypeError):
            mass.AUTHORITY_LOCKS["outputPresent"] = True

        source_path = HERE / "tail_mass_operator.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(source_path))
        self.assertIsInstance(tree, ast.Module)
        self.assertNotIn("import join_extraction", source)
        self.assertNotIn("from join_extraction", source)
        self.assertNotIn("import core_quadrature", source)
        self.assertNotIn("from core_quadrature", source)
        self.assertNotIn("import tail_pde_operator", source)
        self.assertNotIn("from tail_pde_operator", source)
        self.assertNotIn("import deterministic_newton", source)
        self.assertNotIn("from deterministic_newton", source)
        self.assertNotIn("_evaluate_tail_mass_graph", mass.__all__)
        self.assertNotIn("_SyntheticJoinBarriers", mass.__all__)
        self.assertNotIn("_SyntheticCoreContinuation", mass.__all__)
        self.assertNotIn(
            "_evaluate_policy_binary64_tail_dual_n3_fixture", mass.__all__
        )


if __name__ == "__main__":
    unittest.main()
