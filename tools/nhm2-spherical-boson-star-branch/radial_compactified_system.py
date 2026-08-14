"""Square compactified radial EKG boundary-value system.

This module closes the algebraic assembly gap between the already-audited
pointwise radial equations and a future branch solver.  It uses the frozen
compactification ``rho=x/(1+x)`` and accepts caller-supplied differentiation
matrices in rho.  It assembles all interior equations, the regular-origin and
asymptotic endpoint rows, a caller-selected finite origin-amplitude row, and the
exact global analytic Jacobian.  The historical target amplitude remains the
default.

It deliberately does *not* select or generate nodes, solve the nonlinear
system, continue a branch, certify origin/tail remainders, read submitted
targets, or confer candidate/replay/physical authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import struct
from typing import Final

from binary64_environment import nearest_binary64

from radial_collocation_interior import MAXIMUM_NODE_COUNT, RadialCollocationState
from radial_residual import RadialJet, evaluate_spherical_radial_residual
from radial_residual_jacobian import evaluate_spherical_radial_residual_jacobian


COMPACTIFIED_SYSTEM_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_compactified_square_system/v2"
)
ORIGIN_AMPLITUDE: Final[float] = 2.0**-10
COMPACTIFICATION: Final[str] = "rho=x/(1+x);x=rho/(1-rho)"
RESIDUAL_ROW_ORDER: Final[str] = (
    "F0_origin_dx_then_Et_t_interior_ascending_rho_then_F0_infinity;"
    "F1_origin_dx_then_Etheta_theta_interior_ascending_rho_then_F1_infinity;"
    "varphi_origin_dx_then_KG_interior_ascending_rho_then_varphi_infinity;"
    "varphi_origin_minus_origin_amplitude"
)
UNKNOWN_COLUMN_ORDER: Final[str] = (
    "F0_nodes_ascending_rho_then_F1_nodes_ascending_rho_then_"
    "varphi_nodes_ascending_rho_then_w"
)


@dataclass(frozen=True, slots=True)
class CompactifiedDifferentiationData:
    rho: tuple[float, ...]
    first_rho: tuple[tuple[float, ...], ...]
    second_rho: tuple[tuple[float, ...], ...]


@dataclass(frozen=True, slots=True)
class SphericalRadialCompactifiedSystem:
    node_count: int
    unknown_count: int
    residual_count: int
    boundary_row_count: int
    interior_pde_row_count: int
    interior_node_indices: tuple[int, ...]
    origin_amplitude: float
    residual_row_order: str
    unknown_column_order: str
    solved_residual: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    unused_constraint: tuple[float, ...]
    unused_constraint_jacobian: tuple[tuple[float, ...], ...]
    analytic_form_version: str = COMPACTIFIED_SYSTEM_VERSION
    compactification: str = COMPACTIFICATION
    calculation_implemented: bool = True
    compactification_implemented: bool = True
    square_system_implemented: bool = True
    boundary_rows_implemented: bool = True
    grid_nodes_selected: bool = False
    grid_generation_implemented: bool = False
    nonlinear_solver_implemented: bool = False
    continuation_implemented: bool = False
    origin_remainder_proved: bool = False
    tail_remainder_proved: bool = False
    candidate_executed: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack(">d", value) == bytes.fromhex(
        "8000000000000000"
    )


def _finite_tuple(
    name: str, value: object, expected_length: int | None = None
) -> tuple[float, ...]:
    if type(value) is not tuple:
        raise ValueError(f"{name} must be an exact tuple")
    if expected_length is not None and len(value) != expected_length:
        raise ValueError(f"{name} length is invalid")
    output: list[float] = []
    for index, item in enumerate(value):
        if type(item) not in (int, float):
            raise ValueError(f"{name}[{index}] must be an exact real scalar")
        scalar = float(item)
        if not math.isfinite(scalar) or _negative_zero(scalar):
            raise ValueError(f"{name}[{index}] must be finite and not negative zero")
        output.append(0.0 if scalar == 0.0 else scalar)
    return tuple(output)


def _validated_grid(value: object) -> CompactifiedDifferentiationData:
    if type(value) is not CompactifiedDifferentiationData:
        raise ValueError("grid must be an exact CompactifiedDifferentiationData")
    rho = _finite_tuple("grid.rho", value.rho)
    count = len(rho)
    if count < 3 or count > MAXIMUM_NODE_COUNT:
        raise ValueError("grid node count is outside the frozen resource bound")
    if rho[0] != 0.0 or rho[-1] != 1.0:
        raise ValueError("grid endpoints must be exactly rho=+0 and rho=1")
    if any(not rho[index] > rho[index - 1] for index in range(1, count)):
        raise ValueError("grid rho nodes must increase strictly")
    if any(not 0.0 < rho[index] < 1.0 for index in range(1, count - 1)):
        raise ValueError("grid interior rho nodes must lie strictly in (0,1)")
    if type(value.first_rho) is not tuple or type(value.second_rho) is not tuple:
        raise ValueError("grid derivative matrices must be exact tuples")
    if len(value.first_rho) != count or len(value.second_rho) != count:
        raise ValueError("grid derivative matrix row counts are invalid")
    first = tuple(
        _finite_tuple(f"grid.first_rho[{row}]", value.first_rho[row], count)
        for row in range(count)
    )
    second = tuple(
        _finite_tuple(f"grid.second_rho[{row}]", value.second_rho[row], count)
        for row in range(count)
    )
    return CompactifiedDifferentiationData(
        rho=rho, first_rho=first, second_rho=second
    )


def _validated_state(value: object, count: int) -> RadialCollocationState:
    if type(value) is not RadialCollocationState:
        raise ValueError("state must be an exact RadialCollocationState")
    F0 = _finite_tuple("state.F0", value.F0, count)
    F1 = _finite_tuple("state.F1", value.F1, count)
    varphi = _finite_tuple("state.varphi", value.varphi, count)
    if type(value.w) not in (int, float):
        raise ValueError("state.w must be an exact real scalar")
    w = float(value.w)
    if not math.isfinite(w) or not 0.0 < w < 1.0 or _negative_zero(w):
        raise ValueError("state.w must satisfy 0<w<1")
    return RadialCollocationState(F0=F0, F1=F1, varphi=varphi, w=w)


def _validated_origin_amplitude(value: object) -> float:
    if type(value) not in (int, float):
        raise ValueError("origin_amplitude must be an exact real scalar")
    try:
        amplitude = float(value)
    except (OverflowError, ValueError) as error:
        raise ValueError("origin_amplitude is not representable in binary64") from error
    if not math.isfinite(amplitude) or _negative_zero(amplitude):
        raise ValueError("origin_amplitude must be finite and not negative zero")
    return 0.0 if amplitude == 0.0 else amplitude


def _dot(row: tuple[float, ...], values: tuple[float, ...], name: str) -> float:
    try:
        result = math.fsum(
            left * right for left, right in zip(row, values, strict=True)
        )
    except (OverflowError, ValueError) as error:
        raise ValueError(f"{name} overflowed") from error
    if not math.isfinite(result):
        raise ValueError(f"{name} is not finite")
    return 0.0 if result == 0.0 else result


def _canonical(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _x_derivative_rows(
    *,
    rho: float,
    first_rho: tuple[float, ...],
    second_rho: tuple[float, ...],
) -> tuple[tuple[float, ...], tuple[float, ...]]:
    one_minus = 1.0 - rho
    first_scale = one_minus * one_minus
    second_scale = first_scale * first_scale
    mixed_scale = -2.0 * one_minus * first_scale
    first_x = tuple(
        _canonical(first_scale * coefficient, "first-x derivative coefficient")
        for coefficient in first_rho
    )
    second_x = tuple(
        _canonical(
            second_scale * second + mixed_scale * first,
            "second-x derivative coefficient",
        )
        for first, second in zip(first_rho, second_rho, strict=True)
    )
    return first_x, second_x


def _global_local_row(
    *,
    local_row: tuple[float, ...],
    node: int,
    count: int,
    unknown_count: int,
    first_x: tuple[float, ...],
    second_x: tuple[float, ...],
    name: str,
) -> tuple[float, ...]:
    output = [0.0] * unknown_count
    for field_index in range(3):
        local_offset = 3 * field_index
        column_offset = field_index * count
        for column in range(count):
            coefficient = (
                (local_row[local_offset] if column == node else 0.0)
                + local_row[local_offset + 1] * first_x[column]
                + local_row[local_offset + 2] * second_x[column]
            )
            output[column_offset + column] = _canonical(
                coefficient, f"{name}[{column_offset + column}]"
            )
    output[-1] = _canonical(local_row[-1], f"{name}[{unknown_count - 1}]")
    return tuple(output)


def _boundary_row(
    *, unknown_count: int, column_offset: int, coefficients: tuple[float, ...]
) -> tuple[float, ...]:
    output = [0.0] * unknown_count
    for column, coefficient in enumerate(coefficients):
        output[column_offset + column] = coefficient
    return tuple(output)


@nearest_binary64
def evaluate_spherical_radial_compactified_system(
    *,
    grid: CompactifiedDifferentiationData,
    state: RadialCollocationState,
    origin_amplitude: float = ORIGIN_AMPLITUDE,
) -> SphericalRadialCompactifiedSystem:
    """Assemble the exact ``(3*N+1) x (3*N+1)`` BVP map and Jacobian."""

    frozen_grid = _validated_grid(grid)
    count = len(frozen_grid.rho)
    frozen_state = _validated_state(state, count)
    frozen_origin_amplitude = _validated_origin_amplitude(origin_amplitude)
    unknown_count = 3 * count + 1
    fields = (frozen_state.F0, frozen_state.F1, frozen_state.varphi)
    interior = tuple(range(1, count - 1))

    residual_blocks: list[list[float]] = [[], [], []]
    jacobian_blocks: list[list[tuple[float, ...]]] = [[], [], []]
    unused_residual: list[float] = []
    unused_jacobian: list[tuple[float, ...]] = []

    for node in interior:
        rho = frozen_grid.rho[node]
        one_minus = 1.0 - rho
        x = rho / one_minus
        if not math.isfinite(x) or x <= 0.0:
            raise ValueError("compactified interior x is outside the finite domain")
        first_x, second_x = _x_derivative_rows(
            rho=rho,
            first_rho=frozen_grid.first_rho[node],
            second_rho=frozen_grid.second_rho[node],
        )
        jets = tuple(
            RadialJet(
                value=field[node],
                dx=_dot(first_x, field, f"field[{field_index}].dx[{node}]"),
                dxx=_dot(second_x, field, f"field[{field_index}].dxx[{node}]"),
            )
            for field_index, field in enumerate(fields)
        )
        point = evaluate_spherical_radial_residual(
            x=x,
            F0=jets[0],
            F1=jets[1],
            varphi=jets[2],
            w=frozen_state.w,
        )
        local = evaluate_spherical_radial_residual_jacobian(
            x=x,
            F0=jets[0],
            F1=jets[1],
            varphi=jets[2],
            w=frozen_state.w,
        )
        for equation in range(3):
            residual_blocks[equation].append(point.solved[equation])
            jacobian_blocks[equation].append(
                _global_local_row(
                    local_row=local.rows[equation],
                    node=node,
                    count=count,
                    unknown_count=unknown_count,
                    first_x=first_x,
                    second_x=second_x,
                    name=f"solved_jacobian[{equation},{node}]",
                )
            )
        unused_residual.append(point.unused_constraints[0])
        unused_jacobian.append(
            _global_local_row(
                local_row=local.rows[3],
                node=node,
                count=count,
                unknown_count=unknown_count,
                first_x=first_x,
                second_x=second_x,
                name=f"unused_jacobian[{node}]",
            )
        )

    solved_residual: list[float] = []
    solved_jacobian: list[tuple[float, ...]] = []
    for field_index, field in enumerate(fields):
        column_offset = field_index * count
        origin_row = _boundary_row(
            unknown_count=unknown_count,
            column_offset=column_offset,
            coefficients=frozen_grid.first_rho[0],
        )
        solved_residual.append(
            _dot(
                frozen_grid.first_rho[0],
                field,
                f"field[{field_index}].origin_dx",
            )
        )
        solved_jacobian.append(origin_row)
        solved_residual.extend(residual_blocks[field_index])
        solved_jacobian.extend(jacobian_blocks[field_index])
        infinity_coefficients = tuple(
            1.0 if column == count - 1 else 0.0 for column in range(count)
        )
        solved_residual.append(field[-1])
        solved_jacobian.append(
            _boundary_row(
                unknown_count=unknown_count,
                column_offset=column_offset,
                coefficients=infinity_coefficients,
            )
        )

    amplitude_row = [0.0] * unknown_count
    amplitude_row[2 * count] = 1.0
    solved_residual.append(frozen_state.varphi[0] - frozen_origin_amplitude)
    solved_jacobian.append(tuple(amplitude_row))

    if len(solved_residual) != unknown_count or len(solved_jacobian) != unknown_count:
        raise RuntimeError("compactified square-system row-count invariant failed")
    if any(len(row) != unknown_count for row in solved_jacobian):
        raise RuntimeError("compactified square-system column-count invariant failed")

    return SphericalRadialCompactifiedSystem(
        node_count=count,
        unknown_count=unknown_count,
        residual_count=unknown_count,
        boundary_row_count=7,
        interior_pde_row_count=3 * (count - 2),
        interior_node_indices=interior,
        origin_amplitude=frozen_origin_amplitude,
        residual_row_order=RESIDUAL_ROW_ORDER,
        unknown_column_order=UNKNOWN_COLUMN_ORDER,
        solved_residual=tuple(
            _canonical(value, "solved residual") for value in solved_residual
        ),
        jacobian=tuple(solved_jacobian),
        unused_constraint=tuple(
            _canonical(value, "unused constraint") for value in unused_residual
        ),
        unused_constraint_jacobian=tuple(unused_jacobian),
    )


__all__ = [
    "COMPACTIFICATION",
    "COMPACTIFIED_SYSTEM_VERSION",
    "CompactifiedDifferentiationData",
    "ORIGIN_AMPLITUDE",
    "RESIDUAL_ROW_ORDER",
    "SphericalRadialCompactifiedSystem",
    "UNKNOWN_COLUMN_ORDER",
    "evaluate_spherical_radial_compactified_system",
]
