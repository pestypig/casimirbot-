import crypto from "node:crypto";
import {
  HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
  type HelixSituationConstructRecipe,
  type HelixSituationConstructRecipeId,
  type HelixSituationConstructRecipeInputKey,
  type HelixSituationConstructRecipeRun,
} from "@shared/helix-situation-construct-recipe";
import type {
  HelixSituationConstruct,
  HelixSituationConstructOutputBinding,
  HelixSituationConstructOutputKind,
  HelixSituationConstructType,
} from "@shared/helix-situation-construct";
import type { HelixLiveEnvironmentCommentary } from "@shared/helix-live-environment-commentary";
import type { HelixDottieManifestRun } from "@shared/helix-dottie-manifest-run";
import {
  SITUATION_ROOM_CONSTRUCT_OBSERVATION_SCHEMA,
  type SituationRoomConstructObservation,
} from "@shared/situation-room-construct-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";
import {
  applySituationRoomDottieManifestPreset,
  buildSituationRoomDottieManifestPreset,
} from "./dottie-manifest-preset";
import { listDottieManifestRuns } from "./dottie-manifest-run-store";
import { listLiveEnvironmentCommentary } from "./live-environment-commentary-store";
import {
  linkSituationConstructs,
  listSituationConstructs,
  makeSituationConstructId,
  upsertSituationConstruct,
} from "./situation-construct-store";
import { getSituationConstructRecipe } from "./situation-construct-recipe-registry";
import { planSituationRoomLiveJobSetup } from "../helix-ask/situation-room-live-job-setup-planner";
import { upsertLiveJobContract } from "../live-job/live-job-contract-store";

export type RunSituationConstructRecipeInput = {
  recipe_id: HelixSituationConstructRecipeId | string;
  thread_id?: string | null;
  room_id?: string | null;
  source_ids?: string[] | null;
  environment_id?: string | null;
  label?: string | null;
  language?: string | null;
  output?: "transcript_stream" | "live_answer_environment" | "note" | string | null;
  target_run_id?: string | null;
  target_language?: string | null;
  native_language?: string | null;
  minecraft_world_id?: string | null;
  objective?: string | null;
  operating_prompt?: string | null;
  now?: string | null;
};

const hashShort = (value: unknown, size = 20): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const uniqueStrings = (values: unknown): string[] =>
  Array.isArray(values)
    ? Array.from(new Set(values.map(normalizeString).filter((entry: string | null): entry is string => Boolean(entry))))
    : [];

const readInputValue = (
  input: RunSituationConstructRecipeInput,
  key: HelixSituationConstructRecipeInputKey,
): string | string[] | null => {
  if (key === "source_ids") {
    const sourceIds = uniqueStrings(input.source_ids ?? []);
    return sourceIds.length ? sourceIds : null;
  }
  return normalizeString(input[key]);
};

const missingInputs = (
  recipe: HelixSituationConstructRecipe,
  input: RunSituationConstructRecipeInput,
): string[] =>
  recipe.required_inputs.filter((key: HelixSituationConstructRecipeInputKey) => !readInputValue(input, key));

const makeRecipeRunId = (input: {
  recipeId: string;
  threadId: string;
  roomId: string;
  createdAt: string;
}): string =>
  `situation_construct_recipe_run:${hashShort([
    input.recipeId,
    input.threadId,
    input.roomId,
    input.createdAt,
  ])}`;

const inferSetupPrompt = (
  recipe: HelixSituationConstructRecipe,
  input: RunSituationConstructRecipeInput,
): string => {
  const explicitPrompt = normalizeString(input.operating_prompt) ?? normalizeString(input.objective);
  if (recipe.recipe_id === "auntie_dottie_witness") {
    return explicitPrompt
      ? `Go into Auntie Dottie mode while I play Minecraft. ${explicitPrompt}`
      : "Go into Auntie Dottie mode while I play Minecraft.";
  }
  if (explicitPrompt) return explicitPrompt;
  if (recipe.recipe_id === "browser_audio_transcriber") {
    return "Transcribe my browser tab audio as evidence.";
  }
  return recipe.description;
};

