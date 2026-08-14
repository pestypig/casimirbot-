"""Focused tests for the independent diagnostic postprojection slice."""

from __future__ import annotations

import ast
from dataclasses import FrozenInstanceError
import hashlib
from pathlib import Path
import struct
import sys
import unittest
from unittest import mock


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import postprojection_slice as slice_module  # noqa: E402
from postprojection_slice import (  # noqa: E402
    AUTHORITY_LOCKS,
    FrozenWorkPlan,
    PrimitiveCounts,
    ProducerPostprojectionSliceError,
    TOOLCHAIN_COMPATIBILITY,
    frozen_work_plan,
    postproject_level_bytes,
)


LEVEL_EXPECTATIONS = {
    "L0": {
        "shape": (64, 32, 16),
        "bytes": (16_384, 8_192, 16_384),
        "masks": (32, 16, 126, 32),
        "resources": (128, 32, 272, 32, 2_048, 2_048, 32, 2_048, 4_096, 3_938, 158),
        "counts": PrimitiveCounts(
            integer_set=749_571,
            symbolic_zero_set=3,
            binary64_set=73_154,
            rational_set=6_144,
            value_copy=272,
            const_pi=1,
            add=268_320,
            sub=150_122,
            mul=914_592,
            div=249_479,
            sqrt=32,
            cos=127_036,
            get_d=6_020,
            flag_clear=4_656,
        ),
    },
    "L1": {
        "shape": (96, 48, 24),
        "bytes": (36_864, 18_432, 36_864),
        "masks": (48, 24, 190, 48),
        "resources": (192, 48, 600, 48, 4_608, 4_608, 48, 4_608, 9_216, 8_978, 238),
        "counts": PrimitiveCounts(
            integer_set=2_570_699,
            symbolic_zero_set=3,
            binary64_set=238_370,
            rational_set=13_824,
            value_copy=600,
            const_pi=1,
            add=907_824,
            sub=523_426,
            mul=3_137_016,
            div=855_951,
            sqrt=48,
            cos=433_244,
            get_d=13_636,
            flag_clear=10_248,
        ),
    },
    "L2": {
        "shape": (128, 64, 32),
        "bytes": (65_536, 32_768, 65_536),
        "masks": (64, 32, 254, 64),
        "resources": (256, 64, 1_056, 64, 8_192, 8_192, 64, 8_192, 16_384, 16_066, 318),
        "counts": PrimitiveCounts(
            integer_set=6_142_483,
            symbolic_zero_set=3,
            binary64_set=554_882,
            rational_set=24_576,
            value_copy=1_056,
            const_pi=1,
            add=2_154_560,
            sub=1_260_762,
            mul=7_496_016,
            div=2_045_719,
            sqrt=64,
            cos=1_032_316,
            get_d=24_324,
            flag_clear=18_016,
        ),
    },
}

L0_INPUT_SHA256 = (
    "a87e0ca19a68a0e9a84052f9e6358cb8e62162fd431372fa85f3d25ebb735a66",
    "840580ed8846bd0aad26b60bbc35613262e87f2ab99672296ba06c1a7b96df60",
)
L0_OUTPUT_SHA256 = (
    "a581f6d1d3c666268ee73b5e8452c74ee61eb7593b5b7f23f37530d8a983ea71",
    "3e51d865bf2a1140087db011953f67f99e0c7ede8873464d33655f0886367bb0",
    "2b5f48a0b46b8b7725c21876937cff9d571964e269b1c3354ef07f0f41afc62d",
    "d2a5234c7e6576dd4216aaf91529138a8a574fdc0f770156826a687e9e691327",
)


def _l0_fixture() -> tuple[bytes, bytes]:
    radial_count, angular_count = 64, 32
    scalar = b"".join(
        struct.pack(
            "<d",
            -(radial_index * (radial_count - 1 - radial_index)
              * (angular_count - angular_index))
            / (2**20),
        )
        for radial_index in range(radial_count)
        for angular_index in range(angular_count)
    )
    potential = b"".join(
        struct.pack(
            "<d",
            -((radial_count - 1 - radial_index) * (angular_index + 1))
            / (2**20),
        )
        for radial_index in range(radial_count)
        for angular_index in range(angular_count)
    )
    return scalar, potential


