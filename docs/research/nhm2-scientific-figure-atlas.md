# NHM2 Scientific Figure Atlas

The NHM2 scientific figure atlas separates spatial solve diagnostics from mathematical closure, source architecture, and validation-ledger evidence.

Spatial quantities are shown with geometry renders or field slices.
Tensor and closure relationships are shown as matrices or charts.
Observer/QEI checks are shown as worldline/sampling plots.
Provenance and claim boundaries are shown as DAGs, maps, and ledger strips.

This atlas is diagnostic. It does not validate propulsion, does not establish a physical mechanism, and does not promote the run.

## Figure Families

- Geometry figures use the existing scientific 3+1 renderer or field-slice charts for solve-derived spatial quantities.
- Mechanism figures show tile-sector architecture, schedule, and representative layout without treating tile colors as field intensity.
- Math-closure figures use matrices, residual charts, worldline plots, and energy-condition diagnostics.
- Evidence-ledger figures use DAGs, provenance maps, claim-boundary strips, and literature context maps.

## Boundary Rule

Non-spatial validation state is not drawn on the hull.
Source-closure status, certificate status, provenance, literature boundaries, claim locks, tensor authority gates, and QEI dossier status are rendered as graphs, tables, matrices, or DAGs.

## Fidelity Rules

Scalar field figures write field-stat sidecars with min/max, percentiles, normalization, units, source hash, and formatted legend ticks.
Lapse and shift panels use independent scales so low-amplitude structure is not hidden by a shared color domain.
Signed theta diagnostics use a zero-centered diverging scale and document near-zero masking in figure metadata.

The sector schedule accounts for every sector in the cavity contract.
The representative tile layout records required process/mask layers and keeps color semantics tied to fabrication layout, not energy, curvature, or spacetime intensity.
Observer/QEI worldline plots may show region bands and sampling windows, but remain audit-path placeholders unless ledger evidence explicitly promotes them.

## Re-run Instructions

```bash
npm run nhm2:render-scientific-figure-atlas
npm run nhm2:validate-scientific-figure-atlas
tsx tools/nhm2/validate-scientific-figure-fidelity.ts
npm run test:nhm2:figures
npm run nhm2:figures:check
npm run nhm2:figures:fidelity-check
```

The default output folder is:

```text
artifacts/research/full-solve/rendered/scientific-figure-atlas/<date>
```

## Claim Boundary

All generated manifests preserve:

```text
validationClaimAllowed=false
physicalMechanismClaimAllowed=false
promotionAllowed=false
```

External literature is context only. It is not validation evidence for NHM2.
