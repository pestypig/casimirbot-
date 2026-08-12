# Helix Ask Readiness Debug Loop

Purpose: provide one repeatable local loop that converts prompt outcomes plus
debug telemetry into a readiness verdict with probabilities, not anecdotes.

Use this when changing Helix Ask routing, retrieval, scaffolds, fallback, output
cleaning, or ideology/frontier response behavior.

Required context anchor for current malfunction class:
- `docs/helix-ask-retrieval-objective-resolution-plan-2026-03-03.md`

## Objective

1. Detect regressions quickly (`contract battery`).
2. Measure robustness across diverse prompts (`variety battery`).
3. Preserve hard gate integrity (`Casimir verify`).
4. Produce a quantitative scorecard per run.

## Runtime Preconditions

1. Use the already-running keyed localhost server when the test requires a live
   provider, Shared Live Room, GPT Realtime, account binding, or environment
   connector. With explicit user or active repository authorization, Codex
   Desktop may start it only through the configured opaque launcher:

```powershell
& 'C:\Users\dan\.local\bin\start-myapp-for-codex.cmd' '<canonical-workspace-path>'
```

   Treat the launcher as opaque. Do not read, patch, print, or reverse engineer
   it; do not inspect provider credential environment variables; and do not
   start a substitute keyed server. Wait for `[express] app ready` and use the
   reported local URL.

2. Verify the representative server surfaces without printing credentials:

```powershell
Invoke-WebRequest -UseBasicParsing http://localhost:1522/api/account/session
Invoke-WebRequest -UseBasicParsing http://localhost:1522/api/helix/pipeline
Invoke-WebRequest -UseBasicParsing http://localhost:1522/api/agi/agent-providers
```

   Confirm the configured Codex provider is launchable. A healthy text-only
   provider call does not prove GPT Realtime routing is healthy, and a generic
   Realtime error does not by itself prove the shared provider credential is
   invalid. Diagnose the failing route.

3. Static and deterministic unit tests may run without the keyed server. Do not
   present a mock, fallback, unkeyed, or ad hoc server as live-provider parity.

## Environment Capability Development Preflight

Before extending an environment connector or adding adapter rules, separate the
two unknowns: whether the environment can perform the operation and whether
Helix can carry a capable agent through it.

1. Checkpoint a consented test environment.
2. Run the natural objective through direct reference Codex access. Let Codex
   use the available environment command/capability surface and record public
   calls, observations, retries, postconditions, and final synthesis.
3. If direct Codex cannot complete the task, work on environment access,
   mechanics documentation, connector observations, or the capability itself.
   Do not add Helix routing or terminal exceptions yet.
4. If direct Codex succeeds, freeze that trace as the practical reference and
   express it as provider-neutral affordances and evidence contracts rather
   than a scripted solution.
5. Restore an equivalent environment state and run the same prompt through the
   keyed Helix API or UI. Use Loop A0 to find the first divergence.

The reference run proves feasibility and supplies a capability benchmark. The
Helix run proves governed end-to-end parity. Neither result substitutes for the
other.

## Single-Prompt Success Checklist (Current)

Use this checklist when validating one UI prompt quickly after a local patch.

### What success looks like

1. LLM transport health (core blocker)
2. Event log includes `Helix Ask: LLM answer - done` (not `Helix Ask: LLM answer - error`).
3. `debugContext` includes:
4. `llm_http_status=200`
5. `llm_provider_called=true`
6. no `llm_error_code`
7. If the call fails, failure details are specific and populated:
8. `llm_error_class` (`rate_limited`, `timeout`, `context_limit`, `circuit_open`, or `transport`)
9. `llm_error_code` (example: `llm_http_429:*`, `llm_http_timeout:*`, `llm_http_context_limit:400`)
10. `llm_retry_count`, `llm_attempt_count`, `llm_retry_delays_ms`, `llm_error_retry_after_ms`

