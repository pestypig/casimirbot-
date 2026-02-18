import { EventEmitter } from "node:events";
import { emitEventSpine } from "../services/observability/event-spine.js";

export const navPoseBus = new EventEmitter();

export type NavPoseEvent = {
  traceId?: string;
  sessionId?: string;
  runId?: string;
  pose: unknown;
  ts?: string;
};

export const NAV_POSE_EVENT = "nav:pose";

export const emitNavPose = (event: NavPoseEvent): void => {
  emitEventSpine({
    kind: "nav.pose",
    traceId: event.traceId,
    sessionId: event.sessionId,
    runId: event.runId,
    ts: event.ts,
    payload: event.pose,
  });
  navPoseBus.emit(NAV_POSE_EVENT, event);
};
