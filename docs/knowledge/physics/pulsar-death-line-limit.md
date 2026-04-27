# Pulsar Death-Line Limit

The death-line limit in this lane is represented as a contract probe, not a hard ontology decision. The lane records whether an observation is inside, near, or outside an expected envelope under a declared model.

## Diagnostic Semantics

- `limit_kind = pulsar_death_line`
- state requirement: `(period_s, period_dot)` or explicit substitute state reference
- status values include `bridge_case` to encode tension cases without overwriting the baseline model

## Research Basis

- ASKAP PSR J0311+1402 (41 s) is reported as a bridge between normal pulsars and long-period radio transients while challenging standard death-line intuition in its parameter region: [arXiv:2503.07936](https://arxiv.org/abs/2503.07936).
