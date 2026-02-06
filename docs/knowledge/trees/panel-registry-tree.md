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
