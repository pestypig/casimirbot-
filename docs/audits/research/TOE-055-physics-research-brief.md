# TOE-055 Physics Research Brief

## Ticket
- ID: `TOE-055-ideology-physics-counterexample-research-bridge`
- Risk class: `physics_unknown`
- Primitive: Ideology-physics counterexample research bridge

## Claim Being Evaluated
Cross-domain ideology↔physics bridge evidence can support relation narratives only when bridge evidence metadata is complete and internally consistent. The runtime must conservatively downgrade strict bridge claims whenever evidence is missing or contradictory.

## Assumptions and Bounds
1. Bridge narratives are epistemic integrations, not direct physical proofs.
2. Any bridge evidence that marks `certifying=true` must be paired with:
   - `provenance_class = measured`
   - `claim_tier = certified`
3. Missing metadata (`provenance_class`, `claim_tier`, or `certifying`) is treated as incomplete bridge evidence.
4. Contradictory metadata (e.g., `certifying=true` with `claim_tier=diagnostic` or `provenance_class=proxy`) is treated as unsafe for strict claims.

## Counterexamples Driving Conservative Policy
1. **Missing contract metadata**
   - A bridge node provides `scope/path` but omits one or more contract fields.
   - Strict mode result must deterministically fail with `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`.
2. **Contradictory certifying signal**
   - A bridge node provides `certifying=true` while still tagged `diagnostic` or `proxy`.
   - Strict mode result must deterministically fail with `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.
3. **Non-strict compatibility path**
   - The same metadata defects in non-strict mode must remain additive/diagnostic and avoid hard fail reasons.

## Falsifiable Acceptance Criteria
1. Strict mode + missing metadata => deterministic `FAIL` with missing-evidence reason.
2. Strict mode + contradictory metadata => deterministic `FAIL` with contradictory-evidence reason.
3. Non-strict mode with these defects => no strict fail reason.

## Source Mapping
- Runtime bridge packet assembly + strict fail selection:
  - `server/services/helix-ask/relation-assembly.ts`
- Bridge metadata normalization:
  - `server/services/helix-ask/graph-resolver.ts`
- Contract tests:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`

## Tier Recommendation
- Recommended tier: `diagnostic`
- Rationale: bridge evidence supports conservative cross-domain reasoning but does not establish certified physics validity.
