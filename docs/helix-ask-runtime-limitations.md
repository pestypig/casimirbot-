# Helix Ask Runtime Constraints (Replit)

This note captures the observed limits and configuration caps for the current
Replit runtime (CPU-only local inference). Use it to plan future scaling or GPU
migration.

## Token limits summary
| Parameter | Value | Source | File reference |
| --- | --- | --- | --- |
| Context window cap | 8,192 tokens (hard max) | `LLM_LOCAL_CONTEXT_TOKENS` | `.replit` |
| Max output tokens | 8,192 tokens | `LLM_LOCAL_MAX_TOKENS` | `.replit` |
| Context range | 2,048 - 8,192 (clamped) | code clamp | `server/services/llm/local-runtime.ts` |
| Default context | 4,096 tokens | fallback | `server/services/llm/local-runtime.ts` |
| Max TopK files | 4 files | retrieval cap | `server/services/llm/local-runtime.ts` |
| Max knowledge bytes | 80,000 bytes | per query | `server/services/llm/local-runtime.ts` |
| Model | `qwen2.5-3b-instruct-q4_k_m.gguf` (~2.0 GB, Q4) | model config | `docs/replit-runtime.md` |

## Runtime constraints summary
| Constraint | Value | Source | File reference |
| --- | --- | --- | --- |
| Job timeout | 1,200,000 ms (20 min) | `HELIX_ASK_JOB_TIMEOUT_MS` | `.replit` |
| Spawn timeout | 60,000 ms | `LLM_LOCAL_SPAWN_TIMEOUT_MS` | `server/skills/llm.local.spawn.ts` |
| Job TTL | 30 min | `HELIX_ASK_JOB_TTL_MS` | `server/services/helix-ask/job-store.ts` |
| Job stale cleanup | 60 sec interval | `HELIX_ASK_JOB_CLEANUP_MS` | `server/services/helix-ask/job-store.ts` |
| Circuit breaker | 3 failures -> 60s cooldown | `LLM_SPAWN_BREAKER_*` | `server/skills/llm.local.spawn.ts` |
| LLM RPM limit | 60 requests/min | `LLM_LOCAL_RPM` | `server/skills/llm.local.spawn.ts` |
| Concurrency | 1 (serialized inference) | `DEFAULT_CONCURRENCY` | `server/skills/llm.local.spawn.ts` |

## System resources (observed)
- CPU: 8 vCPUs
- Memory: ~62.8 GB total
- Model load size: ~2.1 GB (GGUF file)

## Observed performance (CPU)
- Throughput: ~3-4 tokens/sec (Qwen2.5-3B Q4 on CPU)
- Example generation: ~4.1 min for ~800-1,000 tokens

## Capacity estimates
Given:
- max output tokens: 8,192
- average speed: 3.5 tokens/sec
- max generation time: ~1170 sec (~19.5 min)

Implications:
- With concurrency=1, practical peak is roughly half the previous rate when responses run near max size.
- Safe queue: 1 active + 1-2 waiting (beyond this, latency spikes).
- RPM limit is not the real bottleneck; generation time is.
- Interpretation: the constraint is time per generation ("physics-limited"), not
  request count.

## Multi-user behavior
The LLM spawn is serialized (`DEFAULT_CONCURRENCY=1`). Additional requests are
queued via `spawnWaiters`. This does not crash the server, but it can create
long waits. Consider adding a queue length cap and user-facing backpressure.

## Gaps and unknowns
- GGUF model context metadata not extracted (model may support beyond 8,192, but env still hard-limits to configured maxima).
- Memory per inference under load not profiled.
- HTTP-level rate limiting is not currently enforced on `/api/agi/*`.

## Future scaling (GPU / external LLM)
- Raise concurrency above 1.
- Increase tokens/sec by 5-10x.
- Allow higher output budgets without timeouts.

## Scaling blueprint: dedicated inference service
The Replit setup is not "rate limited" in practice. It is time-limited by
CPU-only generation throughput. A queue can only absorb bursts, not add capacity.
The practical fix is to move inference into a dedicated service and speak to it
over the network with a stable contract.

### Design goals (Helix Ask terms)
- Raise throughput (GPU or optimized serving).
- Raise concurrency (continuous batching + multiple slots/workers).
- Add backpressure (queue caps + adaptive token budgets + optional overflow).

### Options for high-load inference (ranked by scale per dollar + ease)
Option A: Keep GGUF + serve with llama.cpp (llama-server / llama-cpp-python)
- Best if you already download a GGUF model artifact.
- Supports parallel slots and continuous batching for more throughput.
- Can expose an OpenAI-compatible API via `llama-cpp-python` server.
- Limits: CPU-only still has a hard ceiling; multi-node scaling is manual.

Option B: GPU serving with vLLM (OpenAI-compatible server)
- High throughput on GPU with continuous batching.
- OpenAI-compatible HTTP API keeps client wiring stable.
- If you currently store GGUF, you need HF weights or a supported format.

Option C: GPU serving with Hugging Face TGI (Text Generation Inference)
- Strong production posture with built-in metrics, tracing, and batching.
- Multi-GPU scaling with tensor parallelism.

Option D: Ollama (fastest to ship, lower ceiling)
- Quick to stand up, simple API, streaming support.
- Typically lower max throughput than vLLM/TGI.

Option E: CPU-focused optimization (OpenVINO Model Server)
- If you must stay on CPU, continuous batching can help.
- Still a throughput ceiling under real concurrency.

