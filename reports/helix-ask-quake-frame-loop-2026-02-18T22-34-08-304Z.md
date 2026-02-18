# Helix Ask PS2 Runtime Contract (2026-02-18T22-34-08-304Z)

Run config: seeds=7,11,13; temperature=0.2; debug=true.

| Gate | Threshold | Measured | Pass |
|---|---:|---:|:--:|
| placeholder_fallback_rate | == 0 | 0.000 | ✅ |
| empty_scaffold_rate | == 0 | 0.000 | ✅ |
| mechanism_sentence_present_rate | >= 0.95 | 0.000 | ❌ |
| maturity_label_present_rate | >= 0.95 | 0.000 | ❌ |
| claim_citation_link_rate | >= 0.90 | 0.000 | ❌ |
| unsupported_claim_rate | <= 0.10 | 1.000 | ❌ |
| repetition_penalty_fail_rate | <= 0.10 | 0.000 | ✅ |
| contradiction_flag_rate | <= 0.10 | 0.000 | ✅ |
| min_text_length_pass_rate | >= 0.95 | 0.000 | ❌ |
| p95_latency | <= 2500ms | 2384.000 | ✅ |
| non_200_rate | <= 0.02 | 1.000 | ❌ |

## Before/after snippets
- Q: How does the universe produce life (seed 7)
  - Before: before unavailable
  - After: 
- Q: How does the universe produce life (seed 11)
  - Before: before unavailable
  - After: 
- Q: How does the universe produce life (seed 13)
  - Before: before unavailable
  - After: 
- Q: How can a Human protect itself from an AI financial hack (seed 7)
  - Before: before unavailable
  - After: 
- Q: How can a Human protect itself from an AI financial hack (seed 11)
  - Before: before unavailable
  - After: 
- Q: How can a Human protect itself from an AI financial hack (seed 13)
  - Before: before unavailable
  - After: 

Artifacts: artifacts/experiments/helix-ask-quake-frame-loop/2026-02-18T22-34-08-304Z