import type { HelixSharedRealtimeRoomErrorCode } from
  "@shared/helix-shared-realtime-room";

export type SharedRealtimeRoomDomainStatus = 400 | 401 | 403 | 404 | 409 | 503;

export class SharedRealtimeRoomDomainError extends Error {
  readonly code: HelixSharedRealtimeRoomErrorCode;
  readonly statusCode: SharedRealtimeRoomDomainStatus;

  constructor(
    code: HelixSharedRealtimeRoomErrorCode,
    statusCode: SharedRealtimeRoomDomainStatus,
    message: string,
  ) {
    super(message);
    this.name = "SharedRealtimeRoomDomainError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export const isSharedRealtimeRoomDomainError = (
  value: unknown,
): value is SharedRealtimeRoomDomainError => value instanceof SharedRealtimeRoomDomainError;
