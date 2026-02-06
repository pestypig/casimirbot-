---
id: ui-components-tree
label: UI Components Tree
aliases: ["UI Components Tree", "ui-components-tree", "ui components tree"]
topicTags: ["ui", "frontend", "client"]
mustIncludeFiles: ["docs/knowledge/ui-components-tree.json"]
---

# UI Components Tree

Source tree: docs/knowledge/ui-components-tree.json

## Definition: UI Components Tree
This tree maps the client UI surfaces that render physics backends and verification outputs. Minimal artifact: UI surface map with panel registry.

## Nodes

### Node: UI Components Tree
- id: ui-components-tree
- type: concept
- summary: This tree maps the client UI surfaces that render physics backends and verification outputs. Minimal artifact: UI surface map with panel registry.

### Node: App Shell
- id: ui-app-shell
- type: concept
- summary: Application shell and bootstrap (client/src/App.tsx, client/src/main.tsx, client/src/index.css). Minimal artifact: app shell layout map.

### Node: Page Surfaces
- id: ui-page-surfaces
- type: concept
- summary: Page-level surfaces anchor panel composition (client/src/pages/*). Minimal artifact: page routing map.

### Node: Helix Core
- id: ui-page-helix-core
- type: concept
- summary: Helix core shell and panel mounting (client/src/pages/helix-core.tsx, client/src/pages/helix-core.panels.ts, client/src/pages/helix-observables.tsx, client/src/pages/helix-noise-gens.tsx). Minimal artifact: Helix core panel map.

### Node: Desktop Surface
- id: ui-page-desktop
- type: concept
- summary: Desktop surface and panel stack (client/src/pages/desktop.tsx). Minimal artifact: desktop layout map.

### Node: Simulation Surface
- id: ui-page-simulation
- type: concept
- summary: Simulation page surface (client/src/pages/simulation.tsx). Minimal artifact: simulation page layout.

### Node: Star Surfaces
- id: ui-page-star
- type: concept
- summary: Star watcher and hydrostatic pages (client/src/pages/star-watcher-panel.tsx, client/src/pages/star-hydrostatic-panel.tsx). Minimal artifact: star page layout map.

### Node: Ideology Surfaces
- id: ui-page-ideology
- type: concept
- summary: Ideology and rationale surfaces (client/src/pages/ideology-render.tsx, client/src/pages/why.tsx). Minimal artifact: ideology page map.

### Node: AGI Admin Surfaces
- id: ui-page-agi
- type: concept
- summary: AGI surfaces (client/src/pages/agi-refinery.tsx, client/src/pages/code-admin.tsx, client/src/pages/rag-admin.tsx). Minimal artifact: AGI surface map.

### Node: Documentation Surfaces
- id: ui-page-docs
- type: concept
- summary: Documentation and ingest pages (client/src/pages/documentation.tsx, client/src/pages/ingest.tsx). Minimal artifact: docs surface list.

### Node: Start Surfaces
- id: ui-page-start
- type: concept
- summary: Start and home pages (client/src/pages/start.tsx, client/src/pages/home.tsx, client/src/pages/station.tsx). Minimal artifact: start surface map.

### Node: Panel Registry
- id: ui-panel-registry
- type: concept
- summary: Panel registry and desktop mounting (client/src/pages/helix-core.panels.ts, client/src/pages/desktop.tsx, client/src/components/desktop/*). Minimal artifact: panel registry listing.

### Node: Helix Panel Registry
- id: ui-panel-registry-helix
- type: concept
- summary: Helix panel registration (client/src/pages/helix-core.panels.ts). Minimal artifact: helix panel list.

### Node: Desktop Panel Registry
- id: ui-panel-registry-desktop
- type: concept
- summary: Desktop layout management (client/src/components/desktop/*, client/src/pages/desktop.tsx). Minimal artifact: desktop panel layout.

### Node: Physics Core Panels
- id: ui-panel-physics-core
- type: concept
- summary: Core physics panels and dashboards (client/src/components/*Panel.tsx). Minimal artifact: physics panel map.

### Node: Drive Guard Panels
- id: ui-panel-drive-guards
- type: concept
- summary: Drive guard panels (client/src/components/DriveGuardsPanel.tsx, client/src/components/SpeedCapabilityPanel.tsx). Minimal artifact: drive guard summary.

### Node: Parameter Sweep Panels
- id: ui-panel-parameter-sweep
- type: concept
- summary: Parameter sweep panels (client/src/components/ParametricSweepPanel.tsx, client/src/components/parameter-panel.tsx, client/src/components/dynamic-controls.tsx). Minimal artifact: sweep control layout.

### Node: Energy Flux Panels
- id: ui-panel-energy-flux
- type: concept
- summary: Energy flux and pipeline views (client/src/components/EnergyFluxPanel.tsx, client/src/components/energy-pipeline.tsx, client/src/components/live-energy-pipeline.tsx). Minimal artifact: energy flux layout.

### Node: Observables Panels
- id: ui-panel-observables
- type: concept
- summary: Observables panels (client/src/components/ObservablesPanel.tsx, client/src/components/PhysicsFieldSampler.tsx). Minimal artifact: observables layout.

### Node: QI Control Panels
- id: ui-panel-qi-controls
- type: concept
- summary: QI control panels (client/src/components/QiAutoTunerPanel.tsx, client/src/components/QiWidget.tsx, client/src/components/QiGuardBadge.tsx, client/src/components/QiTileGuardBands.tsx, client/src/components/QiLatticePanel.tsx). Minimal artifa…

### Node: Metrics Dashboards
- id: ui-panel-metrics-dashboard
- type: concept
- summary: Metrics dashboards (client/src/components/metrics-dashboard.tsx, client/src/components/NearZeroWidget.tsx, client/src/components/FuelGauge.tsx). Minimal artifact: metrics dashboard layout.

### Node: Warp Drive Panels
- id: ui-panel-warp-drive
- type: concept
- summary: Warp drive panels for bubble geometry and verification (client/src/components/*Warp*.tsx). Minimal artifact: warp panel map.

### Node: Alcubierre Panels
- id: ui-panel-alcubierre
- type: concept
- summary: Alcubierre and warp engine panels (client/src/components/AlcubierrePanel.tsx, client/src/components/WarpEngineContainer.tsx). Minimal artifact: Alcubierre panel layout.

### Node: Warp Bubble Panels
- id: ui-panel-warp-bubble
- type: concept
- summary: Warp bubble panels (client/src/components/WarpBubbleGLPanel.tsx, client/src/components/WarpBubbleLivePanel.tsx, client/src/components/WarpRenderInspector.tsx). Minimal artifact: warp bubble view map.

### Node: Warp Proof Panels
- id: ui-panel-warp-proof
- type: concept
- summary: Warp proof panels (client/src/components/WarpProofPanel.tsx, client/src/components/WarpExperimentLadderPanel.tsx). Minimal artifact: warp proof summary.

### Node: Warp Ledger Panel
- id: ui-panel-warp-ledger
- type: concept
- summary: Warp ledger panel (client/src/components/WarpLedgerPanel.tsx). Minimal artifact: warp ledger layout.

### Node: Shift Vector Panel
- id: ui-panel-shift-vector
- type: concept
- summary: Shift vector panel (client/src/components/ShiftVectorPanel.tsx). Minimal artifact: shift vector layout.

### Node: Casimir and Energy Panels
- id: ui-panel-casimir-energy
- type: concept
- summary: Casimir and energy panels (client/src/components/*Casimir*.tsx, client/src/components/*Cavity*.tsx). Minimal artifact: casimir panel map.

### Node: Casimir Tile Grid
- id: ui-panel-casimir-grid
- type: concept
- summary: Casimir tile grid panel (client/src/components/CasimirTileGridPanel.tsx). Minimal artifact: tile grid layout.

### Node: Cavity Mechanism Panels
- id: ui-panel-cavity-mechanism
- type: concept
- summary: Cavity mechanism panels (client/src/components/CavityMechanismPanel.tsx, client/src/components/CavityCrossSectionSplit.tsx, client/src/components/CavityFrameView.tsx, client/src/components/CavitySideView.tsx). Minimal artifact: cavity layou…

### Node: Energy Pipeline Panels
- id: ui-panel-energy-pipeline
- type: concept
- summary: Energy pipeline panels (client/src/components/energy-pipeline.tsx, client/src/components/live-energy-pipeline.tsx). Minimal artifact: pipeline panel layout.

### Node: Casimir Amplifier Panels
- id: ui-panel-casimir-amplifier
- type: concept
- summary: Amplifier panels (client/src/components/HelixCasimirAmplifier.tsx, client/src/components/AmplificationPanel.tsx, client/src/components/MetricAmplificationPocket.tsx). Minimal artifact: amplifier panel summary.

### Node: Pipeline Proof Panels
- id: ui-panel-pipeline-proof
- type: concept
- summary: Pipeline proof panels (client/src/components/PipelineProofPanel.tsx, client/src/components/MassProvenancePanel.tsx, client/src/components/CardProofOverlay.tsx). Minimal artifact: proof overlay layout.

### Node: Vacuum Gap Panels
- id: ui-panel-vacuum
- type: concept
- summary: Vacuum panels (client/src/components/VacuumGapHeatmap.tsx, client/src/components/VacuumGapSweepHUD.tsx, client/src/components/VacuumContractBadge.tsx). Minimal artifact: vacuum gap UI.

### Node: Curvature and GR Panels
- id: ui-panel-curvature-gr
- type: concept
- summary: Curvature and GR panels (client/src/components/*Curvature*.tsx, client/src/components/*GrAgentLoop*.tsx). Minimal artifact: curvature panel map.

### Node: Curvature Ledger Panels
- id: ui-panel-curvature-ledger
- type: concept
- summary: Curvature ledger panels (client/src/components/CurvatureLedgerPanel.tsx, client/src/components/CurvatureTensorPanel.tsx, client/src/components/CurvaturePhysicsPanel.tsx). Minimal artifact: curvature ledger layout.

### Node: Curvature Slice Panels
- id: ui-panel-curvature-slices
- type: concept
- summary: Curvature slice panels (client/src/components/CurvatureSlicePanel.tsx, client/src/components/SliceViewer.tsx). Minimal artifact: curvature slice layout.

### Node: GR Agent Loop Panels
- id: ui-panel-gr-agent-loop
- type: concept
- summary: GR agent loop panels (client/src/components/GrAgentLoopAuditPanel.tsx, client/src/components/GrAgentLoopKpiPanel.tsx, client/src/components/GrAgentLoopLearningPanel.tsx). Minimal artifact: GR agent loop summary.

### Node: Time Dilation Panels
- id: ui-panel-time-dilation
- type: concept
- summary: Time dilation panels (client/src/components/TimeDilationLatticePanel.tsx, client/src/components/LightSpeedStrobeScale.tsx). Minimal artifact: time dilation layout.

### Node: Proof and Verification Panels
- id: ui-panel-proof-verification
- type: concept
- summary: Verification panels and audits (client/src/components/MathMaturityTreePanel.tsx, client/src/components/UniversalAuditTreePanel.tsx). Minimal artifact: verification panel map.

### Node: Math Maturity Panels
- id: ui-panel-math-maturity
- type: concept
- summary: Math maturity panels (client/src/components/MathMaturityTreePanel.tsx). Minimal artifact: math maturity tree.

### Node: Universal Audit Panels
- id: ui-panel-universal-audit
- type: concept
- summary: Audit tree panels (client/src/components/UniversalAuditTreePanel.tsx, client/src/components/CoreKnowledgePanel.tsx, client/src/components/AgiKnowledgePanel.tsx). Minimal artifact: audit tree layout.

### Node: Verification Tab Panels
- id: ui-panel-verification-tab
- type: concept
- summary: Verification tab and proof charts (client/src/components/verification-tab.tsx, client/src/components/visual-proof-charts.tsx, client/src/components/FrontProofsLedger.tsx). Minimal artifact: verification tab layout.

### Node: Knowledge and Ideology Panels
- id: ui-panel-knowledge-ideology
- type: concept
- summary: Knowledge and ideology panels (client/src/components/IdeologyPanel.tsx, client/src/components/MissionEthosSourcePanel.tsx, client/src/components/DocViewerPanel.tsx). Minimal artifact: ideology panel map.

### Node: Ideology Panels
- id: ui-panel-ideology
- type: concept
- summary: Ideology panels (client/src/components/IdeologyPanel.tsx, client/src/components/MissionEthosSourcePanel.tsx). Minimal artifact: ideology panel layout.

### Node: Knowledge Docs Panels
- id: ui-panel-knowledge-docs
- type: concept
- summary: Knowledge doc panels (client/src/components/DocViewerPanel.tsx, client/src/components/DefinitionChip.tsx). Minimal artifact: doc viewer layout.

### Node: Halobank Panels
- id: ui-panel-halobank
- type: concept
- summary: Halobank panels (client/src/components/HalobankPanel.tsx, client/src/components/SporeTimeline.tsx). Minimal artifact: halobank panel layout.

### Node: Stellar and Solar Panels
- id: ui-panel-stellar-solar
- type: concept
- summary: Stellar panels (client/src/components/SolarGlobePanel.tsx, client/src/components/SolarDiskCanvas.tsx, client/src/components/SolarMap.tsx, client/src/components/StellarLsrPanel.tsx). Minimal artifact: stellar panel map.

### Node: Solar Globe Panels
- id: ui-panel-solar-globe
- type: concept
- summary: Solar panels (client/src/components/SolarGlobePanel.tsx, client/src/components/SolarDiskCanvas.tsx, client/src/components/SolarNavViewer.tsx, client/src/components/SolarMap.tsx). Minimal artifact: solar globe layout.

### Node: Stellar LSR Panels
- id: ui-panel-stellar-lsr
- type: concept
- summary: Stellar LSR panel (client/src/components/StellarLsrPanel.tsx). Minimal artifact: LSR panel layout.

### Node: Deep Mixing Panels
- id: ui-panel-deep-mixing
- type: concept
- summary: Deep mixing panels (client/src/components/DeepMixingSolarView.tsx). Minimal artifact: deep mixing layout.

### Node: Tokamak Simulation Panel
- id: ui-panel-tokamak
- type: concept
- summary: Tokamak simulation panel (client/src/components/TokamakSimulationPanel.tsx). Minimal artifact: tokamak panel layout.

### Node: Lattice and Hull Panels
- id: ui-panel-lattice-time-dilation
- type: concept
- summary: Lattice and hull panels (client/src/components/Hull3DRenderer.ts, client/src/components/HullMetricsVisPanel.tsx, client/src/components/Needle*.tsx). Minimal artifact: lattice and hull panel map.

### Node: Hull 3D Panels
- id: ui-panel-hull3d
- type: concept
- summary: Hull 3D panels (client/src/components/Hull3DRenderer.ts, client/src/components/HullMetricsVisPanel.tsx, client/src/components/HelixHullCardsPanel.tsx). Minimal artifact: hull 3D layout.

### Node: Lattice Panels
- id: ui-panel-lattice
- type: concept
- summary: Lattice panels (client/src/components/QiLatticePanel.tsx, client/src/components/SliceViewer.tsx, client/src/components/VolumeModeToggle.tsx). Minimal artifact: lattice panel layout.

### Node: Needle Panels
- id: ui-panel-needle
- type: concept
- summary: Needle panels (client/src/components/NeedleCavityBubblePanel.tsx, client/src/components/NeedleIpeakWorksheetPanel.tsx, client/src/components/NeedleWorldRoadmap.tsx, client/src/components/PhoenixNeedlePanel.tsx). Minimal artifact: needle pan…

### Node: Noise and Essence Panels
- id: ui-panel-noise-essence
- type: concept
- summary: Noise and essence panels (client/src/components/noise-gen/*, client/src/components/noise-gens/*, client/src/components/LumaPanel.tsx, client/src/components/essence/DresscodePanel.tsx). Minimal artifact: noise/essence panel map.

### Node: Noise Gen Panels
- id: ui-panel-noise-gen
- type: concept
- summary: Noise gen panels (client/src/components/noise-gen/ProjectAlbumPanel.tsx, client/src/components/noise-gen/StemDaw.tsx). Minimal artifact: noise gen layout.

### Node: Noise Gens Panels
- id: ui-panel-noise-gens
- type: concept
- summary: Noise gens panels (client/src/components/noise-gens/CoverCreator.tsx, client/src/components/noise-gens/OriginalsPlayer.tsx, client/src/components/noise-gens/NoiseFieldPanel.tsx). Minimal artifact: noise gens layout.

### Node: Luma Panels
- id: ui-panel-luma
- type: concept
- summary: Luma panels (client/src/components/LumaPanel.tsx, client/src/components/LumaWhisper.tsx, client/src/components/LumaWhisperBubble.tsx, client/src/components/BackgroundLuma.tsx). Minimal artifact: luma panel layout.

### Node: Essence Panels
- id: ui-panel-essence
- type: concept
- summary: Essence panels (client/src/components/essence/DresscodePanel.tsx). Minimal artifact: essence panel layout.

### Node: 3D Renderers
- id: ui-renderers-3d
- type: concept
- summary: 3D renderers include hull, warp bubble, and galaxy views. Minimal artifact: renderer map.

### Node: Hull 3D Renderer
- id: ui-renderer-hull3d
- type: concept
- summary: Hull 3D renderer (client/src/components/Hull3DRenderer.ts, client/src/components/Surface/*). Minimal artifact: hull renderer summary.

### Node: Warp Bubble Renderer
- id: ui-renderer-warp-bubble
- type: concept
- summary: Warp bubble GL renderer (client/src/components/WarpBubbleGLPanel.tsx, client/src/components/WebGLDiagnostics.tsx). Minimal artifact: warp GL renderer summary.

### Node: Galaxy Renderers
- id: ui-renderer-galaxy
- type: concept
- summary: Galaxy renderers (client/src/components/GalaxyMapPanZoom.tsx, client/src/components/GalaxyDeepZoom.tsx). Minimal artifact: galaxy renderer map.

### Node: HUD and Overlays
- id: ui-hud-overlays
- type: concept
- summary: HUD overlays include collapse benchmarks and sector HUDs (client/src/components/CollapseBenchmarkHUD.tsx, client/src/components/SectorRolesHud.tsx, client/src/components/NavPoseHUD.tsx). Minimal artifact: HUD overlay map.

### Node: Collapse Benchmark HUD
- id: ui-hud-collapse
- type: concept
- summary: Collapse benchmark HUD (client/src/components/CollapseBenchmarkHUD.tsx, client/src/components/CollapseBenchmarkHUDPanel.tsx). Minimal artifact: collapse HUD layout.

### Node: Sector HUD
- id: ui-hud-sector
- type: concept
- summary: Sector HUDs (client/src/components/SectorGridRing.tsx, client/src/components/SectorRolesHud.tsx, client/src/components/SectorLegend.tsx). Minimal artifact: sector HUD layout.

### Node: Navigation HUD
- id: ui-hud-nav
- type: concept
- summary: Navigation HUD (client/src/components/NavPoseHUD.tsx). Minimal artifact: nav HUD layout.

### Node: Hooks and State
- id: ui-hooks-state
- type: concept
- summary: Hooks, stores, and lib adapters connect physics backends to UI (client/src/hooks/*, client/src/store/*, client/src/lib/*). Minimal artifact: data flow map from hooks to panels.

### Node: Physics Hooks
- id: ui-hooks-physics
- type: concept
- summary: Physics hooks (client/src/hooks/use-energy-pipeline.ts, client/src/hooks/useGrBrick.ts, client/src/hooks/useStressEnergyBrick.ts). Minimal artifact: physics hook list.

### Node: Client Stores
- id: ui-stores
- type: concept
- summary: Client stores (client/src/store/useDesktopStore.ts, client/src/store/useFlightDirectorStore.ts, client/src/store/useAgiChatStore.ts). Minimal artifact: store map.

### Node: UI Lib Adapters
- id: ui-lib-adapters
- type: concept
- summary: Client lib adapters (client/src/lib/simulation-api.ts, client/src/lib/warp-pipeline-adapter.ts, client/src/lib/curvature-brick.ts). Minimal artifact: adapter map.

### Node: UI Primitives
- id: ui-primitives
- type: concept
- summary: UI primitives (client/src/components/ui/*). Minimal artifact: primitive component list.

### Node: Shadcn UI
- id: ui-primitives-shadcn
- type: concept
- summary: Reusable components (client/src/components/ui/*). Minimal artifact: primitive inventory.

### Node: Mobile Start
- id: ui-mobile-start
- type: concept
- summary: Mobile start surface (client/src/pages/mobile-start.tsx, client/src/components/mobile/*). Minimal artifact: mobile start layout.

### Node: Legacy Warp Web
- id: ui-legacy-warp-web
- type: concept
- summary: Legacy warp web surfaces (warp-web/*.html, warp-web/js/*, warp-web/css/*). Minimal artifact: warp web page list.

### Node: Visualization Utilities
- id: ui-visualization-utils
- type: concept
- summary: Visualization helpers (client/src/components/chart-visualization.tsx, client/src/components/mesh-visualization.tsx, client/src/components/phase-diagram.tsx, client/src/components/dynamic-visualization.tsx). Minimal artifact: visualization h…

### Node: Chart Utilities
- id: ui-vis-charts
- type: concept
- summary: Chart helpers (client/src/components/chart-visualization.tsx, client/src/components/visual-proof-charts.tsx). Minimal artifact: chart helper map.

### Node: Mesh Visualization
- id: ui-vis-mesh
- type: concept
- summary: Mesh visualization (client/src/components/mesh-visualization.tsx, client/src/components/ShellOutlineVisualizer.tsx). Minimal artifact: mesh visualization summary.

### Node: Phase Diagram
- id: ui-vis-phase-diagram
- type: concept
- summary: Phase diagram panels (client/src/components/phase-diagram.tsx, client/src/components/phase-diagram-validator.tsx). Minimal artifact: phase diagram layout.

### Node: UI Backend Bindings
- id: ui-backend-binding
- type: concept
- summary: UI backend binding tree (docs/knowledge/ui-backend-binding-tree.json). Minimal artifact: backend-to-UI binding summary.

### Node: UI Backend Bindings <-> Physics Core Panels Bridge
- id: bridge-ui-backend-binding-ui-panel-physics-core
- type: bridge
- summary: Cross-reference between UI Backend Bindings and Physics Core Panels within this tree. Minimal artifact: left/right evidence anchors.

## Bridges

### Bridge: UI Backend Bindings <-> Physics Core Panels
- relation: Cross-reference between UI Backend Bindings and Physics Core Panels.
- summary: Cross-reference between UI Backend Bindings and Physics Core Panels within this tree. Minimal artifact: left/right evidence anchors.
