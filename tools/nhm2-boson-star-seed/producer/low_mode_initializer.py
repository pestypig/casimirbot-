"""Deterministic low-mode initializer for the frozen L0 nodal SP solve.

This module produces an initial guess only.  It does not replace the frozen
full nodal row map, relax any producer tolerance, or supply seed authority.
The terminal solve and mandatory postprojection chronology remain in
``solver.py``.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from contract import GridLevel
from spectral import canonical_f64, legendre_table, mapped_nodes


ODD_DEGREES = np.arange(1, 12, 2, dtype=np.int64)
EVEN_DEGREES = np.arange(0, 13, 2, dtype=np.int64)
QUADRATURE_ORDER = 80
INNER_RADIUS = 1.0e-5
OUTER_RADIUS = 40.0
INITIAL_RADIAL_NODE_COUNT = 600
BVP_TOLERANCE = 1.0e-8
BVP_MAXIMUM_NODE_COUNT = 50_000


@dataclass(frozen=True)
class LowModeInitializerResult:
    scalar_nodal: np.ndarray
    potential_nodal: np.ndarray
    bvp_iteration_count: int
    bvp_node_count: int
    bvp_maximum_rms_residual: float
    bvp_boundary_linf: float


def _angular_operators() -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    nodes, weights = np.polynomial.legendre.leggauss(QUADRATURE_ORDER)
    scalar_basis = legendre_table(nodes, ODD_DEGREES)
    potential_basis = legendre_table(nodes, EVEN_DEGREES)
    scalar_projector = (
        weights[:, None]
        * scalar_basis
        * ((2 * ODD_DEGREES + 1) / 2.0)[None, :]
    )
    potential_projector = (
        weights[:, None]
        * potential_basis
        * ((2 * EVEN_DEGREES + 1) / 2.0)[None, :]
    )
    return scalar_basis, potential_basis, scalar_projector, potential_projector


_SCALAR_BASIS, _POTENTIAL_BASIS, _SCALAR_PROJECTOR, _POTENTIAL_PROJECTOR = (
    _angular_operators()
)
_SCALAR_MODE_COUNT = ODD_DEGREES.size
_POTENTIAL_MODE_COUNT = EVEN_DEGREES.size
_STATE_SIZE = 2 * (_SCALAR_MODE_COUNT + _POTENTIAL_MODE_COUNT)


def _unpack_state(
    state: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    values = np.asarray(state, dtype=np.float64)
    scalar_end = _SCALAR_MODE_COUNT
    scalar_derivative_end = 2 * _SCALAR_MODE_COUNT
    potential_end = scalar_derivative_end + _POTENTIAL_MODE_COUNT
    return (
        values[:scalar_end],
        values[scalar_end:scalar_derivative_end],
        values[scalar_derivative_end:potential_end],
        values[potential_end:],
    )


def _modal_ode(radial: np.ndarray, state: np.ndarray) -> np.ndarray:
    scalar, scalar_x, potential, potential_x = _unpack_state(state)
    scalar_values = scalar.T @ _SCALAR_BASIS.T
    potential_values = potential.T @ _POTENTIAL_BASIS.T
    potential_times_scalar = (scalar_values * potential_values) @ _SCALAR_PROJECTOR
    scalar_squared = (scalar_values * scalar_values) @ _POTENTIAL_PROJECTOR
    radial_row = np.asarray(radial, dtype=np.float64)[None, :]
    scalar_xx = (
        -2.0 * scalar_x / radial_row
        + ODD_DEGREES[:, None]
        * (ODD_DEGREES[:, None] + 1)
        * scalar
        / radial_row**2
        + 2.0 * (potential_times_scalar.T + 0.5 * scalar)
    )
    potential_xx = (
        -2.0 * potential_x / radial_row
        + EVEN_DEGREES[:, None]
        * (EVEN_DEGREES[:, None] + 1)
        * potential
        / radial_row**2
        + scalar_squared.T
    )
    return np.vstack((scalar_x, scalar_xx, potential_x, potential_xx))


def _boundary_residual(left: np.ndarray, right: np.ndarray) -> np.ndarray:
    scalar_left, scalar_x_left, potential_left, potential_x_left = _unpack_state(left)
    scalar_right, scalar_x_right, potential_right, potential_x_right = _unpack_state(
        right
    )
    return np.concatenate(
        (
            scalar_x_left - ODD_DEGREES * scalar_left / INNER_RADIUS,
            potential_x_left[:1],
            potential_x_left[1:]
            - EVEN_DEGREES[1:] * potential_left[1:] / INNER_RADIUS,
            scalar_x_right + (1.0 + 1.0 / OUTER_RADIUS) * scalar_right,
            potential_x_right
            + (EVEN_DEGREES + 1) * potential_right / OUTER_RADIUS,
        )
    )


def _initial_state(radial: np.ndarray) -> np.ndarray:
    values = np.zeros((_STATE_SIZE, radial.size), dtype=np.float64)
    amplitude = np.sqrt(8.0)
    scalar = amplitude * radial * np.exp(-radial)
    values[0] = scalar
    values[_SCALAR_MODE_COUNT] = amplitude * np.exp(-radial) * (1.0 - radial)
    potential_offset = 2 * _SCALAR_MODE_COUNT
    values[potential_offset] = -2.0 / np.sqrt(1.0 + radial**2)
    values[potential_offset + _POTENTIAL_MODE_COUNT] = (
        2.0 * radial / (1.0 + radial**2) ** 1.5
    )
    return values


def _sample_modes(solution: object, target_rho: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    rho = np.asarray(target_rho, dtype=np.float64)
    radial = np.empty_like(rho)
    radial[:-1] = rho[:-1] / (1.0 - rho[:-1])
    radial[-1] = np.inf
    state = np.zeros((_STATE_SIZE, radial.size), dtype=np.float64)

    interior = np.isfinite(radial) & (radial >= INNER_RADIUS) & (radial <= OUTER_RADIUS)
    if np.any(interior):
        state[:, interior] = solution.sol(radial[interior])

    left_scalar, _, left_potential, _ = _unpack_state(solution.y[:, 0])
    origin = radial == 0.0
    if np.any(origin):
        # Every odd scalar mode and every positive even potential mode has a
        # zero regular limit.  The monopole potential has its finite left
        # limit; dropping it would create an O(1) endpoint discontinuity.
        potential_offset = 2 * _SCALAR_MODE_COUNT
        state[potential_offset, origin] = left_potential[0]

    near_origin = np.isfinite(radial) & (radial > 0.0) & (radial < INNER_RADIUS)
    if np.any(near_origin):
        ratio = radial[near_origin] / INNER_RADIUS
        state[:_SCALAR_MODE_COUNT, near_origin] = (
            left_scalar[:, None] * ratio[None, :] ** ODD_DEGREES[:, None]
        )
        potential_offset = 2 * _SCALAR_MODE_COUNT
        state[potential_offset, near_origin] = left_potential[0]
        state[potential_offset + 1 : potential_offset + _POTENTIAL_MODE_COUNT, near_origin] = (
            left_potential[1:, None] * ratio[None, :] ** EVEN_DEGREES[1:, None]
        )

    right_scalar, _, right_potential, _ = _unpack_state(solution.y[:, -1])
    exterior = np.isfinite(radial) & (radial > OUTER_RADIUS)
    if np.any(exterior):
        exterior_radial = radial[exterior]
        state[:_SCALAR_MODE_COUNT, exterior] = (
            right_scalar[:, None]
            * (OUTER_RADIUS / exterior_radial)[None, :]
            * np.exp(-(exterior_radial - OUTER_RADIUS))[None, :]
        )
        potential_offset = 2 * _SCALAR_MODE_COUNT
        state[potential_offset : potential_offset + _POTENTIAL_MODE_COUNT, exterior] = (
            right_potential[:, None]
            * (OUTER_RADIUS / exterior_radial)[None, :] ** (EVEN_DEGREES[:, None] + 1)
        )
    scalar, _, potential, _ = _unpack_state(state)
    return scalar.T, potential.T


def low_mode_l0_initializer(level: GridLevel) -> LowModeInitializerResult:
    """Return one finite low-mode guess on the exact frozen L0 nodal grid."""

    if (
        level.level_id != "L0"
        or level.radial_count != 64
        or level.angular_count != 32
        or not level.solved
    ):
        raise ValueError("low-mode initializer is frozen only for solved L0")

    from scipy.integrate import solve_bvp

    radial = np.geomspace(INNER_RADIUS, OUTER_RADIUS, INITIAL_RADIAL_NODE_COUNT)
    solution = solve_bvp(
        _modal_ode,
        _boundary_residual,
        radial,
        _initial_state(radial),
        tol=BVP_TOLERANCE,
        max_nodes=BVP_MAXIMUM_NODE_COUNT,
        verbose=0,
    )
    if not solution.success or solution.status != 0:
        raise RuntimeError(
            "L0 low-mode initializer BVP did not converge: "
            f"status={solution.status} message={solution.message}"
        )
    if solution.x.size > BVP_MAXIMUM_NODE_COUNT or not np.all(np.isfinite(solution.y)):
        raise RuntimeError("L0 low-mode initializer returned invalid finite-dimensional state")
    boundary_linf = float(
        np.max(np.abs(_boundary_residual(solution.y[:, 0], solution.y[:, -1])))
    )
    maximum_rms_residual = float(np.max(solution.rms_residuals))
    if not np.isfinite(boundary_linf) or not np.isfinite(maximum_rms_residual):
        raise RuntimeError("L0 low-mode initializer diagnostics are nonfinite")

    rho, _ = mapped_nodes(level.radial_count)
    _, z = mapped_nodes(level.angular_count, angular=True)
    assert z is not None
    scalar_modes, potential_modes = _sample_modes(solution, rho)
    scalar_nodal = scalar_modes @ legendre_table(z, ODD_DEGREES).T
    potential_nodal = potential_modes @ legendre_table(z, EVEN_DEGREES).T
    scalar_nodal[0, :] = 0.0
    scalar_nodal[-1, :] = 0.0
    scalar_nodal[:, -1] = 0.0
    potential_nodal[-1, :] = 0.0
    scalar_nodal = canonical_f64(scalar_nodal)
    potential_nodal = canonical_f64(potential_nodal)
    return LowModeInitializerResult(
        scalar_nodal=scalar_nodal,
        potential_nodal=potential_nodal,
        bvp_iteration_count=int(solution.niter),
        bvp_node_count=int(solution.x.size),
        bvp_maximum_rms_residual=maximum_rms_residual,
        bvp_boundary_linf=boundary_linf,
    )
