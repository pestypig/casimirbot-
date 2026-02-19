# Helix Ask Random Versatility Gauntlet (20260219T191659Z)

## Readiness verdict
- Overall readiness: **NO-GO**
- Decision: `needs_patch`
- Run complete: `True`

## Configuration
- Prompt families: relation, repo_technical, ambiguous_general
- Canary seeds: 7
- Full seeds: 7,11,13
- Temperature: 0.2
- Prompt order mode: stratified_seeded

## Deterministic replay check
- Canary decision: `needs_patch`
- Replay decision: `needs_patch`
- Stable aggregate verdict: `True`

## Top failure signatures (full)
- report_mode_mismatch: 21
- relation_packet_built: 12
- relation_dual_domain: 12
- bridge_count_low: 12
- evidence_count_low: 12
- citation_missing: 9
- intent_mismatch: 6

## Per-family pass/fail
| family | runs | pass_rate |
|---|---:|---:|
| relation | 90 | 0.867 |
| repo_technical | 90 | 0.833 |
| ambiguous_general | 90 | 0.833 |
