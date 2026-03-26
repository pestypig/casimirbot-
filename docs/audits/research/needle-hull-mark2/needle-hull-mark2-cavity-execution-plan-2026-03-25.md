# Needle Hull Mark 2 Cavity Execution Plan (2026-03-25)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose

Turn the current NHM2 cavity contract and layout scaffold into a congruent end-to-end program that can:

- freeze cavity geometry from NHM2 authority surfaces,
- emit usable mask exports,
- run deterministic layout checks,
- generate review renders from the same geometry contract,
- package outputs for internal review and future fabrication discussion.

This plan is explicitly about congruence and toolchain completeness. It does not upgrade the current NHM2 physical-feasibility posture.

## Atlas Evidence

Pre-edit Atlas retrieval was run with:

1. `npm run atlas:build`
2. `npm run atlas:why -- needle-hull-mark2-theory`
3. `npm run atlas:trace -- needle-hull-mark2-theory --upstream`

Observed result:

- resolved node: `tree:needle-hull-mark2-theory-tree`
- source: `warp-tree-dag-walk`
- upstream path count: `0`
- consumer path count: `0`

Operational reading:

- the NHM2 theory root is still discoverable as a canonical concept anchor,
- Atlas still does not expose additional indexed upstream producers for this concept root,
- therefore this execution plan should anchor directly to the proof index, promoted profile, cavity contract, and layout scaffold files already in-repo.

## Congruence Definition

For NHM2 cavity work, a "congruent system" means every stage uses the same authoritative geometry contract and preserves the same meanings for:

- units,
- coordinate origin and handedness,
- cavity dimensions,
- sector and variant identifiers,
- layer semantics,
- witness-structure intent,
- proof metadata and reduced-order provenance.

Congruence does not require using one software tool for every stage.

Congruence does require:

1. one canonical contract,
2. deterministic transforms from that contract,
3. no hidden geometry edits in UI or render-only code,
4. stable artifact naming and manifests,
5. explicit review gates between contract, layout, DRC, and render outputs.

## Decision: Same Tools vs Same Contract

Do not force one geometry engine across the full stack.

Use one canonical NHM2 cavity contract across the full stack.

Recommended rule:

- same contract everywhere,
- best-fit tool per stage,
- deterministic adapters between stages,
- zero geometry authority in review-only surfaces.

Reasoning:

- `gdstk` is the right tool for mask polygons and export,
- `KLayout` is the right tool for layout review and batch DRC,
- the existing React cavity views are useful for human review but should not author geometry,
- `gdsfactory` is useful only if the layout grows into a reusable variant library,
- physics-side reduced-order computation should remain separate from layout emission and feed metadata into the contract rather than directly drawing polygons.

## Current Scaffold Status

Already present:

- `configs/needle-hull-mark2-cavity-contract.v1.json`
- `docs/specs/needle-hull-mark2-cavity-contract-v1.md`
- `tools/cavity-layout/emit_layout.py`
- `tools/cavity-layout/test_emit_layout.py`
- `tools/cavity-layout/README.md`

Current scaffold behavior:

- emits smoke-test `GDS` and `OAS`,
- emits a JSON summary manifest,
- produces three cells in one library: `NHM2_TILE`, `NHM2_ARRAY_2X2`, `NHM2_DIE`,
- keeps all geometry under one contract,
- remains review-only because several dimensions are still draft placeholders.

## Primary Authority Chain

Use these files as the authority chain for the next implementation passes:

1. `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
2. `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
3. `shared/warp-promoted-profile.ts`
4. `shared/schema.ts`
5. `configs/needle-hull-mark2-cavity-contract.v1.json`
6. `tools/cavity-layout/emit_layout.py`

## End-to-End Program Target

The target program should take one NHM2 cavity contract as input and produce:

- `GDS`
- `OAS`
- layer-map summary
- `DRC` report
- plan-view render
- cross-section render
- package manifest
- optional die-level bundle for review

Recommended artifact bundle:

- `artifacts/layout/nhm2/nhm2-tile.gds`
- `artifacts/layout/nhm2/nhm2-tile.oas`
- `artifacts/layout/nhm2/nhm2-array.gds`
- `artifacts/layout/nhm2/nhm2-die.gds`
- `artifacts/layout/nhm2/nhm2-layer-map.json`
- `artifacts/layout/nhm2/klayout-drc-report.rdb`
- `artifacts/layout/nhm2/klayout-drc-summary.md`
- `artifacts/layout/nhm2/nhm2-plan-view.png`
- `artifacts/layout/nhm2/nhm2-cross-section.png`
- `artifacts/layout/nhm2/nhm2-build-manifest.json`

