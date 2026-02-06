---
id: panel-registry-tree
label: Panel Registry Tree
aliases: ["Panel Registry Tree", "panel-registry-tree", "panel registry tree"]
topicTags: ["ui", "panels", "registry"]
mustIncludeFiles: ["docs/knowledge/panel-registry-tree.json"]
---

# Panel Registry Tree

Source tree: docs/knowledge/panel-registry-tree.json

## Definition: Panel Registry Tree
This tree enumerates Helix panels and their cross-concept joins to keep UI surfaces grounded in the DAG. Minimal artifact: panel registry map.

## Nodes

### Node: Panel Registry Tree
- id: panel-registry-tree
- type: concept
- summary: This tree enumerates Helix panels and their cross-concept joins to keep UI surfaces grounded in the DAG. Minimal artifact: panel registry map.

### Node: Viz Diagnostics HUD
- id: panel-viz-diagnostics
- type: concept
- summary: Panel viz-diagnostics loaded from helix-core panels registry. Component: client/src/components/warp/VizDiagnosticsPanel.tsx Endpoints: none Keywords: viz hud, diagnostics overlay, shader debug, fps meter, render stack

### Node: Energy Flux Stability
- id: panel-energy-flux
- type: concept
- summary: Panel energy-flux loaded from helix-core panels registry. Component: client/src/components/EnergyFluxPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: flux monitor, stability histogram, |T_ab|, phi_A, R = (phi_A)/(I3 + |T|)

### Node: Phoenix Averaging
- id: panel-helix-phoenix
- type: concept
- summary: Panel helix-phoenix loaded from helix-core panels registry. Component: client/src/components/PhoenixNeedlePanel.tsx Endpoints: none Keywords: phoenix averaging, needle hull, light-crossing, kappa_drive, casimir tile, hann window

### Node: Microscopy Mode
- id: panel-microscopy
- type: concept
- summary: Panel microscopy loaded from helix-core panels registry. Component: client/src/components/MicroscopyPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: microscopy mode, microprobe, phase contrast, nm scale, Coulomb sweep

### Node: Needle I_peak Worksheet
- id: panel-needle-ipeak-worksheet
- type: concept
- summary: Panel needle-ipeak-worksheet loaded from helix-core panels registry. Component: client/src/components/NeedleIpeakWorksheetPanel.tsx Endpoints: none Keywords: pulsed power, i_peak, worksheet, needle hull, blumlein, pfn

### Node: Needle World Roadmap
- id: panel-needle-world-roadmap
- type: concept
- summary: Panel needle-world-roadmap loaded from helix-core panels registry. Component: client/src/components/NeedleWorldRoadmap.tsx Endpoints: none Keywords: needle roadmap, partner map, timeline, capex, opex, world map

### Node: Electron Orbital Simulator
- id: panel-electron-orbital
- type: concept
- summary: Panel electron-orbital loaded from helix-core panels registry. Component: client/src/components/ElectronOrbitalPanel.tsx Endpoints: pipelineGet, helixSnapshot Keywords: orbital density, Bohr k/q/g, toroidal packets, Coulomb probe, iso-surfa…

### Node: Drive Guards
- id: panel-drive-guards
- type: concept
- summary: Panel drive-guards loaded from helix-core panels registry. Component: client/src/components/DriveGuardsPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: I3_geo, I3_VdB, Q_cavity, guard bands, sector strobing

### Node: Mass Provenance
- id: panel-mass-provenance
- type: concept
- summary: Panel mass-provenance loaded from helix-core panels registry. Component: client/src/components/MassProvenancePanel.tsx Endpoints: pipelineGet Keywords: mass provenance, mass source, dataset id, fit residuals, invariant mass, override warnin…

### Node: GR Agent Loop Audit
- id: panel-gr-agent-loop-audit
- type: concept
- summary: Panel gr-agent-loop-audit loaded from helix-core panels registry. Component: client/src/components/GrAgentLoopAuditPanel.tsx Endpoints: grAgentLoop Keywords: gr agent loop, residuals, gate audit, accepted config, warp constraints

### Node: GR Loop KPIs
- id: panel-gr-agent-loop-kpis
- type: concept
- summary: Panel gr-agent-loop-kpis loaded from helix-core panels registry. Component: client/src/components/GrAgentLoopKpiPanel.tsx Endpoints: grAgentLoopKpis Keywords: gr agent loop, kpi, success rate, time to green, constraint violations, perf tren…

### Node: GR Loop Learning
- id: panel-gr-agent-loop-learning
- type: concept
- summary: Panel gr-agent-loop-learning loaded from helix-core panels registry. Component: client/src/components/GrAgentLoopLearningPanel.tsx Endpoints: grAgentLoop Keywords: learning loop, patch ladder, failure backlog, run comparison, accepted confi…

### Node: Math Maturity Tree
- id: panel-math-maturity-tree
- type: concept
- summary: Panel math-maturity-tree loaded from helix-core panels registry. Component: client/src/components/MathMaturityTreePanel.tsx Endpoints: mathGraph Keywords: math maturity, math graph, stage ladder, unit coverage, repo audit

### Node: Universal Audit Tree
- id: panel-universal-audit-tree
- type: concept
- summary: Panel universal-audit-tree loaded from helix-core panels registry. Component: client/src/components/UniversalAuditTreePanel.tsx Endpoints: auditTree Keywords: audit tree, ideology tags, repo audit, integrity map, verification map

### Node: TSN Determinism
- id: panel-tsn-sim
- type: concept
- summary: Panel tsn-sim loaded from helix-core panels registry. Component: client/src/components/HelixTsnPanel.tsx Endpoints: POST /api/sim/tsn Keywords: tsn, gptp, qbv, deterministic, latency, clock, white rabbit

### Node: Warp Pulsed Power
- id: panel-pulsed-power-doc
- type: concept
- summary: Panel pulsed-power-doc loaded from helix-core panels registry. Component: client/src/components/PulsedPowerDocPanel.tsx Endpoints: none Keywords: warp, pulsed power, coil, pipeline, hardware

### Node: Bus Voltage Program
- id: panel-bus-voltage
- type: concept
- summary: Panel bus-voltage loaded from helix-core panels registry. Component: client/src/components/BusVoltagePanel.tsx Endpoints: pipelineGet Keywords: bus voltage, hv rail, power policy, amps, setpoint

### Node: KM-Scale Warp Ledger
- id: panel-warp-ledger
- type: concept
- summary: Panel warp-ledger loaded from helix-core panels registry. Component: client/src/components/WarpLedgerPanel.tsx Endpoints: GET /km-scale-warp-ledger Keywords: km-scale ledger, warp ledger, bubble log, warp km, ledger bands

### Node: Warp Experiment Ladder
- id: panel-experiment-ladder
- type: concept
- summary: Panel experiment-ladder loaded from helix-core panels registry. Component: client/src/components/WarpExperimentLadderPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: experiment ladder, casimir, phoenix, ford-roman, natario, sector g…

### Node: Spectrum Tuner
- id: panel-spectrum-tuner
- type: concept
- summary: Panel spectrum-tuner loaded from helix-core panels registry. Component: client/src/components/SpectrumTunerPanel.tsx Endpoints: helixSpectrumRead, helixSpectrumWrite, helixMode Keywords: spectrum tuner, FFT, frequency dial, harmonics sweep,…

### Node: Vacuum Gap Heatmap
- id: panel-vacuum-gap-heatmap
- type: concept
- summary: Panel vacuum-gap-heatmap loaded from helix-core panels registry. Component: client/src/components/VacuumGapHeatmap.tsx Endpoints: helixSweep Keywords: vacuum gap, Casimir gap, nm gap map, heatmap, gap stress

### Node: Hydrostatic Equilibrium (HR)
- id: panel-star-hydrostatic
- type: concept
- summary: Panel star-hydrostatic loaded from helix-core panels registry. Component: client/src/pages/star-hydrostatic-panel.tsx Endpoints: none Keywords: HR map, Gamow window, potato threshold, polytrope, stellar ledger

### Node: Star Watcher
- id: panel-star-watcher
- type: concept
- summary: Panel star-watcher loaded from helix-core panels registry. Component: client/src/pages/star-watcher-panel.tsx Endpoints: none Keywords: Solar feed, Coherence overlay, Motion metrics

### Node: Tokamak Simulation
- id: panel-tokamak-sim
- type: concept
- summary: Panel tokamak-sim loaded from helix-core panels registry. Component: client/src/components/TokamakSimulationPanel.tsx Endpoints: tokamakState, tokamakCommand Keywords: tokamak, sparc, plasma, coherence diagnostics, k-metrics, ridge tracking…

### Node: Vacuum Gap Sweep HUD
- id: panel-vacuum-gap-sweep
- type: concept
- summary: Panel vacuum-gap-sweep loaded from helix-core panels registry. Component: client/src/components/VacuumGapSweepHUD.tsx Endpoints: helixSweep Keywords: gap sweep, delta gap, scan HUD, nm sweep, sweep HUD

### Node: Cavity Mechanism
- id: panel-cavity-mechanism
- type: concept
- summary: Panel cavity-mechanism loaded from helix-core panels registry. Component: client/src/components/CavityMechanismPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: cavity frame, mechanism view, design layers, actuator layout, mechanism …

### Node: Fractional Coherence Rail
- id: panel-fractional-coherence-rail
- type: concept
- summary: Panel fractional-coherence-rail loaded from helix-core panels registry. Component: client/src/components/FractionalCoherenceRail.tsx Endpoints: pipelineGet Keywords: fractional coherence, xi rail, coherence rail, phase rail, coherence band

### Node: Fractional Coherence Grid
- id: panel-fractional-coherence-grid
- type: concept
- summary: Panel fractional-coherence-grid loaded from helix-core panels registry. Component: client/src/components/FractionalCoherenceGrid.tsx Endpoints: pipelineGet, helixMetrics Keywords: coherence grid, xi grid, fractional grid, phase lattice, coh…

### Node: Near-Zero Widget
- id: panel-near-zero
- type: concept
- summary: Panel near-zero loaded from helix-core panels registry. Component: client/src/components/NearZeroWidget.tsx Endpoints: pipelineGet, helixMode Keywords: near zero widget, delta H, null detection, near-zero pocket, anomaly finder

### Node: Direction Pad
- id: panel-direction-pad
- type: concept
- summary: Panel direction-pad loaded from helix-core panels registry. Component: client/src/components/DirectionPad.tsx Endpoints: none Keywords: direction pad, flight director, vector pad, nav pad, pose nudge

### Node: Solar Navigation
- id: panel-nav-system
- type: concept
- summary: Panel nav-system loaded from helix-core panels registry. Component: client/src/components/NavPageSection.tsx Endpoints: none Keywords: nav system, nav pose, waypoints, navigation hud, pose tracking

### Node: DeepMix Solar View
- id: panel-deepmix-solar
- type: concept
- summary: Panel deepmix-solar loaded from helix-core panels registry. Component: client/src/components/DeepMixingSolarView.tsx Endpoints: none Keywords: deep mix solar, mixing bands, sector solver, solar telemetry, mix heuristics

### Node: Solar Globe
- id: panel-solar-globe
- type: concept
- summary: Panel solar-globe loaded from helix-core panels registry. Component: client/src/components/SolarGlobePanel.tsx Endpoints: none Keywords: solar globe, synoptic globe, field lines, magnetogram, solar surface

### Node: DeepMix Sweet Spot
- id: panel-deepmix-sweetspot
- type: concept
- summary: Panel deepmix-sweetspot loaded from helix-core panels registry. Component: client/src/components/deepmix/DeepMixSweetSpot.tsx Endpoints: none Keywords: sweet spot, deep mix target, isoline, mix optimization, duty sweet spot

### Node: DeepMix Globe
- id: panel-deepmix-globe
- type: concept
- summary: Panel deepmix-globe loaded from helix-core panels registry. Component: client/src/components/deepmix/DeepMixGlobePanel.tsx Endpoints: none Keywords: deep mix globe, mix field, global mix, deep mixing globe

### Node: Alcubierre Viewer
- id: panel-alcubierre-viewer
- type: concept
- summary: Panel alcubierre-viewer loaded from helix-core panels registry. Component: client/src/components/AlcubierrePanel.tsx Endpoints: pipelineGet, helixMetrics, helixDisplacement Keywords: Alcubierre metric, warp bubble, metric tensor, warp visua…

### Node: Shell Outline Visualizer
- id: panel-shell-outline
- type: concept
- summary: Panel shell-outline loaded from helix-core panels registry. Component: client/src/components/ShellOutlineVisualizer.tsx Endpoints: pipelineGet Keywords: shell outline, hull trace, hull shell, outline view, needle shell

### Node: Silhouette Stretch
- id: panel-model-silhouette
- type: concept
- summary: Panel model-silhouette loaded from helix-core panels registry. Component: client/src/components/ModelSilhouettePanel.tsx Endpoints: none Keywords: glb, bbox, ellipsoid, scale, axes, grid

### Node: Hull Metrics Vis
- id: panel-hull-metrics-vis
- type: concept
- summary: Panel hull-metrics-vis loaded from helix-core panels registry. Component: client/src/components/HullMetricsVisPanel.tsx Endpoints: none Keywords: hull metrics, natario, alcubierre, glb preview, wireframe

### Node: Shift Vector Panel
- id: panel-shift-vector
- type: concept
- summary: Panel shift-vector loaded from helix-core panels registry. Component: client/src/components/ShiftVectorPanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: shift vector, beta^i, lapse shift, ADM shift, beta_i

### Node: Equatorial Curvature Slice
- id: panel-curvature-slice
- type: concept
- summary: Panel curvature-slice loaded from helix-core panels registry. Component: client/src/components/CurvatureSlicePanel.tsx Endpoints: pipelineGet, helixMetrics Keywords: curvature slice, R_ab, Ricci slice, scalar curvature, curvature cut

### Node: Time Dilation Lattice
- id: panel-time-dilation-lattice
- type: concept
- summary: Panel time-dilation-lattice loaded from helix-core panels registry. Component: client/src/components/TimeDilationLatticePanel.tsx Endpoints: pipelineGet Keywords: time dilation, spacetime lattice, clock rate, alpha, grid warp

### Node: Curvature Ledger
- id: panel-curvature-ledger
- type: concept
- summary: Panel curvature-ledger loaded from helix-core panels registry. Component: client/src/components/CurvatureLedgerPanel.tsx Endpoints: pipelineGet Keywords: curvature ledger, Weyl bands, tensor ledger, Riemann register, ledger trace

### Node: Operational Mode Switch
- id: panel-operational-mode
- type: concept
- summary: Panel operational-mode loaded from helix-core panels registry. Component: client/src/components/OperationalModePanel.tsx Endpoints: pipelineGet, helixMode Keywords: operational mode, station vs desktop, mode toggle, profile switch, mission …

### Node: Casimir Tile Grid
- id: panel-casimir-tile-grid
- type: concept
- summary: Panel casimir-tile-grid loaded from helix-core panels registry. Component: client/src/components/CasimirTileGridPanel.tsx Endpoints: pipelineGet, helixSnapshot Keywords: Casimir tile grid, tile spectrum, grid view, tile ledger, Casimir tile…

### Node: Light-Speed Strobe Scale
- id: panel-light-speed-strobe
- type: concept
- summary: Panel light-speed-strobe loaded from helix-core panels registry. Component: client/src/components/LightSpeedStrobeScale.tsx Endpoints: pipelineGet, helixMetrics Keywords: light speed strobe, c strobe, strobes, speed scale, strobe ladder

### Node: Speed Capability
- id: panel-speed-capability
- type: concept
- summary: Panel speed-capability loaded from helix-core panels registry. Component: client/src/components/SpeedCapabilityPanel.tsx Endpoints: pipelineGet Keywords: speed capability, beta, v/c, translation speed, power envelope, mode envelope

### Node: Helix Casimir Amplifier
- id: panel-helix-casimir-amplifier
- type: concept
- summary: Panel helix-casimir-amplifier loaded from helix-core panels registry. Component: client/src/components/HelixCasimirAmplifier.tsx Endpoints: pipelineGet, helixMetrics, helixDisplacement Keywords: Helix amplifier, Casimir amplifier, gain stac…

### Node: Resonance Scheduler
- id: panel-resonance-scheduler
- type: concept
- summary: Panel resonance-scheduler loaded from helix-core panels registry. Component: client/src/components/ResonanceSchedulerTile.tsx Endpoints: pipelineGet Keywords: resonance scheduler, duty planner, phase scheduler, auto duty, resonance bands

### Node: Trip Player
- id: panel-trip-player
- type: concept
- summary: Panel trip-player loaded from helix-core panels registry. Component: client/src/components/TripPlayer.tsx Endpoints: none Keywords: trip player, timeline playback, recording, session replay, trip log

### Node: Fuel Gauge
- id: panel-fuel-gauge
- type: concept
- summary: Panel fuel-gauge loaded from helix-core panels registry. Component: client/src/components/FuelGauge.tsx Endpoints: pipelineGet, helixMetrics Keywords: fuel gauge, drive budget, burn rate, energy reserve, fuel burn

### Node: Vacuum Contract
- id: panel-vacuum-contract
- type: concept
- summary: Panel vacuum-contract loaded from helix-core panels registry. Component: client/src/components/VacuumContractBadge.tsx Endpoints: pipelineGet Keywords: vacuum contract, negative energy covenant, contract badge, Casimir promise, vacuum pledg…

### Node: Metric Amplification Pocket
- id: panel-metric-pocket
- type: concept
- summary: Panel metric-pocket loaded from helix-core panels registry. Component: client/src/components/MetricAmplificationPocket.tsx Endpoints: pipelineGet, helixMetrics Keywords: metric pocket, amplification pocket, tensor pocket, metric gain, metri…

### Node: HaloBank Timeline
- id: panel-halobank
- type: concept
- summary: Panel halobank loaded from helix-core panels registry. Component: client/src/components/HalobankPanel.tsx Endpoints: GET /halobank Keywords: HaloBank, timeline, halo ledger, bank history, halo archive

### Node: Qi Widget
- id: panel-qi-widget
- type: concept
- summary: Panel qi-widget loaded from helix-core panels registry. Component: client/src/components/QiWidget.tsx Endpoints: pipelineGet Keywords: QI widget, quantum inequality, Ford-Roman, QI bounds, rho_min

### Node: QI Auto-Tuner
- id: panel-qi-auto-tuner
- type: concept
- summary: Panel qi-auto-tuner loaded from helix-core panels registry. Component: client/src/components/QiAutoTunerPanel.tsx Endpoints: pipelineGet, pipelineUpdate Keywords: QI auto tuner, phase auto, QI scheduler, auto duty, quantum inequality tuner

### Node: Sector Legend
- id: panel-sector-legend
- type: concept
- summary: Panel sector-legend loaded from helix-core panels registry. Component: client/src/components/SectorLegend.tsx Endpoints: none Keywords: sector legend, color legend, sector key, legend ring, sector palette

### Node: Sector Roles HUD
- id: panel-sector-roles
- type: concept
- summary: Panel sector-roles loaded from helix-core panels registry. Component: client/src/components/SectorRolesHud.tsx Endpoints: pipelineGet Keywords: sector roles, sector HUD, role badges, sector overlay, role legend

### Node: Sweep Replay Controls
- id: panel-sweep-replay
- type: concept
- summary: Panel sweep-replay loaded from helix-core panels registry. Component: client/src/components/SweepReplayControls.tsx Endpoints: helixSweep Keywords: sweep replay, sweep telemetry, recorded sweep, sweep log, sweep playback

### Node: Runtime Ops
- id: panel-hull-status
- type: concept
- summary: Panel hull-status loaded from helix-core panels registry. Component: client/src/components/hull/RuntimeOps.tsx Endpoints: none Keywords: runtime ops, plan b, runtime policy, endpoint guard, queue telemetry

### Node: Debate View
- id: panel-agi-debate-view
- type: concept
- summary: Panel agi-debate-view loaded from helix-core panels registry. Component: client/src/components/agi/DebateView.tsx Endpoints: none Keywords: AGI debate, debate SSE, argument stream, multi agent debate, debate dashboard

### Node: Essence Console
- id: panel-agi-essence-console
- type: concept
- summary: Panel agi-essence-console loaded from helix-core panels registry. Component: client/src/components/agi/essence.tsx Endpoints: POST /api/agi/plan, POST /api/agi/execute, GET /api/agi/tools/logs/stream Keywords: Essence console, AGI console, …

