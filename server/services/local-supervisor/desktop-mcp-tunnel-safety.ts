export type DesktopMcpTunnelSafetyReason = "environment_emergency_stop";

type Handler = (reason: DesktopMcpTunnelSafetyReason) => Promise<void>;
let handler: Handler | null = null;

export const installDesktopMcpTunnelSafetyHandler = (
  next: Handler | null,
): (() => void) => {
  handler = next;
  return () => {
    if (handler === next) handler = null;
  };
};

export const requestDesktopMcpTunnelReadOnlyForSafety = async (
  reason: DesktopMcpTunnelSafetyReason,
): Promise<boolean> => {
  const active = handler;
  if (!active) return false;
  await active(reason);
  return true;
};
