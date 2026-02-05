# Helix Ask Retrieval Stage Upgrade (All Domains)

## Background
Helix Ask is classification-first (topic tags, concept match, graph resolver). It lacks a deterministic, repo-grounded retrieval stage comparable to explicit repo search (for example, `rg`). This causes misses on unit- and formula-specific questions and weakens falsifiability across domains.

## Problem Statement
We need a universal retrieval framework that runs for any prompt and grounds answers in repo content first, with platonic reasoning enforcing evidence quality. Generic LLM knowledge can be used only when repo evidence is absent or explicitly limited.

## Core Principle
Always retrieve, then decide how to answer. Retrieval must be a first-class, always-on stage instead of a fallback after classification.

## Goals
- Retrieval runs for all domains, not just physics or warp.
- Answers are falsifiable against repo evidence whenever possible.
- Platonic gates enforce evidence quality and explicit uncertainty.
- LLM generic answers are allowed only as a labeled fallback.
- Retrieval trace is visible and auditable.
- Retrieval remains fast and low-noise.

## Non-Goals
- Rewriting the entire Helix Ask architecture.
- Forcing every question to match doc naming conventions.
- Breaking existing workflows or UI formatting.

## Current Flow (As Implemented)
- Input + obligations: normalize prompt, detect repo-citation requirements.
- Intent + topic routing: assign domain/tier, apply topic tags, derive repo expectation.
- Plan pass (micro-pass): emit query hints, scopes, slots, and clarify questions for repo-expected prompts.
- Query + scope building: merge base queries with plan hints, build allowlists/must-include.
- Retrieval: multi-channel search (lexical/symbol/fuzzy/path), fuse via RRF, diversify via MMR.
- Docs-first phase (when enabled): restrict to docs/ethos + docs/knowledge for ideology/ledger/star repo-required cases.
- Evidence gates + slot coverage: validate coverage, must-include, and eligibility.
- Arbiter decision: repo_grounded | hybrid | general | clarify.
- Synthesis + repair: build answer, run citation repair, then platonic gates.

## Evidence From Current Output (Example)
- Slots generated search queries but did not retrieve any repo context.
- Debug fields show `anchor_files: []`, `context_files: []`, `context_files_count: 0`.
- Evidence gates report `evidence_ok: false`, `coverage_applied: false`.
- Result is `clarify` across slots due to missing retrieval, not missing intent.

## Research Summary (Adjacent)
- Multi-channel retrieval should run first, then fuse rankings (lexical, tree JSON, doc-section index, path/symbol; optional dense when available). [1]
- Apply diversity reranking (MMR) so evidence does not collapse into one domain or tree. [1]
- Use LLM planning only for query expansion and retrieval hints, not for factual claims (HyDE-style). [2]
- Resolve ambiguity via competing evidence clusters rather than short-token heuristics. [2]
- Formalize answer vs abstain using a selective prediction contract (grounded, bounded inference, hypothesis, clarify). [3]
- Use hierarchical retrieval (file -> section -> span) to land proof spans, not just file paths. [4]

## Design Principles (Helix Ask Mapping)
- Always-on preflight retrieval: run a cheap universal retrieval stage for every prompt, then decide intent/answer mode.
- Multi-channel fusion: lexical + tree/graph + doc-section + path/symbol lists fused via RRF.
- Diversity constraint: enforce coverage across domain surfaces (docs/knowledge vs modules vs client vs server).
- LLM planning for queries only: plan pass emits slots, aliases, headings, and retrieval hints, never facts.
- Evidence-driven ambiguity: if two evidence clusters compete, ask a targeted clarify; otherwise proceed.
- Selective answering contract: grounded facts require proof pointers; bounded inference only connects grounded facts; hypotheses are labeled; clarify is targeted.

## Build Plan (Phased)

### Phase 1 - Universal Direct Retrieval Stage
Goal: retrieval is deterministic and always-on; classification consumes retrieval, not the other way around.

