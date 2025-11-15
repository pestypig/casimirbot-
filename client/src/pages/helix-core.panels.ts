import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Atom,
  Circle,
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
  RadioTower,
  Rocket,
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
  loader: LoaderFactory;
  endpoints?: string[];
  pinned?: boolean;
  skipTaskbar?: boolean;
  defaultSize?: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
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
  helixSpectrumWrite: "POST /api/helix/spectrum"
} as const;

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

export const HELIX_PANELS: HelixPanelRef[] = [
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
    endpoints: [API.pipelineGet, API.helixMode]
  },
  {
    id: "direction-pad",
    title: "Direction Pad",
    icon: Navigation2,
    loader: lazyPanel(() => import("@/components/DirectionPad")),
    defaultSize: { w: 420, h: 360 },
    defaultPosition: { x: 520, y: 260 }
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
    id: "operational-mode",
    title: "Operational Mode Switch",
    icon: Settings,
    loader: lazyPanel(() => import("@/components/OperationalModePanel")),
    defaultSize: { w: 600, h: 320 },
    defaultPosition: { x: 160, y: 520 },
    pinned: true,
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
    endpoints: [API.pipelineGet, API.helixMetrics]
  },
  {
    id: "vacuum-contract",
    title: "Vacuum Contract",
    icon: ScrollText,
    loader: lazyPanel(() => import("@/components/VacuumContractBadge")),
    defaultSize: { w: 420, h: 260 },
    defaultPosition: { x: 640, y: 560 },
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
    endpoints: [API.pipelineGet]
  },
  {
    id: "sector-legend",
    title: "Sector Legend",
    icon: Layers,
    loader: lazyPanel(() => import("@/components/SectorLegend"), "SectorLegend"),
    defaultSize: { w: 420, h: 320 },
    defaultPosition: { x: 760, y: 440 }
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
    title: "Hull Status",
    icon: Shield,
    loader: lazyPanel(() => import("@/components/hull/HullStatus")),
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
    id: "agi-task-history",
    title: "Task History",
    icon: History,
    loader: lazyPanel(() => import("@/components/agi/TaskHistoryPanel")),
    defaultSize: { w: 520, h: 600 },
    defaultPosition: { x: 1140, y: 140 },
    pinned: true
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
