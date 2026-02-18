# TOE-065 Physics Research Brief

## Ticket
- ID: `TOE-065-ideology-physics-contradiction-matrix-pack`
- Risk class: `physics_unknown`
- Primitive: Ideology-physics contradiction matrix pack

## Objective
Define a deterministic contradiction matrix for ideology↔physics bridge evidence so strict mode can classify conflicting tuples, rank first-fail outcomes, and preserve non-strict additive behavior.

## Claim Under Test
Given bridge evidence records that carry `{provenance_class, claim_tier, certifying}` contracts, strict bridge validation must return deterministic fail reasons for contradiction classes and never elevate uncertified or non-measured evidence to certifying narratives.

## Contradiction Matrix Dimensions
1. **Intrinsic tuple contradictions**
   - `certifying=true` with `claim_tier!=certified`
   - `certifying=true` with `provenance_class!=measured`
2. **Cross-entry collisions**
   - Same evidence path appears with different contract tuples.
3. **Missing-contract contradictions**
   - One or more required contract fields absent.
4. **Mixed contradiction sets**
   - Missing and contradiction conditions appear in same packet; deterministic first-fail precedence is required.

## Matrix Cases
- CM-1: Missing one required field on a bridge edge.
- CM-2: Missing multiple required fields on a bridge edge.
- CM-3: Intrinsic contradiction (`certifying=true`, `claim_tier=diagnostic`).
- CM-4: Intrinsic contradiction (`certifying=true`, `provenance_class=proxy`).
- CM-5: Duplicate path with disagreeing tuples.
- CM-6: Duplicate path with three entries, one missing fields and one contradictory tuple.

## Deterministic Outcome Contract
- Missing-only cases return: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`
- Any contradiction case returns: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`
- Mixed cases prioritize contradiction first for stable first-fail behavior.

## Falsifiability Hooks
- Build strict-mode relation assembly fixtures spanning CM-1..CM-6 and assert deterministic first fail IDs.
- Assert collision fingerprinting on path-level duplicates catches semantic drift even when path strings match.
- Assert non-strict mode does not emit strict contradiction fail reasons.

## Maturity / Claim Tier
- Recommended tier: `diagnostic`
- Rationale: this pack governs safety classification and contradiction detection, not physical admissibility certification.