### Node: Star Coherence Governor
- id: panel-star-coherence
- type: concept
- summary: Panel star-coherence loaded from helix-core panels registry. Component: client/src/components/agi/StarCoherencePanel.tsx Endpoints: GET /api/agi/star/telemetry Keywords: star coherence, coherence governor, tool budget, collapse policy, tele…

### Node: Pipeline Proof
- id: panel-pipeline-proof
- type: concept
- summary: Panel pipeline-proof loaded from helix-core panels registry. Component: client/src/components/PipelineProofPanel.tsx Endpoints: GET /api/agi/pipeline/status, GET /api/agi/pipeline/last-plan-debug Keywords: warp, pipeline, grounding, proof, …

### Node: Collapse Watch
- id: panel-collapse-monitor
- type: concept
- summary: Panel collapse-monitor loaded from helix-core panels registry. Component: client/src/components/agi/CollapseWatcherPanel.tsx Endpoints: GET /api/agi/star/telemetry Keywords: collapse pressure, collapse watcher, coherence gate, debate collap…

### Node: Collapse Benchmark HUD
- id: panel-collapse-benchmark-hud
- type: concept
- summary: Panel collapse-benchmark-hud loaded from helix-core panels registry. Component: client/src/components/CollapseBenchmarkHUDPanel.tsx Endpoints: POST /api/benchmarks/collapse Keywords: collapse benchmark, tau, L_present, kappa, lattice hash, …

### Node: Task History
- id: panel-agi-task-history
- type: concept
- summary: Panel agi-task-history loaded from helix-core panels registry. Component: client/src/components/agi/TaskHistoryPanel.tsx Endpoints: none Keywords: task history, AGI trace, task log, history queue, trace timeline

### Node: Noise Gens
- id: panel-helix-noise-gens
- type: concept
- summary: Panel helix-noise-gens loaded from helix-core panels registry. Component: client/src/pages/helix-noise-gens.tsx Endpoints: GET /api/noise-gens/originals, GET /api/noise-gens/generations, GET /api/noise-gens/moods Keywords: noise gen, noiseg…

### Node: Constraint Pack Policies
- id: panel-constraint-pack-policy
- type: concept
- summary: Panel constraint-pack-policy loaded from helix-core panels registry. Component: client/src/components/agi/ConstraintPackPolicyPanel.tsx Endpoints: GET /api/agi/constraint-packs, GET /api/agi/constraint-packs/policies, POST /api/agi/constrai…

### Node: Contribution Workbench
- id: panel-agi-contribution-workbench
- type: concept
- summary: Panel agi-contribution-workbench loaded from helix-core panels registry. Component: client/src/components/agi/ContributionWorkbenchPanel.tsx Endpoints: GET /api/agi/contributions/drafts, POST /api/agi/contributions/ingest, POST /api/agi/con…

### Node: PNG Edge Cutter
- id: panel-remove-bg-edges
- type: concept
- summary: Panel remove-bg-edges loaded from helix-core panels registry. Component: client/src/components/RemoveBgEdgesPanel.tsx Endpoints: none Keywords: background removal, png alpha, canny, grabcut, opencv, mask

### Node: Dresscode Drafting
- id: panel-dresscode
- type: concept
- summary: Panel dresscode loaded from helix-core panels registry. Component: client/src/components/essence/DresscodePanel.tsx Endpoints: none Keywords: dresscode, pattern, draft, garment, svg, grid, clip mask

### Node: Stellar LSR Viewer
- id: panel-stellar-lsr
- type: concept
- summary: Panel stellar-lsr loaded from helix-core panels registry. Component: client/src/components/StellarLsrPanel.tsx Endpoints: GET /api/stellar/local-rest, GET /api/stellar/local-rest/stream Keywords: stars, lsr, local standard of rest, catalog,…

### Node: Essence Proposals
- id: panel-essence-proposals
- type: concept
- summary: Panel essence-proposals loaded from helix-core panels registry. Component: client/src/components/agi/EssenceProposalsPanel.tsx Endpoints: GET /api/proposals, POST /api/proposals/:id/action, GET /api/essence/events Keywords: essence proposal…

### Node: Viz Diagnostics HUD <-> panel-concept-viz-diagnostics
- id: bridge-panel-viz-diagnostics-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-viz-diagnostics via term "diagnostics overlay".

### Node: Viz Diagnostics HUD <-> panel-concept-hull-metrics-vis
- id: bridge-panel-viz-diagnostics-panel-concept-hull-metrics-vis
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-hull-metrics-vis via term "qSpoilingFactor".

### Node: Viz Diagnostics HUD <-> panel-concept-energy-flux
- id: bridge-panel-viz-diagnostics-panel-concept-energy-flux
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Node: Viz Diagnostics HUD <-> panel-concept-cavity-mechanism
- id: bridge-panel-viz-diagnostics-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Node: Viz Diagnostics HUD <-> panel-concept-shell-outline
- id: bridge-panel-viz-diagnostics-panel-concept-shell-outline
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Node: Viz Diagnostics HUD <-> panel-concept-curvature-slice
- id: bridge-panel-viz-diagnostics-panel-concept-curvature-slice
- type: bridge
- summary: Panel viz-diagnostics links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Node: Energy Flux Stability <-> panel-concept-energy-flux
- id: bridge-panel-energy-flux-panel-concept-energy-flux
- type: bridge
- summary: Panel energy-flux links to panel-concept-energy-flux via term "R = (phi_A)/(I3 + |T|)".

### Node: Energy Flux Stability <-> panel-concept-viz-diagnostics
- id: bridge-panel-energy-flux-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel energy-flux links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Node: Energy Flux Stability <-> panel-concept-cavity-mechanism
- id: bridge-panel-energy-flux-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel energy-flux links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Node: Energy Flux Stability <-> panel-concept-shell-outline
- id: bridge-panel-energy-flux-panel-concept-shell-outline
- type: bridge
- summary: Panel energy-flux links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Node: Energy Flux Stability <-> panel-concept-curvature-slice
- id: bridge-panel-energy-flux-panel-concept-curvature-slice
- type: bridge
- summary: Panel energy-flux links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Node: Energy Flux Stability <-> panel-concept-operational-mode
- id: bridge-panel-energy-flux-panel-concept-operational-mode
- type: bridge
- summary: Panel energy-flux links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Node: Phoenix Averaging <-> panel-concept-helix-phoenix
- id: bridge-panel-helix-phoenix-panel-concept-helix-phoenix
- type: bridge
- summary: Panel helix-phoenix links to panel-concept-helix-phoenix via term "phoenix averaging".

### Node: Phoenix Averaging <-> phoenix-averaging
- id: bridge-panel-helix-phoenix-phoenix-averaging
- type: bridge
- summary: Panel helix-phoenix links to phoenix-averaging via term "phoenix averaging".

### Node: Phoenix Averaging <-> casimir-tiles-tree
- id: bridge-panel-helix-phoenix-casimir-tiles-tree
- type: bridge
- summary: Panel helix-phoenix links to casimir-tiles-tree via term "casimir tile".

### Node: Phoenix Averaging <-> casimir-tiles-overview
- id: bridge-panel-helix-phoenix-casimir-tiles-overview
- type: bridge
- summary: Panel helix-phoenix links to casimir-tiles-overview via term "casimir tile".

### Node: Phoenix Averaging <-> casimir-tile-mechanism
- id: bridge-panel-helix-phoenix-casimir-tile-mechanism
- type: bridge
- summary: Panel helix-phoenix links to casimir-tile-mechanism via term "casimir tile".

### Node: Phoenix Averaging <-> casimir-tile-roadmap
- id: bridge-panel-helix-phoenix-casimir-tile-roadmap
- type: bridge
- summary: Panel helix-phoenix links to casimir-tile-roadmap via term "casimir tile".

### Node: Microscopy Mode <-> panel-concept-microscopy
- id: bridge-panel-microscopy-panel-concept-microscopy
- type: bridge
- summary: Panel microscopy links to panel-concept-microscopy via term "microscopy mode".

### Node: Microscopy Mode <-> panel-concept-pipeline-proof
- id: bridge-panel-microscopy-panel-concept-pipeline-proof
- type: bridge
- summary: Panel microscopy links to panel-concept-pipeline-proof via term "useEnergyPipeline".

### Node: Needle I_peak Worksheet <-> panel-concept-needle-ipeak-worksheet
- id: bridge-panel-needle-ipeak-worksheet-panel-concept-needle-ipeak-worksheet
- type: bridge
- summary: Panel needle-ipeak-worksheet links to panel-concept-needle-ipeak-worksheet via term "pulsed power".

### Node: Needle I_peak Worksheet <-> panel-concept-pulsed-power-doc
- id: bridge-panel-needle-ipeak-worksheet-panel-concept-pulsed-power-doc
- type: bridge
- summary: Panel needle-ipeak-worksheet links to panel-concept-pulsed-power-doc via term "pulsed power".

### Node: Needle I_peak Worksheet <-> warp-pulsed-power
- id: bridge-panel-needle-ipeak-worksheet-warp-pulsed-power
- type: bridge
- summary: Panel needle-ipeak-worksheet links to warp-pulsed-power via term "pulsed power".

### Node: Needle I_peak Worksheet <-> panel-concept-helix-phoenix
- id: bridge-panel-needle-ipeak-worksheet-panel-concept-helix-phoenix
- type: bridge
- summary: Panel needle-ipeak-worksheet links to panel-concept-helix-phoenix via term "needle hull".

### Node: Needle I_peak Worksheet <-> panel-concept-metric-pocket
- id: bridge-panel-needle-ipeak-worksheet-panel-concept-metric-pocket
- type: bridge
- summary: Panel needle-ipeak-worksheet links to panel-concept-metric-pocket via term "normalized".

### Node: Needle I_peak Worksheet <-> panel-concept-gr-agent-loop-audit
- id: bridge-panel-needle-ipeak-worksheet-panel-concept-gr-agent-loop-audit
- type: bridge
- summary: Panel needle-ipeak-worksheet links to panel-concept-gr-agent-loop-audit via term "undefined".

### Node: Needle World Roadmap <-> panel-concept-needle-world-roadmap
- id: bridge-panel-needle-world-roadmap-panel-concept-needle-world-roadmap
- type: bridge
- summary: Panel needle-world-roadmap links to panel-concept-needle-world-roadmap via term "needle roadmap".

### Node: Needle World Roadmap <-> panel-concept-resonance-scheduler
- id: bridge-panel-needle-world-roadmap-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel needle-world-roadmap links to panel-concept-resonance-scheduler via term "timeline".

### Node: Needle World Roadmap <-> panel-concept-trip-player
- id: bridge-panel-needle-world-roadmap-panel-concept-trip-player
- type: bridge
- summary: Panel needle-world-roadmap links to panel-concept-trip-player via term "timeline".

### Node: Needle World Roadmap <-> panel-concept-halobank
- id: bridge-panel-needle-world-roadmap-panel-concept-halobank
- type: bridge
- summary: Panel needle-world-roadmap links to panel-concept-halobank via term "timeline".

### Node: Needle World Roadmap <-> panel-concept-agi-task-history
- id: bridge-panel-needle-world-roadmap-panel-concept-agi-task-history
- type: bridge
- summary: Panel needle-world-roadmap links to panel-concept-agi-task-history via term "timeline".

### Node: Needle World Roadmap <-> ts-ratio-guardrail
- id: bridge-panel-needle-world-roadmap-ts-ratio-guardrail
- type: bridge
- summary: Panel needle-world-roadmap links to ts-ratio-guardrail via term "TS_ratio".

### Node: Electron Orbital Simulator <-> panel-concept-electron-orbital
- id: bridge-panel-electron-orbital-panel-concept-electron-orbital
- type: bridge
- summary: Panel electron-orbital links to panel-concept-electron-orbital via term "toroidal packets".

### Node: Electron Orbital Simulator <-> panel-concept-cavity-mechanism
- id: bridge-panel-electron-orbital-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel electron-orbital links to panel-concept-cavity-mechanism via term "formatPercent".

### Node: Electron Orbital Simulator <-> panel-concept-near-zero
- id: bridge-panel-electron-orbital-panel-concept-near-zero
- type: bridge
- summary: Panel electron-orbital links to panel-concept-near-zero via term "formatPercent".

### Node: Electron Orbital Simulator <-> panel-concept-operational-mode
- id: bridge-panel-electron-orbital-panel-concept-operational-mode
- type: bridge
- summary: Panel electron-orbital links to panel-concept-operational-mode via term "formatPercent".

### Node: Drive Guards <-> panel-concept-drive-guards
- id: bridge-panel-drive-guards-panel-concept-drive-guards
- type: bridge
- summary: Panel drive-guards links to panel-concept-drive-guards via term "sector strobing".

### Node: Mass Provenance <-> panel-concept-mass-provenance
- id: bridge-panel-mass-provenance-panel-concept-mass-provenance
- type: bridge
- summary: Panel mass-provenance links to panel-concept-mass-provenance via term "override warnings".

### Node: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-audit
- id: bridge-panel-gr-agent-loop-audit-panel-concept-gr-agent-loop-audit
- type: bridge
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-audit via term "warp constraints".

### Node: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-learning
- id: bridge-panel-gr-agent-loop-audit-panel-concept-gr-agent-loop-learning
- type: bridge
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-learning via term "accepted config".

### Node: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-kpis
- id: bridge-panel-gr-agent-loop-audit-panel-concept-gr-agent-loop-kpis
- type: bridge
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-kpis via term "gr agent loop".

### Node: GR Agent Loop Audit <-> ui-panel-gr-agent-loop
- id: bridge-panel-gr-agent-loop-audit-ui-panel-gr-agent-loop
- type: bridge
- summary: Panel gr-agent-loop-audit links to ui-panel-gr-agent-loop via term "gr agent loop".

### Node: GR Agent Loop Audit <-> gr-agent-loop
- id: bridge-panel-gr-agent-loop-audit-gr-agent-loop
- type: bridge
- summary: Panel gr-agent-loop-audit links to gr-agent-loop via term "gr agent loop".

### Node: GR Agent Loop Audit <-> gr-agent-loop-schema
- id: bridge-panel-gr-agent-loop-audit-gr-agent-loop-schema
- type: bridge
- summary: Panel gr-agent-loop-audit links to gr-agent-loop-schema via term "gr agent loop".

### Node: GR Loop KPIs <-> panel-concept-gr-agent-loop-kpis
- id: bridge-panel-gr-agent-loop-kpis-panel-concept-gr-agent-loop-kpis
- type: bridge
- summary: Panel gr-agent-loop-kpis links to panel-concept-gr-agent-loop-kpis via term "constraint violations".

### Node: GR Loop KPIs <-> panel-concept-gr-agent-loop-audit
- id: bridge-panel-gr-agent-loop-kpis-panel-concept-gr-agent-loop-audit
- type: bridge
- summary: Panel gr-agent-loop-kpis links to panel-concept-gr-agent-loop-audit via term "gr agent loop".

### Node: GR Loop KPIs <-> ui-panel-gr-agent-loop
- id: bridge-panel-gr-agent-loop-kpis-ui-panel-gr-agent-loop
- type: bridge
- summary: Panel gr-agent-loop-kpis links to ui-panel-gr-agent-loop via term "gr agent loop".

### Node: GR Loop KPIs <-> gr-agent-loop
- id: bridge-panel-gr-agent-loop-kpis-gr-agent-loop
- type: bridge
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop via term "gr agent loop".

### Node: GR Loop KPIs <-> gr-agent-loop-schema
- id: bridge-panel-gr-agent-loop-kpis-gr-agent-loop-schema
- type: bridge
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop-schema via term "gr agent loop".

### Node: GR Loop Learning <-> panel-concept-gr-agent-loop-learning
- id: bridge-panel-gr-agent-loop-learning-panel-concept-gr-agent-loop-learning
- type: bridge
- summary: Panel gr-agent-loop-learning links to panel-concept-gr-agent-loop-learning via term "accepted config history".

### Node: GR Loop Learning <-> agi-learning-loop
- id: bridge-panel-gr-agent-loop-learning-agi-learning-loop
- type: bridge
- summary: Panel gr-agent-loop-learning links to agi-learning-loop via term "learning loop".

### Node: GR Loop Learning <-> panel-concept-gr-agent-loop-audit
- id: bridge-panel-gr-agent-loop-learning-panel-concept-gr-agent-loop-audit
- type: bridge
- summary: Panel gr-agent-loop-learning links to panel-concept-gr-agent-loop-audit via term "residualSeries".

### Node: Math Maturity Tree <-> panel-concept-math-maturity-tree
- id: bridge-panel-math-maturity-tree-panel-concept-math-maturity-tree
- type: bridge
- summary: Panel math-maturity-tree links to panel-concept-math-maturity-tree via term "math maturity".

### Node: Math Maturity Tree <-> ui-panel-math-maturity
- id: bridge-panel-math-maturity-tree-ui-panel-math-maturity
- type: bridge
- summary: Panel math-maturity-tree links to ui-panel-math-maturity via term "math maturity".

### Node: Math Maturity Tree <-> math-maturity-tree
- id: bridge-panel-math-maturity-tree-math-maturity-tree
- type: bridge
- summary: Panel math-maturity-tree links to math-maturity-tree via term "math maturity".

### Node: Math Maturity Tree <-> math-maturity-stages
- id: bridge-panel-math-maturity-tree-math-maturity-stages
- type: bridge
- summary: Panel math-maturity-tree links to math-maturity-stages via term "math maturity".

### Node: Math Maturity Tree <-> bridge-math-maturity-stages-math-evidence-registry
- id: bridge-panel-math-maturity-tree-bridge-math-maturity-stages-math-evidence-registry
- type: bridge
- summary: Panel math-maturity-tree links to bridge-math-maturity-stages-math-evidence-registry via term "math maturity".

### Node: Math Maturity Tree <-> panel-concept-universal-audit-tree
- id: bridge-panel-math-maturity-tree-panel-concept-universal-audit-tree
- type: bridge
- summary: Panel math-maturity-tree links to panel-concept-universal-audit-tree via term "repo audit".

### Node: Universal Audit Tree <-> panel-concept-universal-audit-tree
- id: bridge-panel-universal-audit-tree-panel-concept-universal-audit-tree
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-universal-audit-tree via term "verification map".

### Node: Universal Audit Tree <-> panel-concept-math-maturity-tree
- id: bridge-panel-universal-audit-tree-panel-concept-math-maturity-tree
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-math-maturity-tree via term "repo audit".

### Node: Universal Audit Tree <-> panel-concept-gr-agent-loop-kpis
- id: bridge-panel-universal-audit-tree-panel-concept-gr-agent-loop-kpis
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-gr-agent-loop-kpis via term "string".

### Node: Universal Audit Tree <-> panel-concept-model-silhouette
- id: bridge-panel-universal-audit-tree-panel-concept-model-silhouette
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-model-silhouette via term "string".

### Node: Universal Audit Tree <-> panel-concept-trip-player
- id: bridge-panel-universal-audit-tree-panel-concept-trip-player
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-trip-player via term "string".

### Node: Universal Audit Tree <-> panel-concept-fuel-gauge
- id: bridge-panel-universal-audit-tree-panel-concept-fuel-gauge
- type: bridge
- summary: Panel universal-audit-tree links to panel-concept-fuel-gauge via term "string".

### Node: TSN Determinism <-> panel-concept-tsn-sim
- id: bridge-panel-tsn-sim-panel-concept-tsn-sim
- type: bridge
- summary: Panel tsn-sim links to panel-concept-tsn-sim via term "deterministic".

### Node: TSN Determinism <-> panel-concept-time-dilation-lattice
- id: bridge-panel-tsn-sim-panel-concept-time-dilation-lattice
- type: bridge
- summary: Panel tsn-sim links to panel-concept-time-dilation-lattice via term "clock".

### Node: TSN Determinism <-> panel-concept-agi-task-history
- id: bridge-panel-tsn-sim-panel-concept-agi-task-history
- type: bridge
- summary: Panel tsn-sim links to panel-concept-agi-task-history via term "clock".

