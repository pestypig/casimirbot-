export const MOBILE_BREAKPOINT_PX = 900;
export const TABLET_COARSE_BREAKPOINT_PX = 1200;
export const COMPACT_TOUCH_SCREEN_SHORT_EDGE_PX = 1024;
export const COMPACT_TOUCH_SCREEN_LONG_EDGE_PX = 1400;

const MOBILE_UA_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export type MobileDeviceSignals = {
  mobileHint?: string | null;
  userAgent?: string | null;
  userAgentDataMobile?: boolean | null;
  maxTouchPoints?: number | null;
  viewportWidth?: number | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  primaryCoarsePointer?: boolean;
  anyCoarsePointer?: boolean;
};

export function resolveMobileDeviceSignals(signals: MobileDeviceSignals): boolean {
  if (signals.mobileHint?.trim() === "?1" || signals.userAgentDataMobile === true) return true;

  const userAgent = signals.userAgent ?? "";
  if (MOBILE_UA_REGEX.test(userAgent)) return true;
  if (userAgent.includes("Macintosh") && (/Mobile/i.test(userAgent) || (signals.maxTouchPoints ?? 0) > 1)) {
    return true;
  }

  const viewportWidth = signals.viewportWidth ?? Number.POSITIVE_INFINITY;
  if (viewportWidth <= MOBILE_BREAKPOINT_PX) return true;

  const coarsePointer = signals.primaryCoarsePointer === true || signals.anyCoarsePointer === true;
  if (coarsePointer && viewportWidth <= TABLET_COARSE_BREAKPOINT_PX) return true;

  const screenWidth = signals.screenWidth ?? Number.POSITIVE_INFINITY;
  const screenHeight = signals.screenHeight ?? Number.POSITIVE_INFINITY;
  const shortEdge = Math.min(screenWidth, screenHeight);
  const longEdge = Math.max(screenWidth, screenHeight);
  return (
    (signals.maxTouchPoints ?? 0) > 0 &&
    shortEdge <= COMPACT_TOUCH_SCREEN_SHORT_EDGE_PX &&
    longEdge <= COMPACT_TOUCH_SCREEN_LONG_EDGE_PX
  );
}
