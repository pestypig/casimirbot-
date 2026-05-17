import crypto from "node:crypto";
import {
  HELIX_LIVE_CARD_LINE_PROJECTION_SCHEMA,
  type HelixLiveCardLineProjection,
  type HelixLiveCardLineProjectionLine,
  type HelixLiveCardLineProjectionSource,
} from "@shared/helix-live-card-line-projection";
import type { HelixLiveCardLineSourceCoverage } from "@shared/helix-live-card-line-state";
import type { HelixSituationSourceCapability } from "@shared/helix-situation-source-capability";
import type { LiveAnswerEnvironment, LiveAnswerLineDefinition } from "@shared/helix-live-answer-environment";
import { sanitizeMissingEvidence } from "./live-card-missing-evidence-sanitizer";
import { reasonLiveCardLinesForEnvironment } from "./live-card-line-reasoner";
import { listInterpretedEvents } from "./interpreted-event-log-store";
import { getVisualEvidenceHealth } from "./visual-evidence-health";
import { listVisualFrameEvidence } from "./visual-snapshot-store";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import {
  liveSchemaSelectionToLineDefinitions,
  selectLiveSchemaForEnvironment,
} from "./live-schema-selection-engine";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const GENERIC_FORBIDDEN_MISSING = [
  /no visual\/event pair was available to align/i,
  /\bblock_edit\b/i,
  /\bbucket_empty\b/i,
  /\bfluid_changed\b/i,
  /\bworld-event window\b/i,
];

const safeMissingEvidence = (values: unknown[], genericVisual: boolean): string[] => {
  const sanitized = sanitizeMissingEvidence(values);
  if (!genericVisual) return sanitized;
  const filtered = sanitized.filter((entry) => !GENERIC_FORBIDDEN_MISSING.some((pattern) => pattern.test(entry)));
  return filtered.length > 0
    ? filtered
    : ["No transcript or user steering is attached to confirm intent."];
};

const coverageStatus = (
  capabilities: HelixSituationSourceCapability[],
  modality: "world_event" | "visual_frame" | "audio_transcript" | "text_chat",
) => {
  const entries = capabilities.filter((entry) => entry.modality === modality);
  if (entries.some((entry) => entry.status === "active")) return "supported" as const;
  if (entries.some((entry) => entry.status === "stale")) return "stale" as const;
  return "missing" as const;
};

const sourceCoverageFor = (
  line: LiveAnswerLineDefinition,
  capabilities: HelixSituationSourceCapability[],
  genericVisual: boolean,
): HelixLiveCardLineSourceCoverage => {
  if (genericVisual) {
    return {
      visual_frame: coverageStatus(capabilities, "visual_frame"),
      world_event: "not_applicable",
      audio_transcript: line.key === "uncertainty" ? coverageStatus(capabilities, "audio_transcript") : "not_applicable",
      text_chat: "not_applicable",
    };
  }
  return {
    visual_frame: coverageStatus(capabilities, "visual_frame"),
    world_event: coverageStatus(capabilities, "world_event"),
    audio_transcript: coverageStatus(capabilities, "audio_transcript"),
    text_chat: coverageStatus(capabilities, "text_chat"),
  };
};

const fallbackValueFor = (line: LiveAnswerLineDefinition, genericVisual: boolean): string => {
  if (genericVisual) {
    if (line.key === "scene") return "Waiting for the latest visual observation.";
    if (line.key === "activity") return "Waiting for visual activity evidence.";
    if (line.key === "objects") return "Waiting for visible objects or UI elements.";
    if (line.key === "evidence") return "Waiting for source evidence.";
    if (line.key === "uncertainty") return "User intent is unknown without steering or transcript evidence.";
    if (line.key === "next_check") return "Capture or compare the next frame.";
    if (line.key === "last_update") return "Waiting for first visual update.";
  }
  return `Waiting for ${line.label.toLowerCase()} evidence.`;
};

const projectionSourceFor = (line: LiveAnswerLineDefinition, genericVisual: boolean): HelixLiveCardLineProjectionSource => {
  if (genericVisual && (line.key === "scene" || line.key === "objects")) return "visual_observation";
  if (genericVisual) return "line_reasoner";
  return "line_reasoner";
};

const latestAnalyzerVisualObservation = (input: {
  environment: LiveAnswerEnvironment;
  now: string;
}): { summary: string; evidence_refs: string[]; created_at: string } | null => {
  const health = getVisualEvidenceHealth({
    threadId: input.environment.thread_id,
    roomId: input.environment.room_id ?? null,
    now: input.now,
  });
  if (health.status === "analysis_ready" && health.latest_evidence_id) {
    const evidence = listVisualFrameEvidence({
      threadId: input.environment.thread_id,
      limit: 100,
    }).find((entry) => entry.evidence_id === health.latest_evidence_id);
    return {
      summary: evidence?.summary ?? health.latest_summary ?? "Latest visual frame has compact evidence.",
      evidence_refs: [health.latest_evidence_id],
      created_at: evidence?.ts ?? input.now,
    };
  }
  const interpreted = listInterpretedEvents({
    threadId: input.environment.thread_id,
    roomId: input.environment.room_id ?? null,
    limit: 60,
  }).reverse().find((event) =>
    event.source_family === "visual_snapshot" ||
    event.source_family === "live_source:visual_frame" ||
    event.kind === "visual_observation"
  );
  if (!interpreted) return null;
  return {
    summary: interpreted.summary,
    evidence_refs: uniqueStrings([interpreted.event_id, ...(interpreted.evidence_refs ?? [])]),
    created_at: interpreted.created_at,
  };
};

