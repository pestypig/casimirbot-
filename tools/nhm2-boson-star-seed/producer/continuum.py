"""Piecewise L2 continuum, numerical Coulomb tail, scaling, and array sampling.

The tail solve supplies a deterministic producer candidate for independent
interval replay.  Its floating-point residual and Coulomb fixed point do not
constitute the required MPFR proof or any admission authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np

from contract import AMPLITUDES, GRID_LEVELS, RHO_TAIL, X_TAIL, GridLevel
from solver import SpectralSolution
from spectral import (
    canonical_f64,
    differentiation_matrix,
    interpolation_matrix,
    legendre_table,
    mapped_nodes,
    odd_legendre_quotient_table,
    parity_degrees,
    parity_quadrature,
    radial_interpolate,
    reconstruct,
    resample_parity_multipoles,
)


_TAIL_MODES = 64
_TAIL_RADIAL_ORDER = 16
_TAIL_RADIAL_COUNT = _TAIL_RADIAL_ORDER + 1
_TAIL_UNKNOWN_COUNT_PER_FIELD = _TAIL_RADIAL_COUNT * _TAIL_MODES
_TAIL_RAW_ACCEPTANCE = 2.0e-8


def _gauss_on_unit_interval(order: int) -> tuple[np.ndarray, np.ndarray]:
    nodes, weights = np.polynomial.legendre.leggauss(order)
    return 0.5 * (nodes + 1.0), 0.5 * weights


def _project(values: np.ndarray, projector: np.ndarray) -> np.ndarray:
    return np.asarray(values, dtype=np.float64) @ projector.T


def _radial_value_and_x_derivative(
    multipoles: np.ndarray,
    rho: float,
) -> tuple[np.ndarray, np.ndarray]:
    source_rho, _ = mapped_nodes(multipoles.shape[0])
    row = interpolation_matrix(source_rho, np.asarray([rho], dtype=np.float64))
    value = (row @ multipoles)[0]
    rho_derivative_nodes = differentiation_matrix(multipoles.shape[0]) @ multipoles
    rho_derivative = (row @ rho_derivative_nodes)[0]
    return value, (1.0 - rho) ** 2 * rho_derivative


@dataclass(frozen=True)
class JoinData:
    scalar_value_odd: np.ndarray
    scalar_x_odd: np.ndarray
    potential_value_even: np.ndarray
    potential_x_even: np.ndarray


@dataclass(frozen=True)
class TailModel:
    coulomb_c: float
    exponent_p: float
    scalar_correction: np.ndarray
    potential_correction: np.ndarray
    join: JoinData
    scaled_residual_linf: float

    def _lifts_at(self, z: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        even_basis = legendre_table(z, parity_degrees(_TAIL_MODES, False))
        quotient_basis = odd_legendre_quotient_table(z, _TAIL_MODES)
        v_join = self.join.potential_value_even @ even_basis.T
        vx_join = self.join.potential_x_even @ even_basis.T
        quotient = self.join.scalar_value_odd @ quotient_basis.T
        quotient_x = self.join.scalar_x_odd @ quotient_basis.T
        envelope = math.exp(-X_TAIL + self.exponent_p * math.log(X_TAIL))
        h_join = quotient / envelope
        logarithmic_derivative = self.exponent_p / X_TAIL - 1.0
        h_s_join = -X_TAIL * (
            quotient_x / envelope - logarithmic_derivative * h_join
        )
        q_join = X_TAIL**3 * (v_join + self.coulomb_c / X_TAIL)
        q_x_join = (
            3.0 * X_TAIL**2 * v_join
            + X_TAIL**3 * vx_join
            + 2.0 * self.coulomb_c * X_TAIL
        )
        q_s_join = -X_TAIL * q_x_join
        return h_join, h_s_join, q_join, q_s_join

    def _hq_derivatives(
        self,
        s: np.ndarray,
        z: np.ndarray,
    ) -> tuple[np.ndarray, ...]:
        h_join, h_s_join, q_join, q_s_join = self._lifts_at(z)
        even_basis = legendre_table(z, parity_degrees(_TAIL_MODES, False))
        powers = s[:, None] ** np.arange(_TAIL_RADIAL_COUNT, dtype=np.float64)[None, :]
        first_powers = np.zeros_like(powers)
        second_powers = np.zeros_like(powers)
        if _TAIL_RADIAL_COUNT > 1:
            n = np.arange(1, _TAIL_RADIAL_COUNT, dtype=np.float64)
            first_powers[:, 1:] = n[None, :] * s[:, None] ** (n[None, :] - 1.0)
        if _TAIL_RADIAL_COUNT > 2:
            n2 = np.arange(2, _TAIL_RADIAL_COUNT, dtype=np.float64)
            second_powers[:, 2:] = (
                n2[None, :]
                * (n2[None, :] - 1.0)
                * s[:, None] ** (n2[None, :] - 2.0)
            )

        scalar_modes = powers @ self.scalar_correction
        scalar_s_modes = first_powers @ self.scalar_correction
        scalar_ss_modes = second_powers @ self.scalar_correction
        potential_modes = powers @ self.potential_correction
        potential_s_modes = first_powers @ self.potential_correction
        potential_ss_modes = second_powers @ self.potential_correction
        correction_h = scalar_modes @ even_basis.T
        correction_hs = scalar_s_modes @ even_basis.T
        correction_hss = scalar_ss_modes @ even_basis.T
        correction_q = potential_modes @ even_basis.T
        correction_qs = potential_s_modes @ even_basis.T
        correction_qss = potential_ss_modes @ even_basis.T

        one_minus = 1.0 - s[:, None]
        h = h_join[None, :] + (s[:, None] - 1.0) * h_s_join[None, :] + one_minus**2 * correction_h
        hs = h_s_join[None, :] - 2.0 * one_minus * correction_h + one_minus**2 * correction_hs
        hss = 2.0 * correction_h - 4.0 * one_minus * correction_hs + one_minus**2 * correction_hss
        q = q_join[None, :] + (s[:, None] - 1.0) * q_s_join[None, :] + one_minus**2 * correction_q
        qs = q_s_join[None, :] - 2.0 * one_minus * correction_q + one_minus**2 * correction_qs
        qss = 2.0 * correction_q - 4.0 * one_minus * correction_qs + one_minus**2 * correction_qss
        return h, hs, hss, q, qs, qss

    def evaluate(self, x: np.ndarray, z: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        radial = np.asarray(x, dtype=np.float64)
        angular = np.asarray(z, dtype=np.float64)
        result_u = np.zeros((radial.size, angular.size), dtype=np.float64)
        result_v = np.zeros_like(result_u)
        finite = np.isfinite(radial)
        if not np.any(finite):
            return result_u, result_v
        active_x = radial[finite]
        if np.any(active_x < X_TAIL):
            raise ValueError("TailModel cannot evaluate x<32")
        s = X_TAIL / active_x
        h, _, _, q, _, _ = self._hq_derivatives(s, angular)
        log_envelope = -active_x + self.exponent_p * np.log(active_x)
        envelope = np.exp(log_envelope)
        result_u[finite, :] = envelope[:, None] * angular[None, :] * h
        result_v[finite, :] = -self.coulomb_c / active_x[:, None] + q / active_x[:, None] ** 3
        return canonical_f64(result_u), canonical_f64(result_v)


class PiecewiseContinuum:
    def __init__(self, l2: SpectralSolution, tail: TailModel):
        self.l2 = l2
        self.tail = tail

    def evaluate(self, x: np.ndarray, z: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        radial = np.asarray(x, dtype=np.float64)
        angular = np.asarray(z, dtype=np.float64)
        scalar = np.zeros((radial.size, angular.size), dtype=np.float64)
        potential = np.zeros_like(scalar)
        interior = np.isfinite(radial) & (radial <= X_TAIL)
        if np.any(interior):
            rho = radial[interior] / (1.0 + radial[interior])
            u_modes = radial_interpolate(self.l2.scalar_odd, rho)
            v_modes = radial_interpolate(self.l2.potential_even, rho)
            scalar[interior, :] = reconstruct(u_modes, angular, odd=True)
            potential[interior, :] = reconstruct(v_modes, angular, odd=False)
        exterior = np.isfinite(radial) & (radial > X_TAIL)
        if np.any(exterior):
            tail_u, tail_v = self.tail.evaluate(radial[exterior], angular)
            scalar[exterior, :] = tail_u
            potential[exterior, :] = tail_v
        return canonical_f64(scalar), canonical_f64(potential)

    def evaluate_scaled(
        self,
        x: np.ndarray,
        z: np.ndarray,
        amplitude: float,
        base_amplitude: float,
    ) -> tuple[np.ndarray, np.ndarray]:
        lam = math.sqrt(amplitude / base_amplitude)
        if not (0.0 < lam < 1.0):
            raise RuntimeError("frozen target scaling requires 0<lambda<1")
        scalar, potential = self.evaluate(lam * np.asarray(x, dtype=np.float64), z)
        return canonical_f64(lam * lam * scalar), canonical_f64(lam * lam * potential)


class _TailCollocation:
    """Square finite-dimensional tail system used only to generate a candidate."""

    def __init__(self, join: JoinData, interior_particle_number: float):
        self.join = join
        self.interior_particle_number = interior_particle_number
        self.s_nodes, _ = _gauss_on_unit_interval(_TAIL_RADIAL_COUNT)
        self.z_nodes, _ = _angular_rule(_TAIL_MODES)
        _, odd_basis, even_basis, projectors = parity_quadrature(_TAIL_MODES)
        self.odd_basis = odd_basis
        self.even_basis = even_basis
        self.odd_projector = projectors[0]
        self.even_projector = projectors[1]

    def unpack(self, vector: np.ndarray) -> tuple[float, np.ndarray, np.ndarray]:
        flat = np.asarray(vector, dtype=np.float64)
        expected = 1 + 2 * _TAIL_UNKNOWN_COUNT_PER_FIELD
        if flat.size != expected:
            raise ValueError("tail Newton vector size mismatch")
        c = float(flat[0])
        offset = 1
        scalar = flat[offset : offset + _TAIL_UNKNOWN_COUNT_PER_FIELD].reshape(
            (_TAIL_RADIAL_COUNT, _TAIL_MODES)
        )
        potential = flat[offset + _TAIL_UNKNOWN_COUNT_PER_FIELD :].reshape(
            (_TAIL_RADIAL_COUNT, _TAIL_MODES)
        )
        return c, scalar, potential

    def model(self, vector: np.ndarray, residual: float = math.inf) -> TailModel:
        c, scalar, potential = self.unpack(vector)
        return TailModel(c, c - 1.0, scalar, potential, self.join, residual)

    def residual(self, vector: np.ndarray) -> np.ndarray:
        model = self.model(vector)
        c = model.coulomb_c
        if not math.isfinite(c):
            return np.full_like(vector, 1.0e100)
        s = self.s_nodes
        x = X_TAIL / s
        sx = -(s * s) / X_TAIL
        sxx = 2.0 * s**3 / X_TAIL**2
        h, hs, hss, q, qs, qss = model._hq_derivatives(s, self.z_nodes)
        u_hat = self.z_nodes[None, :] * h
        u_hat_s = self.z_nodes[None, :] * hs
        u_hat_ss = self.z_nodes[None, :] * hss
        p = model.exponent_p
        log_derivative = p / x - 1.0
        envelope_second = log_derivative**2 - p / x**2
        ux_over_envelope = log_derivative[:, None] * u_hat + sx[:, None] * u_hat_s
        uxx_over_envelope = (
            envelope_second[:, None] * u_hat
            + 2.0 * log_derivative[:, None] * sx[:, None] * u_hat_s
            + sx[:, None] ** 2 * u_hat_ss
            + sxx[:, None] * u_hat_s
        )

        u_hat_modes = _project(u_hat, self.odd_projector)
        angular_u = (
            u_hat_modes
            * (
                -parity_degrees(_TAIL_MODES, True)
                * (parity_degrees(_TAIL_MODES, True) + 1)
            )[None, :]
        ) @ self.odd_basis.T
        potential_value = -c / x[:, None] + q / x[:, None] ** 3
        schrodinger_scaled = (
            -0.5
            * (
                uxx_over_envelope
                + 2.0 * ux_over_envelope / x[:, None]
                + angular_u / x[:, None] ** 2
            )
            + potential_value * u_hat
            + 0.5 * u_hat
        )

        q_modes = _project(q, self.even_projector)
        angular_q = (
            q_modes
            * (
                -parity_degrees(_TAIL_MODES, False)
                * (parity_degrees(_TAIL_MODES, False) + 1)
            )[None, :]
        ) @ self.even_basis.T
        poisson_scaled = (
            6.0 * q
            - 4.0 * x[:, None] * qs * sx[:, None]
            + x[:, None] ** 2 * qss * sx[:, None] ** 2
            + x[:, None] ** 2 * qs * sxx[:, None]
            + angular_q
        )
        log_envelope = -x + p * np.log(x)
        source_scaled = x[:, None] ** 5 * np.exp(2.0 * log_envelope)[:, None] * u_hat**2
        poisson_scaled -= source_scaled

        rs_modes = _project(schrodinger_scaled, self.odd_projector)
        rp_modes = _project(poisson_scaled, self.even_projector)
        total_n = self.interior_particle_number + _tail_particle_number(model)
        coulomb_residual = c - total_n / (4.0 * math.pi)
        return np.concatenate(
            (
                np.asarray([coulomb_residual], dtype=np.float64),
                rs_modes.ravel(order="C"),
                rp_modes.ravel(order="C"),
            )
        )


def _angular_rule(mode_count: int) -> tuple[np.ndarray, np.ndarray]:
    order = 3 * mode_count + 8
    z, weights = _gauss_on_unit_interval(order)
    return z, weights


def _interior_particle_number(l2: SpectralSolution) -> float:
    x_nodes, x_weights = _gauss_on_unit_interval(192)
    x = X_TAIL * x_nodes
    x_weights = X_TAIL * x_weights
    z, z_weights = _angular_rule(48)
    rho = x / (1.0 + x)
    scalar_modes = radial_interpolate(l2.scalar_odd, rho)
    scalar = reconstruct(scalar_modes, z, odd=True)
    return float(
        4.0
        * math.pi
        * np.sum(x_weights[:, None] * z_weights[None, :] * x[:, None] ** 2 * scalar**2)
    )


def _tail_particle_number(model: TailModel) -> float:
    s, s_weights = _gauss_on_unit_interval(96)
    z, z_weights = _angular_rule(48)
    x = X_TAIL / s
    scalar, _ = model.evaluate(x, z)
    jacobian = X_TAIL**3 / s**4
    return float(
        4.0
        * math.pi
        * np.sum(s_weights[:, None] * z_weights[None, :] * jacobian[:, None] * scalar**2)
    )


def _join_data(l2: SpectralSolution) -> JoinData:
    scalar_value, scalar_x = _radial_value_and_x_derivative(l2.scalar_odd, RHO_TAIL)
    potential_value, potential_x = _radial_value_and_x_derivative(l2.potential_even, RHO_TAIL)
    scalar_padded = np.zeros(_TAIL_MODES, dtype=np.float64)
    scalar_x_padded = np.zeros_like(scalar_padded)
    potential_padded = np.zeros_like(scalar_padded)
    potential_x_padded = np.zeros_like(scalar_padded)
    count = l2.scalar_odd.shape[1]
    scalar_padded[:count] = scalar_value
    scalar_x_padded[:count] = scalar_x
    potential_padded[:count] = potential_value
    potential_x_padded[:count] = potential_x
    return JoinData(scalar_padded, scalar_x_padded, potential_padded, potential_x_padded)


def solve_tail_candidate(l2: SpectralSolution) -> TailModel:
    """Solve the finite C1-lifted tail and Coulomb consistency simultaneously."""

    interior_n = _interior_particle_number(l2)
    collocation = _TailCollocation(_join_data(l2), interior_n)
    initial = np.zeros(1 + 2 * _TAIL_UNKNOWN_COUNT_PER_FIELD, dtype=np.float64)
    initial[0] = max(interior_n / (4.0 * math.pi), 2.0**-32)

    from scipy.optimize import NoConvergence, newton_krylov

    try:
        result = newton_krylov(
            collocation.residual,
            initial,
            method="lgmres",
            inner_maxiter=100,
            outer_k=8,
            maxiter=55,
            f_tol=2.0e-10,
            line_search="armijo",
            verbose=False,
        )
    except NoConvergence as failure:
        if not failure.args:
            raise RuntimeError("finite Coulomb-tail Newton-Krylov solve failed") from failure
        result = np.asarray(failure.args[0], dtype=np.float64)
    residual = collocation.residual(np.asarray(result, dtype=np.float64))
    residual_linf = float(np.max(np.abs(residual)))
    model = collocation.model(np.asarray(result, dtype=np.float64), residual_linf)
    if not (2.0**-32 < model.coulomb_c < 2.0**16):
        raise RuntimeError("numerical Coulomb candidate left frozen admissible domain")
    if not np.isfinite(residual_linf) or residual_linf > _TAIL_RAW_ACCEPTANCE:
        raise RuntimeError(
            f"finite Coulomb-tail residual {residual_linf:.17g} exceeds producer cutoff"
        )
    _tail_candidate_sanity(model)
    return model


def _tail_candidate_sanity(model: TailModel) -> None:
    """Floating-point precheck only; directed interval proof is still mandatory."""

    s = np.linspace(0.0, 1.0, 257, dtype=np.float64)
    _, z = mapped_nodes(129, angular=True)
    assert z is not None
    h, hs, _, _, _, _ = model._hq_derivatives(s, z)
    inverse_x = s / X_TAIL
    log_derivative = model.exponent_p * inverse_x - 1.0
    s_x = -(s * s) / X_TAIL
    d_tail = -(log_derivative[:, None] * h + s_x[:, None] * hs)
    if float(np.min(h)) <= 0.0:
        raise RuntimeError("floating tail candidate has nonpositive regular scalar quotient")
    if float(np.min(d_tail)) <= 0.0:
        raise RuntimeError("floating tail candidate is not radially decreasing")
    sample_x = np.concatenate((np.asarray([X_TAIL]), X_TAIL / s[1:-1]))
    _, potential = model.evaluate(sample_x, np.asarray([1.0, 0.5, 0.0]))
    if float(np.max(potential)) >= 0.0:
        raise RuntimeError("floating tail candidate has a nonnegative finite potential")


def numerical_axis_peak(continuum: PiecewiseContinuum) -> tuple[float, float]:
    """Numerically locate the interior axis maximum used for candidate scaling.

    The independent MPFR stationary-cover replay must later prove uniqueness and
    select the authoritative interval midpoint; this result has no proof role.
    """

    from scipy.optimize import brentq

    l2 = continuum.l2
    rho_nodes, _ = mapped_nodes(l2.level.radial_count)
    derivative_modes = differentiation_matrix(l2.level.radial_count) @ l2.scalar_odd

    def axis_value(rho: float) -> float:
        modes = radial_interpolate(l2.scalar_odd, np.asarray([rho]))[0]
        return float(np.sum(modes))

    def axis_derivative(rho: float) -> float:
        modes = radial_interpolate(derivative_modes, np.asarray([rho]))[0]
        return float(np.sum(modes))

    sample = np.linspace(0.0, RHO_TAIL, 4097, dtype=np.float64)
    derivative = np.sum(radial_interpolate(derivative_modes, sample), axis=1)
    candidates: list[float] = [0.0, RHO_TAIL]
    for index in range(sample.size - 1):
        left = float(sample[index])
        right = float(sample[index + 1])
        if derivative[index] == 0.0:
            candidates.append(left)
        elif derivative[index] * derivative[index + 1] < 0.0:
            candidates.append(
                float(brentq(axis_derivative, left, right, xtol=5.0e-15, rtol=8.9e-16))
            )
    values = np.asarray([axis_value(rho) for rho in candidates])
    index = int(np.argmax(values))
    peak_rho = float(candidates[index])
    amplitude = float(values[index])
    if not (0.0 < peak_rho < RHO_TAIL) or amplitude <= max(AMPLITUDES):
        raise RuntimeError("numerical L2 peak cannot support frozen target scaling")
    check_rho = np.linspace(0.0, RHO_TAIL, 1025, dtype=np.float64)
    _, check_z = mapped_nodes(257, angular=True)
    assert check_z is not None
    check_modes = radial_interpolate(l2.scalar_odd, check_rho)
    check_values = reconstruct(check_modes, check_z, odd=True)
    if float(np.min(check_values)) < -1.0e-10 * amplitude:
        raise RuntimeError("numerical L2 continuum has an extra north-domain sign change")
    if float(np.max(check_values)) > amplitude * (1.0 + 1.0e-11):
        raise RuntimeError("numerical L2 sampling contradicts the selected axis peak")
    # Keep the source variable used above live in the contract-focused path;
    # the exact source nodes are otherwise only implicit in interpolation.
    if rho_nodes[0] != 0.0 or rho_nodes[-1] != 1.0:
        raise RuntimeError("radial endpoint drift")
    return amplitude, peak_rho


def level_base_arrays(
    level: GridLevel,
    solution: SpectralSolution | None,
    continuum: PiecewiseContinuum,
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    rho, _ = mapped_nodes(level.radial_count)
    theta, z = mapped_nodes(level.angular_count, angular=True)
    assert z is not None
    x = np.empty_like(rho)
    x[:-1] = rho[:-1] / (1.0 - rho[:-1])
    x[-1] = np.inf
    if solution is not None:
        scalar_multipoles = canonical_f64(solution.scalar_odd)
        potential_multipoles = canonical_f64(solution.potential_even)
        scalar = canonical_f64(solution.scalar_nodal)
        potential = canonical_f64(solution.potential_nodal)
        expected_scalar = resample_parity_multipoles(
            scalar_multipoles,
            rho,
            level.angular_count,
            odd=True,
        )
        expected_potential = resample_parity_multipoles(
            potential_multipoles,
            rho,
            level.angular_count,
            odd=False,
        )
        expected_scalar[0, :] = 0.0
        expected_scalar[-1, :] = 0.0
        expected_scalar[:, -1] = 0.0
        expected_potential[-1, :] = 0.0
        if not np.array_equal(scalar, expected_scalar) or not np.array_equal(
            potential,
            expected_potential,
        ):
            raise RuntimeError("accepted nodal fields differ from post-projection resampling")
    else:
        scalar, potential = continuum.evaluate(x, z)
        mode_count = level.angular_count // 2
        quad_z, _, _, projectors = parity_quadrature(mode_count)
        scalar_quad, potential_quad = continuum.evaluate(x, quad_z)
        scalar_multipoles = _project(scalar_quad, projectors[0])
        potential_multipoles = _project(potential_quad, projectors[1])

    scalar = canonical_f64(scalar)
    potential = canonical_f64(potential)
    scalar_multipoles = canonical_f64(scalar_multipoles)
    potential_multipoles = canonical_f64(potential_multipoles)
    scalar[0, :] = 0.0
    scalar[-1, :] = 0.0
    scalar[:, -1] = 0.0
    potential[-1, :] = 0.0
    scalar_multipoles[0, :] = 0.0
    scalar_multipoles[-1, :] = 0.0
    potential_multipoles[-1, :] = 0.0
    return rho, theta, scalar, potential, scalar_multipoles, potential_multipoles


def target_arrays(
    level: GridLevel,
    continuum: PiecewiseContinuum,
    base_amplitude: float,
) -> tuple[np.ndarray, np.ndarray]:
    rho, _ = mapped_nodes(level.radial_count)
    _, z = mapped_nodes(level.angular_count, angular=True)
    assert z is not None
    x = np.empty_like(rho)
    x[:-1] = rho[:-1] / (1.0 - rho[:-1])
    x[-1] = np.inf
    scalar_targets = np.empty(
        (len(AMPLITUDES), level.radial_count, level.angular_count), dtype=np.float64
    )
    potential_targets = np.empty_like(scalar_targets)
    for index, amplitude in enumerate(AMPLITUDES):
        scalar, potential = continuum.evaluate_scaled(x, z, amplitude, base_amplitude)
        scalar[0, :] = 0.0
        scalar[-1, :] = 0.0
        scalar[:, -1] = 0.0
        potential[-1, :] = 0.0
        scalar_targets[index] = scalar
        potential_targets[index] = potential
    return canonical_f64(scalar_targets), canonical_f64(potential_targets)


@dataclass(frozen=True)
class ProducerFields:
    continuum: PiecewiseContinuum
    base_amplitude: float
    peak_rho: float
    level_arrays: dict[str, tuple[np.ndarray, ...]]


def assemble_fields(
    l0: SpectralSolution,
    l1: SpectralSolution,
    l2: SpectralSolution,
) -> ProducerFields:
    tail = solve_tail_candidate(l2)
    continuum = PiecewiseContinuum(l2, tail)
    base_amplitude, peak_rho = numerical_axis_peak(continuum)
    solutions = {"L0": l0, "L1": l1, "L2": l2, "AUDIT": None}
    arrays: dict[str, tuple[np.ndarray, ...]] = {}
    for level in GRID_LEVELS:
        rho, theta, scalar, potential, scalar_multipoles, potential_multipoles = level_base_arrays(
            level, solutions[level.level_id], continuum
        )
        scalar_targets, potential_targets = target_arrays(level, continuum, base_amplitude)
        arrays[level.level_id] = (
            canonical_f64(rho),
            canonical_f64(theta),
            scalar,
            potential,
            scalar_targets,
            potential_targets,
            scalar_multipoles,
            potential_multipoles,
        )
        if level.level_id == "AUDIT":
            if np.any(scalar < 0.0) or np.any(scalar_targets < 0.0):
                raise RuntimeError("AUDIT scalar candidate contains a negative value")
            if np.any(potential[:-1, :] >= 0.0) or np.any(
                potential_targets[:, :-1, :] >= 0.0
            ):
                raise RuntimeError("AUDIT finite-domain potential candidate is not strictly negative")
    return ProducerFields(continuum, base_amplitude, peak_rho, arrays)
