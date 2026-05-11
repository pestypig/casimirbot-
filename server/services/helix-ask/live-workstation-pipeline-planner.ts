import type { LiveAnswerLineDefinition } from "@shared/helix-live-answer-environment";
import type {
  LivePipelineSinkSpec,
  LivePipelineTransformSpec,
  LiveWorkstationPipelinePlan,
} from "@shared/helix-live-workstation-pipeline";

const answerLine = (
  key: string,
  label: string,
  update_policy: LiveAnswerLineDefinition["update_policy"] = "episode_based",
): LiveAnswerLineDefinition => ({
  key,
  label,
  update_policy,
  visibility: "answer_card",
  priority: "info",
});

const id = (prefix: string, suffix: string): string => `${prefix}:${suffix}`;

const transcriptNoteLines: LiveAnswerLineDefinition[] = [
  answerLine("latest_sentence", "Latest sentence", "episode_based"),
  answerLine("latest_summary", "Latest summary", "episode_based"),
  answerLine("note_status", "Note status", "windowed_summary"),
  answerLine("open_question", "Open question", "episode_based"),
  answerLine("last_write", "Last write", "episode_based"),
];

const zenLines: LiveAnswerLineDefinition[] = [
  answerLine("current_statement", "Current statement", "episode_based"),
  answerLine("zen_parallel", "Zen parallel", "model_reviewed"),
  answerLine("tension", "Tension / contradiction", "salience_only"),
  answerLine("practical_reflection", "Practical reflection", "model_reviewed"),
  answerLine("confidence", "Confidence", "model_reviewed"),
  answerLine("next_watch", "Next watch", "episode_based"),
];

const methodsLines: LiveAnswerLineDefinition[] = [
  answerLine("latest_sample", "Latest sample", "computation_tick"),
  answerLine("residual", "Residual", "computation_tick"),
  answerLine("stability_window", "Stability window", "windowed_summary"),
  answerLine("methods_note", "Methods note", "windowed_summary"),
  answerLine("anomaly", "Anomaly", "salience_only"),
  answerLine("next_check", "Next check", "episode_based"),
];

const claimLines: LiveAnswerLineDefinition[] = [
  answerLine("claim", "Claim", "episode_based"),
  answerLine("evidence", "Evidence", "episode_based"),
  answerLine("contradiction", "Contradiction", "salience_only"),
  answerLine("open_question", "Open question", "episode_based"),
  answerLine("confidence", "Confidence", "model_reviewed"),
];

const transform = (
  suffix: string,
  kind: LivePipelineTransformSpec["kind"],
  title: string,
  model_policy: LivePipelineTransformSpec["model_policy"] = "deterministic_only",
  params: Record<string, unknown> = {},
): LivePipelineTransformSpec => ({
  transform_id: id("transform", suffix),
  kind,
  title,
  input_ports: ["source_event"],
  output_ports: ["transform_result"],
  params,
  model_policy,
  output_role: "validation",
});

const sink = (
  suffix: string,
  kind: LivePipelineSinkSpec["kind"],
  title: string,
  target_id: string | null,
  write_policy: LivePipelineSinkSpec["write_policy"] = "append",
): LivePipelineSinkSpec => ({
  sink_id: id("sink", suffix),
  kind,
  title,
  target_id,
  params: {},
  write_policy,
  evidence_policy: "cite_source_events",
});

const hasAny = (text: string, patterns: RegExp[]): boolean => patterns.some((pattern) => pattern.test(text));

export function isLiveWorkstationPipelineIntent(prompt: string): boolean {
  const text = prompt.trim().toLowerCase();
  if (!text) return false;
  return hasAny(text, [
    /\blive\b[\s\S]*\b(?:pipeline|workflow)\b/,
    /\bsummar(?:ize|ise)\b[\s\S]*\b(?:sentence|transcript)\b[\s\S]*\bnote\b/,
    /\b(?:zen|stoic|philosophy|philosophical)\b[\s\S]*\b(?:compare|comparison|relate)\b/,
    /\b(?:compare|relate)\b[\s\S]*\b(?:zen|stoic|philosophy|philosophical)\b/,
    /\b(?:simulation|residual|physics)\b[\s\S]*\b(?:methods?\s+note|rolling\s+note|write\s+a\s+note)\b/,
    /\b(?:claim|evidence|contradiction)\b[\s\S]*\b(?:watch|extract|track)\b/,
  ]);
}

