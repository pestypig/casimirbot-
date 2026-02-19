# Phase 6 Live A/B Validity Deep-Research Pass

## Repository evidence intake and constraints

This task is explicitly constrained to “repo evidence only” (scripts/tests/routes/docs) and designates `docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md` as the source of truth. In the current execution environment, that file path (and the surrounding repo tree) is not accessible, so I cannot quote or cite line-level evidence from your repo, nor can I name the exact files to patch with confidence.

To make this pass genuinely **Phase 6 live A/B VALID and decision-ready**, the minimum evidence set required (and still within your scope limits) is:

- `docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md`
- The `/api/agi/ask` route implementation (under `routes/**`)
- Phase 6 live A/B harness runner and scoring logic (under `scripts/**`)
- Phase 6 metric definitions (including “semantic” metrics and “unsupported-claim” counting) (likely under `scripts/**` and/or `tests/**`)
- Any “training-trace export” endpoint used by the required verification command (under `routes/**`)
- Any “casimir” verify wrapper scripts (under `scripts/**` and/or package.json scripts)
- Tests exercising live run JSON parsing / schema validation (under `tests/**`)
  
Everything below is therefore a **decision-ready spec + remediation blueprint** that is intentionally designed to be the **minimum contract/envelope/gates** needed to eliminate the exact invalidity patterns you named (status=0, timeout class, unusable_response_rate, semantic metric degeneracy). Once the repo is accessible, the open items become straightforward file-and-line anchoring (grep-to-source-of-truth).

What would disconfirm this?  
If `docs/audits/research/helical-manifold-control-build-plan-2026-02-19.md` and the Phase 6 harness/route code are actually present in the environment and I’m simply missing the mount path, then locating that repo root (and producing line-cited findings) would disconfirm the claim that this environment cannot access the repo.

## Root-cause matrix for invalid Phase 6 live runs

Deliverable A is a symptom → likely cause → evidence source → confidence matrix. Because the repo is inaccessible here, I’m providing a **hypothesis matrix** that is tightly scoped to the four invalidity modes you named, and I’m explicit about what repo artifacts would confirm/disconfirm each hypothesis.

### Root-cause matrix (hypotheses to validate against repo)

| Symptom (Phase 6 live) | Likely cause (smallest-change lens) | Evidence source to confirm in repo (scripts/tests/routes/docs) | Confidence |
|---|---|---|---|
| `status=0` in live runs | Harness-level “request failed” sentinel used for non-HTTP failures (fetch abort, exception, JSON parse failure) is over-triggered; or status is defaulting to 0 when response schema parsing fails | Phase 6 request wrapper in `scripts/**` that sets status; search for `status=0`, `status = 0`, `STATUS_FAIL`, `DEFAULT_STATUS`; also the JSON parsing/validation code path in `scripts/**` and/or `tests/**` | Medium (common failure pattern in evaluation harnesses) |
| `timeout class` dominating failures | Mismatched timeouts: client timeout < server/model latency; “soft timeout” triggers abort but server continues; or concurrency overload causing queueing until client timeout | Timeout configuration in `scripts/**` (client), `/api/agi/ask` implementation in `routes/**` (server), any upstream model adapter; search for `timeout`, `AbortController`, `hardTimeout`, `deadline`, `pTimeout` | Medium |
| High `unusable_response_rate` | `/api/agi/ask` returns non-JSON on errors (HTML error page, framework default error), or returns JSON missing required fields; harness marks such episodes “unusable” | `/api/agi/ask` route and global error handler in `routes/**`; tests that validate response schema in `tests/**`; search for `Content-Type`, `application/json`, `res.status(500).send(` patterns | High (very typical cause of unusable-response spikes) |
| High `unusable_response_rate` | Success response exists but output shape is not stable: fields absent/null, `final` not present, tool results not included, or partial streaming truncated | `/api/agi/ask` response construction in `routes/**`; contract docs in `docs/**`; search for response object keys in server + parsing logic in harness | Medium |
| “Semantic metric degeneracy” (metrics constant/NaN/zeroed) | Metric pipeline returns a default value (0/NaN) on parse failure and still logs as “computed”; or metric input is empty/constant due to contract mismatch | Metric computation code in `scripts/**` (and any unit tests in `tests/**`); search for `try/catch` returning `0`, `return 0`, `return NaN`, `|| 0`, “degenerate”, “fallback” | High (this is the most common mechanism for “degenerate metrics”) |
| “Semantic metric degeneracy” | Claim linkage not produced; unsupported-claim metric always computes as 0 (no claims found) or 1 (all unsupported) due to missing linkage fields | Claim extraction/linkage module in `scripts/**`; `/api/agi/ask` output fields in `routes/**`; docs describing claim linkage in `docs/**` | Medium |
| “Semantic metric degeneracy” | A/B split accidentally uses identical variant config or identical cache key, so both arms return identical outputs → metrics appear constant | A/B routing assignment logic in `scripts/**` and/or `routes/**`; search for “variant”, “arm”, “ab”, “experiment”, “cache key”, “replay key” | Medium |
| `status=0` + timeouts + unusable all elevated together | Feedback loop from concurrency: too many in-flight requests → increased latency → more timeouts → more partial responses → more parse failures → more status=0 | Harness concurrency settings in `scripts/**`; server queue/worker settings in `routes/**`; look for `concurrency`, `p-limit`, worker pool sizes, per-host limits | Medium |

