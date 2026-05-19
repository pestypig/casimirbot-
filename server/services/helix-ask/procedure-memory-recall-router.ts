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

export const matchProcedureRecallPrompt = (
  promptText: string,
): ProcedureMemoryRecallPromptRule | null => {
  const prompt = promptText.trim();
  return PROCEDURE_RECALL_PROMPT_RULES.find((rule) => rule.pattern.test(prompt)) ?? null;
};

export const procedureRecallTargetSource = (
  rule: ProcedureMemoryRecallPromptRule,
): HelixAskSourceTarget => rule.target_source;
