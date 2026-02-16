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

## Update: planner trace contract now includes scientific-method metadata

`server/services/planner/chat-b.ts` now writes a `scientific_method` record onto
task traces, including:

- hypothesis + anti-hypothesis statements
- a bounded counterfactual result marker (`supports_hypothesis` /
  `supports_anti_hypothesis` / `inconclusive`)
- uncertainty interval + confidence band
- reproducibility metadata (run id, plan hash, prompt hash when present,
  timestamp, step count, citation count)
- corrective-action payload for failed evidence or missing citations

This closes the first integration layer for scientific-method loop visibility,
with room to strengthen evidence weighting and domain-calibrated uncertainty.



## Incremental runtime build status

The planner now applies a **scientific-mode quality gate** when goals indicate
scientific-method workflows (or `HELIX_SCIENTIFIC_METHOD_MODE=1`):

- citation verification failures are treated as anti-hypothesis evidence for the
  scientific trace
- task trace `ok` is downgraded in scientific mode when citation verification
  fails
- corrective-action payloads include explicit rerun/repair directives

This is still an intermediate stage and should be followed by explicit
branch-execution counterfactual tools and calibrated uncertainty models.

## Related references

- `docs/helix-ask-flow.md`
- `docs/helix-ask-ladder.md`
- `server/routes/agi.plan.ts`
- `server/services/helix-ask/platonic-gates.ts`

## Cloud chat fixed packet (Feedback Loop Hygiene)

Use this packet for recurring cloud-chat checks so we can detect regressions away
from the default narrative style.

### Session packet

1. **Baseline narrative**
   - Question: `In plain language, how does Feedback Loop Hygiene affect society in the Ideology tree?`
   - Style constraints:
     - Conversational tone for a non-technical reader.
     - Grounded in repo ideology context.
     - Include one short opening paragraph.
     - Include a root-to-leaf narrative chain (example: `Mission Ethos -> Feedback Loop Hygiene -> [related nodes]`).
     - Include one concrete real-world example.
     - Include one concise takeaway with societal impact.
     - Do **not** output technical notes mode unless explicitly requested.

2. **Root-to-leaf stress test**
   - Question: `Explain Feedback Loop Hygiene as the root-to-leaf path in Ideology for how a town council should handle online rumor spikes. Include how it links to Civic Signal Loop and Three Tenets Loop.`

3. **Regression test for old compare/report behavior**
   - Question: `How does Feedback Loop Hygiene affect society?`
   - Constraint: answer in the new default narrative style only; if the model drifts toward technical compare/report bullets, switch back to plain-language narrative first.

4. **Context-control cross-tree check**
   - Question: `What is Feedback Loop Hygiene? Answer briefly without code-level repo details. It should be understandable to someone new to the project.`

### Recommended run order

Run prompts in this exact sequence each session:

1) baseline narrative, 2) root-to-leaf stress test, 3) regression test, 4) context-control check.


### Automation hook

For CI/regression harness runs, execute the Helix Ask regression script with the
ideology packet enabled:

```bash
HELIX_ASK_REGRESSION_IDEOLOGY=1 npm run helix:ask:regression
```

Use `HELIX_ASK_REGRESSION_ONLY` to isolate a single case label while tuning prompt
or intent-profile constraints.

### Debug payload (when API access is available)

Append this payload:

```json
{"debug":true,"verbosity":"extended"}
```

Compare and record:

- `trace_summary` (expect ideology-intent pathing).
- Evidence source alignment.
- Whether response remains single-narrative vs repeated technical bullets.
- Whether tree walk keeps continuity (root-to-leaf) instead of flattened repeats.

If step 3 still returns technical report style, tighten format constraints in the
intent profile before the next run.
