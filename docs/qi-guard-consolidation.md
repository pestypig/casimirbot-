# QI-guard consolidation (read-only, no patches)

Single-source map of how QI-guard picks effectiveRho, integrates it, clamps against the Ford-Roman bound, and reports status (log/API/badge). Descriptive only; no code changes implied.

## 1) Parity map (server -> API -> hook -> badge)

- `lhs_Jm3` integration: `dt_s = pattern.dt_s`; `sumWindowDt = sum(window[i] * dt_s)`; `rhoOn = duty > 0 ? effectiveRho/duty : effectiveRho`; `rho = pattern.mask[i] ? rhoOn * pattern.mask[i] : 0`; accumulate `lhs += rho * pattern.window[i] * dt_s` (`server/energy-pipeline.ts:3823-3830`).
- `bound_Jm3` and margins: `candidateBound = boundResult.bound_Jm3 - Math.abs(boundResult.safetySigma_Jm3)`, floored by `-fallbackAbs = -max(|DEFAULT_QI_BOUND_SCALAR|, |QI_BOUND_FLOOR_ABS env|, policyFloorAbs, 1e-12)` where `policyFloorAbs = QI_POLICY_ENFORCE ? |lhs|/QI_POLICY_MAX_ZETA : 0`, then `clampNegativeBound` enforces negativity; `rawRatio = Math.abs(lhs) / Math.abs(bound_Jm3)`; `marginRatio = QI_POLICY_ENFORCE ? Math.min(rawRatio, QI_POLICY_MAX_ZETA) : rawRatio` (`server/energy-pipeline.ts:3684-3692,3850-3863`).
- State attachment and log: `state.zeta = marginRatio`, `(state as any).zetaRaw = marginRatioRaw`, `(state as any).qiGuardrail = qiGuard`; `guardLog` captures margin/marginRaw, `lhs_Jm3`, `bound_Jm3`, sampler/window, duty/patternDuty/maskSum, `effectiveRho`, `rhoOn`, `rhoOnDuty`, `rhoSource`, `sumWindowDt`; `[QI-guard] warn` prints it only when `zetaForStatus >= 1` or non-finite (`server/energy-pipeline.ts:2578-2614`).
- API exposure: `/api/helix/pipeline` responds with the pipeline state plus stamped seq/ts, `dutyEffectiveFR` (alias), `sectorCount`, etc.; guard fields are untouched (`server/helix-core.ts:1755-1783`).
- Hook fetch and select: `use-energy-pipeline` GETs `/api/helix/pipeline`, returns `response.json()`, and the selector only clamps `gamma` while passing `qiGuardrail` through unchanged (`client/src/hooks/use-energy-pipeline.ts:900-989`).
- Badge readout: `QiGuardBadge` computes `zetaForStatus = (guardZetaRaw ?? pipelineZetaRaw ?? guardZeta ?? pipelineZeta)`; status tone keys off that raw-first value, while the label always renders both `zeta_raw` and clamped `zeta` (`client/src/components/QiGuardBadge.tsx:53-115`).

## 2) Guard math (units)

- Window normalization: `dt_s = max(sectorPeriod_ms, 1e-3) / cycleSamples / 1000` baked onto each pattern; `buildWindow` fills the kernel, then divides by `norm = accum * dt_s || 1` so `sum(g_i * dt_s) = 1` (window units 1/s) (`server/energy-pipeline.ts:3646-3678`; `server/qi/qi-saturation.ts:3-49`).
- Integral: with normalized window and `rhoOn = duty > 0 ? effectiveRho/duty : effectiveRho`, `lhs = sum(mask * window * dt_s * rhoOn)` and `sumWindowDt` is reported alongside; constant rho keeps `lhs` aligned with `effectiveRho` while duty-weighted masks map via `rhoOn` (`server/energy-pipeline.ts:3822-3830`).
- Bound: base `-K/tau^4` minus `safetySigma_Jm3`, floored by policy/fallback, then `clampNegativeBound` enforces negativity (`server/qi/qi-bounds.ts:152-181`; `server/energy-pipeline.ts:3684-3692,3850-3860`).
- Units: `rho/lhs/bound` in J/m^3; `dt_s` in seconds; window samples in 1/s after normalization; margin ratios (`rawRatio`, `marginRatio`) are unitless.
- Invariants (tests): full-mask constant-rho keeps `lhs_Jm3` pinned to `effectiveRho` (`tests/qi-guardrail.spec.ts:103-104`); ~0.5 duty mask uses `rhoOn = effectiveRho/patternDuty` yet integrates back to the same `effectiveRho` (`tests/qi-guardrail.spec.ts:133-135`).

## 3) Effective-rho lineage

