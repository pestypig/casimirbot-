import { WORKSPACE_ACTION_REGISTRY } from "@shared/workstation-dynamic-tools";

export type HelixAskCompositeSubgoalKind =
  | "workspace_action"
  | "doc_open_best"
  | "doc_evidence_location"
  | "doc_equation_location"
  | "doc_evidence_synthesis"
  | "note_mutation"
  | "doc_vs_note_compare"
  | "model_only_concept";

export type HelixAskCompositeSubgoal = {
  subgoal_id: string;
  kind: HelixAskCompositeSubgoalKind;
  natural_language_goal: string;
  prompt_span?: [number, number];
  required_terminal_kinds: string[];
  status: "pending" | "running" | "completed" | "failed" | "blocked";
  terminal_artifact_id?: string;
  terminal_artifact_kind?: string;
  terminal_error_code?: string;
  dependencies?: string[];
  action_key?: string;
  target_id?: string;
  action_id?: string;
};

export const normalizeAskTurnCompositeText = (value: string): string =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const findAskTurnCompositePromptSpan = (prompt: string, phrase: string): [number, number] | undefined => {
  const lowerPrompt = prompt.toLowerCase();
  const lowerPhrase = phrase.toLowerCase();
  const index = lowerPrompt.indexOf(lowerPhrase);
  return index >= 0 ? [index, index + phrase.length] : undefined;
};

export const detectAskTurnCompositeSubgoals = (args: {
  turnId: string;
  transcript: string;
}): HelixAskCompositeSubgoal[] => {
  const transcript = args.transcript.trim();
  const normalized = normalizeAskTurnCompositeText(transcript);
  if (!/\b(and|then|also)\b|[,;]/i.test(transcript)) return [];
  const subgoals: HelixAskCompositeSubgoal[] = [];
  const seen = new Set<string>();
  const addSubgoal = (subgoal: HelixAskCompositeSubgoal): void => {
    const key = `${subgoal.kind}:${subgoal.action_key ?? subgoal.natural_language_goal}`;
    if (seen.has(key)) return;
    seen.add(key);
    subgoals.push(subgoal);
  };

  for (const entry of WORKSPACE_ACTION_REGISTRY.filter((candidate) => candidate.enabled && candidate.terminal_receipt_required)) {
    const aliases = [entry.action_key.replace(".", " "), entry.label, ...entry.aliases];
    const matchedAlias = aliases.find((alias) => {
      const normalizedAlias = normalizeAskTurnCompositeText(alias);
      return normalizedAlias.length > 0 && normalized.includes(normalizedAlias);
    });
    if (!matchedAlias) continue;
    addSubgoal({
      subgoal_id: `sg${subgoals.length + 1}_${entry.action_key.replace(/[^a-z0-9]+/gi, "_")}`,
      kind: "workspace_action",
      natural_language_goal:
        entry.target_id === "docs-viewer" && entry.action_id === "open_directory"
          ? "Show the docs directory"
          : `Open panel: ${entry.label}`,
      prompt_span: findAskTurnCompositePromptSpan(transcript, matchedAlias),
      required_terminal_kinds: ["workspace_action_receipt"],
      status: "pending",
      action_key: entry.action_key,
      target_id: entry.target_id,
      action_id: entry.action_id,
    });
  }

  const docsDirectoryRequested = subgoals.some((subgoal) => subgoal.action_key === "docs-viewer.open_directory");
  const documentOpenIntent =
    !docsDirectoryRequested &&
    /\bopen\b[\s\S]{0,80}\b(?:best|matching|nhm2|alpha|0p7000|mission|time|comparison)\b[\s\S]{0,120}\b(?:doc|document|paper|report)\b/i.test(transcript);
  if (documentOpenIntent) {
    addSubgoal({
      subgoal_id: `sg${subgoals.length + 1}_doc_open_best`,
      kind: "doc_open_best",
      natural_language_goal: "Open the best matching document",
      required_terminal_kinds: ["doc_open_receipt"],
      status: "pending",
    });
  }

  const equationIntent = /\b(?:find|locate|show|get)\b[\s\S]{0,80}\bequation\b/i.test(transcript) || /\btau\s*=\s*alpha\s*T\b/i.test(transcript);
  if (equationIntent) {
    addSubgoal({
      subgoal_id: `sg${subgoals.length + 1}_doc_equation_location`,
      kind: "doc_equation_location",
      natural_language_goal: "Find equation evidence",
      required_terminal_kinds: ["doc_equation_location", "doc_calculator_evidence", "typed_failure"],
      status: "pending",
    });
  }

  return subgoals.length >= 2 ? subgoals : [];
};
