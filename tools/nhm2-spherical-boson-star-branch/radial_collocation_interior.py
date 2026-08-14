"""Grid-generic interior assembly for the spherical radial EKG system.

The caller supplies already-frozen radial nodes and first/second derivative
matrices.  This module evaluates only interior PDE rows and their analytic
chain-rule Jacobian.  It deliberately does not select a grid, boundary rows,
tail representation, continuation schedule, linear solver, tolerance, or
candidate result.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import struct
from typing import Final

from binary64_environment import nearest_binary64

from radial_residual import RadialJet, evaluate_spherical_radial_residual
from radial_residual_jacobian import evaluate_spherical_radial_residual_jacobian


INTERIOR_ASSEMBLY_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_ekg_interior_assembly/v1"
)
MAXIMUM_NODE_COUNT: Final[int] = 512


@dataclass(frozen=True, slots=True)
class RadialDifferentiationData:
    nodes: tuple[float, ...]
    first: tuple[tuple[float, ...], ...]
    second: tuple[tuple[float, ...], ...]


@dataclass(frozen=True, slots=True)
class RadialCollocationState:
    F0: tuple[float, ...]
    F1: tuple[float, ...]
    varphi: tuple[float, ...]
    w: float


@dataclass(frozen=True, slots=True)
class SphericalRadialInteriorAssembly:
    node_count: int
    unknown_count: int
    interior_node_indices: tuple[int, ...]
    residual_row_order: str
    unknown_column_order: str
    solved_residual: tuple[float, ...]
    unused_constraint: tuple[float, ...]
    jacobian: tuple[tuple[float, ...], ...]
    analytic_form_version: str = INTERIOR_ASSEMBLY_VERSION
    calculation_implemented: bool = True
    grid_selected: bool = False
    boundary_rows_implemented: bool = False
    tail_implemented: bool = False
    discrete_solver_implemented: bool = False
    candidate_executed: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _is_negative_zero(value: float) -> bool:
    return value == 0.0 and struct.pack(">d", value) == bytes.fromhex(
        "8000000000000000"
    )


def _finite_tuple(name: str, value: object, expected_length: int | None = None) -> tuple[float, ...]:
    if type(value) is not tuple:
        raise ValueError(f"{name} must be an exact tuple")
    if expected_length is not None and len(value) != expected_length:
        raise ValueError(f"{name} length is invalid")
    result: list[float] = []
    for index, item in enumerate(value):
        if type(item) not in (int, float):
            raise ValueError(f"{name}[{index}] must be an exact real scalar")
        scalar = float(item)
        if not math.isfinite(scalar) or _is_negative_zero(scalar):
            raise ValueError(f"{name}[{index}] must be finite and not negative zero")
        result.append(0.0 if scalar == 0.0 else scalar)
    return tuple(result)


def _validated_grid(value: object) -> RadialDifferentiationData:
    if type(value) is not RadialDifferentiationData:
        raise ValueError("grid must be an exact RadialDifferentiationData")
    nodes = _finite_tuple("grid.nodes", value.nodes)
    count = len(nodes)
    if count < 3 or count > MAXIMUM_NODE_COUNT:
        raise ValueError("grid node count is outside the frozen resource bound")
    if nodes[0] != 0.0 or any(
        not nodes[index] > nodes[index - 1] for index in range(1, count)
    ):
        raise ValueError("grid nodes must start at +0 and increase strictly")
    if type(value.first) is not tuple or type(value.second) is not tuple:
        raise ValueError("grid derivative matrices must be exact tuples")
    if len(value.first) != count or len(value.second) != count:
        raise ValueError("grid derivative matrix row counts are invalid")
    first = tuple(
        _finite_tuple(f"grid.first[{row}]", value.first[row], count)
        for row in range(count)
    )
    second = tuple(
        _finite_tuple(f"grid.second[{row}]", value.second[row], count)
        for row in range(count)
    )
    return RadialDifferentiationData(nodes=nodes, first=first, second=second)


def _validated_state(value: object, count: int) -> RadialCollocationState:
    if type(value) is not RadialCollocationState:
        raise ValueError("state must be an exact RadialCollocationState")
    F0 = _finite_tuple("state.F0", value.F0, count)
    F1 = _finite_tuple("state.F1", value.F1, count)
    varphi = _finite_tuple("state.varphi", value.varphi, count)
    if type(value.w) not in (int, float):
        raise ValueError("state.w must be an exact real scalar")
    w = float(value.w)
    if not math.isfinite(w) or not 0.0 < w < 1.0 or _is_negative_zero(w):
        raise ValueError("state.w must satisfy 0<w<1")
    return RadialCollocationState(F0=F0, F1=F1, varphi=varphi, w=w)


def _dot(row: tuple[float, ...], values: tuple[float, ...], name: str) -> float:
    try:
        result = math.fsum(left * right for left, right in zip(row, values, strict=True))
    except (OverflowError, ValueError) as error:
        raise ValueError(f"{name} overflowed") from error
    if not math.isfinite(result):
        raise ValueError(f"{name} is not finite")
    return 0.0 if result == 0.0 else result


def _canonical(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


@nearest_binary64
def evaluate_spherical_radial_collocation_interior(
    *,
    grid: RadialDifferentiationData,
    state: RadialCollocationState,
) -> SphericalRadialInteriorAssembly:
    """Assemble node-major solved rows and their global analytic Jacobian."""

    frozen_grid = _validated_grid(grid)
    count = len(frozen_grid.nodes)
    frozen_state = _validated_state(state, count)
    unknown_count = 3 * count + 1
    solved: list[float] = []
    unused: list[float] = []
    jacobian_rows: list[tuple[float, ...]] = []

    fields = (frozen_state.F0, frozen_state.F1, frozen_state.varphi)
    interior = tuple(range(1, count - 1))
    for node in interior:
        first_row = frozen_grid.first[node]
        second_row = frozen_grid.second[node]
        jets = tuple(
            RadialJet(
                value=field[node],
                dx=_dot(first_row, field, f"field[{field_index}].dx[{node}]"),
                dxx=_dot(second_row, field, f"field[{field_index}].dxx[{node}]"),
            )
            for field_index, field in enumerate(fields)
        )
        point = evaluate_spherical_radial_residual(
            x=frozen_grid.nodes[node],
            F0=jets[0],
            F1=jets[1],
            varphi=jets[2],
            w=frozen_state.w,
        )
        local = evaluate_spherical_radial_residual_jacobian(
            x=frozen_grid.nodes[node],
            F0=jets[0],
            F1=jets[1],
            varphi=jets[2],
            w=frozen_state.w,
        )
        solved.extend(point.solved)
        unused.extend(point.unused_constraints)

        for solved_row in range(3):
            local_row = local.rows[solved_row]
            global_row = [0.0] * unknown_count
            for field_index in range(3):
                base = 3 * field_index
                column_offset = field_index * count
                for column in range(count):
                    value = (
                        (local_row[base] if column == node else 0.0)
                        + local_row[base + 1] * first_row[column]
                        + local_row[base + 2] * second_row[column]
                    )
                    global_row[column_offset + column] = _canonical(
                        value,
                        f"jacobian[{len(jacobian_rows)},{column_offset + column}]",
                    )
            global_row[-1] = _canonical(
                local_row[-1], f"jacobian[{len(jacobian_rows)},{unknown_count - 1}]"
            )
            jacobian_rows.append(tuple(global_row))

    return SphericalRadialInteriorAssembly(
        node_count=count,
        unknown_count=unknown_count,
        interior_node_indices=interior,
        residual_row_order="node_major_then_Et_t_Etheta_theta_KG",
        unknown_column_order="F0_nodes_then_F1_nodes_then_varphi_nodes_then_w",
        solved_residual=tuple(_canonical(value, "solved residual") for value in solved),
        unused_constraint=tuple(
            _canonical(value, "unused constraint") for value in unused
        ),
        jacobian=tuple(jacobian_rows),
    )


__all__ = [
    "INTERIOR_ASSEMBLY_VERSION",
    "MAXIMUM_NODE_COUNT",
    "RadialCollocationState",
    "RadialDifferentiationData",
    "SphericalRadialInteriorAssembly",
    "evaluate_spherical_radial_collocation_interior",
]
