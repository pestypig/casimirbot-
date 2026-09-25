# IDM underabundance and coannihilation preflight

This calculation tests whether a 10% ultralight component has an obvious conflict with the charged-scalar degree of freedom in the published inert-doublet LZ benchmark. It quantifies the relic target and thermal population weights only; it does not calculate an IDM relic density or select a new LZ-compatible point.

## Required abundance shift

The published profile point is $m_H=1080\,\mathrm{GeV}$, $m_A-m_H=369\,\mathrm{keV}$, $m_{H^\pm}-m_H=8.17\,\mathrm{GeV}$, and $\Omega_Hh^2=0.12014$. It nearly saturates the adopted $\Omega_{\rm DM}h^2=0.1198\pm0.0012$ total. For a standard-cosmology two-component mixture with $f_\phi=0.10$, the required IDM abundance is $\Omega_Hh^2=0.10782$, or 0.89745 of the published point. The simplest inverse-abundance estimate calls for an effective freeze-out rate about 1.114 times larger. This is only a starting target: coannihilations and the freeze-out temperature respond to the mass splittings and quartics.

The IDM paper profiles over the charged mass splitting and scans $m_{H^\pm}-m_H$ from 0.5 to 10 GeV while fixing the LZ-sensitive neutral splitting and scanning $m_H$ around the TeV scale. At the best-fit point the neutral-current recoil amplitude is fixed by the electroweak $ZHA$ vertex; the charged splitting is a cosmological/loop parameter that can change coannihilation without directly changing that vertex. The paper reports full relic density only, not an underabundant component point. It also states that its complete LZ likelihood requires detector-level information not currently public ([Wang & Xiao, arXiv:2609.06571](https://arxiv.org/abs/2609.06571)).

## Equilibrium-weight diagnostic

Using nonrelativistic Maxwell-Boltzmann number weights for one degree each of $H$ and $A$, two charged degrees of freedom, and an illustrative $x_f=m_H/T_f=25$, the charged-state fraction changes from 0.456 at the best-fit 8.17 GeV splitting to 0.497 at 0.5 GeV. The corresponding charged-charged pair population weight rises 19.1%; the neutral-neutral pair weight falls 14.7%, while the mixed neutral-charged weight changes by less than 1%. The neutral 369 keV splitting is negligible for these freeze-out weights, although it is crucial for present-day inelastic xenon scattering.

These are *population factors*, not annihilation-rate factors. The effective coannihilation rate contains each pair weight multiplied by its own temperature-dependent cross section, and the sum can move either more or less than the 1.114 target. This calculation therefore says the scanned splitting range has room to alter coannihilation substantially, but does not prove that an underabundant IDM point exists after all constraints.

## Decision gate and reproduction

The next exact calculation is to rerun the IDM model in micrOMEGAs at fixed or narrowly profiled $m_H$ and $\delta$, scan $\Delta M_\pm$, $\lambda_L$, and $\lambda_2$, and retain points with $\Omega_Hh^2\leq0.10782$ that also pass vacuum stability, unitarity, electroweak precision, collider, elastic direct-detection, and dwarf-galaxy constraints. Then the LZ rate must be rescaled by the predicted local $H$ fraction and the likelihood reprofiled. If no such point survives or public detector data cannot support the profile, the 10% two-component branch fails its LZ gate. A change in the thermal freeze-out rate must not be used directly as a present-day gamma-ray cross-section multiplier.

Reproduce the budget and population-weight scan with:

```powershell
python -B docs/research/casimir-dp-idm-underabundance-coannihilation-preflight-2026-09-25.py
```

The adjacent JSON stores the inputs and full $x_f=20,25,30$ grid. The result is not a micrOMEGAs replacement: all annihilation/coannihilation cross sections, Sommerfeld terms, thermal corrections, and detector likelihood inputs are outside its scope. No micrOMEGAs executable or IDM source model was present in the inspected workspace, so the underabundant point remains unselected.
