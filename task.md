# Helix Ask Agentic Retrieval Loop (Build Plan)

Owner: Dan + Codex
Last updated: 2026-02-05

## Goal
Make Helix Ask behave like a tool-using agent while keeping single-LLM final generation. Retrieval should act like a deterministic tool loop, and evidence must be treated as ground truth.

## Research Alignment (Codex Loop vs Helix Ask)
- Codex uses an iterative tool loop with structured intermediate artifacts as inputs (tool outputs are first-class).
- Helix Ask is single-LLM; to match agent behavior we must shift iteration into deterministic retrieval/actions before the final LLM call.
- Context compaction must be deterministic; evidence needs to be prioritized (definition → contract → entrypoint → tests).
- Ambiguity should be evidence-dominant: only clarify if senses remain split after evidence pass.
- Tool results must be authoritative: the final call cannot deny evidence that exists.

## Core Principles
- Evidence is tool output, not suggestion.
- Retrieval runs before any coverage gate that can fail a slot.
- Hard requirements come only from hard evidence (concept matches or user directives).
- Soft hints guide retrieval only (headings, tree nodes, plan directives).
- One LLM call only, after evidence converges.

## DAG Node Schema (Reproducibility)
Helix Ask trees should move toward a DAG node schema that is replayable.
Minimum required for each node:
- id, title, summary
- tags
- evidence (doc/code/test/telemetry)
Recommended for reproducibility:
- inputs (name, type, unit, source)
- outputs (name, type, unit, telemetry path)
- assumptions and validity regime
- deterministic + tolerance
- environment (runtime + lockfile)

Template: `docs/knowledge/dag-node-schema.md`

## Non-Goals
- Re-introducing multi-LLM planning or multi-LLM evidence distillation.
- Allowing tree JSON alone to stand in for definitions when a doc span exists.

---

## Phase 1 - Deterministic Agentic Retrieval Loop

### 1. Add a retrieval controller (deterministic loop)
Iterate through retrieval actions with fixed stop conditions.

Loop policy (minimum):
1. Seed pass: docs-first + tree JSON + doc sections
2. If slot coverage weak: expand queries using headings, file names, symbol tokens
3. If still weak: widen to code search + symbol index + one-hop usage
4. Stop when coverage ok or budget hit
5. Only then build the final prompt

### 2. Explicit stop conditions
Define and enforce concrete thresholds:
- min_doc_span_count
- min_slot_coverage_ratio
- max_iters
- max_files
- max_span_bytes
- max_runtime_ms

Add stop reason:
- dominance_split (when ambiguity resolution is required)

### 3. Multi-channel fusion baseline
- Use RRF-style fusion for lexical/symbol/fuzzy/path hits
- Keep scores and ordering deterministic

### 4. Controller debug output
Add and expose:
- controller_steps[] (step, action, reason, evidenceOk, slotCoverageOk, docCoverageOk, confidence, missingSlots)
- retrieval_iterations (count)
- retrieval_stop_reason (coverage_ok | budget | empty | dominance_split)

Acceptance checks:
- Repo-required questions never answer before at least one retrieval step.
- Clarify responses include what was searched and what would satisfy proof.

---

## Phase 2 - Itemized Prompt Assembly (Codex-style inputs)

### 1. Internal items list
Represent each step as typed items in stable order:
- intent
- selected_trees
- doc_section_hits
- repo_search_hits
- proof_spans
- slot_coverage_report
- tree_walk

### 2. Deterministic ordering
Always order items by type and then by file path + header order. This makes prompts stable and diffable.

### 3. Item hashing
Add per-item hashes to support diffing across runs and commits.

---

## Phase 3 - Deterministic Evidence Compaction

### 1. Compaction rules (pre-LLM)
- Deduplicate by (file, header, span hash)
- Prefer: definitions, API/entrypoints, contracts/policy, tests
- Keep top 1-2 spans per file
- Add a short per-file rationale line if spans are dropped

### 2. Compaction budget
Define budgets and force compaction when exceeded:
- max_items
- max_spans
- max_bytes

### 3. Debug output
- compaction_applied (bool)
- compaction_dropped (count)
- compaction_kept (count)
- compaction_policy (summary string)
- compaction_budget (numbers)

---

## Phase 4 - Evidence-based Disambiguation

### 1. Multi-sense retrieval
For ambiguous prompts:
- Build candidate senses from tree nodes, headings, and concept registry
- Run retrieval per sense (small budget each)
- Compute dominance (evidence mass + slot coverage + proof density)

