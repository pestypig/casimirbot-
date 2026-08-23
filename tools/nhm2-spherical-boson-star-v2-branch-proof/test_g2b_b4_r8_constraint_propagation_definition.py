from __future__ import annotations

import math
import unittest

import sympy as sp

import g2b_b4_r8_constraint_propagation_definition as definition


class ConstraintPropagationDefinitionTests(unittest.TestCase):
    def test_direct_frozen_residual_expansion_is_identically_zero(self) -> None:
        x, omega = sp.symbols("x omega", positive=True, finite=True)
        f0 = sp.Function("F0")(x)
        f1 = sp.Function("F1")(x)
        phi = sp.Function("phi")(x)
        f0x, f1x, phix = (sp.diff(field, x) for field in (f0, f1, phi))
        em0 = sp.exp(-2 * f0)
        em1 = sp.exp(-2 * f1)

        gt = em1 * (2 * sp.diff(f1, x, 2) + f1x**2 + 4 * f1x / x)
        gx = em1 * (2 * f0x * f1x + f1x**2 + 2 * (f0x + f1x) / x)
        gtheta = em1 * (
            f0x**2 + sp.diff(f0, x, 2) + sp.diff(f1, x, 2) + (f0x + f1x) / x
        )
        time = em0 * omega**2 * phi**2
        radial = em1 * phix**2
        et = gt + time + radial + phi**2
        ex = gx - time - radial + phi**2
        etheta = gtheta - time + radial + phi**2
        kg = em1 * (sp.diff(phi, x, 2) + (f0x + f1x + 2 / x) * phix) + em0 * omega**2 * phi - phi

        identity = (
            sp.diff(ex, x)
            + f0x * (ex - et)
            + 2 * (f1x + 1 / x) * (ex - etheta)
            + 2 * phix * kg
        )
        self.assertEqual(sp.simplify(sp.expand(identity)), 0)

    def test_independent_christoffel_route_gives_diagonal_divergence(self) -> None:
        x, theta = sp.symbols("x theta", positive=True)
        f0 = sp.Function("F0")(x)
        f1 = sp.Function("F1")(x)
        a, b, c = (sp.Function(name)(x) for name in ("A", "B", "C"))
        metric = sp.diag(-sp.exp(2 * f0), sp.exp(2 * f1), sp.exp(2 * f1) * x**2, sp.exp(2 * f1) * x**2 * sp.sin(theta) ** 2)
        inverse = sp.simplify(metric.inv())
        coordinates = (sp.Symbol("t"), x, theta, sp.Symbol("varphi"))

        def gamma(upper: int, lower_a: int, lower_b: int):
            return sp.simplify(
                sp.Rational(1, 2)
                * sum(
                    inverse[upper, d]
                    * (
                        sp.diff(metric[d, lower_b], coordinates[lower_a])
                        + sp.diff(metric[d, lower_a], coordinates[lower_b])
                        - sp.diff(metric[lower_a, lower_b], coordinates[d])
                    )
                    for d in range(4)
                )
            )

        diagonal = (a, b, c, c)
        divergence = sp.diff(b, x)
        divergence += sum(gamma(mu, mu, 1) * b for mu in range(4))
        divergence -= sum(gamma(mu, mu, 1) * diagonal[mu] for mu in range(4))
        expected = sp.diff(b, x) + sp.diff(f0, x) * (b - a) + 2 * (sp.diff(f1, x) + 1 / x) * (b - c)
        self.assertEqual(sp.simplify(divergence - expected), 0)

    def test_scalar_stress_divergence_route_is_two_phi_prime_kg(self) -> None:
        x, omega = sp.symbols("x omega", positive=True, finite=True)
        f0 = sp.Function("F0")(x)
        f1 = sp.Function("F1")(x)
        phi = sp.Function("phi")(x)
        f0x, f1x, phix = (sp.diff(field, x) for field in (f0, f1, phi))
        em0 = sp.exp(-2 * f0)
        em1 = sp.exp(-2 * f1)
        time = em0 * omega**2 * phi**2
        radial = em1 * phix**2
        tt = -time - radial - phi**2
        tx = time + radial - phi**2
        ttheta = time - radial - phi**2
        divergence = sp.diff(tx, x) + f0x * (tx - tt) + 2 * (f1x + 1 / x) * (tx - ttheta)
        kg = em1 * (sp.diff(phi, x, 2) + (f0x + f1x + 2 / x) * phix) + em0 * omega**2 * phi - phi
        self.assertEqual(sp.simplify(sp.expand(divergence - 2 * phix * kg)), 0)

    def test_targeted_regular_analytic_fields_satisfy_identity_exactly(self) -> None:
        x, omega = sp.symbols("x omega", positive=True)
        substitutions = {
            sp.Function("F0")(x): x**2 / 7 + x**4 / 11,
            sp.Function("F1")(x): -x**2 / 5 + x**4 / 13,
            sp.Function("phi")(x): 1 - x**2 / 3 + x**4 / 17,
            omega: sp.Rational(4, 5),
        }
        # This test deliberately invokes the direct test's independently written
        # algebra through exact analytic functions, including the regular origin
        # parity class.  Exact zero is checked at several rational radii.
        f0, f1, phi = (substitutions[sp.Function(name)(x)] for name in ("F0", "F1", "phi"))
        f0x, f1x, phix = (sp.diff(field, x) for field in (f0, f1, phi))
        em0, em1 = sp.exp(-2 * f0), sp.exp(-2 * f1)
        gt = em1 * (2 * sp.diff(f1, x, 2) + f1x**2 + 4 * f1x / x)
        gx = em1 * (2 * f0x * f1x + f1x**2 + 2 * (f0x + f1x) / x)
        gth = em1 * (f0x**2 + sp.diff(f0, x, 2) + sp.diff(f1, x, 2) + (f0x + f1x) / x)
        time, radial = em0 * substitutions[omega] ** 2 * phi**2, em1 * phix**2
        et, ex, eth = gt + time + radial + phi**2, gx - time - radial + phi**2, gth - time + radial + phi**2
        kg = em1 * (sp.diff(phi, x, 2) + (f0x + f1x + 2 / x) * phix) + em0 * substitutions[omega] ** 2 * phi - phi
        identity = sp.diff(ex, x) + f0x * (ex - et) + 2 * (f1x + 1 / x) * (ex - eth) + 2 * phix * kg
        for radius in (sp.Rational(1, 8), sp.Rational(1, 3), sp.Rational(3, 2)):
            self.assertEqual(sp.simplify(identity.subs(x, radius)), 0)

    def test_clenshaw_curtis_weights_and_norms(self) -> None:
        for count in (2, 3, 8, 64):
            weights = definition.clenshaw_curtis_weights(count)
            self.assertEqual(len(weights), count)
            self.assertTrue(all(weight > 0.0 for weight in weights))
            self.assertAlmostEqual(math.fsum(weights), 1.0, places=14)
            nodes = tuple((1.0 - math.cos(math.pi * j / (count - 1))) / 2.0 for j in range(count))
            self.assertAlmostEqual(math.fsum(weight * node for weight, node in zip(weights, nodes, strict=True)), 0.5, places=14)
        weights = definition.clenshaw_curtis_weights(8)
        self.assertAlmostEqual(definition.weighted_l2((2.0,) * 8, weights), 2.0, places=14)
        self.assertEqual(definition.nodal_sup((-3.0, 1.0, 2.0)), 3.0)


if __name__ == "__main__":
    unittest.main()
