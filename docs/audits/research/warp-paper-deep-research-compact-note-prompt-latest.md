# Warp Paper Deep-Research Prompt v2 (NHM2 Compact-Note Structure)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose

Generate a **physics-first, compact-note-style** Needle Hull Mark 2 manuscript package for physicists who want the derivations, metric notation, and explicit guardrail logic.

This prompt deliberately follows the **argument order** associated with the classic Alcubierre theoretical note:

- motivate the loophole
- define the metric
- interpret the geometry
- run a worked solve
- reveal the price tag

For NHM2, the worked example must be a **reduced-order solve / gate-adjudication example**, and the final price-tag section must include both physical guardrails and evidence/reproducibility blockers.

## Hard Constraints

1. Preserve this boundary statement verbatim:
   "This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."
2. Use only repo-committed, readable artifacts as authoritative inputs.
3. Keep claim tiers explicit and non-collapsed:
   - `canonical-authoritative`
   - `promoted-candidate`
   - `exploratory`
4. Do not claim physical feasibility, operational realizability, or viability.
5. If a required value or artifact is unavailable, write `UNKNOWN` rather than inferring.
6. External literature may provide context, but it must never override canonical repo state.

## Canonical Precedence Rule

Resolve conflicts in this order:

1. `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
2. `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
3. `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
4. `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`
5. parity/readiness/evidence summary artifacts
6. external comparison overlays
7. external literature

If conflict exists, keep canonical repo interpretation authoritative and explicitly mark the conflict.

## Required Repo Inputs

Read these before drafting:

- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `docs/audits/research/warp-needle-hull-mark2-conceptual-guide-latest.md`
- `docs/audits/research/warp-needle-hull-mark2-reduced-order-full-solve-gates-and-evidence-governance-manuscript-latest.md`
- `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`
- `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`
- `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`
- `docs/alcubierre-alignment.md`
- `docs/theta-semantics.md`

Use additional repo files only as needed from those anchors.

## Output Style Rule

The **main paper** must read like a compact theoretical note, not a section-heavy management report.

Main-body expectations:

- minimal heading overhead
- continuous prose with equations
- argument-first ordering
- compact static tables only when necessary
- literature-style flow suitable for physicists

Appendix expectations:

- dense derivation tables
- provenance mappings
- blocker registers
- materials-bounds tables
- falsifier matrices

## Required Top-Level Structure

Write the manuscript with exactly this high-level logic:

### 1. Motivation and Boundary

Explain the GR loophole of interest, then immediately state the NHM2 boundary and fail-closed governance posture.

Must cover:

- why warp-family metrics are studied in principle
- why NHM2 is framed as reduced-order and falsifiable
- why fail-closed evidence handling is part of the contribution

### 2. Metric Setup

Introduce the 3+1 / ADM notation actually used by the framework.

Must include:

- line element and signature conventions
- lapse, shift, and spatial metric notation
- Alcubierre / Natario / Van den Broeck lineage as bounded context
- shape functions and chart assumptions
- canonical theta semantics and notation mappings

### 3. Physical Interpretation

Interpret the geometry in physics language.

Must include:

- what expansion / contraction / shift mean here
- what `theta`, `rho`, shear, and vorticity represent
- what is exact, reduced-order, or proxy-based
- what the bubble / hull geometry is intended to encode

### 4. Worked Reduced-Order Solve

Run one worked NHM2 reduced-order solve path.

Must include:

- one canonical parameterization
- derivation steps from metric assumptions to gate-relevant quantities
- GR observable replay anchors as sanity checks only
- canonical gate interpretation and what the current adjudication means

Do **not** use an interstellar travel vignette as the rhetorical centerpiece.

### 5. Guardrails, Price Tag, and Blockers

Close the main note with the limiting structure.

Must include:

- QI / QEI guardrails
- stress-energy and energy-condition caveats
- sampler admissibility and applicability caveats
- evidence-lane closure status
- explicit blocked and partial items

This is the NHM2 analogue of the classical "price tag" section.

## Derivation Appendix Requirements

Add a dense derivation appendix after the main note.

Must include:

1. metric / ADM derivations
2. canonical theta derivation and comparison with Natario diagnostic theta
3. GR-style derived scalar mappings (`theta_gr`, `rho_gr`, shear, vorticity)
4. QI / QEI derivation and sampler admissibility mapping
5. GR observable replay equations:
   - Mercury perihelion
   - lensing deflection
   - frame dragging
   - Shapiro delay
6. evidence-lane derivation mapping tables

Every major derivation must include a compact notation block:

- symbol
- definition
- units
- substitution values if present
- mapped repo variable/path

## Provenance Table Requirement

For each major chain, include a table with at least these columns:

| source_id | equation_trace_id | equation | substitutions (with units) | mapped_entry_ids | mapped_framework_variables | recompute_status | blocker_reason |

If substitutions or trace rows are missing, write `UNKNOWN`.

## Claim Discipline Section

Include a short explicit section stating:

- what can be said now
- what cannot be said now
- why physical-feasibility claims are out of scope
- which conclusions are canonical vs promoted-candidate vs exploratory

## Fail-Closed Behavior

If any required repo input is missing or unreadable:

- return `blocked=true`
- list the missing paths
- set `stop_reason=Fail-closed`
- do not complete the manuscript

If only overlay artifacts are missing:

- continue
- mark dependent values `UNKNOWN`
- do not silently repair gaps from literature

## Self-Check Before Final Output

Verify all of the following before returning the manuscript:

1. Boundary statement appears verbatim.
2. Main note follows the compact-note argument order.
3. Equations are present in the main body and appendix.
4. Canonical repo state is not overridden by literature.
5. Missing values are marked `UNKNOWN`.
6. The worked example is a reduced-order solve, not a travel-promise narrative.
7. The closing section makes the guardrails and blockers explicit.
