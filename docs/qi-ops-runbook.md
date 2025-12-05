# QI ops runbook (read-only)

Minimal on-call checklist for guardrail telemetry; no code changes implied.

## Snapshot inputs (what to read)
- GET `/api/helix/pipeline` and inspect `qiGuardrail.{marginRatioRaw, marginRatio, lhs_Jm3, bound_Jm3, sumWindowDt, sampler, window_ms, rhoSource, duty, patternDuty}`.
- Avoid dev fallbacks: in dev, start the client with `HELIX_DEV_MOCKS=false` (PowerShell: `$env:HELIX_DEV_MOCKS="false"; npm run dev`) so real pipeline errors surface instead of the mock snapshot.
- Make sure the client is pointed at the real API origin (set `VITE_API_BASE`/equivalent) so `/api/helix/pipeline` isn't intercepted by mocks.
- Normalization check: expect `sum(g*dt) ~ 1` (0.98-1.02); if outside, treat the snapshot as untrustworthy until the window is normalized.
- Relief target: compute `s = 0.90 * |bound| / |lhs|`; on the `tile-telemetry` path, reduce the source feeding `effectiveRho` by roughly `s`.
- Green-zone heads-up: surface when `d_eff <= 3e-5`, `Q_L` in `[5e8, 1e9]`, `zeta <= 1`, `gamma_VdB` in `[1e5, 1e6]`, and `TS >> 1` (cite the guard/badge docs when presenting).
- Badge status prefers `marginRatioRaw` (raw) over clamped `marginRatio`; keep both when reporting.

## EffectiveRho precedence (badge/log legend)

| order | source | badge/log tells |
| --- | --- | --- |
| 1 | tile telemetry (`rhoSource=tile-telemetry`) | Weighted mean of `rho_neg_Jm3` (no extra duty scaling on this branch). |
| 2 | gate pulses (`rhoSource=gate-pulses`) | Sum of pulse `rho` (uses tones if present). |
| 3 | pump tones (`rhoSource=pump-tones`) | `rho0 + sum(depth*cos(2*pi*f*t+phi))` from the last pump command. |
| 4 | duty fallback (`rhoSource=duty-fallback`) | If duty is valid and no live sources remain, `effectiveRho = -|dutyEffectiveFR|`; if duty is invalid or <= 0, `effectiveRho = 0`. |

**Duty freshness + fallback math**
- Measured duty is trusted only inside `freshness = max(2*windowMs, 2500 ms, STROBE_DUTY_STALE_MS=20000)`. Older samples are ignored and the schedule takes over.
- Fallback duty: `d_eff = dutyLocal * (S_live / max(1, S_total))`, zeroed in standby; it is published as `dutyEffectiveFR` (and aliases `dutyEffectiveFRMeasured`/`dutyEffectiveFRSource` for provenance).
- When telemetry/pulses/tones are absent and `d_eff > 0`, the guard surfaces the fallback by setting `rhoSource=duty-fallback` and `effectiveRho ~= -|d_eff|` (badge/title will show the zero/ -|duty| cascade).
- Parity pointers: duty fallback shape in `client/e2e/fixtures/qi-guard.fallback.json`; badge expectations in `client/e2e/qi-guard-badge.spec.ts`.

## Short path (telemetry -> badge)
- Pull `/api/helix/pipeline`; confirm `sumWindowDt` in 0.98-1.02 and note `rhoSource`.
- Check duty freshness vs `freshness` gate; expect `rhoSource=duty-fallback` when measured duty is stale or other sources are missing.
- If `marginRatioRaw >= 0.95`, pick a lever below to drop `|lhs|` until `marginRatioRaw < 0.95`.
- Re-fetch; badge tone should follow `marginRatioRaw` (red >=1, amber >=0.95, green otherwise) even when `marginRatio` is clamped.

## Levers -> expected effect (linear scaling)

