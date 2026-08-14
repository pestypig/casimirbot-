import crypto from "node:crypto";

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key])]),
  );
};

const stableJson = (value: unknown): string => JSON.stringify(stableValue(value));

const subtreeKey = (value: unknown): string =>
  crypto.createHash("sha256").update(stableJson(value)).digest("hex");

/**
 * Project a large, repeated input schema into an equivalent provider-facing
 * JSON Schema using local $defs references. The gateway retains and validates
 * against the original authoritative schema. This changes serialization size,
 * never admission or runtime semantics.
 */
export const deduplicateCodexModelInputSchema = (
  schema: JsonRecord,
  minimumRepeatedSubtreeChars = 240,
): JsonRecord => {
  const counts = new Map<string, { count: number; chars: number; value: unknown }>();
  const visit = (value: unknown): void => {
    if (!isRecord(value)) return;
    const serialized = stableJson(value);
    if (serialized.length >= minimumRepeatedSubtreeChars) {
      const key = subtreeKey(value);
      const prior = counts.get(key);
      counts.set(key, {
        count: (prior?.count ?? 0) + 1,
        chars: serialized.length,
        value,
      });
    }
    const visitSchemaMap = (candidate: unknown): void => {
      if (!isRecord(candidate)) return;
      Object.values(candidate).forEach(visit);
    };
    visitSchemaMap(value.properties);
    visitSchemaMap(value.patternProperties);
    visitSchemaMap(value.dependentSchemas);
    visitSchemaMap(value.$defs);
    for (const key of [
      "items",
      "contains",
      "additionalProperties",
      "unevaluatedProperties",
      "propertyNames",
      "not",
      "if",
      "then",
      "else",
    ]) {
      visit(value[key]);
    }
    for (const key of ["oneOf", "anyOf", "allOf", "prefixItems"]) {
      const candidates = value[key];
      if (Array.isArray(candidates)) candidates.forEach(visit);
    }
  };
  visit(schema);

  const repeated = [...counts.entries()]
    .filter(([, entry]) => entry.count > 1)
    .sort(
      ([leftKey, left], [rightKey, right]) =>
        right.chars - left.chars || leftKey.localeCompare(rightKey),
    );
  if (repeated.length === 0) return schema;

  const definitionNameByKey = new Map(
    repeated.map(([key], index) => [key, `shared_${index + 1}`]),
  );
  const project = (value: unknown, definingKey: string | null): unknown => {
    if (!isRecord(value)) return value;
    const key = subtreeKey(value);
    const definitionName = definitionNameByKey.get(key);
    if (definitionName && key !== definingKey) {
      return { $ref: `#/$defs/${definitionName}` };
    }
    const projectSchemaMap = (candidate: unknown): unknown =>
      isRecord(candidate)
        ? Object.fromEntries(
            Object.entries(candidate).map(([name, entry]) => [
              name,
              project(entry, definingKey),
            ]),
          )
        : candidate;
    return Object.fromEntries(
      Object.entries(value).map(([name, entry]) => {
        if (
          ["properties", "patternProperties", "dependentSchemas", "$defs"].includes(
            name,
          )
        ) {
          return [name, projectSchemaMap(entry)];
        }
        if (
          [
            "items",
            "contains",
            "additionalProperties",
            "unevaluatedProperties",
            "propertyNames",
            "not",
            "if",
            "then",
            "else",
          ].includes(name)
        ) {
          return [name, project(entry, definingKey)];
        }
        if (
          ["oneOf", "anyOf", "allOf", "prefixItems"].includes(name) &&
          Array.isArray(entry)
        ) {
          return [name, entry.map((candidate) => project(candidate, definingKey))];
        }
        return [name, entry];
      }),
    );
  };

  const projectedRoot = project(schema, null) as JsonRecord;
  const definitions = Object.fromEntries(
    repeated.map(([key, entry]) => [
      definitionNameByKey.get(key)!,
      project(entry.value, key),
    ]),
  );
  return {
    ...projectedRoot,
    $defs: definitions,
  };
};
