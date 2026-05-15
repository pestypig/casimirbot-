import crypto from "node:crypto";
import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import type { HelixLiveCardLineState } from "@shared/helix-live-card-line-state";
import {
  HELIX_PRESENT_STATE_SYNTHESIS_SCHEMA,
  type HelixPresentStateSynthesis,
  type HelixPresentStateSynthesisLine,
} from "@shared/helix-present-state-synthesis";
import { LIVE_COGNITION_TOOL_REGISTRY_VERSION } from "./live-cognition-tool-registry";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const avgConfidence = (states: HelixLiveCardLineState[], fallback: number | null = null): number | null => {
  const values = states.map((state) => state.confidence).filter((value): value is number => typeof value === "number");
  if (values.length === 0) return fallback;
  return Math.max(0, Math.min(1, values.reduce((sum, value) => sum + value, 0) / values.length));
};

const makeLine = (input: {
  key: string;
  label: string;
  value: string;
  states: HelixLiveCardLineState[];
  confidence?: number | null;
  missingEvidence?: string[];
  nextBestTool?: string | null;
  lastCheckResult?: HelixLiveCardLineState["last_check_result"];
  now: string;
}): HelixPresentStateSynthesisLine => ({
  key: input.key,
  label: input.label,
  value: input.value,
  confidence: input.confidence ?? avgConfidence(input.states),
  evidence_refs: uniqueStrings(input.states.flatMap((state) => state.evidence_refs)),
  missing_evidence: uniqueStrings(input.missingEvidence ?? input.states.flatMap((state) => state.missing_evidence)).slice(0, 4),
  next_best_tool: input.nextBestTool ?? input.states.find((state) => state.next_best_tool)?.next_best_tool ?? null,
  last_check_result: input.lastCheckResult ?? input.states.find((state) => state.last_check_result)?.last_check_result ?? null,
  updated_at: input.now,
  assistant_answer: false,
  role: "ui_projection",
});

