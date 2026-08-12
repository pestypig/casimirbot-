import type { Session } from "electron";

/**
 * The native host exposes no browser permission or browser-download capability.
 * Signed application updates use electron-updater in the main process instead.
 */
export function installDesktopSessionSecurity(targetSession: Session): void {
  targetSession.setPermissionCheckHandler(() => false);
  targetSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  targetSession.setDevicePermissionHandler(() => false);
  targetSession.on("will-download", (event) => event.preventDefault());
}
