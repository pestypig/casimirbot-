from __future__ import annotations

import sympy as sp

from tools.gr_assistant.cas import ricci_scalar
from tools.gr_assistant.checks import check_contracted_bianchi, check_vacuum
from tools.gr_assistant.schemas import MetricSpec


def test_minkowski_vacuum() -> None:
    metric = MetricSpec(
        coords=["t", "x", "y", "z"],
        g_dd=[
            [-1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
    )
    assert check_vacuum(metric).passed
    assert check_contracted_bianchi(metric).passed


def test_schwarzschild_vacuum_spotcheck() -> None:
    metric = MetricSpec(
        coords=["t", "r", "theta", "phi"],
        g_dd=[
            ["-(1-2*M/r)", 0, 0, 0],
            [0, "1/(1-2*M/r)", 0, 0],
            [0, 0, "r**2", 0],
            [0, 0, 0, "r**2*sin(theta)**2"],
        ],
    )
    result = check_vacuum(
        metric,
        sample_points=[{"t": 0.0, "r": 10.0, "theta": 1.2, "phi": 0.5, "M": 1.0}],
        epsilon=1e-6,
    )
    assert result.passed


def test_frw_ricci_scalar_nonzero() -> None:
    metric = MetricSpec(
        coords=["t", "x", "y", "z"],
        g_dd=[
            [-1, 0, 0, 0],
            [0, "a(t)**2", 0, 0],
            [0, 0, "a(t)**2", 0],
            [0, 0, 0, "a(t)**2"],
        ],
    )
    scalar = ricci_scalar(metric)
    t = sp.symbols("t", real=True)
    a = sp.Function("a")
    expr = scalar.subs(
        {
            a(t): t,
            sp.diff(a(t), t): 1,
            sp.diff(a(t), t, t): 0,
        }
    ).subs({t: 2})
    assert sp.simplify(expr) != 0
