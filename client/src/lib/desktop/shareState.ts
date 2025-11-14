const PANEL_ALIAS_TO_ID: Record<string, string> = {
  essence: "agi-essence-console",
  noisegen: "helix-noise-gens",
  helix: "helix-core",
  observables: "helix-observables",
  luma: "helix-luma",
  ragadmin: "rag-admin",
  ragingest: "rag-ingest",
  "code-admin": "code-admin",
  potato: "potato-threshold-lab",
  taskbar: "taskbar",
};

const PANEL_ID_TO_ALIAS = Object.entries(PANEL_ALIAS_TO_ID).reduce<Record<string, string>>((acc, [alias, id]) => {
  acc[id] = alias;
  return acc;
}, {});

export type DesktopLayoutHash = {
  projectSlug?: string;
  panels?: string[];
};

export function encodeLayout({ projectSlug, panels }: DesktopLayoutHash): string {
  const params = new URLSearchParams();
  if (projectSlug) {
    params.set("project", projectSlug);
  }
  if (panels && panels.length > 0) {
    const friendly = panels.map((panel) => PANEL_ID_TO_ALIAS[panel] ?? panel);
    params.set("panels", friendly.join(","));
  }
  const query = params.toString();
  return query ? `#${query}` : "";
}

export function decodeLayout(hash: string): DesktopLayoutHash {
  const normalized = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!normalized) {
    return {};
  }
  const params = new URLSearchParams(normalized);
  const projectSlug = params.get("project") ?? undefined;
  const panelsParam = params.get("panels");
  const panels = panelsParam
    ? panelsParam
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : undefined;
  return { projectSlug, panels };
}

export function resolvePanelIds(aliases?: string[]): string[] {
  if (!Array.isArray(aliases)) {
    return [];
  }
  const resolved: string[] = [];
  for (const alias of aliases) {
    const mapped = PANEL_ALIAS_TO_ID[alias] ?? alias;
    if (!mapped || resolved.includes(mapped)) continue;
    resolved.push(mapped);
  }
  return resolved;
}
