const REDACTION = "[REDACTED_SECRET]";

const SECRET_PATTERNS: readonly RegExp[] = [
  /\bhelix_room_src_[A-Za-z0-9_-]+/gu,
  /\broom_source_claim_[A-Za-z0-9:._~-]+/gu,
  /\bagent_chat_claim_[A-Za-z0-9:._~-]+/gu,
  /\bAuthorization\s*:\s*Bearer\s+[^\s,;"']+/giu,
  /\bBearer\s+[A-Za-z0-9._~+/-]{12,}={0,2}/giu,
  /\b(?:access_token|refresh_token|bearer_token|token_value|claim_handle)\s*[=:]\s*["']?[^"'\s,;}&]+/giu,
  /([?&](?:access_token|key|token)=)[^&#\s]+/giu,
];

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type SensitiveTextRedaction = {
  text: string;
  redacted: boolean;
};

/**
 * Removes credentials and one-time claims before free-form text crosses into
 * browser observation, model context, debug projection, or durable state.
 * `additionalSecrets` is for request-local authenticated values that do not
 * carry a recognizable Helix prefix.
 */
export const redactHelixAgentSensitiveText = (
  value: string,
  additionalSecrets: readonly string[] = [],
): SensitiveTextRedaction => {
  let text = value;
  for (const secret of additionalSecrets) {
    const normalized = secret.trim();
    if (!normalized) continue;
    text = text.replace(new RegExp(escapeRegExp(normalized), "gu"), REDACTION);
  }
  for (const pattern of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    text = text.replace(pattern, REDACTION);
  }
  return {
    text,
    redacted: text !== value,
  };
};

export const containsHelixAgentSensitiveText = (
  value: string,
  additionalSecrets: readonly string[] = [],
): boolean => redactHelixAgentSensitiveText(value, additionalSecrets).redacted;

const redactSensitiveValue = (
  value: unknown,
  additionalSecrets: readonly string[],
  seen: WeakMap<object, unknown>,
): unknown => {
  if (typeof value === "string") {
    return redactHelixAgentSensitiveText(value, additionalSecrets).text;
  }
  if (!value || typeof value !== "object") return value;
  const prior = seen.get(value);
  if (prior !== undefined) return prior;
  if (Array.isArray(value)) {
    const output: unknown[] = [];
    seen.set(value, output);
    for (const entry of value) {
      output.push(redactSensitiveValue(entry, additionalSecrets, seen));
    }
    return output;
  }
  const output: Record<string, unknown> = {};
  seen.set(value, output);
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    const safeKey = redactHelixAgentSensitiveText(key, additionalSecrets).text;
    output[safeKey] = redactSensitiveValue(nested, additionalSecrets, seen);
  }
  return output;
};

/**
 * Defense-in-depth for legacy or cross-lane JSON projections. Both keys and
 * values are traversed so schema-error metadata and caller-controlled map keys
 * cannot carry credentials into receipts, events, debug output, or model input.
 */
export const redactHelixAgentSensitiveValue = <T>(
  value: T,
  additionalSecrets: readonly string[] = [],
): T =>
  redactSensitiveValue(
    value,
    additionalSecrets,
    new WeakMap<object, unknown>(),
  ) as T;

export const containsHelixAgentSensitiveValue = (
  value: unknown,
  additionalSecrets: readonly string[] = [],
): boolean => {
  const redacted = redactHelixAgentSensitiveValue(value, additionalSecrets);
  try {
    return JSON.stringify(redacted) !== JSON.stringify(value);
  } catch {
    return true;
  }
};

/**
 * Produces a JSON string that cannot emit literal HTML/XML delimiter
 * characters. This keeps user text inside one server-owned record even when
 * it resembles a context closing tag.
 */
export const quoteHelixAgentContextRecord = (value: unknown): string =>
  JSON.stringify(value)
    .replace(/</gu, "\\u003c")
    .replace(/>/gu, "\\u003e")
    .replace(/&/gu, "\\u0026");
