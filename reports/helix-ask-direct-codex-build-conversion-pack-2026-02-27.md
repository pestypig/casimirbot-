# Helix Ask Direct Codex Build Conversion Pack (Prompt 0..N)

Date: 2026-02-27  
Repo: `pestypig/casimirbot-`

## Objective
Close blockers for direct codex build execution readiness by enforcing deterministic, path-bounded, Casimir-gated execution with certified-only promotion semantics.

## Blocker Policy
- Any HARD failure stops forward motion until fixed.
- First HARD fail is fixed first, then verification reruns.
- Casimir PASS (with certificate hash + integrity OK) is mandatory before completion claims.

## Prompt 0 (Provenance lock)
- **Allowed paths**: `reports/helix-ask-direct-codex-build-closure-2026-02-27.md`
- **Required outputs**:
  - branch name
  - commit SHA
  - dirty file inventory
- **Required checks**:
  - `git rev-parse --abbrev-ref HEAD`
  - `git rev-parse HEAD`
  - `git status --short`
- **Completion evidence fields**:
  - `slice_id`, `status`, `commit_sha`, `dirty_status_snapshot`

## Prompt 1 (Dependency DAG + graduation gates)
- **Allowed paths**:
  - `reports/helix-ask-direct-codex-build-dependency-dag-2026-02-27.json`
  - `reports/helix-ask-direct-codex-build-graduation-gates-2026-02-27.json`
- **Required outputs**:
  - machine-readable DAG with ordering and stop conditions
  - machine-readable gate semantics (report-only vs enforce)
- **Required checks**:
  - JSON parse both files with Node
- **Completion evidence fields**:
  - `dag_version`, `gate_version`, `json_parse_ok`

## Prompt 2 (Unified conversion procedure)
- **Allowed paths**:
  - `reports/helix-ask-direct-codex-build-conversion-pack-2026-02-27.md`
- **Required outputs**:
  - strict prompt slices 0..N
  - allowed paths per slice
  - per-slice Casimir block requirements
- **Required checks**:
  - markdown lint optional
- **Completion evidence fields**:
  - `prompt_count`, `slice_allowlists_declared`

## Prompt 3 (Path-bounded diff enforcement)
- **Allowed paths**:
  - `scripts/*`
  - `tests/*`
  - optional `reports/*`
- **Required outputs**:
  - deterministic allowlist checker
  - tests for pass/reject behavior
- **Required checks**:
  - targeted vitest execution
  - Casimir verify PASS
- **Completion evidence fields**:
  - `checker_path`, `test_results`, `casimir_verdict`

## Prompt 4 (Certified-only runtime promotion)
- **Allowed paths**:
  - `server/routes/knowledge.ts`
  - `server/services/*`
  - `shared/*`
  - `tests/*`
  - optional `docs/architecture/evolution-governance-contract.md`
- **Required outputs**:
  - enforceable runtime gate for certified-only promotion
  - typed rejection reason codes
  - tests for reject/allow cases
- **Required checks**:
  - targeted vitest execution
  - Casimir verify PASS
- **Completion evidence fields**:
  - `gate_codes`, `route_enforcement_mode`, `test_results`, `casimir_verdict`

## Prompt 5 (Readiness scoring + assessment deltas)
- **Allowed paths**:
  - `reports/helix-ask-direct-codex-build-readiness-scorecard-2026-02-27.json`
  - `reports/helix-ask-direct-codex-build-gap-matrix-2026-02-27.json`
  - `docs/audits/research/helix-ask-direct-codex-build-execution-readiness-assessment-2026-02-26.md`
  - `docs/audits/research/README.md`
- **Required outputs**:
  - weighted score rubric application
  - closed/open blocker matrix
  - assessment closure delta and evidence links
- **Required checks**:
  - JSON parse scorecard + gap matrix
- **Completion evidence fields**:
  - `score_total`, `blockers_closed`, `blockers_open`

## Prompt 6 (Final closure + verdict)
- **Allowed paths**:
  - `reports/helix-ask-direct-codex-build-closure-2026-02-27.md`
- **Required outputs**:
  - slice-by-slice closure summary
  - final readiness decision and rationale
  - final Casimir PASS evidence block
- **Required checks**:
  - final verification summary consistency check
- **Completion evidence fields**:
  - `final_decision`, `readiness_band`, `casimir_certificate_hash`, `casimir_integrity_ok`
