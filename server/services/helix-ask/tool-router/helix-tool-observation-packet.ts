import {
  HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
  type HelixAgentStepObservationPacket,
  type HelixRawToolResult,
  type HelixRuntimeToolCallV1,
} from "@shared/helix-agent-step-observation-packet";
import type { SituationRoomConstructObservation } from "@shared/situation-room-construct-observation";
import type { SituationRoomLiveJobContract } from "@shared/situation-room-live-job-contract";

const SITUATION_ROOM_OBSERVATION_SCHEMAS = new Set([
  "helix.situation_room_live_job_contract.v1",
  "helix.situation_room_construct_observation.v1",
  "helix.live_source_admission_receipt.v1",
  "helix.live_source_event_observation.v1",
  "helix.live_continuation_tick.v1",
  "helix.worker_lane_receipt.v1",
  "helix.goal_evaluation_receipt.v1",
  "helix.callout_candidate.v1",
  "helix.live_answer_environment_delta.v1",
  "helix.situation_salience_receipt.v1",
  "helix.situation_interjection_proposal.v1",
]);

const SITUATION_ROOM_OBSERVATION_ACTIONS = /^(?:attach_live_source|create_live_answer_environment|set_live_commentary_policy|request_agentic_review|query_event_window|query_synthetic_evidence|start_situation_goal_session|goal_ledger\.|callout_policy\.|live-source\.|live_continuation\.|worker_lane\.|voice_delivery\.|construct\.|dottie\.|observer\.)/i;

const suggestedNextStepsForStatus = (
  status: HelixAgentStepObservationPacket["status"],
): HelixAgentStepObservationPacket["suggested_next_steps"] => {
  if (status === "succeeded") return ["answer", "use_another_tool"];
  if (status === "missing_input") return ["ask_user", "repair"];
  if (status === "needs_confirmation" || status === "client_pending") return ["ask_user"];
  if (status === "blocked") return ["repair", "ask_user", "fail_closed"];
  return ["repair", "fail_closed"];
};

const buildGenericHelixAgentStepObservationPacket = (args: {
  turnId: string;
  iteration: number;
  call: HelixRuntimeToolCallV1;
  result: HelixRawToolResult;
}): HelixAgentStepObservationPacket => {
  const status = args.result.status ?? (args.result.ok ? "succeeded" : "failed");
  return {
    schema: HELIX_AGENT_STEP_OBSERVATION_PACKET_SCHEMA,
    turn_id: args.turnId,
    iteration: args.iteration,
    call_id: args.call.call_id,
    decision_id: args.call.decision_id,
    capability_key: args.call.capability_key,
    panel_id: args.call.panel_id,
    action: args.call.action,
    status,
    produced_artifact_refs: args.result.produced_artifact_refs ?? [],
    observation_summary:
      args.result.summary ??
      (status === "succeeded"
        ? `${args.call.capability_key} produced a non-terminal tool observation.`
        : `${args.call.capability_key} did not complete successfully.`),
    receipts: args.result.receipts ?? [],
    missing_requirements: args.result.missing_requirements ?? [],
    state_delta: args.result.state_delta ?? {},
    suggested_next_steps: suggestedNextStepsForStatus(status),
    terminal_eligible: false,
    post_tool_model_step_required: true,
    assistant_answer: false,
    raw_content_included: false,
  };
};

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const readArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const readArtifactRecord = (result: unknown): Record<string, unknown> | null => {
  const record = readRecord(result);
  if (!record) return null;
  return (
    readRecord(record.artifact) ??
    readRecord(record.payload) ??
    readRecord(record.result) ??
    record
  );
};

const readSchema = (artifact: Record<string, unknown> | null): string | null =>
  readString(artifact?.schema);

const findSituationRoomObservationArtifact = (raw: unknown): Record<string, unknown> | null => {
  const artifact = readArtifactRecord(raw);
  if (!artifact) return null;
  if (SITUATION_ROOM_OBSERVATION_SCHEMAS.has(readSchema(artifact) ?? "")) return artifact;
  for (const key of [
    "live_job_contract",
    "contract",
    "construct_observation",
    "observation",
    "receipt",
    "tick",
    "goal",
    "callout",
    "delta",
    "artifact",
    "payload",
    "result",
  ]) {
    const nested = readRecord(artifact[key]);
    if (nested && SITUATION_ROOM_OBSERVATION_SCHEMAS.has(readSchema(nested) ?? "")) return nested;
  }
  return null;
};

