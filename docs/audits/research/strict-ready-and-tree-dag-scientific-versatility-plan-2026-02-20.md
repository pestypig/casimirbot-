# Strict-ready and tree/DAG scientific versatility plan

**Target deliverable path:** `docs/audits/research/strict-ready-and-tree-dag-scientific-versatility-plan-2026-02-20.md`  
**Repo scope:** `pestypig/casimirbot-`  
**Snapshot source:** `docs/audits/toe-progress-snapshot.json`

## Executive summary

This repo has completed the recent P2 atomic-proxy build steps, and now the remaining system-level problem is release-governance alignment plus routing versatility hardening.

Current snapshot state is:
- `strict_ready_release_gate.status = blocked`
- `blocked_reasons = ["missing_verified_pass"]`
- `blocked_ticket_count = 66`
- `ready_ticket_count = 34`
- `math_congruence_gate.status = pass`

The key issue is semantic coupling in strict-ready accounting: the release blocker named `missing_verified_pass` currently tracks the strict-ready delta (tier-based), not only actual verification failures. In the same snapshot, only 9 tickets are truly unverified; 57 are verified diagnostic tickets that are being counted in the same blocker bucket.

For Helix Ask tree/DAG versatility, the main opportunity is no longer adding rails; it is aligning existing rails with node authoring and matrix metadata so cross-lane routes either succeed with full equation/uncertainty/citation contracts or fail deterministically.

## Current state

### Snapshot-derived counts

From `docs/audits/toe-progress-snapshot.json`:
- `tickets_total = 100`
- `tickets_with_evidence = 91`
- `claim_tier_counts = { diagnostic: 57, reduced-order: 34, certified: 0 }`
- `strict_ready_progress_pct = 34`
- `strict_ready_delta_ticket_count = 66`
- `strict_ready_release_gate.blocked_ticket_count = 66`
- `strict_ready_release_gate.ready_ticket_count = 34`
- `strict_ready_release_gate.blocker_counts.missing_verified_pass = 66`
- `math_congruence_gate.status = pass`

### True verification gap

Ticket-level snapshot entries show only 9 `verification_ok = false` tickets:
- `TOE-080-life-answer-quality-threshold-pack`
- `TOE-082-evidence-falsifier-ledger-lane`
- `TOE-083-tool-plan-tool-execution-contracts-lane`
- `TOE-084-orbital-ephemeris-provenance-lane`
- `TOE-085-physics-root-lanes-spacetime-semiclassical`
- `TOE-086-physics-root-lanes-entropy-information`
- `TOE-087-physics-root-lanes-prebiotic-biology-runtime-safety`
- `TOE-088-robotics-recollection-lane-promotion`
- `TOE-089-external-integrations-lane-promotion`

So the release blocker label is currently wider than the real verification deficit.

### Tree/DAG versatility baseline

Relevant surfaces:
- Resolver policy: `configs/graph-resolvers.json`
- Walk resolver: `server/services/helix-ask/graph-resolver.ts`
- Relation rails: `server/services/helix-ask/relation-assembly.ts`
- Equation registry: `configs/physics-equation-backbone.v1.json`
- Congruence matrix: `configs/math-congruence-matrix.v1.json`
- Physics trees: `docs/knowledge/physics/*.json`

Observed profile:
- Deterministic fail rails are strong.
- Equation/citation rails exist and are actively enforced.
- Versatility bottlenecks come from policy-authoring mismatch and uneven node metadata quality, not missing infrastructure.

## Bottlenecks

1. Release gate semantic mismatch:
- `missing_verified_pass` currently behaves like a strict-ready tier delta bucket.

2. Equation-binding guard breadth vs authored nodes:
- Bridge/derived nodes can be blocked for missing equation refs when not consistently authored for that contract.

3. Cross-lane uncertainty validation activation:
- Relation assembly checks exist, but matrix row metadata must stay aligned for those checks to fire consistently.

4. Over-block defaults without targeted breadth controls:
- Strict conservative traversal protects safety, but can reduce scientific route breadth unless supported by richer high-quality bridge metadata.

## Remediation batches

### Batch A: Release-gate truthfulness and verified-pass closure

Goal:
- Make `missing_verified_pass` represent real verification gaps.
- Close the 9 truly unverified tickets.

Primary files:
- `scripts/compute-toe-progress.ts`
- `scripts/toe-agent-preflight.ts`
- `docs/audits/ticket-results/*.json`
- `docs/audits/toe-progress-snapshot.json` (generated)

Expected delta:
- If semantics are corrected and 9 missing results are produced with PASS+integrity, blocker count can reduce from 66 to 0 for verified-pass gate semantics.

### Batch B: Routing versatility uplift under strict rails

Goal:
- Improve cross-lane route quality without weakening deterministic fail safety.

Primary files:
- `server/services/helix-ask/graph-resolver.ts`
- `configs/graph-resolvers.json`
- selected tree files in `docs/knowledge/physics/*.json`

Expected delta:
- Better valid path yield for equation-bound bridges.
- Stable fail reasons where metadata is missing.

### Batch C: Anti-pseudo-rigor hardening for broader scientific prompts

Goal:
- Ensure broad query families are uncertainty/citation-governed and fail closed when metadata is insufficient.

Primary files:
- `server/services/helix-ask/relation-assembly.ts`
- `configs/math-congruence-matrix.v1.json`
- `docs/knowledge/math-claims/*.json`
- helix ask regression tests

Expected delta:
- Higher reliability in cross-lane scientific reasoning under strict evidence contracts.

## Disconfirmation criteria

1. If project policy intentionally defines release readiness as reduced-order-only, then Batch A must preserve that naming and add a separate verified-pass gate metric.
2. If bridge nodes are intentionally equation-bound by design, then the required work is metadata authoring breadth (not guard narrowing).
3. If uncertainty checks are intentionally deferred pending schema migration, Batch C must be treated as v2 schema rollout with compatibility logic.

## Next-step recommendation

Execute Batch A first because it removes governance ambiguity, then run B and C for capability uplift. Keep deterministic fail semantics and maturity ceilings unchanged unless explicit promotion evidence is added.