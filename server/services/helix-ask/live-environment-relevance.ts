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
  if (/\b(?:zen|stoic|philosophy|philosophical)\b/.test(objective)) {
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

const isGeneralConceptQuestion = (text: string): boolean =>
  /\b(?:what\s+is|what\s+are|explain|define|teach\s+me|how\s+does)\b/.test(text) &&
  !/\b(?:we|current|currently|latest|so\s+far|right\s+now|on\s+the\s+stream|live\s+card|environment|tracker|status|progress|changed|found|checked)\b/.test(text);

const hasCurrentStateCue = (text: string): boolean =>
  /\b(?:current|currently|right\s+now|latest|status|progress|changed|so\s+far|what\s+changed|where\s+are\s+we|are\s+we\s+on|what\s+.*\s+on|found|checked|count|next\s+check|live\s+card|environment|tracker|stream)\b/.test(text);

export function evaluateLiveEnvironmentTurnRelevance(args: {
  threadId: string;
  turnId?: string | null;
  prompt: string;
  environments: LiveAnswerEnvironment[];
}): LiveEnvironmentTurnRelevance {
  const prompt = args.prompt.trim();
  const text = normalize(prompt);
  const active = args.environments.filter((environment) => environment.status === "active");
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
  const matched = active.filter((environment) =>
    environmentKeywords(environment).some((keyword) => has(text, keyword)),
  );

  if (matched.length === 0) {
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

  if (matched.length > 1 && /\b(?:what\s+changed|status|current|what\s+is\s+happening|what\s+now)\b/.test(text)) {
    return {
      schema: "helix.live_environment_turn_relevance.v1",
      thread_id: args.threadId,
      turn_id: args.turnId ?? null,
      prompt,
      relevant_environment_ids: matched.map((environment) => environment.environment_id),
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
      relevant_environment_ids: matched.map((environment) => environment.environment_id),
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
    relevant_environment_ids: matched.map((environment) => environment.environment_id),
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