const readLiveJobContract = (artifact: Record<string, unknown> | null): SituationRoomLiveJobContract | null => {
  const direct = readRecord(artifact?.live_job_contract) ?? readRecord(artifact?.contract);
  if (direct?.schema === "helix.situation_room_live_job_contract.v1") {
    return direct as unknown as SituationRoomLiveJobContract;
  }
  if (artifact?.schema === "helix.situation_room_live_job_contract.v1") {
    return artifact as unknown as SituationRoomLiveJobContract;
  }
  return null;
};

const readConstructObservation = (artifact: Record<string, unknown> | null): SituationRoomConstructObservation | null => {
  const direct = readRecord(artifact?.construct_observation) ?? readRecord(artifact?.observation);
  if (direct?.schema === "helix.situation_room_construct_observation.v1") {
    return direct as unknown as SituationRoomConstructObservation;
  }
  if (artifact?.schema === "helix.situation_room_construct_observation.v1") {
    return artifact as unknown as SituationRoomConstructObservation;
  }
  return null;
};

const isSituationRoomObservationAction = (call: HelixRuntimeToolCallV1): boolean => {
  if (call.panel_id !== "situation-room-pipelines") return false;
  return SITUATION_ROOM_OBSERVATION_ACTIONS.test(call.action);
};

const isSituationRoomLiveJobObservationResult = (call: HelixRuntimeToolCallV1, raw: unknown): boolean => {
  if (!isSituationRoomObservationAction(call)) return false;
  const artifact = readArtifactRecord(raw);
  return Boolean(readLiveJobContract(artifact) || readConstructObservation(artifact));
};

const isSituationRoomObservationResult = (call: HelixRuntimeToolCallV1, raw: unknown): boolean => {
  if (!isSituationRoomObservationAction(call)) return false;
  return Boolean(findSituationRoomObservationArtifact(raw));
};

const collectLiveJobArtifactRefs = (
  artifact: Record<string, unknown> | null,
  contract: SituationRoomLiveJobContract | null,
  observation: SituationRoomConstructObservation | null,
): string[] => {
  const refs = new Set<string>();
  const add = (value: unknown) => {
    const text = readString(value);
    if (text) refs.add(text);
  };
  add(artifact?.run_id);
  add(artifact?.receipt_id);
  add(contract?.contract_id);
  add(observation?.observation_id);
  for (const constructId of observation?.construct_ids ?? []) add(constructId);
  for (const construct of observation?.created_constructs ?? []) add(construct.construct_id);
  for (const ref of readArray(artifact?.created_construct_ids)) add(ref);
  for (const ref of readArray(artifact?.receipt_refs)) add(ref);
  return Array.from(refs);
};

const collectLiveJobMissingRequirements = (
  contract: SituationRoomLiveJobContract | null,
  observation: SituationRoomConstructObservation | null,
): HelixAgentStepObservationPacket["missing_requirements"] => {
  const requirements = new Map<string, HelixAgentStepObservationPacket["missing_requirements"][number]>();
  const add = (code: string, message: string, repairAction = "repair") => {
    if (!requirements.has(code)) {
      requirements.set(code, { code, message, repair_action: repairAction });
    }
  };
  for (const source of contract?.source_requirements ?? []) {
    if (source.required && source.status !== "connected") {
      add(
        `source:${source.source_kind}`,
        source.missing_reason ?? `Required source ${source.source_kind} is ${source.status}.`,
        "ask_user",
      );
    }
  }
  for (const missing of observation?.missing_inputs ?? []) {
    add(`missing:${missing}`, `Missing required input: ${missing}.`, "ask_user");
  }
  for (const source of observation?.source_status ?? []) {
    if (source.status === "missing" || source.status === "stale" || source.status === "blocked") {
      add(`source:${source.source_kind}`, source.message || `Source ${source.source_kind} is ${source.status}.`, "ask_user");
    }
  }
  return Array.from(requirements.values());
};

const deriveLiveJobStatus = (
  contract: SituationRoomLiveJobContract | null,
  observation: SituationRoomConstructObservation | null,
  missingRequirements: HelixAgentStepObservationPacket["missing_requirements"],
): HelixAgentStepObservationPacket["status"] => {
  if (missingRequirements.length > 0) return "missing_input";
  if (contract?.runtime_status === "blocked" || contract?.runtime_status === "stale") return "blocked";
  if (observation?.created_constructs.some((construct) => construct.status === "blocked" || construct.status === "stale")) {
    return "blocked";
  }
  return "succeeded";
};

