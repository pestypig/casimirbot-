Program gate: G1 — real calibrated solar baseline
Workstream: controlled stellar composition transport
Capability or component: zero-transport solar-age MESA baseline and observational calibration
Current maturity: reduced_order_diagnostic
Target maturity: calibrated_baseline
Required frozen inputs: G0 result; selected MESA release, runtime image, inlists, microphysics, calibration vector, and tolerances
Required evidence: actual solver logs and hashes, converged solar-age model, complete residual vector, and zero fixture fallback
Stop/fail criteria: stop at the first solver, provenance, capacity, convergence, or observational hard failure
Explicit non-goals: intervention transport, lifetime extension, GYRE campaign, actuator mechanism, NHM2 or warp promotion
Downstream gate unlocked: none; G2 remains blocked

# G1 result record — attempt 1

Decision: **`BLOCKED_BASELINE_CALIBRATION`**

Decision date: **August 26, 2026**

## First hard failure

The frozen Docker runtime cannot be installed safely on the current host:

| Item | Observed value |
| --- | ---: |
| Pinned image | `evbauer/mesa_lean:r24.03.1.01` |
| Image config digest | `sha256:4c961961858c808842c133662416f14b44faa191b6765c7ab9aaded6e65aeaf6` |
| Image present locally | no |
| Compressed layer total | `4,609,897,301` bytes |
| Free bytes on the Docker-hosting drive | `4,283,359,232` bytes |
| Frozen minimum free capacity | `25,000,000,000` bytes |
| Typed failure | `INSUFFICIENT_DISK_FOR_MESA_IMAGE` |

The compressed image is already larger than available free space. MESA-Docker's
published setup guidance recommends 25 GB of free space because the downloaded
layers expand substantially and a run also needs working space. The image was
therefore not pulled. No solver was executed and no profile was admitted.

## Adapter audit and repair

The existing reproduction adapter previously did not execute its declared
`mesaCommand`. It checked for pre-existing output files, wrote an exit-code-zero
log, and returned `reproduced`. G1 repaired that provenance defect:

- non-import runs now require a structured executable and argument vector;
- execution uses no shell interpolation;
- stdout, stderr, and the real exit code are retained;
- nonzero exit status fails before reproduction can be granted; and
- declared profile/history outputs are checked only after successful execution;
  unchanged pre-existing outputs are rejected as stale.

Targeted tests cover successful execution, failed execution, display-only
command rejection, fixture import, and missing-output behavior.

## Work stopped by the gate

In accordance with the packet's first-failure rule, this attempt did not freeze
science-grade calibration tolerances, construct final inlists, or inspect model
outcomes after the capacity failure. The official MESA
`simplex_solar_calibration` case is retained as a starting reference, not as an
automatically certified research baseline.

No claim is made that:

- MESA ran on this host;
- a solar calibration converged;
- the repository now has a `calibrated_baseline`; or
- G2 is eligible.

## Recovery condition

Resume G1 as a new versioned attempt only after either:

1. at least 25 GB is available on the Docker data drive and the pinned image can
   be installed and verified by digest; or
2. a different, content-addressed MESA runtime with adequate capacity is
   explicitly frozen before execution.

The approved first recovery path is specified in
[`controlled-stellar-composition-transport-g1-runtime-capacity-recovery.md`](./controlled-stellar-composition-transport-g1-runtime-capacity-recovery.md).
It adds a profile-owned, resumable Google Drive archival connector as the
primary capacity path and a narrow Windows window-state broker as an optional
operator-surface capability. Upload, remote verification, owner-confirmed local
release, and free-space measurement remain separate evidenced stages. None can
be relabeled as a MESA execution or calibrated baseline.

The next attempt must then freeze the full microphysics, resolution,
calibration, covariance, and convergence policies before viewing its solar
model results.
