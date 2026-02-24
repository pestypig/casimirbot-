# GPT-priority Helix Ask operational validation (main snapshot)

## Branch/head sync
- `git status --short --branch` => `## work`
- `git rev-parse HEAD` => `c402ce2c9a77f1b729759e8e05c22155194583a4`
- `git fetch origin main` unavailable in this environment (`origin` remote not configured).

## Runtime assumptions observed
- `LLM_RUNTIME=http`
- `LLM_POLICY=http`
- `ENABLE_LLM_LOCAL_SPAWN=0`
- `LLM_HTTP_BASE=https://api.openai.com`
- `OPENAI_API_KEY` and `LLM_HTTP_API_KEY` were unset in this shell.
- `HULL_MODE` unset (effectively disabled).

## Validation commands (exact)
1. `PORT=5050 NODE_ENV=development ENABLE_AGI=1 LLM_RUNTIME=http LLM_POLICY=http ENABLE_LLM_LOCAL_SPAWN=0 LLM_HTTP_BASE=https://api.openai.com npm run dev`
2. `curl -sS http://127.0.0.1:5050/api/agi/tools/manifest | jq -r '.[].name' | rg '^llm\.'`
3. `curl -sS -i http://127.0.0.1:5050/api/hull/status | head -n 30`
4. `curl -sS -i -X POST http://127.0.0.1:5050/api/agi/ask -H 'Content-Type: application/json' -d '{"question":"Say hello in 5 words"}' | head -n 60`
5. `curl -sS -X POST http://127.0.0.1:5050/api/agi/ask/jobs -H 'Content-Type: application/json' -d '{"question":"What is 2+2?"}'`
6. `curl -sS -i http://127.0.0.1:5050/api/agi/ask/jobs/d2f62686-0df8-4c52-b9d7-d6e8a3d04302 | head -n 80`
7. `npx vitest run server/__tests__/llm.local.bridge.test.ts tests/helix-ask-jobs-regression.spec.ts server/__tests__/llm.http.safeguards.test.ts`
8. `npm run casimir:verify -- --url http://127.0.0.1:5050/api/agi/adapter/run --pack repo-convergence --export-url http://127.0.0.1:5050/api/agi/training-trace/export --trace-out artifacts/training-trace.validation.jsonl`
9. `curl -sS http://127.0.0.1:5050/api/agi/training-trace/export -o artifacts/training-trace.export.jsonl`

## Endpoint/tool health
- `/api/agi/tools/manifest` includes `llm.http.generate` and `llm.local.generate`.
- `/api/hull/status` returned `200` with `llm_policy=http`, `llm_runtime=http`, and `llm_http.url=https://api.openai.com`.
- `/api/agi/ask` returned `200` JSON payload.
- `/api/agi/ask/jobs` create returned queued `jobId`; follow-up `GET /api/agi/ask/jobs/:id` progressed to `completed` with result payload.

## Focused test lane
- `server/__tests__/llm.local.bridge.test.ts` passed.
- `tests/helix-ask-jobs-regression.spec.ts` passed.
- `server/__tests__/llm.http.safeguards.test.ts` passed.

## Casimir block
- verdict: `PASS`
- firstFail: `null`
- certificateHash: `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
- integrityOk: `true`
- trace artifact path: `artifacts/training-trace.validation.jsonl`
- extra export artifact: `artifacts/training-trace.export.jsonl`

## GO/NO-GO decision
- Decision: **NO-GO** for strict "OpenAI-backed HTTP lane proven" acceptance in this environment.
- Reason: endpoint/runtime path is operational and migration tests pass, but live upstream OpenAI credential-backed execution could not be proven because `OPENAI_API_KEY`/`LLM_HTTP_API_KEY` were unset in this runtime.

## Remaining risks
1. Credential absence masks real upstream HTTP/auth behavior despite local endpoint health.
2. If `HULL_MODE=1` is enabled in prod, `HULL_ALLOW_HOSTS` must explicitly include `api.openai.com` to avoid outbound block.

## Single next hardening patch recommendation
- Add a CI smoke that fails fast when `LLM_RUNTIME=http` and neither `OPENAI_API_KEY` nor `LLM_HTTP_API_KEY` is present, so "HTTP path operational" cannot be reported without credentialed upstream validation.

## Rollback note
- No production code paths were changed; rollback is a no-op (revert/remove this report file only).
