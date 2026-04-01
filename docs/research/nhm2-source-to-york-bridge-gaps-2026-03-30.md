# NHM2 Source-to-York Bridge Gaps

## Purpose

This memo lists the remaining bridge gaps after the literature pass and repo audit.

It is the action document for deciding whether the next step is:
- governance only,
- provenance instrumentation,
- a falsifier experiment,
- or a real model correction.

Companion docs:
- `docs/research/nhm2-source-to-york-bridge-literature-memo-2026-03-30.md`
- `docs/research/nhm2-source-to-york-bridge-audit-2026-03-30.md`
- `docs/research/nhm2-source-to-york-bridge-deep-research-pass-2026-03-30.md`

## Directly supported parts of the bridge

1. **Tile / amplification bookkeeping exists**
- The repo has an explicit energy and mass ladder.
- `U_static`, `gammaGeo`, `gammaVdB`, `q`, and effective duty are tracked in `server/energy-pipeline.ts`.

2. **Timing / TS instrumentation exists**
- `tauLC`, `tauPulse`, `epsilon`, and `TS` are computed in `shared/clocking.ts`.
- `TS_ratio` is part of the sector-control schema and pipeline outputs.

3. **York diagnostics are contract-defined and parity-closed**
- Lane definitions are explicit.
- Current NHM2 morphology classification is strong and cross-lane stable in the existing proof-pack artifacts.

## Heuristic links

1. **`TS_ratio` as a GR averaging proxy**
- The repo treats `TS >> 1` as a cycle-average-valid regime.
- That is a useful engineering policy, but still heuristic for the NHM2 negative-energy source model.

2. **Homogenized lattice statistics as macro-curvature smoothness evidence**
- `Var[T00]`, `div S`, and gradient penalties are operationally reasonable control concepts.
- The repo does not yet prove that keeping them small yields the observed York morphology.

3. **Reduced-order source family as a mechanism proxy**
- Choosing `metricT00Ref = warp.metric.T00.natario_sdf.shift` is a meaningful reduced-order modeling choice.
- It is not yet a proved consequence of the upstream tile/strobe schedule.

## Unsupported or missing links

1. **No single provenance chain from NHM2 contract to York proof-pack brick**
- The proof-pack classifies a pinned reduced-order brick.
- The NHM2 cavity contract defines a different mechanism posture.
- The translation layer between them is not surfaced as a first-class artifact.

2. **No convergence proof for the averaging claim**
- The repo does not yet show that York morphology converges as strobe frequency increases while cycle-average support is held fixed.

3. **No backreaction residual audit**
- There is no artifact showing the difference between:
  - geometry from averaged-source assumptions, and
  - averaged behavior of a time-dependent run.

4. **No source-to-shift / source-to-`trK` exposure**
- The proof-pack reports York morphology and classification outcomes.
- It does not yet expose the intermediate fields needed to explain why NHM2 lands on the Natario side.

5. **Multiple timing authorities remain in play**
- full-hull timing,
- reduced-order reference timing,
- UI / pipeline TS timing,
- proof-pack brick params.

These are not yet unified into one auditable timing story.

## Highest-risk interpretation hazard

The highest-risk mistake would be to say:

> NHM2's strobing law has now been shown to cause a Natario-like York morphology.

That is stronger than the current repo evidence supports.

The strongest current claim remains:

> NHM2's reduced-order solved metric is classified as low-expansion-like under the repo's York diagnostic contract.

## Next patch targets

### Target 1: source-to-York provenance artifact

Add an artifact that records, per NHM2 run:
- cavity contract values,
- promoted-profile defaults,
- measured or computed duty values,
- `TS_ratio` inputs and authority,
- reduced-order brick parameters,
- `metricT00Ref` and family,
- York output hashes and verdict.

This is the shortest path to an auditable bridge.

### Target 2: bridge-readiness gate

Add a gate that blocks mechanism-level language unless all of these are present:
- source contract provenance,
- timing provenance,
- reduced-order source provenance,
- proof-pack parity closure,
- explicit bridge assumption notes.

### Target 3: strobe-frequency falsifier

Run the same cycle-averaged support at multiple strobe frequencies and test whether York morphology converges.

Pass condition:
- the York field approaches a stable limit as `TS_ratio` rises.

Fail condition:
- the York field changes materially under fixed average support.

### Target 4: source-to-shift diagnostics

Expose intermediate fields such as:
- `div(beta)`
- `div(beta/alpha)`
- `trK`
- shell support masks
- source anisotropy measures

The goal is to explain the morphology, not just label it.

## Suggested sequencing

1. add provenance artifact,
2. add bridge-readiness gate,
3. run the strobe-frequency falsifier,
4. only then consider stronger mechanism wording.

## Completion standard for the bridge

The source-to-York bridge should only be called defensible when the repo can show:

1. the source/timing contract used,
2. the reduced-order source actually derived from that contract,
3. the solved brick used for York classification,
4. parity-closed York outputs,
5. a tested reason to believe cycle averaging is valid in the regime used.

Until then, the bridge is best described as:
- partly instrumented,
- partly heuristic,
- and not yet fully audited end-to-end.
