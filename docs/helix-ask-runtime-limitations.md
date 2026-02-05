# Helix Ask Runtime Limitations (Replit)

## Current hard constraints
- Context window cap: 4,096 tokens (`LLM_LOCAL_CONTEXT_TOKENS`)
- Max output tokens: 2,048 (`LLM_LOCAL_MAX_TOKENS`)
- Concurrency: 1 (serialized inference)
- Throughput: ~3–4 tokens/sec (CPU Qwen2.5-3B Q4)
- Job timeout: 20 minutes (`HELIX_ASK_JOB_TIMEOUT_MS`)
- Circuit breaker: 3 failures -> 60s cooldown

## Effective capacity
- 2,048 tokens ~= 9–10 minutes per request
- With concurrency=1, practical peak is ~6 requests/hour at max size
- Realistic safe queue: 1 active + 1–2 waiting

## Impact on multi-user scale
- RPM limit is irrelevant; generation time dominates
- Peak load will stall without queue caps or adaptive token limits

## Future scaling (GPU / external LLM)
- Raise concurrency above 1
- Increase tokens/sec by 5–10x
- Allow higher output budgets without timeouts

## Reminder
To scale beyond ~1 request at a time, move inference off CPU (GPU or hosted model server).
