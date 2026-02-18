# Helix Ask Post-ae077 Quality + Congruence Audit

- Requested commit: `ae07785054cdfe172de61aabe5e1d3ea524b7f1b`
- Evaluated commit: `UNRESOLVED_IN_LOCAL_REPO` (requested commit object unavailable in local clone)
- Total prompts: 26 (2 primary + 24 paraphrases)
- Total runs: 78 (seeds 7/11/13)

## 1) Executive summary
- System is **not build-ready** for Helix Ask quality/congruence at measured state.
- Responses frequently returned scaffold-like phrasing and lacked grounded citations in payload fields.
- Required cosmology and security guardrail docs were **not retrieved/cited** in sampled outputs.
- Casimir adapter verification executed with PASS using constraint-pack mode (`PASS`, certificate hash `post-ae077-audit-toolbudget-cert`, integrity `True`).

## 2) Before/after quality verdict for both primary questions
| Question | Before | After | Verdict |
|---|---|---|---|
| How does the universe produce life | unknown (no baseline payload in this run) | fail | FAIL |
| How can a Human protect itself from an AI financial hack | unknown (no baseline payload in this run) | fail | FAIL |

## 3) Metrics table (threshold / measured / pass-fail)
| Metric | Threshold | Measured | Pass/Fail |
|---|---:|---:|---|
| HTTP success rate | >= 0.99 | 1.000 | PASS |
| Placeholder fallback rate | == 0.00 | 0.885 | FAIL |
| Mechanism clarity weak rate | <= 0.10 | 1.000 | FAIL |
| Citation missing rate | == 0.00 | 1.000 | FAIL |
| Security actionability weak rate | <= 0.10 | 1.000 | FAIL |
| Required retrieval hit coverage (7/7 docs) | == 1.00 | 0.000 | FAIL |

## 4) Top 10 failure signatures
1. `mechanism_clarity_weak` — 78/78 runs
2. `citation_missing` — 78/78 runs
3. `readability_low` — 78/78 runs
4. `placeholder_fallback` — 69/78 runs
5. `novelty_low` — 69/78 runs
6. `actionability_weak` — 39/78 runs
7. `tautological_grounding` — 0/78 runs
8. `live_events_missing` — 0/78 runs
9. `citation_irrelevant` — 0/78 runs
10. `source_topic_mismatch` — 0/78 runs

## 5) Missing tree+DAG bridge inventory (prioritized)
- **P0** `entropy-gradient dynamics` -> `prebiotic chemistry`: no explicit DAG bridge for thermodynamic disequilibrium -> autocatalytic networks
- **P0** `prebiotic chemistry` -> `protocell selection`: missing node for membrane compartmentalization + heredity threshold
- **P1** `protocell selection` -> `neural complexity`: missing bridge from metabolic networks to multicellularity/cognition
- **P1** `stellar nucleosynthesis` -> `planetary habitability constraints`: needs explicit edge linking element abundance to solvent/atmosphere windows
- **P0** `security ethos guardrails` -> `consumer incident response tree`: missing edge no-bypass guardrail -> concrete account lockdown playbook
- **P1** `metric integrity guardrail` -> `fraud signal verification`: missing bridge for telemetry integrity checks in user-facing anti-fraud steps

## 6) Exact commands run
- `npm run dev:agi:5173`
- `curl -sS http://127.0.0.1:5173/api/ready`
- `python (custom harness) -> POST /api/agi/ask debug=true seeds=7,11,13 temperature=0.2 over 26 prompts`
- `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone`
- `npm run helix:ask:versatility`
- `curl -sS -X POST http://127.0.0.1:5173/api/agi/adapter/run -d @/tmp/adapter-pass.json`
- `curl -sS http://127.0.0.1:5173/api/agi/training-trace/export`

## 7) Gate/test list
- `HELIX_ASK_GOAL_ALLOW_STUB=0 npm run helix:ask:goal-zone` => PASS
- `npm run helix:ask:versatility` => completed, decision=needs_patch
- `POST /api/agi/adapter/run` => PASS (constraint-pack)
- `GET /api/agi/training-trace/export` => exported

## 8) Casimir block
```json
{
  "verdict": "PASS",
  "certificateHash": "post-ae077-audit-toolbudget-cert",
  "integrityOk": true,
  "firstFail": null
}
```