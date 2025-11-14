# Personalization Acceptance Checklist (v0.2)

> Target: **≥70 %** pass rate on the smoke battery with relevant memories/reflections surfaced for the active persona.

## Persona-aware console

- Set `ENABLE_PERSONA_UI=1` (and optionally `ENABLE_EVAL_UI=1` for the dev-only eval button).
- Drop into the console and use the persona dropdown to select the actor for the current session.
- Every `/plan` call now threads `personaId` through to `/execute`, TaskTrace, and downstream ACL checks. You can verify by opening the Trace Drawer: the persona id is echoed in the payload and the `/api/agi/trace/:id` endpoint now enforces persona ownership when `ENABLE_AUTH=1`.

## Memory & Reflection Drawer

- With `ENABLE_MEMORY_UI=1` enabled, the new **Mem** toggle opens a drawer next to the trace panel.
- It calls `GET /api/agi/memory/by-trace/:traceId?k=10` which returns:
  - Session-focused memory hits (`session:<traceId>` or `task:<traceId>` keys).
  - The latest procedural reflections tied to the same persona + trace.
- Each row links back to the originating Essence envelope when present, providing immediate context on why a memory was surfaced.

## Eval visibility & metrics

- `POST /api/agi/eval/smoke` runs the existing `pnpm eval:smoke` harness in-process against the configured base URL (default `http://localhost:3000`).
- Results flow into two Prometheus counters:
  - `agi_eval_runs_total{result="ok|fail|skipped|error"}`
  - `agi_tasks_success_total{status="ok|fail"}` (incremented when the harness completes, so the existing task-success chart reflects eval drift).
- The optional `EvalPanel` component (dev-only by default) exposes a “Run smoke eval” button plus the last rate/target, so you can chase the **≥70 %** requirement directly from the console.

## Reproduction steps

1. Ensure the feature flags are set (see `.env.example` for the `ENABLE_*` entries plus `TRACE_TTL_MS`, `TRACE_SSE_BUFFER`, and `EVAL_SUCCESS_TARGET`).
2. Start the app (`pnpm dev`) and open the console.
3. Select a persona, run a task, and verify the Trace and Memory drawers both reference the same trace ID and persona.
4. Trigger the eval API:
   ```bash
   curl -s -X POST http://localhost:3000/api/agi/eval/smoke | jq
   curl -s http://localhost:3000/metrics | grep agi_eval_runs_total
   ```
5. Confirm the metrics counters and UI surfaces reflect the run and that relevant memories/reflections are shown for that trace.
