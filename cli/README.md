# Casimir CLI

Thin CLI wrapper around the Casimir adapter and training-trace export endpoints.
Requires Node 18+.

Install (once published)
```
npm install -g casimir-cli
```

Usage
```
casimir verify --json adapter-request.json
```

Defaults
- Uses `https://casimirbot.com` when no `--url` is provided.
- Override with `--url` or set `CASIMIR_PUBLIC_BASE_URL`.

Options
- `--json` path to adapter request JSON.
- `--params` inline JSON object string.
- `--url` override adapter endpoint.
- `--export-url` override trace export endpoint.
- `--trace-out` JSONL output path (use `-` for stdout).
- `--trace-limit` max traces to export (default: 50).
- `--token` bearer token (JWT).
- `--tenant` tenant/customer id.
- `--quiet` suppress response output.

Example request JSON
```json
{
  "traceId": "cli-run-001",
  "actions": [
    { "id": "a1", "label": "reduce duty", "params": { "dutyEffectiveFR": 0.0025 } }
  ],
  "budget": { "maxIterations": 1, "maxTotalMs": 60000 }
}
```
