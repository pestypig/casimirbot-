"""Frozen tensor-collocation Schrodinger--Poisson Newton--Krylov solve."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from contract import GRID_LEVELS, NU_BASE, GridLevel
from raw_evidence import FrozenRawLevelEvidence, freeze_raw_level_evidence
from spectral import (
    canonical_f64,
    differentiation_matrix,
    mapped_nodes,
    project_nodal_to_parity,
    resample_parity_multipoles,
    tensor_interpolate,
)


@dataclass(frozen=True)
class SpectralSolution:
    level: GridLevel
    scalar_nodal: np.ndarray
    potential_nodal: np.ndarray
    scalar_odd: np.ndarray
    potential_even: np.ndarray
    raw_preprojection: FrozenRawLevelEvidence


_NEWTON_SETTINGS = {
    "L0": {"f_tol": 2.0e-11, "maxiter": 70, "inner_maxiter": 90, "outer_k": 8},
    "L1": {"f_tol": 1.0e-11, "maxiter": 60, "inner_maxiter": 100, "outer_k": 8},
    "L2": {"f_tol": 5.0e-12, "maxiter": 60, "inner_maxiter": 110, "outer_k": 8},
}


class SeedNewtonKrylovNoConvergence(RuntimeError):
    """Typed fail-closed terminal state for an exhausted production solve."""


class _SingleCycleLgmresMethod:
    """One Newton solve's explicitly scoped LGMRES augmentation state."""

    def __init__(self, *, inner_m: int, outer_k: int) -> None:
        if inner_m <= 0 or outer_k < 0:
            raise ValueError("invalid LGMRES dimensions")
        self.inner_m = int(inner_m)
        self.outer_k = int(outer_k)
        # SciPy intentionally updates this list between nonlinear iterations.
        # A fresh method object is constructed for every ``solve_level`` call,
        # so no mutable augmentation state crosses independent solves.
        self.outer_vectors: list[tuple[np.ndarray, np.ndarray | None]] = []

    def __call__(
        self,
        operator: object,
        right_hand_side: np.ndarray,
        *,
        rtol: float = 1.0e-5,
        atol: float = 0.0,
        maxiter: int | None = None,
        M: object | None = None,
    ) -> tuple[np.ndarray, int]:
        del maxiter
        from scipy.sparse.linalg import lgmres

        return lgmres(
            operator,
            right_hand_side,
            rtol=rtol,
            atol=atol,
            maxiter=1,
            M=M,
            inner_m=self.inner_m,
            outer_k=self.outer_k,
            outer_v=self.outer_vectors,
            store_outer_Av=False,
            prepend_outer_v=True,
        )


def _lgmres_method(*, inner_m: int, outer_k: int) -> _SingleCycleLgmresMethod:
    return _SingleCycleLgmresMethod(inner_m=inner_m, outer_k=outer_k)


def _pack(scalar: np.ndarray, potential: np.ndarray) -> np.ndarray:
    return np.concatenate((scalar.ravel(order="C"), potential.ravel(order="C")))


def _unpack(vector: np.ndarray, level: GridLevel) -> tuple[np.ndarray, np.ndarray]:
    field_size = level.radial_count * level.angular_count
    flat = np.asarray(vector, dtype=np.float64)
    if flat.size != 2 * field_size:
        raise ValueError("Newton vector size mismatch")
    shape = (level.radial_count, level.angular_count)
    scalar = flat[:field_size].reshape(shape)
    potential = flat[field_size:].reshape(shape)
    return scalar, potential


