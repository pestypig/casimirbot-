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

### Node: Phoenix Averaging <-> casimir-tile-schematic-roadmap
- id: bridge-panel-helix-phoenix-casimir-tile-schematic-roadmap
- type: bridge
- summary: Panel helix-phoenix links to casimir-tile-schematic-roadmap via term "casimir tile".

### Node: Needle I_peak Worksheet <-> warp-pulsed-power
- id: bridge-panel-needle-ipeak-worksheet-warp-pulsed-power
- type: bridge
- summary: Panel needle-ipeak-worksheet links to warp-pulsed-power via term "pulsed power".

### Node: Needle World Roadmap <-> ts-ratio-guardrail
- id: bridge-panel-needle-world-roadmap-ts-ratio-guardrail
- type: bridge
- summary: Panel needle-world-roadmap links to ts-ratio-guardrail via term "TS_ratio".

### Node: Needle World Roadmap <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- id: bridge-panel-needle-world-roadmap-bridge-ts-ratio-guardrail-casimir-tile-mechanism
- type: bridge
- summary: Panel needle-world-roadmap links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "TS_ratio".

### Node: Needle World Roadmap <-> qi-bounds-engine
- id: bridge-panel-needle-world-roadmap-qi-bounds-engine
- type: bridge
- summary: Panel needle-world-roadmap links to qi-bounds-engine via term "Roman".

### Node: Needle World Roadmap <-> ford-roman-quantum-inequality
- id: bridge-panel-needle-world-roadmap-ford-roman-quantum-inequality
- type: bridge
- summary: Panel needle-world-roadmap links to ford-roman-quantum-inequality via term "Roman".

### Node: Needle World Roadmap <-> ford-roman-proxy
- id: bridge-panel-needle-world-roadmap-ford-roman-proxy
- type: bridge
- summary: Panel needle-world-roadmap links to ford-roman-proxy via term "Roman".

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

### Node: GR Agent Loop Audit <-> gr-constraint-network
- id: bridge-panel-gr-agent-loop-audit-gr-constraint-network
- type: bridge
- summary: Panel gr-agent-loop-audit links to gr-constraint-network via term "residuals".

### Node: GR Agent Loop Audit <-> stage-diagnostic
- id: bridge-panel-gr-agent-loop-audit-stage-diagnostic
- type: bridge
- summary: Panel gr-agent-loop-audit links to stage-diagnostic via term "residuals".

### Node: GR Agent Loop Audit <-> gr-constraint-network
- id: bridge-panel-gr-agent-loop-audit-gr-constraint-network
- type: bridge
- summary: Panel gr-agent-loop-audit links to gr-constraint-network via term "residuals".

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

### Node: GR Loop Learning <-> agi-learning-loop
- id: bridge-panel-gr-agent-loop-learning-agi-learning-loop
- type: bridge
- summary: Panel gr-agent-loop-learning links to agi-learning-loop via term "learning loop".

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

### Node: Math Maturity Tree <-> math-pipeline-walk
- id: bridge-panel-math-maturity-tree-math-pipeline-walk
- type: bridge
- summary: Panel math-maturity-tree links to math-pipeline-walk via term "math".

### Node: Math Maturity Tree <-> math-verification-gates
- id: bridge-panel-math-maturity-tree-math-verification-gates
- type: bridge
- summary: Panel math-maturity-tree links to math-verification-gates via term "math".

### Node: TSN Determinism <-> simulation-tsn
- id: bridge-panel-tsn-sim-simulation-tsn
- type: bridge
- summary: Panel tsn-sim links to simulation-tsn via term "tsn".

### Node: TSN Determinism <-> schema-confidence-stack
- id: bridge-panel-tsn-sim-schema-confidence-stack
- type: bridge
- summary: Panel tsn-sim links to schema-confidence-stack via term "telemetry".

### Node: TSN Determinism <-> debate-telemetry
- id: bridge-panel-tsn-sim-debate-telemetry
- type: bridge
- summary: Panel tsn-sim links to debate-telemetry via term "telemetry".

### Node: TSN Determinism <-> hardware-telemetry-tree
- id: bridge-panel-tsn-sim-hardware-telemetry-tree
- type: bridge
- summary: Panel tsn-sim links to hardware-telemetry-tree via term "telemetry".

### Node: TSN Determinism <-> skills-telemetry
- id: bridge-panel-tsn-sim-skills-telemetry
- type: bridge
- summary: Panel tsn-sim links to skills-telemetry via term "telemetry".

### Node: TSN Determinism <-> star-models-telemetry
- id: bridge-panel-tsn-sim-star-models-telemetry
- type: bridge
- summary: Panel tsn-sim links to star-models-telemetry via term "telemetry".

### Node: Warp Pulsed Power <-> warp-pulsed-power
- id: bridge-panel-pulsed-power-doc-warp-pulsed-power
- type: bridge
- summary: Panel pulsed-power-doc links to warp-pulsed-power via term "pulsed power".

### Node: Warp Pulsed Power <-> pipeline-ledger-tree
- id: bridge-panel-pulsed-power-doc-pipeline-ledger-tree
- type: bridge
- summary: Panel pulsed-power-doc links to pipeline-ledger-tree via term "pipeline".

### Node: Warp Pulsed Power <-> pipeline-overview
- id: bridge-panel-pulsed-power-doc-pipeline-overview
- type: bridge
- summary: Panel pulsed-power-doc links to pipeline-overview via term "pipeline".

### Node: Warp Pulsed Power <-> bridge-pipeline-overview-curvature-ledger
- id: bridge-panel-pulsed-power-doc-bridge-pipeline-overview-curvature-ledger
- type: bridge
- summary: Panel pulsed-power-doc links to bridge-pipeline-overview-curvature-ledger via term "pipeline".

### Node: Warp Pulsed Power <-> solar-pipeline
- id: bridge-panel-pulsed-power-doc-solar-pipeline
- type: bridge
- summary: Panel pulsed-power-doc links to solar-pipeline via term "pipeline".

### Node: Warp Pulsed Power <-> binding-energy-pipeline
- id: bridge-panel-pulsed-power-doc-binding-energy-pipeline
- type: bridge
- summary: Panel pulsed-power-doc links to binding-energy-pipeline via term "pipeline".

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

### Node: Bus Voltage Program <-> security-hull-guard-tree
- id: bridge-panel-bus-voltage-security-hull-guard-tree
- type: bridge
- summary: Panel bus-voltage links to security-hull-guard-tree via term "Guardrail".

### Node: Bus Voltage Program <-> security-hull-guard
- id: bridge-panel-bus-voltage-security-hull-guard
- type: bridge
- summary: Panel bus-voltage links to security-hull-guard via term "Guardrail".

