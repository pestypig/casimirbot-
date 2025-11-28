export const PROMPT_SPEC_SCHEMA_VERSION = "prompt-spec/1.0";

export type PromptSpecMode =
  | "plan_and_execute"
  | "direct_answer"
  | "profile_update"
  | "eval"
  | "panel_control";

export type PromptSpecTargetApi =
  | "/api/agi/plan"
  | "/api/agi/eval/smoke"
  | "/api/agi/eval/replay"
  | "/api/essence/profile";

export interface PromptSpecCitation {
  source: "trace" | "memory" | "knowledge" | "profile";
  id: string;
  snippet?: string;
}

export interface PromptSpecBudgets {
  max_tokens_hint?: number;
  max_citations?: number;
  max_chars?: number;
}

export interface PromptSpec {
  schema_version: typeof PROMPT_SPEC_SCHEMA_VERSION;
  mode: PromptSpecMode;
  target_api: PromptSpecTargetApi;
  user_question: string;
  system_instructions?: string;
  citations?: PromptSpecCitation[];
  soft_goals?: string[];
  budgets?: PromptSpecBudgets;
}
