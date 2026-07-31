import type {
  HelixAskSourceTarget,
  HelixAskSourceTargetRequestedOutput,
} from "@shared/helix-ask-source-target-intent";
import type { HelixProcedureMemoryRecallMode } from "@shared/helix-procedure-memory-recall";

export type ProcedureMemoryRecallRoute =
  | "procedure_memory_recall"
  | "answer_distillation_expansion"
  | "procedure_epoch_replay";

export type ProcedureMemoryRecallPromptRule = {
  pattern: RegExp;
  target_source: "procedure_memory" | "situation_epoch";
  target_kind: "procedure_memory" | "situation_epoch";
  route: ProcedureMemoryRecallRoute;
  mode: HelixProcedureMemoryRecallMode;
  requested_outputs: HelixAskSourceTargetRequestedOutput[];
  cue: string;
};

export const PROCEDURE_RECALL_SUPPRESSED_ROUTES = [
  "process_graph_overview",
  "raw_logs",
  "generic_context_pack",
  "legacy_context_pack",
  "no_tool_direct",
  "model_only_concept",
] as const;

export const PROCEDURE_RECALL_PROMPT_RULES: ProcedureMemoryRecallPromptRule[] = [
  {
    pattern: /\bwhat\s+does\s+procedure\s+memory\s+(?:say|show|contain|record|remember)\b/i,
    target_source: "procedure_memory",
    target_kind: "procedure_memory",
    route: "procedure_memory_recall",
    mode: "brief_evidence",
    requested_outputs: [
      "field_evaluation_refs",
      "interpretation_refs",
      "procedure_epoch_replay",
      "terminal_contract",
    ],
    cue: "explicit_procedure_memory_recall",
  },
  {
    pattern: /\bshow\s+the\s+evidence\b/i,
    target_source: "procedure_memory",
    target_kind: "procedure_memory",
    route: "procedure_memory_recall",
    mode: "brief_evidence",
    requested_outputs: [
      "field_evaluation_refs",
      "interpretation_refs",
      "procedure_epoch_replay",
      "terminal_contract",
    ],
    cue: "show_the_evidence",
  },
  {
    pattern: /\bwhat\s+did\s+you\s+base\s+that\s+on\b/i,
    target_source: "procedure_memory",
    target_kind: "procedure_memory",
    route: "procedure_memory_recall",
    mode: "brief_evidence",
    requested_outputs: [
      "field_evaluation_refs",
      "interpretation_refs",
      "terminal_contract",
    ],
    cue: "what_did_you_base_that_on",
  },
  {
    pattern: /\bwhy\s+did\s+you\s+say\s+that\b/i,
    target_source: "procedure_memory",
    target_kind: "procedure_memory",
    route: "answer_distillation_expansion",
    mode: "expanded_trace",
    requested_outputs: [
      "field_evaluation_refs",
      "interpretation_refs",
      "route_trace",
      "terminal_contract",
    ],
    cue: "why_did_you_say_that",
  },
  {
    pattern: /\breplay\s+that\b/i,
    target_source: "procedure_memory",
    target_kind: "situation_epoch",
    route: "procedure_epoch_replay",
    mode: "epoch_replay",
    requested_outputs: [
      "procedure_epoch_replay",
      "field_evaluation_refs",
      "interpretation_refs",
      "current_visual_state",
      "terminal_contract",
    ],
    cue: "replay_that",
  },
  {
    pattern: /\bwhat\s+changed\s+in\s+the\s+last\s+situation\s+epoch\b/i,
    target_source: "procedure_memory",
    target_kind: "situation_epoch",
    route: "procedure_epoch_replay",
    mode: "epoch_replay",
    requested_outputs: [
      "procedure_epoch_replay",
      "field_evaluation_refs",
      "interpretation_refs",
      "current_visual_state",
      "terminal_contract",
    ],
    cue: "what_changed_in_last_situation_epoch",
  },
  {
    pattern: /\bwhat\s+changed\s+since\s+the\s+previous\s+visual\b/i,
    target_source: "procedure_memory",
    target_kind: "situation_epoch",
    route: "procedure_epoch_replay",
    mode: "epoch_replay",
    requested_outputs: [
      "procedure_epoch_replay",
      "field_evaluation_refs",
      "interpretation_refs",
      "current_visual_state",
      "terminal_contract",
    ],
    cue: "what_changed_since_previous_visual",
  },
];

export const isContextualProcedureRecallPrompt = (
  promptText: string,
): boolean => {
  const prompt = promptText.trim();
  const unquoted = prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  const procedureCue =
    /\b(?:show\s+the\s+evidence|what\s+did\s+you\s+base\s+that\s+on|why\s+did\s+you\s+say\s+that|replay\s+that|procedure\s+memory|what\s+changed|last\s+(?:scene|epoch|frame|visual|screen|capture)|previous\s+(?:scene|epoch|frame|visual|screen|capture))\b/i;
  return (
    procedureCue.test(prompt) &&
    (
      /\b(?:do\s+not|don't|dont|never|without|avoid)\b[\s\S]{0,180}/i.test(unquoted) ||
      /\b(?:later|next\s+time|in\s+the\s+future|not\s+now|not\s+yet|if\s+i\s+ask|if\s+the\s+user\s+asks)\b[\s\S]{0,180}/i.test(unquoted) ||
      /\b(?:earlier|previously|last\s+turn|yesterday|historically)\b[\s\S]{0,140}\b(?:asked|said|wrote|showed|used)\b/i.test(unquoted) ||
      /\b(?:screen|console|log|transcript|message|label|button)\b[\s\S]{0,100}\b(?:shows?|reads?|says?|contains?)\b/i.test(unquoted) ||
      (procedureCue.test(prompt) && !procedureCue.test(unquoted))
    )
  );
};

export const matchProcedureRecallPrompt = (
  promptText: string,
): ProcedureMemoryRecallPromptRule | null => {
  const prompt = promptText.trim();
  const unquoted = prompt.replace(/"[^"]*"|'[^']*'|`[^`]*`/g, " ");
  if (isContextualProcedureRecallPrompt(prompt)) return null;
  return PROCEDURE_RECALL_PROMPT_RULES.find((rule) => rule.pattern.test(unquoted)) ?? null;
};

export const procedureRecallTargetSource = (
  rule: ProcedureMemoryRecallPromptRule,
): HelixAskSourceTarget => rule.target_source;
