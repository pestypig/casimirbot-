import crypto from "node:crypto";
import type { HelixInterpretedEvent } from "@shared/helix-interpreted-event-log";
import type { HelixLiveEnvironmentFidelity } from "@shared/helix-live-environment-fidelity";
import type { HelixLiveCardLineState } from "@shared/helix-live-card-line-state";
import {
  HELIX_PRESENT_STATE_SYNTHESIS_SCHEMA,
  type HelixPresentStateSynthesis,
  type HelixPresentStateSynthesisLine,
} from "@shared/helix-present-state-synthesis";
import { sanitizeMissingEvidence } from "./live-card-missing-evidence-sanitizer";
import { LIVE_COGNITION_TOOL_REGISTRY_VERSION } from "./live-cognition-tool-registry";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const hasVisualEvidenceRef = (state: HelixLiveCardLineState): boolean =>
  state.evidence_refs.some((ref) => /\b(?:visual_evidence|visual_frame|visual_alignment)\b/i.test(ref));

const hasWorldEvidenceRef = (state: HelixLiveCardLineState): boolean =>
  state.evidence_refs.some((ref) => /\b(?:minecraft|world_event|world-sense|journal|event:|source:minecraft-server)\b/i.test(ref));

const isPlaceholderValue = (value: unknown): boolean =>
  /\b(?:monitoring current|waiting for|no stable|no strong|not yet active|not confirmed|minecraft scene from the active visual source)\b/i
    .test(String(value ?? ""));

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
  missing_evidence: sanitizeMissingEvidence(uniqueStrings(input.missingEvidence ?? input.states.flatMap((state) => state.missing_evidence))).slice(0, 4),
  next_best_tool: input.nextBestTool ?? input.states.find((state) => state.next_best_tool)?.next_best_tool ?? null,
  last_check_result: input.lastCheckResult ?? input.states.find((state) => state.last_check_result)?.last_check_result ?? null,
  source_coverage: input.states.find((state) => state.source_coverage)?.source_coverage,
  updated_at: input.now,
  assistant_answer: false,
  role: "ui_projection",
});

