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

import gmpy2


HERE = Path(__file__).resolve().parent
REPOSITORY_ROOT = HERE.parents[2]
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import binary64_environment as environment  # noqa: E402
import dense_lu as dense  # noqa: E402
from dense_lu import (  # noqa: E402
    AUTHORITY_LOCKS,
    BINARY64_ENVIRONMENT_SOURCE_SHA256,
    BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES,
    FACTOR_OPERATION_GRAPH,
    MAXIMUM_SYSTEM_ORDER,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    REFINEMENT_OPERATION_GRAPH,
    REFINEMENT_PASSES,
    SOLVE_OPERATION_GRAPH,
    DenseLuError,
    solve_frozen_dense_lu,
)


POLICY_FIXTURE = (
    ((0.0, 2.0), (1.0, 1.0)),
    (4.0, 3.0),
)
HAND_SYSTEM = (
    (
        (3.0, 2.0, -1.0),
        (2.0, -2.0, 4.0),
        (-1.0, 0.5, -1.0),
    ),
    (1.0, -2.0, 0.0),
)
FOUR_BY_FOUR = (
    (
        (4.0, 1.0, 0.5, 0.25),
        (1.0, 5.0, 1.0, 0.5),
        (0.5, 1.0, 6.0, 1.0),
        (0.25, 0.5, 1.0, 7.0),
    ),
    (1.0, 2.0, 3.0, 4.0),
)

GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-dense-lu/golden/v1\n"
GOLDEN_HASHES = {
    "policy_fixture": "b5ba48daf1cee13aa5248b9b48e4fe96a202b6a29286358151490e1e36d75d8e",
    "hand_system": "24d18de4e8b2da836f280ca9817fbc3df4ea36ee1c376f7c8a897f82f28c8e17",
    "four_by_four": "99e120fc028488e10a89ee724b8895ccdc29b9ebf64152fef5eeccdc13841318",
}


def _result_hash(result: object) -> str:
    digest = hashlib.sha256()
    digest.update(GOLDEN_DOMAIN)
    digest.update(result.order.to_bytes(8, "little"))  # type: ignore[attr-defined]
    for label, integers in (
        (b"pivot_rows", result.pivot_row_at_step),  # type: ignore[attr-defined]
        (b"permutation", result.final_permutation),  # type: ignore[attr-defined]
    ):
        digest.update(len(label).to_bytes(8, "little"))
        digest.update(label)
        digest.update(len(integers).to_bytes(8, "little"))
        for value in integers:
            digest.update(value.to_bytes(4, "little"))
    vectors = (
        (b"solution", result.solution),  # type: ignore[attr-defined]
        *tuple(
            (f"residual_{index}".encode("ascii"), residual)
            for index, residual in enumerate(result.refinement_residuals)  # type: ignore[attr-defined]
        ),
    )
    for label, values in vectors:
        digest.update(len(label).to_bytes(8, "little"))
        digest.update(label)
        digest.update(len(values).to_bytes(8, "little"))
        digest.update(struct.pack(f"<{len(values)}d", *values))
    for value in (
        result.refinement_passes,  # type: ignore[attr-defined]
        result.factorization_count,  # type: ignore[attr-defined]
        result.factored_solve_count,  # type: ignore[attr-defined]
        result.mpfr_residual_evaluation_count,  # type: ignore[attr-defined]
        result.mpfr_get_d_count,  # type: ignore[attr-defined]
    ):
        digest.update(value.to_bytes(8, "little"))
    return digest.hexdigest()


def _solve(system: object) -> object:
    matrix, rhs = system  # type: ignore[misc]
    return solve_frozen_dense_lu(matrix=matrix, right_hand_side=rhs)


class FrozenDenseLuTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.results = {
            "policy_fixture": _solve(POLICY_FIXTURE),
            "hand_system": _solve(HAND_SYSTEM),
            "four_by_four": _solve(FOUR_BY_FOUR),
        }

    def test_exact_primary_policy_and_binary64_environment_bindings(self) -> None:
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
        environment_bytes = (HERE / "binary64_environment.py").read_bytes()
        self.assertEqual(len(environment_bytes), BINARY64_ENVIRONMENT_SOURCE_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(environment_bytes).hexdigest(),
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

    def test_policy_fixture_hand_system_and_exact_absolute_pivot_ties(self) -> None:
        policy = self.results["policy_fixture"]
        self.assertEqual(policy.pivot_row_at_step, (1, 1))
        self.assertEqual(policy.final_permutation, (1, 0))
        self.assertEqual(policy.solution, (1.0, 2.0))
        self.assertEqual(
            policy.refinement_residuals,
            ((0.0, 0.0), (0.0, 0.0), (0.0, 0.0)),
        )
        self.assertTrue(
            all(
                struct.pack("<d", value) == bytes(8)
                for residual in policy.refinement_residuals
                for value in residual
            )
        )

        hand = self.results["hand_system"]
        self.assertEqual(hand.solution, (1.0, -2.0, -2.0))
        self.assertEqual(
            hand.refinement_residuals,
            (
                (
                    -2.220446049250313e-16,
                    -1.7763568394002505e-15,
                    4.440892098500626e-16,
                ),
                (0.0, 0.0, 0.0),
                (0.0, 0.0, 0.0),
            ),
        )

        tie = solve_frozen_dense_lu(
            matrix=((1.0, 1.0), (-1.0, 2.0)),
            right_hand_side=(2.0, 1.0),
        )
        self.assertEqual(tie.pivot_row_at_step[0], 0)
        self.assertEqual(tie.solution, (1.0, 1.0))

        one = solve_frozen_dense_lu(
            matrix=((2.0,),),
            right_hand_side=(4.0,),
        )
        self.assertEqual(one.solution, (2.0,))
        self.assertEqual(one.pivot_row_at_step, (0,))
        self.assertEqual(one.final_permutation, (0,))

        multiple_swaps = solve_frozen_dense_lu(
            matrix=(
                (0.0, 0.0, 1.0),
                (1.0, 0.0, 0.0),
                (0.0, 1.0, 0.0),
            ),
            right_hand_side=(3.0, 1.0, 2.0),
        )
        self.assertEqual(multiple_swaps.pivot_row_at_step, (1, 2, 2))
        self.assertEqual(multiple_swaps.final_permutation, (1, 2, 0))
        self.assertEqual(multiple_swaps.solution, (1.0, 2.0, 3.0))

        smallest_subnormal = math.ldexp(1.0, -1074)
        gradual = solve_frozen_dense_lu(
            matrix=((smallest_subnormal,),),
            right_hand_side=(smallest_subnormal,),
        )
        self.assertEqual(gradual.solution, (1.0,))
        self.assertEqual(
            gradual.refinement_residuals,
            ((0.0,), (0.0,), (0.0,)),
        )

    def test_complete_solution_pivot_permutation_and_residual_bits_match_goldens(self) -> None:
        self.assertEqual(set(GOLDEN_HASHES), set(self.results))
        for name, expected in GOLDEN_HASHES.items():
            with self.subTest(name=name):
                self.assertEqual(_result_hash(self.results[name]), expected)

    def test_literal_factor_solve_and_three_pass_call_chronology(self) -> None:
        self.assertEqual(MAXIMUM_SYSTEM_ORDER, 257)
        self.assertEqual(REFINEMENT_PASSES, 3)
        self.assertIn("strict_abs_greater_only", FACTOR_OPERATION_GRAPH)
        self.assertIn("one_factorization_only", FACTOR_OPERATION_GRAPH)
        self.assertIn("backward_i_decreasing", SOLVE_OPERATION_GRAPH)
        self.assertIn("exactly_three_passes", REFINEMENT_OPERATION_GRAPH)
        self.assertIn("one_get_d_per_i", REFINEMENT_OPERATION_GRAPH)
        self.assertIn("no_refactor_or_early_exit", REFINEMENT_OPERATION_GRAPH)

        with (
            patch.object(dense, "_factor_once", wraps=dense._factor_once) as factor,
            patch.object(
                dense,
                "_solve_factored",
                wraps=dense._solve_factored,
            ) as factored_solve,
            patch.object(
                dense,
                "_mpfr_residual",
                wraps=dense._mpfr_residual,
            ) as residual,
            patch.object(
                dense,
                "_mpfr_get_d",
                wraps=dense._mpfr_get_d,
            ) as get_d,
        ):
            result = _solve(FOUR_BY_FOUR)

        self.assertEqual(factor.call_count, 1)
        self.assertEqual(factored_solve.call_count, 4)
        self.assertEqual(residual.call_count, 3)
        self.assertEqual(get_d.call_count, 3 * result.order)
        self.assertEqual(result.refinement_passes, 3)
        self.assertEqual(result.factorization_count, 1)
        self.assertEqual(result.factored_solve_count, 4)
        self.assertEqual(result.mpfr_residual_evaluation_count, 3)
        self.assertEqual(result.mpfr_get_d_count, 3 * result.order)
        self.assertEqual(len(result.refinement_residuals), 3)

    def test_full_order_257_resource_boundary_is_admitted(self) -> None:
        order = MAXIMUM_SYSTEM_ORDER
        rows = tuple(
            tuple(1.0 if row == column else 0.0 for column in range(order))
            for row in range(order)
        )
        rhs = tuple(math.ldexp(float(index + 1), -9) for index in range(order))
        result = solve_frozen_dense_lu(matrix=rows, right_hand_side=rhs)
        self.assertEqual(result.order, order)
        self.assertEqual(result.solution, rhs)
        self.assertEqual(result.pivot_row_at_step, tuple(range(order)))
        self.assertEqual(result.final_permutation, tuple(range(order)))
        self.assertEqual(result.mpfr_get_d_count, 3 * order)
        self.assertTrue(
            all(value == 0.0 for residual in result.refinement_residuals for value in residual)
        )

    def test_hostile_native_fenv_is_ignored_and_restored_on_success_and_failure(self) -> None:
        baseline = _result_hash(self.results["four_by_four"])
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
            observed_result = _solve(FOUR_BY_FOUR)
            self.assertEqual(_result_hash(observed_result), baseline)
            self.assertEqual(environment.observed_binary64_environment(), caller)
            with self.assertRaises(DenseLuError) as raised:
                solve_frozen_dense_lu(
                    matrix=((1.0, 2.0), (2.0, 4.0)),
                    right_hand_side=(1.0, 2.0),
                )
            self.assertEqual(raised.exception.code, "dense_lu_pivot_invalid")
            self.assertEqual(environment.observed_binary64_environment(), caller)
        finally:
            environment._restore_native_environment(original)

    def test_exact_path_public_fenv_spoof_is_ignored_by_private_byte_loader(self) -> None:
        module_path = HERE / "dense_lu.py"
        fenv_path = HERE / "binary64_environment.py"
        program = f"""
from contextlib import contextmanager
import importlib.util
from types import MappingProxyType, ModuleType
import pathlib
import sys

module_path = pathlib.Path({str(module_path)!r})
fenv_path = pathlib.Path({str(fenv_path)!r})
sys.path.insert(0, str(module_path.parent))
fake = ModuleType("binary64_environment")
fake.__file__ = str(fenv_path)
fake.AUTHORITY_LOCKS = MappingProxyType({{"hostile": False}})
fake.BINARY64_RUNTIME_FAMILY = "hostile_noop_runtime"
fake.used = 0
@contextmanager
def noop():
    fake.used += 1
    yield
fake.nearest_binary64_environment = noop
sys.modules["binary64_environment"] = fake
spec = importlib.util.spec_from_file_location("hostile_dense_lu", module_path)
module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = module
spec.loader.exec_module(module)
result = module.solve_frozen_dense_lu(
    matrix=((0.0, 2.0), (1.0, 1.0)),
    right_hand_side=(4.0, 3.0),
)
print(
    str(fake.used)
    + "|"
    + repr(result.solution)
    + "|"
    + str(sys.modules["binary64_environment"] is fake)
    + "|"
    + str(module._PRIVATE_BINARY64_ENVIRONMENT_MODULE_NAME in sys.modules)
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
        self.assertEqual(completed.stdout.strip(), "0|(1.0, 2.0)|True|False")

    def test_hostile_ambient_mpfr_context_is_ignored_and_exactly_restored(self) -> None:
        baseline = _result_hash(self.results["four_by_four"])
        ambient = gmpy2.get_context()
        original = ambient.copy()
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = -20
            ambient.emax = 20
            ambient.subnormalize = True
            ambient.trap_inexact = True
            ambient.trap_underflow = True
            ambient.inexact = True
            observed = _solve(FOUR_BY_FOUR)
            self.assertEqual(_result_hash(observed), baseline)
            self.assertEqual(ambient.precision, 19)
            self.assertEqual(ambient.round, gmpy2.RoundDown)
            self.assertEqual(ambient.emin, -20)
            self.assertEqual(ambient.emax, 20)
            self.assertIs(ambient.subnormalize, True)
            self.assertIs(ambient.trap_inexact, True)
            self.assertIs(ambient.trap_underflow, True)
            self.assertIs(ambient.inexact, True)
        finally:
            gmpy2.set_context(original)

    def test_shape_singular_nonfinite_negative_zero_and_extremes_fail_typed(self) -> None:
        repeated_row = (1.0,) * (MAXIMUM_SYSTEM_ORDER + 1)
        oversized = (repeated_row,) * (MAXIMUM_SYSTEM_ORDER + 1)
        cases: tuple[tuple[object, object, str], ...] = (
            ([], (), "dense_lu_matrix_type_invalid"),
            ((), (), "dense_lu_order_invalid"),
            (((1.0,),), [], "dense_lu_right_hand_side_type_invalid"),
            (((1.0,),), (), "dense_lu_right_hand_side_length_invalid"),
            ((((1.0,), [0.0, 1.0])), (1.0, 2.0), "dense_lu_matrix_row_invalid"),
            (((1,),), (1.0,), "dense_lu_binary64_type_invalid"),
            (((True,),), (1.0,), "dense_lu_binary64_type_invalid"),
            (((-0.0,),), (1.0,), "dense_lu_negative_zero_input"),
            (((1.0,),), (-0.0,), "dense_lu_negative_zero_input"),
            (((float("nan"),),), (1.0,), "dense_lu_nonfinite_input"),
            (((1.0,),), (float("inf"),), "dense_lu_nonfinite_input"),
            (oversized, (1.0,) * (MAXIMUM_SYSTEM_ORDER + 1), "dense_lu_order_invalid"),
            (
                ((1.0, 2.0), (2.0, 4.0)),
                (1.0, 2.0),
                "dense_lu_pivot_invalid",
            ),
            (
                (
                    (sys.float_info.max, sys.float_info.max),
                    (sys.float_info.max, -sys.float_info.max),
                ),
                (1.0, 1.0),
                "dense_lu_nonfinite_intermediate",
            ),
        )
        for matrix, right_hand_side, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(DenseLuError) as raised:
                    solve_frozen_dense_lu(
                        matrix=matrix,  # type: ignore[arg-type]
                        right_hand_side=right_hand_side,  # type: ignore[arg-type]
                    )
                self.assertEqual(raised.exception.code, expected_code)

        with patch.object(dense, "BINARY64_ENVIRONMENT_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(DenseLuError) as raised:
                solve_frozen_dense_lu(
                    matrix=object(),  # type: ignore[arg-type]
                    right_hand_side=[float("nan")],  # type: ignore[arg-type]
                )
            self.assertEqual(
                raised.exception.code,
                "binary64_environment_source_mismatch",
            )

        with dense._owned_mpfr256_context() as context:
            with self.assertRaises(DenseLuError) as raised:
                dense._mpfr_get_d(context, gmpy2.mpfr("1e-1000"), "tiny_probe")
            self.assertEqual(
                raised.exception.code,
                "dense_lu_mpfr_get_d_underflow",
            )
            with self.assertRaises(DenseLuError) as raised:
                dense._mpfr_get_d(context, gmpy2.mpfr("1e1000"), "huge_probe")
            self.assertEqual(
                raised.exception.code,
                "dense_lu_mpfr_get_d_nonfinite",
            )

    def test_result_is_frozen_and_all_authority_surfaces_remain_false(self) -> None:
        result = self.results["four_by_four"]
        self.assertEqual(MPFR_PRECISION_BITS, 256)
        self.assertEqual(MPFR_ROUNDING_MODE, "MPFR_RNDN")
        self.assertEqual((MPFR_EMIN, MPFR_EMAX), (-1_000_000, 1_000_000))
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "equilibration_used",
            "fma_used",
            "blas_used",
            "retry_allowed",
            "early_exit_allowed",
            "newton_implemented",
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
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_source_has_no_unfrozen_numeric_dependency_or_solver_control(self) -> None:
        source = (HERE / "dense_lu.py").read_text(encoding="utf-8")
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
                "contextlib",
                "dataclasses",
                "gmpy2",
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
        self.assertFalse(call_names & {"fma", "fsum", "dot", "matmul"})
        self.assertNotIn("nhm2-spherical-boson-star-branch", source)
        self.assertNotIn("newton", call_names)


if __name__ == "__main__":
    unittest.main()