### Node: TSN Determinism <-> panel-concept-light-speed-strobe
- id: bridge-panel-tsn-sim-panel-concept-light-speed-strobe
- type: bridge
- summary: Panel tsn-sim links to panel-concept-light-speed-strobe via term "tsn".

### Node: TSN Determinism <-> simulation-tsn
- id: bridge-panel-tsn-sim-simulation-tsn
- type: bridge
- summary: Panel tsn-sim links to simulation-tsn via term "tsn".

### Node: TSN Determinism <-> panel-concept-pulsed-power-doc
- id: bridge-panel-tsn-sim-panel-concept-pulsed-power-doc
- type: bridge
- summary: Panel tsn-sim links to panel-concept-pulsed-power-doc via term "usePanelTelemetryPublisher".

### Node: Warp Pulsed Power <-> panel-concept-needle-ipeak-worksheet
- id: bridge-panel-pulsed-power-doc-panel-concept-needle-ipeak-worksheet
- type: bridge
- summary: Panel pulsed-power-doc links to panel-concept-needle-ipeak-worksheet via term "pulsed power".

### Node: Warp Pulsed Power <-> panel-concept-pulsed-power-doc
- id: bridge-panel-pulsed-power-doc-panel-concept-pulsed-power-doc
- type: bridge
- summary: Panel pulsed-power-doc links to panel-concept-pulsed-power-doc via term "pulsed power".

### Node: Warp Pulsed Power <-> warp-pulsed-power
- id: bridge-panel-pulsed-power-doc-warp-pulsed-power
- type: bridge
- summary: Panel pulsed-power-doc links to warp-pulsed-power via term "pulsed power".

### Node: Warp Pulsed Power <-> panel-concept-viz-diagnostics
- id: bridge-panel-pulsed-power-doc-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel pulsed-power-doc links to panel-concept-viz-diagnostics via term "pipeline".

### Node: Warp Pulsed Power <-> panel-concept-energy-flux
- id: bridge-panel-pulsed-power-doc-panel-concept-energy-flux
- type: bridge
- summary: Panel pulsed-power-doc links to panel-concept-energy-flux via term "pipeline".

### Node: Warp Pulsed Power <-> panel-concept-microscopy
- id: bridge-panel-pulsed-power-doc-panel-concept-microscopy
- type: bridge
- summary: Panel pulsed-power-doc links to panel-concept-microscopy via term "pipeline".

### Node: Bus Voltage Program <-> panel-concept-bus-voltage
- id: bridge-panel-bus-voltage-panel-concept-bus-voltage
- type: bridge
- summary: Panel bus-voltage links to panel-concept-bus-voltage via term "power policy".

### Node: Bus Voltage Program <-> panel-concept-qi-auto-tuner
- id: bridge-panel-bus-voltage-panel-concept-qi-auto-tuner
- type: bridge
- summary: Panel bus-voltage links to panel-concept-qi-auto-tuner via term "setpoint".

### Node: Bus Voltage Program <-> guarded-casimir-tile-code-mapped
- id: bridge-panel-bus-voltage-guarded-casimir-tile-code-mapped
- type: bridge
- summary: Panel bus-voltage links to guarded-casimir-tile-code-mapped via term "Guardrail".

### Node: Bus Voltage Program <-> ts-ratio-guardrail
- id: bridge-panel-bus-voltage-ts-ratio-guardrail
- type: bridge
- summary: Panel bus-voltage links to ts-ratio-guardrail via term "Guardrail".

### Node: Bus Voltage Program <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- id: bridge-panel-bus-voltage-bridge-ts-ratio-guardrail-casimir-tile-mechanism
- type: bridge
- summary: Panel bus-voltage links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "Guardrail".

### Node: Bus Voltage Program <-> llm-runtime-tokenizer
- id: bridge-panel-bus-voltage-llm-runtime-tokenizer
- type: bridge
- summary: Panel bus-voltage links to llm-runtime-tokenizer via term "Guardrail".

### Node: KM-Scale Warp Ledger <-> panel-concept-warp-ledger
- id: bridge-panel-warp-ledger-panel-concept-warp-ledger
- type: bridge
- summary: Panel warp-ledger links to panel-concept-warp-ledger via term "km-scale ledger".

### Node: KM-Scale Warp Ledger <-> warp-ledger
- id: bridge-panel-warp-ledger-warp-ledger
- type: bridge
- summary: Panel warp-ledger links to warp-ledger via term "warp ledger".

### Node: KM-Scale Warp Ledger <-> ui-panel-warp-ledger
- id: bridge-panel-warp-ledger-ui-panel-warp-ledger
- type: bridge
- summary: Panel warp-ledger links to ui-panel-warp-ledger via term "warp ledger".

### Node: KM-Scale Warp Ledger <-> panel-concept-halobank
- id: bridge-panel-warp-ledger-panel-concept-halobank
- type: bridge
- summary: Panel warp-ledger links to panel-concept-halobank via term "@/lib/whispers/usePanelHashFocus".

### Node: Warp Experiment Ladder <-> panel-concept-experiment-ladder
- id: bridge-panel-experiment-ladder-panel-concept-experiment-ladder
- type: bridge
- summary: Panel experiment-ladder links to panel-concept-experiment-ladder via term "experiment ladder".

### Node: Warp Experiment Ladder <-> panel-concept-qi-widget
- id: bridge-panel-experiment-ladder-panel-concept-qi-widget
- type: bridge
- summary: Panel experiment-ladder links to panel-concept-qi-widget via term "ford-roman".

### Node: Warp Experiment Ladder <-> qi-bounds-engine
- id: bridge-panel-experiment-ladder-qi-bounds-engine
- type: bridge
- summary: Panel experiment-ladder links to qi-bounds-engine via term "ford-roman".

### Node: Warp Experiment Ladder <-> ford-roman-quantum-inequality
- id: bridge-panel-experiment-ladder-ford-roman-quantum-inequality
- type: bridge
- summary: Panel experiment-ladder links to ford-roman-quantum-inequality via term "ford-roman".

### Node: Warp Experiment Ladder <-> ford-roman-proxy
- id: bridge-panel-experiment-ladder-ford-roman-proxy
- type: bridge
- summary: Panel experiment-ladder links to ford-roman-proxy via term "ford-roman".

### Node: Warp Experiment Ladder <-> casimir-tiles-tree
- id: bridge-panel-experiment-ladder-casimir-tiles-tree
- type: bridge
- summary: Panel experiment-ladder links to casimir-tiles-tree via term "casimir".

### Node: Spectrum Tuner <-> panel-concept-spectrum-tuner
- id: bridge-panel-spectrum-tuner-panel-concept-spectrum-tuner
- type: bridge
- summary: Panel spectrum-tuner links to panel-concept-spectrum-tuner via term "harmonics sweep".

### Node: Spectrum Tuner <-> external-integrations-tree
- id: bridge-panel-spectrum-tuner-external-integrations-tree
- type: bridge
- summary: Panel spectrum-tuner links to external-integrations-tree via term "Integration".

### Node: Spectrum Tuner <-> sdk-integration-tree
- id: bridge-panel-spectrum-tuner-sdk-integration-tree
- type: bridge
- summary: Panel spectrum-tuner links to sdk-integration-tree via term "Integration".

### Node: Spectrum Tuner <-> zen-artifact-integration-ladder
- id: bridge-panel-spectrum-tuner-zen-artifact-integration-ladder
- type: bridge
- summary: Panel spectrum-tuner links to zen-artifact-integration-ladder via term "Integration".

### Node: Spectrum Tuner <-> integration-ladder
- id: bridge-panel-spectrum-tuner-integration-ladder
- type: bridge
- summary: Panel spectrum-tuner links to integration-ladder via term "Integration".

### Node: Spectrum Tuner <-> hardware-provenance
- id: bridge-panel-spectrum-tuner-hardware-provenance
- type: bridge
- summary: Panel spectrum-tuner links to hardware-provenance via term "Provenance".

### Node: Vacuum Gap Heatmap <-> panel-concept-vacuum-gap-heatmap
- id: bridge-panel-vacuum-gap-heatmap-panel-concept-vacuum-gap-heatmap
- type: bridge
- summary: Panel vacuum-gap-heatmap links to panel-concept-vacuum-gap-heatmap via term "Casimir gap".

### Node: Vacuum Gap Heatmap <-> panel-concept-vacuum-gap-sweep
- id: bridge-panel-vacuum-gap-heatmap-panel-concept-vacuum-gap-sweep
- type: bridge
- summary: Panel vacuum-gap-heatmap links to panel-concept-vacuum-gap-sweep via term "vacuum gap".

### Node: Vacuum Gap Heatmap <-> ui-panel-vacuum
- id: bridge-panel-vacuum-gap-heatmap-ui-panel-vacuum
- type: bridge
- summary: Panel vacuum-gap-heatmap links to ui-panel-vacuum via term "vacuum gap".

### Node: Vacuum Gap Heatmap <-> panel-concept-helix-casimir-amplifier
- id: bridge-panel-vacuum-gap-heatmap-panel-concept-helix-casimir-amplifier
- type: bridge
- summary: Panel vacuum-gap-heatmap links to panel-concept-helix-casimir-amplifier via term "heatmap".

### Node: Hydrostatic Equilibrium (HR) <-> panel-concept-star-hydrostatic
- id: bridge-panel-star-hydrostatic-panel-concept-star-hydrostatic
- type: bridge
- summary: Panel star-hydrostatic links to panel-concept-star-hydrostatic via term "potato threshold".

### Node: Hydrostatic Equilibrium (HR) <-> potato-threshold
- id: bridge-panel-star-hydrostatic-potato-threshold
- type: bridge
- summary: Panel star-hydrostatic links to potato-threshold via term "potato threshold".

### Node: Hydrostatic Equilibrium (HR) <-> stellar-ledger
- id: bridge-panel-star-hydrostatic-stellar-ledger
- type: bridge
- summary: Panel star-hydrostatic links to stellar-ledger via term "stellar ledger".

### Node: Hydrostatic Equilibrium (HR) <-> stellar-ledger-stack
- id: bridge-panel-star-hydrostatic-stellar-ledger-stack
- type: bridge
- summary: Panel star-hydrostatic links to stellar-ledger-stack via term "stellar ledger".

### Node: Hydrostatic Equilibrium (HR) <-> stellar-ledger
- id: bridge-panel-star-hydrostatic-stellar-ledger
- type: bridge
- summary: Panel star-hydrostatic links to stellar-ledger via term "stellar ledger".

### Node: Hydrostatic Equilibrium (HR) <-> bridge-solar-restoration-plan-stellar-ledger-stack
- id: bridge-panel-star-hydrostatic-bridge-solar-restoration-plan-stellar-ledger-stack
- type: bridge
- summary: Panel star-hydrostatic links to bridge-solar-restoration-plan-stellar-ledger-stack via term "stellar ledger".

### Node: Star Watcher <-> panel-concept-star-watcher
- id: bridge-panel-star-watcher-panel-concept-star-watcher
- type: bridge
- summary: Panel star-watcher links to panel-concept-star-watcher via term "Coherence overlay".

### Node: Star Watcher <-> panel-concept-agi-debate-view
- id: bridge-panel-star-watcher-panel-concept-agi-debate-view
- type: bridge
- summary: Panel star-watcher links to panel-concept-agi-debate-view via term "global_coherence".

### Node: Star Watcher <-> panel-concept-collapse-monitor
- id: bridge-panel-star-watcher-panel-concept-collapse-monitor
- type: bridge
- summary: Panel star-watcher links to panel-concept-collapse-monitor via term "global_coherence".

### Node: Star Watcher <-> panel-concept-star-hydrostatic
- id: bridge-panel-star-watcher-panel-concept-star-hydrostatic
- type: bridge
- summary: Panel star-watcher links to panel-concept-star-hydrostatic via term "CardDescription".

### Node: Tokamak Simulation <-> panel-concept-tokamak-sim
- id: bridge-panel-tokamak-sim-panel-concept-tokamak-sim
- type: bridge
- summary: Panel tokamak-sim links to panel-concept-tokamak-sim via term "coherence diagnostics".

### Node: Tokamak Simulation <-> ui-panel-tokamak
- id: bridge-panel-tokamak-sim-ui-panel-tokamak
- type: bridge
- summary: Panel tokamak-sim links to ui-panel-tokamak via term "tokamak".

### Node: Tokamak Simulation <-> tokamak-energy-field
- id: bridge-panel-tokamak-sim-tokamak-energy-field
- type: bridge
- summary: Panel tokamak-sim links to tokamak-energy-field via term "tokamak".

### Node: Tokamak Simulation <-> tokamak-synthetic-diagnostics
- id: bridge-panel-tokamak-sim-tokamak-synthetic-diagnostics
- type: bridge
- summary: Panel tokamak-sim links to tokamak-synthetic-diagnostics via term "tokamak".

### Node: Tokamak Simulation <-> tokamak-energy-adapter
- id: bridge-panel-tokamak-sim-tokamak-energy-adapter
- type: bridge
- summary: Panel tokamak-sim links to tokamak-energy-adapter via term "tokamak".

### Node: Tokamak Simulation <-> panel-concept-vacuum-contract
- id: bridge-panel-tokamak-sim-panel-concept-vacuum-contract
- type: bridge
- summary: Panel tokamak-sim links to panel-concept-vacuum-contract via term "formatNumber".

### Node: Vacuum Gap Sweep HUD <-> panel-concept-vacuum-gap-sweep
- id: bridge-panel-vacuum-gap-sweep-panel-concept-vacuum-gap-sweep
- type: bridge
- summary: Panel vacuum-gap-sweep links to panel-concept-vacuum-gap-sweep via term "gap sweep".

### Node: Cavity Mechanism <-> panel-concept-cavity-mechanism
- id: bridge-panel-cavity-mechanism-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-cavity-mechanism via term "actuator layout".

### Node: Cavity Mechanism <-> panel-concept-viz-diagnostics
- id: bridge-panel-cavity-mechanism-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Node: Cavity Mechanism <-> panel-concept-energy-flux
- id: bridge-panel-cavity-mechanism-panel-concept-energy-flux
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Node: Cavity Mechanism <-> panel-concept-shell-outline
- id: bridge-panel-cavity-mechanism-panel-concept-shell-outline
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Node: Cavity Mechanism <-> panel-concept-curvature-slice
- id: bridge-panel-cavity-mechanism-panel-concept-curvature-slice
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Node: Cavity Mechanism <-> panel-concept-operational-mode
- id: bridge-panel-cavity-mechanism-panel-concept-operational-mode
- type: bridge
- summary: Panel cavity-mechanism links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Node: Fractional Coherence Rail <-> panel-concept-fractional-coherence-rail
- id: bridge-panel-fractional-coherence-rail-panel-concept-fractional-coherence-rail
- type: bridge
- summary: Panel fractional-coherence-rail links to panel-concept-fractional-coherence-rail via term "fractional coherence".

### Node: Fractional Coherence Rail <-> panel-concept-fractional-coherence-grid
- id: bridge-panel-fractional-coherence-rail-panel-concept-fractional-coherence-grid
- type: bridge
- summary: Panel fractional-coherence-rail links to panel-concept-fractional-coherence-grid via term "fractional coherence".

### Node: Fractional Coherence Grid <-> panel-concept-fractional-coherence-grid
- id: bridge-panel-fractional-coherence-grid-panel-concept-fractional-coherence-grid
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-fractional-coherence-grid via term "coherence lattice".

### Node: Fractional Coherence Grid <-> panel-concept-needle-ipeak-worksheet
- id: bridge-panel-fractional-coherence-grid-panel-concept-needle-ipeak-worksheet
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-needle-ipeak-worksheet via term "Hz".

### Node: Fractional Coherence Grid <-> panel-concept-vacuum-gap-heatmap
- id: bridge-panel-fractional-coherence-grid-panel-concept-vacuum-gap-heatmap
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-vacuum-gap-heatmap via term "Hz".

### Node: Fractional Coherence Grid <-> panel-concept-tokamak-sim
- id: bridge-panel-fractional-coherence-grid-panel-concept-tokamak-sim
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-tokamak-sim via term "Hz".

### Node: Fractional Coherence Grid <-> panel-concept-alcubierre-viewer
- id: bridge-panel-fractional-coherence-grid-panel-concept-alcubierre-viewer
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-alcubierre-viewer via term "Hz".

### Node: Fractional Coherence Grid <-> panel-concept-shell-outline
- id: bridge-panel-fractional-coherence-grid-panel-concept-shell-outline
- type: bridge
- summary: Panel fractional-coherence-grid links to panel-concept-shell-outline via term "Hz".

### Node: Near-Zero Widget <-> panel-concept-near-zero
- id: bridge-panel-near-zero-panel-concept-near-zero
- type: bridge
- summary: Panel near-zero links to panel-concept-near-zero via term "near zero widget".

### Node: Near-Zero Widget <-> panel-concept-tsn-sim
- id: bridge-panel-near-zero-panel-concept-tsn-sim
- type: bridge
- summary: Panel near-zero links to panel-concept-tsn-sim via term "usePanelTelemetryPublisher".

### Node: Near-Zero Widget <-> panel-concept-pulsed-power-doc
- id: bridge-panel-near-zero-panel-concept-pulsed-power-doc
- type: bridge
- summary: Panel near-zero links to panel-concept-pulsed-power-doc via term "usePanelTelemetryPublisher".

### Node: Direction Pad <-> panel-concept-direction-pad
- id: bridge-panel-direction-pad-panel-concept-direction-pad
- type: bridge
- summary: Panel direction-pad links to panel-concept-direction-pad via term "flight director".

### Node: Solar Navigation <-> panel-concept-nav-system
- id: bridge-panel-nav-system-panel-concept-nav-system
- type: bridge
- summary: Panel nav-system links to panel-concept-nav-system via term "navigation hud".

### Node: Solar Navigation <-> ui-hud-nav
- id: bridge-panel-nav-system-ui-hud-nav
- type: bridge
- summary: Panel nav-system links to ui-hud-nav via term "navigation hud".

### Node: Solar Navigation <-> panel-concept-viz-diagnostics
- id: bridge-panel-nav-system-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel nav-system links to panel-concept-viz-diagnostics via term "react".

### Node: Solar Navigation <-> panel-concept-deepmix-solar
- id: bridge-panel-nav-system-panel-concept-deepmix-solar
- type: bridge
- summary: Panel nav-system links to panel-concept-deepmix-solar via term "react".

### Node: Solar Navigation <-> panel-concept-casimir-tile-grid
- id: bridge-panel-nav-system-panel-concept-casimir-tile-grid
- type: bridge
- summary: Panel nav-system links to panel-concept-casimir-tile-grid via term "react".

### Node: Solar Navigation <-> panel-concept-sweep-replay
- id: bridge-panel-nav-system-panel-concept-sweep-replay
- type: bridge
- summary: Panel nav-system links to panel-concept-sweep-replay via term "react".

### Node: DeepMix Solar View <-> panel-concept-deepmix-solar
- id: bridge-panel-deepmix-solar-panel-concept-deepmix-solar
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-deepmix-solar via term "solar telemetry".

### Node: DeepMix Solar View <-> panel-concept-viz-diagnostics
- id: bridge-panel-deepmix-solar-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-viz-diagnostics via term "react".

### Node: DeepMix Solar View <-> panel-concept-nav-system
- id: bridge-panel-deepmix-solar-panel-concept-nav-system
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-nav-system via term "react".

### Node: DeepMix Solar View <-> panel-concept-casimir-tile-grid
- id: bridge-panel-deepmix-solar-panel-concept-casimir-tile-grid
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-casimir-tile-grid via term "react".

### Node: DeepMix Solar View <-> panel-concept-sweep-replay
- id: bridge-panel-deepmix-solar-panel-concept-sweep-replay
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-sweep-replay via term "react".

### Node: DeepMix Solar View <-> panel-concept-remove-bg-edges
- id: bridge-panel-deepmix-solar-panel-concept-remove-bg-edges
- type: bridge
- summary: Panel deepmix-solar links to panel-concept-remove-bg-edges via term "react".

### Node: Solar Globe <-> panel-concept-solar-globe
- id: bridge-panel-solar-globe-panel-concept-solar-globe
- type: bridge
- summary: Panel solar-globe links to panel-concept-solar-globe via term "synoptic globe".

