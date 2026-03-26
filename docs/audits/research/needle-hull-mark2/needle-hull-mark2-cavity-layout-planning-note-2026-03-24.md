# Needle Hull Mark 2 Cavity Layout Planning Note (2026-03-24)

"This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim."

## Purpose

Record the current repo-grounded recommendation for how Needle Hull Mark 2 (NHM2) cavity schematics should be defined, what open-source layout tools fit this project, and what staged plan should be followed next.

This note is intended to support planning. It does not promote any stronger physical-feasibility claim than the current NHM2 proof chain allows.

## Atlas Evidence

Pre-edit Atlas retrieval was run with:

1. `npm run atlas:build`
2. `npm run atlas:why -- needle-hull-mark2-theory`
3. `npm run atlas:trace -- needle-hull-mark2-theory --upstream`

Observed Atlas result:

- resolved node: `tree:needle-hull-mark2-theory-tree`
- source: `warp-tree-dag-walk`
- upstream path count: `0`
- consumer path count: `0`

Operational reading:

- the NHM2 theory directory is discoverable as a canonical concept root,
- Atlas does not currently expose additional indexed upstream producers for this concept root,
- so the note below anchors directly to the NHM2 proof index, reference capsule, promoted profile, and cavity/vacuum contracts.

## Primary Repo Anchors

Use these as the first-pass authority chain for planning:

