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
  "requiredTests": [
    "tests/theory-checks.spec.ts",
    "tests/stress-energy-brick.spec.ts",
    "tests/york-time.spec.ts"
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