### Node: Solar Globe <-> ui-panel-solar-globe
- id: bridge-panel-solar-globe-ui-panel-solar-globe
- type: bridge
- summary: Panel solar-globe links to ui-panel-solar-globe via term "solar globe".

### Node: Solar Globe <-> panel-concept-needle-ipeak-worksheet
- id: bridge-panel-solar-globe-panel-concept-needle-ipeak-worksheet
- type: bridge
- summary: Panel solar-globe links to panel-concept-needle-ipeak-worksheet via term "return".

### Node: Solar Globe <-> panel-concept-electron-orbital
- id: bridge-panel-solar-globe-panel-concept-electron-orbital
- type: bridge
- summary: Panel solar-globe links to panel-concept-electron-orbital via term "return".

### Node: Solar Globe <-> panel-concept-drive-guards
- id: bridge-panel-solar-globe-panel-concept-drive-guards
- type: bridge
- summary: Panel solar-globe links to panel-concept-drive-guards via term "return".

### Node: Solar Globe <-> panel-concept-mass-provenance
- id: bridge-panel-solar-globe-panel-concept-mass-provenance
- type: bridge
- summary: Panel solar-globe links to panel-concept-mass-provenance via term "return".

### Node: DeepMix Sweet Spot <-> panel-concept-deepmix-sweetspot
- id: bridge-panel-deepmix-sweetspot-panel-concept-deepmix-sweetspot
- type: bridge
- summary: Panel deepmix-sweetspot links to panel-concept-deepmix-sweetspot via term "mix optimization".

### Node: DeepMix Sweet Spot <-> panel-concept-deepmix-globe
- id: bridge-panel-deepmix-sweetspot-panel-concept-deepmix-globe
- type: bridge
- summary: Panel deepmix-sweetspot links to panel-concept-deepmix-globe via term "ratePerShipKgS".

### Node: DeepMix Sweet Spot <-> panel-concept-mass-provenance
- id: bridge-panel-deepmix-sweetspot-panel-concept-mass-provenance
- type: bridge
- summary: Panel deepmix-sweetspot links to panel-concept-mass-provenance via term "toExponential".

### Node: DeepMix Sweet Spot <-> panel-concept-curvature-slice
- id: bridge-panel-deepmix-sweetspot-panel-concept-curvature-slice
- type: bridge
- summary: Panel deepmix-sweetspot links to panel-concept-curvature-slice via term "toExponential".

### Node: DeepMix Sweet Spot <-> panel-concept-stellar-lsr
- id: bridge-panel-deepmix-sweetspot-panel-concept-stellar-lsr
- type: bridge
- summary: Panel deepmix-sweetspot links to panel-concept-stellar-lsr via term "toExponential".

### Node: DeepMix Globe <-> panel-concept-deepmix-globe
- id: bridge-panel-deepmix-globe-panel-concept-deepmix-globe
- type: bridge
- summary: Panel deepmix-globe links to panel-concept-deepmix-globe via term "deep mixing globe".

### Node: DeepMix Globe <-> panel-concept-deepmix-sweetspot
- id: bridge-panel-deepmix-globe-panel-concept-deepmix-sweetspot
- type: bridge
- summary: Panel deepmix-globe links to panel-concept-deepmix-sweetspot via term "ratePerShipKgS".

### Node: DeepMix Globe <-> panel-concept-mass-provenance
- id: bridge-panel-deepmix-globe-panel-concept-mass-provenance
- type: bridge
- summary: Panel deepmix-globe links to panel-concept-mass-provenance via term "toExponential".

### Node: DeepMix Globe <-> panel-concept-curvature-slice
- id: bridge-panel-deepmix-globe-panel-concept-curvature-slice
- type: bridge
- summary: Panel deepmix-globe links to panel-concept-curvature-slice via term "toExponential".

### Node: DeepMix Globe <-> panel-concept-stellar-lsr
- id: bridge-panel-deepmix-globe-panel-concept-stellar-lsr
- type: bridge
- summary: Panel deepmix-globe links to panel-concept-stellar-lsr via term "toExponential".

### Node: Alcubierre Viewer <-> panel-concept-alcubierre-viewer
- id: bridge-panel-alcubierre-viewer-panel-concept-alcubierre-viewer
- type: bridge
- summary: Panel alcubierre-viewer links to panel-concept-alcubierre-viewer via term "Alcubierre metric".

### Node: Alcubierre Viewer <-> alcubierre-metric
- id: bridge-panel-alcubierre-viewer-alcubierre-metric
- type: bridge
- summary: Panel alcubierre-viewer links to alcubierre-metric via term "Alcubierre metric".

### Node: Alcubierre Viewer <-> ui-panel-warp-bubble
- id: bridge-panel-alcubierre-viewer-ui-panel-warp-bubble
- type: bridge
- summary: Panel alcubierre-viewer links to ui-panel-warp-bubble via term "warp bubble".

### Node: Alcubierre Viewer <-> ui-renderer-warp-bubble
- id: bridge-panel-alcubierre-viewer-ui-renderer-warp-bubble
- type: bridge
- summary: Panel alcubierre-viewer links to ui-renderer-warp-bubble via term "warp bubble".

### Node: Alcubierre Viewer <-> warp-bubble
- id: bridge-panel-alcubierre-viewer-warp-bubble
- type: bridge
- summary: Panel alcubierre-viewer links to warp-bubble via term "warp bubble".

### Node: Alcubierre Viewer <-> panel-concept-hull-metrics-vis
- id: bridge-panel-alcubierre-viewer-panel-concept-hull-metrics-vis
- type: bridge
- summary: Panel alcubierre-viewer links to panel-concept-hull-metrics-vis via term "resolveHullDimsEffective".

### Node: Shell Outline Visualizer <-> panel-concept-shell-outline
- id: bridge-panel-shell-outline-panel-concept-shell-outline
- type: bridge
- summary: Panel shell-outline links to panel-concept-shell-outline via term "shell outline".

### Node: Shell Outline Visualizer <-> panel-concept-viz-diagnostics
- id: bridge-panel-shell-outline-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel shell-outline links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Node: Shell Outline Visualizer <-> panel-concept-energy-flux
- id: bridge-panel-shell-outline-panel-concept-energy-flux
- type: bridge
- summary: Panel shell-outline links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Node: Shell Outline Visualizer <-> panel-concept-cavity-mechanism
- id: bridge-panel-shell-outline-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel shell-outline links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Node: Shell Outline Visualizer <-> panel-concept-curvature-slice
- id: bridge-panel-shell-outline-panel-concept-curvature-slice
- type: bridge
- summary: Panel shell-outline links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Node: Shell Outline Visualizer <-> panel-concept-operational-mode
- id: bridge-panel-shell-outline-panel-concept-operational-mode
- type: bridge
- summary: Panel shell-outline links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Node: Silhouette Stretch <-> panel-concept-model-silhouette
- id: bridge-panel-model-silhouette-panel-concept-model-silhouette
- type: bridge
- summary: Panel model-silhouette links to panel-concept-model-silhouette via term "ellipsoid".

### Node: Silhouette Stretch <-> panel-concept-pipeline-proof
- id: bridge-panel-model-silhouette-panel-concept-pipeline-proof
- type: bridge
- summary: Panel model-silhouette links to panel-concept-pipeline-proof via term "ellipsoid".

### Node: Silhouette Stretch <-> ts-ratio-guardrail
- id: bridge-panel-model-silhouette-ts-ratio-guardrail
- type: bridge
- summary: Panel model-silhouette links to ts-ratio-guardrail via term "scale".

### Node: Silhouette Stretch <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- id: bridge-panel-model-silhouette-bridge-ts-ratio-guardrail-casimir-tile-mechanism
- type: bridge
- summary: Panel model-silhouette links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "scale".

### Node: Silhouette Stretch <-> panel-concept-microscopy
- id: bridge-panel-model-silhouette-panel-concept-microscopy
- type: bridge
- summary: Panel model-silhouette links to panel-concept-microscopy via term "scale".

### Node: Silhouette Stretch <-> panel-concept-warp-ledger
- id: bridge-panel-model-silhouette-panel-concept-warp-ledger
- type: bridge
- summary: Panel model-silhouette links to panel-concept-warp-ledger via term "scale".

### Node: Hull Metrics Vis <-> panel-concept-hull-metrics-vis
- id: bridge-panel-hull-metrics-vis-panel-concept-hull-metrics-vis
- type: bridge
- summary: Panel hull-metrics-vis links to panel-concept-hull-metrics-vis via term "hull metrics".

### Node: Hull Metrics Vis <-> panel-concept-alcubierre-viewer
- id: bridge-panel-hull-metrics-vis-panel-concept-alcubierre-viewer
- type: bridge
- summary: Panel hull-metrics-vis links to panel-concept-alcubierre-viewer via term "alcubierre".

### Node: Hull Metrics Vis <-> ui-panel-alcubierre
- id: bridge-panel-hull-metrics-vis-ui-panel-alcubierre
- type: bridge
- summary: Panel hull-metrics-vis links to ui-panel-alcubierre via term "alcubierre".

### Node: Hull Metrics Vis <-> alcubierre-metric
- id: bridge-panel-hull-metrics-vis-alcubierre-metric
- type: bridge
- summary: Panel hull-metrics-vis links to alcubierre-metric via term "alcubierre".

### Node: Hull Metrics Vis <-> casimir-natario-metric
- id: bridge-panel-hull-metrics-vis-casimir-natario-metric
- type: bridge
- summary: Panel hull-metrics-vis links to casimir-natario-metric via term "natario".

### Node: Hull Metrics Vis <-> panel-concept-experiment-ladder
- id: bridge-panel-hull-metrics-vis-panel-concept-experiment-ladder
- type: bridge
- summary: Panel hull-metrics-vis links to panel-concept-experiment-ladder via term "natario".

### Node: Shift Vector Panel <-> panel-concept-shift-vector
- id: bridge-panel-shift-vector-panel-concept-shift-vector
- type: bridge
- summary: Panel shift-vector links to panel-concept-shift-vector via term "shift vector".

### Node: Shift Vector Panel <-> ui-panel-shift-vector
- id: bridge-panel-shift-vector-ui-panel-shift-vector
- type: bridge
- summary: Panel shift-vector links to ui-panel-shift-vector via term "shift vector".

### Node: Shift Vector Panel <-> shift-vector-expansion-scalar
- id: bridge-panel-shift-vector-shift-vector-expansion-scalar
- type: bridge
- summary: Panel shift-vector links to shift-vector-expansion-scalar via term "shift vector".

### Node: Shift Vector Panel <-> panel-concept-hull-metrics-vis
- id: bridge-panel-shift-vector-panel-concept-hull-metrics-vis
- type: bridge
- summary: Panel shift-vector links to panel-concept-hull-metrics-vis via term "shiftVector".

### Node: Shift Vector Panel <-> panel-concept-drive-guards
- id: bridge-panel-shift-vector-panel-concept-drive-guards
- type: bridge
- summary: Panel shift-vector links to panel-concept-drive-guards via term "useMetrics".

### Node: Shift Vector Panel <-> panel-concept-curvature-slice
- id: bridge-panel-shift-vector-panel-concept-curvature-slice
- type: bridge
- summary: Panel shift-vector links to panel-concept-curvature-slice via term "useMetrics".

### Node: Equatorial Curvature Slice <-> panel-concept-curvature-slice
- id: bridge-panel-curvature-slice-panel-concept-curvature-slice
- type: bridge
- summary: Panel curvature-slice links to panel-concept-curvature-slice via term "scalar curvature".

### Node: Equatorial Curvature Slice <-> ui-panel-curvature-slices
- id: bridge-panel-curvature-slice-ui-panel-curvature-slices
- type: bridge
- summary: Panel curvature-slice links to ui-panel-curvature-slices via term "curvature slice".

### Node: Equatorial Curvature Slice <-> panel-concept-viz-diagnostics
- id: bridge-panel-curvature-slice-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel curvature-slice links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Node: Equatorial Curvature Slice <-> panel-concept-energy-flux
- id: bridge-panel-curvature-slice-panel-concept-energy-flux
- type: bridge
- summary: Panel curvature-slice links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Node: Equatorial Curvature Slice <-> panel-concept-cavity-mechanism
- id: bridge-panel-curvature-slice-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel curvature-slice links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Node: Equatorial Curvature Slice <-> panel-concept-shell-outline
- id: bridge-panel-curvature-slice-panel-concept-shell-outline
- type: bridge
- summary: Panel curvature-slice links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Node: Time Dilation Lattice <-> panel-concept-time-dilation-lattice
- id: bridge-panel-time-dilation-lattice-panel-concept-time-dilation-lattice
- type: bridge
- summary: Panel time-dilation-lattice links to panel-concept-time-dilation-lattice via term "spacetime lattice".

### Node: Time Dilation Lattice <-> ui-panel-time-dilation
- id: bridge-panel-time-dilation-lattice-ui-panel-time-dilation
- type: bridge
- summary: Panel time-dilation-lattice links to ui-panel-time-dilation via term "time dilation".

### Node: Time Dilation Lattice <-> panel-concept-remove-bg-edges
- id: bridge-panel-time-dilation-lattice-panel-concept-remove-bg-edges
- type: bridge
- summary: Panel time-dilation-lattice links to panel-concept-remove-bg-edges via term "alpha".

### Node: Time Dilation Lattice <-> panel-concept-pipeline-proof
- id: bridge-panel-time-dilation-lattice-panel-concept-pipeline-proof
- type: bridge
- summary: Panel time-dilation-lattice links to panel-concept-pipeline-proof via term "EnergyPipelineState".

### Node: Curvature Ledger <-> panel-concept-curvature-ledger
- id: bridge-panel-curvature-ledger-panel-concept-curvature-ledger
- type: bridge
- summary: Panel curvature-ledger links to panel-concept-curvature-ledger via term "curvature ledger".

### Node: Curvature Ledger <-> curvature-ledger
- id: bridge-panel-curvature-ledger-curvature-ledger
- type: bridge
- summary: Panel curvature-ledger links to curvature-ledger via term "curvature ledger".

### Node: Curvature Ledger <-> bridge-pipeline-overview-curvature-ledger
- id: bridge-panel-curvature-ledger-bridge-pipeline-overview-curvature-ledger
- type: bridge
- summary: Panel curvature-ledger links to bridge-pipeline-overview-curvature-ledger via term "curvature ledger".

### Node: Curvature Ledger <-> ui-panel-curvature-ledger
- id: bridge-panel-curvature-ledger-ui-panel-curvature-ledger
- type: bridge
- summary: Panel curvature-ledger links to ui-panel-curvature-ledger via term "curvature ledger".

### Node: Operational Mode Switch <-> panel-concept-operational-mode
- id: bridge-panel-operational-mode-panel-concept-operational-mode
- type: bridge
- summary: Panel operational-mode links to panel-concept-operational-mode via term "station vs desktop".

### Node: Operational Mode Switch <-> panel-concept-viz-diagnostics
- id: bridge-panel-operational-mode-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel operational-mode links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Node: Operational Mode Switch <-> panel-concept-energy-flux
- id: bridge-panel-operational-mode-panel-concept-energy-flux
- type: bridge
- summary: Panel operational-mode links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Node: Operational Mode Switch <-> panel-concept-cavity-mechanism
- id: bridge-panel-operational-mode-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel operational-mode links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Node: Operational Mode Switch <-> panel-concept-shell-outline
- id: bridge-panel-operational-mode-panel-concept-shell-outline
- type: bridge
- summary: Panel operational-mode links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Node: Operational Mode Switch <-> panel-concept-curvature-slice
- id: bridge-panel-operational-mode-panel-concept-curvature-slice
- type: bridge
- summary: Panel operational-mode links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Node: Casimir Tile Grid <-> panel-concept-casimir-tile-grid
- id: bridge-panel-casimir-tile-grid-panel-concept-casimir-tile-grid
- type: bridge
- summary: Panel casimir-tile-grid links to panel-concept-casimir-tile-grid via term "Casimir tile grid".

### Node: Casimir Tile Grid <-> ui-panel-casimir-grid
- id: bridge-panel-casimir-tile-grid-ui-panel-casimir-grid
- type: bridge
- summary: Panel casimir-tile-grid links to ui-panel-casimir-grid via term "Casimir tile grid".

### Node: Casimir Tile Grid <-> casimir-tiles-tree
- id: bridge-panel-casimir-tile-grid-casimir-tiles-tree
- type: bridge
- summary: Panel casimir-tile-grid links to casimir-tiles-tree via term "Casimir tiles".

### Node: Casimir Tile Grid <-> casimir-tiles-overview
- id: bridge-panel-casimir-tile-grid-casimir-tiles-overview
- type: bridge
- summary: Panel casimir-tile-grid links to casimir-tiles-overview via term "Casimir tiles".

### Node: Casimir Tile Grid <-> panel-concept-experiment-ladder
- id: bridge-panel-casimir-tile-grid-panel-concept-experiment-ladder
- type: bridge
- summary: Panel casimir-tile-grid links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Node: Casimir Tile Grid <-> panel-concept-resonance-scheduler
- id: bridge-panel-casimir-tile-grid-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel casimir-tile-grid links to panel-concept-resonance-scheduler via term "sectorPeriod_ms".

### Node: Light-Speed Strobe Scale <-> panel-concept-light-speed-strobe
- id: bridge-panel-light-speed-strobe-panel-concept-light-speed-strobe
- type: bridge
- summary: Panel light-speed-strobe links to panel-concept-light-speed-strobe via term "light speed strobe".

### Node: Light-Speed Strobe Scale <-> sector-strobes-duty-cycle
- id: bridge-panel-light-speed-strobe-sector-strobes-duty-cycle
- type: bridge
- summary: Panel light-speed-strobe links to sector-strobes-duty-cycle via term "strobes".

### Node: Speed Capability <-> panel-concept-speed-capability
- id: bridge-panel-speed-capability-panel-concept-speed-capability
- type: bridge
- summary: Panel speed-capability links to panel-concept-speed-capability via term "translation speed".

### Node: Speed Capability <-> panel-concept-shell-outline
- id: bridge-panel-speed-capability-panel-concept-shell-outline
- type: bridge
- summary: Panel speed-capability links to panel-concept-shell-outline via term "beta".

### Node: Speed Capability <-> panel-concept-shift-vector
- id: bridge-panel-speed-capability-panel-concept-shift-vector
- type: bridge
- summary: Panel speed-capability links to panel-concept-shift-vector via term "beta".

### Node: Speed Capability <-> panel-concept-stellar-lsr
- id: bridge-panel-speed-capability-panel-concept-stellar-lsr
- type: bridge
- summary: Panel speed-capability links to panel-concept-stellar-lsr via term "km/s".

### Node: Speed Capability <-> panel-concept-drive-guards
- id: bridge-panel-speed-capability-panel-concept-drive-guards
- type: bridge
- summary: Panel speed-capability links to panel-concept-drive-guards via term "m/s".

### Node: Speed Capability <-> panel-concept-near-zero
- id: bridge-panel-speed-capability-panel-concept-near-zero
- type: bridge
- summary: Panel speed-capability links to panel-concept-near-zero via term "m/s".

### Node: Helix Casimir Amplifier <-> panel-concept-helix-casimir-amplifier
- id: bridge-panel-helix-casimir-amplifier-panel-concept-helix-casimir-amplifier
- type: bridge
- summary: Panel helix-casimir-amplifier links to panel-concept-helix-casimir-amplifier via term "Casimir amplifier".

### Node: Helix Casimir Amplifier <-> ui-panel-casimir-amplifier
- id: bridge-panel-helix-casimir-amplifier-ui-panel-casimir-amplifier
- type: bridge
- summary: Panel helix-casimir-amplifier links to ui-panel-casimir-amplifier via term "Casimir amplifier".

### Node: Helix Casimir Amplifier <-> panel-concept-vacuum-contract
- id: bridge-panel-helix-casimir-amplifier-panel-concept-vacuum-contract
- type: bridge
- summary: Panel helix-casimir-amplifier links to panel-concept-vacuum-contract via term "modulationFreq_GHz".

### Node: Resonance Scheduler <-> panel-concept-resonance-scheduler
- id: bridge-panel-resonance-scheduler-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel resonance-scheduler links to panel-concept-resonance-scheduler via term "resonance scheduler".

### Node: Resonance Scheduler <-> phase-scheduler
- id: bridge-panel-resonance-scheduler-phase-scheduler
- type: bridge
- summary: Panel resonance-scheduler links to phase-scheduler via term "phase scheduler".

