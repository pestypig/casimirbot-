"""Static G2D-R1 diagnosis; never imports or invokes either evaluator."""

from __future__ import annotations

import ast
from decimal import Context, Decimal, ROUND_CEILING, ROUND_FLOOR
from fractions import Fraction
import hashlib
import json
import os
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]
TOOLS = Path(__file__).resolve().parent
PRIMARY = TOOLS / "g2d_fluid_star_primary.py"
INDEPENDENT = TOOLS / "g2d_fluid_star_independent.c"
ORCHESTRATOR = TOOLS / "g2d_fluid_star_orchestrator.py"
IMPLEMENTATION = ROOT / "docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json"
PREEXECUTION = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1/preexecution-binding.json"
TERMINAL = ROOT / "artifacts/nhm2-spherical-boson-star-v2-g2d/fluid-star-chi-1-over-4-v1/terminal-receipt.json"
PRIMARY_DIR = TERMINAL.parent / "primary"


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class Poly:
    """Q[x,A,s] polynomial reduced by A^2=1-x^2/4 and s^2=3/4."""

    def __init__(self, terms: dict[tuple[int, int, int], Fraction] | None = None):
        self.terms = self._reduce(terms or {})

    @staticmethod
    def _reduce(terms: dict[tuple[int, int, int], Fraction]) -> dict[tuple[int, int, int], Fraction]:
        pending = [(powers, Fraction(coefficient)) for powers, coefficient in terms.items()]
        reduced: dict[tuple[int, int, int], Fraction] = {}
        while pending:
            (ix, ia, iss), coefficient = pending.pop()
            if not coefficient:
                continue
            if ia >= 2:
                pending.append(((ix, ia - 2, iss), coefficient))
                pending.append(((ix + 2, ia - 2, iss), -coefficient / 4))
                continue
            if iss >= 2:
                pending.append(((ix, ia, iss - 2), coefficient * Fraction(3, 4)))
                continue
            key = (ix, ia, iss)
            reduced[key] = reduced.get(key, Fraction(0)) + coefficient
            if not reduced[key]:
                del reduced[key]
        return reduced

    @classmethod
    def constant(cls, value: int | Fraction) -> "Poly":
        return cls({(0, 0, 0): Fraction(value)})

    def __add__(self, other: "Poly") -> "Poly":
        terms = dict(self.terms)
        for powers, coefficient in other.terms.items():
            terms[powers] = terms.get(powers, Fraction(0)) + coefficient
        return Poly(terms)

    def __neg__(self) -> "Poly":
        return Poly({powers: -coefficient for powers, coefficient in self.terms.items()})

    def __sub__(self, other: "Poly") -> "Poly":
        return self + (-other)

    def __mul__(self, other: "Poly") -> "Poly":
        terms: dict[tuple[int, int, int], Fraction] = {}
        for (ix, ia, iss), left in self.terms.items():
            for (jx, ja, jss), right in other.terms.items():
                key = (ix + jx, ia + ja, iss + jss)
                terms[key] = terms.get(key, Fraction(0)) + left * right
        return Poly(terms)


class Rat:
    def __init__(self, numerator: Poly, denominator: Poly | None = None):
        self.numerator = numerator
        self.denominator = denominator or Poly.constant(1)

    @classmethod
    def value(cls, value: int | Fraction) -> "Rat":
        return cls(Poly.constant(value))

    def __add__(self, other: "Rat") -> "Rat":
        return Rat(self.numerator * other.denominator + other.numerator * self.denominator,
                   self.denominator * other.denominator)

    def __neg__(self) -> "Rat":
        return Rat(-self.numerator, self.denominator)

    def __sub__(self, other: "Rat") -> "Rat":
        return self + (-other)

    def __mul__(self, other: "Rat") -> "Rat":
        return Rat(self.numerator * other.numerator, self.denominator * other.denominator)

    def __truediv__(self, other: "Rat") -> "Rat":
        return Rat(self.numerator * other.denominator, self.denominator * other.numerator)

    def derivative(self) -> "Rat":
        dn = derivative_poly(self.numerator)
        dd = derivative_poly(self.denominator)
        n = Rat(self.numerator)
        d = Rat(self.denominator)
        return (dn * d - n * dd) / (d * d)

    def is_zero(self) -> bool:
        return not self.numerator.terms


