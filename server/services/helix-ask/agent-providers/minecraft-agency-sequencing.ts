import {
  HELIX_MINECRAFT_COMMAND_CAPABILITY,
  HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY,
} from "@shared/helix-environment-command";
import {
  HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
} from "@shared/helix-environment-connector";
import {
  HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS,
  HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY,
} from "@shared/helix-minecraft-player-capabilities";
import type { HelixWorkstationGatewayCallResult } from "../workstation-tool-gateway/types";
import { classifyKnownMinecraftCommand } from "../workstation-tool-gateway/minecraft-command-risk";
import {
  isAffirmativeMinecraftPlayerEmbodimentActionPrompt,
  resolveMinecraftExecutionPlaneConstraint,
} from "../minecraft-execution-plane-intent";

export {
  affirmativeMinecraftPlayerControlCapabilityIds,
  isAffirmativeMinecraftPlayerEmbodimentActionPrompt,
  minecraftPlayerEmbodimentActionPromptMatch,
  requiredMinecraftPlayerCombatCapabilityIds,
  requiredMinecraftResidentRecoveryCapabilityIds,
  resolveMinecraftExecutionPlaneConstraint,
} from "../minecraft-execution-plane-intent";

type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as RecordLike)
    : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

const readArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const requestCapability = (request: RecordLike): string | null =>
  readString(
    request.capability ??
      request.capability_id ??
      request.capabilityId ??
      request.capability_key,
  );

const requestArguments = (request: RecordLike): RecordLike => {
  const nested = readRecord(request.arguments) ?? readRecord(request.args);
  if (nested) return nested;
  return Object.fromEntries(
    Object.entries(request).filter(
      ([key]) =>
        ![
          "capability",
          "capability_id",
          "capabilityId",
          "capability_key",
        ].includes(key),
    ),
  );
};

const minecraftCommandText = (request: RecordLike): string | null =>
  requestCapability(request) === HELIX_MINECRAFT_COMMAND_CAPABILITY
    ? readString(requestArguments(request).command)
    : null;

const isCheckpointCaptureCommand = (command: string): boolean =>
  /(?:^|\brun\s+)helixgame\s+checkpoint\s+capture(?:_box)?\b/iu.test(
    command.trim().replace(/^\/+/, ""),
  );

const referencesCheckpointCommand = (command: string): boolean =>
  /(?:^|\s)checkpoint(?:\s|$)/iu.test(command.trim().replace(/^\/+/, ""));

const containsLikelyMinecraftCommandBatch = (command: string): boolean =>
  /(?:;|[\r\n])\s*\/?(?:execute|fill|setblock|clone|data|summon|kill|give|clear|tp|teleport|effect|gamemode|gamerule|time|weather|worldborder|helixgame)\b/iu.test(
    command,
  );

const isStateChangingMinecraftCommand = (request: RecordLike): boolean => {
  const command = minecraftCommandText(request);
  if (!command || isCheckpointCaptureCommand(command)) return false;
  const declaredEffect = readString(requestArguments(request).effect);
  const effect = classifyKnownMinecraftCommand(command)?.effect ?? declaredEffect;
  return (
    effect === "player_mutation" ||
    effect === "world_mutation" ||
    effect === "server_administration"
  );
};

type MinecraftBlockPosition = { x: number; y: number; z: number };

type MinecraftBlockMutationFootprint = {
  from: MinecraftBlockPosition;
  to: MinecraftBlockPosition;
  expected_block: string;
};

const canonicalMinecraftBlockId = (value: string): string | null => {
  const stateStart = value.indexOf("[");
  const nbtStart = value.indexOf("{");
  const suffixStart = [stateStart, nbtStart]
    .filter((index) => index >= 0)
    .reduce((minimum, index) => Math.min(minimum, index), value.length);
  const bare = value.slice(0, suffixStart).trim().toLowerCase();
  const canonical = bare.includes(":") ? bare : `minecraft:${bare}`;
  return /^[a-z0-9_.-]+:[a-z0-9_./-]+$/u.test(canonical)
    ? canonical
    : null;
};

const parseMinecraftBlockMutationFootprint = (
  command: string,
): MinecraftBlockMutationFootprint | null => {
  const normalized = command.trim().replace(/^\/+/, "");
  const fill = normalized.match(
    /(?:^|[\s\S]*\brun\s+)fill\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(\S+)([\s\S]*)$/iu,
  );
  if (fill) {
    const trailingMode = fill[8].trim();
    if (trailingMode && !/^(?:destroy|keep|replace)$/iu.test(trailingMode)) {
      return null;
    }
    const expectedBlock = canonicalMinecraftBlockId(fill[7]);
    if (!expectedBlock) return null;
    return {
      from: { x: Number(fill[1]), y: Number(fill[2]), z: Number(fill[3]) },
      to: { x: Number(fill[4]), y: Number(fill[5]), z: Number(fill[6]) },
      expected_block: expectedBlock,
    };
  }
  const setBlock = normalized.match(
    /(?:^|[\s\S]*\brun\s+)setblock\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s+(\S+)([\s\S]*)$/iu,
  );
  if (!setBlock) return null;
  const trailingMode = setBlock[5].trim();
  if (trailingMode && !/^(?:destroy|keep|replace)$/iu.test(trailingMode)) {
    return null;
  }
  const expectedBlock = canonicalMinecraftBlockId(setBlock[4]);
  if (!expectedBlock) return null;
  const position = {
    x: Number(setBlock[1]),
    y: Number(setBlock[2]),
    z: Number(setBlock[3]),
  };
  return {
    from: position,
    to: position,
    expected_block: expectedBlock,
  };
};

