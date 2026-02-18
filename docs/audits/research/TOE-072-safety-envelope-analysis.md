# TOE-072 Safety Envelope Analysis

## Scope
Safety envelope for strict ideology-physics bridge evidence under adversarial and replayed evidence sets.

## Required Contract Fields
- `provenance_class` ∈ `{measured, proxy, inferred}`
- `claim_tier` ∈ `{diagnostic, reduced-order, certified}`
- `certifying` ∈ `{true, false}`

## Envelope Definitions
1. **Envelope M (Missing)**
   - Condition: at least one required field absent and no contradiction class present.
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`

2. **Envelope C1 (Intrinsic contradiction)**
   - Condition: `certifying=true` with `claim_tier!=certified` and/or `provenance_class!=measured`.
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

3. **Envelope C2 (Cross-entry contradiction)**
   - Condition: same evidence path has multiple non-identical contract fingerprints.
   - Result: `FAIL`
   - Fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`

4. **Envelope CX (Mixed)**
   - Condition: missing and contradiction classes both exist.
   - Result: `FAIL`
   - Precedence rule: contradiction must dominate missing under all replay permutations.

## Determinism Requirements
- Strict fail classification must be order-insensitive for semantically identical evidence sets.
- Replay permutations must produce a single stable first-fail class.
- Non-strict mode must remain backward-compatible and additive.

## Validation Surface
- Runtime strict classifier and relation assembly:
  - `server/services/helix-ask/relation-assembly.ts`
- Adversarial replay and precedence regression checks:
  - `tests/helix-ask-bridge.spec.ts`
- Supporting ingress/evidence normalization checks:
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`

## Residual Risks
- Upstream partial metadata emitters can increase `MISSING` frequency.
- Multi-source evidence collisions can spike contradiction rates; deterministic classing is required for triage consistency.
