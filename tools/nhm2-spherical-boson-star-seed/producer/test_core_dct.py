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

import core_dct as dct  # noqa: E402
from core_dct import (  # noqa: E402
    AUTHORITY_LOCKS,
    CORE_LEVELS,
    DCT_I_EXACT_FORMULA,
    DCT_I_OPERATION_GRAPH,
    DCT_I_OUTPUT_ORDER,
    DCT_I_POLYNOMIAL_CONVENTION,
    MPFR_EMAX,
    MPFR_EMIN,
    MPFR_PRECISION_BITS,
    MPFR_ROUNDING_MODE,
    PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES,
    PRIMARY_NUMERICS_POLICY_SHA256,
    CoreDctError,
    FrozenProjectedCoreState,
    materialize_projected_core_dct,
)


GOLDEN_DOMAIN = b"nhm2-spherical-boson-star-seed-primary-core-dct/golden/v1\n"
SYNTHETIC_GOLDEN_SHA256 = (
    "e439dea68a4486e308b5bc2b784ce16b9ed7c74c355ef4b7d901ca1da93436ae"
)
EXPECTED_OPERATION_COUNTS = (
    6,
    6,
    120_524,
    59_392,
    178_752,
    119_936,
    59_392,
    59_392,
    59_392,
    576,
)
N3_POLICY_INPUT_BITS = (
    "3ff0000000000000",
    "4000000000000000",
    "4010000000000000",
)
N3_POLICY_EXPECTED_BITS = (
    "4002000000000000",
    "3ff8000000000000",
    "3fd0000000000000",
)
CONTEXT_ATTRIBUTES = (
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
    return struct.pack(">d", value).hex()


def _context_snapshot(context: gmpy2.context) -> tuple[object, ...]:
    return tuple(getattr(context, name) for name in CONTEXT_ATTRIBUTES)


def _synthetic_record(level_id: str, node_count: int, salt: int) -> FrozenProjectedCoreState:
    u_values = tuple(
        0.0
        if index == node_count - 1
        else math.ldexp(float((index + salt) % 17 + 1), -8)
        for index in range(node_count)
    )
    V_values = tuple(
        0.0
        if index == node_count - 1
        else -math.ldexp(float((2 * index + salt) % 13 + 1), -9)
        for index in range(node_count)
    )
    return FrozenProjectedCoreState(
        level_id=level_id,
        node_count=node_count,
        state=(*u_values, *V_values, -0.25),
        primary_numerics_policy_sha256=PRIMARY_NUMERICS_POLICY_SHA256,
        primary_numerics_policy_canonical_size_bytes=(
            PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES
        ),
        projection_gate_passed=True,
        immutable_projected_archive=True,
    )


def _synthetic_records() -> tuple[FrozenProjectedCoreState, ...]:
    return tuple(
        _synthetic_record(level_id, node_count, index + 1)
        for index, (level_id, node_count) in enumerate(CORE_LEVELS)
    )


def _result_hash(result: dct.FrozenCoreDctResult) -> str:
    digest = hashlib.sha256()
    digest.update(GOLDEN_DOMAIN)
    for level in result.levels:
        encoded = level.level_id.encode("ascii")
        digest.update(len(encoded).to_bytes(8, "little"))
        digest.update(encoded)
        digest.update(level.node_count.to_bytes(8, "little"))
        for label, coefficients in (
            (b"u", level.u_coefficients),
            (b"V", level.V_coefficients),
        ):
            digest.update(len(label).to_bytes(8, "little"))
            digest.update(label)
            digest.update(len(coefficients).to_bytes(8, "little"))
            digest.update(struct.pack(f"<{len(coefficients)}d", *coefficients))
    return digest.hexdigest()


class PrimaryCoreDctTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.records = _synthetic_records()
        cls.result = materialize_projected_core_dct(cls.records)

    def test_primary_policy_binding_matches_live_canonical_seal(self) -> None:
        executable = "npx.cmd" if os.name == "nt" else "npx"
        program = (
            "import {"
            "NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_SHA256 as h,"
            "NHM2_SPHERICAL_BOSON_STAR_NEWTONIAN_SEED_PRIMARY_NUMERICS_V1_CANONICAL_SIZE_BYTES as s"
            "} from './shared/contracts/nhm2-spherical-boson-star-newtonian-seed-primary-numerics.v1.ts';"
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
        self.assertEqual(
            (PRIMARY_NUMERICS_POLICY_SHA256, PRIMARY_NUMERICS_POLICY_CANONICAL_SIZE_BYTES),
            (
                "a4ee03e387f9e3e0a9d1f117f6671aa6ac0ca3f97508706c0f52e811d15372a4",
                80_055,
            ),
        )

    def test_n3_policy_fixture_and_no_endpoint_half_reinterpretation(self) -> None:
        fixture = tuple(
            struct.unpack(">d", bytes.fromhex(bits))[0]
            for bits in N3_POLICY_INPUT_BITS
        )
        counts = dct._MutableOperationCounts()
        with dct._owned_mpfr256_context() as context:
            coefficients = dct._dct_i(context, fixture, "fixture.N3", counts)
        self.assertEqual(tuple(_bits(value) for value in coefficients), N3_POLICY_EXPECTED_BITS)
        self.assertEqual(
            dct._freeze_counts(counts),
            dct.FrozenCoreDctOperationCounts(
                transform_count=1,
                const_pi_count=1,
                set_ui_count=29,
                set_d_count=9,
                multiply_count=30,
                divide_count=24,
                cosine_count=9,
                add_count=9,
                copy_count=9,
                terminal_get_d_count=3,
            ),
        )
        for sample_index, xi in enumerate((-1.0, 0.0, 1.0)):
            reconstructed = (
                coefficients[0]
                + coefficients[1] * xi
                + coefficients[2] * (2.0 * xi * xi - 1.0)
            )
            self.assertEqual(reconstructed, fixture[sample_index])
        self.assertIn("no_implicit_endpoint_halves", DCT_I_POLYNOMIAL_CONVENTION)

    def test_analytic_constant_linear_and_positive_zero_outputs(self) -> None:
        with dct._owned_mpfr256_context() as context:
            constant = dct._dct_i(
                context,
                (3.0, 3.0, 3.0),
                "analytic.constant",
                dct._MutableOperationCounts(),
            )
            linear = dct._dct_i(
                context,
                (-1.0, 0.0, 1.0),
                "analytic.linear",
                dct._MutableOperationCounts(),
            )
            zeros = dct._dct_i(
                context,
                (0.0, 0.0, 0.0),
                "analytic.zero",
                dct._MutableOperationCounts(),
            )
        self.assertAlmostEqual(constant[0], 3.0, delta=1e-70)
        self.assertLess(max(abs(value) for value in constant[1:]), 1e-70)
        self.assertAlmostEqual(linear[1], 1.0, delta=1e-70)
        self.assertLess(max(abs(linear[0]), abs(linear[2])), 1e-70)
        self.assertEqual(tuple(struct.pack("<d", value) for value in zeros), (bytes(8),) * 3)

    def test_complete_levels_output_order_operation_counts_and_golden(self) -> None:
        result = self.result
        self.assertEqual(CORE_LEVELS, (("L0", 64), ("L1", 96), ("L2", 128)))
        self.assertEqual(
            tuple((level.level_id, level.node_count) for level in result.levels),
            CORE_LEVELS,
        )
        for level in result.levels:
            self.assertEqual(len(level.u_coefficients), level.node_count)
            self.assertEqual(len(level.V_coefficients), level.node_count)
            values = (*level.u_coefficients, *level.V_coefficients)
            self.assertTrue(all(math.isfinite(value) for value in values))
            self.assertFalse(any(dct._negative_zero(value) for value in values))
        observed_counts = result.operation_counts
        self.assertEqual(
            (
                observed_counts.transform_count,
                observed_counts.const_pi_count,
                observed_counts.set_ui_count,
                observed_counts.set_d_count,
                observed_counts.multiply_count,
                observed_counts.divide_count,
                observed_counts.cosine_count,
                observed_counts.add_count,
                observed_counts.copy_count,
                observed_counts.terminal_get_d_count,
            ),
            EXPECTED_OPERATION_COUNTS,
        )
        self.assertEqual(_result_hash(result), SYNTHETIC_GOLDEN_SHA256)
        self.assertIn("q_N_minus_1_minus_m", DCT_I_OPERATION_GRAPH)
        self.assertIn("exactly_one_terminal_get_d", DCT_I_OPERATION_GRAPH)
        self.assertIn("c_0=c_N_minus_1=2", DCT_I_EXACT_FORMULA)
        self.assertEqual(
            DCT_I_OUTPUT_ORDER,
            "level_L0_L1_L2_then_field_u_V_then_coefficient_n_increasing",
        )

    def test_strict_shape_f64_endpoint_gate_policy_and_authority_validation(self) -> None:
        cases: tuple[tuple[object, str], ...] = (
            (list(self.records), "core_dct_projected_states_type_invalid"),
            (
                (self.records[1], self.records[0], self.records[2]),
                "core_dct_level_order_invalid",
            ),
            (
                (replace(self.records[0], state=[]), *self.records[1:]),
                "core_dct_state_type_invalid",
            ),
            (
                (replace(self.records[0], state=(0.0,)), *self.records[1:]),
                "core_dct_state_length_invalid",
            ),
            (
                (
                    replace(
                        self.records[0],
                        state=(float("inf"), *self.records[0].state[1:]),
                    ),
                    *self.records[1:],
                ),
                "core_dct_nonfinite_input",
            ),
            (
                (
                    replace(
                        self.records[0],
                        state=(-0.0, *self.records[0].state[1:]),
                    ),
                    *self.records[1:],
                ),
                "core_dct_negative_zero_input",
            ),
            (
                (
                    replace(
                        self.records[0],
                        state=(
                            *self.records[0].state[:63],
                            1.0,
                            *self.records[0].state[64:],
                        ),
                    ),
                    *self.records[1:],
                ),
                "core_dct_projected_endpoint_not_positive_zero",
            ),
            (
                (replace(self.records[0], projection_gate_passed=False), *self.records[1:]),
                "core_dct_projection_gate_missing",
            ),
            (
                (
                    replace(self.records[0], immutable_projected_archive=False),
                    *self.records[1:],
                ),
                "core_dct_projected_archive_not_immutable",
            ),
            (
                (replace(self.records[0], candidate_authority=True), *self.records[1:]),
                "core_dct_input_authority_invalid",
            ),
            (
                (
                    replace(
                        self.records[0],
                        primary_numerics_policy_sha256="0" * 64,
                    ),
                    *self.records[1:],
                ),
                "primary_numerics_policy_binding_mismatch",
            ),
        )
        for value, expected in cases:
            with self.subTest(expected=expected):
                with self.assertRaises(CoreDctError) as raised:
                    materialize_projected_core_dct(value)  # type: ignore[arg-type]
                self.assertEqual(raised.exception.code, expected)

        with self.assertRaises(CoreDctError) as raised:
            materialize_projected_core_dct(
                (),
                primary_numerics_policy_sha256="0" * 64,
            )
        self.assertEqual(
            raised.exception.code,
            "primary_numerics_policy_binding_mismatch",
        )

        maximum = sys.float_info.max
        extreme_records = tuple(
            replace(
                record,
                state=(
                    *tuple(
                        0.0
                        if index == record.node_count - 1
                        else (
                            maximum
                            if -math.cos(
                                math.pi * index / (record.node_count - 1)
                            )
                            >= 0.0
                            else -maximum
                        )
                        for index in range(record.node_count)
                    ),
                    *((0.0,) * record.node_count),
                    -0.25,
                ),
            )
            for record in self.records
        )
        with self.assertRaises(CoreDctError) as raised:
            materialize_projected_core_dct(extreme_records)
        self.assertEqual(raised.exception.code, "binary64_nonfinite")

    def test_hostile_context_flags_are_ignored_restored_and_fail_typed(self) -> None:
        baseline_hash = _result_hash(self.result)
        ambient = gmpy2.get_context()
        original = ambient.copy()
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = -20
            ambient.emax = 20
            ambient.subnormalize = True
            ambient.trap_overflow = True
            ambient.trap_inexact = True
            ambient.trap_underflow = True
            ambient.trap_invalid = True
            ambient.trap_erange = True
            ambient.trap_divzero = True
            ambient.inexact = True
            ambient.underflow = True
            ambient.overflow = True
            ambient.invalid = True
            ambient.erange = True
            ambient.divzero = True
            ambient.allow_complex = True
            ambient.rational_division = True
            ambient.allow_release_gil = True
            caller = _context_snapshot(ambient)
            observed = materialize_projected_core_dct(self.records)
            self.assertEqual(_result_hash(observed), baseline_hash)
            self.assertEqual(_context_snapshot(ambient), caller)

            with patch.object(
                dct,
                "_cos",
                side_effect=CoreDctError("synthetic_mpfr_failure", "cos"),
            ):
                with self.assertRaises(CoreDctError) as raised:
                    materialize_projected_core_dct(self.records)
                self.assertEqual(raised.exception.code, "synthetic_mpfr_failure")
            self.assertEqual(_context_snapshot(ambient), caller)

            with dct._owned_mpfr256_context() as context:
                self.assertEqual(
                    (
                        context.precision,
                        context.round,
                        context.emin,
                        context.emax,
                        context.subnormalize,
                    ),
                    (256, gmpy2.RoundToNearest, -1_000_000, 1_000_000, False),
                )
                self.assertFalse(
                    any(
                        bool(getattr(context, name))
                        for name in CONTEXT_ATTRIBUTES[5:]
                    )
                )
                context.invalid = True
                with self.assertRaises(CoreDctError) as raised:
                    dct._check_flags(context, "hostile.invalid")
                self.assertEqual(raised.exception.code, "mpfr_exceptional_flag")
        finally:
            gmpy2.set_context(original)

    def test_result_is_frozen_and_all_authority_surfaces_remain_false(self) -> None:
        result = self.result
        self.assertTrue(all(value is False for value in AUTHORITY_LOCKS.values()))
        for field in (
            "raw_accepted_state_used",
            "alternate_transform_used",
            "binary64_intermediate_used",
            "primary_numerics_semantic_authority",
            "fixture_runtime_authority",
            "projection_acceptance_authority",
            "materialization_authority",
            "implementation_closure_complete",
            "runtime_closure_complete",
            "source_manifest_bound",
            "toolchain_manifest_bound",
            "executable_bound",
            "runtime_manifest_bound",
            "scientific_preseal_present",
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
        self.assertEqual(
            (result.mpfr_precision_bits, result.mpfr_rounding_mode),
            (MPFR_PRECISION_BITS, MPFR_ROUNDING_MODE),
        )
        self.assertEqual((result.mpfr_emin, result.mpfr_emax), (MPFR_EMIN, MPFR_EMAX))
        with self.assertRaises(FrozenInstanceError):
            result.output_present = True  # type: ignore[misc]
        with self.assertRaises(FrozenInstanceError):
            result.levels[0].u_coefficients = ()  # type: ignore[misc]

    def test_source_is_disjoint_and_contains_no_unfrozen_transform_surface(self) -> None:
        source = (HERE / "core_dct.py").read_text(encoding="utf-8")
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
                "math",
                "struct",
                "types",
                "typing",
            },
        )
        self.assertFalse(imported_roots & {"numpy", "scipy", "decimal"})
        self.assertFalse(call_names & {"fma", "fsum", "fft", "dct", "dot", "matmul"})
        self.assertNotIn("core_newton", source)
        self.assertNotIn("spectral", source)
        self.assertNotIn("candidate_source", source)


if __name__ == "__main__":
    unittest.main()