def residual_fields(
    scalar: np.ndarray,
    potential: np.ndarray,
    level: GridLevel,
) -> tuple[np.ndarray, np.ndarray]:
    """Evaluate the exact nodal row map without singular boundary division."""

    shape = (level.radial_count, level.angular_count)
    u = np.asarray(scalar, dtype=np.float64)
    v = np.asarray(potential, dtype=np.float64)
    if u.shape != shape or v.shape != shape:
        raise ValueError("nodal field shape mismatch")

    rho, _ = mapped_nodes(level.radial_count)
    theta, _ = mapped_nodes(level.angular_count, angular=True)
    d_rho = differentiation_matrix(level.radial_count)
    d_theta = differentiation_matrix(level.angular_count, angular=True)

    u_rho = d_rho @ u
    v_rho = d_rho @ v
    u_rho_rho = d_rho @ u_rho
    v_rho_rho = d_rho @ v_rho
    u_theta = u @ d_theta.T
    v_theta = v @ d_theta.T
    u_theta_theta = u_theta @ d_theta.T
    v_theta_theta = v_theta @ d_theta.T

    schrodinger = np.empty_like(u)
    poisson = np.empty_like(v)

    # Strict interior only: x and sin(theta) are nonzero here. Coordinate
    # boundaries are never evaluated through a raw 1/x, 1/x^2, or cot(theta).
    radial = rho[1:-1]
    one_minus = 1.0 - radial
    x = radial / one_minus
    interior_theta = theta[1:-1]
    cot_theta = np.cos(interior_theta) / np.sin(interior_theta)

    def interior_laplacian(
        first_rho: np.ndarray,
        second_rho: np.ndarray,
        first_theta: np.ndarray,
        second_theta: np.ndarray,
    ) -> np.ndarray:
        radial_first = one_minus[:, None] ** 2 * first_rho[1:-1, 1:-1]
        radial_second = (
            one_minus[:, None] ** 4 * second_rho[1:-1, 1:-1]
            - 2.0 * one_minus[:, None] ** 3 * first_rho[1:-1, 1:-1]
        )
        angular = (
            second_theta[1:-1, 1:-1]
            + cot_theta[None, :] * first_theta[1:-1, 1:-1]
        )
        return (
            radial_second
            + 2.0 * radial_first / x[:, None]
            + angular / x[:, None] ** 2
        )

    u_laplacian = interior_laplacian(
        u_rho,
        u_rho_rho,
        u_theta,
        u_theta_theta,
    )
    v_laplacian = interior_laplacian(
        v_rho,
        v_rho_rho,
        v_theta,
        v_theta_theta,
    )
    interior = np.s_[1:-1, 1:-1]
    schrodinger[interior] = (
        -0.5 * u_laplacian + v[interior] * u[interior] - NU_BASE * u[interior]
    )
    poisson[interior] = v_laplacian - u[interior] ** 2

    # Radial rows have precedence at all four corners.
    schrodinger[0, :] = u[0, :]
    schrodinger[-1, :] = u[-1, :]
    poisson[0, :] = v_rho[0, :]
    poisson[-1, :] = v[-1, :]

    # Angular rows apply only for 1 <= j <= Nr-2.
    schrodinger[1:-1, 0] = u_theta[1:-1, 0]
    schrodinger[1:-1, -1] = u[1:-1, -1]
    poisson[1:-1, 0] = v_theta[1:-1, 0]
    poisson[1:-1, -1] = v_theta[1:-1, -1]
    return schrodinger, poisson


def raw_residual(vector: np.ndarray, level: GridLevel) -> np.ndarray:
    """Frozen pointwise SP equations with exact nodal boundary replacement."""

    scalar, potential = _unpack(vector, level)
    schrodinger, poisson = residual_fields(scalar, potential, level)
    return _pack(schrodinger, poisson)


def _deflated_residual(vector: np.ndarray, level: GridLevel) -> np.ndarray:
    """Avoid attraction to the irrelevant exact-vacuum root.

    Multiplication by a positive scalar leaves every nonzero SP root unchanged.
    The independent verifier evaluates ``raw_residual`` and grants no authority
    to this numerical deflation.
    """

    scalar, _ = _unpack(vector, level)
    scalar_scale = float(np.linalg.norm(scalar) / np.sqrt(scalar.size))
    return raw_residual(vector, level) / max(scalar_scale * scalar_scale, 1.0e-24)


