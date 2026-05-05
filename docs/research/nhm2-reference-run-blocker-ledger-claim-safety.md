# NHM2 Reference-Run Blocker Ledger Claim Safety

The NHM2 blocker ledger is an evidence index, not a validation announcement. Its job is to bind one frozen run to the artifacts that currently support or block any future claim promotion.

Allowed language:

```text
NHM2 has a frozen reference-run validation-hardening ledger that identifies source-to-geometry, observer, QEI, provenance, tensor-authority, and reproducibility blockers without promoting validation claims.
```

Forbidden language:

```text
NHM2 is validated.
NHM2 has a full warp passing solve.
NHM2 proves a physical GR-plus-quantum transport mechanism.
NHM2 demonstrates ambient faster-than-light transport.
A GREEN certificate overrides full-loop review blockers.
```

The ledger must keep:

```text
validationClaimAllowed = false
physicalMechanismClaimAllowed = false
promotionAllowed = false
```

## Ledger Meaning

A pass, review, or fail ledger only says whether the validation-hardening artifact chain is internally clean for the frozen run. It does not prove the tile source is physically available, does not prove a GR-plus-quantum transport mechanism, and does not override observer, QEI, source-closure, or reproducibility blockers.

The useful output is the blocker sequence:

```text
validation scaffolding -> frozen evidence chain -> blocker ledger -> targeted blocker retirement
```

## Certificate Boundary

Certificate GREEN or ADMISSIBLE fields are non-promotional unless every relevant full-loop and reference-run validation gate passes. A green certificate on top of source, observer, QEI, or provenance review remains a ledger fact, not a promotion fact.

## Literature Boundary

External papers are context, guardrails, and constraints. They do not validate NHM2. The literature claim map must preserve support and non-support tags for every source used by this ledger chain.
