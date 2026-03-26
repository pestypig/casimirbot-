# HaloBank <-> Warp GR Foundations Bridge Audit (2026-03-24)

## Scope

This audit records the shared-GR bridge added between HaloBank's weak-field solar diagnostics and the warp / NHM2 metric lane.

## Source-backed assessment

- HaloBank Mercury precession and solar light-deflection now descend explicitly from the shared GR foundations lane rather than only implying GR through local metric manifests.
- The bridge is approximation-aware:
  - HaloBank remains a weak-field, solar-system diagnostic lane.
  - Warp / NHM2 remains a metric / ADM / stress-energy lane with downstream guardrails.
- The bridge is definitional and diagnostic. It does not upgrade either lane to certified maturity.

## DAG + tree effect

- Added an explicit bridge node in `docs/knowledge/halobank-solar-proof-tree.json`:
  - `bridge-halobank-solar-foundations-gr`
- Bound that bridge to the shared GR foundation nodes:
  - `physics-foundations-metric-definition`
  - `physics-foundations-field-equation-definition`
  - `physics-foundations-stress-energy-definition`
  - `physics-foundations-units-definition`
  - `physics-foundations-viability-definition`
- Updated HaloBank Mercury, solar null-geodesic, and inner parity proof nodes to use `equation_ref = "efe_baseline"`.
- Updated the derived route so `tree_dag.equation_refs` for:
  - `mercury_precession`
  - `solar_light_deflection`
  - `inner_solar_metric_parity`
  include `efe_baseline`.
- Added missing HaloBank claim-registry entries for:
  - `claim:halobank.solar:mercury_precession`
  - `claim:halobank.solar:resonance_libration`
- Bound the canonical bridge claim to the bridge node:
  - `claim:halobank.solar:gr_foundations_bridge`

## Source catalog

Primary / standards checked for the bridge semantics:

1. IAU 2000 Resolution B1.3, relativistic framework for BCRS and GCRS
   - https://syrte.obspm.fr/IAU_resolutions/Resol-UAI.htm
   - Use in repo: defines the weak-field reference-system baseline used by HaloBank metric context.

2. Einstein (1916), general-relativity weak-field benchmark lineage
   - https://doi.org/10.1002/andp.19163540702
   - Use in repo: timelike perihelion precession and solar deflection weak-field benchmark lineage.

3. Quillen, mean-motion resonance lecture notes
   - https://astro.pas.rochester.edu/~aquillen/phy411/lecture3.pdf
   - Use in repo: resonance-angle and libration-vs-circulation definition check for `resonance_libration`.

4. Alcubierre (1994)
   - https://doi.org/10.1088/0264-9381/11/5/001
   - Use in repo: warp metric family source anchor.

5. Natario (2002)
   - https://www.math.tecnico.ulisboa.pt/~jnatar/ficcao/warp.pdf
   - Use in repo: zero-expansion warp metric family source anchor.

6. NHM2 local source packs
   - `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`
   - `docs/audits/research/warp-primary-standards-citation-pack-2026-03-04.md`
   - Use in repo: canonical warp/NHM2 citation spine for the full-solve lane.

## Residual gaps

- HaloBank and warp now share the same GR parent definitions explicitly, but they still do not share a single executable equation lane.
- That is correct. HaloBank is a weak-field descendant lane; warp is a full metric / ADM descendant lane.
- Unrelated equation-backbone gaps still exist for some non-GR solar modules (`periodicity_commensurability`, `line_of_sight_occultation_geometry`) and should be addressed separately.

## Atlas evidence

- `atlas:why` / `atlas:trace` succeeded for `docs/knowledge/warp/warp-mechanics-tree.json` and confirmed the tree's current consumer/producer paths.
- `atlas:why` / `atlas:trace` did not resolve `docs/knowledge/halobank-solar-proof-tree.json`, indicating the HaloBank proof tree is not yet indexed in the same Atlas path set.

## Conclusion

The GR connection is now explicit and protocol-correct:

- HaloBank Mercury precession is a weak-field GR diagnostic descendant.
- NHM2 warp geometry is a metric/field-equation/stress-energy GR descendant.
- Both now attach to the same physics-foundations GR layer in the DAG.
