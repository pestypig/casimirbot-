from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError, replace
import hashlib
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

import core_quadrature as quadrature
from core_quadrature import (
    AUTHORITY_LOCKS,
    CORE_CELL_COUNT,
    CORE_DOMAIN_LENGTH,
    CORE_PRIMAL_OPERATION_GRAPH,
    CORE_SUM_BARRIER_GRAPH,
    CoreQuadratureError,
    GL256_GENERATOR_SHA256,
    GL256_GENERATOR_SIZE_BYTES,
    GL256_INDEPENDENT_TEST_SHA256,
    GL256_INDEPENDENT_TEST_SIZE_BYTES,
    GL256_MANIFEST_SHA256,
    GL256_MANIFEST_SIZE_BYTES,
    GL256_RECORDS_SHA256,
    GL256_RECORDS_SIZE_BYTES,
    GL_POINT_COUNT,
    L2_NODE_COUNT,
    MAPPED_CELL_OPERATION_GRAPH,
    MAPPED_POINT_WEIGHT_OPERATION_GRAPH,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    SPECTRAL_N128_PAYLOAD_SHA256,
    SPECTRAL_SOURCE_SHA256,
    SPECTRAL_SOURCE_SIZE_BYTES,
    materialize_projected_l2_core_integral,
)

generate_lobatto_spectral_primitive = (
    quadrature._spectral_module.generate_lobatto_spectral_primitive
)


EXPECTED_MAPPED_CELL_ZERO_POINT_BITS = (
    "d8c344d9dd0ac73e",
    "764d44ead1ffbf3f",
)
EXPECTED_SYNTHETIC_CELL_ZERO_BITS = "4fa8f00d20dc413f"
EXPECTED_COMPLETE_SYNTHETIC_CORE_BITS = "c4724ed207fa3940"
RUN_COMPLETE_GOLDEN = os.environ.get("NHM2_RUN_FULL_CORE_QUADRATURE_GOLDEN") == "1"


def _bits(value: float) -> str:
    return struct.pack("<d", value).hex()


def _negative_zero(value: float) -> bool:
    return value == 0.0 and _bits(value) == "0000000000000080"


def _file_binding(relative_path: str) -> tuple[int, str]:
    raw = (REPOSITORY_ROOT / relative_path).read_bytes()
    return len(raw), hashlib.sha256(raw).hexdigest()


def _dyadic_ratio(value: quadrature._LiteralDyadic) -> tuple[int, int]:
    numerator = value.sign * value.significand
    if value.exponent2 >= 0:
        return numerator << value.exponent2, 1
    return numerator, 1 << (-value.exponent2)


class CoreQuadratureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.grid = generate_lobatto_spectral_primitive(L2_NODE_COUNT)
        cls.synthetic_u = tuple(
            0.0 if index == L2_NODE_COUNT - 1 else 1.0 - rho
            for index, rho in enumerate(cls.grid.rho)
        )
        cls.records = quadrature._load_bound_fixture_records()

    def test_final_fixture_spectral_and_policy_bindings_are_exact(self) -> None:
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
        bindings = (
            (
                "tools/nhm2-spherical-boson-star-seed/producer/spectral.py",
                SPECTRAL_SOURCE_SIZE_BYTES,
                SPECTRAL_SOURCE_SHA256,
            ),
            (
                quadrature.GL256_MANIFEST_RELATIVE_PATH,
                GL256_MANIFEST_SIZE_BYTES,
                GL256_MANIFEST_SHA256,
            ),
            (
                quadrature.GL256_RECORDS_RELATIVE_PATH,
                GL256_RECORDS_SIZE_BYTES,
                GL256_RECORDS_SHA256,
            ),
            (
                quadrature.GL256_GENERATOR_RELATIVE_PATH,
                GL256_GENERATOR_SIZE_BYTES,
                GL256_GENERATOR_SHA256,
            ),
            (
                quadrature.GL256_INDEPENDENT_TEST_RELATIVE_PATH,
                GL256_INDEPENDENT_TEST_SIZE_BYTES,
                GL256_INDEPENDENT_TEST_SHA256,
            ),
        )
        for relative_path, expected_size, expected_hash in bindings:
            with self.subTest(relative_path=relative_path):
                self.assertEqual(
                    _file_binding(relative_path),
                    (expected_size, expected_hash),
                )
        self.assertEqual(
            quadrature._spectral_payload_sha256(
                quadrature._snapshot_spectral_primitive(self.grid)
            ),
            SPECTRAL_N128_PAYLOAD_SHA256,
        )

    def test_exact_path_preloaded_spectral_module_is_ignored(self) -> None:
        module_path = HERE / "core_quadrature.py"
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
spec = importlib.util.spec_from_file_location("hostile_core_quadrature", path)
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
        environment["PYTHONDWRITEBYTECODE"] = "1"
        completed = subprocess.run(
            [sys.executable, "-B", "-W", "error", "-c", program],
            cwd=REPOSITORY_ROOT,
            env=environment,
            check=False,
            capture_output=True,
            text=True,
            encoding="utf-8",
            timeout=30,
        )
        self.assertEqual(completed.returncode, 0, completed.stderr)
        self.assertEqual(completed.stdout.strip(), "1")

    def test_continuation_retains_unrounded_identity_and_once_only_lifecycle(self) -> None:
        template = gmpy2.get_context().copy()
        template.precision = 256
        template.round = gmpy2.RoundToNearest
        with gmpy2.context(template):
            exact_core_sum = gmpy2.mpfr(
                "0.12345678901234567890123456789012345678901234567890123456789",
                256,
            )
        get_d_operations: list[str] = []
        original_get_d = quadrature._get_d

        def recording_get_d(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> float:
            get_d_operations.append(operation)
            return original_get_d(context, value, operation)

        completed_nodes = CORE_CELL_COUNT * GL_POINT_COUNT
        with (
            patch.object(
                quadrature,
                "_integrate_all_cells",
                return_value=(exact_core_sum, completed_nodes, completed_nodes, 0),
            ) as integrate,
            patch.object(quadrature, "_get_d", side_effect=recording_get_d),
        ):
            result = materialize_projected_l2_core_integral(
                self.grid,
                self.synthetic_u,
            )
            with self.assertRaises(CoreQuadratureError) as raised:
                materialize_projected_l2_core_integral(
                    self.grid,
                    self.synthetic_u,
                )
            self.assertEqual(
                raised.exception.code,
                "core_quadrature_continuation_pending",
            )
        self.assertEqual(integrate.call_count, 1)
        self.assertEqual(get_d_operations, ["core_sum.get_d"])

        lookalike = replace(result)
        with self.assertRaises(CoreQuadratureError) as raised:
            quadrature._consume_core_integral_continuation(lookalike)
        self.assertEqual(
            raised.exception.code,
            "core_quadrature_continuation_identity_mismatch",
        )
        token = quadrature._consume_core_integral_continuation(result)
        self.assertIs(token.result, result)
        self.assertIs(token.core_sum, exact_core_sum)
        self.assertIs(token.core64, result.core64)
        self.assertEqual(token.core_sum.precision, 256)
        self.assertEqual(
            tuple(name for name, _value in token.bindings),
            quadrature._CORE_CONTINUATION_BINDING_FIELD_NAMES,
        )
        for name, value in token.bindings:
            self.assertEqual(value, getattr(result, name))
        self.assertNotIn("_CoreIntegralContinuationToken", quadrature.__all__)
        self.assertNotIn(
            "continuation",
            " ".join(result.__dataclass_fields__).lower(),
        )
        with self.assertRaises(FrozenInstanceError):
            token.core64 = 0.0  # type: ignore[misc]
        with self.assertRaises(CoreQuadratureError) as raised:
            quadrature._consume_core_integral_continuation(result)
        self.assertEqual(
            raised.exception.code,
            "core_quadrature_continuation_unavailable",
        )

    def test_spectral_snapshot_survives_caller_object_changes(self) -> None:
        grid = replace(self.grid)
        expected_rho = self.grid.rho
        exact_core_sum = gmpy2.mpfr(0.25, 256)
        completed_nodes = CORE_CELL_COUNT * GL_POINT_COUNT
        original_validate = quadrature._validate_spectral_primitive

        def mutate_before_validation(
            snapshot: quadrature._FrozenSpectralSnapshot,
        ) -> quadrature._FrozenSpectralSnapshot:
            object.__setattr__(grid, "rho", tuple(reversed(grid.rho)))
            object.__setattr__(
                grid,
                "barycentric_weights",
                tuple(reversed(grid.barycentric_weights)),
            )
            object.__setattr__(grid, "candidate_authority", True)
            return original_validate(snapshot)

        def integrate_snapshot(
            _context: gmpy2.context,
            _fixture: quadrature._FrozenFixtureValues,
            source_nodes: tuple[float, ...],
            _source_u: tuple[float, ...],
        ) -> tuple[gmpy2.mpfr, int, int, int]:
            self.assertEqual(source_nodes, expected_rho)
            return exact_core_sum, completed_nodes, completed_nodes, 0

        with (
            patch.object(
                quadrature,
                "_validate_spectral_primitive",
                side_effect=mutate_before_validation,
            ),
            patch.object(
                quadrature,
                "_integrate_all_cells",
                side_effect=integrate_snapshot,
            ),
        ):
            result = materialize_projected_l2_core_integral(
                grid,
                self.synthetic_u,
            )
        self.assertEqual(
            result.projected_rho_f64le_sha256,
            quadrature._f64_payload_sha256(
                quadrature.PROJECTED_RHO_HASH_DOMAIN,
                expected_rho,
            ),
        )
        quadrature._consume_core_integral_continuation(result)

    def test_all_256_canonical_records_parse_as_exact_ordered_dyadics(self) -> None:
        records = self.records
        self.assertEqual(len(records), 256)
        self.assertEqual(tuple(record.index for record in records), tuple(range(256)))
        manifest_raw = (
            REPOSITORY_ROOT / quadrature.GL256_MANIFEST_RELATIVE_PATH
        ).read_bytes()
        records_raw = (
            REPOSITORY_ROOT / quadrature.GL256_RECORDS_RELATIVE_PATH
        ).read_bytes()
        quadrature._validate_manifest(manifest_raw)
        self.assertEqual(quadrature._parse_fixture_records(records_raw), records)

        with quadrature._owned_mpfr256_context() as context:
            fixture = quadrature._materialize_fixture_values(context, records)
            for index in (0, 1, 127, 128, 254, 255):
                with self.subTest(index=index):
                    observed_node = fixture.nodes[index].as_integer_ratio()
                    observed_weight = fixture.weights[index].as_integer_ratio()
                    expected_node = _dyadic_ratio(records[index].node)
                    expected_weight = _dyadic_ratio(records[index].weight)
                    self.assertEqual(
                        observed_node[0] * expected_node[1],
                        expected_node[0] * observed_node[1],
                    )
                    self.assertEqual(
                        observed_weight[0] * expected_weight[1],
                        expected_weight[0] * observed_weight[1],
                    )
            self.assertTrue(
                all(
                    fixture.nodes[index] < fixture.nodes[index + 1]
                    for index in range(255)
                )
            )
            self.assertTrue(all(weight > 0 for weight in fixture.weights))

    def test_mapped_cell_and_lowest_exact_node_shortcut_are_literal(self) -> None:
        with quadrature._owned_mpfr256_context() as context:
            fixture = quadrature._materialize_fixture_values(context, self.records)
            mid, half = quadrature._mapped_cell(context, 0)
            points = quadrature._mapped_points(context, mid, half, fixture.nodes)
            observed_point_bits = (
                _bits(quadrature._get_d(context, points[0], "test.point.first")),
                _bits(quadrature._get_d(context, points[-1], "test.point.last")),
            )
            rho = quadrature._set_d(context, self.grid.rho[37], "test.rho")
            interpolated, exact_index = quadrature._interpolate_projected_u(
                context,
                rho,
                self.grid.rho,
                self.synthetic_u,
            )
            interpolated64 = quadrature._get_d(
                context, interpolated, "test.exact_u"
            )
        self.assertEqual(observed_point_bits, EXPECTED_MAPPED_CELL_ZERO_POINT_BITS)
        self.assertEqual(exact_index, 37)
        self.assertEqual(_bits(interpolated64), _bits(self.synthetic_u[37]))

    def test_one_complete_cell_matches_golden_and_independent_integral(self) -> None:
        get_d_operations: list[str] = []
        original_get_d = quadrature._get_d

        def recording_get_d(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> float:
            get_d_operations.append(operation)
            return original_get_d(context, value, operation)

        with (
            patch.object(quadrature, "_get_d", side_effect=recording_get_d),
            quadrature._owned_mpfr256_context() as context,
        ):
            fixture = quadrature._materialize_fixture_values(context, self.records)
            core_sum = quadrature._positive_zero(context, "test.cell.zero")
            core_sum, point_count, shortcut_count = quadrature._integrate_one_cell(
                context,
                core_sum,
                fixture,
                self.grid.rho,
                self.synthetic_u,
                0,
            )
            cell64 = quadrature._get_d(context, core_sum, "test.cell.get_d")
        self.assertEqual(get_d_operations, ["test.cell.get_d"])
        self.assertEqual(point_count, 256)
        self.assertEqual(shortcut_count, 0)
        self.assertEqual(_bits(cell64), EXPECTED_SYNTHETIC_CELL_ZERO_BITS)

        reference_context = gmpy2.get_context().copy()
        reference_context.precision = 512
        reference_context.round = gmpy2.RoundToNearest
        with gmpy2.context(reference_context):
            right = gmpy2.mpfr(1) / 8
            one = gmpy2.mpfr(1)
            analytic = right - 2 * gmpy2.log(one + right) - one / (one + right) + one
            analytic64 = float(analytic)
        self.assertLess(abs(cell64 - analytic64), 1e-15)

    @unittest.skipUnless(
        RUN_COMPLETE_GOLDEN,
        "set NHM2_RUN_FULL_CORE_QUADRATURE_GOLDEN=1 for the 6-8 minute graph",
    )
    def test_complete_256_by_256_synthetic_graph_matches_frozen_golden(self) -> None:
        get_d_operations: list[str] = []
        original_get_d = quadrature._get_d

        def recording_get_d(
            context: gmpy2.context,
            value: gmpy2.mpfr,
            operation: str,
        ) -> float:
            get_d_operations.append(operation)
            return original_get_d(context, value, operation)

        with patch.object(quadrature, "_get_d", side_effect=recording_get_d):
            result = materialize_projected_l2_core_integral(
                self.grid, self.synthetic_u
            )
        self.assertEqual(get_d_operations, ["core_sum.get_d"])
        self.assertEqual(result.core64_bits, EXPECTED_COMPLETE_SYNTHETIC_CORE_BITS)
        self.assertEqual(result.cells_completed, 256)
        self.assertEqual(result.mapped_points_completed, 65_536)
        self.assertEqual(result.node_integrands_completed, 65_536)
        self.assertEqual(result.exact_node_shortcuts, 0)
        quadrature._consume_core_integral_continuation(result)

    def test_hostile_ambient_context_is_owned_and_restored_on_failure(self) -> None:
        ambient = gmpy2.get_context()
        original = ambient.copy()
        fields = (
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
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = -20
            ambient.emax = 20
            ambient.subnormalize = True
            ambient.trap_underflow = True
            ambient.trap_overflow = True
            ambient.trap_inexact = True
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
            caller = {name: getattr(ambient, name) for name in fields}
            with patch.object(
                quadrature,
                "_integrate_all_cells",
                side_effect=CoreQuadratureError("test_forced_failure"),
            ):
                with self.assertRaisesRegex(
                    CoreQuadratureError, "test_forced_failure"
                ):
                    materialize_projected_l2_core_integral(
                        self.grid, self.synthetic_u
                    )
            self.assertEqual(
                {name: getattr(ambient, name) for name in fields},
                caller,
            )
        finally:
            gmpy2.set_context(original)

    def test_shape_finiteness_zero_authority_and_binding_failures_are_typed(self) -> None:
        cases = (
            (
                generate_lobatto_spectral_primitive(96),
                self.synthetic_u,
                "core_quadrature_spectral_node_count_invalid",
            ),
            (
                self.grid,
                list(self.synthetic_u),
                "core_quadrature_projected_u_type_invalid",
            ),
            (
                self.grid,
                self.synthetic_u[:-1],
                "core_quadrature_projected_u_length_invalid",
            ),
            (
                self.grid,
                (*self.synthetic_u[:12], float("nan"), *self.synthetic_u[13:]),
                "core_quadrature_binary64_nonfinite_input",
            ),
            (
                self.grid,
                (*self.synthetic_u[:-1], -0.0),
                "core_quadrature_binary64_negative_zero_input",
            ),
            (
                self.grid,
                (*self.synthetic_u[:-1], 1.0),
                "core_quadrature_projected_u_infinity_invalid",
            ),
            (
                replace(self.grid, candidate_executed=True),
                self.synthetic_u,
                "core_quadrature_spectral_authority_lock_invalid",
            ),
        )
        for grid, projected_u, expected_code in cases:
            with self.subTest(expected_code=expected_code):
                with self.assertRaises(CoreQuadratureError) as raised:
                    materialize_projected_l2_core_integral(
                        grid, projected_u  # type: ignore[arg-type]
                    )
                self.assertEqual(raised.exception.code, expected_code)

        accessed = False

        class Hostile:
            def __getattribute__(self, name: str) -> object:
                nonlocal accessed
                accessed = True
                raise AssertionError(name)

        with patch.object(quadrature, "GL256_RECORDS_SHA256", "0" * 64):
            with self.assertRaises(CoreQuadratureError) as raised:
                materialize_projected_l2_core_integral(
                    Hostile(), Hostile()  # type: ignore[arg-type]
                )
            self.assertEqual(
                raised.exception.code,
                "core_quadrature_bound_file_mismatch",
            )
        self.assertFalse(accessed)

    def test_result_contract_is_frozen_and_every_authority_lock_is_false(self) -> None:
        result_fields = quadrature.FrozenProjectedL2CoreIntegral.__dataclass_fields__
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field_name in (
            "projected_source_acceptance_verified",
            "fixture_runtime_authority",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "solve_performed",
            "candidate_execution_authorized",
            "candidate_executed",
            "output_present",
            "output_accepted",
            "seed_accepted",
            "branch_accepted",
            "replay_authority",
            "independent_agreement",
            "diagnostic_pass_authority",
            "candidate_authority",
            "theory_graph_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
        ):
            self.assertIs(result_fields[field_name].default, False)

        placeholder = quadrature.FrozenProjectedL2CoreIntegral(
            node_count=128,
            core_cell_count=256,
            fixture_point_count=256,
            domain=(0, 32),
            core64=0.0,
            core64_bits="0000000000000000",
            cells_completed=256,
            mapped_points_completed=65_536,
            node_integrands_completed=65_536,
            exact_node_shortcuts=0,
            projected_rho_f64le_sha256="0" * 64,
            projected_u_f64le_sha256="0" * 64,
            primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
            primary_numerics_policy_canonical_size_bytes=80_055,
            spectral_source_sha256=SPECTRAL_SOURCE_SHA256,
            spectral_source_size_bytes=SPECTRAL_SOURCE_SIZE_BYTES,
            spectral_payload_sha256=SPECTRAL_N128_PAYLOAD_SHA256,
            fixture_manifest_sha256=GL256_MANIFEST_SHA256,
            fixture_manifest_size_bytes=GL256_MANIFEST_SIZE_BYTES,
            fixture_records_sha256=GL256_RECORDS_SHA256,
            fixture_records_size_bytes=GL256_RECORDS_SIZE_BYTES,
            fixture_generator_sha256=GL256_GENERATOR_SHA256,
            fixture_generator_size_bytes=GL256_GENERATOR_SIZE_BYTES,
            fixture_independent_test_sha256=GL256_INDEPENDENT_TEST_SHA256,
            fixture_independent_test_size_bytes=GL256_INDEPENDENT_TEST_SIZE_BYTES,
            mpfr_precision_bits=256,
            mpfr_rounding_mode="MPFR_RNDN",
            mpfr_emin=-1_000_000,
            mpfr_emax=1_000_000,
            observed_gmpy2_version=gmpy2.version(),
            observed_mpfr_version=gmpy2.mpfr_version(),
        )
        with self.assertRaises(FrozenInstanceError):
            placeholder.candidate_executed = True  # type: ignore[misc]

    def test_literal_graph_and_source_have_no_alternate_numeric_surface(self) -> None:
        self.assertEqual((L2_NODE_COUNT, CORE_CELL_COUNT, GL_POINT_COUNT), (128, 256, 256))
        self.assertEqual(CORE_DOMAIN_LENGTH, 32)
        self.assertEqual(MPFR_PRECISION_BITS, 256)
        self.assertEqual(MPFR_ROUNDING_MODE, "MPFR_RNDN")
        self.assertEqual((MPFR_EMIN, MPFR_EMAX), (-1_000_000, 1_000_000))
        self.assertIn("cell_index_increasing", MAPPED_CELL_OPERATION_GRAPH)
        self.assertIn("point_pass", MAPPED_POINT_WEIGHT_OPERATION_GRAPH)
        self.assertIn("lowest_exact_L2_rho_match", CORE_PRIMAL_OPERATION_GRAPH)
        self.assertIn("one_final_get_d_RNDN", CORE_SUM_BARRIER_GRAPH)

        source = (HERE / "core_quadrature.py").read_text(encoding="utf-8")
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
        self.assertNotIn("core_operator", imported)
        self.assertNotIn("dense_lu", imported)
        self.assertNotIn("core_initializer", imported)
        self.assertEqual(source.count("result = float(value)"), 1)
        self.assertEqual(source.count("_get_d(context"), 2)


if __name__ == "__main__":
    unittest.main()
