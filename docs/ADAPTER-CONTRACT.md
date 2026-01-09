# Adapter Run Contract (v1)

This is the thin, public adapter contract for external agent platforms. It is
designed to be trivial to integrate while still returning deterministic
verdicts, first-fail constraints, and deltas.

Endpoint
- `POST /api/agi/adapter/run`

When AGI auth/tenant isolation is enabled, include:
- `Authorization: Bearer ...`
- `X-Tenant-Id` (or `X-Customer-Id`)

Request (minimal)
```json
{
  "traceId": "client-run-001",
  "actions": [
    { "id": "a1", "label": "reduce duty", "params": { "dutyCycle": 0.002 } },
    { "id": "a2", "params": { "gammaGeo": 22 } }
  ],
  "budget": { "maxIterations": 2, "maxTotalMs": 60000 },
  "policy": {
    "thresholds": { "H_rms_max": 0.01, "M_rms_max": 0.001 },
    "gate": { "mode": "hard-only", "unknownAsFail": true }
  }
}
```

Constraint pack mode (pack-agnostic)
```json
{
  "traceId": "ci:run-001",
  "mode": "constraint-pack",
  "pack": {
    "id": "repo-convergence",
    "autoTelemetry": true,
    "telemetry": {
      "build": { "status": "pass", "durationMs": 420000 },
      "tests": { "failed": 0, "total": 128 },
      "schema": { "contracts": true },
      "deps": { "coherence": true }
    }
  }
}
```

Response (example)
```json
{
  "traceId": "client-run-001",
  "runId": "42",
  "verdict": "FAIL",
  "pass": false,
  "firstFail": {
    "id": "H_constraint",
    "severity": "HARD",
    "status": "fail",
    "value": 0.12,
    "limit": "H_rms <= 0.01"
  },
  "certificate": {
    "status": "ADMISSIBLE",
    "certificateHash": "sha256:deadbeef",
    "certificateId": "cert-001",
    "integrityOk": true
  },
  "deltas": [
    { "key": "dutyCycle", "from": 0.004, "to": 0.002, "delta": -0.002, "change": "changed" }
  ],
  "artifacts": [
    { "kind": "gr-agent-loop-run", "ref": "42" },
    { "kind": "gr-agent-loop-run-url", "ref": "/api/helix/gr-agent-loop/42" },
    { "kind": "training-trace-export", "ref": "/api/agi/training-trace/export" },
    { "kind": "warp-certificate-hash", "ref": "sha256..." }
  ]
}
```

Notes
- `actions[].params` map directly to the GR pipeline parameter overrides.
- For `mode: "constraint-pack"`, provide `pack.id` and telemetry/metrics; the
  adapter evaluates the pack and emits a training trace.
- When available, the adapter response includes a `certificate` object with     
  hash + integrity status (constraint-pack runs auto-issue certificates when    
  telemetry is provided).
- If `certificate` is missing or `integrityOk` is false, treat the run as NOT
  CERTIFIED even if `verdict` is PASS.
- Auto-ingest for constraint packs supports report paths (`pack.*Path`) and
  tool log ingestion (`pack.toolLogTraceId`, `pack.toolLogWindowMs`,
  `pack.toolLogLimit`). When `autoTelemetry` is true, the adapter will also scan
  `reports/` for junit/vitest/jest/eslint/tsc outputs by default.
- `pack.ladderTier` can downgrade fidelity for training-only runs; it is clamped to the actual tier.
- `policyOverride.policy.minLadderTier` can require a minimum tier (evaluation fails below it).
- `budget` and `policy` are optional; omit them to use defaults.
- `deltas` reflect the net parameter changes between the first and terminal
  attempt; if no change is detected, the list can be empty.
