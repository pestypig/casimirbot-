export const HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA = "helix.calculator_setup_context.v1" as const;

export type HelixCalculatorSetupVariable = {
  symbol: string;
  value: string;
  unit?: string | null;
  meaning?: string | null;
};

export type HelixCalculatorSetupContext = {
  schema: typeof HELIX_CALCULATOR_SETUP_CONTEXT_SCHEMA;
  expression: string;
  display_latex: string;
  subgoal: string;
  domain: "photon_energy" | "kinetic_energy" | "wavelength" | "generic";
  equation?: string | null;
  variables?: HelixCalculatorSetupVariable[];
  result_unit?: string | null;
  interpretation_prompt?: string | null;
};
