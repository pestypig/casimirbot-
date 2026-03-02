# Helix Ask Math Router Contract

## Decision table
- Warp viability/certificate/admissibility intents -> `physics.warp.viability` delegation.
- Matrix determinant/inverse/eigen/trace with symbolic tokens -> symbolic lane.
- Large numeric matrix intents (e.g. 50x50) -> numeric lane.
- General compute expressions -> symbolic-expression deterministic path.

## Constant policy
- `assumptions.constants.e = symbol`: parse `e` as symbolic identifier.
- `assumptions.constants.e = euler`: bind `e` to Euler constant.

## Solver/verifier matrix
- Symbolic lane: `scripts/py/math_router_symbolic.py` + `math.sympy.verify`.
- Numeric lane: TS numeric evaluator + residual/sanity checks (`math.numeric.verify` contract field).
- Warp delegation lane: `physics.warp.viability` certificate path.

## Failure semantics
- Deterministic compute failure returns: `I could not verify this math problem deterministically.`
- Warp viability via generic math lane returns not-certified guard message with HARD-constraint reference.
