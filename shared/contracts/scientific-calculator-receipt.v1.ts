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