### Node: KM-Scale Warp Ledger <-> warp-ledger
- id: bridge-panel-warp-ledger-warp-ledger
- type: bridge
- summary: Panel warp-ledger links to warp-ledger via term "warp ledger".

### Node: KM-Scale Warp Ledger <-> ui-panel-warp-ledger
- id: bridge-panel-warp-ledger-ui-panel-warp-ledger
- type: bridge
- summary: Panel warp-ledger links to ui-panel-warp-ledger via term "warp ledger".

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

### Node: Warp Experiment Ladder <-> casimir-tiles-overview
- id: bridge-panel-experiment-ladder-casimir-tiles-overview
- type: bridge
- summary: Panel experiment-ladder links to casimir-tiles-overview via term "casimir".

### Node: Warp Experiment Ladder <-> casimir-tile-mechanism
- id: bridge-panel-experiment-ladder-casimir-tile-mechanism
- type: bridge
- summary: Panel experiment-ladder links to casimir-tile-mechanism via term "casimir".

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

### Node: Spectrum Tuner <-> provenance-protocol
- id: bridge-panel-spectrum-tuner-provenance-protocol
- type: bridge
- summary: Panel spectrum-tuner links to provenance-protocol via term "Provenance".

### Node: Vacuum Gap Heatmap <-> ui-panel-vacuum
- id: bridge-panel-vacuum-gap-heatmap-ui-panel-vacuum
- type: bridge
- summary: Panel vacuum-gap-heatmap links to ui-panel-vacuum via term "vacuum gap".

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

### Node: Cavity Mechanism <-> pipeline-ledger-tree
- id: bridge-panel-cavity-mechanism-pipeline-ledger-tree
- type: bridge
- summary: Panel cavity-mechanism links to pipeline-ledger-tree via term "pipeline".

### Node: Cavity Mechanism <-> pipeline-overview
- id: bridge-panel-cavity-mechanism-pipeline-overview
- type: bridge
- summary: Panel cavity-mechanism links to pipeline-overview via term "pipeline".

### Node: Cavity Mechanism <-> bridge-pipeline-overview-curvature-ledger
- id: bridge-panel-cavity-mechanism-bridge-pipeline-overview-curvature-ledger
- type: bridge
- summary: Panel cavity-mechanism links to bridge-pipeline-overview-curvature-ledger via term "pipeline".

### Node: Cavity Mechanism <-> solar-pipeline
- id: bridge-panel-cavity-mechanism-solar-pipeline
- type: bridge
- summary: Panel cavity-mechanism links to solar-pipeline via term "pipeline".

### Node: Cavity Mechanism <-> binding-energy-pipeline
- id: bridge-panel-cavity-mechanism-binding-energy-pipeline
- type: bridge
- summary: Panel cavity-mechanism links to binding-energy-pipeline via term "pipeline".

### Node: Cavity Mechanism <-> binding-warp-pipeline
- id: bridge-panel-cavity-mechanism-binding-warp-pipeline
- type: bridge
- summary: Panel cavity-mechanism links to binding-warp-pipeline via term "pipeline".

### Node: Solar Navigation <-> ui-hud-nav
- id: bridge-panel-nav-system-ui-hud-nav
- type: bridge
- summary: Panel nav-system links to ui-hud-nav via term "navigation hud".

### Node: Solar Globe <-> ui-panel-solar-globe
- id: bridge-panel-solar-globe-ui-panel-solar-globe
- type: bridge
- summary: Panel solar-globe links to ui-panel-solar-globe via term "solar globe".

### Node: Solar Globe <-> agi-constraint-packs
- id: bridge-panel-solar-globe-agi-constraint-packs
- type: bridge
- summary: Panel solar-globe links to agi-constraint-packs via term "const".

### Node: Solar Globe <-> noise-field-loop
- id: bridge-panel-solar-globe-noise-field-loop
- type: bridge
- summary: Panel solar-globe links to noise-field-loop via term "const".

### Node: Solar Globe <-> diffusion-loop
- id: bridge-panel-solar-globe-diffusion-loop
- type: bridge
- summary: Panel solar-globe links to diffusion-loop via term "const".

### Node: Solar Globe <-> constraint-loop
- id: bridge-panel-solar-globe-constraint-loop
- type: bridge
- summary: Panel solar-globe links to constraint-loop via term "const".

### Node: Solar Globe <-> bridge-analysis-loops-overview-noise-field-loop
- id: bridge-panel-solar-globe-bridge-analysis-loops-overview-noise-field-loop
- type: bridge
- summary: Panel solar-globe links to bridge-analysis-loops-overview-noise-field-loop via term "const".

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

### Node: Silhouette Stretch <-> ts-ratio-guardrail
- id: bridge-panel-model-silhouette-ts-ratio-guardrail
- type: bridge
- summary: Panel model-silhouette links to ts-ratio-guardrail via term "scale".

### Node: Silhouette Stretch <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- id: bridge-panel-model-silhouette-bridge-ts-ratio-guardrail-casimir-tile-mechanism
- type: bridge
- summary: Panel model-silhouette links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "scale".

### Node: Silhouette Stretch <-> qi-autoscale
- id: bridge-panel-model-silhouette-qi-autoscale
- type: bridge
- summary: Panel model-silhouette links to qi-autoscale via term "scale".

### Node: Silhouette Stretch <-> ts-autoscale
- id: bridge-panel-model-silhouette-ts-autoscale
- type: bridge
- summary: Panel model-silhouette links to ts-autoscale via term "scale".

### Node: Silhouette Stretch <-> ui-panel-casimir-grid
- id: bridge-panel-model-silhouette-ui-panel-casimir-grid
- type: bridge
- summary: Panel model-silhouette links to ui-panel-casimir-grid via term "grid".

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

### Node: Hull Metrics Vis <-> natario-metric-engine
- id: bridge-panel-hull-metrics-vis-natario-metric-engine
- type: bridge
- summary: Panel hull-metrics-vis links to natario-metric-engine via term "natario".

### Node: Hull Metrics Vis <-> natario-zero-expansion
- id: bridge-panel-hull-metrics-vis-natario-zero-expansion
- type: bridge
- summary: Panel hull-metrics-vis links to natario-zero-expansion via term "natario".

### Node: Hull Metrics Vis <-> casimir-natario-bridge
- id: bridge-panel-hull-metrics-vis-casimir-natario-bridge
- type: bridge
- summary: Panel hull-metrics-vis links to casimir-natario-bridge via term "natario".

### Node: Shift Vector Panel <-> ui-panel-shift-vector
- id: bridge-panel-shift-vector-ui-panel-shift-vector
- type: bridge
- summary: Panel shift-vector links to ui-panel-shift-vector via term "shift vector".

### Node: Shift Vector Panel <-> shift-vector-expansion-scalar
- id: bridge-panel-shift-vector-shift-vector-expansion-scalar
- type: bridge
- summary: Panel shift-vector links to shift-vector-expansion-scalar via term "shift vector".

