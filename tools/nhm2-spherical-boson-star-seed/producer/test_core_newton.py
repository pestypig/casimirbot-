from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
import ctypes
import hashlib
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import unittest
from unittest.mock import patch


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
import core_newton as newton  # noqa: E402
from core_newton import (  # noqa: E402
    ARMIJO_C,
    AUTHORITY_LOCKS,
    BACKTRACK_TRIAL_COUNT,
    BINARY64_ENVIRONMENT_SOURCE_SHA256,
    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
    CONSECUTIVE_QUALIFYING_UPDATES,
    CORE_OPERATOR_DEPENDENCY_SEALED,
    CORE_OPERATOR_SOURCE_SHA256,
    CORE_OPERATOR_SOURCE_SIZE_BYTES,
    DENSE_LU_SOURCE_SHA256,
    DENSE_LU_SOURCE_SIZE_BYTES,
    EQUATION_LINF_THRESHOLD,
    MAXIMUM_ACCEPTED_UPDATES,
    MAXIMUM_BACKTRACK_EXPONENT,
    MERIT_ARMIJO_OPERATION_GRAPH,
    NEWTON_OPERATION_GRAPH,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    PROJECTION_OPERATION_GRAPH,
    SCALED_STEP_LINF_THRESHOLD,
    SPECTRAL_SOURCE_SHA256,
    SPECTRAL_SOURCE_SIZE_BYTES,
    STOP_OPERATION_GRAPH,
    CoreNewtonError,
    solve_primary_core_newton,
)


NODE_COUNT = 2
ORDER = 2 * NODE_COUNT + 1
IDENTITY = tuple(
    tuple(1.0 if row == column else 0.0 for column in range(ORDER))
    for row in range(ORDER)
)
ZERO_RESIDUAL = (0.0,) * ORDER
AFFINE_TARGET = (0.25, 0.0, -0.5, 0.0, -1.0)
AFFINE_INITIAL = (1.25, 0.0, 0.5, 0.0, -1.0)
GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-core-newton/golden/v1\n"
GOLDEN_HASHES = {
    "affine_success": "e5e14c358ccaea160160faec6ddeb7fcd59f20f591bd3c180c2b7f67dac743c8",
    "one_domain_rejection": "f7a88b2851401a588f335055c8a28a35912e62cd36aca5fc836abbfcffaeef50",
    "maximum_updates": "4f1cf8021e17aea4caecbfc9d8ecd7301df2ba89b811d4fa3bd5a95f36a1ef10",
}


def _affine_full(
    target: tuple[float, ...],
    calls: list[tuple[float, ...]],
    *,
    invalid_call_indices: frozenset[int] = frozenset(),
):
    def evaluate(state: tuple[float, ...]) -> newton._FullEvaluation:
        call_index = len(calls)
        calls.append(state)
        residual = tuple(
            0.0 if state[index] == target[index] else state[index] - target[index]
            for index in range(len(state))
        )
        return newton._FullEvaluation(
            residual=residual,
            jacobian=IDENTITY,
            domain_valid=call_index not in invalid_call_indices,
        )

    return evaluate


def _zero_residual_only(
    calls: list[tuple[float, ...]],
):
    def evaluate(state: tuple[float, ...]) -> tuple[float, ...]:
        calls.append(state)
        return ZERO_RESIDUAL

    return evaluate


def _run_affine(
    *,
    invalid_call_indices: frozenset[int] = frozenset(),
):
    full_calls: list[tuple[float, ...]] = []
    residual_calls: list[tuple[float, ...]] = []
    result = newton._solve_core_newton_graph(
        node_count=NODE_COUNT,
        initial_state=AFFINE_INITIAL,
        full_evaluator=_affine_full(
            AFFINE_TARGET,
            full_calls,
            invalid_call_indices=invalid_call_indices,
        ),
        residual_only_evaluator=_zero_residual_only(residual_calls),
        synthetic_evaluator_used=True,
    )
    return result, full_calls, residual_calls


