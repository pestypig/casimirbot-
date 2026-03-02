# Helix Ask Math Router Preflight Gap Map (2026-03-01)

## Scope
Read-only preflight across:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/math.ts`
- `scripts/py/math_solve.py`
- `server/services/planner/chat-b.ts`
- `server/specialists/solvers/math.expr.ts`
- `server/specialists/solvers/math.sum.ts`
- `server/specialists/verifiers/math.sum.verify.ts`
- `server/specialists/verifiers/math.sympy.verify.ts`

## Facts (with source references)
1. Current Helix Ask math trigger is regex-based and only keys on solve/derivative/equation/integral style language; matrix operators (determinant, inverse, eigen) are not in the trigger list. 
2. Current JS math path uses Nerdamer first, then optional Python fallback only when `ENABLE_PY_CHECKERS=1`. 
3. Deterministic failure message already exists: "I could not verify this math problem deterministically." 
4. Python solver binds lowercase `e` directly to Euler’s constant (`E`) and does not expose policy control for `e=symbol` vs `e=euler`.
5. Existing specialist solver `math.expr` is deterministic echo + downstream verification oriented (no actual compute).
6. Existing specialist solver `math.sum` and verifier `math.sum.verify` are deterministic and structured, with absolute error gate.
7. Symbolic verifier is env-gated (`ENABLE_PY_CHECKERS`) and returns `python_checker_disabled` when off.
8. Warp viability intent detection and policy language already exists in planner layer, including certificate requirement and HARD-constraint wording.
9. Warp grounding model already carries `certificateHash`, `certificateId`, constraints and status fields.

## Prompt probes (12) and observed behavior
Execution command used:

```bash
npx tsx /tmp/p0-probes.ts
```

| # | Probe prompt | Observed route/behavior |
|---|---|---|
| 1 | `det([[a,b],[c,d]])` | `isMath=false`, solver not invoked (`null`). |
| 2 | `det([[1,2],[3,4]])` | `isMath=false`, solver not invoked (`null`). |
| 3 | `treat e as variable and compute derivative of e^x` | Routed as derivative; returns `e^x` (no constant policy switch). |
| 4 | `compute derivative of e^x` | Same as #3 (`e^x`), no distinguishable constant policy control. |
| 5 | `solve x^2-5x+6=0` | `isMath=true` but JS solver throws `solve requires a minimum of 2 arguments`. |
| 6 | `solve x + y = 3 and x - y = 1` | `isMath=true` but same solve error as #5. |
| 7 | `inverse([[1,2],[3,4]])` | `isMath=false`, no matrix lane. |
| 8 | `eigenvalues of [[1,2],[3,4]]` | `isMath=false`, no matrix lane. |
| 9 | `determinant of a 50x50 numeric matrix of random entries` | `isMath=false`, no numeric matrix route. |
|10 | `what is physically viable warp bubble status?` | `isMath=false` (good: not treated as generic math). |
|11 | `is this warp configuration admissible with certificate hash?` | `isMath=false` (good: not treated as generic math). |
|12 | `evaluate (2+3)*4` | `isMath=true`, deterministic evaluate returns `20`. |

## Failure modes (ranked)

### High
1. **No matrix intent coverage**: determinant/inverse/eigen prompts currently bypass math path entirely.
2. **No explicit math router contract**: there is no shared route envelope that records `intent/domain/representation/engine/verifier/confidence`.
3. **No constant policy for `e`**: parser/runtime cannot explicitly toggle `e` as symbol vs Euler constant.
4. **Solve reliability gap**: basic `solve` prompts can fail in current JS path before fallback.
5. **No numeric lane for large matrices**: no threshold-based engine selection or residual metadata.

### Medium
1. **Verifier metadata not normalized across math paths**: output shape does not consistently include residual/sanity warnings.
2. **Helix integration not explicitly deterministic-first by compute intent classification**: deterministic behavior exists but route policy is implicit.
3. **No dedicated warp delegation guard in math routing because math routing layer is not present yet**.

### Low
1. **Python fallback availability coupled to env var** (`ENABLE_PY_CHECKERS`) can reduce capability in some deployments.
2. **Prompt normalization may be brittle for advanced matrix literal forms** (future parser hardening needed).

## Go/No-Go recommendation
**Go (with phased implementation as defined in P1–P6).**

Rationale:
- Core deterministic primitives and verification patterns already exist and can be extended.
- Warp viability certificate guardrails are already codified in planner policy, enabling safe delegation once router is added.
- Highest-risk gaps (matrix intent, constant policy, numeric lane) are additive and can be implemented without breaking non-math flows if scoped behind explicit classifier/routing.
