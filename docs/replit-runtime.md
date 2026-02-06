# Replit Runtime Runbook (Helix Ask)

This runbook captures the Replit preview/deploy setup for Helix Ask using the
local GGUF model + LoRA adapter and the repo code lattice index.

## Runtime Overview

Helix Ask uses the local ask endpoint:

- `POST /api/agi/ask` (local LLM + LoRA)
- `/healthz` should return `{ status: "ok", ready: true }`

## Required Artifacts

Keep these available either in the repo filesystem or Replit App Storage:

- Base model GGUF (example: `qwen2.5-3b-instruct-q4_k_m.gguf`)
- LoRA GGUF (example: `agi-answerer-qlora-f16.gguf`)
- Index JSON (example: `server/_generated/code-lattice.json`, ~20MB)

## Run Command (Preview + Deploy)

Use the production build flow so the client bundles are served from `dist/public`
and `/src/*.ts` is never requested:

```
env NODE_ENV=production PORT=$PORT HOST=0.0.0.0 NOISEGEN_STORAGE_BACKEND=replit \
  FAST_BOOT=0 REMOVE_BG_PYTHON_BIN=python SKIP_MODULE_INIT=1 \
  DEFER_ROUTE_BOOT=1 HEALTH_READY_ON_LISTEN=1 \
  npm run build && node dist/index.js
```

Key points:
- Use `PORT=$PORT` (do not hardcode 5000 on Replit).
- Always build before starting the production server.
- Do not inline `LLM_LOCAL_*` values here if they already exist in Publishing
  secrets; inline values override secrets and can go stale.

## Secrets / Env Vars

If using App Storage for the model/LoRA, these must be present and valid.
**No `=` prefix** in object keys.

```
LLM_LOCAL_MODEL_OBJECT_KEY=qwen2.5-3b-instruct-q4_k_m.gguf
LLM_LOCAL_MODEL_SHA256=<sha256_of_model>
LLM_LOCAL_LORA_OBJECT_KEY=agi-answerer-qlora-f16.gguf
LLM_LOCAL_LORA_SHA256=<sha256_of_lora>
```

Recommended runtime paths (filesystem after hydration):

```
LLM_LOCAL_MODEL_PATH=./models/qwen2.5-3b-instruct-q4_k_m.gguf
LLM_LOCAL_LORA_PATH=./models/agi-answerer-qlora-f16.gguf
LLM_LOCAL_INDEX_PATH=./server/_generated/code-lattice.json
LLM_LOCAL_CONTEXT_TOKENS=2048
```

If you want the index in App Storage instead, add:

```
LLM_LOCAL_INDEX_OBJECT_KEY=code-lattice.json
LLM_LOCAL_INDEX_SHA256=<sha256_of_index>
LLM_LOCAL_INDEX_PATH=./models/code-lattice.json
```

## Smoke Test (Backend)

Wait for readiness, then hit Helix Ask with a long timeout:

```
curl -s http://127.0.0.1:$PORT/healthz

curl -s -o /tmp/ask.out -w "\n%{http_code}\n" \
  --max-time 120 \
  -X POST http://127.0.0.1:$PORT/api/agi/ask \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'
```

Expected:
- HTTP 200
- JSON response with `text`, `model`, `duration_ms`
- First request can take 20-40s on CPU

## Grounded Ask (Repo-aware)

To get repo-grounded answers, send a `question` (optionally `searchQuery` and `topK`).
The server will search the code lattice and build the context automatically.

```
curl -sS --max-time 180 \
  -H "Content-Type: application/json" \
  -d '{"question":"how does the warp bubble get solved for in this system?","searchQuery":"warp bubble natario calculateNatarioWarpBubble","topK":12}' \
  http://127.0.0.1:$PORT/api/agi/ask
```

## Codex-like Behavior Checks

Closest to Codex-like behavior means **full LLM runs with the micro-pass pipeline**
(routing → evidence → synthesis), because the model is actually generating the answer
under the same constraints. A **dry-run** only validates routing/format/debug metadata.

Recommended Replit checks:

1) **Always run the dry-run regression** (fast, no LLM dependency).
2) **Optionally run the full LLM regression** after the runtime is stable.

