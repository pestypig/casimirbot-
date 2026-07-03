import {
  HELIX_LOCKED_WORKSTATION_PANEL_IDS,
  HELIX_USER_WORKSTATION_PANEL_IDS,
} from "@shared/helix-account-session";

const USER_LAUNCH_PANEL_IDS = new Set<string>(HELIX_USER_WORKSTATION_PANEL_IDS);

const LEGACY_DEBUG_PANEL_IDS = new Set<string>([
  "agi-essence-console",
]);

const UNFINISHED_PANEL_IDS = new Set<string>([
  ...HELIX_LOCKED_WORKSTATION_PANEL_IDS,
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

export function isLockedLaunchPanel(panelId: string): boolean {
  return isLegacyDebugPanel(panelId) || isUnfinishedPanel(panelId);
}

export function isDiscoverableLaunchPanel(panelId: string): boolean {
  return isUserLaunchPanel(panelId) || isLockedLaunchPanel(panelId);
}
