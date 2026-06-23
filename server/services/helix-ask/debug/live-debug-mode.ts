export type HelixAskLiveDebugMode = "slim" | "deep";

export const readHelixAskLiveDebugMode = (input?: Record<string, unknown> | null): HelixAskLiveDebugMode => {
  const envMode = typeof process.env.HELIX_ASK_LIVE_DEBUG_MODE === "string"
    ? process.env.HELIX_ASK_LIVE_DEBUG_MODE.trim().toLowerCase()
    : "";
  if (envMode === "deep" || envMode === "full") return "deep";
  if (envMode === "slim") return "slim";
  const requestedMode =
    input?.debugMode ??
    input?.debug_mode ??
    input?.debugDepth ??
    input?.debug_depth ??
    input?.live_debug_mode;
  if (typeof requestedMode === "string") {
    const normalized = requestedMode.trim().toLowerCase();
    if (normalized === "deep" || normalized === "full") return "deep";
    if (normalized === "slim") return "slim";
  }
  if (input?.deepDebug === true || input?.deep_debug === true) return "deep";
  return "slim";
};