### Node: Resonance Scheduler <-> panel-concept-qi-auto-tuner
- id: bridge-panel-resonance-scheduler-panel-concept-qi-auto-tuner
- type: bridge
- summary: Panel resonance-scheduler links to panel-concept-qi-auto-tuner via term "auto duty".

### Node: Resonance Scheduler <-> panel-concept-experiment-ladder
- id: bridge-panel-resonance-scheduler-panel-concept-experiment-ladder
- type: bridge
- summary: Panel resonance-scheduler links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Node: Resonance Scheduler <-> panel-concept-casimir-tile-grid
- id: bridge-panel-resonance-scheduler-panel-concept-casimir-tile-grid
- type: bridge
- summary: Panel resonance-scheduler links to panel-concept-casimir-tile-grid via term "sectorPeriod_ms".

### Node: Resonance Scheduler <-> panel-concept-sector-roles
- id: bridge-panel-resonance-scheduler-panel-concept-sector-roles
- type: bridge
- summary: Panel resonance-scheduler links to panel-concept-sector-roles via term "sectorPeriod_ms".

### Node: Trip Player <-> panel-concept-trip-player
- id: bridge-panel-trip-player-panel-concept-trip-player
- type: bridge
- summary: Panel trip-player links to panel-concept-trip-player via term "timeline playback".

### Node: Trip Player <-> panel-concept-fuel-gauge
- id: bridge-panel-trip-player-panel-concept-fuel-gauge
- type: bridge
- summary: Panel trip-player links to panel-concept-fuel-gauge via term "computeEffectiveLyPerHour".

### Node: Trip Player <-> agi-constraint-packs
- id: bridge-panel-trip-player-agi-constraint-packs
- type: bridge
- summary: Panel trip-player links to agi-constraint-packs via term "constraints".

### Node: Trip Player <-> noise-field-loop
- id: bridge-panel-trip-player-noise-field-loop
- type: bridge
- summary: Panel trip-player links to noise-field-loop via term "constraints".

### Node: Trip Player <-> diffusion-loop
- id: bridge-panel-trip-player-diffusion-loop
- type: bridge
- summary: Panel trip-player links to diffusion-loop via term "constraints".

### Node: Trip Player <-> constraint-loop
- id: bridge-panel-trip-player-constraint-loop
- type: bridge
- summary: Panel trip-player links to constraint-loop via term "constraints".

### Node: Fuel Gauge <-> panel-concept-fuel-gauge
- id: bridge-panel-fuel-gauge-panel-concept-fuel-gauge
- type: bridge
- summary: Panel fuel-gauge links to panel-concept-fuel-gauge via term "energy reserve".

### Node: Fuel Gauge <-> panel-concept-trip-player
- id: bridge-panel-fuel-gauge-panel-concept-trip-player
- type: bridge
- summary: Panel fuel-gauge links to panel-concept-trip-player via term "computeEffectiveLyPerHour".

### Node: Fuel Gauge <-> schema-confidence-stack
- id: bridge-panel-fuel-gauge-schema-confidence-stack
- type: bridge
- summary: Panel fuel-gauge links to schema-confidence-stack via term "telemetry".

### Node: Fuel Gauge <-> debate-telemetry
- id: bridge-panel-fuel-gauge-debate-telemetry
- type: bridge
- summary: Panel fuel-gauge links to debate-telemetry via term "telemetry".

### Node: Fuel Gauge <-> hardware-telemetry-tree
- id: bridge-panel-fuel-gauge-hardware-telemetry-tree
- type: bridge
- summary: Panel fuel-gauge links to hardware-telemetry-tree via term "telemetry".

### Node: Fuel Gauge <-> panel-concept-energy-flux
- id: bridge-panel-fuel-gauge-panel-concept-energy-flux
- type: bridge
- summary: Panel fuel-gauge links to panel-concept-energy-flux via term "telemetry".

### Node: Vacuum Contract <-> panel-concept-vacuum-contract
- id: bridge-panel-vacuum-contract-panel-concept-vacuum-contract
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-vacuum-contract via term "negative energy covenant".

### Node: Vacuum Contract <-> panel-concept-helix-casimir-amplifier
- id: bridge-panel-vacuum-contract-panel-concept-helix-casimir-amplifier
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-helix-casimir-amplifier via term "modulationFreq_GHz".

### Node: Vacuum Contract <-> panel-concept-tokamak-sim
- id: bridge-panel-vacuum-contract-panel-concept-tokamak-sim
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-tokamak-sim via term "formatNumber".

### Node: Vacuum Contract <-> panel-concept-viz-diagnostics
- id: bridge-panel-vacuum-contract-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-viz-diagnostics via term "dutyCycle".

### Node: Vacuum Contract <-> panel-concept-energy-flux
- id: bridge-panel-vacuum-contract-panel-concept-energy-flux
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-energy-flux via term "dutyCycle".

### Node: Vacuum Contract <-> panel-concept-cavity-mechanism
- id: bridge-panel-vacuum-contract-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel vacuum-contract links to panel-concept-cavity-mechanism via term "dutyCycle".

### Node: Metric Amplification Pocket <-> panel-concept-metric-pocket
- id: bridge-panel-metric-pocket-panel-concept-metric-pocket
- type: bridge
- summary: Panel metric-pocket links to panel-concept-metric-pocket via term "amplification pocket".

### Node: Metric Amplification Pocket <-> panel-concept-viz-diagnostics
- id: bridge-panel-metric-pocket-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel metric-pocket links to panel-concept-viz-diagnostics via term "deltaAOverA".

### Node: Metric Amplification Pocket <-> panel-concept-cavity-mechanism
- id: bridge-panel-metric-pocket-panel-concept-cavity-mechanism
- type: bridge
- summary: Panel metric-pocket links to panel-concept-cavity-mechanism via term "deltaAOverA".

### Node: Metric Amplification Pocket <-> panel-concept-needle-ipeak-worksheet
- id: bridge-panel-metric-pocket-panel-concept-needle-ipeak-worksheet
- type: bridge
- summary: Panel metric-pocket links to panel-concept-needle-ipeak-worksheet via term "normalized".

### Node: Metric Amplification Pocket <-> panel-concept-energy-flux
- id: bridge-panel-metric-pocket-panel-concept-energy-flux
- type: bridge
- summary: Panel metric-pocket links to panel-concept-energy-flux via term "effective".

### Node: Metric Amplification Pocket <-> panel-concept-drive-guards
- id: bridge-panel-metric-pocket-panel-concept-drive-guards
- type: bridge
- summary: Panel metric-pocket links to panel-concept-drive-guards via term "effective".

### Node: HaloBank Timeline <-> panel-concept-halobank
- id: bridge-panel-halobank-panel-concept-halobank
- type: bridge
- summary: Panel halobank links to panel-concept-halobank via term "bank history".

### Node: HaloBank Timeline <-> halobank
- id: bridge-panel-halobank-halobank
- type: bridge
- summary: Panel halobank links to halobank via term "HaloBank".

### Node: HaloBank Timeline <-> ui-panel-halobank
- id: bridge-panel-halobank-ui-panel-halobank
- type: bridge
- summary: Panel halobank links to ui-panel-halobank via term "HaloBank".

### Node: HaloBank Timeline <-> panel-concept-needle-world-roadmap
- id: bridge-panel-halobank-panel-concept-needle-world-roadmap
- type: bridge
- summary: Panel halobank links to panel-concept-needle-world-roadmap via term "timeline".

### Node: HaloBank Timeline <-> panel-concept-resonance-scheduler
- id: bridge-panel-halobank-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel halobank links to panel-concept-resonance-scheduler via term "timeline".

### Node: HaloBank Timeline <-> panel-concept-trip-player
- id: bridge-panel-halobank-panel-concept-trip-player
- type: bridge
- summary: Panel halobank links to panel-concept-trip-player via term "timeline".

### Node: Qi Widget <-> panel-concept-qi-widget
- id: bridge-panel-qi-widget-panel-concept-qi-widget
- type: bridge
- summary: Panel qi-widget links to panel-concept-qi-widget via term "quantum inequality".

### Node: Qi Widget <-> panel-concept-qi-auto-tuner
- id: bridge-panel-qi-widget-panel-concept-qi-auto-tuner
- type: bridge
- summary: Panel qi-widget links to panel-concept-qi-auto-tuner via term "quantum inequality".

### Node: Qi Widget <-> qi-bounds
- id: bridge-panel-qi-widget-qi-bounds
- type: bridge
- summary: Panel qi-widget links to qi-bounds via term "quantum inequality".

### Node: Qi Widget <-> ford-roman-quantum-inequality
- id: bridge-panel-qi-widget-ford-roman-quantum-inequality
- type: bridge
- summary: Panel qi-widget links to ford-roman-quantum-inequality via term "quantum inequality".

### Node: Qi Widget <-> uncertainty-quantum-inequality
- id: bridge-panel-qi-widget-uncertainty-quantum-inequality
- type: bridge
- summary: Panel qi-widget links to uncertainty-quantum-inequality via term "quantum inequality".

### Node: Qi Widget <-> panel-concept-experiment-ladder
- id: bridge-panel-qi-widget-panel-concept-experiment-ladder
- type: bridge
- summary: Panel qi-widget links to panel-concept-experiment-ladder via term "Ford-Roman".

### Node: QI Auto-Tuner <-> panel-concept-qi-auto-tuner
- id: bridge-panel-qi-auto-tuner-panel-concept-qi-auto-tuner
- type: bridge
- summary: Panel qi-auto-tuner links to panel-concept-qi-auto-tuner via term "quantum inequality tuner".

### Node: QI Auto-Tuner <-> panel-concept-resonance-scheduler
- id: bridge-panel-qi-auto-tuner-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel qi-auto-tuner links to panel-concept-resonance-scheduler via term "auto duty".

### Node: Sector Legend <-> panel-concept-sector-legend
- id: bridge-panel-sector-legend-panel-concept-sector-legend
- type: bridge
- summary: Panel sector-legend links to panel-concept-sector-legend via term "sector palette".

### Node: Sector Roles HUD <-> panel-concept-sector-roles
- id: bridge-panel-sector-roles-panel-concept-sector-roles
- type: bridge
- summary: Panel sector-roles links to panel-concept-sector-roles via term "sector overlay".

### Node: Sector Roles HUD <-> panel-concept-sector-legend
- id: bridge-panel-sector-roles-panel-concept-sector-legend
- type: bridge
- summary: Panel sector-roles links to panel-concept-sector-legend via term "role legend".

### Node: Sector Roles HUD <-> ui-hud-sector
- id: bridge-panel-sector-roles-ui-hud-sector
- type: bridge
- summary: Panel sector-roles links to ui-hud-sector via term "sector HUD".

### Node: Sector Roles HUD <-> panel-concept-experiment-ladder
- id: bridge-panel-sector-roles-panel-concept-experiment-ladder
- type: bridge
- summary: Panel sector-roles links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Node: Sector Roles HUD <-> panel-concept-casimir-tile-grid
- id: bridge-panel-sector-roles-panel-concept-casimir-tile-grid
- type: bridge
- summary: Panel sector-roles links to panel-concept-casimir-tile-grid via term "sectorPeriod_ms".

### Node: Sector Roles HUD <-> panel-concept-resonance-scheduler
- id: bridge-panel-sector-roles-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel sector-roles links to panel-concept-resonance-scheduler via term "sectorPeriod_ms".

### Node: Sweep Replay Controls <-> panel-concept-sweep-replay
- id: bridge-panel-sweep-replay-panel-concept-sweep-replay
- type: bridge
- summary: Panel sweep-replay links to panel-concept-sweep-replay via term "sweep telemetry".

### Node: Sweep Replay Controls <-> panel-concept-mass-provenance
- id: bridge-panel-sweep-replay-panel-concept-mass-provenance
- type: bridge
- summary: Panel sweep-replay links to panel-concept-mass-provenance via term "center".

### Node: Sweep Replay Controls <-> panel-concept-agi-task-history
- id: bridge-panel-sweep-replay-panel-concept-agi-task-history
- type: bridge
- summary: Panel sweep-replay links to panel-concept-agi-task-history via term "center".

### Node: Sweep Replay Controls <-> panel-concept-viz-diagnostics
- id: bridge-panel-sweep-replay-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel sweep-replay links to panel-concept-viz-diagnostics via term "react".

### Node: Sweep Replay Controls <-> panel-concept-nav-system
- id: bridge-panel-sweep-replay-panel-concept-nav-system
- type: bridge
- summary: Panel sweep-replay links to panel-concept-nav-system via term "react".

### Node: Sweep Replay Controls <-> panel-concept-deepmix-solar
- id: bridge-panel-sweep-replay-panel-concept-deepmix-solar
- type: bridge
- summary: Panel sweep-replay links to panel-concept-deepmix-solar via term "react".

### Node: Runtime Ops <-> panel-concept-hull-status
- id: bridge-panel-hull-status-panel-concept-hull-status
- type: bridge
- summary: Panel hull-status links to panel-concept-hull-status via term "queue telemetry".

### Node: Runtime Ops <-> bridge-solar-restoration-plan-deep-mixing-plan
- id: bridge-panel-hull-status-bridge-solar-restoration-plan-deep-mixing-plan
- type: bridge
- summary: Panel hull-status links to bridge-solar-restoration-plan-deep-mixing-plan via term "plan b".

### Node: Runtime Ops <-> panel-concept-viz-diagnostics
- id: bridge-panel-hull-status-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel hull-status links to panel-concept-viz-diagnostics via term "className".

### Node: Runtime Ops <-> panel-concept-mass-provenance
- id: bridge-panel-hull-status-panel-concept-mass-provenance
- type: bridge
- summary: Panel hull-status links to panel-concept-mass-provenance via term "className".

### Node: Runtime Ops <-> panel-concept-universal-audit-tree
- id: bridge-panel-hull-status-panel-concept-universal-audit-tree
- type: bridge
- summary: Panel hull-status links to panel-concept-universal-audit-tree via term "className".

### Node: Runtime Ops <-> panel-concept-warp-ledger
- id: bridge-panel-hull-status-panel-concept-warp-ledger
- type: bridge
- summary: Panel hull-status links to panel-concept-warp-ledger via term "className".

### Node: Debate View <-> panel-concept-agi-debate-view
- id: bridge-panel-agi-debate-view-panel-concept-agi-debate-view
- type: bridge
- summary: Panel agi-debate-view links to panel-concept-agi-debate-view via term "multi agent debate".

### Node: Debate View <-> panel-concept-agi-essence-console
- id: bridge-panel-agi-debate-view-panel-concept-agi-essence-console
- type: bridge
- summary: Panel agi-debate-view links to panel-concept-agi-essence-console via term "useDebateTelemetry".

### Node: Debate View <-> panel-concept-star-coherence
- id: bridge-panel-agi-debate-view-panel-concept-star-coherence
- type: bridge
- summary: Panel agi-debate-view links to panel-concept-star-coherence via term "useDebateTelemetry".

### Node: Debate View <-> panel-concept-collapse-monitor
- id: bridge-panel-agi-debate-view-panel-concept-collapse-monitor
- type: bridge
- summary: Panel agi-debate-view links to panel-concept-collapse-monitor via term "useDebateTelemetry".

### Node: Debate View <-> panel-concept-star-watcher
- id: bridge-panel-agi-debate-view-panel-concept-star-watcher
- type: bridge
- summary: Panel agi-debate-view links to panel-concept-star-watcher via term "global_coherence".

### Node: Essence Console <-> panel-concept-agi-essence-console
- id: bridge-panel-agi-essence-console-panel-concept-agi-essence-console
- type: bridge
- summary: Panel agi-essence-console links to panel-concept-agi-essence-console via term "Essence console".

### Node: Star Coherence Governor <-> coherence-governor
- id: bridge-panel-star-coherence-coherence-governor
- type: bridge
- summary: Panel star-coherence links to coherence-governor via term "coherence governor".

### Node: Star Coherence Governor <-> panel-concept-star-coherence
- id: bridge-panel-star-coherence-panel-concept-star-coherence
- type: bridge
- summary: Panel star-coherence links to panel-concept-star-coherence via term "coherence governor".

### Node: Star Coherence Governor <-> uncertainty-coherence-policy
- id: bridge-panel-star-coherence-uncertainty-coherence-policy
- type: bridge
- summary: Panel star-coherence links to uncertainty-coherence-policy via term "coherence governor".

### Node: Star Coherence Governor <-> schema-confidence-stack
- id: bridge-panel-star-coherence-schema-confidence-stack
- type: bridge
- summary: Panel star-coherence links to schema-confidence-stack via term "telemetry".

### Node: Star Coherence Governor <-> debate-telemetry
- id: bridge-panel-star-coherence-debate-telemetry
- type: bridge
- summary: Panel star-coherence links to debate-telemetry via term "telemetry".

### Node: Star Coherence Governor <-> hardware-telemetry-tree
- id: bridge-panel-star-coherence-hardware-telemetry-tree
- type: bridge
- summary: Panel star-coherence links to hardware-telemetry-tree via term "telemetry".

### Node: Pipeline Proof <-> agi-planner-core
- id: bridge-panel-pipeline-proof-agi-planner-core
- type: bridge
- summary: Panel pipeline-proof links to agi-planner-core via term "grounding".

### Node: Pipeline Proof <-> bridge-agi-plan-execute-agi-planner-core
- id: bridge-panel-pipeline-proof-bridge-agi-plan-execute-agi-planner-core
- type: bridge
- summary: Panel pipeline-proof links to bridge-agi-plan-execute-agi-planner-core via term "grounding".

### Node: Pipeline Proof <-> panel-concept-pipeline-proof
- id: bridge-panel-pipeline-proof-panel-concept-pipeline-proof
- type: bridge
- summary: Panel pipeline-proof links to panel-concept-pipeline-proof via term "grounding".

### Node: Pipeline Proof <-> panel-concept-resonance-scheduler
- id: bridge-panel-pipeline-proof-panel-concept-resonance-scheduler
- type: bridge
- summary: Panel pipeline-proof links to panel-concept-resonance-scheduler via term "resonance".

### Node: Pipeline Proof <-> resonance-tree
- id: bridge-panel-pipeline-proof-resonance-tree
- type: bridge
- summary: Panel pipeline-proof links to resonance-tree via term "resonance".

### Node: Pipeline Proof <-> code-lattice-core
- id: bridge-panel-pipeline-proof-code-lattice-core
- type: bridge
- summary: Panel pipeline-proof links to code-lattice-core via term "resonance".

### Node: Collapse Watch <-> panel-concept-collapse-monitor
- id: bridge-panel-collapse-monitor-panel-concept-collapse-monitor
- type: bridge
- summary: Panel collapse-monitor links to panel-concept-collapse-monitor via term "collapse pressure".

### Node: Collapse Watch <-> panel-concept-star-coherence
- id: bridge-panel-collapse-monitor-panel-concept-star-coherence
- type: bridge
- summary: Panel collapse-monitor links to panel-concept-star-coherence via term "useCoherenceTelemetry".

### Node: Collapse Watch <-> panel-concept-agi-debate-view
- id: bridge-panel-collapse-monitor-panel-concept-agi-debate-view
- type: bridge
- summary: Panel collapse-monitor links to panel-concept-agi-debate-view via term "useDebateTelemetry".

### Node: Collapse Watch <-> panel-concept-agi-essence-console
- id: bridge-panel-collapse-monitor-panel-concept-agi-essence-console
- type: bridge
- summary: Panel collapse-monitor links to panel-concept-agi-essence-console via term "useDebateTelemetry".

### Node: Collapse Watch <-> panel-concept-star-watcher
- id: bridge-panel-collapse-monitor-panel-concept-star-watcher
- type: bridge
- summary: Panel collapse-monitor links to panel-concept-star-watcher via term "global_coherence".

### Node: Collapse Benchmark HUD <-> panel-concept-collapse-benchmark-hud
- id: bridge-panel-collapse-benchmark-hud-panel-concept-collapse-benchmark-hud
- type: bridge
- summary: Panel collapse-benchmark-hud links to panel-concept-collapse-benchmark-hud via term "collapse benchmark".

