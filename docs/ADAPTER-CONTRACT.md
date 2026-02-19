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


Authenticity ladder policy (optional)
```json
{
  "policy": {
    "authenticity": {
      "consequence": "low|medium|high",
      "required": false,
      "trustedSignerKeyIds": ["robotics-prod-signer"]
    }
  }
}
```
- Default consequence is `low` (integrity-only, authenticity not enforced).
- `high` consequence enforces authenticity by default.
- `required: true` enforces authenticity for any consequence.

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
    "integrityOk": true,
    "authenticityOk": true,
    "authenticityRequired": true,
    "authenticityConsequence": "high",
    "authenticityReasonCodes": []
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
- `policy.verify.mode` supports `strict` and `permissive`:
  - `strict` is fail-closed for verification flows: missing certificate evidence,
    certificate integrity failure, or adapter failure must degrade to FAIL.
  - `permissive` keeps execution available but must be labeled
    `non_verified_degraded` by callers when verification evidence is incomplete.
- Canonical fail IDs for verification degradation include
  `ADAPTER_CERTIFICATE_MISSING`, `ADAPTER_CERTIFICATE_INTEGRITY`, and
  `ADAPTER_CONSTRAINT_FAIL` (plus adapter-error-specific deterministic IDs).
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

- When authenticity is required and fails, `firstFail.id` is `ADAPTER_CERTIFICATE_AUTHENTICITY_REQUIRED` (class `certificate_authenticity_required`).

## Helix Ask tool-space MVP additions

### Tool catalog endpoint
- `GET /api/agi/tools/catalog`
- Returns capability cards with fields:
  - `id` / `name`
  - `purpose`
  - `intents[]`
  - `requiredInputs[]`
  - `sideEffectClass` (`none|read|write|external`)
  - `dryRunSupported`
  - `trustRequirements[]`
  - `verifyRequirements[]`

### Ask request additions (tool flow)
- Existing: top-level `dryRun` (still supported)
- New: `tool.dryRun` (preferred for tool-flow dry run)

### Ask response additions (tool flow)
- `debug.tool_plan` (deterministic planning surface):
  - `candidates[]` (`tool`, `score`, `reason`)
  - `selectedTool`
  - `blocked[]` (`tool`, `reason`)
  - `tieBreakReason`
- Dry-run returns:
  - `dry_run: true`
  - `tool_plan`
  - `predicted_contract_path`
- Structured clarify for missing tool inputs returns:
  - `ok: false`
  - `mode: "clarify"`
  - `fail_reason: "TOOL_INPUT_MISSING"`
  - `clarify_slots: string[]`
