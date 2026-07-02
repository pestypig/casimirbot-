import type { LiveAnswerEnvironment } from "@shared/helix-live-answer-environment";

export type LiveEnvironmentTurnRelevance = {
  schema: "helix.live_environment_turn_relevance.v1";
  thread_id: string;
  turn_id?: string | null;
  prompt: string;
  relevant_environment_ids: string[];
  relevance:
    | "none"
    | "background_only"
    | "context_available"
    | "answer_from_environment"
    | "explicit_environment_question";
  reason: string;
  confidence: number;
  environment_context_allowed: boolean;
  artifact_synthesis_allowed: boolean;
};

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const has = (text: string, pattern: RegExp): boolean => pattern.test(text);

const environmentKeywords = (environment: LiveAnswerEnvironment): RegExp[] => {
  const preset = String(environment.preset ?? "").trim();
  const objective = String(environment.objective ?? "").toLowerCase();
  if (/\bprime\s+gaps?\b/.test(objective) || /\bgaps?\b.*\bprime\b/.test(objective)) {
    return [
      /\bprime\s+gaps?\b/,
      /\bgaps?\b/,
      /\bgap\s+trend\b/,
      /\blargest\s+gap\b/,
      /\bprevious\s+prime\b/,
      /\blive\s+output\b/,
      /\bprime\s+(?:stream|sequence|generator)\b/,
    ];
  }
  if (/\b(?:transcript|sentence|speaker|browser\s+tab|video)\b/.test(objective)) {
    return [
      /\btranscript\b/,
      /\bsentence\b/,
      /\bspeaker\b/,
      /\bvideo\b/,
      /\bwhat\s+did\s+(?:it|they|the\s+video|the\s+speaker)\s+(?:just\s+)?say\b/,
      /\blatest\s+summary\b/,
    ];
  }
  if (/\b(?:moral|stoic|philosophy|philosophical)\b/.test(objective)) {
    return [
      /\bzen\b/,
      /\bstoic(?:ism)?\b/,
      /\bphilosoph(?:y|ical)\b/,
      /\bcomparison\b/,
      /\bparallel\b/,
      /\breflection\b/,
    ];
  }
  if (preset === "calculator_prime_stream") {
    return [
      /\bprime(?:s| number| stream)?\b/,
      /\bcandidate\b/,
      /\bprime\s+count\b/,
      /\bgap\b/,
      /\bcalculator\b/,
    ];
  }
  if (preset === "calculator_equation_interpreter") {
    return [
      /\bequation\b/,
      /\bsolve(?:d|s)?\b/,
      /\bvalue\b/,
      /\bvariables?\b/,
      /\bresult\b/,
      /\binterpret(?:ation|ed)?\b/,
      /\bbig\s+picture\b/,
      /\bcalculator\b/,
    ];
  }
  if (preset === "physics_stability_tracker") {
    return [
      /\bphysics\b/,
      /\bsimulation\b/,
      /\bstability\b/,
      /\bstabil(?:e|ized|ise|ised|ity)\b/,
      /\bresidual\b/,
      /\btolerance\b/,
      /\banomaly\b/,
    ];
  }
  if (/\b(?:visual|screen|capture|frame|scene|file explorer|window)\b/.test(objective)) {
    return [
      /\bvisual\b/,
      /\bscreen\b/,
      /\bscene\b/,
      /\bframe\b/,
      /\bcapture\b/,
      /\blooking\s+at\b/,
      /\bwhat\s+(?:changed|is\s+different)\b/,
      /\bdifference\b/,
      /\blast\s+(?:scene|frame|visual|screen|capture)\b/,
      /\bcurrent\s+(?:scene|frame|visual|screen)\b/,
    ];
  }
  if (preset === "minecraft_run_monitor") {
    return [
      /\bminecraft\b/,
      /\bminehut\b/,
      /\bmine\s*hut\b/,
      /\bworld\b/,
      /\bgame\b/,
      /\bdanger\b/,
      /\brisk\b/,
      /\bhealth\b/,
    ];
  }
  return [
    /\blive\s+(?:answer\s+)?environment\b/,
    /\blive\s+card\b/,
    /\btracker\b/,
    /\bstream\b/,
  ];
};

const environmentPromptScore = (environment: LiveAnswerEnvironment, text: string): number => {
  let score = 0;
  const objective = String(environment.objective ?? "").toLowerCase();
  const lineText = environment.lines
    .map((line: LiveAnswerEnvironment["lines"][number]) => `${line.key} ${line.label}`)
    .join(" ")
    .toLowerCase();
  if (/\bprime\s+gaps?\b/.test(text) && /\bprime\s+gaps?\b/.test(objective)) score += 8;
  if (/\bgaps?\b/.test(text) && /\b(?:previous_prime|largest_gap|gap_trend)\b/.test(lineText)) score += 6;
  if (/\blive\s+output\b/.test(text) && /\blive\s+output\b/.test(objective)) score += 4;
  if (/\bprime\b/.test(text) && (environment.preset === "calculator_prime_stream" || /\bprime\b/.test(objective))) score += 2;
  if (/\bequation|result|variables?|interpret|big\s+picture\b/.test(text) && environment.preset === "calculator_equation_interpreter") score += 4;
  if (/\bvisual|screen|scene|frame|capture|looking\s+at|what\s+changed|difference|last\s+(?:scene|frame|visual|screen|capture)\b/.test(text) && /\b(?:visual|screen|capture|frame|scene|file explorer|window)\b/.test(objective)) score += 5;
  if (/\bstatus|current|latest|right\s+now|what\s+.*on\b/.test(text)) score += 1;
  return score;
};

