from __future__ import annotations

import importlib.util
import math
import subprocess
import sys
import unittest
from pathlib import Path

import numpy as np


SOURCE = Path(__file__).with_name("connected_noise_full_array_diagnostic.py")
SPEC = importlib.util.spec_from_file_location("nhm2_noise_worker", SOURCE)
assert SPEC is not None and SPEC.loader is not None
worker = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(worker)


class ConnectedNoiseFullArrayDiagnosticWorkerTest(unittest.TestCase):
    def test_q_bump_is_even_compact_and_canonical(self) -> None:
        self.assertEqual(worker._q_bump_scalar(-1.0), 0.0)
        self.assertEqual(worker._q_bump_scalar(1.0), 0.0)
        self.assertEqual(worker._q_bump_scalar(2.0), 0.0)
        self.assertEqual(worker._q_bump_scalar(0.0), 1.0)
        self.assertEqual(worker._q_bump_scalar(0.25), worker._q_bump_scalar(-0.25))

    def test_prefix_and_inverse_match_piecewise_constant_surrogate(self) -> None:
        grid = np.asarray([0.0, 1.0, 2.0], dtype=np.float64)
        q_squared = np.asarray([1.0, 1.0, 3.0], dtype=np.float64)
        prefix = worker._left_prefix_trapezoid(np, grid, q_squared)
        np.testing.assert_array_equal(prefix, [0.0, 1.0, 3.0])
        cdf = prefix / prefix[-1]
        targets = np.asarray([0.0, 1.0 / 6.0, 1.0 / 3.0, 2.0 / 3.0], dtype=np.float64)
        inverse = worker._inverse_cdf(np, targets, grid, cdf)
        np.testing.assert_allclose(inverse, [0.0, 0.5, 1.0, 1.5], rtol=0, atol=1e-15)

    def test_contract_owned_sobol_first_eight_points(self) -> None:
        parameters = [
            {"degreeS": 0, "coefficientA": 0, "initialOddM": [1]},
            {"degreeS": 1, "coefficientA": 0, "initialOddM": [1]},
            {"degreeS": 2, "coefficientA": 1, "initialOddM": [1, 3]},
        ]
        observed = worker._sobol_points(np, 0, 8, parameters)
        expected = np.asarray(
            [
                [0.0, 0.0, 0.0],
                [0.5, 0.5, 0.5],
                [0.75, 0.25, 0.25],
                [0.25, 0.75, 0.75],
                [0.375, 0.375, 0.625],
                [0.875, 0.875, 0.125],
                [0.625, 0.125, 0.875],
                [0.125, 0.625, 0.375],
            ],
            dtype=np.float64,
        )
        np.testing.assert_array_equal(observed, expected)

    def test_factorized_phase_classes_match_frozen_sign_sum(self) -> None:
        angles = (0.37, -0.23, 0.51)
        signs = (
            (-1, -1, -1),
            (-1, -1, 1),
            (-1, 1, -1),
            (-1, 1, 1),
            (1, -1, -1),
            (1, -1, 1),
            (1, 1, -1),
            (1, 1, 1),
        )
        patterns = ((0, 0, 0), (1, 1, 0), (1, 0, 1), (0, 1, 1))
        factorized = (
            8 * math.cos(angles[0]) * math.cos(angles[1]) * math.cos(angles[2]),
            -8 * math.sin(angles[0]) * math.sin(angles[1]) * math.cos(angles[2]),
            -8 * math.sin(angles[0]) * math.cos(angles[1]) * math.sin(angles[2]),
            -8 * math.cos(angles[0]) * math.sin(angles[1]) * math.sin(angles[2]),
        )
        for ordinal, pattern in enumerate(patterns):
            direct = 0.0
            for sign in signs:
                weight = math.prod(sign[axis] ** pattern[axis] for axis in range(3))
                direct += weight * math.cos(
                    sum(sign[axis] * angles[axis] for axis in range(3))
                )
            self.assertAlmostEqual(factorized[ordinal], direct, places=14)

    def test_suffix_interpolation_honors_cutoff(self) -> None:
        grid = np.arange(513, dtype=np.float64) / 256.0
        prefix = grid.copy()
        lower = np.asarray([0.0, 0.5, 1.5, 2.0, 3.0], dtype=np.float64)
        observed = worker._interpolate_prefix(np, lower, grid, prefix, 512)
        np.testing.assert_array_equal(observed, [2.0, 1.5, 0.5, 0.0, 0.0])

    def test_peak_resident_memory_is_observed_below_the_frozen_cap(self) -> None:
        observed = worker._peak_resident_bytes()
        self.assertIsInstance(observed, int)
        self.assertGreater(observed, 0)
        self.assertLessEqual(observed, worker.MAX_RESIDENT_BYTES)

    def test_cli_rejects_non_exact_envelope_without_traceback(self) -> None:
        completed = subprocess.run(
            [sys.executable, str(SOURCE)],
            input=b"{}",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=10,
        )
        self.assertEqual(completed.returncode, 2)
        self.assertEqual(completed.stdout, b"")
        self.assertIn(b"envelope_keys_invalid", completed.stderr)
        self.assertNotIn(b"Traceback", completed.stderr)


if __name__ == "__main__":
    unittest.main()
