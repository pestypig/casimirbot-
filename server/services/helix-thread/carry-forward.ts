import {
  clearHelixAskSessionGraphLock,
  getHelixAskSessionGraphLock,
  getHelixAskSessionMemory,
  recordHelixAskSessionMemory,
  setHelixAskSessionGraphLock,
  type HelixAskSessionMemory,
} from "../helix-ask/session-memory";

export type { HelixAskSessionMemory };

export const getHelixThreadSessionMemory = (
  sessionId?: string,
): HelixAskSessionMemory | null => getHelixAskSessionMemory(sessionId);

export const recordHelixThreadCarryForward = (
  args: Parameters<typeof recordHelixAskSessionMemory>[0],
): void => {
  recordHelixAskSessionMemory(args);
};

export const getHelixThreadSessionGraphLock = (sessionId?: string): string[] =>
  getHelixAskSessionGraphLock(sessionId);

export const setHelixThreadSessionGraphLock = (
  args: Parameters<typeof setHelixAskSessionGraphLock>[0],
): string[] => setHelixAskSessionGraphLock(args);

export const clearHelixThreadSessionGraphLock = (sessionId?: string): void => {
  clearHelixAskSessionGraphLock(sessionId);
};
