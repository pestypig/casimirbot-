import { useCallback, useEffect, useMemo, useState } from "react";

export type NoisegenUiMode = "listener" | "remix" | "studio" | "labs";

const STORAGE_KEY = "noisegen:uiMode";
const MODES: NoisegenUiMode[] = ["listener", "remix", "studio", "labs"];
const DEFAULT_MODE: NoisegenUiMode = "listener";

const normalizeMode = (value: unknown): NoisegenUiMode => {
  if (typeof value !== "string") return DEFAULT_MODE;
  const normalized = value.trim().toLowerCase();
  return MODES.includes(normalized as NoisegenUiMode)
    ? (normalized as NoisegenUiMode)
    : DEFAULT_MODE;
};

const readStoredMode = (): NoisegenUiMode => {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    return normalizeMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_MODE;
  }
};

export function useNoisegenUiMode() {
  const [uiMode, setUiMode] = useState<NoisegenUiMode>(() => readStoredMode());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, uiMode);
    } catch {
      // best-effort storage only
    }
  }, [uiMode]);

  const updateMode = useCallback((next: NoisegenUiMode) => {
    setUiMode(normalizeMode(next));
  }, []);

  const labels = useMemo(
    () => ({
      listener: "Listener",
      remix: "Remix",
      studio: "Studio",
      labs: "Labs",
    }),
    [],
  );

  return { uiMode, setUiMode: updateMode, modeLabels: labels, modes: MODES };
}

