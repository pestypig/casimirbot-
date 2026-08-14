"""Deterministic MPFR256 Lobatto grid for the compactified radial BVP.

The generator fixes the node and binary64 differentiation operation graph, but
does not choose a production node count or make the resulting grid authoritative
for a candidate.  Source, toolchain, executable, and runtime bindings remain a
future preexecution duty.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
import struct
from typing import Final

import gmpy2

from binary64_environment import nearest_binary64

from radial_collocation_interior import MAXIMUM_NODE_COUNT
from radial_compactified_system import CompactifiedDifferentiationData


LOBATTO_GRID_GENERATOR_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_compactified_lobatto_grid/v1"
)
MPFR_PRECISION_BITS: Final[int] = 256
MPFR_EMIN: Final[int] = -1_073_741_823
MPFR_EMAX: Final[int] = 1_073_741_823
NODE_OPERATION_GRAPH: Final[str] = (
    "endpoints_literal_positive_zero_and_one;interior_per_node_"
    "rho=get_d_RNDN(div_RNDN(sub_RNDN(1,cos_RNDN(div_RNDN("
    "mul_RNDN(const_pi_RNDN,set_ui(i)),set_ui(N-1)))),2));"
    "D_ij=w_j/(w_i*(rho_i-rho_j))_binary64_left_to_right;"
    "D_ii=-fsum_j_ne_i(D_ij);D2_ij=fsum_k(D_ik*D_kj)"
)


@dataclass(frozen=True, slots=True)
class GeneratedCompactifiedLobattoGrid:
    differentiation: CompactifiedDifferentiationData
    node_count: int
    mpfr_precision_bits: int
    operation_graph: str
    observed_gmpy2_version: str
    observed_mpfr_version: str
    calculation_implemented: bool = True
    node_count_selected_for_candidate: bool = False
    source_bound: bool = False
    toolchain_bound: bool = False
    executable_bound: bool = False
    runtime_bound: bool = False
    presealed: bool = False
    candidate_executed: bool = False
    solver_authority: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    declared_lever_tensor_read: bool = False


def _canonical(value: float, name: str) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


def _same_bits(left: float, right: float) -> bool:
    return struct.pack("<d", left) == struct.pack("<d", right)


def _mpfr256_nodes(count: int) -> tuple[float, ...]:
    template = gmpy2.get_context().copy()
    template.precision = MPFR_PRECISION_BITS
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
    template.underflow = False
    template.overflow = False
    template.inexact = False
    template.invalid = False
    template.erange = False
    template.divzero = False
    template.allow_complex = False
    template.rational_division = False
    template.allow_release_gil = False
    with gmpy2.context(template):
        pi_value = gmpy2.const_pi()
        denominator = gmpy2.mpfr(count - 1)
        one = gmpy2.mpfr(1)
        two = gmpy2.mpfr(2)
        output = [0.0]
        for index in range(1, count - 1):
            index_value = gmpy2.mpfr(index)
            product = pi_value * index_value
            argument = product / denominator
            cosine = gmpy2.cos(argument)
            difference = one - cosine
            rho = difference / two
            value = float(rho)
            output.append(_canonical(value, f"rho[{index}]"))
        output.append(1.0)
    nodes = tuple(output)
    if not _same_bits(nodes[0], 0.0) or not _same_bits(nodes[-1], 1.0):
        raise RuntimeError("Lobatto endpoint bit invariant failed")
    if any(not nodes[index] > nodes[index - 1] for index in range(1, count)):
        raise ValueError("MPFR256 Lobatto nodes did not round to a strict ordering")
    return nodes


def _barycentric_weights(count: int) -> tuple[float, ...]:
    return tuple(
        (-1.0 if index % 2 else 1.0)
        * (0.5 if index in (0, count - 1) else 1.0)
        for index in range(count)
    )


def _first_matrix(nodes: tuple[float, ...]) -> tuple[tuple[float, ...], ...]:
    count = len(nodes)
    weights = _barycentric_weights(count)
    rows: list[tuple[float, ...]] = []
    for row in range(count):
        values = [0.0] * count
        for column in range(count):
            if row == column:
                continue
            difference = nodes[row] - nodes[column]
            denominator = weights[row] * difference
            if denominator == 0.0 or not math.isfinite(denominator):
                raise ValueError("Lobatto differentiation denominator is invalid")
            values[column] = _canonical(
                weights[column] / denominator,
                f"D[{row},{column}]",
            )
        values[row] = _canonical(-math.fsum(values), f"D[{row},{row}]")
        rows.append(tuple(values))
    return tuple(rows)


def _matrix_square(
    matrix: tuple[tuple[float, ...], ...]
) -> tuple[tuple[float, ...], ...]:
    count = len(matrix)
    return tuple(
        tuple(
            _canonical(
                math.fsum(
                    matrix[row][inner] * matrix[inner][column]
                    for inner in range(count)
                ),
                f"D2[{row},{column}]",
            )
            for column in range(count)
        )
        for row in range(count)
    )


@nearest_binary64
def generate_compactified_lobatto_grid(
    count: int,
) -> GeneratedCompactifiedLobattoGrid:
    """Generate one unselected grid using the frozen finite operation graph."""

    if type(count) is not int or not 3 <= count <= MAXIMUM_NODE_COUNT:
        raise ValueError("count must be an exact integer in [3,512]")
    nodes = _mpfr256_nodes(count)
    first = _first_matrix(nodes)
    second = _matrix_square(first)
    return GeneratedCompactifiedLobattoGrid(
        differentiation=CompactifiedDifferentiationData(
            rho=nodes,
            first_rho=first,
            second_rho=second,
        ),
        node_count=count,
        mpfr_precision_bits=MPFR_PRECISION_BITS,
        operation_graph=NODE_OPERATION_GRAPH,
        observed_gmpy2_version=gmpy2.version(),
        observed_mpfr_version=gmpy2.mpfr_version(),
    )


__all__ = [
    "GeneratedCompactifiedLobattoGrid",
    "LOBATTO_GRID_GENERATOR_VERSION",
    "MPFR_EMAX",
    "MPFR_EMIN",
    "MPFR_PRECISION_BITS",
    "NODE_OPERATION_GRAPH",
    "generate_compactified_lobatto_grid",
]
