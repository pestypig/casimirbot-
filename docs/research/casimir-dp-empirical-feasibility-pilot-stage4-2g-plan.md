# Casimir-DP Stage-4.2G empirical-feasibility pilot plan

## Purpose

Stage 4.2G is the handoff from theory closure to laboratory evidence. It does
not simulate a successful experiment. It freezes one apparatus design,
regenerates the registered Diósi-Penrose (DP) coherence and companion
predictions from that same mass-density identity, and defines the
provenance-bound packet that a real pilot must fill.

The campaign consumes the certified Stage-4.2F run
`casimir-dp-maxwell-macroscopic-qed-closure-stage4-2f-v1-20260730T023000000Z`
as immutable upstream evidence. Its certificate is not reused as a
Stage-4.2G certificate.

## Frozen apparatus design identity

The selected Stage-4.2C design is frozen as one physical object rather than
the strongest cell in a transported multi-mass grid:

| Quantity | Frozen value |
|---|---:|
| Material and geometry | silica sphere |
| Radius | \(2.76302362398029\times10^{-7}\ {\rm m}\) |
| Mass | \(1.94385\times10^{-16}\ {\rm kg}\) |
| Branch separation | \(1.6\times10^{-7}\ {\rm m}\) |
| Hold time | \(0.25\ {\rm s}\) |
| Sequence | Ramsey |
| Cavity gap | \(1.2\times10^{-6}\ {\rm m}\) |
| Boundary modulation | \(0.5\ {\rm Hz}\) |
| Environment | \(4\ {\rm K}\), \(2\times10^{-11}\ {\rm Pa}\) |
| Vibration target | \(5\times10^{-10}\ {\rm m\,s^{-2}/\sqrt{Hz}}\) |
| Readout | \(5\times10^{-9}\ {\rm W}\) at \(1.55\,\mu{\rm m}\) |
| Polarization program | circular control pair |

This is a design freeze. The `apparatus_mass_geometry`,
`state_preparation`, and `branch_hold_metrology` packet products must still
verify that the built system realizes it.

## Frozen DP and companion calculation

The registered model is
`diosi_1989_gaussian_regularized_nondissipative`, evaluated at the
non-promotable sensitivity point \(r_0=100\ {\rm nm}\). The same parameter
manifest supplies the coherence and momentum-diffusion/heating companion:

<!-- equation-action: cdp-stage4-2g-single-identity-dp -->
\[
\Gamma_{\rm DP}
 =\frac{E_G[\rho_1-\rho_2;r_0]}{\hbar},
\qquad
\mathcal V(t)=\mathcal V_0e^{-\Gamma_{\rm DP}t},
\qquad
\dot E_{\rm DP}=\frac{3D_{pp}}{2m}.
\]

For the frozen object and branch geometry, the authoritative runtime gives

\[
\Gamma_{\rm DP}=2.400420398374263\times10^{-2}\ {\rm s^{-1}},
\quad
\mathcal V(0.25{\rm s})=0.9940169192982985,
\quad
\dot E_{\rm DP}=1.9297884642410306\times10^{-40}\ {\rm W}.
\]

For 100 independent companion samples and the frozen SNR gate of 5, the
one-shot standard uncertainty must satisfy

<!-- equation-action: cdp-stage4-2g-companion-threshold -->
\[
\sigma_{\dot E,1}
\leq \frac{\dot E_{\rm DP}\sqrt{N}}{\mathrm{SNR}_{\min}}
=3.859576928482061\times10^{-40}\ {\rm W}.
\]

This is a detector requirement, not measured sensitivity. A cavity or Maxwell
frequency does not enter the registered DP generator.

## Required acquisition packet

The strict packet contains thirteen ordered products:

1. `apparatus_mass_geometry`;
2. `material_response`;
3. `finite_geometry_maxwell_green`;
4. `state_preparation`;
5. `branch_hold_metrology`;
6. `boundary_modulation_transfer`;
7. `environment_backgrounds`;
8. `complex_coherence_response`;
9. `block_covariance`;
10. `companion_detector`;
11. `blind_custody_freeze`;
12. `independent_solver_replication`;
13. `complete_apparatus_stress_energy`.

Every measured product must bind a repository-relative artifact, SHA-256,
timestamp, operator, instrument identity, custody ancestry, calibration, and
uncertainty model. Synthetic and unacquired references cannot be relabeled as
measured. Absolute and out-of-repository artifact paths fail closed.

Products 1--12 determine the narrow empirical-pilot go/no-go. Product 13 is a
separate prerequisite for a manifold or metric-response interpretation; it is
not required to test the registered nonrelativistic DP coherence law.

## Pilot ingestion and gate recomputation

When the response and covariance packet is present, the runtime sends the
packet's frozen complex-coherence signatures into the same Stage-4.2B
identifiability evaluator. It recomputes:

<!-- equation-action: cdp-stage4-2g-whitened-pilot-gates -->
\[
\max_{i\ne j}\left|
\frac{(L^{-1}s_i)^\mathsf T(L^{-1}s_j)}
{\|L^{-1}s_i\|\,\|L^{-1}s_j\|}
\right|\le0.97,
\quad
\kappa(\widetilde S^\mathsf T\widetilde S)\le100,
\quad
\mathrm{power}\ge0.80,
\quad
\mathrm{FPR}\le0.05,
\quad
\mathrm{SNR}_{\rm companion}\ge5,
\]

where \(LL^\mathsf T=C\) is the pilot-frozen full covariance and every
response vector is evaluated in the same whitened complex-coherence space.
Confirmatory data cannot refit the covariance, exclusions, DP model, cell
order, or nuisance signatures.

## Hypothesis separation

- **H0:** Maxwell/macroscopic-QED, material response, thermal, gas,
  electromagnetic/patch, vibration, readout, switching, and sensor noise.
- **H1:** the frozen regularized mass-density DP prediction.
- **H2:** a separately registered Casimir-to-collapse extension.

Stage 4.2G adds zero H0/H1/H2 observable bridge edges. H2 remains unavailable
without an explicit sourced transfer kernel and its own preregistration.

## Falsifiers and no-go conditions

- A mass, radius, branch separation, hold time, or sequence mismatch blocks
  the single-apparatus interpretation.
- Missing or hash-invalid material, solver, preparation, transfer, background,
  covariance, companion, custody, or replication products block pilot
  readiness.
- Signature cosine above 0.97, normalized Gram condition above 100, power
  below 0.80, false-positive rate above 0.05, or companion SNR below 5 returns
  an empirical redesign no-go.
- A synthetic packet can validate software only. It cannot satisfy any
  measured product.
- A pilot-ready packet does not identify collapse. Blinded confirmation and
  independent replication remain separate stages.
- A complete Maxwell stress alone is not a complete conserved apparatus
  stress tensor and cannot promote a manifold-dynamics claim.

## Running a laboratory packet

Start with
`configs/research/fixtures/casimir-dp-stage4-2g-pilot-unacquired.v1.json`.
Create a new, provenance-bound packet without modifying the immutable
template, then run:

```text
npm run casimir:dp:stage4-2g -- --packet <repo-relative-packet.json>
```

The canonical unacquired run must retain:

- `empirical_pilot_readiness: not_ready`;
- `measured_evidence: not_ready`;
- `collapse_identification: blocked`;
- `manifold_dynamics: blocked`; and
- `physical_viability: not_evaluated`.

Only a genuine, hash-valid empirical packet may produce the bounded status
`pilot_inputs_available_not_confirmatory_evidence`; even then, collapse and
manifold claims remain blocked.
