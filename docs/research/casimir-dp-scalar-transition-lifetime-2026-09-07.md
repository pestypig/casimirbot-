# Real scalar emission from the nonuniversal dark transition

Program gate: S1. Exploratory population consistency screen.

## Physical vertex and exact width

The diagnostic symmetry-breaking Yukawa in the previous universal-selection packet is imaginary off-diagonal after the positive-mass Takagi rephasing. Use the physical transition amplitude M=g ubar_1 i gamma5 u_2, with parent mass M=m+delta and scalar mass ms. This vertex convention removes ambiguity from writing a Majorana Lagrangian with a factor one-half. It is not a scalar ubar_1 u_2 vertex.

The spin-averaged trace yields |M|²=g²[(M-m)²-ms²]. The outgoing momentum is

p=sqrt([delta²-ms²][(M+m)²-ms²])/(2M).

For delta>ms, Gamma=g² p (delta²-ms²)/(8 pi M²). For delta<=ms this two-body channel is closed. In the small-splitting limit Gamma approaches g²(delta²-ms²)^(3/2)/(8 pi m²). This is a leading tree decay calculation, not a complete total width. Extra channels can only shorten the lifetime at fixed parameters; interference corrections to this channel require their own calculation.

## Diagnostic results

Use the authenticated epsilon=delta/4, Lambda=500 GeV, zero-asymmetry entries of the preceding packet, with ms=1 eV. These are unchanged illustrative points, not couplings fitted to xenon.

| Dark mass | Physical transition g | Lifetime | g giving lifetime 13.8 Gyr |
|---|---:|---:|---:|
| 40 GeV | 5.03126e-7 | 102.631 s | 7.72369e-15 |
| 100 GeV | 2.75650e-7 | 12993.6 s | 4.76137e-14 |

The leading-width expansion agrees with the exact two-body kinematics within 6.29e-5 and 1.38e-5 fraction, respectively. The reference age is 4.3549488e17 seconds. For an initially excited, unreplenished population with constant decay rate, its remaining fraction is exp(-age/tau); age/tau is approximately 4.24e15 and 3.35e13. Thus this primordial-population interpretation fails overwhelmingly at the diagnostic couplings. This does not exclude later production or a sourced steady state.

## Consequence for the shared prediction

A visible-universal scalar combined with this nonuniversal dark vertex cannot assume a surviving excited halo at these points. Smaller g suppresses both real decay and the corresponding xenon transition, requiring the same scalar ordinary-matter coupling and population to be carried through a new rate calculation. Replenishment needs an explicit source, transport and energy account. Closing decay by ms>=delta changes the mediator range and cannot be silently substituted into the 1 eV coherence calculation.

The transition is pseudoscalar on the dark line and scalar on the matter line. Its spin trace in scattering contains delta²+q². Consequently the previous vector-contact xenon normalization is not applicable. Do not reuse its inferred event count or multiply it only by a Yukawa ratio. Elastic diagonal scalar scattering is another channel and must also be included.

Decision: the nonuniversal dark addition restores a tree transition but reopens a fast real-decay obstruction. The next admissible calculation needs either an explicit excited-state source with a shared pseudoscalar transition spectrum, or a different candidate with a protected population. No common model has been validated, and the frozen apparatus remains unchanged.

Run the companion Python script to reproduce the exact widths, expansion check and survival-scale coupling. It authenticates the prior selection JSON. These calculations do not certify a cosmological population, detector response or experimental exclusion.

- `py` SHA256: `2af0c80d886ea880172a39421bec16a725bff114aae00caea746d687d5bb995d`
- `json` SHA256: `a7aa2e7186204c906e0fef1d901cac3cdaafd5ab45ca7304bb9b778ecd3fd38e`
