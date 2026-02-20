# Helix Step-4 Heavy Rerun Final Decision (Fresh)

## 1) GO/NO-GO verdict
**NO-GO** — strict thresholds are not met and provenance gate remains blocked.

## 2) Strict threshold table
| Metric | Threshold | Value | PASS/FAIL |
|---|---:|---:|---|
| relation_packet_built_rate | >= 0.95 | 0.8667 | FAIL |
| relation_dual_domain_ok_rate | >= 0.95 | 0.9000 | FAIL |
| report_mode_correct_rate | >= 0.98 | 0.9222 | FAIL |
| citation_presence_rate | >= 0.99 | 1.0000 | PASS |
| stub_text_detected_rate | == 0.00 | 0.0000 | PASS |

## 3) Before/After vs pre-step4 baseline
| Metric | Before (versatility-1771461446899) | After (versatility-1771545587120) | Delta |
|---|---:|---:|---:|
| relation_packet_built_rate | 0.8667 | 0.8667 | -0.0000 |
| relation_dual_domain_ok_rate | 0.8667 | 0.9000 | +0.0333 |
| report_mode_correct_rate | 0.9222 | 0.9222 | +0.0000 |
| citation_presence_rate | 0.9667 | 1.0000 | +0.0333 |
| stub_text_detected_rate | 0.0000 | 0.0000 | +0.0000 |

## 4) Top failure signatures before/after
| Rank | Before | After |
|---:|---|---|
| 1 | report_mode_mismatch (21) | report_mode_mismatch (21) |
| 2 | relation_packet_built (12) | relation_packet_built (12) |
| 3 | relation_dual_domain (12) | relation_dual_domain (9) |
| 4 | bridge_count_low (12) | intent_mismatch (6) |
| 5 | evidence_count_low (12) | bridge_count_low (6) |

## 5) Representative excerpts (12; unique prompt IDs)
| Family | Prompt ID | Excerpt | Failures |
|---|---|---|---|
| relation | relation_01_how-does-a-warp-bubble-fit-in-with-the-mission-ethos | What is warp bubble: docs/knowledge/ethos/mission-ethos.md What is mission ethos: docs/ethos/ideology.json .. How they connect: Mission ethos constrains warp development to measured, auditable checkpoints before deployme... | none |
| relation | relation_02_explain-the-relation-between-warp-bubble-physics-and-mission-ethos-in-th | The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [d... | none |
| relation | relation_03_warp-bubble-ideology-relation-what-is-the-bridge | In this repo, a warp bubble is a modeled spacetime region defined by a shift vector field and expansion constraints. [docs/knowledge/warp/warp-bubble.md] In practice, coupled constraints and feedback loops determine how ... | none |
| relation | relation_04_how-do-we-connect-natario-warp-bubble-constraints-to-mission-ethics | what_is_warp_bubble: modules/warp/warp-module.ts /** * TheoryRefs: * - vanden-broeck-1999: input normalization + clamps for gamma_VdB */ /** * Warp Bubble Casimir Module * Integrates Natário zero-expansion warp bubble ca... | relation_packet_built:false; relation_dual_domain:false |
| repo_technical | repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retriev... | report_mode_mismatch:true |
| repo_technical | repo_tech_02_how-does-helix-ask-choose-report-mode-vs-hybrid-explain-mode | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 1. Notes: The gap between current reasoning guards and full scientific-method rigo... | report_mode_mismatch:true |
| repo_technical | repo_tech_03_where-are-relation-packet-fields-built-and-surfaced-in-debug-payload | what_is_warp_bubble: client/src/hooks/use-energy-pipeline.ts export interface GreensPayload kind: GreensKind; m: number; // mass parameter for Helmholtz (0 ⇒ Poisson limit) normalize: boolean; phi: Float32Array; // norma... | none |
| repo_technical | repo_tech_04_explain-evidence-gate-flow-and-where-citation-repair-is-applied | In plain language, Repair Debt Compact means harm creates a repair debt that must be restored, audited, and time-bounded. [docs/knowledge/ethos/repair-debt-compact.md] This is in the ideology scope. [docs/knowledge/ethos... | none |
| ambiguous_general | ambiguous_01_define-lattice | Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir... | report_mode_mismatch:true |
| ambiguous_general | ambiguous_02_what-s-a-cavity | In this repo, a cavity is the Casimir/drive cavity mechanism where geometry, gap, and quality factor (Q) control stored energy, loss, and pipeline-level drive constraints. [docs/knowledge/cavity-mechanism.md] - Evidence:... | none |
| ambiguous_general | ambiguous_03_explain-resonance-in-simple-terms | Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree json"]... [docs/knowledge/trees/resonance-tree.md] Resonance and Code-Lattice Tree .. [docs/knowledge/tre... | none |
| ambiguous_general | ambiguous_04_what-is-stability | Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/sta... | report_mode_mismatch:true |

## 6) Casimir PASS details
- traceId: `adapter:1ced8119-daa3-4bb7-90ca-00576b8225ff`
- runId: `3737`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`

## 7) Provenance status
- decision_grade_ready: `false`
- provenance_gate_pass: `false`

## 8) Artifact paths
- `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771545587120/summary.json`
- `artifacts/experiments/helix-step4-heavy-rerun/versatility-1771545587120/recommendation.json`
- `reports/helix-step4-heavy-rerun.md`
- `artifacts/experiments/helix-step4-ab-rerun/t02/helix_step4_rerun_t02/summary.json`
- `artifacts/experiments/helix-step4-ab-rerun/t035/helix_step4_rerun_t035/summary.json`
- `artifacts/experiments/helix-ask-quake-weight-tuning/20260220T000829Z/summary.json`
- `artifacts/experiments/helix-step4-heavy-rerun/training-trace-export.jsonl`

## Utility AB robustness snapshot
- t=0.2 avg_utility=0.9173, novelty_pass=false, blockers: novel_response_rate 0.667 < 0.820; novel_response_rate_relation 0.667 < 0.800; novel_response_rate_repo_technical 0.500 < 0.850
- t=0.35 avg_utility=0.9173, novelty_pass=false, blockers: novel_response_rate 0.667 < 0.820; novel_response_rate_relation 0.667 < 0.800; novel_response_rate_repo_technical 0.500 < 0.850
