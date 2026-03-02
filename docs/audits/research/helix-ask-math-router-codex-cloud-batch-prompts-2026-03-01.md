# Helix Ask Math Router: Codex Cloud Batch Prompt Pack (2026-03-01)

## How To Use

1. Run prompts in order: `P0 -> P1 -> P2 -> P3 -> P4 -> P5 -> P6`.
2. Paste each prompt as-is into Codex Cloud.
3. Require one commit per prompt.
4. Require Casimir verification PASS for each prompt.

## Global Constraints For Every Prompt

- Read and follow `AGENTS.md` and `WARP_AGENTS.md`.
- Do not use LLM free-form math as calculator-of-record for compute asks.
- Keep existing `/desktop` and `/mobile` panel-registry behavior intact.
- For each patch, run:
  - `npm run casimir:verify -- --ci --url http://127.0.0.1:5173/api/agi/adapter/run --export-url http://127.0.0.1:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl`
- Report in final output:
  - `verdict`
  - `firstFail`
  - `deltas`
  - `certificateHash`
  - `integrityOk`
  - `traceId`
  - `runId`

---

## P0 - Preflight Audit And Gap Map

```text
Task: do a read-only preflight for Helix Ask math routing and produce a gap map for deterministic math delegation.

Read:
- AGENTS.md
- WARP_AGENTS.md
- server/routes/agi.plan.ts
- server/services/helix-ask/math.ts
- scripts/py/math_solve.py
- server/services/planner/chat-b.ts
- server/specialists/solvers/math.expr.ts
- server/specialists/solvers/math.sum.ts
- server/specialists/verifiers/math.sum.verify.ts
- server/specialists/verifiers/math.sympy.verify.ts

Deliverables:
1) New markdown:
   docs/audits/research/helix-ask-math-router-gap-map-2026-03-01.md
2) At least 12 prompt probes and observed behavior:
   - determinant/matrix prompts
   - "treat e as variable"
   - symbolic solve
   - numeric matrix
   - warp viability intent
3) No code changes.

Output format:
- Facts with file references
- Failure modes ranked high/med/low
- Go/No-go recommendation for implementation
```

---

## P1 - Add `math.router` Shared Contract + Classifier

```text
Task: implement a deterministic router contract and lightweight classifier for Helix Ask math intent routing.

Goals:
- Introduce explicit routing contract for symbolic/numeric/warp delegation.
- Add constant-policy support, including e=symbol vs e=euler.

Implement:
1) Add shared contract/types:
   - shared/math-router.ts
   Include:
   - intent
   - domain
   - representation
   - assumptions.constants.e
   - engine
   - verifier
   - confidence
2) Add router/classifier service:
   - server/services/math-router/classify.ts
   Rule-first classification:
   - matrix/determinant/eigen/inverse => symbolic linear algebra
   - large numeric matrix requests => numeric linear algebra
   - warp viability/admissibility/certificate asks => warp delegation
3) Add tests:
   - tests/math-router-classify.spec.ts
   Include cases for:
   - det([[a,b],[c,d]]) treat e as variable
   - det numeric matrix
   - warp viability certificate ask

Constraints:
- No breaking API changes.
- Keep defaults backward compatible.

Required verification:
- run the Casimir verify command and include PASS block in final response.
```

---

## P2 - Symbolic Matrix Lane (Determinant/Inverse/Eigen) With Constant Policy

```text
Task: implement symbolic matrix solving lane with explicit constant policy.

Goals:
- Deterministic symbolic support for matrix operations.
- Respect "treat e as variable" via assumptions/constants policy.

Implement:
1) Add symbolic lane service:
   - server/services/math-router/lanes/symbolic.ts
   Support:
   - determinant
   - inverse
   - trace
   - eigenvalues (if feasible)
2) Add/extend Python helper for symbolic matrix operations:
   - scripts/py/math_router_symbolic.py (new preferred)
   or extend scripts/py/math_solve.py safely.
3) Ensure parser supports matrix literals and explicit matrix(...) forms.
4) Enforce constants policy:
   - constants.e = symbol => do not bind to Euler constant.
   - constants.e = euler => bind to Euler constant.
5) Add tests:
   - tests/math-router-symbolic.spec.ts
   Cases:
   - det([[a,b],[c,d]]) -> a*d - b*c
   - det([[1,2],[3,4]]) -> -2
   - derivative with e as symbol vs euler policy difference

Constraints:
- Safe parsing only.
- No eval of arbitrary Python code.

Required verification:
- run Casimir verify and report PASS block.
```

