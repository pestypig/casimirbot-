# TOE-049 Comparative Evidence Pack

## Ticket
- **ID:** TOE-049-warp-viability-tier-promotion-pack
- **Lane:** research (`tier_promotion`)

## Comparison design
We compare baseline (non-promoted / insufficient evidence) versus promoted (strict measured evidence) behavior across deterministic constraints and certificate outputs.

## Evidence matrix

| Scenario | Input evidence posture | Expected tier outcome | Deterministic acceptance threshold |
|---|---|---|---|
| Baseline A: strict mode with proxy/fallback Ford–Roman source | Legacy boolean / fallback source (non-metric) | `diagnostic` | Strict congruence blocks proxy fallback (`proxy_fallback_blocked`) |
| Baseline B: missing derivative support for VdB evidence | Region-II/IV derivative support absent | No promotion | `VdB_band` fails with missing derivative evidence |
| Promoted C: measured metric source + strict mode + passing constraints | Metric-derived Qi/TS evidence and contract-OK path | `certified` (for eligible constraints and snapshot tier) | measured provenance + strict mode + pass status |
| Conservatism D: certificate authenticity not trust-complete | Missing signer key or trust mismatch under enforced profile | Not certifying authenticity | verification `authenticity.ok=false` with deterministic reason codes |

## Test-backed observations

1. **Promotion path present and bounded**
   - Warp viability tests assert certified tier when strict/measured conditions are met.

2. **Fallback blocking is deterministic**
   - Strict mode blocks legacy Ford–Roman fallback and records deterministic notes/details.

3. **Evidence insufficiency yields downgrade**
   - Missing metric derivative support in VdB pathways prevents passing evidence in viability constraints.

4. **Certificate path remains conservative**
   - Certificate integrity/authenticity verification does not auto-upgrade claims and requires explicit trust posture.

## Deterministic thresholds used for acceptance

- **Ford–Roman/QI:** `marginRatio < 1` and strict-mode source/contract acceptance.
- **TS stability:** `TS_ratio >= 100` (with explicit idle-jitter exception window).
- **Tier certification:** strict mode + measured provenance + pass.
- **Certificate authenticity:** signer key-id present and trusted when enforcement profile is active.

## Baseline vs promoted conclusion
The promoted tier path is available only under strict, measured, contract-valid evidence. Baseline fallback paths are intentionally non-promoting and retain diagnostic/reduced-order posture, satisfying conservative safety policy for tier-promotion research.