const constructRoleForObservation = (
  construct: HelixSituationConstruct,
): SituationRoomConstructObservation["created_constructs"][number]["role"] => {
  if (construct.type === "observer" || construct.type === "dottie_manifest" || construct.type === "voice_policy") {
    return "observer";
  }
  if (construct.type === "transcription_job") return "transcriber";
  if (construct.type === "route_evidence_view") return "route_watcher";
  if (construct.type === "source_binding" || construct.type === "commentary_policy") return "source_health_watcher";
  return "source_health_watcher";
};

const observationStatusForConstruct = (
  construct: HelixSituationConstruct,
): SituationRoomConstructObservation["created_constructs"][number]["status"] => {
  if (construct.status === "active") return "active";
  if (construct.status === "blocked") return "blocked";
  if (construct.status === "stale") return "stale";
  if (construct.status === "detached" || construct.status === "completed") return "paused";
  return "created";
};

const buildConstructObservation = (args: {
  recipe: HelixSituationConstructRecipe;
  runId: string;
  threadId: string;
  roomId: string;
  createdAt: string;
  constructs: HelixSituationConstruct[];
  missingInputs: string[];
  contract?: SituationRoomLiveJobContract | null;
  action?: SituationRoomConstructObservation["action"];
}): SituationRoomConstructObservation => {
  const contract = args.contract ?? null;
  const voicePolicy = contract?.voice_policy ?? "muted";
  return {
    schema: SITUATION_ROOM_CONSTRUCT_OBSERVATION_SCHEMA,
    observation_id: `${args.runId}:construct_observation`,
    turn_id: contract?.turn_id ?? args.runId,
    action: args.action ?? "construct.create_from_recipe",
    live_job_contract_ref: contract?.contract_id,
    construct_ids: args.constructs.map((construct) => construct.construct_id),
    created_constructs: args.constructs.map((construct) => ({
      construct_id: construct.construct_id,
      name: construct.name,
      role: constructRoleForObservation(construct),
      authority: construct.policy.witness_only ? "witness_only" : "evidence_only",
      status: observationStatusForConstruct(construct),
    })),
    missing_inputs: args.missingInputs,
    policy_state: {
      voice_policy: voicePolicy,
      spoken: false,
      confirm_speak_receipt_present: false,
      output_authority: voicePolicy === "muted" ? "typed_only" : "proposal",
    },
    output_bindings: Array.from(
      new Set(args.constructs.flatMap((construct) => construct.output_bindings.map((binding) => binding.output_kind))),
    ),
    source_status: contract
      ? contract.source_requirements.map((source) => ({
          source_kind: source.source_kind,
          status: source.status,
          message: source.missing_reason ?? `${source.source_kind} is ${source.status}.`,
        }))
      : [],
    diagnostics: [
      ...(contract?.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        message: diagnostic.message,
        severity: diagnostic.severity,
      })) ?? []),
      ...args.missingInputs.map((missing) => ({
        code: `missing_${missing}`,
        message: `Missing required input: ${missing}.`,
        severity: "warning" as const,
      })),
    ],
    terminal_eligible: false,
    panel_generated_answer: false,
    next_step_authority: "agent_step_decision",
    assistant_answer: false,
    raw_content_included: false,
  };
};

const outputBindingsForRecipe = (
  recipe: HelixSituationConstructRecipe,
  environmentId?: string | null,
): HelixSituationConstructOutputBinding[] =>
  recipe.default_outputs.map((outputKind: HelixSituationConstructOutputKind) => ({
    output_kind: outputKind,
    artifact_ref: outputKind === "live_answer_environment" ? environmentId ?? null : null,
    status: outputKind === "live_answer_environment" && environmentId ? "active" : "planned",
  }));

const liveAnswerOutputBinding = (
  environmentId: string | null,
  fallbackRef: string,
): HelixSituationConstructOutputBinding => ({
  output_kind: "live_answer_environment",
  artifact_ref: environmentId ?? fallbackRef,
  status: environmentId ? "active" : "planned",
});

const registerLiveJobContract = (args: {
  contract: SituationRoomLiveJobContract;
  threadId: string;
  roomId: string;
  environmentId?: string | null;
}): SituationRoomLiveJobContract =>
  upsertLiveJobContract({
    contract: args.contract,
    thread_id: args.threadId,
    room_id: args.roomId,
    environment_id: args.environmentId ?? null,
  });

