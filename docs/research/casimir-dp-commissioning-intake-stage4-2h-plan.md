# Casimir-DP Stage-4.2H commissioning-intake plan

## Objective

Turn the Stage-4.2G empirical-feasibility packet into an executable laboratory
intake without claiming that any apparatus product has been measured. Stage
4.2H is the last software-side boundary before physical commissioning.

## Immutable upstream

The campaign consumes the certified Stage-4.2G run
`casimir-dp-empirical-feasibility-pilot-stage4-2g-v1-20260730T030000000Z`
as immutable evidence. It may not alter the selected silica apparatus,
regularized mass-density DP generator, response-space thresholds, product
order, or open scientific statuses.

## Required commissioning dossier

A measured dossier must supply:

1. twelve identity-, calibration-, and custody-bound instrument or
   computational-authority records;
2. thirteen Stage-4.2G products, with physical/metrology products measured and
   protocol-only authority limited to blind custody and independent solver
   replication;
3. the frozen eight-cell response order and full whitened complex-coherence
   response/covariance input;
4. calibration, 400-window pilot, 1600-window confirmatory, and 1600-window
   independent-replication partitions;
5. raw columns for coherence quadratures, covariance blocks, state preparation,
   branch/hold metrology, thermal/gas/vibration/charge/cavity/polarization
   monitors, companion detection, exclusions, custody, and artifact hashes;
6. a blind-map commitment, exclusion/covariance freeze receipt, custody events,
   and independent implementation declaration.

Every measured artifact must be repository-relative, content-addressed, and
inside the campaign root. Synthetic or unacquired references fail closed.

## Order of operations

1. Verify the immutable Stage-4.2G authority tuples.
2. Load the frozen single-apparatus identity.
3. Validate the blank commissioning dossier.
4. Generate a synthetic dry run with explicit zero empirical authority.
5. Freeze instrument, product, partition, and raw-column order.
6. Validate calibration, custody, and local artifact hashes.
7. Compile a Stage-4.2G packet only when the dossier is complete.
8. Recompute the inherited whitened identifiability gates without refitting.
9. Preserve the ordinary-physics, frozen-DP, and speculative-transfer
   hypotheses as separate lanes.
10. Emit a content-addressed report, trace, receipt, and go/no-go decision.

## Promotion and falsification boundary

The blank and synthetic runs can pass the parser, provenance logic, packet
compiler, and numerical gate replay. They cannot make an instrument,
calibration, raw datum, pilot, collapse, manifold, or viability claim ready.

A complete measured dossier can authorize only the empirical pilot. It cannot
identify collapse. That later claim requires a blinded confirmatory residual
following the preregistered DP mass-and-separation law, rejection of thermal,
electromagnetic, vibration, gas, readout, and sham/detuned controls, plus
independent replication. A manifold claim additionally requires a complete
relativistic stress-energy model. No Casimir-to-collapse transfer kernel is
registered in Stage 4.2H.

## Authoritative run

Use:

```text
npm run casimir:dp:stage4-2h -- --generated-at 2026-07-30T05:00:00.000Z --run-id casimir-dp-commissioning-intake-stage4-2h-v1-20260730T050000000Z --report-doc docs/research/casimir-dp-commissioning-intake-stage4-2h-report.md
```

The authoritative bundled run uses the blank dossier, executes the synthetic
dry run, and must return
`no_go_until_provenance_bound_measured_dossier_passes`.
