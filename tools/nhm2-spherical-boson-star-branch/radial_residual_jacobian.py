"""Analytic local Jacobian for the frozen spherical radial EKG rows.

This module differentiates the exact pointwise rows implemented by
``radial_residual.py`` with respect to the local jet variables.  It does not
choose a grid, assemble a discrete Jacobian, solve a branch, read producer
arrays, or confer replay/acceptance authority.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

from binary64_environment import nearest_binary64

from radial_residual import RadialJet, evaluate_spherical_radial_residual


ANALYTIC_JACOBIAN_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_ekg_local_jacobian/v1"
)
LOCAL_VARIABLE_ORDER: Final[tuple[str, ...]] = (
    "F0",
    "F0_prime",
    "F0_double_prime",
    "F1",
    "F1_prime",
    "F1_double_prime",
    "varphi",
    "varphi_prime",
    "varphi_double_prime",
    "w",
)
LOCAL_RESIDUAL_ORDER: Final[tuple[str, ...]] = (
    "einstein_Et_t",
    "einstein_Etheta_theta",
    "klein_gordon",
    "einstein_Ex_x",
)


@dataclass(frozen=True, slots=True)
class SphericalRadialResidualJacobian:
    rows: tuple[
        tuple[float, float, float, float, float, float, float, float, float, float],
        tuple[float, float, float, float, float, float, float, float, float, float],
        tuple[float, float, float, float, float, float, float, float, float, float],
        tuple[float, float, float, float, float, float, float, float, float, float],
    ]
    variable_order: tuple[str, ...] = LOCAL_VARIABLE_ORDER
    residual_order: tuple[str, ...] = LOCAL_RESIDUAL_ORDER
    analytic_form_version: str = ANALYTIC_JACOBIAN_VERSION
    calculation_implemented: bool = True
    discrete_jacobian_implemented: bool = False
    branch_solver_implemented: bool = False
    candidate_executed: bool = False
    replay_authority: bool = False
    diagnostic_pass_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _canonical_finite(name: str, value: float) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} is not finite")
    return 0.0 if value == 0.0 else value


@nearest_binary64
def evaluate_spherical_radial_residual_jacobian(
    *,
    x: float,
    F0: RadialJet,
    F1: RadialJet,
    varphi: RadialJet,
    w: float,
) -> SphericalRadialResidualJacobian:
    """Return d(Et_t,Etheta_theta,KG,Ex_x)/d(local jet,w)."""

    # Reuse the frozen residual boundary for exact-type, domain, exponential,
    # and finite-arithmetic admission.  No values from its output are trusted
    # as derivatives.
    evaluate_spherical_radial_residual(x=x, F0=F0, F1=F1, varphi=varphi, w=w)

    x_value = float(x)
    w_value = float(w)
    inverse_x = 1.0 / x_value
    exp_m2f0 = math.exp(-2.0 * F0.value)
    exp_m2f1 = math.exp(-2.0 * F1.value)

    ap = F0.dx
    bp = F1.dx
    bpp = F1.dxx
    p = varphi.value
    pp = varphi.dx
    ppp = varphi.dxx

    time_gradient = exp_m2f0 * w_value * w_value * p * p
    radial_gradient = exp_m2f1 * pp * pp
    gt = exp_m2f1 * (2.0 * bpp + bp * bp + 4.0 * bp * inverse_x)
    gx = exp_m2f1 * (
        2.0 * ap * bp + bp * bp + 2.0 * (ap + bp) * inverse_x
    )
    gtheta = exp_m2f1 * (
        ap * ap + F0.dxx + bpp + (ap + bp) * inverse_x
    )
    radial_box = ppp + (ap + bp + 2.0 * inverse_x) * pp

    rows = (
        (
            -2.0 * time_gradient,
            0.0,
            0.0,
            -2.0 * gt - 2.0 * radial_gradient,
            exp_m2f1 * (2.0 * bp + 4.0 * inverse_x),
            2.0 * exp_m2f1,
            2.0 * exp_m2f0 * w_value * w_value * p + 2.0 * p,
            2.0 * exp_m2f1 * pp,
            0.0,
            2.0 * exp_m2f0 * w_value * p * p,
        ),
        (
            2.0 * time_gradient,
            exp_m2f1 * (2.0 * ap + inverse_x),
            exp_m2f1,
            -2.0 * gtheta - 2.0 * radial_gradient,
            exp_m2f1 * inverse_x,
            exp_m2f1,
            -2.0 * exp_m2f0 * w_value * w_value * p + 2.0 * p,
            2.0 * exp_m2f1 * pp,
            0.0,
            -2.0 * exp_m2f0 * w_value * p * p,
        ),
        (
            -2.0 * exp_m2f0 * w_value * w_value * p,
            exp_m2f1 * pp,
            0.0,
            -2.0 * exp_m2f1 * radial_box,
            exp_m2f1 * pp,
            0.0,
            exp_m2f0 * w_value * w_value - 1.0,
            exp_m2f1 * (ap + bp + 2.0 * inverse_x),
            exp_m2f1,
            2.0 * exp_m2f0 * w_value * p,
        ),
        (
            2.0 * time_gradient,
            exp_m2f1 * (2.0 * bp + 2.0 * inverse_x),
            0.0,
            -2.0 * gx + 2.0 * radial_gradient,
            exp_m2f1 * (2.0 * ap + 2.0 * bp + 2.0 * inverse_x),
            0.0,
            -2.0 * exp_m2f0 * w_value * w_value * p + 2.0 * p,
            -2.0 * exp_m2f1 * pp,
            0.0,
            -2.0 * exp_m2f0 * w_value * p * p,
        ),
    )
    canonical_rows = tuple(
        tuple(
            _canonical_finite(f"jacobian[{row_index},{column_index}]", value)
            for column_index, value in enumerate(row)
        )
        for row_index, row in enumerate(rows)
    )
    return SphericalRadialResidualJacobian(rows=canonical_rows)  # type: ignore[arg-type]


__all__ = [
    "ANALYTIC_JACOBIAN_VERSION",
    "LOCAL_RESIDUAL_ORDER",
    "LOCAL_VARIABLE_ORDER",
    "SphericalRadialResidualJacobian",
    "evaluate_spherical_radial_residual_jacobian",
]
