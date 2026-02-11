import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Atom,
  Bolt,
  Calculator,
  Circle,
  ClipboardList,
  Equal,
  Flame,
  Gauge,
  GaugeCircle,
  Globe2,
  Grid3x3,
  History,
  Layers,
  LayoutGrid,
  LineChart,
  Map,
  Move3d,
  Navigation2,
  Microscope,
  Ruler,
  RadioTower,
  Rocket,
  Scissors,
  ScrollText,
  Sparkles,
  TerminalSquare,
  Settings,
  Shield,
  ShieldCheck,
  Sun,
  Target,
  Timer,
  Waves,
  PlayCircle,
  Users
} from "lucide-react";

type LoaderFactory = () => Promise<{ default: ComponentType<any> }>;

export type HelixPanelRef = {
  id: string;
  title: string;
  icon?: LucideIcon;
  keywords?: string[];
  loader: LoaderFactory;
  endpoints?: string[];
  pinned?: boolean;
  skipTaskbar?: boolean;
  defaultSize?: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
  defaultOpen?: boolean;
  /**
   * True when the panel is usable with touch-first ergonomics (no hover-only controls or drag-only input).
   * Panels default to desktop-only unless explicitly marked.
   */
  mobileReady?: boolean;
  heavy?: boolean;
};

const API = {
  pipelineGet: "GET /api/helix/pipeline",
  pipelineUpdate: "POST /api/helix/pipeline/update",
  helixMode: "POST /api/helix/mode",
  helixSweep: "POST /api/helix/sweep/run",
  helixSnapshot: "GET /api/helix/snapshot",
  helixMetrics: "GET /api/helix/metrics",
  helixDisplacement: "GET /api/helix/displacement",
  helixSpectrumRead: "GET /api/helix/spectrum",
  helixSpectrumWrite: "POST /api/helix/spectrum",
  grAgentLoop: "GET /api/helix/gr-agent-loop",
  grAgentLoopKpis: "GET /api/helix/gr-agent-loop/kpis",
  mathGraph: "GET /api/helix/math/graph",
  auditTree: "GET /api/helix/audit/tree",
  tokamakState: "GET /api/physics/tokamak/sim",
  tokamakCommand: "POST /api/physics/tokamak/command"
} as const;

