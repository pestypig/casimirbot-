import crypto from "node:crypto";
import {
  HELIX_LIVE_CARD_LINE_REASONING_SCHEMA,
  type HelixLiveCardLineReasoning,
  type HelixLiveCardLineReasoningModalityScope,
} from "@shared/helix-live-card-line-reasoning";
import type { LiveAnswerEnvironment, LiveAnswerLineDefinition } from "@shared/helix-live-answer-environment";
import type { HelixInterpretationCard } from "@shared/helix-interpretation-card";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import { selectLiveLineObservationContext } from "./live-line-observation-context-selector";
import { selectLiveLineTool } from "./live-line-tool-selector";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => typeof value === "string" && value.trim().length > 0)));

const latestVisualObservation = (observations: HelixObservationJournalEntry[]): HelixObservationJournalEntry | null =>
  [...observations].reverse().find((entry) => entry.modality === "visual_frame" && entry.role === "model_perception_observation") ??
  [...observations].reverse().find((entry) => entry.modality === "visual_frame") ??
  null;

const latestInterpretation = (cards: HelixInterpretationCard[]): HelixInterpretationCard | null =>
  [...cards].reverse().find((card) => !Number.isNaN(Date.parse(card.expires_at)) && Date.parse(card.expires_at) > Date.now()) ??
  cards.at(-1) ??
  null;

const inferGenericActivity = (summary: string, interpretation: string | null): string => {
  const text = lower(`${summary}\n${interpretation ?? ""}`);
  if (/\b(?:file explorer|folder|directory|files?|\.wav|\.asd|audio export)\b/.test(text)) {
    return "Likely browsing or organizing files in a folder or file explorer view.";
  }
  if (/\b(?:document|pdf|word|paper|page)\b/.test(text)) return "Likely viewing or reviewing a document.";
  if (/\b(?:browser|tab|website|web page)\b/.test(text)) return "Likely browsing or inspecting a browser tab.";
  if (/\b(?:editor|code|terminal|ide)\b/.test(text)) return "Likely reviewing or editing workstation content.";
  return interpretation ?? "Likely inspecting the current screen; user intent is not stated.";
};

const inferObjects = (summary: string): string => {
  const text = lower(summary);
  const objects: string[] = [];
  if (/\bfile explorer\b/.test(text)) objects.push("file explorer window");
  if (/\bfolder\b/.test(text)) objects.push("folder view");
  if (/\b(?:\.wav|audio|sound)\b/.test(text)) objects.push("audio files");
  if (/\b\.asd\b/.test(text)) objects.push("Ableton analysis files");
  if (/\bdocument|pdf|page\b/.test(text)) objects.push("document content");
  if (/\bbrowser|tab\b/.test(text)) objects.push("browser tab");
  if (/\bbutton|menu|toolbar|control\b/.test(text)) objects.push("visible controls");
  if (objects.length > 0) return objects.join(", ");
  return "Visible UI elements and screen contents described by the latest visual observation.";
};

const missingFor = (scope: HelixLiveCardLineReasoningModalityScope, lineKey: string): string[] => {
  if (scope === "generic_visual") {
    if (lineKey === "uncertainty") return ["user intent is not stated", "no transcript or direct steering is attached"];
    return ["no audio/user steering corroboration"];
  }
  if (scope === "minecraft_visual") return ["world-event source is missing or not fresh"];
  return [];
};

