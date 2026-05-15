import crypto from "node:crypto";
import {
  HELIX_PRESENT_STATE_CARD_SCHEMA,
  type HelixPresentStateCard,
  type HelixPresentStateCardLine,
} from "@shared/helix-present-state-card";
import { getActiveLiveAnswerEnvironmentForThread } from "./live-answer-environment-store";
import { getActiveLiveSituationArtifactForThread } from "./live-situation-artifact-store";
import { appendInterpretedEvent, listInterpretedEvents } from "./interpreted-event-log-store";
import { listClarificationQuestions } from "./clarification-question-store";
import { listGameUtilityHypotheses } from "./minecraft-entity-utility-reducer";
import { buildLiveCardLineStates } from "./live-card-line-state-builder";
import { buildLiveEnvironmentFidelity } from "./live-environment-fidelity-builder";
import { synthesizePresentState } from "./present-state-synthesizer";
import { buildSituationSourceCapabilities } from "./situation-source-capability-store";
import { getVisualEvidenceHealth } from "./visual-evidence-health";
import { listVisualFrameEvidence } from "./visual-snapshot-store";
import { selectSourceScopedEvidence } from "./source-scoped-evidence-selector";
import {
  listLiveLineToolEvaluations,
  listLiveLineToolRequests,
} from "./live-line-tool-request-store";

const hashShort = (value: unknown, size = 16): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const line = (input: {
  key: string;
  label: string;
  value: string;
  evidenceRefs?: string[];
  confidence?: number | null;
  updatedAt: string;
}): HelixPresentStateCardLine => ({
  key: input.key,
  label: input.label,
  value: input.value,
  confidence: input.confidence ?? null,
  evidence_refs: input.evidenceRefs ?? [],
  updated_at: input.updatedAt,
});

const latestUtilityHypothesisLines = (input: {
  threadId: string;
  roomId?: string | null;
}): HelixPresentStateCardLine[] => {
  const latestHypothesis = listGameUtilityHypotheses(input.threadId)
    .filter((hypothesis) => !input.roomId || hypothesis.room_id === input.roomId)
    .at(-1);
  if (!latestHypothesis) return [];
  const utilityLabel = latestHypothesis.utility_label.replace(
    new RegExp(`^${latestHypothesis.status}\\s+`, "i"),
    "",
  );
  return [
    line({
      key: "hypothesis",
      label: "Hypothesis",
      value: `${latestHypothesis.status} ${utilityLabel}`,
      evidenceRefs: latestHypothesis.supporting_evidence_refs,
      confidence: latestHypothesis.confidence,
      updatedAt: latestHypothesis.ts,
    }),
    line({
      key: "missing_evidence",
      label: "Missing evidence",
      value: latestHypothesis.missing_evidence.length > 0
        ? latestHypothesis.missing_evidence.join("; ")
        : "No major missing evidence currently flagged.",
      evidenceRefs: latestHypothesis.supporting_evidence_refs,
      confidence: latestHypothesis.confidence,
      updatedAt: latestHypothesis.ts,
    }),
  ];
};

const recordPresentStateSynthesisEvent = (input: {
  synthesis: ReturnType<typeof synthesizePresentState>;
}): ReturnType<typeof appendInterpretedEvent> =>
  appendInterpretedEvent({
    event_id: `interpreted:${input.synthesis.synthesis_id}`,
    thread_id: input.synthesis.thread_id,
    room_id: input.synthesis.room_id ?? null,
    source_family: "live_environment",
    kind: "present_state_synthesis",
    title: "Present-state synthesis",
    summary: input.synthesis.summary,
    confidence: null,
    evidence_refs: input.synthesis.evidence_refs,
    related_artifact_ids: [input.synthesis.synthesis_id],
    model_invoked: input.synthesis.model_invoked,
    deterministic: input.synthesis.deterministic,
    created_at: input.synthesis.created_at,
  });

const sourceIsActive = (
  capabilities: ReturnType<typeof buildSituationSourceCapabilities>,
  modality: "world_event" | "visual_frame" | "audio_transcript",
): boolean => capabilities.some((entry) => entry.modality === modality && entry.status === "active");