const PANEL_KEYWORDS: Record<string, string[]> = {
  "viz-diagnostics": ["viz hud", "diagnostics overlay", "shader debug", "fps meter", "render stack"],
  "energy-flux": ["flux monitor", "stability histogram", "|T_ab|", "phi_A", "R = (phi_A)/(I3 + |T|)"],
  "helix-phoenix": ["phoenix averaging", "needle hull", "light-crossing", "kappa_drive", "casimir tile", "hann window"],
  "microscopy": ["microscopy mode", "microprobe", "phase contrast", "nm scale", "Coulomb sweep"],
  "electron-orbital": ["orbital density", "Bohr k/q/g", "toroidal packets", "Coulomb probe", "iso-surface"],
  "drive-guards": ["I3_geo", "I3_VdB", "Q_cavity", "guard bands", "sector strobing"],
  "mass-provenance": [
    "mass provenance",
    "mass source",
    "dataset id",
    "fit residuals",
    "invariant mass",
    "override warnings"
  ],
  "gr-agent-loop-audit": ["gr agent loop", "residuals", "gate audit", "accepted config", "warp constraints"],
  "gr-agent-loop-kpis": ["gr agent loop", "kpi", "success rate", "time to green", "constraint violations", "perf trend"],
  "gr-agent-loop-learning": [
    "learning loop",
    "patch ladder",
    "failure backlog",
    "run comparison",
    "accepted config history",
    "residual trend",
    "gate trend"
  ],
  "math-maturity-tree": [
    "math maturity",
    "math graph",
    "stage ladder",
    "unit coverage",
    "repo audit"
  ],
  "universal-audit-tree": [
    "audit tree",
    "ideology tags",
    "repo audit",
    "integrity map",
    "verification map"
  ],
  "conformity-launch-rail": [
    "conformity",
    "self alignment",
    "gravity wells",
    "expansion contraction",
    "deterministic rails",
    "resource allocation",
    "leadership",
    "actualization",
    "frontier",
    "constraint ladder"
  ],
  "warp-ledger": ["km-scale ledger", "warp ledger", "bubble log", "warp km", "ledger bands"],
  "spectrum-tuner": ["spectrum tuner", "FFT", "frequency dial", "harmonics sweep", "waveform tuner"],
  "experiment-ladder": ["experiment ladder", "casimir", "phoenix", "ford-roman", "natario", "sector gating"],
  "vacuum-gap-heatmap": ["vacuum gap", "Casimir gap", "nm gap map", "heatmap", "gap stress"],
  "star-hydrostatic": ["HR map", "Gamow window", "potato threshold", "polytrope", "stellar ledger"],
  "star-watcher": ["Solar feed", "Coherence overlay", "Motion metrics"],
  "tokamak-sim": [
    "tokamak",
    "sparc",
    "plasma",
    "coherence diagnostics",
    "k-metrics",
    "ridge tracking",
    "precursor"
  ],
  "vacuum-gap-sweep": ["gap sweep", "delta gap", "scan HUD", "nm sweep", "sweep HUD"],
  "cavity-mechanism": ["cavity frame", "mechanism view", "design layers", "actuator layout", "mechanism CAD"],
  "fractional-coherence-rail": ["fractional coherence", "xi rail", "coherence rail", "phase rail", "coherence band"],
  "fractional-coherence-grid": ["coherence grid", "xi grid", "fractional grid", "phase lattice", "coherence lattice"],
  "near-zero": ["near zero widget", "delta H", "null detection", "near-zero pocket", "anomaly finder"],
  "direction-pad": ["direction pad", "flight director", "vector pad", "nav pad", "pose nudge"],
  "nav-system": ["nav system", "nav pose", "waypoints", "navigation hud", "pose tracking"],
  "needle-world-roadmap": ["needle roadmap", "partner map", "timeline", "capex", "opex", "world map"],
  "deepmix-solar": ["deep mix solar", "mixing bands", "sector solver", "solar telemetry", "mix heuristics"],
  "solar-globe": ["solar globe", "synoptic globe", "field lines", "magnetogram", "solar surface"],
  "deepmix-sweetspot": ["sweet spot", "deep mix target", "isoline", "mix optimization", "duty sweet spot"],
  "deepmix-globe": ["deep mix globe", "mix field", "global mix", "deep mixing globe"],
  "alcubierre-viewer": ["Alcubierre metric", "warp bubble", "metric tensor", "warp visualizer", "bubble hull"],
  "shell-outline": ["shell outline", "hull trace", "hull shell", "outline view", "needle shell"],
  "shift-vector": ["shift vector", "beta^i", "lapse shift", "ADM shift", "beta_i"],
  "curvature-slice": ["curvature slice", "R_ab", "Ricci slice", "scalar curvature", "curvature cut"],
  "curvature-ledger": ["curvature ledger", "Weyl bands", "tensor ledger", "Riemann register", "ledger trace"],
  "operational-mode": ["operational mode", "station vs desktop", "mode toggle", "profile switch", "mission view"],
  "casimir-tile-grid": ["Casimir tile grid", "tile spectrum", "grid view", "tile ledger", "Casimir tiles"],
  "light-speed-strobe": ["light speed strobe", "c strobe", "strobes", "speed scale", "strobe ladder"],
  "speed-capability": ["speed capability", "beta", "v/c", "translation speed", "power envelope", "mode envelope"],
  "helix-casimir-amplifier": ["Helix amplifier", "Casimir amplifier", "gain stack", "amplifier tile", "Casimir gain"],
  "resonance-scheduler": ["resonance scheduler", "duty planner", "phase scheduler", "auto duty", "resonance bands"],
  "trip-player": ["trip player", "timeline playback", "recording", "session replay", "trip log"],
  "fuel-gauge": ["fuel gauge", "drive budget", "burn rate", "energy reserve", "fuel burn"],
  "vacuum-contract": ["vacuum contract", "negative energy covenant", "contract badge", "Casimir promise", "vacuum pledge"],
  "metric-pocket": ["metric pocket", "amplification pocket", "tensor pocket", "metric gain", "metric amplifier"],
  "halobank": ["HaloBank", "timeline", "halo ledger", "bank history", "halo archive"],
  "qi-widget": ["QI widget", "quantum inequality", "Ford-Roman", "QI bounds", "rho_min"],
  "qi-auto-tuner": ["QI auto tuner", "phase auto", "QI scheduler", "auto duty", "quantum inequality tuner"],
  "sector-legend": ["sector legend", "color legend", "sector key", "legend ring", "sector palette"],
  "sector-roles": ["sector roles", "sector HUD", "role badges", "sector overlay", "role legend"],
  "sweep-replay": ["sweep replay", "sweep telemetry", "recorded sweep", "sweep log", "sweep playback"],
  "bus-voltage": ["bus voltage", "hv rail", "power policy", "amps", "setpoint"],
  "hull-status": ["runtime ops", "plan b", "runtime policy", "endpoint guard", "queue telemetry"],
  "agi-debate-view": ["AGI debate", "debate SSE", "argument stream", "multi agent debate", "debate dashboard"],
  "agi-essence-console": ["Essence console", "AGI console", "plan execute", "tools logs", "command console"],
  "agi-contribution-workbench": [
    "contribution",
    "receipt",
    "VCU",
    "review queue",
    "verification",
    "evidence"
  ],
  "star-coherence": ["star coherence", "coherence governor", "tool budget", "collapse policy", "telemetry"],
  "collapse-monitor": ["collapse pressure", "collapse watcher", "coherence gate", "debate collapse", "star collapse"],
  "agi-task-history": ["task history", "AGI trace", "task log", "history queue", "trace timeline"],
  "constraint-pack-policy": ["constraint packs", "policy profile", "budget overrides", "thresholds", "pack governance"],
  "essence-proposals": ["essence proposals", "proposal queue", "jobs board", "proposal actions", "proposal mgr"],
  "dresscode": ["dresscode", "pattern", "draft", "garment", "svg", "grid", "clip mask"],
  "stellar-lsr": ["stars", "lsr", "local standard of rest", "catalog", "nav", "stellar"],
  "model-silhouette": ["glb", "bbox", "ellipsoid", "scale", "axes", "grid"],
  "hull-metrics-vis": ["hull metrics", "natario", "alcubierre", "glb preview", "wireframe"],
  "collapse-benchmark-hud": ["collapse benchmark", "tau", "L_present", "kappa", "lattice hash", "relativity"],
  "remove-bg-edges": ["background removal", "png alpha", "canny", "grabcut", "opencv", "mask"],
  "time-dilation-lattice": ["time dilation", "spacetime lattice", "clock rate", "alpha", "grid warp"]
};

