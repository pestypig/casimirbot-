# Shared-model reassessment and absorption intake

Exploratory review, September 7, 2026. This updates research priorities; it does not advance model admission. The [work program](casimir-dp-lz-shared-scattering-work-program.md) remains the current roadmap.

The previous coupling-competition turn made substantive progress: it bounded the prescribed-path escaped-chi contribution within its conditional kernel and carried the same coupling into the local response. No live process or external wait blocks the next calculation.

The current evidence supports a shared interaction with an undetectably small calculated local effect more readily than a measurable common explanation of both experiments. The canonical DP exponent is a theoretical comparator, not a measured target. The four-cell boundary observable also cancels homogeneous multiplicative scattering under unchanged histories. Neither a xenon event nor a nonzero absolute local scattering exponent establishes a boundary signal.

| Candidate | What the existing calculations establish | Missing decisive evidence | Priority |
|---|---|---|---|
| Up-quark axion portal with scalar companions | A reproducible conditional Xe/C13-plus-scalar comparison; assembled benchmark gives about 1.3745 raw wide-window Xe events and 2.18e-29 independent-nucleus local D | Complete matched coefficients and empirical detector likelihood; material-response qualification | Retain as the concrete small-local-signal reference model |
| Even scalar portal with extended field | Boundary-dependent medium response is possible in the model; apparent larger fixed-trajectory effects encounter force and loop constraints | Actual confinement/branch dynamics, medium fluctuations and consistent loop matching | Retain a conditional mechanics branch; no percent-level claim |
| Neutrino up-scattering | Production and decay jointly screened; no coupling rescue for the tested fixed-path escaped-particle interpretation | Actual geometry and pion-cascade acceptance, complete hadronic uncertainty, transport | Deprioritize escaped-chi interpretation; keep cascade route distinct |
| High-splitting seasonal inelasticity | A timing discriminator and a closed free-carbon endothermic channel at the studied splitting | Absolute normalization, high-speed population and elastic/solid companions | Competing null/discrimination model, not a local signal forecast |
| Fermionic absorption | New exact two-target kinematic check below | Rate convention, incoherent channels, source-reported KamLAND tension and lifetime | Bounded intake before any full-model investment |

The scalar thermal closure envelope of order 1.81e-14 is a different conditional statement from the axion assembly's independent-nucleus D: it assumes a scalar density/contact Born envelope, an equilibrium target and a halo majorant. It cannot be added to that D or promoted to a complete QCD/material bound. Keeping these distinct prevents a numerical upper estimate from becoming an unsupported full-model null.

The new primary lead is [Lou and Lu, fermionic dark-matter absorption](https://arxiv.org/html/2609.01592v1), posted September 1. It proposes chi+A -> neutrino+A with a roughly 247 MeV incident particle and discusses both coherent recoils and incoherent nuclear channels. The authors themselves report tension with a KamLAND neutron-emission recast. Their one-event normalization and detector rejection assumptions are not adopted here; this is not an independently reproduced exclusion or a likelihood fit.

Our exact rest-frame calculation uses a stationary isolated nucleus, chi initially at rest, and a massless outgoing neutrino. Energy and momentum conservation give

```text
T_A = m_chi^2 / [2(M_A+m_chi)]
q = E_nu = m_chi-T_A
m_chi(T_A) = T_A + sqrt(T_A^2+2M_A T_A).
```

For m_chi=247 MeV:

| Target | Nuclear recoil |
|---|---:|
| C12 | 2.67071 MeV |
| C13 | 2.46870 MeV |
| Xe128 | 255.565 keV |
| Xe131 | 249.716 keV |
| Xe136 | 240.541 keV |

Thus absorption avoids the endothermic free-carbon threshold obstruction: rest energy supplies the outgoing neutrino and recoil. It also produces a hard carbon recoil, not a gentle whole-sphere kick. The tabulated coherent nuclear final state is only one channel; nuclear breakup and solid excitation are not included. The source's quoted isotope endpoints differ from this direct calculation with its stated mass, so our values remain explicitly independent rather than silently copying its spectrum. This discrepancy is small relative to the reported event uncertainty and does not by itself reject the proposal.

Three checks pass in the sibling `casimir-dp-absorption-kinematics-2026-09-07.py`: energy conservation, the final nucleus mass shell and inversion of the recoil formula. Its JSON contains all masses and momenta. No absorption rate follows from those checks. In particular the rate requires an unambiguous convention for the quoted area-like absorption coefficient versus sigma*v in the low-velocity limit; a speed factor cannot be chosen by analogy with elastic scattering.

Next bounded calculation: derive that vector-operator absorption normalization from the amplitude, then apply the **same** coefficient to xenon and carbon before considering a claimed one-event scale. If it remains negligible locally or inconsistent with applicable scintillator constraints, retain it as another null/discriminator result instead of adding parameters to force agreement. In parallel conceptual priority, preserve the axion reference as the nearest existing reproducible joint forecast; its missing matching and likelihood remain explicit requirements for a satisfactory final model.

No apparatus parameters, proof maturity, certificate semantics or runtime behavior changed. Ordinary research-document validation applies. None of the reviewed candidates is established dark matter, an observed DP residual, or evidence that gravity caused the xenon event.
