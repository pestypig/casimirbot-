# IDM–ultralight portal chemical-contact screen

Date: September 25, 2026. This conditional estimate tests whether the renormalizable portal in the minimal IDM plus ultralight-field candidate can dynamically connect the heavy xenon-relevant abundance to the ultralight field near IDM freeze-out. It is not a coupled Boltzmann solution, a boson-star formation result, or a parameter exclusion for symmetry-protected completions.

## Calculation

The candidate interaction is `-kappa |phi|^2 H2†H2`, with `m_H=1080 GeV`, `m_phi=1e-17 eV`, and a representative `x=m_H/T=20`, so `T=54 GeV`. At this point the one-real-degree-of-freedom Maxwell–Boltzmann equilibrium density is

`n_H = (m_H T / 2 pi)^(3/2) exp(-m_H/T) = 1.84e-3 GeV^3`.

For a deliberately transparent contact estimate, use `sigma v = kappa^2/(64 pi m_H^2)` and radiation-era `H=1.66 sqrt(g*) T^2/M_Pl`, with `g*=106.75`. The exact inert-doublet channel count and vertex normalization can change order-one factors; they cannot bridge the result below.

The existing no-cancellation threshold-naturalness estimate gives `|kappa| <= 1.4e-56` from the portal correction `delta(m_phi^2) ~ kappa m_H^2/(16 pi^2)`. At that scale:

| Quantity | Result |
| --- | ---: |
| `sigma v` | `8.36e-121 GeV^-2` |
| `Gamma/H = n_H sigma v/H` | `3.76e-109` |
| `kappa` required for `Gamma/H=1` at `x=20` | `2.28e-2` |
| `kappa_naturalness / kappa_contact` | `6.13e-55` |
| `delta(m_phi^2)/m_phi^2` at `kappa=2.28e-2` | `1.69e54` |

Thus this portal cannot maintain chemical contact near freeze-out while respecting the stated no-cancellation ultralight-mass estimate. At a much larger coupling, substantial cancellation or a separate mass-protection completion would be needed. Even then, `H H -> phi phi*` at freeze-out creates relativistic daughters; it does not itself create the cold coherent charge population required by the boson-star branch. The two-field model therefore still needs an independent cold-`phi` production history, and its heavy relic/local flux must be recalculated rather than held at the published one-component IDM value.

## Scope and next decision

This rules out the simple portal as the proposed *natural population-transfer mechanism under the stated assumptions*. It does not rule out coexistence of the fields, a symmetry-protected portal, nonthermal production, or another UV completion. Those alternatives need an explicit Lagrangian and thermal history before their couplings can be inserted into a shared xenon/Casimir calculation.

The immediate next gate is not to increase `kappa` until a fit appears. Decide whether to construct a concrete protecting symmetry/UV completion or to treat the ultralight condensate and IDM abundance as separately produced components and compute their coupled cosmological budget. In either case, retain the previous detector result: the minimal IDM inelastic channel is closed on the frozen carbon target, while its elastic Higgs channel is far below registered Casimir-DP sensitivity. A model satisfying the requested measurable-both criterion has not yet been found.

Reproduce with `python -B docs/research/casimir-dp-idm-ultralight-portal-rate-screen-2026-09-25.py`; the adjacent JSON stores inputs and outputs. This is an equilibrium-rate diagnostic at one representative freeze-out point, not an integrated relic-density calculation. The numerical conclusion is so far from unity that reasonable multiplicity and thermal-average corrections do not change it.

Sources and context: [minimal multicomponent candidate](casimir-dp-idm-ultralight-multicomponent-candidate-2026-09-24.md), [IDM LZ bridge audit](casimir-dp-idm-lz-bridge-audit-2026-09-24.md), and [PDG Big-Bang Cosmology review](https://pdg.lbl.gov/2023/reviews/rpp2022-rev-bbang-cosmology.pdf).

Status: diagnostic failure for the unprotected renormalizable portal as a significant freeze-out connector; overall research goal remains active.