const constructName = (
  recipe: HelixSituationConstructRecipe,
  type: HelixSituationConstructType,
): string => {
  if (recipe.recipe_id === "browser_audio_transcriber" && type === "transcription_job") {
    return "Browser audio transcription job";
  }
  if (recipe.recipe_id === "minecraft_route_watcher" && type === "route_evidence_view") {
    return "Minecraft route evidence view";
  }
  if (recipe.recipe_id === "source_health_watch" && type === "field_worker_policy") {
    return "Source health watch policy";
  }
  return `${recipe.title} ${type.replace(/_/g, " ")}`;
};

const runGenericPlannedRecipe = (args: {
  recipe: HelixSituationConstructRecipe;
  input: RunSituationConstructRecipeInput;
  threadId: string;
  roomId: string;
  runId: string;
  createdAt: string;
}): HelixSituationConstructRecipeRun => {
  const sourceIds = uniqueStrings(args.input.source_ids ?? []);
  const constructIds = args.recipe.creates_constructs.map((type: HelixSituationConstructType) => {
    const name = constructName(args.recipe, type);
    const constructId = makeSituationConstructId({
      threadId: args.threadId,
      roomId: args.roomId,
      type,
      name,
      seed: args.runId,
    });
    upsertSituationConstruct({
      construct_id: constructId,
      type,
      name,
      description: args.recipe.description,
      status: "planned",
      thread_id: args.threadId,
      room_id: args.roomId,
      source_ids: sourceIds,
      artifact_refs: [args.runId],
      evidence_refs: [args.runId],
      environment_id: normalizeString(args.input.environment_id),
      output_bindings: outputBindingsForRecipe(args.recipe, normalizeString(args.input.environment_id)),
      policy: args.recipe.default_policy,
      created_at: args.createdAt,
      updated_at: args.createdAt,
    });
    return constructId;
  });
  const [parentConstructId, ...childConstructIds] = constructIds;
  for (const childConstructId of childConstructIds) {
    if (parentConstructId) {
      linkSituationConstructs({ parentConstructId, childConstructId });
    }
  }
  const constructs = constructIds
    .map((constructId) => listSituationConstructs({ threadId: args.threadId, roomId: args.roomId, limit: 100 })
      .find((construct) => construct.construct_id === constructId))
    .filter((construct): construct is HelixSituationConstruct => Boolean(construct));
  const setupPlan = planSituationRoomLiveJobSetup({
    prompt: inferSetupPrompt(args.recipe, args.input),
    turnId: args.runId,
    sourceIds,
    now: args.createdAt,
  });
  const liveJobContract = registerLiveJobContract({
    contract: setupPlan.live_job_contract,
    threadId: args.threadId,
    roomId: args.roomId,
    environmentId: normalizeString(args.input.environment_id),
  });
  return {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
    run_id: args.runId,
    recipe_id: args.recipe.recipe_id,
    thread_id: args.threadId,
    room_id: args.roomId,
    status: "planned",
    created_construct_ids: constructIds,
    receipt_refs: [],
    commentary_refs: [],
    missing_evidence: [],
    live_job_contract: liveJobContract,
    construct_observation: buildConstructObservation({
      recipe: args.recipe,
      runId: args.runId,
      threadId: args.threadId,
      roomId: args.roomId,
      createdAt: args.createdAt,
      constructs,
      missingInputs: setupPlan.missing_inputs,
      contract: liveJobContract,
    }),
    assistant_answer: false,
    raw_content_included: false,
    instruction_authority: "none",
    created_at: args.createdAt,
  };
};

const browserAudioOutput = (value: unknown): "transcript_stream" | "live_answer_environment" | "note" => {
  const output = normalizeString(value);
  if (output === "live_answer_environment" || output === "note") return output;
  return "transcript_stream";
};

