# Training Trace API

Minimal endpoints to ingest and export training traces from the verification
pipeline. Canonical routes live under `/api/agi`. When AGI auth/tenant isolation
is enabled (`ENABLE_AGI_AUTH=1` or `AGI_TENANT_REQUIRED=1`), include an
`Authorization: Bearer ...` token and a tenant header (e.g., `X-Tenant-Id`).
The same router is also mounted under `/api/helix` for compatibility.

## Endpoints
- `POST /api/agi/training-trace`
- `GET /api/agi/training-trace?limit=50`
- `GET /api/agi/training-trace/:id`
- `GET /api/agi/training-trace/export`

## Example curls

Create a trace:
```bash
curl -s -X POST http://localhost:5173/api/agi/training-trace \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: acme" \
  -d '{
    "traceId": "warp-viability:demo",
    "pass": false,
    "signal": {
      "kind": "warp-viability",
      "proxy": false,
      "ladder": { "tier": "diagnostic", "policy": "warp-viability", "policyVersion": "1" }
    },
    "deltas": [
      { "key": "gamma_VdB", "from": 1, "to": 1.5, "delta": 0.5, "change": "changed" }
    ],
    "firstFail": { "id": "FordRomanQI", "severity": "HARD", "status": "fail", "value": -3e-6, "limit": "-1e-6" },
    "certificate": {
      "status": "INADMISSIBLE",
      "certificateHash": null
    },
    "notes": ["status=INADMISSIBLE"]
  }'
```

Create a GR-certified trace:
```bash
curl -s -X POST http://localhost:5173/api/agi/training-trace \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "gr-agent-loop:demo:0",
    "pass": true,
    "signal": {
      "kind": "gr-certified",
      "proxy": false,
      "ladder": { "tier": "certified", "policy": "gr-constraint-gate:warp-agents", "policyVersion": "1" }
    },
    "deltas": [
      { "key": "gammaGeo", "from": 26, "to": 25.22, "delta": -0.78, "change": "changed" }
    ],
    "firstFail": null,
    "certificate": {
      "status": "ADMISSIBLE",
      "certificateHash": "sha256:deadbeef",
      "certificateId": "cert-001",
      "integrityOk": true
    },
    "notes": ["initial_status=CERTIFIED", "gateStatus=pass"]
  }'
```

Create a GR-diagnostic trace:
```bash
curl -s -X POST http://localhost:5173/api/agi/training-trace \
  -H "Content-Type: application/json" \
  -d '{
    "traceId": "gr-agent-loop:demo:1",
    "pass": false,
    "signal": {
      "kind": "gr-diagnostic",
      "proxy": true,
      "ladder": { "tier": "diagnostic", "policy": "gr-constraint-gate:warp-agents", "policyVersion": "1" }
    },
    "deltas": [
      { "key": "dutyEffectiveFR", "from": 0.0025, "to": 0.0021, "delta": -0.0004, "change": "changed" }
    ],
    "firstFail": { "id": "BSSN_H_rms", "severity": "HARD", "status": "fail", "value": 0.024, "limit": "<= 0.01" },
    "certificate": {
      "status": "NOT_CERTIFIED",
      "certificateHash": null,
      "certificateId": null,
      "integrityOk": false
    },
    "notes": ["initial_status=UNCERTIFIED", "gateStatus=fail"]
  }'
```

List recent traces:
```bash
curl -s "http://localhost:5173/api/agi/training-trace?limit=10"
```

Fetch a single trace:
```bash
curl -s http://localhost:5173/api/agi/training-trace/1
```

Export JSONL:
```bash
curl -s http://localhost:5173/api/agi/training-trace/export \
  > training-trace.jsonl
```

Notes:
- The export streams the persisted JSONL file when present; otherwise it emits  
  the in-memory buffer.
- When tenant isolation is enabled, list/export are filtered to the resolved    
  tenant id (from JWT claims or `X-Tenant-Id`/`X-Customer-Id` headers).
- Traces may include a `metrics` map (for example `audit.*` values from the    
  provenance-safety pack auto-scan).
- If a training signal comes from a proxy/qualitative source (e.g., lattice     
  visual cues), set `signal.proxy=true` (and optionally `source.proxy=true`) to 
  prevent overclaiming.
- `signal.ladder.tier` makes the policy ladder explicit: `reduced-order` and
  `diagnostic` are learning tiers (not safe to ship), while `certified` means
  safe to ship under the referenced policy/version.
- To separate GR diagnostics from certified solves, use `signal.kind` values
  like `gr-diagnostic` (proxy or non-certified) vs `gr-certified` (accepted
  solve with a certificate hash + integrity OK).
