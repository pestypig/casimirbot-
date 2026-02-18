import crypto from "node:crypto";
import { stableJsonStringify } from "../../utils/stable-json";
import { sha256Hex } from "../../utils/information-boundary";
import { EventSpineRingBuffer } from "./event-spine-ring-buffer";

export type EventSpineKind =
  | "tool.start"
  | "tool.success"
  | "tool.error"
  | "adapter.verdict"
  | "training-trace.emit"
  | "nav.pose"
  | "unknown";

export type EventSpineEnvelope = {
  eventId: string;
  seq: number;
  ts: string;
  kind: EventSpineKind | (string & {});
  traceId?: string;
  sessionId?: string;
  runId?: string;
  payloadHash: string;
  payload?: unknown;
};

export type EmitEventInput = {
  kind: EventSpineEnvelope["kind"];
  traceId?: string;
  sessionId?: string;
  runId?: string;
  ts?: string;
  eventId?: string;
  payload?: unknown;
};

const parseCapacity = (): number => {
  const requested = Number(process.env.EVENT_SPINE_BUFFER_SIZE ?? 512);
  if (!Number.isFinite(requested)) return 512;
  return Math.min(Math.max(Math.floor(requested), 16), 100000);
};

export const createEventSpine = (options?: {
  capacity?: number;
  now?: () => Date;
  eventId?: () => string;
  payloadHash?: (value: unknown) => string;
}) => {
  let seq = 0;
  const buffer = new EventSpineRingBuffer<EventSpineEnvelope>(
    options?.capacity ?? parseCapacity(),
  );
  const now = options?.now ?? (() => new Date());
  const nextEventId = options?.eventId ?? (() => crypto.randomUUID());
  const payloadHash =
    options?.payloadHash ?? ((value: unknown) => sha256Hex(stableJsonStringify(value ?? null)));

  const emit = (input: EmitEventInput): EventSpineEnvelope => {
    const envelope: EventSpineEnvelope = {
      eventId: input.eventId ?? nextEventId(),
      seq: ++seq,
      ts: input.ts ?? now().toISOString(),
      kind: input.kind,
      traceId: input.traceId,
      sessionId: input.sessionId,
      runId: input.runId,
      payloadHash: payloadHash(input.payload ?? null),
      payload: input.payload,
    };
    buffer.push(envelope);
    return envelope;
  };

  const recent = (limit?: number): EventSpineEnvelope[] => buffer.latest(limit);
  const stats = (): { capacity: number; dropped: number; totalEmitted: number } => {
    const snapshot = buffer.snapshot();
    return {
      capacity: snapshot.capacity,
      dropped: snapshot.dropped,
      totalEmitted: seq,
    };
  };
  const reset = (): void => {
    seq = 0;
    buffer.reset();
  };

  return { emit, recent, stats, reset };
};

export const eventSpine = createEventSpine();

export const emitEventSpine = (input: EmitEventInput): EventSpineEnvelope =>
  eventSpine.emit(input);

export const getEventSpineRecent = (limit?: number): EventSpineEnvelope[] =>
  eventSpine.recent(limit);

export const getEventSpineStats = (): { capacity: number; dropped: number; totalEmitted: number } =>
  eventSpine.stats();

export const __resetEventSpine = (): void => {
  eventSpine.reset();
};