- Precedence and debug tags: tile telemetry first (`debug.source = "tile-telemetry"`; returns `tilesTelemetry.avgNeg`), then gate pulses (`debug.source = "gate-pulses"`; sum `rhoFromPulse`), then pump tones (`debug.source = "pump-tones"`; `rhoFromTones`), else duty fallback (`debug.source = "duty-fallback"`; `-abs(effDuty)`) (`server/energy-pipeline.ts:3398-3459`).
- Tile averaging: weighted mean `acc += sample*w; weight += w; return acc/weight`; default weight 1; non-finite samples zeroed; empty set yields `null` (`server/qi/pipeline-qi-stream.ts:74-85`).
- Synthetic suppression: once real telemetry arrives, synthetic tile entries are dropped for `SYNTHETIC_SUPPRESS_MS` (`server/qi/pipeline-qi-stream.ts:44-53`).
- Pulse path: when pulses exist, `accum += rhoFromPulse(...)` across all; each pulse uses tones when present (`rhoFromTones`) else a finite `pulse.rho` (`server/energy-pipeline.ts:3414-3468`).
- Tone path: seeds `acc = rho0`, skips non-finite/zero `freq/depth`, then adds `depth * cos(2*pi*f*t + phase)` per tone (`server/energy-pipeline.ts:3471-3493`).
- Duty fallback specifics: measured duty is trusted only within a freshness gate `max(2500, windowMs*2, 20000)`; fallback `d_eff = dutyLocal * (S_live/max(1,S_total))` (zeroed in standby) feeds `effDuty`; when no live sources remain, `effectiveRho = -abs(effDuty)` else 0 if invalid (`server/energy-pipeline.ts:2051-2056,2088-2089,3444-3459`).
- Guard integration uses the chosen `effectiveRho` with only linear scaling (`rhoOn = effectiveRho/duty`, `lhs += rho*window*dt_s`), so scaling tile/pulse/tone amplitudes scales `lhs` proportionally (`server/energy-pipeline.ts:3822-3830`).

## 4) Badge status and sum(dt)

- Status expression: raw-first `zetaForStatus = (finite guardZetaRaw) ?? (finite pipelineZetaRaw) ?? (finite guardZeta) ?? (finite pipelineZeta)`; tone: red when >= 1, amber when >= 0.95, green otherwise; muted when non-finite (`client/src/components/QiGuardBadge.tsx:58-75`).
- Display: hover details print both `zeta_raw` (raw marginRatioRaw) and clamped `zeta` labels; status already came from the raw-first value (`client/src/components/QiGuardBadge.tsx:89-105`).
- Sum(dt) warning: `dtWarning = dtValue != null && (dtValue < 0.98 || dtValue > 1.02)` with label "Window not normalized (sum g*dt = ...)" (`client/src/components/QiGuardBadge.tsx:80-85`).

## 5) Tests and fixtures

- Guard invariants: full-mask constant-rho pins `lhs_Jm3` to `effectiveRho` (`tests/qi-guardrail.spec.ts:103-104`); ~0.5 duty mask asserts `patternDuty ~ 0.5`, `rhoOn = effectiveRho/patternDuty`, and `lhs_Jm3` still matches `effectiveRho` (`tests/qi-guardrail.spec.ts:133-135`).
- Hook contract: mocked `/api/helix/pipeline` yields `snapshot.qiGuardrail` identical to payload and zeta matching expectation (`client/src/hooks/__tests__/use-energy-pipeline.contract.spec.tsx:11-174`).
- Badge unit: red tone uses `marginRatioRaw` even when `marginRatio` is clamped; both labels must render; dt-warning chip when sum(dt) drifts (`client/src/components/__tests__/QiGuardBadge.spec.tsx:28-115`).
- Playwright: `/helix-core#drive-guards` uses fixtures (red/amber/green/fallback/dt-drift), blocks service workers, asserts tones and values (`client/e2e/qi-guard-badge.spec.ts:1-119`); fixtures live at `client/e2e/fixtures/qi-guard.*.json`.

## 6) Sample red path

- Raw vs clamped: `rawRatio = |lhs|/|bound|` -> 2.65; `marginRatio` clamps to policy limit 1.0 (`server/energy-pipeline.ts:3860-3863`; `client/e2e/fixtures/qi-guard.red.json:10-13`).
- Badge tone: because status prefers raw zeta, `2.65 >= 1` renders red even though the displayed zeta label is the clamped 1.00 (`client/src/components/QiGuardBadge.tsx:58-75`).

## 7) Quick runbook (read-only checks)

1. Light snapshot: `npm run physics:validate -- --params '{...}'` (prints TS, gamma, d_eff, T00, zeta).
2. With guard logs: `HELIX_DEBUG=pipeline npm run physics:validate -- --params '{...}'` to emit `[QI-guard]` fields (lhs, bound, margins, duty, mask, window, rho source); there is no `DEBUG_PIPE` knob in this path.
3. Programmatic: call `evaluateWarpViability({...})` from `cli/physics-validate.ts` or equivalent Node one-liner for status plus guard payload.
4. Investigate drift: if the badge warns on sum(dt), check `sumWindowDt` from the log; window normalization lives in `server/qi/qi-saturation.ts:3-49`.

Physics-first guidance: drop `effectiveRho` via duty/negative-fraction/sector concurrency, tile census/area, and gain ladders before touching policy (`QI_TAU_MS`, `QI_SAMPLER`, `QI_POLICY_MAX_ZETA`, `QI_BOUND_FLOOR_ABS`). Guardrail changes raise the limit; they do not reduce the numerator.

