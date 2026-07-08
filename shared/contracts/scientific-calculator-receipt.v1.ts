export type ScientificCalculatorReceiptStatusV1 =
  | "template_only"
  | "blocked"
  | "bound_but_unsolved"
  | "calculation_ready"
  | "solved";

export type ScientificCalculatorReceiptVariableV1 = {
  symbol: string;
  value?: string | number | null;
  unit?: string | null;
  meaning?: string | null;
  dimension_signature?: string | null;
  source_refs?: string[];
};

export type ScientificCalculatorDimensionalCheckStatusV1 =
  | "not_applicable"
  | "not_run"
  | "missing_units"
  | "passed"
  | "failed";

export type ScientificCalculatorReceiptV1 = {
  schema: "helix.scientific_calculator_receipt.v1";
  receipt_id: string;
  expression_template_id: string | null;
  status: ScientificCalculatorReceiptStatusV1;
  expression: string;
  latex?: string | null;
  variables: ScientificCalculatorReceiptVariableV1[];
  assumptions: string[];
  source_refs: string[];
  context_keys?: string[];
  dimensional_check_status: ScientificCalculatorDimensionalCheckStatusV1;
  result_value?: string | number | null;
  result_unit?: string | null;
  result_text?: string | null;
  provenance_refs: string[];
  missing_bindings: string[];
  blockers: string[];
  claim_boundary: string;
  created_at: string;
  updated_at: string;
};

export const SCIENTIFIC_CALCULATOR_RECEIPT_CLAIM_BOUNDARY =
  "Calculator receipt is diagnostic evidence only; it is not proof, physical validation, certification, badge promotion, or graph mutation authority.";

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

const readScalar = (value: unknown): string | number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return readString(value);
};

const SCIENTIFIC_CALCULATOR_RECEIPT_STATUSES: ReadonlySet<string> = new Set([
  "template_only",
  "blocked",
  "bound_but_unsolved",
  "calculation_ready",
  "solved",
]);

const SCIENTIFIC_CALCULATOR_DIMENSIONAL_CHECK_STATUSES: ReadonlySet<string> = new Set([
  "not_applicable",
  "not_run",
  "missing_units",
  "passed",
  "failed",
]);

const readReceiptStatus = (
  value: unknown,
  fallback: ScientificCalculatorReceiptStatusV1,
): ScientificCalculatorReceiptStatusV1 => {
  const status = readString(value);
  return status && SCIENTIFIC_CALCULATOR_RECEIPT_STATUSES.has(status)
    ? status as ScientificCalculatorReceiptStatusV1
    : fallback;
};

const readDimensionalCheckStatus = (
  value: unknown,
  fallback: ScientificCalculatorDimensionalCheckStatusV1,
): ScientificCalculatorDimensionalCheckStatusV1 => {
  const status = readString(value);
  return status && SCIENTIFIC_CALCULATOR_DIMENSIONAL_CHECK_STATUSES.has(status)
    ? status as ScientificCalculatorDimensionalCheckStatusV1
    : fallback;
};

export function normalizeScientificCalculatorReceiptV1(
  input: unknown,
  meta: {
    receiptId?: string | null;
    artifactId?: string | null;
    contextKeys?: string[];
    now?: string;
  } = {},
): ScientificCalculatorReceiptV1 | null {
  const record = readRecord(input);
  if (!record) return null;
  const schema = readString(record.schema);
  if (schema !== "helix.scientific_calculator_receipt.v1" && schema !== "helix.calculator_receipt.v1") {
    return null;
  }
  const now = meta.now ?? new Date().toISOString();
  const expression = readString(record.expression ?? record.normalized_expression ?? record.input_latex ?? record.input);
  const resultText = readString(record.result_text ?? record.result ?? record.value);
  const setup = readRecord(record.calculator_setup);
  const variables = Array.isArray(record.variables)
    ? record.variables.flatMap((entry) => {
      const variable = readRecord(entry);
      const symbol = readString(variable?.symbol);
      if (!symbol) return [];
      return [{
        symbol,
        value: readScalar(variable?.value),
        unit: readString(variable?.unit),
        meaning: readString(variable?.meaning),
        dimension_signature: readString(variable?.dimension_signature),
        source_refs: readStringArray(variable?.source_refs),
      }];
    })
    : [];
  return {
    schema: "helix.scientific_calculator_receipt.v1",
    receipt_id:
      readString(record.receipt_id) ??
      meta.receiptId ??
      meta.artifactId ??
      `scientific-calculator-receipt:${Date.now()}`,
    expression_template_id: readString(record.expression_template_id ?? record.template_id ?? record.subgoal_id),
    status: schema === "helix.scientific_calculator_receipt.v1"
      ? readReceiptStatus(record.status, resultText ? "solved" : "template_only")
      : resultText
        ? "solved"
        : "template_only",
    expression: expression ?? readString(setup?.equation) ?? "",
    latex: readString(record.latex ?? record.input_latex ?? record.expression) ?? expression,
    variables,
    assumptions: readStringArray(record.assumptions ?? setup?.assumptions),
    source_refs: readStringArray(record.source_refs),
    context_keys: Array.from(new Set([
      ...readStringArray(record.context_keys),
      ...(meta.contextKeys ?? []),
    ])),
    dimensional_check_status: readDimensionalCheckStatus(
      record.dimensional_check_status,
      readString(record.unit ?? record.result_unit ?? setup?.result_unit) ? "not_run" : "not_applicable",
    ),
    result_value: readScalar(record.result_value ?? record.result),
    result_unit: readString(record.result_unit ?? record.unit ?? setup?.result_unit),
    result_text: resultText,
    provenance_refs: [
      ...readStringArray(record.provenance_refs),
      ...[meta.artifactId, readString(record.capability_key), readString(record.trace_id)].filter((entry): entry is string => Boolean(entry)),
    ],
    missing_bindings: readStringArray(record.missing_bindings),
    blockers: readStringArray(record.blockers),
    claim_boundary: readString(record.claim_boundary) ?? SCIENTIFIC_CALCULATOR_RECEIPT_CLAIM_BOUNDARY,
    created_at: readString(record.created_at) ?? now,
    updated_at: readString(record.updated_at) ?? now,
  };
}
