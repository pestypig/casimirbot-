# Pseudo-Goldstone boson-star and IDM mediator compatibility screen

Date: September 25, 2026. This packet tests an explicit symmetry-protected UV architecture for the ultralight boson-star field and the heavy IDM state. It is a conditional compatibility screen, not a chosen dark-sector model, a boson-star solve, or a coupled relic calculation.

## Candidate UV structure

Let a real triplet `X=(X1,X2,X3)` have an approximate global `O(3)` symmetry,

`L_X = 1/2 (partial X)^2 - lambda_X/4 (X^2 - f^2)^2 - mu^2/2 (X1^2+X2^2)`,

with `mu << f`. The vacuum points along `X3`, spontaneously breaking `O(3)` to rotations of `(X1,X2)`. The two light modes can be written as a complex field `phi=(X1+i X2)/sqrt(2)` with a residual conserved `U(1)` charge. The small soft term gives them a common mass while preserving that `U(1)`. The radial mode has `m_s^2=2 lambda_X f^2` in the zero-soft-breaking limit.

The renormalizable portals allowed by these symmetries include both `V_portal=(kappa_1/2) X^2 H1†H1+(kappa_2/2) X^2 H2†H2`; both must be retained in a complete model. In the nonlinear low-energy description, radial exchange generates a derivative interaction of order

`C_derivative (partial phi* partial phi)(H2†H2)`, with `C_derivative ≈ 2 kappa_2/m_s^2 = kappa_2/(lambda_X f^2)`.

This provides a concrete route to a shift-protected derivative portal while retaining a complex low-energy field. It also makes the radial mass and portal rate dependent on the same parameters.

## Boson-star scale and freeze-out requirements

The target ultralight field mass is `m_phi=1e-17 eV`, and the illustrative stable mini-boson-star reference is `M=4.02e6 Msun`. For the standard attractive axion-like dilute-star scaling, `Mmax ≈ 5.97e-12 Msun (m_phi/1e-5 eV)^-1 (f/1e12 GeV)` at the model-dependent coefficient set to one. Reaching the target mass therefore asks for `f ≈ 6.7e17 GeV`, about `0.28` of the reduced Planck scale; this puts the target at the approximate maximum dilute-star mass, so a stable margin asks for a larger `f`. This is a scaling proxy: the exact `O(3)/O(2)` soft-breaking potential must be inserted into the Einstein-Klein-Gordon equations and solved before treating this as an actual stable star.

The preceding derivative-portal screen found that `Gamma/H≈20` at the IDM freeze-out benchmark would require `C_derivative≈8.75e-8 GeV^-2`. Use that as the target coefficient, `m_H=1080 GeV`, and the most optimistic mediator mass `m_s=2m_H=2160 GeV` (the threshold is not a controlled contact limit). Matching then requires `kappa_2≈0.204`, while `lambda_X=m_s^2/(2f^2)≈5.1e-30`. The portal loop estimate `delta lambda_X≈kappa_2^2/(16 pi^2)≈2.6e-4` exceeds the tree quartic by about `5.1e25`.

There is an even larger mass-threshold issue in this normalization: `kappa_2 X^2/2` shifts the IDM-doublet mass-squared by `delta m_H^2≈kappa_2 f^2/2`. Avoiding cancellation at the target `f` requires `kappa_2<=5.1e-30`, versus `0.204` required for the portal rate, a factor `4.0e28`. At `m_s=2m_H`, that bound gives `C_derivative<=2.2e-36 GeV^-2`, also short of the target by `4.0e28`. The Higgs portal `kappa_1` has its own vev-induced Higgs-mass threshold and must be treated as a parameter rather than omitted.

Conversely, requiring `lambda_X` not to be smaller than this one-loop correction and `m_s>=2m_H` bounds the derivative coefficient to `C_derivative<=1.22e-20 GeV^-2`, about `7.2e12` below the freeze-out target. If the target coefficient is imposed while saturating the loop-sized radial quartic, the inferred radial mass is only `0.30 eV`, so integrating it out at TeV freeze-out is invalid. O(1) matching factors cannot close this gap.

## Decision and limits

This rejects the minimal weakly coupled linear-sigma realization as a natural, heavy-mediator bridge between an Sgr A*-scale attractive pNGB star and the TeV IDM abundance: the heavy-doublet vev threshold alone demands about 28 orders of cancellation, and radial-quartic naturalness independently leaves the derivative coefficient at least 12 orders too small. It does not reject tuned versions, different symmetry-breaking sectors, strongly coupled or multi-field completions, nor alternative boson-star potentials. Such variants need new explicit calculations rather than a change of label.

The key caveat is the boson-star estimate: the quoted dilute axion-star bound is for a periodic attractive pNGB potential, whereas the proposed `O(3)/O(2)` model has a specific soft-breaking potential. The star's mass-radius curve, stability, self-interaction, and formation must be solved in that exact potential. The current result is a parameter-scale veto for one natural UV architecture, not a theorem about all pNGB boson stars. The full boundedness/vacuum conditions, Higgs mixing and collider limits, and loop matching for both portals have not been evaluated.

Even a surviving mediator would produce relativistic `phi phi*` pairs at freeze-out. It would not produce the cold coherent charged component by itself. A complete model must additionally explain the cold `phi` abundance, compute the coupled `H` relic and local phase space, predict the gamma-ray spectrum, fold the LZ response, and calculate a material response for Casimir-DP. The already screened IDM channels remain insufficient for measurable Casimir-DP decoherence.

Reproduce with `python -B docs/research/casimir-dp-png-boson-star-mediator-compatibility-2026-09-25.py`; the adjacent JSON stores the assumptions and scale comparison. Key sources: [Olivares et al., stable mini-boson-star reference](https://arxiv.org/abs/1809.08682); [Guerra, Macedo and Pani, axion-boson-star solutions](https://arxiv.org/abs/1909.05515); [dilute axion-star mass scaling](https://doi.org/10.1103/PhysRevD.111.023011).

Status: one explicit symmetry-protected UV route has been quantitatively disfavored under perturbative/no-cancellation assumptions. No unified prediction model is selected; the overall goal remains active.
