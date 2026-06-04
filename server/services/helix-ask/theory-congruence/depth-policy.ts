import type { HelixAskDepth } from "../../../../shared/helix-theory-congruence-trace";

export type TheoryDepthSelection = {
  depth: HelixAskDepth;
  reason: string;
  promptCue?: string;
};

export type SelectTheoryDepthInput = {
  prompt: string;
  explicitDepth?: HelixAskDepth | null;
  sourceTargetIntent?: {
    target_source?: string | null;
    target_kind?: string | null;
    precedence_reason?: string | null;
  } | null;
  routeCandidate?: string | null;
};

const AUDIT_CUES = [
  "validate",
  "benchmark",
  "regression",
  "adversarial",
  "fully review",
  "scan the repo",
  "find all",
  "are you sure",
  "prove coverage",
  "claim boundary",
  "forbidden claims",
] as const;

const CONGRUENCE_CUES = [
  "first principles",
  "theory graph",
  "badge graph",
  "calculator rows",
  "physics atlas",
  "traceable",
  "testable by calculation",
  "connect these theories",
  "scholarly ask",
  "paper source",
  "arxiv",
  "congruence trace",
] as const;

const SOURCE_GROUNDED_CUES = [
  "repo",
  "source",
  "badge",
  "tool",
  "what does this support",
  "what can it claim",
  "what cannot it claim",
  "can and cannot claim",
  "codebase",
  "implementation",
] as const;

const NEGATION_WINDOW = 42;

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findCue(prompt: string, cues: readonly string[]): string | null {
  const text = normalize(prompt);
  for (const cue of cues) {
    if (text.includes(cue)) return cue;
  }
  return null;
}

function isNegatedCue(prompt: string, cue: string): boolean {
  const text = normalize(prompt);
  const index = text.indexOf(cue);
  if (index < 0) return false;
  const before = text.slice(Math.max(0, index - NEGATION_WINDOW), index);
  return /\b(do not|don't|dont|not|never|no need to|without|avoid|skip|just|only)\b/i.test(before);
}

function nonNegatedCue(prompt: string, cues: readonly string[]): string | null {
  const cue = findCue(prompt, cues);
  if (!cue) return null;
  return isNegatedCue(prompt, cue) ? null : cue;
}

function explicitDepthFromPrompt(prompt: string): TheoryDepthSelection | null {
  const text = normalize(prompt);
  if (/\bonly answer directly\b|\bdirect answer only\b|\bjust answer directly\b/.test(text)) {
    return { depth: "direct", reason: "explicit_user_depth", promptCue: "direct answer" };
  }
  if (/\buse congruence trace\b|\btheory congruence trace\b|\bgive me a congruence trace\b/.test(text)) {
    return { depth: "congruence_trace", reason: "explicit_user_depth", promptCue: "congruence trace" };
  }
  if (/\baudit this deeply\b|\bdeep audit\b|\baudit_deep\b/.test(text)) {
    return { depth: "audit_deep", reason: "explicit_user_depth", promptCue: "audit_deep" };
  }
  if (/\bsource grounded\b|\bsource-grounded\b/.test(text)) {
    return { depth: "source_grounded", reason: "explicit_user_depth", promptCue: "source grounded" };
  }
  return null;
}

function sourceTargetRequiresGrounding(input: SelectTheoryDepthInput): boolean {
  const sourceTarget = input.sourceTargetIntent?.target_source ?? "";
  const targetKind = input.sourceTargetIntent?.target_kind ?? "";
  const route = input.routeCandidate ?? "";
  return /repo|code|docs|source|scholarly|calculator|theory|badge/i.test(`${sourceTarget} ${targetKind} ${route}`);
}

export function selectTheoryDepth(input: SelectTheoryDepthInput): TheoryDepthSelection {
  if (input.explicitDepth) {
    return { depth: input.explicitDepth, reason: "explicit_user_depth" };
  }
  const explicit = explicitDepthFromPrompt(input.prompt);
  if (explicit) return explicit;

  const auditCue = nonNegatedCue(input.prompt, AUDIT_CUES);
  if (auditCue) {
    return { depth: "audit_deep", reason: "audit_or_validation_prompt", promptCue: auditCue };
  }

  const normalizedPrompt = normalize(input.prompt);
  const claimScopeCue = normalizedPrompt.includes("can and cannot claim")
    ? "can and cannot claim"
    : nonNegatedCue(input.prompt, [
    "what can it claim",
    "what cannot it claim",
    "can and cannot claim",
  ]);
  if (claimScopeCue) {
    return {
      depth: "source_grounded",
      reason: "claim_scope_prompt_requires_source_grounding",
      promptCue: claimScopeCue,
    };
  }

  const congruenceCue = nonNegatedCue(input.prompt, CONGRUENCE_CUES);
  if (congruenceCue) {
    return {
      depth: "congruence_trace",
      reason: "first_principles_theory_trace_prompt",
      promptCue: congruenceCue,
    };
  }

  const sourceCue = nonNegatedCue(input.prompt, SOURCE_GROUNDED_CUES);
  if (sourceCue || sourceTargetRequiresGrounding(input)) {
    return {
      depth: "source_grounded",
      reason: sourceCue ? "repo_or_source_grounded_prompt" : "source_target_requires_grounding",
      promptCue: sourceCue ?? undefined,
    };
  }

  return { depth: "direct", reason: "general_answer_sufficient" };
}
