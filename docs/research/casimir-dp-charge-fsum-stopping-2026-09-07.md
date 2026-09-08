# Charge-density f-sum stopping audit — 2026-09-07

Exploratory S1 formal bound under explicit target assumptions. This extends
the rigid-elastic screen to an inclusive density-response framework, but does
not claim actual electronic stopping or an Earth-capture probability.

## New source lead

[Barker et al., arXiv:2608.05282v1](https://arxiv.org/html/2608.05282v1)
derive zero-temperature electron-density scattering bounds from dielectric
sum rules. Their treatment counts core as well as valence electrons, and
shows why static finite-momentum dielectric response can strengthen bounds.
We use that methodological lead; their event-rate bounds are not imported
as our energy-loss calculation or as a result for this two-mediator model.

## Formal derivation and scope

Use S(q,omega)=sum_f |<f|rho_charge(q)|0>|^2 delta(omega-E_f+E_0), without
an extra 2*pi factor. For a nonrelativistic ground-state Hamiltonian with
standard kinetic terms and coordinate-dependent interactions, its first
moment is q^2/2 times sum_a N_a Q_a^2/m_a. This includes electrons and nuclei
in a common charge response, so no separate elastic stopping rate is added
on top and double counted.

With V(q)=4*pi*sum_i alpha_i/(q^2+m_i^2), isotropic angular integration gives

`dK/dX <= (2*pi/v^2) * sum_a [N_a per gram * Q_a^2/m_a] * integral_0^Y dy y [sum_i alpha_i/(y+m_i^2)]^2`,

where y=q^2, Y=(2*m_chi*v)^2. The derivation enlarges the physically accessible
omega interval to the full positive-frequency sum. Units are converted from
GeV^-2 to cm2. The chosen silica formula has 30 electrons, not merely valence
carriers. The companion script evaluates the signed two-mediator integral and
checks it against independent logarithmic quadrature.

## Numerical diagnostic

At 776 km/s and the previously specified 7e9-g/cm2 path budget, the formal
initial-speed energy-loss envelopes are approximately 26.09, 26.03 and 26.06
keV for the 1-keV, 100-keV and 10-MeV light mediators paired with 1 GeV.
They are upper envelopes, not expected losses. A stopped-process construction
using absolute mediator products and the maximum inverse-v^2 until half-energy
loss gives formal probability ceilings near 0.34 in this assumed target model.
These numbers must not be presented as 34% physical capture efficiency.

Crucially, 99.72%, 99.94% and effectively 100% of the respective formal first
moments arise from q>m_e. The momentum integration extends to q=0.5177 GeV.
The calculation has therefore identified where its apparently large envelope
comes from, rather than established that accessible material excitations can
realize it. Broadly allocating oscillator strength at kinematically inaccessible
energies is the source of looseness; the physical validity of a nonrelativistic
electron Hamiltonian at these momenta also needs explicit control.

The zero-temperature positive-frequency identity cannot silently be applied
to a finite-temperature target: detailed balance and negative-frequency
contributions must be handled. Nor does an imposed path budget define real
geology, residence time or transport. No local phase-space population follows.

## Consequence and next input

The rigid-elastic failure cannot alone exclude all electronic energy-loss
channels, but this broad f-sum envelope does not demonstrate a rescue. Next
constrain the allowed momentum/energy distribution using a supported static
or dynamic material response, retain both mediator amplitudes, and control
large-q and finite-temperature assumptions. The newly identified sum-rule
paper supplies a relevant route for tightening the envelope, not permission
to use its saturation as a predicted signal.

Source hash and analytic/quadrature checks pass. No detector likelihood,
experimental exclusion, certified proof status, captured supply or measurable
common coherence prediction is established.