def _sha256(payload: bytes) -> str:
    return hashlib.sha256(payload).hexdigest()


def _bits_at(payload: bytes, row: int, column: int, width: int) -> str:
    offset = 8 * (row * width + column)
    return f"{int.from_bytes(payload[offset:offset + 8], 'little'):016x}"


class FrozenWorkPlanTests(unittest.TestCase):
    def test_all_three_frozen_shapes_resources_masks_and_counts(self) -> None:
        for level_id, expected in LEVEL_EXPECTATIONS.items():
            with self.subTest(level_id=level_id):
                plan = frozen_work_plan(level_id)
                self.assertIs(type(plan), FrozenWorkPlan)
                self.assertEqual(
                    (
                        plan.radial_node_count,
                        plan.angular_node_count,
                        plan.mode_count,
                    ),
                    expected["shape"],
                )
                self.assertEqual(
                    (
                        plan.raw_array_byte_length,
                        plan.multipole_array_byte_length,
                        plan.base_array_byte_length,
                    ),
                    expected["bytes"],
                )
                self.assertEqual(
                    (
                        plan.scalar_multipole_mask_count,
                        plan.potential_multipole_mask_count,
                        plan.scalar_base_mask_count,
                        plan.potential_base_mask_count,
                    ),
                    expected["masks"],
                )
                self.assertEqual(
                    (
                        plan.projected_raw_row_count,
                        plan.cholesky_pivot_count,
                        plan.gram_record_count,
                        plan.phase_dct_record_count,
                        plan.projection_coefficient_barrier_count,
                        plan.phase_dct_radial_mode_count,
                        plan.analytic_z_record_count,
                        plan.reconstruction_slot_count // 2,
                        plan.reconstruction_slot_count,
                        plan.reconstruction_evaluator_call_count,
                        plan.symbolic_reconstruction_mask_count,
                    ),
                    expected["resources"],
                )
                self.assertEqual(plan.expected_counts, expected["counts"])
                self.assertEqual(
                    plan.parity_basis_record_count,
                    2 * plan.angular_node_count,
                )
                self.assertEqual(
                    (
                        plan.expected_counts.primitive_total,
                        plan.expected_counts.arithmetic_total,
                    ),
                    {
                        "L0": (2_549_130, 1_709_582),
                        "L1": (8_704_290, 5_857_510),
                        "L2": (20_753_722, 13_989_438),
                    }[level_id],
                )
                self.assertEqual(
                    plan.expected_counts.graph_site_total,
                    {
                        "L0": 2_549_402,
                        "L1": 8_704_890,
                        "L2": 20_754_778,
                    }[level_id],
                )
                self.assertEqual(
                    plan.total_input_byte_length,
                    2 * plan.raw_array_byte_length,
                )
                self.assertEqual(
                    plan.total_output_byte_length,
                    2
                    * (
                        plan.multipole_array_byte_length
                        + plan.base_array_byte_length
                    ),
                )

    def test_work_plan_is_immutable_and_invalid_level_fails_typed(self) -> None:
        with self.assertRaises(FrozenInstanceError):
            frozen_work_plan("L0").mode_count = 1  # type: ignore[misc]
        for invalid in ("", "AUDIT", "l0", 0, True, None):
            with self.subTest(invalid=invalid):
                with self.assertRaises(ProducerPostprojectionSliceError) as caught:
                    frozen_work_plan(invalid)  # type: ignore[arg-type]
                self.assertEqual(caught.exception.code, "frozen_level_id_required")