const summarizeLiveJobObservation = (args: {
  call: HelixRuntimeToolCallV1;
  contract: SituationRoomLiveJobContract | null;
  observation: SituationRoomConstructObservation | null;
  missingRequirements: HelixAgentStepObservationPacket["missing_requirements"];
}): string => {
  const facts: string[] = [];
  const name = args.contract?.name ?? "Situation Room live job";
  facts.push(`${args.call.capability_key} produced a non-terminal Situation Room observation for ${name}.`);
  if (args.contract) facts.push(`Live job status: ${args.contract.runtime_status}.`);
  if (args.contract?.voice_policy) facts.push(`Voice policy: ${args.contract.voice_policy}.`);
  if (args.observation?.policy_state) {
    facts.push(
      `Voice output: ${args.observation.policy_state.output_authority}; spoken: ${String(args.observation.policy_state.spoken)}; confirm-speak receipt: ${String(args.observation.policy_state.confirm_speak_receipt_present)}.`,
    );
  }
  const authorities = Array.from(new Set((args.observation?.created_constructs ?? []).map((construct) => construct.authority)));
  if (authorities.length > 0) facts.push(`Construct authority: ${authorities.join(", ")}.`);
  if (args.missingRequirements.length > 0) {
    facts.push(`Missing requirements: ${args.missingRequirements.map((entry) => entry.code).join(", ")}.`);
  }
  facts.push("This packet is evidence only; the model must compose the next answer after observation re-entry.");
  return facts.join(" ");
};

export const buildSituationRoomLiveJobObservationPacket = (args: {
  turnId: string;
  iteration: number;
  call: HelixRuntimeToolCallV1;
  result: HelixRawToolResult;
}): HelixAgentStepObservationPacket => {
  const artifact = readArtifactRecord(args.result.raw);
  const contract = readLiveJobContract(artifact);
  const observation = readConstructObservation(artifact);
  const missingRequirements = collectLiveJobMissingRequirements(contract, observation);
  const status = args.result.status ?? deriveLiveJobStatus(contract, observation, missingRequirements);
  const producedArtifactRefs = Array.from(new Set([
    ...(args.result.produced_artifact_refs ?? []),
    ...collectLiveJobArtifactRefs(artifact, contract, observation),
  ]));
  const receipts = [
    ...(args.result.receipts ?? []),
    ...(observation
      ? [{
          receipt_ref: observation.observation_id,
          kind: "situation_room_construct_observation",
          status: status === "succeeded" ? "observed" : status,
        }]
      : []),
    ...(contract
      ? [{
          receipt_ref: contract.contract_id,
          kind: "situation_room_live_job_contract",
          status: contract.runtime_status,
        }]
      : []),
  ];
  return buildGenericHelixAgentStepObservationPacket({
    ...args,
    result: {
      ...args.result,
      ok: status === "succeeded",
      status,
      summary: summarizeLiveJobObservation({
        call: args.call,
        contract,
        observation,
        missingRequirements,
      }),
      produced_artifact_refs: producedArtifactRefs,
      receipts,
      missing_requirements: missingRequirements,
      state_delta: {
        ...(args.result.state_delta ?? {}),
        focused_panel: args.result.state_delta?.focused_panel ?? args.call.panel_id,
        created_constructs: Array.from(new Set([
          ...(args.result.state_delta?.created_constructs ?? []),
          ...(observation?.construct_ids ?? []),
        ])),
      },
    },
  });
};

const collectSituationRoomObservationRefs = (artifact: Record<string, unknown> | null): string[] => {
  const refs = new Set<string>();
  const add = (value: unknown) => {
    const text = readString(value);
    if (text) refs.add(text);
  };
  for (const field of [
    "receipt_id",
    "observation_id",
    "tick_id",
    "candidate_id",
    "delta_id",
    "proposal_id",
    "contract_id",
    "environment_id",
    "source_id",
    "job_id",
  ]) {
    add(artifact?.[field]);
  }
  for (const ref of readArray(artifact?.evidence_refs)) add(ref);
  for (const ref of readArray(artifact?.worker_receipt_refs)) add(ref);
  add(artifact?.goal_evaluation_ref);
  add(artifact?.callout_candidate_ref);
  return Array.from(refs);
};

const collectSituationRoomObservationMissingRequirements = (
  artifact: Record<string, unknown> | null,
): HelixAgentStepObservationPacket["missing_requirements"] => {
  const requirements = new Map<string, HelixAgentStepObservationPacket["missing_requirements"][number]>();
  const add = (code: string, message: string, repairAction = "repair") => {
    if (!requirements.has(code)) requirements.set(code, { code, message, repair_action: repairAction });
  };
  for (const missing of readArray(artifact?.missing_evidence)) {
    const text = readString(missing);
    if (text) add(`missing:${text}`, `Missing evidence: ${text}.`, "repair");
  }
  const freshness = readRecord(artifact?.freshness);
  const freshnessStatus = readString(freshness?.status);
  if (freshnessStatus && freshnessStatus !== "connected") {
    add(`source:${freshnessStatus}`, `Live source freshness is ${freshnessStatus}.`, "ask_user");
  }
  return Array.from(requirements.values());
};

