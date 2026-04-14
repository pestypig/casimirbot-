# NHM2 Tranche-1 Stop Memo (2026-04-12)

## Decision
Decision: Stop tranche-1 implementation before code because the current tranche design cannot satisfy its own numeric gate truthfully. The design targets same-chart `T0i` and off-diagonal `Tij` recovery, but it does not name any admissible metric-side `T00` recovery target, and the live metric `WEC` blocker is the negative eulerian `T00` surface.

Tranche stop decision: `STOP_TRANCHE_1_BEFORE_CODE`

## Current Boundary
As of April 12, 2026, the published NHM2 control baseline remains:
- `overallState = fail`
- `currentClaimTier = diagnostic`
- `certificate_policy_result.state = pass`
- `observer_audit.state = fail`
- metric `WEC = -57110812.99010783`
- metric `DEC = -114221625.98021565`
- tile `WEC = -42531360768`
- tile `DEC = -85062721536`
- tile `WEC` lane remains paused
- `source_closure.state = review`

## Why Tranche 1 Stops Here
The tranche-1 design spec in `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/docs/audits/research/warp-nhm2-producer-state-recovery-tranche-2026-04-12.md` makes metric `WEC` and `DEC` improvement a hard gate, not a reporting preference.

But the same spec only names these tranche targets:
- `beta_i_same_chart`
- `d_beta_dt_i_same_chart`
- `sym_grad_beta_ij_same_chart`
- `Kij_offdiag_same_chart`
- `alpha_gradient_same_chart`
- final same-chart `T0i`
- final same-chart off-diagonal `Tij`

It does not name any tranche-1 `T00` recovery target.

That omission is fatal for the current gate because the metric observer path currently fails first on the negative eulerian energy density surface. In `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts`, the diagonal metric observer builder treats eulerian metric `WEC` as `rho`, and its robust `WEC` search is bounded by that same eulerian density. On the current control baseline, that eulerian value is already negative.

So a tranche that only adds `T0i` and off-diagonal `Tij` families cannot truthfully guarantee an upward metric `WEC` move. Observer completeness can change, but a negative metric `T00` surface remains a live fail path.

## Hard Stop Condition Hit
The implementation instructions required stopping if the patch could only improve structure or wording while leaving the failing-surface gate unsatisfied.

That condition is met now:
- same-chart producer support fields can be designed
- same-chart `T0i` and off-diagonal `Tij` can be proposed
- but the tranche still lacks a concrete producer-side `T00` recovery mechanism
- therefore the metric `WEC` gate cannot be satisfied on current tranche scope alone

## What Is Missing
A future recovery tranche must name an explicit metric-side density recovery target before code starts. At minimum that design reset must define:
- the exact producer-owned quantity that can move same-chart metric `T00`
- why that quantity changes the published eulerian metric `WEC` baseline
- how the `T00` path stays same-chart and non-proxy
- how the revised `T00` path interacts with the planned `T0i` and off-diagonal `Tij` families
- what exact baseline-versus-recovery delta is expected for metric `WEC` and `DEC`

## Frozen Write Surfaces
No tranche-1 code should proceed on these surfaces until the missing `T00` recovery target is designed explicitly:
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/natario-warp.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/modules/warp/warp-metric-adapter.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/server/energy-pipeline.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/scripts/warp-york-control-family-proof-pack.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-observer-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/shared/contracts/nhm2-full-loop-audit.v1.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/nhm2-observer-audit.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/warp-york-control-family-proof-pack.spec.ts`
- `C:/Users/dan/Desktop/RESEARCH 1,0/research/Alcubierre drive/casimirbot.com/versions/CasimirBot (9-3-25)/CasimirBot (9-3-25)/CasimirBot/tests/pipeline-ts-qi-guard.spec.ts`

## Next Active Workstreams
The next admissible follow-up is not implementation. It is a design reset:
1. add a metric-side `T00` recovery target to the pass-recovery design
2. prove why that target can move eulerian metric `WEC`
3. only then reopen the tranche-1 implementation surface for `T0i`/`Tij` work

## Non-Goals
This memo does not claim:
- NHM2 is near pass under the current model
- observer completeness alone is sufficient
- tile remediation should reopen
- certificate pass resolves the physics failure
- current tranche-1 design is implementation-safe as written
