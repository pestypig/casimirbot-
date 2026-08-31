import crypto from "node:crypto";
import {
  FAL_FLUX2_KLEIN_REALTIME_MODEL,
  createFalFlux2KleinRealtimeProvider,
  type FalFlux2KleinRealtimeTransport,
  type FalFlux2KleinRealtimeTransportInput,
  type FalFlux2KleinRealtimeTransportResult,
} from "./fal-flux2-klein-realtime-provider";
import type { AttendedFalProviderFactory } from "./attended-fal-runtime";

export type FalRealtimeSdkConnectionLike = {
  send(input: FalFlux2KleinRealtimeTransportInput & { request_id: string }): void;
  close(): void;
};

export type FalRealtimeSdkClientLike = {
  realtime: {
    connect(
      app: string,
      options: {
        connectionKey: string;
        throttleInterval: 0;
        maxBuffering: 1;
        onResult(result: unknown): void;
        onError(error: unknown): void;
      },
    ): FalRealtimeSdkConnectionLike;
  };
};

type PendingRequest = {
  requestId: string;
  resolve(value: FalFlux2KleinRealtimeTransportResult): void;
  reject(error: Error): void;
};

const boundedText = (value: unknown, maximum: number): string | null =>
  typeof value === "string" && value.trim().length > 0
    ? value.trim().slice(0, maximum)
    : null;

const parseSdkResult = (
  value: unknown,
  expectedRequestId: string,
): FalFlux2KleinRealtimeTransportResult => {
  if (!value || typeof value !== "object") throw new Error("fal_realtime_sdk_result_invalid");
  const record = value as Record<string, unknown>;
  const requestId = boundedText(record.request_id, 200);
  if (requestId && requestId !== expectedRequestId) {
    throw new Error("fal_realtime_sdk_request_identity_mismatch");
  }
  if (!Array.isArray(record.images) || record.images.length !== 1) {
    throw new Error("fal_realtime_sdk_single_output_required");
  }
  const image = record.images[0];
  if (!image || typeof image !== "object") throw new Error("fal_realtime_sdk_image_invalid");
  const raw = image as Record<string, unknown>;
  if (typeof raw.content !== "string" && !(raw.content instanceof Uint8Array)) {
    throw new Error("fal_realtime_sdk_image_content_invalid");
  }
  if (!Number.isInteger(raw.width) || !Number.isInteger(raw.height)) {
    throw new Error("fal_realtime_sdk_image_dimensions_invalid");
  }
  return {
    images: [{
      content: raw.content,
      content_type: boundedText(raw.content_type, 80),
      width: raw.width as number,
      height: raw.height as number,
    }],
    seed: Number.isInteger(record.seed) ? record.seed as number : undefined,
    provider_request_id: requestId,
  };
};

export const createFalRealtimeSdkTransport = (input: {
  client: FalRealtimeSdkClientLike;
  connectionKey: string;
  requestId?: () => string;
}): FalFlux2KleinRealtimeTransport => {
  let pending: PendingRequest | null = null;
  let closed = false;
  const nextRequestId = input.requestId ?? (() => `rtp-${crypto.randomUUID()}`);
  const connection = input.client.realtime.connect(
    FAL_FLUX2_KLEIN_REALTIME_MODEL,
    {
      connectionKey: input.connectionKey,
      throttleInterval: 0,
      maxBuffering: 1,
      onResult: (result) => {
        const active = pending;
        if (!active) return;
        pending = null;
        try {
          active.resolve(parseSdkResult(result, active.requestId));
        } catch (error) {
          active.reject(error instanceof Error ? error : new Error("fal_realtime_sdk_result_invalid"));
        }
      },
      onError: () => {
        const active = pending;
        if (!active) return;
        pending = null;
        active.reject(new Error("fal_realtime_sdk_transport_error"));
      },
    },
  );
  return {
    transform: (request) => {
      if (closed) return Promise.reject(new Error("fal_realtime_sdk_transport_closed"));
      if (pending) return Promise.reject(new Error("fal_realtime_sdk_request_in_flight"));
      const requestId = nextRequestId();
      if (!/^[a-zA-Z0-9:._/-]{1,200}$/u.test(requestId)) {
        return Promise.reject(new Error("fal_realtime_sdk_request_id_invalid"));
      }
      return new Promise<FalFlux2KleinRealtimeTransportResult>((resolve, reject) => {
        pending = { requestId, resolve, reject };
        try {
          connection.send({ ...request, request_id: requestId });
        } catch {
          pending = null;
          reject(new Error("fal_realtime_sdk_send_failed"));
        }
      });
    },
    close: () => {
      if (closed) return;
      closed = true;
      const active = pending;
      pending = null;
      active?.reject(new Error("fal_realtime_sdk_transport_closed"));
      connection.close();
    },
  };
};

export const createAttendedFalSdkProviderFactory = (input: {
  createServerClient(credentials: string): FalRealtimeSdkClientLike;
  readCredential?: () => string | undefined;
}): AttendedFalProviderFactory => ({ profileId, sessionId, onTrace }) => {
  const credential = (input.readCredential ?? (() => process.env.FAL_KEY))()?.trim();
  if (!credential) throw new Error("fal_realtime_credential_not_configured");
  const client = input.createServerClient(credential);
  const transport = createFalRealtimeSdkTransport({
    client,
    connectionKey: `rtp:${profileId}:${sessionId}`,
  });
  return createFalFlux2KleinRealtimeProvider({ transport, onTrace });
};
