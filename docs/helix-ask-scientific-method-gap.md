# Helix Ask: Reasoning vs Scientific Method

This note records where Helix Ask currently stands versus a fuller scientific
workflow.

## Current state: engineering validation chain

Helix Ask already has a structured, reproducible validation path:

- Intent routing and topic tagging.
- Multi-channel retrieval with scope control (repo/graph/lex/symbol/fuzzy).
- Coverage/evidence/belief/rattling gates and claim ledgers.
- Deterministic debug trace with `answer_path`, `trace_summary`, and gate
  outcomes.
- Trees/DAGs for provenance (`scope`, `walk` style graph packs) and required
  file anchors.

This gives:

- **Traceability:** each answer can be replayed with a concrete path.
- **Guardrails:** weak claims can fail gates or trigger fallback.
- **Repeatability:** same input/config tends to produce the same ladder.

## What is still missing for a full scientific method posture

- Explicit hypothesis statements with stated *falsifiable alternatives*.
- Controlled counterfactual testing during a run (negative probe variants).
- Calibrated priors / uncertainty intervals tied to retrieval and synthesis
  confidence.
- Replication metadata (run seed, retrieval snapshot, versioned prompt templates)
  stored as an explicit default, not only in debug artifacts.
- Closed-loop corrective action based on refutations (not just stricter answer
  templates).

Trees/DAGs are useful for structure, but they are not yet a substitute for an
experiment protocol.

## Proposed staged improvement (for later)

1. Add hypothesis/anti-hypothesis fields to concept evidence cards.
2. Add a light, bounded `refute` branch in the concept/IDEOLOGY fast path.
3. Add a "claim confidence band" field to response diagnostics.
4. Define a minimum reproducibility envelope (seed + versioned evidence pack) for
   high-stakes domains.

## Related references

- `docs/helix-ask-flow.md`
- `docs/helix-ask-ladder.md`
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/platonic-gates.ts`
