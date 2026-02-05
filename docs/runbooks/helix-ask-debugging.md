# Helix Ask Debugging Runbook

Use this when Helix Ask is slow, ambiguous, or returning unexpected results. It focuses on reliable, low-noise diagnostics and avoids streaming logs unless you explicitly need them.

**Prereqs**
- Bash shell
- `curl`
- `jq`
- `python -m json.tool` (optional for pretty JSON)

## 1) Define the Base URL

```bash
BASE="https://<your-replit-host>.replit.dev"
```

## 2) Run a Safe Debug Ask (jq-safe payload)

```bash
SID="slowtest-$(date +%s)"
TRACE="ask:$SID"

payload=$(jq -n \
  --arg q "What does solar restoration mean in this repo?" \
  --arg sid "$SID" \
  --arg tid "$TRACE" \
  '{question:$q, debug:true, sessionId:$sid, traceId:$tid}')

curl -sS "$BASE/api/agi/ask" \
  -H "Content-Type: application/json" \
  -d "$payload" | python -m json.tool
```

Notes:
- Always generate the JSON with `jq -n` to avoid invalid JSON errors.
- `sessionId` and `traceId` must match when you fetch logs.

## 2b) Trace Summary From Debug Response

If you only need the slowest steps, use the trace summary embedded in the response:

```bash
curl -sS "$BASE/api/agi/ask" \
  -H "Content-Type: application/json" \
  -d "$payload" \
| jq -r '.debug.trace_summary[] | "\(.durationMs)ms | \(.stage) | fn=\(.meta.fn // "-") | \(.detail // "")"'
```

For a full timeline, inspect `debug.trace_events`:

```bash
curl -sS "$BASE/api/agi/ask" \
  -H "Content-Type: application/json" \
  -d "$payload" \
| jq -r '.debug.trace_events[] | "\(.ts) | \(.stage) | fn=\(.meta.fn // "-") | \(.detail // "")"'
```

## 3) Get the Latest SessionId (No Streaming)

```bash
curl -sS "$BASE/api/agi/tools/logs?tool=helix.ask.event&limit=200" \
| jq -r '.logs | first | .sessionId // "no-session-id"'
```

## 4) Top 10 Slowest Events (Non-Streaming)

```bash
SID="<session-id-from-step-3-or-step-2>"

curl -sS "$BASE/api/agi/tools/logs?tool=helix.ask.event&limit=250&sessionId=$SID" \
| jq -r '(.logs // [])
  | map(select(.durationMs != null))
  | sort_by(.durationMs) | reverse | .[:10]
  | .[] | "\(.durationMs)ms | \(.stage) | \(.detail // "")"'
```

Important:
- The server caps `limit` at 250. Higher values return a validation error.
- If `stage` is `null`, the server is still on the old event schema. Redeploy and run a fresh session.

## 5) Errors Only

```bash
SID="<session-id>"

curl -sS "$BASE/api/agi/tools/logs?tool=helix.ask.event&limit=250&sessionId=$SID" \
| jq -r '(.logs // [])
  | map(select(.ok==false))
  | .[] | "\(.ts) | \(.stage) | \(.detail // "") | \(.text // "")"'
```

## 6) Streaming (Optional, Live Progress)

Use streaming only when you need to watch the pipeline live. It never exits on its own. Stop with `Ctrl+C`.

```bash
SID="streamtest-$(date +%s)"
TRACE="ask:$SID"

curl -N "$BASE/api/agi/tools/logs/stream?sessionId=$SID&traceId=$TRACE&tool=helix.ask.event"
```

Then run the ask in another terminal using the same `SID` and `TRACE`.

## 7) Troubleshooting Checklist

1. `limit` must be `<= 250` for `/tools/logs`.
2. `sessionId` must match the ask request.
3. If `stage` is `null`, redeploy to the latest commit and rerun the session.
4. If you see `Expected ',' or '}' after property value`, rebuild the payload with `jq -n`.
5. Streaming is optional. For long runs, prefer non-streaming summary queries.

## 8) Quick Legacy Fallback (Old Schema)

If you are stuck on old logs, you can still view the top 10 slow events by text:

```bash
SID="<session-id>"

curl -sS "$BASE/api/agi/tools/logs?tool=helix.ask.event&limit=250&sessionId=$SID" \
| jq -r '(.logs // [])
  | map(select(.durationMs != null))
  | sort_by(.durationMs) | reverse | .[:10]
  | .[] | "\(.durationMs)ms | \(.text // "no-text")"'
```
