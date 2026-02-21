# Helix NO-GO Closure Audit

## Verdict

**NO-GO**

## Method (git-only, replayable)

- Package input: `reports/helix-decision-package.json`.
- Validation input: committed `reports/helix-decision-validate.json` and fresh validator replay to temp output.
- Fresh validation capture: `/tmp/helix-decision-validate-1771705325092.json` (generated during this audit run).
- Artifact existence checks use `git cat-file -e <ref>:<path>` only (no filesystem checks).
- Baseline ref for comparison: N/A.

## Evidence table

| Path | Baseline (N/A) | HEAD (`git cat-file -e HEAD:<path>`) | Note |
|---|---|---|---|
| `artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `artifacts/experiments/helix-release-readiness-cloud-v4/narrow/versatility-1771703151463/summary.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/recommendation.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `artifacts/experiments/helix-release-readiness-cloud-v4/casimir-verify-normalized.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `artifacts/experiments/helix-release-readiness-cloud-v4/ab/t02/helix_release_readiness_cloud_v4_t02/summary.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `artifacts/experiments/helix-release-readiness-cloud-v4/ab/t035/helix_release_readiness_cloud_v4_t035/summary.json` | N/A | **MISSING** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |
| `schemas/helix-decision-package.schema.json` | N/A | **EXISTS** | no baseline ref (`origin/HEAD`, `origin/main`, `main`) available in this clone |

## Drift findings

- Drift status: **NO-DRIFT**.
- Committed validate snapshot: `ok=false`, `failure_count=20`, first3=["source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json","source_path_missing:relation_dual_domain_ok_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json","source_path_missing:report_mode_correct_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json"].
- Fresh validate snapshot: `ok=false`, `failure_count=20`, first3=["source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json","source_path_missing:relation_dual_domain_ok_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json","source_path_missing:report_mode_correct_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json"].
- Validation failures captured below are sourced from fresh replay output and are reproducible via: `npx tsx scripts/helix-decision-validate.ts --package reports/helix-decision-package.json`.

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

## Top 3 concrete fixes (from first failing blockers)
1. `source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
2. `source_path_missing:relation_dual_domain_ok_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`
3. `source_path_missing:report_mode_correct_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-1771703288538/summary.json`

## Command log
- ✅ `git fetch --all --prune` (status: 0, stdout: `(none)`, stderr: `(none)`)
- ❌ `git remote show origin` (status: 128, stdout: `(none)`, stderr: `fatal: 'origin' does not appear to be a git repository
fatal: Could not read from remote repository.

Please make sure you have the correct access rights
and the repository exists.`)
- ❌ `npx tsx scripts/helix-decision-validate.ts --package reports/helix-decision-package.json` (status: 1, stdout: `{
  "ok": false,
  "package_path": "reports/helix-decision-package.json",
  "failures": [
    "source_path_missing:relation_packet_built_rate:artifacts/experiments/helix-release-readiness-cloud-v4/heavy/versatility-17717…`, stderr: `npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.`)
