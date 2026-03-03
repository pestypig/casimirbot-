# Helix Ask Keyless Chain Baseline (2026-03-03)

- Execution mode: `DEV_KEYLESS`
- Scope: Prompt 0 intake and baseline lock (`no code patching`)

## Baseline source artifacts

1. Retrieval attribution runbook baseline (run `retrieval-ablation-1772577942359`):
   - `docs/runbooks/helix-ask-retrieval-attribution-ablation-2026-03-03.md`
   - `artifacts/experiments/helix-ask-retrieval-ablation/retrieval-ablation-1772577942359/summary.comparison.json`
2. Objective plan delta statement for intent/relation bottleneck:
   - `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`

## Locked baseline metrics

### Routing / relation bottleneck

- `intent_id_correct_rate`: `0`
- `intent_mismatch` count: `90`
- `relation pass_rate`: `0`

These values are the bottleneck-chain baseline noted in the active retrieval attribution analysis for the current malfunction class.

### Retrieval bottleneck (latest ablation)

From `retrieval-ablation-1772577942359` baseline variant (`baseline_atlas_git_on`):

- `recall@10`: `0.011364`
- `consequential_file_retention_rate`: `0.011364`
- `MRR@10`: `0.001894`

## Likely relation-routing miss ownership (files/symbols)

Primary suspects for relation-family routing misses:

1. `server/services/helix-ask/intent-directory.ts`
   - `WARP_ETHOS_RELATION_COUPLED_RE`
   - `INTENT_PROFILES` entry `hybrid.warp_ethos_relation`
   - `matchHelixAskIntent()` scoring / `requiresAllMatchers` gates
2. `server/services/helix-ask/topic.ts`
   - `TOPIC_PATTERNS.ideology`
   - `TOPIC_PATTERNS.helix_ask`
   - Topic allowlist/deboost path families influencing relation evidence lanes
3. `server/services/helix-ask/arbiter.ts`
   - `resolveHelixAskArbiter()` (`repoOk`/`hybridOk` threshold and clarify fallback logic)

## Prompt 1 target hypothesis

Improve deterministic routing for relation/repo-technical asks by tightening matcher coverage and preserving existing payload contracts.
