# TOE-059 Tier Promotion Rationale: Warp Viability Reduced-Order Verification Pack

Ticket: `TOE-059-warp-viability-reduced-order-verification-pack`.
Owner: `warp-mechanics`.

## Scope

This rationale defines deterministic promotion criteria for warp viability claim tiering in reduced-order workflows and the conservative fallback required when strict inputs are incomplete.

## Deterministic promotion criteria

A warp mechanics claim is promoted to `certified` only when all of the following are true:

1. Provenance is measured for the aggregate warp mechanics channel.
2. Strict congruence mode is enabled.
3. HARD constraints pass.
4. Overall viability status is `ADMISSIBLE`.
5. Strict signal set is complete:
   - theta is metric-derived,
   - TS is metric-derived,
   - QI source is metric-derived,
   - metric contract is OK.

If measured provenance exists but any strict criterion above is missing, claim tier must remain `reduced-order`.

If measured provenance is not available, claim tier must remain `diagnostic`.

## Conservative fallback policy

Fallback is conservative by construction:

- Missing strict-mode inputs cannot silently pass promotion.
- Missing contract metadata prevents certification.
- Promotion decision includes a deterministic reason code for auditability:
  - `insufficient_provenance`
  - `strict_mode_disabled`
  - `hard_constraint_failed`
  - `status_non_admissible`
  - `strict_signal_missing`
  - `eligible`

## Maturity alignment

This is a reduced-order promotion pack. The policy avoids over-claiming certified status from incomplete evidence and keeps lower tiers explicit until strict evidence is present.
