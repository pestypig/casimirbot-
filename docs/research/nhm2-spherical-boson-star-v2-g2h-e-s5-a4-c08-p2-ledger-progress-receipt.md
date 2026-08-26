Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: `P2 = P diamond P` adapter and manufactured fixture
Current maturity: candidate-neutral implemented; strict fixture 11/11 PASS; parent audit pending
Target maturity: independently audited `P2` ledger prerequisite for C08 history integration
Required frozen inputs: audited `P/Pprime`, exact derivative-convolution orientation and H2 engine
Required evidence: typed H2 parent PASS, independent source/runtime audit and replay
Stop/fail criteria: pointwise substitution, swapped derivative, lineage omission, sampling or authority
Explicit non-goals: candidate evaluation, complete C08, token, Rust, G3 or claims
Downstream gate unlocked: none until the shared H2 parent and this adapter are audited

# C08 `P2` ledger implementation progress receipt

Date: August 25, 2026

## Provisional decision

A separately named candidate-neutral adapter for the exact acknowledged
orientation

```text
P2 = P diamond P,
F=P,
G=P,
Gprime=Pprime=beta*B-(kappa+t)*V
```

is implemented and passes its strict manufactured fixture at `11/11`. The
adapter invokes the same selector-backed self-convolution engine used by H2,
with ordered dependencies `P,Pprime,B,V`. The last two ledgers are not operands
in this displayed convolution but are still validated and prefix-locked as
lineage evidence.

The fixture uses the lowest admitted origin order, 32, and exact manufactured
data `P=-1/2`, `Pprime=0`, `B=1`, `V=0`. It recovers `P2(0)=1/4`, validates the
published ledger, verifies a no-op replay, rejects mutation of the non-operand
lineage prefix, and rejects duplicate/colliding identities. Candidate
evaluations and positive samples remain zero; roots, handler linkage and
authority promotion remain false.

An earlier development fixture incorrectly shortened high-order source models
without moving discarded terms into a remainder. Its quarter-value assertion
failed and the shortcut was removed. It was candidate-neutral and created no
protected root. The exact manufactured replacement is the only passing P2
fixture evidence.

## Current identities

| Artifact | SHA-256 |
| --- | --- |
| Header | `37f24731e799273c547426c3937e51e9c0f6e9445e09066ccddaad24b33f08e5` |
| Implementation | `d3419563bda7bd8f499e7efa7336142e4c4edc9c02fd8a5569d1ed111c31eabe` |
| Fixture | `52ca130e08af442f8548dcf0c43b97630ba7ef92aab7570d8ab08d4b7289fa0` |
| Dockerfile | `6527604cfb815a23f8a4fdf63fce2eb0d6aa3a6df42bb4de6c7bd50de1a148f` |
| Fixture executable | `a41cfe1f6536cfb94446b70eacee2061b2d50cd9e6f2468c7a068ff7da41fe53` |

## Open parent gate

This receipt does not close P2. Its shared H2/self-convolution parent is still
under the corrected full-order candidate-neutral fixture evaluation and has
not yet emitted a typed result. Independent P2 audit and maturity promotion
must wait for that parent evidence. No candidate, proof, geometry/state, lane,
lamp, physical, propulsion or transport authority follows from this file.
