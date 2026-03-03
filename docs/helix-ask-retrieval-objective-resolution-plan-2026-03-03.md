# Helix Ask Retrieval Objective Resolution Plan (2026-03-03)

## Objective
Resolve the current Helix Ask retrieval malfunction where socially framed prompts are routed to weak or wrong evidence clusters, producing generic answers instead of repo-grounded ideology responses.

## Build Context Policy
Use this plan as the active context document for Helix Ask retrieval patches until this malfunction class is closed.

Per-patch validation order:
1. run regression battery (`scripts/helix-ask-regression.ts`)
2. run variety battery (`scripts/helix-ask-versatility-record.ts`)
3. run randomized patch probe (`scripts/helix-ask-patch-probe.ts`)
4. run Casimir verification gate (`npm run casimir:verify -- ...`)

CI enforcement:
- `.github/workflows/casimir-verify.yml` runs `helix:ask:patch-probe:strict` before Casimir verify.

## Decision Log (From Current Discussion)
1. Do not rely on manually enumerating every concept alias up front.
2. Add an intent-semantic categorization layer (deterministic scorer plus optional LLM root classifier) to infer likely root families.
3. Preserve whole-repo exploration as default retrieval behavior so relevant evidence is not missed.
4. Use Atlas + git lane + index/lattice as parallel recall channels over the full repo, then rerank.
5. Treat root-to-leaf trees as prioritization and traceability guides, not hard exclusion gates.
6. For social-governance and values prompts, force ideology-aware candidates rooted at `docs/ethos/ideology.json` into the rerank set.

## Observed Malfunction (Current State)
Reproduced prompt:
- "If a child would look forward to celebrating love, how can a society condition this vulnerability?"

Observed debug signature:
- `intent_id = general.fallback`
- `concept_id = energy-conditions`
- `topic_tags = physics`
- preflight seeded physics and stellar files
- low semantic coverage (`coverage_ratio ~ 0.125`)
- high unsupported belief rate (`belief_unsupported_rate = 1.0`)

Net effect:
- retrieval drifted away from ideology/ethos material
- response quality was fluent but generic and weakly grounded

## Agreed Direction
1. Use whole-repo retrieval first (do not hard-prune early).
2. Use intent/root as a reranking signal, not a hard exclusion wall.
3. Keep root-to-leaf structure as guidance for synthesis and traceability.
4. Use Atlas + git lane + lexical scan as broad recall substrate.
5. Enforce strict answer-time grounding and quality gates.

Short principle:
- Open retrieval, constrained answering.

## Target Funnel (v2)
1. Query understanding:
- deterministic signals (repo cues, domain cues, risk cues)
- optional LLM root-classifier for semantic routing hints

2. Global recall (whole repo):
- Atlas neighborhood expansion
- repo-index and code-lattice retrieval
- git lane / rg lexical retrieval

3. Root-aware reranking (soft):
- score candidates by relevance + root affinity + path quality + recency/liveness
- never hard-drop all non-root candidates
- enforce diversity floor across domains

4. Concept resolution inside reranked set:
- concept matching constrained by retrieved evidence, not just alias overlap
- prevent single-token hijacks (for example, "condition" -> "energy condition")

5. Synthesis and gates:
- citation linkage
- coverage/belief/rattling gates
- fail-closed or auto-expand retrieval when evidence remains weak

## Architecture Fit With Existing Work
Existing assets to leverage:
- `scripts/repo-atlas-build.ts` (canonical multi-source graph build)
- `scripts/repo-atlas-query.ts` (why/trace traversal utility)
- `server/services/search/repo-index.ts`
- `server/services/code-lattice/*`
- current Helix Ask pipeline in `server/routes/agi.plan.ts`

Role split:
- Atlas: structural and cross-source retrieval substrate
- git lane: broad lexical and code phrase recall
- root router: prioritization signal
- gates: answer integrity and policy enforcement

## Workstreams
### WS1 - Repro and Baseline
Goal:
- lock deterministic failing cases and baseline metrics

Tasks:
- add failing prompt to Helix regression pack
- capture debug fields for route, concept, retrieval, coverage, belief
- store baseline artifact bundle for before/after comparison