def _result_hash(result: object) -> str:
    def vector(values: object) -> object:
        if values is None:
            return None
        return [value.hex() for value in values]  # type: ignore[union-attr]

    payload = {
        "node_count": result.node_count,
        "unknown_count": result.unknown_count,
        "current_state": vector(result.current_state),
        "raw_accepted_state": vector(result.raw_accepted_state),
        "projected_state": vector(result.projected_state),
        "projected_residual": vector(result.projected_residual),
        "newton_terminated": result.newton_terminated,
        "projection_gate_passed": result.projection_gate_passed,
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
        "projection_residual_linf": (
            None
            if result.projection_residual_linf is None
            else result.projection_residual_linf.hex()
        ),
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode(
        "ascii"
    )
    return hashlib.sha256(GOLDEN_DOMAIN + canonical).hexdigest()


class PrimaryCoreNewtonTests(unittest.TestCase):
    def test_exact_sealed_dependency_bindings_and_public_shape_block(self) -> None:
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
                HERE / "spectral.py",
                SPECTRAL_SOURCE_SHA256,
                SPECTRAL_SOURCE_SIZE_BYTES,
            ),
            (
                HERE / "core_operator.py",
                CORE_OPERATOR_SOURCE_SHA256,
                CORE_OPERATOR_SOURCE_SIZE_BYTES,
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
                SPECTRAL_SOURCE_SHA256,
                SPECTRAL_SOURCE_SIZE_BYTES,
            ),
            (
                "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
                14_980,
                "44d38215a8ebe64a03b12b314211ccbe35001e3f963a6f6974631f9c1f07df0e",
                25_345,
                "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
                19_045,
            ),
        )
        self.assertEqual(
            (CORE_OPERATOR_SOURCE_SHA256, CORE_OPERATOR_SOURCE_SIZE_BYTES),
            (
                "b5333cb145ed42e443ac6e122ae77cd4ae4c05e8053cf305c91fdc3572dd6189",
                32_114,
            ),
        )
        self.assertIs(CORE_OPERATOR_DEPENDENCY_SEALED, True)
        self.assertEqual(
            newton._PRIVATE_CORE_OPERATOR_MODULE_NAME,
            "_nhm2_seed_core_newton_operator_b5333cb145ed42e4",
        )
        operator = newton._load_bound_core_operator()
        self.assertIsNot(operator._spectral_module, newton._spectral)
        self.assertIs(
            operator.FrozenLobattoSpectralPrimitive,
            operator._spectral_module.FrozenLobattoSpectralPrimitive,
        )
        with self.assertRaises(CoreNewtonError) as raised:
            solve_primary_core_newton(spectral=object(), initial_state=())
        self.assertEqual(
            raised.exception.code,
            "core_newton_initial_state_shape_invalid",
        )
        with self.assertRaises(CoreNewtonError) as raised:
            solve_primary_core_newton(
                spectral=object(),
                initial_state=(0.0,) * 5,
            )
        self.assertEqual(raised.exception.code, "core_newton_node_count_invalid")
        with self.assertRaises(CoreNewtonError) as raised:
            solve_primary_core_newton(
                spectral=object(),
                initial_state=(0.0,) * 129,
            )
        self.assertEqual(
            raised.exception.code,
            "core_newton_spectral_payload_unavailable",
        )

        executable = "npx.cmd" if os.name == "nt" else "npx"
        program = (
            "import {NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_"
            "SHA256 as h,NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_"
            "V1_CANONICAL_SIZE_BYTES as s} from './shared/contracts/nhm2-spherical-"
            "boson-star-newtonian-seed-primary-numerics.v1.ts';console.log(JSON.stringify({h,s}));"
        )
        completed = subprocess.run(
            [executable, "tsx", "-e", program],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            json.loads(completed.stdout),
            {
                "h": PRIMARY_NUMERICS_POLICY_SHA256,
                "s": PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
            },
        )

    def test_exact_path_public_dependency_spoofs_are_ignored(self) -> None:
        module_path = HERE / "core_newton.py"
        fenv_path = HERE / "binary64_environment.py"
        dense_path = HERE / "dense_lu.py"
        spectral_path = HERE / "spectral.py"
        operator_path = HERE / "core_operator.py"
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
    ("core_operator", {str(operator_path)!r}),
):
    fake = ModuleType(name)
    fake.__file__ = raw_path
    fake.used = 0
    fakes[name] = fake
    sys.modules[name] = fake
