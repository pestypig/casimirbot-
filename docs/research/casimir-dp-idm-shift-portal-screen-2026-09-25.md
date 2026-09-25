# Shift-symmetric derivative portal freeze-out screen

Date: September 25, 2026. This diagnostic tests a simple mass-protected alternative to the nonderivative `|phi|^2 H2†H2` connector. It asks what EFT scale would make thermal `H H -> phi phi*` conversion relevant near the IDM freeze-out benchmark. It is not a UV completion, integrated Boltzmann solution, or cold boson-star production model.

## EFT and rate estimate

Take the dimension-six operator

`L_int = (c/Lambda^2) (partial_mu phi* partial^mu phi) (H2† H2)`.

It respects constant shifts of `phi` in the zero-mass limit, so the operator alone does not introduce the same nonderivative threshold correction that constrained `kappa |phi|^2 H2†H2`. The small mass term remains a soft breaking, and a complete UV model still has to preserve this protection during matching and renormalization.

Use the same IDM benchmark `m_H=1080 GeV`, `x=m_H/T=20`, `T=54 GeV`, `g*=106.75`, and Maxwell-Boltzmann equilibrium density for one real degree of freedom `n_H=1.84e-3 GeV^3`. For a dimension-six contact operator, estimate

`sigma v ~ c^2 m_H^2 / (64 pi Lambda^4)`

and use radiation-era `H=1.66 sqrt(g*) T^2/M_Pl`. With `c=1`, the scales are:

| Target at x=20 | Required `Lambda` | `Lambda/m_H` | `m_H/Lambda` |
| --- | ---: | ---: | ---: |
| `Gamma/H=1` (contact scale only) | 7.15 TeV | 6.62 | 0.151 |
| `Gamma/H=20` (order-x freeze-out relevance diagnostic) | 3.38 TeV | 3.13 | 0.320 |
| `Gamma/H=100` (stronger sensitivity case) | 2.26 TeV | 2.09 | 0.478 |

The precise prefactor depends on the inert-doublet component normalization, thermal averaging, and final-state multiplicity; the table is an EFT scale estimate. The `Gamma/H~x` row is a rough freeze-out relevance criterion, not a prediction of the relic abundance. A true result requires the coupled Boltzmann equations and a UV-matched amplitude. At the scale needed to matter, the cutoff is only about three times `m_H`; an explicit mediator may be preferable to truncating the EFT.

## Physical interpretation

This is a better symmetry story for a portal that couples the two sectors, but it does not supply the required cold ultralight component. Freeze-out annihilation creates relativistic `phi phi*` quanta with momenta of order `m_H`; it does not produce the low-momentum coherent charge needed for stable boson stars. A separate cold-field initial condition or production mechanism remains necessary. If enough H abundance is transferred into this relativistic channel, one must also calculate its contribution to radiation density and the surviving heavy relic rather than retain the one-component IDM point.

The operator does not change the earlier detector result: it is not a xenon nuclear-recoil kernel or a Casimir-DP material response. It does not yet calculate a gamma spectrum, halo population, local free-H fraction, or common prediction for the four observables. Thus this EFT is a plausible *population-coupling lead* to test in a resolved model, but it has not established the requested measurable common signal.

Reproduce with `python -B docs/research/casimir-dp-idm-shift-portal-screen-2026-09-25.py`; the adjacent JSON records constants and derived values. The main falsifiers are: no technically natural UV matching for the shift protection; an integrated abundance that overproduces total dark matter or removes the xenon-relevant H tail; excessive relativistic energy; or no independently justified cold-`phi` production and star population.

Context: [minimal IDM plus ultralight candidate](casimir-dp-idm-ultralight-multicomponent-candidate-2026-09-24.md), [nonderivative portal rate screen](casimir-dp-idm-ultralight-portal-rate-screen-2026-09-25.md), and [IDM LZ bridge audit](casimir-dp-idm-lz-bridge-audit-2026-09-24.md).

Status: symmetry-protected EFT lead identified, but no UV completion, relic solution, cold-star connection, detector prediction, or four-observable parameter point has been established. Overall goal remains active.
