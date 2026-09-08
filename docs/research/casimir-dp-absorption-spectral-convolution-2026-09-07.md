Program gate: S1 — common-interaction screening.
Workstream: Conditional spectral-response convolution.
Capability or component: Primary proton spectrum and local encounter contribution.
Current maturity: Exploratory model calculation.
Target maturity: Reproducible projected-current comparison with a free-limit check.
Required frozen inputs: Archived legacy proton table, canonical apparatus and shared 247 MeV/11.5 TeV parameters.
Required evidence: Explicit current projection, spectral normalization, phase space and independent free-limit comparison.
Stop/fail criteria: No neutron interpretation, accepted-event rate or conserved nuclear-current claim.
Explicit non-goals: No fitted coupling, neutron mapping, detector transport or physical certification.
Downstream gate unlocked: Conditional primary spectrum exists for response-method comparison.

# Projected-current spectral convolution

The preceding turn fixed the spectator energy bookkeeping. This turn combines the table and kernel into a primary-energy spectrum under an explicit projection prescription. No coupling or apparatus parameter is retuned.

[Lou and Lu, equations 14–17](https://arxiv.org/html/2609.01592v1) uses removal energy in phase space while taking the initial nucleon energy in the elementary matrix element to be on shell. Its kernel normalization is B/(2m^3 Ep p). We implement that distinction literally, using the independently archived proton table as a comparison input. This does not reproduce their neutron spectral function or detector response.

For each table point, the available subsystem energy is Q=m+M-Erem, or Q=m+M-Erem-TR in the spectator-recoil variant. Let s=Q^2-p^2. The final nucleon has energy E'=M+T, neutrino energy nu=Q-E', and momentum p'. The scalar product of spatial momenta is p dot p'=(p^2+p'^2-nu^2)/2. The current uses the projected initial four-vector (Ep,p), Ep=sqrt(M^2+p^2). All four-vector products are evaluated directly with these definitions.

This last step matters: the on-shell Fermi-gas shortcut p' dot k'=m Ep+m^2/2 relies on energy conservation at that projected vertex and cannot be reused when binding energy has been removed. The implementation therefore avoids it. The physical nuclear energy balance and projected elementary current are distinct parts of this approximation.

## Conditional predictions

Normalize the archived p-squared spectral weights per proton and integrate over the exact two-body energy limits. The Pauli comparison uses pF=220.5 MeV. The output also includes 5 MeV primary-energy bins over 0–300 MeV.

| Spectator recoil | Pauli blocking | Rate / sigma0 | Mean primary T, MeV | Local carbon-12 proton-only D <= 2N |
|---|---|---:|---:|---:|
| Omitted | Off | 0.536581 | 31.0279 | 9.71822e-26 |
| Omitted | On | 0.306541 | 42.9221 | 5.55189e-26 |
| Included | Off | 0.529084 | 30.7102 | 9.58244e-26 |
| Included | On | 0.300046 | 42.5746 | 5.43425e-26 |

Here sigma0=m^2/(4 pi Lambda^4), m=247 MeV and Lambda=11.5 TeV. Physical rates use (rho/m)c sigma0 with rho=0.3 GeV/cm^3. The local column uses the canonical hold and natural carbon-12 abundance, with six protons per carbon-12 nucleus. It omits neutrons and carbon-13. It is an independent-encounter conditional contribution, not a bound on the entire material. The two recoil and blocking choices are model comparisons, not error bars.

For context, the prior on-shell carbon Fermi-gas rate was approximately 0.840 unblocked and 0.585 blocked in the same normalization. The reduction here reflects both the changed spectral momentum distribution and removal energy; it must not be attributed solely to one correction. The local contribution remains negligible compared with the DP forecast, which is still a theory comparator rather than a measured residual.

## Limitations and next evidence

An on-shell projection does not supply a conserved many-body vector current at the physical transfer. This packet makes no gauge-completion claim. The legacy response, point nucleon current, mass M=939 MeV and midpoint spectral integration remain approximations. Current-choice sensitivity, species mapping, binding conventions, correlations, final-state interactions and detector response remain unresolved. Do not add this contribution to elastic nuclear rates as a claimed complete response without consistent channel partition.

For neutron emission, next establish a proton-to-neutron response prescription from primary nuclear information and explicitly propagate its limitations. Only after that should a neutron spectrum be passed through transport and event cuts. A primary proton spectrum is not a prompt-visible neutron spectrum. Neither homogeneous encounters nor the projection introduces a boundary-dependent four-cell residual.

The [script](casimir-dp-absorption-spectral-convolution-2026-09-07.py) and [JSON](casimir-dp-absorption-spectral-convolution-2026-09-07.json) pass four checks: the free moving-target limit agrees with the archived invariant calculation, quadrature refinement agrees, integrated weights are nonnegative, and the binned spectrum sums to its independently integrated total. The algebraic free-limit test uses Erem=M-Ep only as a test fixture; negative removal energy is not assigned to a physical nucleus. Archived dependencies are hash checked and only definitions are loaded. `npm run validate:physics:root-leaf` passes. No certificate or model-validation claim applies.
