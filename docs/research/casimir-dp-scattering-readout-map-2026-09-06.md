# Shared-scattering predictions in the canonical readout

September 6, 2026. Exploratory S1 mapping. This packet changes no frozen configuration or canonical estimator. It makes the distinction between an absolute scattering contribution and a boundary-dependent residual explicit for current models.

## Two observables, two predictions

The canonical article at `casimir-dp-quantum-foam-study.md`, equations 14–15, and the frozen Stage-4.2R configuration define separate primary and boundary estimands. The primary experiment tests complex coherence contraction across registered mass, separation and time cells. The boundary experiment tests the normalized four-cell cross-ratio

`R4 = Cbar_11 Cbar_00 / (Cbar_01 Cbar_10)`,

where the first index is active/reference boundary and the second is separated/sham branch history. Its ordinary-physics correction is R4_obs/R4_0. The measured baseline need not factorize, and is not replaced here by unity.

Suppose a proposed independent scattering contribution multiplies each ordinary coherence by `S_beta,q = exp[-D_beta,q + i phi_beta,q]`. This multiplicative decomposition itself requires a justified independent-generator approximation; it is not automatic for coupled apparatus noise.

Its additional contrast is

`I4_chi = D_11 + D_00 - D_01 - D_10`,

`Phi4_chi = wrap(phi_11 + phi_00 - phi_01 - phi_10)`.

If each branch history has the same scattering response under both boundary settings, D_1q=D_0q and phi_1q=phi_0q. Thus **R4_chi=1 exactly**, for any coupling and any absolute D. A nonzero sham response also cancels when matched; assuming an exactly zero sham is unnecessary. Both normalized phase and magnitude cancel.

| Current interaction prescription | Absolute coherence prediction | Extra four-cell contribution under matched boundary-independent response |
|---|---|---|
| Homogeneous contact L10 scattering | Prior carbon response diagnostic/bound | I4_chi=0, Phi4_chi=0 |
| Homogeneous photon density or spin component | Prior finite-grid component count ceilings | I4_chi=0, Phi4_chi=0 |
| Isolated-sphere Yukawa phase profile | Prior resummed absolute-coherence calculation | I4_chi=0, Phi4_chi=0 if the same profile applies in both cells |
| Standard frozen DP prescription | Theoretical D=0.0295115 at the leading point | Cancels under the canonical matching conditions |

The isolated-sphere Yukawa calculation does not prove that a real boundary leaves its profile unchanged. The table states the prediction of the model actually calculated, not a claim that all microscopic extensions obey that condition. Similarly, the photon material calculations contain no active/reference electromagnetic Green-function difference and therefore supply no computed nonzero boundary effect.

## A concrete nuisance discriminator

For constant separated and sham rates, let the active and reference durations differ by delta_t. Then a boundary-independent process produces apparent contrast

`I4_leak = delta_t (Gamma_separated - Gamma_sham)`.

This can mimic a boundary effect despite having no microscopic boundary coupling. In the ideal identical-branch sham limit Gamma_sham=0, a 1% hold-time mismatch produces 1% of the separated exponent. The 1% is an illustrative metrology perturbation, not an authorized tolerance or a measured mismatch.

Using the central 1 TeV, nominal-efficiency-floor count-only ceilings from `casimir-dp-photon-lz-count-screen-2026-09-06.json`:

| Component | Reference D ceiling | Illustrative 1% timing-leak ceiling |
|---|---|---|
| Finite-grid density | 3.0557e-28 | 3.0557e-30 |
| Finite-grid independent spin bubble | 2.0906e-25 | 2.0906e-27 |
| Frozen DP comparator, if that model holds | 0.0295115 | 2.9511e-4 |

The last row is a model-dependent nuisance forecast, not measured evidence for DP. Nonconstant branch trajectories require integrating Gamma[d(t)] with the actual active/reference histories. A single duration mismatch cannot stand in for all path, material, orientation or temperature mismatches.

## What a nonzero bridge must specify

In a simple illustrative enhancement model with a zero sham and matched holds, write Gamma_active=(1+epsilon)Gamma_reference. Then I4_chi=epsilon D_reference. Matching a contrast as large as the DP comparator using the calculated reference components would require epsilon at least 9.66e25 for density or 1.41e23 for the spin bubble at the above normalization ceilings. These ratios are necessary algebraic scales for that toy parameterization, not physical enhancement predictions. They cannot be extrapolated through weak-scattering breakdown or assigned to omitted channels.

A substantive boundary-dependent lead must instead supply:

1. A microscopic change in incident distribution, propagator, or target response between boundary settings, using the same particle parameters as xenon.
2. Four branch-conditioned kernels, including the measured compact/sham histories, from which both magnitude and phase can be computed.
3. A separation of the predicted contrast from ordinary boundary noise and from measured trajectory, hold-time and material changes; the canonical covariance and holdout requirements remain intact.

For an electromagnetic proposal this means the actual finite-boundary response, including frequency and in-plane momentum dependence. Substituting the Casimir force magnitude, or treating total three-momentum as the in-plane momentum in a planar evanescence formula, does not establish the needed kernel. For a screened scalar it means solving the active/reference background and perturbations with declared material boundary conditions. Merely naming screening does not predict I4.

## Consequence for the work program

The current scattering components provide conditional predictions for the primary absolute-coherence channel and a **null additional boundary contrast** under their modeled matching assumptions. This is a useful falsifiable result: a replicated corrected four-cell anomaly would require extending or rejecting those assumptions, rather than fitting the existing homogeneous rate more strongly. Conversely, R4_corr=1 would not eliminate an absolute scattering or DP contribution.

The next lead should be evaluated first for whether it supplies the missing boundary-dependent kernel or a complete small-signal primary model. The existing empirical readiness gaps still prevent an experimental validation claim. The source configuration and prior normalization packet were inspected directly; the displayed arithmetic was recomputed from their current values. No synthetic experiment, measured covariance or hardware tolerance was invented. S1 and the overall research goal remain active.
