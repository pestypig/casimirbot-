import {
  HELIX_CONTEXT_ECONOMY_DECISION_SCHEMA,
  type HelixContextEconomyDecision,
} from "../../../shared/helix-context-economy";

export type PlanContextEconomyInput = {
  thread_id: string;
  source_ref: string;
  raw_char_count?: number;
  reusable_context_ref?: string | null;
};

function newId(prefix: string): string {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
}

export function planContextEconomy(input: PlanContextEconomyInput): HelixContextEconomyDecision {
  const hasReusableRef = Boolean(input.reusable_context_ref?.trim());
  const largeEnoughForRef = (input.raw_char_count ?? 0) > 1200;
  const strategy = hasReusableRef || largeEnoughForRef ? "use_reusable_ref" : "inline_compact";
  return {
    schema: HELIX_CONTEXT_ECONOMY_DECISION_SCHEMA,
    decision_id: newId("context-economy"),
    thread_id: input.thread_id,
    source_ref: input.source_ref,
    strategy,
    reusable_context_ref: input.reusable_context_ref ?? null,
    raw_content_included: false,
    reason:
      strategy === "use_reusable_ref"
        ? "Use a compact reusable reference instead of raw content in Ask context."
        : "Inline only compact derived context.",
    created_at: new Date().toISOString(),
  };
}