### Why this matrix is “smallest changes first” oriented
The matrix is intentionally biased toward causes that can be remediated without “changing maturity above diagnostic”: response contract hardening, consistent JSON-on-error, explicit fail-class semantics, and envelope settings.

What would disconfirm this?  
If repo evidence shows that (a) `status=0` is only set by the server and never by the harness, (b) timeouts are already generous and rarely hit at the client layer, and (c) semantic metrics are computed from raw model text without fallbacks (and still degenerate), then the dominant root causes would shift away from contract/envelope issues toward dataset/scenario design or upstream model behavior (which is out of your stated scope).

## Output contract spec for `/api/agi/ask` scoring compatibility

This defines the **minimum output contract** required so Phase 6 scoring can be reliable and so “unusable_response_rate” and “degenerate metrics” cannot silently happen without being detected and classified.

Deliverable B is a contract spec that addresses:
- required fields
- fail-reason/fail-class semantics
- replay/hash expectations
- claim linkage + unsupported-claim metric semantics

### Hard requirements for Phase 6 scoring

The scoring harness must be able to do *all* of the following, mechanically and deterministically:

- Determine whether an episode is **scoreable** vs **not scoreable** without guessing.
- Attribute **why** it is not scoreable (fail-class + reason).
- Re-run the **same episode** and verify “same inputs” (request hash, seed, contract version).
- Compute semantic metrics from a stable place in the response (no brittle scraping of arbitrary strings).
- Compute unsupported-claim metrics from explicit claim objects (or, if absent, classify as “metric_input_missing” rather than defaulting to 0).

### Proposed minimal JSON contract (response)

This is the smallest shape I recommend that still supports valid Phase 6 live scoring.

```json
{
  "contract_version": "phase6.v1",
  "request": {
    "request_id": "uuid",
    "episode_id": "string",
    "seed": 12345,
    "variant": "A|B|control|treatment",
    "input_hash": "hex-or-base64",
    "replay_key": "string"
  },
  "status": {
    "ok": true,
    "http_status": 200,
    "fail_class": "none",
    "fail_reason": "none",
    "retryable": false
  },
  "timing": {
    "started_at": "RFC3339",
    "finished_at": "RFC3339",
    "latency_ms": 1234,
    "server_compute_ms": 1000
  },
  "output": {
    "final_text": "string",
    "format": "text",
    "finish_reason": "stop|length|tool_error|timeout|refusal|unknown"
  },
  "claims": {
    "claim_schema_version": "claims.v1",
    "items": [
      {
        "claim_id": "c1",
        "text": "string",
        "span": { "start": 0, "end": 42 },
        "evidence_links": [
          {
            "source_id": "source:1",
            "source_hash": "hex-or-base64",
            "support": "supports|contradicts|unclear"
          }
        ]
      }
    ]
  },
  "metrics": {
    "unsupported_claim_count": 0,
    "total_claim_count": 0,
    "unsupported_claim_rate": 0.0
  },
  "integrity": {
    "response_hash": "hex-or-base64",
    "contract_hash": "hex-or-base64"
  },
  "debug": {
    "trace_id": "string",
    "run_id": "string"
  }
}
```

### Required-field semantics

- `contract_version`  
  A hard-coded contract identifier. Scoring must hard-fail (non-scoreable) if not recognized.