export function reasonLiveCardLine(input: {
  thread_id: string;
  environment_id: string;
  line_key: string;
  line_label: string;
  objective_text: string;
  modality_scope: HelixLiveCardLineReasoningModalityScope;
  latest_observation_refs: string[];
  latest_interpretation_refs: string[];
  latest_goal_refs: string[];
  source_fidelity_refs: string[];
  user_steering_refs: string[];
  observations: HelixObservationJournalEntry[];
  interpretations: HelixInterpretationCard[];
  worldFresh?: boolean;
}): HelixLiveCardLineReasoning | null {
  const visual = latestVisualObservation(input.observations);
  const interpretation = latestInterpretation(input.interpretations);
  if (!visual && input.modality_scope === "generic_visual") return null;
  const lineKey = lower(input.line_key);
  const visualText = visual?.text ?? "";
  const interpretationText = interpretation?.summary ?? null;
  const evidenceRefs = uniqueStrings([
    visual?.observation_id,
    ...(visual?.evidence_refs ?? []),
    interpretation?.interpretation_id,
    ...(interpretation?.evidence_refs ?? []),
    ...input.latest_goal_refs.slice(-2),
  ]).slice(-12);
  let value: string;
  let confidence = visual ? 0.68 : 0.35;
  if (input.modality_scope === "generic_visual") {
    if (lineKey === "scene") value = visualText || "Waiting for the latest visual observation.";
    else if (lineKey === "activity") value = inferGenericActivity(visualText, interpretationText);
    else if (lineKey === "objects" || lineKey === "participants") value = inferObjects(visualText);
    else if (lineKey === "evidence") value = `Latest visual observation ${visual?.observation_id ?? "none"} supports this card.`;
    else if (lineKey === "uncertainty") {
      value = "User intent is unknown unless stated; no transcript or external source is attached for corroboration.";
      confidence = 0.5;
    } else if (lineKey === "next_check") {
      value = "Compare the next captured frame for selection, window, or content changes.";
      confidence = 0.55;
    } else if (lineKey === "last_update") {
      value = `Visual observation updated at ${visual?.created_at ?? new Date().toISOString()}.`;
      confidence = 0.7;
    } else value = interpretationText ?? visualText;
  } else if (input.modality_scope === "minecraft_visual") {
    if (lineKey === "risk") {
      const visibleRisk = /\b(?:creeper|zombie|skeleton|hostile|lava|damage|danger)\b/i.test(visualText);
      value = visibleRisk ? "Visual evidence may show nearby risk; world-event corroboration is missing." : "World-event risk source is missing; no current risk is confirmed from visual evidence alone.";
      confidence = visibleRisk ? 0.48 : 0.32;
    } else if (lineKey === "missing_evidence") {
      value = "World-event source is missing or not fresh; no event corroboration is attached.";
      confidence = 0.45;
    } else if (lineKey === "next_check") {
      value = "Capture the next frame or attach a fresh world-event source.";
      confidence = 0.45;
    } else value = visualText || "Minecraft screen visible; waiting for analyzed visual details.";
  } else {
    value = interpretationText ?? visualText ?? "Waiting for scoped source evidence.";
  }
  const nextTool = selectLiveLineTool({
    modalityScope: input.modality_scope,
    lineKey: input.line_key,
    lineLabel: input.line_label,
    value,
    worldFresh: input.worldFresh,
  });
  const missingEvidence = lineKey === "evidence" ? [] : missingFor(input.modality_scope, lineKey);
  return {
    schema: HELIX_LIVE_CARD_LINE_REASONING_SCHEMA,
    reasoning_id: `live_card_line_reasoning:${hashShort([input.environment_id, input.line_key, value, evidenceRefs])}`,
    thread_id: input.thread_id,
    environment_id: input.environment_id,
    line_key: input.line_key,
    value,
    confidence,
    evidence_refs: evidenceRefs,
    missing_evidence: missingEvidence,
    next_check: lineKey === "next_check" ? value : "Capture the next frame or compare recent observations.",
    next_best_tool: nextTool,
    model_invoked: visual?.model_invoked === true || interpretation?.model_invoked === true,
    deterministic: !(visual?.model_invoked === true || interpretation?.model_invoked === true),
    assistant_answer: false,
    raw_content_included: false,
    role: "ui_projection",
  };
}

export function reasonLiveCardLinesForEnvironment(input: {
  environment: LiveAnswerEnvironment;
  lineSchema?: LiveAnswerLineDefinition[] | null;
}) {
  const context = selectLiveLineObservationContext({ environment: input.environment });
  const schema = input.lineSchema ?? input.environment.line_schema;
  const reasonings = schema
    .map((line) => reasonLiveCardLine({
      thread_id: context.thread_id,
      environment_id: context.environment_id,
      line_key: line.key,
      line_label: line.label,
      objective_text: context.objective_text,
      modality_scope: context.modality_scope,
      latest_observation_refs: context.latest_observation_refs,
      latest_interpretation_refs: context.latest_interpretation_refs,
      latest_goal_refs: context.latest_goal_refs,
      source_fidelity_refs: context.source_fidelity_refs,
      user_steering_refs: context.user_steering_refs,
      observations: context.observations,
      interpretations: context.interpretations,
      worldFresh: context.has_fresh_world,
    }))
    .filter((entry): entry is HelixLiveCardLineReasoning => Boolean(entry));
  return {
    context,
    reasonings,
    line_values: Object.fromEntries(reasonings.map((entry) => [
      entry.line_key,
      {
        value: entry.value,
        confidence: entry.confidence,
        evidence_refs: entry.evidence_refs,
        source_event_ids: [],
        source: entry.model_invoked ? "model_review" as const : "deterministic_reducer" as const,
        model_invoked: entry.model_invoked,
        deterministic: entry.deterministic,
      },
    ])),
    assistant_answer: false as const,
    raw_content_included: false as const,
  };
}
