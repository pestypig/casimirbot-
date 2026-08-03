import {
  buildHelixCompoundPromptContract,
  type HelixCompoundPromptContract,
} from "../prompt-interpretation";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter(
        (entry): entry is string =>
          typeof entry === "string" && entry.trim().length > 0,
      )
    : [];

const isCompoundContract = (
  value: unknown,
): value is HelixCompoundPromptContract =>
  readRecord(value)?.schema === "helix.compound_prompt_contract.v1";

export const resolveProviderCompoundPromptContract = (input: {
  payload: RecordLike;
  promptText: string;
}): HelixCompoundPromptContract | null => {
  if (isCompoundContract(input.payload.compound_prompt_contract)) {
    return input.payload.compound_prompt_contract;
  }
  const promptInterpretation = readRecord(input.payload.prompt_interpretation);
  if (isCompoundContract(promptInterpretation?.compound_contract)) {
    return promptInterpretation.compound_contract;
  }
  return buildHelixCompoundPromptContract(
    input.promptText,
    readStrings(promptInterpretation?.negative_constraints),
  );
};
