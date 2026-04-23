import * as React from "react";
import { setAlcubierreDebugLogEnabled } from "@/lib/alcubierre-debug-log";

export type StartSettings = {
  settingsVersion: number;
  rememberChoice: boolean;
  preferDesktop: boolean;
  showZen: boolean;
  enableSplashCursor: boolean;
  voiceNoisyEnvironmentMode: boolean;
  showHelixAskDebug: boolean;
  showHelixAskObserverLane: boolean;
  showHelixVoiceCaptureDiagnostics: boolean;
  showPowerShellDebug: boolean;
  showAlcubierreRenderDebugLog: boolean;
  powerShellScratch: string;
  preferredResponseLanguage: string;
};

export type SettingsTab = "preferences" | "knowledge";

export const DEFAULT_SETTINGS: StartSettings = {
  settingsVersion: 9,
  rememberChoice: true,
  preferDesktop: false,
  showZen: true,
  enableSplashCursor: false,
  voiceNoisyEnvironmentMode: false,
  showHelixAskDebug: true,
  showHelixAskObserverLane: true,
  showHelixVoiceCaptureDiagnostics: false,
  showPowerShellDebug: false,
  showAlcubierreRenderDebugLog: false,
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
      if (typeof parsed.showHelixAskDebug !== "boolean") {
        const legacyUnifiedPreference =
          (parsed as Record<string, unknown>).showHelixAskReasoningEventLog ??
          (parsed as Record<string, unknown>).showHelixAskMasterEventClock ??
          (parsed as Record<string, unknown>).showHelixVoiceEventTimelineDebug;
        if (typeof legacyUnifiedPreference === "boolean") {
          merged.showHelixAskDebug = legacyUnifiedPreference;
        }
      }
      if (parsed.settingsVersion !== DEFAULT_SETTINGS.settingsVersion) {
        merged.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
        merged.voiceNoisyEnvironmentMode = DEFAULT_SETTINGS.voiceNoisyEnvironmentMode;
        merged.showHelixVoiceCaptureDiagnostics = DEFAULT_SETTINGS.showHelixVoiceCaptureDiagnostics;
        merged.showAlcubierreRenderDebugLog = DEFAULT_SETTINGS.showAlcubierreRenderDebugLog;
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

  React.useEffect(() => {
    setAlcubierreDebugLogEnabled(Boolean(userSettings.showAlcubierreRenderDebugLog));
  }, [userSettings.showAlcubierreRenderDebugLog]);

  const updateSettings = React.useCallback((patch: Partial<StartSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  return { userSettings, updateSettings };
}