const runBrowserAudioTranscriberRecipe = (args: {
  recipe: HelixSituationConstructRecipe;
  input: RunSituationConstructRecipeInput;
  threadId: string;
  roomId: string;
  runId: string;
  createdAt: string;
}): HelixSituationConstructRecipeRun => {
  const sourceIds = uniqueStrings(args.input.source_ids ?? []);
  const label = normalizeString(args.input.label) ?? "Browser tab audio";
  const language = normalizeString(args.input.language) ?? "auto";
  const output = browserAudioOutput(args.input.output);
  const environmentId = normalizeString(args.input.environment_id);
  const sourceBindingId = makeSituationConstructId({
    threadId: args.threadId,
    roomId: args.roomId,
    type: "source_binding",
    name: `${label} source binding`,
    seed: args.runId,
  });
  const transcriptionJobId = makeSituationConstructId({
    threadId: args.threadId,
    roomId: args.roomId,
    type: "transcription_job",
    name: `${label} transcript job`,
    seed: args.runId,
  });
  const commentaryPolicyId = makeSituationConstructId({
    threadId: args.threadId,
    roomId: args.roomId,
    type: "commentary_policy",
    name: `${label} transcript commentary policy`,
    seed: args.runId,
  });
  const createdConstructIds = [sourceBindingId, transcriptionJobId, commentaryPolicyId];
  const transcriptRef = `${args.runId}:transcript_stream`;

  upsertSituationConstruct({
    construct_id: sourceBindingId,
    type: "source_binding",
    name: `${label} source binding`,
    description: "Browser/display audio source binding for a transcription construct. Raw audio is not Ask context.",
    status: "active",
    thread_id: args.threadId,
    room_id: args.roomId,
    source_ids: sourceIds,
    artifact_refs: [args.runId],
    evidence_refs: [args.runId, ...sourceIds],
    output_bindings: [
      {
        output_kind: "transcript_stream",
        artifact_ref: transcriptRef,
        status: "active",
      },
      ...(output === "live_answer_environment"
        ? [liveAnswerOutputBinding(environmentId, `${args.runId}:live_answer_environment`)]
        : []),
    ],
    policy: {
      ...args.recipe.default_policy,
      may_surface_user_text: false,
      requires_user_confirmation: true,
    },
    created_at: args.createdAt,
    updated_at: args.createdAt,
  });
  upsertSituationConstruct({
    construct_id: transcriptionJobId,
    type: "transcription_job",
    name: `${label} transcript job`,
    description: `Transcribes browser/display audio into evidence chunks; language=${language}.`,
    status: "active",
    thread_id: args.threadId,
    room_id: args.roomId,
    source_ids: sourceIds,
    parent_construct_ids: [sourceBindingId],
    artifact_refs: [transcriptRef],
    evidence_refs: [args.runId, transcriptRef],
    output_bindings: [
      {
        output_kind: "transcript_stream",
        artifact_ref: transcriptRef,
        status: "active",
      },
      ...(output === "live_answer_environment"
        ? [liveAnswerOutputBinding(environmentId, `${args.runId}:live_answer_environment`)]
        : []),
    ],
    policy: {
      ...args.recipe.default_policy,
      may_surface_user_text: false,
      requires_user_confirmation: true,
    },
    created_at: args.createdAt,
    updated_at: args.createdAt,
  });
  upsertSituationConstruct({
    construct_id: commentaryPolicyId,
    type: "commentary_policy",
    name: `${label} transcript commentary policy`,
    description: "Transcript chunks are evidence; commentary remains compact and non-answering.",
    status: "receipt_only",
    thread_id: args.threadId,
    room_id: args.roomId,
    source_ids: sourceIds,
    parent_construct_ids: [transcriptionJobId],
    artifact_refs: [args.runId],
    evidence_refs: [args.runId, transcriptRef],
    output_bindings: [{
      output_kind: "typed_commentary",
      artifact_ref: `${args.runId}:typed_commentary`,
      status: "planned",
    }],
    policy: args.recipe.default_policy,
    created_at: args.createdAt,
    updated_at: args.createdAt,
  });
  linkSituationConstructs({ parentConstructId: sourceBindingId, childConstructId: transcriptionJobId });
  linkSituationConstructs({ parentConstructId: transcriptionJobId, childConstructId: commentaryPolicyId });

  if (output === "live_answer_environment") {
    const liveEnvironmentId = makeSituationConstructId({
      threadId: args.threadId,
      roomId: args.roomId,
      type: "live_environment",
      name: `${label} live summary card`,
      seed: args.runId,
    });
    createdConstructIds.push(liveEnvironmentId);
    upsertSituationConstruct({
      construct_id: liveEnvironmentId,
      type: "live_environment",
      name: `${label} live summary card`,
      description: "Live card projection over transcript evidence. The card is not answer authority.",
      status: environmentId ? "active" : "planned",
      thread_id: args.threadId,
      room_id: args.roomId,
      environment_id: environmentId,
      source_ids: sourceIds,
      parent_construct_ids: [transcriptionJobId],
      artifact_refs: [environmentId ?? `${args.runId}:live_answer_environment`],
      evidence_refs: [transcriptRef],
      output_bindings: [liveAnswerOutputBinding(environmentId, `${args.runId}:live_answer_environment`)],
      policy: args.recipe.default_policy,
      created_at: args.createdAt,
      updated_at: args.createdAt,
    });
    linkSituationConstructs({ parentConstructId: transcriptionJobId, childConstructId: liveEnvironmentId });
  }

  if (output === "note") {
    const noteOutputId = makeSituationConstructId({
      threadId: args.threadId,
      roomId: args.roomId,
      type: "note_output",
      name: `${label} transcript note output`,
      seed: args.runId,
    });
    createdConstructIds.push(noteOutputId);
    upsertSituationConstruct({
      construct_id: noteOutputId,
      type: "note_output",
      name: `${label} transcript note output`,
      description: "Optional note projection over transcript evidence. Notes are not final answers.",
      status: "planned",
      thread_id: args.threadId,
      room_id: args.roomId,
      source_ids: sourceIds,
      parent_construct_ids: [transcriptionJobId],
      artifact_refs: [`${args.runId}:note`],
      evidence_refs: [transcriptRef],
      output_bindings: [{
        output_kind: "note",
        artifact_ref: `${args.runId}:note`,
        status: "planned",
      }],
      policy: args.recipe.default_policy,
      created_at: args.createdAt,
      updated_at: args.createdAt,
    });
    linkSituationConstructs({ parentConstructId: transcriptionJobId, childConstructId: noteOutputId });
  }

  const constructs = createdConstructIds
    .map((constructId) => listSituationConstructs({ threadId: args.threadId, roomId: args.roomId, limit: 100 })
      .find((construct) => construct.construct_id === constructId))
    .filter((construct): construct is HelixSituationConstruct => Boolean(construct));
  const setupPlan = planSituationRoomLiveJobSetup({
    prompt: inferSetupPrompt(args.recipe, args.input),
    turnId: args.runId,
    sourceIds,
    now: args.createdAt,
  });
  const liveJobContract = registerLiveJobContract({
    contract: setupPlan.live_job_contract,
    threadId: args.threadId,
    roomId: args.roomId,
    environmentId,
  });

  return {
    schema: HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
    run_id: args.runId,
    recipe_id: args.recipe.recipe_id,
    thread_id: args.threadId,
    room_id: args.roomId,
    status: "active",
    created_construct_ids: createdConstructIds,
    receipt_refs: [sourceBindingId, transcriptionJobId, commentaryPolicyId],
    commentary_refs: [],
    missing_evidence: [],
    live_job_contract: liveJobContract,
    construct_observation: buildConstructObservation({
      recipe: args.recipe,
      runId: args.runId,
      threadId: args.threadId,
      roomId: args.roomId,
      createdAt: args.createdAt,
      constructs,
      missingInputs: setupPlan.missing_inputs,
      contract: liveJobContract,
    }),
    assistant_answer: false,
    raw_content_included: false,
    instruction_authority: "none",
    created_at: args.createdAt,
  };
};

