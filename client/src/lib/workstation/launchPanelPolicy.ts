const USER_LAUNCH_PANEL_IDS = new Set<string>([
  "docs-viewer",
  "workstation-notes",
  "workstation-clipboard-history",
  "workstation-workflow-timeline",
  "mission-ethos",
  "mission-ethos-source",
  "agi-essence-console",
  "agi-task-history",
  "rag-admin",
  "code-admin",
  "agi-contribution-workbench",
  "helix-noise-gens",
  "scientific-calculator",
]);

export function isUserLaunchPanel(panelId: string): boolean {
  return USER_LAUNCH_PANEL_IDS.has(panelId);
}
