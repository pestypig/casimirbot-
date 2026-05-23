import type { HelixPhysicalDimension, HelixPhysicalUnitDefinition } from "./helix-physical-units";

export const HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA = "helix.calculator_setup_context.v1" as const;

export type HelixCalculatorSetupVariable = {
  symbol: string;
  value: string;
  unit?: string | null;
  meaning?: string | null;
  quantity?: string | null;
  dimension?: HelixPhysicalDimension | null;
  dimension_signature?: string | null;
};

export type HelixCalculatorSetupContext = {
  schema: typeof HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA;
  expression: string;
  display_latex: string;
  subgoal: string;
  domain: "photon_energy" | "kinetic_energy" | "wavelength" | "generic";
  equation?: string | null;
  variables?: HelixCalculatorSetupVariable[];
  quantity?: string | null;
  unit_system?: "SI" | "custom" | null;
  input_units?: Record<string, string>;
  result_unit?: string | null;
  result_quantity?: string | null;
  result_dimension?: HelixPhysicalDimension | null;
  result_dimension_signature?: string | null;
  assumptions?: string[];
  unit_options?: HelixPhysicalUnitDefinition[];
  interpretation_prompt?: string | null;
};