const sameMinecraftPosition = (
  value: unknown,
  expected: MinecraftBlockPosition,
): boolean => {
  const position = readRecord(value);
  return Boolean(
    position &&
      Number(position.x) === expected.x &&
      Number(position.y) === expected.y &&
      Number(position.z) === expected.z,
  );
};

const isExactVerificationRequestForFootprint = (input: {
  request: RecordLike;
  footprint: MinecraftBlockMutationFootprint;
}): boolean => {
  if (
    requestCapability(input.request) !==
    HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
  ) {
    return false;
  }
  const args = requestArguments(input.request);
  const freshnessMs = Number(args.freshness_requirement_ms);
  return (
    readString(args.purpose) === "structure_verification" &&
    sameMinecraftPosition(args.verification_from, input.footprint.from) &&
    sameMinecraftPosition(args.verification_to, input.footprint.to) &&
    canonicalMinecraftBlockId(readString(args.expected_block) ?? "") ===
      input.footprint.expected_block &&
    Number.isInteger(freshnessMs) &&
    freshnessMs >= 1_000 &&
    freshnessMs <= 5_000
  );
};

export const buildMinecraftPostMutationVerificationRequest = (
  request: RecordLike,
): RecordLike | null => {
  const command = minecraftCommandText(request);
  const footprint = command
    ? parseMinecraftBlockMutationFootprint(command)
    : null;
  return footprint
    ? {
        capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        arguments: {
          target: "current_actor",
          horizontal_radius: 7,
          vertical_radius: 8,
          purpose: "structure_verification",
          verification_from: footprint.from,
          verification_to: footprint.to,
          expected_block: footprint.expected_block,
          freshness_requirement_ms: 5_000,
        },
      }
    : null;
};

const resultCapability = (
  result: HelixWorkstationGatewayCallResult,
): string | null =>
  readString(result.gateway_admission?.requested_capability) ??
  readString(result.capability_id);

const evidenceRefsForResult = (
  result: HelixWorkstationGatewayCallResult,
): string[] =>
  uniqueStrings([
    readString(readRecord(result.observation_packet)?.observation_ref),
    ...readArray(result.observation_packet?.produced_artifact_refs).map(
      readString,
    ),
    ...readArray(result.artifact_refs).map(readString),
  ]);

type MinecraftAgencyExecutedStep = {
  request: RecordLike;
  result: HelixWorkstationGatewayCallResult;
  resultIndex: number;
};

