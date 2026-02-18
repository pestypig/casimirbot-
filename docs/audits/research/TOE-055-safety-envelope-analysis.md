# TOE-055 Safety Envelope Analysis

## Scope
This envelope defines deterministic strict-mode behavior for ideology-physics bridge evidence contracts in Helix Ask relation assembly.

## Envelope Definition
Bridge evidence contract fields:
- `provenance_class` in `{measured, proxy, inferred}`
- `claim_tier` in `{diagnostic, reduced-order, certified}`
- `certifying` in `{true, false}`

### Eligibility for strict bridge pass
A bridge evidence entry is strict-eligible when:
1. All three contract fields are present.
2. If `certifying=true`, then both of the following hold:
   - `claim_tier=certified`
   - `provenance_class=measured`

## Deterministic Downgrade Policy
1. **Missing metadata path**
   - Condition: any bridge evidence entry omits one or more contract fields.
   - Strict verdict: `FAIL`
   - firstFail / fail_reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`

2. **Contradictory metadata path**
   - Condition: bridge evidence sets `certifying=true` but does not satisfy
     `claim_tier=certified` and `provenance_class=measured`.
   - Strict verdict: `FAIL`
   - firstFail / fail_reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

3. **Non-strict compatibility path**
   - Condition: strict mode is disabled.
   - Behavior: additive metadata tolerated; no strict fail reason emitted.

## Hazard Notes
- Contradictory certifying metadata can induce overclaim risk by conflating diagnostic evidence with certified status.
- Missing metadata hides epistemic limits, making relation claims non-auditable.
- Strict deterministic fail reasons preserve reproducibility for gate triage and training-trace analytics.

## Validation Hooks
- Relation assembly enforcement:
  - `server/services/helix-ask/relation-assembly.ts`
- Bridge contract tests:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`
