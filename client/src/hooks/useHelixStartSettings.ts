import * as React from "react";

export type StartSettings = {
  rememberChoice: boolean;
  preferDesktop: boolean;
  showZen: boolean;
  enableSplashCursor: boolean;
  showHelixAskDebug: boolean;
  showPowerShellDebug: boolean;
  powerShellScratch: string;
};

export type SettingsTab = "preferences" | "knowledge";

export const DEFAULT_SETTINGS: StartSettings = {
  rememberChoice: true,
  preferDesktop: false,
  showZen: true,
  enableSplashCursor: false,
  showHelixAskDebug: false,
  showPowerShellDebug: false,
  powerShellScratch: ""
};

export const SETTINGS_STORAGE_KEY = "helix-start-settings";
export const PROFILE_STORAGE_KEY = "helix-start-profile";

export function useHelixStartSettings() {
  const [userSettings, setUserSettings] = React.useState<StartSettings>(DEFAULT_SETTINGS);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<StartSettings>;
      setUserSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      // ignore malformed localStorage entries
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(userSettings));
    } catch {
      // storing user preference is best-effort
    }
  }, [userSettings]);

  const updateSettings = React.useCallback((patch: Partial<StartSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { userSettings, updateSettings };
}
