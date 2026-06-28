export type HelixAskTurnContractPlannerMode = "llm" | "deterministic";

export type HelixAskTurnContractPlannerMetadata = {
  mode: HelixAskTurnContractPlannerMode;
  valid: boolean;
  source: string;
};

export const buildHelixAskTurnContractPlannerMetadata = (args: {
  mode: HelixAskTurnContractPlannerMode;
  valid: boolean;
  source: string;
}): HelixAskTurnContractPlannerMetadata => ({
  mode: args.mode,
  valid: args.valid,
  source: args.source,
});
