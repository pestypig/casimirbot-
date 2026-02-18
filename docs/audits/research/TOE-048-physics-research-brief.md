# TOE-048 Physics Research Brief

## Ticket
- ID: `TOE-048-halobank-horizons-physics-research-bridge`
- Risk class: `physics_unknown`
- Primitive: Halobank and Horizons physics research bridge

## Claim Being Evaluated
When orbital alignment is requested, Halobank reduced-order tidal/gravity outputs can be compared against Horizons-informed ephemeris context using bounded residual interpretation. The runtime must conservatively degrade claim posture when evidence required to interpret residuals is incomplete.

## Assumptions and Bounds
1. Halobank remains a reduced-order diagnostic model and is not a certified relativistic or geodesy solver.
2. Residual interpretation is bounded to coarse diagnostic envelopes only:
   - `|residual_ppm| <= 5` is treated as within bridge envelope (diagnostic consistency).
   - `|residual_ppm| > 5` is treated as out-of-envelope for consistency claims.
3. Any missing residual value, missing sample-count metadata, or missing evidence reference is interpreted as incomplete evidence.
4. Fallback ephemeris class (`fallback`) cannot support certifying claims.

## Falsifiable Acceptance Criteria
1. If source is `live`, residual is present and within envelope, and evidence completeness checks pass, the gate can return `PASS`.
2. If source is `live` but residual evidence is incomplete, gate must return deterministic `FAIL` and keep claim tier diagnostic.
3. If source is `live` and residual exceeds envelope, gate must return deterministic `FAIL`.
4. If source is `fallback`, gate must return deterministic `FAIL` with diagnostic/non-certifying provenance.

## Source Mapping
- Residual bridge + deterministic downgrade logic:
  - `server/services/halobank/time-model.ts`
- Input contract surfaced through skill schema:
  - `server/skills/halobank.time.compute.ts`
- Horizons provenance semantics used by bridge interpretation:
  - `server/utils/horizons-proxy.ts`
- Tests:
  - `tests/halobank-time-model.spec.ts`
  - `tests/halobank-horizons-consistency.spec.ts`
  - `tests/horizons-proxy.spec.ts`
- Gate ID:
  - `halobank.horizons.consistency.v1`

## Tier Recommendation
- Recommended tier for this bridge: `diagnostic`
- Rationale: residual policy is bounded and conservative but does not establish certified physical validity.