### Node: Collapse Benchmark HUD <-> collapse-benchmark-stack
- id: bridge-panel-collapse-benchmark-hud-collapse-benchmark-stack
- type: bridge
- summary: Panel collapse-benchmark-hud links to collapse-benchmark-stack via term "collapse benchmark".

### Node: Collapse Benchmark HUD <-> binding-collapse-benchmark
- id: bridge-panel-collapse-benchmark-hud-binding-collapse-benchmark
- type: bridge
- summary: Panel collapse-benchmark-hud links to binding-collapse-benchmark via term "collapse benchmark".

### Node: Collapse Benchmark HUD <-> ui-hud-collapse
- id: bridge-panel-collapse-benchmark-hud-ui-hud-collapse
- type: bridge
- summary: Panel collapse-benchmark-hud links to ui-hud-collapse via term "collapse benchmark".

### Node: Collapse Benchmark HUD <-> uncertainty-collapse-benchmark
- id: bridge-panel-collapse-benchmark-hud-uncertainty-collapse-benchmark
- type: bridge
- summary: Panel collapse-benchmark-hud links to uncertainty-collapse-benchmark via term "collapse benchmark".

### Node: Collapse Benchmark HUD <-> panel-concept-helix-phoenix
- id: bridge-panel-collapse-benchmark-hud-panel-concept-helix-phoenix
- type: bridge
- summary: Panel collapse-benchmark-hud links to panel-concept-helix-phoenix via term "kappa".

### Node: Task History <-> panel-concept-agi-task-history
- id: bridge-panel-agi-task-history-panel-concept-agi-task-history
- type: bridge
- summary: Panel agi-task-history links to panel-concept-agi-task-history via term "trace timeline".

### Node: Noise Gens <-> panel-concept-helix-noise-gens
- id: bridge-panel-helix-noise-gens-panel-concept-helix-noise-gens
- type: bridge
- summary: Panel helix-noise-gens links to panel-concept-helix-noise-gens via term "render plan".

### Node: Noise Gens <-> ui-panel-noise-gen
- id: bridge-panel-helix-noise-gens-ui-panel-noise-gen
- type: bridge
- summary: Panel helix-noise-gens links to ui-panel-noise-gen via term "noise gen".

### Node: Noise Gens <-> ui-panel-noise-gens
- id: bridge-panel-helix-noise-gens-ui-panel-noise-gens
- type: bridge
- summary: Panel helix-noise-gens links to ui-panel-noise-gens via term "noise gen".

### Node: Noise Gens <-> coverage-gate
- id: bridge-panel-helix-noise-gens-coverage-gate
- type: bridge
- summary: Panel helix-noise-gens links to coverage-gate via term "cover".

### Node: Noise Gens <-> panel-concept-math-maturity-tree
- id: bridge-panel-helix-noise-gens-panel-concept-math-maturity-tree
- type: bridge
- summary: Panel helix-noise-gens links to panel-concept-math-maturity-tree via term "cover".

### Node: Noise Gens <-> civic-governance-stack
- id: bridge-panel-helix-noise-gens-civic-governance-stack
- type: bridge
- summary: Panel helix-noise-gens links to civic-governance-stack via term "stems".

### Node: Constraint Pack Policies <-> agi-constraint-packs
- id: bridge-panel-constraint-pack-policy-agi-constraint-packs
- type: bridge
- summary: Panel constraint-pack-policy links to agi-constraint-packs via term "constraint packs".

### Node: Constraint Pack Policies <-> panel-concept-constraint-pack-policy
- id: bridge-panel-constraint-pack-policy-panel-concept-constraint-pack-policy
- type: bridge
- summary: Panel constraint-pack-policy links to panel-concept-constraint-pack-policy via term "constraint packs".

### Node: Constraint Pack Policies <-> constraint-packs
- id: bridge-panel-constraint-pack-policy-constraint-packs
- type: bridge
- summary: Panel constraint-pack-policy links to constraint-packs via term "constraint packs".

### Node: Constraint Pack Policies <-> panel-concept-math-maturity-tree
- id: bridge-panel-constraint-pack-policy-panel-concept-math-maturity-tree
- type: bridge
- summary: Panel constraint-pack-policy links to panel-concept-math-maturity-tree via term "generated".

### Node: Constraint Pack Policies <-> panel-concept-universal-audit-tree
- id: bridge-panel-constraint-pack-policy-panel-concept-universal-audit-tree
- type: bridge
- summary: Panel constraint-pack-policy links to panel-concept-universal-audit-tree via term "generated".

### Node: Constraint Pack Policies <-> panel-concept-energy-flux
- id: bridge-panel-constraint-pack-policy-panel-concept-energy-flux
- type: bridge
- summary: Panel constraint-pack-policy links to panel-concept-energy-flux via term "auto".

### Node: Contribution Workbench <-> agi-contributions
- id: bridge-panel-agi-contribution-workbench-agi-contributions
- type: bridge
- summary: Panel agi-contribution-workbench links to agi-contributions via term "contribution".

### Node: Contribution Workbench <-> panel-concept-agi-contribution-workbench
- id: bridge-panel-agi-contribution-workbench-panel-concept-agi-contribution-workbench
- type: bridge
- summary: Panel agi-contribution-workbench links to panel-concept-agi-contribution-workbench via term "contribution".

### Node: Contribution Workbench <-> agi-constraint-packs
- id: bridge-panel-agi-contribution-workbench-agi-constraint-packs
- type: bridge
- summary: Panel agi-contribution-workbench links to agi-constraint-packs via term "verification".

### Node: Contribution Workbench <-> casimir-tiles-tree
- id: bridge-panel-agi-contribution-workbench-casimir-tiles-tree
- type: bridge
- summary: Panel agi-contribution-workbench links to casimir-tiles-tree via term "verification".

### Node: Contribution Workbench <-> casimir-tile-schematic-roadmap
- id: bridge-panel-agi-contribution-workbench-casimir-tile-schematic-roadmap
- type: bridge
- summary: Panel agi-contribution-workbench links to casimir-tile-schematic-roadmap via term "verification".

### Node: Contribution Workbench <-> certainty-motivation
- id: bridge-panel-agi-contribution-workbench-certainty-motivation
- type: bridge
- summary: Panel agi-contribution-workbench links to certainty-motivation via term "verification".

### Node: PNG Edge Cutter <-> panel-concept-remove-bg-edges
- id: bridge-panel-remove-bg-edges-panel-concept-remove-bg-edges
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-remove-bg-edges via term "background removal".

### Node: PNG Edge Cutter <-> panel-concept-dresscode
- id: bridge-panel-remove-bg-edges-panel-concept-dresscode
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-dresscode via term "mask".

### Node: PNG Edge Cutter <-> panel-concept-helix-noise-gens
- id: bridge-panel-remove-bg-edges-panel-concept-helix-noise-gens
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-helix-noise-gens via term "useCallback".

### Node: PNG Edge Cutter <-> panel-concept-viz-diagnostics
- id: bridge-panel-remove-bg-edges-panel-concept-viz-diagnostics
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-viz-diagnostics via term "className".

### Node: PNG Edge Cutter <-> panel-concept-mass-provenance
- id: bridge-panel-remove-bg-edges-panel-concept-mass-provenance
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-mass-provenance via term "className".

### Node: PNG Edge Cutter <-> panel-concept-universal-audit-tree
- id: bridge-panel-remove-bg-edges-panel-concept-universal-audit-tree
- type: bridge
- summary: Panel remove-bg-edges links to panel-concept-universal-audit-tree via term "className".

### Node: Dresscode Drafting <-> panel-concept-dresscode
- id: bridge-panel-dresscode-panel-concept-dresscode
- type: bridge
- summary: Panel dresscode links to panel-concept-dresscode via term "dresscode".

### Node: Dresscode Drafting <-> panel-concept-constraint-pack-policy
- id: bridge-panel-dresscode-panel-concept-constraint-pack-policy
- type: bridge
- summary: Panel dresscode links to panel-concept-constraint-pack-policy via term "draft".

### Node: Dresscode Drafting <-> panel-concept-fractional-coherence-grid
- id: bridge-panel-dresscode-panel-concept-fractional-coherence-grid
- type: bridge
- summary: Panel dresscode links to panel-concept-fractional-coherence-grid via term "grid".

### Node: Dresscode Drafting <-> panel-concept-alcubierre-viewer
- id: bridge-panel-dresscode-panel-concept-alcubierre-viewer
- type: bridge
- summary: Panel dresscode links to panel-concept-alcubierre-viewer via term "grid".

### Node: Dresscode Drafting <-> panel-concept-model-silhouette
- id: bridge-panel-dresscode-panel-concept-model-silhouette
- type: bridge
- summary: Panel dresscode links to panel-concept-model-silhouette via term "grid".

### Node: Dresscode Drafting <-> panel-concept-time-dilation-lattice
- id: bridge-panel-dresscode-panel-concept-time-dilation-lattice
- type: bridge
- summary: Panel dresscode links to panel-concept-time-dilation-lattice via term "grid".

### Node: Stellar LSR Viewer <-> panel-concept-stellar-lsr
- id: bridge-panel-stellar-lsr-panel-concept-stellar-lsr
- type: bridge
- summary: Panel stellar-lsr links to panel-concept-stellar-lsr via term "local standard of rest".

### Node: Stellar LSR Viewer <-> panel-concept-star-hydrostatic
- id: bridge-panel-stellar-lsr-panel-concept-star-hydrostatic
- type: bridge
- summary: Panel stellar-lsr links to panel-concept-star-hydrostatic via term "stellar".

### Node: Stellar LSR Viewer <-> stellar-ledger
- id: bridge-panel-stellar-lsr-stellar-ledger
- type: bridge
- summary: Panel stellar-lsr links to stellar-ledger via term "stellar".

### Node: Stellar LSR Viewer <-> stellar-restoration-tree
- id: bridge-panel-stellar-lsr-stellar-restoration-tree
- type: bridge
- summary: Panel stellar-lsr links to stellar-restoration-tree via term "stellar".

### Node: Stellar LSR Viewer <-> stellar-structure-stack
- id: bridge-panel-stellar-lsr-stellar-structure-stack
- type: bridge
- summary: Panel stellar-lsr links to stellar-structure-stack via term "stellar".

### Node: Stellar LSR Viewer <-> stellar-evolution-stack
- id: bridge-panel-stellar-lsr-stellar-evolution-stack
- type: bridge
- summary: Panel stellar-lsr links to stellar-evolution-stack via term "stellar".

### Node: Essence Proposals <-> panel-concept-essence-proposals
- id: bridge-panel-essence-proposals-panel-concept-essence-proposals
- type: bridge
- summary: Panel essence-proposals links to panel-concept-essence-proposals via term "essence proposals".

## Bridges

### Bridge: Viz Diagnostics HUD <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-viz-diagnostics via term "diagnostics overlay".

### Bridge: Viz Diagnostics HUD <-> panel-concept-hull-metrics-vis
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-hull-metrics-vis via term "qSpoilingFactor".

### Bridge: Viz Diagnostics HUD <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Bridge: Viz Diagnostics HUD <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Bridge: Viz Diagnostics HUD <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Bridge: Viz Diagnostics HUD <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel viz-diagnostics links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Bridge: Energy Flux Stability <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-energy-flux via term "R = (phi_A)/(I3 + |T|)".

### Bridge: Energy Flux Stability <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Bridge: Energy Flux Stability <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Bridge: Energy Flux Stability <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Bridge: Energy Flux Stability <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Bridge: Energy Flux Stability <-> panel-concept-operational-mode
- relation: Panel cross-concept join
- summary: Panel energy-flux links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Bridge: Phoenix Averaging <-> panel-concept-helix-phoenix
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to panel-concept-helix-phoenix via term "phoenix averaging".

### Bridge: Phoenix Averaging <-> phoenix-averaging
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to phoenix-averaging via term "phoenix averaging".

### Bridge: Phoenix Averaging <-> casimir-tiles-tree
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to casimir-tiles-tree via term "casimir tile".

### Bridge: Phoenix Averaging <-> casimir-tiles-overview
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to casimir-tiles-overview via term "casimir tile".

### Bridge: Phoenix Averaging <-> casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to casimir-tile-mechanism via term "casimir tile".

### Bridge: Phoenix Averaging <-> casimir-tile-roadmap
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to casimir-tile-roadmap via term "casimir tile".

### Bridge: Microscopy Mode <-> panel-concept-microscopy
- relation: Panel cross-concept join
- summary: Panel microscopy links to panel-concept-microscopy via term "microscopy mode".

### Bridge: Microscopy Mode <-> panel-concept-pipeline-proof
- relation: Panel cross-concept join
- summary: Panel microscopy links to panel-concept-pipeline-proof via term "useEnergyPipeline".

### Bridge: Needle I_peak Worksheet <-> panel-concept-needle-ipeak-worksheet
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to panel-concept-needle-ipeak-worksheet via term "pulsed power".

### Bridge: Needle I_peak Worksheet <-> panel-concept-pulsed-power-doc
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to panel-concept-pulsed-power-doc via term "pulsed power".

### Bridge: Needle I_peak Worksheet <-> warp-pulsed-power
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to warp-pulsed-power via term "pulsed power".

### Bridge: Needle I_peak Worksheet <-> panel-concept-helix-phoenix
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to panel-concept-helix-phoenix via term "needle hull".

### Bridge: Needle I_peak Worksheet <-> panel-concept-metric-pocket
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to panel-concept-metric-pocket via term "normalized".

### Bridge: Needle I_peak Worksheet <-> panel-concept-gr-agent-loop-audit
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to panel-concept-gr-agent-loop-audit via term "undefined".

### Bridge: Needle World Roadmap <-> panel-concept-needle-world-roadmap
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to panel-concept-needle-world-roadmap via term "needle roadmap".

### Bridge: Needle World Roadmap <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to panel-concept-resonance-scheduler via term "timeline".

### Bridge: Needle World Roadmap <-> panel-concept-trip-player
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to panel-concept-trip-player via term "timeline".

### Bridge: Needle World Roadmap <-> panel-concept-halobank
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to panel-concept-halobank via term "timeline".

### Bridge: Needle World Roadmap <-> panel-concept-agi-task-history
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to panel-concept-agi-task-history via term "timeline".

### Bridge: Needle World Roadmap <-> ts-ratio-guardrail
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to ts-ratio-guardrail via term "TS_ratio".

### Bridge: Electron Orbital Simulator <-> panel-concept-electron-orbital
- relation: Panel cross-concept join
- summary: Panel electron-orbital links to panel-concept-electron-orbital via term "toroidal packets".

### Bridge: Electron Orbital Simulator <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel electron-orbital links to panel-concept-cavity-mechanism via term "formatPercent".

### Bridge: Electron Orbital Simulator <-> panel-concept-near-zero
- relation: Panel cross-concept join
- summary: Panel electron-orbital links to panel-concept-near-zero via term "formatPercent".

### Bridge: Electron Orbital Simulator <-> panel-concept-operational-mode
- relation: Panel cross-concept join
- summary: Panel electron-orbital links to panel-concept-operational-mode via term "formatPercent".

### Bridge: Drive Guards <-> panel-concept-drive-guards
- relation: Panel cross-concept join
- summary: Panel drive-guards links to panel-concept-drive-guards via term "sector strobing".

### Bridge: Mass Provenance <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel mass-provenance links to panel-concept-mass-provenance via term "override warnings".

### Bridge: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-audit
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-audit via term "warp constraints".

### Bridge: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-learning
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-learning via term "accepted config".

### Bridge: GR Agent Loop Audit <-> panel-concept-gr-agent-loop-kpis
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to panel-concept-gr-agent-loop-kpis via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> ui-panel-gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to ui-panel-gr-agent-loop via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-agent-loop via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> gr-agent-loop-schema
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-agent-loop-schema via term "gr agent loop".

### Bridge: GR Loop KPIs <-> panel-concept-gr-agent-loop-kpis
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to panel-concept-gr-agent-loop-kpis via term "constraint violations".

### Bridge: GR Loop KPIs <-> panel-concept-gr-agent-loop-audit
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to panel-concept-gr-agent-loop-audit via term "gr agent loop".

### Bridge: GR Loop KPIs <-> ui-panel-gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to ui-panel-gr-agent-loop via term "gr agent loop".

### Bridge: GR Loop KPIs <-> gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop via term "gr agent loop".

### Bridge: GR Loop KPIs <-> gr-agent-loop-schema
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop-schema via term "gr agent loop".

### Bridge: GR Loop Learning <-> panel-concept-gr-agent-loop-learning
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-learning links to panel-concept-gr-agent-loop-learning via term "accepted config history".

### Bridge: GR Loop Learning <-> agi-learning-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-learning links to agi-learning-loop via term "learning loop".

### Bridge: GR Loop Learning <-> panel-concept-gr-agent-loop-audit
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-learning links to panel-concept-gr-agent-loop-audit via term "residualSeries".

### Bridge: Math Maturity Tree <-> panel-concept-math-maturity-tree
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to panel-concept-math-maturity-tree via term "math maturity".

### Bridge: Math Maturity Tree <-> ui-panel-math-maturity
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to ui-panel-math-maturity via term "math maturity".

### Bridge: Math Maturity Tree <-> math-maturity-tree
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to math-maturity-tree via term "math maturity".

### Bridge: Math Maturity Tree <-> math-maturity-stages
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to math-maturity-stages via term "math maturity".

### Bridge: Math Maturity Tree <-> bridge-math-maturity-stages-math-evidence-registry
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to bridge-math-maturity-stages-math-evidence-registry via term "math maturity".

### Bridge: Math Maturity Tree <-> panel-concept-universal-audit-tree
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to panel-concept-universal-audit-tree via term "repo audit".

### Bridge: Universal Audit Tree <-> panel-concept-universal-audit-tree
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-universal-audit-tree via term "verification map".

### Bridge: Universal Audit Tree <-> panel-concept-math-maturity-tree
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-math-maturity-tree via term "repo audit".

### Bridge: Universal Audit Tree <-> panel-concept-gr-agent-loop-kpis
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-gr-agent-loop-kpis via term "string".

### Bridge: Universal Audit Tree <-> panel-concept-model-silhouette
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-model-silhouette via term "string".

### Bridge: Universal Audit Tree <-> panel-concept-trip-player
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-trip-player via term "string".

### Bridge: Universal Audit Tree <-> panel-concept-fuel-gauge
- relation: Panel cross-concept join
- summary: Panel universal-audit-tree links to panel-concept-fuel-gauge via term "string".

### Bridge: TSN Determinism <-> panel-concept-tsn-sim
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to panel-concept-tsn-sim via term "deterministic".

### Bridge: TSN Determinism <-> panel-concept-time-dilation-lattice
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to panel-concept-time-dilation-lattice via term "clock".

### Bridge: TSN Determinism <-> panel-concept-agi-task-history
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to panel-concept-agi-task-history via term "clock".

### Bridge: TSN Determinism <-> panel-concept-light-speed-strobe
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to panel-concept-light-speed-strobe via term "tsn".

### Bridge: TSN Determinism <-> simulation-tsn
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to simulation-tsn via term "tsn".

### Bridge: TSN Determinism <-> panel-concept-pulsed-power-doc
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to panel-concept-pulsed-power-doc via term "usePanelTelemetryPublisher".

### Bridge: Warp Pulsed Power <-> panel-concept-needle-ipeak-worksheet
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to panel-concept-needle-ipeak-worksheet via term "pulsed power".

### Bridge: Warp Pulsed Power <-> panel-concept-pulsed-power-doc
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to panel-concept-pulsed-power-doc via term "pulsed power".

### Bridge: Warp Pulsed Power <-> warp-pulsed-power
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to warp-pulsed-power via term "pulsed power".

### Bridge: Warp Pulsed Power <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to panel-concept-viz-diagnostics via term "pipeline".

### Bridge: Warp Pulsed Power <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to panel-concept-energy-flux via term "pipeline".

### Bridge: Warp Pulsed Power <-> panel-concept-microscopy
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to panel-concept-microscopy via term "pipeline".

### Bridge: Bus Voltage Program <-> panel-concept-bus-voltage
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to panel-concept-bus-voltage via term "power policy".

### Bridge: Bus Voltage Program <-> panel-concept-qi-auto-tuner
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to panel-concept-qi-auto-tuner via term "setpoint".

### Bridge: Bus Voltage Program <-> guarded-casimir-tile-code-mapped
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to guarded-casimir-tile-code-mapped via term "Guardrail".

