# Paper Authoring Contract (Claim Tiers + Bounds)

“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Scope
This contract defines mandatory structure for any deep-research paper generated from the current repo snapshot.

Primary snapshot:
- `artifacts/research/full-solve/warp-evidence-snapshot-2026-03-02.json`

Default proof index anchor:
- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json`
- `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md`

## Claim Tiers (must not be collapsed)

1. `canonical-authoritative`
- Authority: canonical policy/report artifacts.
- Allowed: campaign decision labels, gate scoreboard, first-fail statements, policy constraints.
- Disallowed: inferring physical feasibility from candidate-only evidence.

2. `promoted-candidate`
- Authority: promoted profile + calculator + promotion-check artifacts.
- Allowed: candidate-level margin/applicability evidence and promotion readiness/stability status.
- Disallowed: overriding canonical decision when readiness/stability are false.

3. `exploratory`
- Authority: sensitivity, parity, literature overlays, hypotheticals.
- Allowed: hypotheses, recovery paths, experiment proposals.
- Disallowed: adjudicating final campaign state.

## Materials-Bounds Section (required, explicit constraints)
Paper must include a table with numeric fields (no narrative-only claims):

| Subsystem | Constraint | Value | Measured/Derived | Margin | Evidence Path | Status |
|---|---|---:|---:|---:|---|---|
| Casimir gap control | `gap_nm` bounds | ... | ... | ... | artifact + test | ... |
| QI sampling | `tau_s_ms`, kernel normalization | ... | ... | ... | calculator + guard diagnostics | ... |
| RF/Q cavity | `qCavity`, modulation freq | ... | ... | ... | config + telemetry | ... |
| Thermal | max dissipation / cooling | ... | ... | ... | thermal model artifact | ... |
| Structural | hoop/strain/stress limits | ... | ... | ... | structural model artifact | ... |
| Control timing | `TS_ratio`, jitter bound | ... | ... | ... | timing telemetry | ... |

Rules:
- Every row must include a source artifact path and commit hash.
- If a value is unavailable, mark `UNKNOWN` explicitly.
- No substitution of narrative assumptions for missing numeric bounds.

## Falsifiers (required)
Paper must include falsifier matrix with deterministic fail conditions:
- operator mapping falsifier (semantic bridge broken)
- sampling/normalization falsifier (K/tau mismatch)
- applicability falsifier (curvature/timing domain not satisfied)
- uncertainty falsifier (decision band crosses threshold)
- reproducibility falsifier (artifact or provenance mismatch)

## Non-Goals (required)
Paper must explicitly state:
- no physical-feasibility claim unless strong-claim closure criteria are met
- no canonical override from promoted/exploratory lanes
- no threshold/policy weakening to force pass narratives

## Boundary Statement (must be verbatim)
“This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.”

## Paper Reference Requirement
Generated Needle Hull Mark 2 paper outputs must:
1. cite `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.json` or `docs/audits/research/warp-needle-hull-mark2-proof-anchor-index-latest.md` as the top-level proof map;
2. cite claim-specific artifact paths from that index for each normative claim;
3. mark claims `UNKNOWN` when indexed artifacts are missing or non-admissible.
