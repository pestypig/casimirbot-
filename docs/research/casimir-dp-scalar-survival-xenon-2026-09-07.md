# Scalar transition: jointly optimized survival and xenon rate

Program gate: S1. Exploratory no-replenishment screen, not an experimental exclusion.

## Shared physical coupling

Use the physical pseudoscalar dark transition g12 ubar_1 i gamma5 u_2 and ordinary scalar target charge gA=gN mA/(0.939 GeV). The latter is a mass-charge proxy with a Helm spatial form factor; matching to a complete universal scalar at finite momentum remains open. Parent mass M=m+delta, mediator mass 1 eV, and the preceding mass splittings are held fixed. Both the tree decay and scattering use g12.

The leading heavy-target differential cross section is

d sigma/dER = g12² gN² mA (mA/mN)² F² (delta²+q²) / [8 pi M² v² (q²+ms²)²], q²=2mA ER.

The delta²+q² factor is the transition pseudoscalar spin trace. Unlike the earlier vector-contact kernel, it cannot be dropped. The code folds the previous isotope inventory and shifted truncated halo, using parent M in flux and reduced mass. This remains leading nonrelativistic kinematics, not a precision relativistic recoil likelihood. Total halo density is conditionally 0.3 GeV/cm³ and the exposure is 2.84 tonne-years.

## Population optimization

For an initially excited fraction f0<=1, no subsequent source and constant vacuum decay rate Gamma=x Gamma_unit, with x=g12², the scattering normalization is proportional to x exp(-A x), A=age Gamma_unit/hbar. This has an exact maximum 1/(e A) at A x=1. Thus no arbitrary choice of a smaller transition coupling can increase the no-source rate beyond the reported maximum. This uses the reference age 13.8 Gyr; a recently produced population is outside its scope.

| Dark mass | Maximum raw Xe events for gN<=1 | Maximum for gN<=4 pi | Raw 200–269.9 keV maximum for gN<=4 pi |
|---|---:|---:|---:|
| 40 GeV | 4.22988e-14 | 6.67956e-12 | 3.39316e-12 |
| 100 GeV | 3.04485e-13 | 4.80824e-11 | 1.00337e-11 |

These are unaccepted truth-window integrals from 5.4 to 269.9 keV. They are not an upper bound on detector-accepted counts, do not include response migration and do not give a confidence exclusion. Coupling caps 1, sqrt(4 pi), and 4 pi are declared scan assumptions, not measured bounds or rigorous perturbativity criteria. In particular the largest cap is not a claim that a perturbative, externally allowed ordinary-matter model exists there. Values are conditional leading-kernel envelopes under those assumptions.

The unit-coupling integrals in JSON are normalization coefficients; g12=gN=1 is not an admitted physical benchmark. Formally reaching one raw event at the survival optimum would require gN around 4.86 million or 1.81 million. Those numbers flag the failure of this extrapolation and must not be treated as viable strong-coupling solutions.

## Decision

At these two fixed masses and 1 eV mediator mass, reducing g12 to preserve a primordial excited population does not restore an appreciable xenon rate within the declared caps and leading model. This is stronger than observing a short lifetime at a single point. It does not exclude an explicit production source, a different mass/mediator point, nonperturbative dynamics or an alternative operator.

Do not invest in another local-coherence tuning of this no-source transition pilot. A continuation of this branch needs a quantitatively specified source and a recalculation of its incident distribution; otherwise prioritize a protected elastic candidate or the separate vector-transition model. Such candidates still require all common-target and external constraints. No gravitational interpretation follows.

Run the companion Python script. It authenticates both the inherited response definitions and decay JSON, recomputes the scalar transition spectrum and applies the analytic survival optimum. Positive nested energy windows are checked. The calculation is a new leading-order kernel, not an independent experimental fit or complete material prediction. No frozen baseline, runtime, GR or certificate was modified.

- `py` SHA256: `468ff39faca9d90a2049a3aea2c6149af7152284a968ee00983278b6e3019f6a`
- `json` SHA256: `00db0753b8107ebcf5b92aa3da5a362756adf676aea1eb115577ef8d0dda1bfb`
