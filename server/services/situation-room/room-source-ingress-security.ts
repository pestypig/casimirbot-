import crypto from "node:crypto";

export const HELIX_ROOM_SOURCE_SECRET_REDACTION =
  "[redacted_room_source_secret]" as const;

const protectedSecretPatterns = [
  /helix_room_src_[A-Za-z0-9_-]{16,}/giu,
  /room_source_claim_[A-Za-z0-9_-]{16,}/giu,
  /agent_chat_claim_[A-Za-z0-9_-]{16,}/giu,
  /claim_handle_[A-Za-z0-9_-]{8,}/giu,
  /Bearer\s+[A-Za-z0-9._~+/-]{16,}={0,2}(?![A-Za-z0-9._~+/-])/giu,
] as const;

const normalizedSecrets = (values: readonly string[]): string[] =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length >= 8),
    ),
  );

const stringContainsProtectedSecret = (
  value: string,
  exactSecrets: readonly string[],
): boolean => {
  if (exactSecrets.some((secret) => value.includes(secret))) return true;
  return protectedSecretPatterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
};

const visitStrings = (
  value: unknown,
  visitor: (value: string) => boolean,
  seen: WeakSet<object>,
): boolean => {
  if (typeof value === "string") return visitor(value);
  if (!value || typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((entry) => visitStrings(entry, visitor, seen));
  }
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      visitor(key) ||
      visitStrings(nested, visitor, seen)
    ) {
      return true;
    }
  }
  return false;
};

export const containsProtectedRoomSourceSecret = (
  value: unknown,
  options: {
    exactSecrets?: readonly string[];
  } = {},
): boolean => {
  const secrets = normalizedSecrets(options.exactSecrets ?? []);
  return visitStrings(
    value,
    (candidate) => stringContainsProtectedSecret(candidate, secrets),
    new WeakSet<object>(),
  );
};

const redactString = (
  value: string,
  exactSecrets: readonly string[],
): string => {
  let redacted = value;
  for (const secret of exactSecrets) {
    redacted = redacted.split(secret).join(HELIX_ROOM_SOURCE_SECRET_REDACTION);
  }
  for (const pattern of protectedSecretPatterns) {
    pattern.lastIndex = 0;
    redacted = redacted.replace(
      pattern,
      HELIX_ROOM_SOURCE_SECRET_REDACTION,
    );
  }
  return redacted;
};

const redactValue = (
  value: unknown,
  exactSecrets: readonly string[],
  seen: WeakMap<object, unknown>,
): unknown => {
  if (typeof value === "string") return redactString(value, exactSecrets);
  if (!value || typeof value !== "object") return value;
  const prior = seen.get(value);
  if (prior !== undefined) return prior;
  if (Array.isArray(value)) {
    const output: unknown[] = [];
    seen.set(value, output);
    for (const entry of value) {
      output.push(redactValue(entry, exactSecrets, seen));
    }
    return output;
  }
  const output: Record<string, unknown> = {};
  seen.set(value, output);
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    output[redactString(key, exactSecrets)] = redactValue(
      nested,
      exactSecrets,
      seen,
    );
  }
  return output;
};

export const redactProtectedRoomSourceSecrets = <T>(
  value: T,
  options: {
    exactSecrets?: readonly string[];
  } = {},
): T =>
  redactValue(
    value,
    normalizedSecrets(options.exactSecrets ?? []),
    new WeakMap<object, unknown>(),
  ) as T;

export const projectRoomSourceRequestId = (input: {
  bindingId: string;
  requestId: string;
}): string => {
  const digest = crypto
    .createHash("sha256")
    .update(input.bindingId, "utf8")
    .update("\0", "utf8")
    .update(input.requestId, "utf8")
    .digest("hex");
  return `request_sha256:${digest}`;
};

export const buildRoomSourceRequestEvidenceRef = (input: {
  bindingId: string;
  requestId: string;
}): string =>
  buildRoomSourceRequestEvidenceRefFromProjection({
    bindingId: input.bindingId,
    requestProjectionId: projectRoomSourceRequestId(input),
  });

export const buildRoomSourceRequestEvidenceRefFromProjection = (input: {
  bindingId: string;
  requestProjectionId: string;
}): string =>
  `room_source_request:${input.bindingId}:${input.requestProjectionId}`;

const replaceRequestId = (
  value: unknown,
  requestId: string,
  requestProjectionId: string,
  seen: WeakMap<object, unknown>,
): unknown => {
  if (typeof value === "string") {
    return value.split(requestId).join(requestProjectionId);
  }
  if (!value || typeof value !== "object") return value;
  const prior = seen.get(value);
  if (prior !== undefined) return prior;
  if (Array.isArray(value)) {
    const output: unknown[] = [];
    seen.set(value, output);
    for (const entry of value) {
      output.push(
        replaceRequestId(
          entry,
          requestId,
          requestProjectionId,
          seen,
        ),
      );
    }
    return output;
  }
  const output: Record<string, unknown> = {};
  seen.set(value, output);
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    output[key.split(requestId).join(requestProjectionId)] =
      replaceRequestId(
        nested,
        requestId,
        requestProjectionId,
        seen,
      );
  }
  return output;
};

export const replaceRoomSourceRequestIdInProjection = <T>(
  value: T,
  input: {
    requestId: string;
    requestProjectionId: string;
  },
): T =>
  replaceRequestId(
    value,
    input.requestId,
    input.requestProjectionId,
    new WeakMap<object, unknown>(),
  ) as T;
