# Detection-research reuse audit

Date: September 7, 2026. Scope: bounded repository audit and recommendation, not a new physical solve or proof-maturity decision. The shared-scattering work program and NHM2 work program remain authoritative. No frozen candidate, apparatus input, runtime, certificate, or dated result was changed.

## Recommendation

Build a reproducible comparison of detector responses and discriminating controls from the existing scattering, complex-coherence, nuisance, and identifiability calculations. The first useful research product should answer: for a specified interaction and incident population, which observable and experimental change best distinguish the hypothesis from ordinary effects, and what uncertainty is required?

Preserve the user's priority of finding measurable overlap, but report complementary sensitivity and conditional nulls alongside overlap. This makes the work useful even if no model explains the LZ candidate and produces an accessible local signal. Do not select or normalize a mechanism solely to match the single event.

## Inspected reusable assets

| Asset and source | What can be reused | Evidence and transfer limits |
| --- | --- | --- |
| [Signature identifiability implementation](../../shared/casimir-dp-apparatus-identifiability-stage4-2b.ts), [redesign runner](../../scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts), [historical redesign report](casimir-dp-identifiability-redesign-stage4-2c-report.md) | Nuisance projection, signature similarity, full-design conditioning, power and acquisition forecasts | Synthetic design calculations. Existing schema and result semantics explicitly name DP; a general scattering adapter must not relabel DP authority as dark-matter evidence. The historical silica candidate is not the current frozen diamond apparatus. |
| [Material/thermal implementation](../../shared/casimir-dp-material-thermal-ordinary-null-stage4-2n.ts) | Complex phase/loss, ordinary thermal response, four-cell controls, covariance propagation | Finite geometry and material inputs are synthetic. Inspection found seeded phase/contraction and fixture receipts, not a measured full-Maxwell apparatus solution. Reuse equations and bookkeeping, not those numbers as calibrated forecasts. |
| [Retarded propagation implementation](../../shared/casimir-dp-retarded-source-propagation-stage4-2s.ts), [report](casimir-dp-retarded-source-propagation-stage4-2s-report.md) | Causal EM background response into phase, contraction, recoil and heating; conservation and limiting checks | Analytic/synthetic recovery. Source-current maps, Green tensor, switching spectra and joint covariance are still absent. Useful for testing false signatures from control electronics and readout. |
| [Proper-time implementation](../../shared/casimir-dp-proper-time-worldline-closure-stage4-2p.ts) | Weak-field potential/velocity to differential proper time, phase, internal-energy dephasing | Diagnostic weak-field model. A deterministic phase shift is not automatically coherence loss; actual paths, echo response and fluctuations must be supplied. This is a detector-response component, not a bosonic source model. |
| [Common-halo calculation](casimir-dp-portal-common-halo-2026-09-07.py) | Common incident distribution for xenon and directional sphere response, tensor moments, normalization/refinement checks | Xenon raw counts and rigid-sphere upper envelope, not a joint detector likelihood. Script imports a prefix of another script using source-text splitting and writes its result beside its source; needs a stable module interface and separate output directory before external reuse. |
| [All-speed envelope](casimir-dp-exothermic-all-speed-envelope-2026-09-07.py) | Conservative finite-size and speed-distribution checks that prevent false coherence enhancements | Conditional uniform rigid additive effective-potential model. Config hash is checked; upstream result hash is recorded, but not compared with a pinned expected hash here. Recording identity alone does not validate the upstream calculation. |
| [Public-data runner](../../scripts/research/run-casimir-dp-public-data-component-validation-stage4-2o.ts), [component implementation](../../shared/casimir-dp-public-data-component-validation-stage4-2o.ts), [report](casimir-dp-public-data-component-validation-stage4-2o-report.md) | Separate fringe, boundary-response and covariance replay examples | Report records 95 sodium scans, 108 paired drum traces, and 421912 LISA Pathfinder rows; Gran Sasso component is also separate. This audit inspected code and report, but did not reacquire/replay raw public datasets. Compact-fixture checks do not independently authenticate every original measurement. Never fuse their covariances into the proposed apparatus. |
| [NHM2 source-to-experiment packet](nhm2-source-to-experiment-closure-parallel-work-packet-v1.md) | Source/state lineage, complete stress-energy accounting, source-to-observable validation ladder | Planning/contract lane. Boson-star machinery can eventually validate methods; it cannot supply a Casimir source, matter coupling, or LZ interpretation. Selected-member evaluations remain governed by the sole active NHM2 gate. No boson-star numerical solve was rerun in this audit. |

## Ranked next contributions

