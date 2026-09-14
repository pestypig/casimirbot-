export type DesktopEphemeralWebCacheSession = Readonly<{
  clearStorageData(options: {
    storages: Array<"serviceworkers" | "cachestorage">;
  }): Promise<void>;
}>;

/**
 * The packaged desktop prefers its last healthy loopback port, but upgrades
 * and occupied-port fallback can leave obsolete origin-scoped service workers
 * and CacheStorage behind. They can also serve a previous build's renderer.
 * They are mobile/offline accelerators rather than user data or authority
 * state, so clear only those two ephemeral stores before the desktop window is
 * created. Cookies, local storage, IndexedDB, credentials, and session state
 * are deliberately outside this cleanup.
 */
export const clearDesktopEphemeralWebCaches = async (
  desktopSession: DesktopEphemeralWebCacheSession,
): Promise<void> => {
  await desktopSession.clearStorageData({
    storages: ["serviceworkers", "cachestorage"],
  });
};
