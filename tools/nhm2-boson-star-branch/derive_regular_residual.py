"""Reproduce the analytic Einstein rows used by ``regular_residual.py``.

This is a development-time symbolic derivation, not a runtime solver input.
It starts from the frozen diagonal quasi-isotropic metric, constructs the
Levi-Civita connection and Einstein tensor, and simplifies the five mixed
components needed by the branch residual.  In particular, SymPy eliminates
all coordinate-only spherical-connection terms before formulas are copied to
the bounded binary64 evaluator.

Run directly to print deterministic ``srepr`` expressions.  The focused test
suite independently compares the resulting evaluator against the generic
covariant kernel at well-conditioned points.
"""

from __future__ import annotations

import sympy as sp


def derive_mixed_einstein_rows() -> dict[str, sp.Expr]:
    tau, x, theta, azimuth = sp.symbols(
        "tau x theta azimuth",
        real=True,
    )
    coordinates = (tau, x, theta, azimuth)
    f0 = sp.Function("F0")(x, theta)
    f1 = sp.Function("F1")(x, theta)
    f2 = sp.Function("F2")(x, theta)
    metric = sp.diag(
        -sp.exp(2 * f0),
        sp.exp(2 * f1),
        x**2 * sp.exp(2 * f1),
        x**2 * sp.sin(theta) ** 2 * sp.exp(2 * f2),
    )
    inverse = sp.diag(*[sp.cancel(1 / metric[i, i]) for i in range(4)])

    christoffel = sp.MutableDenseNDimArray.zeros(4, 4, 4)
    for upper in range(4):
        for lower_a in range(4):
            for lower_b in range(4):
                christoffel[upper, lower_a, lower_b] = sp.simplify(
                    sp.Rational(1, 2)
                    * sum(
                        inverse[upper, contracted]
                        * (
                            sp.diff(metric[contracted, lower_b], coordinates[lower_a])
                            + sp.diff(metric[contracted, lower_a], coordinates[lower_b])
                            - sp.diff(metric[lower_a, lower_b], coordinates[contracted])
                        )
                        for contracted in range(4)
                    )
                )

    ricci = sp.MutableDenseNDimArray.zeros(4, 4)
    for covariant_a in range(4):
        for covariant_b in range(4):
            ricci[covariant_a, covariant_b] = sp.simplify(
                sum(
                    sp.diff(
                        christoffel[contracted_c, covariant_a, covariant_b],
                        coordinates[contracted_c],
                    )
                    - sp.diff(
                        christoffel[contracted_c, covariant_a, contracted_c],
                        coordinates[covariant_b],
                    )
                    + sum(
                        christoffel[contracted_c, covariant_a, covariant_b]
                        * christoffel[contracted_d, contracted_c, contracted_d]
                        - christoffel[contracted_d, covariant_a, contracted_c]
                        * christoffel[contracted_c, covariant_b, contracted_d]
                        for contracted_d in range(4)
                    )
                    for contracted_c in range(4)
                )
            )

    scalar_curvature = sp.simplify(
        sum(inverse[a, b] * ricci[a, b] for a in range(4) for b in range(4))
    )
    mixed = sp.MutableDenseNDimArray.zeros(4, 4)
    for upper in range(4):
        for lower in range(4):
            mixed[upper, lower] = sp.factor(
                sp.trigsimp(
                    sum(
                        inverse[upper, contracted]
                        * (
                            ricci[contracted, lower]
                            - sp.Rational(1, 2)
                            * metric[contracted, lower]
                            * scalar_curvature
                        )
                        for contracted in range(4)
                    )
                )
            )

    return {
        "G_t_t": mixed[0, 0],
        "G_x_x": mixed[1, 1],
        "G_theta_theta": mixed[2, 2],
        "G_phi_phi": mixed[3, 3],
        "G_x_theta": mixed[1, 2],
    }


def coordinate_regular_forms(
    rows: dict[str, sp.Expr],
) -> dict[str, sp.Expr]:
    """Build the cancellation-free forms copied into the runtime evaluator."""

    symbols = set().union(*(expression.free_symbols for expression in rows.values()))
    x = next(symbol for symbol in symbols if symbol.name == "x")
    theta = next(symbol for symbol in symbols if symbol.name == "theta")
    applied = set().union(
        *(expression.atoms(sp.core.function.AppliedUndef) for expression in rows.values())
    )
    by_name = {str(function.func): function for function in applied}
    a, b, c = by_name["F0"], by_name["F1"], by_name["F2"]
    ax, at = sp.diff(a, x), sp.diff(a, theta)
    axx, axt, att = sp.diff(a, x, 2), sp.diff(a, x, theta), sp.diff(a, theta, 2)
    bx, bt = sp.diff(b, x), sp.diff(b, theta)
    bxx, btt = sp.diff(b, x, 2), sp.diff(b, theta, 2)
    cx, ct = sp.diff(c, x), sp.diff(c, theta)
    cxx, cxt, ctt = sp.diff(c, x, 2), sp.diff(c, x, theta), sp.diff(c, theta, 2)
    cot = sp.cot(theta)
    conformal_inverse = sp.exp(-2 * b)
    return {
        "G_t_t": conformal_inverse
        * (
            bxx
            + cxx
            + cx**2
            + (bx + 3 * cx) / x
            + (btt + ctt + ct**2 + 2 * cot * ct) / x**2
        ),
        "G_x_x": conformal_inverse
        * (
            ax * bx
            + ax * cx
            + bx * cx
            + (2 * ax + bx + cx) / x
            + (
                att
                + ctt
                + at**2
                - at * bt
                + at * ct
                - bt * ct
                + ct**2
                + cot * (at - bt + 2 * ct)
            )
            / x**2
        ),
        "G_theta_theta": conformal_inverse
        * (
            ax**2
            - ax * bx
            + ax * cx
            + axx
            - bx * cx
            + cx**2
            + cxx
            + (ax - bx + 2 * cx) / x
            + (at * bt + at * ct + bt * ct + cot * (at + bt)) / x**2
        ),
        "G_phi_phi": conformal_inverse
        * (
            ax**2
            + axx
            + bxx
            + (ax + bx) / x
            + (at**2 + att + btt) / x**2
        ),
        "G_x_theta": -conformal_inverse
        * (
            at * ax
            - at * bx
            - ax * bt
            - bt * cx
            - bx * ct
            + ct * cx
            + axt
            + cxt
            + cot * (-bx + cx)
            - (at + bt) / x
        ),
    }


def verify_coordinate_regular_identities(rows: dict[str, sp.Expr]) -> None:
    """Fail if any copied cancellation-free row differs symbolically."""

    regular = coordinate_regular_forms(rows)
    for name in rows:
        difference = sp.trigsimp(sp.cancel(rows[name] - regular[name]))
        if difference != 0:
            difference = sp.simplify(sp.expand_trig(difference))
        if difference != 0:
            raise AssertionError(f"symbolic identity failed for {name}: {difference}")


if __name__ == "__main__":
    derived = derive_mixed_einstein_rows()
    verify_coordinate_regular_identities(derived)
    print("coordinate-regular Einstein identities: VERIFIED")
    for name, expression in coordinate_regular_forms(derived).items():
        print(f"{name} = {sp.sstr(expression)}")
