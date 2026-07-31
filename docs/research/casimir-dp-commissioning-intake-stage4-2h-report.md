# Casimir-DP Stage-4.2H commissioning-intake report

**Run:** `casimir-dp-commissioning-intake-stage4-2h-v1-20260730T050000000Z`  
**Evidence class:** `commissioning_template_and_synthetic_dry_run_only`  
**Claim ceiling:** `commissioning_intake_and_stage4_2g_packet_compilation_only`  
**Campaign gate:** `pass`  
**Current dossier:** `casimir-dp-stage4-2h-commissioning-blank-v1` (`blank_commissioning_template`)  
**Observable bridge edges added:** `0`

## Decision

No-go for empirical acquisition claims until a provenance-bound measured commissioning dossier passes. The blank template and synthetic dry run prove the intake, covariance-space recomputation, custody, and packet-compilation path only.

## What Stage 4.2H closes

- It assigns one instrument or computational authority to every required role.
- It binds every Stage-4.2G acquisition product to calibration ancestry, custody, uncertainty, and a content hash.
- It freezes calibration, pilot, blinded confirmatory, and independent-replication partitions.
- It defines the raw complex-coherence, environment, metrology, polarization, companion, and provenance columns.
- It recompiles the Stage-4.2G packet without changing the apparatus identity, DP law, thresholds, or confirmatory fit policy.

## Synthetic dry-run result

- Contract gate: `pass`.
- Dry-run gate: `pass`.
- Stage-4.2G identifiability: `pass`.
- Empirical pilot readiness: `not_ready`.
- Measured evidence: `not_ready`.

Synthetic identifiers, hashes, covariance vectors, and custody events have zero empirical authority. They exist only to exercise the full software path and failure boundaries.

## Frozen partitions

- `calibration`: 200 paired windows; response fit `true`; covariance fit `true`; confirmatory score `false`.
- `pilot`: 400 paired windows; response fit `true`; covariance fit `true`; confirmatory score `false`.
- `confirmatory`: 1600 paired windows; response fit `false`; covariance fit `false`; confirmatory score `true`.
- `independent_replication`: 1600 paired windows; response fit `false`; covariance fit `false`; confirmatory score `true`.

Confirmatory and independent-replication partitions cannot refit response vectors or covariance. The blind mapping is unavailable to analysis in every partition contract.

## Current scientific standing

- `commissioning_contract`: `pass`.
- `synthetic_dry_run`: `pass`.
- `instrument_registry`: `not_ready`.
- `calibration_ancestry`: `not_ready`.
- `custody_and_blind_freeze`: `not_ready`.
- `raw_data_availability`: `not_ready`.
- `stage4_2g_packet_compilation`: `not_ready`.
- `empirical_pilot_readiness`: `not_ready`.
- `measured_evidence`: `not_ready`.
- `collapse_identification`: `blocked`.
- `manifold_dynamics`: `blocked`.
- `physical_viability`: `not_evaluated`.

Even a passing measured commissioning dossier would establish pilot input readiness, not collapse. Collapse identification requires the later blinded confirmatory residual, its frozen DP mass-and-separation scaling, ordinary-background rejection, and independent replication. Manifold dynamics additionally requires a separately justified relativistic stress-energy model; no Casimir-to-collapse transfer kernel is registered here.