- `request.seed` and `request.episode_id`  
  Must be present on every response (success or failure). If the server cannot determine them, the harness should treat the episode as “transport_unattributed” and fail the run (because seed coverage can’t be verified).

- `status.ok`  
  Must be **true only when** the server produced a complete `output.final_text` that is intended for scoring and the response meets schema validation.

- `status.fail_class` and `status.fail_reason` semantics  
  These allow a stable mapping to Phase 6 failure taxonomy. Minimum enum set:

  - `none`
  - `timeout_soft` (client-side timer fired; response may still be computing server-side)
  - `timeout_hard` (server enforced deadline)
  - `http_error` (non-2xx HTTP status)
  - `invalid_json` (response not parseable as JSON)
  - `schema_mismatch` (JSON parsed but missing required fields)
  - `model_refusal` (explicit refusal; not scoreable but not a system failure)
  - `upstream_error` (model provider error, adapter error)
  - `tool_error` (if tool execution exists)
  - `empty_output` (final_text empty or whitespace)
  - `metric_input_missing` (claims/semantic fields missing required data)

  `fail_reason` should be a stable short code (snake_case), not a log string.

- JSON-on-error is mandatory  
  If HTTP status is non-2xx, the body must still be JSON matching the envelope (at minimum: `contract_version`, `request`, `status`, `timing`, `integrity`, `debug`). This is what prevents “unusable_response_rate” from exploding due to framework default error pages.

### Replay and hash expectations

Minimum expectations to make live A/B decision-grade:

- `request.input_hash`  
  Hash of the *scoring-relevant canonical request* (episode prompt + scenario config + seed + contract_version + any static rubric/spec text).  
  Canonicalization must be deterministic (stable ordering, stable whitespace). Recommendation: JSON canonicalization (e.g., RFC 8785) or an equivalent stable serializer.

- `request.replay_key`  
  A stable identifier the harness can use to re-run the same episode. This can be equal to `input_hash` or include variant. If it includes variant, the harness must be able to control it.

- `integrity.response_hash`  
  Hash of the scoring-relevant subset of the response (at minimum: `output.final_text`, `claims.items`, `metrics`, plus `request.input_hash` and `contract_version`). This allows detecting silent differences due to truncation or middleware.

### Claim linkage and unsupported-claim metric semantics

To prevent “semantic metric degeneracy” caused by missing linkages:

- `claims.items[]` is the authoritative unit of counting.
- A claim is **counted** if `text` length > 0.
- A claim is **supported** if at least one `evidence_links[]` exists where:
  - `source_hash` matches a known source presented to the model (prompt/context/doc), and
  - `support == "supports"`
- A claim is **unsupported** if:
  - `evidence_links` is empty, or
  - all links are `"contradicts"` / `"unclear"` / unknown `source_hash`.

Then:
- `total_claim_count = len(claims.items)`
- `unsupported_claim_count = count(items where unsupported)`
- `unsupported_claim_rate = unsupported_claim_count / max(1, total_claim_count)`

Crucially: if `claims.items` is missing entirely or not parseable, the correct classification is **not** “0 unsupported claims”; it is `fail_class="metric_input_missing"` and the episode is not scoreable (or the run is invalid, depending on how strict Phase 6 is intended to be).

What would disconfirm this?  
If repo evidence shows Phase 6 scoring intentionally does not use server-provided claim objects (i.e., it computes claims purely in-harness from `final_text`), then requiring `claims.items` in the `/api/agi/ask` response would be unnecessary. In that case, the minimum contract would instead focus on making `final_text` + metadata reliable and ensuring the harness-side claim extractor has deterministic inputs and explicit failure classification.

## Runtime envelope spec for stable evaluation

Deliverable C defines timeout/hard-timeout, concurrency, retry/backoff, and cooldown behavior so “live” evaluation is stable enough to be decision-grade.

### Envelope principles specific to Phase 6 validity

- The envelope must be **identical across A and B**. Any difference is a confound.
- The harness must distinguish **soft client timeout** vs **hard server timeout**; lumping them together produces misleading “timeout class” stats and can create status=0 inflation.
- Retries must be extremely conservative; otherwise you bias toward “eventually succeeded” and hide systemic problems.

### Proposed defaults (safe starting point)

These are intentionally conservative and chosen to reduce invalidity while still being practical for live runs:

- Client soft timeout (`timeout_ms`): **45,000 ms**  
  Safe range: 20,000–90,000 ms  
  Rationale: enough for cold-start spikes while still bounding run time.

