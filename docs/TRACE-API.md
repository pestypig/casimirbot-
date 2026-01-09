# Trace API and Stream Semantics

The AGI console exposes a small trace surface so operators can inspect tasks without attaching a debugger. All routes are disabled unless `ENABLE_AGI=1` **and** `ENABLE_TRACE_API=1`.

## REST endpoints

| Route | Description |
| ----- | ----------- |
| `GET /api/agi/trace/:id` | Returns the serialized `task_trace` row. Only the persona owner (or an admin) can fetch a trace when `ENABLE_AUTH=1`. |
| `GET /api/agi/memory/by-trace/:traceId?k=10` | Lists the most recent session memories (`session:<traceId>` or `task:<traceId>`) and procedural reflections for the same trace/persona. Requires `ENABLE_MEMORY_UI=1`. |
| `POST /api/agi/tools/logs/ingest` | Ingests tool events/logs from external runtimes and appends them to the tool-log buffer. |

### ACLs

When auth is enabled the server inspects `req.auth` and enforces the persona ACL before returning a trace payload. Non-owners receive `403` rather than the previous implicit access. The same guard applies to the trace-aware memory endpoint.

### Trace retention

Traces are cached in-memory to make the Drawer snappy. The TTL is controlled by `TRACE_TTL_MS` (default `6h`). Anything older is evicted from the cache automatically, but the canonical copy still lives in Postgres.

## Tool-log SSE

`GET /api/agi/tools/logs/stream?limit=200&tool=llm.local.generate` emits newline-delimited Server-Sent Events. Each event now includes a monotonic `id` field (internally the tool-log `seq`) so that browsers can resume after a tab reload:

```
id: 42
event: message
data: {"seq":42,"tool":"llm.local.generate","ok":true,...}
```

Browsers send `Last-Event-ID` automatically when reconnecting. The server replays up to `TRACE_SSE_BUFFER` entries that have `seq > Last-Event-ID`, so downstream dashboards do not miss lines while offline.

To manually resume:

```
curl -N \
  -H "Last-Event-ID: 40" \
  "http://localhost:3000/api/agi/tools/logs/stream?limit=50"
```

`TRACE_SSE_BUFFER` defaults to `200`, but can be lowered if dashboards only need a short tail.

Runtime adapters that emit tool logs are documented in
`docs/TOOL-EVENT-ADAPTERS.md`.

## Tool-log ingest

`POST /api/agi/tools/logs/ingest` accepts either direct tool-log records or
start/success/error events (including LangGraph-style events). Defaults can be
applied to every record/event in the same payload.

```json
{
  "defaults": { "traceId": "trace-123", "sessionId": "session-123", "version": "1.2.0" },
  "events": [
    { "kind": "start", "runId": "run-1", "tool": "search.web", "params": { "q": "warp" } },
    { "kind": "success", "runId": "run-1", "tool": "search.web", "durationMs": 120 }
  ]
}
```
