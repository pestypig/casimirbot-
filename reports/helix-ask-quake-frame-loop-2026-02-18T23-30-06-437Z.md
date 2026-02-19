# Helix Ask PS2 Runtime Contract (2026-02-18T23-30-06-437Z)

Run config: seeds=7,11,13; temperature=0.2; debug=true.

| Gate | Threshold | Measured | Pass |
|---|---:|---:|:--:|
| placeholder_fallback_rate | == 0 | 0.000 | PASS |
| empty_scaffold_rate | == 0 | 0.000 | PASS |
| mechanism_sentence_present_rate | >= 0.95 | 0.000 | FAIL |
| maturity_label_present_rate | >= 0.95 | 0.000 | FAIL |
| claim_citation_link_rate | >= 0.90 | 0.000 | FAIL |
| unsupported_claim_rate | <= 0.10 | 1.000 | FAIL |
| repetition_penalty_fail_rate | <= 0.10 | 0.000 | PASS |
| contradiction_flag_rate | <= 0.10 | 0.000 | PASS |
| min_text_length_pass_rate | >= 0.95 | 0.000 | FAIL |
| p95_latency | <= 2500ms | 1664.000 | PASS |
| non_200_rate | <= 0.02 | 1.000 | FAIL |

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

Artifacts: artifacts\experiments\helix-ask-quake-frame-loop\2026-02-18T23-30-06-437Z