const visualSeedLines = (input: {
  threadId: string;
  roomId?: string | null;
  environmentPreset?: string | null;
  environmentObjective?: string | null;
  updatedAt: string;
}): HelixPresentStateCardLine[] => {
  const health = getVisualEvidenceHealth({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    now: input.updatedAt,
  });
  const minecraftPreset = input.environmentPreset === "minecraft_run_monitor" ||
    /\bminecraft|minehut\b/i.test(input.environmentObjective ?? "");
  const sceneKey = minecraftPreset ? "place" : "scene";
  const sceneLabel = minecraftPreset ? "Place" : "Scene";
  if (health.status === "analysis_ready" && health.latest_evidence_id) {
    const evidence = listVisualFrameEvidence({ threadId: input.threadId, limit: 100 })
      .find((entry) => entry.evidence_id === health.latest_evidence_id);
    const evidenceRefs = [health.latest_evidence_id];
    const objectSummary = evidence?.detected_objects?.length
      ? evidence.detected_objects.slice(0, 6).join(", ")
      : "No distinct objects were extracted from the latest frame.";
    const relationSummary = evidence?.detected_scene_relations?.length
      ? evidence.detected_scene_relations.slice(0, 4).join("; ")
      : "No stable structure relation has been confirmed from the latest frame.";
    return [
      line({
        key: sceneKey,
        label: sceneLabel,
        value: evidence?.summary ?? health.latest_summary ?? "Latest frame has compact visual evidence.",
        evidenceRefs,
        confidence: 0.68,
        updatedAt: input.updatedAt,
      }),
      line({
        key: minecraftPreset ? "entities" : "objects",
        label: minecraftPreset ? "Entities" : "Objects",
        value: objectSummary,
        evidenceRefs,
        confidence: evidence?.detected_objects?.length ? 0.58 : 0.34,
        updatedAt: input.updatedAt,
      }),
      line({
        key: minecraftPreset ? "structure" : "evidence",
        label: minecraftPreset ? "Structure" : "Evidence",
        value: relationSummary,
        evidenceRefs,
        confidence: evidence?.detected_scene_relations?.length ? 0.56 : 0.34,
        updatedAt: input.updatedAt,
      }),
      ...(evidence?.uncertainty?.length
        ? [line({
            key: "missing_evidence",
            label: "Missing evidence",
            value: evidence.uncertainty.slice(0, 4).join("; "),
            evidenceRefs,
            confidence: null,
            updatedAt: input.updatedAt,
          })]
        : []),
    ];
  }
  if (health.status === "analysis_failed") {
    return [line({
      key: sceneKey,
      label: sceneLabel,
      value: "Waiting for image recognition; the latest frame was captured but not described.",
      evidenceRefs: health.latest_evidence_id ? [health.latest_evidence_id] : [],
      confidence: 0.2,
      updatedAt: input.updatedAt,
    })];
  }
  if (health.status === "waiting_for_first_frame" || health.status === "frame_captured") {
    return [line({
      key: sceneKey,
      label: sceneLabel,
      value: health.status === "waiting_for_first_frame"
        ? "Waiting for the first captured frame from the active visual source."
        : "Frame captured; waiting for image recognition.",
      evidenceRefs: health.latest_frame_id ? [health.latest_frame_id] : [],
      confidence: 0.25,
      updatedAt: input.updatedAt,
    })];
  }
  return [];
};

