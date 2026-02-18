# TOE-060 Safety Envelope Analysis

## Scope
Define deterministic strict-mode failure envelopes for ideology-physics bridge evidence when evidence metadata is missing or contradictory.

## Contract Fields
- `provenance_class` ∈ `{measured, proxy, inferred}`
- `claim_tier` ∈ `{diagnostic, reduced-order, certified}`
- `certifying` ∈ `{true, false}`

## Strict Envelope Rules
1. **Missing contract envelope**
   - Trigger: any bridge evidence entry lacks one or more required contract fields.
   - Strict result: `FAIL`
   - `fail_reason`: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`

2. **Contradictory contract envelope (intrinsic)**
   - Trigger: `certifying=true` and (`claim_tier!=certified` or `provenance_class!=measured`).
   - Strict result: `FAIL`
   - `fail_reason`: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

3. **Contradictory contract envelope (collision)**
   - Trigger: two or more bridge entries for the same evidence path carry non-identical contract fingerprints.
   - Strict result: `FAIL`
   - `fail_reason`: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

4. **Precedence rule for deterministic first-fail semantics**
   - If both contradiction and missing conditions are present, contradiction is selected first.

## Hazard Notes
- Missing metadata destroys auditability for epistemic confidence boundaries.
- Contradictory metadata can escalate diagnostic evidence into false certification narratives.
- Collision contradictions are especially high risk because path-level attribution appears stable while semantics diverge.

## Validation Surface
- Runtime: `server/services/helix-ask/relation-assembly.ts`
- Tests:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`