11. Stage05 retrieval/handoff quality (filename-bias fix)
12. `stage05CardCount > 0`
13. `stage05SlotCoverage.ratio = 1`
14. Connectivity debug fields are present:
15. `stage05_input_connectivity_added_count`
16. `stage05_input_seed_signal_token_count`
17. `stage05_input_connected_hint_path_count`
18. For conceptual warp prompts, answer text references mechanism/context (not only path-name-level generic lines).

19. Composer/final assembly behavior
20. Prefer answer path markers:
21. `composerV2:brief_built`
22. `composerV2:expand_ok`
23. `composerV2:link_ok`
24. Avoid repeated fallback markers:
25. `composerV2:fallback_deterministic`
26. `composerV2:fallback_legacy`
27. Final answer must not include:
28. garbled code spill
29. duplicated boilerplate lines
30. scaffold/debug leakage
31. For uncertainty-sensitive turns, final validator requires repo-grounded support.
32. When codex-clone baseline telemetry is available, require codex-clone citations;
fail-safe with explicit insufficient-evidence language if missing.

### What means we still failed

1. `Helix Ask: LLM answer - error` is frequent and detailed class/code fields are missing.
2. `stage05CardCount` and slot coverage are healthy, but final text remains generic fallback prose.
3. Composer repeatedly lands on fallback markers despite healthy retrieval and healthy LLM transport.
4. Output quality regresses into malformed code-like fragments, duplicated lines, or leakage artifacts.

### Evidence to attach when scoring a run

1. final answer text
2. full `debugContext` JSON
3. event log lines around `LLM answer` and any `composerV2:*` markers

## Loop A0: First-Authority-Divergence Audit

Run this before changing prompt wording whenever Codex appears to have used a
tool correctly but Helix shows a failure, a different answer, or no answer.
The purpose is to find the first rail that changed a current-turn fact; later
symptoms are consequences, not separate model failures.

Capture this identity chain for the same Ask turn:

```txt
prompt and operator constraints
-> admitted capability and physical execution
-> settled observation refs
-> exact observation.reentered refs
-> post-observation Codex message hash
-> authorized provider candidate ref, text hash, and support refs
-> route-product materialization ref, text hash, and support refs
-> terminal single-writer ref, text hash, and support refs
-> visible/API/voice terminal hash
```

At each boundary, compare exact references and hashes. Do not infer re-entry
from a ledger entry, selected evidence, a successful receipt, or agreement
between mutable summary booleans. A failed or blocked observation may still
have re-entered Codex; transport re-entry and evidence admissibility are
separate facts.

Classify the first mismatch as one of:

```txt
tool execution
evidence normalization
evidence re-entry
follow-up reasoning
terminal materialization
terminal authority
presentation or voice relay
```

Then choose exactly one disposition:

- `adapter_projection_contradiction`: a later rail dropped, replaced, or
  relabeled a valid current-turn runtime fact. Add a focused poisoned-projection
  fixture, fix the shared contract, and rerun the original natural keyed turn.
- `repairable_evidence_rejection`: a claim lacks required support but an
  admitted measurement, calculation, retrieval, or clarification can repair
  it. Emit a non-terminal typed rejection observation with `gate`, stable
  `reason_codes`, `evidence_refs`, and `retryability`, then return control to
  Codex while budget remains.
- `hard_evidence_or_policy_boundary`: permission, identity, freshness,
  provenance, integrity, route policy, or exhausted repair budget forbids the
  candidate. Fail closed with the exact gate and reason codes; do not compose
  substitute explanatory prose downstream.

Scientific conventions remain hard where they protect measured values, units,
uncertainty, provenance, and claim support. They constrain what the Codex
candidate may claim; they do not become a competing answer writer. A repair is
accepted only when the focused synthetic fixture and the original natural
keyed-server/API or UI turn both preserve the same candidate and evidence
identity through terminal presentation.

### Loop A0.1: Direct Codex / Helix A-B differential

Use this comparison when the defect might be adapter-introduced and a direct
Codex path can operate against the same environment safely.