Primary files:
- `scripts/helix-ask-regression.ts`
- `scripts/helix-ask-sweep.ts`
- `docs/helix-ask-readiness-debug-loop.md`

### WS2 - Atlas-First Retrieval Integration
Goal:
- introduce Atlas-assisted whole-repo candidate generation as first-class retrieval channel

Tasks:
- generate and version Atlas artifact in local pipeline
- add Atlas candidate retrieval in preflight and primary retrieval passes
- add source attribution fields for Atlas-derived candidates

Primary files:
- `scripts/repo-atlas-build.ts`
- `scripts/repo-atlas-query.ts`
- `server/routes/agi.plan.ts`
- new retrieval helper (for example `server/services/helix-ask/atlas-retrieval.ts`)

### WS3 - Root Router Layer (Deterministic + LLM Assist)
Goal:
- infer top root families without hard-coding exhaustive concept phrase lists

Tasks:
- build compact root cards from existing tree roots
- add deterministic root scorer
- add optional LLM router that returns scored root distribution in strict JSON
- merge scorers into a final root-priority vector

Rules:
- root routing can boost, never hard-exclude all other domains
- low-confidence root routing triggers multi-root retrieval

### WS4 - Ranking, Diversity Floor, and Expansion Policy
Goal:
- stop single-domain drift and enforce robust evidence mix

Tasks:
- rank candidates with weighted feature scoring
- require minimum cross-domain candidate share when confidence is low
- auto-expand retrieval if coverage/belief gates fail after first pass

Primary files:
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/repo-search.ts`

### WS5 - Concept Match Hardening
Goal:
- reduce false concept activation from ambiguous token overlap

Tasks:
- add ambiguity penalty for high-polysemy single tokens
- require stronger phrase-level evidence for concept activation in general prompts
- gate concept-to-topic tag injection behind evidence support

Primary files:
- `server/services/helix-ask/concepts.ts`
- `server/services/helix-ask/topic.ts`
- `server/routes/agi.plan.ts`

### WS6 - Validation and Rollout
Goal:
- prove quality improvement without regressions

Tasks:
- contract battery
- variety battery
- targeted misroute suite (social prompts, ideology prompts, hybrid prompts)
- canary rollout with shadow scoring and mismatch logs

## Acceptance Criteria
Mandatory for this malfunction class:
1. The reproduced failing prompt no longer routes to physics concept first unless explicitly physics-framed.
2. Retrieval includes ideology/ethos anchors for social-governance prompts.
3. Coverage and belief quality improve versus baseline for this test set.
4. Top-ranked root family for this prompt class is ideology/social-governance, with supporting evidence paths visible in debug.
5. Debug trace shows:
- root score distribution
- channel contributions (Atlas/git/index/lattice)
- rerank reasoning
- excluded high-score candidates (for auditability)
6. No regression in existing repo-tech and physics prompt suites.

## Metrics
Track before/after:
- route correctness for social/ideology family
- concept false-positive rate
- retrieval domain diversity score
- grounded citation rate
- `coverage_ratio`
- `belief_unsupported_rate`
- clarifications/fail-closed rate

## Rollout Plan
Phase 0:
- baseline capture and failing case freeze

Phase 1:
- Atlas channel integrated behind flag

Phase 2:
- root router enabled in shadow mode

Phase 3:
- reranker + diversity floor enforced

Phase 4:
- concept hardening enabled

Phase 5:
- full enablement after readiness gates pass

## Risks and Mitigations
Risk:
- LLM router hallucination or unstable routing
Mitigation:
- strict JSON schema, deterministic fallback scorer, confidence thresholds

Risk:
- higher latency from broader retrieval
Mitigation:
- top-k limits, Atlas neighborhood depth caps, cached graph snapshots

Risk:
- over-bias to one root family
Mitigation:
- diversity floor + auto-expansion on weak evidence

## Definition of Done
1. Failing prompt class resolved in regression suite.
2. Root/router/retrieval debug telemetry available and stable.
3. Whole-repo recall path is active by design (Atlas + git lane + index/lattice).
4. Answer-time gates still enforce grounded output quality.
5. Casimir verification and integrity checks pass for merged patch.
