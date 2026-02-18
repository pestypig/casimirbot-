# TOE-070 Tier Promotion Rationale: Halobank Horizons Long-Window Calibration Pack

## 1) Claim under evaluation

Ticket: `TOE-070-halobank-horizons-long-window-calibration-pack`.

Hardening target: require explicit long-window residual calibration evidence for any live Horizons reduced-order recommendation while preserving deterministic downgrade behavior for short-window, incomplete, fallback, and out-of-envelope scenarios.

## 2) Assumptions and bounds

- Scope is restricted to:
  - `server/services/halobank/time-model.ts`
  - `server/skills/halobank.time.compute.ts`
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
  - `tests/horizons-proxy.spec.ts`
- Residual envelope remains fixed at `|residualPpm| <= 5`.
- Sample count must remain integer and in `[3, 10000]`.
- Long-window calibration horizon must be explicit and bounded:
  - `residualWindowHours >= 24`
  - `residualWindowHours <= 8760`.
- Canonical evidence reference format remains:
  - `artifact:<provider>:<run-or-trace-ref>`.

## 3) Falsifiable acceptance criteria

1. Complete canonical live evidence with long-window calibration and bounded residual returns PASS.
   - `consistency.verdict=PASS`
   - `consistency.firstFailId=null`
   - `residualWindowStatus=long_window`
   - `claim_tier_recommendation=reduced-order`
2. Live evidence with sub-threshold residual window deterministically fails first on long-window policy.
   - `consistency.firstFailId=HALOBANK_HORIZONS_LONG_WINDOW_REQUIRED`
   - `residualWindowStatus=short_window`
3. Missing or otherwise incomplete evidence remains deterministic conservative downgrade.
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`
4. Out-of-envelope residual with complete long-window evidence remains deterministic downgrade.
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`
5. Fallback source remains diagnostic and non-certifying.
   - `consistency.firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`

## 4) Source mapping (source → code path → test path → gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Long-window residual calibration policy | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts`, `tests/halobank-horizons-consistency.spec.ts` | Ticket-required tests + Casimir verify |
| Skill contract exposure of residualWindowHours | `server/skills/halobank.time.compute.ts` | `tests/halobank-time-model.spec.ts` | Ticket-required tests + Casimir verify |
| Upstream Horizons live/fallback provenance semantics | `server/utils/horizons-proxy.ts` | `tests/horizons-proxy.spec.ts` | Ticket-required tests + Casimir verify |

## 5) Tier recommendation

- Global claim tier remains `diagnostic`.
- Per-run reduced-order recommendation is eligible only under complete, canonical, long-window, bounded live evidence.
- Any threshold miss deterministically downgrades recommendation to `diagnostic`.
- Certified claims remain out of scope.
