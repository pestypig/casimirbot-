# Helix Ask Dot GPT Routing Smoke (Codex Cloud)

Use this runbook to prove whether `/api/agi/ask` actually called the HTTP LLM provider (OpenAI-compatible) versus falling back to deterministic local scaffolding.

## Preconditions

- Secrets are set in Codex Cloud:
  - `OPENAI_API_KEY` or `LLM_HTTP_API_KEY`
- Runtime env for the test run includes:
  - `ENABLE_AGI=1`
  - `LLM_RUNTIME=http`
  - `LLM_POLICY=http` (or local if your bridge policy still routes HTTP first)
  - `LLM_HTTP_BASE=https://api.openai.com`
  - `HULL_MODE=1`
  - `HULL_ALLOW_HOSTS=api.openai.com`

## Single Copy/Paste Prompt (Codex Cloud)

```text
Read AGENTS.md and WARP_AGENTS.md and follow them.

Run a GPT-routing smoke for Helix Ask and report only concrete evidence.

1) Start dev server on port 5050 with env:
   ENABLE_AGI=1
   LLM_RUNTIME=http
   LLM_POLICY=http
   HULL_MODE=1
   HULL_ALLOW_HOSTS=api.openai.com
   LLM_HTTP_BASE=https://api.openai.com
   (Use existing OPENAI_API_KEY or LLM_HTTP_API_KEY from secrets)

2) Run:
   curl -sS http://127.0.0.1:5050/api/hull/status

3) Run /api/agi/ask with debug=true:
   curl -sS -X POST http://127.0.0.1:5050/api/agi/ask \
     -H "Content-Type: application/json" \
     -d "{\"question\":\"Explain server/routes/agi.plan.ts in one sentence with source context.\",\"debug\":true,\"verbosity\":\"brief\",\"sessionId\":\"llm-http-proof-1\"}"

4) From the ask response, print exactly these debug fields:
   debug.llm_route_expected_backend
   debug.llm_backend_used
   debug.llm_provider_called
   debug.llm_model
   debug.llm_http_status
   debug.llm_routed_via
   debug.llm_error_code
   debug.llm_error_message
   debug.llm_calls

5) Run jobs smoke:
   curl -sS -X POST http://127.0.0.1:5050/api/agi/ask/jobs \
     -H "Content-Type: application/json" \
     -d "{\"question\":\"What is 2+2?\",\"sessionId\":\"llm-http-proof-jobs\"}"

6) Run focused tests:
   npx vitest run server/__tests__/llm.local.bridge.test.ts server/__tests__/llm.http.safeguards.test.ts tests/helix-ask-jobs-regression.spec.ts

7) Run mandatory Casimir verify:
   npm run casimir:verify -- \
     --url http://127.0.0.1:5050/api/agi/adapter/run \
     --pack repo-convergence \
     --export-url http://127.0.0.1:5050/api/agi/training-trace/export \
     --trace-out artifacts/training-trace.validation.jsonl \
     --trace-limit 200 \
     --ci

8) Export trace:
   curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl

Return:
- /api/hull/status JSON
- /api/agi/ask JSON (or redacted excerpt including debug.llm_* fields)
- /api/agi/ask/jobs response JSON
- test summary
- Casimir: verdict, firstFail, certificateHash, integrityOk
- GO/NO-GO for "OpenAI-backed ask lane proven"
```

## Deep Diagnosis Prompt (Key/Env vs Short-Circuit)

Use this when the quick smoke shows `llm_route_expected_backend=http` but provider-call fields are null.

