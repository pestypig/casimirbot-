# Needle Hull / NHM2 / Warp Solve Weekly Report | 2026-06-21

## Opening Bell
This week the Needle Hull lane moved from guarding a blockage to describing a narrower, calmer kind of pass. The repo did not announce a viable warp craft, and it did not erase the older full-loop timeout story. What it did do was tighten the grammar around a lower-alpha NHM2 campaign, give that campaign a more explicit manifest and frontier, and then place a formal Lean fence around what that pass does and does not mean. Panels, badge graphs, and frontier overlays joined the picture too, but mostly as windows onto the evidence. The mood is less ignition and more careful alignment: geometry, source accounting, observer scope, QEI dossiers, and claim locks trying to stay in one frame.

## Baseline
For a first-time reader, this lane is CasimirBot's effort to turn speculative warp geometry into legible NHM2 modeling, constraint tracking, solver evidence, and claim-bounded review. The standing baseline in `docs/nhm2-closed-loop.md` and `docs/research/nhm2-current-status-whitepaper.md` still treats NHM2 as a lapse-extended Natario-style diagnostic or reduced-order candidate lane, not a certified transport result. `WARP_AGENTS.md` remains the hard boundary: no physical-viability language without passing hard constraints and the repo's admissibility policy.

## What changed this week
The main shift was campaign organization around the `0p7000_observer_compatible_source` branch. Commits on June 18 and June 19 added or expanded `shared/contracts/nhm2-source-momentum-density-audit.v1.ts`, `shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts`, `shared/contracts/nhm2-profile-campaign-frontier.v1.ts`, and the supporting tools in `tools/nhm2/`. The effect is practical: the repo can now treat a candidate profile as a governed campaign row with named evidence requirements for regional tensor residuals, momentum projection, QEI worldline dossier, observer-family checks, stability, and the final `nhm2_time_dependent_source_campaign/v1` harness. The tests in `tests/nhm2-profile-campaign-frontier.spec.ts` are especially candid about intent, forcing the frontier to stop on source-counterpart, momentum, or observer blockers before any "fast-looking" candidate is allowed to rank well.

The second movement was a formal claim-boundary pass. Commit `640f8b993` introduced `shared/contracts/nhm2-lean-campaign-certificate.v1.ts`, `formal/lean/NHM2Formal/Certificate.lean`, and the generated `formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean`, with `package.json` wiring through `npm run formal:nhm2:certificate:emit` and `npm run formal:lean:check`. The repo evidence says this plainly: Lean is checking a certificate-backed diagnostic campaign admission, not proving physical viability, transport, propulsion, route ETA, or the correctness of the floating-point solver. That distinction is reinforced in `formal/lean/README.md`, in the claim-lock theorems, and in `tests/nhm2/lean-campaign-certificate.spec.ts`, where missing tensor components, Eulerian-only observer scope, scalar-only QEI, stale hashes, or open claim locks all fail closed.

There was also a presentation layer expansion around theory and Helix. Commits `e5cd9dacb`, `225814b3e`, and `4da9e2ea3` added theory-frontier reflection and map overlay work through `shared/theory/warp-gr-nhm2-map.ts`, `shared/theory/nhm2-full-solve-theory-badges.ts`, `client/src/components/panels/TheoryAchievementMap.tsx`, and `docs/theory-frontier-vector-field-tool.md`. For this lane, that matters less as a new solve than as better separation of surfaces: geometry samples, source-closure diagnostics, diagnostic path, and claim boundary are now explicit map bands instead of one blended visual story.

## What it is trying to do
This week's code is trying to make NHM2 say one precise thing at a time. A generated campaign manifest should describe what evidence belongs to a candidate profile; a frontier should rank which profile is diagnostically admissible; a Lean certificate should formalize what follows from that evidence; and the panels should show those distinctions without smuggling dashboard visibility into physics closure.

## Why this matters for the larger picture
The broader project needs a disciplined bridge from interesting geometry to auditable source, observer, and policy gates. The June work strengthens that bridge by making campaign evidence composable and falsifiable: profile search is not the same as campaign pass, campaign pass is not the same as physical viability, and a formal certificate is not the same as a fresh GR solve. That separation is healthy. It gives the repo a better chance of learning where the real constraints live instead of letting a neat render or a partial receipt carry too much meaning.

## Horizon note
The frontier begins with learning which constraints hold fast and which variables still invite careful exploration. This week widened that frontier by showing that a lower-alpha NHM2 row can be organized into a coherent diagnostic campaign while still keeping route, speed, and physical-source language under lock.

## Gate to watch
The next validation step is to freeze and reproduce a non-`latest` `0p7000_observer_compatible_source` reference chain so the new campaign pass, Lean certificate, material/source credibility, and stricter observer and conservation review all stay aligned under one pinned artifact set.

## Evidence trail
- commit `3499d75f0` on 2026-06-18: `Add NHM2 residual validation signals`
- commit `9e1859972` on 2026-06-19: `Add compound synthesis candidate campaign tooling`
- commit `640f8b993` on 2026-06-20: `Add Lean campaign certificate wiring`
- `docs/research/nhm2-current-status-whitepaper.md`
- `formal/lean/README.md`
- `formal/lean/NHM2Formal/Certificate.lean`
- `formal/lean/NHM2Formal/Generated/CurrentCampaignCertificate.lean`
- `shared/contracts/nhm2-campaign-profile-run-manifest.v1.ts`
- `tests/nhm2-profile-campaign-frontier.spec.ts`
- `client/src/components/panels/TheoryAchievementMap.tsx`

## Quiet Ledger
This week did not claim a solved warp concept, a physically viable source, a transport result, or a cleared route ETA. The repo still keeps those locks shut in the newest surfaces: the Lean certificate preserves `physicalViabilityClaimAllowed = false` and `transportClaimAllowed = false`, while `docs/research/nhm2-lapse-alpha-sweep-status-latest.md` still records the older `stage1_centerline_alpha_0p7000_v1` full-loop sweep as `failed_timeout`, which means the new campaign-admissible row still needs pinned reproduction and stricter review before anyone should speak more boldly.

## Closing Path Note
There is something quietly solid about a week that improves the claim boundary more than the claim itself. NHM2 now has a better campaign manifest, a clearer frontier, a formal certificate path, and a more legible theory map for showing where geometry, source closure, observer evidence, QEI, and policy locks actually meet. None of that dissolves the hard questions about physical source credibility or full reproducible closure. But it does mean the lane is getting better at telling the truth about its own state. In work like this, that is not ornamental discipline. It is the structure that lets future progress count.
