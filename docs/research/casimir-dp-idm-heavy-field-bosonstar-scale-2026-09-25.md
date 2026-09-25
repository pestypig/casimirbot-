# Can the LZ IDM field itself make the massive boson-star component?

Date: September 25, 2026. Status: exploratory scaling screen, not a soliton solution.

## Question and inputs

The LZ interpretation uses a neutral inert-doublet scalar with `m_H=1080 GeV`, `m_A-m_H=369 keV`, `lambda_2=4.06`, and a small Higgs portal. The IDM potential has an exact `Z2` parity; its `lambda_5` term splits the two real neutral fields `H` and `A`, breaking the inert-doublet continuous phase symmetry. The exact model therefore does not provide the conserved `U(1)` charge of the standard complex boson-star ansatz. A real-field oscillaton or a model with an approximate/extended charge would need a separate dynamical solution.

Using the published IDM mass relation, the neutral splitting implies

```text
lambda_5 = (m_H^2 - m_A^2) / v^2 = -1.3171e-5
delta / m_H = 3.4167e-7
```

The small breaking parameter may motivate studying approximate-charge configurations, but by itself does not demonstrate their stability or longevity.

## Self-interaction mass scale

For an indicative upper-scale check, apply the Colpi-Shapiro-Wasserman strong repulsive quartic result

```text
M_max ~= 0.22 sqrt(Lambda) M_Pl^2 / m
Lambda = lambda M_Pl^2 / (4 pi m^2)
```

with the unreduced Planck mass, `m=1080 GeV`, and the IDM neutral-field quartic identified with `lambda=lambda_2=4.06` under the `lambda_2 (H2†H2)^2` potential convention. The dimensionless strong-coupling parameter is about `4.50e31`, and the resulting complex-scalar proxy is

```text
M_max ~= 3.48e23 kg ~= 1.75e-7 solar masses
```

That proxy is about `2.29e13` times smaller than a `4e6 solar-mass` central object. A factor-of-few ambiguity in mapping quartic conventions changes the mass by only a square-root factor and cannot bridge this mass gap. This rules out the LZ best-fit TeV field as the same quartic-supported object if the target is a supermassive boson star. It does not rule out much smaller scalar condensates or ordinary particle IDM.

The formula is for a complex scalar with conserved charge and a repulsive quartic potential. The IDM neutral field is real, electroweakly charged before symmetry breaking, and coupled to the other inert components. Treat the number as a structural scale diagnostic only: it is not a computed IDM maximum mass, stability boundary, radius, or population constraint. A definitive IDM-star test would require solving the coupled Einstein-scalar/gauge system (or an explicitly justified low-energy real-field oscillaton model), including the `H-A` splitting and checking perturbative/thermal history and decay channels.

## Consequence for the joint hypothesis

This result strengthens the current two-component architecture: the LZ-sensitive `~TeV` IDM can be the particle-recoil component, while a separate ultralight field remains the plausible source of galactic-scale boson stars. It weakens the single-heavy-field bridge between LZ recoils and the repository's supermassive boson-star calculations. It does not solve the key missing bridge: no shared interaction yet predicts both the IDM recoil rate and the ultralight-field population/coherence response.

## Reproduction and sources

Run:

```powershell
python -B docs/research/casimir-dp-idm-heavy-field-bosonstar-scale-2026-09-25.py
```

The script writes the adjacent JSON with inputs, formulas, conversion constants, outputs and validity limits. Primary references: [the IDM LZ profile paper, arXiv:2609.06571](https://arxiv.org/abs/2609.06571); [Colpi, Shapiro & Wasserman, *Boson Stars: Gravitational Equilibria of Self-Interacting Scalar Fields*](https://journals.aps.org/prl/abstract/10.1103/PhysRevLett.57.2485); and the real-scalar oscillaton discussion in [Liebling & Palenzuela, *Dynamical Boson Stars*](https://link.springer.com/article/10.12942/lrr-2012-6).