class CompleteL0FixtureTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.raw_scalar, cls.raw_potential = _l0_fixture()
        cls.result = postproject_level_bytes(
            "L0",
            cls.raw_scalar,
            cls.raw_potential,
        )

    def test_exact_fixture_inputs_and_complete_four_output_hashes(self) -> None:
        self.assertEqual(
            (_sha256(self.raw_scalar), _sha256(self.raw_potential)),
            L0_INPUT_SHA256,
        )
        payloads = (
            self.result.scalar_multipole_f64le,
            self.result.potential_multipole_f64le,
            self.result.base_scalar_f64le,
            self.result.base_potential_f64le,
        )
        self.assertEqual(tuple(map(_sha256, payloads)), L0_OUTPUT_SHA256)
        self.assertEqual(tuple(map(len, payloads)), (8_192, 8_192, 16_384, 16_384))
        self.assertEqual(self.result.observed_counts, self.result.work_plan.expected_counts)

    def test_negative_provisional_phase_flips_all_nonzero_scalar_bits(self) -> None:
        self.assertEqual(self.result.scalar_phase_sign, -1)
        self.assertEqual(self.result.provisional_a1_bits, "c01037213338d6a8")
        self.assertEqual(self.result.final_a1_bits, "401037213338d6a8")
        final_a1 = struct.unpack(
            ">d", bytes.fromhex(self.result.final_a1_bits)
        )[0]
        self.assertGreater(final_a1, 0.0)

    def test_every_frozen_mask_is_literal_positive_zero(self) -> None:
        result = self.result
        for column in range(16):
            self.assertEqual(_bits_at(result.scalar_multipole_f64le, 0, column, 16), "0" * 16)
            self.assertEqual(_bits_at(result.scalar_multipole_f64le, 63, column, 16), "0" * 16)
            self.assertEqual(_bits_at(result.potential_multipole_f64le, 63, column, 16), "0" * 16)
        for row in range(64):
            for column in range(32):
                if row in (0, 63) or column == 31:
                    self.assertEqual(_bits_at(result.base_scalar_f64le, row, column, 32), "0" * 16)
                if row == 63:
                    self.assertEqual(
                        _bits_at(result.base_potential_f64le, row, column, 32),
                        "0" * 16,
                    )

    def test_result_is_diagnostic_and_grants_no_authority(self) -> None:
        result = self.result
        self.assertTrue(result.diagnostic_map_evaluated_in_memory)
        self.assertTrue(result.diagnostic_only)
        self.assertTrue(result.toolchain_successor_required)
        self.assertIn("does_not_close_over_gmpy2", result.toolchain_blocker)
        false_fields = (
            "output_emitted",
            "receipt_emitted",
            "solver_wired",
            "run_plan_compatible",
            "gmpy2_toolchain_duty_closed",
            "runtime_authority",
            "execution_authority",
            "seed_admission_authority",
            "scientific_authority",
            "physical_authority",
        )
        for field in false_fields:
            self.assertIs(getattr(result, field), False, field)
        self.assertTrue(TOOLCHAIN_COMPATIBILITY["diagnosticOnly"])
        self.assertTrue(TOOLCHAIN_COMPATIBILITY["toolchainSuccessorRequired"])
        self.assertTrue(AUTHORITY_LOCKS)
        for key, value in AUTHORITY_LOCKS.items():
            self.assertIs(value, False, key)


