const USER_LAUNCH_PANEL_IDS = new Set<string>([
  "docs-viewer",
  "account-session",
  "workstation-notes",
  "situation-room-pipelines",
  "live-answer-environment",
  "image-lens",
  "workstation-clipboard-history",
  "workstation-workflow-timeline",
  "workstation-task-manager",
  "workstation-storage-map",
  "agi-task-history",
  "scientific-calculator",
  "theory-badge-graph",
  "zen-graph",
  "fruition-calculator",
  "stage-play-badge-graph",
  "civilization-bounds-roadmap",
  "mission-ethos",
]);

const LEGACY_DEBUG_PANEL_IDS = new Set<string>([
  "agi-essence-console",
]);

const UNFINISHED_PANEL_IDS = new Set<string>([
  "agi-contribution-workbench",
  "code-admin",
  "helix-noise-gens",
  "mission-ethos-source",
  "rag-admin",
]);

export function isUserLaunchPanel(panelId: string): boolean {
  return USER_LAUNCH_PANEL_IDS.has(panelId);
}

export function isLegacyDebugPanel(panelId: string): boolean {
  return LEGACY_DEBUG_PANEL_IDS.has(panelId);
}

export function isUnfinishedPanel(panelId: string): boolean {
  return UNFINISHED_PANEL_IDS.has(panelId);
}
