from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, ConfigDict, model_validator


class MetricSpec(BaseModel):
    coords: List[str]
    g_dd: List[List[Any]]
    assumptions: Dict[str, Dict[str, bool]] = Field(default_factory=dict)
    signature: str = "-+++"

    model_config = ConfigDict(extra="allow")

    @model_validator(mode="after")
    def validate_shape(self) -> "MetricSpec":
        size = len(self.coords)
        if size == 0:
            raise ValueError("coords must be non-empty")
        if len(self.g_dd) != size:
            raise ValueError("g_dd must match coords length")
        for row in self.g_dd:
            if len(row) != size:
                raise ValueError("g_dd must be a square matrix")
        return self


class TensorArtifact(BaseModel):
    name: str
    indices: str
    components: Any
    meta: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")


class ScalarArtifact(BaseModel):
    name: str
    value: str
    meta: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(extra="allow")


class CheckResult(BaseModel):
    check_name: str
    passed: bool
    residual: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(extra="allow")


class CheckResultsResponse(BaseModel):
    checks: List[CheckResult]


class SimplifyRequest(BaseModel):
    expression: Optional[str] = None
    tensor: Optional[TensorArtifact] = None
    level: int = 1


class SimplifyResponse(BaseModel):
    expression: Optional[str] = None
    tensor: Optional[TensorArtifact] = None


class SubstituteRequest(BaseModel):
    expression: Optional[str] = None
    tensor: Optional[TensorArtifact] = None
    substitutions: Dict[str, Any] = Field(default_factory=dict)


class NumericSpotcheckRequest(BaseModel):
    expression: Optional[str] = None
    tensor: Optional[TensorArtifact] = None
    sample_points: List[Dict[str, float]]


class UnitCheckRequest(BaseModel):
    expression: str
    unit_system: str = "SI"
    symbol_units: Dict[str, str] = Field(default_factory=dict)


class MetricRequest(BaseModel):
    metric: MetricSpec


class MetricCheckRequest(BaseModel):
    metric: MetricSpec
    sample_points: Optional[List[Dict[str, float]]] = None
    epsilon: Optional[float] = None


class InvariantsResponse(BaseModel):
    scalars: Dict[str, str]
    meta: Dict[str, Any] = Field(default_factory=dict)
