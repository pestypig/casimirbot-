export const HELIX_DERIVED_EQUATION_SCHEMA = "helix.derived_equation.v1" as const;

export type HelixDerivedEquation = {
  schema: typeof HELIX_DERIVED_EQUATION_SCHEMA;
  equation_id: string;
  thread_id: string;
  turn_id: string;
  derived_from_refs: string[];
  expression: string;
  expression_language: "plain_math" | "latex";
  purpose: "calculator_input" | "validation" | "explanation";
  assistant_answer: false;
  raw_content_included: false;
  created_at: string;
};
