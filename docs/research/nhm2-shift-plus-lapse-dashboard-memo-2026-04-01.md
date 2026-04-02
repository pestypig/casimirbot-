# NHM2 Shift-Plus-Lapse Dashboard Memo

This is a human-facing dashboard card family built directly from the provenance-aware shift-plus-lapse dashboard JSON artifact.

It does not supersede proof artifacts:

- Lane A remains authoritative and unchanged.
- warp.metric.T00.nhm2.shift_lapse remains reference_only.
- Cabin gravity and wall safety stay separate diagnostic families.
- Raw brick vs analytic companion provenance remains visible on-card.
- The source/mechanism exemption route is active only for bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims.
- Formula equivalence, viability promotion, authority expansion, and cross-lane expansion remain blocked.
- No field render, transport context, or volumetric imagery is introduced in this patch.

## Why The Monolithic Card Was Replaced

- the previous single card forced metric values, badge strips, and notes into one overcrowded surface
- horizontal overlap and vertical clipping made the output unsuitable for serious review
- replacing it with a planned card family preserves all provenance without hiding information to make the layout fit

## How Layout Budgeting Now Works

- text width is measured with @napi-rs/canvas before drawing
- long values, notes, and badge runs wrap to measured column widths
- row height is computed from wrapped content rather than assumed fixed
- each subject area now gets a dedicated card with its own vertical budget

## Why Subject Separation Improves Scientific Readability

- proof hierarchy is visible in a compact card rather than buried below metric clutter
- cabin gravity rows keep analytic-companion provenance explicit without sharing space with wall-safety rows
- wall safety remains readable as a brick-derived horizon proxy rather than a comfort score
- precision/provenance caveats are explained in their own card without compressing the source story
- downstream consumer surfaces now carry the same bounded source/mechanism claim boundary rather than leaving it implicit in a separate contract artifact
- the consumer-conformance artifact now checks proof-pack JSON/markdown, dashboard JSON/markdown, and current-build rendered card sources for explicit Lane A authority and reference_only preservation
- remaining limitation: Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts.

- dashboardCardFamilyStatus: generated
- layoutPlanningStatus: measured_dynamic_multicard_layout
- proofHierarchyStatus: lane_a_authoritative_and_visible
- provenanceBadgeStatus: visible_on_card_family
- consumerConformanceStatus: conformant
- consumerConformanceDataMode: artifact_coupled
- consumerConformanceStalenessRisk: possible_latest_artifact_drift
- recommendedNextAction: Future work is now either parity-route architecture or additional consumer/readiness hardening; do not widen the bounded advisory claim set without an explicit contract change.

- dashboardStatus: available
- proofPanelStatus: available
- cabinGravityPanelStatus: available
- wallSafetyPanelStatus: available
- precisionPanelStatus: available
