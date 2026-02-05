# Helix Ask Runtime Constraints (Replit CPU)

Last updated: 2026-02-05

## Token limits
- Context window: 4,096 tokens (hard max; `LLM_LOCAL_CONTEXT_TOKENS`).
- Output cap: 2,048 tokens (`LLM_LOCAL_MAX_TOKENS`).
- Context clamp range: 2,048–4,096 (`server/services/llm/local-runtime.ts`).
- Default context: 3,072 tokens (fallback).

## Retrieval limits
- Max TopK files: 4 (`server/services/llm/local-runtime.ts`).
- Max knowledge bytes per query: 80,000 bytes (`server/services/llm/local-runtime.ts`).

## Runtime timeouts
- Helix Ask job timeout: 1,200,000 ms (20 min) (`HELIX_ASK_JOB_TIMEOUT_MS`).
- LLM spawn timeout: 60,000 ms default (`LLM_LOCAL_SPAWN_TIMEOUT_MS`).
- Job TTL: 30 min (`server/services/helix-ask/job-store.ts`).
- Job stale cleanup: 60 sec interval (`server/services/helix-ask/job-store.ts`).

## Circuit breaker and rate limits
- Circuit breaker: 3 failures ? 60s cooldown (`server/skills/llm.local.spawn.ts`).
- LLM spawn rate limit: 60 RPM (`server/skills/llm.local.spawn.ts`).
- HTTP rate limit: none detected in Express routes.

## Model
- Model: `qwen2.5-3b-instruct-q4_k_m.gguf` (~2.0–2.1 GB, Q4).
- Inference: CPU-only (Replit default), ~3–4 tokens/sec observed.

## Concurrency (critical)
- `DEFAULT_CONCURRENCY = 1` (`server/skills/llm.local.spawn.ts`).
- Only one LLM inference runs at a time; additional requests queue via spawn waiters.

## Performance expectations
- Estimated max output time at 2,048 tokens: ~585s (~9.75 min) at 3.5 tok/s.
- Configured job timeout is 20 min to allow full generation + overhead.

## Scaling guidance
- For p95 latency <= 60s, keep outputs <= ~200 tokens.
- For p95 latency <= 120s, outputs <= ~400 tokens.
- Full 2K output can take 5–10 minutes on CPU.

## Gaps / Unknowns
- GGUF context metadata not read from binary (model likely supports >4K but limited by env).
- No GPU acceleration detected; moving to GPU or external LLM would increase tok/s 5–10x.
- Queue depth not bounded; add max queue length if needed.
- Memory per inference not profiled.

## File references
- `.replit` for env values.
- `server/services/llm/local-runtime.ts` for context clamp.
- `server/skills/llm.local.spawn.ts` for rate limits + concurrency.
- `server/services/helix-ask/job-store.ts` for TTL + cleanup.
- `docs/replit-runtime.md` for benchmarks.
