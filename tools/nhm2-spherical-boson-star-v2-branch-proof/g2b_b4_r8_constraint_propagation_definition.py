"""Authority-neutral G2B-B4-R8 continuum constraint definition.

This module contains no candidate data and performs no solve.  It fixes the
continuum identity and the Clenshaw--Curtis weighting convention that a later,
separately authorized numerical proposal must use.
"""

from __future__ import annotations

import math
from collections.abc import Sequence


DEFINITION_ID = "nhm2-g2b-b4-r8-constraint-propagation-v1"


def clenshaw_curtis_weights(count: int) -> tuple[float, ...]:
    """Return weights on ascending Chebyshev--Lobatto nodes in [0, 1].

    ``count`` includes both endpoints.  The implementation is the direct
    cosine-series definition and is independent of candidate endpoint data.
    """

    if count < 2:
        raise ValueError("count_must_include_two_endpoints")
    n = count - 1
    theta = tuple(math.pi * j / n for j in range(count))
    weights = [0.0] * count
    interior = list(range(1, n))
    values = [1.0] * len(interior)

    if n % 2 == 0:
        endpoint = 1.0 / (n * n - 1.0)
        for k in range(1, n // 2):
            denominator = 4.0 * k * k - 1.0
            for ordinal, j in enumerate(interior):
                values[ordinal] -= 2.0 * math.cos(2.0 * k * theta[j]) / denominator
        for ordinal, j in enumerate(interior):
            values[ordinal] -= math.cos(n * theta[j]) / (n * n - 1.0)
    else:
        endpoint = 1.0 / (n * n)
        for k in range(1, (n + 1) // 2):
            denominator = 4.0 * k * k - 1.0
            for ordinal, j in enumerate(interior):
                values[ordinal] -= 2.0 * math.cos(2.0 * k * theta[j]) / denominator

    weights[0] = endpoint / 2.0
    weights[-1] = endpoint / 2.0
    for ordinal, j in enumerate(interior):
        weights[j] = values[ordinal] / n
    return tuple(weights)


def weighted_l2(values: Sequence[float], weights: Sequence[float]) -> float:
    """Return the frozen dimensionless [0,1] weighted L2 estimator."""

    if len(values) != len(weights) or len(values) < 2:
        raise ValueError("value_weight_shape_mismatch")
    if any(not math.isfinite(value) for value in values):
        raise ValueError("nonfinite_value")
    if any(not math.isfinite(weight) or weight <= 0.0 for weight in weights):
        raise ValueError("invalid_weight")
    return math.sqrt(math.fsum(weight * value * value for value, weight in zip(values, weights, strict=True)))


def nodal_sup(values: Sequence[float]) -> float:
    """Return the frozen nodal estimator of the continuum essential sup norm."""

    if not values or any(not math.isfinite(value) for value in values):
        raise ValueError("invalid_values")
    return max(abs(value) for value in values)

