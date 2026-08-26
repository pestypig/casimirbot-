Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: C08 analytic internal parameter jets for P/Pprime
Current maturity: candidate-neutral implementation and independent runtime audit PASS
Target maturity: audited analytic prerequisite for real P/Pprime and P2 ledgers
Required frozen inputs: acknowledged Borel growth/quadrature and state-jet definitions
Required evidence: exact 13-jet algebra, ordered Hessians, strict margins, offline replay
Stop/fail criteria: formula drift, omitted mixed orientation, sampling, roots or authority
Explicit non-goals: H2/P/P2 completion, C08 handler, candidate execution, Rust or G3
Downstream gate unlocked: candidate-neutral P/Pprime ledger realization only

# C08 analytic parameter-jet progress receipt

Date: August 25, 2026

## Result

The separately versioned primary implementation now realizes the acknowledged
internal parameter tuples without loading a selected state:

```text
positive theta = (h0,kappa,mu)
vacuum theta   = (h0,kappa,Mbar_infinity), eta fixed
beta+1         = mu*(1/kappa-2*kappa)
```

It produces the value, three first derivatives, and all nine ordered second
derivatives of `kappa`, `mu`, and `beta+1` in the frozen 13-component order.
The reciprocal is solved in value/first/second order and replayed against the
unit product before the beta jet is admitted.

The manufactured primary fixture passes `10/10` in the digest-pinned offline
Arb/FLINT/GMP/MPFR runtime. The independent source/runtime audit passes
`37/37`; its two restricted executions return identical reports. Candidate
evaluations and positive parameter samples are zero, protected roots remain
absent, and scientific-handler and authority fields remain false.

## Identity binding

| Artifact | SHA-256 |
| --- | --- |
| Header | `1ec56b59596d49f15cfc3e8ac3dbbb84a645cd051c929c6554db0496301f2fbf` |
| Implementation | `3f4804425edb8a9cf13eddc25ee589b41bbe5f081876891798b1c2faf06799ce` |
| Fixture | `43be69140570947fc4fd8058fa7bbdcbc68eda0393d1f2640f0139c53935620e` |
| Dockerfile | `da60ff03bcdff78412ad4dfbe48a93607a389ff2008bbe78b0e1f0645400011d` |
| Independent audit | `118c0646d57f112033e35b60d80a99beb21296cca0f0b60c5eaba81a87a4eee1` |
| Executable | `000141ac0867f402a9737aaea2dd69744ff0040c82c6a7051136999540900017` |

The audit-local image identity is
`sha256:fda169bcda64f575c3979ebafde1daec46867631a0b8e531fcfd5d466a05c7be`.
Its builder and runtime parents remain digest-pinned by the Dockerfile.

## Boundary

This receipt closes only the analytic parameter-jet prerequisite. It does not
claim that P, Pprime, P2, H2, the complete C08 producer, or any scientific
handler is complete. It changes implementation evidence and component proof
maturity only; mathematical semantics, runtime/receipt authority, candidate
identity, execution authority, and every claim authority remain unchanged.