def _analytic_l0_guess(level: GridLevel) -> tuple[np.ndarray, np.ndarray]:
    rho, _ = mapped_nodes(level.radial_count)
    _, z = mapped_nodes(level.angular_count, angular=True)
    assert z is not None
    shape = (level.radial_count, level.angular_count)
    scalar = np.zeros(shape, dtype=np.float64)
    potential = np.zeros_like(scalar)
    interior = slice(1, -1)
    x = rho[interior] / (1.0 - rho[interior])

    # The l=1 tail x*exp(-x), N~8*pi scaling, and -2/x Coulomb field form a
    # physically informed non-vacuum seed. Higher modes are generated by the
    # full pointwise nonlinear equations rather than a modal truncation.
    scalar[interior, :] = (
        np.sqrt(8.0) * x * np.exp(-x)
    )[:, None] * z[None, :]
    potential[0, :] = -2.0
    potential[1:-1, :] = (-2.0 / np.sqrt(1.0 + x**2))[:, None]
    potential[-1, :] = 0.0
    return scalar, potential


def _prolong_guess(previous: SpectralSolution, level: GridLevel) -> tuple[np.ndarray, np.ndarray]:
    target_rho, _ = mapped_nodes(level.radial_count)
    target_theta, _ = mapped_nodes(level.angular_count, angular=True)
    scalar = tensor_interpolate(previous.scalar_nodal, target_rho, target_theta)
    potential = tensor_interpolate(previous.potential_nodal, target_rho, target_theta)
    scalar[0, :] = 0.0
    scalar[-1, :] = 0.0
    scalar[:, -1] = 0.0
    potential[-1, :] = 0.0
    return canonical_f64(scalar), canonical_f64(potential)