```text
Read `AGENTS.md` and `WARP_AGENTS.md` first and follow them strictly.

Task: run a diagnostic to classify Helix Ask HTTP LLM behavior into one of:
A) short-circuit (LLM not invoked),
B) HTTP invoked but key/config failed,
C) HTTP invoked and working.

Do not modify code. Only run diagnostics and report evidence.

1) Start server on port 5050 with env:
- ENABLE_AGI=1
- LLM_RUNTIME=http
- LLM_POLICY=http
- HULL_MODE=1
- HULL_ALLOW_HOSTS=api.openai.com
- LLM_HTTP_BASE=https://api.openai.com
- HELIX_ASK_IDEOLOGY_CONCEPT_FAST_PATH=0
- HELIX_ASK_MICRO_PASS=0
- HELIX_ASK_MICRO_PASS_AUTO=0
- HELIX_ASK_TWO_PASS=0
- HELIX_ASK_ANSWER_CONTRACT_PRIMARY=0
(Use existing secret OPENAI_API_KEY or LLM_HTTP_API_KEY; do not print secret values.)

2) Capture /api/hull/status:
curl -sS http://127.0.0.1:5050/api/hull/status

3) Case A (intentional short-circuit control):
POST /api/agi/ask with:
{"question":"What is 2 + 2?","debug":true,"sessionId":"diag-short-circuit"}
Print these exact fields:
- debug.llm_route_expected_backend
- debug.llm_invoke_attempted
- debug.llm_skip_reason
- debug.llm_backend_used
- debug.llm_provider_called
- debug.llm_http_status
- debug.llm_calls
- debug.answer_path

4) Case B (force normal ask path; avoid obvious shortcut intents):
POST /api/agi/ask with:
{"question":"From server/services/llm/local-runtime.ts, explain how isLocalRuntime chooses local mode and list 3 env vars it checks.","debug":true,"verbosity":"brief","sessionId":"diag-http-path"}
Print the same exact debug fields as Case A.

5) Case C (jobs lane):
- POST /api/agi/ask/jobs with:
{"question":"From server/services/llm/local-runtime.ts, explain how isLocalRuntime chooses local mode and list 3 env vars it checks.","sessionId":"diag-jobs-http-path","debug":true}
- Poll GET /api/agi/ask/jobs/<jobId> until terminal state.
- Print terminal status and, if present, the same debug.llm_* fields.

6) Direct key validity check (without exposing key):
- If OPENAI_API_KEY or LLM_HTTP_API_KEY exists, call OpenAI models endpoint and print ONLY HTTP status code:
  - 200 => key accepted
  - 401/403 => key/project issue
(Do not print auth header or token.)

7) Run required focused tests:
npx vitest run server/__tests__/llm.local.bridge.test.ts server/__tests__/llm.http.safeguards.test.ts tests/helix-ask-jobs-regression.spec.ts tests/helix-ask-llm-debug-skip.spec.ts

8) Run required Casimir gate and export:
npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --pack repo-convergence --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl --trace-limit 200 --ci
curl -sS http://127.0.0.1:5050/api/agi/training-trace/export > artifacts/training-trace.export.jsonl

9) Final report format:
- Classification: A/B/C for each case.
- Root cause:
  - short_circuit vs env/var mismatch vs key invalid vs working.
- Include raw field table for each case.
- Include Casimir verdict, firstFail, certificateHash, integrityOk.
- GO/NO-GO for "OpenAI-backed ask lane proven".
```

## Pass Criteria

- `debug.llm_route_expected_backend` is `http`
- `debug.llm_backend_used` is `http`
- `debug.llm_provider_called` is `true`
- `debug.llm_calls` contains at least one entry
- Casimir returns `PASS` with integrity OK

## Quick Triage

- `expected_backend=http` but `backend_used` missing:
  - request likely never reached answer LLM stage (fallback path)
- `backend_used=http` and `provider_called=true` but no token usage visible:
  - check OpenAI org/project for the exact API key used
  - allow 5-15 minutes for usage graph lag
- `llm_http_status=401/403`:
  - credentials or project permissions issue
- `llm_http_status=429`:
  - rate limit; lower concurrency and rerun
- `llm_error_code=llm_http_api_key` (often with `provider_called=true` and missing `llm_http_status`):
  - backend routing reached HTTP lane, but call was blocked before network due to missing `OPENAI_API_KEY`/`LLM_HTTP_API_KEY`
