# NHM2 Shift-Plus-Lapse Dashboard Memo

This is a human-facing dashboard surface built directly from the provenance-aware shift-plus-lapse dashboard JSON artifact.

It does not supersede proof artifacts:

- Lane A remains authoritative and unchanged.
- warp.metric.T00.nhm2.shift_lapse is a candidate authoritative solve family in provenance/model-selection while proof-bearing bounded transport admission remains separately controlled by the authoritative shift-lapse transport-promotion gate.
- Cabin gravity and wall safety stay separate diagnostic families.
- Raw brick vs analytic companion provenance remains visible on-card and on-graph.
- The source/mechanism exemption route is active only for bounded non-authoritative source annotation, mechanism context, and reduced-order comparison claims.
- Formula equivalence, viability promotion, authority expansion, and cross-lane expansion remain blocked.
- No transport context, field-illusion heatmap, or volumetric imagery is introduced in this patch.

## Why Profile Graphs Were Chosen

- the mild branch already has a real local cabin-gravity signal and a correspondingly tiny local clock gradient, but those quantities were still only visible as table rows
- the mild reference under-resolves in float32 raw channels, so a pseudo-precise field map would overstate what the brick actually resolves
- provenance-aware line graphs are the honest first render because they show the quantity, the tiny scale, and the raw-brick versus analytic-companion split without pretending to be a resolved 2D slice

## What The Graphs Communicate

- `cabin_gravity_profile_z` shows how local cabin gravity is represented along the cabin z_zenith axis and makes the mild branch's nonzero local profile legible against the unit-lapse zero baseline
- cabin gravity graph provenance: baseline=brick_float32_direct | generalized=analytic_lapse_summary_companion
- `clock_gradient_profile_z` shows the local cabin timing differential relative to the centerline and keeps the tiny scale explicit in s/day
- clock gradient graph provenance: baseline=brick_float32_direct | generalized=analytic_lapse_summary_companion
- the clock graph explicitly states that it is local cabin timing only and not route-time compression

## What Remains Deferred

- no graph in this patch is a proof surface
- no graph in this patch is a raw 2D field map
- no transport-context or mechanism overlay is added
- any future higher-resolution field-map presentation still needs a separate provenance and resolution argument before it should be shown
- the consumer-conformance artifact now checks proof-pack JSON/markdown, dashboard JSON/markdown, rendered cards, and rendered graphs for explicit Lane A authority plus the candidate-family versus fail-closed transport split
- remaining limitation: Consumer-conformance is artifact-coupled: proof-pack surfaces are read from latest aliases, and the dashboard current-build outputs embed source/mechanism policy state sourced from latest artifacts.

- dashboardCardFamilyStatus: generated
- graphRenderStatus: generated
- cabinGravityGraphStatus: generated
- clockGradientGraphStatus: generated
- layoutPlanningStatus: measured_dynamic_multicard_layout
- proofHierarchyStatus: lane_a_authoritative_and_visible
- provenanceBadgeStatus: visible_on_card_and_graph_family
- consumerConformanceStatus: conformant
- consumerConformanceDataMode: artifact_coupled
- consumerConformanceStalenessRisk: possible_latest_artifact_drift
- recommendedNextAction: If a future patch attempts any field-map presentation for the mild branch, require explicit resolution/provenance justification first; otherwise keep extending only profile-level presentation surfaces.

- dashboardStatus: available
- proofPanelStatus: available
- cabinGravityPanelStatus: available
- wallSafetyPanelStatus: available
- precisionPanelStatus: available
