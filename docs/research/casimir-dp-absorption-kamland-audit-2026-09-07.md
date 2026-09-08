Program gate: S1 — common-interaction screening.
Workstream: Absorption external-constraint provenance.
Capability or component: KamLAND recast and conditional shared-rate scaling.
Current maturity: Exploratory calculation.
Target maturity: Auditable constraint intake; no exclusion promotion.
Required frozen inputs: Prior absorption-rate JSON, canonical apparatus unchanged.
Required evidence: Primary data provenance, response normalization, statistical model.
Stop/fail criteria: Do not treat residual counts as authenticated raw Poisson data or a reported bound as reproduced.
Explicit non-goals: No detector fit, scalar UV matching, baseline retuning or certification.
Downstream gate unlocked: Response and likelihood reconstruction remains necessary.

# KamLAND absorption constraint audit

The quoted constraint is a serious screening lead, but is not yet an independently reproduced exclusion. This audit identifies an additional likelihood issue before committing to a detailed nuclear-response reconstruction.

## Source chain

[KamLAND's original paper](https://arxiv.org/pdf/2108.08527), abstract, reports 18 candidate events in 6.72 kton-years and no significant excess. These are the original candidates, not the eight-bin array used in the absorption recast.

[Meighen-Berger et al.](https://arxiv.org/html/2311.01667), section III.2 and figure 4, subtract reactor, spallation and atmospheric charged-current contributions and rebin. Their comparison has 15 residual events against 20 predicted events, including three fast-neutron events. Section III.1 includes approximately 80% livetime and 73% selection efficiency and models neutron transport and quenched deposition. Consequently the 20-event prediction should not be described as pure atmospheric neutral-current background.

[Gong et al.](https://arxiv.org/html/2504.13007), appendix table 1, tabulate residual counts (4,2,2,2,2,1,1,1) and backgrounds (3.9,3.1,2.9,2.2,2.1,2,1.9,1.9). They acknowledge subtraction and rebinning and adopt a 25% background uncertainty in their recast. This authenticates the transcription, not its interpretation as original experimental counts.

[Lou and Lu](https://arxiv.org/html/2609.01592v1), supplement S6, use those arrays with independent 25% bin uncertainties and a Poisson likelihood. They report a preliminary vector scale bound of approximately 80 TeV at 247.5 MeV. Their signal-template normalization is rescaled consistently in principle, but the numerical reference signal array and physical reference cross section are not supplied there. Supplement S1 also specifies a Helm radius of 1.14 A^(1/3) fm; our preceding illustrative Helm calculation used a different, explicitly documented radius prescription. It must not be called an exact reproduction of this paper.

## Statistical and response limitations

Our inference: subtracting a predicted background from a Poisson observation does not produce a new Poisson observation. If raw n has mean s+b+c and a known c is subtracted, the residual mean is s+b but its variance is still s+b+c. Uncertainty in c adds further terms and correlations. Integer tabulation does not restore Poisson sampling. A defensible reconstruction should use raw counts and all background components, or a justified residual likelihood with subtraction uncertainties.

The covariance assumption matters independently: the stated independent 25% bin uncertainties imply a total-background standard deviation of 1.832 events. A single fully correlated 25% normalization implies 5 events. Neither comparison is a replacement covariance model; it demonstrates why the same percentage does not specify the same uncertainty.

The effective 0.58 efficiency is numerically consistent with 0.8 times 0.73. Before reuse, check whether each exposure already includes livetime cuts. A product alone cannot establish the correct accounting. Likewise an effective neutron-energy-to-visible-energy map cannot establish the full migration and single-neutron acceptance without a transport calculation. The missing response template prevents converting any improved event limit into a physical interaction limit at present.

## Conditional effect on the shared model

For fixed mass, operator, density and response, rates scale as Lambda^-4. Moving from 11.5 to 80 TeV therefore multiplies both target predictions by 0.0004270, a reduction by 2341.9. This is illustrative: the reported bound is at 247.5 MeV while our frozen benchmark is 247 MeV, and no mass interpolation has been justified.

Applying only that scale change to the archived calculation gives:

| Prior response prescription | Raw xenon events in 2.84 t yr | Conditional local D <= 2N |
|---|---:|---:|
| Illustrative Helm | 0.001747 | 3.659e-29 |
| Klein–Nystrand | 0.00009623 | 2.651e-29 |

These are conditional rescalings, not accepted event predictions or confidence limits. The point-nucleus comparison is retained in JSON solely as a form-factor diagnostic. No full nuclear-breakup, solid-state or postselected-coherence bound follows. Boundary-independent scattering still cancels in the frozen four-cell ratio.

Decision: retain absorption as an exploratory constraint-test branch, with no detectable local-overlap claim. Next useful work is to compare the paper's exact Helm prescription, then seek a normalized neutron response and raw-data likelihood. Do not automatically discard or validate the interaction from the preliminary 80 TeV figure. Scalar limits require separate nucleon/UV matching and are not transferred here.

Reproduce with `C:\Python313\python.exe docs/research/casimir-dp-absorption-kamland-audit-2026-09-07.py`. The script verifies the archived input hash, array totals, scaling identity and efficiency arithmetic. These four checks pass; they do not validate the external likelihood.