export function projectPresentStateCard(input: {
  threadId: string;
  roomId?: string | null;
}): HelixPresentStateCard {
  const artifact = getActiveLiveSituationArtifactForThread(input.threadId);
  const environment = getActiveLiveAnswerEnvironmentForThread(input.threadId);
  const projectedRoomId = input.roomId ?? artifact?.room_id ?? environment?.room_id ?? null;
  const interpretedEvents = listInterpretedEvents({
    threadId: input.threadId,
    roomId: projectedRoomId,
    limit: 20,
  });
  const latestEvent = interpretedEvents.at(-1) ?? null;
  const pendingQuestion = listClarificationQuestions({
    threadId: input.threadId,
    roomId: projectedRoomId,
    status: "pending",
  }).at(-1);
  const pendingRequestInput = pendingQuestion?.proposal?.request_input ?? null;
  const now = new Date().toISOString();
  const utilityLines = latestUtilityHypothesisLines({
    threadId: input.threadId,
    roomId: projectedRoomId,
  });
  const lineRequests = listLiveLineToolRequests({ threadId: input.threadId, limit: 120 });
  const lineEvaluations = listLiveLineToolEvaluations({ threadId: input.threadId, limit: 120 });
  const sourceCapabilities = buildSituationSourceCapabilities({
    threadId: input.threadId,
    roomId: projectedRoomId,
  });
  const scopedInterpretedEvents = selectSourceScopedEvidence({
    interpretedEvents,
    capabilities: sourceCapabilities,
  });
  if (environment && (!input.roomId || environment.room_id === input.roomId)) {
    const worldActive = sourceIsActive(sourceCapabilities, "world_event");
    const visualLines = visualSeedLines({
      threadId: environment.thread_id,
      roomId: environment.room_id ?? null,
      environmentPreset: environment.preset ?? null,
      environmentObjective: environment.objective,
      updatedAt: now,
    });
    const rawLines = [
      ...(worldActive ? utilityLines : []),
      ...visualLines,
      ...environment.lines
        .filter((entry) => entry.visibility === "answer_card")
        .map((entry) => line({
          key: entry.key,
          label: entry.label,
          value: String(entry.value ?? ""),
          evidenceRefs: entry.evidence_refs,
          confidence: typeof entry.confidence === "number" ? entry.confidence : null,
          updatedAt: entry.updated_at,
        })),
    ];
    const lineStates = buildLiveCardLineStates({
      lines: rawLines,
      requests: lineRequests,
      evaluations: lineEvaluations,
      sourceCapabilities,
      now,
    });
    const fidelityProfile = buildLiveEnvironmentFidelity({
      threadId: environment.thread_id,
      roomId: environment.room_id ?? null,
      lineStates,
      capabilities: sourceCapabilities,
      now,
    });
    const synthesis = synthesizePresentState({
      threadId: environment.thread_id,
      roomId: environment.room_id ?? null,
      lineStates,
      interpretedEvents: scopedInterpretedEvents,
      fidelityProfile,
      now,
    });
    const synthesisEvent = recordPresentStateSynthesisEvent({ synthesis });
    return {
      schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
      card_id: `present_state:${hashShort([environment.environment_id, environment.updated_at])}`,
      thread_id: environment.thread_id,
      room_id: environment.room_id ?? null,
      title: environment.objective,
      status: environment.status,
      lines: synthesis.lines,
      line_states: lineStates,
      present_state_synthesis: synthesis,
      fidelity_profile: fidelityProfile,
      pending_request_input: pendingRequestInput,
      last_interpreted_event_id: synthesisEvent.event_id ?? latestEvent?.event_id ?? null,
      go_to_log_target: synthesisEvent.event_id ?? latestEvent?.event_id ?? null,
      updated_at: synthesis.created_at,
    };
  }
  if (artifact && (!input.roomId || artifact.room_id === input.roomId)) {
    const worldActive = sourceIsActive(sourceCapabilities, "world_event");
    const visualLines = visualSeedLines({
      threadId: artifact.thread_id,
      roomId: artifact.room_id ?? null,
      environmentPreset: "minecraft_run_monitor",
      environmentObjective: artifact.objective ?? artifact.current_state_lines.goal,
      updatedAt: now,
    });
    const lines = artifact.current_state_lines;
    const rawLines = [
      ...visualLines,
      line({ key: "now", label: "Now", value: lines.now, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      ...(worldActive ? utilityLines : []),
      line({ key: "goal", label: "Goal", value: lines.goal, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      line({ key: "risk", label: "Risk", value: lines.risk, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      line({ key: "progress", label: "Progress", value: lines.progress, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      line({ key: "unknowns", label: "Unknowns", value: lines.unknowns, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
      line({ key: "next_check", label: "Next check", value: lines.last_decision, evidenceRefs: artifact.evidence_refs, updatedAt: artifact.updated_at }),
    ];
    const lineStates = buildLiveCardLineStates({
      lines: rawLines,
      requests: lineRequests,
      evaluations: lineEvaluations,
      sourceCapabilities,
      now,
    });
    const fidelityProfile = buildLiveEnvironmentFidelity({
      threadId: artifact.thread_id,
      roomId: artifact.room_id,
      lineStates,
      capabilities: sourceCapabilities,
      now,
    });
    const synthesis = synthesizePresentState({
      threadId: artifact.thread_id,
      roomId: artifact.room_id,
      lineStates,
      interpretedEvents: scopedInterpretedEvents,
      fidelityProfile,
      now,
    });
    const synthesisEvent = recordPresentStateSynthesisEvent({ synthesis });
    return {
      schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
      card_id: `present_state:${hashShort([artifact.artifact_id, artifact.updated_at])}`,
      thread_id: artifact.thread_id,
      room_id: artifact.room_id,
      title: "Minecraft Situation",
      status: artifact.status,
      lines: synthesis.lines,
      line_states: lineStates,
      present_state_synthesis: synthesis,
      fidelity_profile: fidelityProfile,
      pending_request_input: pendingRequestInput,
      last_interpreted_event_id: synthesisEvent.event_id ?? latestEvent?.event_id ?? null,
      go_to_log_target: synthesisEvent.event_id ?? latestEvent?.event_id ?? null,
      updated_at: synthesis.created_at,
    };
  }
  const fallbackRawLines = [
    ...utilityLines,
    line({
      key: "now",
      label: "Now",
      value: latestEvent?.summary ?? "No active interpreted situation is available.",
      evidenceRefs: latestEvent?.evidence_refs ?? [],
      confidence: latestEvent?.confidence ?? null,
      updatedAt: latestEvent?.created_at ?? now,
    }),
  ];
  const fallbackLineStates = buildLiveCardLineStates({
    lines: fallbackRawLines,
    requests: lineRequests,
    evaluations: lineEvaluations,
    sourceCapabilities,
    now,
  });
  const fallbackFidelity = buildLiveEnvironmentFidelity({
    threadId: input.threadId,
    roomId: input.roomId ?? null,
    lineStates: fallbackLineStates,
    capabilities: sourceCapabilities,
    now,
  });
  return {
    schema: HELIX_PRESENT_STATE_CARD_SCHEMA,
    card_id: `present_state:${hashShort([input.threadId, input.roomId ?? null, latestEvent?.event_id ?? "empty"])}`,
    thread_id: input.threadId,
    room_id: input.roomId ?? null,
    title: "Present State",
    status: "paused",
    lines: fallbackRawLines,
    line_states: fallbackLineStates,
    fidelity_profile: fallbackFidelity,
    pending_request_input: pendingRequestInput,
    last_interpreted_event_id: latestEvent?.event_id ?? null,
    go_to_log_target: latestEvent?.event_id ?? null,
    updated_at: latestEvent?.created_at ?? now,
  };
}