### Node: Shift Vector Panel <-> casimir-natario-metric
- id: bridge-panel-shift-vector-casimir-natario-metric
- type: bridge
- summary: Panel shift-vector links to casimir-natario-metric via term "geometry".

### Node: Shift Vector Panel <-> hull-materials
- id: bridge-panel-shift-vector-hull-materials
- type: bridge
- summary: Panel shift-vector links to hull-materials via term "geometry".

### Node: Shift Vector Panel <-> natario-metric-engine
- id: bridge-panel-shift-vector-natario-metric-engine
- type: bridge
- summary: Panel shift-vector links to natario-metric-engine via term "geometry".

### Node: Shift Vector Panel <-> physics-foundations-tree
- id: bridge-panel-shift-vector-physics-foundations-tree
- type: bridge
- summary: Panel shift-vector links to physics-foundations-tree via term "geometry".

### Node: Equatorial Curvature Slice <-> ui-panel-curvature-slices
- id: bridge-panel-curvature-slice-ui-panel-curvature-slices
- type: bridge
- summary: Panel curvature-slice links to ui-panel-curvature-slices via term "curvature slice".

### Node: Time Dilation Lattice <-> ui-panel-time-dilation
- id: bridge-panel-time-dilation-lattice-ui-panel-time-dilation
- type: bridge
- summary: Panel time-dilation-lattice links to ui-panel-time-dilation via term "time dilation".

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

### Node: Operational Mode Switch <-> agi-constraint-packs
- id: bridge-panel-operational-mode-agi-constraint-packs
- type: bridge
- summary: Panel operational-mode links to agi-constraint-packs via term "const".

### Node: Operational Mode Switch <-> noise-field-loop
- id: bridge-panel-operational-mode-noise-field-loop
- type: bridge
- summary: Panel operational-mode links to noise-field-loop via term "const".

### Node: Operational Mode Switch <-> diffusion-loop
- id: bridge-panel-operational-mode-diffusion-loop
- type: bridge
- summary: Panel operational-mode links to diffusion-loop via term "const".

### Node: Operational Mode Switch <-> constraint-loop
- id: bridge-panel-operational-mode-constraint-loop
- type: bridge
- summary: Panel operational-mode links to constraint-loop via term "const".

### Node: Operational Mode Switch <-> bridge-analysis-loops-overview-noise-field-loop
- id: bridge-panel-operational-mode-bridge-analysis-loops-overview-noise-field-loop
- type: bridge
- summary: Panel operational-mode links to bridge-analysis-loops-overview-noise-field-loop via term "const".

### Node: Operational Mode Switch <-> qi-guard-consolidation
- id: bridge-panel-operational-mode-qi-guard-consolidation
- type: bridge
- summary: Panel operational-mode links to qi-guard-consolidation via term "const".

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

### Node: Light-Speed Strobe Scale <-> sector-strobes-duty-cycle
- id: bridge-panel-light-speed-strobe-sector-strobes-duty-cycle
- type: bridge
- summary: Panel light-speed-strobe links to sector-strobes-duty-cycle via term "strobes".

### Node: Speed Capability <-> agi-refinery
- id: bridge-panel-speed-capability-agi-refinery
- type: bridge
- summary: Panel speed-capability links to agi-refinery via term "s".

### Node: Speed Capability <-> agi-trace-memory
- id: bridge-panel-speed-capability-agi-trace-memory
- type: bridge
- summary: Panel speed-capability links to agi-trace-memory via term "s".

### Node: Speed Capability <-> agi-evaluation
- id: bridge-panel-speed-capability-agi-evaluation
- type: bridge
- summary: Panel speed-capability links to agi-evaluation via term "s".

### Node: Speed Capability <-> agi-chat-sessions
- id: bridge-panel-speed-capability-agi-chat-sessions
- type: bridge
- summary: Panel speed-capability links to agi-chat-sessions via term "s".

### Node: Speed Capability <-> agi-contributions
- id: bridge-panel-speed-capability-agi-contributions
- type: bridge
- summary: Panel speed-capability links to agi-contributions via term "s".

### Node: Speed Capability <-> agi-constraint-packs
- id: bridge-panel-speed-capability-agi-constraint-packs
- type: bridge
- summary: Panel speed-capability links to agi-constraint-packs via term "s".

### Node: Helix Casimir Amplifier <-> ui-panel-casimir-amplifier
- id: bridge-panel-helix-casimir-amplifier-ui-panel-casimir-amplifier
- type: bridge
- summary: Panel helix-casimir-amplifier links to ui-panel-casimir-amplifier via term "Casimir amplifier".

### Node: Resonance Scheduler <-> phase-scheduler
- id: bridge-panel-resonance-scheduler-phase-scheduler
- type: bridge
- summary: Panel resonance-scheduler links to phase-scheduler via term "phase scheduler".

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

### Node: Trip Player <-> bridge-analysis-loops-overview-noise-field-loop
- id: bridge-panel-trip-player-bridge-analysis-loops-overview-noise-field-loop
- type: bridge
- summary: Panel trip-player links to bridge-analysis-loops-overview-noise-field-loop via term "constraints".

### Node: Trip Player <-> qi-guard-consolidation
- id: bridge-panel-trip-player-qi-guard-consolidation
- type: bridge
- summary: Panel trip-player links to qi-guard-consolidation via term "constraints".

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

### Node: Fuel Gauge <-> skills-telemetry
- id: bridge-panel-fuel-gauge-skills-telemetry
- type: bridge
- summary: Panel fuel-gauge links to skills-telemetry via term "telemetry".

### Node: Fuel Gauge <-> star-models-telemetry
- id: bridge-panel-fuel-gauge-star-models-telemetry
- type: bridge
- summary: Panel fuel-gauge links to star-models-telemetry via term "telemetry".

### Node: Fuel Gauge <-> bridge-star-runtime-routes-star-models-telemetry
- id: bridge-panel-fuel-gauge-bridge-star-runtime-routes-star-models-telemetry
- type: bridge
- summary: Panel fuel-gauge links to bridge-star-runtime-routes-star-models-telemetry via term "telemetry".

### Node: Vacuum Contract <-> agi-adapter
- id: bridge-panel-vacuum-contract-agi-adapter
- type: bridge
- summary: Panel vacuum-contract links to agi-adapter via term "contract".

### Node: Vacuum Contract <-> uncertainty-data-contracts
- id: bridge-panel-vacuum-contract-uncertainty-data-contracts
- type: bridge
- summary: Panel vacuum-contract links to uncertainty-data-contracts via term "contract".

### Node: Vacuum Contract <-> debate-contracts
- id: bridge-panel-vacuum-contract-debate-contracts
- type: bridge
- summary: Panel vacuum-contract links to debate-contracts via term "contract".

