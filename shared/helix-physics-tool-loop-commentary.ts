import {
  HELIX_ASK_PUBLIC_COMMENTARY_EVENT_SCHEMA,
  type HelixAgentCommentaryCertaintyClass,
  type HelixAskPublicCommentaryStatus,
  type HelixAskPublicCommentaryTiming,
} from "./helix-agent-commentary";

export const HELIX_PHYSICS_TOOL_LOOP_COMMENTARY_EVENT_SCHEMA =
  "helix.physics_tool_loop_commentary_event.v1" as const;

export type HelixPhysicsToolLoopCommentaryKind =
  | "intent"
  | "locator"
  | "loadout_built"
  | "calculator_loaded"
  | "calculator_solved"
  | "runtime_completed"
  | "claim_boundary"
  | "final_ready"
  | "fail_closed";

export type HelixPhysicsToolLoopCommentaryEventV1 = {
  schema: typeof HELIX_PHYSICS_TOOL_LOOP_COMMENTARY_EVENT_SCHEMA;
  publicCommentarySchema: typeof HELIX_ASK_PUBLIC_COMMENTARY_EVENT_SCHEMA;
  eventId: string;
  turnId: string;
  traceId: string;
  planId: string;
  kind: HelixPhysicsToolLoopCommentaryKind;
  timing: HelixAskPublicCommentaryTiming;
  status: HelixAskPublicCommentaryStatus;
  text: string;
  panelId?: string;
  actionId?: string;
  expectedArtifactKind?: string;
  observedArtifactKind?: string;
  badgeIds: string[];
  atlasBlockIds: string[];
  evidenceRefs: string[];
  certaintyClass: HelixAgentCommentaryCertaintyClass;
  assistantAnswer: false;
  rawReasoningIncluded: false;
};

function newId(prefix: string): string {
  return `${prefix}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

export function buildPhysicsToolLoopCommentaryEvent(input: {
  eventId?: string;
  turnId?: string | null;
  traceId?: string | null;
  planId: string;
  kind: HelixPhysicsToolLoopCommentaryKind;
  timing: HelixAskPublicCommentaryTiming;
  status: HelixAskPublicCommentaryStatus;
  text: string;
  panelId?: string;
  actionId?: string;
  expectedArtifactKind?: string;
  observedArtifactKind?: string;
  badgeIds?: string[];
  atlasBlockIds?: string[];
  evidenceRefs?: string[];
  certaintyClass?: HelixAgentCommentaryCertaintyClass;
}): HelixPhysicsToolLoopCommentaryEventV1 {
  return {
    schema: HELIX_PHYSICS_TOOL_LOOP_COMMENTARY_EVENT_SCHEMA,
    publicCommentarySchema: HELIX_ASK_PUBLIC_COMMENTARY_EVENT_SCHEMA,
    eventId: input.eventId ?? newId("physics-tool-loop-commentary"),
    turnId: input.turnId?.trim() || "turn:pending",
    traceId: input.traceId?.trim() || `trace:${input.planId}`,
    planId: input.planId,
    kind: input.kind,
    timing: input.timing,
    status: input.status,
    text: input.text,
    panelId: input.panelId,
    actionId: input.actionId,
    expectedArtifactKind: input.expectedArtifactKind,
    observedArtifactKind: input.observedArtifactKind,
    badgeIds: Array.from(new Set(input.badgeIds ?? [])),
    atlasBlockIds: Array.from(new Set(input.atlasBlockIds ?? [])),
    evidenceRefs: Array.from(new Set(input.evidenceRefs ?? [])),
    certaintyClass: input.certaintyClass ?? "reasoned",
    assistantAnswer: false,
    rawReasoningIncluded: false,
  };
}

export function buildCommentaryForPlanStep(input: {
  planId: string;
  turnId?: string | null;
  traceId?: string | null;
  panelId?: string;
  actionId?: string;
  expectedArtifactKind?: string;
  badgeIds?: string[];
  atlasBlockIds?: string[];
}): HelixPhysicsToolLoopCommentaryEventV1 {
  return buildPhysicsToolLoopCommentaryEvent({
    planId: input.planId,
    turnId: input.turnId,
    traceId: input.traceId,
    kind: "intent",
    timing: "before_step",
    status: "using_tool",
    text: "I am running the next workstation step and will use its artifact as evidence.",
    panelId: input.panelId,
    actionId: input.actionId,
    expectedArtifactKind: input.expectedArtifactKind,
    badgeIds: input.badgeIds,
    atlasBlockIds: input.atlasBlockIds,
  });
}

export function buildCommentaryForToolReceipt(input: {
  planId: string;
  turnId?: string | null;
  traceId?: string | null;
  observedArtifactKind: string;
  evidenceRefs?: string[];
  badgeIds?: string[];
  atlasBlockIds?: string[];
}): HelixPhysicsToolLoopCommentaryEventV1 {
  const kind: HelixPhysicsToolLoopCommentaryKind =
    input.observedArtifactKind === "theory_badge_locator"
      ? "locator"
      : input.observedArtifactKind.includes("runtime")
        ? "runtime_completed"
        : input.observedArtifactKind.includes("solve")
          ? "calculator_solved"
          : "loadout_built";
  return buildPhysicsToolLoopCommentaryEvent({
    planId: input.planId,
    turnId: input.turnId,
    traceId: input.traceId,
    kind,
    timing: "after_step",
    status: "done",
    text: "The workstation returned an artifact for this step.",
    observedArtifactKind: input.observedArtifactKind,
    evidenceRefs: input.evidenceRefs,
    badgeIds: input.badgeIds,
    atlasBlockIds: input.atlasBlockIds,
    certaintyClass: "confirmed",
  });
}