### Bridge: Bus Voltage Program <-> ts-ratio-guardrail
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to ts-ratio-guardrail via term "Guardrail".

### Bridge: Bus Voltage Program <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "Guardrail".

### Bridge: Bus Voltage Program <-> llm-runtime-tokenizer
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to llm-runtime-tokenizer via term "Guardrail".

### Bridge: KM-Scale Warp Ledger <-> panel-concept-warp-ledger
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to panel-concept-warp-ledger via term "km-scale ledger".

### Bridge: KM-Scale Warp Ledger <-> warp-ledger
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to warp-ledger via term "warp ledger".

### Bridge: KM-Scale Warp Ledger <-> ui-panel-warp-ledger
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to ui-panel-warp-ledger via term "warp ledger".

### Bridge: KM-Scale Warp Ledger <-> panel-concept-halobank
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to panel-concept-halobank via term "@/lib/whispers/usePanelHashFocus".

### Bridge: Warp Experiment Ladder <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to panel-concept-experiment-ladder via term "experiment ladder".

### Bridge: Warp Experiment Ladder <-> panel-concept-qi-widget
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to panel-concept-qi-widget via term "ford-roman".

### Bridge: Warp Experiment Ladder <-> qi-bounds-engine
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to qi-bounds-engine via term "ford-roman".

### Bridge: Warp Experiment Ladder <-> ford-roman-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to ford-roman-quantum-inequality via term "ford-roman".

### Bridge: Warp Experiment Ladder <-> ford-roman-proxy
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to ford-roman-proxy via term "ford-roman".

### Bridge: Warp Experiment Ladder <-> casimir-tiles-tree
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to casimir-tiles-tree via term "casimir".

### Bridge: Spectrum Tuner <-> panel-concept-spectrum-tuner
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to panel-concept-spectrum-tuner via term "harmonics sweep".

### Bridge: Spectrum Tuner <-> external-integrations-tree
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to external-integrations-tree via term "Integration".

### Bridge: Spectrum Tuner <-> sdk-integration-tree
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to sdk-integration-tree via term "Integration".

### Bridge: Spectrum Tuner <-> zen-artifact-integration-ladder
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to zen-artifact-integration-ladder via term "Integration".

### Bridge: Spectrum Tuner <-> integration-ladder
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to integration-ladder via term "Integration".

### Bridge: Spectrum Tuner <-> hardware-provenance
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to hardware-provenance via term "Provenance".

### Bridge: Vacuum Gap Heatmap <-> panel-concept-vacuum-gap-heatmap
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-heatmap links to panel-concept-vacuum-gap-heatmap via term "Casimir gap".

### Bridge: Vacuum Gap Heatmap <-> panel-concept-vacuum-gap-sweep
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-heatmap links to panel-concept-vacuum-gap-sweep via term "vacuum gap".

### Bridge: Vacuum Gap Heatmap <-> ui-panel-vacuum
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-heatmap links to ui-panel-vacuum via term "vacuum gap".

### Bridge: Vacuum Gap Heatmap <-> panel-concept-helix-casimir-amplifier
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-heatmap links to panel-concept-helix-casimir-amplifier via term "heatmap".

### Bridge: Hydrostatic Equilibrium (HR) <-> panel-concept-star-hydrostatic
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to panel-concept-star-hydrostatic via term "potato threshold".

### Bridge: Hydrostatic Equilibrium (HR) <-> potato-threshold
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to potato-threshold via term "potato threshold".

### Bridge: Hydrostatic Equilibrium (HR) <-> stellar-ledger
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to stellar-ledger via term "stellar ledger".

### Bridge: Hydrostatic Equilibrium (HR) <-> stellar-ledger-stack
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to stellar-ledger-stack via term "stellar ledger".

### Bridge: Hydrostatic Equilibrium (HR) <-> stellar-ledger
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to stellar-ledger via term "stellar ledger".

### Bridge: Hydrostatic Equilibrium (HR) <-> bridge-solar-restoration-plan-stellar-ledger-stack
- relation: Panel cross-concept join
- summary: Panel star-hydrostatic links to bridge-solar-restoration-plan-stellar-ledger-stack via term "stellar ledger".

### Bridge: Star Watcher <-> panel-concept-star-watcher
- relation: Panel cross-concept join
- summary: Panel star-watcher links to panel-concept-star-watcher via term "Coherence overlay".

### Bridge: Star Watcher <-> panel-concept-agi-debate-view
- relation: Panel cross-concept join
- summary: Panel star-watcher links to panel-concept-agi-debate-view via term "global_coherence".

### Bridge: Star Watcher <-> panel-concept-collapse-monitor
- relation: Panel cross-concept join
- summary: Panel star-watcher links to panel-concept-collapse-monitor via term "global_coherence".

### Bridge: Star Watcher <-> panel-concept-star-hydrostatic
- relation: Panel cross-concept join
- summary: Panel star-watcher links to panel-concept-star-hydrostatic via term "CardDescription".

### Bridge: Tokamak Simulation <-> panel-concept-tokamak-sim
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to panel-concept-tokamak-sim via term "coherence diagnostics".

### Bridge: Tokamak Simulation <-> ui-panel-tokamak
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to ui-panel-tokamak via term "tokamak".

### Bridge: Tokamak Simulation <-> tokamak-energy-field
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to tokamak-energy-field via term "tokamak".

### Bridge: Tokamak Simulation <-> tokamak-synthetic-diagnostics
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to tokamak-synthetic-diagnostics via term "tokamak".

### Bridge: Tokamak Simulation <-> tokamak-energy-adapter
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to tokamak-energy-adapter via term "tokamak".

### Bridge: Tokamak Simulation <-> panel-concept-vacuum-contract
- relation: Panel cross-concept join
- summary: Panel tokamak-sim links to panel-concept-vacuum-contract via term "formatNumber".

### Bridge: Vacuum Gap Sweep HUD <-> panel-concept-vacuum-gap-sweep
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-sweep links to panel-concept-vacuum-gap-sweep via term "gap sweep".

### Bridge: Cavity Mechanism <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-cavity-mechanism via term "actuator layout".

### Bridge: Cavity Mechanism <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Bridge: Cavity Mechanism <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Bridge: Cavity Mechanism <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Bridge: Cavity Mechanism <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Bridge: Cavity Mechanism <-> panel-concept-operational-mode
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Bridge: Fractional Coherence Rail <-> panel-concept-fractional-coherence-rail
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-rail links to panel-concept-fractional-coherence-rail via term "fractional coherence".

### Bridge: Fractional Coherence Rail <-> panel-concept-fractional-coherence-grid
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-rail links to panel-concept-fractional-coherence-grid via term "fractional coherence".

### Bridge: Fractional Coherence Grid <-> panel-concept-fractional-coherence-grid
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-fractional-coherence-grid via term "coherence lattice".

### Bridge: Fractional Coherence Grid <-> panel-concept-needle-ipeak-worksheet
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-needle-ipeak-worksheet via term "Hz".

### Bridge: Fractional Coherence Grid <-> panel-concept-vacuum-gap-heatmap
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-vacuum-gap-heatmap via term "Hz".

### Bridge: Fractional Coherence Grid <-> panel-concept-tokamak-sim
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-tokamak-sim via term "Hz".

### Bridge: Fractional Coherence Grid <-> panel-concept-alcubierre-viewer
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-alcubierre-viewer via term "Hz".

### Bridge: Fractional Coherence Grid <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel fractional-coherence-grid links to panel-concept-shell-outline via term "Hz".

### Bridge: Near-Zero Widget <-> panel-concept-near-zero
- relation: Panel cross-concept join
- summary: Panel near-zero links to panel-concept-near-zero via term "near zero widget".

### Bridge: Near-Zero Widget <-> panel-concept-tsn-sim
- relation: Panel cross-concept join
- summary: Panel near-zero links to panel-concept-tsn-sim via term "usePanelTelemetryPublisher".

### Bridge: Near-Zero Widget <-> panel-concept-pulsed-power-doc
- relation: Panel cross-concept join
- summary: Panel near-zero links to panel-concept-pulsed-power-doc via term "usePanelTelemetryPublisher".

### Bridge: Direction Pad <-> panel-concept-direction-pad
- relation: Panel cross-concept join
- summary: Panel direction-pad links to panel-concept-direction-pad via term "flight director".

### Bridge: Solar Navigation <-> panel-concept-nav-system
- relation: Panel cross-concept join
- summary: Panel nav-system links to panel-concept-nav-system via term "navigation hud".

### Bridge: Solar Navigation <-> ui-hud-nav
- relation: Panel cross-concept join
- summary: Panel nav-system links to ui-hud-nav via term "navigation hud".

### Bridge: Solar Navigation <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel nav-system links to panel-concept-viz-diagnostics via term "react".

### Bridge: Solar Navigation <-> panel-concept-deepmix-solar
- relation: Panel cross-concept join
- summary: Panel nav-system links to panel-concept-deepmix-solar via term "react".

### Bridge: Solar Navigation <-> panel-concept-casimir-tile-grid
- relation: Panel cross-concept join
- summary: Panel nav-system links to panel-concept-casimir-tile-grid via term "react".

### Bridge: Solar Navigation <-> panel-concept-sweep-replay
- relation: Panel cross-concept join
- summary: Panel nav-system links to panel-concept-sweep-replay via term "react".

### Bridge: DeepMix Solar View <-> panel-concept-deepmix-solar
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-deepmix-solar via term "solar telemetry".

### Bridge: DeepMix Solar View <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-viz-diagnostics via term "react".

### Bridge: DeepMix Solar View <-> panel-concept-nav-system
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-nav-system via term "react".

### Bridge: DeepMix Solar View <-> panel-concept-casimir-tile-grid
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-casimir-tile-grid via term "react".

### Bridge: DeepMix Solar View <-> panel-concept-sweep-replay
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-sweep-replay via term "react".

### Bridge: DeepMix Solar View <-> panel-concept-remove-bg-edges
- relation: Panel cross-concept join
- summary: Panel deepmix-solar links to panel-concept-remove-bg-edges via term "react".

### Bridge: Solar Globe <-> panel-concept-solar-globe
- relation: Panel cross-concept join
- summary: Panel solar-globe links to panel-concept-solar-globe via term "synoptic globe".

### Bridge: Solar Globe <-> ui-panel-solar-globe
- relation: Panel cross-concept join
- summary: Panel solar-globe links to ui-panel-solar-globe via term "solar globe".

### Bridge: Solar Globe <-> panel-concept-needle-ipeak-worksheet
- relation: Panel cross-concept join
- summary: Panel solar-globe links to panel-concept-needle-ipeak-worksheet via term "return".

### Bridge: Solar Globe <-> panel-concept-electron-orbital
- relation: Panel cross-concept join
- summary: Panel solar-globe links to panel-concept-electron-orbital via term "return".

### Bridge: Solar Globe <-> panel-concept-drive-guards
- relation: Panel cross-concept join
- summary: Panel solar-globe links to panel-concept-drive-guards via term "return".

### Bridge: Solar Globe <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel solar-globe links to panel-concept-mass-provenance via term "return".

### Bridge: DeepMix Sweet Spot <-> panel-concept-deepmix-sweetspot
- relation: Panel cross-concept join
- summary: Panel deepmix-sweetspot links to panel-concept-deepmix-sweetspot via term "mix optimization".

### Bridge: DeepMix Sweet Spot <-> panel-concept-deepmix-globe
- relation: Panel cross-concept join
- summary: Panel deepmix-sweetspot links to panel-concept-deepmix-globe via term "ratePerShipKgS".

### Bridge: DeepMix Sweet Spot <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel deepmix-sweetspot links to panel-concept-mass-provenance via term "toExponential".

### Bridge: DeepMix Sweet Spot <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel deepmix-sweetspot links to panel-concept-curvature-slice via term "toExponential".

### Bridge: DeepMix Sweet Spot <-> panel-concept-stellar-lsr
- relation: Panel cross-concept join
- summary: Panel deepmix-sweetspot links to panel-concept-stellar-lsr via term "toExponential".

### Bridge: DeepMix Globe <-> panel-concept-deepmix-globe
- relation: Panel cross-concept join
- summary: Panel deepmix-globe links to panel-concept-deepmix-globe via term "deep mixing globe".

### Bridge: DeepMix Globe <-> panel-concept-deepmix-sweetspot
- relation: Panel cross-concept join
- summary: Panel deepmix-globe links to panel-concept-deepmix-sweetspot via term "ratePerShipKgS".

### Bridge: DeepMix Globe <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel deepmix-globe links to panel-concept-mass-provenance via term "toExponential".

### Bridge: DeepMix Globe <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel deepmix-globe links to panel-concept-curvature-slice via term "toExponential".

### Bridge: DeepMix Globe <-> panel-concept-stellar-lsr
- relation: Panel cross-concept join
- summary: Panel deepmix-globe links to panel-concept-stellar-lsr via term "toExponential".

### Bridge: Alcubierre Viewer <-> panel-concept-alcubierre-viewer
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to panel-concept-alcubierre-viewer via term "Alcubierre metric".

### Bridge: Alcubierre Viewer <-> alcubierre-metric
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to alcubierre-metric via term "Alcubierre metric".

### Bridge: Alcubierre Viewer <-> ui-panel-warp-bubble
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to ui-panel-warp-bubble via term "warp bubble".

### Bridge: Alcubierre Viewer <-> ui-renderer-warp-bubble
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to ui-renderer-warp-bubble via term "warp bubble".

### Bridge: Alcubierre Viewer <-> warp-bubble
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to warp-bubble via term "warp bubble".

### Bridge: Alcubierre Viewer <-> panel-concept-hull-metrics-vis
- relation: Panel cross-concept join
- summary: Panel alcubierre-viewer links to panel-concept-hull-metrics-vis via term "resolveHullDimsEffective".

### Bridge: Shell Outline Visualizer <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-shell-outline via term "shell outline".

### Bridge: Shell Outline Visualizer <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Bridge: Shell Outline Visualizer <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Bridge: Shell Outline Visualizer <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Bridge: Shell Outline Visualizer <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Bridge: Shell Outline Visualizer <-> panel-concept-operational-mode
- relation: Panel cross-concept join
- summary: Panel shell-outline links to panel-concept-operational-mode via term "dutyEffectiveFR".

### Bridge: Silhouette Stretch <-> panel-concept-model-silhouette
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to panel-concept-model-silhouette via term "ellipsoid".

### Bridge: Silhouette Stretch <-> panel-concept-pipeline-proof
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to panel-concept-pipeline-proof via term "ellipsoid".

### Bridge: Silhouette Stretch <-> ts-ratio-guardrail
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to ts-ratio-guardrail via term "scale".

### Bridge: Silhouette Stretch <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "scale".

### Bridge: Silhouette Stretch <-> panel-concept-microscopy
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to panel-concept-microscopy via term "scale".

### Bridge: Silhouette Stretch <-> panel-concept-warp-ledger
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to panel-concept-warp-ledger via term "scale".

### Bridge: Hull Metrics Vis <-> panel-concept-hull-metrics-vis
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to panel-concept-hull-metrics-vis via term "hull metrics".

### Bridge: Hull Metrics Vis <-> panel-concept-alcubierre-viewer
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to panel-concept-alcubierre-viewer via term "alcubierre".

### Bridge: Hull Metrics Vis <-> ui-panel-alcubierre
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to ui-panel-alcubierre via term "alcubierre".

### Bridge: Hull Metrics Vis <-> alcubierre-metric
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to alcubierre-metric via term "alcubierre".

### Bridge: Hull Metrics Vis <-> casimir-natario-metric
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to casimir-natario-metric via term "natario".

### Bridge: Hull Metrics Vis <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to panel-concept-experiment-ladder via term "natario".

### Bridge: Shift Vector Panel <-> panel-concept-shift-vector
- relation: Panel cross-concept join
- summary: Panel shift-vector links to panel-concept-shift-vector via term "shift vector".

### Bridge: Shift Vector Panel <-> ui-panel-shift-vector
- relation: Panel cross-concept join
- summary: Panel shift-vector links to ui-panel-shift-vector via term "shift vector".

### Bridge: Shift Vector Panel <-> shift-vector-expansion-scalar
- relation: Panel cross-concept join
- summary: Panel shift-vector links to shift-vector-expansion-scalar via term "shift vector".

### Bridge: Shift Vector Panel <-> panel-concept-hull-metrics-vis
- relation: Panel cross-concept join
- summary: Panel shift-vector links to panel-concept-hull-metrics-vis via term "shiftVector".

### Bridge: Shift Vector Panel <-> panel-concept-drive-guards
- relation: Panel cross-concept join
- summary: Panel shift-vector links to panel-concept-drive-guards via term "useMetrics".

### Bridge: Shift Vector Panel <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel shift-vector links to panel-concept-curvature-slice via term "useMetrics".

### Bridge: Equatorial Curvature Slice <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to panel-concept-curvature-slice via term "scalar curvature".

### Bridge: Equatorial Curvature Slice <-> ui-panel-curvature-slices
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to ui-panel-curvature-slices via term "curvature slice".

### Bridge: Equatorial Curvature Slice <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Bridge: Equatorial Curvature Slice <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Bridge: Equatorial Curvature Slice <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Bridge: Equatorial Curvature Slice <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Bridge: Time Dilation Lattice <-> panel-concept-time-dilation-lattice
- relation: Panel cross-concept join
- summary: Panel time-dilation-lattice links to panel-concept-time-dilation-lattice via term "spacetime lattice".

### Bridge: Time Dilation Lattice <-> ui-panel-time-dilation
- relation: Panel cross-concept join
- summary: Panel time-dilation-lattice links to ui-panel-time-dilation via term "time dilation".

### Bridge: Time Dilation Lattice <-> panel-concept-remove-bg-edges
- relation: Panel cross-concept join
- summary: Panel time-dilation-lattice links to panel-concept-remove-bg-edges via term "alpha".

### Bridge: Time Dilation Lattice <-> panel-concept-pipeline-proof
- relation: Panel cross-concept join
- summary: Panel time-dilation-lattice links to panel-concept-pipeline-proof via term "EnergyPipelineState".

### Bridge: Curvature Ledger <-> panel-concept-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to panel-concept-curvature-ledger via term "curvature ledger".

### Bridge: Curvature Ledger <-> curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to curvature-ledger via term "curvature ledger".

### Bridge: Curvature Ledger <-> bridge-pipeline-overview-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to bridge-pipeline-overview-curvature-ledger via term "curvature ledger".

### Bridge: Curvature Ledger <-> ui-panel-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to ui-panel-curvature-ledger via term "curvature ledger".

### Bridge: Operational Mode Switch <-> panel-concept-operational-mode
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-operational-mode via term "station vs desktop".

### Bridge: Operational Mode Switch <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-viz-diagnostics via term "dutyEffectiveFR".

### Bridge: Operational Mode Switch <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-energy-flux via term "dutyEffectiveFR".

### Bridge: Operational Mode Switch <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-cavity-mechanism via term "dutyEffectiveFR".

### Bridge: Operational Mode Switch <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-shell-outline via term "dutyEffectiveFR".

### Bridge: Operational Mode Switch <-> panel-concept-curvature-slice
- relation: Panel cross-concept join
- summary: Panel operational-mode links to panel-concept-curvature-slice via term "dutyEffectiveFR".

### Bridge: Casimir Tile Grid <-> panel-concept-casimir-tile-grid
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to panel-concept-casimir-tile-grid via term "Casimir tile grid".

### Bridge: Casimir Tile Grid <-> ui-panel-casimir-grid
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to ui-panel-casimir-grid via term "Casimir tile grid".

### Bridge: Casimir Tile Grid <-> casimir-tiles-tree
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to casimir-tiles-tree via term "Casimir tiles".

### Bridge: Casimir Tile Grid <-> casimir-tiles-overview
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to casimir-tiles-overview via term "Casimir tiles".

### Bridge: Casimir Tile Grid <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Bridge: Casimir Tile Grid <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to panel-concept-resonance-scheduler via term "sectorPeriod_ms".

### Bridge: Light-Speed Strobe Scale <-> panel-concept-light-speed-strobe
- relation: Panel cross-concept join
- summary: Panel light-speed-strobe links to panel-concept-light-speed-strobe via term "light speed strobe".