export function runSituationConstructRecipe(
  input: RunSituationConstructRecipeInput,
): HelixSituationConstructRecipeRun {
  const recipe = getSituationConstructRecipe(input.recipe_id);
  const threadId = normalizeString(input.thread_id) ?? "helix-ask:desktop";
  const roomId = normalizeString(input.room_id) ?? "situation-room:active";
  const createdAt = normalizeString(input.now) ?? new Date().toISOString();
  const runId = makeRecipeRunId({
    recipeId: normalizeString(input.recipe_id) ?? "unknown",
    threadId,
    roomId,
    createdAt,
  });

  if (!recipe) {
    return {
      schema: HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
      run_id: runId,
      recipe_id: "live_source_summarizer",
      thread_id: threadId,
      room_id: roomId,
      status: "blocked",
      created_construct_ids: [],
      receipt_refs: [],
      commentary_refs: [],
      missing_evidence: [`Unknown construct recipe: ${String(input.recipe_id)}`],
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      created_at: createdAt,
    };
  }

  const missing = missingInputs(recipe, { ...input, thread_id: threadId, room_id: roomId });
  if (missing.length > 0) {
    const setupPlan = planSituationRoomLiveJobSetup({
      prompt: inferSetupPrompt(recipe, input),
      turnId: runId,
      sourceIds: uniqueStrings(input.source_ids ?? []),
      now: createdAt,
    });
    const liveJobContract = registerLiveJobContract({
      contract: setupPlan.live_job_contract,
      threadId,
      roomId,
      environmentId: normalizeString(input.environment_id),
    });
    return {
      schema: HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
      run_id: runId,
      recipe_id: recipe.recipe_id,
      thread_id: threadId,
      room_id: roomId,
      status: "blocked",
      created_construct_ids: [],
      receipt_refs: [],
      commentary_refs: [],
      missing_evidence: missing.map((key: string) => `Missing required recipe input: ${key}`),
      live_job_contract: liveJobContract,
      construct_observation: buildConstructObservation({
        recipe,
        runId,
        threadId,
        roomId,
        createdAt,
        constructs: [],
        missingInputs: Array.from(new Set([...missing, ...setupPlan.missing_inputs])),
        contract: liveJobContract,
      }),
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      created_at: createdAt,
    };
  }

  if (recipe.recipe_id === "auntie_dottie_witness") {
    const receipt = applySituationRoomDottieManifestPreset(buildSituationRoomDottieManifestPreset({
      threadId,
      roomId,
      sourceIds: uniqueStrings(input.source_ids ?? []),
      targetRunId: normalizeString(input.target_run_id),
      objective: normalizeString(input.objective) ?? recipe.description,
      environmentId: normalizeString(input.environment_id),
      voiceMode: "propose_only",
      commentaryCadence: "milestones_only",
    }));
    const constructs = listSituationConstructs({
      threadId,
      roomId,
      limit: 50,
    }).filter((construct: HelixSituationConstruct) => construct.type === "dottie_manifest" || construct.parent_construct_ids.length > 0);
    const manifestRuns = listDottieManifestRuns({ threadId, roomId, limit: 1 });
    const commentaryRefs = [
      ...manifestRuns.flatMap((run: HelixDottieManifestRun) => run.commentary_refs),
      ...listLiveEnvironmentCommentary({
        threadId,
        roomId,
        subject: "dottie_observer",
        limit: 5,
      }).map((commentary: HelixLiveEnvironmentCommentary) => commentary.commentary_id),
    ];
    const setupPlan = planSituationRoomLiveJobSetup({
      prompt: inferSetupPrompt(recipe, input),
      turnId: runId,
      sourceIds: uniqueStrings(input.source_ids ?? []),
      now: createdAt,
    });
    const liveJobContract = registerLiveJobContract({
      contract: setupPlan.live_job_contract,
      threadId,
      roomId,
      environmentId: normalizeString(input.environment_id),
    });
    return {
      schema: HELIX_SITUATION_CONSTRUCT_RECIPE_RUN_SCHEMA,
      run_id: runId,
      recipe_id: recipe.recipe_id,
      thread_id: threadId,
      room_id: roomId,
      status: "applied_as_receipts",
      created_construct_ids: Array.from(new Set(constructs.map((construct: HelixSituationConstruct) => construct.construct_id))),
      receipt_refs: receipt.child_artifact_refs,
      commentary_refs: Array.from(new Set(commentaryRefs)),
      missing_evidence: [],
      live_job_contract: liveJobContract,
      construct_observation: buildConstructObservation({
        recipe,
        runId,
        threadId,
        roomId,
        createdAt,
        constructs,
        missingInputs: setupPlan.missing_inputs,
        contract: liveJobContract,
      }),
      assistant_answer: false,
      raw_content_included: false,
      instruction_authority: "none",
      created_at: createdAt,
    };
  }

  if (recipe.recipe_id === "browser_audio_transcriber") {
    return runBrowserAudioTranscriberRecipe({
      recipe,
      input,
      threadId,
      roomId,
      runId,
      createdAt,
    });
  }

  return runGenericPlannedRecipe({
    recipe,
    input,
    threadId,
    roomId,
    runId,
    createdAt,
  });
}
