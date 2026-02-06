# Helix Ask Agentic Retrieval Plan (Single-LLM)

Status: Draft
Owner: Codex + Helix Ask team

## Goal
Make Helix Ask behave like an agent (iterative tool-style retrieval + evidence convergence) while keeping **one** final LLM synthesis call and strict falsifiability gates.

## Constraints
- Single-LLM synthesis only (`HELIX_ASK_SINGLE_LLM=1`).
- Deterministic pre-LLM controller loop with explicit stop reasons.
- Tool results are authoritative inputs (LLM may not claim “no evidence” if tool results exist).
- Stable ordering + hashing for reproducibility across runs.

## Phase 1 — Deterministic Retrieval Controller
**Objective:** Convert retrieval into an explicit, multi-iteration controller loop.

**Loop policy**
1. Seed pass: docs-first + tree JSONs + doc sections.
2. If slot coverage weak: expand queries (heading seeds + filename tokens + symbol names from hits).
3. If still weak: widen scope (code-first + symbol index + 1-hop usage).
4. Stop when: slot coverage threshold met OR budget/time cap hit.

**Stop reasons**
- `coverage_ok`
- `budget_exhausted`
- `dominance_split` (ambiguity branch)
- `no_new_evidence`

**Acceptance**
- `controller_steps[]` deterministic for same prompt + commit.
- Coverage improves monotonically or stops with explicit reason.

## Phase 2 — Itemized Prompt Assembly + Hashing
**Objective:** Produce stable, typed artifacts used to build the final prompt.

**Items**
- `intent`, `selected_trees`, `doc_section_hits`, `repo_search_hits`, `proof_spans`, `slot_coverage_report`.

**Rules**
- Stable ordering.
- Hash each item list (debug + diff).

**Acceptance**
- Same prompt + commit yields identical item hashes.

## Phase 3 — Deterministic Compaction
**Objective:** Keep prompt within budget without dropping key proof.

**Compaction order**
1. Definition spans
2. Contracts/policy
3. Entrypoints
4. Tests
5. Everything else

**Dedup**
- `(file, heading, hash)`

**Acceptance**
- Compaction is deterministic and preserves definition spans.

## Phase 4 — Evidence-Based Disambiguation
**Objective:** Resolve ambiguous prompts by evidence dominance.

**Policy**
- Multi-sense retrieval (small budget per sense).
- Compute dominance by evidence mass + proof density.
- If dominance split: ask 2-option clarify + show evidence for each.

**Acceptance**
- Clarify only when dominance fails.
- Clarify response includes searched terms + top candidate files/headers.

## Phase 5 — Doc-to-Code Alignment
**Objective:** Bind docs to implementation evidence automatically.

**Actions**
- Extract symbols from doc spans.
- Resolve definition + 1-hop usage.
- Attach 1–2 proof spans from code + relevant tests.

**Acceptance**
- When doc span references a symbol, code spans are attached with proof pointers.

## Phase 6 — Tree-Walk Depth Controls
**Objective:** Make tree walks explicit, configurable, and usable in UI.

**Modes**
- `root->anchor` only
- `full_path`

**Outputs**
- Add `tree_walk` section in envelope.
- Emit tree-walk events in live trace.

**Acceptance**
- `tree_walk_binding_rate` > 0 when evidence spans are bound to nodes.

## Phase 7 — Tool-Result Contract (Single-LLM Guardrail)
**Objective:** Prevent the final LLM from ignoring tool results.

**Rules**
- Always inject a `TOOL_RESULTS` block in final prompt.
- If tool results exist, the answer cannot claim “no evidence.”
- Deterministic fallback response if tool evidence exists but synthesis fails.

**Acceptance**
- No “no evidence” responses when `doc_spans.length > 0` or `code_spans.length > 0`.

## Phase 8 - Continual Learning Loop (Tree + DAG Aligned)
**Objective:** Keep Helix Ask aligned with the evolving repo using tree DAGs and concept docs without breaking baseline behavior.

**Loop policy**
- Emit graph-pack metadata in traces: treeIds, primaryTreeId, anchorIds, pathIds, conceptMatch, treeVersion, repo_rev, lattice_rev.
- Store evidence pointers from DAG nodes (type, path, repo_rev, content_hash) so training samples remain auditable.
- Only admit samples for training if the anchor node is full access per checklist or explicitly marked diagnostic.

**Build cadence**
- Rebuild the code lattice + tree indices on repo changes; keep the previous lattice as baseline.
- Export training datasets on a schedule; pin a baseline export and tag variants with training settings.

**A/B adapters**
- Route baseline vs candidate with AGI_ANSWERER_ADAPTER / AGI_ROUTER_ADAPTER.
- Evaluate with helix:ask:regression:light plus holdout gates; promote only if gates + regression improve.

**Acceptance**
- Each exported record links to a tree node and evidence hash.
- Baseline artifacts are preserved; variants are additive.
- A/B run yields separate gate metrics and a clear promote/rollback decision.

---

## DAG Full-Access Checklist (Must Complete)
A node is “full access” only if all checks are satisfied:
- Inputs: name, type, unit, source.
- Outputs: name, type, unit, telemetry path (if applicable).
- Evidence: code, doc, test, telemetry (all present where applicable).
- Versioning: `repo_rev` + `content_hash` on all evidence links.
- Determinism: `deterministic` + tolerance (`abs`/`rel`).
- Assumptions + validity regime captured.
- Environment: runtime + lockfile hash.
- DAG integrity: acyclic, explicit dependencies.

---

## Test Matrix (Dry Runs)
Use dry runs to confirm controller + gates without LLM:
- “What does solar restoration mean in this repo?”
- “Define TS_ratio in this repo.”
- “Is the Casimir tile pressure in GPa?”
- “How does Natario warp bubble relate to Casimir tiles?”
- “What does the ideology tree say about stewardship?”
- “Explain the Helix Ask reasoning pipeline.”
- “What is a cavity?”

**Expected**
- `LLM_STEPS=0` for dry runs.
- Controller steps present when repo expectation is medium+.

---

## Deliverables
- Retrieval controller + stop reasons.
- Itemized artifacts + hashing.
- Compaction policy.
- Ambiguity resolver.
- Doc?code alignment pass.
- Tree-walk depth controls + UI traces.
- Tool-result contract guardrail.
- DAG full-access checklist applied to priority trees.
- Continual learning loop tied to tree/DAG metadata + A/B adapters.

