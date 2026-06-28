import {
  readAskTurnArtifactPayloadRecord,
  readAskTurnArtifactSourcePath,
} from "./artifact-text";
import { readAskTurnString } from "./value-readers";

export type HelixAskCompositeSubgoalLike = {
  kind: string;
  natural_language_goal: string;
};

export type HelixAskCompositeArtifactLike = {
  artifact_id: string;
  kind: string;
  payload: unknown;
};

export type HelixAskCompositeSubgoalReferenceIntent = {
  required: boolean;
  reference_kind:
    | "that_result"
    | "the_failed_part"
    | "the_completed_part"
    | "the_equation_part"
    | "the_doc_part"
    | "the_panel_part"
    | "the_note_part"
    | "the_second_subgoal"
    | "all_subgoals";
  requested_action: "explain" | "append_to_note" | "retry" | "compare" | "summarize" | "open" | "inspect_debug";
  matched_phrases: string[];
  confidence: "high" | "medium" | "low";
};

export const findAskTurnCompositeTerminalArtifact = <TArtifact extends HelixAskCompositeArtifactLike>(
  artifacts: TArtifact[],
  kinds: string[],
): TArtifact | null => {
  for (let index = artifacts.length - 1; index >= 0; index -= 1) {
    if (kinds.includes(artifacts[index].kind)) return artifacts[index];
  }
  return null;
};

export const summarizeAskTurnCompositeArtifact = (
  artifact: HelixAskCompositeArtifactLike,
  fallback: string,
): string => {
  const payload = readAskTurnArtifactPayloadRecord(artifact);
  const message =
    readAskTurnString(payload?.message) ??
    readAskTurnString(payload?.answer_text) ??
    readAskTurnString(payload?.text) ??
    readAskTurnString(payload?.summary);
  if (message) return message;
  const sourcePath = readAskTurnArtifactSourcePath(payload);
  if (artifact.kind === "doc_open_receipt") return sourcePath ? `Opened document: ${sourcePath}` : "Opened document.";
  if (artifact.kind === "doc_equation_location" || artifact.kind === "doc_calculator_evidence") return "Located equation evidence.";
  return fallback;
};

export const buildAskTurnCompositeHandoffHints = (args: {
  subgoal: HelixAskCompositeSubgoalLike;
  status: "completed" | "failed" | "blocked" | "pending";
  terminalArtifactKind?: string;
}): { handoff_eligibility: string[]; cannot_handoff_reasons?: string[] } => {
  if (args.status === "failed") {
    return {
      handoff_eligibility: ["can_explain", "can_retry"],
      cannot_handoff_reasons: ["failed_subgoal"],
    };
  }
  if (args.status !== "completed") {
    return {
      handoff_eligibility: ["can_explain"],
      cannot_handoff_reasons: [`subgoal_${args.status}`],
    };
  }
  if (args.subgoal.kind === "workspace_action") {
    return {
      handoff_eligibility: ["can_explain", "can_open"],
      cannot_handoff_reasons: ["workspace_action_not_note_content"],
    };
  }
  if (args.subgoal.kind === "doc_open_best") {
    return {
      handoff_eligibility: ["can_explain", "can_open"],
      cannot_handoff_reasons: ["doc_open_receipt_not_evidence"],
    };
  }
  return {
    handoff_eligibility: ["can_explain", "can_append_to_note", "can_compare"],
  };
};

export const classifyAskTurnCompositeSubgoalReferenceIntent = (
  transcript: string,
): HelixAskCompositeSubgoalReferenceIntent => {
  const normalized = transcript.trim().toLowerCase();
  const matchedPhrases: string[] = [];
  const addPhrase = (phrase: string, pattern: RegExp): boolean => {
    if (!pattern.test(normalized)) return false;
    matchedPhrases.push(phrase);
    return true;
  };
  const wantsFailed =
    addPhrase("failed part", /\bfailed\s+(?:part|piece|subgoal|lookup)\b/) ||
    addPhrase("what failed", /\bwhat\s+failed\b/) ||
    addPhrase("failed equation", /\bfailed\b[\s\S]{0,80}\bequation\b/);
  const wantsEquation =
    addPhrase("equation part", /\bequation\s+(?:part|result|lookup|piece|subgoal)\b/) ||
    addPhrase("tau = alpha T", /\btau\s*=\s*alpha\s*t\b/);
  const wantsDoc =
    addPhrase("document opened", /\b(?:what\s+)?(?:doc|document|paper)\b[\s\S]{0,80}\b(?:open|opened|did you open)\b/) ||
    addPhrase("document you opened", /\b(?:doc|document|paper)\s+you\s+opened\b/);
  const wantsPanel = addPhrase("panel part", /\bpanel\s+(?:part|result|subgoal)\b/);
  const wantsSecond = addPhrase("second subgoal", /\bsecond\s+(?:subgoal|result|part)\b/);
  const wantsAll = addPhrase("all subgoals", /\b(?:all|completed)\s+(?:subgoals|parts|results)\b/);
  const wantsThat = addPhrase("that result", /\b(?:that|this|the)\s+(?:result|part|piece|thing)\b/);
  const requestedAction: HelixAskCompositeSubgoalReferenceIntent["requested_action"] =
    /\b(?:add|put|append|write|store)\b[\s\S]{0,80}\bnote\b/.test(normalized)
      ? "append_to_note"
      : /\bretry\b/.test(normalized)
        ? "retry"
        : /\bcompare\b/.test(normalized)
          ? "compare"
          : /\bdebug\b/.test(normalized)
            ? "inspect_debug"
            : /\b(?:open|reopen)\b/.test(normalized)
              ? "open"
              : /\bsummarize\b/.test(normalized)
                ? "summarize"
                : "explain";
  const referenceKind: HelixAskCompositeSubgoalReferenceIntent["reference_kind"] =
    wantsEquation
      ? "the_equation_part"
      : wantsFailed
        ? "the_failed_part"
        : wantsDoc
          ? "the_doc_part"
          : wantsPanel
            ? "the_panel_part"
            : wantsSecond
              ? "the_second_subgoal"
              : wantsAll
                ? "all_subgoals"
                : wantsThat
                  ? "that_result"
                  : "that_result";
  const required = matchedPhrases.length > 0 && /\b(?:result|part|piece|subgoal|failed|opened|that|this|retry|document|equation)\b/.test(normalized);
  return {
    required,
    reference_kind: referenceKind,
    requested_action: requestedAction,
    matched_phrases: matchedPhrases,
    confidence: wantsEquation || wantsFailed || wantsDoc || wantsSecond || wantsAll ? "high" : wantsThat ? "medium" : "low",
  };
};
