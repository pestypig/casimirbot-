# Casimir-DP Stage-4.2C identifiability-first redesign and empirical-input-readiness plan

Status: implemented, integrated, and downstream software-verified synthetic campaign; physical pilot readiness remains not ready.

Authoritative campaign:
`casimir-dp-identifiability-redesign-stage4-2c-v1-20260728T042510781Z`.

Evidence cutoff: 2026-07-28.

Evidence class: `synthetic_fixture`.

Claim ceiling:
`bounded_synthetic_apparatus_redesign_and_empirical_input_readiness_only`.

## 1. Purpose

Stage-4.2B showed that its frozen apparatus model was not identifiable:

\[
\max_{i\ne j}|\cos(\widetilde{\mathbf s}_i,
\widetilde{\mathbf s}_j)|
=0.9999771044199663,
\]

with the worst pair being the intercept and thermal signatures, and

\[
\kappa(G_{\rm normalized})=179103.91134865975.
\]

More acquisition from that unchanged design could not be represented as a
valid route to DP sensitivity. Stage-4.2C therefore asks a narrower question:

> Is there a bounded, preregistered apparatus design whose ordinary, DP, and
> control signatures are identifiable and whose named DP region is powered,
> without changing the registered DP generator or using confirmatory data?

The campaign may answer that design question. It may not answer whether DP
collapse occurs, whether a Casimir boundary modifies collapse, or whether
spacetime manifolds undergo the proposed dynamics.

## 2. Immutable Stage-4.2B authority

The following Stage-4.2B tuple is immutable upstream:

- config:
  `2abf8808fe73f6099d3e9e93e1bed2c8ca33d1094b6a93e9ad926f5fd900fa3e`;
- authority manifest:
  `dd3e423c02fdb16481c91c7ff3ee8583aa740efc71e5a04902ce32cf10754d35`;
- fixture:
  `ca89c5385bd55290b1cda8084b3d067cbd76420c810164fc958f310de11d1b8c`;
- immutable JSON report:
  `2ebd9971bacc393842dc71bfd80063d7b244231947074bc70b3be25bd7ad5b67`;
- immutable Markdown report:
  `e29564c6cedcace388233f6006b98683fab54f9326b96ab9bbaf3334f33adcbe`;
- campaign trace:
  `727d78249462f0b4171532af37db97be5500a3a7a870cc56b2e533cae0ae0df7`;
- campaign receipt:
  `50632b32c4133fe3f0f5eee3cbbb157a983d0a9da69de6239d58563ca88f569c`;
- downstream verification receipt:
  `194a58bcfa4cc855c8a50a8a862fac391a01ee55c4dc9feeb1d6e98526b8bf3d`.

Stage-4.2C must recover the Stage-4.2B no-go before it admits any redesign
result. It may not replace the old report with a mutable alias or reinterpret
its no-go as a DP exclusion.

## 3. Hypotheses remain separate

### 3.1 Ordinary-physics null

\[
H_0 =
H_{\rm thermal}
+H_{\rm EM}
+H_{\rm vibration}
+H_{\rm gas}
+H_{\rm readout}.
\]

Sensor self-noise belongs to the measurement covariance and dark-channel
ledger. It is not a physical decoherence term.

### 3.2 Registered mass-density DP forecast

\[
\Delta\rho(\mathbf r)=\rho_A(\mathbf r)-\rho_B(\mathbf r),
\]

