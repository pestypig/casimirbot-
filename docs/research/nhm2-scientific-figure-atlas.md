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

## Re-run Instructions

```bash
npm run nhm2:render-scientific-figure-atlas
npm run nhm2:validate-scientific-figure-atlas
npm run test:nhm2:figures
npm run nhm2:figures:check
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
