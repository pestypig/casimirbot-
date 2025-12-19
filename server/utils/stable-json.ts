type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const normalizeForStableJson = (value: unknown): JsonValue => {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "boolean") return value as JsonPrimitive;
  if (t === "number") {
    return Number.isFinite(value as number) ? (value as number) : null;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeForStableJson(entry));
  }
  if (isPlainObject(value)) {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    const out: Record<string, JsonValue> = {};
    for (const [k, v] of entries) {
      out[k] = normalizeForStableJson(v);
    }
    return out;
  }
  // Best-effort for other types (Date, Map, Set, Buffer...): fall back to string tag.
  return String(value) as unknown as JsonValue;
};

export function stableJsonStringify(value: unknown): string {
  return JSON.stringify(normalizeForStableJson(value));
}

