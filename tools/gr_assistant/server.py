from __future__ import annotations

from typing import Any, Dict

import sympy as sp
from fastapi import FastAPI

from .cas import (
    christoffel_symbols,
    einstein_tensor,
    iterate_components,
    kretschmann_scalar,
    ricci_scalar,
    ricci_tensor,
    riemann_tensor,
    serialize_tensor,
    simplify_expr,
    simplify_tensor,
)
from .checks import (
    check_christoffel_symmetry,
    check_contracted_bianchi,
    check_metric_symmetry,
    check_riemann_symmetries,
    check_vacuum,
    validate_metric,
)
from .schemas import (
    CheckResult,
    CheckResultsResponse,
    InvariantsResponse,
    MetricCheckRequest,
    MetricSpec,
    NumericSpotcheckRequest,
    ScalarArtifact,
    SimplifyRequest,
    SimplifyResponse,
    SubstituteRequest,
    TensorArtifact,
    UnitCheckRequest,
)
from .units import check_units

app = FastAPI(title="GR Assistant Physics Tools", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/physics/metric-validate", response_model=CheckResultsResponse)
def metric_validate(metric: MetricSpec) -> CheckResultsResponse:
    checks = validate_metric(metric)
    return CheckResultsResponse(checks=checks)


@app.post("/physics/christoffel", response_model=TensorArtifact)
def christoffel(metric: MetricSpec) -> TensorArtifact:
    return christoffel_symbols(metric)


@app.post("/physics/riemann", response_model=TensorArtifact)
def riemann(metric: MetricSpec) -> TensorArtifact:
    return riemann_tensor(metric)


@app.post("/physics/ricci", response_model=TensorArtifact)
def ricci(metric: MetricSpec) -> TensorArtifact:
    return ricci_tensor(metric)


@app.post("/physics/ricci-scalar", response_model=ScalarArtifact)
def ricci_scalar_endpoint(metric: MetricSpec) -> ScalarArtifact:
    value = ricci_scalar(metric)
    return ScalarArtifact(name="ricci_scalar", value=sp.sstr(value))


@app.post("/physics/einstein-tensor", response_model=TensorArtifact)
def einstein(metric: MetricSpec) -> TensorArtifact:
    return einstein_tensor(metric)


@app.post("/physics/invariants", response_model=InvariantsResponse)
def invariants(metric: MetricSpec) -> InvariantsResponse:
    scalars = {
        "ricci_scalar": sp.sstr(ricci_scalar(metric)),
        "kretschmann": sp.sstr(kretschmann_scalar(metric)),
    }
    return InvariantsResponse(scalars=scalars, meta={"coords": metric.coords})


@app.post("/physics/check-metric-symmetry", response_model=CheckResult)
def check_metric_symmetry_endpoint(metric: MetricSpec) -> CheckResult:
    return check_metric_symmetry(metric)


@app.post("/physics/check-christoffel-symmetry", response_model=CheckResult)
def check_christoffel_symmetry_endpoint(metric: MetricSpec) -> CheckResult:
    return check_christoffel_symmetry(metric)


@app.post("/physics/check-riemann-symmetries", response_model=CheckResultsResponse)
def check_riemann_symmetries_endpoint(metric: MetricSpec) -> CheckResultsResponse:
    return CheckResultsResponse(checks=check_riemann_symmetries(metric))


@app.post("/physics/check-contracted-bianchi", response_model=CheckResult)
def check_contracted_bianchi_endpoint(metric: MetricSpec) -> CheckResult:
    return check_contracted_bianchi(metric)


@app.post("/physics/check-vacuum", response_model=CheckResult)
def check_vacuum_endpoint(payload: MetricCheckRequest) -> CheckResult:
    return check_vacuum(payload.metric, payload.sample_points, payload.epsilon)


def _parse_component(value: Any) -> Any:
    if isinstance(value, list):
        return [_parse_component(entry) for entry in value]
    if isinstance(value, dict):
        return {k: _parse_component(v) for k, v in value.items()}
    try:
        return sp.sympify(value)
    except Exception:
        return value


@app.post("/physics/simplify", response_model=SimplifyResponse)
def simplify_endpoint(payload: SimplifyRequest) -> SimplifyResponse:
    if payload.expression:
        expr = sp.sympify(payload.expression)
        return SimplifyResponse(expression=sp.sstr(simplify_expr(expr, payload.level)))
    if payload.tensor:
        tensor = sp.Array(_parse_component(payload.tensor.components))
        simplified = simplify_tensor(tensor, payload.level)
        return SimplifyResponse(
            tensor=TensorArtifact(
                name=f"{payload.tensor.name}.simplified",
                indices=payload.tensor.indices,
                components=serialize_tensor(simplified),
                meta=payload.tensor.meta,
            )
        )
    return SimplifyResponse()


@app.post("/physics/substitute", response_model=SimplifyResponse)
def substitute_endpoint(payload: SubstituteRequest) -> SimplifyResponse:
    substitutions = {sp.symbols(key): sp.sympify(value) for key, value in payload.substitutions.items()}
    if payload.expression:
        expr = sp.sympify(payload.expression).subs(substitutions)
        return SimplifyResponse(expression=sp.sstr(expr))
    if payload.tensor:
        tensor = sp.Array(_parse_component(payload.tensor.components))
        replaced = sp.MutableDenseNDimArray(tensor)
        for idx in sp.ndindex(*tensor.shape):
            replaced[idx] = tensor[idx].subs(substitutions)
        return SimplifyResponse(
            tensor=TensorArtifact(
                name=f"{payload.tensor.name}.substituted",
                indices=payload.tensor.indices,
                components=serialize_tensor(sp.Array(replaced)),
                meta=payload.tensor.meta,
            )
        )
    return SimplifyResponse()


@app.post("/physics/numeric-spotcheck", response_model=CheckResult)
def numeric_spotcheck_endpoint(payload: NumericSpotcheckRequest) -> CheckResult:
    if not payload.sample_points:
        return CheckResult(check_name="numeric_spotcheck", passed=False, notes="no sample_points provided")
    substitutions_list = []
    for sample in payload.sample_points:
        substitutions_list.append({sp.symbols(name): value for name, value in sample.items()})
    max_abs = 0.0
    if payload.expression:
        expr = sp.sympify(payload.expression)
        for subs in substitutions_list:
            evaluated = expr.subs(subs)
            try:
                max_abs = max(max_abs, abs(float(sp.N(evaluated))))
            except Exception:
                return CheckResult(
                    check_name="numeric_spotcheck",
                    passed=False,
                    notes="failed to evaluate expression",
                )
    if payload.tensor:
        tensor = sp.Array(_parse_component(payload.tensor.components))
        for subs in substitutions_list:
            for _, value in iterate_components(tensor):
                evaluated = value.subs(subs)
                try:
                    max_abs = max(max_abs, abs(float(sp.N(evaluated))))
                except Exception:
                    return CheckResult(
                        check_name="numeric_spotcheck",
                        passed=False,
                        notes="failed to evaluate tensor",
                    )
    return CheckResult(
        check_name="numeric_spotcheck",
        passed=True,
        residual=str(max_abs),
        notes=f"max_abs={max_abs}",
    )


@app.post("/physics/unit-check", response_model=CheckResult)
def unit_check_endpoint(payload: UnitCheckRequest) -> CheckResult:
    return check_units(payload.expression, payload.symbol_units, payload.unit_system)