\[
E_G =
\frac{G}{2}
\int d^3r\,d^3r'
\frac{\Delta\rho(\mathbf r)\Delta\rho(\mathbf r')}
{|\mathbf r-\mathbf r'|},
\qquad
\Gamma_{\rm DP}=\frac{E_G}{\hbar}.
\]

The Stage-3 Gaussian-regularized nondissipative parameter manifest remains
frozen at
`4868b598b05e76f43f9814858f81c27cf8d8a783d360deb56e26793aad7047c6`.
Every candidate is recalculated through that generator and its independent
Fourier cross-check. No fitted DP amplitude is admitted.

### 3.3 Boundary-conditioned bridge

A boundary-conditioned Casimir-to-collapse term remains a separately
registered hypothesis. No transfer kernel exists in this campaign, so the
bridge is not scored and contributes zero observable bridge edges.

Compton frequency, Higgs/Yukawa mass mapping, QED scale relations, and
blackbody recovery are dimensional or calibration authorities only. Shared
energy or frequency units do not create a collapse-transfer kernel.

## 4. Common observable and covariance

All candidate and control signatures occupy the same complex log-coherence
space:

\[
\mathcal C_k=V_k e^{i\phi_k},
\qquad
\mathbf y_k =
\begin{bmatrix}
\operatorname{Re}\log\mathcal C_k\\
\operatorname{Im}\log\mathcal C_k
\end{bmatrix}.
\]

For covariance \(C\), the response signature for parameter \(\theta_j\) is

\[
\widetilde{\mathbf s}_j =
L^{-1}\frac{\partial\boldsymbol\mu}{\partial\theta_j},
\qquad
LL^{\mathsf T}=C.
\]

The Stage-4.2C response compiler adds 60 real components from 30 complex
controls to the 432 frozen Stage-4.2B components. The resulting 492-component
space contains intercept, thermal, electromagnetic, vibration, gas, readout,
and registered DP signatures.

The control covariance includes:

- per-control real/imaginary covariance;
- axis-shared calibration covariance;
- sensor self-noise variance;
- explicit Cholesky whitening;
- a raw-to-whitened-to-raw numerical recovery gate.

The response and covariance values are numerical design assumptions, not
measured apparatus evidence.

## 5. Frozen numerical controls

The existing 30 control identities are retained:

- paired low/high temperature controls;
- paired low/high pressure controls;
- paired low/high vibration controls;
- paired low/high charge controls;
- paired near/far distance controls;
- paired TE/TM polarization controls;
- paired low/high readout-power controls;
- one sham-switch control;
- one detuned-boundary control.

Each control has a physical axis value, unit, primary signature lane, response
quadrature, uncertainty, shared-calibration fraction, and provenance hash.
Response vectors are calculated from those values. Manually substituted
orthogonal vectors are forbidden.

## 6. Bounded candidate catalogue

The search is exhaustive over the frozen catalogue, not a data-dependent
continuous optimizer. Candidate admission requires:

- mass scale no greater than 60;
- branch-separation scale no greater than 5;
- hold-time scale no greater than 4;
- admitted material-response authority;
- membership in the bounded design-assumption domain.

The catalogue contains:

| Candidate | Mass scale | Separation scale | Hold scale | Authority/admission |
| --- | ---: | ---: | ---: | --- |
| `silica_control_only` | 1 | 1 | 1 | admitted |
| `silica_moderate` | 10 | 2 | 2 | admitted |
| `silica_high_mass_identifiable` | 50 | 4 | 2.5 | admitted |
| `silica_very_high_mass_out_of_bounds` | 80 | 5 | 4 | rejected by mass bound |
| `diamond_contextual_only` | 30.2545 | 3 | 3 | rejected; material response contextual only |

The selection objective is lexicographically frozen:

1. pass all hard gates;
2. minimize required paired windows;
3. minimize mass scale;
4. break any remaining tie by candidate id.

Confirmatory data are unavailable and may not affect this ordering.

## 7. Preregistered numerical gates

A candidate is selection-eligible only when:

\[
\max |\cos\theta_{ij}| < 0.97,
\]

\[
\kappa(G_{\rm normalized})\le 100,
\]

\[
\operatorname{power}\ge0.80,
\qquad
\alpha\le0.05,
\qquad
\mathrm{SNR}_{\rm companion}\ge5.
\]

It must also pass covariance, registered-DP cross-check, control-response
round-trip, design-bound, material-authority, replication, and no-retuning
gates.

## 8. Runtime package

### Runtime H: numerical control response and covariance

Runtime H compiles the 30 complex control rows, full block covariance,
shared-calibration ancestry, sensor-noise covariance contribution, Cholesky
whitening, and response/covariance receipts.

### Runtime I: bounded apparatus admission and DP transport

Runtime I checks candidate bounds and material authority. It transports every
Stage-4.2B DP cell through the frozen registered generator at the candidate
mass and separation, applies the candidate hold time, and records the analytic
and Fourier-cross-check receipt.

### Runtime J: augmented identifiability and power

Runtime J appends the whitened control components, profiles the ordinary
signatures, calculates rank, pairwise cosines, normalized Gram conditioning,
profiled DP Fisher information, required acquisition, power, and the bounded
parameter-region verdict.

### Runtime K: adversarial fixtures

Runtime K executes the 16 preregistered recovery and fail-closed cases,
including severe cross-axis leakage, underpowered designs, out-of-bounds
power, missing material authority, confirmatory leakage, DP retuning, an
unregistered bridge, and cross-scale non-bridge misuse.

### Runtime L: acquisition packet compiler

Runtime L generates calibration, pilot, confirmatory, and independent
replication packet schemas. Response and covariance fitting are allowed only
in calibration/pilot partitions. Confirmatory and replication packets are
blinded, frozen, and non-refittable.

### Runtime M: orchestrator

Runtime M verifies all authority hashes, recovers the Stage-4.2B no-go,
executes H-L in order, selects the bounded candidate, writes the scientific
standing and blockers, and emits content-addressed report, trace, and receipt
artifacts.

## 9. Synthetic result

The authoritative run returns:

- campaign gate: `pass`;
- fixtures: 16/16 matched;
- search verdict: `bounded_powered_region_available`;
- selected candidate: `silica_high_mass_identifiable`;
- maximum absolute whitened cosine: `0.7177243227022941`;
- normalized Gram condition: `6.531693613125537`;
- forecast power: `0.9978580863455258`;
- required paired windows: `542`;
- physical pilot readiness: `not_ready`.

The DP signature norm for the selected candidate is
`96272.57779360379` times the Stage-4.2B nominal forecast. This ratio is
produced by registered mass, separation, and hold-time transport; it is not a
fitted amplitude. The candidate remains a design assumption because no
authentic receipt demonstrates preparation of the proposed superposition.

The more powerful mass-scale-80 candidate is intentionally rejected because
it lies outside the frozen search bound. This demonstrates that numerical
power cannot override the preregistered design domain.

## 10. Acquisition order

1. Calibration: estimate numerical response and sensor/covariance authority.
2. Pilot: test ordinary closure, state preparation, and candidate feasibility.
3. Freeze: bind code, exclusions, covariance, response vectors, DP manifest,
   cells, and scoring.
4. Confirmatory: collect blinded held-out observations without refitting.
5. Authorized unblinding: only after all preregistered data-quality gates.
6. Independent replication: repeat the frozen prediction and scoring.

The synthetic packet compiler supplies templates only. It does not create
measurements.

## 11. Outcome-to-claim map

| Outcome | Establishes | Does not establish |
| --- | --- | --- |
| No candidate passes | bounded redesign no-go | DP exclusion |
| Identifiable but underpowered | nuisance separation | DP sensitivity |
| Bounded powered synthetic region | conditional design and acquisition budget | state preparation or physical pilot readiness |
| Measured null in a powered region | eligible registered-region constraint | all DP models false |
| Replicated residual following frozen DP scaling | compatibility with the registered DP model after ordinary closure | manifold dynamics or a Casimir bridge |
| Boundary-correlated residual without DP scaling | boundary anomaly/systematic candidate | collapse |
| Residual following a separately preregistered bridge kernel | evidence for that kernel after replication | automatic proof of quantum foam |

## 12. Repository artifacts

New implementation surfaces:

- `shared/contracts/casimir-dp-identifiability-redesign-stage4-2c.v1.ts`;
- `shared/casimir-dp-control-response-stage4-2c.ts`;
- `shared/casimir-dp-apparatus-redesign-stage4-2c.ts`;
- `shared/casimir-dp-acquisition-packets-stage4-2c.ts`;
- `scripts/research/run-casimir-dp-identifiability-redesign-stage4-2c.ts`;
- `configs/research/casimir-dp-identifiability-redesign-stage4-2c.v1.json`;
- `configs/research/casimir-dp-stage4-2c-authorities.v1.json`;
- `configs/research/fixtures/casimir-dp-stage4-2c-campaign.synthetic.v1.json`.

Authoritative artifact hashes:

- JSON report:
  `d9237eeb9079e7fab84a86b3eda28b0f14bb83be1a340b3d6f9695dcffb5047c`;
- Markdown report:
  `0f01cb550fed502fe8d5fa3920f4517d7931a89761cdb7a68af1b7d901b55f5f`;
- trace:
  `3ceeaddbdb0e8a78f1038bd3227f8b0ddbac4ac0af24ca7c37a6b026e5fe2b81`;
- campaign receipt:
  `59cca7ab7f6f6a3d27a83ad8b455fc63fc6db3ca7207cdeff350ed97d497865c`.
- validated one-record adapter trace:
  `3d454ba0cf3e778dc934cae1c0ee33996bb792caa06255a9dfe984a38138bdee`;
- downstream verification receipt:
  `51c461db1fdaa29162b2c5287a31c01823e5bb23b16a25fe2914841239abba98`.

## 13. Publication integration gate

Only after the runtime, strict contract, fixtures, report, receipt, and focused
tests exist may the campaign add:

- a non-promotable Stage-4.2C Theory Badge;
- white-paper and experiment-proposal sections;
- equation-action sidecars;
- math-stage entries;
- root-to-leaf paths and audit rows.

The badge claim ceiling must remain the same as the runtime claim ceiling and
must add zero observable bridge edges.

## 14. Goal completion criteria

Stage-4.2C is complete only when:

- the immutable Stage-4.2B authority tuple remains unchanged;
- Runtimes H-M and their strict contracts exist;
- all 16 recovery and fail-closed fixtures pass;
- control responses and block covariance share one complex-coherence space;
- sensor self-noise remains separate from physical decoherence;
- every candidate is transported through the frozen DP generator;
- the result returns a bounded powered region or an explicit redesign no-go;
- blinded acquisition packets and freeze/custody rules exist;
- Theory Badge, paper, sidecar, math, and root-to-leaf integrations pass;
- focused, inherited, and WARP regressions pass;
- the production build passes; and
- a fresh Casimir verifier returns `PASS` with a validated trace, certificate
  hash, and integrity `OK`.

The completion replay passes 503/503 tests across 54 receipt-grade files and
116 suites, including all 18 required WARP files (179/179). Four historical
campaign orchestrators intentionally fail closed when replayed on the newer
committed Git head because their immutable configs freeze the prior head and
pre-commit tracking state. They are not rewritten or counted as passing
evidence; their existing content-addressed receipts remain immutable upstream
authority. Adapter run `2332` is `PASS`, first failure null, deltas empty,
certificate integrity `OK`, and certificate hash
`38b2e69264ac9e846676fced5d7318a0ab6e35affcb572246bcae7bf6606fa34`.

For synthetic execution, `physical_pilot_readiness`, `measured_evidence`,
`collapse_identification`, `manifold_dynamics`, and `physical_viability` must
remain open.
