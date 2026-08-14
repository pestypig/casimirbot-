from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
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
import core_operator as core  # noqa: E402
from core_operator import (  # noqa: E402
    AUTHORITY_LOCKS,
    BINARY64_ENVIRONMENT_SOURCE_SHA256,
    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
    CORE_DOMAIN_GRAPH,
    CORE_JACOBIAN_OPERATION_GRAPH,
    CORE_NODE_COUNTS,
    CORE_RESIDUAL_OPERATION_GRAPH,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    SPECTRAL_SOURCE_SHA256,
    SPECTRAL_SOURCE_SIZE_BYTES,
    SPECTRAL_PAYLOAD_GOLDEN_HASHES,
    CoreOperatorError,
    evaluate_primary_core_operator,
    evaluate_primary_core_residual_only,
)

generate_lobatto_spectral_primitive = (
    core._spectral_module.generate_lobatto_spectral_primitive
)


GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-core-operator/golden/v1\n"
GOLDEN_HASHES = {
    64: "e2c6592ec1c2e1f5d510a36d153961ffc8cc6a2743ed60ff94ad533018db7557",
    96: "3d78d2e45d52da5baeceabb6f7108af681bdd4cd72e477e8f313ed6a5f900e05",
    128: "bbd1d859cb800f2b1eebe20ede7706daf51c65cff41f3d05467bdf434ff07133",
}


def _state(node_count: int) -> tuple[float, ...]:
    u = tuple(math.ldexp(float(node_count - index), -12) for index in range(node_count))
    potential = tuple(
        -math.ldexp(float(node_count - index), -11) for index in range(node_count)
    )
    return (*u, *potential, -0.25)


def _packed(values: tuple[float, ...]) -> bytes:
    return struct.pack(f"<{len(values)}d", *values)


def _flatten(rows: tuple[tuple[float, ...], ...]) -> tuple[float, ...]:
    return tuple(value for row in rows for value in row)


def _golden_hash(result: object, state: tuple[float, ...]) -> str:
    digest = hashlib.sha256()
    digest.update(GOLDEN_DOMAIN)
    digest.update(result.node_count.to_bytes(8, "little"))  # type: ignore[attr-defined]
    for label, values in (
        (b"state", state),
        (b"residual", result.residual),  # type: ignore[attr-defined]
        (b"jacobian_row_major", _flatten(result.jacobian)),  # type: ignore[attr-defined]
    ):
        digest.update(len(label).to_bytes(8, "little"))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little"))
        digest.update(_packed(values))
    return digest.hexdigest()


def _bits(value: float) -> bytes:
    return struct.pack("<d", value)


def _r(value: float) -> float:
    if not math.isfinite(value):
        raise AssertionError("hand graph became nonfinite")
    return 0.0 if value == 0.0 else value


def _hand_dot(
    matrix: tuple[tuple[float, ...], ...],
    row: int,
    values: tuple[float, ...],
) -> float:
    accumulator = 0.0
    for column in range(len(values)):
        product = _r(matrix[row][column] * values[column])
        accumulator = _r(accumulator + product)
    return accumulator


def _hand_laplacian(grid: object, row: int, values: tuple[float, ...]) -> float:
    derivative = _hand_dot(grid.first_derivative, row, values)  # type: ignore[attr-defined]
    second = _hand_dot(grid.second_derivative, row, values)  # type: ignore[attr-defined]
    one_minus = _r(1.0 - grid.rho[row])  # type: ignore[attr-defined]
    one_minus_two = _r(one_minus * one_minus)
    one_minus_four = _r(one_minus_two * one_minus_two)
    twice_derivative = _r(2.0 * derivative)
    quotient = _r(twice_derivative / grid.rho[row])  # type: ignore[attr-defined]
    inside = _r(second + quotient)
    return _r(one_minus_four * inside)


def _hand_lij(grid: object, row: int, column: int) -> float:
    one_minus = _r(1.0 - grid.rho[row])  # type: ignore[attr-defined]
    one_minus_two = _r(one_minus * one_minus)
    one_minus_four = _r(one_minus_two * one_minus_two)
    twice_d = _r(2.0 * grid.first_derivative[row][column])  # type: ignore[attr-defined]
    quotient = _r(twice_d / grid.rho[row])  # type: ignore[attr-defined]
    inside = _r(grid.second_derivative[row][column] + quotient)  # type: ignore[attr-defined]
    return _r(one_minus_four * inside)


class CoreOperatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.grids = {
            count: generate_lobatto_spectral_primitive(count)
            for count in CORE_NODE_COUNTS
        }
        cls.states = {count: _state(count) for count in CORE_NODE_COUNTS}
        cls.results = {
            count: evaluate_primary_core_operator(cls.grids[count], cls.states[count])
            for count in CORE_NODE_COUNTS
        }

    def test_exact_primary_policy_and_spectral_source_bindings(self) -> None:
        self.assertEqual(
            (PRIMARY_NUMERICS_POLICY_SHA256, PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )
        spectral_bytes = (HERE / "spectral.py").read_bytes()
        self.assertEqual(len(spectral_bytes), SPECTRAL_SOURCE_SIZE_BYTES)
        self.assertEqual(hashlib.sha256(spectral_bytes).hexdigest(), SPECTRAL_SOURCE_SHA256)
        self.assertEqual(
            (SPECTRAL_SOURCE_SHA256, SPECTRAL_SOURCE_SIZE_BYTES),
            (
                "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
                19_045,
            ),
        )
        fenv_bytes = (HERE / "binary64_environment.py").read_bytes()
        self.assertEqual(len(fenv_bytes), BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(fenv_bytes).hexdigest(),
            BINARY64_ENVIRONMENT_SOURCE_SHA256,
        )
        self.assertEqual(
            (
                BINARY64_ENVIRONMENT_SOURCE_SHA256,
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
            ),
            (
                "8d452abdfa6d9b3e0cf92aa7d8682202b588f1fe8b0fe0772c6d003d2d12f1a4",
                14_980,
            ),
        )
        for result in self.results.values():
            self.assertEqual(
                result.binary64_environment_source_sha256,
                BINARY64_ENVIRONMENT_SOURCE_SHA256,
            )
            self.assertEqual(
                result.binary64_environment_source_size_bytes,
                BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
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
            {"h": PRIMARY_NUMERICS_POLICY_SHA256, "s": PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES},
        )

    def test_hostile_exact_path_preloaded_binary64_environment_is_ignored(self) -> None:
        module_path = HERE / "core_operator.py"
        program = f"""
from contextlib import contextmanager
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
sys.path.insert(0, str(path.parent))
fake = types.ModuleType("binary64_environment")
fake.__file__ = str(path.with_name("binary64_environment.py"))
fake.BINARY64_RUNTIME_FAMILY = "hostile_noop_runtime"
@contextmanager
def noop():
    yield
fake.nearest_binary64_environment = noop
sys.modules["binary64_environment"] = fake
spec = importlib.util.spec_from_file_location("hostile_core_operator", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
try:
    spec.loader.exec_module(module)
except Exception as error:
    print(getattr(error, "code", type(error).__name__))
else:
    private = module._binary64_environment_module
    if (
        private is not fake
        and sys.modules["binary64_environment"] is fake
        and pathlib.Path(private.__file__).resolve() == path.with_name("binary64_environment.py")
        and module.BINARY64_RUNTIME_FAMILY != "hostile_noop_runtime"
        and private.nearest_binary64_environment is not noop
    ):
        print("private_bound_exact_bytes")
    else:
        print("hostile_preload_accepted")
"""
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            completed.stdout.strip(),
            "private_bound_exact_bytes",
        )

    def test_hostile_exact_path_preloaded_spectral_module_is_ignored(self) -> None:
        module_path = HERE / "core_operator.py"
        program = f"""
import importlib.util
import pathlib
import sys
import types

path = pathlib.Path({str(module_path)!r})
fake = types.ModuleType("spectral")
fake.__file__ = str(path.with_name("spectral.py"))
fake.FrozenLobattoSpectralPrimitive = object
fake.AUTHORITY_LOCKS = {{"candidateAuthority": True}}
sys.modules["spectral"] = fake
spec = importlib.util.spec_from_file_location("hostile_core_operator_spectral", path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
private = module._spectral_module
print(
    int(
        private is not fake
        and sys.modules["spectral"] is fake
        and pathlib.Path(private.__file__).resolve() == path.with_name("spectral.py")
        and module.FrozenLobattoSpectralPrimitive
        is private.FrozenLobattoSpectralPrimitive
    )
)
"""
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "1")

    def test_spectral_snapshot_survives_caller_object_changes(self) -> None:
        grid = replace(self.grids[64])
        state = self.states[64]
        original_validate = core._validate_spectral_primitive

        def mutate_before_validation(
            snapshot: core._FrozenSpectralSnapshot,
        ) -> core._FrozenSpectralSnapshot:
            object.__setattr__(grid, "rho", tuple(reversed(grid.rho)))
            object.__setattr__(
                grid,
                "first_derivative",
                tuple(reversed(grid.first_derivative)),
            )
            object.__setattr__(grid, "candidate_authority", True)
            return original_validate(snapshot)

        with patch.object(
            core,
            "_validate_spectral_primitive",
            side_effect=mutate_before_validation,
        ):
            observed = evaluate_primary_core_operator(grid, state)
        self.assertEqual(_golden_hash(observed, state), GOLDEN_HASHES[64])

    def test_dimensions_chronology_finiteness_and_input_immutability(self) -> None:
        self.assertEqual(CORE_NODE_COUNTS, (64, 96, 128))
        self.assertIn("S_i_increasing_then_P_i_increasing_then_A", CORE_RESIDUAL_OPERATION_GRAPH)
        self.assertIn("after_complete_F", CORE_JACOBIAN_OPERATION_GRAPH)
        self.assertIn("columns_0_through_2N", CORE_JACOBIAN_OPERATION_GRAPH)
        self.assertIn("after_complete_F_and_J", CORE_DOMAIN_GRAPH)
        for count, result in self.results.items():
            with self.subTest(count=count):
                unknown_count = 2 * count + 1
                self.assertEqual(result.node_count, count)
                self.assertEqual(result.unknown_count, unknown_count)
                self.assertEqual(len(result.residual), unknown_count)
                self.assertEqual(len(result.jacobian), unknown_count)
                self.assertTrue(all(len(row) == unknown_count for row in result.jacobian))
                numbers = (*result.residual, *_flatten(result.jacobian))
                self.assertTrue(all(math.isfinite(value) for value in numbers))
                self.assertFalse(any(_bits(value) == bytes.fromhex("0000000000000080") for value in numbers))
                self.assertEqual(self.states[count], _state(count))
                self.assertEqual(
                    result.spectral_payload_sha256,
                    SPECTRAL_PAYLOAD_GOLDEN_HASHES[count],
                )

    def test_complete_residual_and_jacobian_bits_match_frozen_goldens(self) -> None:
        self.assertEqual(set(GOLDEN_HASHES), set(CORE_NODE_COUNTS))
        for count, expected in GOLDEN_HASHES.items():
            with self.subTest(count=count):
                self.assertEqual(_golden_hash(self.results[count], self.states[count]), expected)

    def test_projection_gate_path_materializes_only_the_complete_residual(self) -> None:
        count = 64
        with patch.object(
            core,
            "_fill_jacobian",
            side_effect=AssertionError("projection gate must not materialize J"),
        ):
            result = evaluate_primary_core_residual_only(
                self.grids[count], self.states[count]
            )
        self.assertEqual(result.residual, self.results[count].residual)
        self.assertTrue(result.projected_gate_only)
        self.assertFalse(result.jacobian_materialized)
        self.assertFalse(result.solve_performed)
        self.assertFalse(result.candidate_execution_authorized)

    def test_residual_and_analytic_jacobian_match_independent_hand_graph(self) -> None:
        count = 64
        grid = self.grids[count]
        state = self.states[count]
        result = self.results[count]
        u = state[:count]
        potential = state[count : 2 * count]
        nu = state[2 * count]
        interior = 17

        with environment.nearest_binary64_environment():
            expected_s0 = _hand_dot(grid.first_derivative, 0, u)
            laplacian_u = _hand_laplacian(grid, interior, u)
            negative_half = _r(-_r(0.5 * laplacian_u))
            difference = _r(potential[interior] - nu)
            expected_s = _r(negative_half + _r(difference * u[interior]))
            expected_p0 = _hand_dot(grid.first_derivative, 0, potential)
            laplacian_v = _hand_laplacian(grid, interior, potential)
            expected_p = _r(laplacian_v - _r(u[interior] * u[interior]))
            expected_a = _r(u[0] - 1.0)
            for observed, expected in (
                (result.residual[0], expected_s0),
                (result.residual[interior], expected_s),
                (result.residual[count], expected_p0),
                (result.residual[count + interior], expected_p),
                (result.residual[2 * count], expected_a),
            ):
                self.assertEqual(_bits(observed), _bits(expected))

            for column in (0, interior, count - 1):
                lij = _hand_lij(grid, interior, column)
                negative_half_lij = _r(-0.5 * lij)
                diagonal = difference if column == interior else 0.0
                expected_du = _r(negative_half_lij + diagonal)
                self.assertEqual(
                    _bits(result.jacobian[interior][column]),
                    _bits(expected_du),
                )
                self.assertEqual(
                    _bits(result.jacobian[count + interior][count + column]),
                    _bits(lij),
                )
            self.assertEqual(result.jacobian[interior][count + interior], u[interior])
            self.assertEqual(result.jacobian[interior][2 * count], _r(-u[interior]))
            self.assertEqual(
                result.jacobian[count + interior][interior],
                _r(-2.0 * u[interior]),
            )
            self.assertEqual(result.jacobian[0][:count], grid.first_derivative[0])
            self.assertEqual(result.jacobian[count][count : 2 * count], grid.first_derivative[0])
            self.assertEqual(result.jacobian[count - 1][count - 1], 1.0)
            self.assertEqual(result.jacobian[2 * count - 1][2 * count - 1], 1.0)
            self.assertEqual(result.jacobian[2 * count][0], 1.0)

    def test_core_result_is_invariant_under_hostile_ambient_fenv_and_restores_it(self) -> None:
        count = 64
        baseline = _golden_hash(self.results[count], self.states[count])
        original = environment._capture_native_environment()
        try:
            if sys.platform == "win32":
                native = ctypes.CDLL("ucrtbase")
                setter = native._controlfp_s
                setter.argtypes = [ctypes.POINTER(ctypes.c_uint), ctypes.c_uint, ctypes.c_uint]
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
            observed_result = evaluate_primary_core_operator(
                self.grids[count], self.states[count]
            )
            self.assertEqual(_golden_hash(observed_result, self.states[count]), baseline)
            self.assertEqual(environment.observed_binary64_environment(), caller)
            with self.assertRaises(CoreOperatorError) as raised:
                evaluate_primary_core_operator(
                    self.grids[count],
                    (*self.states[count][:-1], 0.0),
                )
            self.assertEqual(raised.exception.code, "core_domain_invalid")
            self.assertEqual(environment.observed_binary64_environment(), caller)
        finally:
            environment._restore_native_environment(original)

    def test_binding_shape_domain_nonfinite_negative_zero_and_extremes_fail_typed(self) -> None:
        grid = self.grids[64]
        state = self.states[64]
        cases: tuple[tuple[object, object, str], ...] = (
            (object(), state, "core_spectral_primitive_type_invalid"),
            (replace(grid, node_count=256), state, "core_spectral_node_count_invalid"),
            (
                replace(
                    grid,
                    rho=(
                        grid.rho[0],
                        math.nextafter(grid.rho[1], grid.rho[2]),
                        *grid.rho[2:],
                    ),
                ),
                state,
                "core_spectral_payload_mismatch",
            ),
            (grid, list(state), "core_state_type_invalid"),
            (grid, state[:-1], "core_state_length_invalid"),
            (grid, (*state[:-1], 0), "core_binary64_type_invalid"),
            (grid, (*state[:-1], float("nan")), "core_binary64_nonfinite_input"),
            (grid, (*state[:-1], float("inf")), "core_binary64_nonfinite_input"),
            (grid, (*state[:-1], -0.0), "core_binary64_negative_zero_input"),
            (grid, (*state[:-1], 0.0), "core_domain_invalid"),
            (grid, (*state[:-1], -512.0), "core_domain_invalid"),
            (
                grid,
                (sys.float_info.max, *state[1:]),
                "core_binary64_nonfinite_intermediate",
            ),
        )
        for selected_grid, selected_state, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(CoreOperatorError) as raised:
                    evaluate_primary_core_operator(selected_grid, selected_state)  # type: ignore[arg-type]
                self.assertEqual(raised.exception.code, expected_code)

        with patch.object(core, "SPECTRAL_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(CoreOperatorError) as raised:
                evaluate_primary_core_operator(object(), [float("nan")])  # type: ignore[arg-type]
            self.assertEqual(raised.exception.code, "spectral_source_binding_mismatch")
        with patch.object(core, "BINARY64_ENVIRONMENT_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(CoreOperatorError) as raised:
                evaluate_primary_core_operator(object(), [float("nan")])  # type: ignore[arg-type]
            self.assertEqual(
                raised.exception.code,
                "binary64_environment_source_binding_mismatch",
            )

    def test_frozen_result_and_source_surface_cannot_claim_authority_or_solve(self) -> None:
        result = self.results[64]
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "newton_implemented",
            "solve_performed",
            "candidate_execution_authorized",
            "candidate_executed",
            "candidate_output_materialized",
            "output_present",
            "output_accepted",
            "seed_accepted",
            "branch_accepted",
            "replay_authority",
            "independent_agreement",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

        source = (HERE / "core_operator.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported = set()
        call_names = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported.update(alias.name.split(".")[0] for alias in node.names)
            elif isinstance(node, ast.ImportFrom) and node.module is not None:
                imported.add(node.module.split(".")[0])
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    call_names.add(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    call_names.add(node.func.attr)
        self.assertFalse(imported & {"numpy", "scipy", "decimal"})
        self.assertNotIn("nhm2-spherical-boson-star-branch", source)
        self.assertNotIn("fma", call_names)
        self.assertNotIn("sum", call_names)
        self.assertNotIn("solve", call_names)
        self.assertEqual(source.count("exec(code, module.__dict__)"), 2)
        self.assertNotIn("import spectral", source)


if __name__ == "__main__":
    unittest.main()