- Server hard timeout (`hard_timeout_ms`): **60,000 ms**  
  Safe range: 30,000–120,000 ms  
  Must be **> client timeout** only if you explicitly want the client to give up first; otherwise client should be ≥ server to avoid “server succeeded but client aborted” ambiguity. For evaluation validity, I recommend **client >= server** when possible, because you want the server to authoritatively return `fail_class=timeout_hard` rather than the client inventing it.

- Concurrency (`max_in_flight`): **8**  
  Safe range: 1–16  
  Start at 4–8 until timeout and unusable rates are well below gates. Increase only after validity gates pass.

- Retry policy:
  - Retries: **1** max, only for `fail_class in {upstream_error, http_error(>=502), timeout_soft if no server response}`  
  - No retries for `schema_mismatch`, `invalid_json`, `empty_output`, `model_refusal`, `timeout_hard`.
  - Backoff: exponential with jitter. Start 500 ms, cap 4,000 ms.
  - Retry must preserve `request.request_id` lineage but increment an `attempt` counter in response/debug (otherwise replay integrity is broken).

- Cooldown / circuit-breaker:
  - If rolling 20-episode window has `timeout_soft + timeout_hard > 20%` OR `schema_mismatch > 2%`, pause launching new episodes for **10–30 seconds** and drop concurrency by half.
  - If it persists for 3 windows, hard-stop the run as “invalid”.

### Instrumentation requirements (to support diagnosis)

For every episode attempt, capture (in the harness result record):

- Request start and end timestamps
- Whether the client aborted (soft timeout) or received a server-coded timeout
- HTTP status, response Content-Type
- JSON parse success/failure
- Schema validation success/failure
- `status.fail_class` / `fail_reason` (from contract)
- Attempt count, backoff delay

This instrumentation is what makes the root-cause matrix decidable rather than speculative.

What would disconfirm this?  
If repo evidence shows Phase 6 is already run at very low concurrency (e.g., 1–2) with long timeouts, but timeouts and unusable responses still dominate, then the envelope is not the primary driver; attention should shift to server-side bugs (non-JSON errors, streaming truncation, contract mismatch) rather than tuning envelope values.

## Validity gate spec and statistical acceptance rules for A/B

Deliverable D defines hard pass/fail thresholds for A/B validity, specifically for:

- usable_response_rate
- http_status_ok_rate
- non-degenerate metric checks
- minimum episode count and seed coverage

### Gate definitions (precise and implementation-ready)

Let each “episode” produce an outcome record.

- **http_status_ok**: `true` iff HTTP status is in 200–299.
- **json_ok**: `true` iff response body parses as JSON.
- **schema_ok**: `true` iff response validates against `contract_version` schema.
- **scoreable**: `true` iff:
  - `http_status_ok && json_ok && schema_ok`
  - `status.ok == true`
  - `output.final_text` is non-empty (trimmed length > 0)
  - `status.fail_class == "none"`

Then:
- **http_status_ok_rate** = mean(http_status_ok)
- **usable_response_rate** = mean(scoreable)

A “run” is invalid if any hard gates fail **in either arm** (A or B), because then the A/B comparison is confounded by differential failure patterns.

### Hard validity thresholds (recommended defaults)

These thresholds are chosen to directly prevent the invalidity modes you listed from surviving into “decision.”

- `http_status_ok_rate >= 0.98` in each arm  
- `json_ok_rate >= 0.99` in each arm  
- `schema_ok_rate >= 0.99` in each arm  
- `usable_response_rate >= 0.95` in each arm  
- `timeout_rate (timeout_soft + timeout_hard) <= 0.03` in each arm  
- `unusable_response_rate <= 0.05` in each arm (redundant if usable_response_rate gate is enforced; still useful for reporting)

If Phase 6 is expected to be more brittle (e.g., heavy tool use), you can relax usable_response_rate to 0.90 temporarily, but then you must explicitly label the run “diagnostic, not decision-ready.”

### Non-degenerate metric checks (semantic metric degeneracy prevention)

For each primary semantic metric `M` used in decision-making (including unsupported-claim metrics):

Hard fail the run if any metric violates any check in either arm:

- **Definedness**: `NaN_rate(M) <= 0.01`
- **Non-constancy**: `unique_value_count(M) >= max(5, 0.02 * N)`  
  (At least 5 unique values, and at least 2% of episodes differ.)