### Node: Vacuum Contract <-> bridge-debate-core-debate-contracts
- id: bridge-panel-vacuum-contract-bridge-debate-core-debate-contracts
- type: bridge
- summary: Panel vacuum-contract links to bridge-debate-core-debate-contracts via term "contract".

### Node: Vacuum Contract <-> llm-runtime-contracts
- id: bridge-panel-vacuum-contract-llm-runtime-contracts
- type: bridge
- summary: Panel vacuum-contract links to llm-runtime-contracts via term "contract".

### Node: Vacuum Contract <-> zen-pillar-03-contracts
- id: bridge-panel-vacuum-contract-zen-pillar-03-contracts
- type: bridge
- summary: Panel vacuum-contract links to zen-pillar-03-contracts via term "contract".

### Node: Metric Amplification Pocket <-> warp-control-stack
- id: bridge-panel-metric-pocket-warp-control-stack
- type: bridge
- summary: Panel metric-pocket links to warp-control-stack via term "fraction".

### Node: Metric Amplification Pocket <-> active-fraction
- id: bridge-panel-metric-pocket-active-fraction
- type: bridge
- summary: Panel metric-pocket links to active-fraction via term "fraction".

### Node: HaloBank Timeline <-> halobank
- id: bridge-panel-halobank-halobank
- type: bridge
- summary: Panel halobank links to halobank via term "HaloBank".

### Node: HaloBank Timeline <-> ui-panel-halobank
- id: bridge-panel-halobank-ui-panel-halobank
- type: bridge
- summary: Panel halobank links to ui-panel-halobank via term "HaloBank".

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

### Node: Qi Widget <-> qi-bounds-engine
- id: bridge-panel-qi-widget-qi-bounds-engine
- type: bridge
- summary: Panel qi-widget links to qi-bounds-engine via term "Ford-Roman".

### Node: Qi Widget <-> ford-roman-proxy
- id: bridge-panel-qi-widget-ford-roman-proxy
- type: bridge
- summary: Panel qi-widget links to ford-roman-proxy via term "Ford-Roman".

### Node: Qi Widget <-> schema-confidence-stack
- id: bridge-panel-qi-widget-schema-confidence-stack
- type: bridge
- summary: Panel qi-widget links to schema-confidence-stack via term "Telemetry".

### Node: Sector Roles HUD <-> ui-hud-sector
- id: bridge-panel-sector-roles-ui-hud-sector
- type: bridge
- summary: Panel sector-roles links to ui-hud-sector via term "sector HUD".

### Node: Runtime Ops <-> bridge-solar-restoration-plan-deep-mixing-plan
- id: bridge-panel-hull-status-bridge-solar-restoration-plan-deep-mixing-plan
- type: bridge
- summary: Panel hull-status links to bridge-solar-restoration-plan-deep-mixing-plan via term "plan b".

### Node: Runtime Ops <-> schema-confidence-stack
- id: bridge-panel-hull-status-schema-confidence-stack
- type: bridge
- summary: Panel hull-status links to schema-confidence-stack via term "telemetry".

### Node: Runtime Ops <-> debate-telemetry
- id: bridge-panel-hull-status-debate-telemetry
- type: bridge
- summary: Panel hull-status links to debate-telemetry via term "telemetry".

### Node: Runtime Ops <-> hardware-telemetry-tree
- id: bridge-panel-hull-status-hardware-telemetry-tree
- type: bridge
- summary: Panel hull-status links to hardware-telemetry-tree via term "telemetry".

### Node: Runtime Ops <-> skills-telemetry
- id: bridge-panel-hull-status-skills-telemetry
- type: bridge
- summary: Panel hull-status links to skills-telemetry via term "telemetry".

### Node: Runtime Ops <-> star-models-telemetry
- id: bridge-panel-hull-status-star-models-telemetry
- type: bridge
- summary: Panel hull-status links to star-models-telemetry via term "telemetry".

### Node: Star Coherence Governor <-> coherence-governor
- id: bridge-panel-star-coherence-coherence-governor
- type: bridge
- summary: Panel star-coherence links to coherence-governor via term "coherence governor".

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

### Node: Star Coherence Governor <-> skills-telemetry
- id: bridge-panel-star-coherence-skills-telemetry
- type: bridge
- summary: Panel star-coherence links to skills-telemetry via term "telemetry".

### Node: Pipeline Proof <-> agi-planner-core
- id: bridge-panel-pipeline-proof-agi-planner-core
- type: bridge
- summary: Panel pipeline-proof links to agi-planner-core via term "grounding".

### Node: Pipeline Proof <-> bridge-agi-plan-execute-agi-planner-core
- id: bridge-panel-pipeline-proof-bridge-agi-plan-execute-agi-planner-core
- type: bridge
- summary: Panel pipeline-proof links to bridge-agi-plan-execute-agi-planner-core via term "grounding".

### Node: Pipeline Proof <-> resonance-tree
- id: bridge-panel-pipeline-proof-resonance-tree
- type: bridge
- summary: Panel pipeline-proof links to resonance-tree via term "resonance".

### Node: Pipeline Proof <-> code-lattice-core
- id: bridge-panel-pipeline-proof-code-lattice-core
- type: bridge
- summary: Panel pipeline-proof links to code-lattice-core via term "resonance".

### Node: Pipeline Proof <-> code-lattice-schema
- id: bridge-panel-pipeline-proof-code-lattice-schema
- type: bridge
- summary: Panel pipeline-proof links to code-lattice-schema via term "resonance".

### Node: Pipeline Proof <-> resonance-runtime
- id: bridge-panel-pipeline-proof-resonance-runtime
- type: bridge
- summary: Panel pipeline-proof links to resonance-runtime via term "resonance".

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

### Node: Collapse Benchmark HUD <-> kappa-proxy
- id: bridge-panel-collapse-benchmark-hud-kappa-proxy
- type: bridge
- summary: Panel collapse-benchmark-hud links to kappa-proxy via term "kappa".

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

### Node: Noise Gens <-> civic-governance-stack
- id: bridge-panel-helix-noise-gens-civic-governance-stack
- type: bridge
- summary: Panel helix-noise-gens links to civic-governance-stack via term "stems".

### Node: Noise Gens <-> interbeing-systems
- id: bridge-panel-helix-noise-gens-interbeing-systems
- type: bridge
- summary: Panel helix-noise-gens links to interbeing-systems via term "stems".

### Node: Noise Gens <-> bridge-integrity-protocols-stack-civic-governance-stack
- id: bridge-panel-helix-noise-gens-bridge-integrity-protocols-stack-civic-governance-stack
- type: bridge
- summary: Panel helix-noise-gens links to bridge-integrity-protocols-stack-civic-governance-stack via term "stems".

