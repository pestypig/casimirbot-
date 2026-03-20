# Helix Ask Reasoning Ladder Research Report

## Failure anatomy of the “malfunctioning” final response

The output you shared is recognizable as a **fixed, templated “five-section” answer shape** (“Short answer / Conceptual baseline / How repo solves it / Evidence + proof anchors / Uncertainty”) that Helix Ask treats as a *universal, family-stable* fallback shape when free-form composition cannot be trusted to stay grounded. This structure is explicitly exercised and validated in the repo’s Helix Ask reliability tests (including support for a deterministic fallback that preserves the same headings even when the composer output is empty). fileciteturn32file0L1-L1

Where it becomes low-utility (your complaint) is when that stable “answer shell” is populated with **non-informative filler** (“bounded to `server/routes/agi.plan.ts` in this turn,” “additional anchors requested”), because **the retrieval + evidence gating stages did not produce enough *eligible, slot-covering evidence*** to support concrete implementation guidance, and/or because downstream gates rejected content (e.g., anchor integrity or citation policy), causing the system to collapse into the deterministic shell. The ladder design expects *slot coverage* and *evidence gates* to be decisive, and if repo evidence is required but evidence is weak, the arbiter should prefer clarify or a bounded degrade path rather than emitting a generic “sources-only” response. fileciteturn30file0L1-L1

In the repo’s own tests, two key mechanisms explain why an output can degrade after seemingly “reasonable” upstream work:

- **Anchor integrity and debug-leak guards**: the validator is designed to fail the answer if it cites a path not in the allowlist or leaks internal tokens (e.g., `traceId`). A single forbidden path in “Sources:” can trigger `anchor_integrity_violation`, and certain internal strings trigger `debug_leak`. fileciteturn32file0L1-L1  
- **Post-link citation enforcement** (for composer v2): claims classified as `repo_grounded` or `reasoned_inference` are rejected if citations are missing, and other structural misplacements (like `baseline_common` claims outside “Conceptual baseline”) are treated as hard failures. fileciteturn32file0L1-L1

Your shared debug context (“retrievalChannelHits all zeros,” “anchor_integrity_violation,” and a deterministic fallback) is consistent with a pipeline that is doing the *right kind of safety behavior*—but is missing a robust way to (a) detect **multi-objective intent** early, (b) run retrieval as a **coverage problem** across objectives, and (c) degrade into something still **actionable** (not just a template) when coverage is weak. The repo’s own universal composer architecture research frames this as a “post-selection gate conflict” risk and recommends an **AnswerPlan IR + schema-filled composer** to produce family-consistent degraded answers instead of generic dead ends. fileciteturn31file0L1-L1

## What the repo already specifies as the intended Helix Ask pipeline

Your repo defines the Helix Ask reasoning pipeline as: **intent selection → retrieval → evidence gates → synthesis**, with the flow and ordered stages documented in the ladder/flow docs, and runtime orchestration belonging to `server/routes/agi.plan.ts`. fileciteturn28file0L1-L1

The flow document lays out the *operational* path:

- Client opens a Helix Ask session; in grounded mode it calls `plan()` to get “resonance selections,” builds a grounded prompt (`buildGroundedPrompt`), then calls `/api/agi/ask`, and the response is cleaned and rendered. fileciteturn29file0L1-L1  
- The system supports **two-pass synthesis** when enabled, and has explicit notes about **scientific-method trace metadata**, **context session contracts**, and strict separation between user-visible output and debug/traces. fileciteturn29file0L1-L1

The ladder document defines a stage-by-stage “debug reference ladder” that aligns strongly with the “universal framework” you quoted:

- Stage 0 sets obligations when a prompt implies repo grounding (“according to the codebase,” “cite file paths”) and disallows a general-only answer in that case. fileciteturn30file0L1-L1  
- A preflight retrieval always runs; then a plan micro-pass yields required slots, must-include globs, query hints, and clarify question. fileciteturn30file0L1-L1  
- Retrieval is multi-channel (lexical/symbol/fuzzy/path/git_tracked) and explicitly references **RRF fusion + MMR** for dedupe/diversity selection. fileciteturn30file0L1-L1  
- Evidence eligibility + slot coverage is a dedicated stage; the arbiter selects `repo_grounded | hybrid | general | clarify`, and the obligation gate can force clarify if required citations are missing. fileciteturn30file0L1-L1