export function synthesizePresentState(input: {
  threadId: string;
  roomId?: string | null;
  lineStates: HelixLiveCardLineState[];
  interpretedEvents?: HelixInterpretedEvent[];
  mode?: HelixPresentStateSynthesis["mode"];
  now?: string;
}): HelixPresentStateSynthesis {
  const now = input.now ?? new Date().toISOString();
  const interpreted = input.interpretedEvents ?? [];
  const allText = lower([
    ...input.lineStates.map((state) => `${state.label}: ${state.value}`),
    ...interpreted.slice(-8).map((event) => `${event.kind}: ${event.summary}`),
  ].join("\n"));
  const visualText = lower(interpreted.filter((event) => event.kind === "visual_observation" || event.kind === "visual_event_alignment").slice(-4).map((event) => event.summary).join("\n"));
  const eventText = lower(interpreted.slice(-12).map((event) => event.summary).join("\n"));

  const evidenceRefs = uniqueStrings([
    ...input.lineStates.flatMap((state) => state.evidence_refs),
    ...interpreted.slice(-8).flatMap((event) => event.evidence_refs),
  ]);
  const missing = uniqueStrings(input.lineStates.flatMap((state) => state.missing_evidence));
  const nextTool = input.lineStates.find((state) => state.next_best_tool)?.next_best_tool ?? "minecraft.query_event_window";
  const minecraftLike = /\b(?:minecraft|minehut|wheat|chicken|farm|slab|block|hostile|creeper|mine|trench|stair)\b/.test(allText);
  const hasFarmVisual = /\b(?:wheat|chicken|farm|crop|slab|boundary)\b/.test(visualText);
  const hasThreat = /\b(?:threat|hostile|creeper|danger|risk)\b/.test(allText);
  const hasDamage = /\b(?:damage|hit|explosion|hurt)\b/.test(eventText);
  const hasMining = /\b(?:mine|mineshaft|trench|stair|vertical|descending)\b/.test(allText);
  const hasEditing = /\b(?:block|slab|place|placed|break|broke|edit|decorat|boundary)\b/.test(allText);

  const place = hasFarmVisual
    ? "Wheat/chicken farm area."
    : minecraftLike
      ? "Farm/base area near recent Minecraft activity."
      : "Current live source context.";
  const activity = hasEditing
    ? (hasFarmVisual ? "Decorating or editing the farm boundary." : "Editing blocks while the live source tracks nearby context.")
    : minecraftLike
      ? "Monitoring current Minecraft activity for meaningful progress."
      : "Monitoring the active live environment.";
  const structure = hasMining
    ? "Farm/base context is separate from side trench or mineshaft evidence."
    : hasFarmVisual
      ? "Farm complex; automation and vertical relation are not fully proven."
      : "No stable structure purpose has been confirmed yet.";
  const entities = /\bchicken\b/.test(allText)
    ? "Contained chicken cluster or chicken-related evidence nearby."
    : /\b(?:entity|mob|hostile|creeper|zombie)\b/.test(allText)
      ? "Entity context is present; exact role still needs confirmation."
      : "No strong entity pattern is confirmed.";
  const risk = hasThreat
    ? `Nearby hostile context${hasDamage ? " with damage/escalation evidence." : ", no damage event in the current compact window."}`
    : "No immediate risk is confirmed in the current compact window.";

  const relevantStates = input.lineStates.length > 0 ? input.lineStates : [];
  const lines: HelixPresentStateSynthesisLine[] = [
    makeLine({ key: "place", label: "Place", value: place, states: relevantStates, confidence: hasFarmVisual ? 0.72 : avgConfidence(relevantStates, 0.45), now }),
    makeLine({ key: "activity", label: "Activity", value: activity, states: relevantStates, confidence: hasEditing ? 0.68 : avgConfidence(relevantStates, 0.42), now }),
    makeLine({ key: "structure", label: "Structure", value: structure, states: relevantStates, confidence: hasMining || hasFarmVisual ? 0.62 : 0.38, now }),
    makeLine({ key: "entities", label: "Entities", value: entities, states: relevantStates, confidence: /\b(?:chicken|entity|mob|hostile|creeper|zombie)\b/.test(allText) ? 0.64 : 0.35, now }),
    makeLine({ key: "risk", label: "Risk", value: risk, states: relevantStates, confidence: hasThreat ? 0.7 : 0.45, now }),
    makeLine({
      key: "missing_evidence",
      label: "Missing evidence",
      value: missing.length > 0
        ? missing.slice(0, 2).join("; ")
        : "No major missing evidence is currently flagged.",
      states: relevantStates,
      confidence: null,
      missingEvidence: missing,
      nextBestTool: nextTool,
      now,
    }),
    makeLine({
      key: "next_check",
      label: "Next check",
      value: hasFarmVisual
        ? "Align latest visual frame with recent slab/block/entity events."
        : "Run event-window and visual-alignment checks before raising confidence.",
      states: relevantStates,
      confidence: null,
      nextBestTool: hasFarmVisual ? "visual.align_latest_with_event_window" : nextTool,
      now,
    }),
  ];

  const summary = `Present state synthesized as ${lines.find((line) => line.key === "place")?.value ?? "current context"} ${lines.find((line) => line.key === "activity")?.value ?? ""}`.trim();

  return {
    schema: HELIX_PRESENT_STATE_SYNTHESIS_SCHEMA,
    synthesis_id: `present_state_synthesis:${hashShort([input.threadId, input.roomId ?? null, lines.map((line) => [line.key, line.value]), evidenceRefs])}`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    mode: input.mode ?? "deterministic_rewrite",
    summary,
    lines,
    evidence_refs: evidenceRefs,
    confidence_change_sources: uniqueStrings([
      ...input.lineStates.flatMap((state) => state.last_check_refs),
      ...interpreted.filter((event) => event.kind === "user_steering" || event.kind === "visual_event_alignment" || event.kind === "line_tool_evaluation").map((event) => event.event_id),
    ]),
    live_cognition_tool_registry_version: LIVE_COGNITION_TOOL_REGISTRY_VERSION,
    model_invoked: input.mode === "model_reviewed",
    deterministic: input.mode !== "model_reviewed",
    assistant_answer: false,
    role: "ui_projection",
    created_at: now,
  };
}