const alignMinecraftAgencyExecutedSteps = (input: {
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): MinecraftAgencyExecutedStep[] => {
  const steps: MinecraftAgencyExecutedStep[] = [];
  let resultCursor = 0;
  for (const request of input.priorRequests) {
    const capability = requestCapability(request);
    if (!capability) continue;
    const relativeIndex = input.gatewayCallResults
      .slice(resultCursor)
      .findIndex((result) => resultCapability(result) === capability);
    if (relativeIndex < 0) continue;
    const resultIndex = resultCursor + relativeIndex;
    steps.push({
      request,
      result: input.gatewayCallResults[resultIndex],
      resultIndex,
    });
    resultCursor = resultIndex + 1;
  }
  return steps;
};

const blockMutationFootprintForStep = (
  step: MinecraftAgencyExecutedStep,
): MinecraftBlockMutationFootprint | null => {
  if (step.result.ok !== true || !isStateChangingMinecraftCommand(step.request)) {
    return null;
  }
  const command = minecraftCommandText(step.request);
  return command ? parseMinecraftBlockMutationFootprint(command) : null;
};

const exactVerificationStepForMutation = (input: {
  mutation: MinecraftAgencyExecutedStep;
  steps: MinecraftAgencyExecutedStep[];
  requireAllMatch: boolean;
}): MinecraftAgencyExecutedStep | null => {
  const footprint = blockMutationFootprintForStep(input.mutation);
  if (!footprint) return null;
  return input.steps.find((step) => {
    if (
      step.resultIndex <= input.mutation.resultIndex ||
      !isExactVerificationRequestForFootprint({ request: step.request, footprint })
    ) {
      return false;
    }
    if (!input.requireAllMatch) return true;
    if (step.result.ok !== true) return false;
    const observation = readRecord(step.result.observation);
    const observationResult = readRecord(observation?.result);
    const verification = readRecord(
      observationResult?.target_geometry_verification,
    );
    return (
      readBoolean(verification?.complete) === true &&
      readBoolean(verification?.all_match) === true
    );
  }) ?? null;
};

export type MinecraftAgencyCompoundCoverageResolution = {
  requirement_id: string;
  status: "answered";
  reason: string;
  evidence_refs: string[];
};

/**
 * Projects only sequence facts that are proven by successful, ordered gateway
 * observations. This lets a terminal answer describe the useful outcome
 * naturally without having to repeat procedural phrases such as "inspect
 * first" merely to satisfy a lexical coverage heuristic.
 */
export const buildMinecraftAgencyCompoundCoverageResolutions = (input: {
  compoundContract?: RecordLike | null;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): MinecraftAgencyCompoundCoverageResolution[] => {
  const requirements = readArray(input.compoundContract?.requirements)
    .map(readRecord)
    .filter((entry): entry is RecordLike => Boolean(entry));
  if (requirements.length === 0) return [];

  const steps = alignMinecraftAgencyExecutedSteps(input);
  const sequenceSteps = steps.filter(
    (step) =>
      requestCapability(step.request) ===
      HELIX_MINECRAFT_PLAYER_EXECUTE_SEQUENCE_CAPABILITY,
  );
  const successfulSequenceNodes = sequenceSteps.flatMap((step) => {
    const result = readRecord(readRecord(step.result.observation)?.result);
    const measurements = readRecord(result?.verified_terminal_measurements);
    const nodeOutcomes = readRecord(measurements?.node_outcomes);
    const nodes = readArray(requestArguments(step.request).nodes)
      .map(readRecord)
      .filter((node): node is RecordLike => Boolean(node));
    return nodes
      .filter(
        (node) =>
          readString(node.node_id) &&
          readString(nodeOutcomes?.[readString(node.node_id)!]) === "succeeded",
      )
      .map((node) => ({ step, node }));
  });
  const successfulSequenceActions = successfulSequenceNodes
    .map((entry) => ({ ...entry, action: readRecord(entry.node.action) }))
    .filter(
      (entry): entry is typeof entry & { action: RecordLike } =>
        Boolean(entry.action),
    );
  const successfulInputSegments = successfulSequenceNodes.filter(
    (entry) => readString(entry.node.node_kind) === "input_segment",
  );
  const satisfiedCheckpointIds = new Set(
    sequenceSteps.flatMap((step) => {
      const result = readRecord(readRecord(step.result.observation)?.result);
      const measurements = readRecord(result?.verified_terminal_measurements);
      return readArray(measurements?.satisfied_checkpoint_ids)
        .map(readString)
        .filter((value): value is string => Boolean(value));
    }),
  );
  const requiredCheckpointIds = new Set(
    sequenceSteps.flatMap((step) =>
      readArray(requestArguments(step.request).required_checkpoint_ids)
        .map(readString)
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const everyObservedCheckpointSatisfied =
    requiredCheckpointIds.size > 0 &&
    Array.from(requiredCheckpointIds).every((id) =>
      satisfiedCheckpointIds.has(id),
    );
  const controlsReleasedSteps = sequenceSteps.filter((step) => {
    const result = readRecord(readRecord(step.result.observation)?.result);
    return readBoolean(result?.controls_released) === true;
  });
  const successfulActorStatus = steps.find(
    (step) =>
      step.result.ok === true &&
      requestCapability(step.request) ===
        HELIX_MINECRAFT_ACTOR_STATUS_READ_CAPABILITY,
  );
  const successfulMutation = steps.find(
    (step) => step.result.ok === true && isStateChangingMinecraftCommand(step.request),
  );

  const successfulBlockMutations = steps.filter((step) =>
    Boolean(blockMutationFootprintForStep(step)),
  );

  const successfulPreInspection = steps.find(
    (step) =>
      step.result.ok === true &&
      requestCapability(step.request) ===
        HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY &&
      successfulMutation && step.resultIndex < successfulMutation.resultIndex,
  );
  const successfulPreCheckpoint = steps.find((step) => {
    const command = minecraftCommandText(step.request);
    return Boolean(
      step.result.ok === true &&
        command &&
        isCheckpointCaptureCommand(command) &&
        successfulMutation && step.resultIndex < successfulMutation.resultIndex,
    );
  });
  const successfulPostVerifications = successfulBlockMutations.map(
    (mutation) =>
      exactVerificationStepForMutation({
        mutation,
        steps,
        requireAllMatch: true,
      }),
  );
  const allBlockMutationsVerified =
    successfulBlockMutations.length > 0 &&
    successfulPostVerifications.every(Boolean);

  return requirements.flatMap((requirement) => {
    const requirementId = readString(requirement.id);
    const text = readString(requirement.text) ?? "";
    if (!requirementId) return [];
    if (
      successfulActorStatus &&
      /\binspect\b/iu.test(text) &&
      /\b(?:current\s+player|player\s+state|current\s+state)\b/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "A successful current-turn actor-status observation inspected the current player state.",
        evidence_refs: evidenceRefsForResult(successfulActorStatus.result),
      }];
    }
    if (/\b(?:look|sprint|jump)\b/iu.test(text)) {
      const namedActions = ["look", "sprint", "jump"].filter((name) =>
        new RegExp(`\\b${name}\\b`, "iu").test(text),
      );
      const supportingSegments = successfulInputSegments.filter((entry) => {
        const controls = readRecord(entry.node.controls);
        return namedActions.every((name) =>
          name === "look"
            ? Boolean(readRecord(controls?.look_delta))
            : name === "sprint"
              ? readBoolean(controls?.sprint) === true
              : readString(controls?.jump) === "pulse",
        );
      });
      if (supportingSegments.length > 0) {
        return [{
          requirement_id: requirementId,
          status: "answered" as const,
          reason:
            "A verified successful input segment performed every named bounded look/sprint/jump control.",
          evidence_refs: uniqueStrings(
            supportingSegments.flatMap((entry) =>
              evidenceRefsForResult(entry.step.result),
            ),
          ),
        }];
      }
    }
    const actionRequirement = [
      { pattern: /\binteract\b/iu, actionKind: "interact" },
      { pattern: /\bequip\b/iu, actionKind: "equip" },
      { pattern: /\bcraft\b/iu, actionKind: "craft" },
    ].find((candidate) => candidate.pattern.test(text));
    if (actionRequirement) {
      const supportingActions = successfulSequenceActions.filter(
        (entry) =>
          readString(entry.action.action_kind) ===
          actionRequirement.actionKind,
      );
      if (supportingActions.length > 0) {
        return [{
          requirement_id: requirementId,
          status: "answered" as const,
          reason: `A current-turn sequence observation proves the ${actionRequirement.actionKind} node succeeded even though a later node in its enclosing sequence failed.`,
          evidence_refs: uniqueStrings(
            supportingActions.flatMap((entry) =>
              evidenceRefsForResult(entry.step.result),
            ),
          ),
        }];
      }
    }
    if (
      everyObservedCheckpointSatisfied &&
      /\b(?:verify|verified|confirm)\b/iu.test(text) &&
      /\b(?:every|all)\b[^.!?;\n]{0,40}\bcheckpoint/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "The union of current-turn sequence measurements satisfies every checkpoint identity required by the provider-authored repair attempts.",
        evidence_refs: uniqueStrings(
          sequenceSteps.flatMap((step) => evidenceRefsForResult(step.result)),
        ),
      }];
    }
    if (
      controlsReleasedSteps.length > 0 &&
      /\brelease\b[^.!?;\n]{0,40}\bcontrols?\b/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "The native sequence runtime reported controls_released after every observed terminal path.",
        evidence_refs: uniqueStrings(
          controlsReleasedSteps.flatMap((step) =>
            evidenceRefsForResult(step.result),
          ),
        ),
      }];
    }
    if (
      successfulMutation &&
      successfulPreInspection &&
      /\binspect\b/iu.test(text) &&
      /\b(?:first|before)\b/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "A successful current-turn Minecraft spatial inspection observation preceded the successful state-changing command observation.",
        evidence_refs: uniqueStrings([
          ...evidenceRefsForResult(successfulPreInspection.result),
          ...evidenceRefsForResult(successfulMutation.result),
        ]),
      }];
    }
    if (
      successfulMutation &&
      successfulPreCheckpoint &&
      /\bcheckpoint\b/iu.test(text) &&
      /\b(?:before|without|until)\b/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "A successful current-turn rollback checkpoint capture observation preceded the successful state-changing command observation.",
        evidence_refs: uniqueStrings([
          ...evidenceRefsForResult(successfulPreCheckpoint.result),
          ...evidenceRefsForResult(successfulMutation.result),
        ]),
      }];
    }
    if (
      allBlockMutationsVerified &&
      /\b(?:re-?inspect|verify|confirm)\b/iu.test(text) &&
      /\b(?:after|finished|footprint|result|changing|change)\b/iu.test(text)
    ) {
      return [{
        requirement_id: requirementId,
        status: "answered" as const,
        reason:
          "A fresh exact-footprint Minecraft structure verification observation followed the successful mutation and confirmed that every requested cell matched the expected block.",
        evidence_refs: uniqueStrings([
          ...successfulBlockMutations.flatMap((step) =>
            evidenceRefsForResult(step.result),
          ),
          ...successfulPostVerifications.flatMap((step) =>
            step ? evidenceRefsForResult(step.result) : [],
          ),
        ]),
      }];
    }
    return [];
  });
};

