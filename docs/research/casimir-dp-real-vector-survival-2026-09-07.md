# Real-vector emission and the xenon normalization

Exploratory survival screen. Previous turn made progress by computing an axial rigid-sphere response with a shared xenon normalization. This packet tests the population assumption behind its light-mediator entries. Frozen apparatus and target spectra are unchanged.

## Exact two-body kernel

For a physical off-diagonal vector vertex g12 ubar(p) gamma_mu u(P) epsilon^mu, initial mass M=m+gap, daughter mass m, and vector mass mV<gap, contract the initial-spin-averaged tensor 2[p_mu P_nu+p_nu P_mu+(mM-p dot P)g_munu] with the massive-vector polarization sum. The result divided by g12^2 is

`B = (gap^2-mV^2)*((M+m)^2+2mV^2)/mV^2`.

The exact width is `g12^2 sqrt(lambda(M^2,m^2,mV^2)) B/(16 pi M^3)`, with the factored lambda used numerically to avoid cancellation. At small gap/m it approaches `g12^2 (gap^2-mV^2)^(3/2)/(2 pi mV^2)`. The longitudinal polarization supplies the inverse-vector-mass enhancement. The vertex convention is the physical transition coupling already used for scattering, with no extra Majorana identical-final-state factor. This is our derivation, checked by symbolic contraction; the final particles are distinct. At and above threshold the channel is closed, not evidence of infinite total lifetime.

A gauge completion must supply the symmetry breaking and Goldstone interactions behind this longitudinal mode. Other operators or an axial transition instead of the selected vector transition require a different calculation. Inelastic models distinguish real and virtual mediator decays; see, for example, [Inelastic Boosted Dark Matter](https://cds.cern.ch/record/2298969/files/scoap3-fulltext.pdf). No exclusions from that different experimental setup are imported.

## Shared coupling product and favorable lifetime

The sphere packet fixed the raw xenon count by folding each mediator propagator. Therefore the required dimensionless product is P=g12*gB=Cb_ref*(qref^2+mV^2)/sqrt(Xfactor), qref=0.2 GeV. This is approximately 1.51e-10 for the 40 GeV light-mediator cases and 1.30e-10 for 100 GeV. Scattering does not separately fix the two couplings.

Impose illustrative caps gB<=sqrt(4 pi) and gB<=4 pi. These are explicit assumptions, not experimental bounds or rigorous definitions of perturbativity. The latter is deliberately generous and gives the longest lifetimes in the table. Then g12>=P/gBcap and the partial lifetime has a corresponding upper bound. Quark charges gB/3 and additional matter constraints still require a full model.

| Dark mass | Mediator | Maximum partial lifetime at gB cap 4pi | Maximum common Xe strength S |
|---|---|---|---|
| 40 GeV | 1 MeV | 2.0295e4 s | 1.7163e-14 |
| 40 GeV | 1 keV | 2.7981e-5 s | 2.3663e-23 |
| 40 GeV | 1 eV | 2.7981e-11 s | 2.3663e-29 |
| 100 GeV | 1 keV | 2.3188e-4 s | 1.9610e-22 |
| 100 GeV | 1 eV | 2.3188e-10 s | 1.9610e-28 |

S is relative to the selected raw xenon benchmark, not a likelihood limit. Let x scale the reference squared coupling product. At fixed cap, tau_max(x)=tau_ref/x. For initial fraction f0<=1 and no replenishment over age=4.35e17 s, S<=x exp(-age*x/tau_ref), whose maximum is tau_ref/(e age). Thus rescaling scattering cannot recover S=1 in these open-channel entries. The table already optimizes that tradeoff and allows the most favorable f0. Additional independent decays would tighten it. Taking the smaller gB cap shortens lifetimes and lowers S by 4pi.

## Consequence and remaining branches

The lightest sphere entries are not self-consistent predictions for a primordial excited population under these assumptions. Their formal elastic D values must not be promoted to a viable two-experiment model. This does not exclude replenished excited states, altered late-time masses, or another microscopic interaction, but those mechanisms need a production calculation rather than an independently chosen population. Mediators above the splitting avoid this two-body channel and had extremely small rigid elastic responses in the completed scan. A thin near-threshold region below the splitting is not globally excluded by the sampled points; phase-space suppression there must be treated if pursued.

The next meaningful choice is to calculate a physically sourced replenishment rate, or prioritize a different completion whose low-momentum response does not require this short-lived excited state. Continuing the same formal small-mass scattering scan without addressing population would not advance the shared model.

Reproduce with `python docs/research/casimir-dp-real-vector-survival-2026-09-07.py`. Both upstream JSON hashes are authenticated. Checks cover the symbolic tensor contraction, threshold closure and independent numerical maximization of the population factor. Root-leaf documentation validation is separate. No runtime, GR, certificate or model-admission changes.
