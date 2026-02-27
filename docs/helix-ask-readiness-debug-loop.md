# Helix Ask Readiness Debug Loop

Purpose: provide one repeatable local loop that converts prompt outcomes plus
debug telemetry into a readiness verdict with probabilities, not anecdotes.

Use this when changing Helix Ask routing, retrieval, scaffolds, fallback, output
cleaning, or ideology/frontier response behavior.

## Objective

1. Detect regressions quickly (`contract battery`).
2. Measure robustness across diverse prompts (`variety battery`).
3. Preserve hard gate integrity (`Casimir verify`).
4. Produce a quantitative scorecard per run.

## Runtime Preconditions

1. Start local server with live LLM path enabled.

```powershell
$env:PORT="5050"
$env:NODE_ENV="development"
$env:ENABLE_AGI="1"
$env:LLM_POLICY="http"
$env:LLM_RUNTIME="http"
$env:HULL_MODE="1"
$env:HULL_ALLOW_HOSTS="api.openai.com"
$env:LLM_HTTP_BASE="https://api.openai.com"
$env:OPENAI_API_KEY="<set real key>"
npm run dev
```

2. Confirm ask endpoint responds:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:5050/api/agi/ask
```

## Loop A: Contract Battery

Run deterministic regression checks for known contracts:

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_REGRESSION_AMBIGUITY="1"
$env:HELIX_ASK_REGRESSION_IDEOLOGY="1"
$env:HELIX_ASK_REGRESSION_FRONTIER_CONTINUITY="1"
npx tsx scripts/helix-ask-regression.ts
```

Record:

1. failing prompt labels
2. expected vs actual `intent_id` / `intent_domain`
3. output contract misses (`mustInclude` / `mustNotInclude`)

## Loop B: Variety Battery

Run broader prompt families with multiple seeds/temps:

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_VERSATILITY_START_SERVER="0"
$env:HELIX_ASK_VERSATILITY_SEEDS="7,11,13"
$env:HELIX_ASK_VERSATILITY_TEMPS="0.2"
$env:HELIX_ASK_VERSATILITY_TIMEOUT_MS="45000"
$env:HELIX_ASK_VERSATILITY_MAX_CASE_WALL_MS="60000"
$env:HELIX_ASK_VERSATILITY_FAIL_ON_INCOMPLETE="1"
npx tsx scripts/helix-ask-versatility-record.ts
```

Primary artifacts:

1. `artifacts/experiments/helix-ask-versatility/<run>/summary.json`
2. `artifacts/experiments/helix-ask-versatility/<run>/failures.json`
3. `reports/helix-ask-versatility-report.md` (or configured report path)

## Loop B2: Forward-Facing Prompt Batch

Run the focused sweep pack aligned to the forward-facing plan proposals:

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_SWEEP_PACK="scripts/helix-ask-forward-facing-sweep-pack.json"
$env:HELIX_ASK_SWEEP_OUT_DIR="artifacts/experiments/helix-ask-forward-facing"
npx tsx scripts/helix-ask-sweep.ts
```

Companion reference:

1. `docs/audits/research/helix-ask-forward-facing-prompt-batch-2026-02-27.md`

## Loop C: Casimir Gate (Required)

Run for every patch:

```powershell
npm run casimir:verify -- --pack repo-convergence --auto-telemetry --ci --trace-out artifacts/training-trace.jsonl --trace-limit 200 --url http://localhost:5050/api/agi/adapter/run --export-url http://localhost:5050/api/agi/training-trace/export
```

Record:

1. `verdict`
2. `runId`
3. `certificateHash`
4. `integrityOk`

If `verdict != PASS`, stop and fix first failing HARD constraint before any
readiness claim.

## Probability Scorecard

Compute per family and overall:

1. `P(route_correct | family) = route_correct_count / total_family_cases`
2. `P(frontier_scaffold_complete) = all_7_frontier_sections / frontier_cases`
3. `P(no_debug_leak) = no_debug_leak_cases / total_cases`
4. `P(no_runtime_fallback) = no_runtime_fallback_cases / total_cases`
5. `P(contract_satisfied | suite) = contract_pass_cases / contract_cases`

Recommended confidence reporting:

1. show point estimate
2. show 95% interval (Wilson or bootstrap)

## Readiness Gates

Hard gate (must pass):

1. Casimir `PASS` with certificate `integrityOk=true`
2. `P(frontier_scaffold_complete) >= 0.95`
3. `P(no_debug_leak) >= 0.99`
4. `P(no_runtime_fallback) >= 0.99` in live LLM mode

System readiness target:

1. `P(route_correct | family) >= 0.90` for `general`, `repo`, `hybrid`,
   `ambiguity`, `frontier`
2. no unresolved contract failures in regression suite

If hard gate passes but system readiness target fails, classify as:
`PARTIAL_READY`.

## Debug Hotspot Triage

Bucket each failure into one primary cause:

1. `routing_mismatch`
2. `contract_missing_required_section`
3. `debug_telemetry_leak`
4. `fallback_leak_or_runtime_fallback`
5. `citation_or_evidence_contract_miss`

Use bucket frequencies to prioritize fixes.

## Verdict Report Template

Use this structure for each run:

1. `Environment`: server url, date/time, LLM backend mode
2. `Contract battery`: pass/fail with failing labels
3. `Variety battery`: key probabilities by family
4. `Hotspots`: top 3 failure buckets with counts
5. `Casimir`: verdict, runId, certificate hash, integrity
6. `Final verdict`: `READY | PARTIAL_READY | NOT_READY`
7. `Next fix list`: explicit failing contracts/routes

## Minimum Artifact Bundle

Keep these paths in every handoff:

1. regression command output
2. variety `summary.json` and `failures.json`
3. Casimir verify output with certificate hash/integrity
4. one prompt/output/verdict evidence pack for representative failures