- **Non-trivial variance**: `stddev(M) >= epsilon`, where `epsilon` depends on metric scale:  
  - For [0,1] metrics: epsilon = 0.01  
  - For count metrics: epsilon = 0.1  
- **Not-all-default**: fail if `mean(M == 0) >= 0.98` *and* metric is expected to vary (e.g., semantic similarity scores)

If you have paired design (same seeds per arm), also check:
- **paired differences not degenerate**: `stddev(M_A - M_B) >= epsilon_diff` (same scaling as above)

### Minimum episode count and seed coverage

To be “decision-ready” rather than anecdotal:

- Minimum episodes per arm: **N >= 200**  
  If metrics are high variance, prefer 500+. If Phase 6 is expensive, 200 is the minimum for meaningful stability checks.

- Seed coverage: **100% of fixed seed set must appear in both arms** (paired)  
  Hard fail if any seed appears in only one arm, because that breaks pairing and can create spurious deltas.

- Scenario/rubric coverage (if Phase 6 includes multiple task buckets):  
  Require each bucket’s N >= 30 per arm (or proportional if buckets are uneven). Otherwise report bucket-level inconclusive even if global passes.

### Statistical acceptance rule (minimal, validity-first)

Only after validity gates pass:

- Compute the paired difference distribution over seeds for the primary metric(s).
- Accept a “win” if:
  - The 95% bootstrap CI of mean(delta) excludes 0 in the improvement direction, **and**
  - No guardrail metric regresses beyond tolerance (e.g., unsupported_claim_rate increases by more than +0.02 absolute, or usable_response_rate drops below gate).

This is the smallest statistical rule that avoids over-claiming while staying focused on your request.

What would disconfirm this?  
If the source-of-truth build plan explicitly defines different thresholds or defines “usable”/“scoreable” differently (e.g., counting refusals as usable, or allowing schema-missing episodes), then these gates would need to be conformed to that definition. The plan doc is the arbiter.

## Implementation-ready remediation plan for harness and runtime

Deliverable E requires an ordered patch plan (lowest-risk first) with exact files to change. Because the repo is not accessible here, I can only provide **an implementation-ready patch sequence** plus the **exact repo search keys** that will uniquely identify the correct files under `scripts/tests/routes/docs`. Once the repo is accessible, each step becomes “edit these concrete files” rather than “edit the file that contains X.”

### Patch plan goals (strictly within your scope)

- Eliminate invalid episodes caused by:
  - ambiguous status=0
  - non-classified timeouts
  - unusable responses due to non-JSON/schema mismatch
  - silent default-valued semantic metrics (degeneracy)
- Do so with smallest changes first:
  - contract/schema enforcement
  - error normalization
  - envelope tuning
  - metric degeneracy guards
  - only then deeper refactors

### Ordered patch plan (low-risk first)

**Patch step one: Add strict schema validation and fail classification in harness (no server change required).**  
- Implement a JSON schema (or TypeScript runtime validator) for `contract_version = phase6.v1`.
- When parsing fails: set `fail_class=invalid_json`.  
- When schema fails: set `fail_class=schema_mismatch`.  
- Ensure these are treated as **not scoreable** and counted in unusable_response_rate.  
- Ensure `status=0` is never a default; it must be the result of an explicit classification mapping.

**Repo search keys to locate files (expected under `scripts/**` and `tests/**`):**
- `Phase 6` / `phase6`
- `unusable_response_rate`
- `http_status_ok_rate`
- `status=0` or `status: 0`
- `timeout class` / `timeoutClass`
- `semantic` + `metric`

**Patch step two: Normalize `/api/agi/ask` error responses to JSON envelope (small server change).**  
- Guarantee `Content-Type: application/json` and the envelope fields even on errors.
- Ensure all code paths produce `contract_version`, `request`, `status`, `timing`, `integrity`.

**Repo search keys (expected under `routes/**`):**
- `/api/agi/ask`
- `router` + `agi` + `ask`
- `export` + `training-trace`
- `adapter/run` (from your verify command)

**Patch step three: Add explicit timeout semantics in both server and harness.**  
- Server: enforce `timeout_hard` and return JSON with `fail_class=timeout_hard`.  
- Harness: if AbortController triggers, classify as `timeout_soft`.  
- Ensure timeouts are not merged into `status=0` without context.