## Tool Roles

### 1. Canonical geometry and export

Use:

- `gdstk`

Role:

- authoritative 2D polygon generation,
- `GDS` and `OAS` export,
- hierarchy and cell construction,
- boolean and offset operations.

### 2. Layout review and batch checks

Use:

- `KLayout` GUI
- `KLayout` batch or Python mode

Role:

- visual review,
- layer inspection,
- `DRC`,
- optional `LVS`,
- deterministic render export for mask review.

### 3. Variant library and advanced parametrics

Use only if needed:

- `gdsfactory`

Role:

- reusable PCells,
- larger variant libraries,
- routing helpers,
- cleaner composition if NHM2 grows beyond simple contract-driven polygon emission.

Decision:

- not required for the next pass,
- keep it optional until the simple `gdstk` emitter becomes insufficient.

### 4. Render pipeline

Use:

- contract-driven Python render step,
- `KLayout` batch render for plan view,
- existing React cavity components as review references only.

Decision:

- render outputs should be derived from the same contract as layout,
- render code should never become the geometry source of truth.

### 5. Not part of this first program

Do not include in the core cavity-mask program:

- `OpenROAD`
- `OpenLane`
- `Xschem`

These are optional later only if electrical or digital integration becomes real scope.

## What Still Needs to Be Addressed

To move from scaffold to usable exports, the following must be closed explicitly:

### A. Real NHM2 geometry freeze

The draft scaffold still carries placeholder layout dimensions.

Must be resolved:

- `tileWidth_mm`
- `tileHeight_mm`
- `pocketDiameter_um`
- `sag_nm`
- top and bottom mirror thickness
- seal-ring geometry
- anchor-post geometry
- release-hole geometry
- pad placement and count
- witness coupon footprints

Acceptance rule:

- no placeholder dimensions remain in the released contract,
- every dimension has a source or an explicit review signoff.

### B. Unit and coordinate contract

Must be fixed once and reused everywhere:

- contract input units,
- layout output units,
- origin location,
- axis direction,
- layer numbering convention,
- variant naming convention.

Recommended default:

- contract lengths in `nm`, `um`, `mm`, `m` only where dimensionally natural,
- layout internal drawing units in `um`,
- origin at tile center for primitive cells,
- positive `x` to the right and positive `y` upward,
- die assembly centered at origin unless a packaging constraint requires otherwise.

### C. Layer map and process intent

The scaffold currently has a practical layer map but not a process-intent document.

Must add:

- layer-name to GDS mapping,
- process meaning,
- enclosure expectations,
- derived layer notes,
- witness-structure mapping.

### D. Deterministic DRC

The scaffold can emit layout but cannot yet fail the build on geometry rule violations.

Must add:

- KLayout batch DRC script,
- minimum width rules,
- minimum spacing rules,
- seal-ring sanity checks,
- pad-to-active clearances,
- witness-structure spacing checks.

### E. Render outputs

Usable exports require deterministic visuals for review, not just mask databases.

Must add:

- plan-view render from `GDS`,
- cross-section render from contract geometry,
- stable image filenames,
- manifest entries tying renders back to the same contract hash used for layout emission.

### F. Package manifest and release command

A usable program needs one command that leaves a complete review package behind.

Must add:

- build manifest JSON,
- contract hash,
- tool versions,
- output paths,
- cell list,
- DRC status,
- render status.

## Robust NHM2 Cavity Layout Scaffold

The robust scaffold should be organized as follows:

| Path | Role | Status |
| --- | --- | --- |
| `configs/needle-hull-mark2-cavity-contract.v1.json` | canonical cavity contract | present, draft |
| `docs/specs/needle-hull-mark2-cavity-contract-v1.md` | contract meaning and scope | present |
| `docs/specs/needle-hull-mark2-cavity-layer-map-v1.md` | layer and process meaning | missing |
| `docs/specs/needle-hull-mark2-cavity-cross-sections-v1.md` | section intent and stack meaning | missing |
| `tools/cavity-layout/emit_layout.py` | contract to layout emitter | present |
| `tools/cavity-layout/test_emit_layout.py` | smoke-test for emitter | present |
| `tools/cavity-layout/validate_contract.py` | geometry and invariant checks | missing |
| `tools/cavity-layout/render_preview.py` | plan and cross-section render export | missing |
| `tools/cavity-layout/run_drc.py` | batch DRC wrapper | missing |
| `tools/cavity-layout/build_package.py` | single command to produce release bundle | missing |
| `artifacts/layout/nhm2/` | generated outputs | present |

