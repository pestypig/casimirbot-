# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-05-31

## Opening Bell
This week in the Needle Hull lane, the repository did not announce a new NHM2 solve, reopen a blocked alpha profile, or promote warp work into a stronger claim tier. The real movement was quieter and, for this lane, still important. The repo spent the week building better containers for theory runs: places where scalar expressions, runtime traces, artifact receipts, gate states, and claim boundaries can sit side by side without borrowing authority from one another. That means more of the warp story can now be shown in one frame while still saying, plainly, which parts are diagnostic, which parts are read-only artifact views, and which parts remain blocked.

## Baseline
For a first-time reader, this lane is the repo's attempt to make speculative warp geometry legible as NHM2 modeling, constraint accounting, solver evidence, and policy-gated review rather than cinematic suggestion. The standing baseline in `docs/nhm2-closed-loop.md` remains conservative: NHM2 is a lapse-extended Natario-style candidate lane with bounded diagnostic and reduced-order outputs, not a certified transport result. Promotion still depends on source closure, observer audit coverage, QEI/worldline evidence, certificate issuance, and certificate integrity.

## What changed this week
The main repo movement came on May 29 and May 30 in commits `e9f69d0a` (`Add theory runtime workbench`), `035fccd4` (`Add theory runtime adapter coverage`), and `26ce653c` (`Add Google account session support`). Only the first two are truly lane-defining, and even there the progress is mostly structural. `docs/theory-compound-run-workbench.md`, `docs/theory-runtime-entrypoints.md`, `server/services/theory/runtime-adapters.ts`, and `server/services/theory/artifact-backed-compound-run.ts` establish a workbench where theory rows can display scalar math, tensor/runtime traces, receipts, gates, and boundary notes together. For NHM2, that matters because the repo now has a cleaner way to show existing warp evidence without quietly treating visibility as validation.

The NHM2-specific binding work sharpened on May 30. `server/services/theory/runtime-adapters/gr-nhm2-runtime-adapter.ts` and `server/services/theory/warp-nhm2-artifact-adapters.ts` read existing full-solve and selected-family artifacts, surface gate states, and fail closed on missing or stale evidence. `shared/theory/nhm2-runtime-field-map.ts` goes a step further by tying badge IDs like `nhm2.closure.source_residual`, `nhm2.qei.sampling_window`, and `nhm2.claim_boundary.diagnostic_only` to concrete artifact fields, scalar cuts, required evidence, and gate names. The associated tests in `server/services/theory/runtime-adapters/__tests__/gr-nhm2-runtime-adapter.test.ts`, `server/services/theory/__tests__/warp-nhm2-artifact-adapters.spec.ts`, and `shared/theory/__tests__/nhm2-runtime-field-map.spec.ts` are explicit about the posture: no promotion when certificate evidence is missing, no silent pass when source closure is absent, no forbidden language leaking out of the receipt layer.

What did not move is just as important. `docs/research/nhm2-lapse-alpha-sweep-status-latest.md` still lists `stage1_centerline_alpha_0p7000_v1` as `fail` with `failed_timeout`, and `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` still holds `overallState | review |` with blockers `insufficient_provenance, policy_review_required`. The lane gained better instrumentation for reading and presenting its evidence, but it did not gain a new passing transport profile this week.

## What it is trying to do
This week's work is trying to turn warp evidence into a disciplined runtime grammar. The repo wants NHM2 rows to say exactly whether they are model context, runtime-bound output, gate summary, or claim boundary, and then attach the receipts and missing signals that justify that label. That makes later solver or audit work easier to trust because the path from artifact to interpretation is less hand-wavy.

## Why this matters for the larger picture
The broader project needs a way to think with difficult geometry without letting dashboards, traces, or scalar cuts impersonate field-equation closure. The new workbench and adapters move in that direction. They make it easier for Helix panels and theory routes to show what the repo actually has, while keeping missing source closure, incomplete QEI semantics, and certificate blockers visible instead of smoothing them over.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week made the frontier more readable: not wider, not conquered, but arranged so a careful reader can tell where the true unknowns still live.

## Gate to watch
The next validation step is still a fresh NHM2 selected-family rerun that clears the timeout-bound alpha sweep and reconciles source-closure, observer-audit, and certificate-integrity evidence into a full-loop audit state stronger than `review`.

## Evidence trail
- commit `e9f69d0a` on 2026-05-29: `Add theory runtime workbench`
- commit `035fccd4` on 2026-05-30: `Add theory runtime adapter coverage`
- commit `26ce653c` on 2026-05-30: `Add Google account session support` with NHM2 side effects in `shared/theory/nhm2-runtime-field-map.ts`
- `docs/nhm2-closed-loop.md`
- `docs/theory-compound-run-workbench.md`
- `docs/theory-runtime-entrypoints.md`
- `server/services/theory/runtime-adapters/gr-nhm2-runtime-adapter.ts`
- `server/services/theory/warp-nhm2-artifact-adapters.ts`
- `shared/theory/nhm2-runtime-field-map.ts`
- `docs/research/nhm2-lapse-alpha-sweep-status-latest.md`

## Quiet Ledger
This week did not claim a solved warp concept, a fresh NHM2 admissibility result, a new lower-alpha pass, or a certified transport surface. What remains unresolved is the same hard middle: timeouts in the selected-family sweep, provenance gaps inside the full-loop audit, and a promotion path that still blocks until source closure, observer evidence, and certificate integrity line up together.

## Closing Path Note
There is a useful kind of maturity in a week like this. The repo did not try to sound larger than its evidence. Instead, it built cleaner bowls for evidence, gates, and claim boundaries, and it taught the NHM2 lane to speak more precisely about what each row means. That is not the same as closing Einstein-side and source-side questions, but it does make the work steadier. When a difficult lane learns how to refuse confusion, its future progress becomes easier to recognize when it finally arrives.
