# Natário-Casimir Warp Bubble Operations Runbook

## Scope

This document defines the long-term operational protocol for running, validating, and certifying Natário-conical warp-bubble bundles generated through Casimir-sector strobing mechanisms.

## 1) Operating objective

Operate safely and reproducibly so every accepted run is:
- Geometrically admissible in strict Natário mode,
- Mechanism-traceable (sector/lobe/strobe driven),
- Render-parity auditable between diagnostics and lattice outputs,
- Reproducible via immutable run artifacts and verifier certificates.

## 2) Run lifecycle

### 2.1 Pre-flight

- Assign fixed run seed and bundle id.
- Verify required input files/configs exist for the run.
- Confirm target mode:
  - `canonical.family = natario`
  - `canonical.chart = comoving_cartesian`
  - `canonical.observer = eulerian_n`
  - `canonical.normalization = si_stress`
- Validate sector/strobe envelope settings are within policy caps.
- Confirm expected provenance declarations are defined for strict channels.

### 2.2 Build/restart

- Start pipeline for the exact bundle target.
- Ensure runtime version, environment mode flags, and AGI adapter mode are recorded.
- Capture artifact generation paths in a single run directory.

### 2.3 In-flight

- Capture periodic checkpoints of:
  - sector duty values,
  - active sectors,
  - duty-burst behavior,
  - strobing phase/tempo,
  - metric invariants and stress proxies.
- If any hard gate fails, stop downstream interpretation and flag run for investigation.

### 2.4 Post-flight validation

- Generate and archive bundle set:
  - `/api/helix/time-dilation/diagnostics`
  - `/api/helix/pipeline/proofs`
  - `/api/helix/gr-evolve-brick?format=json&includeExtra=1&includeMatter=1&includeKij=1`
  - optional lattice debug snapshot for rendering parity
- Run strict checker.
- Run required tests and Casimir verifier.
- Export training trace.

## 3) Admission criteria

A run is **CERTIFIED-CONGRUENT** only if all pass:

1. Geometry strictness
- `gttResidual` PASS
- `thetaK` PASS
- `invariantAvailability` PASS
- no unresolved strict WARNs tied to identity math

2. Provenance strictness
- channel provenance present and explicit for all strict channels used in truth rendering
- per-run bundle path and seed aligned across artifacts

3. Mechanism strictness
- strobe/duty/sectors telemetry present in bundle
- mechanism-to-field lineage captured (not inferred)
- no hidden proxying for strict rendering path

4. Verification strictness
- adapter verifier PASS
- certificate integrity OK
- training-trace exported

If any item fails, classify run as **CONGRUENCE-IN-PROGRESS**.

## 4) Mandatory evidence checks (artifact-level)

- Compare across artifacts for the same bundle:
  - diagnostics strict flags and gate,
  - checker primary status and key metrics,
  - proofs/provenance and duty-cycle fields,
  - panel route parity if available.
- Cross-check `render_plan` and any panel-specific geometry controls for single source of truth.

## 5) Mechanism traceability requirements

- All conformance claims must include strobing/lobe context:
  - duty profile,
  - sectors_total,
  - sectors_live,
  - duty burst/effective duty,
  - any concurrent sector limit.
- Record whether checks refer to:
  - instantaneous snapshots,
  - cycle-averaged snapshots,
  - or both.

## 6) Escalation thresholds

- Any strict math WARN/FAIL blocks publication-ready claims immediately.
- Any provenance missing-field error blocks strict admission.
- Any mismatch between diagnostics and panel debug capture requires rerun with same seed.
- Geometry/rendering inconsistency (e.g. two different geometry warp scales in same payload) is elevated for human review before visual publication.

## 7) Daily operational controls

- Do not modify geometry identity logic to “fit” checks.
- Do not alter strobing parameters without updating mechanism traceability mapping.
- Keep rendering controls labeled as visual transforms in the UI and panel metadata.

## 8) Roles and cadence

- Run engineer: executes build, collection, checker, verifier, and artifact pack.
- Verification lead: reviews admission matrix and signs off on strict status.
- Visualization owner: verifies legend semantics and debug parity.
- Reviewer: approves publication readiness only when strict criteria and mechanism traceability are both PASS.

## 9) Output states

- `CERTIFIED-CONGRUENT`: strict geometry + provenance + mechanism + verifier all PASS.
- `CONGRUENT-PARTIAL`: no strict blockers, but one or more non-blocking interpretation ambiguities remain.
- `CONGRUENCE-IN-PROGRESS`: geometry/provenance/mechanism gap exists.
- `REJECT`: any hard strict blocker.