function lazyPanel<T extends Record<string, unknown>>(
  importer: () => Promise<T>,
  named?: keyof T | string
): LoaderFactory {
  return () =>
    importer().then((mod) => {
      const key = named ? String(named) : "default";
      const candidate = (mod as Record<string, ComponentType<any>>).default ?? (mod as Record<string, ComponentType<any>>)[key];
      if (!candidate) {
        throw new Error(`Helix panel loader missing export "${key}"`);
      }
      return { default: candidate };
    });
}

const RAW_HELIX_PANELS: HelixPanelRef[] = [
  {
    id: "viz-diagnostics",
    title: "Viz Diagnostics HUD",
    icon: Gauge,
    loader: lazyPanel(() => import("@/components/warp/VizDiagnosticsPanel")),
    defaultSize: { w: 520, h: 420 },
    defaultPosition: { x: 80, y: 80 },
    pinned: true
  },
  {
    id: "energy-flux",
    title: "Energy Flux Stability",
    icon: Equal,
    loader: lazyPanel(() => import("@/components/EnergyFluxPanel")),
    defaultSize: { w: 960, h: 660 },
    defaultPosition: { x: 120, y: 120 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "helix-phoenix",
    title: "Phoenix Averaging",
    icon: Flame,
    loader: lazyPanel(() => import("@/components/PhoenixNeedlePanel")),
    pinned: true,
    defaultOpen: true,
    defaultSize: { w: 1040, h: 700 },
    defaultPosition: { x: 180, y: 140 }
  },
  {
    id: "microscopy",
    title: "Microscopy Mode",
    icon: Microscope,
    loader: lazyPanel(() => import("@/components/MicroscopyPanel"), "MicroscopyPanel"),
    defaultSize: { w: 960, h: 660 },
    defaultPosition: { x: 360, y: 220 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "needle-ipeak-worksheet",
    title: "Needle I_peak Worksheet",
    icon: Calculator,
    loader: lazyPanel(() => import("@/components/NeedleIpeakWorksheetPanel")),
    defaultSize: { w: 1120, h: 760 },
    defaultPosition: { x: 200, y: 140 },
    keywords: ["pulsed power", "i_peak", "worksheet", "needle hull", "blumlein", "pfn"]
  },
  {
    id: "needle-world-roadmap",
    title: "Needle World Roadmap",
    icon: Globe2,
    loader: lazyPanel(() => import("@/components/NeedleWorldRoadmap")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 220, y: 180 }
  },
  {
    id: "electron-orbital",
    title: "Electron Orbital Simulator",
    icon: Atom,
    loader: lazyPanel(() => import("@/components/ElectronOrbitalPanel")),
    defaultSize: { w: 1120, h: 720 },
    defaultPosition: { x: 180, y: 160 },
    endpoints: [API.pipelineGet, API.helixSnapshot]
  },
  {
    id: "drive-guards",
    title: "Drive Guards",
    icon: ShieldCheck,
    loader: lazyPanel(() => import("@/components/DriveGuardsPanel")),
    pinned: true,
    defaultSize: { w: 920, h: 640 },
    defaultPosition: { x: 96, y: 64 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "mass-provenance",
    title: "Mass Provenance",
    icon: ClipboardList,
    loader: lazyPanel(() => import("@/components/MassProvenancePanel")),
    pinned: true,
    defaultOpen: true,
    defaultSize: { w: 520, h: 360 },
    defaultPosition: { x: 140, y: 120 },
    mobileReady: true,
    endpoints: [API.pipelineGet],
    keywords: PANEL_KEYWORDS["mass-provenance"]
  },
  {
    id: "gr-agent-loop-audit",
    title: "GR Agent Loop Audit",
    icon: LineChart,
    loader: lazyPanel(() => import("@/components/GrAgentLoopAuditPanel")),
    defaultSize: { w: 720, h: 520 },
    defaultPosition: { x: 220, y: 140 },
    mobileReady: true,
    endpoints: [API.grAgentLoop]
  },
  {
    id: "gr-agent-loop-kpis",
    title: "GR Loop KPIs",
    icon: Gauge,
    loader: lazyPanel(() => import("@/components/GrAgentLoopKpiPanel")),
    defaultSize: { w: 640, h: 420 },
    defaultPosition: { x: 240, y: 120 },
    mobileReady: true,
    endpoints: [API.grAgentLoopKpis]
  },
  {
    id: "gr-agent-loop-learning",
    title: "GR Loop Learning",
    icon: ClipboardList,
    loader: lazyPanel(() => import("@/components/GrAgentLoopLearningPanel")),
    defaultSize: { w: 900, h: 660 },
    defaultPosition: { x: 260, y: 160 },
    mobileReady: true,
    endpoints: [API.grAgentLoop]
  },
  {
    id: "math-maturity-tree",
    title: "Math Maturity Tree",
    icon: Layers,
    loader: lazyPanel(() => import("@/components/MathMaturityTreePanel")),      
    defaultSize: { w: 900, h: 680 },
    defaultPosition: { x: 280, y: 180 },
    mobileReady: true,
    endpoints: [API.mathGraph],
    keywords: PANEL_KEYWORDS["math-maturity-tree"]
  },
  {
    id: "universal-audit-tree",
    title: "Universal Audit Tree",
    icon: Shield,
    loader: lazyPanel(() => import("@/components/UniversalAuditTreePanel")),
    defaultSize: { w: 900, h: 680 },
    defaultPosition: { x: 320, y: 200 },
    mobileReady: true,
    endpoints: [API.auditTree],
    keywords: PANEL_KEYWORDS["universal-audit-tree"]
  },
  {
    id: "conformity-launch-rail",
    title: "Conformity Launch Rail",
    icon: Target,
    loader: lazyPanel(
      () => import("@/components/ideology/ConformityLaunchRailPanel"),
      "ConformityLaunchRailPanel"
    ),
    defaultSize: { w: 960, h: 680 },
    defaultPosition: { x: 340, y: 220 },
    mobileReady: true,
    keywords: PANEL_KEYWORDS["conformity-launch-rail"]
  },
  {
    id: "tsn-sim",
    title: "TSN Determinism",
    icon: RadioTower,
    loader: lazyPanel(() => import("@/components/HelixTsnPanel")),
    defaultSize: { w: 980, h: 640 },
    defaultPosition: { x: 160, y: 120 },
    endpoints: ["POST /api/sim/tsn"],
    keywords: ["tsn", "gptp", "qbv", "deterministic", "latency", "clock", "white rabbit"]
  },
  {
    id: "pulsed-power-doc",
    title: "Warp Pulsed Power",
    icon: Bolt,
    loader: lazyPanel(() => import("@/components/PulsedPowerDocPanel")),
    defaultSize: { w: 1000, h: 680 },
    defaultPosition: { x: 140, y: 20 },
    keywords: ["warp", "pulsed power", "coil", "pipeline", "hardware"]
  },
  {
    id: "bus-voltage",
    title: "Bus Voltage Program",
    icon: GaugeCircle,
    loader: lazyPanel(() => import("@/components/BusVoltagePanel")),
    defaultSize: { w: 920, h: 620 },
    defaultPosition: { x: 160, y: 80 },
    endpoints: [API.pipelineGet],
    keywords: PANEL_KEYWORDS["bus-voltage"]
  },
  {
    id: "warp-ledger",
    title: "KM-Scale Warp Ledger",
    icon: ScrollText,
    loader: lazyPanel(() => import("@/components/WarpLedgerPanel")),
    pinned: true,
    defaultSize: { w: 1080, h: 720 },
    defaultPosition: { x: 140, y: 32 },
    endpoints: ["GET /km-scale-warp-ledger"]
  },
  {
    id: "experiment-ladder",
    title: "Warp Experiment Ladder",
    icon: ClipboardList,
    loader: lazyPanel(() => import("@/components/WarpExperimentLadderPanel")),
    defaultSize: { w: 1120, h: 780 },
    defaultPosition: { x: 200, y: 140 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "spectrum-tuner",
    title: "Spectrum Tuner",
    icon: Activity,
    loader: lazyPanel(() => import("@/components/SpectrumTunerPanel")),
    pinned: true,
    defaultSize: { w: 880, h: 620 },
    defaultPosition: { x: 160, y: 120 },
    endpoints: [API.helixSpectrumRead, API.helixSpectrumWrite, API.helixMode]
  },
  {
    id: "vacuum-gap-heatmap",
    title: "Vacuum Gap Heatmap",
    icon: Flame,
    loader: lazyPanel(() => import("@/components/VacuumGapHeatmap"), "VacuumGapHeatmap"),
    defaultSize: { w: 960, h: 640 },
    defaultPosition: { x: 220, y: 160 },
    endpoints: [API.helixSweep]
  },
  {
    id: "star-hydrostatic",
    title: "Hydrostatic Equilibrium (HR)",
    icon: Sun,
    loader: lazyPanel(() => import("@/pages/star-hydrostatic-panel")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 240, y: 140 }
  },
  {
    id: "star-watcher",
    title: "Star Watcher",
    icon: PlayCircle,
    loader: lazyPanel(() => import("@/pages/star-watcher-panel")),
    defaultSize: { w: 1200, h: 740 },
    defaultPosition: { x: 180, y: 140 }
  },
  {
    id: "tokamak-sim",
    title: "Tokamak Simulation",
    icon: RadioTower,
    loader: lazyPanel(() => import("@/components/TokamakSimulationPanel")),
    defaultSize: { w: 720, h: 640 },
    defaultPosition: { x: 240, y: 160 },
    endpoints: [API.tokamakState, API.tokamakCommand]
  },
  {
    id: "vacuum-gap-sweep",
    title: "Vacuum Gap Sweep HUD",
    icon: Waves,
    loader: lazyPanel(() => import("@/components/VacuumGapSweepHUD")),
    defaultSize: { w: 620, h: 480 },
    defaultPosition: { x: 260, y: 200 },
    endpoints: [API.helixSweep]
  },
  {
    id: "cavity-mechanism",
    title: "Cavity Mechanism",
    icon: Settings,
    loader: lazyPanel(() => import("@/components/CavityMechanismPanel"), "CavityMechanismPanel"),
    defaultSize: { w: 640, h: 520 },
    defaultPosition: { x: 180, y: 220 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "fractional-coherence-rail",
    title: "Fractional Coherence Rail",
    icon: Equal,
    loader: lazyPanel(() => import("@/components/FractionalCoherenceRail"), "FractionalCoherenceRail"),
    defaultSize: { w: 620, h: 360 },
    defaultPosition: { x: 120, y: 260 },
    endpoints: [API.pipelineGet]
  },
  {
    id: "fractional-coherence-grid",
    title: "Fractional Coherence Grid",
    icon: Grid3x3,
    loader: lazyPanel(() => import("@/components/FractionalCoherenceGrid"), "FractionalCoherenceGrid"),
    defaultSize: { w: 960, h: 640 },
    defaultPosition: { x: 340, y: 240 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "near-zero",
    title: "Near-Zero Widget",
    icon: Circle,
    loader: lazyPanel(() => import("@/components/NearZeroWidget")),
    defaultSize: { w: 540, h: 420 },
    defaultPosition: { x: 420, y: 200 },
    mobileReady: true,
    endpoints: [API.pipelineGet, API.helixMode]
  },
  {
    id: "direction-pad",
    title: "Direction Pad",
    icon: Navigation2,
    loader: lazyPanel(() => import("@/components/DirectionPad")),
    defaultSize: { w: 420, h: 360 },
    defaultPosition: { x: 520, y: 260 },
    mobileReady: true
  },
  {
    id: "nav-system",
    title: "Solar Navigation",
    icon: Map,
    loader: lazyPanel(() => import("@/components/NavPageSection"), "NavPageSection"),
    defaultSize: { w: 720, h: 520 },
    defaultPosition: { x: 620, y: 200 }
  },
  {
    id: "deepmix-solar",
    title: "DeepMix Solar View",
    icon: Sun,
    loader: lazyPanel(() => import("@/components/DeepMixingSolarView"), "DeepMixingSolarView"),
    defaultSize: { w: 840, h: 600 },
    defaultPosition: { x: 260, y: 300 }
  },
  {
    id: "solar-globe",
    title: "Solar Globe",
    icon: Sun,
    loader: lazyPanel(() => import("@/components/SolarGlobePanel")),
    pinned: true,
    defaultSize: { w: 520, h: 620 },
    defaultPosition: { x: 360, y: 120 }
  },
  {
    id: "deepmix-sweetspot",
    title: "DeepMix Sweet Spot",
    icon: Target,
    loader: lazyPanel(() => import("@/components/deepmix/DeepMixSweetSpot")),
    defaultSize: { w: 600, h: 420 },
    defaultPosition: { x: 360, y: 340 }
  },
  {
    id: "deepmix-globe",
    title: "DeepMix Globe",
    icon: Globe2,
    loader: lazyPanel(() => import("@/components/deepmix/DeepMixGlobePanel")),
    defaultSize: { w: 760, h: 620 },
    defaultPosition: { x: 320, y: 380 }
  },
  {
    id: "alcubierre-viewer",
    title: "Alcubierre Viewer",
    icon: Rocket,
    loader: lazyPanel(() => import("@/components/AlcubierrePanel")),
    pinned: true,
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 180, y: 80 },
    endpoints: [API.pipelineGet, API.helixMetrics, API.helixDisplacement]
  },
  {
    id: "shell-outline",
    title: "Shell Outline Visualizer",
    icon: LayoutGrid,
    loader: lazyPanel(() => import("@/components/ShellOutlineVisualizer")),
    defaultSize: { w: 720, h: 520 },
    defaultPosition: { x: 240, y: 440 },
    endpoints: [API.pipelineGet]
  },
  {
    id: "model-silhouette",
    title: "Silhouette Stretch",
    icon: Ruler,
    loader: lazyPanel(() => import("@/components/ModelSilhouettePanel")),
    defaultSize: { w: 1080, h: 720 },
    defaultPosition: { x: 260, y: 140 },
    keywords: PANEL_KEYWORDS["model-silhouette"]
  },
  {
    id: "hull-metrics-vis",
    title: "Hull Metrics Vis",
    icon: Move3d,
    loader: lazyPanel(() => import("@/components/HullMetricsVisPanel")),
    defaultSize: { w: 1120, h: 720 },
    defaultPosition: { x: 220, y: 120 },
    keywords: PANEL_KEYWORDS["hull-metrics-vis"]
  },
  {
    id: "shift-vector",
    title: "Shift Vector Panel",
    icon: Move3d,
    loader: lazyPanel(() => import("@/components/ShiftVectorPanel"), "ShiftVectorPanel"),
    defaultSize: { w: 640, h: 420 },
    defaultPosition: { x: 320, y: 460 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "curvature-slice",
    title: "Equatorial Curvature Slice",
    icon: Circle,
    loader: lazyPanel(() => import("@/components/CurvatureSlicePanel")),
    defaultSize: { w: 960, h: 520 },
    defaultPosition: { x: 300, y: 500 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "time-dilation-lattice",
    title: "Time Dilation Lattice",
    icon: Timer,
    loader: lazyPanel(() => import("@/components/TimeDilationLatticePanel")),
    defaultSize: { w: 960, h: 640 },
    defaultPosition: { x: 340, y: 520 },
    endpoints: [API.pipelineGet],
    keywords: PANEL_KEYWORDS["time-dilation-lattice"]
  },
  {
    id: "curvature-ledger",
    title: "Curvature Ledger",
    icon: LineChart,
    loader: lazyPanel(() => import("@/components/CurvatureLedgerPanel"), "CurvatureLedgerPanel"),
    defaultSize: { w: 440, h: 320 },
    defaultPosition: { x: 420, y: 540 },
    endpoints: [API.pipelineGet],
    defaultOpen: true
  },
  {
    id: "operational-mode",
    title: "Operational Mode Switch",
    icon: Settings,
    loader: lazyPanel(() => import("@/components/OperationalModePanel")),
    defaultSize: { w: 600, h: 320 },
    defaultPosition: { x: 160, y: 520 },
    pinned: true,
    mobileReady: true,
    endpoints: [API.pipelineGet, API.helixMode]
  },
  {
    id: "casimir-tile-grid",
    title: "Casimir Tile Grid",
    icon: LayoutGrid,
    loader: lazyPanel(() => import("@/components/CasimirTileGridPanel"), "CasimirTileGridPanel"),
    defaultSize: { w: 960, h: 640 },
    defaultPosition: { x: 380, y: 500 },
    endpoints: [API.pipelineGet, API.helixSnapshot]
  },
  {
    id: "light-speed-strobe",
    title: "Light-Speed Strobe Scale",
    icon: Gauge,
    loader: lazyPanel(() => import("@/components/LightSpeedStrobeScale")),
    defaultSize: { w: 740, h: 520 },
    defaultPosition: { x: 420, y: 540 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "speed-capability",
    title: "Speed Capability",
    icon: Gauge,
    loader: lazyPanel(() => import("@/components/SpeedCapabilityPanel")),
    defaultSize: { w: 780, h: 520 },
    defaultPosition: { x: 220, y: 160 },
    endpoints: [API.pipelineGet]
  },
  {
    id: "helix-casimir-amplifier",
    title: "Helix Casimir Amplifier",
    icon: RadioTower,
    loader: lazyPanel(() => import("@/components/HelixCasimirAmplifier")),
    defaultSize: { w: 1000, h: 680 },
    defaultPosition: { x: 200, y: 520 },
    endpoints: [API.pipelineGet, API.helixMetrics, API.helixDisplacement]
  },
  {
    id: "resonance-scheduler",
    title: "Resonance Scheduler",
    icon: Timer,
    loader: lazyPanel(() => import("@/components/ResonanceSchedulerTile")),
    defaultSize: { w: 520, h: 420 },
    defaultPosition: { x: 260, y: 560 },
    mobileReady: true,
    endpoints: [API.pipelineGet]
  },
  {
    id: "trip-player",
    title: "Trip Player",
    icon: PlayCircle,
    loader: lazyPanel(() => import("@/components/TripPlayer"), "TripPlayer"),
    defaultSize: { w: 860, h: 560 },
    defaultPosition: { x: 480, y: 520 }
  },
  {
    id: "fuel-gauge",
    title: "Fuel Gauge",
    icon: GaugeCircle,
    loader: lazyPanel(() => import("@/components/FuelGauge"), "FuelGauge"),
    defaultSize: { w: 480, h: 360 },
    defaultPosition: { x: 520, y: 580 },
    mobileReady: true,
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "vacuum-contract",
    title: "Vacuum Contract",
    icon: ScrollText,
    loader: lazyPanel(() => import("@/components/VacuumContractBadge")),
    defaultSize: { w: 420, h: 260 },
    defaultPosition: { x: 640, y: 560 },
    mobileReady: true,
    endpoints: [API.pipelineGet]
  },
  {
    id: "metric-pocket",
    title: "Metric Amplification Pocket",
    icon: LineChart,
    loader: lazyPanel(() => import("@/components/MetricAmplificationPocket")),
    defaultSize: { w: 640, h: 420 },
    defaultPosition: { x: 680, y: 520 },
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "halobank",
    title: "HaloBank Timeline",
    icon: Sun,
    loader: lazyPanel(() => import("@/components/HalobankPanel")),
    defaultSize: { w: 1100, h: 680 },
    defaultPosition: { x: 140, y: 40 },
    endpoints: ["GET /halobank"]
  },
  {
    id: "qi-widget",
    title: "Qi Widget",
    icon: Atom,
    loader: lazyPanel(() => import("@/components/QiWidget")),
    defaultSize: { w: 480, h: 320 },
    defaultPosition: { x: 720, y: 480 },
    mobileReady: true,
    endpoints: [API.pipelineGet]
  },
  {
    id: "qi-auto-tuner",
    title: "QI Auto-Tuner",
    icon: ShieldCheck,
    loader: lazyPanel(() => import("@/components/QiAutoTunerPanel"), "QiAutoTunerPanel"),
    defaultSize: { w: 640, h: 560 },
    defaultPosition: { x: 760, y: 440 },
    endpoints: [API.pipelineGet, API.pipelineUpdate]
  },
  {
    id: "sector-legend",
    title: "Sector Legend",
    icon: Layers,
    loader: lazyPanel(() => import("@/components/SectorLegend"), "SectorLegend"),
    defaultSize: { w: 420, h: 320 },
    defaultPosition: { x: 760, y: 440 },
    mobileReady: true
  },
  {
    id: "sector-roles",
    title: "Sector Roles HUD",
    icon: Users,
    loader: lazyPanel(() => import("@/components/SectorRolesHud"), "SectorRolesHud"),
    defaultSize: { w: 560, h: 400 },
    defaultPosition: { x: 800, y: 400 },
    endpoints: [API.pipelineGet]
  },
  {
    id: "sweep-replay",
    title: "Sweep Replay Controls",
    icon: History,
    loader: lazyPanel(() => import("@/components/SweepReplayControls")),
    defaultSize: { w: 520, h: 280 },
    defaultPosition: { x: 840, y: 360 },
    endpoints: [API.helixSweep]
  },
  {
    id: "hull-status",
    title: "Runtime Ops",
    icon: Shield,
    loader: lazyPanel(() => import("@/components/hull/RuntimeOps")),
    defaultSize: { w: 520, h: 520 },
    defaultPosition: { x: 80, y: 80 },
    pinned: true
  },
  {
    id: "agi-debate-view",
    title: "Debate View",
    icon: TerminalSquare,
    loader: lazyPanel(() => import("@/components/agi/DebateView")),
    defaultSize: { w: 1000, h: 720 },
    defaultPosition: { x: 120, y: 100 }
  },
  {
    id: "agi-essence-console",
    title: "Essence Console",
    icon: TerminalSquare,
    loader: lazyPanel(() => import("@/components/agi/essence.tsx")),
    defaultSize: { w: 920, h: 720 },
    defaultPosition: { x: 180, y: 120 },
    endpoints: [
      "POST /api/agi/plan",
      "POST /api/agi/execute",
      "GET /api/agi/tools/logs/stream"
    ],
    pinned: true
  },
  {
    id: "star-coherence",
    title: "Star Coherence Governor",
    icon: Sparkles,
    loader: lazyPanel(() => import("@/components/agi/StarCoherencePanel"), "StarCoherencePanel"),
    defaultSize: { w: 520, h: 520 },
    defaultPosition: { x: 220, y: 140 },
    mobileReady: true,
    endpoints: ["GET /api/agi/star/telemetry"]
  },
  {
    id: "pipeline-proof",
    title: "Pipeline Proof",
    icon: ShieldCheck,
    loader: lazyPanel(() => import("@/components/PipelineProofPanel")),
    defaultSize: { w: 1120, h: 720 },
    defaultPosition: { x: 120, y: 80 },
    keywords: ["warp", "pipeline", "grounding", "proof", "resonance"],
    endpoints: ["GET /api/agi/pipeline/status", "GET /api/agi/pipeline/last-plan-debug"]
  },
  {
    id: "collapse-monitor",
    title: "Collapse Watch",
    icon: GaugeCircle,
    loader: lazyPanel(() => import("@/components/agi/CollapseWatcherPanel"), "CollapseWatcherPanel"),
    defaultSize: { w: 520, h: 460 },
    defaultPosition: { x: 260, y: 160 },
    endpoints: ["GET /api/agi/star/telemetry"]
  },
  {
    id: "collapse-benchmark-hud",
    title: "Collapse Benchmark HUD",
    icon: GaugeCircle,
    loader: lazyPanel(() => import("@/components/CollapseBenchmarkHUDPanel")),
    defaultSize: { w: 520, h: 420 },
    defaultPosition: { x: 300, y: 180 },
    endpoints: ["POST /api/benchmarks/collapse"],
    keywords: PANEL_KEYWORDS["collapse-benchmark-hud"]
  },
  {
    id: "agi-task-history",
    title: "Task History",
    icon: History,
    loader: lazyPanel(() => import("@/components/agi/TaskHistoryPanel")),
    defaultSize: { w: 520, h: 600 },
    defaultPosition: { x: 1140, y: 140 },
    pinned: true
  },
  {
    id: "helix-noise-gens",
    title: "Noise Gens",
    icon: Waves,
    loader: lazyPanel(() => import("@/pages/helix-noise-gens")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 180, y: 140 },
    pinned: true,
    mobileReady: true,
    endpoints: [
      "GET /api/noise-gens/originals",
      "GET /api/noise-gens/generations",
      "GET /api/noise-gens/moods"
    ],
    keywords: ["noise gen", "noisegens", "cover", "render plan", "stems", "atoms", "moods"]
  },
  {
    id: "constraint-pack-policy",
    title: "Constraint Pack Policies",
    icon: ClipboardList,
    loader: lazyPanel(() => import("@/components/agi/ConstraintPackPolicyPanel")),
    defaultSize: { w: 980, h: 680 },
    defaultPosition: { x: 260, y: 140 },
    mobileReady: true,
    endpoints: [
      "GET /api/agi/constraint-packs",
      "GET /api/agi/constraint-packs/policies",
      "POST /api/agi/constraint-packs/policies"
    ]
  },
  {
    id: "agi-contribution-workbench",
    title: "Contribution Workbench",
    icon: ClipboardList,
    loader: lazyPanel(() => import("@/components/agi/ContributionWorkbenchPanel")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 300, y: 160 },
    endpoints: [
      "GET /api/agi/contributions/drafts",
      "POST /api/agi/contributions/ingest",
      "POST /api/agi/contributions/drafts/:id/verify",
      "POST /api/agi/contributions/drafts/:id/receipt",
      "GET /api/agi/contributions/receipts",
      "GET /api/agi/contributions/receipts/:id/disputes",
      "POST /api/agi/contributions/receipts/:id/disputes",
      "POST /api/agi/contributions/disputes/:id/resolve",
      "POST /api/agi/contributions/receipts/:id/review",
      "POST /api/agi/contributions/receipts/:id/mint",
      "POST /api/agi/contributions/receipts/:id/revoke"
    ],
    keywords: PANEL_KEYWORDS["agi-contribution-workbench"]
  },
  {
    id: "remove-bg-edges",
    title: "PNG Edge Cutter",
    icon: Scissors,
    loader: lazyPanel(() => import("@/components/RemoveBgEdgesPanel")),
    defaultSize: { w: 960, h: 640 },
    defaultPosition: { x: 200, y: 80 }
  },
  {
    id: "dresscode",
    title: "Dresscode Drafting",
    icon: Sparkles,
    loader: lazyPanel(() => import("@/components/essence/DresscodePanel")),
    defaultSize: { w: 1120, h: 880 },
    defaultPosition: { x: 200, y: 140 }
  },
  {
    id: "stellar-lsr",
    title: "Stellar LSR Viewer",
    icon: Navigation2,
    loader: lazyPanel(() => import("@/components/StellarLsrPanel")),
    defaultSize: { w: 1120, h: 780 },
    defaultPosition: { x: 180, y: 120 },
    endpoints: ["GET /api/stellar/local-rest", "GET /api/stellar/local-rest/stream"]
  },
  {
    id: "essence-proposals",
    title: "Essence Proposals",
    icon: Sparkles,
    loader: lazyPanel(() => import("@/components/agi/EssenceProposalsPanel"), "EssenceProposalsPanel"),
    defaultSize: { w: 1080, h: 700 },
    defaultPosition: { x: 220, y: 140 },
    endpoints: ["GET /api/proposals", "POST /api/proposals/:id/action", "GET /api/essence/events"]
  }
];

export const HELIX_PANELS: HelixPanelRef[] = RAW_HELIX_PANELS.map((panel) => {
  const fallbackKeywords = PANEL_KEYWORDS[panel.id];
  const mobileReady = panel.mobileReady === true;
  if (!fallbackKeywords || panel.keywords?.length) {
    return { ...panel, mobileReady };
  }
  return { ...panel, keywords: fallbackKeywords, mobileReady };
});

export const MOBILE_HELIX_PANELS = HELIX_PANELS.filter((panel) => panel.mobileReady);
