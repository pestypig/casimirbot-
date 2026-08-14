"""Candidate-bound even origin series through x^4 for spherical radial EKG.

The coefficients are obtained by substituting even power series into the
frozen cancellation-free Et_t, Etheta_theta, and Klein-Gordon rows.  This is a
finite symbolic initializer/replay kernel only; it does not prove the all-order
series remainder, choose continuation data, or solve the branch.
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Final

from binary64_environment import nearest_binary64


ORIGIN_SERIES_VERSION: Final[str] = (
    "nhm2_spherical_boson_star_1s_radial_ekg_origin_series_x4/v1"
)
TARGET_ORIGIN_AMPLITUDE: Final[float] = 2.0**-10


@dataclass(frozen=True, slots=True)
class EvenSeriesX4:
    x0: float
    x2: float
    x4: float


@dataclass(frozen=True, slots=True)
class SphericalRadialOriginSeriesX4:
    F0: EvenSeriesX4
    F1: EvenSeriesX4
    varphi: EvenSeriesX4
    w: float
    redshifted_frequency_square_at_origin: float
    analytic_form_version: str = ORIGIN_SERIES_VERSION
    calculation_implemented: bool = True
    all_order_recurrence_implemented: bool = False
    remainder_bound_implemented: bool = False
    continuation_schedule_selected: bool = False
    branch_solver_implemented: bool = False
    candidate_executed: bool = False
    origin_replay_authority: bool = False
    branch_authority: bool = False
    physical_authority: bool = False
    propulsion_authority: bool = False
    transport_authority: bool = False
    target_or_residual_array_input_read: bool = False
    declared_lever_tensor_read: bool = False


def _finite(name: str, value: object) -> float:
    if type(value) not in (int, float):
        raise ValueError(f"{name} must be an exact finite real scalar")
    scalar = float(value)
    if not math.isfinite(scalar):
        raise ValueError(f"{name} must be finite")
    return 0.0 if scalar == 0.0 else scalar


def _canonical(name: str, value: float) -> float:
    if not math.isfinite(value):
        raise ValueError(f"{name} left the finite binary64 domain")
    return 0.0 if value == 0.0 else value


@nearest_binary64
def derive_spherical_radial_origin_series_x4(
    *,
    F0_at_origin: float,
    F1_at_origin: float,
    varphi_at_origin: float,
    w: float,
) -> SphericalRadialOriginSeriesX4:
    """Derive the unique x^2 and x^4 coefficients of the three solved rows."""

    a0 = _finite("F0_at_origin", F0_at_origin)
    b0 = _finite("F1_at_origin", F1_at_origin)
    amplitude = _finite("varphi_at_origin", varphi_at_origin)
    frequency = _finite("w", w)
    if not 0.0 < amplitude <= TARGET_ORIGIN_AMPLITUDE:
        raise ValueError("varphi_at_origin must lie in (0,2^-10]")
    if not 0.0 < frequency < 1.0:
        raise ValueError("w must satisfy 0<w<1")
    try:
        exp_2b0 = math.exp(2.0 * b0)
        redshifted_frequency_square = math.exp(-2.0 * a0) * frequency * frequency
    except OverflowError as error:
        raise ValueError("origin exponent left the finite binary64 domain") from error
    if not (
        math.isfinite(exp_2b0)
        and exp_2b0 > 0.0
        and math.isfinite(redshifted_frequency_square)
        and redshifted_frequency_square > 0.0
    ):
        raise ValueError("origin exponent left the finite positive domain")

    A2 = amplitude * amplitude
    E = redshifted_frequency_square
    exp_4b0 = exp_2b0 * exp_2b0
    b2 = -A2 * exp_2b0 * (E + 1.0) / 12.0
    a2 = A2 * exp_2b0 * (2.0 * E - 1.0) / 6.0
    p2 = amplitude * exp_2b0 * (1.0 - E) / 6.0
    a4 = (
        -A2
        * exp_4b0
        * (2.0 * E - 1.0)
        * ((3.0 * A2 + 1.0) * E - 1.0)
        / 60.0
    )
    b4 = (
        A2
        * exp_4b0
        * (A2 * (29.0 * E * E - 2.0 * E + 5.0) + 8.0 * E * E + 8.0 * E - 16.0)
        / 1440.0
    )
    p4 = (
        amplitude
        * exp_4b0
        * (A2 * (6.0 * E * E - 4.0 * E) + (1.0 - E) * (1.0 - E))
        / 120.0
    )
    return SphericalRadialOriginSeriesX4(
        F0=EvenSeriesX4(
            x0=a0,
            x2=_canonical("F0.x2", a2),
            x4=_canonical("F0.x4", a4),
        ),
        F1=EvenSeriesX4(
            x0=b0,
            x2=_canonical("F1.x2", b2),
            x4=_canonical("F1.x4", b4),
        ),
        varphi=EvenSeriesX4(
            x0=amplitude,
            x2=_canonical("varphi.x2", p2),
            x4=_canonical("varphi.x4", p4),
        ),
        w=frequency,
        redshifted_frequency_square_at_origin=_canonical(
            "redshifted_frequency_square_at_origin", E
        ),
    )


__all__ = [
    "EvenSeriesX4",
    "ORIGIN_SERIES_VERSION",
    "SphericalRadialOriginSeriesX4",
    "TARGET_ORIGIN_AMPLITUDE",
    "derive_spherical_radial_origin_series_x4",
]