export function synthesizePresentState(input: {
  threadId: string;
  roomId?: string | null;
  lineStates: HelixLiveCardLineState[];
  interpretedEvents?: HelixInterpretedEvent[];
  fidelityProfile?: HelixLiveEnvironmentFidelity | null;
  mode?: HelixPresentStateSynthesis["mode"];
  now?: string;
}): HelixPresentStateSynthesis {
  const now = input.now ?? new Date().toISOString();
  const interpreted = input.interpretedEvents ?? [];
  const visualText = lower(interpreted.filter((event) => event.kind === "visual_observation" || event.kind === "visual_event_alignment").slice(-4).map((event) => event.summary).join("\n"));
  const eventText = lower(interpreted.slice(-12).map((event) => event.summary).join("\n"));

  const evidenceRefs = uniqueStrings([
    ...input.lineStates.flatMap((state) => state.evidence_refs),
    ...interpreted.slice(-8).flatMap((event) => event.evidence_refs),
  ]);
  const missing = sanitizeMissingEvidence(uniqueStrings(input.lineStates.flatMap((state) => state.missing_evidence)));
  const nextTool = input.lineStates.find((state) => state.next_best_tool)?.next_best_tool ?? "minecraft.query_event_window";
  const activeModalities = input.fidelityProfile?.active_modalities ?? [];
  const missingModalities = input.fidelityProfile?.missing_modalities ?? [];
  const staleModalities = input.fidelityProfile?.stale_modalities ?? [];
  const hasWorldEvents = activeModalities.includes("world_event");
  const hasVisual = activeModalities.includes("visual_frame");
  const hasTranscript = activeModalities.includes("audio_transcript");
  const missingVisual = missingModalities.includes("visual_frame");
  const missingWorld = missingModalities.includes("world_event");
  const missingTranscript = missingModalities.includes("audio_transcript");
  const staleVisual = staleModalities.includes("visual_frame");
  const staleWorld = staleModalities.includes("world_event");
  const staleTranscript = staleModalities.includes("audio_transcript");
  const visualStates = input.lineStates.filter(hasVisualEvidenceRef);
  const worldStates = input.lineStates.filter(hasWorldEvidenceRef);
  const visualReadyText = lower([
    ...visualStates.map((state) => `${state.label}: ${state.value}`),
    visualText,
  ].join("\n"));
  const worldReadyText = lower([
    ...worldStates.map((state) => `${state.label}: ${state.value}`),
    hasWorldEvents && !staleWorld ? eventText : "",
  ].join("\n"));
  const visualFailure = /\b(?:no configured vision provider|vision provider|analysis failed|provider returned|waiting for image recognition)\b/.test(visualReadyText);
  const visualLineFor = (keys: string[]): HelixLiveCardLineState | null =>
    visualStates.find((state) => keys.includes(state.line_key) && !isPlaceholderValue(state.value)) ?? null;
  const placeSeed = visualLineFor(["scene", "place"])?.value ?? null;
  const activitySeed = visualLineFor(["activity"])?.value ?? null;
  const objectSeed = visualLineFor(["objects", "entities", "evidence"])?.value ?? null;
  const minecraftPreset = input.lineStates.some((state) => ["place", "structure", "entities", "risk"].includes(state.line_key));
  const minecraftLike = minecraftPreset || /\b(?:minecraft|minehut|wheat|chicken|farm|slab|block|mine|trench|stair)\b/.test(`${visualReadyText}\n${worldReadyText}`);
  const hasFarmVisual = /\b(?:wheat|chicken|farm|crop|slab|boundary)\b/.test(visualReadyText);
  const hasThreat = hasWorldEvents && !staleWorld && /\b(?:threat|hostile|creeper|danger|risk)\b/.test(worldReadyText);
  const hasDamage = hasWorldEvents && !staleWorld && /\b(?:damage|hit|explosion|hurt)\b/.test(worldReadyText);
  const hasMining = /\b(?:mine|mineshaft|trench|stair|vertical|descending)\b/.test(`${visualReadyText}\n${worldReadyText}`);
  const hasEditing = /\b(?:block|slab|place|placed|break|broke|edit|decorat|boundary)\b/.test(`${visualReadyText}\n${worldReadyText}`);
  const hasVisualObservation = /\bvisual|frame|screen|scene|image|window|tab\b/.test(visualText) || hasVisual;
  const genericVisualOnly = hasVisualObservation && !minecraftLike && !hasWorldEvents;

  const place = visualFailure
    ? "Waiting for image recognition; the latest frame was captured but not described."
    : placeSeed
      ? String(placeSeed)
    : hasFarmVisual
    ? "Wheat/chicken farm area."
    : minecraftLike
      ? (hasVisual ? "Minecraft visual source is active, but no analyzed scene evidence is ready." : "Minecraft monitoring is waiting for visual or world-event evidence.")
      : genericVisualOnly
        ? "Current visual scene."
        : "Current live source context.";
  const activity = visualFailure
    ? "Waiting for the vision provider before interpreting current activity."
    : activitySeed
      ? String(activitySeed)
    : hasEditing
    ? (hasFarmVisual ? "Decorating or editing the farm boundary." : "Editing blocks while the live source tracks nearby context.")
    : minecraftLike
      ? `Monitoring current Minecraft activity${hasWorldEvents ? " from world-event evidence" : ""}${hasTranscript ? " and transcript context" : ""}.`
      : genericVisualOnly
        ? "Monitoring the active visual source."
        : "Monitoring the active live environment.";
  const structure = hasMining
    ? "Farm/base context is separate from side trench or mineshaft evidence."
    : hasFarmVisual
      ? "Farm complex; automation and vertical relation are not fully proven."
      : genericVisualOnly
        ? "No stable scene structure is confirmed yet."
        : "No stable structure purpose has been confirmed yet.";
  const entities = objectSeed
    ? String(objectSeed)
    : /\bchicken\b/.test(`${visualReadyText}\n${worldReadyText}`)
    ? "Contained chicken cluster or chicken-related evidence nearby."
    : /\b(?:entity|mob|hostile|creeper|zombie)\b/.test(`${visualReadyText}\n${worldReadyText}`)
      ? "Entity context is present; exact role still needs confirmation."
      : "No strong entity pattern is confirmed.";
  const risk = hasThreat
    ? `Nearby hostile context${hasDamage ? " with damage/escalation evidence." : ", no damage event in the current compact window."}`
    : hasWorldEvents
      ? "No immediate risk is confirmed in the current world-event window."
      : "Risk is not confirmed; world-event source is missing or inactive.";

  const relevantStates = input.lineStates.length > 0 ? input.lineStates : [];
  const lines: HelixPresentStateSynthesisLine[] = [
    makeLine({ key: genericVisualOnly ? "scene" : "place", label: genericVisualOnly ? "Scene" : "Place", value: place, states: relevantStates, confidence: hasFarmVisual ? 0.72 : avgConfidence(relevantStates, 0.45), now }),
    makeLine({ key: "activity", label: "Activity", value: activity, states: relevantStates, confidence: hasEditing ? 0.68 : avgConfidence(relevantStates, 0.42), now }),
    makeLine({ key: genericVisualOnly ? "objects" : "structure", label: genericVisualOnly ? "Objects" : "Structure", value: genericVisualOnly ? "Visible objects are tracked from the latest frame evidence." : structure, states: relevantStates, confidence: hasMining || hasFarmVisual ? 0.62 : 0.38, now }),
    makeLine({ key: genericVisualOnly ? "evidence" : "entities", label: genericVisualOnly ? "Evidence" : "Entities", value: genericVisualOnly ? "Latest compact visual evidence supports the card; no raw image is in Ask context." : entities, states: relevantStates, confidence: /\b(?:chicken|entity|mob|hostile|creeper|zombie)\b/.test(`${visualReadyText}\n${worldReadyText}`) ? 0.64 : 0.35, now }),
    makeLine({ key: "risk", label: "Risk", value: risk, states: relevantStates, confidence: hasThreat ? 0.7 : 0.45, now }),
    makeLine({
      key: "missing_evidence",
      label: "Missing evidence",
      value: missing.length > 0
        ? missing.slice(0, 2).join("; ")
        : [
            missingVisual ? "Visual source is missing." : null,
            missingWorld ? "World-event source is missing." : null,
            missingTranscript ? "Transcript source is missing." : null,
            staleVisual ? "Visual source is stale." : null,
            staleWorld ? "World-event source is stale." : null,
            staleTranscript ? "Transcript source is stale." : null,
          ].filter(Boolean).join(" ") || "No major missing evidence is currently flagged.",
      states: relevantStates,
      confidence: null,
      missingEvidence: missing,
      nextBestTool: nextTool,
      now,
    }),
    makeLine({
      key: "next_check",
      label: "Next check",
      value: visualFailure
        ? "Analyze the latest frame after configuring or recovering the vision provider."
        : hasFarmVisual
        ? "Align latest visual frame with recent slab/block/entity events."
        : input.fidelityProfile?.next_actions.includes("grant_visual_capture_permission")
          ? "Grant visual capture, then align the latest frame with recent source events."
          : input.fidelityProfile?.next_actions.includes("attach_world_event_source")
            ? "Attach a world-event source or run an event-window check before raising confidence."
            : "Run event-window and visual-alignment checks before raising confidence.",
      states: relevantStates,
      confidence: null,
      nextBestTool: hasFarmVisual ? "visual.align_latest_with_event_window" : nextTool,
      now,
    }),
  ];

  const summary = `Present state synthesized as ${lines.find((line) => line.key === "place" || line.key === "scene")?.value ?? "current context"} ${lines.find((line) => line.key === "activity")?.value ?? ""}`.trim();

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
    fidelity_profile: input.fidelityProfile ?? null,
    live_cognition_tool_registry_version: LIVE_COGNITION_TOOL_REGISTRY_VERSION,
    model_invoked: input.mode === "model_reviewed",
    deterministic: input.mode !== "model_reviewed",
    assistant_answer: false,
    role: "ui_projection",
    created_at: now,
  };
}
