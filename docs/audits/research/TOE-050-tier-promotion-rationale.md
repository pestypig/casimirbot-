# TOE-050 Tier Promotion Rationale: Ideology ↔ Physics Bridge

## 1) Claim under evaluation

Ticket: `TOE-050-ideology-physics-bridge-tier-promotion-pack`.

Promotion target: allow ideology/ethos-to-physics bridge statements to move from pure narrative support toward **reduced-order** claims *only* when bridge evidence has complete provenance metadata and deterministic strict-mode gating remains intact.

## 2) Assumptions and bounds

- Scope is limited to Helix Ask bridge assembly and graph resolver paths:
  - `server/services/helix-ask/relation-assembly.ts`
  - `server/services/helix-ask/graph-resolver.ts`
  - `server/routes/ethos.ts`
- Strict mode (`strictBridgeEvidence=true`) is the promotion gate.
- Evidence contract completeness requires all bridge-evidence metadata fields:
  - `provenance_class`
  - `claim_tier`
  - `certifying`
- Missing metadata must not crash or silently over-claim; it must downgrade to deterministic fail semantics in strict mode.

## 3) Falsifiable acceptance criteria

A promotion candidate is **rejected** unless all criteria pass:

1. Strict-mode deterministic fail reason is emitted when bridge evidence metadata is incomplete.
   - Required fail reason: `IDEOLOGY_PHYSICS_BRIDGE_EVIDENCE_MISSING`.
2. Non-strict behavior remains backward compatible when metadata is incomplete.
   - `fail_reason` remains undefined in non-strict mode.
3. Graph resolver behavior remains deterministic under bridge/congruence traversal constraints.
   - No nondeterministic edge selection in validated fixtures.

## 4) Source mapping (source → code path → test path → gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Bridge evidence metadata contract (`provenance_class`, `claim_tier`, `certifying`) | `server/services/helix-ask/relation-assembly.ts` | `tests/helix-ask-bridge.spec.ts` | Ticket required tests + Casimir verify |
| Strict-mode deterministic bridge failure taxonomy | `server/services/helix-ask/relation-assembly.ts` | `tests/helix-ask-bridge.spec.ts` | Ticket required tests + Casimir verify |
| Resolver deterministic bridge/cross-tree behavior | `server/services/helix-ask/graph-resolver.ts` | `tests/helix-ask-graph-resolver.spec.ts` | Ticket required tests + Casimir verify |
| Ideology DAG evidence + provenance defaults | `server/routes/ethos.ts` (surface), ideology services | `tests/ideology-dag.spec.ts` | Ticket required tests + Casimir verify |

## 5) Tier recommendation

- **Recommended tier now: `diagnostic` with promotion guardrails.**
- Rationale:
  - Deterministic strict-mode failure behavior is proven by tests.
  - Backward-compatible non-strict default is preserved.
  - Evidence completeness gating exists, but bridge evidence remains mixed-provenance and not certifying by default.
- Promotion to `reduced-order` may be approved per-query only when strict evidence contract completeness is satisfied end-to-end.
