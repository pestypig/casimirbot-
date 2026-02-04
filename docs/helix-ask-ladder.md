# Helix Ask Ladder (End-to-End)

This document is the reference ladder for how Helix Ask processes a prompt.
It is written for debugging and verification and mirrors the live events and
trace/debug fields emitted during a run.

## 0) Input + obligations
- The prompt is normalized and scanned for hard obligations.
- If the prompt demands repo grounding ("according to the codebase", "cite
  file paths", "where in the code"), the system sets:
  - requiresRepoEvidence = true
  - requiresCitations = true
  - general-only answer is not allowed

Live events
- Helix Ask: Obligation - requires_repo

## 1) Intent + topic routing
- Domain (general/repo/hybrid/falsifiable) and tier (F0/F1/F3) are selected.
- Topic tags are applied (helix_ask, ideology, ledger, star, warp, etc.).
- Repo expectation score is derived (low/medium/high).

Live events
- Helix Ask: Repo expectation - low|medium|high
- Helix Ask: Intent resolved - ok

## 2) Plan pass (micro-pass)
- For repo-expected or hybrid prompts, a micro-pass emits a plan:
  - preferred_surfaces
  - avoid_surfaces
  - must_include_globs
  - required_slots
  - clarify question
  - query hints
- The plan is parsed only between PLAN_START/PLAN_END markers.

Live events
- Helix Ask: Plan - micro-pass
- Helix Ask: Plan pass - start
- Helix Ask: Query hints ready - N hints
- Helix Ask: Plan directives - ok
- Helix Ask: Plan pass - end

## 3) Queries + scope building
- Base queries are generated from question + topic tags.
- Plan query hints are merged with base queries (deduped).
- Plan scope is built:
  - allowlistTiers
  - avoidlist
  - mustIncludeGlobs
  - docsFirst + docsAllowlist (for ideology/ledger/star repo-required cases)

Live events
- Helix Ask: Queries merged - N queries
- Helix Ask: Retrieval scope - ok

## 4) Retrieval (multi-channel)
- Channels: lexical, symbol, fuzzy, path (path lookup for explicit file hints).
- Weighted RRF fusion + MMR selection.

Live events
- Helix Ask: Retrieval channels - ok

## 5) Docs-first phase (when enabled)
- For repo-required ideology/ledger/star topics:
  - Phase 1 searches docs/ethos + docs/knowledge only.
  - If mustInclude satisfied, stop.
  - Else optional docs-only grep fallback.
  - If still missing, widen to full repo.

Live events
- Helix Ask: Docs-first scope - ok|miss
- Helix Ask: Docs grep fallback - ok|miss
- Helix Ask: Context ready - N files

## 6) Evidence eligibility + slot coverage
- Defaults: HELIX_ASK_COVERAGE_GATE, HELIX_ASK_BELIEF_GATE, and HELIX_ASK_RATTLING_GATE are enabled when unset.
- Evidence gate checks match ratio, min tokens, etc.
- Slot coverage ensures required slots are supported (definition, repo_mapping,
  verification, failure_path).
- Plan must-include and topic must-include are enforced.
- For configured tree topics, an anchor-and-walk graph resolver may inject a
  compact framework context (derived from the tree) before evidence gating.

Live events
- Helix Ask: Slot coverage - ok|missing
- Helix Ask: Evidence gate - pass|fail
- Helix Ask: Retrieval confidence - low|med|high

## 7) Arbiter decision
- answerMode = repo_grounded | hybrid | general | clarify
- If requiresRepoEvidence and evidence is weak, clarify is chosen.

Live events
- Helix Ask: Arbiter - repo_grounded|hybrid|general|clarify
- Helix Ask: Fallback - clarify (arbiter)

## 8) Evidence cards + scaffolds
- Evidence bullets are built from the selected context.
- Scaffolds are prepared (general, repo, prompt).

Live events
- Helix Ask: Evidence cards ready - repo|ok
- Helix Ask: Reasoning scaffold ready - ok
- Helix Ask: Synthesis prompt ready - general|repo|hybrid

## 9) Synthesis + repair
- The LLM produces a constrained answer from scaffolds.
- Citation repair runs if needed.

Live events
- Helix Ask: Generating answer
- Helix Ask: Answer ready
- Helix Ask: Citation repair - applied

## 10) Obligation gate (final)
- If repo evidence was required but no citations exist in the answer,
  the system responds with a clarify message (plus a general paragraph if available).

Live events
- Helix Ask: Obligation - missing_repo_evidence

## 11) Platonic gates
- Definition lint, physics lint, coverage, belief, and rattling checks.
- The cleaned answer is finalized.

Live events
- Helix Ask: Platonic gates - ok
- Helix Ask: Answer cleaned preview - final

## 12) Envelope + UI
- The answer is packaged with sections/proof and rendered.
- Debug payload carries the entire ladder state for inspection.

## Debug fields (selected)
- intent_id, intent_domain, intent_tier, intent_reason
- plan_directives, query_hints, queries
- plan_must_include_ok, topic_must_include_ok
- slot_coverage_required, slot_coverage_missing, slot_coverage_ratio
- retrieval_confidence, retrieval_doc_share, retrieval_channel_hits
- evidence_gate_ok, evidence_match_ratio
- answer_path (step trace)
- live_events (full ladder transcript)

## Key implementation file
- server/routes/agi.plan.ts
