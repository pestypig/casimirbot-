Program gate: S1 — independent constraints on shared messenger inputs.
Workstream: Weak-current consequences of up-singlet mixing.
Capability or component: CKM first-row and Z-current predictions.
Current maturity: Tree aligned-flavor prediction and dated Gaussian data screen.
Target maturity: Independent constraint route on a coupling not fixed by scattering alone.
Required frozen inputs: Existing MU, yL, yR, Higgs vacuum and dark-sector reference.
Required evidence: Full current projection, authenticated mixing and independently extracted CKM summary.
Stop/fail criteria: Do not impose three-generation unitarity on the input data used to test its violation; do not call a Gaussian screen a global exclusion.
Explicit non-goals: Retuned reference, new CKM fit, full flavor completion or scattering-rate update.
Downstream gate unlocked: Correlated weak-current/portal scan can enter the model's constraint ledger.

# A weak-interaction test of the same messenger parameters

The exact Higgs-background calculation yields a definite left-handed up/heavy-quark mixing. That mixing has observable weak-current consequences independent of the xenon target response or the local coherence readout. This is a more direct additional constraint route than continuing to refine only the small scalar loop contribution.

The calculation below assumes that the messenger coupling is aligned with the light up-quark mass direction, that the ordinary underlying three-generation matrix V0 is unitary, and that no other new quark or lepton interactions modify the extraction. The first-generation weak-basis label alone does not prove this alignment. A complete flavor embedding and radiatively generated misalignment remain to be checked.

## Projection of the weak current

For b=yL v/sqrt(2), define sL=b/sqrt(MU^2+b^2), cL=MU/sqrt(MU^2+b^2). The charged-current matrix, including the heavy up-type row, is

```
V4x3 = [ cL V0_u ]
        [    V0_c ]
        [    V0_t ]
        [ sL V0_u ].
```

Its columns remain orthonormal. The light first-row sum becomes cL^2, so its deficit is D=1-sum_j |Vuj|^2=sL^2. All three elements of that row are suppressed, not only Vud. Muon decay has no tree-level change from this quark mixing, so a semileptonic normalization to the muon-decay Fermi constant retains the effect.

At MU=2000 GeV and yL=0.20, sL=0.01740633147, D=0.0003029803751 and the charged-current amplitude multiplier is cL=0.9998484983. The second and third row norms remain one in this aligned limit. This does not assert that all meson-mixing loops are unchanged.

The same projection changes the up-quark Z coupling. In the convention L_Z=(g/cW) Z_mu [uLbar gamma^mu (T3-Q sW^2) uL + uRbar gamma^mu (-Q sW^2) uR], delta gL_u=-sL^2/2=-0.0001514901875, while delta gR_u=0 at this tree order. Neutral-current precision measurements therefore supply another correlated test; they have not yet been fitted here.

## Dated CKM data comparison

The [PDG 2025 CKM review](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-ckm-matrix.pdf), section 12.3, page 12, quotes an independently determined first-row sum of 0.9984 +/- 0.0007. The chapter states revision April 2024 and carries the 2025 update imprint; this is a specified data snapshot, not a claim to have assembled every September 2026 measurement. Its unitarity-constrained global-fit entries are not used for this test.

Treating that quoted summary as a single Gaussian datum gives (0.9996970196-0.9984)/0.0007=1.8529 for the frozen reference. Its location inside a 1.96-sigma interval neither validates the messenger nor excludes it. No likelihood correlations, additional new-physics corrections or theory-nuisance refit have been supplied.

The [dedicated PDG review revised August 2025](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-vud-vus.pdf) discusses nuclear-structure and radiative-correction uncertainties in Vud extraction. Those limitations matter for interpreting a small deficit as new physics. The [March 2026 VLQ-singlet study](https://arxiv.org/html/2603.20047v1) also treats nonunitarity together with flavor observables. Its more general multi-singlet fits cannot be transferred to our one-singlet aligned benchmark.

## Separating the messenger couplings

At yu=0, exact tree fermion diagonalization gives the magnitude of the light pseudoscalar coupling |gu|=|yR sL|. Our fixed messenger inputs give |gu|=5.57002607e-5. This is distinguished from both the leading b/MU expression and the paper's rounded 5.6e-5. No archived scattering normalization is silently changed to the exact value here.

Weak mixing probes yL/MU, while the pseudoscalar interaction probes yR sL. Thus varying yL and compensating yR can preserve this one low-energy coupling but cannot preserve every prediction of the UV model:

| yL | yR preserving exact reference gu | First-row deficit | Gaussian pull to dated row sum | Leading yR^2 mass-term scaling |
|---:|---:|---:|---:|---:|
| 0.10 | 0.00639927 | 0.0000757623 | 2.177 | 3.999 |
| 0.20 | 0.00320000 | 0.000302980 | 1.853 | 1.000 |
| 0.40 | 0.00160073 | 0.00121082 | 0.556 | 0.2502 |
| 0.60 | 0.00106796 | 0.00272023 | -1.600 | 0.1114 |

The last column is only the scaling of the earlier leading yR^2 messenger mass contribution at fixed MU; it is not a physical mass change or naturalness probability. Other scalar thresholds, weak currents and full matching also change along this diagnostic family. The yL=0.20 row remains the reference; no preferred point is selected by this comparison.

For reproducibility, the Gaussian 1.96-sigma interval for the deficit is [0.000228,0.002972]. Inverting the tree relation gives yL in [0.17349,0.62723] at MU=2 TeV. This is a coordinate image of a quoted Gaussian interval under the stated assumptions, not a published VLQ confidence limit or evidence for a nonzero coupling. A proper inference needs the source measurements, covariance, nuisance treatment and the model-dependent corrections to extraction.

## Next evidence and verification

The next independent constraint to pursue is the correlated neutral-current shift, alongside the flavor-alignment assumption. A combined analysis must not use a unitarity-enforced CKM fit as an independent measurement, count the same beta-decay data twice, or regard closer agreement with a deficit as proof of a common dark-matter mechanism.

The [script](casimir-dp-axion-weak-mixing-screen-2026-09-07.py) authenticates the previous exact-mixing output. The [JSON](casimir-dp-axion-weak-mixing-screen-2026-09-07.json) passes five checks: orthonormal columns of the full rectangular current, the projected row norm, fixed exact gu along the diagnostic family, recovery of the archived mixing and inversion of the deficit relation. The arbitrary unitary matrix in the identity test is not a fitted CKM matrix. The goal remains active; existing two-target forecasts are unchanged.
