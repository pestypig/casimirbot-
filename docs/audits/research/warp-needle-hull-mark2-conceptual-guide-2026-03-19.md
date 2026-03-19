# Needle Hull Mark 2: Conceptual Guide from GR Foundations to the Current Full-Solve Framework

This document is written for readers who understand general physics but are not specialists in warp-drive literature.

Boundary statement (must remain verbatim):

`This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.`

## Why this exists

The Needle Hull Mark 2 effort is not organized as “we invented a warp drive and it works.”  
It is organized as:

1. A mathematical framework with explicit assumptions.
2. A set of falsifiable gates.
3. A reproducible evidence/governance pipeline that can fail closed.

That structure is the core contribution right now.

## 1) The physics story in plain language

### 1.1 General Relativity baseline

General Relativity (GR) describes gravity as geometry: mass-energy curves spacetime, and motion follows that curved geometry.  
Historical and modern tests (Mercury precession, light deflection, frame dragging, Shapiro delay) are the benchmark for whether any GR-based computational framework is behaving sensibly.

Key references:

- Einstein field-equation era foundations: `SRC-077`, `SRC-075`
- Modern benchmark synthesis: `SRC-076`
- Lensing/deflection anchors: `SRC-078`, `SRC-079`
- Frame-dragging anchors: `SRC-080`, `SRC-081`, `SRC-082`
- Shapiro delay anchors: `SRC-083`, `SRC-084`

## 2) Warp-family theory lineage (what your framework is compared against)

The current repo tracks a “Core-4” warp-family comparison set, used as external reference overlays:

1. Alcubierre (1994): canonical warp-metric lineage (`SRC-071`)
2. Natário (2002): zero-expansion control-form warp construction (`SRC-072`)
3. Van den Broeck (1999): geometric compression strategy (`SRC-073`)
4. Lentz (2021): positive-energy soliton approach in a different assumption domain (`SRC-074`)

In your pipeline these are not “adopted as truth.” They are used to test comparability and boundary conditions.  
When assumptions are non-comparable, the framework marks them partial/inconclusive rather than forcing a pass/fail.

## 3) Why QI/QEI appears in your gate stack

Warp concepts frequently imply unusual stress-energy requirements.  
Your framework therefore uses quantum-inequality style constraints as hard guardrails in the governance stack.

Core references:

- Ford & Roman bounds context: `SRC-007`, `SRC-051`
- Fewster & Eveson generalized worldline QEI: `SRC-008`, `SRC-052`
- Curved/stationary caveats: `SRC-053`, `SRC-054`, `SRC-056`

Practical meaning:

- If energy-duration constraints violate the configured bound, the lane fails.
- If theorem assumptions are not met, claims should not be upgraded.

## 4) Why metrology and “evidence lanes” matter

The project separates “mathematical solve passes” from “measurement congruence lanes.”  
This is critical: a math-consistent reduced-order solve is not the same as experimental closure.

Current lanes include:

1. Casimir sign-control (`SRC-016`, `SRC-017`)
2. Q-spoiling (SRF mechanism lanes: `SRC-021`, `SRC-022`, `SRC-023`)
3. Nanogap metrology (`SRC-035`, `SRC-036`, `SRC-039`, plus SEM standards)
4. Timing/clocking (`SRC-029`, `SRC-030`, `SRC-031`, `SRC-067`, `SRC-068`)
5. SEM + ellipsometry closure lane (standards and procedures: `SRC-040`, `SRC-043`, `SRC-050`, `SRC-085` to `SRC-096`)

Your governance design is strong here: each lane can be congruent, incongruent, unknown, or blocked with explicit reason codes.

## 5) How Needle Hull Mark 2 is represented in the repo

For paper generation and audit, use this chain:

1. Proof-anchor index: `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
2. Canonical report: `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
3. Reference capsule: `docs/audits/research/warp-full-solve-reference-capsule-latest.md`
4. Integrity parity suite: `docs/audits/research/warp-integrity-parity-suite-latest.md`
5. Promotion readiness suite: `docs/audits/research/warp-promotion-readiness-suite-latest.md`
6. External comparison matrix: `docs/audits/research/warp-external-work-comparison-matrix-latest.md`
7. Citation pack: `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`

## 6) Where the framework currently stands

At the campaign/governance level:

- Canonical reduced-order result is admissible in its scoped lane.
- Integrity parity checks are passing.
- External overlays are mostly compatible/partial with explicit non-comparability codes.
- Promotion readiness is still partial because one measurement lane remains blocked (`sem_ellipsometry`).

This is exactly what a disciplined scientific pipeline should show: progress with explicit unresolved blockers.

## 7) What this does and does not claim

### It does claim

1. A reproducible, falsifiable computational-governance framework.
2. A transparent way to compare theory families and observational anchors.
3. A clean separation between canonical math outcomes and evidence-lane readiness.

### It does not claim

1. Physical realization of a warp system.
2. Promotion to strong feasibility tier while blocked lanes remain.
3. Equivalence of all external warp-family models when assumption domains differ.

## 8) How a non-specialist should read your current outputs

If you are new to warp literature, read in this order:

1. This conceptual guide.
2. `warp-full-solve-reference-capsule-latest.md` for current status snapshot.
3. `warp-integrity-parity-suite-latest.md` for “did core checks hold?”
4. `warp-promotion-readiness-suite-latest.md` for “what is still blocking stronger claims?”
5. `warp-external-work-comparison-matrix-latest.md` for how NHM2 compares to established theory families and GR observables.

## 9) Short glossary

- Canonical-authoritative: highest-precedence internal decision artifacts.
- Promotion readiness: whether evidence lanes are reportable under strict policy.
- Congruence: whether evidence and model outputs agree under lane rules.
- Inconclusive/unknown: not enough comparable or admissible information to decide.
- Fail-closed: missing required evidence blocks claim upgrades instead of being ignored.

## References (general works and standards)

Use source IDs and links from:

- `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`

Core conceptual references used by this guide:

1. Einstein (1916), foundation of GR field-equation framework (`SRC-077`): https://doi.org/10.1002/andp.19163540702
2. Will (2014), modern GR test synthesis (`SRC-076`): https://doi.org/10.12942/lrr-2014-4
3. Alcubierre (1994) (`SRC-071`): https://doi.org/10.1088/0264-9381/11/5/001
4. Natário (2002) (`SRC-072`): https://doi.org/10.1088/0264-9381/19/6/308
5. Van den Broeck (1999) (`SRC-073`): https://doi.org/10.1088/0264-9381/16/12/314
6. Lentz (2021) (`SRC-074`): https://doi.org/10.1088/1361-6382/abe692
7. Ford & Roman (1996) (`SRC-007`): https://doi.org/10.1103/PhysRevD.53.5496
8. Fewster & Eveson (1998) (`SRC-008`): https://doi.org/10.1103/PhysRevD.58.084010
9. Munday, Capasso, Parsegian (2009) (`SRC-016`): https://doi.org/10.1038/nature07610
10. IEEE 1588-2019 timing standard (`SRC-029`): https://doi.org/10.1109/IEEESTD.2020.9120376
11. JCGM 100:2008 uncertainty standard (`SRC-005`): https://www.bipm.org/documents/20126/2071204/JCGM_100_2008_E.pdf

---

Manuscript posture:

- `reference_only=true`
- `canonical_blocking=false` for external overlays
- non-feasibility boundary applies to all narrative sections