class FailClosedBoundaryTests(unittest.TestCase):
    def test_mpfr_context_and_all_analytic_z_pins_are_guarded(self) -> None:
        slice_module._guard_runtime_identity()
        for level_id, (_, angular_count) in slice_module.LEVEL_SHAPES.items():
            with self.subTest(level_id=level_id):
                context = slice_module._make_context()
                with context:
                    active = slice_module.gmpy2.get_context()
                    slice_module._guard_active_context(active)
                    self.assertEqual(active.precision, 256)
                    self.assertEqual(active.round, slice_module.gmpy2.RoundToNearest)
                    self.assertEqual((active.emin, active.emax), (-1_000_000, 1_000_000))
                    slice_module._guard_binary64_rndn_semantics(active)
                    kernel = slice_module._Kernel(active)
                    z_bits, _ = slice_module._regenerate_analytic_z_bits(
                        kernel,
                        level_id,
                        angular_count,
                    )
                self.assertEqual(len(z_bits), angular_count)
                self.assertEqual(z_bits[0], "3ff0000000000000")
                self.assertEqual(z_bits[-1], "0000000000000000")
                self.assertEqual(kernel.counts.const_pi, 1)
                self.assertEqual(kernel.counts.get_d, angular_count)
                self.assertEqual(kernel.counts.flag_clear, angular_count)

        wrong = slice_module.gmpy2.context(
            precision=128,
            round=slice_module.gmpy2.RoundToNearest,
            emin=-1_000_000,
            emax=1_000_000,
        )
        with self.assertRaises(ProducerPostprojectionSliceError) as caught:
            slice_module._guard_active_context(wrong)
        self.assertEqual(caught.exception.code, "producer_mpfr_context_mismatch")

    def test_type_length_nonfinite_and_negative_zero_are_rejected(self) -> None:
        scalar, potential = _l0_fixture()
        cases = (
            (bytearray(scalar), potential, "exact_immutable_bytes_required"),
            (scalar[:-8], potential, "raw_array_byte_length_mismatch"),
            (
                struct.pack("<Q", 0x7FF8_0000_0000_0000) + scalar[8:],
                potential,
                "finite_binary64_required",
            ),
            (
                struct.pack("<Q", 0x8000_0000_0000_0000) + scalar[8:],
                potential,
                "negative_zero_forbidden",
            ),
        )
        for bad_scalar, accepted_potential, code in cases:
            with self.subTest(code=code):
                with self.assertRaises(ProducerPostprojectionSliceError) as caught:
                    postproject_level_bytes(
                        "L0",
                        bad_scalar,  # type: ignore[arg-type]
                        accepted_potential,
                    )
                self.assertEqual(caught.exception.code, code)

    def test_runtime_identity_and_concurrent_context_fail_closed(self) -> None:
        scalar, potential = _l0_fixture()
        with mock.patch.object(slice_module.gmpy2, "version", return_value="drift"):
            with self.assertRaises(ProducerPostprojectionSliceError) as caught:
                postproject_level_bytes("L0", scalar, potential)
        self.assertEqual(caught.exception.code, "producer_mpfr_runtime_identity_mismatch")

        self.assertTrue(slice_module._RUNTIME_LOCK.acquire(blocking=False))
        try:
            with self.assertRaises(ProducerPostprojectionSliceError) as caught:
                postproject_level_bytes("L0", scalar, potential)
        finally:
            slice_module._RUNTIME_LOCK.release()
        self.assertEqual(
            caught.exception.code,
            "concurrent_producer_mpfr_context_mutation_forbidden",
        )


class SourceSeparationTests(unittest.TestCase):
    def test_source_imports_no_solver_verifier_filesystem_or_array_stack(self) -> None:
        source = Path(slice_module.__file__).read_text(encoding="utf-8")
        tree = ast.parse(source)
        imported_roots: set[str] = set()
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                imported_roots.update(
                    alias.name.split(".", 1)[0] for alias in node.names
                )
            elif isinstance(node, ast.ImportFrom) and node.module:
                imported_roots.add(node.module.split(".", 1)[0])
        self.assertTrue({"gmpy2", "hashlib", "struct", "threading"}.issubset(imported_roots))
        self.assertTrue(
            imported_roots.isdisjoint(
                {
                    "solver",
                    "verifier",
                    "postprojection",
                    "rndn256",
                    "numpy",
                    "scipy",
                    "ctypes",
                    "os",
                    "pathlib",
                }
            )
        )
        self.assertNotIn("open(", source)
        self.assertNotIn("write_bytes", source)
        self.assertNotIn("emit", {node.id for node in ast.walk(tree) if isinstance(node, ast.Name)})
        self.assertNotIn("solver.py", source)
        self.assertIn("runPlanCompatible\": False", source)


if __name__ == "__main__":
    unittest.main()
