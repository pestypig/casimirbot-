# Two-light-scalar bubble: finite momentum drift

Program gate: S1 — shared matching and response consistency.
Workstream: Quadratic scalar channel and loop control.
Capability or component: Subtraction-independent spacelike coefficient difference.
Current maturity: One-loop Gaussian-light-field diagnostic.
Target maturity: Identify when tree matching is insufficient across experimental scales.
Required frozen inputs: Authenticated portal tradeoff family; local radius scale and representative xenon momentum.
Required evidence: Symmetry factor, counterterm cancellation and independent loop integral evaluation.
Stop/fail criteria: No absolute amplitude from an arbitrary subtraction; no strong-coupling endpoint admitted using only tree identities.
Explicit non-goals: Full renormalized portal, thermal medium attenuation, resummed prediction or general exclusion.
Downstream gate unlocked: One-loop matching/renormalization conditions before strong-coupling admission; S1 remains open.

## Decision

The restricted parameter family that reduced the classical-force confinement threshold to 276.5 kHz has a significant loop-control problem. At that endpoint, the two-light-scalar bubble contribution changes by 1.546 times the tree heavy contact coefficient between q = 0.714 eV and q = 250 MeV. Even within a representative xenon recoil window, its change is approximately 15.4% of that coefficient.

The endpoint therefore cannot be treated as a controlled tree-level solution merely because |ychi| squared is below the declared 4 pi boundary and its conditional Higgs yield passes. The original weaker-coupling point has much smaller drift, approximately 0.128%, but retains its severe classical-force requirement. This does not exclude the portal: it identifies the need for loop-consistent matching before claiming that the strongest force-reduction points preserve the full two-experiment prediction.

## Why a channel remains when the linear vertex vanishes

In a homogeneous restored region phi_bar = 0, the interactions include

    L contains -achi phi^2 (chi-bar chi)/2 - aN phi^2 (N-bar N)/2.

The two-light-scalar vertices do not vanish. In a Gaussian light state, the connected correlator of the quadratic operator is <phi^2(x) phi^2(y)>_connected = 2 D(x-y)^2. Two identical internal scalar lines give the corresponding bubble diagram its factor 1/2 when using the two-scalar vertex rules -i achi and -i aN.

This is separate from scattering off a classical mean field. It is also not a complete material density-fluctuation response: medium occupation, damping, collective correlations and density matching can change the physical transport channel. The present calculation is a vacuum loop diagnostic at a declared stable scalar mass.

Scalar bubble integrals and their regulated ultraviolet coefficients are part of the standard one-loop integral basis; see [Ellis and Zanderighi, primary reference](https://arxiv.org/abs/0712.1851). The portal normalization and the particular coefficient comparison below are derived here.

## Finite difference and the matching identity

For two identical scalar propagators of mass m, define

    B(q) = integral_0^1 dx log[1+x(1-x) q^2/m^2]
         = 2 sqrt(1+4m^2/q^2) asinh(q/(2m)) - 2.

This is the positive logarithmic function for spacelike momentum magnitude q. The underlying regulated bubble also contains a divergent constant and a subtraction-dependent finite constant. They cancel in a difference at two momenta. With the stated vertex conventions, the coefficient difference is

    delta C(q_hard)-delta C(q_soft)
      = -achi aN [B(q_hard)-B(q_soft)]/(32 pi^2).

The reported drift is its absolute magnitude. It is not a scheme-independent absolute delta C at one momentum, and it does not fix the full renormalized contact coefficient.

Using the tree identity achi aN = 2 Delta_lambda C gives

    |delta C(q_hard)-delta C(q_soft)|/|C|
       = Delta_lambda [B(q_hard)-B(q_soft)]/(16 pi^2).

Choose q_soft = hbar c/R = 0.714170 eV from the frozen sphere radius and q_hard = 250 MeV as a representative hard recoil momentum. The homogeneous stable light mass is explicitly benchmarked at 0.001176 eV. The difference is 39.3471353, close to 2 log(q_hard/q_soft). It is a diagnostic across two momentum scales, not an assertion that both apparatuses share an identical homogeneous scalar state.

A second comparison uses q = sqrt(2 mA ER) for a representative mA = 122 GeV and ER = 5.4–269.9 keV. Its logarithmic difference is 3.91165257. This is not a full xenon isotope or detector-response recast.

## Tradeoff-family results

| b (GeV) | Delta_lambda | Drift/C across local-to-hard scales | Drift/C within representative Xe window | Tree-only confinement threshold |
|---:|---:|---:|---:|---:|
| 100 | 0.005129 | 0.001278 | 0.0001271 | 9.618 MHz |
| 30 | 0.054996 | 0.013703 | 0.001362 | 2.937 MHz |
| 10 | 0.493383 | 0.122936 | 0.012222 | 0.981 MHz |
| 3 | 5.48004 | 1.36545 | 0.135745 | 0.294 MHz |
| 2.81921 | 6.20538 | 1.54619 | 0.153712 | 0.277 MHz |

The final column is copied for context from the authenticated tree force tradeoff; it is not newly certified after loop corrections. A declared 10% cross-scale drift diagnostic would require Delta_lambda <= 0.401335. That tolerance is a calculational screening choice, not a physical exclusion, and it does not imply every other correction is below 10%.

The large drift concerns the contact-like two-scalar contribution. It is not automatically the relative error of the total low-momentum amplitude, where one-light exchange can dominate, nor a direct change in the classical force by the same factor. What fails is the assumption that constant tree matching alone establishes a quantitatively controlled shared model at the enlarged portal couplings.

## Absolute matching and transport still required

The earlier ultraviolet-completion proposal supplied tree parameters, but it has not fixed all one-loop renormalization conditions and finite counterterms. A local counterterm can anchor a coefficient at one scale; it cannot erase this nonanalytic momentum difference at both scales by choosing a constant. Higher-derivative operators, other diagrams, physical mass/coupling matching and possible resummation must be handled consistently in a full completion.

At q much smaller than the heavy masses, the quadratic-vertex EFT isolates this light-loop dependence. Extrapolating its subtraction-free difference is not the same as computing the full heavy propagator with its self-energy and renormalization conditions. The light mass benchmark likewise does not supply a finite-temperature spectral density or establish a restored wall background everywhere.

Consequently this packet does not yet calculate the wall's stochastic opacity. It identifies a required step before such an opacity can be predicted at the force-reduction endpoint. The original weak-coupling heavy-column result remains a component calculation with a small bubble drift, but full light-medium response remains open.

## Verification and priority

Run `C:\Python313\python.exe docs/research/casimir-dp-portal-pair-loop-drift-2026-09-07.py`. Four checks pass: numerical Feynman-parameter integration versus the closed form, the logarithmic hard limit, cancellation of an arbitrary common subtraction reference, and ordering of the two momentum spans. The adjacent JSON records all values and the explicit 10% diagnostic.

Prioritize loop-consistent matching or a lower-coupling region before treating the 277 kHz tree endpoint as a viable improvement. The classical force, actual confinement, connected medium response and full xenon light-channel issues remain unresolved. The frozen baseline is unchanged; S1 and the user goal remain active.
