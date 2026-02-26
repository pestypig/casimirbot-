# Ownership Maturity Utility Batch Prompts

Date: 2026-02-25  
Repo: `pestypig/casimirbot-`  
Anchor: `docs/ownership-maturity-ladder-v1.md`

## Batch 1

Goal: manifest + policy decision logging spine.

Constraints:
- additive changes only
- preserve deterministic reason codes
- preserve certainty parity and evidence parity
- preserve local-first storage assumptions

Tasks:
1. add `RunManifest.v1` schema + writer
2. add `PolicyDecisionLog.v1` JSONL writer
3. wire into voice + mission context + training trace write paths
4. add replay determinism tests for fixed timestamps

Adversarial:
- same request, same policy timestamp, same replay context => same decision and reason

## Batch 2

Goal: operationalize evidence envelope and claim nodes.

Constraints:
- content-addressed evidence
- missing evidence fails closed with typed reason
- no certification claims for heuristic-only evidence

Tasks:
1. add `EvidenceEnvelope.v1` registry
2. add claim node store aligned with `docs/knowledge/dag-node-schema.md`
3. expose minimal ownership evidence/claim endpoints
4. add tests for immutability + missing evidence rejection

Adversarial:
- claim references unknown evidence id and must be blocked deterministically

## Batch 3

Goal: certified-only promotion and production publish gate.

Constraints:
- deterministic typed rejection reasons
- promotion gate is enforceable and non-optional for production publish path
- backward-compatible with existing knowledge sync flows

Tasks:
1. implement `PromotionDecision.v1` lifecycle (`proposed -> verified -> promoted|rejected`)
2. require verified/certified promotion inputs for production publish
3. add rejection reason codes for non-certified or missing verification
4. add route-level and integration tests

Adversarial:
- diagnostic-tier request attempts production publish and must reject deterministically

## Conditional Hardening

Goal: replay bundle integrity.

Tasks:
1. export `ReplayBundle.v1` (manifest + evidence + claims + decisions + traces)
2. verify bundle on import with hash checks
3. reject tampered imports with stable integrity mismatch reason

Adversarial:
- one-byte mutation in bundle evidence must trigger deterministic integrity failure