Work items:
- Build a universal preflight retrieval stage (cheap and always-on).
- Emit a retrieval plan object in the envelope: trees used, channels used, files/sections used, and slot coverage.
- Add preflight signals to upgrade intent to hybrid/repo when evidence appears.
- Preserve existing docs-first behavior for ideology/ledger/star when repo evidence is required.

Acceptance:
- For any prompt, envelope includes preflight retrieval metadata.
- Mixed-domain prompts yield at least one evidence card per slot or a targeted clarify.

### Phase 2 - Slot Canonicalization and Ambiguity Resolver
Goal: stop brittle missing-token gates from blocking obviously related evidence.

Work items:
- Canonicalize slots from doc headings, tree nodes, file names, and plan hints.
- Cluster evidence by tree root and topic tag; if top two clusters are close, ask clarify.

Acceptance:
- Short prompts only clarify when evidence clusters compete, not just due to short tokens.

### Phase 3 - Scientific Response Contract and Metrics
Goal: keep answers falsifiable and measurable.

Work items:
- Enforce claim ledger: facts require evidence_refs; inferences must cite supporting facts.
- Track grounded rate vs hypothesis/clarify rates (coverage vs risk proxy).

Acceptance:
- claim_ledger marks a claim supported only if evidence_refs is non-empty.
- telemetry reports grounded_rate, hypothesis_rate, clarify_rate, and clarify_resolved rate.

### Phase 4 - Reasoning Contract (Hard vs Soft Signals)
Goal: prevent noisy planner hints from forcing fail-closed coverage while keeping falsifiability strict.

Contract:
- **Hard required slots** only from concept matches or explicit `coverageSlots` in the request.
- **Soft signals** (plan directives, headings, graph hints, query hints) can steer retrieval but never gate coverage.
- Coverage gates operate on hard required slots only; soft signals affect ranking, not pass/fail.

Implementation:
- Filter required coverage slots by source (`concept`, explicit request).
- Keep plan/directive slots advisory unless the user explicitly requests them.
- Expose hard-required slots in debug to audit gating.

Acceptance:
- No fail-closed due to plan-pass or planner directives alone.
- Coverage failures only when concept slots are missing evidence.

## Implementation Notes
- Run a cheap preflight retrieval universally (trees + section index + shallow lexical).
- Widen to full repo search only when coverage or evidence gates fail.
- Keep retrieval trace visible in debug output for audits.

## Files Likely Impacted
- server/routes/agi.plan.ts
- server/services/helix-ask/topic.ts
- server/services/helix-ask/concepts.ts
- server/services/helix-ask/graph-resolver.ts
- server/services/helix-ask/doc-sections.ts
- server/services/helix-ask/repo-search.ts
- server/services/helix-ask/query.ts
- server/services/helix-ask/platonic-gates.ts
- server/services/helix-ask/envelope.ts
- configs/graph-resolvers.json
- docs/helix-ask-flow.md

## Acceptance Criteria
- For any domain, at least one repo-backed context block is selected or an explicit "no evidence found" is returned.
- Retrieval trace (trees, files, sections, search terms) is surfaced in the response envelope.
- Platonic gates refuse unsupported claims or label them as fallback.
- LLM generic answers are allowed only when repo evidence is missing and are explicitly labeled.
- No regressions in existing Helix Ask UI.

## Tests and Validation
- Add regression cases for unit/fact questions across multiple domains.
- Validate retrieval trace emission and evidence coverage behavior.
- Run Casimir verification gate after any code changes.

## Rollout Plan
- Stage 1: Retrieval stage behind a flag.
- Stage 2: Enable for all prompts in shadow mode (logging only).
- Stage 3: Enforce as default.

## Open Questions
- How large should the default repo search scope be per domain?
- What is the fallback threshold for LLM generic answers?
- Should any domains opt out of repo search for privacy or performance reasons?

## References
[1] https://trec.nist.gov/pubs/trec8/papers/okapi.pdf
[2] https://arxiv.org/abs/2212.10496
[3] https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136960146.pdf
[4] https://www.mdpi.com/2076-3417/16/2/903
