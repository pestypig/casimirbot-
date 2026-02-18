# Helix Ask PS2 Runtime Contract (2026-02-18T22-12-35-620Z)

Run config: seeds=7,11,13; temperature=0.2; debug=true.

| Gate | Threshold | Measured | Pass |
|---|---:|---:|:--:|
| placeholder_fallback_rate | == 0 | 0.000 | ✅ |
| empty_scaffold_rate | == 0 | 0.000 | ✅ |
| mechanism_sentence_present_rate | >= 0.95 | 1.000 | ✅ |
| maturity_label_present_rate | >= 0.95 | 1.000 | ✅ |
| citation_presence_rate | >= 0.95 | 1.000 | ✅ |
| min_text_length_pass_rate | >= 0.95 | 1.000 | ✅ |
| p95_latency | <= 2500ms | 2233.000 | ✅ |
| non_200_rate | <= 0.02 | 0.000 | ✅ |

## Before/after snippets
- Q: How does the universe produce life (seed 7)
  - Before: Answer grounded in retrieved evidence.
  - After: Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...  Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: W
- Q: How does the universe produce life (seed 11)
  - Before: Answer grounded in retrieved evidence.
  - After: Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...  Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: W
- Q: How does the universe produce life (seed 13)
  - Before: Answer grounded in retrieved evidence.
  - After: Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: WARP_AGENTS.md and related...  Math maturity stages describe how confident the repo is in a result (exploratory, diagnostic, or certified). Key questions: Which stage applies and what claims are allowed at that stage? Notes: W
- Q: How can a Human protect itself from an AI financial hack (seed 7)
  - Before: Unverified: No repo-evidenced claims were confirmed yet. Need at least two grounded points before drawing a connection.
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time.  Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.  Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground
- Q: How can a Human protect itself from an AI financial hack (seed 11)
  - Before: Unverified: No repo-evidenced claims were confirmed yet. Need at least two grounded points before drawing a connection.
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time.  Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.  Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground
- Q: How can a Human protect itself from an AI financial hack (seed 13)
  - Before: Unverified: No repo-evidenced claims were confirmed yet. Need at least two grounded points before drawing a connection.
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time.  Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts.  Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground

Artifacts: artifacts/experiments/helix-ask-ps2/2026-02-18T22-12-35-620Z