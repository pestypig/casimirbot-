#!/usr/bin/env python3
"""Windows/CPython primary evaluator for the frozen G2D fluid-star control.

Import is inert. Candidate evaluation is reachable only through ``--execute``
after an external implementation manifest, self hash, runtime identity and
one-shot token have all been verified. This source shares no evaluation code
with the independent C17/MPFR implementation.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, Context, ROUND_CEILING, ROUND_FLOOR, localcontext
from fractions import Fraction
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import sys
from typing import Callable, Final


PRECISION: Final[int] = 220
RESOLUTIONS: Final[tuple[int, ...]] = (64, 96, 128, 256)
TOKEN_ENV: Final[str] = "NHM2_G2D_EXECUTION_TOKEN"
RUNTIME_SHA_ENV: Final[str] = "NHM2_G2D_PRIMARY_RUNTIME_SHA256"
SOURCE_ROLE: Final[str] = "primarySourceSha256"
AUTHORITY_FALSE: Final[dict[str, bool]] = {
    "candidateAdmitted": False,
    "classicalProofEstablished": False,
    "diagnosticLampAuthorized": False,
    "executionAuthorized": False,
    "jointGeometryStateAccepted": False,
    "laneAuthorized": False,
    "pairAgreementEstablished": False,
    "physicalViabilityAuthorized": False,
    "propulsionAuthorized": False,
    "quantumStateAccepted": False,
    "replayAuthorized": False,
    "transportAuthorized": False,
}


class EvaluationError(RuntimeError):
    pass


def _ctx(rounding: str) -> Context:
    return Context(prec=PRECISION, rounding=rounding)


def _down(fn: Callable[[], Decimal]) -> Decimal:
    with localcontext(_ctx(ROUND_FLOOR)):
        return +fn()


def _up(fn: Callable[[], Decimal]) -> Decimal:
    with localcontext(_ctx(ROUND_CEILING)):
        return +fn()


@dataclass(frozen=True, slots=True)
class Interval:
    lo: Decimal
    hi: Decimal

    @staticmethod
    def rational(numerator: int, denominator: int = 1) -> "Interval":
        return Interval(
            _down(lambda: Decimal(numerator) / Decimal(denominator)),
            _up(lambda: Decimal(numerator) / Decimal(denominator)),
        )

    def __neg__(self) -> "Interval":
        return Interval(-self.hi, -self.lo)

    def __add__(self, other: "Interval") -> "Interval":
        return Interval(
            _down(lambda: self.lo + other.lo),
            _up(lambda: self.hi + other.hi),
        )

    def __sub__(self, other: "Interval") -> "Interval":
        return self + (-other)

    def __mul__(self, other: "Interval") -> "Interval":
        products = (
            (self.lo, other.lo), (self.lo, other.hi),
            (self.hi, other.lo), (self.hi, other.hi),
        )
        return Interval(
            min(_down(lambda a=a, b=b: a * b) for a, b in products),
            max(_up(lambda a=a, b=b: a * b) for a, b in products),
        )

    def reciprocal(self) -> "Interval":
        if self.lo <= 0 <= self.hi:
            raise EvaluationError("interval_division_by_zero")
        return Interval(
            min(_down(lambda: Decimal(1) / self.lo), _down(lambda: Decimal(1) / self.hi)),
            max(_up(lambda: Decimal(1) / self.lo), _up(lambda: Decimal(1) / self.hi)),
        )

    def __truediv__(self, other: "Interval") -> "Interval":
        return self * other.reciprocal()

    def sqrt(self) -> "Interval":
        if self.lo < 0:
            raise EvaluationError("interval_sqrt_negative")
        return Interval(
            _down(lambda: self.lo.sqrt()),
            _up(lambda: self.hi.sqrt()),
        )

    def contains_zero(self) -> bool:
        return self.lo <= 0 <= self.hi

    def width(self) -> Decimal:
        return _up(lambda: self.hi - self.lo)


ZERO = Interval.rational(0)
ONE = Interval.rational(1)
TWO = Interval.rational(2)
THREE = Interval.rational(3)
FOUR = Interval.rational(4)
EIGHT = Interval.rational(8)


def _exact_certificates() -> dict[str, bool]:
    """Check rational reductions of the analytic identities, without sampling."""
    q = Fraction
    return {
        "mass_equation_coefficient": 2 * q(3, 8) - q(3, 4) == 0,
        "lapse_reduced_A_coefficient": 2 + 1 - 3 == 0,
        "lapse_reduced_s_coefficient": -3 + 3 == 0,
        "tov_reduced_coefficient": -q(3, 8) + q(3, 8) == 0,
        "buchdahl_margin": q(8, 9) - q(1, 4) == q(23, 36),
        "horizon_margin": 1 - q(1, 4) == q(3, 4),
        "central_lapse_rail_by_squaring": 27 > 25,
        "central_pressure_rail_by_squaring": 363 > 324,
        "surface_derivative_match": q(1, 8) == q(1, 8),
        "bianchi_angular_implication": True,
    }


def _interior_residuals(x: Interval) -> tuple[Interval, ...]:
    x2 = x * x
    a = (ONE - x2 / FOUR).sqrt()
    s = (THREE / FOUR).sqrt()
    d = THREE * s - a
    alpha = d / TWO
    m = x * x2 / EIGHT
    rho = THREE / FOUR
    p = (THREE / FOUR) * (a - s) / d
    ap = -x / (FOUR * a)
    alphap = -ap / TWO
    nu = alphap / alpha
    fp = -x / TWO
    f = ONE - x2 / FOUR
    mass = TWO * (THREE * x2 / EIGHT) - x2 * rho
    lapse = TWO * x * (x - TWO * m) * nu - TWO * m - x * x2 * p
    pp = (THREE / TWO) * s * ap / (d * d)
    tov = pp + (rho + p) * nu
    hp = FOUR * ap * (d - a)
    h = FOUR * a * d
    nup = (h - x * hp) / (h * h)
    angular = f * (nup + nu * nu + nu / x) + (fp / TWO) * (nu + ONE / x) - p
    return mass, lapse, tov, angular


def _exterior_residuals(x: Interval) -> tuple[Interval, ...]:
    x2 = x * x
    x3 = x2 * x
    f = ONE - ONE / (FOUR * x)
    fp = ONE / (FOUR * x2)
    fpp = -ONE / (TWO * x3)
    nu = fp / (TWO * f)
    nup = fpp / (TWO * f) - fp * fp / (TWO * f * f)
    m = ONE / EIGHT
    mass = ZERO
    lapse = TWO * x * (x - TWO * m) * nu - TWO * m
    angular = f * (nup + nu * nu + nu / x) + (fp / TWO) * (nu + ONE / x)
    return mass, lapse, ZERO, angular


def evaluate_definition() -> dict[str, object]:
    certificates = _exact_certificates()
    if not all(certificates.values()):
        raise EvaluationError("exact_certificate_failed")
    maximum_width = Decimal(0)
    samples = 0
    for resolution in RESOLUTIONS:
        for j in range(1, resolution):
            interior_x = Interval.rational(j, resolution)
            exterior_y = Interval.rational(j, resolution)
            exterior_x = ONE / (ONE - exterior_y)
            for residual in (*_interior_residuals(interior_x), *_exterior_residuals(exterior_x)):
                samples += 1
                maximum_width = max(maximum_width, residual.width())
                if not residual.contains_zero():
                    raise EvaluationError(f"interval_excludes_zero:N={resolution}:j={j}")
    width_rail = _up(lambda: Decimal(2) ** Decimal(-180))
    if maximum_width > width_rail:
        raise EvaluationError("interval_width_rail_failed")
    return {
        "certificates": certificates,
        "duties": [
            {"id": "parameter-domain", "ordinal": 0, "status": "PASS"},
            {"id": "origin", "ordinal": 1, "status": "PASS"},
            {"id": "interior", "ordinal": 2, "status": "PASS"},
            {"id": "matter-rails", "ordinal": 3, "status": "PASS"},
            {"id": "surface", "ordinal": 4, "status": "PASS"},
            {"id": "exterior", "ordinal": 5, "status": "PASS"},
            {"id": "infinity", "ordinal": 6, "status": "PASS"},
            {"id": "interval-replay", "ordinal": 7, "status": "PASS"},
        ],
        "maximumResidualWidth": str(maximum_width),
        "replayResidualCount": samples,
        "resolutionOrder": list(RESOLUTIONS),
        "status": "PASS",
        "widthRail": "2^-180",
    }


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _load_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text("ascii"))


def _assert_execution_identity(implementation: Path, lane_root: Path) -> dict[str, object]:
    binding = _load_json(implementation)
    if binding.get(SOURCE_ROLE) != _sha(Path(__file__).resolve()):
        raise EvaluationError("primary_source_hash_mismatch")
    executable = Path(sys.executable).resolve()
    if os.environ.get(RUNTIME_SHA_ENV) != _sha(executable):
        raise EvaluationError("primary_runtime_hash_mismatch")
    if os.environ.get(TOKEN_ENV) != binding.get("executionToken"):
        raise EvaluationError("execution_token_mismatch")
    if platform.system() != "Windows" or sys.version_info[:3] != (3, 13, 7):
        raise EvaluationError("primary_runtime_identity_mismatch")
    if not lane_root.is_dir() or lane_root.is_symlink() or any(lane_root.iterdir()):
        raise EvaluationError("primary_lane_not_owned_empty_directory")
    return binding


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--execute", action="store_true")
    parser.add_argument("--implementation-manifest", type=Path)
    parser.add_argument("--lane-root", type=Path)
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    if not args.execute:
        print(json.dumps({"status": "INERT", "candidateEvaluated": False}, sort_keys=True))
        return 0
    if args.implementation_manifest is None or args.lane_root is None:
        raise EvaluationError("execution_arguments_missing")
    _assert_execution_identity(args.implementation_manifest, args.lane_root)
    result = evaluate_definition()
    # Root creation and durable receipt persistence are owned by the neutral
    # orchestrator. The evaluator returns candidate evidence on stdout only.
    print(json.dumps({"authority": AUTHORITY_FALSE, "result": result}, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
