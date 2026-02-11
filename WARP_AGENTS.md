# Warp Agents Spec

This file defines the physics prerequisites and guardrails for warp-related tasks.

The system **MUST NOT** declare any configuration "physically viable" unless all HARD
constraints pass and the viability oracle has produced an `ADMISSIBLE` status.

```json warp-agents
{
  "version": 1,
  "constraints": [
    {
      "id": "FordRomanQI",
      "severity": "HARD",
      "description": "Quantum inequality bound on negative energy duration/magnitude.",
      "type": "inequality",
      "expression": "int_T00_dt >= -K / tau^4"
    },
    {
      "id": "ThetaAudit",
      "severity": "HARD",
      "description": "Theta calibration within allowed band.",
      "type": "threshold",
      "expression": "|thetaCal| <= theta_max"
    },
    {
      "id": "CL3_RhoDelta",
      "severity": "SOFT",
      "description": "CL3 stress-energy congruence (constraint rho vs T00).",
      "type": "threshold",
      "expression": "|rho_constraint - T00| / max(|T00|, eps) <= rho_delta_max"
    },
    {
      "id": "TS_ratio_min",
      "severity": "SOFT",
      "description": "Minimum TS_ratio for stable warp bubble.",
      "type": "threshold",
      "expression": "TS_ratio >= 1.5"
    },
    {
      "id": "VdB_band",
      "severity": "SOFT",
      "description": "Van den Broeck compression factor within configured band.",
      "type": "band",
      "expression": "gamma_VdB in [gamma_min, gamma_max]"
    }
  ],
  "grConstraintGate": {
    "version": 1,
    "thresholds": {
      "H_rms_max": 0.01,
      "M_rms_max": 0.001,
      "H_maxAbs_max": 0.1,
      "M_maxAbs_max": 0.01
    },
    "policy": {
      "mode": "hard-only",
      "unknownAsFail": true
    }
  },
  "requiredTests": [
    "tests/theory-checks.spec.ts",
    "tests/stress-energy-brick.spec.ts",
    "tests/york-time.spec.ts",
    "tests/gr-agent-loop.spec.ts",
    "tests/gr-agent-loop-baseline.spec.ts",
    "tests/gr-constraint-gate.spec.ts",
    "tests/gr-constraint-network.spec.ts",
    "tests/stress-energy-matter.spec.ts",
    "tests/helix-ask-graph-resolver.spec.ts",
    "tests/natario-metric-t00.spec.ts",
    "tests/warp-metric-adapter.spec.ts",
    "tests/warp-viability.spec.ts",
    "tests/proof-pack.spec.ts",
    "tests/proof-pack-strict-parity.spec.ts",
    "tests/pipeline-ts-qi-guard.spec.ts",
    "tests/qi-guardrail.spec.ts",
    "tests/lattice-probe-guardrails.spec.ts",
    "client/src/components/__tests__/warp-proof-ts-strict.spec.tsx"
  ],
  "viabilityPolicy": {
    "admissibleStatus": "ADMISSIBLE",
    "allowMarginalAsViable": false,
    "treatMissingCertificateAsNotCertified": true
  },
  "searchDefaults": {
    "maxSamples": 200,
    "concurrency": 4,
    "topK": 5
  }
}
```