In other words: the repo already “knows” what a robust ladder looks like. The failure you’re seeing is less about *having no framework*, and more about **making the framework fully universal for complex, multi-objective prompts** (your “organize my ideas into implementable plans” prompt is exactly that kind of prompt) and ensuring the degrade path remains **useful** when retrieval is weak or contradictory.

## Contract and invariants spec for a universal ladder

A “universal” framework becomes practical when you treat a prompt as a **typed contract** that every stage must honor, and you treat evidence as a **sealed set** that downstream stages cannot silently replace. This matches both your Codex summary and the repo’s architecture direction: implement an immutable AnswerPlan IR and make composition schema-bound, then validate deterministically. fileciteturn31file0L1-L1

A compact contract that harmonizes what the ladder describes with what the tests enforce can be expressed as:

```json
{
  "turn_contract": {
    "goal": "string",
    "objectives": ["string"],
    "grounding_mode": "repo | open | hybrid",
    "output_family": "definition_overview | mechanism_process | implementation_code_path | comparison_tradeoff | recommendation_decision | troubleshooting_diagnosis | roadmap_planning",
    "prompt_specificity": "broad | mid | specific",
    "constraints": {
      "requires_repo_evidence": "bool",
      "requires_citations": "bool",
      "allow_open_world_bypass": "bool",
      "tone_policy": "optimistic-but-honest"
    }
  },
  "evidence_plan": {
    "required_slots": ["definition", "repo_mapping", "implementation_touchpoints", "failure_modes", "next_steps"],
    "must_include_globs": ["string"],
    "depth_budget": "int",
    "diversity_budget": "int",
    "connectivity_budget": "int"
  },
  "evidence_lock": {
    "allowed_citations": ["path"],
    "context_files": ["path"],
    "slot_coverage_ratio": "float",
    "slot_missing": ["slot_id"],
    "retrieval_confidence": "low | med | high"
  }
}
```

This is aligned with the ladder’s explicit “plan micro-pass” outputs (required slots, must-include globs, query hints) and the later evidence gate / slot coverage stage. fileciteturn30file0L1-L1

The repo tests show the “non-negotiable” invariants you should preserve (and, in practice, promote from “best effort” heuristics into hard gates):

- **Anchor integrity**: every cited path must be within `allowed_citations`, or validation fails with `anchor_integrity_violation`. fileciteturn32file0L1-L1  
- **No debug leakage into the final answer**: internal tokens like `traceId` are treated as failures unless the user is explicitly in a debug/report mode. fileciteturn32file0L1-L1  
- **Family-shaped degradation**: the system is expected to degrade within the selected family (e.g., “mechanism_process” produces “Mechanism Explanation / Inputs-Outputs / Constraints / Sources”) rather than switching to a generic apology. fileciteturn32file0L1-L1  
- **Stable intent/selection continuity**: the test suite explicitly checks stable hashes and lock parity; this is crucial for multi-turn reliability and for preventing “post-lock mutation.” fileciteturn32file0L1-L1

The dedicated internal architecture note takes the same position in design terms: lock the family, build a deterministic AnswerPlan skeleton, constrain the LLM to fill only text fields under schema, and keep any post-processing style-only (not semantic). fileciteturn31file0L1-L1

## Retrieval specs that make “multi-objective prompts” work in practice

Your failing example prompt is not a single question. It is a bundle: tone policy, product/API rollout, profiles + paywall, voice “fast reaction lane,” diarization/noise robustness (you referenced entity["company","Ableton","audio software company"] as a gold standard), panelized UI, device-audio transcription (including entity["company","YouTube","video platform"]), translation, and rank/credits. A keyword-only retrieval pass will usually underperform on that kind of prompt because it does not know which sub-goals are most important.

The ladder already gives you two structural tools to solve this—**plan micro-pass** and **slot coverage**—but they need to be pushed “upstream” into retrieval planning:

- **Objective decomposition**: the plan micro-pass should explicitly enumerate objectives and assign each objective a minimal “evidence requirement,” even if that requirement is “no repo anchors required; open-world product design allowed.” fileciteturn30file0L1-L1  
- **Coverage-first retrieval**: treat retrieval as satisfying a set of slots, not as “top-k similarity.” The ladder already frames required slots (definition, repo mapping, verification, failure path) and expects “slot coverage - ok|missing.” fileciteturn30file0L1-L1  
- **Multi-channel fusion**: your ladder explicitly calls for (lexical/symbol/fuzzy/path/git_tracked) and states “Weighted RRF fusion + MMR selection.” fileciteturn30file0L1-L1  
  - RRF is a classic method for combining ranked lists from multiple retrieval systems and is widely used because it is simple and robust across heterogeneous rankers. citeturn9search1turn9search6  
  - MMR is a classic diversity-based reranking strategy intended to reduce redundancy while preserving relevance; it is commonly used when you want a result set that spans distinct aspects of a query. citeturn10search4turn10search2  
  - BM25 is a canonical lexical ranking function derived from probabilistic relevance modeling and remains a strong baseline for keyword-heavy corpora. citeturn9search4

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["retrieval augmented generation pipeline diagram","RAG architecture diagram LLM retriever generator"],"num_per_query":1}

To make this reliable for your system specifically, the stage retrieval spec should include explicit “long prompt hardening” rules:

- **Query slicing**: produce multiple queries per objective (short recall query + longer precision query), then fuse with RRF. This avoids “AND-style query collapse” where long queries return nothing. This is consistent with the ladder’s explicit “queries merged” and “query hints” mechanisms. fileciteturn30file0L1-L1  
- **Docs-first vs code-first policy**: the ladder defines a docs-first phase for certain repo-required topics; extending the same model, a “roadmap_planning” family could be **docs-first for system architecture**, then widen to code for touchpoints. fileciteturn30file0L1-L1  
- **Slot-based stopping conditions**: stop retrieval early if all required slots are satisfied (saves latency), or switch to “evidence-gap mode” if a critical slot remains missing after exhausting budgets. fileciteturn30file0L1-L1

This is consistent with how Retrieval-Augmented Generation systems are typically framed in the research literature: retrieval supplies grounded context for the generator, and the generator is expected to condition on that context rather than inventing facts. citeturn24search0

## LLM call placement and formulation for a robust additive draft

A practical universal framework uses LLM calls where they add unique value, and keeps everything else deterministic. Your repo’s internal architecture document makes this point explicitly: a universal composer should do **one constrained generation pass** into an AnswerPlan schema, followed by deterministic validation and family-specific degradation rather than multi-branch repair loops. fileciteturn31file0L1-L1

Placed onto the ladder, the most stable call graph looks like this:

- **Micro-planner call** (optional but high-leverage for complex prompts): produces objective list, required slots, must-include globs, query hints, and a “clarify question” if a missing slot is unavoidable. This is already part of the ladder as “plan micro-pass,” including query hints and required slots. fileciteturn30file0L1-L1  
- **Evidence digest builder** (deterministic or lightly assisted): turns retrieved documents into bounded evidence cards and a compact digest (the ladder already has “evidence cards + scaffolds”). fileciteturn30file0L1-L1  
- **Universal composer call** (single-shot, schema-bound): LLM fills AnswerPlan JSON fields (no new citations, no new paths), then deterministic gates enforce anchor integrity, forbid debug leakage, and enforce section shape. This matches the repo’s recommended “AnswerPlan IR + schema-filled composer.” fileciteturn31file0L1-L1  
- **Verifier / critic call** (optional, gated by risk): use only when (a) stakes are high, or (b) evidence is rich but the composer output fails validation for non-substantive reasons. The paper line of work behind Self-RAG and Corrective RAG supports the idea that **critique and correction** can be integrated to decide when to retrieve more and when to revise, rather than hallucinating through missing evidence. citeturn24search2turn25search0  
- **Tool-use style planning** (if your system uses tool calls): research like ReAct supports structuring the model’s behavior as a loop of reasoning + acting (retrieval/tool invocation) rather than a single monolithic completion. citeturn24search1

