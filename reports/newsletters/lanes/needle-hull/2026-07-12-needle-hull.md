# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-07-12

## Opening Bell
This was a quieter week in the Needle Hull lane, and the quiet had a specific shape. The repo did not spend these seven days widening NHM2 source authority, landing a new solver artifact, or claiming a stronger transport result. Instead, the visible movement gathered around naming, taxonomy, and document reachability. That may sound small, but in this project small things matter when they decide what an agent, panel, or reader can reliably find. The week's work made the maintained NHM2 whitepaper easier to select, easier to cite, and easier to route into Helix Ask and workstation surfaces, while keeping the claim boundaries firm.

## Baseline
For a first-time reader, this lane is CasimirBot's attempt to turn speculative warp geometry into auditable modeling: NHM2 lapse-shift profiles, same-chart tensor bookkeeping, source-closure ledgers, observer and QEI gates, and solver-facing review surfaces. The standing baseline in `docs/nhm2-closed-loop.md` and `docs/research/nhm2-current-status-whitepaper.md` is still careful: NHM2 is a bounded diagnostic or reduced-order candidate lane, not a proved physically viable transport system. `WARP_AGENTS.md` remains the hard wall against stronger language without HARD-constraint passage and an `ADMISSIBLE` viability status.

## What changed this week
The main lane-specific commit was `16d984ef5` on 2026-07-09, `Update-Helix-Ask-doc-context-and-NHM2-taxonomy`. Its NHM2 effect was mostly organizational, but real. The maintained whitepaper was normalized from the dated filename `docs/research/nhm2-current-status-whitepaper-2026-05-02.md` to `docs/research/nhm2-current-status-whitepaper.md`, with the paired sidecars renamed to `docs/research/nhm2-current-status-whitepaper.equation-actions.json` and `docs/research/nhm2-current-status-whitepaper.equation-actions.source.json`. `docs/research/README.md` now explicitly names that bundle as the canonical NHM2 paper set, and `docs/doc-taxonomy.v1.json` registers it as a canonical `equation-action-whitepaper`.

That rename was then wired through the machinery that decides what Helix Ask and the workstation notice first. `server/services/helix-ask/workspace-directory-resolver.ts` now reads `docs/doc-taxonomy.v1.json` and boosts canonical documents, especially equation-action whitepapers, during doc and equation lookup. Tests such as `server/services/helix-ask/__tests__/docs-search-taxonomy.test.ts` and `server/__tests__/helix.ask.turn.e26.latest-doc-selection.test.ts` were updated so NHM2 queries resolve to the maintained whitepaper path. On the client side, `client/src/components/__tests__/doc-viewer-taxonomy-ui.spec.tsx`, `client/src/lib/docs/__tests__/docManifest.spec.ts`, `client/src/lib/docs/__tests__/docEquationActions.spec.ts`, and `client/src/lib/docs/__tests__/docEquationContextEvents.spec.ts` were all updated to treat that whitepaper and its sidecars as the canonical calculator-ready research surface.

The underlying science story in the whitepaper did not materially change this week. The content still says the repo's strongest recent NHM2 result is a diagnostic campaign-admissible profile for `stage1_centerline_alpha_0p7000_observer_compatible_source_campaign_screen_v1`, with `tau = alpha T`, `campaignPass = true`, and physical, transport, speed, and viability locks still closed. In other words, the repo improved retrieval and orientation around the lane's current state, not the state itself.

## What it is trying to do
This week's changes are trying to make NHM2 legible as a maintained research bundle instead of a drifting cluster of dated files and sidecars. The goal is practical: when Helix Ask, the doc viewer, equation-action tooling, or theory-badge surfaces look for the current NHM2 paper, they should land on one canonical document path with the right sidecars and claim boundaries attached.

## Why this matters for the larger picture
Speculative geometry work gets slippery when naming and evidence drift apart. By giving the NHM2 whitepaper a stable canonical path and teaching the search and taxonomy layers to prefer it, the repo reduces one subtle failure mode: an agent or reader grounding itself in stale or mis-scoped material. That does not solve the physics, but it improves the discipline around how the physics is presented, queried, and kept falsifiable.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week tended the map more than the terrain, but a clear map has its own dignity when the terrain is this easy to overstate.

## Gate to watch
The next meaningful validation step is not another taxonomy pass but a new frozen NHM2 evidence update that advances source, observer, QEI, material, or reproducibility gates without opening forbidden viability or transport claims.

## Evidence trail
- Commit `16d984ef5` on 2026-07-09: `Update-Helix-Ask-doc-context-and-NHM2-taxonomy`
- `docs/research/nhm2-current-status-whitepaper.md`
- `docs/research/nhm2-current-status-whitepaper.equation-actions.json`
- `docs/research/README.md`
- `docs/doc-taxonomy.v1.json`
- `server/services/helix-ask/workspace-directory-resolver.ts`
- `server/services/helix-ask/__tests__/docs-search-taxonomy.test.ts`
- `server/__tests__/helix.ask.turn.e26.latest-doc-selection.test.ts`
- `client/src/lib/docs/__tests__/docManifest.spec.ts`
- `docs/nhm2-closed-loop.md`

## Quiet Ledger
This week did not claim a new NHM2 source closure, a new same-chart tensor result, a new observer-robust energy-condition pass, a new QEI dossier completion, a new Casimir material receipt, or a new Casimir verification milestone for this lane. The unresolved center remains the same: diagnostic campaign progress exists, but physical viability, transport authority, and experimental grounding remain outside what this week's receipts can support.

## Closing Path Note
There is a modest kind of progress that happens before equations move again. This week made the maintained NHM2 story easier to find, easier to anchor, and harder to confuse with an older snapshot. That is not a breakthrough, and the repo does not pretend otherwise. Still, it is useful work. When a research lane keeps its names, sidecars, and search behavior aligned, the next real result has a cleaner place to land, and the next reader has less fog to walk through.