def derivative_poly(poly: Poly) -> Rat:
    result = Rat.value(0)
    a_poly = Poly({(0, 1, 0): Fraction(1)})
    for (ix, ia, iss), coefficient in poly.terms.items():
        if ix:
            result += Rat(Poly({(ix - 1, ia, iss): coefficient * ix}))
        if ia:
            # A'=-x/(4A), with s constant.
            numerator = Poly({(ix + 1, ia - 1, iss): -coefficient * ia / 4})
            result += Rat(numerator, a_poly)
    return result


X = Rat(Poly({(1, 0, 0): Fraction(1)}))
A = Rat(Poly({(0, 1, 0): Fraction(1)}))
S = Rat(Poly({(0, 0, 1): Fraction(1)}))


class G2DStaticFailureDiagnosis(unittest.TestCase):
    def test_frozen_analytic_residuals_reduce_exactly_to_zero(self) -> None:
        one, two, three, four, eight = map(Rat.value, (1, 2, 3, 4, 8))
        d = three * S - A
        alpha = d / two
        m = X * X * X / eight
        rho = three / four
        p = (three / four) * (A - S) / d
        nu = alpha.derivative() / alpha
        f = one - X * X / four
        fp = f.derivative()
        residuals = (
            two * m.derivative() - X * X * rho,
            two * X * (X - two * m) * nu - two * m - X * X * X * p,
            p.derivative() + (rho + p) * nu,
            f * (nu.derivative() + nu * nu + nu / X)
            + (fp / two) * (nu + one / X) - p,
        )
        self.assertTrue(all(residual.is_zero() for residual in residuals))
        exterior_f = one - one / (four * X)
        exterior_nu = exterior_f.derivative() / (two * exterior_f)
        exterior_m = one / eight
        exterior_residuals = (
            Rat.value(0),
            two * X * (X - two * exterior_m) * exterior_nu - two * exterior_m,
            Rat.value(0),
            exterior_f * (exterior_nu.derivative() + exterior_nu * exterior_nu
                          + exterior_nu / X)
            + (exterior_f.derivative() / two) * (exterior_nu + one / X),
        )
        self.assertTrue(all(residual.is_zero() for residual in exterior_residuals))

    def test_primary_source_matches_the_symbolically_reduced_formulas(self) -> None:
        tree = ast.parse(PRIMARY.read_text("utf-8"))
        interior = next(node for node in tree.body
                        if isinstance(node, ast.FunctionDef) and node.name == "_interior_residuals")
        text = ast.unparse(interior)
        for expression in (
            "mass = TWO * (THREE * x2 / EIGHT) - x2 * rho",
            "lapse = TWO * x * (x - TWO * m) * nu - TWO * m - x * x2 * p",
            "tov = pp + (rho + p) * nu",
            "angular = f * (nup + nu * nu + nu / x) + fp / TWO * (nu + ONE / x) - p",
        ):
            self.assertIn(expression, text)
        exterior = next(node for node in tree.body
                        if isinstance(node, ast.FunctionDef) and node.name == "_exterior_residuals")
        exterior_text = ast.unparse(exterior)
        for expression in (
            "nu = fp / (TWO * f)",
            "nup = fpp / (TWO * f) - fp * fp / (TWO * f * f)",
            "lapse = TWO * x * (x - TWO * m) * nu - TWO * m",
            "angular = f * (nup + nu * nu + nu / x) + fp / TWO * (nu + ONE / x)",
        ):
            self.assertIn(expression, exterior_text)

    def test_native_source_encodes_the_same_residual_formulas(self) -> None:
        source = "".join(INDEPENDENT.read_text("utf-8").split())
        for fragment in (
            "iv_mul(&t1,&three,&x2);iv_div(&t1,&t1,&eight);",
            "iv_add(&t1,&rho,&p);iv_mul(&t1,&t1,&nu);iv_add(&tov,&pp,&t1);",
            "iv_mul(&t1,&two,&f);if(!iv_div(&nu,&fp,&t1))gotofail;",
            "iv_sub(&angular,&t1,&p);",
        ):
            self.assertIn("".join(fragment.split()), source)

    def test_decimal_sqrt_is_not_directed_by_the_context(self) -> None:
        exact_input = Decimal(3) / Decimal(4)
        alleged_lower = Context(prec=220, rounding=ROUND_FLOOR).sqrt(exact_input)
        alleged_upper = Context(prec=220, rounding=ROUND_CEILING).sqrt(exact_input)
        comparison = Context(prec=500)
        square_delta = comparison.subtract(comparison.multiply(alleged_upper, alleged_upper),
                                           exact_input)
        self.assertEqual(alleged_lower, alleged_upper)
        self.assertLess(square_delta, 0)
        self.assertIn("ROUND_HALF_EVEN", Decimal.sqrt.__doc__ or "")

    def test_primary_uses_the_unsound_sqrt_while_mpfr_is_directed(self) -> None:
        primary = PRIMARY.read_text("utf-8")
        independent = INDEPENDENT.read_text("utf-8")
        self.assertIn("_down(lambda: self.lo.sqrt())", primary)
        self.assertIn("_up(lambda: self.hi.sqrt())", primary)
        self.assertNotIn("next_minus", primary)
        self.assertNotIn("next_plus", primary)
        self.assertIn("mpfr_sqrt(lo,a->lo,MPFR_RNDD)", independent)
        self.assertIn("mpfr_sqrt(hi,a->hi,MPFR_RNDU)", independent)

    def test_pre_evaluation_identity_paths_are_statically_excluded(self) -> None:
        binding = json.loads(IMPLEMENTATION.read_text("ascii"))
        preflight = json.loads(PREEXECUTION.read_text("ascii"))
        terminal = json.loads(TERMINAL.read_text("ascii"))
        self.assertEqual(preflight["status"], "PASS")
        self.assertEqual(preflight["implementationManifestSha256"], sha(IMPLEMENTATION))
        self.assertEqual(binding["primarySourceSha256"], sha(PRIMARY))
        self.assertTrue(PRIMARY_DIR.is_dir() and not PRIMARY_DIR.is_symlink())
        self.assertEqual(list(PRIMARY_DIR.iterdir()), [])
        orchestrator = ORCHESTRATOR.read_text("utf-8")
        self.assertIn("env[PRIMARY_RUNTIME_ENV] = binding[\"primaryExecutableSha256\"]", orchestrator)
        self.assertIn("lane_root.mkdir(exist_ok=False)", orchestrator)
        self.assertEqual(terminal["firstFail"], "primary_evaluator_failed:1")

    def test_exact_certificate_gate_cannot_fail(self) -> None:
        checks = (
            2 * Fraction(3, 8) - Fraction(3, 4) == 0,
            Fraction(8, 9) - Fraction(1, 4) == Fraction(23, 36),
            1 - Fraction(1, 4) == Fraction(3, 4),
            2 + 1 - 3 == 0,
            -3 + 3 == 0,
            27 > 25,
            363 > 324,
        )
        self.assertTrue(all(checks))

    def test_audit_has_no_evaluator_entry_or_output_mutation(self) -> None:
        source = Path(__file__).read_text("utf-8")
        tree = ast.parse(source)
        imports = {alias.name for node in ast.walk(tree)
                   if isinstance(node, (ast.Import, ast.ImportFrom))
                   for alias in node.names}
        self.assertFalse(any(name.startswith("g2d_fluid_star") for name in imports))
        self.assertNotIn("subprocess", imports)
        calls = {node.func.id for node in ast.walk(tree)
                 if isinstance(node, ast.Call) and isinstance(node.func, ast.Name)}
        self.assertNotIn("evaluate_" + "definition", calls)
        string_literals = {node.value for node in ast.walk(tree)
                           if isinstance(node, ast.Constant) and isinstance(node.value, str)}
        self.assertNotIn("--" + "execute", string_literals)
        self.assertTrue(os.path.lexists(TERMINAL.parent))


if __name__ == "__main__":
    unittest.main()
