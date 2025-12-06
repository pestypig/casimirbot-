# Helix TS/QI autoscale runbook (wired behavior)

Reference checklist for the autoscale servos as they are actually implemented (TS timing first, then QI amplitude). Mirrors `/api/helix/pipeline` fields and env knobs.

## Targets and quick math
- QI: drive raw zeta to <= 0.90. Required scale `s_QI ~= 0.90 / zeta_raw` (example: zeta_raw=2.65 -> s~=0.34).
- TS: drive `TS_ratio >= 100`. With `tau_LC ~= 3.359 us`, target `tau_pulse <= 33.6 ns` (20 ns floor leaves headroom).

## One-pass checks
- GET `/api/helix/pipeline` once; confirm `qi.rhoSource === "tile-telemetry"` and `|sumWindowDt - 1| <= 0.05`.
- TS servo: `tsAutoscale.gating` must be active; if you see `window_bad`, the measured tauPulse differs too much from the previous command (`TS_AUTOSCALE_WINDOW_TOL` band is required). If `timing_bad`, timing is missing; if `ts_safe`, you are already at/above target.
- QI servo: engages only when source matches telemetry, the window is in band, and `zeta_raw > target`.

## Knobs (env actually read by the code)

```
# TS autoscale (timing)
TS_AUTOSCALE_ENABLE=true
TS_AUTOSCALE_TARGET=100
TS_AUTOSCALE_FLOOR_NS=20          # use this name; MIN_NS is ignored
TS_AUTOSCALE_SLEW=0.25
TS_AUTOSCALE_WINDOW_TOL=0.05

# QI autoscale (amplitude)
QI_AUTOSCALE_ENABLE=true
QI_AUTOSCALE_TARGET=0.90
QI_AUTOSCALE_MIN_SCALE=0.03
QI_AUTOSCALE_SLEW=0.25            # default; you can raise to 0.35-0.40 if needed
QI_AUTOSCALE_WINDOW_TOL=0.05
QI_AUTOSCALE_SOURCE=tile-telemetry
```

## Order of operations (matches pipeline)
TS autoscale -> rebuild guard pattern/window (records sum(g*dt)) -> evaluate guard -> QI autoscale (if eligible) -> publish commands -> recompute guard for UI snapshot.

## Acceptance
- TS card: `TS_ratio >= 100` and `tsAutoscale.gating` not active/"shrinking".
- QI card: `marginRatioRaw <= 0.90`, `sumWindowDt in [0.98, 1.02]`, and if autoscale engaged, `qiAutoscale.appliedScale < 1`.

## If TS will not engage
- Clear `window_bad` by aligning measured vs commanded pulse (sectorPeriod/burst overrides can cause mismatch).
- Clear `timing_bad` by providing `tau_LC` and `tau_pulse`.

## If QI will not fall while servo says active
- Verify tile telemetry path is the source and fresh (tone/pulse command -> hardware -> controller -> `updatePipelineQiTiles` -> `tilesTelemetry.avgNeg`).
- Small manual reductions to `negativeFraction` or `localBurstFrac`/`dutyCycle` are safe adjuncts while autoscale runs.

## Quick probes

```
# Required QI scale
curl -s $API/api/helix/pipeline \
 | jq -r '.qiGuardrail.marginRatioRaw as $z | "s_QI_target=\($z|tonumber|if .>0 then 0.9/. else 1 end)"'

# Servo glance
curl -s $API/api/helix/pipeline \
 | jq '{TS:.ts.TS_ratio, tauLC_ns:(.lightCrossing.tauLC_ms*1e6),
        tauPulse_ns:.lightCrossing.burst_ns,
        QI_raw:.qiGuardrail.marginRatioRaw,
        sumWindowDt:.qiGuardrail.sumWindowDt,
        tsAS:.tsAutoscale, qiAS:.qiAutoscale, rhoSource:.qiGuardrail.rhoSource}'
```
