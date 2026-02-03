# Runtime Resilience Runbook

Goal: keep the service responsive during partial outages and prevent a single runtime error from cascading into a full outage.

## Supervision
- Run the server under a supervisor (PM2/systemd/managed platform).
- Configure restarts on non-zero exit (recommended for production).
- Suggested environment:
  - `FATAL_EXIT_ON_ERROR=1`
  - `FATAL_EXIT_DELAY_MS=1500`

## Readiness vs Liveness
- `/health` is liveness (always 200 unless the process is down).
- `/healthz` is readiness (returns 503 until routes + runtime artifacts are ready).

## Circuit Breakers
- Helix Ask breaker: `HELIX_ASK_FAILURE_MAX` + `HELIX_ASK_FAILURE_COOLDOWN_MS`.
- Runtime artifacts breaker: `RUNTIME_ARTIFACT_BREAKER_*`.
- LLM spawn breaker: `LLM_SPAWN_BREAKER_*`.

## Timeouts
- HTTP request timeouts: `HTTP_SERVER_REQUEST_TIMEOUT_MS`, `HTTP_SERVER_HEADERS_TIMEOUT_MS`.
- LLM spawn timeout: `LLM_LOCAL_SPAWN_TIMEOUT_MS`.

## Rate Limits + Bulkheads
- Global API rate limit: `RATE_LIMIT_*`.
- Helix Ask concurrency bulkhead: `HELIX_ASK_CONCURRENCY_MAX`.

## Post-deploy Smoke Check
Recommended quick check:
1) `GET /healthz` should return `ready=true` within 30s.
2) `POST /api/agi/ask` should accept a short prompt without 5xx.

## Rollback Notes
- If `/healthz` stays in `starting`, inspect runtime artifact hydration errors.
- If Helix Ask returns 503, check circuit breaker status and last error in logs.
