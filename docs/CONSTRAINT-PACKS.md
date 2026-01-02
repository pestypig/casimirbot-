# Constraint Packs

Two starter packs are shipped to make the verifier immediately useful in
enterprise agent stacks. Each pack defines constraint IDs, severities, and the
signal kinds used for policy laddering.

Endpoints
- `GET /api/agi/constraint-packs`
- `GET /api/agi/constraint-packs/:id`
- `POST /api/agi/constraint-packs/:id/evaluate`
- `GET /api/agi/constraint-packs/policies?customerId=...`
- `GET /api/agi/constraint-packs/policies/:id`
- `POST /api/agi/constraint-packs/policies`
- `GET /api/helix/constraint-packs` (compat alias)
- `POST /api/helix/constraint-packs/:id/evaluate` (compat alias)
- `GET /api/helix/constraint-packs/policies` (compat alias)
- `GET /api/helix/constraint-packs/policies/:id` (compat alias)
- `POST /api/helix/constraint-packs/policies` (compat alias)

Tenant isolation
- When enabled, supply `X-Tenant-Id` (or `X-Customer-Id`) and ensure
  `customerId` matches the tenant. Cross-tenant policy/profile access returns
  `403`.

Policy ladder
- Reduced-order signals: partial/cheap evaluations, good for learning but not safe to ship.
- Diagnostic signals: high-fidelity checks, still not safe to ship.
- Certified signals: safe to ship under the referenced policy + version.
- Set `policy.minLadderTier` to require a minimum tier (evaluations below it fail).
- Requests may include `ladderTier` to downgrade a run (it will be clamped to the actual tier).

Pack A: Repo Convergence Pack (`repo-convergence`)
- Build/test gates.
- Schema contract checks.
- Dependency coherence checks.
- Time-to-green metrics.

Pack B: Tool-Use + Budget Pack (`tool-use-budget`)
- Step limits.
- Cost ceilings.
- Forbidden operations.
- Approval-required operations.
- Provenance requirements for external data/tools.

Evaluate examples

Repo convergence (CI/build telemetry):
```json
POST /api/agi/constraint-packs/repo-convergence/evaluate
{
  "traceId": "ci:run-4821",
  "telemetry": {
    "build": { "status": "pass", "durationMs": 420000 },
    "tests": { "failed": 0, "total": 128 },
    "schema": { "contracts": true },
    "deps": { "coherence": true },
    "timeToGreenMs": 480000,
    "lint": { "status": true },
    "typecheck": { "status": true }
  }
}
```

Repo convergence (auto-ingest from env/JUnit/JSON):
```json
POST /api/agi/constraint-packs/repo-convergence/evaluate
{
  "traceId": "ci:auto-4821",
  "autoTelemetry": true,
  "junitPath": "reports/junit.xml",
  "telemetryPath": "reports/repo-telemetry.json"
}
```

Tool-use + budget (runtime telemetry):
```json
POST /api/agi/constraint-packs/tool-use-budget/evaluate
{
  "traceId": "agent:session-19",
  "telemetry": {
    "steps": { "used": 12 },
    "cost": { "usd": 1.6 },
    "ops": { "forbidden": 0, "approvalMissing": 0 },
    "provenance": { "missing": 0 },
    "runtime": { "ms": 42000 },
    "tools": { "calls": 6 }
  }
}
```

Policy profile example
```json
POST /api/agi/constraint-packs/policies
{
  "customerId": "acme",
  "name": "tight-budgets",
  "packs": [
    {
      "packId": "tool-use-budget",
      "constraints": [
        { "id": "step_limit", "max": 12 },
        { "id": "cost_ceiling_usd", "max": 2 }
      ]
    }
  ]
}
```

Evaluation with a stored profile
```json
POST /api/agi/constraint-packs/tool-use-budget/evaluate
{
  "policyProfileId": "profile-id",
  "customerId": "acme",
  "telemetry": {
    "steps": { "used": 10 },
    "cost": { "usd": 1.4 },
    "ops": { "forbidden": 0, "approvalMissing": 0 },
    "provenance": { "missing": 0 },
    "runtime": { "ms": 42000 },
    "tools": { "calls": 6 }
  }
}
```

Notes
- Auto-ingest is enabled when `autoTelemetry` is true, when a telemetry path is
  provided, or when `CASIMIR_AUTO_TELEMETRY=1`.
- Auto-ingest reads JSON telemetry (`telemetryPath`, `CASIMIR_TELEMETRY_PATH`,
  `CASIMIR_REPO_TELEMETRY_PATH`, `CASIMIR_TOOL_TELEMETRY_PATH`) and JUnit XML
  (`junitPath`, `CASIMIR_TEST_JUNIT_PATH`, `JUNIT_PATH`) for repo convergence.
- Environment variables can supply telemetry directly; see `docs/ENVIRONMENT.md`
  for the list of `CASIMIR_*` keys.
- `metrics` may be supplied as a flat override map (e.g., `"metrics":{"build.status":1}`).
- `policyOverride` can override thresholds inline (e.g., `{ "constraints":[{"id":"step_limit","max":8}] }`).
- `policyOverride.policy.minLadderTier` enforces a minimum tier (e.g., `"certified"`).
- `ladderTier` can be supplied per evaluation to label the run as lower fidelity.
- The response includes `{ evaluation, trace }` so training traces stay consistent.
- When `policyProfileId` is provided, the response includes `policyProfile` metadata.
- Packs are definitions; evaluators map runtime metrics to the pack's
  constraint IDs, then normalize with `constraint-pack-normalizer.ts`.
