import * as React from "react";

export type StartSettings = {
  settingsVersion: number;
  rememberChoice: boolean;
  preferDesktop: boolean;
  showZen: boolean;
  enableSplashCursor: boolean;
  showHelixAskDebug: boolean;
  showHelixAskReasoningEventLog: boolean;
  showHelixVoiceCaptureDiagnostics: boolean;
  showHelixVoiceEventTimelineDebug: boolean;
  showPowerShellDebug: boolean;
  powerShellScratch: string;
  preferredResponseLanguage: string;
};

export type SettingsTab = "preferences" | "knowledge";

export const DEFAULT_SETTINGS: StartSettings = {
  settingsVersion: 5,
  rememberChoice: true,
  preferDesktop: false,
  showZen: true,
  enableSplashCursor: false,
  showHelixAskDebug: true,
  showHelixAskReasoningEventLog: false,
  showHelixVoiceCaptureDiagnostics: false,
  showHelixVoiceEventTimelineDebug: false,
  showPowerShellDebug: false,
  powerShellScratch: "",
  preferredResponseLanguage: "auto",
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
      const merged: StartSettings = { ...DEFAULT_SETTINGS, ...parsed };
      if (parsed.settingsVersion !== DEFAULT_SETTINGS.settingsVersion) {
        merged.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
        merged.showHelixAskDebug = DEFAULT_SETTINGS.showHelixAskDebug;
        merged.showHelixAskReasoningEventLog = DEFAULT_SETTINGS.showHelixAskReasoningEventLog;
        merged.showHelixVoiceCaptureDiagnostics = DEFAULT_SETTINGS.showHelixVoiceCaptureDiagnostics;
        merged.showHelixVoiceEventTimelineDebug = DEFAULT_SETTINGS.showHelixVoiceEventTimelineDebug;
        merged.preferredResponseLanguage =
          typeof parsed.preferredResponseLanguage === "string" && parsed.preferredResponseLanguage.trim().length > 0
            ? parsed.preferredResponseLanguage.trim()
            : DEFAULT_SETTINGS.preferredResponseLanguage;
      }
      setUserSettings(merged);
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
