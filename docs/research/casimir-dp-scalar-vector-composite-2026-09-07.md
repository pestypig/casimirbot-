# Scalar–vector cancellation and composite motion

Program gate: S1. Exploratory consistency diagnostic; no short-range experimental exclusion.

## Primary-source finding

[Alves, Jankowiak and Saraswat, 0907.4110v1](https://arxiv.org/html/0907.4110v1), section IV.3, examine the different velocity dependence of scalar and vector forces and its impact on composite matter. Their equation (16) gives a Fermi-gas estimate

b(Z,N)=<gamma-1> approximately 0.03 [Z^(5/3)+N^(5/3)]/(Z+N)^(5/3).

This supplies a diagnostic of composition-dependent kinematic corrections, not a symmetry protecting a cancellation. Their long-range gravity and binary-pulsar numerical bounds must not be imported into our 20–200 micrometer-range mediators. Different range and radiation thresholds require a new calculation.

## Application as a diagnostic only

Subtract the carbon-12 b value, 0.01889881575, to illustrate what a carbon-calibrated cancellation would have to account for in other isotopes:

| Isotope | b minus b(C12) |
|---|---:|
| O16 | 0 in this approximation |
| Be9 | 1.29681e-4 |
| Al27 | 1.44031e-5 |
| Ti48 | 7.29309e-5 |
| Xe131 | 3.24022e-4 |
| Xe136 | 4.45748e-4 |

Equal proton/neutron ratios give the same b in this Fermi-gas expression; the oxygen zero is not an exact physical composition equality. This simplified model omits detailed nuclear wavefunctions, binding derivatives, electron contributions and finite-momentum response.

For perspective the Xe131 difference is about 500 times the 6.48e-7 residual tolerance inferred for the old 0.01 eV point, and 3.22e9 times the 1.01e-13 tolerance of the 0.001 eV point. These ratios compare two diagnostics. They are not predicted net force ratios or confidence exclusions; the simple b difference cannot replace a source/test-body force calculation.

## Effect on lead selection

No protecting scalar–vector construction for ordinary matter was established in this search. The mathematical possibility of matching static couplings remains, but it is insufficient to transport that match across nuclei and kinematic regimes. A candidate must predict composite scalar and vector matrix elements at the precision demanded by its individual forces, not assume that matched free-nucleon charges stay matched after binding.

This also matters directly for the requested two-target comparison. The diamond and xenon response cannot be assigned a common cancellation factor simply because both contain nucleons. Their isotope composition, momentum transfer and operator matrix elements differ. Conversely, this diagnostic does not prove that all symmetry-based completions are impossible. It sets the next evidence requirement: an explicit interaction with a controlled composite matching calculation, including the nonstatic terms, before selecting a claimed detectable point.

Deprioritize an unprotected scalar–vector fine-tuning scan. Keep a symmetry-protected construction as an unestablished possibility and consider other operator or medium-response mechanisms if none can meet this requirement. The user's measurable-both priority remains unchanged; no local-null benchmark is promoted to fulfillment.

Run the companion script to reproduce equation (16), isotope differences and comparison ratios. It authenticates the inherited force-screen inputs and checks the equal-N/Z relation. This is an arithmetic/model diagnostic only. No apparatus baseline, runtime, GR or certificate was modified.

- `py` SHA256: `de26bed6ade50e951091c53ca226642dd066c13f6d9b6e39b5c1ce15a650f241`
- `json` SHA256: `3a17b3f47f9bb8847b9689bc1dc267bd8d6270af3744e289b92ffe5da5527a7b`
