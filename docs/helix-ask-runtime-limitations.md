# Helix Ask Runtime Constraints (Replit)

This note captures the observed limits and configuration caps for the current
Replit runtime (CPU-only local inference). Use it to plan future scaling or GPU
migration.

## Token limits summary
| Parameter | Value | Source | File reference |
| --- | --- | --- | --- |
| Context window cap | 4,096 tokens (hard max) | `LLM_LOCAL_CONTEXT_TOKENS` | `.replit` |
| Max output tokens | 2,048 tokens | `LLM_LOCAL_MAX_TOKENS` | `.replit` |
| Context range | 2,048 - 4,096 (clamped) | code clamp | `server/services/llm/local-runtime.ts` |
| Default context | 3,072 tokens | fallback | `server/services/llm/local-runtime.ts` |
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
- max output tokens: 2,048
- average speed: 3.5 tokens/sec
- max generation time: ~585 sec (~9.75 min)

Implications:
- With concurrency=1, practical peak is ~6 requests/hour at max size.
- Safe queue: 1 active + 1-2 waiting (beyond this, latency spikes).
- RPM limit is not the real bottleneck; generation time is.

## Multi-user behavior
The LLM spawn is serialized (`DEFAULT_CONCURRENCY=1`). Additional requests are
queued via `spawnWaiters`. This does not crash the server, but it can create
long waits. Consider adding a queue length cap and user-facing backpressure.

## Gaps and unknowns
- GGUF model context metadata not extracted (model may support >4K, but env caps at 4K).
- Memory per inference under load not profiled.
- HTTP-level rate limiting is not currently enforced on `/api/agi/*`.

## Future scaling (GPU / external LLM)
- Raise concurrency above 1.
- Increase tokens/sec by 5-10x.
- Allow higher output budgets without timeouts.

## Reminder
To scale beyond ~1 request at a time, move inference off CPU (GPU or hosted model server).
