const USER_LAUNCH_PANEL_IDS = new Set<string>([
  "docs-viewer",
  "mission-ethos",
  "mission-ethos-source",
  "agi-essence-console",
  "agi-task-history",
  "rag-admin",
  "code-admin",
  "agi-contribution-workbench",
  "helix-noise-gens",
]);

export function isUserLaunchPanel(panelId: string): boolean {
  return USER_LAUNCH_PANEL_IDS.has(panelId);
}

