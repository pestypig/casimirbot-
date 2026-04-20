# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-04-19

## Opening Bell
This week the Needle Hull / NHM2 lane felt less like a sketch of a future machine and more like a lab learning to label its instruments correctly. The repo did not announce salvation. It worked on a narrower and more durable task: deciding what the metric-side tensor channels really mean, what route is allowed to count as evidence, and what still fails even after those channels are admitted for a selected closure path. The mood is disciplined rather than triumphant. A few doors opened on semantics and publication, but the main observer gate still says no, and the new feasibility sweep says simple profile retuning will not talk that no into yes.

## Baseline
For a first-time reader, this lane is the repo's effort to turn a Natario-style zero-expansion transport core into an NHM2 shift+lapse research lane with explicit source accounting, observer-condition auditing, mission-time outputs, and policy gates. The standing baseline in `docs/nhm2-closed-loop.md` is still conservative: `modules/warp/natario-warp.ts` remains reduced-order, Stage 3 certificate logic is separate from transport truth, and stronger claims stay blocked until source closure, observer evidence, and policy artifacts align.

## What changed this week
The first clear move was semantic. The April 14 memo `docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md` tightened the repo's 3+1 grammar for the metric-required lane: `T00 -> E`, `T0i -> J_i`, and `Tij -> S_ij` in `comoving_cartesian`, with an explicit stop condition when those quantities are not honestly available. That gave the later code and audits a narrower target. Instead of vague talk about "full tensor," the lane now names what same-chart emission would mean and when it must still refuse to pretend.

The second move was producer and audit plumbing. The April 16 commits `8f4d5c09` and `6c488d49` expanded `shared/contracts/nhm2-observer-audit.v1.ts`, `shared/contracts/nhm2-full-loop-audit.v1.ts`, `server/energy-pipeline.ts`, `scripts/warp-york-control-family-proof-pack.ts`, and `modules/warp/natario-warp.ts`. In the current repo state, `docs/audits/research/warp-nhm2-observer-audit-latest.md` now reports `currentEmissionShape = full_tensor`, points to `modules/warp/natario-warp.ts::calculateMetricStressEnergyTensorAtPointFromShiftField`, and records route evidence for `einstein_tensor_geometry_fd4_v1`, including zero reported residuals for emitted `T01`, `T02`, `T03`, `T12`, `T13`, and `T23` over the cited comparison samples. The companion brief `docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md` makes the resulting policy posture explicit: raw producer admission is still experimental, but the selected semantic closure path is now `full_einstein_tensor` on evidence rather than on wishful phrasing.

The third move was a useful refusal. Even with that metric-side admission progress, `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` still holds `currentClaimTier = diagnostic`, `highestPassingClaimTier = diagnostic`, and `overallState = fail`, blocked by `observer_blocking_violation` and `policy_review_required`. The observer audit shows concrete WEC and DEC failures on both surfaces, with metric-side minima at `-58267450.989558905` and tile-side minima at `-43392729088`, while tile authority remains `proxy_limited`. A fresh quiet warning appears in `docs/audits/research/warp-nhm2-metric-wec-feasibility-latest.md`: across 16 nearby `stage1_centerline_alpha_*` profiles, all tested metric WEC values stay negative, so the local neighborhood is marked `local_neighborhood_non_viable` and the next patch should target a physics-local model-term change, not another dial-only sweep.

## What it is trying to do
This week's work is trying to turn NHM2 from a partly inferred lane into a lane with declared semantics, route-owned tensor emission, and machine-readable reasons for why promotion still stops. The aim is not to prove warp transport is solved. The aim is to make every rung of the ladder legible: which tensor channels are emitted, which route is accepted for closure, which observer failures are real, and which remaining surfaces are still only proxies or policy wrappers.

## Why this matters for the larger picture
That discipline matters because the broader project is trying to make speculative geometry auditable rather than theatrical. If the repo can keep metric semantics, source closure, observer failure, mission-time outputs, and certificate policy in separate boxes, later progress will mean more. The lane becomes less vulnerable to its own dashboards. A passing certificate wrapper in `docs/audits/research/warp-nhm2-certificate-policy-latest.md` can stay what it is, a policy object with `verdict = PASS` and integrity `ok`, without being misread as a field-equation closure or a transport victory.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week nudges that frontier a little closer by showing that better semantics can sharpen the questions even when they do not soften the answer.

## Gate to watch
The next validation step is to show a physics-local change that can lift the still-negative metric-required WEC without leaning on centerline-alpha retuning, while also clarifying whether the tile-effective proxy lane can ever graduate beyond its current proxy-limited authority.

## Evidence trail
- `d035dc96` on 2026-04-14: `docs(nhm2): define same-chart full-tensor 3+1 semantics`
- `8f4d5c09` on 2026-04-16: `Resolve NHM2 observer metric admission branches`
- `6c488d49` on 2026-04-16: `Resolve NHM2 metric admission branches with producer evidence`
- `docs/nhm2-closed-loop.md`
- `docs/audits/research/warp-nhm2-full-tensor-semantics-latest.md`
- `docs/audits/research/warp-nhm2-metric-evaluator-research-basis-latest.md`
- `docs/audits/research/warp-nhm2-semantic-closure-route-decision-brief-latest.md`
- `docs/audits/research/warp-nhm2-observer-audit-latest.md` and `docs/audits/research/warp-nhm2-full-loop-audit-latest.md`
- `docs/audits/research/warp-nhm2-metric-wec-feasibility-latest.md`
- `modules/warp/natario-warp.ts`, `server/energy-pipeline.ts`, `tests/nhm2-observer-audit.spec.ts`, and `tests/nhm2-metric-wec-feasibility-sweep.spec.ts`

## Quiet Ledger
This week did not claim physical viability, closed-loop transport success, observer clearance, or tile-side tensor authority. The full-loop lane still fails, the observer lane still bottoms out on negative-energy-density-linked WEC and DEC violations, the tile branch remains proxy-limited, and the new metric WEC sweep says local profile tuning is not enough. The certificate wrapper remains real evidence about policy state, but it is not a substitute for the unresolved physics and audit gates.

## Closing Path Note
There is earned optimism here, but it is modest. The repo now speaks more precisely about what the NHM2 metric lane is doing, what route it trusts, and where that trust stops. That kind of precision is not decoration. It is how a speculative program learns to carry its own weight. When a lane can improve its semantics and still leave the failure visible, it becomes easier to believe the next true pass, if it comes, will be worth something.
