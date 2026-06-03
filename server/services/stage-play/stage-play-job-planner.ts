import {
  buildStagePlayJobPlanV1,
  type StagePlayJobPlanDomainV1,
  type StagePlayJobPlanNodeKindV1,
  type StagePlayJobPlanSourceRouteV1,
  type StagePlayJobPlanV1,
} from "@shared/contracts/stage-play-job-plan.v1";
import { listStagePlaySourceHandles } from "./stage-play-builder-compiler";

type StagePlayJobPlanSource = StagePlayJobPlanV1["requiredSources"][number];
type StagePlayJobPlanNode = StagePlayJobPlanV1["nodeChain"][number];
type StagePlayJobReadinessCheck = StagePlayJobPlanV1["readinessChecks"][number];

export type PlanStagePlayJobInput = {
  threadId: string;
  environmentId?: string | null;
  sourceId?: string | null;
  objective?: string | null;
};

const ACTIVE_SOURCE_STATUSES = new Set([
  "active",
  "active_interval",
  "running",
  "capturing",
  "available",
]);

const readObjective = (value: string | null | undefined): string =>
  value?.trim() ||
  "Plan a Stage Play job from admitted live sources and visible checkpoints.";

const normalize = (value: string): string => value.toLowerCase();

const inferDomain = (objective: string): StagePlayJobPlanDomainV1 => {
  const text = normalize(objective);
  if (/\b(?:minecraft|player|block|mob|creeper|zombie|route|portal|bridge|mine|chunk|biome)\b/.test(text)) {
    return "minecraft_world";
  }
  if (/\b(?:youtube|video|show|episode|scene|story|narrative|dialogue|subtitle|anime|movie|predict\s+what\s+happens\s+next|next\s+scene)\b/.test(text)) {
    return "narrative_media";
  }
  if (/\b(?:browser|tab|web\s*app|desktop|screen|workflow|task)\b/.test(text)) {
    return "browser_task";
  }
  return "custom";
};

const predictionPolicyForObjective = (objective: string): StagePlayJobPlanV1["predictionPolicy"] | undefined => {
  const text = normalize(objective);
  if (!/\b(?:predict|prediction|next|happens\s+next|forecast|anticipate)\b/.test(text)) return undefined;
  return {
    enabled: true,
    horizon: /\b(?:2\s*(?:to|-)\s*5|few|several)\s+(?:beats|steps|scenes)\b/.test(text)
      ? "next_2_to_5_beats"
      : "next_scene_beat",
    validateAgainstNextWindow: true,
  };
};

const sourceRequirementsForDomain = (domain: StagePlayJobPlanDomainV1): StagePlayJobPlanSource[] => {
  if (domain === "minecraft_world") {
    return [
      {
        modality: "world_event",
        label: "Minecraft world event source",
        required: true,
        recommendedCadenceMs: null,
        routeTo: "world_stage_play",
      },
      {
        modality: "environment_state",
        label: "Environment state snapshot source",
        required: true,
        recommendedCadenceMs: null,
        routeTo: "world_stage_play",
      },
      {
        modality: "visual_frame",
        label: "Optional visual grounding source",
        required: false,
        recommendedCadenceMs: 10_000,
        routeTo: "visual_context",
      },
    ];
  }
  if (domain === "browser_task") {
    return [
      {
        modality: "visual_frame",
        label: "Browser or screen visual source",
        required: true,
        recommendedCadenceMs: 10_000,
        routeTo: "visual_context",
      },
      {
        modality: "text_chat",
        label: "Optional task text or user steering source",
        required: false,
        recommendedCadenceMs: null,
        routeTo: "debug_only",
      },
    ];
  }
  return [
    {
      modality: "visual_frame",
      label: "Browser tab visual source",
      required: true,
      recommendedCadenceMs: 10_000,
      routeTo: "narrative_stage_play",
    },
    {
      modality: "audio_transcript",
      label: "Optional audio transcript source",
      required: false,
      recommendedCadenceMs: 10_000,
      routeTo: "narrative_stage_play",
    },
  ];
};

const node = (
  nodeId: string,
  nodeKind: StagePlayJobPlanNodeKindV1,
  label: string,
  requiredInputs: string[],
  expectedOutputs: string[],
): StagePlayJobPlanNode => ({
  nodeId,
  nodeKind,
  label,
  requiredInputs,
  expectedOutputs,
});

