import type { Session } from "electron";

export type DesktopSessionSecurityOptions = Readonly<{
  getTrustedRendererOrigin?: () => string | null;
}>;

const matchesExactOrigin = (value: string, expectedOrigin: string): boolean => {
  try {
    return new URL(value).origin === expectedOrigin;
  } catch {
    return false;
  }
};

const isTrustedAudioMediaRequest = (input: {
  webContentsUrl: string;
  requestingUrl: string;
  mediaTypes: readonly string[];
  getTrustedRendererOrigin?: () => string | null;
}): boolean => {
  const trustedOrigin = input.getTrustedRendererOrigin?.();
  return Boolean(
    trustedOrigin &&
    input.mediaTypes.length === 1 &&
    input.mediaTypes[0] === "audio" &&
    matchesExactOrigin(input.webContentsUrl, trustedOrigin) &&
    matchesExactOrigin(input.requestingUrl, trustedOrigin)
  );
};

/**
 * The native host exposes only audio capture for its exact private renderer
 * origin. All other browser/device permissions and renderer downloads remain
 * denied. Signed application updates use electron-updater in the main process.
 */
export function installDesktopSessionSecurity(
  targetSession: Session,
  options: DesktopSessionSecurityOptions = {},
): void {
  targetSession.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) =>
      permission === "media" &&
      isTrustedAudioMediaRequest({
        webContentsUrl: webContents?.getURL() ?? "",
        requestingUrl: requestingOrigin,
        mediaTypes: details.mediaType ? [details.mediaType] : [],
        getTrustedRendererOrigin: options.getTrustedRendererOrigin,
      }),
  );
  targetSession.setPermissionRequestHandler(
    (webContents, permission, callback, details) => callback(
      permission === "media" &&
      isTrustedAudioMediaRequest({
        webContentsUrl: webContents?.getURL() ?? "",
        requestingUrl: details?.requestingUrl ?? "",
        mediaTypes: details && "mediaTypes" in details ? details.mediaTypes ?? [] : [],
        getTrustedRendererOrigin: options.getTrustedRendererOrigin,
      }),
    ),
  );
  targetSession.setDevicePermissionHandler(() => false);
  targetSession.on("will-download", (event) => event.preventDefault());
}