Dry-run regression (routing/format only):

```
HELIX_ASK_BASE_URL=http://127.0.0.1:$PORT \
HELIX_ASK_REGRESSION_DRY_RUN=1 \
HELIX_ASK_REGRESSION_TIMEOUT_MS=30000 \
npm run helix:ask:regression
```

Full LLM regression (Codex-like end-to-end):

```
HELIX_ASK_BASE_URL=http://127.0.0.1:$PORT \
HELIX_ASK_REGRESSION_TIMEOUT_MS=180000 \
npm run helix:ask:regression
```

## Common Failures

**`llama-cli sha256 mismatch` during hydrate**
- Root cause: Publish/Deploy run command is still injecting an old SHA, overriding
  updated secrets.
- Fix: update `LLM_LOCAL_CMD_SHA256` in the Publishing run command (or remove the
  inline `LLM_LOCAL_*` overrides entirely) and republish.

**`spawn ... llama-cli ENOENT`**
- The `llama-cli` binary is dynamically linked against a Nix loader that is not
  present in the deploy container.
- Fix: upload a statically linked `llama-cli` (musl build) and set
  `LLM_LOCAL_CMD_SHA256` to the new object hash.

**`api_not_found`**
- Preview running an old build or missing route registration
- Pull latest, rebuild, hard refresh browser

**Module script MIME error**
- `Expected a JavaScript module script but got text/html`
- Happens when preview serves `index.html` for `/src/*.ts`
- Fix: use the production run command above (`npm run build && node dist/index.js`)

**`No such object` on hydration**
- App Storage key uses `=prefix` or wrong directory
- Use flat keys in App Storage, no `helix/models/...` unless you uploaded that path

## Performance Notes

CPU-only: expect ~3-4 tokens/sec generation on Qwen2.5-3B Q4.
Set longer timeouts on client requests (60-120s) for first response.

## Runtime Constraints Report (Snapshot)

This snapshot captures the current Replit runtime limits and their sources so we
can revisit them when moving inference off CPU.

### Token Limits

- Context window hard cap: 4096 tokens (`LLM_LOCAL_CONTEXT_TOKENS`, `.replit`)
- Max output tokens: 2048 (`LLM_LOCAL_MAX_TOKENS`, `.replit`)
- Context clamp: 2048–4096 (`server/services/llm/local-runtime.ts`)
- Default context: 3072 (`server/services/llm/local-runtime.ts`)

### Retrieval Limits

- Max TopK files: 4 (`server/services/llm/local-runtime.ts`)
- Max knowledge bytes: 80,000 per query (`server/services/llm/local-runtime.ts`)

### Runtime Limits

- Job timeout: 1,200,000 ms / 20 min (`HELIX_ASK_JOB_TIMEOUT_MS`, `.replit`)
- Spawn timeout: 60,000 ms default (`LLM_LOCAL_SPAWN_TIMEOUT_MS`, `server/skills/llm.local.spawn.ts`)
- Job TTL: 30 min (`server/services/helix-ask/job-store.ts`)
- Job cleanup: 60 sec (`server/services/helix-ask/job-store.ts`)
- Circuit breaker: 3 failures → 60s cooldown (`server/skills/llm.local.spawn.ts`)
- LLM RPM limit: 60 req/min (`server/skills/llm.local.spawn.ts`)
- Concurrency: 1 (serialized LLM inference, `server/skills/llm.local.spawn.ts`)

### Model + Throughput

- Model: `qwen2.5-3b-instruct-q4_k_m.gguf` (~2.0 GB, Q4)
- CPU-only throughput: ~3–4 tok/s (see `docs/replit-runtime.md` above)
- Max 2048 output tokens ≈ 9–10 minutes at 3.5 tok/s

### Scaling Guidance (CPU-only)

- Safe concurrent LLM calls: 1 (additional requests queue)
- 60s p95: short answers (~200 tokens)
- 120s p95: medium answers (~400 tokens)
- 300s p95: long answers (~1k–2k tokens)

### Known Gaps

- GGUF native context (model may support >4k; environment clamps to 4k)
- No GPU acceleration
- No explicit HTTP rate limiting for `/api/agi/*`
- Queue depth not bounded