spectral_fake = ModuleType("spectral")
spectral_fake.__file__ = {str(spectral_path)!r}
spectral_fake.used = 0
spectral_fake.AUTHORITY_LOCKS = {{}}
spectral_fake.PRIMARY_NUMERICS_POLICY_SHA256 = (
    "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4"
)
spectral_fake.PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES = 80055
spectral_fake.FrozenLobattoSpectralPrimitive = type(
    "HostileSpectralPrimitive", (), {{}}
)
fakes["spectral"] = spectral_fake
sys.modules["spectral"] = spectral_fake
spec = importlib.util.spec_from_file_location("hostile_core_newton", module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
bound_operator = module._load_bound_core_operator()
private_names = (
    module._PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME,
    module._PRIVATE_DENSE_LU_MODULE_NAME,
    module._PRIVATE_SPECTRAL_MODULE_NAME,
    module._PRIVATE_CORE_OPERATOR_MODULE_NAME,
)
print(
    str(module._binary64_environment is fakes["binary64_environment"])
    + "|"
    + str(module._dense_lu is fakes["dense_lu"])
    + "|"
    + str(bound_operator is fakes["core_operator"])
    + "|"
    + str(module._spectral is fakes["spectral"])
    + "|"
    + str(bound_operator._spectral_module is fakes["spectral"])
    + "|"
    + str(
        bound_operator.FrozenLobattoSpectralPrimitive
        is fakes["spectral"].FrozenLobattoSpectralPrimitive
    )
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
            cwd=REPOSITORY_ROOT,
            env=child_environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            completed.stdout.strip(),
            "False|False|False|False|False|False|True|False",
        )

    def test_repaired_operator_rebinds_the_distinct_private_spectral_abi(self) -> None:
        operator = newton._load_bound_core_operator()
        caller_grid = newton._spectral.generate_lobatto_spectral_primitive(64)
        bound = newton._bind_spectral_payload(operator, caller_grid)
        self.assertIs(type(bound), operator.FrozenLobattoSpectralPrimitive)
        self.assertIsNot(bound, caller_grid)
        snapshot = operator._snapshot_spectral_primitive(bound)
        self.assertIs(
            operator._validate_spectral_primitive(snapshot),
            snapshot,
        )
        self.assertEqual(
            operator._spectral_payload_sha256(snapshot),
            operator.SPECTRAL_PAYLOAD_GOLDEN_HASHES[64],
        )

    def test_affine_map_requires_updates_and_literal_stationary_armijo(self) -> None:
        result, full_calls, residual_calls = _run_affine()
        self.assertTrue(result.newton_terminated)
        self.assertTrue(result.projection_gate_passed)
        self.assertIsNone(result.failure_code)
        self.assertEqual(result.accepted_update_count, 3)
        self.assertEqual(result.dense_lu_solve_count, 3)
        self.assertEqual(result.accepted_alpha_exponents, (0, 0, 0))
        self.assertEqual(result.full_evaluation_count, 4)
        self.assertEqual(result.trial_full_evaluation_count, 3)
        self.assertEqual(result.trial_attempt_count, 3)
        self.assertEqual(result.residual_only_evaluation_count, 1)
        self.assertEqual(len(full_calls), 4)
        self.assertEqual(full_calls[0], AFFINE_INITIAL)
        self.assertEqual(full_calls[1:], [AFFINE_TARGET] * 3)
        self.assertEqual(residual_calls, [AFFINE_TARGET])
        self.assertEqual(result.current_state, AFFINE_TARGET)
        self.assertEqual(result.raw_accepted_state, AFFINE_TARGET)
        self.assertEqual(result.projected_state, AFFINE_TARGET)
        self.assertEqual(result.projected_residual, ZERO_RESIDUAL)
        self.assertEqual(result.equation_linf, 0.0)
        self.assertEqual(result.scaled_step_linf, 0.0)
        self.assertEqual(result.consecutive_qualifying_count, 2)
        self.assertEqual(_result_hash(result), GOLDEN_HASHES["affine_success"])

    def test_public_bound_adapter_closes_a_synthetic_n64_map_only(self) -> None:
        module = newton._load_bound_core_operator()
        node_count = 64
        order = 2 * node_count + 1
        target_values = [0.0 for _ in range(order)]
        target_values[0] = 0.25
        target_values[node_count] = -0.5
        target_values[-1] = -1.0
        target = tuple(target_values)
        initial_values = list(target)
        initial_values[0] = 1.25
        initial_values[node_count] = 0.5
        initial = tuple(initial_values)
        identity = tuple(
            tuple(1.0 if row == column else 0.0 for column in range(order))
            for row in range(order)
        )
        full_calls: list[tuple[float, ...]] = []
        residual_calls: list[tuple[float, ...]] = []

        def full(_spectral: object, state: tuple[float, ...]) -> object:
            full_calls.append(state)
            residual = tuple(
                0.0 if state[index] == target[index] else state[index] - target[index]
                for index in range(order)
            )
            return module.FrozenCoreOperatorEvaluation(
                node_count=node_count,
                unknown_count=order,
                residual=residual,
                jacobian=identity,
                primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
                primary_numerics_policy_canonical_size_bytes=(
                    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
                ),
                spectral_source_sha256=module.SPECTRAL_SOURCE_SHA256,
                spectral_source_size_bytes=module.SPECTRAL_SOURCE_SIZE_BYTES,
                binary64_environment_source_sha256=(
                    BINARY64_ENVIRONMENT_SOURCE_SHA256
                ),
                binary64_environment_source_size_bytes=(
                    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
                ),
                spectral_payload_sha256=module.SPECTRAL_PAYLOAD_GOLDEN_HASHES[
                    node_count
                ],
                binary64_runtime_family=environment.BINARY64_RUNTIME_FAMILY,
            )

        def residual_only(_spectral: object, state: tuple[float, ...]) -> object:
            residual_calls.append(state)
            return module.FrozenCoreResidualEvaluation(
                node_count=node_count,
                unknown_count=order,
                residual=(0.0,) * order,
                primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
                primary_numerics_policy_canonical_size_bytes=(
                    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
                ),
                spectral_source_sha256=module.SPECTRAL_SOURCE_SHA256,
                spectral_source_size_bytes=module.SPECTRAL_SOURCE_SIZE_BYTES,
                binary64_environment_source_sha256=(
                    BINARY64_ENVIRONMENT_SOURCE_SHA256
                ),
                binary64_environment_source_size_bytes=(
                    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES
                ),
                spectral_payload_sha256=module.SPECTRAL_PAYLOAD_GOLDEN_HASHES[
                    node_count
                ],
                binary64_runtime_family=environment.BINARY64_RUNTIME_FAMILY,
            )

        with (
            patch.object(
                newton,
                "_bind_spectral_payload",
                return_value=object(),
            ),
            patch.object(module, "evaluate_primary_core_operator", side_effect=full),
            patch.object(
                module,
                "evaluate_primary_core_residual_only",
                side_effect=residual_only,
            ),
        ):
            result = solve_primary_core_newton(
                spectral=object(),
                initial_state=initial,
            )
        self.assertTrue(result.newton_terminated)
        self.assertTrue(result.projection_gate_passed)
        self.assertFalse(result.synthetic_evaluator_used)
        self.assertTrue(result.core_operator_dependency_sealed)
        self.assertEqual(result.accepted_update_count, 3)
        self.assertEqual(result.dense_lu_solve_count, 3)
        self.assertEqual(len(full_calls), 4)
        self.assertEqual(full_calls[0], initial)
        self.assertEqual(full_calls[1:], [target] * 3)
        self.assertEqual(residual_calls, [target])

    def test_rejected_domain_trial_still_materializes_full_f_and_j_before_k1(self) -> None:
        result, full_calls, residual_calls = _run_affine(
            invalid_call_indices=frozenset({1})
        )
        self.assertTrue(result.projection_gate_passed)
        self.assertEqual(result.accepted_update_count, 4)
        self.assertEqual(result.dense_lu_solve_count, 4)
        self.assertEqual(result.accepted_alpha_exponents, (1, 0, 0, 0))
        self.assertEqual(result.full_evaluation_count, 6)
        self.assertEqual(result.trial_full_evaluation_count, 5)
        self.assertEqual(result.trial_attempt_count, 5)
        self.assertEqual(len(full_calls), 6)
        self.assertEqual(full_calls[1], AFFINE_TARGET)
        self.assertEqual(
            full_calls[2],
            tuple(
                AFFINE_INITIAL[index]
                + 0.5 * (AFFINE_TARGET[index] - AFFINE_INITIAL[index])
                for index in range(ORDER)
            ),
        )
        self.assertEqual(residual_calls, [AFFINE_TARGET])
        self.assertEqual(_result_hash(result), GOLDEN_HASHES["one_domain_rejection"])

    def test_merit_armijo_and_accepted_state_scaled_step_are_literal(self) -> None:
        sum_squares, phi = newton._ordered_merit((3.0, 4.0))
        self.assertEqual(sum_squares, 25.0)
        self.assertEqual(phi, 12.5)
        alpha = math.ldexp(1.0, -3)
        self.assertEqual(
            newton._armijo_rhs(
                alpha=alpha,
                current_sum_squares=sum_squares,
                current_phi=phi,
            ),
            12.5 - 25.0 * math.ldexp(1.0, -15),
        )
        self.assertEqual(newton._scaled_step_linf((1.0,), (2.0,)), 0.5)
        self.assertEqual(ARMIJO_C, math.ldexp(1.0, -12))
        self.assertEqual(EQUATION_LINF_THRESHOLD, math.ldexp(1.0, -40))
        self.assertEqual(SCALED_STEP_LINF_THRESHOLD, math.ldexp(1.0, -42))
        self.assertIn("literal_Armijo_only_no_stationary_exception", NEWTON_OPERATION_GRAPH)
        self.assertIn("sumSquares_positive_zero", MERIT_ARMIJO_OPERATION_GRAPH)
        self.assertIn("accepted_state", STOP_OPERATION_GRAPH)
        self.assertNotIn("hypot", MERIT_ARMIJO_OPERATION_GRAPH)

    def test_exact_25_trial_exhaustion_and_one_dense_lu_have_no_retry(self) -> None:
        full_calls: list[tuple[float, ...]] = []
        residual_calls: list[tuple[float, ...]] = []

        def evaluator(state: tuple[float, ...]) -> newton._FullEvaluation:
            full_calls.append(state)
            residual = tuple(
                0.0 if state[index] == AFFINE_TARGET[index] else state[index] - AFFINE_TARGET[index]
                for index in range(ORDER)
            )
            return newton._FullEvaluation(
                residual=residual,
                jacobian=IDENTITY,
                domain_valid=len(full_calls) == 1,
            )

        result = newton._solve_core_newton_graph(
            node_count=NODE_COUNT,
            initial_state=AFFINE_INITIAL,
            full_evaluator=evaluator,
            residual_only_evaluator=_zero_residual_only(residual_calls),
            synthetic_evaluator_used=True,
        )
        self.assertEqual(result.failure_code, "armijo_schedule_exhausted_without_retry")
        self.assertFalse(result.newton_terminated)
        self.assertEqual(result.accepted_update_count, 0)
        self.assertEqual(result.dense_lu_solve_count, 1)
        self.assertEqual(result.trial_attempt_count, 25)
        self.assertEqual(result.trial_full_evaluation_count, 25)
        self.assertEqual(result.full_evaluation_count, 26)
        self.assertEqual(len(full_calls), 26)
        self.assertEqual(residual_calls, [])
        self.assertEqual(MAXIMUM_BACKTRACK_EXPONENT, 24)
        self.assertEqual(BACKTRACK_TRIAL_COUNT, 25)

    def test_incomplete_trial_evaluation_fails_without_later_k_or_retry(self) -> None:
        calls = 0

        def evaluator(state: tuple[float, ...]) -> newton._FullEvaluation:
            nonlocal calls
            calls += 1
            if calls == 2:
                raise newton._EvaluationFailed("synthetic_nonfinite_intermediate")
            residual = tuple(
                0.0 if state[index] == AFFINE_TARGET[index] else state[index] - AFFINE_TARGET[index]
                for index in range(ORDER)
            )
            return newton._FullEvaluation(
                residual=residual,
                jacobian=IDENTITY,
                domain_valid=True,
            )

        result = newton._solve_core_newton_graph(
            node_count=NODE_COUNT,
            initial_state=AFFINE_INITIAL,
            full_evaluator=evaluator,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(
            result.failure_code,
            "trial_full_evaluation_failed_without_retry",
        )
        self.assertEqual(result.dense_lu_solve_count, 1)
        self.assertEqual(result.trial_attempt_count, 1)
        self.assertEqual(result.trial_full_evaluation_count, 1)
        self.assertEqual(result.full_evaluation_count, 2)
        self.assertEqual(calls, 2)

    def test_singular_map_fails_once_and_update_48_is_checked_without_49(self) -> None:
        singular_calls: list[tuple[float, ...]] = []

        def singular(state: tuple[float, ...]) -> newton._FullEvaluation:
            singular_calls.append(state)
            zero_jacobian = tuple((0.0,) * ORDER for _ in range(ORDER))
            return newton._FullEvaluation(
                residual=(1.0, 0.0, 0.0, 0.0, 0.0),
                jacobian=zero_jacobian,
                domain_valid=True,
            )

        singular_result = newton._solve_core_newton_graph(
            node_count=NODE_COUNT,
            initial_state=AFFINE_INITIAL,
            full_evaluator=singular,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(singular_result.failure_code, "dense_lu_failed_without_retry")
        self.assertEqual(singular_result.dense_lu_solve_count, 1)
        self.assertEqual(singular_result.full_evaluation_count, 1)
        self.assertEqual(len(singular_calls), 1)

        evaluation_count = 0

        def slowly_decreasing(state: tuple[float, ...]) -> newton._FullEvaluation:
            nonlocal evaluation_count
            magnitude = 1.0 - math.ldexp(float(evaluation_count), -10)
            evaluation_count += 1
            return newton._FullEvaluation(
                residual=(magnitude, 0.0, 0.0, 0.0, 0.0),
                jacobian=IDENTITY,
                domain_valid=True,
            )

        maximum_result = newton._solve_core_newton_graph(
            node_count=NODE_COUNT,
            initial_state=AFFINE_INITIAL,
            full_evaluator=slowly_decreasing,
            residual_only_evaluator=lambda state: ZERO_RESIDUAL,
            synthetic_evaluator_used=True,
        )
        self.assertEqual(maximum_result.failure_code, "maximum_updates_reached_without_retry")
        self.assertFalse(maximum_result.newton_terminated)
        self.assertEqual(maximum_result.accepted_update_count, 48)
        self.assertEqual(maximum_result.dense_lu_solve_count, 48)
        self.assertEqual(maximum_result.full_evaluation_count, 49)
        self.assertEqual(maximum_result.trial_attempt_count, 48)
        self.assertEqual(maximum_result.accepted_alpha_exponents, (0,) * 48)
        self.assertEqual(evaluation_count, 49)
        self.assertEqual(MAXIMUM_ACCEPTED_UPDATES, 48)
        self.assertEqual(_result_hash(maximum_result), GOLDEN_HASHES["maximum_updates"])

    def test_projection_writes_only_positive_zero_endpoints_and_gates_residual(self) -> None:
        target = (0.25, 0.75, -0.5, 0.125, -1.0)
        residual_calls: list[tuple[float, ...]] = []

        def projected_residual(state: tuple[float, ...]) -> tuple[float, ...]:
            residual_calls.append(state)
            return (math.ldexp(1.0, -39), 0.0, 0.0, 0.0, 0.0)

        result = newton._solve_core_newton_graph(
            node_count=NODE_COUNT,
            initial_state=target,
            full_evaluator=_affine_full(target, []),
            residual_only_evaluator=projected_residual,
            synthetic_evaluator_used=True,
        )
        self.assertTrue(result.newton_terminated)
        self.assertFalse(result.projection_gate_passed)
        self.assertEqual(
            result.failure_code, "projection_residual_gate_failed_without_retry"
        )
        self.assertEqual(result.accepted_update_count, 2)
        self.assertEqual(result.residual_only_evaluation_count, 1)
        self.assertEqual(len(residual_calls), 1)
        self.assertEqual(result.raw_accepted_state, target)
        self.assertEqual(result.projected_state, (0.25, 0.0, -0.5, 0.0, -1.0))
        self.assertEqual(struct.pack("<d", result.projected_state[1]), bytes(8))
        self.assertEqual(struct.pack("<d", result.projected_state[3]), bytes(8))
        for index in (0, 2, 4):
            self.assertEqual(
                struct.pack("<d", result.projected_state[index]),
                struct.pack("<d", target[index]),
            )
        self.assertEqual(result.projection_residual_linf, math.ldexp(1.0, -39))
        self.assertIn("residual_only_once", PROJECTION_OPERATION_GRAPH)

    def test_hostile_native_fenv_is_ignored_and_restored_on_success_and_failure(self) -> None:
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
            observed_result, _, _ = _run_affine()
            self.assertEqual(_result_hash(observed_result), baseline_hash)
            self.assertEqual(environment.observed_binary64_environment(), caller)

            def singular(state: tuple[float, ...]) -> newton._FullEvaluation:
                return newton._FullEvaluation(
                    residual=(1.0, 0.0, 0.0, 0.0, 0.0),
                    jacobian=tuple((0.0,) * ORDER for _ in range(ORDER)),
                    domain_valid=True,
                )

            failed = newton._solve_core_newton_graph(
                node_count=NODE_COUNT,
                initial_state=AFFINE_INITIAL,
                full_evaluator=singular,
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
            self.assertEqual(failed.failure_code, "dense_lu_failed_without_retry")
            self.assertEqual(environment.observed_binary64_environment(), caller)
        finally:
            environment._restore_native_environment(original)

    def test_hostile_shapes_values_and_source_precedence_fail_typed(self) -> None:
        with patch.object(newton, "DENSE_LU_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(CoreNewtonError) as raised:
                newton._solve_core_newton_graph(
                    node_count=0,
                    initial_state=(),
                    full_evaluator=lambda state: object(),  # type: ignore[arg-type]
                    residual_only_evaluator=lambda state: (),
                    synthetic_evaluator_used=True,
                )
            self.assertEqual(raised.exception.code, "dense_lu_source_mismatch")

        cases = (
            (0, (), "core_newton_node_count_invalid"),
            (2, [], "core_newton_initial_state_type_invalid"),
            (2, (0.0,), "core_newton_initial_state_length_invalid"),
            (2, (0.0, -0.0, 0.0, 0.0, 0.0), "core_newton_negative_zero_input"),
            (2, (0.0, float("inf"), 0.0, 0.0, 0.0), "core_newton_nonfinite_input"),
        )
        for count, state, expected in cases:
            with self.subTest(expected=expected):
                with self.assertRaises(CoreNewtonError) as raised:
                    newton._solve_core_newton_graph(
                        node_count=count,
                        initial_state=state,  # type: ignore[arg-type]
                        full_evaluator=lambda values: object(),  # type: ignore[arg-type]
                        residual_only_evaluator=lambda values: (),
                        synthetic_evaluator_used=True,
                    )
                self.assertEqual(raised.exception.code, expected)

        with self.assertRaises(CoreNewtonError) as raised:
            newton._solve_core_newton_graph(
                node_count=NODE_COUNT,
                initial_state=AFFINE_INITIAL,
                full_evaluator=lambda state: object(),  # type: ignore[arg-type]
                residual_only_evaluator=lambda state: ZERO_RESIDUAL,
                synthetic_evaluator_used=True,
            )
        self.assertEqual(raised.exception.code, "core_newton_full_evaluation_type_invalid")

    def test_result_is_frozen_and_all_authority_surfaces_remain_false(self) -> None:
        result, _, _ = _run_affine()
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
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
        self.assertTrue(result.core_operator_dependency_sealed)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_source_is_disjoint_and_has_no_unfrozen_solver_or_candidate_surface(self) -> None:
        source = (HERE / "core_newton.py").read_text(encoding="utf-8")
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
        self.assertNotIn("nhm2-spherical-boson-star-branch", source)
        self.assertNotIn("deterministic_newton", source)
        self.assertNotIn("solve_spherical_radial_compactified", source)
        self.assertNotIn("candidate_source", source)


if __name__ == "__main__":
    unittest.main()
