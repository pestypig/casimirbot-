# Helix NO-GO Closure Audit

## Verdict

**NO-GO**

## Evidence table

| Path | origin/main (`git cat-file -e origin/main:<path>`) | HEAD (`git cat-file -e HEAD:<path>`) | Note |
|---|---|---|---|
| `artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json` | **MISSING** | **MISSING** | fatal: invalid object name 'origin/main'. |
| `schemas/helix-decision-package.schema.json` | **MISSING** | **EXISTS** | fatal: invalid object name 'origin/main'. |

## Drift findings

- Committed validate `ok`: `False`, rerun `ok`: `False`.
- Committed `failure_count`: `20`, rerun `failure_count`: `20`.
- **No drift detected**: rerun failures exactly match committed validation report.

## Blocker list (ordered)
1. `source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
2. `source_path_missing:relation_dual_domain_ok_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
3. `source_path_missing:report_mode_correct_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
4. `source_path_missing:citation_presence_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
5. `source_path_missing:stub_text_detected_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
6. `source_path_missing:runtime_fallback_answer:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
7. `source_path_missing:runtime_tdz_intentStrategy:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
8. `source_path_missing:runtime_tdz_intentProfile:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
9. `source_path_missing:provenance_gate_pass:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
10. `source_path_missing:decision_grade_ready:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json`
11. `source_path_missing:casimir_verdict_pass_integrity:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`
12. `novelty_source_missing:t02:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json`
13. `novelty_source_missing:t035:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json`
14. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
15. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
16. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json`
17. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json`
18. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json`
19. `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`
20. `decision_grade_requires_provenance_pass`

## Root cause classification

### Signal integrity
- `source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:relation_dual_domain_ok_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:report_mode_correct_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:citation_presence_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:stub_text_detected_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:runtime_fallback_answer:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
- `source_path_missing:runtime_tdz_intentStrategy:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
- `source_path_missing:runtime_tdz_intentProfile:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
- `source_path_missing:provenance_gate_pass:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:decision_grade_ready:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json`
- `source_path_missing:casimir_verdict_pass_integrity:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`

### Provenance
- `source_path_missing:provenance_gate_pass:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
- `source_path_missing:casimir_verdict_pass_integrity:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`
- `artifact_exists_true_but_missing:artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json`
- `decision_grade_requires_provenance_pass`

### Novelty
- `novelty_source_missing:t02:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json`
- `novelty_source_missing:t035:artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json`

## Recommended fix order (minimal trustworthy path)
1. **Artifact/source parity fix**: regenerate decision package with artifact `exists` flags computed from files actually committed, or commit referenced artifacts under `artifacts/experiments/helix-release-readiness-cloud-v4/**`.
2. **Validator/package consistency fix**: rerun `npm run helix:decision:validate -- --package reports/helix-decision-package.json` and commit updated `reports/helix-decision-validate.json` in same changeset as package updates.
3. **Provenance gate closure path**: rerun Casimir verification and ensure package points to a committed `casimir-verify-normalized.json` with pass+integrity evidence; then recompute decision recommendation to satisfy provenance gate.

## Top 3 concrete fixes
- **Artifact/source parity fix**: ensure every `source_path` and `artifacts[].path` exists in repo tree before packaging (preflight `git cat-file -e HEAD:<path>`).
- **Validator/package consistency fix**: add CI check that blocks if `reports/helix-decision-validate.json` differs from a fresh rerun against committed package.
- **Provenance gate closure path**: require decision-grade package to include committed Casimir pass artifact + certificate hash/integrity, then enforce `decision_grade_requires_provenance_pass` as hard gate.

## Command log
- ❌ `git fetch --prune` (no `origin` remote configured in this clone).
- ✅ `git checkout work`
- ❌ `git pull --ff-only` (branch has no upstream tracking remote).
- ✅ `npm ci`
- ❌ `npm run helix:decision:validate -- --package reports/helix-decision-package.json` (expected non-zero because validation failed with blockers).
