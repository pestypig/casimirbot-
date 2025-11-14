export type IdeologyRef =
  | { kind: "doc"; title: string; path: string }
  | { kind: "panel"; title: string; panelId: string; params?: Record<string, unknown> }
  | { kind: "url"; title: string; href: string };

type SettingsTabKey = "preferences" | "knowledge";

export type IdeologyAction =
  | { label: string; action: { kind: "openPanel"; panelId: string; params?: Record<string, unknown> } }
  | { label: string; action: { kind: "openUrl"; href: string } }
  | { label: string; action: { kind: "gotoNode"; to: string } }
  | { label: string; action: { kind: "openSettings"; tab?: SettingsTabKey } }
  | { label: string; action: { kind: "openKnowledgeProject"; projectId: string } };

export type IdeologyLink = { rel: string; to: string };

export type IdeologyNode = {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string;
  bodyMD?: string;
  tags?: string[];
  children?: string[];
  links?: IdeologyLink[];
  references?: IdeologyRef[];
  actions?: IdeologyAction[];
};

export type IdeologyDoc = {
  version: number;
  rootId: string;
  nodes: IdeologyNode[];
};
