# Frozen Evidence Snapshot (Commit-Pinned)

Snapshot ID: `warp-evidence-snapshot-2026-03-02`

Boundary statement (verbatim):
“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Commit Pin
- Snapshot commit: `34809c78eb3d6d61101650e76c7713f5b7f999fc`

## Frozen artifact bundle
Machine snapshot JSON (local artifact):
- `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`

Required artifacts included in the snapshot:
- `docs/audits/research/warp-full-solve-campaign-execution-report-2026-02-24.md`
- `artifacts/research/full-solve/g4-calculator-2026-03-01.json`
- `artifacts/research/full-solve/g4-candidate-promotion-check-2026-03-01.json`
- `artifacts/research/full-solve/g4-promotion-bundle-2026-03-01.json`
- `reports/math-report.json`
- `artifacts/training-trace.jsonl`
- `artifacts/training-trace-export.jsonl`

## Frozen state summary

### Canonical-authoritative tier
- Canonical report decision label: `REDUCED_ORDER_ADMISSIBLE`
- Canonical scoreboard: `PASS=8, FAIL=0, UNKNOWN=0, NOT_READY=0, NOT_APPLICABLE=1`
- Canonical report embedded head commit: `3b86c282ad24e9c7df0d249ac1790db78a9eba58`
- Freshness against snapshot commit: `false`

### Promoted-candidate tier
- Solution category: `Needle Hull Mark 2`
- Profile version: `NHM2-2026-03-01`
- Calculator decision class: `candidate_pass_found`
- Calculator `marginRatioRawComputed`: `0.3649784322534293`
- Calculator applicability: `PASS`
- Candidate-promotion aggregate decision: `INADMISSIBLE`
- Candidate-promotion aggregate G4: `FAIL`
- `candidatePromotionReady=false`
- `candidatePromotionStable=false`
- Promotion bundle blocked reason: `promotion_check_not_ready:ready=false;stable=false`

### Certification fields
(from latest `artifacts/training-trace.jsonl` line)
- `traceId=adapter:943224fe-2f5d-4239-b562-dd99b4b19864`
- `runId=22346`
- `verdict=PASS`
- `firstFail=null`
- `certificateHash=6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- `integrityOk=true`

## Paper authoring controls
- Claim tiers must be separated: `canonical-authoritative`, `promoted-candidate`, `exploratory`.
- Materials bounds must be explicit constraints with numeric values and margins.
- Falsifiers and non-goals are mandatory sections.
- Boundary statement must remain verbatim.
- See: `docs/audits/research/warp-paper-authoring-contract-2026-03-02.md`
