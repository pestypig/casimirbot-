const USER_LAUNCH_PANEL_IDS = new Set<string>([
  "docs-viewer",
  "workstation-notes",
  "workstation-clipboard-history",
  "workstation-workflow-timeline",
  "agi-essence-console",
  "agi-task-history",
  "scientific-calculator",
]);

const UNFINISHED_PANEL_IDS = new Set<string>([
  "agi-contribution-workbench",
  "code-admin",
  "helix-noise-gens",
  "mission-ethos",
  "mission-ethos-source",
  "rag-admin",
]);

export function isUserLaunchPanel(panelId: string): boolean {
  return USER_LAUNCH_PANEL_IDS.has(panelId);
}

export function isUnfinishedPanel(panelId: string): boolean {
  return UNFINISHED_PANEL_IDS.has(panelId);
}
