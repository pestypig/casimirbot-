export type HelixRealtimeSidebandControlSend = (input: {
  realtimeSessionId: string;
  event: Record<string, unknown>;
  onComplete?: (failureCode: string | null) => void;
}) => boolean;

type ProviderEventListener = (input: {
  realtimeSessionId: string;
  event: Record<string, unknown>;
}) => void;

type ActivityListener = (input: {
  realtimeSessionId: string;
  activity: string;
}) => void;

type SessionClosedListener = (input: {
  realtimeSessionId: string;
  reason: string;
}) => void;

let sender: HelixRealtimeSidebandControlSend | null = null;
const providerEventListeners = new Set<ProviderEventListener>();
const activityListeners = new Set<ActivityListener>();
const sessionClosedListeners = new Set<SessionClosedListener>();

export const registerRealtimeSidebandControlSender = (
  next: HelixRealtimeSidebandControlSend,
): void => {
  sender = next;
};

export const sendRealtimeSidebandControlEvent: HelixRealtimeSidebandControlSend = (input) =>
  sender?.(input) === true;

export const publishRealtimeSidebandProviderEvent = (
  input: Parameters<ProviderEventListener>[0],
): void => {
  for (const listener of providerEventListeners) listener(input);
};

export const subscribeRealtimeSidebandProviderEvents = (
  listener: ProviderEventListener,
): (() => void) => {
  providerEventListeners.add(listener);
  return () => providerEventListeners.delete(listener);
};

export const publishRealtimeSidebandActivity = (
  input: Parameters<ActivityListener>[0],
): void => {
  for (const listener of activityListeners) listener(input);
};

export const subscribeRealtimeSidebandActivity = (
  listener: ActivityListener,
): (() => void) => {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
};

export const publishRealtimeSidebandSessionClosed = (
  input: Parameters<SessionClosedListener>[0],
): void => {
  for (const listener of sessionClosedListeners) listener(input);
};

export const subscribeRealtimeSidebandSessionClosed = (
  listener: SessionClosedListener,
): (() => void) => {
  sessionClosedListeners.add(listener);
  return () => sessionClosedListeners.delete(listener);
};

export const setRealtimeSidebandControlSenderForTests = (
  next: HelixRealtimeSidebandControlSend | null,
): void => {
  sender = next;
};
