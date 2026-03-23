# Needle Hull Mark 2 Compact-Note Paper Outline (Alcubierre-Style Spine)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose

This outline adapts the compact theoretical-note structure associated with the original Alcubierre warp-drive paper to the Needle Hull Mark 2 (NHM2) repo posture.

The goal is not to imitate the conclusions of that paper. The goal is to reuse its argument order:

- motivate the loophole
- define the metric
- interpret the geometry
- run a worked solve
- reveal the guardrails, costs, and blockers

For NHM2, the fourth step must be a **worked reduced-order solve / gate-evaluation example**, not an operational interstellar travel scenario.

## Structural Rule

The main paper should read as a **compact theoretical note**:

- title block + abstract
- continuous prose with equations
- minimal section-heading overhead
- technical appendices for provenance tables, derivation mappings, and blocker matrices

This is the preferred main-body structure for scientist readability. Detailed governance and evidence-pack machinery should move to appendices unless needed in the main line of argument.

## Recommended Main-Paper Spine

### 1. Motivation and Boundary

Open by separating two ideas:

- local causal structure in GR
- global metric engineering as a thought-framework

Then state the NHM2 boundary verbatim:

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

Required content:

- why warp metrics remain scientifically interesting
- why NHM2 is framed as a reduced-order falsifiable program
- why fail-closed evidence governance is part of the contribution

Primary repo anchors:

- `docs/audits/research/warp-needle-hull-mark2-conceptual-guide-latest.md`
- `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`

### 2. Metric Setup

Move quickly into the metric and notation.

Required content:

- 3+1 / ADM notation actually used by the repo
- lapse, shift, spatial metric conventions
- Alcubierre / Natario / Van den Broeck lineage as bounded context
- NHM2 chart and notation assumptions
- shape functions, control fields, and canonical theta semantics

This section should look like the mathematical core of the note.

Primary repo anchors:

- `docs/alcubierre-alignment.md`
- `docs/theta-semantics.md`
- `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`
- `docs/specs/casimir-tile-paper-equation-trace-2026-03-04.md`

### 3. Physical Interpretation

Explain what the metric means in plain physics language before returning to governance.

Required content:

- what expansion / contraction / shift mean in this framework
- what `theta`, `rho`, shear, and vorticity represent here
- what the bubble / hull geometry is intended to encode
- what remains exact versus reduced-order versus proxy-derived

This section should let a physicist track the meaning of the fields before seeing the gate system.

Primary repo anchors:

- `docs/audits/research/warp-needle-hull-mark2-conceptual-guide-latest.md`
- `server/physics/warp_fields_npz.py`
- `server/lib/warp-metric-adapter.ts`

### 4. Worked Reduced-Order Solve

This replaces the classic Alcubierre interstellar travel thought experiment.

Required content:

- one canonical NHM2 reduced-order parameterization
- one worked chain from metric assumptions to gate-relevant quantities
- GR replay anchors as sanity checks, not feasibility proof
- canonical gate interpretation and what `REDUCED_ORDER_ADMISSIBLE` means in repo terms

The worked example should be a **solve and adjudication walk-through**, not a journey narrative.

Primary repo anchors:

- `docs/audits/research/warp-needle-hull-mark2-reduced-order-full-solve-gates-and-evidence-governance-manuscript-latest.md`
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`
- `artifacts/research/full-solve/g4-governance-matrix-2026-02-27.json`

### 5. Guardrails, Price Tag, and Blockers

End with the constraint structure instead of a triumphalist conclusion.

Required content:

- QI / QEI guardrails and admissibility conditions
- energy-condition and stress-energy caveats
- sampling and applicability caveats
- evidence-lane closure status
- what is blocked, partial, or unknown

This is the NHM2 analogue of Alcubierre's "price tag" section, but in repo terms the price is not only exotic stress-energy. It is also bounded by evidence readiness, metrology closure, and reproducibility discipline.

Primary repo anchors:

- `docs/audits/research/warp-promotion-readiness-suite-latest.md`
- `docs/audits/research/warp-integrity-parity-suite-latest.md`
- `docs/audits/research/warp-qei-worldline-primer-2026-03-04.md`
- `docs/specs/casimir-tile-experimental-parameter-registry-2026-03-04.md`

## Appendices

The main paper should stay compact. Dense material belongs in appendices.

### Appendix A. Derivation Tables

Include:

- `source_id`
- `equation_trace_id`
- symbolic equation
- substitutions with units
- mapped registry `entry_id`
- mapped framework variables
- recompute status
- blocker reason

### Appendix B. Materials-Bounds Table

Use the authoring-contract schema and mark missing values `UNKNOWN`.

### Appendix C. Falsifier Matrix

Include deterministic fail conditions for:

- operator mapping
- sampling / normalization
- applicability
- uncertainty
- reproducibility

### Appendix D. Evidence-Lane Closure Table

Include lane-by-lane statuses for:

- timing
- nanogap
- q-spoiling
- Casimir sign-control
- SEM + ellipsometry
- QEI worldline checks
- GR observable replay anchors

## Writing Rules for the Main Note

- Keep the main note argument-first.
- Keep the boundary statement verbatim.
- Do not claim physical feasibility.
- Do not let exploratory overlays override canonical repo state.
- Use equations in the main body, but move bulk provenance scaffolding to appendices.
- Keep the narrative readable to physicists who are not warp-specialists.

## One-Line Skeleton

For NHM2, the preferred compact-note skeleton is:

**motivate the loophole -> define the metric -> interpret the geometry -> run the reduced-order solve -> reveal the guardrails and blockers**
