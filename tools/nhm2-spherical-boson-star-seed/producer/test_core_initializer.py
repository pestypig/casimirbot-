from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
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

import core_initializer as initializer  # noqa: E402
from core_initializer import (  # noqa: E402
    AUTHORITY_LOCKS,
    ENDPOINT_OPERATION_GRAPH,
    FIXED_NODE_COUNT,
    INTERIOR_OPERATION_GRAPH,
    KG_OPERATION_GRAPH,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    NU_OPERATION_GRAPH,
    PACKING_OPERATION_GRAPH,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    SPECTRAL_N64_GOLDEN_SHA256,
    SPECTRAL_SOURCE_SHA256,
    SPECTRAL_SOURCE_SIZE_BYTES,
    CoreInitializerError,
    materialize_fixed_l0_initializer,
)

generate_lobatto_spectral_primitive = (
    initializer._spectral_module.generate_lobatto_spectral_primitive
)


EXPECTED_Z_F64LE_SHA256 = (
    "cdac4932d5f11808a7a443fe8cb40e56c69418396f28409e9094e354722b95c5"
)
EXPECTED_SCALAR_BITS = {
    "kg": "3feef30abf082e7f",
    "nu": "bfddeeea11683f4a",
}
EXPECTED_NODE_BITS = {
    0: ("3ff0000000000000", "bff33e28c20c28af"),
    1: ("3fefffff9eea8732", "bff33e28b0be2307"),
    8: ("3feff9c471fad1c6", "bff33d050729d897"),
    16: ("3fef9407d120d616", "bff328c7e6622440"),
    31: ("3fe87bcfbbc12ed0", "bff137c388a912a7"),
    32: ("3fe7593c312d6888", "bff0d8e3001b45da"),
    47: ("3f9c8bbd4694451a", "bfd5f9e71873951b"),
    55: ("3e1654112bc709be", "bfb43c93d30e9c9c"),
    62: ("0000000000000000", "bf53b5ce726ffb65"),
    63: ("0000000000000000", "0000000000000000"),
}
EXPECTED_RHO_HALF_BITS = (
    "3feef30abf082e7f",
    "bfddeeea11683f4a",
    "3fd85482667b917d",
    "3fc27fa2c866c4ec",
    "3fe7ee4348388388",
    "bff109fdbb3ed563",
)


def _bits(value: float) -> str:
    return struct.pack(">d", value).hex()


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack("<d", value) == bytes.fromhex(
        "0000000000000080"
    )


def _z_sha256(values: tuple[float, ...]) -> str:
    return hashlib.sha256(struct.pack(f"<{len(values)}d", *values)).hexdigest()


def _high_precision_reference(rho64: float, kg64: float) -> tuple[float, float]:
    template = gmpy2.get_context().copy()
    template.precision = 512
    template.round = gmpy2.RoundToNearest
    template.emin = MPFR_EMIN
    template.emax = MPFR_EMAX
    template.subnormalize = False
    template.trap_underflow = False
    template.trap_overflow = False
    template.trap_inexact = False
    template.trap_invalid = False
    template.trap_erange = False
    template.trap_divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    with gmpy2.context(template):
        rho = gmpy2.mpfr(rho64)
        one = gmpy2.mpfr(1)
        x = rho / (one - rho)
        kg = gmpy2.mpfr(kg64)
        two_kg = gmpy2.mpfr(2) * kg
        t = two_kg * x
        exp_one = gmpy2.exp(-(kg * x))
        exp_two = gmpy2.exp(-t)

        def integral_pair(n: int) -> tuple[gmpy2.mpfr, gmpy2.mpfr]:
            series = gmpy2.mpfr(0)
            for j in range(n + 1):
                series += (t**j) / math.factorial(j)
            prefactor = math.factorial(n) / (two_kg ** (n + 1))
            tail = prefactor * exp_two * series
            return prefactor * (one - exp_two * series), tail

        _, j1 = integral_pair(1)
        i2, j2 = integral_pair(2)
        i3, j3 = integral_pair(3)
        i4, _ = integral_pair(4)
        u_value = (one + kg * x) * exp_one
        v_value = -(
            i2 + two_kg * i3 + kg * kg * i4
        ) / x - (j1 + two_kg * j2 + kg * kg * j3)
        return float(u_value), float(v_value)


class CoreInitializerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.grid = generate_lobatto_spectral_primitive(FIXED_NODE_COUNT)
        cls.result = materialize_fixed_l0_initializer(cls.grid)

    def test_exact_primary_policy_spectral_source_and_instance_bindings(self) -> None:
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
        spectral_bytes = (HERE / "spectral.py").read_bytes()
        self.assertEqual(len(spectral_bytes), SPECTRAL_SOURCE_SIZE_BYTES)
        self.assertEqual(
            hashlib.sha256(spectral_bytes).hexdigest(), SPECTRAL_SOURCE_SHA256
        )
        self.assertEqual(
            (SPECTRAL_SOURCE_SHA256, SPECTRAL_SOURCE_SIZE_BYTES),
            (
                "e9b2509b0c4a5d417250b3d145a648404cde440f12961d2faec1bc14758b78f7",
                19_045,
            ),
        )
        self.assertEqual(
            initializer._spectral_golden_sha256(
                initializer._snapshot_spectral_primitive(self.grid)
            ),
            SPECTRAL_N64_GOLDEN_SHA256,
        )

        executable = "npx.cmd" if os.name == "nt" else "npx"
        program = (
            "import {NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_"
            "SHA256 as h,NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_"
            "V1_CANONICAL_SIZE_BYTES as s} from './shared/contracts/nhm2-spherical-"
            "boson-star-newtonian-seed-primary-numerics.v1.ts';"
            "console.log(JSON.stringify({h,s}));"
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

    def test_complete_z_and_selected_nodes_match_literal_binary64_goldens(self) -> None:
        result = self.result
        self.assertEqual(result.node_count, 64)
        self.assertEqual(len(result.u), 64)
        self.assertEqual(len(result.V), 64)
        self.assertEqual(len(result.z), 129)
        self.assertEqual(result.z, (*result.u, *result.V, result.nu))
        self.assertEqual(_bits(result.kg), EXPECTED_SCALAR_BITS["kg"])
        self.assertEqual(_bits(result.nu), EXPECTED_SCALAR_BITS["nu"])
        self.assertEqual(_z_sha256(result.z), EXPECTED_Z_F64LE_SHA256)
        for index, expected in EXPECTED_NODE_BITS.items():
            with self.subTest(index=index):
                self.assertEqual((_bits(result.u[index]), _bits(result.V[index])), expected)
        self.assertTrue(all(math.isfinite(value) for value in result.z))
        self.assertFalse(any(_negative_zero(value) for value in result.z))

    def test_policy_rho_half_barriers_match_all_six_literal_goldens(self) -> None:
        with initializer._owned_mpfr256_context() as context:
            kg64 = initializer._kg64(context)
            nu64 = initializer._nu64(context, kg64)
            u_mp, v_mp, exp_one_mp, exp_two_mp = initializer._interior_values(
                context,
                0.5,
                kg64,
                32,
            )
            observed = (
                kg64,
                nu64,
                initializer._get_d(context, exp_one_mp, "test.exp_one"),
                initializer._get_d(context, exp_two_mp, "test.exp_two"),
                initializer._get_d(context, u_mp, "test.u"),
                initializer._get_d(context, v_mp, "test.V"),
            )
        self.assertEqual(tuple(_bits(value) for value in observed), EXPECTED_RHO_HALF_BITS)

    def test_independent_512_bit_spot_checks_agree_with_stored_values(self) -> None:
        for index in (8, 16, 31, 32, 47, 55):
            with self.subTest(index=index):
                expected_u, expected_v = _high_precision_reference(
                    self.grid.rho[index], self.result.kg
                )
                self.assertLessEqual(
                    abs(self.result.u[index] - expected_u),
                    math.ulp(expected_u),
                )
                self.assertLessEqual(
                    abs(self.result.V[index] - expected_v),
                    math.ulp(expected_v),
                )

    def test_literal_chronology_has_distinct_exponentials_and_exact_get_d_counts(self) -> None:
        get_d_operations: list[str] = []
        exp_operations: list[str] = []
        sqrt_operations: list[str] = []
        original_get_d = initializer._get_d
        original_exp = initializer._exp
        original_sqrt = initializer._sqrt
        original_source_read = initializer._read_bound_spectral_source

        def recording_get_d(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> float:
            get_d_operations.append(operation)
            return original_get_d(context, value, operation)

        def recording_exp(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> gmpy2.mpfr:
            exp_operations.append(operation)
            return original_exp(context, value, operation)

        def recording_sqrt(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> gmpy2.mpfr:
            sqrt_operations.append(operation)
            return original_sqrt(context, value, operation)

        with (
            patch.object(initializer, "_get_d", side_effect=recording_get_d),
            patch.object(initializer, "_exp", side_effect=recording_exp),
            patch.object(initializer, "_sqrt", side_effect=recording_sqrt),
            patch.object(
                initializer,
                "_read_bound_spectral_source",
                wraps=original_source_read,
            ) as source_read,
        ):
            observed = materialize_fixed_l0_initializer(self.grid)
        self.assertEqual(_z_sha256(observed.z), EXPECTED_Z_F64LE_SHA256)
        self.assertEqual(get_d_operations.count("kg.get_d"), 1)
        self.assertEqual(get_d_operations.count("nu.get_d"), 1)
        self.assertEqual(
            sqrt_operations,
            ["kg.sqrt_first_root", "kg.sqrt_kg"],
        )
        self.assertEqual(source_read.call_count, 2)
        self.assertEqual(
            [name for name in get_d_operations if name.endswith(".u.get_d")],
            [f"node[{index}].u.get_d" for index in range(64)],
        )
        self.assertEqual(
            [name for name in get_d_operations if name.endswith(".V.get_d")],
            [f"node[{index}].V.get_d" for index in range(64)],
        )
        self.assertEqual(len(get_d_operations), 130)
        self.assertEqual(len(exp_operations), 124)
        for index in range(1, 63):
            self.assertEqual(
                exp_operations[2 * (index - 1) : 2 * index],
                [
                    f"node[{index}].exp_minus_kg_x",
                    f"node[{index}].exp_minus_two_kg_x",
                ],
            )

    def test_exact_path_preloaded_spectral_module_is_ignored(self) -> None:
        module_path = HERE / "core_initializer.py"
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
spec = importlib.util.spec_from_file_location("hostile_core_initializer", path)
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
        environment = os.environ.copy()
        environment["PYTHONDONTWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(
            completed.stdout.strip(),
            "1",
        )

    def test_spectral_snapshot_is_immutable_after_caller_object_changes(self) -> None:
        changing_grid = replace(self.grid)
        original_validate = initializer._validate_spectral_primitive

        def mutate_before_validation(
            snapshot: initializer._FrozenSpectralSnapshot,
        ) -> initializer._FrozenSpectralSnapshot:
            object.__setattr__(
                changing_grid,
                "rho",
                tuple(reversed(changing_grid.rho)),
            )
            return original_validate(snapshot)

        with patch.object(
            initializer,
            "_validate_spectral_primitive",
            side_effect=mutate_before_validation,
        ):
            observed = materialize_fixed_l0_initializer(changing_grid)
        self.assertEqual(_z_sha256(observed.z), EXPECTED_Z_F64LE_SHA256)
        self.assertIs(type(observed.z), tuple)

    def test_owned_mpfr_context_ignores_and_restores_hostile_ambient_state(self) -> None:
        baseline = _z_sha256(self.result.z)
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
            ambient.trap_overflow = True
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
            context_fields = (
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
            caller = {name: getattr(ambient, name) for name in context_fields}
            observed = materialize_fixed_l0_initializer(self.grid)
            self.assertEqual(_z_sha256(observed.z), baseline)
            self.assertEqual(
                {name: getattr(ambient, name) for name in context_fields},
                caller,
            )

            with patch.object(
                initializer,
                "_exp",
                side_effect=CoreInitializerError("test_forced_failure", "exp"),
            ):
                with self.assertRaises(CoreInitializerError):
                    materialize_fixed_l0_initializer(self.grid)
            self.assertEqual(
                {name: getattr(ambient, name) for name in context_fields},
                caller,
            )
        finally:
            gmpy2.set_context(original)

    def test_shape_domain_negative_zero_authority_and_source_failures_are_typed(self) -> None:
        grid = self.grid
        rho_negative_zero = (-0.0, *grid.rho[1:])
        rho_nan = (*grid.rho[:17], float("nan"), *grid.rho[18:])
        rho_duplicate = (*grid.rho[:17], grid.rho[16], *grid.rho[18:])
        changed_row = (
            math.nextafter(grid.first_derivative[0][0], math.inf),
            *grid.first_derivative[0][1:],
        )
        changed_matrix = (changed_row, *grid.first_derivative[1:])
        cases = (
            (object(), "initializer_spectral_primitive_type_invalid"),
            (replace(grid, node_count=96), "initializer_spectral_node_count_invalid"),
            (replace(grid, rho=list(grid.rho)), "initializer_spectral_shape_invalid"),
            (
                replace(grid, rho=rho_negative_zero),
                "initializer_binary64_negative_zero_input",
            ),
            (replace(grid, rho=rho_nan), "initializer_binary64_nonfinite_input"),
            (replace(grid, rho=rho_duplicate), "initializer_spectral_order_invalid"),
            (
                replace(grid, first_derivative=changed_matrix),
                "initializer_spectral_instance_mismatch",
            ),
            (
                replace(grid, primary_numerics_policy_sha256="0" * 64),
                "initializer_spectral_policy_binding_mismatch",
            ),
            (
                replace(grid, candidate_execution_authorized=True),
                "initializer_spectral_authority_lock_invalid",
            ),
        )
        for selected, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(CoreInitializerError) as raised:
                    materialize_fixed_l0_initializer(selected)  # type: ignore[arg-type]
                self.assertEqual(raised.exception.code, expected_code)

        accessed = False

        class Hostile:
            def __getattribute__(self, name: str) -> object:
                nonlocal accessed
                accessed = True
                raise AssertionError(name)

        with patch.object(initializer, "SPECTRAL_SOURCE_SHA256", "0" * 64):
            with self.assertRaises(CoreInitializerError) as raised:
                materialize_fixed_l0_initializer(Hostile())  # type: ignore[arg-type]
            self.assertEqual(
                raised.exception.code,
                "initializer_spectral_source_binding_mismatch",
            )
        self.assertFalse(accessed)

    def test_frozen_result_and_every_authority_surface_remain_false(self) -> None:
        result = self.result
        self.assertIs(result.calculation_implemented, True)
        self.assertIs(result.fixed_l0_graph_implemented, True)
        self.assertIs(result.initializer_vector_computed, True)
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "alternate_initializer_used",
            "primary_numerics_semantic_authority",
            "initializer_contract_authority",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "source_manifest_bound",
            "toolchain_manifest_bound",
            "executable_bound",
            "runtime_manifest_bound",
            "scientific_preseal_present",
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
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.candidate_executed = True  # type: ignore[misc]

    def test_operation_graph_and_source_import_guards_are_literal(self) -> None:
        self.assertEqual(FIXED_NODE_COUNT, 64)
        self.assertEqual(MPFR_PRECISION_BITS, 256)
        self.assertEqual(MPFR_ROUNDING_MODE, "MPFR_RNDN")
        self.assertEqual((MPFR_EMIN, MPFR_EMAX), (-1_000_000, 1_000_000))
        self.assertIn("sqrt_firstRoot_then_sqrt_kg", KG_OPERATION_GRAPH)
        self.assertIn("set_d_kg64", NU_OPERATION_GRAPH)
        self.assertIn("distinct_exp_minus_kgx_then_exp_minus_2kgx", INTERIOR_OPERATION_GRAPH)
        self.assertIn("for_n_1_2_3_4", INTERIOR_OPERATION_GRAPH)
        self.assertIn("j_63_exact_positive_zero", ENDPOINT_OPERATION_GRAPH)
        self.assertIn("u_nodes_increasing_then_V_nodes_increasing", PACKING_OPERATION_GRAPH)

        source = (HERE / "core_initializer.py").read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported: set[str] = set()
        call_names: set[str] = set()
        forbidden_math_calls: set[str] = set()
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
                    if (
                        isinstance(node.func.value, ast.Name)
                        and node.func.value.id == "math"
                    ):
                        forbidden_math_calls.add(node.func.attr)
        self.assertFalse(imported & {"decimal", "mpmath", "numpy", "scipy"})
        self.assertFalse(forbidden_math_calls & {"exp", "sqrt", "pow", "fsum"})
        self.assertFalse(call_names & {"eval", "pow", "sum", "solve"})
        self.assertEqual(source.count("exec(code, module.__dict__)"), 1)
        self.assertNotIn("import spectral", source)
        self.assertFalse(
            any(
                isinstance(node, ast.BinOp) and isinstance(node.op, ast.Pow)
                for node in ast.walk(tree)
            )
        )
        self.assertNotIn("core_operator", imported)
        self.assertNotIn("binary64_environment", imported)
        self.assertNotIn("nhm2-spherical-boson-star-v2-initializer", source)


if __name__ == "__main__":
    unittest.main()
