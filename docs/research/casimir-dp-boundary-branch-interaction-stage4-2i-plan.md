# Casimir-DP Stage-4.2I boundary--branch interaction plan

## Purpose

Stage 4.2I makes the four-cell comparison discussed in the study executable
without changing the frozen regularized Diósi law or treating a Casimir
boundary as part of that law. It is downstream of, and may not mutate,
Stage 4.2B through Stage 4.2H.

## Frozen cells and primary observable

The cell order is
`reference__branch_control`, `reference__separated`,
`active__branch_control`, `active__separated`. Each cell supplies normalized
complex coherence (C_{bq}=C_{bq}(t)/C_{bq}(0)). The primary interaction is

\[
R_\times=\frac{C_{11}C_{00}}{C_{01}C_{10}},\qquad
I_\times=-\ln|R_\times|,\qquad
\Phi_\times=\arg R_\times .
\]

The registered ordinary response is removed as
(R_{\times,{\rm corr}}=R_{\times,{\rm obs}}/R_{\times,H_0}). The additive
complex double contrast is reported as a secondary diagnostic. A saturated
four-cell generalized least-squares fit must agree with the simple factorial
interaction in the frozen whitened coordinate system.

## Packet custody

Both boundary states must bind the same branch construction through measured
packet centers, full (3\times3) center-of-mass covariances, overlap,
separation uncertainty, momentum difference, hold time and jitter,
preparation fidelity, and content-addressed trajectory and tomography
artifacts. The identical-branch control and separated-branch state must each
pass their own geometry gates. (R_{\rm sphere}), the Diósi regularization
length (R_0), and packet width (\sigma_{\rm CM}) remain distinct model
quantities.

## Falsifiers and fail-closed rules

- Reject nonsymmetric, non-finite, or non-positive covariance.
- Reject low-coherence cells for which logarithmic amplitude/phase propagation
  is unstable.
- Reject branch geometry or packet custody that differs across boundary states
  beyond frozen tolerances.
- Reject any implementation in which the standard DP exponent changes with
  boundary state without a separately registered transfer kernel.
- Require injected interaction recovery and rejection of packet mismatch,
  low-coherence, covariance, and boundary-dependent-DP adversarial fixtures.
- Never fit the frozen DP law or ordinary confirmatory response to obtain a
  favorable interaction.

## Claim ceiling

A synthetic pass establishes only estimator recovery, covariance propagation,
packet-schema enforcement, and content-addressed reproducibility. A measured
nonzero cross-ratio first supports a boundary--branch interaction after the
ordinary model is defeated; it does not alone identify objective collapse,
Penrose manifold dynamics, or a Casimir-to-collapse mechanism. Those claims
remain blocked without frozen scaling tests, replication, and a separately
sourced transfer kernel.

## Canonical execution

```text
npm run casimir:dp:stage4-2i
npm run test:casimir:dp:stage4-2i
```

The canonical synthetic authority is
`casimir-dp-boundary-branch-interaction-stage4-2i-v1-20260805T160000000Z`.