### 2. Decision
- If one dominates: answer that sense
- If split: ask a 2-option clarify and show evidence for each

### 3. Dominance scoring
Define a deterministic score, for example:
score = evidence_mass * slot_coverage_ratio * proof_density
Clarify if top_two_score_gap < dominance_threshold.

Clarify responses must include:
- queries searched
- top candidate files/headers
- which term failed dominance

### 4. Debug output
- ambiguity_candidates
- ambiguity_scores
- ambiguity_selected
- ambiguity_reason

---

## Phase 5 - Code Alignment Pass

### 1. Doc-to-code bridging
After doc spans are selected:
- Extract symbols from spans (function, type, module names)
- Resolve to definitions and 1-hop usage
- Pull 1-2 code spans per symbol
- Include related tests if present

### 2. Debug output
- code_alignment_applied
- symbols_extracted
- symbols_resolved
- code_spans_added

---

## Phase 6 - Tree Walk Depth Controls + UI Section

### 1. Tree walk depth control
Support levels:
- root_to_anchor (default)
- full_path
- anchors_only

### 2. Tree walk binding
Tree nodes are narrative only when bound to a doc span. Otherwise keep as navigation hints.

### 3. Envelope section
Add a Tree Walk section in the answer envelope (rendered separately in UI).

---

## Phase 7 - Single-LLM Tool-Result Contract

### 1. Tool results block in prompt
Always place before the final answer instruction:
TOOL_RESULTS
- retrieval_summary
- doc_spans
- code_spans
- tree_walk
END_TOOL_RESULTS

### 2. Strict instruction
- If TOOL_RESULTS non-empty, answer must cite them.
- Never claim no evidence when tool results exist.
- If missing, say so and list searches.

### 3. Deterministic fallback
If LLM still claims no evidence while TOOL_RESULTS exist, replace answer with:
- definition bullets (if definition focus)
- evidence bullets (top N)
- tree walk (if present)
- sources list

---

## Phase 8 - Proof-Pointer Density Gate

### 1. Grounded claims threshold
Define a minimum grounded claim ratio before the answer can be labeled Grounded.
If below threshold, downgrade to Bounded inference or Clarify.

### 2. Debug output
- grounded_claim_ratio
- grounded_claim_threshold
- tier_selected

---

## Recommended Build Order
0) Phase 7 - Tool-results contract + deterministic fallback
1) Phase 1 - Retrieval controller loop + stop reasons
2) Phase 2 - Itemized prompt assembly + hashing
3) Phase 3 - Compaction budgets + policy
4) Phase 4 - Evidence-based disambiguation
5) Phase 5 - Code alignment pass
6) Phase 6 - Tree walk depth controls + UI section
7) Phase 8 - Proof-pointer density gate

---

## Acceptance Criteria
1. If doc spans exist, answer never says "no repo evidence".
2. If doc spans exist, answer cites at least 1 matching file.
3. Tree walk is shown in envelope when present.
4. Ambiguous questions either resolve by evidence dominance or ask a 2-option clarify with evidence shown.
5. Code alignment adds at least one code span when doc spans reference symbols.
6. Single-LLM remains the only model call.
7. Item hashes are stable across identical runs.
8. Grounded claim ratio is enforced before "Grounded" tier.
9. Coverage improves monotonically per iteration or the controller stops with a reason.

---

## Tests

### Dry-run checks
- What does solar restoration mean in this repo?
- Define TS_ratio in this repo.
- Is the Casimir tile pressure in GPa?
- What is a cavity?
- Explain the Helix Ask reasoning pipeline.

Expected:
- controller_steps present
- evidence_ok and slot_coverage_ok track intent
- ambiguity resolver only triggers on true multi-sense cases

### Full-run checks
- Same questions, expect citations in answer and tree walk in envelope

### Code alignment test
- Ask a question that references a known symbol from docs and verify doc span -> symbol -> code span.

---

## Clarify Response Contract
When clarification is required, include:
- searched queries
- top candidate files or headers
- which term failed dominance
- what evidence would satisfy the slot

---

## Verification (Required)
Run Casimir verification for every patch:
```
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl
```
Report PASS + certificate hash + integrity OK in final response.

---

## Open Questions
- Should the tree walk be visible to end users by default or only in debug?
- How many code spans per symbol is optimal for the context budget?
- Should clarification include top evidence snippets for each sense?
- Should prompt caching be applied at the item level or at the final prompt level?