---

## P3 - Numeric Lane And Verification Checks

```text
Task: add numeric math lane for numeric-heavy calculations and residual checks.

Goals:
- Route numeric-heavy matrix tasks to numeric backend.
- Add verification metadata for deterministic trust.

Implement:
1) Add numeric lane service:
   - server/services/math-router/lanes/numeric.ts
2) Engine selection:
   - numeric matrix + size threshold => numeric lane
   - symbolic tokens present => symbolic lane
3) Add verifier helpers:
   - residual checks
   - sanity checks (NaN/Inf/conditioning warnings)
4) Add tests:
   - tests/math-router-numeric.spec.ts
   Cases:
   - 50x50 determinant numeric route
   - numeric expression evaluate route
   - NaN/Inf handling

Constraints:
- Keep result payload deterministic and structured.
- Expose warnings but do not overclaim certainty.

Required verification:
- run Casimir verify and report PASS block.
```

---

## P4 - Helix Ask Integration (Deterministic-First, LLM As Explainer)

```text
Task: integrate math.router into Helix Ask request path so compute asks are deterministic-first.

Goals:
- Compute asks should not silently fall to free-form generation.
- LLM remains for explanation and formatting, not calculator-of-record.

Implement:
1) Wire router into:
   - server/routes/agi.plan.ts
   and/or
   - server/services/helix-ask/math.ts
2) Policy:
   - if intent=compute and deterministic route fails, return deterministic failure message
     ("could not verify deterministically") unless user explicitly asks for heuristic estimate.
3) Add debug telemetry fields for route, engine, verifier, confidence.
4) Add integration tests:
   - tests/helix-ask-math-router.integration.spec.ts
   Cases:
   - determinant symbolic ask
   - e as symbol policy
   - warp viability asks not answered by generic math lane

Constraints:
- Preserve current behavior for non-math asks.
- No regression for existing warp certificate flows.

Required verification:
- run Casimir verify and report PASS block.
```

---

## P5 - Warp Delegation Guardrail (Certificate Path Enforcement)

```text
Task: enforce that warp viability/admissibility asks delegate to warp certificate tools, not generic math outputs.

Goals:
- Align runtime behavior with WARP_AGENTS policy.
- Prevent non-certified "physically viable" claims.

Implement:
1) Add delegation guard in router/classifier:
   - warp viability intents => physics.warp.viability path
2) Add response guard:
   - viability claims must cite certificate status and failing hard constraint when not admissible.
3) Add tests:
   - tests/helix-ask-warp-delegation-guard.spec.ts
   Cases:
   - "is this physically viable?" requires certificate.
   - no certificate => not certified response.

Constraints:
- Must match `WARP_AGENTS.md` policy language.

Required verification:
- run Casimir verify and report PASS block.
```

---

## P6 - Final Hardening, Docs, And Operator Runbook

```text
Task: finalize docs and runbook for operators using the new math.router path.

Goals:
- Make the system operable and auditable for future prompts.

Implement:
1) Add architecture doc:
   - docs/architecture/helix-ask-math-router-contract.md
   Include:
   - route decision table
   - constant policy
   - solver/verifier matrix
   - failure semantics
2) Add operator runbook:
   - docs/runbooks/helix-ask-math-router-debugging.md
   Include:
   - common failure cases
   - probe prompts
   - log fields to inspect
3) Add final summary note:
   - docs/audits/research/helix-ask-math-router-implementation-summary-2026-03-01.md

Required checks:
- Run relevant tests added in P1-P5
- Run Casimir verify and report PASS block.

Output:
- concise changelog
- files changed
- acceptance checklist
- verification block
```

---

## Optional Single-Shot Driver Prompt

```text
Execute P1 through P6 end-to-end in one run.

Rules:
- One commit per phase (P1..P6), plus final squash summary commit only if explicitly requested.
- Run Casimir verify after each phase.
- If any phase fails verification, stop and fix before moving on.
- Do not claim completion without final PASS verification block.
```
