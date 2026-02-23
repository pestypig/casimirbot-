# Warp Readiness Credibility Hardening (2026-02-23)

## What changed
- Fixed strict Natário contract validation so Natário chart contract metadata is authoritative when available, with fallback to adapter chart metadata only when Natário metadata is absent.
- Activated Public vs Academic audience mode directly in the live energy pipeline UI with default `Public`.
- Added regression tests for Natário strict metadata sourcing and audience-mode label switching.

## What objections are now test-encoded
- **Strict contract path objection:** Natário metric provenance is accepted when Natário chart contract metadata is complete even if adapter chart metadata is missing.
- **UI audience objection:** Public mode keeps boundary-safe phrasing while Academic mode exposes full provenance labels.
- Existing claim-boundary and provenance safeguards remain covered by current warp viability and audience formatting test suites.

## Claims boundary reminder
This material reports diagnostic/reduced-order readiness signals and governance guardrails. It does not claim warp propulsion feasibility or near-term deployment.
