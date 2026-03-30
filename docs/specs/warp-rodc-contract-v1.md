# Warp RODC Contract v1

## Purpose

Define the machine-readable reduced-order deterministic congruence artifact used by warp-family comparison audits.

This contract is:

- reduced-order
- contract-scoped
- replay-oriented
- diagnostic-local

It is not a metric-identity or warp-feasibility contract.

## Boundary

RODC artifacts describe:

- the declared diagnostic contract
- the reduced-order feature vector extracted under that contract
- the distance-to-baseline policy outputs
- robustness status
- preconditions and claim boundaries

They do not, by themselves, justify:

- theory identity claims
- lane-invariant claims
- feasibility claims

## Source of Truth

Type contract:

- `shared/warp-rodc-contract.ts`

Current producer:

- `scripts/warp-york-control-family-proof-pack.ts`

Current non-York producer:

- `scripts/warp-render-congruence-benchmark.ts`

Current drift report:

- `scripts/warp-rodc-drift-report.ts`

## Snapshot Schema

Artifact type:

- `warp_rodc_snapshot/v1`

Required top-level fields:

- `artifactType`
- `artifactFamily`
- `generatedOn`
- `generatedAt`
- `boundaryStatement`
- `contract`
- `inputs`
- `provenance`
- `evidence_hashes`
- `feature_vector`
- `distance`
- `policy`
- `robustness`
- `preconditions`
- `cross_lane`
- `verdict`
- `notes`
- `checksum`

## Contract Block

The `contract` block must include:

- `id`
- `version`
- `lane_id`
- `classification_scope`

This is mandatory because reduced-order features are lane-relative.

## Evidence Hashes

Minimum evidence linkage:

- `metric_ref_hash`
- `theta_channel_hash`
- `k_trace_hash`
- `slice_hashes_by_view`

Optional generic evidence linkage:

- `other_hashes`

Use `other_hashes` when a non-York consumer needs replay-safe provenance hashes
that are not naturally expressed as York slice hashes.

If these hashes are missing, the artifact may still exist, but the upstream proof-pack should treat the verdict as inconclusive under strict precondition rules.

## Verdict Semantics

`verdict.status` is one of:

- `congruent`
- `distinct`
- `inconclusive`

`verdict.stability` is one of:

- `stable`
- `marginal`
- `unstable`
- `not_evaluated`

Interpretation:

- `congruent` means family-congruent under the declared reduced-order contract
- `distinct` means not matched to any declared baseline under that contract
- `inconclusive` means preconditions, support, or contract completeness block interpretation

## Drift Report Schema

Artifact type:

- `warp_rodc_drift_report/v1`

Required top-level fields:

- `artifactType`
- `generatedOn`
- `generatedAt`
- `boundaryStatement`
- `family`
- `latestArtifactPath`
- `previousArtifactPath`
- `latestChecksum`
- `previousChecksum`
- `contract`
- `verdict`
- `featureDrift`
- `distanceDrift`
- `evidenceHashChanges`
- `summary`
- `checksum`

## Drift Status Semantics

`summary.status` is one of:

- `stable`
- `drifted`
- `contract_drift`
- `inconclusive`

Use:

- `stable` when no feature, distance, verdict, or evidence-hash drift is detected beyond tolerance
- `drifted` when reduced-order outputs changed under nominally comparable conditions
- `contract_drift` when contract identity changed, making direct comparison non-equivalent
- `inconclusive` when no previous comparable artifact exists

## Current York Producer Mapping

The current York proof-pack should emit:

- full audit payload:
  - `warp_york_control_family_proof_pack/v1`
- reduced-order snapshot:
  - `warp_rodc_snapshot/v1`

This split preserves the full audit while creating a smaller contract for:

- regression tests
- drift reports
- future multi-lane comparisons
- claim registry integration

## Non-Goals

- no new solver physics
- no automatic promotion from reduced-order resemblance to ontology
- no implicit lane equivalence
- no replacement of full audit artifacts
