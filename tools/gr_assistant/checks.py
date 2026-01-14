from __future__ import annotations

from typing import List

import sympy as sp

from typing import Dict, Iterable, List, Optional

import sympy as sp

from .cas import (
    christoffel_symbols,
    einstein_tensor,
    iterate_components,
    metric_inverse,
    parse_metric,
    riemann_covariant,
)
from .schemas import CheckResult, MetricSpec, TensorArtifact


def _is_zero(expr: sp.Expr) -> bool:
    try:
        return sp.simplify(expr) == 0
    except Exception:
        return False


def check_metric_symmetry(metric: MetricSpec) -> CheckResult:
    parsed = parse_metric(metric)
    g_dd = parsed.g_dd
    residuals = g_dd - g_dd.T
    passed = True
    for i in range(residuals.rows):
        for j in range(residuals.cols):
            if not _is_zero(residuals[i, j]):
                passed = False
                break
        if not passed:
            break
    residual = None
    if not passed:
        residual = sp.sstr(residuals)
    return CheckResult(
        check_name="metric_symmetry",
        passed=passed,
        residual=residual,
    )


def validate_metric(metric: MetricSpec) -> List[CheckResult]:
    return [check_metric_symmetry(metric)]


def _parse_component(value: Any) -> Any:
    if isinstance(value, list):
        return [_parse_component(entry) for entry in value]
    if isinstance(value, dict):
        return {k: _parse_component(v) for k, v in value.items()}
    try:
        return sp.sympify(value)
    except Exception:
        return value


def _tensor_from_artifact(artifact: TensorArtifact) -> sp.Array:
    parsed = _parse_component(artifact.components)
    return sp.Array(parsed)


def check_christoffel_symmetry(metric: MetricSpec) -> CheckResult:
    gamma_artifact = christoffel_symbols(metric)
    gamma = _tensor_from_artifact(gamma_artifact)
    n = gamma.shape[0]
    passed = True
    for a in range(n):
        for b in range(n):
            for c in range(n):
                if not _is_zero(gamma[a, b, c] - gamma[a, c, b]):
                    passed = False
                    break
            if not passed:
                break
        if not passed:
            break
    residual = None
    if not passed:
        residual = "Gamma^a_{bc} != Gamma^a_{cb}"
    return CheckResult(
        check_name="christoffel_symmetry",
        passed=passed,
        residual=residual,
    )


def _check_riemann_symmetry(
    name: str,
    iter_indices: Iterable[tuple[int, int, int, int]],
    expr_fn,
) -> CheckResult:
    passed = True
    for a, b, c, d in iter_indices:
        if not _is_zero(expr_fn(a, b, c, d)):
            passed = False
            break
    residual = None if passed else name
    return CheckResult(check_name=name, passed=passed, residual=residual)


def check_riemann_symmetries(metric: MetricSpec) -> List[CheckResult]:
    r_cov = riemann_covariant(metric)
    n = r_cov.shape[0]
    indices = [(a, b, c, d) for a in range(n) for b in range(n) for c in range(n) for d in range(n)]
    return [
        _check_riemann_symmetry(
            "riemann_antisym_last",
            indices,
            lambda a, b, c, d: r_cov[a, b, c, d] + r_cov[a, b, d, c],
        ),
        _check_riemann_symmetry(
            "riemann_antisym_first",
            indices,
            lambda a, b, c, d: r_cov[a, b, c, d] + r_cov[b, a, c, d],
        ),
        _check_riemann_symmetry(
            "riemann_pair_exchange",
            indices,
            lambda a, b, c, d: r_cov[a, b, c, d] - r_cov[c, d, a, b],
        ),
    ]


def _evaluate_tensor_max(
    tensor: sp.Array,
    coord_map: Dict[str, sp.Symbol],
    sample: Dict[str, float],
) -> float:
    substitutions = {}
    for name, value in sample.items():
        symbol = coord_map.get(name, sp.symbols(name))
        substitutions[symbol] = value
    max_abs = 0.0
    for _, value in iterate_components(tensor):
        evaluated = value.subs(substitutions)
        try:
            numeric = float(sp.N(evaluated))
        except Exception:
            continue
        max_abs = max(max_abs, abs(numeric))
    return max_abs


def check_vacuum(
    metric: MetricSpec,
    sample_points: Optional[List[Dict[str, float]]] = None,
    epsilon: Optional[float] = None,
) -> CheckResult:
    einstein = _tensor_from_artifact(einstein_tensor(metric))
    if sample_points:
        parsed = parse_metric(metric)
        max_abs = 0.0
        for sample in sample_points:
            max_abs = max(max_abs, _evaluate_tensor_max(einstein, parsed.coord_map, sample))
        threshold = epsilon if epsilon is not None else 1e-8
        passed = max_abs <= threshold
        residual = str(max_abs)
        notes = f"max_abs={max_abs} threshold={threshold}"
        return CheckResult(check_name="vacuum", passed=passed, residual=residual, notes=notes)
    passed = True
    for _, value in iterate_components(einstein):
        if not _is_zero(value):
            passed = False
            break
    residual = None if passed else "G_ab != 0"
    return CheckResult(check_name="vacuum", passed=passed, residual=residual)


def check_contracted_bianchi(metric: MetricSpec) -> CheckResult:
    parsed = parse_metric(metric)
    gamma = christoffel_symbols(metric)
    gamma_tensor = _tensor_from_artifact(gamma)
    g_inv = metric_inverse(metric)
    einstein = _tensor_from_artifact(einstein_tensor(metric))
    n = len(parsed.coords)
    # Raise first index: G^a_b = g^{a c} G_cb
    g_mixed = sp.MutableDenseNDimArray.zeros(n, n)
    for a in range(n):
        for b in range(n):
            g_mixed[a, b] = sum(g_inv[a, c] * einstein[c, b] for c in range(n))
    # Divergence: nabla_a G^a_b
    for b in range(n):
        total = 0
        for a in range(n):
            term = sp.diff(g_mixed[a, b], parsed.coords[a])
            term += sum(gamma_tensor[a, a, c] * g_mixed[c, b] for c in range(n))
            term -= sum(gamma_tensor[c, a, b] * g_mixed[a, c] for c in range(n))
            total += term
        if not _is_zero(total):
            return CheckResult(
                check_name="contracted_bianchi",
                passed=False,
                residual=sp.sstr(total),
            )
    return CheckResult(check_name="contracted_bianchi", passed=True)