### Node: Constraint Pack Policies <-> agi-constraint-packs
- id: bridge-panel-constraint-pack-policy-agi-constraint-packs
- type: bridge
- summary: Panel constraint-pack-policy links to agi-constraint-packs via term "constraint packs".

### Node: Constraint Pack Policies <-> constraint-packs
- id: bridge-panel-constraint-pack-policy-constraint-packs
- type: bridge
- summary: Panel constraint-pack-policy links to constraint-packs via term "constraint packs".

### Node: Constraint Pack Policies <-> deep-mixing-autopilot
- id: bridge-panel-constraint-pack-policy-deep-mixing-autopilot
- type: bridge
- summary: Panel constraint-pack-policy links to deep-mixing-autopilot via term "auto".

### Node: Constraint Pack Policies <-> qi-autoscale
- id: bridge-panel-constraint-pack-policy-qi-autoscale
- type: bridge
- summary: Panel constraint-pack-policy links to qi-autoscale via term "auto".

### Node: Constraint Pack Policies <-> qi-autothrottle
- id: bridge-panel-constraint-pack-policy-qi-autothrottle
- type: bridge
- summary: Panel constraint-pack-policy links to qi-autothrottle via term "auto".

### Node: Constraint Pack Policies <-> ts-autoscale
- id: bridge-panel-constraint-pack-policy-ts-autoscale
- type: bridge
- summary: Panel constraint-pack-policy links to ts-autoscale via term "auto".

### Node: Contribution Workbench <-> agi-contributions
- id: bridge-panel-agi-contribution-workbench-agi-contributions
- type: bridge
- summary: Panel agi-contribution-workbench links to agi-contributions via term "contribution".

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

### Node: Contribution Workbench <-> bridge-certainty-motivation-platonic-reasoning-bridge
- id: bridge-panel-agi-contribution-workbench-bridge-certainty-motivation-platonic-reasoning-bridge
- type: bridge
- summary: Panel agi-contribution-workbench links to bridge-certainty-motivation-platonic-reasoning-bridge via term "verification".

### Node: PNG Edge Cutter <-> agi-constraint-packs
- id: bridge-panel-remove-bg-edges-agi-constraint-packs
- type: bridge
- summary: Panel remove-bg-edges links to agi-constraint-packs via term "const".

### Node: PNG Edge Cutter <-> noise-field-loop
- id: bridge-panel-remove-bg-edges-noise-field-loop
- type: bridge
- summary: Panel remove-bg-edges links to noise-field-loop via term "const".

### Node: PNG Edge Cutter <-> diffusion-loop
- id: bridge-panel-remove-bg-edges-diffusion-loop
- type: bridge
- summary: Panel remove-bg-edges links to diffusion-loop via term "const".

### Node: PNG Edge Cutter <-> constraint-loop
- id: bridge-panel-remove-bg-edges-constraint-loop
- type: bridge
- summary: Panel remove-bg-edges links to constraint-loop via term "const".

### Node: PNG Edge Cutter <-> bridge-analysis-loops-overview-noise-field-loop
- id: bridge-panel-remove-bg-edges-bridge-analysis-loops-overview-noise-field-loop
- type: bridge
- summary: Panel remove-bg-edges links to bridge-analysis-loops-overview-noise-field-loop via term "const".

### Node: PNG Edge Cutter <-> qi-guard-consolidation
- id: bridge-panel-remove-bg-edges-qi-guard-consolidation
- type: bridge
- summary: Panel remove-bg-edges links to qi-guard-consolidation via term "const".

### Node: Dresscode Drafting <-> ui-panel-casimir-grid
- id: bridge-panel-dresscode-ui-panel-casimir-grid
- type: bridge
- summary: Panel dresscode links to ui-panel-casimir-grid via term "grid".

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

### Node: Stellar LSR Viewer <-> stellar-ledger-stack
- id: bridge-panel-stellar-lsr-stellar-ledger-stack
- type: bridge
- summary: Panel stellar-lsr links to stellar-ledger-stack via term "stellar".

### Node: Stellar LSR Viewer <-> stellar-ledger
- id: bridge-panel-stellar-lsr-stellar-ledger
- type: bridge
- summary: Panel stellar-lsr links to stellar-ledger via term "stellar".

## Bridges

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

### Bridge: Phoenix Averaging <-> casimir-tile-schematic-roadmap
- relation: Panel cross-concept join
- summary: Panel helix-phoenix links to casimir-tile-schematic-roadmap via term "casimir tile".

### Bridge: Needle I_peak Worksheet <-> warp-pulsed-power
- relation: Panel cross-concept join
- summary: Panel needle-ipeak-worksheet links to warp-pulsed-power via term "pulsed power".

### Bridge: Needle World Roadmap <-> ts-ratio-guardrail
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to ts-ratio-guardrail via term "TS_ratio".

### Bridge: Needle World Roadmap <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "TS_ratio".

### Bridge: Needle World Roadmap <-> qi-bounds-engine
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to qi-bounds-engine via term "Roman".

### Bridge: Needle World Roadmap <-> ford-roman-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to ford-roman-quantum-inequality via term "Roman".

### Bridge: Needle World Roadmap <-> ford-roman-proxy
- relation: Panel cross-concept join
- summary: Panel needle-world-roadmap links to ford-roman-proxy via term "Roman".

### Bridge: GR Agent Loop Audit <-> ui-panel-gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to ui-panel-gr-agent-loop via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-agent-loop via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> gr-agent-loop-schema
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-agent-loop-schema via term "gr agent loop".

### Bridge: GR Agent Loop Audit <-> gr-constraint-network
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-constraint-network via term "residuals".

### Bridge: GR Agent Loop Audit <-> stage-diagnostic
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to stage-diagnostic via term "residuals".

### Bridge: GR Agent Loop Audit <-> gr-constraint-network
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-audit links to gr-constraint-network via term "residuals".

### Bridge: GR Loop KPIs <-> ui-panel-gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to ui-panel-gr-agent-loop via term "gr agent loop".

### Bridge: GR Loop KPIs <-> gr-agent-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop via term "gr agent loop".

### Bridge: GR Loop KPIs <-> gr-agent-loop-schema
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-kpis links to gr-agent-loop-schema via term "gr agent loop".

### Bridge: GR Loop Learning <-> agi-learning-loop
- relation: Panel cross-concept join
- summary: Panel gr-agent-loop-learning links to agi-learning-loop via term "learning loop".

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

### Bridge: Math Maturity Tree <-> math-pipeline-walk
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to math-pipeline-walk via term "math".

### Bridge: Math Maturity Tree <-> math-verification-gates
- relation: Panel cross-concept join
- summary: Panel math-maturity-tree links to math-verification-gates via term "math".

### Bridge: TSN Determinism <-> simulation-tsn
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to simulation-tsn via term "tsn".

