import { getPanelDef } from "@/lib/desktop/panelRegistry";

const PANEL_ALIAS_TO_ID: Record<string, string> = {
  essence: "agi-essence-console",
  noisegen: "helix-noise-gens",
  helix: "live-energy",
  observables: "helix-observables",
  luma: "helix-luma",
  ragadmin: "rag-admin",
  ragingest: "rag-ingest",
  "code-admin": "code-admin",
  potato: "potato-threshold-lab",
  taskbar: "taskbar",
};

const PANEL_ID_TO_ALIAS = Object.entries(PANEL_ALIAS_TO_ID).reduce<Record<string, string>>(
  (acc, [alias, id]) => {
    acc[id] = alias;
    return acc;
  },
  {},
);

export type WorkstationPathRef = {
  root: "workspace";
  relativePath: string;
  displaySegments: string[];
  virtualUri: string;
};

export type WorkstationViewState = {
  projectSlug?: string;
  panels: string[];
  focusPanel?: string;
  activeDocPath?: string;
  anchor?: string;
  pathRef?: WorkstationPathRef;
};

type ParseInput = string | URL | {
  pathname?: string;
  search?: string;
  hash?: string;
};

function readPanelId(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const mapped = PANEL_ALIAS_TO_ID[trimmed] ?? trimmed;
  return getPanelDef(mapped) ? mapped : null;
}

export function resolveWorkstationPanelIds(aliases?: string[] | null): string[] {
  if (!Array.isArray(aliases)) return [];
  const resolved: string[] = [];
  for (const alias of aliases) {
    const panelId = readPanelId(alias);
    if (!panelId || resolved.includes(panelId)) continue;
    resolved.push(panelId);
  }
  return resolved;
}

function parsePanelList(value: string | null): string[] {
  if (!value) return [];
  return resolveWorkstationPanelIds(
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function isRawAbsolutePath(value: string): boolean {
  return /^[a-z]:[\\/]/i.test(value) || /^\\\\/.test(value) || value.startsWith("//");
}

function splitAnchor(value: string): { path: string; anchor?: string } {
  const hashIndex = value.indexOf("#");
  if (hashIndex < 0) return { path: value };
  const path = value.slice(0, hashIndex);
  const anchor = value.slice(hashIndex + 1).trim();
  return {
    path,
    ...(anchor ? { anchor } : {}),
  };
}

function decodePathSegments(path: string): string {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

export function normalizeWorkspaceRelativePath(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || isRawAbsolutePath(raw)) return null;
  const normalized = raw.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/{2,}/g, "/");
  return normalized || null;
}

export function normalizeWorkstationPathInput(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  if (/^workspace:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "workspace:" || parsed.hostname !== "workspace") return null;
      return normalizeWorkspaceRelativePath(decodePathSegments(parsed.pathname));
    } catch {
      return null;
    }
  }
  const withoutRoot = raw.replace(/^workspace[\\/]+/i, "");
  return normalizeWorkspaceRelativePath(withoutRoot);
}

export function normalizeWorkstationDocPath(value: string | null | undefined): string | null {
  const normalized = normalizeWorkspaceRelativePath(value);
  if (!normalized) return null;
  const withoutLeadingDocs = normalized.replace(/^docs\/?/i, "");
  const docPath = `docs/${withoutLeadingDocs}`.replace(/\/{2,}/g, "/");
  return docPath.length > "docs/".length ? docPath : null;
}

export function buildWorkstationPathRef(path: string | null | undefined): WorkstationPathRef | null {
  const relativePath = normalizeWorkspaceRelativePath(path);
  if (!relativePath) return null;
  const segments = relativePath.split("/").filter(Boolean);
  return {
    root: "workspace",
    relativePath,
    displaySegments: ["Workspace", ...segments],
    virtualUri: `workspace://workspace/${segments.map(encodeURIComponent).join("/")}`,
  };
}

export function buildWorkstationPanelPathRef(panelId: string | null | undefined): WorkstationPathRef | null {
  const id = panelId?.trim();
  if (!id) return null;
  const panelDef = getPanelDef(id);
  if (!panelDef) return null;
  return {
    root: "workspace",
    relativePath: `panels/${id}`,
    displaySegments: ["Workspace", "Panels", panelDef.title],
    virtualUri: `workspace://workspace/panels/${encodeURIComponent(id)}`,
  };
}

export function coerceWorkstationViewStateFromPathInput(value: string | null | undefined): WorkstationViewState | null {
  const raw = value?.trim();
  if (!raw) return null;
  const { path, anchor } = splitAnchor(raw);
  const relativePath = normalizeWorkstationPathInput(path);
  if (!relativePath) return null;
  const panelPathMatch = relativePath.match(/^panels\/([^/]+)$/i);
  const directPanelId = readPanelId(panelPathMatch?.[1] ?? relativePath);
  if (directPanelId) {
    return {
      panels: [directPanelId],
      focusPanel: directPanelId,
      pathRef: buildWorkstationPanelPathRef(directPanelId) ?? undefined,
    };
  }
  if (/^docs(?:\/|$)/i.test(relativePath)) {
    const activeDocPath = normalizeWorkstationDocPath(relativePath) ?? undefined;
    const pathRef = buildWorkstationPathRef(activeDocPath) ?? undefined;
    return {
      panels: ["docs-viewer"],
      focusPanel: "docs-viewer",
      ...(activeDocPath ? { activeDocPath } : {}),
      ...(anchor ? { anchor } : {}),
      ...(pathRef ? { pathRef } : {}),
    };
  }
  return null;
}

