import type {
  HelixEnvironmentConstrainedJsonSchema,
} from "./helix-environment-connector";

export type EnvironmentConnectorSchemaIssue = {
  path: string;
  code: string;
  message: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const validateEnvironmentConnectorSchemaValue = (
  schema: HelixEnvironmentConstrainedJsonSchema,
  value: unknown,
  path = "$",
): EnvironmentConnectorSchemaIssue[] => {
  const issues: EnvironmentConnectorSchemaIssue[] = [];
  const issue = (code: string, message: string): void => {
    issues.push({ path, code, message });
  };
  switch (schema.type) {
    case "object": {
      if (!isRecord(value)) {
        issue("type", "Expected an object.");
        return issues;
      }
      const properties = schema.properties ?? {};
      for (const required of schema.required ?? []) {
        if (!(required in value)) {
          issues.push({
            path: `${path}.${required}`,
            code: "required",
            message: `Missing required property ${required}.`,
          });
        }
      }
      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!(key in properties)) {
            issues.push({
              path: `${path}.${key}`,
              code: "additional_property",
              message: `Property ${key} is not admitted by the frozen schema.`,
            });
          }
        }
      }
      for (const [key, child] of Object.entries(properties)) {
        if (key in value) {
          issues.push(
            ...validateEnvironmentConnectorSchemaValue(
              child,
              value[key],
              `${path}.${key}`,
            ),
          );
        }
      }
      return issues;
    }
    case "array": {
      if (!Array.isArray(value)) {
        issue("type", "Expected an array.");
        return issues;
      }
      if (schema.minItems !== undefined && value.length < schema.minItems) {
        issue("min_items", `Expected at least ${schema.minItems} items.`);
      }
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        issue("max_items", `Expected at most ${schema.maxItems} items.`);
      }
      if (schema.items) {
        value.forEach((entry, index) => {
          issues.push(
            ...validateEnvironmentConnectorSchemaValue(
              schema.items as HelixEnvironmentConstrainedJsonSchema,
              entry,
              `${path}[${index}]`,
            ),
          );
        });
      }
      return issues;
    }
    case "string":
      if (typeof value !== "string") {
        issue("type", "Expected a string.");
        return issues;
      }
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        issue("min_length", `Expected at least ${schema.minLength} characters.`);
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        issue("max_length", `Expected at most ${schema.maxLength} characters.`);
      }
      break;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        issue("type", "Expected a finite number.");
        return issues;
      }
      break;
    case "integer":
      if (typeof value !== "number" || !Number.isInteger(value)) {
        issue("type", "Expected an integer.");
        return issues;
      }
      break;
    case "boolean":
      if (typeof value !== "boolean") {
        issue("type", "Expected a boolean.");
        return issues;
      }
      break;
  }
  if (
    schema.enum &&
    !schema.enum.some((candidate) => Object.is(candidate, value))
  ) {
    issue("enum", "Value is outside the admitted enum.");
  }
  if (
    typeof value === "number" &&
    schema.minimum !== undefined &&
    value < schema.minimum
  ) {
    issue("minimum", `Value must be at least ${schema.minimum}.`);
  }
  if (
    typeof value === "number" &&
    schema.maximum !== undefined &&
    value > schema.maximum
  ) {
    issue("maximum", `Value must be at most ${schema.maximum}.`);
  }
  return issues;
};

export const compileEnvironmentConnectorSchema = (
  schema: HelixEnvironmentConstrainedJsonSchema,
): ((value: unknown) => {
  ok: boolean;
  issues: EnvironmentConnectorSchemaIssue[];
}) => (value: unknown) => {
  const issues = validateEnvironmentConnectorSchemaValue(schema, value);
  return { ok: issues.length === 0, issues };
};

