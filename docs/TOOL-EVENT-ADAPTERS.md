# Tool Event Adapters

These helpers turn runtime tool events into Casimir tool logs so the tool-use
budget pack can auto-ingest real usage. They are intentionally small and can be
used as middleware in LangGraph-style runtimes or plain async wrappers.

Location:
- `server/services/observability/tool-event-adapters.ts`

## Wrap a tool handler (middleware-style)

```ts
import { wrapToolHandler } from "../server/services/observability/tool-event-adapters";

const runSearch = async (input: { query: string }) => {
  return { results: [] };
};

const wrapped = wrapToolHandler("search.web", runSearch, {
  traceId: "trace-123",
  sessionId: "session-123",
  stepId: "step-1",
  version: "1.0.0",
});

await wrapped({ query: "warp field status" });
```

## Manual wrapper (when you already have a function)

```ts
import { withToolLog } from "../server/services/observability/tool-event-adapters";

await withToolLog(
  "fs.write",
  { path: "output.txt" },
  () => writeFile("output.txt", "ok"),
  { traceId: "trace-123", policy: { forbidden: false } },
);
```

## LangGraph-like event adapter

```ts
import { createLangGraphToolEventAdapter } from "../server/services/observability/tool-event-adapters";

const { handleEvent } = createLangGraphToolEventAdapter({
  traceId: "trace-123",
  sessionId: "session-123",
});

handleEvent({
  event: "on_tool_start",
  name: "search.web",
  run_id: "run-1",
  data: { input: { query: "warp field status" } },
});

handleEvent({
  event: "on_tool_end",
  name: "search.web",
  run_id: "run-1",
  data: { output: { results: [] } },
});
```

## HTTP ingest endpoint

External runtimes can push events directly into the tool log buffer:

```bash
curl -sS http://localhost:5173/api/agi/tools/logs/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "defaults": { "traceId": "trace-123", "sessionId": "session-123" },
    "events": [
      { "kind": "start", "runId": "run-1", "tool": "search.web", "params": { "q": "warp" } },
      { "kind": "success", "runId": "run-1", "tool": "search.web", "durationMs": 94 }
    ]
  }'
```

Notes:
- `run_id` is required to correlate start/end events and compute duration.
- `traceId`, `sessionId`, `stepId`, and `policy` may be provided per event or as
  adapter defaults.
- Events map to tool logs (`appendToolLog`) so `tool-use-budget` auto-ingest can
  summarize policy violations.
