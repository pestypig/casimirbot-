import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { PanelTelemetry } from "@shared/desktop";
import type { HelixPanelRef } from "@/pages/helix-core.panels";
import { HELIX_PANELS } from "@/pages/helix-core.panels";
import { isFlagEnabled } from "@/lib/envFlags";
import { getResonanceWatcherState } from "@/lib/agi/resonanceVersion";

export type PanelId =
  | "live-energy"
  | "helix-core"
  | "endpoints"
  | "taskbar"
  | "docs-viewer"
  | "casimir-tiles"
  | "resonance-orchestra"
  | HelixPanelRef["id"];

export type PanelTelemetryWindowSnapshot = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  isOpen?: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  isFullscreen?: boolean;
  z?: number;
  opacity?: number;
};

export type PanelTelemetryContext = {
  desktopId: string;
  panelId: PanelId | (string & {});
  instanceId: string;
  now: Date;
  window?: PanelTelemetryWindowSnapshot;
};

export type PanelTelemetryDetails = Partial<
  Omit<PanelTelemetry, "panelId" | "instanceId" | "title"> & { lastUpdated?: string }
>;

export type PanelTelemetryCollector = (ctx: PanelTelemetryContext) => PanelTelemetryDetails | null;

export interface PanelDefinition {
  id: PanelId | (string & {});
  title: string;
  icon?: LucideIcon;
  loader: () => Promise<{ default: ComponentType<any> }>;
  defaultSize?: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
  defaultOpen?: boolean;
  endpoints?: string[];
  pinned?: boolean;
  skipTaskbar?: boolean;
  alwaysOnTop?: boolean;
  noMinimize?: boolean;
  telemetryKind?: string;
  collectTelemetry?: PanelTelemetryCollector;
}

type ModuleLoader<T = Record<string, ComponentType<any>>> = () => Promise<T>;

const load = <T extends Record<string, unknown>>(
  importer: ModuleLoader<T>,
  named?: keyof T | string
) => {
  return () =>
    importer().then((mod: any) => {
      const fallbackKey = typeof named === "string" ? named : "default";
      const candidate = mod?.default ?? (named ? mod?.[named as string] : undefined);
      if (!candidate) {
        throw new Error(`Panel loader missing export "${fallbackKey}"`);
      }
      return { default: candidate as ComponentType<any> };
    });
};

