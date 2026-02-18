# TOE-072 Physics Research Brief

## Ticket
- ID: `TOE-072-ideology-physics-bridge-adversarial-pack`
- Risk class: `physics_unknown`
- Primitive: Ideology-physics bridge adversarial pack

## Objective
Define an adversarial validation pack for ideology↔physics bridge evidence that proves deterministic strict-fail classification under contradiction, missing metadata, and mixed replay conditions.

## Claim Under Test
For strict bridge evidence mode, contradiction classes must map to deterministic fail reasons and preserve stable precedence (`CONTRADICTORY` before `MISSING`) across replay order permutations.

## Adversarial Class Matrix
1. **A1: Missing metadata only**
   - Evidence tuples omit one or more required contract fields.
   - Expected fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`.
2. **A2: Intrinsic contradiction**
   - `certifying=true` paired with non-certified claim tier or non-measured provenance.
   - Expected fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.
3. **A3: Duplicate-path contradiction**
   - Same evidence path appears with incompatible contract fingerprints.
   - Expected fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.
4. **A4: Mixed missing + contradiction**
   - Missing tuples coexist with contradiction tuples.
   - Expected deterministic precedence: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_CONTRADICTORY`.
5. **A5: Replay permutation stability**
   - Permute evidence ingestion order across multiple replays.
   - Expected fail reason invariant for identical semantic sets.

## Falsification Hooks
- Add strict classifier harness asserting A4/A5 across rotated replay orders.
- Verify strict fail reason does not regress to `MISSING` when contradiction evidence is present.
- Preserve non-strict mode additive behavior (`fail_reason` unset) for incomplete metadata.

## Maturity / Claim Tier
- Recommended claim tier: `diagnostic`
- Rationale: adversarial pack validates deterministic policy behavior and not physical admissibility certification.
