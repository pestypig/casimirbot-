# Casimir tiles: device concept, manufacturing expectations, and foundry fit for Nvidia

## Reference Annex Normalization

This document is a research annex. Authoritative manufacturing definitions and acceptance gates now live in:

- `docs/specs/casimir-tile-spec-v1.md`
- `docs/specs/casimir-tile-manufacturing-delta-v1.md`
- `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
- `docs/specs/casimir-tile-rfq-pack-v1.md`

Use this annex for context and source mapping, but use `docs/specs/*` as the governance contract for implementation and foundry handoff.

## What the codebase means by a Casimir tile

In the CasimirBot/Helix codebase, "Casimir tiles" are first defined as sectorized lattice elements used for grid visualization and telemetry - units in the dashboard/ledger that track per-tile quantities such as pressure and pipeline state fields.

Separately, the repo also contains a lab-oriented physical "tile" specification: a single, buildable Casimir cavity (parallel plate) with equations and guardrails mapped to code. That document is explicitly framed as a bench-facing cavity model that can be measured on its own.

Primary repo anchors:
- `docs/knowledge/casimir-tiles.md`
- `docs/guarded-casimir-tile-code-mapped.md`
- `docs/casimir-tile-mechanism.md`

## Key physical specs implied by CasimirBot

The guarded tile document's "lab picture" models a parallel-plate coupon with:

- Area: `A_tile = 1 mm^2` (`1e-6 m^2`)
- Gap: `g = 96 nm` (with sweep intent around `80-150 nm`)
- Materials: high-resistivity Si or SiN membranes, optional Au coating
- Thickness starting point: MEMS-like membrane `t ~ 1-2 um` (while code defaults may assume a much thicker slab unless overridden)
- Environment: high vacuum (`<= 1e-6 Torr`) at room or cryogenic temperature (`~4 K`) to reduce patch noise

The same document includes two manufacturing-critical non-ideal effects:

1. Patch-voltage electrostatic pressure as an added load term:
   - `P_ES = 0.5 * epsilon_0 * (V_p / g)^2`
   - `V_p` is treated as a bench-measured/tunable input
2. A mechanical feasibility guardrail:
   - plate restoring pressure vs combined Casimir plus electrostatic load
   - explicit warning that thin MEMS membranes at millimeter span can be infeasible unless span/thickness/gap/patch conditions are adjusted

For the default `96 nm, 1 mm^2` reference case, the guarded tile document reports:

- Casimir pressure: `~15.3 Pa`
- Example patch pressure at `V_p = 50 mV`: `~1.2 Pa`
- Total load scale: `~16.5 Pa`

The repo also contains a separate system-level mechanism-chain parameterization used in the Helix pipeline narrative:

- `gap_nm = 1`
- `tileArea_cm2 = 25`

This should be interpreted separately from the near-term lab-coupon spec above.

## Whether tile specs derive from the March 2026 draft papers

The two referenced drafts are claim-governance and evidence-gating documents for a reduced-order campaign, and both retain the boundary statement that this lane is not a physical warp feasibility claim:

- `docs/audits/research/warp-paper-draft-A-defensible-now.md`
- `docs/audits/research/warp-paper-draft-B-strong-claim-upgrade-spec.md`

Draft A includes tile-adjacent knobs (for example `gap_nm`) in a materials-bounds table as derived candidate parameters from commit-pinned artifacts. The same candidate value (`gap_nm = 8`) appears in the decision ledger's `bestCandidate.params`.

Draft B is an upgrade-spec document describing external closure requirements; it does not define a fabrication-ready Casimir tile geometry.

Best-supported repo conclusion:

1. The March 2026 drafts consume campaign artifacts that include candidate `gap_nm` values.
2. The fabrication-resembling cavity spec (`96 nm`, `1 mm^2`, Si/SiN/Au options, vacuum plus patch and stiffness guardrails) is defined in the guarded tile document, not in Draft A/B.

## Most likely manufacturing flow for an approximately 100 nm parallel-plate cavity

A `1 mm^2`, `~100 nm`-gap parallel-plate cavity maps more naturally to MEMS/NEMS plus wafer-level packaging than to leading-edge logic CMOS. Dominant risks are gap uniformity, parallelism/flatness, stiction and pull-in, surface roughness, electrostatic patches, and vacuum integrity.

A likely industrial flow (one plausible variant):

1. Substrate stack selection
   - Si/SOI or SiN-on-Si style stack chosen for membrane mechanics and process compatibility.
2. Bottom electrode and reference-plane preparation
   - Doped Si and/or metal stack (for example Ti/Au), with strict contamination and roughness control.
3. Nanogap definition (`~80-150 nm`)
   - Sacrificial spacer route, precision spacer posts/rings, or bonded-wafer cavity-height definition.
4. Top membrane/plate build and metallization
   - Low-stress membrane process and optional conductive coating.
5. Release and anti-stiction flow
   - Stiction-safe release method (for example vapor release and/or supercritical drying path).
6. Wafer-level sealing and vacuum packaging
   - Cavity sealing with compatible bonding scheme and getter strategy as needed.
7. Metrology and acceptance testing
   - Flatness/roughness, patch-potential mapping, force-gap response, and package leak/hermetic checks.

Engineering reality checks from repo guardrails plus Casimir/MEMS practice:

- `1 mm` lateral span at `~100 nm` gap usually requires support/segmentation/thicker structures or reduced effective span to avoid collapse/pull-in.
- Patch-potential characterization/mitigation is mandatory because it can add force systematics with similar gap dependence.

## Could Nvidia participate, and what that realistically means

Nvidia's FY2026 10-K describes a fabless, partner-based manufacturing model (external foundry fabrication plus outsourced assembly/test/packaging).

Practical implication:

- Yes, Nvidia can participate strongly as system designer, simulation/compute provider, controls and data-pipeline integrator, and program orchestrator.
- No, Nvidia is not positioned as a direct MEMS cavity fab under its currently described operating model.

Its U.S. manufacturing announcements are also partner-driven (foundry plus manufacturing partners), not Nvidia-owned wafer fabrication.

## Public-market foundries and manufacturers aligned with cavity-physics hardware

For MEMS nanogap cavities and vacuum-sealed structures, the most directly aligned public-market options are:

- Tower Semiconductor (`NASDAQ: TSEM`)
- X-FAB (`Euronext Paris: XFAB`)
- UMC (`NYSE: UMC`)
- SkyWater (`NASDAQ: SKYT`)

For cavity-physics adjacencies beyond Casimir (especially photonics/superconducting routes), relevant public companies include:

- GlobalFoundries (`NASDAQ: GFS`) for silicon photonics manufacturing
- Intel Foundry (for advanced packaging/integration programs)

Final fit summary:

- Best near-term manufacturing lane for Casimir-style coupons is MEMS-capable foundry plus wafer-level packaging partner stack.
- Nvidia fit is strongest as R&D integrator and ecosystem coordinator, not as direct fabricator.

## Source map

### Repo sources

- `docs/specs/casimir-tile-spec-v1.md`
- `docs/specs/casimir-tile-manufacturing-delta-v1.md`
- `docs/specs/casimir-tile-test-vehicle-plan-v1.md`
- `docs/specs/casimir-tile-rfq-pack-v1.md`
- `docs/knowledge/casimir-tiles.md`
- `docs/guarded-casimir-tile-code-mapped.md`
- `docs/casimir-tile-mechanism.md`
- `docs/audits/research/warp-paper-draft-A-defensible-now.md`
- `docs/audits/research/warp-paper-draft-B-strong-claim-upgrade-spec.md`
- `artifacts/research/full-solve/g4-decision-ledger-2026-02-26.json`

### External references

- NVIDIA FY2026 Form 10-K (manufacturing strategy):
  - https://www.sec.gov/Archives/edgar/data/1045810/000104581026000120/nvda-20260125.htm
- NVIDIA partner-driven U.S. manufacturing announcement:
  - https://nvidianews.nvidia.com/news/nvidia-to-manufacture-american-made-ai-supercomputers-in-us-for-first-time
- Tower MEMS:
  - https://www.towersemi.com/technology/mems
- X-FAB investors/capability context:
  - https://www.xfab.com/investors
- UMC MEMS process building blocks:
  - https://www.umc.com/en/Tech/mems
- SkyWater capability overview:
  - https://skywatertechnology.com/capabilities/
- GlobalFoundries photonics context:
  - https://gf.com/blog/globalfoundries-completes-acquisition-of-advanced-micro-foundry-expanding-silicon-photonics-capabilities/
- Wafer-level vacuum packaging review context:
  - https://www.mdpi.com/2072-666X/12/1/84
- Casimir experimental systematics context (patch potentials and related effects):
  - https://www.nature.com/articles/s41467-018-04690-9
  - https://www.nature.com/articles/s41467-023-43805-4
