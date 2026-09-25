# Charged ultralight-field abundance and Milky Way object budget

Date: September 25, 2026. Exploratory, candidate-neutral calculation for the active multicomponent dark-sector goal. The script and JSON companion normalize a homogeneous complex scalar and perform illustrative mass-budget arithmetic; they do not calculate field fragmentation, boson-star formation, a Galactic mass function, or an LZ likelihood.

## Why charge is now an explicit input

The current two-field proposal assigns the boson-star role to a complex ultralight field `phi` and the xenon-recoil role to heavy inert-doublet matter `H`. The earlier real-field misalignment estimate fixed an energy density, but it did not state the conserved `U(1)_phi` charge. That matters if the desired object family consists of stationary, net-charged complex boson stars.

For a canonical quadratic complex field in the harmonic regime, use

`phi(t) = (A cos(m t) + i B sin(m t))/sqrt(2)`

and define `epsilon = 2 A B/(A^2+B^2)`. At fixed oscillation-averaged energy, `epsilon` spans a real-line orbit at zero through maximally charged circular motion at magnitude one. The script fixes the total amplitude from the chosen cosmic `phi` fraction and varies `epsilon`; the initial charge is a scenario choice, not something predicted by the already tiny IDM portal. A zero net asymmetry remains a valid real-field/oscillaton alternative, but it does not represent a net-charged population in this parameterization.

For `m_phi = 1e-17 eV`, the standard radiation-era `3H=m_phi` screen gives `T_osc = 115.64 keV`, reproducing the prior real-field all-DM amplitude `4.8137e15 GeV`. At a 10% cosmic `phi` fraction, the required real-line-equivalent amplitude is `1.5222e15 GeV`. The maximally charged case has present net-charge density `1.2624e19 cm^-3`; values scale linearly with `epsilon` and `f_phi`. Energy normalization and recovered charge asymmetry agree to floating-point precision in every grid case.

## Object-number budget

To expose the population scale, normalize a Milky Way halo to `1e12 Msun` and use `4.02e6 Msun` as a reference mass equal to the Sgr A* imaging-paper source scale. This is a mass-normalization example, not an identification of Sgr A* as a boson star. At `f_phi=0.10`:

- If all ultralight mass were in equal-mass, Sgr A*-scale objects, the halo would contain about `24,876` such objects.
- Under the free-field Kaup cap `8.46e6 Msun` from the existing scaling screen, putting all of that mass in objects at the cap gives a minimum count of about `11,822`. The cap and count change for self-interacting stars.
- One Sgr A*-scale object is only `4.02e-5` of the assumed 10% ultralight mass budget. It cannot by itself account for that component in this halo normalization.

These figures flag a population question; they are not observational exclusions. A defensible constraint requires the actual boson-star mass function, spatial distribution, and applicable lensing/dynamical/structure-formation selection functions. The input halo mass is deliberately a round normalization.

## Consequence for xenon and the shared prediction

If the model contains only `phi` and `H`, then a cosmic `f_phi=0.10` leaves `Omega_H h^2 = 0.90 Omega_DM h^2`, or `0.10782` at the adopted Planck central value. Relative to the cited IDM profile point `Omega_H h^2=0.12014`, the abundance ratio is `0.897`. A fixed-cross-section LZ rate would scale by that same factor only if the local `H` density is reduced proportionally and the local velocity distribution, total density, and detector response remain fixed. Those assumptions have not been established: a cosmic abundance ratio cannot be substituted for the local unbound-`H` fraction without a co-clustering model.

The candidate's ultralight portal and charge history also remain unresolved. In the current no-cancellation mass screen, the portals are too small to thermalize the ultralight field efficiently; thermal `H H -> phi phi*` daughters are born relativistic and do not supply the cold condensate. A cold production mechanism and its charge asymmetry must therefore be specified independently or derived in a protecting completion, while the coupled calculation updates the `H` relic abundance and xenon flux.

## Decision and next gate

The useful result is a sharper requirement, not a viable population prediction: the multicomponent model needs a cold-`phi` production history, a chosen or dynamically generated `U(1)` charge asymmetry, and a fragmentation calculation that maps that charge and the self-interaction onto a stable boson-star mass function plus diffuse field. Then evolve the heavy `H` abundance and derive its local unbound fraction in the same Galactic potential. Only after these pieces share a cosmology should the xenon response be re-folded. Reject parameter regions that overproduce or underproduce the total density, cannot form the required objects, violate object-population constraints once those are calculated, or leave too little local `H` for the recoil hypothesis.

