import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  findGoldenPathDocLocationMatches,
  readGoldenPathDocContent,
  readGoldenPathDocLocateQuery,
  readGoldenPathDocPath,
} from "../capabilities/docs-locate";
import {
  findGoldenPathRepoEvidence,
  readGoldenPathRepoSearchFiles,
  readRepoSearchConcept,
} from "../capabilities/repo-search-concept";
import {
  buildGoldenPathCompoundCapabilityContract,
  isHelixAskGoldenPathRepoDocsCompoundRequested,
} from "../compound-contract";
import { buildGoldenPathCompoundTypedFailurePayload } from "../compound-failure";
import {
  buildGoldenPathCompoundObservationLedgerArtifacts,
  buildGoldenPathCompoundSuccessPayload,
} from "../compound-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathRepoDocsCompoundDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};
export const requiredObservationKinds = ["repo_code_evidence_observation", "doc_location_matches"] as const;
export const requiredTerminalKinds = ["compound_evidence_synthesis_answer"] as const;
export const orderedSubgoalContract = [
  {
    requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    observation_kind: "repo_code_evidence_observation",
  },
  {
    requested_capability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    observation_kind: "doc_location_matches",
  },
] as const;
export const isRequested = isHelixAskGoldenPathRepoDocsCompoundRequested;
export const buildHelixAskGoldenPathRepoDocsCompoundPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathRepoDocsCompoundDependencies;
}): RecordLike => {
  const deps = args.deps;
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-repo-docs",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const repoObservationArtifactId = `${turnId}:repo_code_evidence_observation`;
  const relevanceGateArtifactId = `${turnId}:repo_evidence_relevance_gate`;
  const docObservationArtifactId = `${turnId}:doc_location_matches`;
  const terminalArtifactId = `${turnId}:compound_evidence_synthesis_answer`;
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "compound_evidence_synthesis_answer";
  const concept = readRepoSearchConcept(args.body);
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode:
      | "missing_repo_search_concept"
      | "repo_evidence_weak_after_repair"
      | "missing_doc_location_query"
      | "missing_doc_content"
      | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation" | "evidence_reentry";
    missingRequirement: string;
    text: string;
  }): RecordLike => {
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
      classifierReasons: ["explicit_repo_docs_compound_request"],
      hashGoalFrame: deps.hashGoalFrame,
      status: "repo_docs_compound_failed",
      route: "golden_path_runtime / repo_docs_compound",
      requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
      planArgs: { concept, doc_path: docPath, query },
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
    });
  };

  if (!concept) {
    return makeFailurePayload({
      errorCode: "missing_repo_search_concept",
      brokenRail: "argument_extraction",
      missingRequirement: "repo_search_concept",
      text: "I could not complete this golden-path repo/docs turn because no repo concept was provided.",
    });
  }
  const evidence = findGoldenPathRepoEvidence({ concept, files: readGoldenPathRepoSearchFiles(args.body) });
  if (evidence.length === 0) {
    return makeFailurePayload({
      errorCode: "repo_evidence_weak_after_repair",
      brokenRail: "evidence_reentry",
      missingRequirement: "repo_code_evidence_observation",
      text: `I could not find strong repo evidence for: ${concept}`,
    });
  }
  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path repo/docs turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path repo/docs turn because no readable document content was available.",
    });
  }
  const matches = findGoldenPathDocLocationMatches({ content: docContent, query, docPath });
  if (matches.length === 0) {
    return makeFailurePayload({
      errorCode: "no_doc_location_matches",
      brokenRail: "observation",
      missingRequirement: "doc_location_matches",
      text: `I could not locate matching document evidence for: ${query}`,
    });
  }

  const selectedPaths = Array.from(new Set(evidence.map((entry) => entry.file_path)));
  const repoEvidenceObservation = {
    schema: "helix.repo_code_evidence_observation.v1",
    capability_key: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    concept,
    selected_paths: selectedPaths,
    evidence,
    match_count: evidence.length,
    assistant_answer: false,
    raw_content_included: false,
  };
  const repoEvidenceRelevanceGate = {
    schema: "helix.repo_evidence_relevance_gate.v1",
    turn_id: turnId,
    concept,
    selected_paths: selectedPaths,
    coverage: evidence.length >= 2 ? "adequate" : "weak",
    terminal_allowed: true,
    repair_required: false,
    assistant_answer: false,
    raw_content_included: false,
  };
  const docLocationMatches = {
    schema: "helix.doc_location_matches.v1",
    capability_key: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    doc_path: docPath,
    query,
    match_count: matches.length,
    matches,
    assistant_answer: false,
    raw_content_included: false,
  };
  const compoundCapabilityContract = buildGoldenPathCompoundCapabilityContract({
    turnId,
    subgoals: [
      {
        subgoalIdSuffix: "repo_search",
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        args: { concept },
        observationKind: "repo_code_evidence_observation",
        observationRef: repoObservationArtifactId,
        terminalContributionKind: "repo_code_evidence_answer",
      },
      {
        subgoalIdSuffix: "docs_locate",
        requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
        args: { doc_path: docPath, query },
        observationKind: "doc_location_matches",
        observationRef: docObservationArtifactId,
        terminalContributionKind: "doc_location_matches",
      },
    ],
  });
  const answerText = [
    "Compound repo/docs synthesis completed.",
    `Repo concept: ${concept}`,
    `Repo evidence: ${evidence[0]?.file_path ?? "unknown"}:${evidence[0]?.line ?? "unknown"} - ${evidence[0]?.snippet ?? ""}`,
    `Document query: ${query}`,
    docPath ? `Document: ${docPath}` : "",
    `Top document evidence: line ${matches[0]?.line ?? "unknown"} - ${matches[0]?.snippet ?? ""}`,
    "The repo evidence, relevance gate, and document matches are support artifacts; synthesis is terminal authority only after both subgoals are satisfied.",
  ].filter(Boolean).join("\n");
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
    classifierReasons: ["explicit_repo_docs_compound_request"],
    includeWorkspaceContextFields: true,
    hashGoalFrame: deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: deps.buildGoalSatisfactionEvaluationArtifact,
    answerText,
    supportArtifactRefs: [repoObservationArtifactId, relevanceGateArtifactId, docObservationArtifactId],
    status: "repo_docs_compound",
    route: "golden_path_runtime / repo_docs_compound",
    observedArtifactRef: repoObservationArtifactId,
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate", "doc_location_matches"],
    observationFields: {
      repo_code_evidence_observation: repoEvidenceObservation,
      repo_evidence_relevance_gate: repoEvidenceRelevanceGate,
      doc_location_matches: docLocationMatches,
    },
    observationLedgerArtifacts: ({ goalHash }) =>
      buildGoldenPathCompoundObservationLedgerArtifacts({
        turnId,
        createdAtMs,
        goalHash,
        observations: [
          {
            artifactId: repoObservationArtifactId,
            kind: "repo_code_evidence_observation",
            producerItemId: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
            terminalEligible: false,
            payload: repoEvidenceObservation,
          },
          {
            artifactId: relevanceGateArtifactId,
            kind: "repo_evidence_relevance_gate",
            producerItemId: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
            terminalEligible: false,
            payload: repoEvidenceRelevanceGate,
          },
          {
            artifactId: docObservationArtifactId,
            kind: "doc_location_matches",
            producerItemId: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
            terminalEligible: false,
            payload: docLocationMatches,
          },
        ],
      }),
    compoundCapabilityContract,
    routeGateTerminalEligible: false,
    answerProducerItemId: "golden_path_compound_synthesis",
  });
};
export const buildPayload = buildHelixAskGoldenPathRepoDocsCompoundPayload;
