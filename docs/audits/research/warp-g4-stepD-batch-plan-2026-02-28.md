# Warp G4 Step-D Batch Plan (Semantics-First Closure)

Boundary statement (verbatim):
This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.

## Goal
Close the QI/QEI representation gap before any further recovery optimization by making quantity semantics explicit, fail-closed, and auditable end-to-end.

## Hard Constraints
1. No threshold/policy weakening.
2. FordRomanQI pass condition remains strict `< 1`.
3. Canonical decision authority remains unchanged.
4. Any missing required semantic evidence is classified fail-closed.

## Patch Order
1. Patch D1: Quantity semantic typing in QI producer.
   - Add `quantitySemanticType`, `quantityWorldlineClass`, `quantitySemanticComparable`, `quantitySemanticReason` to `evaluateQiGuardrail`.
   - Deterministic mapping from current sources; do not invent a renormalized-QFT channel.
2. Patch D2: Propagate semantics to viability/campaign artifacts.
   - Snapshot + FordRoman note emission + `qi-forensics` extraction/export.
3. Patch D3: Comparability fail-closed on semantics.
   - Step-A/B/C + parity comparability logic must require semantic comparability, not source-prefix alone.
4. Patch D4: Deterministic reporting and tests.
   - Add/update tests for semantic fail-close behavior and non-mutation contracts.

## Falsifiers for Step-D
1. If a case is tagged `comparable_canonical` while `quantitySemanticComparable != true`, Step-D fails.
2. If semantic fields are missing from `qi-forensics` for canonical waves, Step-D fails.
3. If any policy threshold/constant changes, Step-D fails.
4. If canonical authoritative class logic changes due to exploratory artifacts, Step-D fails.

## Required Commands
1. `npm run math:report`
2. `npm run math:validate`
3. `npm run test -- tests/warp-g4-stepA-summary.spec.ts tests/warp-g4-recovery-search.spec.ts tests/warp-g4-recovery-parity.spec.ts tests/qi-guardrail.spec.ts tests/warp-full-solve-campaign.spec.ts`
4. `npx vitest run tests/theory-checks.spec.ts tests/stress-energy-brick.spec.ts tests/york-time.spec.ts tests/gr-agent-loop.spec.ts tests/gr-agent-loop-baseline.spec.ts tests/gr-constraint-gate.spec.ts tests/gr-constraint-network.spec.ts tests/stress-energy-matter.spec.ts tests/helix-ask-graph-resolver.spec.ts tests/natario-metric-t00.spec.ts tests/warp-metric-adapter.spec.ts tests/warp-viability.spec.ts tests/proof-pack.spec.ts tests/proof-pack-strict-parity.spec.ts tests/pipeline-ts-qi-guard.spec.ts tests/qi-guardrail.spec.ts tests/lattice-probe-guardrails.spec.ts client/src/components/__tests__/warp-proof-ts-strict.spec.tsx`
5. `npm run warp:full-solve:canonical`
6. `npm run warp:full-solve:g4-recovery-search`
7. `npm run warp:full-solve:g4-recovery-parity`
8. `npm run warp:full-solve:g4-decision-ledger`
9. `npm run casimir:verify -- --ci --url http://127.0.0.1:5050/api/agi/adapter/run --trace-out artifacts/training-trace.jsonl`
10. `curl.exe -fsS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace-export.jsonl`

## Done Criteria
1. Semantic fields exist in producer output and canonical artifacts.
2. Comparable cohort logic is semantics-gated and deterministic.
3. All required tests pass.
4. Casimir verify returns `PASS` with `integrityOk=true` and certificate hash recorded.
