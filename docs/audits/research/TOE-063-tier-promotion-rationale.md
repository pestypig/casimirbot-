# TOE-063 Tier Promotion Rationale: Halobank Residual Reduced-Order Hardening Pack

## 1) Claim under evaluation

Ticket: `TOE-063-halobank-residual-reduced-order-hardening-pack`.

Hardening target: tighten reduced-order recommendation eligibility so live ephemeris evidence must be canonical and bounded, while preserving deterministic conservative downgrade semantics for invalid references, incomplete evidence, out-of-envelope residuals, and fallback sources.

## 2) Assumptions and bounds

- Scope is restricted to:
  - `server/services/halobank/time-model.ts`
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
- Residual envelope remains fixed at `|residualPpm| <= 5`.
- Residual sample count must be an integer and remain in bounded operational range `[3, 10000]`.
- Canonical evidence references must match artifact notation:
  - `artifact:<provider>:<run-or-trace-ref>` (provider and trailing segments required).

## 3) Falsifiable acceptance criteria

1. Complete, canonical, bounded live evidence returns deterministic pass semantics.
   - `consistency.verdict=PASS`
   - `consistency.firstFailId=null`
   - `claim_tier_recommendation=reduced-order`
2. Non-canonical evidence references deterministically fail with strict first-fail precedence.
   - `consistency.firstFailId=HALOBANK_HORIZONS_EVIDENCE_REF_INVALID`
   - recommendation remains `diagnostic`
3. Non-integer or out-of-range sample counts fail as incomplete evidence.
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_EVIDENCE_INCOMPLETE`
4. Out-of-envelope residuals continue deterministic downgrade behavior.
   - `consistency.firstFailId=HALOBANK_HORIZONS_RESIDUAL_OUT_OF_ENVELOPE`
5. Fallback source remains deterministic diagnostic-only and non-certifying.
   - `consistency.firstFailId=HALOBANK_HORIZONS_FALLBACK_DIAGNOSTIC_ONLY`
   - `provenance.certifying=false`

## 4) Source mapping (source → code path → test path → gate)

| Source | Code path | Test path | Gate |
|---|---|---|---|
| Canonical artifact reference hardening | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts`, `tests/halobank-horizons-consistency.spec.ts` | Ticket-required tests + Casimir verify |
| Integer and bounded sample-count hardening | `server/services/halobank/time-model.ts` | `tests/halobank-time-model.spec.ts` | Ticket-required tests + Casimir verify |
| Conservative deterministic fail-id precedence | `server/services/halobank/time-model.ts` | `tests/halobank-horizons-consistency.spec.ts` | Ticket-required tests + Casimir verify |

## 5) Tier recommendation

- Global tier remains `diagnostic`.
- Per-run reduced-order recommendation is only eligible when evidence is live, complete, canonical, and residual-bounded.
- Any hardening gate miss deterministically downgrades recommendation to `diagnostic`.
- Certified claims remain out of scope.
