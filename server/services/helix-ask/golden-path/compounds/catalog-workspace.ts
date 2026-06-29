import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilityCatalogObservation } from "../capabilities/capability-catalog";
import { buildGoldenPathWorkspaceStatusObservation } from "../capabilities/workspace-status";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathCatalogWorkspaceCompoundRequested,
} from "../compound-contract";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
  HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readNumber,
  readRecord,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathCatalogWorkspaceCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["capability_registry", "workspace_os_status_observation"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
    observation_kind: "capability_registry",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
    observation_kind: "workspace_os_status_observation",
  },
] as const;
export const isRequested = isHelixAskGoldenPathCatalogWorkspaceCompoundRequested;
export const buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathCatalogWorkspaceCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-catalog-workspace",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const catalogObservationArtifactId = `${turnId}:capability_registry`;
  const workspaceObservation = buildGoldenPathWorkspaceStatusObservation({ body: args.body, turnId, createdAtMs });
  const workspaceObservationArtifactId =
    readString(workspaceObservation.artifact_id) ?? `${turnId}:workspace_os_status_observation`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const catalogObservation = buildGoldenPathCapabilityCatalogObservation();
  const counts = readRecord(workspaceObservation.capability_counts) ?? {};
  const workspaceSummary = `Workspace status: ${readNumber(counts.total) ?? 0} total, ${readNumber(counts.available) ?? 0} available, ${readNumber(counts.degraded) ?? 0} degraded, ${readNumber(counts.blocked) ?? 0} blocked, ${readNumber(counts.error) ?? 0} error, ${readNumber(counts.unknown) ?? 0} unknown.`;
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "capability_catalog",
        requestedCapability: HELIX_GOLDEN_PATH_CAPABILITY_CATALOG_CAPABILITY,
        observationKind: "capability_registry",
        observationRef: catalogObservationArtifactId,
      },
      {
        subgoalIdSuffix: "workspace_status",
        requestedCapability: HELIX_GOLDEN_PATH_WORKSPACE_OS_STATUS_CAPABILITY,
        observationKind: "workspace_os_status_observation",
        observationRef: workspaceObservationArtifactId,
      },
    ],
  });
  const answerText = [
    "Compound capability/workspace synthesis completed.",
    "Capability catalog observation completed.",
    workspaceSummary,
  ].join("\n");
  return buildGoldenPathCompoundSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalResultId,
    terminalArtifactId,
    requiredTerminalKind,
    classifierReasons: ["explicit_catalog_workspace_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [catalogObservationArtifactId, workspaceObservationArtifactId],
    status: "catalog_workspace_compound",
    route: "golden_path_runtime / catalog_workspace_compound",
    observedArtifactRef: catalogObservationArtifactId,
    requiredObservationKinds,
    observationFields: {
      capability_registry: catalogObservation,
      workspace_os_status_observation: workspaceObservation,
    },
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: catalogObservationArtifactId,
            kind: "capability_registry",
            terminalEligible: false,
            payload: catalogObservation,
          },
          {
            artifactId: workspaceObservationArtifactId,
            kind: "workspace_os_status_observation",
            terminalEligible: false,
            payload: workspaceObservation,
          },
        ],
      }),
    compoundCapabilityContract,
  });
};
export const buildPayload = buildHelixAskGoldenPathCatalogWorkspaceCompoundPayload;