export const panelRegistry: PanelDefinition[] = [
  {
    id: "live-energy",
    title: "Live Energy Pipeline",
    loader: load(() => import("@/components/live-energy-pipeline"), "LiveEnergyPipeline"),
    defaultSize: { w: 720, h: 480 },
    defaultPosition: { x: 80, y: 80 },
    endpoints: [
      "GET /api/helix/pipeline",
      "POST /api/helix/pipeline/update",
      "POST /api/helix/mode",
      "POST /api/helix/sweep/run",
      "GET /api/helix/snapshot"
    ]
  },
  {
    id: "helix-core",
    title: "Helix Core",
    loader: load(() => import("@/pages/helix-core")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 140, y: 120 },
    endpoints: [
      "GET /api/helix/pipeline",
      "POST /api/helix/mode",
      "POST /api/helix/sweep/run",
      "GET /api/helix/snapshot"
    ]
  },
  {
    id: "mission-ethos",
    title: "Ideology & Zen",
    loader: load(() => import("@/components/IdeologyPanel"), "IdeologyPanel"),
    defaultSize: { w: 960, h: 680 },
    defaultPosition: { x: 150, y: 130 },
    pinned: true
  },
  {
    id: "mission-ethos-source",
    title: "Mission Ethos Source",
    loader: load(() => import("@/components/MissionEthosSourcePanel"), "MissionEthosSourcePanel"),
    defaultSize: { w: 840, h: 640 },
    defaultPosition: { x: 220, y: 160 }
  },
  {
    id: "helix-noise-gens",
    title: "Helix Noise Gens",
    loader: load(() => import("@/pages/helix-noise-gens")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 180, y: 140 }
  },
  {
    id: "helix-observables",
    title: "Helix Observables",
    loader: load(() => import("@/pages/helix-observables")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 200, y: 160 }
  },
  {
    id: "helix-luma",
    title: "Luma Lab",
    loader: load(() => import("@/pages/luma")),
    defaultSize: { w: 1080, h: 720 },
    defaultPosition: { x: 220, y: 180 }
  },
  {
    id: "rag-ingest",
    title: "RAG Ingest",
    loader: load(() => import("@/pages/ingest")),
    defaultSize: { w: 980, h: 680 },
    defaultPosition: { x: 240, y: 200 }
  },
  {
    id: "rag-admin",
    title: "RAG Admin",
    loader: load(() => import("@/pages/rag-admin")),
    defaultSize: { w: 1020, h: 700 },
    defaultPosition: { x: 260, y: 220 }
  },
  {
    id: "code-admin",
    title: "Code Admin",
    loader: load(() => import("@/pages/code-admin")),
    defaultSize: { w: 1020, h: 700 },
    defaultPosition: { x: 280, y: 240 }
  },
  {
    id: "essence-proposals",
    title: "Essence Proposals",
    loader: load(() => import("@/components/agi/EssenceProposalsPanel"), "EssenceProposalsPanel"),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 320, y: 260 }
  },
  {
    id: "potato-threshold-lab",
    title: "Potato Threshold Lab",
    loader: load(() => import("@/pages/potato-threshold-lab")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 300, y: 260 }
  },
  {
    id: "star-hydrostatic",
    title: "Hydrostatic Equilibrium",
    loader: load(() => import("@/pages/star-hydrostatic-panel")),
    defaultSize: { w: 1100, h: 720 },
    defaultPosition: { x: 320, y: 220 }
  },
  {
    id: "endpoints",
    title: "Endpoints & Panels",
    loader: load(() => import("@/components/desktop/EndpointsPanel")),
    defaultSize: { w: 520, h: 420 },
    defaultPosition: { x: 60, y: 420 },
    defaultOpen: true
  },
  {
    id: "taskbar",
    title: "Taskbar",
    loader: load(() => import("@/components/desktop/TaskbarPanel")),
    defaultSize: { w: 720, h: 80 },
    defaultPosition: { x: 24, y: 24 },
    pinned: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    noMinimize: true
  },
  {
    id: "docs-viewer",
    title: "Docs & Papers",
    loader: load(() => import("@/components/DocViewerPanel")),
    defaultSize: { w: 1040, h: 720 },
    defaultPosition: { x: 180, y: 120 }
  },
  {
    id: "casimir-tiles",
    title: "Casimir Tiles",
    loader: load(() => import("@/components/panels/CasimirTilesPanel")),
    defaultSize: { w: 360, h: 260 },
    defaultPosition: { x: 360, y: 200 }
  },
  ...(isFlagEnabled("ENABLE_RESONANCE_ORCHESTRA", true)
    ? [
        {
          id: "resonance-orchestra",
          title: "Resonance Orchestra",
          loader: load(() => import("@/components/agi/ResonanceOrchestraPanel")),
          defaultSize: { w: 640, h: 520 },
          defaultPosition: { x: 420, y: 220 },
          collectTelemetry: () => {
            const watcher = getResonanceWatcherState();
            const ageMs = watcher.lastEventTs ? Math.max(0, Date.now() - watcher.lastEventTs) : null;
            return {
              kind: "client",
              metrics: {
                latticeVersion: watcher.version,
                filesTouched: watcher.stats?.filesTouched ?? 0
              },
              flags: { sseConnected: watcher.connected },
              strings: ageMs !== null ? { lastEventAge: `${Math.round(ageMs / 1000)}s` } : undefined,
              sourceIds: [
                "client/src/components/agi/ResonanceOrchestraPanel.tsx",
                "client/src/lib/agi/resonanceVersion.ts"
              ]
            };
          }
        }
      ]
    : []),
  ...HELIX_PANELS
];

export function getPanelDef(id: PanelDefinition["id"]) {
  return panelRegistry.find((p) => p.id === id);
}
