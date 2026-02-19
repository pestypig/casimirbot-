# Helix Ask PS2 Runtime Contract (2026-02-19T00-11-39-393Z)

Run config: fixed prompt set, seeds=7,11,13; temperature=0.2; debug=true.
Baseline report: reports/helix-ask-ps2-runtime-contract-2026-02-19T00-11-14-730Z.md

| Metric | Threshold | Before | After | Delta | Pass |
|---|---:|---:|---:|---:|:--:|
| claim_citation_linkage_pass_rate | >= 0.90 | 0.000 | 1.000 | +1.000 | PASS |
| mechanism_sentence_present_rate | >= 0.95 | 1.000 | 1.000 | +0.000 | PASS |
| maturity_label_present_rate | >= 0.95 | 1.000 | 1.000 | +0.000 | PASS |
| citation_presence_rate | >= 0.95 | 1.000 | 1.000 | +0.000 | PASS |
| strict_fail_determinism_rate | == 1.00 | 1.000 | 1.000 | +0.000 | PASS |
| p95_latency_ms | <= 2500 | 1133.000 | 1095.000 | -38.000 | PASS |
| non_200_rate | <= 0.02 | 0.000 | 0.000 | +0.000 | PASS |

## Strict fail determinism probe

| Seed | Attempt | Key |
|---:|---:|---|
| 7 | 1 | 200:ambiguity_clarify |
| 7 | 2 | 200:ambiguity_clarify |
| 7 | 3 | 200:ambiguity_clarify |
| 11 | 1 | 200:ambiguity_clarify |
| 11 | 2 | 200:ambiguity_clarify |
| 11 | 3 | 200:ambiguity_clarify |
| 13 | 1 | 200:ambiguity_clarify |
| 13 | 2 | 200:ambiguity_clarify |
| 13 | 3 | 200:ambiguity_clarify |

## Before/after snippets
- Q: How does the universe produce life (seed 7, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. (see docs/stellar-consc... Mechanism: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench*
  - Citations: docs/stellar-consciousness-orch-or-review.md, client/src/components/ElectronOrbitalPanel.tsx, client/src/hooks/useElectronOrbitSim.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, modules/co
- Q: How does the universe produce life (seed 11, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. (see docs/stellar-consc... Mechanism: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench*
  - Citations: docs/stellar-consciousness-orch-or-review.md, client/src/components/ElectronOrbitalPanel.tsx, client/src/hooks/useElectronOrbitSim.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, modules/co
- Q: How does the universe produce life (seed 13, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench**: - Coherent “clocks”:. (see docs/stellar-consc... Mechanism: Extending Orch‑OR to the Sun The review uses the Sun as a **macro‑workbench*
  - Citations: docs/stellar-consciousness-orch-or-review.md, client/src/components/ElectronOrbitalPanel.tsx, client/src/hooks/useElectronOrbitSim.ts, server/services/essence/template-synthesizer.ts, shared/essence-themes.ts, modules/co
- Q: How can a Human protect itself from an AI financial hack (seed 7, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl
- Q: How can a Human protect itself from an AI financial hack (seed 11, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl
- Q: How can a Human protect itself from an AI financial hack (seed 13, status 200)
  - Fail reason: none
  - Before: before unavailable
  - After: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer grounded in retrieved evidence., because linked constraints amplify or dampen outcomes over time. Maturity (exploratory): this claim set is hypothesis-guided and not yet certified by dedicated test artifacts. Mechanism: Mechanism: Answer grounded in retrieved evidence. -> constrained interaction dynamics -> Answer ground
  - Citations: docs/knowledge/ethos/metric-integrity-guardrail.md, server/auth/jwt.ts, server/security/hull-guard.ts, server/routes/hull.capsules.ts, server/auth/policy.ts, server/auth/types.ts, server/routes/hull.status.ts, docs/knowl

Artifacts: artifacts/experiments/helix-ask-ps2/2026-02-19T00-11-39-393Z