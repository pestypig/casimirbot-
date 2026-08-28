import crypto from "node:crypto";
import type { HelixStepUpPurpose } from "@shared/desktop-auth0-step-up";

export type HelixStepUpReceiptBinding = Readonly<{
  profileId: string;
  sessionId: string;
  deviceId: string;
  purpose: HelixStepUpPurpose;
  targetRef: string | null;
  issuer: string;
  subject: string;
  authTime: string;
  amr: readonly string[];
  acr: string;
}>;

export type HelixStepUpReceiptProjection = Readonly<{
  receipt_ref: string;
  purpose: HelixStepUpPurpose;
  target_ref: string | null;
  created_at: string;
  expires_at: string;
  status: "active" | "consumed" | "revoked" | "expired";
  usable_receipt_included: false;
  identity_token_included: false;
  access_token_included: false;
  factor_detail_included: false;
}>;

type ReceiptRecord = {
  receiptRef: string;
  tokenHash: string;
  binding: HelixStepUpReceiptBinding;
  createdAtMs: number;
  expiresAtMs: number;
  status: "active" | "consumed" | "revoked";
  consumedAtMs: number | null;
  revokedAtMs: number | null;
};

export class HelixStepUpReceiptError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "receipt_invalid"
      | "receipt_expired"
      | "receipt_replayed"
      | "receipt_revoked"
      | "receipt_binding_mismatch",
    message: string,
  ) {
    super(message);
    this.name = "HelixStepUpReceiptError";
  }
}

const clean = (value: string, field: string, max = 512): string => {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new HelixStepUpReceiptError(
      400,
      "receipt_binding_mismatch",
      `${field} is invalid.`,
    );
  }
  return normalized;
};

const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("base64url");

const projection = (
  record: ReceiptRecord,
  nowMs: number,
): HelixStepUpReceiptProjection => ({
  receipt_ref: record.receiptRef,
  purpose: record.binding.purpose,
  target_ref: record.binding.targetRef,
  created_at: new Date(record.createdAtMs).toISOString(),
  expires_at: new Date(record.expiresAtMs).toISOString(),
  status: record.status === "active" && record.expiresAtMs <= nowMs
    ? "expired"
    : record.status,
  usable_receipt_included: false,
  identity_token_included: false,
  access_token_included: false,
  factor_detail_included: false,
});

export class HelixStepUpReceiptStore {
  private readonly records = new Map<string, ReceiptRecord>();

  constructor(
    private readonly dependencies: Readonly<{
      now?: () => Date;
      randomBytes?: (size: number) => Buffer;
      randomId?: () => string;
    }> = {},
  ) {}

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  issue(input: {
    binding: HelixStepUpReceiptBinding;
    ttlSeconds?: number;
  }): { token: string; projection: HelixStepUpReceiptProjection } {
    const nowMs = this.now().getTime();
    const ttlSeconds = Math.max(30, Math.min(5 * 60, Math.floor(
      input.ttlSeconds ?? 2 * 60,
    )));
    const randomBytes = this.dependencies.randomBytes ?? crypto.randomBytes;
    const randomId = this.dependencies.randomId ?? crypto.randomUUID;
    const token = `stepup_${randomBytes(32).toString("base64url")}`;
    const record: ReceiptRecord = {
      receiptRef: `stepup_receipt_${randomId()}`,
      tokenHash: hashToken(token),
      binding: Object.freeze({
        ...input.binding,
        profileId: clean(input.binding.profileId, "profile_id"),
        sessionId: clean(input.binding.sessionId, "session_id"),
        deviceId: clean(input.binding.deviceId, "device_id"),
        targetRef: input.binding.targetRef === null
          ? null
          : clean(input.binding.targetRef, "target_ref"),
        issuer: clean(input.binding.issuer, "issuer", 2_048),
        subject: clean(input.binding.subject, "subject", 1_024),
        authTime: clean(input.binding.authTime, "auth_time", 64),
        acr: clean(input.binding.acr, "acr", 2_048),
        amr: Object.freeze([...input.binding.amr]),
      }),
      createdAtMs: nowMs,
      expiresAtMs: nowMs + ttlSeconds * 1_000,
      status: "active",
      consumedAtMs: null,
      revokedAtMs: null,
    };
    this.records.set(record.tokenHash, record);
    return { token, projection: projection(record, nowMs) };
  }

