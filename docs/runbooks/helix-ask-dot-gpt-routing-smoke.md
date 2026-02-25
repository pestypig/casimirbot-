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