const nodeChainForDomain = (domain: StagePlayJobPlanDomainV1, predictionEnabled: boolean): StagePlayJobPlanNode[] => {
  if (domain === "minecraft_world") {
    return [
      node("observer.live_sources", "observer", "Observer: live source custody", [], ["selected world and state sources"]),
      node("source.world_event.active", "source", "World event source", ["observer.live_sources"], ["compact event refs"]),
      node("source.environment_state.active", "source", "Environment state source", ["observer.live_sources"], ["snapshot refs"]),
      node("compact_observation.latest_world", "compact_observation", "Latest compact world observation", ["source.world_event.active", "source.environment_state.active"], ["world facts"]),
      node("interpreter.world_stage", "interpreter", "World-stage interpreter", ["compact_observation.latest_world"], ["setting, actor, hazard, resource badges"]),
      node("stage_bounds.current", "stage_bounds", "Current stage bounds", ["interpreter.world_stage"], ["bounded world state"]),
      node("perturbation.latest", "perturbation", "Latest meaningful perturbation", ["stage_bounds.current"], ["checkpoint suggestion"]),
      node("possibilities.current", "possibility_state", "Current possibility state", ["stage_bounds.current", "perturbation.latest"], ["available and blocked moves"]),
      node("checkpoint_request.queued", "checkpoint_request", "Checkpoint request", ["possibilities.current"], ["bounded Ask request"]),
      node("helix_ask.checkpoint.latest", "helix_ask_checkpoint", "Helix Ask checkpoint", ["checkpoint_request.queued"], ["model-reviewed checkpoint receipt"]),
      node("answer_snapshot.latest", "answer_snapshot", "Answer Snapshot", ["helix_ask.checkpoint.latest"], ["upheld answer for this checkpoint"]),
      node("live_output.current", "live_output", "Live output", ["answer_snapshot.latest"], ["visible reviewed output"]),
    ];
  }
  return [
    node("observer.live_sources", "observer", "Observer: live source custody", [], ["selected visual/audio sources"]),
    node("source.visual_frame.active", "source", "Visual frame source", ["observer.live_sources"], ["visual frame evidence refs"]),
    node("compact_observation.latest_visual", "compact_observation", "Latest compact visual observation", ["source.visual_frame.active"], ["scene summary and evidence refs"]),
    node("interpreter.visual_scene", "interpreter", "Visual scene interpreter", ["compact_observation.latest_visual"], ["setting and observed subject badges"]),
    node("setting.visual_scene", "stage_bounds", "Visual scene setting", ["interpreter.visual_scene"], ["current scene bounds"]),
    node("actor.observed_subject", "stage_bounds", "Observed subject", ["interpreter.visual_scene"], ["current actor/object focus"]),
    node("perturbation.latest", "perturbation", "Latest meaningful perturbation", ["setting.visual_scene", "actor.observed_subject"], ["checkpoint suggestion"]),
    node("possibilities.current", "possibility_state", "Current possibility state", ["interpreter.visual_scene", "perturbation.latest"], ["candidate next moves and unknowns"]),
    node("checkpoint_request.queued", "checkpoint_request", "Checkpoint request", ["possibilities.current"], ["bounded Ask request"]),
    node("helix_ask.checkpoint.latest", "helix_ask_checkpoint", "Helix Ask checkpoint", ["checkpoint_request.queued"], ["model-reviewed checkpoint receipt"]),
    node("answer_snapshot.latest", "answer_snapshot", "Answer Snapshot", ["helix_ask.checkpoint.latest"], ["upheld answer for this checkpoint"]),
    ...(predictionEnabled
      ? [node("validation_feedback.latest", "validation_feedback", "Prediction validation feedback", ["answer_snapshot.latest", "compact_observation.latest_visual"], ["confirmed, missed, or not-yet-observable signals"])]
      : []),
    node("live_output.current", "live_output", "Live output", ["answer_snapshot.latest"], ["visible reviewed output"]),
  ];
};

const matchesRequirement = (sourceClass: string, requiredModality: string): boolean => {
  if (sourceClass === requiredModality) return true;
  if (requiredModality === "world_event" && /world|minecraft/i.test(sourceClass)) return true;
  if (requiredModality === "visual_frame" && /visual|screen|frame/i.test(sourceClass)) return true;
  if (requiredModality === "audio_transcript" && /audio|transcript/i.test(sourceClass)) return true;
  if (requiredModality === "environment_state" && /environment_state|snapshot/i.test(sourceClass)) return true;
  return false;
};

const statusIsActive = (status: string): boolean =>
  ACTIVE_SOURCE_STATUSES.has(status) || /^active/i.test(status);

export function planStagePlayJob(input: PlanStagePlayJobInput): StagePlayJobPlanV1 {
  const jobObjective = readObjective(input.objective);
  const domain = inferDomain(jobObjective);
  const requiredSources = sourceRequirementsForDomain(domain);
  const sourceHandles = listStagePlaySourceHandles({
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    sourceId: input.sourceId ?? null,
  });
  const predictionPolicy = predictionPolicyForObjective(jobObjective);
  const readinessChecks: StagePlayJobReadinessCheck[] = [];
  const missingSetup: string[] = [];

  for (const requirement of requiredSources) {
    const candidates = sourceHandles.filter((handle) =>
      matchesRequirement(handle.sourceClass, requirement.modality),
    );
    const active = candidates.find((handle) => statusIsActive(handle.status)) ?? null;
    if (active) {
      readinessChecks.push({
        check: `${requirement.label} is available.`,
        status: "ready",
        nextAction: null,
      });
      continue;
    }
    const foundInactive = candidates[0] ?? null;
    if (requirement.required) {
      missingSetup.push(`${requirement.label} is needed for this Stage Play job.`);
      readinessChecks.push({
        check: `${requirement.label} is active.`,
        status: foundInactive ? "blocked" : "missing",
        nextAction: requirement.modality === "visual_frame"
          ? "Attach browser tab visual capture at 10s cadence."
          : `Attach or activate ${requirement.modality} source.`,
      });
    } else {
      missingSetup.push(`Optional: ${requirement.label} is not active.`);
      readinessChecks.push({
        check: `${requirement.label} is available.`,
        status: foundInactive ? "blocked" : "missing",
        nextAction: requirement.modality === "audio_transcript"
          ? "Attach audio transcript for intent/dialogue grounding."
          : null,
      });
    }
  }

  readinessChecks.push({
    check: "Stage Play planner does not start capture or produce an answer.",
    status: "ready",
    nextAction: "Use the plan to attach sources, then reflect the Stage Play context.",
  });

  return buildStagePlayJobPlanV1({
    jobObjective,
    domain,
    requiredSources,
    nodeChain: nodeChainForDomain(domain, predictionPolicy?.enabled === true),
    missingSetup,
    readinessChecks,
    checkpointPolicy: {
      triggerOnFirstObservation: false,
      triggerOnSceneChange: true,
      triggerOnPredictionHorizonExpired: predictionPolicy?.enabled === true,
      minMsSinceLastCheckpoint: 15_000,
      manualUserPriority: true,
    },
    predictionPolicy,
  });
}