## Program Shape

Recommended program phases:

### Phase 0 - Freeze contract

Goal:

- replace draft layout placeholders with the actual NHM2 cavity geometry freeze,
- resolve the Mk1 versus Mk2 mismatch before more geometry is emitted.

Required outputs:

- updated `configs/needle-hull-mark2-cavity-contract.v1.json`
- updated `docs/specs/needle-hull-mark2-cavity-contract-v1.md`

### Phase 1 - Validate contract

Goal:

- fail early on unit and geometry mistakes.

Add:

- `tools/cavity-layout/validate_contract.py`

Checks should include:

- positive dimensions,
- pocket fits within tile,
- seal ring fits within tile,
- post ring fits inside pocket,
- release holes do not overlap posts,
- witness coupons fit in reserved zones.

### Phase 2 - Harden emitter

Goal:

- move from one smoke-test library to explicit exports.

Add:

- separate tile export,
- separate array export,
- separate die export,
- stable layer-map sidecar JSON,
- stable build summary JSON.

This phase closes the existing next step:

- extend the emitter to produce separate tile, array, and die output files.

### Phase 3 - Add deterministic DRC

Goal:

- make layout failures actionable in automation.

Add:

- `tools/cavity-layout/klayout/nhm2_smoke_drc.py` or equivalent rule file,
- `tools/cavity-layout/run_drc.py`

Batch command target:

- use installed KLayout in batch mode,
- write `.rdb` plus markdown summary.

This phase closes the existing next step:

- add a KLayout batch DRC script against the emitted layer map.

### Phase 4 - Add render pipeline

Goal:

- produce deterministic plan and section views from the same geometry source.

Add:

- `tools/cavity-layout/render_preview.py`

Render policy:

- plan view should come from the emitted layout,
- cross-section should come from the canonical contract,
- both should embed contract hash and artifact metadata in the build manifest.

### Phase 5 - Package builder

Goal:

- make end-to-end export one command.

Add:

- `tools/cavity-layout/build_package.py`

Command shape:

```powershell
.\.venv-layout\Scripts\python.exe tools/cavity-layout/build_package.py `
  --contract configs/needle-hull-mark2-cavity-contract.v1.json `
  --out-dir artifacts/layout/nhm2
```

Program stages inside that command:

1. validate contract
2. emit layout
3. run DRC
4. emit renders
5. write manifest

### Phase 6 - Review and acceptance

Goal:

- define when the scaffold is no longer just a smoke test.

Acceptance criteria:

- geometry freeze completed,
- layout exports generated without manual edits,
- DRC returns no hard failures,
- plan-view and cross-section renders match the contract,
- manifest captures all outputs and hashes,
- README and docs show the single end-to-end command path.

## Immediate Next Steps

These are the concrete next implementation steps from the current scaffold:

1. Replace the draft layout dimensions with the real NHM2 cavity geometry freeze.
2. Add a KLayout batch DRC script against the emitted layer map.
3. Extend the emitter to produce separate tile, array, and die output files.

Additional next steps required to make the program usable end to end:

4. Add contract validation before layout emission.
5. Add deterministic plan-view and cross-section render export.
6. Add a one-command package builder that writes a manifest.
7. Add layer-map and cross-section documents so exports have process meaning.

## Recommended Build Contract for Review

When the next pass is implemented, one build should leave behind:

- `GDS`
- `OAS`
- `RDB`
- markdown DRC summary
- plan-view image
- cross-section image
- layer-map JSON or markdown
- build manifest JSON

That is the minimum practical definition of "usable exports from end to end cavity to render."

## Planning Status

Status: ready for implementation against the current NHM2 cavity scaffold.

Recommended implementation order:

1. geometry freeze,
2. contract validation,
3. emitter split outputs,
4. batch DRC,
5. render preview,
6. one-command package build.
