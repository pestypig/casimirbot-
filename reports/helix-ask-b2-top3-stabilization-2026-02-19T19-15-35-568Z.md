# Helix Ask B2 Top-3 Stabilization (2026-02-19T19-15-35-568Z)

## Scope
- A) modes spec stabilization
- B) baseline artifact restoration
- C) semantic gate hardening

## Preflight
```json
{
  "ready_ok": true,
  "preflight_ask_200_rate": 1,
  "smoke_count": 10
}
```

## Semantic gates
```json
[
  {
    "gate": "preflight_ask_200_rate",
    "threshold": ">= 0.90",
    "measured": 1,
    "pass": true
  },
  {
    "gate": "claim_citation_link_rate",
    "threshold": ">= 0.90",
    "measured": 1,
    "pass": true
  },
  {
    "gate": "unsupported_claim_rate",
    "threshold": "<= 0.10",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "contradiction_flag_rate",
    "threshold": "<= 0.10",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "repetition_penalty_fail_rate",
    "threshold": "<= 0.10",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "placeholder_fallback_rate",
    "threshold": "== 0",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "empty_scaffold_rate",
    "threshold": "== 0",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "non_200_rate",
    "threshold": "<= 0.02",
    "measured": 0,
    "pass": true
  },
  {
    "gate": "p95_latency",
    "threshold": "<= 2500ms",
    "measured": 1297,
    "pass": true
  }
]
```

## Baseline compare
```json
{
  "baseline_path": "artifacts/experiments/helix-ask-versatility/20260218T232914Z/versatility-1771457356197/summary.json",
  "baseline_status": "found",
  "baseline_readable": true,
  "current_summary_path": "artifacts/experiments/helix-ask-quake-frame-loop/2026-02-19T19-15-35-568Z/summary.json",
  "current_semantic_gates_path": "artifacts/experiments/helix-ask-quake-frame-loop/2026-02-19T19-15-35-568Z/semantic-gates.json",
  "comparable": true
}
```

## Casimir
```json
{"traceId":"adapter:a61089da-0f50-4a21-9248-e9d5132588bd","runId":"211","verdict":"PASS","pass":true,"firstFail":null,"failReason":"NONE","deltas":[],"certificate":{"certificateHash":"af30145020f02c70d367a3582a2a8029fde487cc110d5e0f45d316f95fbb9e89","certificateId":"constraint-pack:repo-convergence:af30145020f0","integrityOk":true,"status":"GREEN"},"artifacts":[{"kind":"constraint-pack","ref":"repo-convergence"},{"kind":"training-trace-id","ref":"211"},{"kind":"training-trace-url","ref":"/api/agi/training-trace/211"},{"kind":"training-trace-export","ref":"/api/agi/training-trace/export"},{"kind":"constraint-pack-certificate-hash","ref":"af30145020f02c70d367a3582a2a8029fde487cc110d5e0f45d316f95fbb9e89"},{"kind":"constraint-pack-certificate-id","ref":"constraint-pack:repo-convergence:af30145020f0"}]}
```