**Patch step four: Prevent semantic metric degeneracy by making missing inputs a hard invalidity.**  
- If semantic metric inputs are missing/empty, emit `fail_class=metric_input_missing` and treat as not scoreable.
- Add a run-level degeneracy detector: fail the run early when metrics are constant/NaN beyond thresholds.

**Patch step five: Add contract tests (and keep them cheap).**  
- Unit tests: valid success response is accepted; error response still matches envelope; missing fields fail fast.
- Smoke test: a local call to `/api/agi/ask` with a canned episode and asserted fields.

**Patch step six: Envelope tuning and guardrails.**  
- Adjust concurrency and timeouts only after steps 1–4, because envelope tuning cannot fix schema/JSON failures.

### Exact files to change (blocked until repo access)

Deliverable E demands exact files. Once the repo is accessible, the above search keys will uniquely identify:

- One `/api/agi/ask` route file under `routes/**`
- One Phase 6 live runner under `scripts/**`
- One Phase 6 scoring/metrics module under `scripts/**`
- One or more tests under `tests/**`
- Possibly the contract documentation under `docs/**` (including the build-plan md)

At that point, I would provide an exact ordered file list like:

- `routes/.../api/agi/ask.ts` (or equivalent)
- `scripts/.../phase6_live_ab.ts`
- `scripts/.../phase6_scoring.ts`
- `tests/.../phase6_contract.test.ts`
- `docs/.../phase6_contract.md`

…but I will not fabricate these paths without repo confirmation.

What would disconfirm this?  
If repo evidence shows Phase 6 live A/B already has strict schema validation and JSON-on-error, yet invalidity persists, then the remediation priority would shift toward (a) upstream model adapter stability, (b) streaming truncation behavior, or (c) A/B assignment and caching bugs—rather than contract hardening.

## Re-run protocol for fixed-seed Phase 6 live A/B and decision gate

Deliverable F is the operational protocol to re-run Phase 6 live A/B after remediation, ensuring the run is decision-ready.

### Protocol invariants (must-haves)

- Same fixed seed set in both arms (paired).
- Same runtime envelope across both arms.
- Same code revision and dependencies across run.
- Record enough artifacts to reproduce:
  - request hashes, replay keys
  - response hashes
  - fail_class distribution
  - metric distributions

### Step-by-step rerun protocol

Run the required verification command exactly as specified **after any patch is applied** (your constraint):

```bash
npm run casimir:verify -- --pack repo-convergence --url http://localhost:5173/api/agi/adapter/run --export-url http://localhost:5173/api/agi/training-trace/export --trace-out artifacts/training-trace.jsonl --trace-limit 200 --ci
```

Gate the process as follows:

- If `casimir:verify` FAILS: fix the **first failing HARD constraint** and rerun until PASS.
- When PASS, report:
  - verdict
  - firstFail
  - certificateHash
  - integrityOk
  - traceId
  - runId

Then run Phase 6 fixed-seed A/B:

- Start server in a controlled local mode (no hot reload).
- Warm-up: run 10 episodes (not counted) to stabilize cold start effects.
- Execute the full fixed-seed set with pairing:
  - Either interleaved A/B per seed (recommended) to reduce time drift
  - Or two full passes A then B, only if the system is stable and not time-sensitive

Collect artifacts:

- One JSONL log of episode outcomes including:
  - `seed`, `episode_id`, `variant`
  - request/input hash + replay key
  - http status, json_ok, schema_ok
  - fail_class/reason
  - latency_ms and timeout flags
  - semantic metrics + unsupported-claim metrics
  - response_hash
  - trace_id/run_id

Apply validity gates (Deliverable D):

- If any hard gate fails in either arm: run is invalid → stop and remediate.
- If all gates pass: compute deltas and statistical acceptance.

Decision gate output:

- A single summary that includes:
  - N episodes per arm
  - usable_response_rate, http_status_ok_rate, timeout_rate, unusable_response_rate
  - metric degeneracy checks (pass/fail with stats)
  - primary metric delta with CI
  - guardrail deltas (including unsupported_claim_rate)

What would disconfirm this?  
If repo evidence shows Phase 6 is not intended to be paired by seed (e.g., it uses randomized live sampling), then the paired-seed protocol would be incompatible. In that case, the rerun protocol must shift to blocked randomization with stratification and stronger variance control—and the minimum N would likely need to increase to compensate.