const deriveSituationRoomObservationStatus = (
  artifact: Record<string, unknown> | null,
  missingRequirements: HelixAgentStepObservationPacket["missing_requirements"],
): HelixAgentStepObservationPacket["status"] => {
  const status = readString(artifact?.status);
  if (status === "blocked" || status === "fail_closed") return "blocked";
  if (status === "missing_input" || status === "missing" || missingRequirements.length > 0) return "missing_input";
  if (status === "suppressed" || status === "stale") return "blocked";
  if (status === "failed") return "failed";
  return "succeeded";
};

const summarizeSituationRoomObservation = (args: {
  call: HelixRuntimeToolCallV1;
  artifact: Record<string, unknown> | null;
  missingRequirements: HelixAgentStepObservationPacket["missing_requirements"];
}): string => {
  const schema = readSchema(args.artifact) ?? "unknown";
  const status = readString(args.artifact?.status);
  const facts = [
    `${args.call.capability_key} produced a non-terminal Situation Room observation (${schema}).`,
  ];
  if (status) facts.push(`Observation status: ${status}.`);
  if (schema === "helix.live_continuation_tick.v1") {
    const trigger = readString(args.artifact?.trigger);
    const nextStep = readString(args.artifact?.next_step);
    if (trigger) facts.push(`Continuation trigger: ${trigger}.`);
    if (nextStep) facts.push(`Continuation next step: ${nextStep}.`);
  }
  if (schema === "helix.worker_lane_receipt.v1") {
    const lane = readString(args.artifact?.lane);
    if (lane) facts.push(`Worker lane: ${lane}.`);
  }
  if (schema === "helix.callout_candidate.v1") {
    const intent = readString(args.artifact?.callout_intent);
    const priority = readString(args.artifact?.priority);
    if (intent) facts.push(`Callout intent: ${intent}.`);
    if (priority) facts.push(`Callout priority: ${priority}.`);
  }
  if (args.missingRequirements.length > 0) {
    facts.push(`Missing requirements: ${args.missingRequirements.map((entry) => entry.code).join(", ")}.`);
  }
  facts.push("This packet is evidence only; the model must compose the next answer after observation re-entry.");
  return facts.join(" ");
};

export const buildSituationRoomObservationPacket = (args: {
  turnId: string;
  iteration: number;
  call: HelixRuntimeToolCallV1;
  result: HelixRawToolResult;
}): HelixAgentStepObservationPacket => {
  if (isSituationRoomLiveJobObservationResult(args.call, args.result.raw)) {
    return buildSituationRoomLiveJobObservationPacket(args);
  }
  const artifact = findSituationRoomObservationArtifact(args.result.raw);
  const missingRequirements = collectSituationRoomObservationMissingRequirements(artifact);
  const status = args.result.status ?? deriveSituationRoomObservationStatus(artifact, missingRequirements);
  const refs = collectSituationRoomObservationRefs(artifact);
  return buildGenericHelixAgentStepObservationPacket({
    ...args,
    result: {
      ...args.result,
      ok: status === "succeeded",
      status,
      summary: summarizeSituationRoomObservation({
        call: args.call,
        artifact,
        missingRequirements,
      }),
      produced_artifact_refs: Array.from(new Set([...(args.result.produced_artifact_refs ?? []), ...refs])),
      receipts: [
        ...(args.result.receipts ?? []),
        ...refs.slice(0, 8).map((ref) => ({
          receipt_ref: ref,
          kind: readSchema(artifact) ?? "situation_room_observation",
          status,
        })),
      ],
      missing_requirements: missingRequirements,
      state_delta: {
        ...(args.result.state_delta ?? {}),
        focused_panel: args.result.state_delta?.focused_panel ?? args.call.panel_id,
      },
    },
  });
};

export const buildHelixAgentStepObservationPacket = (args: {
  turnId: string;
  iteration: number;
  call: HelixRuntimeToolCallV1;
  result: HelixRawToolResult;
}): HelixAgentStepObservationPacket => {
  if (isSituationRoomObservationResult(args.call, args.result.raw)) {
    return buildSituationRoomObservationPacket(args);
  }
  return buildGenericHelixAgentStepObservationPacket(args);
};
