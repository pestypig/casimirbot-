# Helix Ask Versatility Deep Research Audit (fixup)

- run_id: `20260219T023617Z`
- scope: research/reporting only (no runtime behavior changes)
- objective: finalize missing in-repo audit artifacts and correct availability claims against the current repository snapshot.

## Source artifact verification (required inputs)

| Path | Exists | Notes |
|---|---|---|
| `reports/helix-ask-versatility-report.md` | yes | Primary latest-matrix source used for metrics. |
| `reports/helix-ask-versatility-20260218T232914Z.md` | yes | Earlier campaign report present in repo. |
| `reports/helix-ask-post-e1ccd1e6-validation.md` | yes | Post-change validation report present in repo. |
| `reports/helix-ask-versatility-post-fix-20260218T233657Z-blocked-precheck.md` | yes | Blocked precheck report present in repo. |
| `artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/summary.json` | yes | Baseline JSON artifact present in current snapshot. |
| `artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/failures.json` | yes | Baseline JSON artifact present in current snapshot. |
| `artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/recommendation.json` | yes | Baseline JSON artifact present in current snapshot. |

## Latest matrix metrics (copied from `reports/helix-ask-versatility-report.md`)

- prompts: 90
- seeds: 7, 11, 13
- temperatures: 0.2
- expected_runs: 270
- total_runs: 270
- completion_rate: 100.00%
- run_complete: true
- intent_id_correct_rate: 93.33%
- report_mode_correct_rate: 92.22%
- relation_packet_built_rate: 86.67%
- relation_dual_domain_ok_rate: 86.67%
- citation_presence_rate: 96.67%
- min_text_length_pass_rate: 100.00%
- stub_text_detected_rate: 0.00%
- latency_total_p95_ms: 1931

## Corrections to prior inaccurate missing-artifact claims

Corrected in this fixup:
1. The following reports are present and must not be described as missing:
   - `reports/helix-ask-versatility-report.md`
   - `reports/helix-ask-versatility-20260218T232914Z.md`
   - `reports/helix-ask-post-e1ccd1e6-validation.md`
   - `reports/helix-ask-versatility-post-fix-20260218T233657Z-blocked-precheck.md`
2. The baseline JSON trio for `versatility-1771457356197` is present in current snapshot, but its metrics are runtime-failed (`request_failed=270`) and therefore non-informative for quality deltas.

## Deep-research outputs emitted

- `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/summary.json`
- `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/failure-taxonomy.json`
- `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/tool-friction.json`
- `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/counterfactuals.json`
- `artifacts/experiments/helix-ask-versatility-research/20260219T023617Z/recommendation.json`
- `docs/audits/helix-results/HELIX-PS2-versatility-deep-research-20260219T023617Z.json`

## Casimir verification requirement

This patch requires a PASS verdict with certificate hash and integrity true, and includes a trace export artifact.
