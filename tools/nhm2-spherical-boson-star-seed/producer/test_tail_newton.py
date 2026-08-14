from __future__ import annotations

import ast
import ctypes
from dataclasses import FrozenInstanceError, replace
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import patch

import gmpy2


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
import tail_newton as tail  # noqa: E402
from tail_newton import (  # noqa: E402
    AUTHORITY_LOCKS,
    BACKTRACK_TRIAL_COUNT,
    BINARY64_ENVIRONMENT_SOURCE_SHA256,
    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
    DENSE_LU_SOURCE_SHA256,
    DENSE_LU_SOURCE_SIZE_BYTES,
    EQUATION_LINF_THRESHOLD,
    FINAL_RESIDUAL_GATE_OPERATION_GRAPH,
    MAXIMUM_ACCEPTED_UPDATES,
    MERIT_ARMIJO_OPERATION_GRAPH,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    RESIDUAL_ROW_COUNT,
    STOP_OPERATION_GRAPH,
    TAIL_NEWTON_OPERATION_GRAPH,
    TAIL_OPERATOR_DEPENDENCY_SEALED,
    TAIL_OPERATOR_SESSION_COMPOSITION_STATUS,
    TAIL_OPERATOR_SOURCE_SHA256,
    TAIL_OPERATOR_SOURCE_SIZE_BYTES,
    UNKNOWN_COUNT,
    TailNewtonError,
    solve_primary_tail_newton,
)


IDENTITY = tuple(
    tuple(1.0 if row == column else 0.0 for column in range(UNKNOWN_COUNT))
    for row in range(UNKNOWN_COUNT)
)
ZERO_RESIDUAL = (0.0,) * RESIDUAL_ROW_COUNT
TARGET = tuple(
    1.0 if index == 0 else 0.25 if index == 1 else 0.0
    for index in range(UNKNOWN_COUNT)
)
INITIAL = tuple(
    2.0 if index == 0 else 1.25 if index == 1 else 0.0
    for index in range(UNKNOWN_COUNT)
)
GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-tail-newton/golden/v1\n"
GOLDEN_HASHES = {
    "affine_success": "94ccefe06b87070ae29748a16083d48bb314cf48db019b5fad3d5bd9803e0bf8",
    "maximum_updates": "f8c34514175b27198db1165e359665b25ad04ea956e08565479e9a1820095037",
}


def _vector(values: tuple[float, ...] | None) -> list[str] | None:
    if values is None:
        return None
    return [value.hex() for value in values]


def _result_hash(result: tail.FrozenTailNewtonResult) -> str:
    payload = {
        "current_state": _vector(result.current_state),
        "accepted_state": _vector(result.accepted_state),
        "final_residual": _vector(result.final_residual),
        "kappa": None if result.kappa is None else result.kappa.hex(),
        "newton_terminated": result.newton_terminated,
        "final_residual_gate_passed": result.final_residual_gate_passed,
        "failure_code": result.failure_code,
        "accepted_update_count": result.accepted_update_count,
        "dense_lu_solve_count": result.dense_lu_solve_count,
        "full_evaluation_count": result.full_evaluation_count,
        "trial_attempt_count": result.trial_attempt_count,
        "trial_full_evaluation_count": result.trial_full_evaluation_count,
        "residual_only_evaluation_count": result.residual_only_evaluation_count,
        "accepted_alpha_exponents": list(result.accepted_alpha_exponents),
        "equation_linf": result.equation_linf.hex(),
        "scaled_step_linf": (
            None if result.scaled_step_linf is None else result.scaled_step_linf.hex()
        ),
        "consecutive_qualifying_count": result.consecutive_qualifying_count,
        "final_residual_linf": (
            None
            if result.final_residual_linf is None
            else result.final_residual_linf.hex()
        ),
    }
    raw = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("ascii")
    return hashlib.sha256(GOLDEN_DOMAIN + raw).hexdigest()


def _affine_full(
    calls: list[tuple[float, ...]],
):
    def evaluate(state: tuple[float, ...]) -> tail._FullEvaluation:
        calls.append(state)
        residual = tuple(
            0.0 if state[index] == TARGET[index] else state[index] - TARGET[index]
            for index in range(UNKNOWN_COUNT)
        )
        return tail._FullEvaluation(residual=residual, jacobian=IDENTITY, kappa=1.0)

    return evaluate


def _zero_residual_only(calls: list[tuple[float, ...]]):
    def evaluate(state: tuple[float, ...]) -> tuple[float, ...]:
        calls.append(state)
        return ZERO_RESIDUAL

    return evaluate


def _run_affine():
    full_calls: list[tuple[float, ...]] = []
    residual_calls: list[tuple[float, ...]] = []
    result = tail._solve_tail_newton_graph(
        initial_state=INITIAL,
        full_evaluator=_affine_full(full_calls),
        residual_only_evaluator=_zero_residual_only(residual_calls),
        synthetic_evaluator_used=True,
    )
    return result, full_calls, residual_calls