const isGeneralConceptQuestion = (text: string): boolean =>
  /\b(?:what\s+is|what\s+are|explain|define|teach\s+me|how\s+does)\b/.test(text) &&
  !/\b(?:we|current|currently|latest|so\s+far|right\s+now|on\s+the\s+stream|live\s+card|environment|tracker|status|progress|changed|found|checked)\b/.test(text);

const hasCurrentStateCue = (text: string): boolean =>
  /\b(?:current|currently|right\s+now|latest|status|progress|changed|so\s+far|what\s+changed|difference|different|last\s+(?:scene|frame|visual|screen|capture)|where\s+are\s+we|are\s+we\s+on|what\s+.*\s+on|found|checked|count|next\s+check|live\s+card|environment|tracker|stream)\b/.test(text);

export function evaluateLiveEnvironmentTurnRelevance(args: {
  threadId: string;
  turnId?: string | null;
  prompt: string;
  environments: LiveAnswerEnvironment[];
}): LiveEnvironmentTurnRelevance {
  const prompt = args.prompt.trim();
  const text = normalize(prompt);
  const active = args.environments.filter((environment: LiveAnswerEnvironment) => environment.status === "active");
  if (!text || active.length === 0) {
    return {
      schema: "helix.live_environment_turn_relevance.v1",
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      prompt,
      relevant_environment_ids: [],
      relevance: "none",
      reason: active.length === 0 ? "no_active_live_environment" : "empty_prompt",
      confidence: 1,
      environment_context_allowed: false,
      artifact_synthesis_allowed: false,
    };
  }

  const explicitEnvironmentCue = /\b(?:live\s+(?:answer\s+)?environment|live\s+card|this\s+environment|this\s+stream|this\s+tracker)\b/.test(text);
  const matched = active.filter((environment: LiveAnswerEnvironment) =>
    environmentKeywords(environment).some((keyword: RegExp) => has(text, keyword)),
  );
  const scoredMatches = matched
    .map((environment: LiveAnswerEnvironment) => ({ environment, score: environmentPromptScore(environment, text) }))
    .sort((a: { environment: LiveAnswerEnvironment; score: number }, b: { environment: LiveAnswerEnvironment; score: number }) =>
      b.score - a.score || b.environment.updated_at.localeCompare(a.environment.updated_at),
    );
  const bestScore = scoredMatches[0]?.score ?? 0;
  const relevantMatches = bestScore > 0
    ? scoredMatches
        .filter((entry: { environment: LiveAnswerEnvironment; score: number }) => entry.score === bestScore)
        .map((entry: { environment: LiveAnswerEnvironment; score: number }) => entry.environment)
    : matched;

  if (relevantMatches.length === 0) {
    return {
      schema: "helix.live_environment_turn_relevance.v1",
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      prompt,
      relevant_environment_ids: [],
      relevance: "background_only",
      reason: "prompt_does_not_target_live_environment",
      confidence: 0.92,
      environment_context_allowed: false,
      artifact_synthesis_allowed: false,
    };
  }

  if (relevantMatches.length > 1 && /\b(?:what\s+changed|status|current|what\s+is\s+happening|what\s+now)\b/.test(text)) {
    return {
      schema: "helix.live_environment_turn_relevance.v1",
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      prompt,
      relevant_environment_ids: relevantMatches.map((environment: LiveAnswerEnvironment) => environment.environment_id),
      relevance: "context_available",
      reason: "multiple_matching_live_environments_need_clarification",
      confidence: 0.64,
      environment_context_allowed: true,
      artifact_synthesis_allowed: false,
    };
  }

  if (isGeneralConceptQuestion(text) && !explicitEnvironmentCue) {
    return {
      schema: "helix.live_environment_turn_relevance.v1",
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      prompt,
      relevant_environment_ids: relevantMatches.map((environment: LiveAnswerEnvironment) => environment.environment_id),
      relevance: "context_available",
      reason: "domain_keyword_used_as_general_concept_question",
      confidence: 0.78,
      environment_context_allowed: true,
      artifact_synthesis_allowed: false,
    };
  }

  const synthesize = explicitEnvironmentCue || hasCurrentStateCue(text);
  return {
    schema: "helix.live_environment_turn_relevance.v1",
    thread_id: args.threadId,
    turn_id: args.turnId ?? null,
    prompt,
    relevant_environment_ids: relevantMatches.map((environment: LiveAnswerEnvironment) => environment.environment_id),
    relevance: explicitEnvironmentCue
      ? "explicit_environment_question"
      : synthesize
        ? "answer_from_environment"
        : "context_available",
    reason: synthesize ? "prompt_targets_live_environment_state" : "prompt_mentions_live_environment_domain",
    confidence: synthesize ? 0.88 : 0.7,
    environment_context_allowed: true,
    artifact_synthesis_allowed: synthesize,
  };
}