function readParams(params: URLSearchParams): WorkstationViewState {
  const panels = parsePanelList(params.get("panels") ?? params.get("openPanels"));
  const focusPanel = readPanelId(params.get("focus") ?? params.get("focusPanel") ?? params.get("panel")) ?? undefined;
  const activeDocPath = normalizeWorkstationDocPath(
    params.get("doc") ?? params.get("activeDocPath") ?? params.get("path"),
  ) ?? undefined;
  const anchor = params.get("anchor")?.trim() || undefined;
  const projectSlug = params.get("project")?.trim() || undefined;
  const pathRef = buildWorkstationPathRef(activeDocPath) ?? undefined;
  const resolvedPanels = activeDocPath && !panels.includes("docs-viewer") ? [...panels, "docs-viewer"] : panels;
  return {
    ...(projectSlug ? { projectSlug } : {}),
    panels: resolvedPanels,
    ...(focusPanel ? { focusPanel } : activeDocPath ? { focusPanel: "docs-viewer" } : {}),
    ...(activeDocPath ? { activeDocPath } : {}),
    ...(anchor ? { anchor } : {}),
    ...(pathRef ? { pathRef } : {}),
  };
}

function toUrl(input: ParseInput): URL {
  if (input instanceof URL) return input;
  if (typeof input === "string") return new URL(input, "http://localhost");
  const pathname = input.pathname?.trim() || "/desktop";
  const search = input.search?.trim() || "";
  const hash = input.hash?.trim() || "";
  return new URL(`${pathname}${search}${hash}`, "http://localhost");
}

export function parseWorkstationViewStateFromUrl(input: ParseInput): WorkstationViewState {
  const url = toUrl(input);
  const legacyHash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  const legacy = legacyHash ? readParams(new URLSearchParams(legacyHash)) : { panels: [] };
  const query = readParams(url.searchParams);
  return mergeWorkstationViewStates(legacy, query);
}

export function mergeWorkstationViewStates(
  base: WorkstationViewState,
  override: WorkstationViewState,
): WorkstationViewState {
  const panels = [...base.panels];
  for (const panelId of override.panels) {
    if (!panels.includes(panelId)) panels.push(panelId);
  }
  const activeDocPath = override.activeDocPath ?? base.activeDocPath;
  const pathRef = buildWorkstationPathRef(activeDocPath) ?? override.pathRef ?? base.pathRef;
  return {
    ...(override.projectSlug ?? base.projectSlug ? { projectSlug: override.projectSlug ?? base.projectSlug } : {}),
    panels: activeDocPath && !panels.includes("docs-viewer") ? [...panels, "docs-viewer"] : panels,
    ...(override.focusPanel ?? base.focusPanel
      ? { focusPanel: override.focusPanel ?? base.focusPanel }
      : activeDocPath
        ? { focusPanel: "docs-viewer" }
        : {}),
    ...(activeDocPath ? { activeDocPath } : {}),
    ...(override.anchor ?? base.anchor ? { anchor: override.anchor ?? base.anchor } : {}),
    ...(pathRef ? { pathRef } : {}),
  };
}

export function coerceWorkstationViewState(value: unknown): WorkstationViewState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const panelsRaw = Array.isArray(record.panels)
    ? record.panels
    : Array.isArray(record.openPanels)
      ? record.openPanels
      : [];
  const panels = resolveWorkstationPanelIds(
    panelsRaw.map((entry) => (typeof entry === "string" ? entry : "")).filter(Boolean),
  );
  const focusPanel =
    readPanelId(
      typeof record.focusPanel === "string"
        ? record.focusPanel
        : typeof record.focus === "string"
          ? record.focus
          : null,
    ) ?? undefined;
  const activeDocPath = normalizeWorkstationDocPath(
    typeof record.activeDocPath === "string"
      ? record.activeDocPath
      : typeof record.doc === "string"
        ? record.doc
        : null,
  ) ?? undefined;
  const anchor = typeof record.anchor === "string" && record.anchor.trim() ? record.anchor.trim() : undefined;
  const pathRef = buildWorkstationPathRef(activeDocPath) ?? undefined;
  const normalizedPanels = activeDocPath && !panels.includes("docs-viewer") ? [...panels, "docs-viewer"] : panels;
  if (normalizedPanels.length === 0 && !focusPanel && !activeDocPath) return null;
  return {
    panels: normalizedPanels,
    ...(focusPanel ? { focusPanel } : activeDocPath ? { focusPanel: "docs-viewer" } : {}),
    ...(activeDocPath ? { activeDocPath } : {}),
    ...(anchor ? { anchor } : {}),
    ...(pathRef ? { pathRef } : {}),
  };
}

export function encodeWorkstationViewStateSearch(
  state: WorkstationViewState,
  currentSearch = "",
): string {
  const params = new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
  params.delete("panels");
  params.delete("focus");
  params.delete("doc");
  params.delete("anchor");
  const panels = resolveWorkstationPanelIds(state.panels);
  if (panels.length > 0) params.set("panels", panels.join(","));
  if (state.focusPanel && getPanelDef(state.focusPanel)) params.set("focus", state.focusPanel);
  const activeDocPath = normalizeWorkstationDocPath(state.activeDocPath);
  if (activeDocPath) params.set("doc", activeDocPath);
  if (state.anchor) params.set("anchor", state.anchor);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function encodeLegacyLayoutHash(state: Pick<WorkstationViewState, "projectSlug" | "panels">): string {
  const params = new URLSearchParams();
  if (state.projectSlug) params.set("project", state.projectSlug);
  const panels = resolveWorkstationPanelIds(state.panels);
  if (panels.length > 0) {
    params.set("panels", panels.map((panel) => PANEL_ID_TO_ALIAS[panel] ?? panel).join(","));
  }
  const query = params.toString();
  return query ? `#${query}` : "";
}
