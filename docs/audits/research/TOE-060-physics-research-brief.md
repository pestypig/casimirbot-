# TOE-060 Physics Research Brief

## Ticket
- ID: `TOE-060-ideology-physics-counterexample-hardening`
- Risk class: `physics_unknown`
- Primitive: Ideology-physics counterexample hardening

## Claim Under Test
Strict ideology↔physics bridge mode must return deterministic contradictory or missing fail reasons whenever bridge evidence contracts either conflict across duplicate evidence paths or omit required metadata.

## Contradiction / Missing-Evidence Envelopes
1. **Missing-evidence envelope**
   - Any bridge evidence entry is missing `provenance_class`, `claim_tier`, or `certifying`.
   - Strict mode must emit `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`.

2. **Contradictory envelope (single entry)**
   - `certifying=true` while either:
     - `claim_tier != certified`, or
     - `provenance_class != measured`.
   - Strict mode must emit `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.

3. **Contradictory envelope (cross-entry collision)**
   - Multiple bridge evidence entries target the same path but expose non-identical contracts.
   - Strict mode must emit `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.

## Counterexample Matrix
- CE-1: Missing contract fields on one bridge edge.
- CE-2: Contradictory certifying tuple on one bridge edge.
- CE-3: Same evidence path appears twice with conflicting tuples (e.g., diagnostic/non-certifying vs certified/certifying).

## Falsifiability Hooks
- Build relation assembly packet with `strictBridgeEvidence=true` and validate deterministic fail reason ordering.
- Validate non-strict mode preserves additive behavior (no strict fail reason).

## Source Mapping
- Runtime strict fail reason synthesis:
  - `server/services/helix-ask/relation-assembly.ts`
- Graph evidence contract ingress:
  - `server/services/helix-ask/graph-resolver.ts`
- Regression tests:
  - `tests/helix-ask-bridge.spec.ts`
  - `tests/helix-ask-graph-resolver.spec.ts`
  - `tests/ideology-dag.spec.ts`

## Maturity/Tier
- Recommended tier: `diagnostic`
- Rationale: hardening governs epistemic safety of cross-domain bridge claims, not certified physical viability.
