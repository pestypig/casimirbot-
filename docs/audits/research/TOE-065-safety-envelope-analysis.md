# TOE-065 Safety Envelope Analysis

## Scope
Establish safety envelopes for ideology-physics bridge contradiction handling via a matrix-oriented strict validation contract.

## Required Evidence Contract
- `provenance_class` ∈ `{measured, proxy, inferred}`
- `claim_tier` ∈ `{diagnostic, reduced-order, certified}`
- `certifying` ∈ `{true, false}`

## Envelope Categories
1. **Envelope A: Missing Contract Data**
   - Condition: any required field is absent.
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`

2. **Envelope B: Intrinsic Contract Contradiction**
   - Condition: `certifying=true` and (`claim_tier!=certified` or `provenance_class!=measured`).
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

3. **Envelope C: Duplicate-Path Contract Collision**
   - Condition: identical evidence path appears with non-identical contract fingerprints.
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

4. **Envelope D: Mixed Missing + Contradiction Inputs**
   - Condition: missing and contradiction events coexist.
   - Result: `FAIL`
   - Deterministic first fail: contradiction takes precedence over missing.

## Safety Assertions
- No certifying narrative may be emitted from proxy/inferred provenance.
- No certifying narrative may be emitted from non-certified claim tier.
- Path-level duplicate evidence must be fingerprinted to prevent semantic masking.

## Operational Validation Surface
- Runtime assembly and strict fail synthesis:
  - `server/services/helix-ask/relation-assembly.ts`
- Resolver evidence ingress:
  - `server/services/helix-ask/graph-resolver.ts`
- Regression harness:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`

## Residual Risk
- Upstream adapters that emit malformed or partial metadata can increase missing-envelope frequency.
- Conflicting replay snapshots can create burst collision events; deterministic first-fail IDs are required for triage stability.
