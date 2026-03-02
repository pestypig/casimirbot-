# Commit-Pinned Scientific Synthesis for the Reduced-Order Warp Full-Solve Framework

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Executive Verdict

[Canonical-authoritative] QEI/QI theory constrains smeared negative-energy observables with sampling- and model-dependent bounds; this is the correct high-level reference class for a Ford-Roman-style gate.

[Canonical-authoritative] Renormalized stress-energy semantics matter. Any comparison to QEI/QI bounds depends on the operator definition, renormalization scheme, sampling normalization, and applicability regime.

[Promoted-candidate] At `commit_pin=d36b7fa1de2ef0188e77ac16a79232228502c814`, the repo produces deterministic campaign artifacts and a canonical result of `REDUCED_ORDER_ADMISSIBLE` with counts `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`.

[Promoted-candidate] The promoted candidate (`case_0001`) reports `marginRatioRaw≈0.128906797`, `lhs_Jm3≈-3.093763129`, and `boundUsed_Jm3≈-24.000000000` in committed full-solve artifacts.

[Exploratory] This does not justify a physical-feasibility claim. It supports a reduced-order, evidence-gated computational result under repo-defined semantics.

## Repository Framework Mapped to Gate Semantics

[Promoted-candidate] `tools/warpViability.ts` evaluates constraints from pipeline outputs, including the Ford-Roman-like G4 gate using `qiGuardrail` fields (`lhs_Jm3`, bounds, `marginRatio`, `K`, selected `tau`, source, curvature/applicability metadata).

[Canonical-authoritative] G4 pass logic is deterministic and strict: `marginRatio < 1` plus required source/contract/applicability/curvature conditions in strict mode; ordered reason codes are emitted on failure.

[Promoted-candidate] Campaign artifacts preserve canonical vs scan classifications and mismatch reasons for governance traceability.

[Exploratory] The current bridge between metric/proxy channels and target QEI semantics is software-evidenced but remains a modeling assumption for physics interpretation.

## Repo Evidence Table

| Quantity | Producer | Consumer | Units | Current Value(s) | Confidence | Tier |
|---|---|---|---|---|---|---|
| Boundary statement | Campaign/ledger writers | Governance/reporting | n/a | Exact statement present in canonical artifacts | High | [Canonical-authoritative] |
| Canonical decision | `scripts/warp-full-solve-campaign.ts` | Execution report/ledger | categorical | `REDUCED_ORDER_ADMISSIBLE` | High | [Promoted-candidate] |
| Gate counts | Same | Same | counts | `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1` | High | [Promoted-candidate] |
| Best candidate id | Recovery/candidate selection | Promotion/ledger | id | `case_0001` | High | [Canonical-authoritative] |
| `lhs_Jm3` | `tools/warpViability.ts` | G4 predicate | J/m^3 | `-3.0937631287...` (best candidate) | Medium-High | [Promoted-candidate] |
| `boundComputed_Jm3` | Same | G4 predicate | J/m^3 | `-24.0000000000...` | Medium-High | [Promoted-candidate] |
| `boundUsed_Jm3` | Same | G4 predicate | J/m^3 | `-24.0000000000...` and `boundFloorApplied=false` | Medium-High | [Promoted-candidate] |
| `marginRatioRaw` | Same | G4 predicate | unitless | `0.1289067970...` | Medium-High | [Promoted-candidate] |
| `applicabilityStatus` | Same | G4 strict gate | categorical | `PASS` for canonical promoted lane waves | Medium | [Promoted-candidate] |
| `tau_s` / `tauSelected_s` | Same | Bound computation | s | `0.00002` / `0.00002` | Medium | [Promoted-candidate] |
| `K` | Same | Bound computation | implied J*s^4/m^3 | `3.8e-30` | Low-Medium | [Exploratory] |
| `rhoSource` | Same | Strict source gate | string | `warp.metric.T00.natario_sdf.shift` | Medium-High | [Canonical-authoritative] |
| `rhoMetric_Jm3` | Pipeline diagnostics | Coupling diagnostics | J/m^3 | `-89888730.09553961` | Medium | [Promoted-candidate] |
| `rhoProxy_Jm3` | Proxy channel | Coupling diagnostics | J/m^3 | `-2.5512274856810015` | Low-Medium | [Exploratory] |
| `rhoCoupledShadow_Jm3` | Coupling mode shadow | QI functional assembly | J/m^3 | `-44944366.32338355` (`couplingAlpha=0.5`) | Low-Medium | [Exploratory] |
| Semantic bridge fields | Semantic bridge layer | Comparability checks | categorical/boolean | Target type set; bridge mode strict evidence-gated | Medium | [Exploratory] |

