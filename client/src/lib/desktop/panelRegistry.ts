import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import type { HelixPanelRef } from "@/pages/helix-core.panels";
import { HELIX_PANELS } from "@/pages/helix-core.panels";

export type PanelId =
  | "live-energy"
  | "helix-core"
  | "endpoints"
  | "taskbar"
  | HelixPanelRef["id"];

export interface PanelDefinition {
  id: PanelId | (string & {});
  title: string;
  icon?: LucideIcon;
  loader: () => Promise<{ default: ComponentType<any> }>;
  defaultSize?: { w: number; h: number };
  defaultPosition?: { x: number; y: number };
  endpoints?: string[];
  pinned?: boolean;
  skipTaskbar?: boolean;
  alwaysOnTop?: boolean;
  noMinimize?: boolean;
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
    id: "endpoints",
    title: "Endpoints & Panels",
    loader: load(() => import("@/components/desktop/EndpointsPanel")),
    defaultSize: { w: 520, h: 420 },
    defaultPosition: { x: 60, y: 420 }
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
  ...HELIX_PANELS
];

export function getPanelDef(id: PanelDefinition["id"]) {
  return panelRegistry.find((p) => p.id === id);
}
