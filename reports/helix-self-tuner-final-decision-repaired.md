# Helix Self-Tuner Final Decision (Repaired)

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
| provenance_gate_pass | 0.0000 | 1.00 | ❌ |
| decision_grade_ready | 0.0000 | 1.00 | ❌ |

## 3) Novelty table (utility AB source of truth)

| Temperature | novel_response_rate | relation | repo_technical | ambiguous_general | Target | Pass | Source |
|---|---:|---:|---:|---:|---:|:--:|---|
| 0.20 | 0.6389 | 0.5833 | 0.4167 | 0.9167 | 0.82 | ❌ | `artifacts/experiments/helix-self-tuner-repair/ab/t02/tuned/summary.json` |
| 0.35 | 0.6389 | 0.5833 | 0.4167 | 0.9167 | 0.82 | ❌ | `artifacts/experiments/helix-self-tuner-repair/ab/t035/tuned/summary.json` |

## 4) Before/after table (baseline vs repaired heavy)

| Metric | Baseline | After (heavy repaired) | Delta |
|---|---|---:|---|
| relation_packet_built_rate | not available (baseline artifact missing in repo) | 0.9667 | not available |
| relation_dual_domain_ok_rate | not available (baseline artifact missing in repo) | 0.9667 | not available |
| report_mode_correct_rate | not available (baseline artifact missing in repo) | 0.9889 | not available |
| citation_presence_rate | not available (baseline artifact missing in repo) | 1.0000 | not available |
| stub_text_detected_rate | not available (baseline artifact missing in repo) | 0.0000 | not available |

## 5) Top failure signatures before and after

### Baseline (before)
- not available: baseline failures artifact missing in current workspace snapshot.

### Repaired heavy (after)
- intent_mismatch: 3
- relation_packet_built: 3
- relation_dual_domain: 3
- bridge_count_low: 3
- evidence_count_low: 3
- report_mode_mismatch: 3

## 6) 12 representative excerpts (unique prompt IDs)

### relation
- `relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos` — Q: How does a warp bubble fit in with the mission ethos? — Excerpt: What is warp bubble: docs/knowledge/ethos/mission-ethos.md  What is mission ethos: docs/ethos/ideology.json .. How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deploym
- `relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th` — Q: Explain the relation between warp bubble physics and mission ethos in this repo. — Excerpt: The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [d
- `relation_03_warp-bubble-ideology-relation-what-is-the-bridge` — Q: Warp bubble ↔ ideology relation: what is the bridge? — Excerpt: In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] In practice, coupled constraints and feedback loops determine how 
- `relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics` — Q: How do we connect Natario warp bubble constraints to mission ethics? — Excerpt: what_is_warp_bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble ca

### repo_technical
- `repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c` — Q: Walk through /api/agi/ask routing from intent detection to final answer cleanup. — Excerpt: Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retriev
- `repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode` — Q: How does Helix Ask choose report mode vs hybrid explain mode? — Excerpt: what_is_warp_bubble: docs/helix-ask-flow.md. 1. what_is_mission_ethos: docs/helix-ask-flow.md. 2. how_they_connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployment. [docs/kn
- `repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload` — Q: Where are relation packet fields built and surfaced in debug payload? — Excerpt: what_is_warp_bubble: client/src/hooks/use-energy-pipeline.ts export interface GreensPayload kind: GreensKind; m: number; // mass parameter for Helmholtz (0 ⇒ Poisson limit) normalize: boolean; phi: Float32Array; // norma
- `repo_tech_04_explain-evidence-gate-flow-and-where-citation-repair-is-applied` — Q: Explain evidence gate flow and where citation repair is applied. — Excerpt: process.env.ENABLE_ESSENCE = "1"; process.env.ENABLE_AUTH = "0"; process.env.SPECIALISTS_MAX_REPAIR = "1"; process.env.DATABASE_URL = process.env.DATABASE_URL ?? [docs/knowledge/ethos/repair-debt-compact.md] process.env.

### ambiguous_general
- `ambiguous_01_define-lattice` — Q: Define lattice. — Excerpt: Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir
- `ambiguous_02_what-s-a-cavity` — Q: What's a cavity? — Excerpt: In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints. [docs/knowledge/cavity-mechanism.md] - Evidence:
- `ambiguous_03_explain-resonance-in-simple-terms` — Q: Explain resonance in simple terms. — Excerpt: Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree .. [docs/knowledge/tre
- `ambiguous_04_what-is-stability` — Q: What is stability? — Excerpt: Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/sta

## 7) Casimir block
```json
{
  "verdict": "PASS",
  "traceId": "adapter:adbe4c99-3489-4d60-aca9-55e0209efd2d",
  "runId": "624",
  "certificateHash": "6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45",
  "integrityOk": true
}
```

## 8) Provenance block
```json
{
  "evaluated_git_head": "abe03d2",
  "heavy_summary_git_head": "abe03d2",
  "ab_t02_commit": "abe03d2",
  "ab_t035_commit": "abe03d2",
  "provenance_gate_pass": false,
  "decision_grade_ready": false,
  "provenance_warnings": [
    "git_origin_remote_missing",
    "git_origin_main_ref_missing"
  ]
}
```

## 9) Artifact path table with filesystem EXISTS/MISSING status

| Path | Status |
|---|---|
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/summary.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/failures.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/recommendation.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/narrow/versatility-1771569607270/summary.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/ab/t02/tuned/summary.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/ab/t035/tuned/summary.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/ab/t02/tuned/recommendation.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/ab/t035/tuned/recommendation.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/training-trace-export.jsonl` | EXISTS |
| `reports/helix-self-tuner-repair-narrow.md` | EXISTS |
| `reports/helix-self-tuner-repair-heavy.md` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos-s11-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-relation_03_warp-bubble-ideology-relation-what-is-the-bridge-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c-s7-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode-s7-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-repo_tech_04_explain-evidence-gate-flow-and-where-citation-repair-is-applied-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-ambiguous_01_define-lattice-s7-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-ambiguous_02_what-s-a-cavity-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-ambiguous_03_explain-resonance-in-simple-terms-s13-t0p2.json` | EXISTS |
| `artifacts/experiments/helix-self-tuner-repair/heavy/versatility-1771569756041/raw/versatility-1771569756041-ambiguous_04_what-is-stability-s11-t0p2.json` | EXISTS |

## 10) If NO-GO: top 3 next patches
1. Restore provenance gate by running heavy evaluation in a branch with `origin/main` tracking so `provenance_gate_pass=true` and `decision_grade_ready=true`.
2. Fix relation prompt `relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer` routing/packet assembly to remove the recurring 3/3 relation packet misses.
3. Add novelty-specific generation controls for relation and repo_technical families to lift AB novelty rates above 0.82 at both temperatures.