1. `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
2. `docs/audits/research/needle-hull-mark2/theory-directory-latest.md`
3. `artifacts/research/full-solve/full-solve-reference-capsule-latest.json`
4. `shared/warp-promoted-profile.ts`
5. `shared/schema.ts` (`VacuumContractSpec`)
6. `server/stress-energy-brick.ts`
7. `server/services/target-validation.ts`
8. `client/src/components/CavityCrossSectionSplit.tsx`
9. `client/src/components/CavityFrameView.tsx`
10. `client/src/components/needle-hull-preset.tsx`
11. `docs/needle-hull-mainframe.md`

## Current NHM2 Planning State

### 1. Governance posture

The NHM2 theory directory is present and marked `READY`, with the current campaign boundary stated explicitly as reduced-order, falsifiable, and not a physical warp-feasibility claim.

The current full-solve reference capsule reports:

- canonical decision: `REDUCED_ORDER_ADMISSIBLE`
- geometry conformance: pass
- GR observable replay lanes: pass for Mercury perihelion, lensing, frame dragging, and Shapiro
- latest Casimir certification trace: PASS with integrity OK

The same capsule is still blocked by hard commit-pin mismatch entries, so it should be treated as a reduced-order planning and governance anchor, not as a fabrication-readiness certificate.

### 2. Repo contract mismatch that must be resolved first

There is an active Mk1/Mk2 split in the repo:

- `shared/warp-promoted-profile.ts` already identifies the promoted profile as `Needle Hull Mark 2`
- that promoted NHM2 profile uses values such as:
  - `warpFieldType: natario_sdf`
  - `sectorCount: 80`
  - `qCavity: 100000`
  - `gap_nm: 8`
  - `shipRadius_m: 2`
- but the operator-facing preset and documentation still describe Mk1-style geometry and values, including:
  - 25 mm bowl radius
  - 16 nm sag
  - 1 nm gap
  - 400 sectors

Planning consequence:

- do not define cavity schematics from both surfaces,
- create one NHM2 cavity contract first,
- then derive layout, review views, and future planning artifacts only from that one contract.

### 3. Existing data model is already close to what layout needs

`VacuumContractSpec` already provides the right top-level buckets:

- `geometry`
- `boundary`
- `thermal`
- `loss`
- `drive`
- `readout`

`server/stress-energy-brick.ts` already provides the main physics-side metadata that should travel with a cavity layout package rather than be hard-coded into polygons:

- `gap_nm`
- `cavityQ`
- `gammaGeo`
- `gammaVdB`
- `dutyFR`
- `zeta`
- source/proxy metadata

Planning consequence:

- keep fabrication geometry in a cavity contract,
- keep reduced-order warp/GR metrics as sidecar metadata for traceability,
- do not encode warp metrics as mask-layer meaning.

## Recommended Cavity Source of Truth

Create a single NHM2 cavity contract, for example:

- `configs/needle-hull-mark2-cavity-contract.v1.json`

That contract should extend the existing vacuum contract with geometry fields required by actual mask generation:

- `pocketDiameter_um`
- `sag_nm`
- `gap_nm`
- `topMirror_thick_um`
- `botMirror_thick_um`
- `alnRim_width_um`
- `tileWidth_mm`
- `sectorCount`
- `concurrentSectors`
- `sealRing`
- `releaseHoles`
- `anchorPosts`
- `padLayout`
- `alignmentMarks`
- `testCouponSet`

The contract should also carry planning metadata copied from repo authority surfaces:

- `solutionCategory`
- `profileVersion`
- `warpFieldType`
- `gammaGeo`
- `gammaVanDenBroeck`
- `qCavity`
- `qSpoilingFactor`
- `dutyCycle`
- `dutyShip`
- `metricT00Ref`
- `metricT00Source`
- `proofIndexPath`
- `referenceCapsulePath`

## What the Existing UI Should Be Used For

The current cavity React components are useful for:

- human review
- cross-section sanity checks
- communicating geometry intent
- comparing contract values against visual output

They should not be treated as the fabrication source of truth.

Planning rule:

- contract -> layout generator -> GDS/OASIS
- contract -> UI review views
- not UI -> fabrication layout

## Open-Source Tooling Recommendation

### Primary recommendation

1. `gdstk`
   - best fit for equation-driven or contract-driven polygon generation
   - supports GDSII and OASIS
   - Python 3.13-compatible in the currently available wheels
   - should be the main layout emitter for NHM2 cavity masks

2. `KLayout`
   - use as the main Windows-native viewer/editor/DRC/LVS environment
   - use for visual inspection, layer review, scripted DRC, and optional LVS
   - this machine can install it directly through `winget`

3. `gdsfactory`
   - optional higher-level parametric framework
   - useful if NHM2 layout becomes a reusable component library with variants, arrays, and standardized cells
   - not required for the first generator pass if `gdstk` is enough

### Secondary / optional recommendation

4. `Xschem`
   - only needed if an electrical schematic/SPICE lane is desired for pads, biasing, or LVS reference
   - likely best treated as a WSL/Linux-side tool rather than a native Windows planning dependency

5. `OpenROAD` / `OpenLane`
   - not recommended for the cavity-mask problem itself
   - only relevant if this project later integrates digital control logic on the same die
   - not a first-stage requirement for NHM2 cavity schematic/layout work

## Suggested Install Baseline

For this workspace:

```powershell
python -m venv .venv-layout
.\.venv-layout\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install gdstk gdsfactory klayout
winget install KLayout.KLayout
```

Notes:

- local Python is `3.13`
- local `pip` is available and current
- `winget search KLayout` resolves `KLayout.KLayout` version `0.30.7`

## Proposed Staged Plan

### Stage 0 - Contract freeze

Goal:

- resolve the Mk1/Mk2 geometry split
- publish one NHM2 cavity contract with explicit fields and versioning

Outputs:

- `configs/needle-hull-mark2-cavity-contract.v1.json`
- `docs/specs/needle-hull-mark2-cavity-contract-v1.md`

### Stage 1 - Layout generator

Goal:

- generate one tile, one small array, and one die-level assembly from the NHM2 cavity contract

Suggested outputs:

- `tools/cavity-layout/emit_layout.py`
- `artifacts/layout/nhm2/nhm2-tile.gds`
- `artifacts/layout/nhm2/nhm2-tile.oas`
- `artifacts/layout/nhm2/nhm2-array.gds`
- `artifacts/layout/nhm2/nhm2-die.gds`

### Stage 2 - Layer map and process intent

Goal:

- define what each polygon layer means in process terms

Suggested outputs:

- `docs/specs/needle-hull-mark2-cavity-layer-map-v1.md`
- `docs/specs/needle-hull-mark2-cavity-cross-sections-v1.md`

Minimum layers likely needed:

- bottom mirror / electrode
- cavity / spacer definition
- top membrane / diaphragm
- anchor posts
- release holes
- seal ring
- pads / routing
- alignment marks
- metrology / witness structures

### Stage 3 - Verification

Goal:

- run scripted sanity checks before any serious foundry discussion

Suggested checks:

- KLayout DRC
- optional KLayout LVS if an electrical netlist is added
- geometry/unit consistency checks against the NHM2 cavity contract

Suggested outputs:

- `artifacts/layout/nhm2/klayout-drc-report.rdb`
- `artifacts/layout/nhm2/klayout-drc-summary.md`

### Stage 4 - Witness structures aligned to evidence lanes

Goal:

- tie the mask set to the repo's explicit evidence-lane blockers and metrology lanes

Include witness structures for:

- nanogap metrology
- SEM + ellipsometry closure
- Q-spoiling / material-lane comparisons
- Casimir sign-control coupons
- timing / pad-access test structures if active drive/readout is planned

### Stage 5 - Planning package for future execution

Goal:

- make one repo-local package that turns the research summary into actionable implementation work

Suggested outputs:

- `docs/audits/research/needle-hull-mark2/needle-hull-mark2-cavity-execution-plan-YYYY-MM-DD.md`
- linked task list for contract, generator, layer map, and DRC steps

## Immediate Decisions Recommended

1. Freeze one NHM2 cavity geometry contract before any layout coding.
2. Use `gdstk` as the first layout emitter.
3. Use KLayout as the review and DRC cockpit.
4. Treat current cavity React views as review-only.
5. Include metrology witness structures in the first mask concept, not as an afterthought.
6. Keep the proof-index and reference-capsule paths in the cavity contract metadata for traceability.

## External Tool References Used For This Planning Note

- gdstk PyPI: <https://pypi.org/project/gdstk/>
- gdstk docs: <https://heitzmann.github.io/gdstk/gettingstarted.html>
- gdspy PyPI: <https://pypi.org/project/gdspy/>
- gdsfactory PyPI: <https://pypi.org/project/gdsfactory/>
- KLayout site: <https://www.klayout.de/>
- KLayout downloads: <https://www.klayout.de/build.html>
- KLayout PyPI package: <https://pypi.org/project/klayout/>
- KLayout Python module docs: <https://www.klayout.org/klayout-pypi/>
- KLayout DRC docs: <https://www.klayout.de/doc/manual/drc_basic.html>
- KLayout LVS docs: <https://www.klayout.de/doc/manual/lvs_overview.html>
- Xschem overview: <https://xschem.sourceforge.io/stefan/xschem_man/what_is_xschem.html>
- Xschem install docs: <https://xschem.sourceforge.io/stefan/xschem_man/install_xschem.html>
- OpenROAD docs: <https://openroad.readthedocs.io/en/latest/main/README2.html>
- OpenLane repo: <https://github.com/The-OpenROAD-Project/OpenLane>

## Planning Status

Status: ready for conversion into an execution plan.

Recommended next implementation step:

- create the NHM2 cavity contract and generator scaffold in-repo, then write the execution-plan markdown against those concrete paths.
