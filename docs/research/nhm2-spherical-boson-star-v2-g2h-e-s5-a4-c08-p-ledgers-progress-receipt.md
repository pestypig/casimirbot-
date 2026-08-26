Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: append-only analytic `P` and `Pprime` ledgers
Current maturity: candidate-neutral implementation and independent runtime audit PASS
Target maturity: audited prerequisite for `P2` and the complete C08 history callback
Required frozen inputs: coherent audited `B,V,J1,J2` ledgers and acknowledged parameter jets
Required evidence: exact identities, all-source prefix locking, atomic append and replay
Stop/fail criteria: partial pair commit, prefix mutation, cancellation, sampling or authority
Explicit non-goals: `P2`, complete C08, candidate execution, token, Rust, G3 or claims
Downstream gate unlocked: candidate-neutral `P2 = P diamond P` ledger realization only

# C08 paired `P`/`Pprime` ledger progress receipt

Date: August 25, 2026

## Decision

The candidate-neutral paired analytic-ledger prerequisite passes. The producer
constructs, validates, owns and publishes ordinal-aligned models for

```text
P      = -(kappa+t) B + (beta+1) J1
Pprime = beta B - (kappa+t) V
```

from the complete coherent `B,V,J1,J2` scalar prefix. Every existing model in
all four source ledgers is digest-locked before extension. `P` and `Pprime` are
both validated before the pair is committed, and prior publications remain
stable.

The implementation uses the independently audited 13-jet parameter producer
and degree-one analytic model product. Remainders are combined only through
directed upper magnitudes; signed remainder cancellation, midpoint selection,
point sampling, retry and retuning are not used.

## Evidence

- Strict isolated fixture: `14/14 PASS`.
- Independent recursive source/runtime audit: `52/52 PASS`.
- Two isolated read-only fixture replays were byte-identical at the JSON level.
- Manufactured prefix after one panel extension: `P=2` models and
  `Pprime=2` models.
- A mutation in the otherwise unused `J2` source was rejected, demonstrating
  that the complete four-ledger inventory—not only the operands appearing in
  the displayed identities—is bound.
- A changed `kappa` was rejected under the distinct typed parameter-identity
  failure.
- Candidate evaluations and positive parameter samples: `0`.
- Candidate roots, scientific handler linkage and authority promotion: false.
- Protected primary, independent, authorization and execution roots were
  absent before and after the audit.

## Identities

| Artifact | SHA-256 |
| --- | --- |
| Header | `33dc9af13aeb3f4ae11eb51e2ab51151d1fa75431a2c4f8731cac86ef954f1ae` |
| Implementation | `6556aba088ba0aa743f4f62d9ac87832b0820f8d5af8989b7c614e9af3589108` |
| Fixture | `12c1b73ef541e3504f9d5173d830eae4582c209ceacfafbdcf301f3ce53d1b7b` |
| Dockerfile | `20a6a1b15115014505f8b9f6bfc499ea77febad86004d4f591047efb7df45f8e` |
| Independent audit | `6f81f4017c472e82b8c36e03a823c17a29bafd36cc46ceb7fde47609a2ea30b7` |
| Fixture executable | `4ae93a2b47dd55b1697e14362e95ecebc61fedd50a0281747435b4b80e752c71` |

The audit-local image identity was
`sha256:90e8e808bfeef6a5313c27de8eafec5f5b8b29aba0b974f69fb20287f870051e`.
Its builder and runtime parents remain digest-pinned.

## Boundary

This is component implementation evidence only. It is not `P2`, a completed
C08 producer or handler, a candidate evaluation, a boson-star proof, an
accepted geometry/state, an SI/metric lane, or a lamp/physical/propulsion/
transport result. The frozen selected identity at `shat(0)=6/5`, all numerical
semantics, execution authority and every claim lock remain unchanged.
