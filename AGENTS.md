# AGENTS

This repo uses `WARP_AGENTS.md` for warp-physics constraints and required tests.
Always read and follow those requirements when working on warp/GR features.

## Required: Casimir verification gate for any patch

When you make any code/config change:

1) Propose the patch (diff) as usual.
2) Run the verifier using the adapter endpoint.
3) If the verdict is FAIL:
   - fix the first failing HARD constraint
   - re-run verification
   - repeat until PASS
4) Do not claim completion unless you have a PASS and (when required by policy)
   a certificate hash with integrity OK.

### Verification call (adapter)
- Endpoint: `POST /api/agi/adapter/run`
- Expect: `verdict`, `firstFail`, `deltas`, and artifact refs.

### Trace export (for training/analytics)
- Endpoint: `GET /api/agi/training-trace/export` (JSONL)

### Auth + tenant isolation (when enabled)
- If `ENABLE_AGI_AUTH=1` or `AGI_TENANT_REQUIRED=1`, include:
  - `Authorization: Bearer <token>`
  - `X-Tenant-Id` (or `X-Customer-Id`)

### CI enforcement
- GitHub Actions workflow: `.github/workflows/casimir-verify.yml`

## Math maturity (informal)
- Treat math as staged: exploratory -> reduced-order -> diagnostic -> certified.
- Match claims and checks to maturity; don’t over-claim results from early stages.
