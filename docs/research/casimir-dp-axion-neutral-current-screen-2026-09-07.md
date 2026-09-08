Program gate: S1 — independent constraints on shared messenger inputs.
Workstream: Proton and atomic weak-charge screen.
Capability or component: Correlated parity-violating neutral currents.
Current maturity: Tree shift with separately identified data and theory snapshots.
Target maturity: Quantified sensitivity and reliable constraint prerequisites.
Required frozen inputs: Archived aligned up-singlet mixing family.
Required evidence: Current normalization, nuclear assembly and source-specific comparison.
Stop/fail criteria: Do not promote a theory-sensitive Gaussian residual to model exclusion or combine overlapping APV/PVES extractions.
Explicit non-goals: Global fit, independent validation of a new radiative correction, full electroweak matching or benchmark retuning.
Downstream gate unlocked: Neutral-current effects enter the independent constraint ledger.

# Neutral-current consequences of the shared messenger

The [weak-mixing packet](casimir-dp-axion-weak-mixing-screen-2026-09-07.md) predicts D=sin^2(thetaL)=0.0003029803751 at the reference point. The same aligned up-singlet mixing predicts a definite parity-violating electron-quark shift. This packet translates it into proton and cesium weak charges and examines the interpretation limits of available summaries.

## Normalization and common prediction

Use L_PV=(GF/sqrt(2)) sum_q C1q (ebar gamma_mu gamma5 e)(qbar gamma^mu q), with the usual Standard Model tree normalization C1u=-1/2+(4/3)sin^2(thetaW). Since delta gL_u=-D/2, delta gR_u=0 and the electron coupling is unchanged at this order,

`delta C1u = D/2`, `delta C1d = 0`.

The nuclear weak charge is QW(Z,N)=-2[(2Z+N)C1u+(Z+2N)C1d], hence

`delta QW(proton)=-2D`, `delta QW(neutron)=-D`, `delta QW(Z,N)=-(2Z+N)D`.

For cesium-133, Z=55 and N=78, giving delta QW(Cs)=-188D. The shift ratio Cs/proton is exactly 94 within this leading model. Both shifts are negative for positive D; their signs are not adjustable independently of the CKM deficit.

At the reference point the predicted shifts are -0.0006059607501 for the proton and -0.05696031051 for cesium. These are leading tree additions to consistently defined low-energy coefficients; electroweak running, oblique and vertex contributions, atomic/nuclear extraction and other new interactions have not been recomputed. The model alignment assumption is retained.

## Proton measurement

The [Qweak collaboration manuscript](https://arxiv.org/pdf/1905.08283), Table 1, reports QW(p)=0.0719 +/- 0.0045 for its PVES fit and gives its Standard Model reference as 0.0708 +/- 0.0003. The fit includes other PVES data but excludes APV; its separate PVES-plus-APV row must not be used and then combined again with cesium. The [published article](https://www.nature.com/articles/s41586-018-0096-0) reports the same proton result.

Adding the benchmark shift to that specified SM reference gives 0.07019404. Quadratically combining the two quoted uncertainties solely for a Gaussian diagnostic gives a pull of -0.378. The new shift itself is 0.135 times the measurement error. Thus this summary does not give a sensitive standalone rejection of the reference; it is not a full new-physics likelihood or a modern electroweak-input refit.

## Cesium: a theory-dependent interpretation

For a clearly identified atomic snapshot, [Flambaum and Samsonov, arXiv:2602.22466v1](https://arxiv.org/html/2602.22466v1), quote QW(exp)=-72.41 +/- 0.42 and an SM reference -73.26 +/- 0.01. They also propose an additional relative correction of -0.8% to the SM effective cesium charge from fermion-pair exchange. This is a theoretical interpretation of existing APV information, not a new measurement. We have not independently established whether that proposed correction is additional to all terms in the conventional matching/extraction.

Using their unshifted SM reference, our benchmark predicts -73.31696, with a simple Gaussian pull of -2.159. Most of this residual already exists without our messenger: the messenger shift alone is only 0.136 times the quoted measurement uncertainty. It would be misleading to call the total residual a two-sigma exclusion of this interaction.

As a sensitivity exercise only, the authors' -0.8% prescription shifts their negative SM charge upward by +0.58608. Adding the messenger shift then gives -72.73088. Reusing the original quoted error for this CENTRAL-VALUE-ONLY comparison gives a pull of -0.764. This is not an uncertainty-qualified alternative fit: the new correction's error, correlations and overlap with standard radiative terms have not been evaluated. Nor is the proton prediction above updated with the same paper's separate proton correction.

The [PDG electroweak review at the accessed URL](https://pdg.lbl.gov/2025/reviews/rpp2025-rev-standard-model.pdf) has an April 15, 2026 imprint despite its 2025 URL. Its cesium discussion quotes a weak-mixing-angle extraction under SM assumptions rather than a ready independent likelihood for this messenger. These source conventions must be reconciled before a combined precision constraint is claimed.

## Correlated diagnostic family

The archived four-point family preserves exact tree gu by adjusting yR with yL. It is not a newly fitted family. Its weak-charge shifts are:

| yL | delta QW(p) | delta QW(Cs) |
|---:|---:|---:|
| 0.10 | -0.000151525 | -0.0142433 |
| 0.20 | -0.000605961 | -0.0569603 |
| 0.40 | -0.00242164 | -0.227634 |
| 0.60 | -0.00544046 | -0.511403 |

Larger mixing that better approaches the selected CKM deficit also increases these negative neutral-current shifts. This is a concrete cross-check of shared parameters. The joint constraint requires consistent source-level likelihoods, not a product of all tabulated Gaussian summaries.

## Research decision and verification

Keep the frozen messenger reference for now. The proton screen does not reject it; the cesium interpretation is sensitive to the theory baseline. Before using the 2026 correction as evidence, audit its momentum regions and its overlap with the conventional electroweak Wilson coefficients, and check the current version and primary follow-up literature. A scoped search found the proposal but did not supply an independent validation; that is not proof that none exists. Flavor alignment and a complete electroweak matching calculation also remain open.

The [script](casimir-dp-axion-neutral-current-screen-2026-09-07.py) authenticates the archived family and produces an adjacent [JSON](casimir-dp-axion-neutral-current-screen-2026-09-07.json). Three checks pass: assembly from proton/neutron shifts, the fixed shift sign, and the ratio 94. These verify the tree mapping, not the experimental extraction or the proposed radiative correction. Existing xenon and coherence forecasts are unchanged; the goal remains active.