export function planLiveWorkstationPipeline(args: {
  prompt: string;
  threadId?: string | null;
  sourceIds?: string[] | null;
  environmentId?: string | null;
}): LiveWorkstationPipelinePlan {
  const text = args.prompt.trim();
  const normalized = text.toLowerCase();
  const sourceIds = (args.sourceIds ?? []).filter(Boolean);
  const hasSource = sourceIds.length > 0;
  const sourceRequirement =
    hasAny(normalized, [/\bsimulation|residual|physics\b/])
      ? "physics_simulation"
      : hasAny(normalized, [/\bbrowser|tab|video|transcript|speaker|sentence|zen|philosophy\b/])
        ? "browser_audio_transcript"
        : "manual_feed";

  if (hasAny(normalized, [/\bzen|stoic|philosophy|philosophical\b/])) {
    return {
      schema: "helix.live_workstation_pipeline_plan.v1",
      pipeline_recipe_id: "philosophy_compare",
      objective: text,
      source_requirements: [sourceRequirement],
      missing_bindings: hasSource ? [] : [sourceRequirement],
      line_schema: zenLines,
      transforms: [
        transform("sentence_summary", "sentence_summary", "Summarize transcript sentence"),
        transform("philosophy_compare", "philosophy_compare", "Compare window to philosophy", "model_on_window", {
          framework: hasAny(normalized, [/\bstoic|stoicism\b/]) ? "stoic" : "zen",
        }),
      ],
      sinks: [
        sink("live_environment", "live_answer_environment", "Update live comparison lines", args.environmentId ?? null),
        sink("debug", "debug_trace", "Keep debug trace", null, "append"),
      ],
      next_actions: hasSource
        ? [{ action: "create_pipeline", reason: "source_available" }]
        : [{ action: "request_live_source", reason: `missing_${sourceRequirement}` }],
    };
  }

  if (hasAny(normalized, [/\bsimulation|residual|physics\b/])) {
    return {
      schema: "helix.live_workstation_pipeline_plan.v1",
      pipeline_recipe_id: "methods_note_writer",
      objective: text,
      source_requirements: [sourceRequirement],
      missing_bindings: hasSource ? [] : [sourceRequirement],
      line_schema: methodsLines,
      transforms: [
        transform("rolling_summary", "rolling_summary", "Summarize sample window"),
        transform("methods_note_writer", "methods_note_writer", "Write compact methods note"),
      ],
      sinks: [
        sink("workstation_note", "workstation_note", "Append methods note chunk", "live-methods-note"),
        sink("live_environment", "live_answer_environment", "Update methods live lines", args.environmentId ?? null),
      ],
      next_actions: hasSource
        ? [{ action: "create_pipeline", reason: "source_available" }]
        : [{ action: "request_live_source", reason: `missing_${sourceRequirement}` }],
    };
  }

  if (hasAny(normalized, [/\bclaim|evidence|contradiction\b/])) {
    return {
      schema: "helix.live_workstation_pipeline_plan.v1",
      pipeline_recipe_id: "claim_evidence_extract",
      objective: text,
      source_requirements: [sourceRequirement],
      missing_bindings: hasSource ? [] : [sourceRequirement],
      line_schema: claimLines,
      transforms: [
        transform("claim_evidence_extract", "claim_evidence_extract", "Extract claim and evidence"),
        transform("contradiction_watch", "contradiction_watch", "Watch contradictions"),
      ],
      sinks: [sink("live_environment", "live_answer_environment", "Update claim tracker lines", args.environmentId ?? null)],
      next_actions: hasSource
        ? [{ action: "create_pipeline", reason: "source_available" }]
        : [{ action: "request_live_source", reason: `missing_${sourceRequirement}` }],
    };
  }

  return {
    schema: "helix.live_workstation_pipeline_plan.v1",
    pipeline_recipe_id: "transcript_sentence_note",
    objective: text,
    source_requirements: [sourceRequirement],
    missing_bindings: hasSource ? [] : [sourceRequirement],
    line_schema: transcriptNoteLines,
    transforms: [transform("sentence_summary", "sentence_summary", "Summarize transcript sentence")],
    sinks: [
      sink("workstation_note", "workstation_note", "Append sentence summary to note", "live-transcript-note"),
      sink("live_environment", "live_answer_environment", "Update transcript note lines", args.environmentId ?? null),
    ],
    next_actions: hasSource
      ? [{ action: "create_pipeline", reason: "source_available" }]
      : [{ action: "request_live_source", reason: `missing_${sourceRequirement}` }],
  };
}
