# TOE-049 Tier Promotion Rationale

## Ticket
- **ID:** TOE-049-warp-viability-tier-promotion-pack
- **Lane:** research (`tier_promotion`)
- **Primitive:** Warp viability tier-promotion primitive
- **Scope:** `tools/warpViability.ts`, certificate verification surfaces, and strict parity tests.

## Objective
Define how warp viability outputs may be promoted from diagnostic/reduced-order confidence into certified claim-tier assertions while preserving conservative behavior when evidence is incomplete.

## Tier promotion contract

Promotion is governed by deterministic falsification checks already implemented in warp viability evaluation:

1. **HARD constraints must pass**
   - `FordRomanQI` and `ThetaAudit` are hard-gated.
   - Any hard failure blocks admissibility and therefore blocks promotion.

2. **Strict provenance enforcement for promotion-sensitive checks**
   - In strict mode, constraints using `enforceProvenanceInStrict=true` require measured-class provenance.
   - Missing or proxy/inferred provenance produces deterministic note codes (`strict_provenance_missing` or `strict_provenance_non_measured`) and prevents promotion.

3. **Claim-tier assignment is explicit and conservative**
   - `determineClaimTier` returns `certified` only when provenance is measured, strict mode is enabled, and the constraint passes.
   - Otherwise the mapping downgrades to `reduced-order` (measured, non-strict) or `diagnostic` (inferred/proxy).

4. **Metric-contract checks prevent false promotion**
   - Ford–Roman/QI in strict mode requires metric-derived source and contract-valid evidence (`contractPass`).
   - Legacy boolean fallback is explicitly blocked in strict mode and marked with `proxy_fallback_blocked` semantics.

5. **Certificate channel preserves conservative posture**
   - Certificate payload carries computed claim tier, but recheck and integrity validation avoid implicit trust escalation.
   - Verification failure or missing signer/trust metadata leaves authenticity non-OK (when enforced), preventing downstream over-claiming.

## Falsification map for promoted claims

| Promoted claim | Required evidence | Deterministic falsification trigger | Resulting behavior |
|---|---|---|---|
| “Qi/negative-energy viability is certified” | `marginRatio < 1`, strict mode on, metric source and metric contract OK | `marginRatio >= 1`, curvature gate fail, non-metric/proxy source, or contract missing | `FordRomanQI` fails or downgrades; claim tier falls to diagnostic/reduced-order |
| “TS stability evidence supports certified status” | `TS_ratio >= 100` (or idle jitter allowance), metric-derived TS source in strict mode | TS below threshold without accepted idle buffer, or non-metric source in strict mode | `TS_ratio_min` fails/downgrades and cannot sustain certified posture |
| “Constraint set is certifiable end-to-end” | Hard constraints pass + strict provenance + no deterministic fail note | Any hard constraint fail or strict provenance violation | Overall viability not admissible/certified; conservative fallback retained |

## Acceptance thresholds (tier-promotion lane)

- **Tier promotion threshold:** `claim_tier=certified` only under strict mode with measured provenance and passing checks.
- **Downgrade threshold:** any missing measured evidence or contract parity inconsistency forces `diagnostic` or `reduced-order`.
- **Certificate safety threshold:** missing/invalid authenticity inputs cannot be treated as certifying evidence.

## Maturity statement
This rationale remains at **reduced-order/diagnostic maturity** for policy claims: promotion logic is deterministic and test-backed, but should not be interpreted as experimental proof of physical realizability beyond configured model assumptions.
