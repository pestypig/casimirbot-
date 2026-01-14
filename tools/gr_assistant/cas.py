from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Tuple

import sympy as sp
from einsteinpy.symbolic import (
    ChristoffelSymbols,
    EinsteinTensor,
    MetricTensor,
    RicciScalar,
    RicciTensor,
    RiemannCurvatureTensor,
)

from .schemas import MetricSpec, TensorArtifact


@dataclass
class ParsedMetric:
    coords: List[sp.Symbol]
    coord_map: Dict[str, sp.Symbol]
    g_dd: sp.Matrix


def _normalize_assumptions(assumptions: Dict[str, Dict[str, bool]]) -> Dict[str, Dict[str, bool]]:
    normalized: Dict[str, Dict[str, bool]] = {}
    for key, values in (assumptions or {}).items():
        if not isinstance(values, dict):
            continue
        normalized[key] = {k: bool(v) for k, v in values.items() if isinstance(v, bool)}
    return normalized


def parse_metric(metric: MetricSpec) -> ParsedMetric:
    assumptions = _normalize_assumptions(metric.assumptions)
    coord_map: Dict[str, sp.Symbol] = {}
    for name in metric.coords:
        sym_assumptions = {"real": True, **assumptions.get(name, {})}
        coord_map[name] = sp.symbols(name, **sym_assumptions)
    coords = [coord_map[name] for name in metric.coords]
    g_rows: List[List[sp.Expr]] = []
    for row in metric.g_dd:
        g_row: List[sp.Expr] = []
        for entry in row:
            g_row.append(sp.sympify(entry, locals=coord_map))
        g_rows.append(g_row)
    g_dd = sp.Matrix(g_rows)
    return ParsedMetric(coords=coords, coord_map=coord_map, g_dd=g_dd)


def build_metric_tensor(metric: MetricSpec) -> MetricTensor:
    parsed = parse_metric(metric)
    return MetricTensor(parsed.g_dd, parsed.coords)


def _serialize_expr(expr: sp.Expr) -> str:
    return sp.sstr(expr)


def _serialize_nested(values: Any) -> Any:
    if isinstance(values, (list, tuple)):
        return [_serialize_nested(v) for v in values]
    if isinstance(values, dict):
        return {k: _serialize_nested(v) for k, v in values.items()}
    if isinstance(values, sp.Basic):
        return _serialize_expr(values)
    return values


def tensor_to_artifact(name: str, indices: str, tensor: sp.Array, metric: MetricSpec) -> TensorArtifact:
    components = _serialize_nested(tensor.tolist())
    return TensorArtifact(
        name=name,
        indices=indices,
        components=components,
        meta={"coords": metric.coords, "signature": metric.signature},
    )


def serialize_tensor(tensor: sp.Array) -> Any:
    return _serialize_nested(tensor.tolist())


def christoffel_symbols(metric: MetricSpec) -> TensorArtifact:
    metric_tensor = build_metric_tensor(metric)
    gamma = ChristoffelSymbols.from_metric(metric_tensor).tensor()
    return tensor_to_artifact("christoffel", "udd", gamma, metric)


def iterate_components(tensor: sp.Array) -> Iterable[Tuple[Tuple[int, ...], sp.Expr]]:
    for index in sp.ndindex(*tensor.shape):
        yield index, tensor[index]


def riemann_tensor(metric: MetricSpec) -> TensorArtifact:
    metric_tensor = build_metric_tensor(metric)
    riemann = RiemannCurvatureTensor.from_metric(metric_tensor).tensor()
    return tensor_to_artifact("riemann", "uddd", riemann, metric)


def ricci_tensor(metric: MetricSpec) -> TensorArtifact:
    metric_tensor = build_metric_tensor(metric)
    ricci = RicciTensor.from_metric(metric_tensor).tensor()
    return tensor_to_artifact("ricci", "dd", ricci, metric)


def ricci_scalar(metric: MetricSpec) -> sp.Expr:
    metric_tensor = build_metric_tensor(metric)
    return RicciScalar.from_metric(metric_tensor).expr


def einstein_tensor(metric: MetricSpec) -> TensorArtifact:
    metric_tensor = build_metric_tensor(metric)
    einstein = EinsteinTensor.from_metric(metric_tensor).tensor()
    return tensor_to_artifact("einstein", "dd", einstein, metric)


def simplify_expr(expr: sp.Expr, level: int) -> sp.Expr:
    if level <= 0:
        return expr
    try:
        simplified = sp.simplify(expr)
    except Exception:
        simplified = expr
    if level <= 1:
        return simplified
    try:
        simplified = sp.together(simplified)
    except Exception:
        return simplified
    if level <= 2:
        return simplified
    try:
        return sp.factor(simplified)
    except Exception:
        return simplified


def simplify_tensor(tensor: sp.Array, level: int) -> sp.Array:
    simplified = sp.MutableDenseNDimArray(tensor)
    for index, value in iterate_components(tensor):
        simplified[index] = simplify_expr(value, level)
    return sp.Array(simplified)


def metric_inverse(metric: MetricSpec) -> sp.Matrix:
    parsed = parse_metric(metric)
    return parsed.g_dd.inv()


def riemann_covariant(metric: MetricSpec) -> sp.Array:
    metric_tensor = build_metric_tensor(metric)
    riemann = RiemannCurvatureTensor.from_metric(metric_tensor).tensor()
    parsed = parse_metric(metric)
    g_dd = parsed.g_dd
    n = len(parsed.coords)
    lowered = sp.MutableDenseNDimArray.zeros(n, n, n, n)
    for a in range(n):
        for b in range(n):
            for c in range(n):
                for d in range(n):
                    lowered[a, b, c, d] = sum(g_dd[a, e] * riemann[e, b, c, d] for e in range(n))
    return sp.Array(lowered)


def kretschmann_scalar(metric: MetricSpec) -> sp.Expr:
    parsed = parse_metric(metric)
    g_inv = parsed.g_dd.inv()
    r_cov = riemann_covariant(metric)
    n = len(parsed.coords)
    r_raised = sp.MutableDenseNDimArray.zeros(n, n, n, n)
    for a in range(n):
        for b in range(n):
            for c in range(n):
                for d in range(n):
                    total = 0
                    for e in range(n):
                        for f in range(n):
                            for g in range(n):
                                for h in range(n):
                                    total += (
                                        g_inv[a, e]
                                        * g_inv[b, f]
                                        * g_inv[c, g]
                                        * g_inv[d, h]
                                        * r_cov[e, f, g, h]
                                    )
                    r_raised[a, b, c, d] = total
    total = 0
    for a in range(n):
        for b in range(n):
            for c in range(n):
                for d in range(n):
                    total += r_cov[a, b, c, d] * r_raised[a, b, c, d]
    return sp.simplify(total)
