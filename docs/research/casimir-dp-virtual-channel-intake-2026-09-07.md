# Virtual-state elastic scattering: next mechanism specification

Date: 2026-09-07. Exploratory lead intake and validity gate; no fitted model.

## Evidence and model

[Batell, Pospelov and Ritz, Direct Detection of Multi-component Secluded WIMPs](https://arxiv.org/html/0903.3396), equations 22-24, calculate second-order elastic scattering through a virtual excited state. Their intermediate propagator contains the splitting and kinetic energies; replacing it by a constant requires a sufficiently large splitting. Their model couples through kinetic mixing. Nuclear charge coherence in that calculation does not establish neutral-diamond coherence. Their historical bounds and excited fractions are not adopted as present measurements or universal populations.

Use an explicit two-channel Hamiltonian H=[[T,U],[U_dagger,T+delta]], initially in the lower state with delta positive. Eliminating the upper channel gives the energy-dependent operator U_eff(E)=U(E-T-delta+i0)^-1 U_dagger. For E<delta and free positive T this is negative semidefinite. In the additional large-gap/local approximation it becomes -U U_dagger/delta. The overall sign follows the Hamiltonian elimination; an amplitude sign convention in a paper must not reverse this energy shift.

The replacement by -U squared/delta is not automatic from a small external momentum transfer. Intermediate momentum samples the interaction and material response. High intermediate kinetic energies, target excitations or an open channel require the full resolvent. With a closed free upper channel, its operator norm is at most 1/(delta-E); this alone does not justify replacing it everywhere by 1/delta.

## Kinematic benchmark

At m_dark=100 GeV and speed 776 km/s, the whole-sphere infinite-target relative energy is 335.006 keV. A nominal Xe-131 nuclear mass of 131 times 0.93149410242 GeV gives maximum endothermic splitting 184.120 keV. These are diagnostic masses, not a natural-isotope detector calculation.

Therefore a globally closed upper channel for the rigid sphere, delta>335.006 keV, is also closed for real Xe excitation at this speed. A new joint model in that regime must predict elastic xenon and elastic diamond from the same second-order interaction. It cannot retain a first-order xenon normalization. A trial gap of 10 MeV gives E/delta=0.0335 for the sphere, but remains only a possible benchmark: intermediate momenta and potential strength must still be checked.

## Consequences for the requested bridge

The prior signed-splitting obstruction does not forbid virtual elastic scattering because the outgoing particle returns to its initial state. Conversely, the earlier electric-charge first-order closure bounds cannot automatically be applied to this second-order kernel. Squaring the total microscopic potential produces same-site and different-site terms and requires a two-insertion target response. Squaring the net neutral charge or importing a nuclear Z-fourth-power scaling for the whole sphere is not a material calculation.

This lead does not rescue the already-demoted B-L products. Use a separately specified microscopic operator with common dark/ordinary couplings, mediator mass, splitting and state abundance. Kinetic mixing is a concrete literature model to examine; it still needs neutral-atom screening and present external constraints.

Next executable gate: derive the second-order neutral-carbon response with its momentum convolution and resolvent, validate against the nuclear result in the relevant limit, then normalize xenon and propagate that same normalization to the sphere. Reject uncontrolled contact approximations, independently normalized channels and unsupported coherent atom-count powers. Local apparatus sensitivity and the full LZ likelihood remain unestablished.

No frozen inputs or proof/certificate authority changed. This is a new calculation route, not an achieved prediction model.
