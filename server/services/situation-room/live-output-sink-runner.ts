import {
  HELIX_LIVE_OUTPUT_SINK_RECEIPT_SCHEMA,
  type LiveOutputSinkReceipt,
} from "@shared/helix-live-output-sink";
import type { LiveTransformResult } from "@shared/helix-live-transform";
import type {
  LivePipelineSinkSpec,
  LiveWorkstationPipeline,
} from "@shared/helix-live-workstation-pipeline";
import { updateLiveAnswerEnvironment } from "./live-answer-environment-store";

const compact = (value: string): string => value.replace(/\s+/g, " ").trim().slice(0, 500);

function runSinkSpec(args: {
  pipeline: LiveWorkstationPipeline;
  sink: LivePipelineSinkSpec;
  result: LiveTransformResult;
  now: string;
}): LiveOutputSinkReceipt {
  const base = {
    schema: HELIX_LIVE_OUTPUT_SINK_RECEIPT_SCHEMA,
    sink_id: args.sink.sink_id,
    pipeline_id: args.pipeline.pipeline_id,
    kind: args.sink.kind,
    target_id: args.sink.target_id ?? null,
    source_event_ids: args.result.source_event_ids,
    evidence_refs: args.result.evidence_refs,
    ts: args.now,
  } as const;

  if (args.sink.kind === "live_answer_environment") {
    const environmentId = args.sink.target_id ?? args.pipeline.environment_id ?? null;
    if (!environmentId || !args.result.lines) {
      return {
        ...base,
        ok: true,
        action: "skipped",
        written_chars: 0,
        error: environmentId ? "no_lines_to_write" : "missing_environment_id",
      };
    }
    const lineValues: Parameters<typeof updateLiveAnswerEnvironment>[0]["line_values"] = {};
    for (const [key, value] of Object.entries(args.result.lines)) {
      lineValues[key] = {
        value: compact(value),
        confidence: args.result.confidence ?? null,
        evidence_refs: args.result.evidence_refs,
        source_event_ids: args.result.source_event_ids,
        source: args.result.model_invoked ? "model_review" : "deterministic_reducer",
        model_invoked: args.result.model_invoked,
        deterministic: args.result.deterministic,
      };
    }
    updateLiveAnswerEnvironment({
      environment_id: environmentId,
      reason: args.result.model_invoked ? "model_review" : "source_event",
      line_values: lineValues,
      latest_summary: compact(args.result.text),
      evidence_refs: args.result.evidence_refs,
      window_id: args.result.window_id ?? null,
      now: args.now,
    });
    return {
      ...base,
      ok: true,
      action: "replace_section",
      written_chars: JSON.stringify(args.result.lines).length,
      error: null,
    };
  }

  if (args.sink.kind === "workstation_note") {
    return {
      ...base,
      ok: true,
      action: "append",
      written_chars: args.result.text.length,
      error: null,
    };
  }

  return {
    ...base,
    ok: true,
    action: args.sink.kind === "debug_trace" ? "append" : "skipped",
    written_chars: args.sink.kind === "debug_trace" ? args.result.text.length : 0,
    error: null,
  };
}

export function runLiveOutputSinks(args: {
  pipeline: LiveWorkstationPipeline;
  results: LiveTransformResult[];
  now?: string;
}): LiveOutputSinkReceipt[] {
  const now = args.now ?? new Date().toISOString();
  const receipts: LiveOutputSinkReceipt[] = [];
  for (const result of args.results) {
    for (const sink of args.pipeline.sinks) {
      receipts.push(runSinkSpec({ pipeline: args.pipeline, sink, result, now }));
    }
  }
  return receipts;
}
