Program gate: G1 — real calibrated solar baseline
Workstream: runtime installation and identity verification
Capability or component: frozen MESA Docker image
Current maturity: reduced_order_diagnostic
Target maturity: calibrated_baseline, not attained by installation
Required frozen inputs: configs/research/controlled-stellar-composition-transport-g1-runtime.v1.json
Required evidence: successful pull, local descriptor, digest-addressed manifest, matching configuration digest and architecture
Stop/fail criteria: pull failure, identity or architecture mismatch, inadequate capacity
Explicit non-goals: solar calibration, source-build reproduction, data deletion, science-criteria changes
Downstream gate unlocked: none

# G1 image installation — September 13, 2026

Outcome: **IMAGE_IDENTITY_VERIFIED** (runtime installation only).
Observation time: `2026-09-13T13:51:50.0894806-04:00`.

The preceding [runtime recovery](./controlled-stellar-composition-transport-g1-preflight-2026-09-13.md)
restored Docker startup. The frozen runtime v1 configuration remains unchanged,
with SHA-256 `96ee1684d4b395ca47a12c621ab2630ed5ed8d3ec10d448ca814e5254cd58431`.

| Check | Observed result |
| --- | --- |
| Engine | Docker `28.3.2`, Linux |
| Pre-install C: free bytes | `42,092,740,608`; exceeds frozen `25,000,000,000` minimum |
| Pull command | `docker pull --platform linux/amd64 evbauer/mesa_lean:r24.03.1.01` |
| Pull exit code | `0`; all layers reported pull complete |
| Local architecture | `linux/amd64` |
| Manifest digest | `sha256:c9e4e66db3b34ca8b977bd32725a098eb4c6e81ac1e2f261aa4af38a7954de62` |
| Configuration digest | `sha256:4c961961858c808842c133662416f14b44faa191b6765c7ab9aaded6e65aeaf6`; frozen match |
| Compressed layer sum | `4,609,897,301` bytes; frozen match |
| Post-install C: free bytes | `22,960,087,040` |

Subsequent preparation should use the digest-addressed reference:

```text
evbauer/mesa_lean@sha256:c9e4e66db3b34ca8b977bd32725a098eb4c6e81ac1e2f261aa4af38a7954de62
```

## Verification and initial check correction

The initial comparison of local image `Id` with the configuration digest
failed. This local image store exposes the manifest digest in `Id` and
`Descriptor.digest`, not the configuration digest. No image or frozen value
was changed. The successful check bound the local `RepoDigests` entry to its
local descriptor, retrieved that exact digest-addressed manifest, and compared
`manifest.config.digest` to the frozen configuration digest. Local architecture
and compressed layer sum also matched. The tag manifest was inspected before
download. This is Docker content-addressed identity verification, not an
independent filesystem rehash or source-code audit.

## Capacity and scientific boundary

Measured free space declined by approximately 19.13 GB across installation.
This includes Docker storage behavior and possible concurrent host activity;
it is not an exclusive image-size measurement. The image-inspection size field
does not replace host free-space checks.

Post-install free space is below 25 GB. Before science execution, freeze and
check working-storage, memory, runtime, checkpoint and evidence-retention
budgets. Do not silently lower a capacity gate or automatically delete data.

No container or MESA model was launched for this goal. In-image source and
compiler identities still need inspection; calibration targets, covariance,
microphysics, inlists and convergence criteria must be frozen in a new
versioned science attempt before model outcomes are viewed. G1 remains open,
G2 blocked, and no calibrated baseline is claimed.
