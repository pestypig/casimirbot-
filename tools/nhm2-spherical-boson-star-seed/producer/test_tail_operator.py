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
from unittest.mock import Mock, patch

import gmpy2


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import tail_operator as operator  # noqa: E402


GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed/tail-operator/golden/v1\n"
NEWTON_GOLDEN_SHA256 = (
    "59978e3a91d4760ee0fe9a9c5121e5adb486358b35fa94a9437f41766f82786d"
)
NEWTON_CHRONOLOGY_SHA256 = (
    "f542af634173577b57985ad089f6a152cb62e54a0d816cc1f64d5e14e539d8ec"
)
FINAL_CHRONOLOGY_SHA256 = (
    "bc563b5235ff45699d27a11088e3af35b6130f694f042b445c94e88c4a804987"
)

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
    "production_adapter_available",
    "initializer_continuation_consumed",
    "implementation_closure_complete",
    "runtime_closure_complete",
    "newton_implemented",
    "solve_performed",
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
    "diagnostic_pass_authority",
    "candidate_authority",
    "theory_graph_authority",
    "physical_authority",
    "propulsion_authority",
    "transport_authority",
)


def _bits(value: float) -> str:
    return struct.pack("<d", value).hex()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, field) for field in CONTEXT_FIELDS)


def _native_restore_snapshot(environment: ModuleType) -> tuple[int, ...]:
    captured = environment._capture_native_environment()
    if sys.platform == "win32":
        return environment._windows_raw_projection(captured)
    return environment._linux_restore_projection(captured)


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


def _inputs(
    module: ModuleType = operator,
) -> tuple[object, object, tuple[float, ...], object, tuple[float, ...]]:
    pde = module._tail_pde_module
    mass = module._tail_mass_module
    collocation = pde._tail_collocation_module.generate_tail_collocation()
    kappa = 2.0**-40
    values = (1.0, -0.0625 - kappa, 0.0, 0.0)
    join = pde.FrozenL2JoinBarriers(
        node_count=128,
        join_x=32,
        join_rho_exact="32/33",
        U=values[0],
        U1=values[1],
        V=values[2],
        V1=values[3],
        barrier_values=values,
        barrier_order=("U", "U1", "V", "V1"),
        primary_numerics_policy_sha256=pde.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            pde.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=pde._join_extraction_module.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=pde._join_extraction_module.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=(
            pde._join_extraction_module.SPECTRAL_N128_PAYLOAD_SHA256
        ),
        mpfr_precision_bits=pde.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=pde.MPFR_ROUNDING_MODE,
        mpfr_emin=pde.MPFR_EMIN,
        mpfr_emax=pde.MPFR_EMAX,
        observed_gmpy2_version="synthetic_role_only",
        observed_mpfr_version="synthetic_role_only",
    )
    projected = (0.0,) * 256 + (-(2.0**-81),)
    retained_core64 = float.fromhex("0x0.0000000000001p-1022")
    core = mass._SyntheticCoreContinuation(
        core64=retained_core64,
        core64_bits=_bits(retained_core64),
    )
    state = (kappa, 1.0, *((0.0,) * 31), *((0.125,) * 32))
    return collocation, join, projected, core, state


def _run(
    module: ModuleType = operator,
    *,
    collocation: object | None = None,
    join: object | None = None,
    projected: object | None = None,
    core: object | None = None,
    state: object | None = None,
    mode: object = operator.NEWTON_MODE,
    cell_count: object = 1,
    synthetic_dependencies_used: object = True,
) -> object:
    defaults = _inputs(module)
    return module._evaluate_synthetic_tail_operator(
        collocation=defaults[0] if collocation is None else collocation,
        join_barriers=defaults[1] if join is None else join,
        projected_l2_state=defaults[2] if projected is None else projected,
        core_continuation=defaults[3] if core is None else core,
        state=defaults[4] if state is None else state,
        mode=mode,
        synthetic_mass_cell_count=cell_count,
        synthetic_dependencies_used=synthetic_dependencies_used,
    )


def _golden(result: operator.FrozenTailOperatorEvaluation) -> str:
    if result.jacobian is None:
        raise AssertionError("newton_jacobian_required")
    digest = hashlib.sha256(GOLDEN_DOMAIN)
    digest.update(struct.pack("<65d", *result.residual))
    for row in result.jacobian:
        digest.update(struct.pack("<65d", *row))
    return digest.hexdigest()


class TailOperatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        inputs = _inputs()
        cls.inputs = inputs
        cls.call_order: list[str] = []
        cls.subordinate_state_objects: list[object] = []
        original_pde = operator._tail_pde_module.evaluate_tail_pde_operator
        original_mass = operator._tail_mass_module._evaluate_tail_mass_graph

        def capture_pde(*args: object) -> object:
            cls.call_order.append("pde")
            cls.subordinate_state_objects.append(args[3])
            result = original_pde(*args)
            cls.raw_pde = result
            return result

        def capture_mass(**kwargs: object) -> object:
            cls.call_order.append("mass")
            cls.subordinate_state_objects.append(kwargs["state"])
            result = original_mass(**kwargs)
            cls.raw_mass = result
            return result

        environment = operator._binary64_environment
        ambient = gmpy2.get_context()
        saved_mpfr = ambient.copy()
        saved_native = environment._capture_native_environment()
        try:
            _install_hostile_mpfr(ambient)
            _install_hostile_native(environment)
            cls.hostile_mpfr_before = _context_snapshot(ambient)
            cls.hostile_native_before = _native_restore_snapshot(environment)
            with (
                patch.object(
                    operator._tail_pde_module,
                    "evaluate_tail_pde_operator",
                    side_effect=capture_pde,
                ),
                patch.object(
                    operator._tail_mass_module,
                    "_evaluate_tail_mass_graph",
                    side_effect=capture_mass,
                ),
            ):
                cls.newton = operator._evaluate_synthetic_tail_operator(
                    collocation=inputs[0],
                    join_barriers=inputs[1],
                    projected_l2_state=inputs[2],
                    core_continuation=inputs[3],
                    state=inputs[4],
                    mode=operator.NEWTON_MODE,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
            cls.hostile_mpfr_after = _context_snapshot(ambient)
            cls.hostile_native_after = _native_restore_snapshot(environment)
        finally:
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(saved_native)

    def test_newton_mode_exact_rows_jacobian_chronology_and_golden(self) -> None:
        result = self.newton
        self.assertEqual(result.mode, operator.NEWTON_MODE)
        self.assertEqual(result.residual_row_count, 65)
        self.assertEqual(result.unknown_count, 65)
        self.assertEqual(len(result.residual), 65)
        self.assertIsNotNone(result.jacobian)
        self.assertEqual(len(result.jacobian), 65)
        self.assertTrue(all(len(row) == 65 for row in result.jacobian))
        self.assertEqual(
            result.row_labels,
            tuple(
                (*(
                    f"{kind}[{index}]"
                    for kind in ("S", "P")
                    for index in range(32)
                ), "mass")
            ),
        )
        self.assertEqual(result.row_order, "S[0..31],P[0..31],mass")
        self.assertEqual(result.unknown_order, "C,h[0..31],q[0..31]")
        self.assertEqual(self.call_order, ["pde", "mass"])
        self.assertEqual(result.pde_rows_completed, 64)
        self.assertEqual(result.mass_rows_completed, 1)
        self.assertEqual(result.residual_store_count, 65)
        self.assertIs(result.jacobian_target_touched, True)
        self.assertEqual(result.jacobian_row_store_count, 65)
        self.assertEqual(result.jacobian_component_store_count, 65 * 65)
        self.assertIs(result.pde_jacobian_field_accessed, True)
        self.assertIs(result.mass_jacobian_field_accessed, True)
        self.assertEqual(result.retained_core_get_d_count, 0)
        self.assertEqual(result.chronology_event_count, 4689)
        self.assertEqual(result.chronology_sha256, NEWTON_CHRONOLOGY_SHA256)
        self.assertEqual(_golden(result), NEWTON_GOLDEN_SHA256)
        self.assertEqual(
            tuple(value.hex() for value in (
                result.residual[0],
                result.residual[31],
                result.residual[32],
                result.residual[63],
                result.residual[64],
            )),
            (
                "0x0.0p+0",
                "-0x1.0000000020000p+0",
                "0x1.0000000000000p-147",
                "-0x1.fc00000000000p+9",
                "-0x1.ffff9e2333cd4p+2",
            ),
        )

    def test_final_residual_gate_never_reads_subordinate_jacobians(self) -> None:
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                side_effect=AssertionError("final_mode_called_full_pde"),
            ) as full_pde,
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                side_effect=AssertionError("final_mode_called_full_mass"),
            ) as full_mass,
            patch.object(
                operator._tail_pde_module,
                "_dual_unknown",
                side_effect=AssertionError("final_mode_built_pde_dual"),
            ),
            patch.object(
                operator._tail_mass_module,
                "_dual_unknown",
                side_effect=AssertionError("final_mode_built_mass_dual"),
            ),
        ):
            result = operator._evaluate_synthetic_tail_operator(
                collocation=self.inputs[0],
                join_barriers=self.inputs[1],
                projected_l2_state=self.inputs[2],
                core_continuation=self.inputs[3],
                state=self.inputs[4],
                mode=operator.FINAL_RESIDUAL_GATE_MODE,
                synthetic_mass_cell_count=1,
                synthetic_dependencies_used=True,
            )
        full_pde.assert_not_called()
        full_mass.assert_not_called()
        self.assertEqual(result.residual, self.newton.residual)
        self.assertIsNone(result.jacobian)
        self.assertIs(result.jacobian_target_touched, False)
        self.assertEqual(result.jacobian_row_store_count, 0)
        self.assertEqual(result.jacobian_component_store_count, 0)
        self.assertIs(result.pde_jacobian_field_accessed, False)
        self.assertIs(result.mass_jacobian_field_accessed, False)
        self.assertEqual(result.chronology_event_count, 464)
        self.assertEqual(result.chronology_sha256, FINAL_CHRONOLOGY_SHA256)

    def test_state_is_one_snapshot_shared_bit_exactly_between_primitives(self) -> None:
        result = self.newton
        original_state = self.inputs[4]
        self.assertEqual(result.state_snapshot_count, 1)
        self.assertEqual(result.state_component_read_count, 65)
        self.assertIs(result.state_bitwise_unchanged, True)
        self.assertEqual(result.state_snapshot_bits, tuple(_bits(x) for x in original_state))
        expected = hashlib.sha256(operator.STATE_HASH_DOMAIN)
        expected.update(struct.pack("<65d", *original_state))
        self.assertEqual(result.state_f64le_sha256, expected.hexdigest())
        self.assertEqual(len(self.subordinate_state_objects), 2)
        self.assertIs(
            self.subordinate_state_objects[0], self.subordinate_state_objects[1]
        )
        self.assertIsNot(self.subordinate_state_objects[0], original_state)
        self.assertEqual(
            tuple(_bits(x) for x in self.subordinate_state_objects[0]),
            tuple(_bits(x) for x in original_state),
        )

    def test_first_failure_stops_without_mass_retry_or_partial_result(self) -> None:
        pde_failure = operator._tail_pde_module.TailPdeOperatorError(
            "synthetic_pde_failure"
        )
        mass_mock = Mock()
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                side_effect=pde_failure,
            ) as pde_mock,
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                mass_mock,
            ),
        ):
            with self.assertRaises(operator.TailOperatorError) as caught:
                operator._evaluate_synthetic_tail_operator(
                    collocation=self.inputs[0],
                    join_barriers=self.inputs[1],
                    projected_l2_state=self.inputs[2],
                    core_continuation=self.inputs[3],
                    state=self.inputs[4],
                    mode=operator.NEWTON_MODE,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
        self.assertEqual(caught.exception.code, "tail_operator_pde_evaluation_failed")
        self.assertEqual(caught.exception.detail, "synthetic_pde_failure")
        pde_mock.assert_called_once()
        mass_mock.assert_not_called()

        mass_failure = operator._tail_mass_module.TailMassOperatorError(
            "synthetic_mass_failure"
        )
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                return_value=self.raw_pde,
            ) as pde_mock,
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                side_effect=mass_failure,
            ) as mass_mock,
        ):
            with self.assertRaises(operator.TailOperatorError) as caught:
                operator._evaluate_synthetic_tail_operator(
                    collocation=self.inputs[0],
                    join_barriers=self.inputs[1],
                    projected_l2_state=self.inputs[2],
                    core_continuation=self.inputs[3],
                    state=self.inputs[4],
                    mode=operator.NEWTON_MODE,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
        self.assertEqual(caught.exception.code, "tail_operator_mass_evaluation_failed")
        self.assertEqual(caught.exception.detail, "synthetic_mass_failure")
        pde_mock.assert_called_once()
        mass_mock.assert_called_once()

    def test_nonpositive_C_reaches_complete_full_pde_and_mass_before_disposition(self) -> None:
        negative_state = (-0.5, *self.inputs[4][1:])
        pde_hash = operator._tail_pde_module._f64_tuple_sha256(
            operator._tail_pde_module.TAIL_STATE_HASH_DOMAIN, negative_state
        )
        mass_hash = operator._tail_mass_module._f64_tuple_sha256(
            operator._tail_mass_module.STATE_HASH_DOMAIN, negative_state
        )
        mass_residual = operator._tail_mass_module._f64_sub(
            operator._tail_mass_module._f64_sub(
                negative_state[0],
                self.raw_mass.core64,
                "test.mass.c_minus_core",
            ),
            self.raw_mass.tail64,
            "test.mass.residual",
        )
        pde_receipt = replace(
            self.raw_pde, tail_state_f64le_sha256=pde_hash
        )
        mass_receipt = replace(
            self.raw_mass,
            state_f64le_sha256=mass_hash,
            mass_residual=mass_residual,
            mass_residual_bits=_bits(mass_residual),
        )
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                return_value=pde_receipt,
            ) as pde_call,
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                return_value=mass_receipt,
            ) as mass_call,
        ):
            result = _run(state=negative_state)
        pde_call.assert_called_once()
        mass_call.assert_called_once()
        self.assertEqual(result.state_snapshot_bits[0], _bits(-0.5))
        self.assertIsNotNone(result.jacobian)

    def test_mismatched_downstream_state_receipts_fail_in_stage_order(self) -> None:
        bad_pde = replace(self.raw_pde, tail_state_f64le_sha256="0" * 64)
        mass_mock = Mock()
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                return_value=bad_pde,
            ),
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                mass_mock,
            ),
        ):
            with self.assertRaises(operator.TailOperatorError) as caught:
                operator._evaluate_synthetic_tail_operator(
                    collocation=self.inputs[0],
                    join_barriers=self.inputs[1],
                    projected_l2_state=self.inputs[2],
                    core_continuation=self.inputs[3],
                    state=self.inputs[4],
                    mode=operator.NEWTON_MODE,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
        self.assertEqual(caught.exception.code, "tail_operator_pde_result_abi_invalid")
        mass_mock.assert_not_called()

        bad_mass = replace(self.raw_mass, state_f64le_sha256="0" * 64)
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                return_value=self.raw_pde,
            ),
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                return_value=bad_mass,
            ),
        ):
            with self.assertRaises(operator.TailOperatorError) as caught:
                operator._evaluate_synthetic_tail_operator(
                    collocation=self.inputs[0],
                    join_barriers=self.inputs[1],
                    projected_l2_state=self.inputs[2],
                    core_continuation=self.inputs[3],
                    state=self.inputs[4],
                    mode=operator.NEWTON_MODE,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
        self.assertEqual(caught.exception.code, "tail_operator_mass_result_abi_invalid")

    def test_hostile_shapes_mode_and_synthetic_bounds_fail_closed(self) -> None:
        collocation, join, projected, core, state = self.inputs
        pde_mock = Mock(return_value=self.raw_pde)
        mass_mock = Mock(return_value=self.raw_mass)
        cases = (
            ({"state": list(state)}, "tail_operator_state_shape_invalid"),
            ({"state": state[:-1]}, "tail_operator_state_shape_invalid"),
            (
                {"state": (-0.0, *state[1:])},
                "tail_operator_binary64_negative_zero_input",
            ),
            ({"mode": "newton"}, "tail_operator_mode_invalid"),
            ({"mode": 1}, "tail_operator_mode_invalid"),
            (
                {"projected": projected[:-1]},
                "tail_operator_projected_state_shape_invalid",
            ),
            (
                {"projected": (*projected[:-1], 0.0)},
                "tail_operator_projected_nu_domain_invalid",
            ),
            ({"cell_count": True}, "tail_operator_synthetic_cell_count_invalid"),
            ({"cell_count": 0}, "tail_operator_synthetic_cell_count_invalid"),
            (
                {"synthetic_dependencies_used": False},
                "tail_operator_synthetic_flag_invalid",
            ),
        )
        with (
            patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                pde_mock,
            ),
            patch.object(
                operator._tail_mass_module,
                "_evaluate_tail_mass_graph",
                mass_mock,
            ),
        ):
            for arguments, expected_code in cases:
                with self.subTest(expected_code=expected_code):
                    with self.assertRaises(operator.TailOperatorError) as caught:
                        _run(**arguments)
                    self.assertEqual(caught.exception.code, expected_code)

        hostile_join = replace(join, candidate_authority=True)
        with self.assertRaises(operator.TailOperatorError) as caught:
            operator._evaluate_synthetic_tail_operator(
                collocation=collocation,
                join_barriers=hostile_join,
                projected_l2_state=projected,
                core_continuation=core,
                state=state,
                mode=operator.NEWTON_MODE,
                synthetic_mass_cell_count=1,
                synthetic_dependencies_used=True,
            )
        self.assertEqual(caught.exception.code, "tail_operator_pde_evaluation_failed")
        self.assertEqual(
            caught.exception.detail, "tail_pde_join_barrier_authority_lock_invalid"
        )

    def test_public_opener_records_exact_instance_composition_blocker(self) -> None:
        class Hostile:
            def __getattribute__(self, name: str) -> object:
                raise AssertionError(f"caller_input_traversed:{name}")

        hostile = Hostile()
        with self.assertRaises(operator.TailOperatorError) as caught:
            operator.open_primary_tail_operator_session(
                initializer_result=hostile,
                collocation=hostile,
                join_barriers=hostile,
                projected_l2_state=hostile,
            )
        self.assertEqual(
            caught.exception.code,
            "tail_operator_shared_initializer_instance_composition_blocked",
        )
        self.assertEqual(
            caught.exception.detail,
            operator.PRODUCTION_SESSION_COMPOSITION_STATUS,
        )
        self.assertEqual(len(operator.TAIL_INITIALIZER_SOURCE_SHA256), 64)
        self.assertEqual(operator.TAIL_INITIALIZER_SOURCE_SIZE_BYTES, 56_936)
        self.assertIs(operator.PRODUCTION_DEPENDENCIES_SEALED, True)

        with self.assertRaises(operator.TailOperatorError) as unavailable:
            operator.evaluate_primary_tail_operator(
                session=hostile,
                state=hostile,
                mode=hostile,
            )
        self.assertEqual(
            unavailable.exception.code, "tail_operator_session_unavailable"
        )

    def test_exact_initializer_continuation_mints_one_persistent_session(self) -> None:
        collocation, join, projected, core, state = self.inputs
        retained_core_sum = gmpy2.mpfr(core.core64, 256)
        self.assertIsNone(operator._active_tail_operator_session)
        self.assertIsNone(
            getattr(
                operator._tail_initializer_module,
                "_pending_tail_initializer_continuation",
            )
        )
        handle = operator._open_synthetic_tail_operator_session(
            collocation=collocation,
            join_barriers=join,
            projected_l2_state=projected,
            retained_core_sum=retained_core_sum,
            retained_core64=core.core64,
            synthetic_mass_cell_count=1,
        )
        try:
            active = operator._active_tail_operator_session
            self.assertIsNotNone(active)
            self.assertIs(active.handle, handle)
            self.assertIs(active.core_sum, retained_core_sum)
            self.assertEqual(_bits(active.core64), _bits(core.core64))
            self.assertEqual(handle.initializer_continuation_consumption_count, 1)
            self.assertEqual(handle.retained_core_get_d_count, 1)
            self.assertEqual(handle.initial_state_bits[0], _bits(core.core64))
            self.assertEqual(
                handle.initial_state_bits[1:],
                ("0000000000000000",) * 64,
            )
            for field in operator._SESSION_FALSE_FIELDS:
                self.assertIs(getattr(handle, field), False, field)
            with self.assertRaises(FrozenInstanceError):
                handle.core64 = 1.0
            with self.assertRaises(operator.TailOperatorError) as mismatch_initial:
                operator._claim_tail_operator_session(handle, state)
            self.assertEqual(
                mismatch_initial.exception.code,
                "tail_operator_initial_state_binding_mismatch",
            )
            self.assertIsNone(
                getattr(
                    operator._tail_initializer_module,
                    "_pending_tail_initializer_continuation",
                )
            )
            class HostileOpen:
                def __getattribute__(self, name: str) -> object:
                    raise AssertionError(f"second_open_traversed:{name}")
            with self.assertRaises(operator.TailOperatorError) as active_error:
                operator._open_synthetic_tail_operator_session(
                    collocation=HostileOpen(),
                    join_barriers=HostileOpen(),
                    projected_l2_state=HostileOpen(),
                    retained_core_sum=HostileOpen(),
                    retained_core64=HostileOpen(),
                    synthetic_mass_cell_count=HostileOpen(),
                )
            self.assertEqual(
                active_error.exception.code, "tail_operator_session_already_active"
            )
            with (
                patch.object(
                    operator._tail_initializer_module,
                    "_consume_tail_initializer_continuation",
                    side_effect=AssertionError("continuation_consumed_twice"),
                ),
                patch.object(
                    operator._tail_pde_module,
                    "evaluate_tail_pde_operator",
                    return_value=self.raw_pde,
                ),
                patch.object(
                    operator._tail_mass_module,
                    "_evaluate_tail_mass_graph",
                    return_value=self.raw_mass,
                ),
            ):
                first = operator.evaluate_primary_tail_operator(
                    session=handle,
                    state=state,
                    mode=operator.NEWTON_MODE,
                )
                second = operator.evaluate_primary_tail_operator(
                    session=handle,
                    state=state,
                    mode=operator.NEWTON_MODE,
                )
                final = operator.evaluate_primary_tail_operator(
                    session=handle,
                    state=state,
                    mode=operator.FINAL_RESIDUAL_GATE_MODE,
                )
            self.assertEqual(first.residual, self.newton.residual)
            self.assertEqual(second.residual, first.residual)
            self.assertEqual(final.residual, first.residual)
            self.assertIsNotNone(first.jacobian)
            self.assertIsNotNone(second.jacobian)
            self.assertIsNone(final.jacobian)
            self.assertEqual(
                (
                    first.session_evaluation_ordinal,
                    second.session_evaluation_ordinal,
                    final.session_evaluation_ordinal,
                ),
                (1, 2, 3),
            )
            self.assertEqual(first.session_id_sha256, handle.session_id_sha256)
            self.assertEqual(second.session_id_sha256, handle.session_id_sha256)
            self.assertEqual(final.session_id_sha256, handle.session_id_sha256)
            self.assertIs(first.initializer_continuation_consumed, True)
            self.assertIs(second.initializer_continuation_consumed, True)
            self.assertIs(final.initializer_continuation_consumed, True)
            self.assertEqual(first.retained_core_get_d_count, 1)
            self.assertEqual(second.retained_core_get_d_count, 1)
            self.assertEqual(final.retained_core_get_d_count, 1)
            self.assertEqual(active.evaluation_count, 3)
            self.assertEqual(active.newton_evaluation_count, 2)
            self.assertEqual(active.final_residual_gate_evaluation_count, 1)
            self.assertIs(active.terminal, True)
            for blocked_mode in (
                operator.NEWTON_MODE,
                operator.FINAL_RESIDUAL_GATE_MODE,
            ):
                with self.subTest(blocked_mode=blocked_mode):
                    with self.assertRaises(operator.TailOperatorError) as terminal:
                        operator.evaluate_primary_tail_operator(
                            session=handle,
                            state=state,
                            mode=blocked_mode,
                        )
                    self.assertEqual(
                        terminal.exception.code, "tail_operator_session_terminal"
                    )

            forged = replace(handle)
            class Hostile:
                def __getattribute__(self, name: str) -> object:
                    raise AssertionError(f"state_traversed:{name}")
            with self.assertRaises(operator.TailOperatorError) as mismatch:
                operator.evaluate_primary_tail_operator(
                    session=forged,
                    state=Hostile(),
                    mode=Hostile(),
                )
            self.assertEqual(
                mismatch.exception.code, "tail_operator_session_identity_mismatch"
            )
        finally:
            operator._release_tail_operator_session(handle)
        self.assertIsNone(operator._active_tail_operator_session)
        with self.assertRaises(operator.TailOperatorError) as stale:
            operator.evaluate_primary_tail_operator(
                session=handle,
                state=state,
                mode=operator.NEWTON_MODE,
            )
        self.assertEqual(stale.exception.code, "tail_operator_session_unavailable")

    def test_exact_source_pins_private_preload_resistance_and_abi_gates(self) -> None:
        sources = (
            (
                HERE / "binary64_environment.py",
                operator.BINARY64_ENVIRONMENT_SOURCE_SHA256,
                operator.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
            ),
            (
                HERE / "tail_pde_operator.py",
                operator.TAIL_PDE_OPERATOR_SOURCE_SHA256,
                operator.TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES,
            ),
            (
                HERE / "tail_mass_operator.py",
                operator.TAIL_MASS_OPERATOR_SOURCE_SHA256,
                operator.TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES,
            ),
            (
                HERE / "tail_initializer.py",
                operator.TAIL_INITIALIZER_SOURCE_SHA256,
                operator.TAIL_INITIALIZER_SOURCE_SIZE_BYTES,
            ),
        )
        for path, expected_sha, expected_size in sources:
            with self.subTest(path=path.name):
                raw = path.read_bytes()
                self.assertEqual(len(raw), expected_size)
                self.assertEqual(hashlib.sha256(raw).hexdigest(), expected_sha)

        module_path = HERE / "tail_operator.py"
        names = {
            "binary64_environment": HERE / "binary64_environment.py",
            "tail_pde_operator": HERE / "tail_pde_operator.py",
            "tail_mass_operator": HERE / "tail_mass_operator.py",
            "tail_initializer": HERE / "tail_initializer.py",
            operator._PRIVATE_FENV_MODULE_NAME: HERE / "binary64_environment.py",
            operator._PRIVATE_PDE_MODULE_NAME: HERE / "tail_pde_operator.py",
            operator._PRIVATE_MASS_MODULE_NAME: HERE / "tail_mass_operator.py",
            operator._PRIVATE_INITIALIZER_MODULE_NAME: HERE / "tail_initializer.py",
        }
        previous = {name: sys.modules.get(name) for name in names}
        fakes: dict[str, ModuleType] = {}
        for name, path in names.items():
            fake = ModuleType(name)
            fake.__file__ = str(path)
            fakes[name] = fake
            sys.modules[name] = fake
        fresh_name = "_hostile_tail_operator_exact_path_preload"
        try:
            spec = importlib.util.spec_from_file_location(fresh_name, module_path)
            self.assertIsNotNone(spec)
            self.assertIsNotNone(spec.loader)
            fresh = importlib.util.module_from_spec(spec)
            sys.modules[fresh_name] = fresh
            spec.loader.exec_module(fresh)
            self.assertIsNot(fresh._binary64_environment, fakes["binary64_environment"])
            self.assertIsNot(fresh._tail_pde_module, fakes["tail_pde_operator"])
            self.assertIsNot(fresh._tail_mass_module, fakes["tail_mass_operator"])
            self.assertIsNot(
                fresh._tail_initializer_module, fakes["tail_initializer"]
            )
            for name, fake in fakes.items():
                self.assertIs(sys.modules[name], fake)
            fresh._verify_dependency_bindings()

            collocation, join, projected, core, _ = self.inputs
            fresh_initializer = fresh._tail_initializer_module
            barriers = join.barrier_values
            foreign_result = (
                fresh_initializer._materialize_tail_initializer_graph(
                    projected_l2_state=projected,
                    join_barriers=fresh_initializer._SyntheticJoinBarriers(
                        U=barriers[0],
                        U1=barriers[1],
                        V=barriers[2],
                        V1=barriers[3],
                        barrier_values=barriers,
                    ),
                    core_integral=(
                        fresh_initializer._SyntheticCoreIntegralBarrier(
                            core64=core.core64,
                            core64_bits=_bits(core.core64),
                        )
                    ),
                    synthetic_dependencies_used=True,
                )
            )
            with self.assertRaises(operator.TailOperatorError) as foreign:
                operator._open_tail_operator_session(
                    initializer_result=foreign_result,
                    collocation=collocation,
                    join_barriers=join,
                    projected_l2_state=projected,
                    synthetic_mass_cell_count=1,
                    synthetic_dependencies_used=True,
                )
            self.assertEqual(
                foreign.exception.code,
                "tail_operator_initializer_result_type_invalid",
            )
        finally:
            sys.modules.pop(fresh_name, None)
            for name, prior in previous.items():
                if prior is None:
                    sys.modules.pop(name, None)
                else:
                    sys.modules[name] = prior

        class Hostile:
            def __getattribute__(self, name: str) -> object:
                raise AssertionError(f"input_traversed:{name}")

        with patch.object(operator, "TAIL_PDE_OPERATOR_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(operator.TailOperatorError) as source_error:
                operator._evaluate_synthetic_tail_operator(
                    collocation=Hostile(),
                    join_barriers=Hostile(),
                    projected_l2_state=Hostile(),
                    core_continuation=Hostile(),
                    state=Hostile(),
                    mode=Hostile(),
                    synthetic_mass_cell_count=Hostile(),
                    synthetic_dependencies_used=True,
                )
            self.assertEqual(
                source_error.exception.code,
                "tail_operator_tail_pde_operator_source_mismatch",
            )
        with patch.object(operator, "TAIL_INITIALIZER_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(operator.TailOperatorError) as source_error:
                operator.open_primary_tail_operator_session(
                    initializer_result=Hostile(),
                    collocation=Hostile(),
                    join_barriers=Hostile(),
                    projected_l2_state=Hostile(),
                )
            self.assertEqual(
                source_error.exception.code,
                "tail_operator_tail_initializer_source_mismatch",
            )
        with patch.object(operator._tail_pde_module, "UNKNOWN_COUNT", 64):
            with self.assertRaises(operator.TailOperatorError) as abi_error:
                operator._verify_dependency_bindings()
            self.assertEqual(abi_error.exception.code, "tail_operator_pde_abi_invalid")
        with patch.object(
            operator._tail_initializer_module, "TAIL_UNKNOWN_COUNT", 64
        ):
            with self.assertRaises(operator.TailOperatorError) as abi_error:
                operator._verify_dependency_bindings()
            self.assertEqual(
                abi_error.exception.code, "tail_operator_initializer_abi_invalid"
            )

    def test_complete_native_and_mpfr_environments_restore_on_all_paths(self) -> None:
        self.assertEqual(self.hostile_mpfr_after, self.hostile_mpfr_before)
        self.assertEqual(self.hostile_native_after, self.hostile_native_before)

        environment = operator._binary64_environment
        ambient = gmpy2.get_context()
        saved_mpfr = ambient.copy()
        saved_native = environment._capture_native_environment()
        inputs = self.inputs
        retained_core_sum = gmpy2.mpfr(inputs[3].core64, 256)
        handle: operator.FrozenTailOperatorSession | None = None
        try:
            _install_hostile_mpfr(ambient)
            _install_hostile_native(environment)
            mpfr_before = _context_snapshot(ambient)
            native_before = _native_restore_snapshot(environment)
            failure = operator._tail_pde_module.TailPdeOperatorError(
                "synthetic_environment_failure"
            )
            with patch.object(
                operator._tail_pde_module,
                "evaluate_tail_pde_operator",
                side_effect=failure,
            ):
                with self.assertRaises(operator.TailOperatorError):
                    operator._evaluate_synthetic_tail_operator(
                        collocation=inputs[0],
                        join_barriers=inputs[1],
                        projected_l2_state=inputs[2],
                        core_continuation=inputs[3],
                        state=inputs[4],
                        mode=operator.NEWTON_MODE,
                        synthetic_mass_cell_count=1,
                        synthetic_dependencies_used=True,
                    )
            self.assertEqual(_context_snapshot(ambient), mpfr_before)
            self.assertEqual(_native_restore_snapshot(environment), native_before)

            handle = operator._open_synthetic_tail_operator_session(
                collocation=inputs[0],
                join_barriers=inputs[1],
                projected_l2_state=inputs[2],
                retained_core_sum=retained_core_sum,
                retained_core64=inputs[3].core64,
                synthetic_mass_cell_count=1,
            )
            with (
                patch.object(
                    operator._tail_pde_module,
                    "evaluate_tail_pde_operator",
                    return_value=self.raw_pde,
                ),
                patch.object(
                    operator._tail_mass_module,
                    "_evaluate_tail_mass_graph",
                    return_value=self.raw_mass,
                ),
            ):
                operator.evaluate_primary_tail_operator(
                    session=handle,
                    state=inputs[4],
                    mode=operator.NEWTON_MODE,
                )
            operator._release_tail_operator_session(handle)
            handle = None
            self.assertEqual(_context_snapshot(ambient), mpfr_before)
            self.assertEqual(_native_restore_snapshot(environment), native_before)
        finally:
            if handle is not None and operator._active_tail_operator_session is not None:
                operator._release_tail_operator_session(handle)
            gmpy2.set_context(saved_mpfr)
            environment._restore_native_environment(saved_native)

    def test_frozen_result_false_authority_and_static_source_disjointness(self) -> None:
        result = self.newton
        self.assertIs(result.synthetic_dependencies_used, True)
        self.assertIs(result.calculation_implemented, True)
        self.assertIs(result.combined_residual_implemented, True)
        self.assertIs(result.analytic_jacobian_implemented, True)
        self.assertIs(result.final_residual_only_mode_implemented, True)
        self.assertIs(result.mass_row_is_partial, True)
        self.assertIs(result.full_tail_mass_execution_observed, False)
        self.assertIs(result.full_tail_mass_golden_verified, False)
        for field in RESULT_FALSE_FIELDS:
            self.assertIs(getattr(result, field), False, field)
        self.assertTrue(all(value is False for value in operator.AUTHORITY_LOCKS.values()))
        with self.assertRaises(FrozenInstanceError):
            result.mode = operator.FINAL_RESIDUAL_GATE_MODE
        with self.assertRaises(TypeError):
            operator.AUTHORITY_LOCKS["outputPresent"] = True

        source_path = HERE / "tail_operator.py"
        source = source_path.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(source_path))
        self.assertIsInstance(tree, ast.Module)
        self.assertNotIn("import tail_pde_operator", source)
        self.assertNotIn("from tail_pde_operator", source)
        self.assertNotIn("import tail_mass_operator", source)
        self.assertNotIn("from tail_mass_operator", source)
        self.assertNotIn("import tail_initializer", source)
        self.assertNotIn("from tail_initializer", source)
        self.assertNotIn("import tail_newton", source)
        self.assertNotIn("from tail_newton", source)
        self.assertNotIn("_evaluate_synthetic_tail_operator", operator.__all__)
        self.assertNotIn("_open_synthetic_tail_operator_session", operator.__all__)
        self.assertNotIn("_tail_pde_module", operator.__all__)
        self.assertNotIn("_tail_mass_module", operator.__all__)
        self.assertNotIn("_tail_initializer_module", operator.__all__)
        self.assertIn("FrozenTailOperatorSession", operator.__all__)
        self.assertIn("open_primary_tail_operator_session", operator.__all__)
        self.assertIn("evaluate_primary_tail_operator", operator.__all__)


if __name__ == "__main__":
    unittest.main()