## Literature Parity Table

| Repo construct | Literature reference class | Required literature conditions | Repo status | Parity verdict | Tier |
|---|---|---|---|---|---|
| Ford-Roman-like gate (`marginRatio < 1`) | Timelike smeared QEI/QI lower-bound form | Renormalized operator semantics + sampling definition + state/field assumptions | Gate exists and is deterministic | Partial parity | [Promoted-candidate] |
| `sampler="hann"` and `K` usage | Sampling-function-dependent constants | Kernel normalization and field-model-specific derivation | Kernel/K audits are committed | Partial parity; needs external parity replay | [Exploratory] |
| Curvature/applicability checks | Curved-space applicability window | Curvature-scale relationship and validity regime evidence | Curvature audit artifact committed | Partial parity | [Promoted-candidate] |
| Renormalization semantics flags | Point-splitting/Hadamard style semantics | Explicit operator mapping evidence | Operator audit artifact committed | Partial parity; still model-bounded | [Exploratory] |
| V&V framing | ASME/NASA/GUM style credibility posture | Traceability, uncertainty, reproducibility | Evidence snapshot + traces + audits committed | Partial parity | [Promoted-candidate] |

## Cohesive Model Narrative

[Canonical-authoritative] The repo should be interpreted as a reduced-order, falsifiable gate system with deterministic evidence production.

[Promoted-candidate] The promoted lane demonstrates an internally consistent pass profile for G4 and campaign gates under the current policy and strict checks.

[Exploratory] Physics-level interpretation still depends on external validation of operator equivalence and benchmark parity; current status is strong computational governance, not physical-feasibility proof.

## Falsifier Matrix

| Domain | Deterministic falsifier | Invalidates |
|---|---|---|
| Operator mapping | Operator audit missing or blocked | Literature-parity QEI interpretation |
| Kernel/K provenance | Kernel audit missing/blocked or cannot replay bound | K/sampler grounding claims |
| Curvature applicability | Applicability audit missing/blocked or non-pass regime | Curved-space validity claims |
| Uncertainty robustness | Uncertainty audit missing/blocked or non-robust decision | Margin robustness claims |
| Reproducibility | Snapshot/traces missing or non-replayable | Reproducible evidence claims |
| Determinism | Same commit/config produces divergent gate results | Falsifiability/reliability claims |

## Strong-Claim Upgrade Spec (Next Phase)

1. Add explicit external replay checks that re-derive bound terms from kernel provenance for the selected sampler and field assumptions.
2. Add benchmarked uncertainty thresholds and publish acceptance bands tied to decision robustness.
3. Add external parity test cases for operator semantics where feasible, with fail-closed behavior if parity is not met.
4. Keep Casimir verification as a hard completion gate for every patch.

## End Block

[Canonical-authoritative] Current commit state:
- `blocked=false`
- `commit_pin=d36b7fa1de2ef0188e77ac16a79232228502c814`
- `boundary_statement_verbatim_confirmed=true`
- `strongClaimClosure.passAll=true` in `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`

Next actions:
- Run deep-research synthesis against this commit pin with strict tier separation.
- Expand cross-literature parity replays for kernel/K and operator semantics.
- Maintain fail-closed policy and required Casimir verification fields in every patch report.
