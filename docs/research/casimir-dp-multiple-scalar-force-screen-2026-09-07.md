# Can multiple scalar mediators evade the ordinary-force screen?

Program gate: S1. Exploratory analytic extension of a previously computed screen.

The user prioritizes measurable signals in both experiments. Inspection of the older stable Yukawa packets shows that their long-range percent-level cases already failed the stated ordinary-force screen. Repeating that scan would not resolve the obstruction. This packet tests a specific proposed extension: several healthy, linearly coupled, unscreened real scalars.

## Equal masses and identical ordinary charges

Let scalar i have real couplings gchi_i to dark matter and gN_i to the same nucleon-density operator. With a common mediator mass, define

alpha_chi = sum_i gchi_i²/(4 pi),
alpha_N = sum_i gN_i²/(4 pi),
alpha_chiN = sum_i gchi_i gN_i/(4 pi).

For two identical nucleon sources the potential is -alpha_N exp(-ms r)/r. Each scalar contribution has a squared visible coupling, so flipping a mediator's visible-coupling sign does not turn that identical-source attraction into repulsion. Different mediators can interfere destructively in dark-matter scattering, but cannot cancel the identical-source scalar force in this class.

Cauchy–Schwarz gives alpha_chiN² <= alpha_chi alpha_N. At fixed total dark coupling budget alpha_chi<=1, the minimum ordinary force for a requested dark/ordinary coupling product is therefore the same as in the single-scalar screen. Alignment of the two coupling vectors saturates the inequality; misalignment increases the required ordinary force. Adding degenerate mediators does not evade this result.

The qualification 'total' is essential. Bounding every gchi_i separately while allowing unlimited species is a different assumption. A larger total coupling budget changes the inequality's numerical consequence and demands its own loop, unitarity, self-interaction and cosmological audit. No universal species bound is asserted here.

## Mixing and unequal masses

In a canonically normalized, healthy real-scalar sector with positive mass-squared eigenvalues, G(q)=(q² I+M²)^(-1) is positive definite for spacelike momentum. The amplitudes obey

|gchi^T G gN|² <= (gchi^T G gchi)(gN^T G gN).

A field rotation or mass mixing cannot make the identical-source quadratic form negative. In position space each mass eigenstate contributes -gN_i² exp(-mi r)/(4 pi r). Unequal masses still cannot cancel identical-source attraction point by point. However, experimental constraints on a sum of ranges must be calculated with the actual apparatus geometry; one single-range exclusion number is not automatically a complete multi-range bound.

## Transport of existing numerical screen

Under the equal-mass, common-charge and total-alpha_chi<=1 assumptions, the older 1 TeV benchmark's force-screen margins transfer unchanged:

| Scalar mass | Minimum ordinary force / inherited conservative ceiling |
|---|---:|
| 0.001 eV | 9.938926e+12 |
| 0.01 eV | 1543246 |

These are inherited conditional screening margins, not a newly fitted confidence interval. Their source and assumptions are recorded in `casimir-dp-yukawa-force-screen-2026-09-06.md` and JSON. This packet extends the algebraic coupling argument; it does not strengthen or remeasure the force limits. The finite-phase coherence calculation remains in its original packet.

## Decision and next actual escape to test

Deprioritize adding only unscreened same-charge scalars as a way to rescue the existing large-signal benchmark at fixed total coupling budget. The earlier generic caveat allowing multi-mediator models did not establish that every such model evades the force screen; this identifies a subclass that does not.

A scalar plus a vector can have opposite force signs between like ordinary charges, unlike the scalar-only class. That is a concrete different lead. It must match coupling ratios and ranges across compositions, retain its dark-matter amplitude, and pass equivalence-principle, plasma, transport and radiative-stability checks. A force cancellation in one material or at one distance cannot be presumed to hold in all relevant tests. Nonlinear screening and different target operators are also outside this proof, but must be derived explicitly.

This result does not eliminate the measurable-both objective, establish a general no-go theorem, or admit a scalar-vector model. It avoids reopening a tested scalar-only mechanism under a different name. No frozen apparatus, runtime, GR, or certificate surface changed.

## Reproduction

The inequalities above follow directly by applying ordinary Cauchy–Schwarz to the coupling vectors, or to G^(1/2) times those vectors. The table copies the two minimum_over_screen_ceiling fields from the authenticated source JSON; no new numerical fit or simulation is involved.

Source JSON SHA256: `8d9c3bb9f1adf98b246cbe094bf4fcad6777644fc85f627af640700dcb4a50f4`.
