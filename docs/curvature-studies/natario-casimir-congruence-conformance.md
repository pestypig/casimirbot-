# Natário Conical Congruence vs Casimir Sector-Strobe Mechanism Conformance

## Purpose

This document defines a minimal, publication-useful conformance protocol for the current run artifacts. The goal is to state, with explicit checks, whether the lattice strobing/lobe control mechanism can be treated as a constructive realization of the targeted Natário conical solution.

## Current state in one sentence

Strict Natário math checks are close to being admissible in current runs, but full claim-ready conformance requires explicit linkage between mechanism control knobs (strobing, sectors, duty profile) and the effective metric channels asserted in diagnostics.

## Conformance model

Treat this as a two-layer claim:

1. **Target-layer claim (geometric):** the generated fields are in Natário canonical form and satisfy strict ADM identities.
2. **Mechanism-layer claim (physical):** the Casimir sector mechanism produces those fields through controlled duty/lobe scheduling without introducing unspecified hidden assumptions.

The two layers must both pass for a “strictly congruent” label.

## 1) Required Natário target equations (conceptual checklist)

For each voxel with fields in target canonical frame:

- `g_tt` identity
  - `g_tt = -alpha^2 + gamma_ij * beta^i * beta^j`
- Expansion identity
  - `theta + K_trace = 0` (with declared convention)
- Canonical routing
  - `natario` mode
  - `chart = comoving_cartesian`
  - `observer = eulerian_n`
  - `normalization = si_stress`

These are enforced through current checker artifacts and diagnostic gates.

## 2) Mechanism-to-field mapping (what must be explicit)

Map each control mechanism component to field effects and artifact evidence key families.

- Sector geometry / lattice topology
  - Controls: `sectors`, `sector` masks, lobe geometry
  - Intended effect: spatial support and anisotropy of generated curvature and stress-energy
  - Evidence family: `pipeline-proofs`, `pipeline-summaries` / metric invariants

- Temporal strobing
  - Controls: `dutyCycle`, `dutyBurst`, `dutyFR`, `dutyEffective_FR`
  - Intended effect: duty-averaged shaping of curvature and effective warp-channel amplitudes
  - Evidence family: `pipeline-proofs` (effective duty values), time-stamped run metadata

- Concurrency policy
  - Controls: `sectors_live`, `concurrentSectors`, burst constraints
  - Intended effect: overlap envelope and peak/average energy demand
  - Evidence family: energy pipeline metrics and actuator telemetry

- Casimir tile envelope
  - Controls: sector phase masks, lobe intensity envelopes, split/activation flags
  - Intended effect: sign structure and localization of negative-energy-like support
  - Evidence family: tile diagnostics and signed-support summaries

### Required schema rule
`beta` must be represented in checker-consistent form. If channelized as components, the checker must accept `beta_x`, `beta_y`, `beta_z` as a complete vector representation (not only `betaU` packed form).

## 3) Conformance criteria (operational)

Use a strict pass matrix with three bands:

### A. Geometry strictness
- `gttResidual` strict PASS
- `thetaK` strict PASS
- Invariant availability PASS (required baseline invariants present)
- Gate evidence remains CERTIFIED and proxy-free for strict channels

### B. Provenance strictness
- Field provenance for all strict visualization channels is explicit and complete
- Per-channel path from GR brick source to panel render path is auditable
- Missing fields like `clockRate`/`curvature` must be either declared proxy-safe or declared explicitly as diagnostic-only

### C. Mechanism-to-congruence strictness
- Strobing and lobe parameters are included in the same bundle
- Effective duty-cycle values are present and applied
- Mapping from mechanism logs to metric residuals is documented and reproducible
- Temporal aliasing / averaging checks show that pulse scheduling does not change the identity residual regime

## 4) Suggested run protocol (minimal fixed sequence)

1. Build/restart pipeline for deterministic bundle capture.
2. Capture diagnostics + proofs + brick + pipeline-proofs bundle set in one run directory.
3. Run strict checker.
4. Capture panel debug payload for route parity (same run id / seed).
5. Score conformance via:
   - geometry strictness matrix
   - provenance matrix
   - mechanism mapping matrix
6. Only when all three matrices are PASS, issue strict conformance for publication context.

## 5) What still needs tightening

- Add explicit `beta` component mapping metadata so packed-vector assumptions are removed.
- Add a short mechanism mapping note in diagnostics/proofs for strobing-to-field contribution (who sets what, when).
- Add one stable published `geomWarp` interpretation string for rendering parity so figure captions remain unambiguous.
- Keep strobe-cycle residuals and static-snapshot residuals separately in artifacts to prevent false acceptance from temporal averaging.

## 6) Research requirements

Do not run broad new theoretical research now. Run **targeted** research only:

1. Effective-metric equivalence under pulsed/sector-averaged negative-energy sources.
2. Quantified constraints on duty and lobe phasing that preserve Natário identity residual bounds.
3. Reproducibility of signed-support interpretation under rendering normalization and warp warping.

## 7) Working definition of “congruent” for this project

A run is Natário-conical-congruent only if:

- strict ADM identities hold on the chosen bundle,
- provenance is traceable end-to-end,
- and strobing/lobe generation is demonstrably the named source of field content (not a hidden post-process).

If any one leg is missing, classify as **congruence-in-progress** rather than strict.

## 8) Draft acceptance template

Use this in each run summary:

- **Geometry status:** PASS/FAIL with exact check IDs
- **Provenance status:** PASS/FAIL with missing fields listed
- **Mechanism status:** PASS/FAIL with duty/lobe trace
- **Verdict:** `strict` or `in-progress`
- **Reviewer note:** any non-visual normalization/wall overlays that influence interpretation

This keeps Natário geometry and Casimir mechanism claims coupled but never conflated.
