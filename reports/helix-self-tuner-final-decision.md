# Helix Self-Tuner Final Decision

## 1) Final verdict: NO-GO

## 2) Strict gate table

| Gate | Value | Threshold | Pass |
|---|---:|---:|:--:|
| relation_packet_built_rate | 0.9667 | 0.95 | ✅ |
| relation_dual_domain_ok_rate | 0.9667 | 0.95 | ✅ |
| report_mode_correct_rate | 0.9889 | 0.98 | ✅ |
| citation_presence_rate | 1.0000 | 0.99 | ✅ |
| stub_text_detected_rate | 0.0000 | 0.00 | ✅ |
| runtime_fallback_answer | 0.0000 | 0.00 | ✅ |
| runtime_tdz_intentStrategy | 0.0000 | 0.00 | ✅ |
| runtime_tdz_intentProfile | 0.0000 | 0.00 | ✅ |
| provenance_gate_pass | 1.0000 | 1.00 | ✅ |
| decision_grade_ready | 1.0000 | 1.00 | ✅ |

## 3) Novelty table

| Temperature | novel_response_rate | Target | Pass |
|---|---:|---:|:--:|
| 0.20 | 0.2889 | 0.82 | ❌ |
| 0.35 | 0.2889 | 0.82 | ❌ |

## 4) Before/after vs baseline

| Metric | Baseline | After (heavy) | Delta |
|---|---:|---:|---:|
| relation_packet_built_rate | 1.0000 | 0.9667 | -0.0333 |
| relation_dual_domain_ok_rate | 1.0000 | 0.9667 | -0.0333 |
| report_mode_correct_rate | 1.0000 | 0.9889 | -0.0111 |
| citation_presence_rate | 1.0000 | 1.0000 | +0.0000 |
| stub_text_detected_rate | 0.0000 | 0.0000 | +0.0000 |

## 5) Top failure signatures before/after

### Baseline precheck

### Heavy tuned
- intent_mismatch: 3
- relation_packet_built: 3
- relation_dual_domain: 3
- bridge_count_low: 3
- evidence_count_low: 3
- report_mode_mismatch: 3

## 6) 12 raw excerpts (unique prompt IDs)

### relation
- `relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos` — Q: How does a warp bubble fit in with the mission ethos? — Excerpt: What is warp bubble: docs/knowledge/ethos/mission-ethos.md What is mission ethos: docs/ethos/ideology.json .. How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [docs/knowledge/
- `relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th` — Q: Explain the relation between warp bubble physics and mission ethos in this repo. — Excerpt: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/
- `relation_03_warp-bubble-ideology-relation-what-is-the-bridge` — Q: Warp bubble ↔ ideology relation: what is the bridge? — Excerpt: In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] In practice, coupled constraints and feedback loops determine how outcomes evolve over
- `relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics` — Q: How do we connect Natario warp bubble constraints to mission ethics? — Excerpt: what_is_warp_bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble calculations with the 

### repo_technical
- `repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c` — Q: Walk through /api/agi/ask routing from intent detection to final answer cleanup. — Excerpt: Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retrieval, evidence gates, 
- `repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode` — Q: How does Helix Ask choose report mode vs hybrid explain mode? — Excerpt: Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 1. Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `doc
- `repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload` — Q: Where are relation packet fields built and surfaced in debug payload? — Excerpt: what_is_warp_bubble: client/src/hooks/use-energy-pipeline.ts export interface GreensPayload kind: GreensKind; m: number; // mass parameter for Helmholtz (0 ⇒ Poisson limit) normalize: boolean; phi: Float32Array; // normalized or raw potenti
- `repo_tech_04_explain-evidence-gate-flow-and-where-citation-repair-is-applied` — Q: Explain evidence gate flow and where citation repair is applied. — Excerpt: In plain language, Repair Debt Compact means harm creates a repair debt that must be restored, audited, and time-bounded. [docs/knowledge/ethos/repair-debt-compact.md] This is in the ideology scope. [docs/knowledge/ethos/repair-debt-compact

### ambiguous_general
- `ambiguous_01_define-lattice` — Q: Define lattice. — Excerpt: Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir lattice is the tile
- `ambiguous_02_what-s-a-cavity` — Q: What's a cavity? — Excerpt: In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints. [docs/knowledge/cavity-mechanism.md] - Evidence: Interpretation: "ca
- `ambiguous_03_explain-resonance-in-simple-terms` — Q: Explain resonance in simple terms. — Excerpt: Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree .. [docs/knowledge/trees/resonance-tree.md
- `ambiguous_04_what-is-stability` — Q: What is stability? — Excerpt: Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] 

## 7) Casimir block
```json
{
  "verdict": "PASS",
  "firstFail": null,
  "traceId": "adapter:917debf4-397a-432e-8819-b54a1a626e39",
  "runId": "3319",
  "certificateHash": "6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45",
  "integrityOk": true
}
```

## 8) Provenance block
```json
{
  "provenance_gate_pass": true,
  "decision_grade_ready": true
}
```

## 9) Exact artifact path list with EXISTS/MISSING status

- `artifacts/experiments/helix-self-tune-precheck/versatility-1771565382186/summary.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/sweep/summary.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/sweep/winner.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/narrow-rerun/versatility-1771567698315/summary.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/heavy/versatility-1771567838142/summary.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/ab-t02/versatility-1771568090548/summary.json` :: EXISTS
- `artifacts/experiments/helix-self-tuner/ab-t035/versatility-1771568338604/summary.json` :: EXISTS
- `artifacts/training-trace-self-tuner-final.jsonl` :: EXISTS
- `reports/helix-self-tuner-sweep.md` :: EXISTS
- `reports/helix-self-tuner-final-decision.md` :: EXISTS

## 10) If NO-GO: top 3 fastest next patches in priority order
1. Add novelty-aware response diversification in ambiguous/repo families while preserving strict relation/report hard guards.
2. Introduce controlled paraphrase branch keyed by seed+temp with citation invariants to lift novel_response_rate at t=0.2/0.35.
3. Add novelty metric into tuner objective (strict-gate preserving) and rerun sweep with latency tie-break.