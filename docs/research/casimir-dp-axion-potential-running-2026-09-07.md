Program gate: S1 — axion matching prerequisites.
Workstream: Additive messenger potential running.
Capability or component: Mass and quartic counterterm ledger.
Current maturity: Conditional one-loop potential subset.
Target maturity: Explicit scale-consistent subset preceding field and full-amplitude matching.
Required frozen inputs: Messenger benchmark and canonical apparatus unchanged.
Required evidence: Background polynomial, derivative normalization and isolated scale cancellation.
Stop/fail criteria: No potential-only result represented as full beta functions or a new observable mass prediction.
Explicit non-goals: Field renormalization, complete hard gluon matching, scattering fit or certification.
Downstream gate unlocked: Fixed-field additive scale terms are available; full matching remains open.

# Messenger potential scale bookkeeping

The previous review made progress by comparing the same-parameter local/xenon ratios and selecting the axion reference for further completion work. Inspection confirms that the heavy gluon insertions and finite-momentum CP-even triangle have already been calculated. They must not be described as wholly missing. The remaining gluon gap is the complete hard matching and subtraction, while the scalar-potential gap includes field renormalization and a full set of boundary conditions.

This calculation extends the [mixed-portal threshold](casimir-dp-axion-messenger-threshold-2026-09-07.md) using the messenger structure in the [axion proposal](https://arxiv.org/html/2609.04186v1). Its purpose is to distinguish an arbitrary renormalization scale from genuinely unspecified model coefficients.

## Derivation

With real backgrounds, M=[[a,b],[ic,MU]], where a=yu h/sqrt(2), b=yL h/sqrt(2), c=yR A. Direct multiplication gives

`tr[(Mdag M)^2] = MU^4 + 2 MU^2(b^2+c^2) + a^4+b^4+c^4+2a^2(b^2+c^2)`.

In particular there is no b^2 c^2 term. This recovers the earlier absence of a logarithmic mixed quartic at yu=0. Restoring yu introduces an a^2 c^2 term; the cancellation is not a general protection of the portal.

For the numerical subset set yu=0 and use the same MS-bar fermion potential V1=-Nc sum[t^2(log(t/mu^2)-3/2)]/(16 pi^2). The light eigenvalue first contributes beyond quartic background order. With L=log(MU^2/mu^2), define

`delta V = dmA2 A^2/2 + dmH2 h^2/2 + dlA A^4/4 + dlH h^4/4 + dk A^2 h^2/4`.

The leading terms are

`dmA2 = -Nc yR^2 MU^2 (L-1)/(4 pi^2)`

`dmH2 = -Nc yL^2 MU^2 (L-1)/(8 pi^2)`

`dlA = -Nc yR^4 L/(4 pi^2)`

`dlH = -Nc yL^4 L/(16 pi^2)`

`dk = -Nc yL^2 yR^2/(4 pi^2)`.

These coefficients describe the background potential, not physical pole masses or the complete matched action. In particular dlA is a symmetry-breaking A-only term relative to the invariant complex-scalar quartic.

The additive fixed-field running needed to cancel explicit mu dependence is minus d(delta coefficient)/d log(mu). At fixed Yukawas its entries are respectively -Nc yR^2 MU^2/(2 pi^2), -Nc yL^2 MU^2/(4 pi^2), -Nc yR^4/(2 pi^2), -Nc yL^4/(8 pi^2), and zero. This is not the full beta-function system: anomalous dimensions, pre-existing quartics, other fields and diagrams must be included for that claim. No heavy particle is being evolved as a light degree of freedom below its threshold by this algebraic check.

## Benchmark and consequence

At MU=2 TeV, yL=0.20, yR=0.0032 and mu=MU, the isolated potential contributions are dmA2=3.11259 GeV^2, dmH2=6079.27 GeV^2, dlA=dlH=0 and dk=-3.11259e-8. Zero quartic thresholds at this chosen scale do not imply zero running or absence of the corresponding counterterms. The mass contributions are scheme-dependent potential terms; the physical masses remain the prescribed inputs once their renormalization conditions are imposed. They are not added to the frozen benchmark as observable shifts.

Evaluating at mu=MU/2, MU and 2MU and including the corresponding isolated running leaves each boundary-plus-loop coefficient invariant. Thus changing mu alone cannot tune this subset away consistently. Independent finite boundary terms remain model choices, and must be shared by both target predictions.

The next missing ingredient in this sector is field/parameter matching: the messenger couples directly to A, so treating the invariant radial and pseudoscalar sectors as automatically identical after renormalization is not justified. The small yR^4 additive quartic does not bound terms involving pre-existing quartics times wavefunction corrections. Full scattering amplitudes and gluon matching also remain unfinished. No updated joint rate is claimed from a potential-only calculation.

The [script](casimir-dp-axion-potential-running-2026-09-07.py) and [JSON](casimir-dp-axion-potential-running-2026-09-07.json) pass three checks: direct matrix traces at 30 background points, high-precision second derivatives of the loop potential, and isolated scale cancellation. `npm run validate:physics:root-leaf` passes. The goal and S1 remain open; no certificate or physical-validation claim applies.
