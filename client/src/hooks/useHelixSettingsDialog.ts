import * as React from "react";
import type { SettingsTab } from "@/hooks/useHelixStartSettings";

type OpenSettingsDetail = {
  tab?: SettingsTab;
};

const OPEN_EVENTS = [
  "open-helix-settings",
  "open-desktop-settings",
  "open-mobile-settings",
] as const;

export function useHelixSettingsDialog(defaultTab: SettingsTab = "preferences") {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [settingsTab, setSettingsTab] = React.useState<SettingsTab>(defaultTab);

  const openSettings = React.useCallback((tab: SettingsTab = defaultTab) => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, [defaultTab]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<OpenSettingsDetail>)?.detail;
      openSettings(detail?.tab ?? defaultTab);
    };
    OPEN_EVENTS.forEach((eventName) =>
      window.addEventListener(eventName, handleOpen as EventListener),
    );
    return () => {
      OPEN_EVENTS.forEach((eventName) =>
        window.removeEventListener(eventName, handleOpen as EventListener),
      );
    };
  }, [defaultTab, openSettings]);

  const handleSettingsOpenChange = React.useCallback((next: boolean) => {
    setSettingsOpen(next);
    if (!next) {
      setSettingsTab(defaultTab);
    }
  }, [defaultTab]);

  return {
    settingsOpen,
    setSettingsOpen,
    settingsTab,
    setSettingsTab,
    openSettings,
    handleSettingsOpenChange,
  };
}