  consume(input: {
    token: unknown;
    profileId: string;
    sessionId: string;
    deviceId: string;
    purpose: HelixStepUpPurpose;
    targetRef: string | null;
  }): HelixStepUpReceiptProjection {
    if (
      typeof input.token !== "string" ||
      !/^stepup_[A-Za-z0-9_-]{43}$/u.test(input.token)
    ) {
      throw new HelixStepUpReceiptError(
        401,
        "receipt_invalid",
        "The step-up receipt is invalid.",
      );
    }
    const record = this.records.get(hashToken(input.token));
    if (!record) {
      throw new HelixStepUpReceiptError(
        401,
        "receipt_invalid",
        "The step-up receipt is invalid or no longer belongs to this service epoch.",
      );
    }
    const nowMs = this.now().getTime();
    if (record.status === "consumed") {
      throw new HelixStepUpReceiptError(
        409,
        "receipt_replayed",
        "The step-up receipt has already been consumed.",
      );
    }
    if (record.status === "revoked") {
      throw new HelixStepUpReceiptError(
        410,
        "receipt_revoked",
        "The step-up receipt has been revoked.",
      );
    }
    if (record.expiresAtMs <= nowMs) {
      throw new HelixStepUpReceiptError(
        410,
        "receipt_expired",
        "The step-up receipt has expired.",
      );
    }
    const binding = record.binding;
    const targetRef = input.targetRef?.trim() || null;
    if (
      binding.profileId !== input.profileId.trim() ||
      binding.sessionId !== input.sessionId.trim() ||
      binding.deviceId !== input.deviceId.trim() ||
      binding.purpose !== input.purpose ||
      binding.targetRef !== targetRef
    ) {
      throw new HelixStepUpReceiptError(
        403,
        "receipt_binding_mismatch",
        "The step-up receipt does not authorize this operation.",
      );
    }
    record.status = "consumed";
    record.consumedAtMs = nowMs;
    return projection(record, nowMs);
  }

  consumeNativeOperation(input: {
    token: unknown;
    deviceId: string;
    purpose: HelixStepUpPurpose;
  }): {
    binding: HelixStepUpReceiptBinding;
    projection: HelixStepUpReceiptProjection;
  } {
    if (
      typeof input.token !== "string" ||
      !/^stepup_[A-Za-z0-9_-]{43}$/u.test(input.token)
    ) {
      throw new HelixStepUpReceiptError(
        401,
        "receipt_invalid",
        "The step-up receipt is invalid.",
      );
    }
    const record = this.records.get(hashToken(input.token));
    if (!record) {
      throw new HelixStepUpReceiptError(
        401,
        "receipt_invalid",
        "The step-up receipt is invalid or no longer belongs to this service epoch.",
      );
    }
    const result = this.consume({
      token: input.token,
      profileId: record.binding.profileId,
      sessionId: record.binding.sessionId,
      deviceId: input.deviceId,
      purpose: input.purpose,
      targetRef: record.binding.targetRef,
    });
    return { binding: record.binding, projection: result };
  }

  revokeBound(input: {
    profileId?: string;
    sessionId?: string;
    deviceId?: string;
  }): number {
    const nowMs = this.now().getTime();
    let count = 0;
    for (const record of this.records.values()) {
      if (record.status !== "active") continue;
      if (input.profileId && record.binding.profileId !== input.profileId) continue;
      if (input.sessionId && record.binding.sessionId !== input.sessionId) continue;
      if (input.deviceId && record.binding.deviceId !== input.deviceId) continue;
      record.status = "revoked";
      record.revokedAtMs = nowMs;
      count += 1;
    }
    return count;
  }
}

export const helixStepUpReceiptStore = new HelixStepUpReceiptStore();