export const requiresCurrentTurnCheckpointBeforeMinecraftMutation = (
  prompt: string,
): boolean => {
  // Ordering policy must be derived from the user's operative prose, not from
  // a quoted example or screen-visible instruction. The wider workstation
  // admission layer already suppresses contextual tool mentions; keeping the
  // same boundary here prevents a quoted safety recipe from manufacturing a
  // recovery tool request if a malformed provider candidate reaches this
  // final sequence guard.
  const operativePrompt = prompt.replace(
    /"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/gu,
    " ",
  );
  const contextualCheckpointClause =
    /\b(?:if|when|later|eventually|hypothetically|in\s+the\s+future|tomorrow|previously|earlier|historically|yesterday|last\s+time)\b[^.!?;\n]{0,140}\b(?:capture|captured|create|created|take|took|save|saved)\b[^.!?;\n]{0,100}\b(?:rollback\s+|bounded\s+|exact\s+bounded\s+)?checkpoint\b/iu.test(
      operativePrompt,
    ) ||
    /\b(?:screen|page|button|label|ui|text|sentence|phrase|example|documentation|transcript)\b[^.!?;\n]{0,120}\b(?:says|shows|reads|contains|mentions|describes)\b[^.!?;\n]{0,140}\bcheckpoint\b/iu.test(
      operativePrompt,
    ) ||
    /(?:^|[.!?;]\s*)\b(?:explain|describe|quote|summari[sz]e|discuss)\b[^.!?;\n]{0,180}\bcheckpoint\b/iu.test(
      operativePrompt,
    );
  if (contextualCheckpointClause) return false;

  return (
    /\b(?:capture|create|take|save)\b[\s\S]{0,100}\b(?:rollback\s+|bounded\s+|exact\s+bounded\s+)?checkpoint\b[\s\S]{0,120}\bbefore\b[\s\S]{0,100}\b(?:chang|mutat|build|place|set|fill|ignite|light|break|remove)/iu.test(
      operativePrompt,
    ) ||
    /\b(?:capture|create|take|save)\b[\s\S]{0,100}\b(?:rollback\s+|bounded\s+|exact\s+bounded\s+)?checkpoint\b[^.!?\n]{0,160}(?:;|\bthen\b|\bfollowed\s+by\b)[^.!?\n]{0,100}\b(?:chang|mutat|build|place|set|fill|ignite|light|break|remove)/iu.test(
      operativePrompt,
    ) ||
    /\b(?:do\s+not|don't|never)\b[\s\S]{0,80}\b(?:chang|mutat|build|place|set|fill|ignite|light|break|remove)[\s\S]{0,100}\b(?:without|until)\b[\s\S]{0,80}\bcheckpoint\b/iu.test(
      operativePrompt,
    )
  );
};