1. **Detector discrimination benchmark.** Compare one fully specified scattering benchmark, frozen DP comparator, and ordinary-noise controls. Predict absolute complex coherence and the four-cell cross-ratio separately. Rank separation, orientation, hold-time and boundary controls by the signal remaining after nuisance projection, rather than by raw signal amplitude. Preserve the canonical apparatus as baseline; alternative designs must be separately versioned forecasts.
2. **Xenon companion-channel prediction.** For a specified interaction, compute ground-state recoils and nuclear-excitation companions with consistent proton/neutron couplings. Fold with a documented detector response when available. This is directly useful for follow-up to the LZ high-energy event, but requires transition-response inputs and detector/background information. It is not an official LZ fit.
3. **Bosonic-field to interferometer response.** Start with a separately declared weak-field source benchmark and transfer potential/gradient/time dependence to phase and noise observables. Determine whether the signal is a coherent phase, stochastic dephasing, or scattering. Only connect to xenon after specifying the same field's ordinary-matter coupling and physical population. This is a longer-term path, not a deduction from boson-star numerical success.

Ranking reflects reusable implementation and missing-input burden, not probability that a hypothesis is true.

## Concrete first deliverable

A versioned research benchmark with:

- One immutable model record: interaction, masses, couplings, state populations, density, velocity distribution, units, approximations, validity domain and source hashes.
- Separate target responses sharing that record: xenon differential recoil rate and, where justified, sphere momentum-transfer response. Never share a xenon nuclear form factor with the whole sphere.
- Local predictions for phase, visibility, momentum diffusion, heating, mean force, gradient and loss/recombination survival. State which quantities are actual predictions, upper bounds, or unavailable.
- Instrument layer exposing energy acceptance/resolution for xenon and paths/readout/covariance for the interferometer. Missing calibration yields conditional forecasts, not fitted sensitivity.
- A comparison table showing absolute-coherence sensitivity, boundary-estimator sensitivity, nuisance degeneracy, required precision/exposure, external-constraint status and approximation failures.
- Frozen injection/recovery cases: zero coupling; deliberately degenerate nuisance; boundary-independent cancellation; distinguishable injected signal; finite-size suppression; insufficient statistics. Test false-positive and coverage behavior under the declared generative model before presenting confidence regions.
- Standalone source/data manifest and scripts that write to a new run directory. No mutation of dated evidence during replay.

For stationary independent scattering, a useful organizing quantity is the momentum-kick rate measure dGamma(q): coherence contraction weights it by 1-cos(q dot delta_x/hbar), mean force by q, and momentum covariance growth by q_i q_j. This is a restricted scattering model, not a universal treatment of coherent fields or collapse. Retain target-specific response and survival conventions when mapping to detector outputs. A coherent forward phase needs its own consistent amplitude treatment.

The first milestone is successful benchmark reproduction and identification of which controls break degeneracies. A second milestone is calibration to one suitable public dataset, within that dataset's observable and apparatus. A third requires actual same-apparatus calibration for sensitivity claims. None requires a positive dark-matter claim.

## Literature connection

- [LZ extended recoil search](https://arxiv.org/html/2609.02823v1): experimental motivation and target-specific response requirements; no confirmed shared cause.
- [Riedel, direct detection through quantum decoherence](https://arxiv.org/abs/1212.3061), and [Riedel and Yavin, soft collisions](https://arxiv.org/abs/1609.04145): existing rationale for complementary interferometric sensitivity. Reproducing a published limit would be a better first external benchmark than introducing another freely adjusted mechanism.
- [Xenon excitation companion study](https://arxiv.org/abs/2609.05291): nuclear excitation adds an electromagnetic component to a recoil. Its representative ratios and simplified detector/background analysis cannot be transferred to a different interaction without recomputation.

## Audit verification and limits

Read canonical work-program/parallel-lane documents, Stage-4.2R readiness report, selected implementation functions, research scripts, reports and test cases. This was a targeted audit of the paths most relevant to the user's question, not an exhaustive mathematical review of the repository.

Executed:

```text
npx vitest run tests/casimir-dp-apparatus-identifiability-stage4-2b.spec.ts tests/casimir-dp-material-thermal-ordinary-null-stage4-2n.spec.ts tests/casimir-dp-proper-time-worldline-closure-stage4-2p.spec.ts tests/casimir-dp-retarded-source-propagation-stage4-2s.spec.ts --pool=forks
```

Result: 4 files, 24 tests passed. Coverage includes nuisance collinearity/projection, insufficient power, proper-time limits and tilt, thermal single-counting, radiation/conservation limits, and missing-evidence rejection. These tests establish bounded software behavior only. No new full-Maxwell solve, raw public-data replay, scattering parameter scan, official LZ likelihood, boson-star execution, or physical verification certificate was produced.

The existing Stage-4.2R report still has 0/8 empirical packets ready and a forecast-only magnitude uncertainty requirement of 0.005816050749546031. The useful immediate product is transparent conditional prediction and experiment design, with missing inputs visible.
