from __future__ import annotations

from dataclasses import FrozenInstanceError
import math
from pathlib import Path
import random
import sys
import unittest


HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from radial_origin_series import (  # noqa: E402
    TARGET_ORIGIN_AMPLITUDE,
    derive_spherical_radial_origin_series_x4,
)


class SphericalRadialOriginSeriesTests(unittest.TestCase):
    def test_leading_coefficients_satisfy_all_four_origin_limits(self) -> None:
        generator = random.Random(0x0A161)
        for _ in range(100):
            a0 = generator.uniform(-0.4, 0.1)
            b0 = generator.uniform(-0.1, 0.2)
            amplitude = generator.uniform(1.0e-6, TARGET_ORIGIN_AMPLITUDE)
            w = generator.uniform(0.2, 0.999)
            series = derive_spherical_radial_origin_series_x4(
                F0_at_origin=a0,
                F1_at_origin=b0,
                varphi_at_origin=amplitude,
                w=w,
            )
            e0 = math.exp(-2.0 * a0)
            e1 = math.exp(-2.0 * b0)
            time = e0 * w * w * amplitude * amplitude
            mass = amplitude * amplitude
            et0 = 12.0 * e1 * series.F1.x2 + time + mass
            etheta0 = (
                4.0 * e1 * (series.F0.x2 + series.F1.x2) - time + mass
            )
            kg0 = 6.0 * e1 * series.varphi.x2 + e0 * w * w * amplitude - amplitude
            ex0 = etheta0
            scale = max(1.0, abs(time), abs(mass))
            self.assertLessEqual(abs(et0) / scale, 2.0e-18)
            self.assertLessEqual(abs(etheta0) / scale, 2.0e-18)
            self.assertLessEqual(abs(kg0) / scale, 2.0e-18)
            self.assertLessEqual(abs(ex0) / scale, 2.0e-18)

    def test_x4_coefficients_cancel_the_x2_solved_row_coefficients(self) -> None:
        # Independently expanded x^2 coefficients of Et, Etheta and KG.
        generator = random.Random(0x04C0EF)
        for _ in range(100):
            a0 = generator.uniform(-0.4, 0.1)
            b0 = generator.uniform(-0.1, 0.2)
            A = generator.uniform(1.0e-6, TARGET_ORIGIN_AMPLITUDE)
            w = generator.uniform(0.2, 0.999)
            s = derive_spherical_radial_origin_series_x4(
                F0_at_origin=a0, F1_at_origin=b0, varphi_at_origin=A, w=w
            )
            a2, a4 = s.F0.x2, s.F0.x4
            b2, b4 = s.F1.x2, s.F1.x4
            p2, p4 = s.varphi.x2, s.varphi.x4
            e0 = math.exp(-2.0 * a0)
            e1 = math.exp(-2.0 * b0)
            t0 = e0 * w * w * A * A
            # Expansion identities were derived directly from the frozen
            # cancellation-free terms, without calling the production kernel.
            gt2 = e1 * (40.0 * b4 - 20.0 * b2 * b2)
            time2 = t0 * (2.0 * p2 / A - 2.0 * a2)
            radial2 = e1 * 4.0 * p2 * p2
            mass2 = 2.0 * A * p2
            et2 = gt2 + time2 + radial2 + mass2

            gtheta2 = e1 * (
                16.0 * (a4 + b4)
                + 4.0 * a2 * a2
                - 8.0 * b2 * (a2 + b2)
            )
            etheta2 = gtheta2 - time2 + radial2 + mass2

            radial_box2 = 20.0 * p4 + 4.0 * (a2 + b2) * p2
            kg2 = (
                e1 * (radial_box2 - 12.0 * b2 * p2)
                + e0 * w * w * (p2 - 2.0 * a2 * A)
                - p2
            )
            scale = max(1.0, abs(gt2), abs(gtheta2), abs(time2))
            self.assertLessEqual(abs(et2) / scale, 5.0e-18)
            self.assertLessEqual(abs(etheta2) / scale, 5.0e-18)
            self.assertLessEqual(abs(kg2) / scale, 5.0e-18)

    def test_monotone_origin_sign_is_not_assumed(self) -> None:
        increasing = derive_spherical_radial_origin_series_x4(
            F0_at_origin=0.0,
            F1_at_origin=0.0,
            varphi_at_origin=TARGET_ORIGIN_AMPLITUDE,
            w=0.9,
        )
        decreasing = derive_spherical_radial_origin_series_x4(
            F0_at_origin=-0.2,
            F1_at_origin=0.0,
            varphi_at_origin=TARGET_ORIGIN_AMPLITUDE,
            w=0.9,
        )
        self.assertGreater(increasing.varphi.x2, 0.0)
        self.assertLess(decreasing.varphi.x2, 0.0)
        self.assertFalse(increasing.branch_authority)
        self.assertFalse(decreasing.branch_authority)
        with self.assertRaises(FrozenInstanceError):
            increasing.branch_authority = True  # type: ignore[misc]

    def test_invalid_or_nonrepresentable_inputs_fail_closed(self) -> None:
        valid = dict(
            F0_at_origin=-0.1,
            F1_at_origin=0.0,
            varphi_at_origin=TARGET_ORIGIN_AMPLITUDE,
            w=0.9,
        )
        for replacement in (
            {"varphi_at_origin": 0.0},
            {"varphi_at_origin": 2.0 * TARGET_ORIGIN_AMPLITUDE},
            {"w": 0.0},
            {"w": 1.0},
            {"F0_at_origin": math.inf},
            {"F1_at_origin": 400.0},
        ):
            args = {**valid, **replacement}
            with self.subTest(args=args), self.assertRaises(ValueError):
                derive_spherical_radial_origin_series_x4(**args)


if __name__ == "__main__":
    unittest.main()