The “additive draft” you described maps naturally to the AnswerPlan skeleton: it is additive because every stage appends to a structured IR (contract → retrieval plan → evidence pack → filled plan), and the final UI is just a renderer over the IR. The repo’s tests already demonstrate both (a) structured family classification and (b) systematic rejection of outputs that violate citation/structure constraints—meaning you’re close to that IR approach already. fileciteturn32file0L1-L1

## Repo-grounded implementation blueprint for the next patch cycle

The repo’s own “Helix Ask reasoning pipeline” note says the runtime is orchestrated in `server/routes/agi.plan.ts`, and the ladder calls it the “key implementation file.” fileciteturn28file0L1-L1 fileciteturn30file0L1-L1  
However, the GitHub connector could not retrieve the contents of `server/routes/agi.plan.ts` during this session (it returned empty content), so the blueprint below is grounded in **documented contracts + test-visible behavior**, not line-by-line edits of the route file. fileciteturn33file0L1-L1 fileciteturn32file0L1-L1

A concrete, high-confidence roadmap that fits what’s already in the repo:

1. **Make the turn contract explicit and serializable end-to-end**  
   Your tests already imply stable intent contracts and selection locks (hash parity checks, lock-required families, etc.). Promote this into a versioned `TurnContract` struct that is passed across all pipeline stages and emitted in debug artifacts. fileciteturn32file0L1-L1

2. **Upgrade “plan micro-pass” into objective-aware slot planning**  
   Ensure that multi-objective prompts yield multiple required slots and queries per objective, not a single blended query. This makes `slotCoverageMissing` meaningful for prompts like your Helix Ask future-planning prompt (it should report “missing: auth/profile plan” *separately from* “missing: voice lane architecture” rather than collapsing). fileciteturn30file0L1-L1

3. **Treat retrieval health as a gate to *utility*, not just to *truthfulness***  
   Your current fallback shell is truth-preserving but sometimes utility-poor. The tests demonstrate that the system can generate deterministic degrade outputs per family and strip low-signal scaffold noise (“Convergence snapshot…”, “Capsule guards…”)—extend that logic so an evidence-gap response still gives a *useful next action* (e.g., “here’s the roadmap skeleton + what we need from the repo to bind it”). fileciteturn32file0L1-L1

4. **Adopt the AnswerPlan IR + schema-filled composer as the universal final layer**  
   This is already recommended in the repo’s research note, including metrics like schema validity, anchor integrity violation rate, debug leak rate, family format accuracy, and latency targets. fileciteturn31file0L1-L1  
   The tests already contain many of the guardrails you need (family classification, anchor integrity detection, debug leak detection, claim grounding gates), so the “patch” is likely consolidation + stricter wiring rather than invention. fileciteturn32file0L1-L1

5. **Fold your “optimistic language policy” into style-only post-processing**  
   Your prompt’s tone requirement (“tools at your will” vs “tools at your disposal”) is best implemented as **style-only normalization** after content is locked, as recommended by the universal composer architecture (“style-only post-processing”). This avoids creating incentives where tone rules accidentally mutate factual claims or citations. fileciteturn31file0L1-L1

6. **Operationalize evaluation with adversarial, multi-objective prompts**  
   The repo’s architecture note proposes falsifiable metrics and a rollout strategy (shadow → soft enforce → full enforce). Convert your long “future Helix Ask planning” prompt style into a test suite bucket (multi-objective, requires planning, mixed modalities). Use the ladder telemetry fields already enumerated (slot coverage ratio, retrieval_channel_hits, evidence gate OK, etc.) as primary regressions. fileciteturn30file0L1-L1 fileciteturn31file0L1-L1

Finally, because your long prompt includes “voice lane” and diarization-style ideas (plus translation via services like entity["company","ElevenLabs","speech synthesis company"] and sign-in flows that could involve entity["company","Google","technology company"]), the universal framework’s most important practical win is: it lets the system **answer with a roadmap even when repo binding is incomplete**, while clearly labeling which parts are repo-proven vs planned/inferred—exactly the separation your AnswerPlan claim classes (`repo_grounded | baseline_common | reasoned_inference`) are designed to enforce. fileciteturn32file0L1-L1
