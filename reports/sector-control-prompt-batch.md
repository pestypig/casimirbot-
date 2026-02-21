# Sector Control Prompt Batch

## Auto-run
Use this prompt with Codex Cloud to replay deterministic sector-control planning and wire outputs into proposal structures.

```text
Execute the sector-control prompt batch in order.
For each step:
1) Call `physics.warp.sector_control.plan` with the exact JSON payload.
2) Record `constraints`, `firstFail`, and observer overflow values.
3) If `firstFail` is non-null, mark step `degraded` and continue.
4) Emit an execution ledger row and include canonical hash verification.
Canonical replay hash: 689e7ca35557a2e5ab30b882fb17eb0dff622055acf36b73c3f9ee3d4f1ae9d6
Reference summary artifact: artifacts/experiments/sector-control-repro/latest/summary.json
```

## Prompt Steps

### Prompt 0

- mode: `diagnostic`
- expected firstFail: `null`
- expected constraints: `{"FordRomanQI":"pass","ThetaAudit":"pass","TS_ratio_min":"pass","VdB_band":"unknown","grConstraintGate":"pass"}`

```json
{
  "mode": "diagnostic",
  "overrides": {
    "timing": {
      "strobeHz": 120,
      "TS_ratio": 1.7,
      "tauLC_ms": 10,
      "tauPulse_ms": 2
    },
    "allocation": {
      "sectorCount": 16,
      "concurrentSectors": 3,
      "negativeFraction": 0.25
    },
    "duty": {
      "dutyCycle": 0.45,
      "dutyBurst": 0.28,
      "dutyShip": 0.18
    }
  }
}
```

### Prompt 1

- mode: `stability_scan`
- expected firstFail: `null`
- expected constraints: `{"FordRomanQI":"pass","ThetaAudit":"pass","TS_ratio_min":"pass","VdB_band":"unknown","grConstraintGate":"pass"}`

```json
{
  "mode": "stability_scan",
  "overrides": {
    "timing": {
      "strobeHz": 140,
      "TS_ratio": 1.9,
      "tauLC_ms": 9,
      "tauPulse_ms": 1.8
    },
    "allocation": {
      "sectorCount": 24,
      "concurrentSectors": 4,
      "negativeFraction": 0.22
    },
    "duty": {
      "dutyCycle": 0.42,
      "dutyBurst": 0.24,
      "dutyShip": 0.16
    }
  }
}
```

### Prompt 2

- mode: `qi_conservative`
- expected firstFail: `null`
- expected constraints: `{"FordRomanQI":"pass","ThetaAudit":"pass","TS_ratio_min":"pass","VdB_band":"unknown","grConstraintGate":"pass"}`

```json
{
  "mode": "qi_conservative",
  "overrides": {
    "timing": {
      "strobeHz": 180,
      "TS_ratio": 2.2,
      "tauLC_ms": 8,
      "tauPulse_ms": 1.2
    },
    "allocation": {
      "sectorCount": 24,
      "concurrentSectors": 2,
      "negativeFraction": 0.15
    },
    "duty": {
      "dutyCycle": 0.35,
      "dutyBurst": 0.16,
      "dutyShip": 0.1
    }
  }
}
```

### Prompt 3

- mode: `theta_balanced`
- expected firstFail: `null`
- expected constraints: `{"FordRomanQI":"pass","ThetaAudit":"pass","TS_ratio_min":"pass","VdB_band":"unknown","grConstraintGate":"pass"}`

```json
{
  "mode": "theta_balanced",
  "overrides": {
    "timing": {
      "strobeHz": 150,
      "TS_ratio": 1.8,
      "tauLC_ms": 9,
      "tauPulse_ms": 1.6
    },
    "allocation": {
      "sectorCount": 24,
      "concurrentSectors": 5,
      "negativeFraction": 0.3
    },
    "duty": {
      "dutyCycle": 0.52,
      "dutyBurst": 0.32,
      "dutyShip": 0.22
    }
  }
}
```

