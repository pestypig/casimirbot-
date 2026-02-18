# TOE-054 Tier Promotion Rationale: Warp Viability Cross-Check Pack

## 1) Claim under evaluation

Ticket: `TOE-054-warp-viability-cross-check-tier-pack`.

Promotion target: permit warp-viability outputs to move from diagnostic/reduced-order posture toward **certified-eligible** narration only when cross-check evidence, certificate material, and verification integrity all pass deterministic thresholds.

## 2) Assumptions and bounds

- Scope is constrained to the ticket allowlist:
  - `tools/warpViability.ts`
  - `tools/warpViabilityCertificate.ts`
  - `tools/verifyCertificate.ts`
  - required parity tests in `tests/warp-viability.spec.ts`, `tests/warp-metric-adapter.spec.ts`, and `tests/proof-pack-strict-parity.spec.ts`.
- Promotion never bypasses HARD viability constraints (`FordRomanQI`, `ThetaAudit`) or admissibility policy.
- Strict-mode provenance and metric-contract checks are treated as promotion prerequisites, not optional diagnostics.
- Certificate re-verification is required to avoid trust escalation from unsigned/insufficiently trusted artifacts.

## 3) Falsifiable acceptance criteria

A promotion candidate is rejected unless all criteria pass:

1. **Viability cross-check parity:** strict parity tests must show deterministic agreement between viability outputs and proof-pack strict surfaces.
2. **Metric-adapter contract posture:** metric-derived evidence must satisfy strict-source expectations (no proxy fallback accepted as certified-grade evidence).
3. **Certificate integrity posture:** certificate verify flow reports integrity/authenticity OK under the active trust profile for certified-eligible claims.
4. **Conservative fallback preserved:** when promotion evidence is insufficient, claim tier is downgraded (`diagnostic` or `reduced-order`) rather than over-claimed.

## 4) Source mapping (source -> code path -> test path -> gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Viability hard/soft constraint and admissibility posture | `tools/warpViability.ts` | `tests/warp-viability.spec.ts` | Required tests + Casimir verify |
| Metric adapter strict evidence congruence | `tools/warpViability.ts` (adapter integration surfaces) | `tests/warp-metric-adapter.spec.ts` | Required tests + Casimir verify |
| Strict proof-pack parity for promoted narrative surfaces | proof-pack integration surfaces (strict parity contract) | `tests/proof-pack-strict-parity.spec.ts` | Required tests + Casimir verify |
| Certificate emission and verification integrity | `tools/warpViabilityCertificate.ts`, `tools/verifyCertificate.ts` | `tests/warp-viability.spec.ts` and strict parity checks | Casimir verify + parity checks |

## 5) Tier recommendation

- **Global recommendation now:** `reduced-order` default with conditional certified eligibility.
- **Certified-eligible only when:** strict evidence path passes, parity is deterministic, and certificate integrity/authenticity remain OK.
- **Fallback requirement:** any missing/contradictory cross-check evidence forces conservative downgrade and blocks certifying narration.

This is a tier-promotion rationale artifact, not a claim of physical realization beyond modeled assumptions and current test/gate coverage.
