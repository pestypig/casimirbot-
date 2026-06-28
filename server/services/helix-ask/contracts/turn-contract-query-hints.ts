import { mergeHelixAskQueries } from "../query";
import { normalizeHelixAskTurnContractText } from "./turn-contract-text";

export const buildHelixAskTurnContractQueryHints = (args: {
  researchRequiredRepoInputs?: string[] | null;
  researchCanonicalPrecedencePaths?: string[] | null;
  plannerQueryHints?: string[] | null;
  objectiveQueryHints: string[];
  maxQueryHints: number;
}): string[] =>
  mergeHelixAskQueries(
    args.researchRequiredRepoInputs?.slice(0, 4) ?? [],
    args.researchCanonicalPrecedencePaths?.slice(0, 4) ?? [],
    args.plannerQueryHints
      ?.map((hint) => normalizeHelixAskTurnContractText(hint, 120))
      .filter(Boolean) ?? [],
    args.objectiveQueryHints,
    args.maxQueryHints,
  );
