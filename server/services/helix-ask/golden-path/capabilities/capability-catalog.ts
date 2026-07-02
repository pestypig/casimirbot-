import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilitySuccessPayload } from "../capability-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
  HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
  HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
  HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  readHelixAskGoldenPathTurnContext,
  readStringArray,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathCapabilityCatalogDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathCapabilityCatalogRequested = (body: RecordLike): boolean => {
  return isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY]);
};

export const buildGoldenPathCapabilityCatalogObservation = (): RecordLike => ({
  schema: "helix.capability_registry.v1",
  capability_key: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  available_capabilities: [
    HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    HELIX_GOLDEN_PATH_SCHOLARLY_RESEARCH_LOOKUP_CAPABILITY,
    HELIX_GOLDEN_PATH_INTERNET_SEARCH_WEB_RESEARCH_CAPABILITY,
    HELIX_GOLDEN_PATH_REFLECT_STAGE_PLAY_CONTEXT_CAPABILITY,
    HELIX_GOLDEN_PATH_CIVILIZATION_BOUNDS_REFLECTION_CAPABILITY,
    HELIX_GOLDEN_PATH_MORAL_GRAPH_REFLECTION_CAPABILITY,
  ],
  assistant_answer: false,
  raw_content_included: false,
});

export const capabilityCatalogSummaryText = (observation: RecordLike): string => {
  const capabilities = readStringArray(observation.available_capabilities);
  const capabilityList = capabilities.length ? capabilities.join(", ") : "no capabilities reported";
  return `Capability catalog inspection completed. Available golden-path capabilities: ${capabilityList}.`;
};

export const buildHelixAskGoldenPathCapabilityCatalogPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCapabilityCatalogDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-capability-catalog",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const observationArtifactId = `${turnId}:capability_registry`;
  const terminalArtifactId = `${turnId}:capability_help_summary`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "capability_help_summary";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const answerText = capabilityCatalogSummaryText(catalogObservation);
  return buildGoldenPathCapabilitySuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind: "capability_catalog_runtime",
    sourceTarget: "capability_catalog",
    family: "capability_catalog",
    classifierReasons: ["explicit_capability_catalog_request"],
    allowsWorkspaceContext: false,
    requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    observedArtifactKind: "capability_registry",
    observationPayload: catalogObservation,
    terminalPayloadField: "capability_help_summary",
    terminalPayloadSchema: "helix.capability_help_summary.v1",
    answerText,
    status: "capability_catalog",
    route: "golden_path_runtime / capability_catalog",
    requiredObservationKinds,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};


export const requiredObservationKinds = ["capability_registry"] as const;
export const requiredTerminalKinds = ["capability_help_summary"] as const;
export const isRequested = isHelixAskGoldenPathCapabilityCatalogRequested;
export const buildPayload = buildHelixAskGoldenPathCapabilityCatalogPayload;
