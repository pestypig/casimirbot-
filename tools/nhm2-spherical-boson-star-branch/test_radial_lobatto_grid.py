from __future__ import annotations

from dataclasses import FrozenInstanceError
import math
import gmpy2
from pathlib import Path
import struct
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from radial_lobatto_grid import (  # noqa: E402
    MPFR_PRECISION_BITS,
    generate_compactified_lobatto_grid,
)


def _bits(values: tuple[float, ...]) -> tuple[bytes, ...]:
    return tuple(struct.pack("<d", value) for value in values)


def _apply(
    matrix: tuple[tuple[float, ...], ...], values: tuple[float, ...]
) -> tuple[float, ...]:
    return tuple(
        math.fsum(left * right for left, right in zip(row, values, strict=True))
        for row in matrix
    )


class CompactifiedLobattoGridTests(unittest.TestCase):
    def test_three_point_fixture_is_exact(self) -> None:
        result = generate_compactified_lobatto_grid(3)
        grid = result.differentiation
        self.assertEqual(grid.rho, (0.0, 0.5, 1.0))
        self.assertEqual(
            grid.first_rho,
            (
                (-3.0, 4.0, -1.0),
                (-1.0, 0.0, 1.0),
                (1.0, -4.0, 3.0),
            ),
        )
        self.assertEqual(
            grid.second_rho,
            (
                (4.0, -8.0, 4.0),
                (4.0, -8.0, 4.0),
                (4.0, -8.0, 4.0),
            ),
        )
        self.assertEqual(result.mpfr_precision_bits, MPFR_PRECISION_BITS)

    def test_nodes_and_matrices_are_bit_deterministic(self) -> None:
        for count in (4, 8, 32, 64, 128):
            with self.subTest(count=count):
                left = generate_compactified_lobatto_grid(count)
                right = generate_compactified_lobatto_grid(count)
                self.assertEqual(_bits(left.differentiation.rho), _bits(right.differentiation.rho))
                for left_row, right_row in zip(
                    left.differentiation.first_rho,
                    right.differentiation.first_rho,
                    strict=True,
                ):
                    self.assertEqual(_bits(left_row), _bits(right_row))
                for left_row, right_row in zip(
                    left.differentiation.second_rho,
                    right.differentiation.second_rho,
                    strict=True,
                ):
                    self.assertEqual(_bits(left_row), _bits(right_row))
                self.assertEqual(struct.pack("<d", left.differentiation.rho[0]), bytes(8))
                self.assertEqual(
                    struct.pack("<d", left.differentiation.rho[-1]),
                    bytes.fromhex("000000000000f03f"),
                )

    def test_polynomial_differentiation_converges_to_roundoff(self) -> None:
        result = generate_compactified_lobatto_grid(16)
        grid = result.differentiation
        constant = (1.0,) * 16
        linear = grid.rho
        quadratic = tuple(value * value for value in grid.rho)
        constant_prime = _apply(grid.first_rho, constant)
        linear_prime = _apply(grid.first_rho, linear)
        quadratic_second = _apply(grid.second_rho, quadratic)
        self.assertLessEqual(max(abs(value) for value in constant_prime), 3.0e-13)
        self.assertLessEqual(max(abs(value - 1.0) for value in linear_prime), 3.0e-13)
        self.assertLessEqual(max(abs(value - 2.0) for value in quadratic_second), 2.0e-10)

    def test_authority_and_hostile_count_boundaries_fail_closed(self) -> None:
        result = generate_compactified_lobatto_grid(8)
        for field in (
            "node_count_selected_for_candidate",
            "source_bound",
            "toolchain_bound",
            "executable_bound",
            "runtime_bound",
            "presealed",
            "candidate_executed",
            "solver_authority",
            "replay_authority",
            "diagnostic_pass_authority",
            "physical_authority",
            "propulsion_authority",
            "transport_authority",
            "declared_lever_tensor_read",
        ):
            self.assertIs(getattr(result, field), False)
        with self.assertRaises(FrozenInstanceError):
            result.presealed = True  # type: ignore[misc]
        for bad in (True, 2, 513, 8.0, "8", None):
            with self.subTest(bad=bad), self.assertRaises(ValueError):
                generate_compactified_lobatto_grid(bad)  # type: ignore[arg-type]

    def test_ambient_mpfr_context_is_ignored_and_restored(self) -> None:
        baseline = generate_compactified_lobatto_grid(32)
        ambient = gmpy2.get_context()
        original = ambient.copy()
        try:
            ambient.precision = 19
            ambient.round = gmpy2.RoundDown
            ambient.emin = 0
            ambient.emax = 2
            ambient.subnormalize = True
            ambient.trap_inexact = True
            ambient.trap_underflow = True
            observed = generate_compactified_lobatto_grid(32)
            self.assertEqual(
                _bits(observed.differentiation.rho),
                _bits(baseline.differentiation.rho),
            )
            self.assertEqual(ambient.precision, 19)
            self.assertEqual(ambient.round, gmpy2.RoundDown)
            self.assertEqual(ambient.emin, 0)
            self.assertEqual(ambient.emax, 2)
            self.assertIs(ambient.trap_inexact, True)
        finally:
            gmpy2.set_context(original)


if __name__ == "__main__":
    unittest.main()
