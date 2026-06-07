# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-06-07

## Opening Bell
This week, the Needle Hull lane did not announce a new pass through the hard physics gates. It did something quieter and, in its own way, more useful. The repo spent the week teaching NHM2 how to speak about itself with finer discipline: what is a runtime sample, what is a blocked gate, what is only a reference relation, and what must stay outside the zone of promotion. The feeling is less like a launch and more like a careful relabeling of instruments in the control room. For a lane built on speculative geometry and strict claim boundaries, that kind of housekeeping is not decoration. It is how trust is kept from drifting.

## Baseline
For a first-time reader, this lane is the repository's effort to turn speculative warp geometry into legible NHM2 modeling, constraint tracking, solver evidence, and policy-gated review. The standing baseline in `docs/nhm2-closed-loop.md` is still conservative: NHM2 is a lapse-extended Natario-style candidate lane with diagnostic and reduced-order outputs under review, not a certified transport result.

## What changed this week
The clearest lane movement came in commit `88e8a5e71` (`Add NHM2 full solve theory badges`) and then in `93137b509` (`Add theory runtime badges and voice callouts`). The center of gravity was not a new solve. It was a larger theory vocabulary for the existing solve surfaces. `shared/theory/nhm2-full-solve-theory-badges.ts` now defines a broad NHM2 badge set around observer projections, tensor authority, wall-region `T00` traces, source residuals, QEI dossier requirements, curvature invariants, clocking rows, and explicit claim-boundary badges. The tests in `shared/theory/__tests__/nhm2-full-solve-theory-badges.spec.ts` are unusually direct: every badge must stay diagnostic-only, promotion must remain blocked, and forbidden language like validated propulsion or working warp drive must not appear.

The next step was tying those badges to runtime receipts instead of letting them float as abstract labels. `shared/theory/nhm2-runtime-field-map.ts` now binds NHM2 badge IDs to artifact fields, scalar cuts, required evidence, and named gates such as `source_closure`, `observer_audit`, `qei_applicability`, `tensor_authority`, and `certificate_integrity`. In parallel, `server/services/theory/runtime-adapters/gr-nhm2-runtime-adapter.ts` reads GR/NHM2 artifacts, extracts gates and scalar values, marks missing signals explicitly, and blocks promotion when certificate or closure evidence is absent. The companion test file `server/services/theory/runtime-adapters/__tests__/gr-nhm2-runtime-adapter.test.ts` checks the exact fail-closed posture: no artifacts means `not_run`, invalid JSON means `failed`, missing certificate evidence means `blocked`, and even a completed receipt does not permit promotion if a hard gate still fails.

There was also a small but telling continuity pass in commit `6873fd520` (`Refresh live answer theory context`). That update touched `client/src/components/panels/TheoryAtlasRail.tsx` and `client/src/store/useTheoryMapOverlayStore.ts`, which suggests the new NHM2 theory surfaces are being kept coherent in the live answer UI, not just in shared data structures. Still, the underlying physics status looks unchanged. `docs/research/nhm2-lapse-alpha-sweep-status-latest.md` still shows `stage1_centerline_alpha_0p7000_v1` in `fail` with `failed_timeout`, and `docs/audits/research/warp-nhm2-full-loop-audit-latest.md` still holds `overallState | review |` with blockers `insufficient_provenance, policy_review_required`.

## What it is trying to do
This week’s work is trying to make NHM2 evidence traversable without letting interface polish masquerade as closure. The repo is building a grammar where a reader can move from Einstein-side relations to source-side residuals to QEI applicability to claim boundaries, and see which steps are measured artifacts, which are runtime-bound diagnostics, and which are still blocked by missing provenance or certificate state.

## Why this matters for the larger picture
The broader project needs a way to think clearly about warp and GR lanes without quietly promoting dashboards into conclusions. These new badges, field maps, and runtime adapters help separate observation from interpretation. They make the lane more legible to Helix, panels, and future readers while keeping the difficult middle in view: source closure, tensor authority, QEI semantics, and certificate-backed promotion still have to earn their status.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week made that frontier easier to read: not by widening the claim, but by placing more of the uncertainty in named compartments where it can be revisited without confusion.

## Gate to watch
The next gate is still a fresh NHM2 full-loop and selected-family evidence refresh that replaces timeout-stale and profile-mismatched receipts with current source-closure, observer-audit, and certificate-integrity artifacts strong enough to move the audit beyond `review`.

## Evidence trail
- commit `88e8a5e71` on 2026-06-05: `Add NHM2 full solve theory badges`
- commit `93137b509` on 2026-06-06: `Add theory runtime badges and voice callouts`
- commit `6873fd520` on 2026-06-06: `Refresh live answer theory context`
- `docs/nhm2-closed-loop.md`
- `shared/theory/nhm2-full-solve-theory-badges.ts`
- `shared/theory/__tests__/nhm2-full-solve-theory-badges.spec.ts`
- `shared/theory/nhm2-runtime-field-map.ts`
- `server/services/theory/runtime-adapters/gr-nhm2-runtime-adapter.ts`
- `server/services/theory/runtime-adapters/__tests__/gr-nhm2-runtime-adapter.test.ts`
- `docs/research/nhm2-lapse-alpha-sweep-status-latest.md`

## Quiet Ledger
This week did not claim a solved warp concept, a new admissible NHM2 profile, a cleared alpha sweep, or a certified transport route. It also did not resolve the audit mismatches between the current selected-family profile and older full-loop provenance surfaces, so the lane remains better instrumented than validated.

## Closing Path Note
There is a steady kind of progress in teaching a difficult lane to describe itself honestly. This week gave NHM2 more structure for its observer grammar, source residuals, wall traces, and blocked promotion paths, and it wrapped those structures in tests that resist overstatement. None of that closes the Einstein-side and source-side gaps by itself. But it does mean the next real movement, when it comes, will have clearer rails, cleaner receipts, and less room for self-deception. In this lane, that is earned optimism.