const visualFallbackValue = (input: {
  line: LiveAnswerLineDefinition;
  observation: { summary: string; evidence_refs: string[]; created_at: string } | null;
  genericVisual: boolean;
}): string | null => {
  if (!input.observation) return null;
  const summary = input.observation.summary;
  const text = summary.toLowerCase();
  if (input.genericVisual) {
    if (input.line.key === "scene") return summary;
    if (input.line.key === "activity") {
      if (/\b(?:file explorer|folder|directory|files?|\.wav|\.asd|audio|image files?)\b/.test(text)) {
        return "Likely browsing, reviewing, or organizing the visible workstation files.";
      }
      return "Likely inspecting the current workstation screen; user intent is not stated.";
    }
    if (input.line.key === "objects") return "Visible UI elements and screen contents from the latest visual observation.";
    if (input.line.key === "evidence") return `Latest visual observation ${input.observation.evidence_refs[0] ?? "none"} supports this card.`;
    if (input.line.key === "uncertainty") return "User intent is unknown without steering or transcript evidence.";
    if (input.line.key === "next_check") return "Compare the next captured frame for selection, window, or content changes.";
    if (input.line.key === "last_update") return `Visual observation updated at ${input.observation.created_at}.`;
    return summary;
  }
  if (input.line.key === "place") {
    if (/\bwheat\b/.test(text) && /\bchickens?\b/.test(text)) {
      return `Wheat/chicken farm visible: ${summary}`;
    }
    return summary;
  }
  if (input.line.key === "entities") return summary;
  if (input.line.key === "structure") return summary;
  if (input.line.key === "activity") return summary;
  if (input.line.key === "risk") return "World-event risk source is missing; no current risk is confirmed from visual evidence alone.";
  if (input.line.key === "missing_evidence") return "World-event source is missing or not fresh; no event corroboration is attached.";
  if (input.line.key === "next_check") return "Capture the next frame or attach a fresh world-event source.";
  return summary;
};

export function buildLiveCardLineProjection(input: {
  environment: LiveAnswerEnvironment;
  now?: string;
}): HelixLiveCardLineProjection {
  const now = input.now ?? new Date().toISOString();
  const schemaSelection = selectLiveSchemaForEnvironment({
    environment: input.environment,
  });
  const selectedSchema = liveSchemaSelectionToLineDefinitions(schemaSelection);
  const genericVisual = schemaSelection.preset_hint === "generic_visual";
  const capabilities = buildSituationSourceCapabilities({
    threadId: input.environment.thread_id,
    roomId: input.environment.room_id ?? null,
  });
  const reasoned = reasonLiveCardLinesForEnvironment({
    environment: input.environment,
    lineSchema: selectedSchema,
  });
  const reasoningsByKey = new Map(reasoned.reasonings.map((entry) => [entry.line_key, entry]));
  const analyzerVisualObservation = latestAnalyzerVisualObservation({
    environment: input.environment,
    now,
  });
  let staleFallbackUsed = false;
  const lines: HelixLiveCardLineProjectionLine[] = selectedSchema.map((line) => {
    const reasoning = reasoningsByKey.get(line.key) ?? null;
    const visualValue = visualFallbackValue({
      line,
      observation: analyzerVisualObservation,
      genericVisual,
    });
    const useReasoning = Boolean(reasoning && (reasoning.evidence_refs.length > 0 || !visualValue));
    const activeReasoning = useReasoning ? reasoning : null;
    if (!activeReasoning && !visualValue) staleFallbackUsed = true;
    const missing = safeMissingEvidence(activeReasoning?.missing_evidence ?? [], genericVisual);
    const nextTool = genericVisual && (activeReasoning?.next_best_tool === "minecraft.query_event_window" || activeReasoning?.next_best_tool === "visual.align_latest_with_event_window")
      ? line.key === "next_check" ? "visual.compare_recent_frames" : "live-cognition.synthesize_line_from_observations"
      : activeReasoning?.next_best_tool ?? null;
    return {
      key: line.key,
      label: line.label,
      value: activeReasoning?.value ?? visualValue ?? fallbackValueFor(line, genericVisual),
      confidence: typeof activeReasoning?.confidence === "number" ? activeReasoning.confidence : null,
      evidence_refs: uniqueStrings([
        ...(activeReasoning?.evidence_refs ?? []),
        ...(activeReasoning ? [] : analyzerVisualObservation?.evidence_refs ?? []),
      ]).slice(-12),
      missing_evidence: missing,
      next_best_tool: nextTool,
      last_check_result: null,
      source_coverage: sourceCoverageFor(line, capabilities, genericVisual),
      reasoner_id: activeReasoning?.reasoning_id ?? null,
      source: activeReasoning ? projectionSourceFor(line, genericVisual) : visualValue ? "visual_observation" : "fallback",
      assistant_answer: false,
      role: "ui_projection",
    };
  });
  return {
    schema: HELIX_LIVE_CARD_LINE_PROJECTION_SCHEMA,
    projection_id: `live_card_line_projection:${hashShort([
      input.environment.environment_id,
      schemaSelection.selection_id,
      lines.map((line) => [line.key, line.value, line.reasoner_id]),
    ])}`,
    thread_id: input.environment.thread_id,
    environment_id: input.environment.environment_id,
    schema_selection_id: schemaSelection.selection_id,
    lines,
    stale_fallback_used: staleFallbackUsed,
    assistant_answer: false,
    raw_content_included: false,
  };
}