def _tail_operator_session_inputs():
    operator = tail._tail_operator
    pde = operator._tail_pde_module
    collocation = pde._tail_collocation_module.generate_tail_collocation()
    kappa = 2.0**-40
    barriers = (1.0, -0.0625 - kappa, 0.0, 0.0)
    join = pde.FrozenL2JoinBarriers(
        node_count=128,
        join_x=32,
        join_rho_exact="32/33",
        U=barriers[0],
        U1=barriers[1],
        V=barriers[2],
        V1=barriers[3],
        barrier_values=barriers,
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
    core64 = float.fromhex("0x0.0000000000001p-1022")
    core_sum = gmpy2.mpfr(core64, 256)
    return collocation, join, projected, core_sum, core64


def _owned_core_level_continuation():
    operator = tail._tail_operator
    initializer = operator._tail_initializer_module
    join_owner = initializer._join_extraction
    core_owner = initializer._core_quadrature
    u = (0.125,) * 127 + (0.0,)
    V = (-0.0625,) * 127 + (0.0,)
    projected = (*u, *V, -0.125)
    barriers = (0.25, -0.015625, -0.0625, 0.00390625)
    join = join_owner.FrozenL2JoinBarriers(
        node_count=128,
        join_x=32,
        join_rho_exact="32/33",
        U=barriers[0],
        U1=barriers[1],
        V=barriers[2],
        V1=barriers[3],
        barrier_values=barriers,
        barrier_order=initializer.JOIN_BARRIER_ORDER,
        primary_numerics_policy_sha256=initializer.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            initializer.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=join_owner.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=join_owner.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=join_owner.SPECTRAL_N128_PAYLOAD_SHA256,
        mpfr_precision_bits=initializer.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=initializer.MPFR_ROUNDING_MODE,
        mpfr_emin=initializer.MPFR_EMIN,
        mpfr_emax=initializer.MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )
    core64 = 0.25
    projected_u_hash = core_owner._f64_payload_sha256(
        core_owner.PROJECTED_U_HASH_DOMAIN, projected[:128]
    )
    core = core_owner.FrozenProjectedL2CoreIntegral(
        node_count=128,
        core_cell_count=core_owner.CORE_CELL_COUNT,
        fixture_point_count=core_owner.GL_POINT_COUNT,
        domain=(0, 32),
        core64=core64,
        core64_bits=struct.pack("<d", core64).hex(),
        cells_completed=core_owner.CORE_CELL_COUNT,
        mapped_points_completed=core_owner.CORE_CELL_COUNT * core_owner.GL_POINT_COUNT,
        node_integrands_completed=core_owner.CORE_CELL_COUNT * core_owner.GL_POINT_COUNT,
        exact_node_shortcuts=0,
        projected_rho_f64le_sha256="1" * 64,
        projected_u_f64le_sha256=projected_u_hash,
        primary_numerics_policy_sha256=initializer.PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            initializer.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        spectral_source_sha256=core_owner.SPECTRAL_SOURCE_SHA256,
        spectral_source_size_bytes=core_owner.SPECTRAL_SOURCE_SIZE_BYTES,
        spectral_payload_sha256=core_owner.SPECTRAL_N128_PAYLOAD_SHA256,
        fixture_manifest_sha256=core_owner.GL256_MANIFEST_SHA256,
        fixture_manifest_size_bytes=core_owner.GL256_MANIFEST_SIZE_BYTES,
        fixture_records_sha256=core_owner.GL256_RECORDS_SHA256,
        fixture_records_size_bytes=core_owner.GL256_RECORDS_SIZE_BYTES,
        fixture_generator_sha256=core_owner.GL256_GENERATOR_SHA256,
        fixture_generator_size_bytes=core_owner.GL256_GENERATOR_SIZE_BYTES,
        fixture_independent_test_sha256=core_owner.GL256_INDEPENDENT_TEST_SHA256,
        fixture_independent_test_size_bytes=(
            core_owner.GL256_INDEPENDENT_TEST_SIZE_BYTES
        ),
        mpfr_precision_bits=initializer.MPFR_PRECISION_BITS,
        mpfr_rounding_mode=initializer.MPFR_ROUNDING_MODE,
        mpfr_emin=initializer.MPFR_EMIN,
        mpfr_emax=initializer.MPFR_EMAX,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )
    core_sum = gmpy2.mpfr(core64, initializer.MPFR_PRECISION_BITS)
    core_owner._register_core_integral_continuation(core, core_sum, core64)
    core_token = core_owner._consume_core_integral_continuation(core)
    continuation = SimpleNamespace(
        owner_core_quadrature_module=core_owner,
        join_result=join,
        core_integral_result=core,
        core_quadrature_token=core_token,
        projected_l2_archive=projected,
        join_barriers=tuple(join.barrier_values),
        core64=core64,
    )
    return continuation, join, core, core_token, core_sum


def _operator_evaluation(
    *,
    session: object,
    state: tuple[float, ...],
    mode: str,
    residual: tuple[float, ...],
    jacobian: tuple[tuple[float, ...], ...] | None,
    ordinal: int,
):
    operator = tail._tail_operator
    active = operator._active_tail_operator_session
    if active is None:
        raise AssertionError("operator_session_required")
    newton_mode = mode == operator.NEWTON_MODE
    full_mass = session.synthetic_mass_cell_count == operator.FULL_TAIL_CELL_COUNT
    return operator.FrozenTailOperatorEvaluation(
        mode=mode,
        residual_row_count=65,
        unknown_count=65,
        residual=residual,
        jacobian=jacobian,
        row_labels=tuple(
            (*(
                f"{kind}[{index}]"
                for kind in ("S", "P")
                for index in range(32)
            ), "mass")
        ),
        row_order=operator.ROW_ORDER,
        unknown_order=operator.UNKNOWN_ORDER,
        state_snapshot_bits=tuple(struct.pack("<d", value).hex() for value in state),
        state_f64le_sha256=operator._f64_tuple_sha256(
            operator.STATE_HASH_DOMAIN, state
        ),
        projected_state_f64le_sha256=operator._f64_tuple_sha256(
            operator.PROJECTED_STATE_HASH_DOMAIN, active.projected_l2_state
        ),
        state_snapshot_count=1,
        state_component_read_count=65,
        state_bitwise_unchanged=True,
        pde_rows_completed=64,
        mass_rows_completed=1,
        residual_store_count=65,
        jacobian_target_touched=newton_mode,
        jacobian_row_store_count=65 if newton_mode else 0,
        jacobian_component_store_count=65 * 65 if newton_mode else 0,
        pde_jacobian_field_accessed=newton_mode,
        mass_jacobian_field_accessed=newton_mode,
        chronology_event_count=4_689 if newton_mode else 464,
        chronology_sha256=(
            "f542af634173577b57985ad089f6a152cb62e54a0d816cc1f64d5e14e539d8ec"
            if newton_mode
            else "bc563b5235ff45699d27a11088e3af35b6130f694f042b445c94e88c4a804987"
        ),
        synthetic_mass_cell_count=session.synthetic_mass_cell_count,
        full_tail_cell_count=operator.FULL_TAIL_CELL_COUNT,
        mass_row_is_partial=not full_mass,
        full_tail_mass_execution_observed=full_mass,
        full_tail_mass_golden_verified=False,
        tail_pde_operator_source_sha256=operator.TAIL_PDE_OPERATOR_SOURCE_SHA256,
        tail_pde_operator_source_size_bytes=operator.TAIL_PDE_OPERATOR_SOURCE_SIZE_BYTES,
        tail_mass_operator_source_sha256=operator.TAIL_MASS_OPERATOR_SOURCE_SHA256,
        tail_mass_operator_source_size_bytes=operator.TAIL_MASS_OPERATOR_SOURCE_SIZE_BYTES,
        binary64_environment_source_sha256=(
            operator.BINARY64_ENVIRONMENT_SOURCE_SHA256
        ),
        binary64_environment_source_size_bytes=(
            operator.BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
        ),
        tail_initializer_source_sha256=operator.TAIL_INITIALIZER_SOURCE_SHA256,
        tail_initializer_source_size_bytes=operator.TAIL_INITIALIZER_SOURCE_SIZE_BYTES,
        tail_initializer_source_status=operator.TAIL_INITIALIZER_SOURCE_STATUS,
        production_dependencies_sealed=True,
        binary64_runtime_family=operator._binary64_environment.BINARY64_RUNTIME_FAMILY,
        session_id_sha256=session.session_id_sha256,
        session_evaluation_ordinal=ordinal,
        retained_core_get_d_count=1,
        synthetic_dependencies_used=session.synthetic_dependencies_used,
        production_adapter_available=not session.synthetic_dependencies_used,
        initializer_continuation_consumed=True,
    )


class PrimaryTailNewtonTests(unittest.TestCase):
    def test_exact_bindings_and_public_shared_instance_blocker(self) -> None:
        self.assertEqual(
            (
                PRIMARY_NUMERICS_POLICY_SHA256,
                PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            ),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )
        for path, expected_hash, expected_size in (
            (
                HERE / "binary64_environment.py",
                BINARY64_ENVIRONMENT_SOURCE_SHA256,
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
            ),
            (HERE / "dense_lu.py", DENSE_LU_SOURCE_SHA256, DENSE_LU_SOURCE_SIZE_BYTES),
            (
                HERE / "tail_operator.py",
                TAIL_OPERATOR_SOURCE_SHA256,
                TAIL_OPERATOR_SOURCE_SIZE_BYTES,
            ),
        ):
            source = path.read_bytes()
            self.assertEqual(len(source), expected_size)
            self.assertEqual(hashlib.sha256(source).hexdigest(), expected_hash)
        self.assertEqual(
            (
                BINARY64_ENVIRONMENT_SOURCE_SHA256,
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
                DENSE_LU_SOURCE_SHA256,
                DENSE_LU_SOURCE_SIZE_BYTES,
            ),
            (
                "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
                14_980,
                "44d38215a8ebe64a03b12b314211ccbe35001e3f963a6f6974631f9c1f07df0e",
                25_345,
            ),
        )
        self.assertEqual(
            (TAIL_OPERATOR_SOURCE_SHA256, TAIL_OPERATOR_SOURCE_SIZE_BYTES),
            (
                "f72dbcddf60c93508dffc264d575daa58e7a3a29beeb7459eb53e604d4292980",
                94_800,
            ),
        )
        self.assertIs(TAIL_OPERATOR_DEPENDENCY_SEALED, True)

        with patch.object(tail, "DENSE_LU_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(TailNewtonError) as raised:
                solve_primary_tail_newton(operator_input=object(), initial_state=())
            self.assertEqual(raised.exception.code, "dense_lu_source_mismatch")
        with self.assertRaises(TailNewtonError) as raised:
            solve_primary_tail_newton(operator_input=object(), initial_state=())
        self.assertEqual(
            raised.exception.code,
            "tail_newton_shared_tail_operator_instance_composition_blocked",
        )
        self.assertEqual(
            raised.exception.detail, TAIL_OPERATOR_SESSION_COMPOSITION_STATUS
        )

    def test_exact_path_public_dependency_spoofs_are_ignored(self) -> None:
        module_path = HERE / "tail_newton.py"
        fenv_path = HERE / "binary64_environment.py"
        dense_path = HERE / "dense_lu.py"
        operator_path = HERE / "tail_operator.py"
        program = f"""
import importlib.util
from types import ModuleType
import pathlib
import sys

module_path = pathlib.Path({str(module_path)!r})
sys.path.insert(0, str(module_path.parent))
fakes = {{}}
for name, raw_path in (
    ("binary64_environment", {str(fenv_path)!r}),
    ("dense_lu", {str(dense_path)!r}),
    ("tail_operator", {str(operator_path)!r}),
):
    fake = ModuleType(name)
    fake.__file__ = raw_path
    fakes[name] = fake
    sys.modules[name] = fake
spec = importlib.util.spec_from_file_location("hostile_tail_newton", module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
private_names = (
    module._PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME,
    module._PRIVATE_DENSE_LU_MODULE_NAME,
    module._PRIVATE_TAIL_OPERATOR_MODULE_NAME,
)
print(
    str(module._binary64_environment is fakes["binary64_environment"])
    + "|"
    + str(module._dense_lu is fakes["dense_lu"])
    + "|"
    + str(module._tail_operator is fakes["tail_operator"])
    + "|"
    + str(all(sys.modules[name] is fake for name, fake in fakes.items()))
    + "|"
    + str(any(name in sys.modules for name in private_names))
)
"""
        child_environment = os.environ.copy()
        child_environment["PYTHONDONTWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-W", "error", "-c", program],
            cwd=HERE,
            env=child_environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            completed.stdout.strip(), "False|False|False|True|False"
        )

    def test_affine_map_requires_three_updates_and_one_final_gate(self) -> None:
        result, full_calls, residual_calls = _run_affine()
        self.assertTrue(result.newton_terminated)
        self.assertTrue(result.final_residual_gate_passed)
        self.assertIsNone(result.failure_code)
        self.assertEqual(result.accepted_update_count, 3)
        self.assertEqual(result.dense_lu_solve_count, 3)
        self.assertEqual(result.accepted_alpha_exponents, (0, 0, 0))
        self.assertEqual(result.full_evaluation_count, 4)
        self.assertEqual(result.trial_full_evaluation_count, 3)
        self.assertEqual(result.trial_attempt_count, 3)
        self.assertEqual(result.residual_only_evaluation_count, 1)
        self.assertEqual(full_calls, [INITIAL, TARGET, TARGET, TARGET])
        self.assertEqual(residual_calls, [TARGET])
        self.assertEqual(result.current_state, TARGET)
        self.assertEqual(result.accepted_state, TARGET)
        self.assertEqual(result.final_residual, ZERO_RESIDUAL)
        self.assertIs(result.endpoint_projection_used, False)
        self.assertEqual(_result_hash(result), GOLDEN_HASHES["affine_success"])

    def test_exact_operator_session_is_reused_through_final_gate(self) -> None:
        operator = tail._tail_operator
        collocation, join, projected, core_sum, core64 = (
            _tail_operator_session_inputs()
        )
        handle = operator._open_synthetic_tail_operator_session(
            collocation=collocation,
            join_barriers=join,
            projected_l2_state=projected,
            retained_core_sum=core_sum,
            retained_core64=core64,
            synthetic_mass_cell_count=1,
        )
        modes: list[str] = []
        sessions: list[object] = []
        ordinal = 0

        def evaluate(*, session: object, state: object, mode: object):
            nonlocal ordinal
            self.assertIs(session, handle)
            self.assertIsInstance(state, tuple)
            self.assertIn(mode, operator.EVALUATION_MODES)
            sessions.append(session)
            modes.append(mode)
            ordinal += 1
            active = operator._active_tail_operator_session
            if active is None:
                raise AssertionError("active_operator_session_required")
            active.evaluation_count = ordinal
            if mode == operator.NEWTON_MODE:
                active.newton_evaluation_count += 1
            else:
                active.final_residual_gate_started = True
                active.final_residual_gate_evaluation_count += 1
                active.terminal = True
            selected_state = state
            if mode == operator.NEWTON_MODE:
                residual = tuple(
                    0.0
                    if selected_state[index] == TARGET[index]
                    else selected_state[index] - TARGET[index]
                    for index in range(UNKNOWN_COUNT)
                )
                jacobian = IDENTITY
            else:
                residual = ZERO_RESIDUAL
                jacobian = None
            return _operator_evaluation(
                session=handle,
                state=selected_state,
                mode=mode,
                residual=residual,
                jacobian=jacobian,
                ordinal=ordinal,
            )

        try:
            forged = replace(handle)
            with self.assertRaises(TailNewtonError) as mismatch:
                tail._solve_tail_newton_with_session(
                    tail_operator_session=forged,
                    initial_state=object(),  # type: ignore[arg-type]
                )
            self.assertEqual(
                mismatch.exception.code,
                "tail_newton_operator_session_invalid",
            )
            with (
                patch.object(
                    operator._tail_initializer_module,
                    "_consume_tail_initializer_continuation",
                    side_effect=AssertionError("initializer_consumed_twice"),
                ),
                patch.object(
                    operator,
                    "evaluate_primary_tail_operator",
                    side_effect=evaluate,
                ),
            ):
                with self.assertRaises(TailNewtonError) as initial_mismatch:
                    tail._solve_tail_newton_with_session(
                        tail_operator_session=handle,
                        initial_state=INITIAL,
                    )
                self.assertEqual(
                    initial_mismatch.exception.code,
                    "tail_newton_operator_session_claim_failed",
                )
                self.assertEqual(
                    initial_mismatch.exception.detail,
                    "tail_operator_initial_state_binding_mismatch",
                )
                result = tail._solve_tail_newton_with_session(
                    tail_operator_session=handle,
                    initial_state=handle.initial_state,
                )
            self.assertTrue(result.newton_terminated)
            self.assertTrue(result.final_residual_gate_passed)
            self.assertEqual(result.accepted_state, TARGET)
            self.assertEqual(result.final_residual, ZERO_RESIDUAL)
            self.assertEqual(
                modes,
                [
                    operator.NEWTON_MODE,
                    operator.NEWTON_MODE,
                    operator.NEWTON_MODE,
                    operator.NEWTON_MODE,
                    operator.FINAL_RESIDUAL_GATE_MODE,
                ],
            )
            self.assertTrue(all(session is handle for session in sessions))
            self.assertIsNone(
                getattr(
                    operator._tail_initializer_module,
                    "_pending_tail_initializer_continuation",
                )
            )
            self.assertEqual(handle.retained_core_get_d_count, 1)
            self.assertEqual(handle.initializer_continuation_consumption_count, 1)
            self.assertEqual(result.tail_operator_source_sha256, TAIL_OPERATOR_SOURCE_SHA256)
            self.assertEqual(
                result.tail_operator_source_size_bytes,
                TAIL_OPERATOR_SOURCE_SIZE_BYTES,
            )
            self.assertTrue(result.tail_operator_dependency_sealed)
            self.assertTrue(result.synthetic_evaluator_used)
            completed_modes = tuple(modes)
            with self.assertRaises(TailNewtonError) as second_solve:
                tail._solve_tail_newton_with_session(
                    tail_operator_session=handle,
                    initial_state=handle.initial_state,
                )
            self.assertEqual(
                second_solve.exception.code,
                "tail_newton_operator_session_claim_failed",
            )
            self.assertEqual(tuple(modes), completed_modes)
        finally:
            operator._release_tail_operator_session(handle)

    def test_owned_core_lineage_reuses_exact_objects_and_cleans_open_failure(self) -> None:
        operator = tail._tail_operator
        initializer = operator._tail_initializer_module
        core_owner = initializer._core_quadrature
        continuation, join, core, core_token, core_sum = (
            _owned_core_level_continuation()
        )
        collocation = (
            operator._tail_pde_module._tail_collocation_module.generate_tail_collocation()
        )
        forged = SimpleNamespace(**vars(continuation))
        forged.owner_core_quadrature_module = operator._tail_pde_module
        with self.assertRaises(TailNewtonError) as forged_owner:
            tail._open_tail_newton_session_from_core_level_continuation(
                core_level_continuation=forged,
                collocation=collocation,
            )
        self.assertEqual(
            forged_owner.exception.code,
            "tail_newton_core_level_continuation_identity_invalid",
        )

        modes: list[str] = []
        sessions: list[object] = []
        ordinal = 0
        handle = None

        def evaluate(*, session: object, state: object, mode: object):
            nonlocal ordinal
            self.assertIs(session, handle)
            self.assertIsInstance(state, tuple)
            ordinal += 1
            modes.append(mode)
            sessions.append(session)
            active = operator._active_tail_operator_session
            if active is None:
                raise AssertionError("active_operator_session_required")
            active.evaluation_count = ordinal
            if mode == operator.NEWTON_MODE:
                active.newton_evaluation_count += 1
                residual = tuple(
                    0.0
                    if state[index] == TARGET[index]
                    else state[index] - TARGET[index]
                    for index in range(UNKNOWN_COUNT)
                )
                jacobian = IDENTITY
            else:
                active.final_residual_gate_started = True
                active.final_residual_gate_evaluation_count += 1
                active.terminal = True
                residual = ZERO_RESIDUAL
                jacobian = None
            return _operator_evaluation(
                session=session,
                state=state,
                mode=mode,
                residual=residual,
                jacobian=jacobian,
                ordinal=ordinal,
            )

        with (
            patch.object(core_owner, "_get_d", side_effect=AssertionError("get_d")),
            patch.object(
                core_owner,
                "_consume_core_integral_continuation",
                side_effect=AssertionError("core consumed twice"),
            ),
            patch.object(
                core_owner,
                "_register_core_integral_continuation",
                side_effect=AssertionError("core rebound"),
            ),
            patch.object(
                core_owner,
                "materialize_projected_l2_core_integral",
                side_effect=AssertionError("core recomputed"),
            ),
        ):
            handle = tail._open_tail_newton_session_from_core_level_continuation(
                core_level_continuation=continuation,
                collocation=collocation,
            )
            active = operator._active_tail_operator_session
            self.assertIsNotNone(active)
            self.assertIs(active.join_barriers, join)
            self.assertIs(active.initializer_continuation.core_integral_result, core)
            self.assertIs(active.core_integral_continuation, core_token)
            self.assertIs(active.core_sum, core_sum)
            self.assertIs(core_token.core_sum, core_sum)
            self.assertIsNone(initializer._pending_tail_initializer_continuation)
            self.assertIsNone(core_owner._pending_core_integral_continuation)
            self.assertIs(handle.synthetic_dependencies_used, False)
            self.assertIs(handle.production_adapter_available, True)
            self.assertEqual(handle.synthetic_mass_cell_count, 4096)
            with patch.object(
                operator, "evaluate_primary_tail_operator", side_effect=evaluate
            ):
                result = tail._solve_tail_newton_with_session(
                    tail_operator_session=handle,
                    initial_state=handle.initial_state,
                )
        self.assertTrue(result.final_residual_gate_passed)
        self.assertIs(result.synthetic_evaluator_used, False)
        self.assertTrue(all(item is handle for item in sessions))
        self.assertEqual(
            modes,
            [
                operator.NEWTON_MODE,
                operator.NEWTON_MODE,
                operator.NEWTON_MODE,
                operator.NEWTON_MODE,
                operator.FINAL_RESIDUAL_GATE_MODE,
            ],
        )
        operator._release_tail_operator_session(handle)

        with self.assertRaises(TailNewtonError) as replay:
            tail._open_tail_newton_session_from_core_level_continuation(
                core_level_continuation=continuation,
                collocation=collocation,
            )
        self.assertEqual(
            replay.exception.code,
            "tail_newton_initializer_continuation_transfer_failed",
        )
        self.assertEqual(
            replay.exception.detail,
            "tail_initializer_owned_core_continuation_already_spent",
        )

        failed_continuation, _, _, _, _ = _owned_core_level_continuation()
        with patch.object(
            operator,
            "_open_bound_tail_operator_session",
            side_effect=operator.TailOperatorError("forced_open_failure"),
        ):
            with self.assertRaises(TailNewtonError) as open_failure:
                tail._open_tail_newton_session_from_core_level_continuation(
                    core_level_continuation=failed_continuation,
                    collocation=collocation,
                )
        self.assertEqual(
            open_failure.exception.code,
            "tail_newton_operator_session_open_failed",
        )
        self.assertEqual(open_failure.exception.detail, "forced_open_failure")
        self.assertIsNone(initializer._pending_tail_initializer_continuation)
        self.assertIsNone(core_owner._pending_core_integral_continuation)
        self.assertIsNone(operator._active_tail_operator_session)

        unexpected_continuation, _, _, _, _ = _owned_core_level_continuation()
        with patch.object(
            operator,
            "_open_bound_tail_operator_session",
            side_effect=RuntimeError("unexpected_open_failure"),
        ):
            with self.assertRaises(TailNewtonError) as unexpected_failure:
                tail._open_tail_newton_session_from_core_level_continuation(
                    core_level_continuation=unexpected_continuation,
                    collocation=collocation,
                )
        self.assertEqual(
            unexpected_failure.exception.code,
            "tail_newton_operator_session_open_failed",
        )
        self.assertEqual(unexpected_failure.exception.detail, "RuntimeError")
        self.assertIsNone(initializer._pending_tail_initializer_continuation)
        self.assertIsNone(core_owner._pending_core_integral_continuation)
        self.assertIsNone(operator._active_tail_operator_session)

    def test_every_domain_rejected_trial_has_complete_f_and_j_before_next_k(self) -> None:
        calls: list[tuple[float, ...]] = []
        initial = tuple(1.0 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))

        def evaluate(state: tuple[float, ...]) -> tail._FullEvaluation:
            calls.append(state)
            if len(calls) == 1:
                residual = tuple(1.5 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))
            else:
                residual = ZERO_RESIDUAL
            return tail._FullEvaluation(residual=residual, jacobian=IDENTITY, kappa=1.0)

        result = tail._solve_tail_newton_graph(
            initial_state=initial,
            full_evaluator=evaluate,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertTrue(result.final_residual_gate_passed)
        self.assertEqual(result.accepted_alpha_exponents, (1, 0, 0))
        self.assertEqual(result.trial_attempt_count, 4)
        self.assertEqual(result.trial_full_evaluation_count, 4)
        self.assertEqual(calls[1][0], -0.5)
        self.assertEqual(calls[2][0], 0.25)
        self.assertEqual(result.accepted_state[0], 0.25)  # type: ignore[index]

    def test_c_and_kappa_domains_and_fixed_kappa_fail_closed(self) -> None:
        zero_c = (0.0,) * UNKNOWN_COUNT
        completed = 0

        def zero_kappa(state: tuple[float, ...]) -> tail._FullEvaluation:
            nonlocal completed
            completed += 1
            return tail._FullEvaluation(
                residual=ZERO_RESIDUAL,
                jacobian=IDENTITY,
                kappa=0.0,
            )

        result = tail._solve_tail_newton_graph(
            initial_state=zero_c,
            full_evaluator=zero_kappa,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(completed, 1)
        self.assertEqual(result.failure_code, "initial_domain_invalid_without_retry")
        self.assertEqual(result.dense_lu_solve_count, 0)

        calls = 0

        def changed_kappa(state: tuple[float, ...]) -> tail._FullEvaluation:
            nonlocal calls
            calls += 1
            residual = tuple(
                (state[index] - TARGET[index]) if calls == 1 else 0.0
                for index in range(UNKNOWN_COUNT)
            )
            return tail._FullEvaluation(
                residual=residual,
                jacobian=IDENTITY,
                kappa=1.0 if calls == 1 else 2.0,
            )

        result = tail._solve_tail_newton_graph(
            initial_state=INITIAL,
            full_evaluator=changed_kappa,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(result.failure_code, "trial_kappa_changed_without_retry")
        self.assertEqual(calls, 2)
        self.assertEqual(result.dense_lu_solve_count, 1)

    def test_literal_25_trial_armijo_exhaustion_uses_one_lu(self) -> None:
        calls: list[tuple[float, ...]] = []
        initial = tuple(2.0 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))
        fixed_residual = tuple(1.0 if index == 1 else 0.0 for index in range(UNKNOWN_COUNT))

        def evaluate(state: tuple[float, ...]) -> tail._FullEvaluation:
            calls.append(state)
            return tail._FullEvaluation(
                residual=fixed_residual,
                jacobian=IDENTITY,
                kappa=1.0,
            )

        result = tail._solve_tail_newton_graph(
            initial_state=initial,
            full_evaluator=evaluate,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(result.failure_code, "armijo_schedule_exhausted_without_retry")
        self.assertEqual(result.dense_lu_solve_count, 1)
        self.assertEqual(result.trial_attempt_count, BACKTRACK_TRIAL_COUNT)
        self.assertEqual(result.trial_full_evaluation_count, BACKTRACK_TRIAL_COUNT)
        self.assertEqual(len(calls), 1 + BACKTRACK_TRIAL_COUNT)
        self.assertEqual(result.accepted_update_count, 0)
        self.assertIn("less_than_or_equal", MERIT_ARMIJO_OPERATION_GRAPH)

    def test_incomplete_trial_and_initial_merit_extreme_never_retry(self) -> None:
        calls = 0

        def incomplete(state: tuple[float, ...]) -> tail._FullEvaluation:
            nonlocal calls
            calls += 1
            if calls == 2:
                raise tail._EvaluationFailed("synthetic_incomplete")
            return tail._FullEvaluation(
                residual=tuple(
                    state[index] - TARGET[index] for index in range(UNKNOWN_COUNT)
                ),
                jacobian=IDENTITY,
                kappa=1.0,
            )

        result = tail._solve_tail_newton_graph(
            initial_state=INITIAL,
            full_evaluator=incomplete,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(
            result.failure_code,
            "trial_full_evaluation_failed_without_retry",
        )
        self.assertEqual(calls, 2)
        self.assertEqual(result.trial_attempt_count, 1)
        self.assertEqual(result.dense_lu_solve_count, 1)

        maximum = sys.float_info.max
        result = tail._solve_tail_newton_graph(
            initial_state=tuple(
                1.0 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT)
            ),
            full_evaluator=lambda state: tail._FullEvaluation(
                residual=tuple(
                    maximum if index == 0 else 0.0 for index in range(UNKNOWN_COUNT)
                ),
                jacobian=IDENTITY,
                kappa=1.0,
            ),
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(result.failure_code, "initial_merit_failed_without_retry")
        self.assertEqual(result.dense_lu_solve_count, 0)

        finite_maximum_state = tuple(
            maximum if index == 0 else 0.0 for index in range(UNKNOWN_COUNT)
        )
        with (
            patch.object(tail._dense_lu, "solve_frozen_dense_lu", return_value=object()),
            patch.object(
                tail,
                "_validate_dense_lu_result",
                return_value=finite_maximum_state,
            ),
        ):
            result = tail._solve_tail_newton_graph(
                initial_state=finite_maximum_state,
                full_evaluator=lambda state: tail._FullEvaluation(
                    residual=tuple(
                        1.0 if index == 1 else 0.0
                        for index in range(UNKNOWN_COUNT)
                    ),
                    jacobian=IDENTITY,
                    kappa=1.0,
                ),
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
        self.assertEqual(result.failure_code, "trial_state_failed_without_retry")
        self.assertEqual(result.trial_attempt_count, 1)
        self.assertEqual(result.trial_full_evaluation_count, 0)

    def test_update_48_is_checked_and_update_49_is_forbidden(self) -> None:
        calls: list[tuple[float, ...]] = []
        initial = tuple(1.0 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))

        def decreasing(state: tuple[float, ...]) -> tail._FullEvaluation:
            magnitude = 1.0 - math.ldexp(float(len(calls)), -10)
            calls.append(state)
            return tail._FullEvaluation(
                residual=tuple(
                    magnitude if index == 1 else 0.0
                    for index in range(UNKNOWN_COUNT)
                ),
                jacobian=IDENTITY,
                kappa=1.0,
            )

        with (
            patch.object(tail._dense_lu, "solve_frozen_dense_lu", return_value=object()),
            patch.object(
                tail,
                "_validate_dense_lu_result",
                return_value=(0.0,) * UNKNOWN_COUNT,
            ),
        ):
            result = tail._solve_tail_newton_graph(
                initial_state=initial,
                full_evaluator=decreasing,
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
        self.assertEqual(result.failure_code, "maximum_updates_reached_without_retry")
        self.assertEqual(result.accepted_update_count, MAXIMUM_ACCEPTED_UPDATES)
        self.assertEqual(result.dense_lu_solve_count, MAXIMUM_ACCEPTED_UPDATES)
        self.assertEqual(result.trial_attempt_count, MAXIMUM_ACCEPTED_UPDATES)
        self.assertEqual(len(calls), 1 + MAXIMUM_ACCEPTED_UPDATES)
        self.assertEqual(result.residual_only_evaluation_count, 0)
        self.assertEqual(_result_hash(result), GOLDEN_HASHES["maximum_updates"])
        self.assertIn("update_48", STOP_OPERATION_GRAPH)

    def test_final_residual_only_gate_is_once_without_projection(self) -> None:
        full_calls: list[tuple[float, ...]] = []
        residual_calls: list[tuple[float, ...]] = []
        above = math.ldexp(1.0, -39)

        def final(state: tuple[float, ...]) -> tuple[float, ...]:
            residual_calls.append(state)
            return tuple(above if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))

        result = tail._solve_tail_newton_graph(
            initial_state=INITIAL,
            full_evaluator=_affine_full(full_calls),
            residual_only_evaluator=final,
            synthetic_evaluator_used=True,
        )
        self.assertTrue(result.newton_terminated)
        self.assertFalse(result.final_residual_gate_passed)
        self.assertEqual(
            result.failure_code,
            "final_residual_gate_failed_without_retry",
        )
        self.assertEqual(result.residual_only_evaluation_count, 1)
        self.assertEqual(residual_calls, [TARGET])
        self.assertEqual(result.accepted_state, TARGET)
        self.assertEqual(result.current_state, TARGET)
        self.assertEqual(result.final_residual_linf, above)
        self.assertIs(result.endpoint_projection_used, False)
        self.assertIn("without_projection", FINAL_RESIDUAL_GATE_OPERATION_GRAPH)

    def test_hostile_shapes_values_and_evaluation_shapes_are_typed(self) -> None:
        cases = (
            ([], "tail_newton_initial_state_type_invalid"),
            ((0.0,), "tail_newton_initial_state_length_invalid"),
            (
                tuple(-0.0 if index == 1 else 1.0 for index in range(UNKNOWN_COUNT)),
                "tail_newton_negative_zero_input",
            ),
            (
                tuple(
                    float("inf") if index == 1 else 1.0
                    for index in range(UNKNOWN_COUNT)
                ),
                "tail_newton_nonfinite_input",
            ),
        )
        for state, expected in cases:
            with self.subTest(expected=expected):
                with self.assertRaises(TailNewtonError) as raised:
                    tail._solve_tail_newton_graph(
                        initial_state=state,  # type: ignore[arg-type]
                        full_evaluator=lambda values: object(),  # type: ignore[arg-type]
                        residual_only_evaluator=lambda values: ZERO_RESIDUAL,
                        synthetic_evaluator_used=True,
                    )
                self.assertEqual(raised.exception.code, expected)

        valid = tuple(1.0 if index == 0 else 0.0 for index in range(UNKNOWN_COUNT))
        with self.assertRaises(TailNewtonError) as raised:
            tail._solve_tail_newton_graph(
                initial_state=valid,
                full_evaluator=lambda state: object(),  # type: ignore[arg-type]
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
        self.assertEqual(raised.exception.code, "tail_newton_full_evaluation_type_invalid")

    def test_hostile_native_fenv_is_ignored_and_restored(self) -> None:
        baseline, _, _ = _run_affine()
        baseline_hash = _result_hash(baseline)
        original = environment._capture_native_environment()
        try:
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
                self.assertEqual(
                    setter(
                        ctypes.byref(observed),
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
            caller = environment.observed_binary64_environment()
            result, _, _ = _run_affine()
            self.assertEqual(_result_hash(result), baseline_hash)
            self.assertEqual(environment.observed_binary64_environment(), caller)

            def incomplete(state: tuple[float, ...]) -> tail._FullEvaluation:
                raise tail._EvaluationFailed("synthetic_failure")

            failed = tail._solve_tail_newton_graph(
                initial_state=INITIAL,
                full_evaluator=incomplete,
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
            self.assertEqual(
                failed.failure_code,
                "initial_full_evaluation_failed_without_retry",
            )
            self.assertEqual(environment.observed_binary64_environment(), caller)
        finally:
            environment._restore_native_environment(original)

    def test_result_is_frozen_and_every_authority_surface_is_false(self) -> None:
        result, _, _ = _run_affine()
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "production_adapter_available",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "retry_allowed",
            "retune_allowed",
            "alternate_solver_allowed",
            "newton_restart_allowed",
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
        ):
            self.assertIs(getattr(result, field), False)
        self.assertTrue(result.synthetic_evaluator_used)
        self.assertTrue(result.tail_operator_dependency_sealed)
        self.assertEqual(result.tail_operator_source_sha256, TAIL_OPERATOR_SOURCE_SHA256)
        self.assertEqual(
            result.tail_operator_source_size_bytes, TAIL_OPERATOR_SOURCE_SIZE_BYTES
        )
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_source_is_disjoint_and_has_no_operator_or_candidate_surface(self) -> None:
        source = (HERE / "tail_newton.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        call_names: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported_roots.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    call_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    call_names.add(node.func.attr)
        self.assertEqual(
            imported_roots,
            {
                "__future__",
                "dataclasses",
                "hashlib",
                "math",
                "pathlib",
                "struct",
                "sys",
                "types",
                "typing",
            },
        )
        self.assertFalse(imported_roots & {"numpy", "scipy", "decimal"})
        self.assertFalse(call_names & {"fma", "fsum", "hypot", "dot", "matmul"})
        self.assertNotIn("import tail_operator", source)
        self.assertNotIn("from tail_operator", source)
        self.assertNotIn("import tail_pde_operator", source)
        self.assertNotIn("from tail_pde_operator", source)
        self.assertNotIn("candidate_source", source)
        self.assertIn(TAIL_OPERATOR_SOURCE_SHA256, source)
        self.assertIn("TAIL_OPERATOR_SOURCE_SIZE_BYTES: Final[int] = 94_800", source)
        self.assertNotIn("_solve_tail_newton_with_session", tail.__all__)
        self.assertNotIn("_tail_operator", tail.__all__)
        self.assertIn(
            "no_endpoint_projection",
            FINAL_RESIDUAL_GATE_OPERATION_GRAPH,
        )


if __name__ == "__main__":
    unittest.main()