1. Freeze the user prompt, operator constraints, permission lease, capability
   descriptions, source/player/world identity, and starting environment state.
2. Run a reference Codex attempt. Give it the same capability documentation and
   observations Helix would expose. Record proposed calls, admitted calls,
   retries, settled observations, and final synthesis; do not export hidden
   reasoning or credentials.
3. Restore or checkpoint the environment when mutations would make the second
   run incomparable.
4. Run the same prompt through Helix Ask using the real keyed API or UI path.
5. Compare the traces at prompt interpretation, request/proposal, admission,
   execution, normalization, re-entry, follow-up message, provider candidate,
   route-product materialization, terminal selection, and presentation.
6. Treat direct success plus Helix failure as adapter-parity evidence only when
   the inputs and starting state were equivalent. Locate the first divergence
   before changing any boundary.

Direct console, server, or game commands are valuable for preflight and for
proving the environment can satisfy a request. They bypass Helix admission,
re-entry, and terminal projection, so they are not end-to-end acceptance by
themselves.

For newly developed environment capabilities, perform the direct run first.
Do not wait for a Helix failure to discover basic mechanics, required sensors,
or a workable command sequence. After feasibility is established, the Helix
run should preserve Codex's semantic choices while adding identity, permission,
provenance, evidence-quality, and terminal-eligibility checks.

Keep security and scientific evidence boundaries. Remove or repair only
adapter-owned logic that duplicates model step choice, invents goals, retries
privately, treats stale snapshots as runtime facts, or writes substitute prose.
A valid hard-boundary failure is parity; an unexplained downstream substitution
is not.

### Loop A0.2: Superseded failures

Failed attempts remain in provenance and debug history. They stop being active
terminal blockers only when current-turn evidence proves the corresponding
required subgoals later succeeded. The repair must preserve capability and
subgoal identity, strict attempt ordering, successful observation
normalization, provider re-entry, and candidate support refs.

Do not apply this rule to mutating attempts, a different capability, stale or
reverse ordering, or a final candidate that does not cover every required
observation. The candidate must still pass route-product, scientific/evidence
quality, and terminal-authority gates.

## Memory-Bounded Keyed Test Discipline

The Helix server, a Fabric server/client, browsers, builds, and Vitest workers
share one host resource budget. Preserve the validity of the test by keeping
that budget observable.

1. Record available and committed host memory before a broad run. Monitor host
   commit plus the relevant process working sets; one process's working set is
   not the full pressure signal.
2. Use the compiled-client low-memory server unless HMR is required. Run the
   smallest targeted fixture first, then one representative live prompt, then
   the broader battery.
3. Run only one heavy build or Vitest worker tree at a time. Avoid duplicate
   Helix, Fabric, browser, tunnel, and build processes.
4. Never print credential-bearing environment blocks or full process command
   lines while attributing memory. Do not disable application memory guards to
   make a test pass.
5. When a test stalls or a worker exits, identify its exact process tree and
   stop only that tree. Keep a healthy keyed server, Fabric server, and connector
   running so source epochs and room state are not needlessly invalidated.
6. Classify OS commit exhaustion, paging pressure, worker crashes, server
   crashes, provider transport errors, and product assertion failures
   separately. Rerun narrowly before assigning a product regression.
7. Keep periodic checks brief enough to continue reporting progress to the
   operator. Do not start a second monitoring runtime that materially increases
   pressure.

For environment connectors, use direct server-console status, checkpoint,
read-only probes, and reconnect operations for preflight when allowed. The
acceptance proof remains the natural prompt through Helix Ask/API or UI, with
the exact room, participant, player, source, connector epoch, and turn IDs in
the debug bundle.

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
$env:HELIX_ASK_VERSATILITY_PRECHECK_TIMEOUT_MS="30000"
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

## Loop B3: Per-Patch Randomized Probe