def _postproject_fields(
    level: GridLevel,
    scalar: np.ndarray,
    potential: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Project, canonicalize Dirichlet modes, and uniquely resample one solve."""

    scalar_odd = project_nodal_to_parity(scalar, odd=True)
    potential_even = project_nodal_to_parity(potential, odd=False)
    scalar_odd[0, :] = 0.0
    scalar_odd[-1, :] = 0.0
    potential_even[-1, :] = 0.0
    scalar_odd = canonical_f64(scalar_odd)
    potential_even = canonical_f64(potential_even)

    rho, _ = mapped_nodes(level.radial_count)
    scalar_nodal = resample_parity_multipoles(
        scalar_odd,
        rho,
        level.angular_count,
        odd=True,
    )
    potential_nodal = resample_parity_multipoles(
        potential_even,
        rho,
        level.angular_count,
        odd=False,
    )
    scalar_nodal[0, :] = 0.0
    scalar_nodal[-1, :] = 0.0
    scalar_nodal[:, -1] = 0.0
    potential_nodal[-1, :] = 0.0
    return (
        canonical_f64(scalar_nodal),
        canonical_f64(potential_nodal),
        scalar_odd,
        potential_even,
    )


def _phase_and_sanity(
    level: GridLevel,
    scalar_nodal: np.ndarray,
    potential_nodal: np.ndarray,
    scalar_odd: np.ndarray,
    potential_even: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    scalar_nodal = canonical_f64(scalar_nodal)
    potential_nodal = canonical_f64(potential_nodal)
    scalar_odd = canonical_f64(scalar_odd)
    potential_even = canonical_f64(potential_even)
    north_axis = scalar_nodal[:, 0]
    if float(np.max(north_axis)) < abs(float(np.min(north_axis))):
        scalar_nodal *= -1.0
        scalar_odd *= -1.0
        north_axis = scalar_nodal[:, 0]
    scalar_nodal[0, :] = 0.0
    scalar_nodal[-1, :] = 0.0
    scalar_nodal[:, -1] = 0.0
    potential_nodal[-1, :] = 0.0
    scalar_odd[0, :] = 0.0
    scalar_odd[-1, :] = 0.0
    potential_even[-1, :] = 0.0
    scalar_nodal = canonical_f64(scalar_nodal)
    potential_nodal = canonical_f64(potential_nodal)
    scalar_odd = canonical_f64(scalar_odd)
    potential_even = canonical_f64(potential_even)
    north_axis = scalar_nodal[:, 0]

    peak = float(np.max(north_axis))
    if not np.isfinite(peak) or peak <= 1.0e-6:
        raise RuntimeError(f"{level.level_id}: converged to vacuum/trivial scalar")
    derivative = differentiation_matrix(level.radial_count)
    a1 = float((derivative @ scalar_nodal)[0, 0])
    if not np.isfinite(a1) or a1 <= 0.0:
        raise RuntimeError(f"{level.level_id}: north phase condition a1>0 failed")

    if float(np.min(scalar_nodal)) < -1.0e-8 * peak:
        raise RuntimeError(f"{level.level_id}: sampled north lobe has an extra sign change")
    if float(np.max(potential_nodal[1:-1, :])) > 1.0e-8:
        raise RuntimeError(f"{level.level_id}: sampled potential violates V<0")
    return scalar_nodal, potential_nodal, scalar_odd, potential_even


def solve_level(level: GridLevel, previous: SpectralSolution | None) -> SpectralSolution:
    """Solve one frozen production level with matrix-free LGMRES Newton steps."""

    if not level.solved or level.level_id not in _NEWTON_SETTINGS:
        raise ValueError("AUDIT or unknown level cannot be solved")
    if previous is None:
        if level.level_id != "L0":
            raise ValueError("only L0 may start without a prolongated solution")
        from low_mode_initializer import low_mode_l0_initializer

        initializer = low_mode_l0_initializer(level)
        scalar = initializer.scalar_nodal
        potential = initializer.potential_nodal
    else:
        scalar, potential = _prolong_guess(previous, level)
    initial = _pack(scalar, potential)

    # Imported here so source-level self-tests need only NumPy. SciPy's
    # newton_krylov builds Jacobian-vector products by finite differences and
    # LGMRES never materializes a dense Jacobian.
    from scipy.optimize import NoConvergence, newton_krylov

    settings = _NEWTON_SETTINGS[level.level_id]
    method = _lgmres_method(
        # Preserve the frozen numeric value while binding it to SciPy's actual
        # Arnoldi-dimension parameter.  Passing this as ``inner_maxiter`` to
        # ``newton_krylov`` instead would be overwritten to one outer cycle.
        inner_m=int(settings["inner_maxiter"]),
        outer_k=int(settings["outer_k"]),
    )
    try:
        result = newton_krylov(
            lambda vector: _deflated_residual(vector, level),
            initial,
            method=method,
            inner_maxiter=1,
            maxiter=int(settings["maxiter"]),
            f_tol=float(settings["f_tol"]),
            line_search="armijo",
            verbose=False,
        )
    except NoConvergence as failure:
        raise SeedNewtonKrylovNoConvergence(
            f"{level.level_id}: Newton-Krylov did not converge after "
            f"{int(settings['maxiter'])} iterations"
        ) from failure

    scalar, potential = _unpack(np.asarray(result, dtype=np.float64), level)
    # The v3 postprojection policy makes these exact unpacked binary64 bytes
    # the subject of independent P replay.  Snapshot them before any NumPy
    # projection, mask, phase choice, reconstruction, or value normalization.
    raw_preprojection = freeze_raw_level_evidence(
        level.level_id,
        scalar,
        potential,
    )
    scalar_nodal, potential_nodal, scalar_odd, potential_even = _postproject_fields(
        level,
        scalar,
        potential,
    )
    scalar_nodal, potential_nodal, scalar_odd, potential_even = _phase_and_sanity(
        level,
        scalar_nodal,
        potential_nodal,
        scalar_odd,
        potential_even,
    )
    return SpectralSolution(
        level,
        scalar_nodal,
        potential_nodal,
        scalar_odd,
        potential_even,
        raw_preprojection,
    )


def solve_production_hierarchy() -> tuple[SpectralSolution, SpectralSolution, SpectralSolution]:
    accepted: list[SpectralSolution] = []
    previous: SpectralSolution | None = None
    for level in GRID_LEVELS[:3]:
        solution = solve_level(level, previous)
        accepted.append(solution)
        previous = solution
    return accepted[0], accepted[1], accepted[2]
