import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathCompoundCapabilityContract,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  type RecordLike,
} from "../core";
import type { HelixAskGoldenPathRuntimeDependencies } from "../runtime-dependencies";
import {
  goldenPathItineraryAdapters,
  type GoldenPathItineraryObservation,
} from "./capability-adapters";

export type HelixAskGoldenPathCompoundItineraryDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const requiredObservationKinds = ["compound_subgoal_observations"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;

const selectedItineraryAdapters = (body: RecordLike) =>
  goldenPathItineraryAdapters
    .filter((adapter) => adapter.detectIntent(body))
    .sort((left, right) => left.order - right.order);

export const isRequested = (body: RecordLike): boolean => selectedItineraryAdapters(body).length >= 3;

const observationFieldsFor = (observations: readonly GoldenPathItineraryObservation[]): RecordLike =>
  observations.reduce<RecordLike>((fields, observation) => {
    fields[observation.observationKind] = observation.payload;
    return fields;
  }, {});

const supportRefsFor = (observations: readonly GoldenPathItineraryObservation[]): string[] =>
  observations.map((observation) => observation.observationRef);

const workstationActionsFor = (observations: readonly GoldenPathItineraryObservation[]): RecordLike[] =>
  observations.flatMap((observation) => [...(observation.workstationActions ?? [])]);

const answerTextFor = (observations: readonly GoldenPathItineraryObservation[]): string =>
  [
    "Compound evidence synthesis completed.",
    ...observations.map((observation) => observation.summaryLine).filter(Boolean),
    "Supported answer boundary: the current observations can support diagnostic framing, source-backed facts, and explicit scalar calculations.",
    "They do not by themselves prove physical viability, propulsion, transport, implementation readiness, or uncited scholarly corroboration.",
  ].join("\n");

export const buildPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathRuntimeDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-compound-itinerary",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const adapters = selectedItineraryAdapters(args.body);
  const observations: GoldenPathItineraryObservation[] = [];

  for (const adapter of adapters) {
    const result = adapter.buildObservation({
      body: args.body,
      turn: { turnId, createdAtMs, promptText },
      priorObservations: observations,
    });
    if (!result.ok) {
      return buildGoldenPathCompoundTypedFailurePayload({
        turnId,
        traceId,
        sessionId,
        threadId,
        promptText,
        createdAtMs,
        routeGateArtifactId,
        terminalResultId,
        requiredTerminalKind,
        classifierReasons: ["explicit_compound_itinerary_request"],
        hashGoalFrame: deps.hashGoalFrame,
        status: "compound_itinerary_failed",
        route: "golden_path_runtime / compound_itinerary",
        requiredObservationKinds: adapters.map((selected) => selected.capability),
        planArgs: {
          prompt: readHelixAskGoldenPathPrompt(args.body),
          selected_capabilities: adapters.map((selected) => selected.capability),
        },
        errorCode: result.failure.errorCode,
        brokenRail: result.failure.brokenRail,
        missingRequirement: result.failure.missingRequirement,
        text: result.failure.text,
      });
    }
    observations.push(result.observation);
  }

  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: observations.map((observation) => ({
      subgoalIdSuffix: observation.subgoalIdSuffix,
      requestedCapability: observation.requestedCapability,
      selectedCapability: observation.selectedCapability,
      executedCapability: observation.executedCapability,
      args: observation.args,
      observationKind: observation.observationKind,
      observationRef: observation.observationRef,
      terminalContributionKind: observation.terminalContributionKind,
      satisfaction: "satisfied",
    })),
  });
  const requiredObservationKindsForTurn = observations.map((observation) => observation.observationKind);
  const workstationActions = workstationActionsFor(observations);

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
    classifierReasons: ["explicit_compound_itinerary_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText: answerTextFor(observations),
    supportArtifactRefs: supportRefsFor(observations),
    status: "compound_itinerary",
    route: "golden_path_runtime / compound_itinerary",
    observedArtifactRef: observations[0]?.observationRef ?? routeGateArtifactId,
    requiredObservationKinds: requiredObservationKindsForTurn,
    observationFields: observationFieldsFor(observations),
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: observations.map((observation) => ({
          artifactId: observation.observationRef,
          kind: observation.observationKind,
          producerItemId: observation.producerItemId,
          terminalEligible: observation.terminalEligible,
          payload: observation.payload,
        })),
      }),
    compoundCapabilityContract,
    compoundSubgoalCount: observations.length,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_itinerary_synthesis",
    workstationActions,
  });
};
