# Math Congruence Research Plan

This plan defines how to evaluate and improve mathematical congruence across
Helix Ask, tree/DAG routing, simulation code, and citation evidence.

## Scope

Primary target is the atomic simulation route:

- tree contract (`docs/knowledge/physics/atomic-systems-tree.json`)
- server launch synthesis (`server/routes/agi.plan.ts`)
- client launch bridge and panel application
- simulation adapter math (`client/src/lib/atomic-orbitals.ts`)
- citation records for mathematical claims

The same method can then be applied to other physics tools in the repo.

## Research Goals

1. Detect cross-layer parameter drift before it causes misleading results.
2. Make every mathematical claim traceable to a citation and validity domain.
3. Separate "diagnostic visualization math" from "certified physics math."
4. Provide CI-visible gates for congruence and citation integrity.

## Workstream A: Contract Congruence

Question:
Do tree metadata, server normalization, panel normalization, and simulation
adapter constraints agree?

Tasks:

1. Define canonical parameter envelope per subsystem.
2. Check bound/default/enum agreement across files.
3. Track normalization deltas (input -> normalized output).
4. Classify mismatches by severity:
   - HARD: unit/sign/range mismatch that can produce incorrect interpretation
   - SOFT: quality mismatch (for example default drift)

Artifacts:

- congruence matrix (per parameter, per layer)
- drift report with file paths and fix proposals

## Workstream B: Physics-Fidelity Benchmarks

Question:
Does current reduced-order math preserve expected qualitative and basic
quantitative behavior?

Tasks:

1. Benchmark hydrogenic cases (`n=1..7`, selected `l,m`, selected `Z`).
2. Compare renderer-side computed summaries to analytic expectations:
   - principal-level trend
   - node structure consistency
   - scaling with `Z` and `n`
3. Record pass/fail thresholds for each benchmark.

Artifacts:

- benchmark dataset and report
- threshold policy for regression testing

## Workstream C: Mathematical Citation Integrity

Question:
Can every math claim be traced to source evidence with stated assumptions?

Tasks:

1. Register claims in versioned claim-registry files.
2. Attach source and equation references per claim.
3. Require validity-domain and maturity-stage tags.
4. Run automated lint checks in CI.

Artifacts:

- claim registry files under `docs/knowledge/math-claims/`
- schema file
- CI check output

## Proposed Execution Order

Phase 1 (now):

1. Adopt schema + starter registry.
2. Run congruence/citation checker in advisory mode.
3. Fix highest-risk HARD mismatches first.

Phase 2:

1. Add benchmark harness for atomic route.
2. Add strict mode in CI for chosen domains.

Phase 3:

1. Expand same protocol to warp/GR and other simulation tools.
2. Add cross-tool claim linkages where claims are reused.

## Acceptance Criteria

1. Every atomic launch parameter has one canonical bound/default definition.
2. Congruence checker reports zero HARD errors.
3. Each registered claim has at least one non-placeholder citation.
4. Maturity labels are present and aligned with claim strength.
5. CI emits machine-readable summary for trend tracking.

## Key Risks

1. Hidden normalization in UI or helper code not represented in trees.
2. Citation entries drifting into placeholders (`TODO`, `TBD`, `unknown`).
3. Claim strength overstated relative to maturity stage.

## Immediate Next Actions

1. Run `npm run math:congruence:check`.
2. Review warnings, especially cross-layer range drift.
3. Populate additional claim files for critical physics subsystems.
4. Decide CI enforcement level (`advisory` vs `strict`).

