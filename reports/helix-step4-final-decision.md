# Helix Step 4 Strict Gates + Heavy Validation Decision

## 1) Final Verdict
**NO-GO** for MVP utility at this revision. Strict Step 4 gate thresholds are not met and utility AB novelty blockers remain at both t=0.2 and t=0.35.

## 2) Threshold Gate Table
| Metric | Threshold | Run Value | PASS/FAIL |
|---|---:|---:|---|
| relation_packet_built_rate | >= 0.95 | 0.8667 | FAIL |
| relation_dual_domain_ok_rate | >= 0.95 | 0.9000 | FAIL |
| report_mode_correct_rate | >= 0.98 | 0.9222 | FAIL |
| citation_presence_rate | >= 0.99 | 1.0000 | PASS |
| stub_text_detected_rate | == 0.00 | 0.0000 | PASS |

## 3) Before vs After Metrics (pre-step4 baseline vs this run)
| Metric | Before (versatility-1771461446899) | After (versatility-1771542681035) | Delta |
|---|---:|---:|---:|
| relation_packet_built_rate | 0.8667 | 0.8667 | -0.0000 |
| relation_dual_domain_ok_rate | 0.8667 | 0.9000 | +0.0333 |
| report_mode_correct_rate | 0.9222 | 0.9222 | +0.0000 |
| citation_presence_rate | 0.9667 | 1.0000 | +0.0333 |
| stub_text_detected_rate | 0.0000 | 0.0000 | +0.0000 |

## 4) Top Failure Signatures Before vs After
| Rank | Before | After |
|---:|---|---|
| 1 | report_mode_mismatch (21) | report_mode_mismatch (21) |
| 2 | relation_packet_built (12) | relation_packet_built (12) |
| 3 | relation_dual_domain (12) | relation_dual_domain (9) |
| 4 | bridge_count_low (12) | intent_mismatch (6) |
| 5 | evidence_count_low (12) | bridge_count_low (6) |

## 5) Representative Answer Excerpts (12)
| Family | Prompt ID | Excerpt | UX Grade | 1-line reason |
|---|---|---|---|---|
| relation | relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented | In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos... | C+ | intent_mismatch:repo.ideology_reference; relation_packet_built:undefined |
| relation | relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented | In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos... | C+ | intent_mismatch:repo.ideology_reference; relation_packet_built:undefined |
| relation | relation_24_could-warp-bubble-progress-violate-mission-ethos-how-is-that-prevented | In plain language, Mission Ethos means the warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] This is in the ideology scope. [docs/knowledge/ethos... | C+ | intent_mismatch:repo.ideology_reference; relation_packet_built:undefined |
| relation | relation_15_explain-warp-bubble-mission-ethos-for-a-skeptical-engineer | The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [docs/knowledge/ethos/mission-ethos.md] The warp vessel is a vow to return radiance to the Sun, pairing physics with compassion. [d... | C+ | intent_mismatch:hybrid.concept_plus_system_mapping; relation_packet_built:undefined |
| repo_technical | repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retriev... | C+ | report_mode_mismatch:true |
| repo_technical | repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retriev... | C+ | report_mode_mismatch:true |
| repo_technical | repo_tech_01_walk-through-api-agi-ask-routing-from-intent-detection-to-final-answer-c | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. The Helix Ask reasoning pipeline routes a prompt through intent selection, retriev... | C+ | report_mode_mismatch:true |
| repo_technical | repo_tech_19_what-are-top-fallback-reasons-emitted-in-debug-for-helix-ask-failures | Notes: The gap between current reasoning guards and full scientific-method rigor is tracked in `docs/helix-ask-scientific-method-gap.md`. 1. Notes: The gap between current reasoning guards and full scientific-method rigo... | C+ | report_mode_mismatch:true |
| ambiguous_general | ambiguous_01_define-lattice | Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir... | C+ | report_mode_mismatch:true |
| ambiguous_general | ambiguous_01_define-lattice | Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir... | C+ | report_mode_mismatch:true |
| ambiguous_general | ambiguous_01_define-lattice | Key questions: How many sectors are active and how is the lattice scheduled? [docs/knowledge/warp/casimir-lattice.md] Notes: The lattice logic is refl... [docs/knowledge/warp/casimir-lattice.md] - What it is: The Casimir... | C+ | report_mode_mismatch:true |
| ambiguous_general | ambiguous_04_what-is-stability | Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/stability-timestep.md] Key questions: How is the timestep chosen and which limits are enforced? [docs/knowledge/physics/sta... | C+ | report_mode_mismatch:true |

## 6) Casimir PASS Evidence

- verdict: **PASS**
- firstFail: None
- deltas: []
- certificateHash: `e58abff1a2ca7061cce7459eacbfd5cdc5466c56c84d17642108f2efdbb7c03f`
- integrityOk: `True`

## 7) Training Trace Export Evidence

- export path: `artifacts/experiments/helix-step4-heavy/training-trace-export.jsonl`
- line count: **483**

## 8) Exact Artifact Paths

- `artifacts/experiments/helix-step4-heavy/versatility-1771542681035/summary.json`
- `artifacts/experiments/helix-step4-heavy/versatility-1771542681035/failures.json`
- `reports/helix-step4-heavy.md`
- `artifacts/experiments/helix-step4-ab/t02/helix_step4_t02/summary.json`
- `artifacts/experiments/helix-step4-ab/t035/helix_step4_t035/summary.json`
- `artifacts/experiments/helix-step4-heavy/casimir-adapter.json`
- `artifacts/experiments/helix-step4-heavy/casimir-adapter-rerun.json`
- `artifacts/experiments/helix-step4-heavy/training-trace-export.jsonl`

## 9) Remaining Blockers + Fastest Next Fixes
1. **Relation packet construction under threshold** (0.8667 < 0.95): add deterministic relation packet fallback on hybrid/repo ideology intents before final response assembly.
2. **Dual-domain relation linking under threshold** (0.9000 < 0.95): enforce hard check requiring both warp+ethos evidence cards and re-route when one side missing.
3. **Report mode correctness under threshold** (0.9222 < 0.98): strengthen report-mode suppression policy for repo_technical/ambiguous families with explicit mode guard.

## Utility AB Snapshot
- t=0.2 avg_utility=0.9173 novelty_pass=false blockers=novel_response_rate 0.667 < 0.820; novel_response_rate_relation 0.667 < 0.800; novel_response_rate_repo_technical 0.500 < 0.850
- t=0.35 avg_utility=0.9173 novelty_pass=false blockers=novel_response_rate 0.667 < 0.820; novel_response_rate_relation 0.667 < 0.800; novel_response_rate_repo_technical 0.500 < 0.850
