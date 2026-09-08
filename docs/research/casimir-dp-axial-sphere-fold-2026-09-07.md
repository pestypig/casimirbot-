# Xenon-normalized axial rigid-sphere fold

Exploratory conditional calculation. Previous turn made progress by deriving the axial elastic kernel and checking its spin trace. This packet folds the frozen sphere geometry with that kernel while restoring the same raw xenon count for every mediator mass. It does not claim a measured residual or a viable populated dark sector.

## Shared normalization and frozen inputs

Use the same-sign mass pilot mL=3gap/4, mR=gap/4, with the diagonal/transition vertex ratio fixed by its mass rotation. For bookkeeping define qref=0.2 GeV and P(q)=[(qref^2+mV^2)/(q^2+mV^2)]^2. Recompute the full archived isotope/halo xenon integral with P(q). If it changes the raw xenon count by Xfactor, rescale the transition coefficient at qref by 1/sqrt(Xfactor); the axial coefficient receives exactly the same rescaling. This is a conditional normalization to the archived raw count, not a detector likelihood fit or a constant coupling held fixed across mediator masses.

The sphere uses the authenticated Stage-4.2R mass, radius, branch separation and hold time. Charge is mass/u in the existing baryonic approximation; F(x)=3(sin x-x cos x)/x^3 and x=qR. The spatial loss factor is 1-sinc(qd), appropriate to averaging the branch orientation relative to momentum transfers. Both elastic species have equal axial-coupling magnitudes in this model. We take total elastic density 0.3 GeV/cm^3 and, conditionally, excited fraction one for xenon. At another excited fraction the common normalization and survival calculation must be revisited. Photon-mixing charge corrections are omitted at this leading baryon-charge stage, so these are not a completed electroweak-matched forecast.

## Velocity treatment and finite momentum interval

For the derived kernel the flux-weighted speed factor at fixed q is the integral above vmin=q/(2mu) of f(v)[v-q^2/(4mu^2 v)]. It is bounded above by mean(v), and below by mean(v)-q^2 mean(1/v)/(4mu^2). Applying the largest q in the interval gives an analytic relative bracket below 4.51e-13 for the 40 GeV case and 7.21e-14 for 100 GeV. These are bounds on the velocity approximation only, not total numerical precision: quadrature and physical-model errors are larger.

The q integral covers 1e-8<=qR<=80. It excludes both ends outside that interval and all internal solid channels. The output upper/lower labels apply only to this interval’s velocity bracket. They are not upper/lower bounds on the complete sphere or material response. Comparing cutoffs 40 and 80 shifts the contact-like result by about 0.115%; for the 1 eV mediator the shift is below 8e-9 relative. This comparison is not a rigorous tail bound.

## Results

| Dark mass (GeV) | Mediator mass | Conditional D, qR<=80 | Real-vector emission open? |
|---|---|---|---|
| 40 | 1 GeV | 2.900e-47 | No |
| 40 | 10 MeV | 6.307e-42 | No |
| 40 | 1 MeV | 6.281e-38 | Yes |
| 40 | 1 keV | 6.281e-26 | Yes |
| 40 | 1 eV | 6.463e-15 | Yes |
| 100 | 1 GeV | 5.361e-49 | No |
| 100 | 10 MeV | 8.897e-44 | No |
| 100 | 1 MeV | 8.854e-40 | No |
| 100 | 1 keV | 8.853e-28 | Yes |
| 100 | 1 eV | 9.110e-17 | Yes |

The largest scanned value remains about 4.6e12 times below the frozen D=0.0295115 forecast. This scan is not a global bound on arbitrarily small mediator masses. The lightest entries open chi_star -> chi + vector, so the assumed primordial excited fraction is not justified by this calculation. Separate dark and baryon couplings, the dark Higgs sector and longitudinal-vector emission must be handled consistently. Born validity, environmental force bounds, transport and directional response are also unresolved. Homogeneous attenuation does not automatically survive the canonical four-cell cancellation.

Next calculate real-vector decay together with the coupling product required by xenon; test whether any perturbative split of that product can preserve the required excited population. This takes priority over presenting smaller-mass formal scattering values as viable leads.

Reproduce with `python docs/research/casimir-dp-axial-sphere-fold-2026-09-07.py`. Source script, axial input and frozen configuration hashes are checked. The xenon kernel is re-evaluated with the propagator rather than approximated by a single recoil momentum. `npm run validate:physics:root-leaf` validates documentation separately. No runtime/GR/certificate changes; goal remains active.