This screen does not establish that the LZ candidate is dark matter, that Sgr A* is a boson star, or that gravitational residuals cause either laboratory signal. It preserves the competing explanations and makes the missing population inputs explicit.

## Reproducibility and sources

Run `python -B docs/research/casimir-dp-ultralight-charge-population-budget-2026-09-25.py`; output is written to the adjacent JSON file. The script asserts finite serialization and prints the charge/asymmetry and object-budget diagnostics.

- [Accreting boson-star models at the Galactic Center, arXiv:1809.08682](https://arxiv.org/abs/1809.08682) supplies the imaging-paper mass scale used only as a reference normalization.
- [Dynamical Boson Stars, arXiv:1202.5809](https://arxiv.org/abs/1202.5809) reviews complex-field boson stars and their conserved charge.
- [The IDM interpretation paper, arXiv:2609.06571](https://arxiv.org/abs/2609.06571) supplies the IDM abundance profile point and reference relic density adopted in the existing candidate screen.
- The companion [Python calculation](casimir-dp-ultralight-charge-population-budget-2026-09-25.py) and [JSON results](casimir-dp-ultralight-charge-population-budget-2026-09-25.json) contain all inputs, derived rows, and validity limits.

Status: reproducible conditional abundance/charge and object-number screen; no charge-generation mechanism, fragmentation result, boson-star mass function, local component decomposition, or common xenon prediction yet.

## Production-mechanism lead triage (September 25, 2026)

A useful adjacent lead is the 2025 acoustic-misalignment mechanism. It starts from a rotating complex condensate carrying `U(1)` charge; cosmic perturbations excite sound-wave modes, and the later axion-like fluctuations can contribute to dark matter. The authors explicitly find parameter regions where that component can be warm enough to affect structure formation. This establishes a concrete literature example for generating dark-sector fluctuations from an initially charged condensate, but it does **not** directly provide the cold, net-charged `m_phi=1e-17 eV` condensate or the stable star mass function required here. Its radial-mode dynamics, potential, dilution of the charge condensate, and daughter-field phase-space distribution must be mapped before any reuse. Treat it as a charge/production mechanism to compare, not as evidence of our boson-star population.

A second methodological lead is full cosmological Schrödinger-Poisson simulation of fuzzy scalar dark matter, which forms solitonic cores in simulated halos. That can inform the halo-assembly and core-population stage, but the cited simulation uses a real nonrelativistic field at `2.5e-22 eV`; it does not resolve the charge generation, relativistic compact-star branch, or mass scale of our `1e-17 eV` complex field. We should not transplant its core-halo relation without rerunning the equations and matching regime.

The simplest controlled candidate to test first remains a cold homogeneous complex condensate with a specified initial rotation, generated by an explicit early-time charge kick in a UV completion and evolved thereafter with an approximately conserved `U(1)_phi`. This is a testable assumption set, not a selected physical model. Required outputs are the charge yield `Y_Q=n_Q/s`, the cold-field energy fraction, perturbation spectrum, and nonlinear fragmentation outcome. Compare this with acoustic misalignment; reject any branch that converts too much energy into warm/noncondensed excitations or fails structure-formation bounds. Then map surviving charge into stable boson-star solutions and a Galactic population before relating it to the local heavy-H flux.

Sources: [Acoustic Misalignment Mechanism for Axion Dark Matter, arXiv:2503.04888](https://arxiv.org/abs/2503.04888); [Solitons in the dark: non-linear structure formation with fuzzy dark matter, arXiv:2007.04119](https://arxiv.org/abs/2007.04119).

Charge-yield refinement: using the PDG present entropy density `s0/k_B=2891.2 cm^-3`, the maximally rotating 10% component corresponds to `Y_Q=n_Q/s0=4.3666e15`; the value scales as `epsilon*f_phi/0.10`. This large dimensionless yield is a target for a specified early-universe charge-generation mechanism, not an independently measured asymmetry or evidence that such a mechanism operates. It does not by itself imply a large gravitational potential, since the charge carriers have ultralight mass and the energy budget remains fixed by `f_phi`.
- The charge-yield normalization uses the [Particle Data Group constants table](https://pdg.lbl.gov/2017/download/rpp-2016-booklet.pdf), which lists `s0/k_B=2891.2 cm^-3` at the reference CMB temperature.
