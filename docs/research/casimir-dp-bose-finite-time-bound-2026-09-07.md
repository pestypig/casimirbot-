# Finite-time stimulated contact-density envelope

Exploratory S1 calculation, September 7, 2026. This addresses the cold-state
loophole in the preceding occupation screen, within an explicit interaction.

## Model and derivation

Define the nonrelativistic Hamiltonian H_int = C integral n_target(x)
n_chi(x) d³x, with C in GeV^-2. This fixes the coefficient convention without
assuming its identity with a relativistic mediator coupling. Take a rigid,
nonnegative target charge density with integral Q, and a homogeneous,
number-diagonal Gaussian boson state with occupation f(p). No anomalous
correlations or coherent mean field are included. Use natural units and
the measure [dp]=d³p/(2 pi)³, so n=integral[dp] f(p).

The occupation-dependent noise and finite-time structure are motivated by
[the primary open-system calculation](https://arxiv.org/html/2606.00237v1),
equations 19 and 22–24. The following bound is our independent second-order
density-Hamiltonian calculation, not a quoted experimental limit.

For constant separation d over duration T, the connected stimulated term is

    D_B = C² integral[dp][dp'] f(p) f(p') |F(p-p')|²
          * [1-cos((p-p')·d)] * |I_T(Ep-Ep')|²,
    I_T(omega) = integral_0^T dt exp(i omega t).

The factor follows from the one-half noise cumulant and the squared
branch-potential difference 2[1-cos]. It is the f*f part only; the spontaneous
term proportional to f is separate. The formula is second order in C and
assumes the fixed trajectories and weak backreaction used in the model.

Use |I_T|<=T and |F|<=Q. The remaining nonnegative pair integral is exactly

    integral[dp][dp'] f(p)f(p')[1-cos((p-p')·d)]
      = n² - |integral[dp] f(p) exp(i p·d)|² <= n².

Therefore D_B <= C² Q² T² n². No long-time delta function is needed. This
bound holds for an arbitrary nonnegative integrable momentum distribution
within the stated Gaussian-state model, including drift. It is not a
statement about all quantum states, interacting condensates or arbitrary
long-range potentials. A momentum-dependent coefficient would require its
own finite supremum or a weighted calculation.

For f proportional to exp[-|p-pc|²/s²], retain the sharper multiplier
1-exp[-s²d²/2]. At fixed n, narrowing this distribution reduces this upper
envelope rather than creating a divergent stimulated term. The drift drops
out of this envelope, although it can change the actual finite-time response.

## Frozen-apparatus benchmark

Use the hash-checked sphere mass and 0.25 s hold, with the ideal-carbon
isoscalar charge proxy Q=mass/atomic_mass_unit. At rho=0.3 GeV/cm³ and
m=100 GeV the result is

    D_B <= 2.65847e-18 * [C/(1 GeV^-2)]².

For the previous Gaussian whose peak occupation is one, the sharper value
is 2.17157e-28 times that same coefficient factor. Neither coefficient
normalization is an allowed xenon parameter point. The envelope scales as
rho²/m² at fixed apparatus and C; increased terrestrial density cannot be
assumed without a supply and spatial-distribution calculation.

## Disposition

This removes the occupation-only divergence as a rescue mechanism for this
contact model at fixed density and finite hold. It does not bound total
decoherence, give a xenon fit, or exclude a physically supplied dense cloud.
Preparation/recombination segments and the canonical boundary readout remain
outside this constant-hold calculation. A claimed shared model still needs
its microscopic C matching, actual population, ordinary scattering term,
target response and constraints.

The companion script verifies the frozen input hash and the pair identity
by independent Gaussian quadrature at three widths. JSON preserves the
normalization, charge approximation and mass dependence. These checks support
this calculation only, not physical viability or certification.
