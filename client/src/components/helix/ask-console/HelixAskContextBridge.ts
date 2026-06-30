export type HelixAskContextBridgeSnapshot = {
  activeDocPath: string | null;
};

export function readDocPathFromDesktopUrl(url: string): string | null {
  try {
    const parsed = new URL(url, "http://localhost");
    const value = parsed.searchParams.get("doc");
    return value && value.trim() ? value.trim() : null;
  } catch {
    return null;
  }
}

export function buildHelixAskContextBridgeSnapshot(url: string): HelixAskContextBridgeSnapshot {
  return {
    activeDocPath: readDocPathFromDesktopUrl(url),
  };
}