### Integration strategy (future-proofed for paid servers)
Make Helix Ask talk to "an LLM endpoint" (not a local library call). The most
stable contract right now is an OpenAI-compatible API:
- `POST /v1/chat/completions`
- `stream: true` for SSE streaming

Provider interface:
- `generate(messages, {max_tokens, temperature, stream}) -> stream/text`

Provider implementations:
- LocalDedicatedServerProvider
- PaidServerProvider
- Optional HybridProvider (local-first, overflow-to-paid)

This makes the paid-server switch a boring config change:
- `HELIX_ASK_BASE_URL`
- `HELIX_ASK_API_KEY`

### Model bootstrap pattern (download on server startup)
Instead of downloading the model during app build, do it on inference server
startup (or init container step).

Recommended pattern: "model bootstrap + checksum"
- Manifest in storage: `model_url`, `sha256`, `model_id`, `format`.
- On startup:
  - If file missing or checksum mismatch, download to
    `/models/<model_id>/...`, verify, then atomically swap
    `/models/current -> /models/<model_id>`.
  - Start the inference server pointing at `/models/current/...`.

### High-load controls (keep these in Helix Ask)
1) Queue caps + 429 backpressure
- Example: `ACTIVE_LIMIT = 4`, `QUEUE_LIMIT = 8`.
- When queue full, return HTTP 429 with a friendly retry message.

2) Adaptive max_tokens (protects tail latency)
- Predict time: `predicted_seconds = max_tokens / tokens_per_sec_estimate`.
- If prediction exceeds SLA, shrink `max_tokens`.
- Example policy:
  - Normal load: 768
  - Medium: 384
  - Heavy: 192
  - Extreme: reject or overflow to paid

### Suggested path for current setup (CPU + GGUF)
1) Stand up a dedicated llama.cpp server with:
   - parallel slots
   - continuous batching
   - OpenAI-compatible API
2) Refactor Helix Ask into a provider-based client.
3) Add queue caps + adaptive token budgets.
4) Later: switch to a paid GPU server (vLLM or TGI) via `HELIX_ASK_BASE_URL`.

### Example: OpenAI-compatible client call (TypeScript)
```ts
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function helixAskChat(
  messages: ChatMessage[],
  opts: { maxTokens: number; temperature?: number; signal?: AbortSignal },
) {
  const baseUrl = process.env.HELIX_ASK_BASE_URL!;
  const apiKey = process.env.HELIX_ASK_API_KEY;
  const model = process.env.HELIX_ASK_MODEL!;

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: opts.temperature ?? 0.2,
      max_tokens: opts.maxTokens,
      stream: false,
    }),
    signal: opts.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HelixAsk inference error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
```

## Replit compute options (reported; verify before relying)
This note is based on a Replit Agent response on Feb 5, 2026. Treat it as
unverified and confirm current pricing/tiers before acting.

Reserved VM tiers (always-on):
| Tier | vCPU | RAM | Approx. monthly cost |
| --- | --- | --- | --- |
| Shared | 0.5 | 2 GB | ~$20 |
| Dedicated | 1 | 4 GB | ~$20+ |
| Dedicated | 2 | 8 GB | Higher tier |
| Dedicated | 4 | 16 GB | Higher tier |
| Enterprise | Up to 64 | Up to 128 GB | Custom |

Autoscale deployments:
- Billed per compute unit (1 CPU-second = 18 units, 1 RAM-second = 2 units).
- Not ideal for long CPU-only LLM inference due to cold starts and long runs.

GPU deployments:
- GPU compute is reported as private beta only (no public GPU tier).
- Practical alternative: external GPU inference service; keep app on Replit.

Plans/credits impact:
- Core plan: 4 vCPU / 8 GB dev env, $25 credits.
- Teams plan: 8 vCPU / 16 GB dev env, $40/user credits.
- Enterprise: custom dev env and credits.
- Credits can apply to Reserved VM costs; overages billed.
- Teams reportedly replaced by Pro on Feb 20, 2026.

## References
[1]: https://manpages.debian.org/testing/llama.cpp-tools/llama-server.1.en.html "llama-server(1) - llama.cpp-tools - Debian testing"
[2]: https://llama-cpp-python.readthedocs.io/en/latest/server/ "OpenAI Compatible Web Server - Llama-CPP-Python Docs"
[3]: https://docs.vllm.ai/en/latest/serving/openai_compatible_server/ "OpenAI-Compatible Server - vLLM"
[4]: https://huggingface.co/docs/text-generation-inference/en/index "Text Generation Inference"
[5]: https://docs.ollama.com/api/introduction "Ollama API"
[6]: https://docs.openvino.ai/2024/ovms_demos_continuous_batching.html "OpenVINO Model Server Continuous Batching"

## Reminder
To scale beyond ~1 request at a time, move inference off CPU (GPU or hosted model server).


## Context session runtime limitations (Tier 0/Tier 1)

- Tier 1 screen context depends on browser capture APIs and operator permission flow.
- Capture cannot start silently; it must be triggered by direct user interaction.
- Permission denial or revoked tracks become deterministic `error` state transitions.
- Tier 0 remains fully supported when Tier 1 is unavailable.
- Context callout eligibility is disabled whenever session state is not `active`.


## Evolution governance runtime note (report-only CI hook)

An optional report-only CI hook may emit `artifacts/evolution-gate-report.json` via `POST /api/evolution/gate/run`.
This hook is additive and must not replace or weaken mandatory Casimir verify behavior in CI.
