# RC0 Index Exclusions Policy

This policy documents repo-index coverage gaps observed during the RC0 holdout
oracle run. The coverage audit uses path/symbol queries against the repo search
index (doc + code kinds). If the index fails to return a gold path within the
top-k results, it is recorded as an exclusion until the index ranking is
adjusted.

## RC0 Coverage Audit (2026-01-22)
- Holdout: `artifacts/rc0/holdout_cov_rc0.jsonl`
- Oracle metrics: `artifacts/rc0/agi-refinery-holdout-oracle.rc0.json`
- indexCoverageRate: 0.7875 (63 / 80)

### Excluded Paths
- `server/routes/agi.plan.ts` (count 12)
- `server/energy-pipeline.ts` (count 4)
- `modules/gr/gr-diagnostics.ts` (count 1)

## Policy
- Treat the excluded paths above as "index exclusions" for RC0 coverage
  reporting until repo-index ranking is tuned to return them for path queries.
- Do not block the RC0 dataset freeze on these exclusions.
- For workflows that require these files, use explicit path lookups or manual
  citations, and re-run the coverage oracle after any index ranking updates.

## Index Parameters
- `REPO_SEARCH_ROOTS`: `docs,docs/zen-ladder-pack,shared,client,server,src,modules,packages,sdk,tools,scripts,skills,tests,datasets,configs,public,reports`
- `REPO_SEARCH_CODE_ROOTS`: `server,client,shared,src,modules,packages,sdk,cli,tools,scripts,tests`
- `REPO_SEARCH_MAX_FILES`: `2400`
- `REPO_SEARCH_MAX_CODE_FILES`: `4000`