Guard discipline (do not move these):
- Do not loosen the bound: keep tau, kernel/sampler, and bound policy unchanged.
- Do not mask with clamping: the badge keys status off the raw margin (`marginRatioRaw`) by design.
- Do not "fix" sum(dt): it is already 1.000; normalization is correct.

Keeping these fixed keeps the remedy on the numerator (source amplitude) to stay in the green zone.

## 8) Autoscale knob (tile telemetry only, default-on)

- Defaults (code): `QI_AUTOSCALE_ENABLE=true`, `QI_AUTOSCALE_TARGET=0.90`, `QI_AUTOSCALE_MIN_SCALE=0.02`, `QI_AUTOSCALE_SLEW=0.25`, `QI_AUTOSCALE_NO_EFFECT_SEC=5` (halts publishes if ζ_raw fails to drop ≥20% after the window).
- Preconditions to engage: `rhoSource='tile-telemetry'`, window normalized (`|sumWindowDt-1| <= 0.05`), and `zetaRaw > target`. Otherwise it idles and slews back toward scale 1.0.
- Action (single path): `scale = target / zetaRaw`, clamped to `[MIN_SCALE, 1]`, then slew-limited per second. The multiplier is applied last to pump tone depths and stroke amplitude—exactly the path that produces tile telemetry—so ζ_raw tracks the reduced modulation.
- Telemetry: `/api/helix/pipeline.qiAutoscale` exposes `{enabled,target,zetaRaw,proposedScale,slewLimitedScale,appliedScale,gating,clamps}` (gating ∈ `disabled|idle|window_bad|source_mismatch|safe|active|no_effect`), and the Drive Guards panel shows a read-only autoscale badge plus the applied multiplier.
- Safety: no change to bound/guard math; autoscale only reduces the numerator (effectiveRho). If `appliedScale` ≪ 1 and ζ_raw stays high, the coupling path—not the guard—is at fault.
- Manual equivalent: `s = target / zetaRaw` (e.g., `0.90 / 29.05 ≈ 0.031`) is the modulation-depth multiplier needed to hit target when Σg·dt ≈ 1.

## 9) Audit: badge ↔ guard parity notes

- Chain confirmed unchanged: API spreads `state` (including `qiGuardrail`) verbatim and the hook returns the JSON untouched; `rg` shows `selectPipelineState` never references `qiGuardrail`, so mutation risk between server → hook is nil.
- Raw-first tone is active in real data: the live pipeline sample had `marginRatioRaw≈29.05`, `marginRatio=1`, so the badge goes red on the raw path while the label still shows `ζ=1.00`. That matches the raw-first `zetaForStatus` logic.
- Mismatch root cause in the audit: the `[QI-guard]` log from `HELIX_DEBUG=pipeline npm run physics:validate -- --params '{}'` showed duty-fallback values (`lhs≈-2.5e-5`, `marginRaw≈1.39e-6`, `rhoSource=duty-fallback`), but a subsequent `/api/helix/pipeline` fetch read an updated state sourced from tile telemetry (`lhs≈-523`, `marginRatioRaw≈29.05`, `rhoSource=tile-telemetry`). The fetch was not the same snapshot that produced the log.
- Parity check guidance: when comparing log ↔ API ↔ badge, sample the same snapshot. Either (a) fetch the API inside the same run/loop that emitted the `[QI-guard]` log, or (b) freeze inputs (disable live tiles/pulses) so sources cannot change between the log and the fetch. Otherwise `lhs`, `rhoOn`, and the ratios will legitimately diverge.

## 10) Which knob to turn (tile-telemetry path)

- When `rhoSource = "tile-telemetry"`, the guard takes `effectiveRho` straight from the weighted mean of per-tile `rho_neg_Jm3` (`Σw·ρ / Σw`) with no extra duty scaling on that branch; the guard then integrates it (`server/qi/pipeline-qi-stream.ts:74-85`; `server/energy-pipeline.ts:3398-3459`).
- The only linear lever on `zeta_raw` here is the magnitude of the telemetry fed into that average. Options:
  - **Reduce per-tile amplitude (preferred single knob):** lower the drive amplitude that produces each tile’s `rho_neg_Jm3` until the stream `avgNeg` sits at ~3% of current (equivalent to `QI_TILE_TELEMETRY_SCALE≈0.03` if you need an inline scaler). `effectiveRho` and `|lhs|` drop by the same factor.
  - **Reduce the number/weight of contributors:** disable a fraction of tiles or shrink their weights so the weighted mean is ~3% of current; this helps most when trimming the most negative contributors because the stream averages, not sums.
  - **Combined light touch:** smaller trims that multiply to ~0.03 (e.g., 0.55 × 0.55 × 0.10).
- Duty/patternDuty alone will not tame `zeta` on this path: with a normalized window and `rhoOn = effectiveRho/duty`, `lhs` stays ~`effectiveRho` unless the telemetry amplitude itself is reduced.
