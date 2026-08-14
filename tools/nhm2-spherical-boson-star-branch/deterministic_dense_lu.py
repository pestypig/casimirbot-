"""Deterministic binary64 dense partial-pivot LU with fixed refinement.

This is a solver primitive only.  It contains no branch state, grid, candidate
input, tolerance admission, continuation choice, target/residual array read, or
claim authority.  All arithmetic is explicit scalar Python binary64; exact
absolute-value pivot ties retain the lowest row ordinal.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import struct
from typing import Final

from binary64_environment import nearest_binary64


DENSE_LU_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_deterministic_dense_lu/v1"
)
MAXIMUM_SYSTEM_ORDER: Final[int] = 1537
REFINEMENT_PASSES: Final[int] = 3


@dataclass(frozen=True, slots=True)
class DeterministicDenseLuResult:
    solution: tuple[float, ...]
    pivot_row_at_step: tuple[int, ...]
    refinement_passes: int
    final_residual_linf: float
    operation_version: str = DENSE_LU_VERSION
    calculation_implemented: bool = True
    exact_absolute_tie_lowest_row: bool = True
    blas_used: bool = False
    fma_requested: bool = False
    equilibration_used: bool = False
    alternate_pivot_retry_allowed: bool = False
    candidate_executed: bool = False
    solver_policy_authority: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    declared_lever_tensor_read: bool = False


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack(">d", value) == bytes.fromhex(
        "8000000000000000"
    )


def _canonical(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _validated_system(
    matrix: object, rhs: object
) -> tuple[tuple[tuple[float, ...], ...], tuple[float, ...]]:
    if type(matrix) is not tuple or type(rhs) is not tuple:
        raise ValueError("matrix and rhs must be exact tuples")
    order = len(matrix)
    if order < 1 or order > MAXIMUM_SYSTEM_ORDER or len(rhs) != order:
        raise ValueError("dense system shape is outside the frozen resource bound")
    rows: list[tuple[float, ...]] = []
    for row_index, row in enumerate(matrix):
        if type(row) is not tuple or len(row) != order:
            raise ValueError(f"matrix[{row_index}] must be an exact square tuple row")
        values: list[float] = []
        for column_index, item in enumerate(row):
            if type(item) not in (int, float):
                raise ValueError(
                    f"matrix[{row_index},{column_index}] must be an exact real"
                )
            value = float(item)
            if not math.isfinite(value) or _negative_zero(value):
                raise ValueError(
                    f"matrix[{row_index},{column_index}] is nonfinite or negative zero"
                )
            values.append(0.0 if value == 0.0 else value)
        rows.append(tuple(values))
    rhs_values: list[float] = []
    for index, item in enumerate(rhs):
        if type(item) not in (int, float):
            raise ValueError(f"rhs[{index}] must be an exact real")
        value = float(item)
        if not math.isfinite(value) or _negative_zero(value):
            raise ValueError(f"rhs[{index}] is nonfinite or negative zero")
        rhs_values.append(0.0 if value == 0.0 else value)
    return tuple(rows), tuple(rhs_values)


def _factor(
    matrix: tuple[tuple[float, ...], ...]
) -> tuple[list[list[float]], tuple[int, ...], tuple[int, ...]]:
    order = len(matrix)
    lu = [list(row) for row in matrix]
    permutation = list(range(order))
    pivots: list[int] = []
    for step in range(order):
        pivot_row = step
        pivot_magnitude = abs(lu[step][step])
        for row in range(step + 1, order):
            candidate = abs(lu[row][step])
            if candidate > pivot_magnitude:
                pivot_magnitude = candidate
                pivot_row = row
        if not math.isfinite(pivot_magnitude) or pivot_magnitude == 0.0:
            raise ValueError(f"zero_or_nonfinite_pivot_at_step:{step}")
        pivots.append(pivot_row)
        if pivot_row != step:
            lu[step], lu[pivot_row] = lu[pivot_row], lu[step]
            permutation[step], permutation[pivot_row] = (
                permutation[pivot_row],
                permutation[step],
            )
        pivot = lu[step][step]
        for row in range(step + 1, order):
            multiplier = _canonical(
                lu[row][step] / pivot, f"lu_multiplier[{row},{step}]"
            )
            lu[row][step] = multiplier
            for column in range(step + 1, order):
                lu[row][column] = _canonical(
                    lu[row][column] - multiplier * lu[step][column],
                    f"lu_update[{row},{column}]",
                )
    return lu, tuple(permutation), tuple(pivots)


def _solve_factored(
    lu: list[list[float]], permutation: tuple[int, ...], rhs: tuple[float, ...]
) -> tuple[float, ...]:
    order = len(lu)
    permuted = [rhs[permutation[row]] for row in range(order)]
    forward = [0.0] * order
    for row in range(order):
        value = permuted[row]
        for column in range(row):
            value = _canonical(
                value - lu[row][column] * forward[column],
                f"forward[{row},{column}]",
            )
        forward[row] = value
    solution = [0.0] * order
    for row in range(order - 1, -1, -1):
        value = forward[row]
        for column in range(row + 1, order):
            value = _canonical(
                value - lu[row][column] * solution[column],
                f"backward[{row},{column}]",
            )
        pivot = lu[row][row]
        if pivot == 0.0 or not math.isfinite(pivot):
            raise ValueError(f"zero_or_nonfinite_back_pivot_at_row:{row}")
        solution[row] = _canonical(value / pivot, f"solution[{row}]")
    return tuple(solution)


def _residual(
    matrix: tuple[tuple[float, ...], ...],
    rhs: tuple[float, ...],
    solution: tuple[float, ...],
) -> tuple[float, ...]:
    output: list[float] = []
    for row, coefficients in enumerate(matrix):
        try:
            product = math.fsum(
                coefficients[column] * solution[column]
                for column in range(len(solution))
            )
        except (OverflowError, ValueError) as error:
            raise ValueError(f"residual_product[{row}] overflowed") from error
        output.append(_canonical(rhs[row] - product, f"residual[{row}]"))
    return tuple(output)


@nearest_binary64
def solve_deterministic_dense_lu(
    *, matrix: tuple[tuple[float, ...], ...], rhs: tuple[float, ...]
) -> DeterministicDenseLuResult:
    """Factor once, solve, then perform exactly three residual refinements."""

    frozen_matrix, frozen_rhs = _validated_system(matrix, rhs)
    lu, permutation, pivots = _factor(frozen_matrix)
    solution = _solve_factored(lu, permutation, frozen_rhs)
    for pass_index in range(REFINEMENT_PASSES):
        residual = _residual(frozen_matrix, frozen_rhs, solution)
        correction = _solve_factored(lu, permutation, residual)
        solution = tuple(
            _canonical(
                solution[index] + correction[index],
                f"refined_solution[{pass_index},{index}]",
            )
            for index in range(len(solution))
        )
    final_residual = _residual(frozen_matrix, frozen_rhs, solution)
    final_linf = max(abs(value) for value in final_residual)
    return DeterministicDenseLuResult(
        solution=solution,
        pivot_row_at_step=pivots,
        refinement_passes=REFINEMENT_PASSES,
        final_residual_linf=_canonical(final_linf, "final residual linf"),
    )


__all__ = [
    "DENSE_LU_VERSION",
    "DeterministicDenseLuResult",
    "MAXIMUM_SYSTEM_ORDER",
    "REFINEMENT_PASSES",
    "solve_deterministic_dense_lu",
]
