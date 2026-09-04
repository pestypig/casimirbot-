export type DesktopEphemeralWebCacheSession = Readonly<{
  clearStorageData(options: {
    storages: Array<"serviceworkers" | "cachestorage">;
  }): Promise<void>;
}>;

/**
 * The packaged desktop serves the UI from a freshly reserved loopback port on
 * every launch. Service-worker registrations and CacheStorage are therefore
 * origin-scoped, unreachable from later launches, and can grow without bound.
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