### Bridge: Light-Speed Strobe Scale <-> sector-strobes-duty-cycle
- relation: Panel cross-concept join
- summary: Panel light-speed-strobe links to sector-strobes-duty-cycle via term "strobes".

### Bridge: Speed Capability <-> panel-concept-speed-capability
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-speed-capability via term "translation speed".

### Bridge: Speed Capability <-> panel-concept-shell-outline
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-shell-outline via term "beta".

### Bridge: Speed Capability <-> panel-concept-shift-vector
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-shift-vector via term "beta".

### Bridge: Speed Capability <-> panel-concept-stellar-lsr
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-stellar-lsr via term "km/s".

### Bridge: Speed Capability <-> panel-concept-drive-guards
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-drive-guards via term "m/s".

### Bridge: Speed Capability <-> panel-concept-near-zero
- relation: Panel cross-concept join
- summary: Panel speed-capability links to panel-concept-near-zero via term "m/s".

### Bridge: Helix Casimir Amplifier <-> panel-concept-helix-casimir-amplifier
- relation: Panel cross-concept join
- summary: Panel helix-casimir-amplifier links to panel-concept-helix-casimir-amplifier via term "Casimir amplifier".

### Bridge: Helix Casimir Amplifier <-> ui-panel-casimir-amplifier
- relation: Panel cross-concept join
- summary: Panel helix-casimir-amplifier links to ui-panel-casimir-amplifier via term "Casimir amplifier".

### Bridge: Helix Casimir Amplifier <-> panel-concept-vacuum-contract
- relation: Panel cross-concept join
- summary: Panel helix-casimir-amplifier links to panel-concept-vacuum-contract via term "modulationFreq_GHz".

### Bridge: Resonance Scheduler <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to panel-concept-resonance-scheduler via term "resonance scheduler".

### Bridge: Resonance Scheduler <-> phase-scheduler
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to phase-scheduler via term "phase scheduler".

### Bridge: Resonance Scheduler <-> panel-concept-qi-auto-tuner
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to panel-concept-qi-auto-tuner via term "auto duty".

### Bridge: Resonance Scheduler <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Bridge: Resonance Scheduler <-> panel-concept-casimir-tile-grid
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to panel-concept-casimir-tile-grid via term "sectorPeriod_ms".

### Bridge: Resonance Scheduler <-> panel-concept-sector-roles
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to panel-concept-sector-roles via term "sectorPeriod_ms".

### Bridge: Trip Player <-> panel-concept-trip-player
- relation: Panel cross-concept join
- summary: Panel trip-player links to panel-concept-trip-player via term "timeline playback".

### Bridge: Trip Player <-> panel-concept-fuel-gauge
- relation: Panel cross-concept join
- summary: Panel trip-player links to panel-concept-fuel-gauge via term "computeEffectiveLyPerHour".

### Bridge: Trip Player <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel trip-player links to agi-constraint-packs via term "constraints".

### Bridge: Trip Player <-> noise-field-loop
- relation: Panel cross-concept join
- summary: Panel trip-player links to noise-field-loop via term "constraints".

### Bridge: Trip Player <-> diffusion-loop
- relation: Panel cross-concept join
- summary: Panel trip-player links to diffusion-loop via term "constraints".

### Bridge: Trip Player <-> constraint-loop
- relation: Panel cross-concept join
- summary: Panel trip-player links to constraint-loop via term "constraints".

### Bridge: Fuel Gauge <-> panel-concept-fuel-gauge
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to panel-concept-fuel-gauge via term "energy reserve".

### Bridge: Fuel Gauge <-> panel-concept-trip-player
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to panel-concept-trip-player via term "computeEffectiveLyPerHour".

### Bridge: Fuel Gauge <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to schema-confidence-stack via term "telemetry".

### Bridge: Fuel Gauge <-> debate-telemetry
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to debate-telemetry via term "telemetry".

### Bridge: Fuel Gauge <-> hardware-telemetry-tree
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to hardware-telemetry-tree via term "telemetry".

### Bridge: Fuel Gauge <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to panel-concept-energy-flux via term "telemetry".

### Bridge: Vacuum Contract <-> panel-concept-vacuum-contract
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-vacuum-contract via term "negative energy covenant".

### Bridge: Vacuum Contract <-> panel-concept-helix-casimir-amplifier
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-helix-casimir-amplifier via term "modulationFreq_GHz".

### Bridge: Vacuum Contract <-> panel-concept-tokamak-sim
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-tokamak-sim via term "formatNumber".

### Bridge: Vacuum Contract <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-viz-diagnostics via term "dutyCycle".

### Bridge: Vacuum Contract <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-energy-flux via term "dutyCycle".

### Bridge: Vacuum Contract <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to panel-concept-cavity-mechanism via term "dutyCycle".

### Bridge: Metric Amplification Pocket <-> panel-concept-metric-pocket
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-metric-pocket via term "amplification pocket".

### Bridge: Metric Amplification Pocket <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-viz-diagnostics via term "deltaAOverA".

### Bridge: Metric Amplification Pocket <-> panel-concept-cavity-mechanism
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-cavity-mechanism via term "deltaAOverA".

### Bridge: Metric Amplification Pocket <-> panel-concept-needle-ipeak-worksheet
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-needle-ipeak-worksheet via term "normalized".

### Bridge: Metric Amplification Pocket <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-energy-flux via term "effective".

### Bridge: Metric Amplification Pocket <-> panel-concept-drive-guards
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to panel-concept-drive-guards via term "effective".

### Bridge: HaloBank Timeline <-> panel-concept-halobank
- relation: Panel cross-concept join
- summary: Panel halobank links to panel-concept-halobank via term "bank history".

### Bridge: HaloBank Timeline <-> halobank
- relation: Panel cross-concept join
- summary: Panel halobank links to halobank via term "HaloBank".

### Bridge: HaloBank Timeline <-> ui-panel-halobank
- relation: Panel cross-concept join
- summary: Panel halobank links to ui-panel-halobank via term "HaloBank".

### Bridge: HaloBank Timeline <-> panel-concept-needle-world-roadmap
- relation: Panel cross-concept join
- summary: Panel halobank links to panel-concept-needle-world-roadmap via term "timeline".

### Bridge: HaloBank Timeline <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel halobank links to panel-concept-resonance-scheduler via term "timeline".

### Bridge: HaloBank Timeline <-> panel-concept-trip-player
- relation: Panel cross-concept join
- summary: Panel halobank links to panel-concept-trip-player via term "timeline".

### Bridge: Qi Widget <-> panel-concept-qi-widget
- relation: Panel cross-concept join
- summary: Panel qi-widget links to panel-concept-qi-widget via term "quantum inequality".

### Bridge: Qi Widget <-> panel-concept-qi-auto-tuner
- relation: Panel cross-concept join
- summary: Panel qi-widget links to panel-concept-qi-auto-tuner via term "quantum inequality".

### Bridge: Qi Widget <-> qi-bounds
- relation: Panel cross-concept join
- summary: Panel qi-widget links to qi-bounds via term "quantum inequality".

### Bridge: Qi Widget <-> ford-roman-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel qi-widget links to ford-roman-quantum-inequality via term "quantum inequality".

### Bridge: Qi Widget <-> uncertainty-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel qi-widget links to uncertainty-quantum-inequality via term "quantum inequality".

### Bridge: Qi Widget <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel qi-widget links to panel-concept-experiment-ladder via term "Ford-Roman".

### Bridge: QI Auto-Tuner <-> panel-concept-qi-auto-tuner
- relation: Panel cross-concept join
- summary: Panel qi-auto-tuner links to panel-concept-qi-auto-tuner via term "quantum inequality tuner".

### Bridge: QI Auto-Tuner <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel qi-auto-tuner links to panel-concept-resonance-scheduler via term "auto duty".

### Bridge: Sector Legend <-> panel-concept-sector-legend
- relation: Panel cross-concept join
- summary: Panel sector-legend links to panel-concept-sector-legend via term "sector palette".

### Bridge: Sector Roles HUD <-> panel-concept-sector-roles
- relation: Panel cross-concept join
- summary: Panel sector-roles links to panel-concept-sector-roles via term "sector overlay".

### Bridge: Sector Roles HUD <-> panel-concept-sector-legend
- relation: Panel cross-concept join
- summary: Panel sector-roles links to panel-concept-sector-legend via term "role legend".

### Bridge: Sector Roles HUD <-> ui-hud-sector
- relation: Panel cross-concept join
- summary: Panel sector-roles links to ui-hud-sector via term "sector HUD".

### Bridge: Sector Roles HUD <-> panel-concept-experiment-ladder
- relation: Panel cross-concept join
- summary: Panel sector-roles links to panel-concept-experiment-ladder via term "sectorPeriod_ms".

### Bridge: Sector Roles HUD <-> panel-concept-casimir-tile-grid
- relation: Panel cross-concept join
- summary: Panel sector-roles links to panel-concept-casimir-tile-grid via term "sectorPeriod_ms".

### Bridge: Sector Roles HUD <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel sector-roles links to panel-concept-resonance-scheduler via term "sectorPeriod_ms".

### Bridge: Sweep Replay Controls <-> panel-concept-sweep-replay
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-sweep-replay via term "sweep telemetry".

### Bridge: Sweep Replay Controls <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-mass-provenance via term "center".

### Bridge: Sweep Replay Controls <-> panel-concept-agi-task-history
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-agi-task-history via term "center".

### Bridge: Sweep Replay Controls <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-viz-diagnostics via term "react".

### Bridge: Sweep Replay Controls <-> panel-concept-nav-system
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-nav-system via term "react".

### Bridge: Sweep Replay Controls <-> panel-concept-deepmix-solar
- relation: Panel cross-concept join
- summary: Panel sweep-replay links to panel-concept-deepmix-solar via term "react".

### Bridge: Runtime Ops <-> panel-concept-hull-status
- relation: Panel cross-concept join
- summary: Panel hull-status links to panel-concept-hull-status via term "queue telemetry".

### Bridge: Runtime Ops <-> bridge-solar-restoration-plan-deep-mixing-plan
- relation: Panel cross-concept join
- summary: Panel hull-status links to bridge-solar-restoration-plan-deep-mixing-plan via term "plan b".

### Bridge: Runtime Ops <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel hull-status links to panel-concept-viz-diagnostics via term "className".

### Bridge: Runtime Ops <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel hull-status links to panel-concept-mass-provenance via term "className".

### Bridge: Runtime Ops <-> panel-concept-universal-audit-tree
- relation: Panel cross-concept join
- summary: Panel hull-status links to panel-concept-universal-audit-tree via term "className".

### Bridge: Runtime Ops <-> panel-concept-warp-ledger
- relation: Panel cross-concept join
- summary: Panel hull-status links to panel-concept-warp-ledger via term "className".

### Bridge: Debate View <-> panel-concept-agi-debate-view
- relation: Panel cross-concept join
- summary: Panel agi-debate-view links to panel-concept-agi-debate-view via term "multi agent debate".

### Bridge: Debate View <-> panel-concept-agi-essence-console
- relation: Panel cross-concept join
- summary: Panel agi-debate-view links to panel-concept-agi-essence-console via term "useDebateTelemetry".

### Bridge: Debate View <-> panel-concept-star-coherence
- relation: Panel cross-concept join
- summary: Panel agi-debate-view links to panel-concept-star-coherence via term "useDebateTelemetry".

### Bridge: Debate View <-> panel-concept-collapse-monitor
- relation: Panel cross-concept join
- summary: Panel agi-debate-view links to panel-concept-collapse-monitor via term "useDebateTelemetry".

### Bridge: Debate View <-> panel-concept-star-watcher
- relation: Panel cross-concept join
- summary: Panel agi-debate-view links to panel-concept-star-watcher via term "global_coherence".

### Bridge: Essence Console <-> panel-concept-agi-essence-console
- relation: Panel cross-concept join
- summary: Panel agi-essence-console links to panel-concept-agi-essence-console via term "Essence console".

### Bridge: Star Coherence Governor <-> coherence-governor
- relation: Panel cross-concept join
- summary: Panel star-coherence links to coherence-governor via term "coherence governor".

### Bridge: Star Coherence Governor <-> panel-concept-star-coherence
- relation: Panel cross-concept join
- summary: Panel star-coherence links to panel-concept-star-coherence via term "coherence governor".

### Bridge: Star Coherence Governor <-> uncertainty-coherence-policy
- relation: Panel cross-concept join
- summary: Panel star-coherence links to uncertainty-coherence-policy via term "coherence governor".

### Bridge: Star Coherence Governor <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel star-coherence links to schema-confidence-stack via term "telemetry".

### Bridge: Star Coherence Governor <-> debate-telemetry
- relation: Panel cross-concept join
- summary: Panel star-coherence links to debate-telemetry via term "telemetry".

### Bridge: Star Coherence Governor <-> hardware-telemetry-tree
- relation: Panel cross-concept join
- summary: Panel star-coherence links to hardware-telemetry-tree via term "telemetry".

### Bridge: Pipeline Proof <-> agi-planner-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to agi-planner-core via term "grounding".

### Bridge: Pipeline Proof <-> bridge-agi-plan-execute-agi-planner-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to bridge-agi-plan-execute-agi-planner-core via term "grounding".

### Bridge: Pipeline Proof <-> panel-concept-pipeline-proof
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to panel-concept-pipeline-proof via term "grounding".

### Bridge: Pipeline Proof <-> panel-concept-resonance-scheduler
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to panel-concept-resonance-scheduler via term "resonance".

### Bridge: Pipeline Proof <-> resonance-tree
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to resonance-tree via term "resonance".

### Bridge: Pipeline Proof <-> code-lattice-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to code-lattice-core via term "resonance".

### Bridge: Collapse Watch <-> panel-concept-collapse-monitor
- relation: Panel cross-concept join
- summary: Panel collapse-monitor links to panel-concept-collapse-monitor via term "collapse pressure".

### Bridge: Collapse Watch <-> panel-concept-star-coherence
- relation: Panel cross-concept join
- summary: Panel collapse-monitor links to panel-concept-star-coherence via term "useCoherenceTelemetry".

### Bridge: Collapse Watch <-> panel-concept-agi-debate-view
- relation: Panel cross-concept join
- summary: Panel collapse-monitor links to panel-concept-agi-debate-view via term "useDebateTelemetry".

### Bridge: Collapse Watch <-> panel-concept-agi-essence-console
- relation: Panel cross-concept join
- summary: Panel collapse-monitor links to panel-concept-agi-essence-console via term "useDebateTelemetry".

### Bridge: Collapse Watch <-> panel-concept-star-watcher
- relation: Panel cross-concept join
- summary: Panel collapse-monitor links to panel-concept-star-watcher via term "global_coherence".

### Bridge: Collapse Benchmark HUD <-> panel-concept-collapse-benchmark-hud
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to panel-concept-collapse-benchmark-hud via term "collapse benchmark".

### Bridge: Collapse Benchmark HUD <-> collapse-benchmark-stack
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to collapse-benchmark-stack via term "collapse benchmark".

### Bridge: Collapse Benchmark HUD <-> binding-collapse-benchmark
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to binding-collapse-benchmark via term "collapse benchmark".

### Bridge: Collapse Benchmark HUD <-> ui-hud-collapse
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to ui-hud-collapse via term "collapse benchmark".

### Bridge: Collapse Benchmark HUD <-> uncertainty-collapse-benchmark
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to uncertainty-collapse-benchmark via term "collapse benchmark".

### Bridge: Collapse Benchmark HUD <-> panel-concept-helix-phoenix
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to panel-concept-helix-phoenix via term "kappa".

### Bridge: Task History <-> panel-concept-agi-task-history
- relation: Panel cross-concept join
- summary: Panel agi-task-history links to panel-concept-agi-task-history via term "trace timeline".

### Bridge: Noise Gens <-> panel-concept-helix-noise-gens
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to panel-concept-helix-noise-gens via term "render plan".

### Bridge: Noise Gens <-> ui-panel-noise-gen
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to ui-panel-noise-gen via term "noise gen".

### Bridge: Noise Gens <-> ui-panel-noise-gens
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to ui-panel-noise-gens via term "noise gen".

### Bridge: Noise Gens <-> coverage-gate
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to coverage-gate via term "cover".

### Bridge: Noise Gens <-> panel-concept-math-maturity-tree
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to panel-concept-math-maturity-tree via term "cover".

### Bridge: Noise Gens <-> civic-governance-stack
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to civic-governance-stack via term "stems".

### Bridge: Constraint Pack Policies <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to agi-constraint-packs via term "constraint packs".

### Bridge: Constraint Pack Policies <-> panel-concept-constraint-pack-policy
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to panel-concept-constraint-pack-policy via term "constraint packs".

### Bridge: Constraint Pack Policies <-> constraint-packs
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to constraint-packs via term "constraint packs".

### Bridge: Constraint Pack Policies <-> panel-concept-math-maturity-tree
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to panel-concept-math-maturity-tree via term "generated".

### Bridge: Constraint Pack Policies <-> panel-concept-universal-audit-tree
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to panel-concept-universal-audit-tree via term "generated".

### Bridge: Constraint Pack Policies <-> panel-concept-energy-flux
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to panel-concept-energy-flux via term "auto".

### Bridge: Contribution Workbench <-> agi-contributions
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to agi-contributions via term "contribution".

### Bridge: Contribution Workbench <-> panel-concept-agi-contribution-workbench
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to panel-concept-agi-contribution-workbench via term "contribution".

### Bridge: Contribution Workbench <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to agi-constraint-packs via term "verification".

### Bridge: Contribution Workbench <-> casimir-tiles-tree
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to casimir-tiles-tree via term "verification".

### Bridge: Contribution Workbench <-> casimir-tile-schematic-roadmap
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to casimir-tile-schematic-roadmap via term "verification".

### Bridge: Contribution Workbench <-> certainty-motivation
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to certainty-motivation via term "verification".

### Bridge: PNG Edge Cutter <-> panel-concept-remove-bg-edges
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-remove-bg-edges via term "background removal".

### Bridge: PNG Edge Cutter <-> panel-concept-dresscode
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-dresscode via term "mask".

### Bridge: PNG Edge Cutter <-> panel-concept-helix-noise-gens
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-helix-noise-gens via term "useCallback".

### Bridge: PNG Edge Cutter <-> panel-concept-viz-diagnostics
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-viz-diagnostics via term "className".

### Bridge: PNG Edge Cutter <-> panel-concept-mass-provenance
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-mass-provenance via term "className".

### Bridge: PNG Edge Cutter <-> panel-concept-universal-audit-tree
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to panel-concept-universal-audit-tree via term "className".

### Bridge: Dresscode Drafting <-> panel-concept-dresscode
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-dresscode via term "dresscode".

### Bridge: Dresscode Drafting <-> panel-concept-constraint-pack-policy
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-constraint-pack-policy via term "draft".

### Bridge: Dresscode Drafting <-> panel-concept-fractional-coherence-grid
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-fractional-coherence-grid via term "grid".

### Bridge: Dresscode Drafting <-> panel-concept-alcubierre-viewer
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-alcubierre-viewer via term "grid".

### Bridge: Dresscode Drafting <-> panel-concept-model-silhouette
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-model-silhouette via term "grid".

### Bridge: Dresscode Drafting <-> panel-concept-time-dilation-lattice
- relation: Panel cross-concept join
- summary: Panel dresscode links to panel-concept-time-dilation-lattice via term "grid".

### Bridge: Stellar LSR Viewer <-> panel-concept-stellar-lsr
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to panel-concept-stellar-lsr via term "local standard of rest".

### Bridge: Stellar LSR Viewer <-> panel-concept-star-hydrostatic
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to panel-concept-star-hydrostatic via term "stellar".

### Bridge: Stellar LSR Viewer <-> stellar-ledger
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-ledger via term "stellar".

### Bridge: Stellar LSR Viewer <-> stellar-restoration-tree
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-restoration-tree via term "stellar".

### Bridge: Stellar LSR Viewer <-> stellar-structure-stack
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-structure-stack via term "stellar".

### Bridge: Stellar LSR Viewer <-> stellar-evolution-stack
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-evolution-stack via term "stellar".

### Bridge: Essence Proposals <-> panel-concept-essence-proposals
- relation: Panel cross-concept join
- summary: Panel essence-proposals links to panel-concept-essence-proposals via term "essence proposals".