### Bridge: TSN Determinism <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to schema-confidence-stack via term "telemetry".

### Bridge: TSN Determinism <-> debate-telemetry
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to debate-telemetry via term "telemetry".

### Bridge: TSN Determinism <-> hardware-telemetry-tree
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to hardware-telemetry-tree via term "telemetry".

### Bridge: TSN Determinism <-> skills-telemetry
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to skills-telemetry via term "telemetry".

### Bridge: TSN Determinism <-> star-models-telemetry
- relation: Panel cross-concept join
- summary: Panel tsn-sim links to star-models-telemetry via term "telemetry".

### Bridge: Warp Pulsed Power <-> warp-pulsed-power
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to warp-pulsed-power via term "pulsed power".

### Bridge: Warp Pulsed Power <-> pipeline-ledger-tree
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to pipeline-ledger-tree via term "pipeline".

### Bridge: Warp Pulsed Power <-> pipeline-overview
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to pipeline-overview via term "pipeline".

### Bridge: Warp Pulsed Power <-> bridge-pipeline-overview-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to bridge-pipeline-overview-curvature-ledger via term "pipeline".

### Bridge: Warp Pulsed Power <-> solar-pipeline
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to solar-pipeline via term "pipeline".

### Bridge: Warp Pulsed Power <-> binding-energy-pipeline
- relation: Panel cross-concept join
- summary: Panel pulsed-power-doc links to binding-energy-pipeline via term "pipeline".

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

### Bridge: Bus Voltage Program <-> security-hull-guard-tree
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to security-hull-guard-tree via term "Guardrail".

### Bridge: Bus Voltage Program <-> security-hull-guard
- relation: Panel cross-concept join
- summary: Panel bus-voltage links to security-hull-guard via term "Guardrail".

### Bridge: KM-Scale Warp Ledger <-> warp-ledger
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to warp-ledger via term "warp ledger".

### Bridge: KM-Scale Warp Ledger <-> ui-panel-warp-ledger
- relation: Panel cross-concept join
- summary: Panel warp-ledger links to ui-panel-warp-ledger via term "warp ledger".

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

### Bridge: Warp Experiment Ladder <-> casimir-tiles-overview
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to casimir-tiles-overview via term "casimir".

### Bridge: Warp Experiment Ladder <-> casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel experiment-ladder links to casimir-tile-mechanism via term "casimir".

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

### Bridge: Spectrum Tuner <-> provenance-protocol
- relation: Panel cross-concept join
- summary: Panel spectrum-tuner links to provenance-protocol via term "Provenance".

### Bridge: Vacuum Gap Heatmap <-> ui-panel-vacuum
- relation: Panel cross-concept join
- summary: Panel vacuum-gap-heatmap links to ui-panel-vacuum via term "vacuum gap".

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

### Bridge: Cavity Mechanism <-> pipeline-ledger-tree
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to pipeline-ledger-tree via term "pipeline".

### Bridge: Cavity Mechanism <-> pipeline-overview
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to pipeline-overview via term "pipeline".

### Bridge: Cavity Mechanism <-> bridge-pipeline-overview-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to bridge-pipeline-overview-curvature-ledger via term "pipeline".

### Bridge: Cavity Mechanism <-> solar-pipeline
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to solar-pipeline via term "pipeline".

### Bridge: Cavity Mechanism <-> binding-energy-pipeline
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to binding-energy-pipeline via term "pipeline".

### Bridge: Cavity Mechanism <-> binding-warp-pipeline
- relation: Panel cross-concept join
- summary: Panel cavity-mechanism links to binding-warp-pipeline via term "pipeline".

### Bridge: Solar Navigation <-> ui-hud-nav
- relation: Panel cross-concept join
- summary: Panel nav-system links to ui-hud-nav via term "navigation hud".

### Bridge: Solar Globe <-> ui-panel-solar-globe
- relation: Panel cross-concept join
- summary: Panel solar-globe links to ui-panel-solar-globe via term "solar globe".

### Bridge: Solar Globe <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel solar-globe links to agi-constraint-packs via term "const".

### Bridge: Solar Globe <-> noise-field-loop
- relation: Panel cross-concept join
- summary: Panel solar-globe links to noise-field-loop via term "const".

### Bridge: Solar Globe <-> diffusion-loop
- relation: Panel cross-concept join
- summary: Panel solar-globe links to diffusion-loop via term "const".

### Bridge: Solar Globe <-> constraint-loop
- relation: Panel cross-concept join
- summary: Panel solar-globe links to constraint-loop via term "const".

### Bridge: Solar Globe <-> bridge-analysis-loops-overview-noise-field-loop
- relation: Panel cross-concept join
- summary: Panel solar-globe links to bridge-analysis-loops-overview-noise-field-loop via term "const".

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

### Bridge: Silhouette Stretch <-> ts-ratio-guardrail
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to ts-ratio-guardrail via term "scale".

### Bridge: Silhouette Stretch <-> bridge-ts-ratio-guardrail-casimir-tile-mechanism
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to bridge-ts-ratio-guardrail-casimir-tile-mechanism via term "scale".

### Bridge: Silhouette Stretch <-> qi-autoscale
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to qi-autoscale via term "scale".

### Bridge: Silhouette Stretch <-> ts-autoscale
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to ts-autoscale via term "scale".

### Bridge: Silhouette Stretch <-> ui-panel-casimir-grid
- relation: Panel cross-concept join
- summary: Panel model-silhouette links to ui-panel-casimir-grid via term "grid".

### Bridge: Hull Metrics Vis <-> ui-panel-alcubierre
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to ui-panel-alcubierre via term "alcubierre".

### Bridge: Hull Metrics Vis <-> alcubierre-metric
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to alcubierre-metric via term "alcubierre".

### Bridge: Hull Metrics Vis <-> casimir-natario-metric
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to casimir-natario-metric via term "natario".

### Bridge: Hull Metrics Vis <-> natario-metric-engine
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to natario-metric-engine via term "natario".

### Bridge: Hull Metrics Vis <-> natario-zero-expansion
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to natario-zero-expansion via term "natario".

### Bridge: Hull Metrics Vis <-> casimir-natario-bridge
- relation: Panel cross-concept join
- summary: Panel hull-metrics-vis links to casimir-natario-bridge via term "natario".

### Bridge: Shift Vector Panel <-> ui-panel-shift-vector
- relation: Panel cross-concept join
- summary: Panel shift-vector links to ui-panel-shift-vector via term "shift vector".

### Bridge: Shift Vector Panel <-> shift-vector-expansion-scalar
- relation: Panel cross-concept join
- summary: Panel shift-vector links to shift-vector-expansion-scalar via term "shift vector".