const successfulCheckpointCaptureExists = (input: {
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): boolean => {
  const commandResultStatuses = input.gatewayCallResults
    .filter(
      (result) =>
        (result.gateway_admission.requested_capability ||
          result.capability_id) === HELIX_MINECRAFT_COMMAND_CAPABILITY,
    )
    .map((result) => result.ok === true);
  let commandResultIndex = 0;
  for (const request of input.priorRequests) {
    const command = minecraftCommandText(request);
    if (!command) continue;
    const succeeded = commandResultStatuses[commandResultIndex] === true;
    commandResultIndex += 1;
    if (succeeded && isCheckpointCaptureCommand(command)) return true;
  }
  return false;
};

const contractInspectBeforeMinecraftCommandRequest = (
  contract: RecordLike | null | undefined,
): RecordLike | null => {
  const subgoals = readArray(contract?.subgoals)
    .map(readRecord)
    .filter(
      (subgoal): subgoal is RecordLike =>
        Boolean(subgoal),
    )
    .sort((left, right) => Number(left.order) - Number(right.order));
  const commandIndex = subgoals.findIndex(
    (subgoal) =>
      readString(
        subgoal.requested_capability ?? subgoal.runtime_capability,
      ) === HELIX_MINECRAFT_COMMAND_CAPABILITY,
  );
  if (commandIndex < 0) return null;
  const inspectSubgoal = subgoals
    .slice(0, commandIndex)
    .reverse()
    .find(
      (subgoal) =>
        readString(
          subgoal.requested_capability ?? subgoal.runtime_capability,
        ) === HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
    );
  if (!inspectSubgoal) return null;
  const argsHint = readRecord(inspectSubgoal.args_hint) ?? {};
  return {
    capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
    arguments: { ...argsHint },
  };
};

const successfulRequiredSpatialInspectionExists = (input: {
  requiredRequest: RecordLike;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): boolean => {
  const requiredArgs = requestArguments(input.requiredRequest);
  const requiredPurpose = readString(requiredArgs.purpose);
  return alignMinecraftAgencyExecutedSteps(input).some((step) => {
    if (
      step.result.ok !== true ||
      requestCapability(step.request) !==
        HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
    ) {
      return false;
    }
    const executedPurpose = readString(requestArguments(step.request).purpose);
    return !requiredPurpose || executedPurpose === requiredPurpose;
  });
};

const MINECRAFT_PLAYER_ACTION_CAPABILITY_SET = new Set<string>(
  HELIX_MINECRAFT_PLAYER_ACTION_CAPABILITY_IDS,
);

const promptDeclaresOrderedMinecraftPlayerProcedure = (
  prompt: string,
): boolean => {
  const operativePrompt = prompt.replace(
    /"[^"\n]*"|'[^'\n]*'|`[^`\n]*`/gu,
    " ",
  );
  return (
    isAffirmativeMinecraftPlayerEmbodimentActionPrompt(prompt) &&
    /\b(?:first|next|then|before|after|finally|followed\s+by)\b/iu.test(
      operativePrompt,
    )
  );
};

const orderedMandatoryPlayerSubgoals = (
  contract: RecordLike | null | undefined,
): RecordLike[] =>
  readArray(contract?.subgoals)
    .map(readRecord)
    .filter(
      (subgoal): subgoal is RecordLike =>
        Boolean(subgoal) && subgoal.mandatory !== false,
    )
    .sort((left, right) => Number(left.order) - Number(right.order));

const nextUnsatisfiedOrderedPlayerSubgoal = (input: {
  contract: RecordLike | null | undefined;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
}): RecordLike | null => {
  const ordered = orderedMandatoryPlayerSubgoals(input.contract);
  if (ordered.length < 2) return null;
  const executed = alignMinecraftAgencyExecutedSteps({
    priorRequests: input.priorRequests,
    gatewayCallResults: input.gatewayCallResults,
  }).filter((step) => step.result.ok === true);
  let cursor = 0;
  for (const step of executed) {
    const expected = ordered[cursor];
    if (!expected) break;
    const expectedCapability = readString(
      expected.requested_capability ?? expected.runtime_capability,
    );
    if (
      expectedCapability &&
      requestCapability(step.request) === expectedCapability
    ) {
      cursor += 1;
    }
  }
  return ordered[cursor] ?? null;
};

const evaluateOrderedMinecraftPlayerProcedure = (input: {
  prompt: string;
  candidate: RecordLike;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  compoundCapabilityContract?: RecordLike | null;
}): MinecraftAgencySequenceDecision | null => {
  const candidateCapability = requestCapability(input.candidate);
  if (
    !candidateCapability ||
    !MINECRAFT_PLAYER_ACTION_CAPABILITY_SET.has(candidateCapability) ||
    !promptDeclaresOrderedMinecraftPlayerProcedure(input.prompt)
  ) {
    return null;
  }
  const ordered = orderedMandatoryPlayerSubgoals(
    input.compoundCapabilityContract,
  );
  const next = nextUnsatisfiedOrderedPlayerSubgoal({
    contract: input.compoundCapabilityContract,
    priorRequests: input.priorRequests,
    gatewayCallResults: input.gatewayCallResults,
  });
  const nextCapability = readString(
    next?.requested_capability ?? next?.runtime_capability,
  );
  if (!next || !nextCapability || nextCapability === candidateCapability) {
    return null;
  }
  const nextIndex = ordered.indexOf(next);
  const proposedLaterIndex = ordered.findIndex(
    (subgoal, index) =>
      index > nextIndex &&
      readString(
        subgoal.requested_capability ?? subgoal.runtime_capability,
      ) === candidateCapability,
  );
  if (proposedLaterIndex < 0) return null;
  const nextSubgoalId =
    readString(next.subgoal_id) ?? `ordered_subgoal:${nextIndex + 1}`;
  return {
    admitted: false,
    reason:
      `minecraft_ordered_procedure_mismatch: the original request declares an ordered Player Embodiment procedure. ` +
      `The next unsatisfied ordered step is ${nextCapability} (${nextSubgoalId}), but Codex proposed later step ${candidateCapability} first. ` +
      "No tool ran. Re-enter this exact failed invariant to Codex so it can select a different admitted capability request that preserves the user-declared order, or return an accurate typed failure.",
    recovery_lane_request: null,
  };
};

const guardedMovementPolicyForCandidate = (input: {
  contract?: RecordLike | null;
  capability: string | null;
}): RecordLike | null => {
  if (input.capability !== HELIX_MINECRAFT_PLAYER_WALK_CAPABILITY) return null;
  const subgoal = readArray(input.contract?.subgoals)
    .map(readRecord)
    .find(
      (entry) =>
        readString(
          entry?.requested_capability ?? entry?.runtime_capability,
        ) === input.capability,
    );
  const policy = readRecord(subgoal?.guarded_noop_policy);
  return readString(policy?.required_purpose) === "movement_safety" &&
    readString(policy?.candidate_field) === "walk_step_candidates"
    ? policy
    : null;
};

const minecraftObservationResult = (
  gatewayResult: HelixWorkstationGatewayCallResult,
): RecordLike | null => {
  const observation = readRecord(gatewayResult.observation);
  const result = readRecord(observation?.result);
  const nestedObservation = readRecord(observation?.observation);
  return (
    readRecord(result?.details) ??
    result ??
    readRecord(readRecord(nestedObservation?.result)?.details) ??
    readRecord(nestedObservation?.result)
  );
};

const evaluateGuardedMinecraftWalk = (input: {
  candidate: RecordLike;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  policy: RecordLike;
}): MinecraftAgencySequenceDecision | null => {
  const acceptedPurposes = readArray(input.policy.accepted_observation_purposes)
    .map(readString)
    .filter((entry): entry is string => Boolean(entry));
  const completenessField = readString(input.policy.completeness_field);
  const omittedCountField = readString(input.policy.omitted_count_field);
  const candidateField = readString(input.policy.candidate_field);
  if (
    acceptedPurposes.length !== 1 ||
    acceptedPurposes[0] !== "movement_safety" ||
    completenessField !== "walk_step_candidates_complete" ||
    omittedCountField !== "omitted_walk_step_candidate_count" ||
    candidateField !== "walk_step_candidates"
  ) {
    return null;
  }
  const spatialStep = [...alignMinecraftAgencyExecutedSteps(input)]
    .reverse()
    .find(
      (step) =>
        step.result.ok === true &&
        requestCapability(step.request) ===
          HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY &&
        readString(requestArguments(step.request).purpose) ===
          "movement_safety",
    );
  const result = spatialStep
    ? minecraftObservationResult(spatialStep.result)
    : null;
  if (
    !result ||
    readString(result.purpose) !== "movement_safety" ||
    result.walk_step_candidates_complete !== true ||
    Number(result.omitted_walk_step_candidate_count) !== 0 ||
    !Array.isArray(result.walk_step_candidates)
  ) {
    return {
      admitted: false,
      reason:
        "minecraft_movement_safety_evidence_missing: the user made movement conditional on fresh geometry, but no complete current-turn movement_safety candidate set has re-entered. No player action ran. Inspect movement_safety next, then let Codex choose only from a verified safe relative direction.",
      recovery_lane_request: {
        capability: HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY,
        arguments: {
          target: "current_actor",
          horizontal_radius: 3,
          vertical_radius: 3,
          purpose: "movement_safety",
          freshness_requirement_ms: 5_000,
        },
      },
    };
  }
  const safeCandidates = readArray(result.walk_step_candidates)
    .map(readRecord)
    .filter(
      (entry): entry is RecordLike =>
        Boolean(
          entry?.safe_candidate === true &&
            entry.evidence_complete === true &&
            readString(entry.relative_direction),
        ),
    );
  if (safeCandidates.length === 0) {
    return {
      admitted: false,
      reason:
        "minecraft_guarded_noop_satisfied:no_verified_safe_movement_candidate. The complete current-turn movement survey contains no safe one-block direction, so the user's explicit do-not-move condition applies. No player action ran; Codex should explain the unsafe or missing candidate evidence.",
      recovery_lane_request: null,
    };
  }
  const requestedDirection = readString(
    requestArguments(input.candidate).direction,
  );
  if (
    !requestedDirection ||
    !safeCandidates.some(
      (entry) => readString(entry.relative_direction) === requestedDirection,
    )
  ) {
    return {
      admitted: false,
      reason:
        "minecraft_movement_direction_not_evidenced_safe: the proposed Player Embodiment walk direction does not match any safe relative_direction in the complete current-turn movement_safety observation. No player action ran. Codex must choose one exact evidenced safe relative direction or answer without moving.",
      recovery_lane_request: null,
    };
  }
  return null;
};

export type MinecraftAgencySequenceDecision = {
  admitted: boolean;
  reason: string | null;
  recovery_lane_request: RecordLike | null;
};

/**
 * Enforces a user-declared causal checkpoint invariant without selecting or
 * manufacturing a command. The runtime model still chooses the next admitted
 * capability; Helix only blocks a state-changing command until a successful
 * current-turn checkpoint observation has re-entered.
 */
export const evaluateMinecraftAgencySequence = (input: {
  prompt: string;
  candidate: RecordLike;
  priorRequests: RecordLike[];
  gatewayCallResults: HelixWorkstationGatewayCallResult[];
  compoundCapabilityContract?: RecordLike | null;
}): MinecraftAgencySequenceDecision => {
  const requestedExecutionPlane = resolveMinecraftExecutionPlaneConstraint(
    input.prompt,
  );
  const candidateCapability = requestCapability(input.candidate);
  if (
    requestedExecutionPlane === "player_embodiment" &&
    candidateCapability === HELIX_MINECRAFT_COMMAND_CAPABILITY &&
    isStateChangingMinecraftCommand(input.candidate)
  ) {
    return {
      admitted: false,
      reason:
        "minecraft_execution_plane_mismatch: the user explicitly required the Player Embodiment plane, but the proposed state-changing Minecraft command belongs to the World Authority plane. A command-side teleport or mutation is not equivalent to walking, jumping, interacting, or navigating through the paired player client. No tool ran. Codex must choose a different admitted com.casimirbot.minecraft.player.* capability or return an accurate typed capability-unavailable reason.",
      recovery_lane_request: null,
    };
  }
  if (
    requestedExecutionPlane === "world_authority" &&
    candidateCapability &&
    MINECRAFT_PLAYER_ACTION_CAPABILITY_SET.has(candidateCapability)
  ) {
    return {
      admitted: false,
      reason:
        "minecraft_execution_plane_mismatch: the user explicitly required the World Authority plane, but the proposed capability belongs to the Player Embodiment plane. Player simulation is not equivalent to executing the requested server command. No tool ran. Codex must choose an admitted World Authority capability or return an accurate typed capability-unavailable reason.",
      recovery_lane_request: null,
    };
  }
  const orderedPlayerProcedureDecision =
    evaluateOrderedMinecraftPlayerProcedure(input);
  if (orderedPlayerProcedureDecision) {
    return orderedPlayerProcedureDecision;
  }
  const guardedMovementPolicy = guardedMovementPolicyForCandidate({
    contract: input.compoundCapabilityContract,
    capability: candidateCapability,
  });
  if (guardedMovementPolicy) {
    const guardedMovementDecision = evaluateGuardedMinecraftWalk({
      candidate: input.candidate,
      priorRequests: input.priorRequests,
      gatewayCallResults: input.gatewayCallResults,
      policy: guardedMovementPolicy,
    });
    if (guardedMovementDecision) return guardedMovementDecision;
  }
  const candidateCommand = minecraftCommandText(input.candidate);
  if (
    requestCapability(input.candidate) === HELIX_MINECRAFT_COMMAND_CAPABILITY &&
    candidateCommand &&
    (containsLikelyMinecraftCommandBatch(candidateCommand) ||
      (referencesCheckpointCommand(candidateCommand) &&
        !/(?:^|\brun\s+)helixgame\s+checkpoint\s+(?:capture(?:_box)?|restore|discard|status)\b/iu.test(
          candidateCommand.trim().replace(/^\/+/, ""),
        )))
  ) {
    return {
      admitted: false,
      reason:
        "The proposed Minecraft request is not one exact installed checkpoint command. Minecraft command capability calls must execute one command at a time and cannot join checkpoint and mutation commands. Inspect the live helixgame checkpoint subtree, then let Codex issue one exact checkpoint command with the required category and effect metadata.",
      recovery_lane_request: {
        capability: HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY,
        arguments: {
          path_prefix: "helixgame checkpoint",
          limit: 64,
        },
      },
    };
  }
  const requiredPreInspection = contractInspectBeforeMinecraftCommandRequest(
    input.compoundCapabilityContract,
  );
  if (
    requiredPreInspection &&
    requestCapability(input.candidate) ===
      HELIX_MINECRAFT_COMMAND_CAPABILITY &&
    isStateChangingMinecraftCommand(input.candidate) &&
    !successfulRequiredSpatialInspectionExists({
      requiredRequest: requiredPreInspection,
      priorRequests: input.priorRequests,
      gatewayCallResults: input.gatewayCallResults,
    })
  ) {
    return {
      admitted: false,
      reason:
        "The committed Minecraft action route requires a successful current-turn spatial inspection observation before any state-changing command. That observation has not re-entered provider reasoning yet. Run the committed inspection next, then let Codex decide from the fresh evidence whether the requested action remains appropriate.",
      recovery_lane_request: requiredPreInspection,
    };
  }

  if (
    requiresCurrentTurnCheckpointBeforeMinecraftMutation(input.prompt) &&
    requestCapability(input.candidate) ===
      HELIX_MINECRAFT_COMMAND_CAPABILITY &&
    isStateChangingMinecraftCommand(input.candidate) &&
    !successfulCheckpointCaptureExists({
      priorRequests: input.priorRequests,
      gatewayCallResults: input.gatewayCallResults,
    })
  ) {
    return {
      admitted: false,
      reason:
        "The original request requires a rollback checkpoint before any state-changing Minecraft command, but no successful current-turn checkpoint capture observation has re-entered yet. A Minecraft save such as save-all is not a rollback checkpoint. Inspect the installed helixgame checkpoint command subtree next, then select and execute its checkpoint capture command before retrying the requested mutation.",
      recovery_lane_request: {
        capability: HELIX_MINECRAFT_COMMAND_CATALOG_CAPABILITY,
        arguments: {
          path_prefix: "helixgame checkpoint",
          limit: 64,
        },
      },
    };
  }

  if (
    !/\b(?:re-?inspect|verify|confirm|inspect\s+the\s+finished)\b/iu.test(
      input.prompt,
    ) ||
    requestCapability(input.candidate) !==
      HELIX_MINECRAFT_SPATIAL_REGION_INSPECT_CAPABILITY
  ) {
    return { admitted: true, reason: null, recovery_lane_request: null };
  }
  const executedSteps = alignMinecraftAgencyExecutedSteps(input);
  const unverifiedMutation = [...executedSteps]
    .reverse()
    .find((step) => {
      if (!blockMutationFootprintForStep(step)) return false;
      return !exactVerificationStepForMutation({
        mutation: step,
        steps: executedSteps,
        requireAllMatch: false,
      });
    });
  if (!unverifiedMutation) {
    return { admitted: true, reason: null, recovery_lane_request: null };
  }
  const recoveryLaneRequest =
    buildMinecraftPostMutationVerificationRequest(unverifiedMutation.request);
  const mutationCommand = minecraftCommandText(unverifiedMutation.request);
  const footprint = mutationCommand
    ? parseMinecraftBlockMutationFootprint(mutationCommand)
    : null;
  if (!recoveryLaneRequest || !footprint) {
    return { admitted: true, reason: null, recovery_lane_request: null };
  }
  if (
    isExactVerificationRequestForFootprint({
      request: input.candidate,
      footprint,
    })
  ) {
    return { admitted: true, reason: null, recovery_lane_request: null };
  }
  return {
    admitted: false,
    reason:
      "A successful bounded Minecraft block mutation now requires fresh post-action evidence for the exact mutated footprint. A build_planning or structure_planning survey searches for empty space and cannot verify occupied result blocks. Request structure_verification with the mutation's exact inclusive endpoints, expected block, and a freshness ceiling of at most 5000 ms.",
    recovery_lane_request: recoveryLaneRequest,
  };
};