Run a seeded random sample every patch to check whether outcomes stay aligned
with the current retrieval objective plan (especially ideology/social prompts
avoiding physics concept drift).

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_PATCH_PROBE_SAMPLES="10"
$env:HELIX_ASK_PATCH_PROBE_REQUIRE_PLAN_CONTEXT="1"
$env:HELIX_ASK_PATCH_PROBE_FAIL_ON_MISS="1"
npx tsx scripts/helix-ask-patch-probe.ts
```

Record:

1. sample seed
2. pass/fail counts and pass rate
3. failed case signatures (`intent_domain`, `intent_id`, `concept_id`)
4. plan context hash (`sha256`) from the active plan file
5. artifact directory under `artifacts/experiments/helix-ask-patch-probe/*`

## Loop B4: Multilingual Golden-Set Gate (zh + zh+en mixed)

Run the fixed multilingual gate before promoting multilingual rollout from
partial to full:

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
npm run helix:ask:multilang:golden-gate
```

Required pass bars:

1. `zh route/intention accuracy >= 0.92`
2. `zh+en mixed route/intention accuracy >= 0.90`
3. `canonical term preservation >= 99.5%`
4. `response-language correctness >= 99.0%`
5. `low-confidence dispatch violations = 0`

Primary artifact:

1. `artifacts/experiments/helix-ask-multilang-golden/helix-ask-multilang-golden-gate.<timestamp>.json`

## Loop B5: Equation Benchmark (Anchor + Mechanism Quality)

Run the equation benchmark pack when tuning equation selection/rerank behavior.

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_EQUATION_BENCHMARK_FILE="scripts/helix-ask-equation-benchmark.json"
$env:HELIX_ASK_EQUATION_BENCHMARK_TIMEOUT_MS="60000"
npm run helix:ask:equation:benchmark
```

Strict gate mode (non-zero exit on any failed benchmark case):

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
npm run helix:ask:equation:benchmark:strict
```

Primary artifacts:

1. `artifacts/experiments/helix-ask-equation-benchmark/<run-id>/summary.json`
2. `artifacts/experiments/helix-ask-equation-benchmark/<run-id>/results.json`
3. `reports/helix-ask-equation-benchmark-latest.md`

## Loop B6: Equation Benchmark Matrix (Profile Recommendation)

Run the profile matrix to compare equation behavior across tuning variants and
recommend a best profile versus baseline.

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
$env:HELIX_ASK_EQUATION_BENCHMARK_FILE="scripts/helix-ask-equation-benchmark.json"
$env:HELIX_ASK_EQUATION_BENCHMARK_MATRIX_FILE="scripts/helix-ask-equation-benchmark-matrix.json"
$env:HELIX_ASK_EQUATION_BENCHMARK_MATRIX_TIMEOUT_MS="60000"
npm run helix:ask:equation:benchmark:matrix
```

Strict matrix mode (non-zero exit when any profile has failed cases):

```powershell
$env:HELIX_ASK_BASE_URL="http://localhost:5050"
npm run helix:ask:equation:benchmark:matrix:strict
```

Primary artifacts:

1. `artifacts/experiments/helix-ask-equation-benchmark-matrix/<run-id>/summary.json`
2. `artifacts/experiments/helix-ask-equation-benchmark-matrix/<run-id>/results.json`
3. `reports/helix-ask-equation-benchmark-matrix-latest.md`

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

Pre-promote sequence for multilingual activation:

1. contract battery
2. variety battery
3. per-patch probe
4. multilingual golden-set gate
5. Casimir verify PASS with certificate hash + integrity OK

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
5. `Patch probe`: seed, pass rate, top failed signatures
6. `Casimir`: verdict, runId, certificate hash, integrity
7. `Final verdict`: `READY | PARTIAL_READY | NOT_READY`
8. `Next fix list`: explicit failing contracts/routes

## Minimum Artifact Bundle

Keep these paths in every handoff:

1. regression command output
2. variety `summary.json` and `failures.json`
3. patch probe `summary.json` and `report.md`
4. Casimir verify output with certificate hash/integrity
5. one prompt/output/verdict evidence pack for representative failures