### Bridge: Shift Vector Panel <-> casimir-natario-metric
- relation: Panel cross-concept join
- summary: Panel shift-vector links to casimir-natario-metric via term "geometry".

### Bridge: Shift Vector Panel <-> hull-materials
- relation: Panel cross-concept join
- summary: Panel shift-vector links to hull-materials via term "geometry".

### Bridge: Shift Vector Panel <-> natario-metric-engine
- relation: Panel cross-concept join
- summary: Panel shift-vector links to natario-metric-engine via term "geometry".

### Bridge: Shift Vector Panel <-> physics-foundations-tree
- relation: Panel cross-concept join
- summary: Panel shift-vector links to physics-foundations-tree via term "geometry".

### Bridge: Equatorial Curvature Slice <-> ui-panel-curvature-slices
- relation: Panel cross-concept join
- summary: Panel curvature-slice links to ui-panel-curvature-slices via term "curvature slice".

### Bridge: Time Dilation Lattice <-> ui-panel-time-dilation
- relation: Panel cross-concept join
- summary: Panel time-dilation-lattice links to ui-panel-time-dilation via term "time dilation".

### Bridge: Curvature Ledger <-> curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to curvature-ledger via term "curvature ledger".

### Bridge: Curvature Ledger <-> bridge-pipeline-overview-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to bridge-pipeline-overview-curvature-ledger via term "curvature ledger".

### Bridge: Curvature Ledger <-> ui-panel-curvature-ledger
- relation: Panel cross-concept join
- summary: Panel curvature-ledger links to ui-panel-curvature-ledger via term "curvature ledger".

### Bridge: Operational Mode Switch <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel operational-mode links to agi-constraint-packs via term "const".

### Bridge: Operational Mode Switch <-> noise-field-loop
- relation: Panel cross-concept join
- summary: Panel operational-mode links to noise-field-loop via term "const".

### Bridge: Operational Mode Switch <-> diffusion-loop
- relation: Panel cross-concept join
- summary: Panel operational-mode links to diffusion-loop via term "const".

### Bridge: Operational Mode Switch <-> constraint-loop
- relation: Panel cross-concept join
- summary: Panel operational-mode links to constraint-loop via term "const".

### Bridge: Operational Mode Switch <-> bridge-analysis-loops-overview-noise-field-loop
- relation: Panel cross-concept join
- summary: Panel operational-mode links to bridge-analysis-loops-overview-noise-field-loop via term "const".

### Bridge: Operational Mode Switch <-> qi-guard-consolidation
- relation: Panel cross-concept join
- summary: Panel operational-mode links to qi-guard-consolidation via term "const".

### Bridge: Casimir Tile Grid <-> ui-panel-casimir-grid
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to ui-panel-casimir-grid via term "Casimir tile grid".

### Bridge: Casimir Tile Grid <-> casimir-tiles-tree
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to casimir-tiles-tree via term "Casimir tiles".

### Bridge: Casimir Tile Grid <-> casimir-tiles-overview
- relation: Panel cross-concept join
- summary: Panel casimir-tile-grid links to casimir-tiles-overview via term "Casimir tiles".

### Bridge: Light-Speed Strobe Scale <-> sector-strobes-duty-cycle
- relation: Panel cross-concept join
- summary: Panel light-speed-strobe links to sector-strobes-duty-cycle via term "strobes".

### Bridge: Speed Capability <-> agi-refinery
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-refinery via term "s".

### Bridge: Speed Capability <-> agi-trace-memory
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-trace-memory via term "s".

### Bridge: Speed Capability <-> agi-evaluation
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-evaluation via term "s".

### Bridge: Speed Capability <-> agi-chat-sessions
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-chat-sessions via term "s".

### Bridge: Speed Capability <-> agi-contributions
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-contributions via term "s".

### Bridge: Speed Capability <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel speed-capability links to agi-constraint-packs via term "s".

### Bridge: Helix Casimir Amplifier <-> ui-panel-casimir-amplifier
- relation: Panel cross-concept join
- summary: Panel helix-casimir-amplifier links to ui-panel-casimir-amplifier via term "Casimir amplifier".

### Bridge: Resonance Scheduler <-> phase-scheduler
- relation: Panel cross-concept join
- summary: Panel resonance-scheduler links to phase-scheduler via term "phase scheduler".

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

### Bridge: Trip Player <-> bridge-analysis-loops-overview-noise-field-loop
- relation: Panel cross-concept join
- summary: Panel trip-player links to bridge-analysis-loops-overview-noise-field-loop via term "constraints".

### Bridge: Trip Player <-> qi-guard-consolidation
- relation: Panel cross-concept join
- summary: Panel trip-player links to qi-guard-consolidation via term "constraints".

### Bridge: Fuel Gauge <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to schema-confidence-stack via term "telemetry".

### Bridge: Fuel Gauge <-> debate-telemetry
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to debate-telemetry via term "telemetry".

### Bridge: Fuel Gauge <-> hardware-telemetry-tree
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to hardware-telemetry-tree via term "telemetry".

### Bridge: Fuel Gauge <-> skills-telemetry
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to skills-telemetry via term "telemetry".

### Bridge: Fuel Gauge <-> star-models-telemetry
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to star-models-telemetry via term "telemetry".

### Bridge: Fuel Gauge <-> bridge-star-runtime-routes-star-models-telemetry
- relation: Panel cross-concept join
- summary: Panel fuel-gauge links to bridge-star-runtime-routes-star-models-telemetry via term "telemetry".

### Bridge: Vacuum Contract <-> agi-adapter
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to agi-adapter via term "contract".

### Bridge: Vacuum Contract <-> uncertainty-data-contracts
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to uncertainty-data-contracts via term "contract".

### Bridge: Vacuum Contract <-> debate-contracts
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to debate-contracts via term "contract".

### Bridge: Vacuum Contract <-> bridge-debate-core-debate-contracts
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to bridge-debate-core-debate-contracts via term "contract".

### Bridge: Vacuum Contract <-> llm-runtime-contracts
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to llm-runtime-contracts via term "contract".

### Bridge: Vacuum Contract <-> zen-pillar-03-contracts
- relation: Panel cross-concept join
- summary: Panel vacuum-contract links to zen-pillar-03-contracts via term "contract".

### Bridge: Metric Amplification Pocket <-> warp-control-stack
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to warp-control-stack via term "fraction".

### Bridge: Metric Amplification Pocket <-> active-fraction
- relation: Panel cross-concept join
- summary: Panel metric-pocket links to active-fraction via term "fraction".

### Bridge: HaloBank Timeline <-> halobank
- relation: Panel cross-concept join
- summary: Panel halobank links to halobank via term "HaloBank".

### Bridge: HaloBank Timeline <-> ui-panel-halobank
- relation: Panel cross-concept join
- summary: Panel halobank links to ui-panel-halobank via term "HaloBank".