| lever | quick mental math |
| --- | --- |
| Halve tile rho (telemetry) | `effectiveRho` -> ~0.5x, so `|lhs|` -> ~0.5x. |
| Drop `dutyEffectiveFR` 0.4 -> 0.2 | `effectiveRho` on fallback path -> ~0.5x -> `|lhs|` ~0.5x. |
| Tone depth 0.8 -> 0.4 (pump path) | `rhoFromTones` -> ~0.5x -> `|lhs|` ~0.5x. |

## Guard log crib (field -> meaning)
- `lhs_Jm3`: window-normalized integral of `rhoOn` (tracks `effectiveRho` when duty/mask are consistent).
- `bound_Jm3`: Ford-Roman floor (already clamped negative); `marginRatioRaw = |lhs|/|bound|`.
- `rhoSource`: which row from the precedence table won; `effectiveRho` is the value used.
- `sumWindowDt`: should sit at ~1.000; warn if outside 0.98-1.02.
- `duty`, `patternDuty`, `dutyEffectiveFR{,Measured,Source}`: measured vs scheduled duty inputs for the fallback math.

## Snapshot + shell parity helpers
- Live curl/jq check (matches badge fields):  
`curl -s "$API_BASE/api/helix/pipeline" | jq '{zeta_raw: .qiGuardrail.marginRatioRaw, zeta: .qiGuardrail.marginRatio, lhs_Jm3: .qiGuardrail.lhs_Jm3, bound_Jm3: .qiGuardrail.bound_Jm3, rhoSource: .qiGuardrail.rhoSource, effectiveRho: .qiGuardrail.effectiveRho, duty: .qiGuardrail.duty, patternDuty: .qiGuardrail.patternDuty, sumWindowDt: .qiGuardrail.sumWindowDt}'`
- Fixtures <-> behavior: `client/e2e/fixtures/qi-guard.red.json` (raw zeta > 1, clamped to 1), `qi-guard.fallback.json` (duty fallback, normalized window), `qi-guard.dt-drift.json` (sum dt warning); exercised in `client/e2e/qi-guard-badge.spec.ts`.
- Update line anchors if they drift: `rg "estimateEffectiveRhoFromState" server/energy-pipeline.ts` -> copy new spans.

## Common failure signatures
- Stale duty: `rhoSource=duty-fallback`, `effectiveRho ~= 0`, and `dutyEffectiveFRSource=schedule` despite hardware reporting; check freshness gate and lastSampleAt.
- Window drift: `sumWindowDt` outside 0.98-1.02 with badge chip showing sum g*dt; rerun with normalized window before trusting margins.
- Tones skipped: `rhoSource=pump-tones` but `effectiveRho` ~= `rho0` and tones missing in note/hash; confirm pump command stream.

## QI autothrottle quickstart (opt-in)
- Enable in dev/stage: `QI_AUTOTHROTTLE_ENABLE=true QI_AUTOTHROTTLE_TARGET=0.90 QI_AUTOTHROTTLE_HYST=0.05 QI_AUTOTHROTTLE_MIN=0.02 QI_AUTOTHROTTLE_ALPHA=0.25 QI_AUTOTHROTTLE_COOLDOWN_MS=1000 npm run dev:server`.
- First-action log for current red snapshot (ζ_raw≈29.05): `[QI-autothrottle] { scale: ~0.032, reason: 'zetaRaw=29.050 -> target=0.9, ...' }`.
- API payload: `/api/helix/pipeline` includes `qiAutothrottle {enabled, scale, target, hysteresis, reason}`; badge still keys on `qiGuardrail.marginRatioRaw` (raw ζ).
- Validation: `HELIX_DEBUG=pipeline npm run physics:validate -- --params '{}'` should show `marginRatioRaw` decaying toward 0.90 over a few guard cycles; guard math/bounds stay unchanged.
- Acceptance checks: keep `sumWindowDt≈1`, `TS≫1`, `d_eff≤3e-5`, `Q_L∈[5e8,1e9]`; autothrottle only scales pump tone depths and gate pulse amplitudes before publish.
