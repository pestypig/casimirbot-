export const WORKSTATION_VIEW_STATE_CONTRACT_VERSION = "helix.workstation_view_state.v1" as const;

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

export type WorkstationViewStateCoerceOptions = {
  resolvePanelId?: (value: string) => string | null | undefined;
  resolvePanelTitle?: (panelId: string) => string | null | undefined;
};

export function isRawAbsoluteWorkstationPath(value: string): boolean {
  return /^[a-z]:[\\/]/i.test(value) || /^\\\\/.test(value) || value.startsWith("//");
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

export function normalizeWorkspaceRelativePath(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw || isRawAbsoluteWorkstationPath(raw)) return null;
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

export function buildWorkstationPanelPathRef(
  panelId: string | null | undefined,
  panelTitle?: string | null,
): WorkstationPathRef | null {
  const id = panelId?.trim();
  if (!id) return null;
  return {
    root: "workspace",
    relativePath: `panels/${id}`,
    displaySegments: ["Workspace", "Panels", panelTitle?.trim() || id],
    virtualUri: `workspace://workspace/panels/${encodeURIComponent(id)}`,
  };
}

export function buildWorkstationPanelViewState(
  panelId: string | null | undefined,
  panelTitle?: string | null,
): WorkstationViewState | null {
  const id = panelId?.trim();
  if (!id) return null;
  const pathRef = buildWorkstationPanelPathRef(id, panelTitle) ?? undefined;
  return {
    panels: [id],
    focusPanel: id,
    ...(pathRef ? { pathRef } : {}),
  };
}

export function buildWorkstationDocViewState(
  path: string | null | undefined,
  anchor?: string | null,
): WorkstationViewState | null {
  const activeDocPath = normalizeWorkstationDocPath(path);
  if (!activeDocPath) return null;
  const pathRef = buildWorkstationPathRef(activeDocPath) ?? undefined;
  const cleanAnchor = anchor?.trim();
  return {
    panels: ["docs-viewer"],
    focusPanel: "docs-viewer",
    activeDocPath,
    ...(cleanAnchor ? { anchor: cleanAnchor } : {}),
    ...(pathRef ? { pathRef } : {}),
  };
}

function resolvePanel(
  value: string | null | undefined,
  options?: WorkstationViewStateCoerceOptions,
): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  const resolved = options?.resolvePanelId ? options.resolvePanelId(raw) : raw;
  return resolved?.trim() || null;
}

export function coerceWorkstationViewStateFromPathInput(
  value: string | null | undefined,
  options?: WorkstationViewStateCoerceOptions,
): WorkstationViewState | null {
  const raw = value?.trim();
  if (!raw) return null;
  const { path, anchor } = splitAnchor(raw);
  const relativePath = normalizeWorkstationPathInput(path);
  if (!relativePath) return null;
  const panelPathMatch = relativePath.match(/^panels\/([^/]+)$/i);
  const directPanelId = panelPathMatch || options?.resolvePanelId
    ? resolvePanel(panelPathMatch?.[1] ?? relativePath, options)
    : null;
  if (directPanelId) {
    return buildWorkstationPanelViewState(directPanelId, options?.resolvePanelTitle?.(directPanelId));
  }
  if (/^docs(?:\/|$)/i.test(relativePath)) {
    return buildWorkstationDocViewState(relativePath, anchor);
  }
  return null;
}

export function coerceWorkstationViewState(
  value: unknown,
  options?: WorkstationViewStateCoerceOptions,
): WorkstationViewState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const panelsRaw = Array.isArray(record.panels)
    ? record.panels
    : Array.isArray(record.openPanels)
      ? record.openPanels
      : [];
  const panels: string[] = [];
  for (const entry of panelsRaw) {
    if (typeof entry !== "string") continue;
    const panelId = resolvePanel(entry, options);
    if (panelId && !panels.includes(panelId)) panels.push(panelId);
  }
  const focusPanel = resolvePanel(
    typeof record.focusPanel === "string"
      ? record.focusPanel
      : typeof record.focus === "string"
        ? record.focus
        : null,
    options,
  ) ?? undefined;
  const activeDocPath = normalizeWorkstationDocPath(
    typeof record.activeDocPath === "string"
      ? record.activeDocPath
      : typeof record.doc === "string"
        ? record.doc
        : null,
  ) ?? undefined;
  const anchor = typeof record.anchor === "string" && record.anchor.trim() ? record.anchor.trim() : undefined;
  const normalizedPanels = activeDocPath && !panels.includes("docs-viewer") ? [...panels, "docs-viewer"] : panels;
  const panelPathRef =
    !activeDocPath && normalizedPanels.length === 1
      ? buildWorkstationPanelPathRef(normalizedPanels[0], options?.resolvePanelTitle?.(normalizedPanels[0]))
      : null;
  const pathRef = buildWorkstationPathRef(activeDocPath) ?? panelPathRef ?? undefined;
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
  options?: WorkstationViewStateCoerceOptions,
): string {
  const params = new URLSearchParams(currentSearch.startsWith("?") ? currentSearch.slice(1) : currentSearch);
  params.delete("panels");
  params.delete("focus");
  params.delete("doc");
  params.delete("anchor");
  const panels: string[] = [];
  for (const entry of state.panels) {
    const panelId = resolvePanel(entry, options);
    if (panelId && !panels.includes(panelId)) panels.push(panelId);
  }
  if (panels.length > 0) params.set("panels", panels.join(","));
  const focusPanel = resolvePanel(state.focusPanel, options);
  if (focusPanel) params.set("focus", focusPanel);
  const activeDocPath = normalizeWorkstationDocPath(state.activeDocPath);
  if (activeDocPath) params.set("doc", activeDocPath);
  if (state.anchor) params.set("anchor", state.anchor);
  const query = params.toString();
  return query ? `?${query}` : "";
}
