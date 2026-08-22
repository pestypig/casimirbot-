# NHM2 spherical-boson-star v2 G2B-M5-R1 result record

Program gate: G2B-M5-R1 — exact projection evidence completion  
Workstream: lambda-zero proof-center recovery  
Capability or component: independent coefficient and residual admission  
Current maturity: independently verified core-duty PASS  
Target maturity: immutable handoff to remaining G2B classical proof duties  
Required frozen inputs: M5 receipt, M3 center, frozen MPFR solve engine  
Required evidence: exact nu replay, coefficient hashes, residual equality  
Stop/fail criteria: any exact mismatch would have produced a falsifier  
Explicit non-goals: candidate admission, full branch proof, authority  
Downstream gate unlocked: G2B replacement classical proof attempt

## Independent result

The sole M5-R1 command completed once and wrote:

- raw receipt SHA-256
  `41b1fcd261f17b722197ccfd3bcc2e116c1941194c63c52712a28d7f5cd80d83`
  / 12,888 bytes;
- domain-separated self-hash
  `c37c0a329765c558c99e559bfede6aed815244f372d289085953f7aed097d1a8`;
- decision `INDEPENDENT_CORE_DUTY_PASS`;
- selected mode count 128;
- no first failure, no projection rerun, no candidate solve, and no retune.

An external reimplementation of the receipt self-hash matched exactly.

## Exact checks

The verifier replayed only the frozen 4- and 8-substep nonlinear solves and
persisted both exact 256-bit `nu` values plus their normalized difference. The
difference is below the unchanged `2^-40` cross-refinement limit.

For each fixed mode count 128, 256, and 512, the verifier:

- parsed all persisted coefficient dyadics;
- independently recomputed both coefficient-wire hashes and sizes;
- applied its own exact-rational Chebyshev derivative/value implementation;
- applied the compactified radial first/second derivative chain rule;
- recomputed the normalized Schrödinger residual exactly;
- required fraction-for-fraction equality to the immutable M5 result;
- re-evaluated the unchanged residual, node, join, and endpoint thresholds.

All three stored residuals matched exactly and all three modes remained
eligible. The unchanged lowest-eligible rule independently selected 128.

## Meaning

This closes the specific lambda-zero proof-center/core-representation failure
that motivated G2B-M1 through M5-R1. It is a legitimate passing result under
the unchanged rail and preregistered selection rule; it is not a full classical
branch proof and admits no candidate.

The next gate must still perform the remaining authenticated G2B duties:
four-grid branch solves and convergence, vacuum connection, no-fold/continuum
positivity, boundary remainders, residual replay, and terminal N=256 receipt.
All proof, execution, diagnostic-lamp, physical, propulsion, and transport
authority remains false.