### Bridge: Qi Widget <-> qi-bounds
- relation: Panel cross-concept join
- summary: Panel qi-widget links to qi-bounds via term "quantum inequality".

### Bridge: Qi Widget <-> ford-roman-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel qi-widget links to ford-roman-quantum-inequality via term "quantum inequality".

### Bridge: Qi Widget <-> uncertainty-quantum-inequality
- relation: Panel cross-concept join
- summary: Panel qi-widget links to uncertainty-quantum-inequality via term "quantum inequality".

### Bridge: Qi Widget <-> qi-bounds-engine
- relation: Panel cross-concept join
- summary: Panel qi-widget links to qi-bounds-engine via term "Ford-Roman".

### Bridge: Qi Widget <-> ford-roman-proxy
- relation: Panel cross-concept join
- summary: Panel qi-widget links to ford-roman-proxy via term "Ford-Roman".

### Bridge: Qi Widget <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel qi-widget links to schema-confidence-stack via term "Telemetry".

### Bridge: Sector Roles HUD <-> ui-hud-sector
- relation: Panel cross-concept join
- summary: Panel sector-roles links to ui-hud-sector via term "sector HUD".

### Bridge: Runtime Ops <-> bridge-solar-restoration-plan-deep-mixing-plan
- relation: Panel cross-concept join
- summary: Panel hull-status links to bridge-solar-restoration-plan-deep-mixing-plan via term "plan b".

### Bridge: Runtime Ops <-> schema-confidence-stack
- relation: Panel cross-concept join
- summary: Panel hull-status links to schema-confidence-stack via term "telemetry".

### Bridge: Runtime Ops <-> debate-telemetry
- relation: Panel cross-concept join
- summary: Panel hull-status links to debate-telemetry via term "telemetry".

### Bridge: Runtime Ops <-> hardware-telemetry-tree
- relation: Panel cross-concept join
- summary: Panel hull-status links to hardware-telemetry-tree via term "telemetry".

### Bridge: Runtime Ops <-> skills-telemetry
- relation: Panel cross-concept join
- summary: Panel hull-status links to skills-telemetry via term "telemetry".

### Bridge: Runtime Ops <-> star-models-telemetry
- relation: Panel cross-concept join
- summary: Panel hull-status links to star-models-telemetry via term "telemetry".

### Bridge: Star Coherence Governor <-> coherence-governor
- relation: Panel cross-concept join
- summary: Panel star-coherence links to coherence-governor via term "coherence governor".

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

### Bridge: Star Coherence Governor <-> skills-telemetry
- relation: Panel cross-concept join
- summary: Panel star-coherence links to skills-telemetry via term "telemetry".

### Bridge: Pipeline Proof <-> agi-planner-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to agi-planner-core via term "grounding".

### Bridge: Pipeline Proof <-> bridge-agi-plan-execute-agi-planner-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to bridge-agi-plan-execute-agi-planner-core via term "grounding".

### Bridge: Pipeline Proof <-> resonance-tree
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to resonance-tree via term "resonance".

### Bridge: Pipeline Proof <-> code-lattice-core
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to code-lattice-core via term "resonance".

### Bridge: Pipeline Proof <-> code-lattice-schema
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to code-lattice-schema via term "resonance".

### Bridge: Pipeline Proof <-> resonance-runtime
- relation: Panel cross-concept join
- summary: Panel pipeline-proof links to resonance-runtime via term "resonance".

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

### Bridge: Collapse Benchmark HUD <-> kappa-proxy
- relation: Panel cross-concept join
- summary: Panel collapse-benchmark-hud links to kappa-proxy via term "kappa".

### Bridge: Noise Gens <-> ui-panel-noise-gen
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to ui-panel-noise-gen via term "noise gen".

### Bridge: Noise Gens <-> ui-panel-noise-gens
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to ui-panel-noise-gens via term "noise gen".

### Bridge: Noise Gens <-> coverage-gate
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to coverage-gate via term "cover".

### Bridge: Noise Gens <-> civic-governance-stack
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to civic-governance-stack via term "stems".

### Bridge: Noise Gens <-> interbeing-systems
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to interbeing-systems via term "stems".

### Bridge: Noise Gens <-> bridge-integrity-protocols-stack-civic-governance-stack
- relation: Panel cross-concept join
- summary: Panel helix-noise-gens links to bridge-integrity-protocols-stack-civic-governance-stack via term "stems".

### Bridge: Constraint Pack Policies <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to agi-constraint-packs via term "constraint packs".

### Bridge: Constraint Pack Policies <-> constraint-packs
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to constraint-packs via term "constraint packs".

### Bridge: Constraint Pack Policies <-> deep-mixing-autopilot
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to deep-mixing-autopilot via term "auto".

### Bridge: Constraint Pack Policies <-> qi-autoscale
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to qi-autoscale via term "auto".

### Bridge: Constraint Pack Policies <-> qi-autothrottle
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to qi-autothrottle via term "auto".

### Bridge: Constraint Pack Policies <-> ts-autoscale
- relation: Panel cross-concept join
- summary: Panel constraint-pack-policy links to ts-autoscale via term "auto".

### Bridge: Contribution Workbench <-> agi-contributions
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to agi-contributions via term "contribution".

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

### Bridge: Contribution Workbench <-> bridge-certainty-motivation-platonic-reasoning-bridge
- relation: Panel cross-concept join
- summary: Panel agi-contribution-workbench links to bridge-certainty-motivation-platonic-reasoning-bridge via term "verification".

### Bridge: PNG Edge Cutter <-> agi-constraint-packs
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to agi-constraint-packs via term "const".

### Bridge: PNG Edge Cutter <-> noise-field-loop
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to noise-field-loop via term "const".

### Bridge: PNG Edge Cutter <-> diffusion-loop
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to diffusion-loop via term "const".

### Bridge: PNG Edge Cutter <-> constraint-loop
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to constraint-loop via term "const".

### Bridge: PNG Edge Cutter <-> bridge-analysis-loops-overview-noise-field-loop
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to bridge-analysis-loops-overview-noise-field-loop via term "const".

### Bridge: PNG Edge Cutter <-> qi-guard-consolidation
- relation: Panel cross-concept join
- summary: Panel remove-bg-edges links to qi-guard-consolidation via term "const".

### Bridge: Dresscode Drafting <-> ui-panel-casimir-grid
- relation: Panel cross-concept join
- summary: Panel dresscode links to ui-panel-casimir-grid via term "grid".

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

### Bridge: Stellar LSR Viewer <-> stellar-ledger-stack
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-ledger-stack via term "stellar".

### Bridge: Stellar LSR Viewer <-> stellar-ledger
- relation: Panel cross-concept join
- summary: Panel stellar-lsr links to stellar-ledger via term "stellar".
