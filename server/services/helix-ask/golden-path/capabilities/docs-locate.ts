import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import { buildGoldenPathCapabilityTerminalObservationSuccessPayload } from "../capability-terminal-observation-success";
import {
  buildHelixAskGoldenPathRouteGateArtifactId,
  buildHelixAskGoldenPathTerminalResultId,
  isHelixAskGoldenPathCapabilityNamedInRequest,
  HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathDocsLocateDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathDocsLocateRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityNamedInRequest(body, [HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    /\b(?:locate|find|cite|check)\b[\s\S]{0,120}\b(?:doc|document|white\s*paper|paper)\b/.test(prompt) ||
    /\b(?:doc|document|white\s*paper|paper)\b[\s\S]{0,120}\b(?:locate|find|cite|check)\b/.test(prompt)
  );
};


export const readGoldenPathDocPath = (body: RecordLike): string | null => {
  const direct =
    readString(body.doc_path) ??
    readString(body.docPath) ??
    readString(body.active_doc_path) ??
    readString(body.activeDocPath);
  if (direct) return direct.replace(/\\/g, "/").replace(/[),.;:!?]+$/g, "");
  const prompt = readHelixAskGoldenPathPrompt(body);
  const match = prompt.match(/\bdocs\/[^\s"'`<>]+/i);
  return match?.[0] ? match[0].replace(/[),.;:!?]+$/g, "") : null;
};

export const readGoldenPathDocContent = (body: RecordLike): string | null => {
  return (
    readString(body.doc_content) ??
    readString(body.docContent) ??
    readString(body.document_content) ??
    readString(body.documentContent) ??
    readString(body.active_doc_content) ??
    readString(body.activeDocContent)
  );
};

export const readGoldenPathDocLocateQuery = (body: RecordLike): string | null => {
  const direct =
    readString(body.query) ??
    readString(body.search_query) ??
    readString(body.searchQuery) ??
    readString(body.locate_query) ??
    readString(body.locateQuery);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const quoted = prompt.match(/["â€œ]([^"â€]{3,160})["â€]/);
  if (quoted?.[1]) return quoted[1].trim();
  const afterCapability = prompt.match(/docs-viewer\.locate_in_doc(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].replace(/\bdocs\/[^\s"'`<>]+/gi, "").trim();
  return (
    prompt
      .replace(/helix_ask_golden_path_runtime/gi, "")
      .replace(/docs-viewer\.locate_in_doc/gi, "")
      .replace(/\bdocs\/[^\s"'`<>]+/gi, "")
      .replace(/\b(?:check|locate|find|cite|in|the|white\s*paper|document|doc|paper|for|use)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim() || null
  );
};

export const findGoldenPathDocLocationMatches = (args: {
  content: string;
  query: string;
  docPath: string | null;
}): Array<{ line: number; snippet: string; doc_path: string | null; score: number }> => {
  const queryTokens = Array.from(
    new Set(
      args.query
        .toLowerCase()
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2),
    ),
  );
  if (queryTokens.length === 0) return [];
  return args.content
    .split(/\r?\n/)
    .map((line, index) => {
      const normalizedLine = line.toLowerCase();
      const hits = queryTokens.filter((token) => normalizedLine.includes(token)).length;
      return {
        line: index + 1,
        snippet: line.trim(),
        doc_path: args.docPath,
        score: hits,
      };
    })
    .filter((match) => match.snippet && match.score >= Math.min(2, queryTokens.length))
    .sort((left, right) => right.score - left.score || left.line - right.line)
    .slice(0, 5);
};


export const buildHelixAskGoldenPathDocsLocatePayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathDocsLocateDependencies;
}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-docs-locate",
    });
  const routeGateArtifactId = buildHelixAskGoldenPathRouteGateArtifactId(turnId);
  const terminalResultId = buildHelixAskGoldenPathTerminalResultId(turnId);
  const requiredTerminalKind = "doc_location_matches";
  const goalKind = "locate_in_doc";
  const docPath = readGoldenPathDocPath(args.body);
  const query = readGoldenPathDocLocateQuery(args.body);
  const docContent = readGoldenPathDocContent(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_doc_location_query" | "missing_doc_content" | "no_doc_location_matches";
    brokenRail: "argument_extraction" | "observation";
    missingRequirement: string;
    text: string;
  }): RecordLike =>
    buildGoldenPathCapabilityTypedFailurePayload({
      turnId,
      traceId,
      sessionId,
      threadId,
      promptText,
      createdAtMs,
      routeGateArtifactId,
      terminalResultId,
      requiredTerminalKind,
      goalKind,
      classifierReasons: ["explicit_docs_locate_request"],
      requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
      sourceTarget: "docs_viewer",
      family: "docs_viewer",
      planArgs: { doc_path: docPath, query },
      requiredObservationKinds,
      status: "docs_locate_failed",
      route: "golden_path_runtime / docs_locate_in_doc",
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
      hashGoalFrame: args.deps.hashGoalFrame,
    });

  if (!query) {
    return makeFailurePayload({
      errorCode: "missing_doc_location_query",
      brokenRail: "argument_extraction",
      missingRequirement: "doc_location_query",
      text: "I could not complete this golden-path docs locate turn because no document search query was provided.",
    });
  }
  if (!docContent) {
    return makeFailurePayload({
      errorCode: "missing_doc_content",
      brokenRail: "observation",
      missingRequirement: "doc_content",
      text: "I could not complete this golden-path docs locate turn because no readable document content was available.",
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

  const observationArtifactId = `${turnId}:doc_location_matches`;
  const answerText = [
    `Located ${matches.length} document evidence match${matches.length === 1 ? "" : "es"} for: ${query}`,
    docPath ? `Document: ${docPath}` : null,
    ...matches.map((match, index) => `${index + 1}. Line ${match.line}: ${match.snippet}`),
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
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

  return buildGoldenPathCapabilityTerminalObservationSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    observationArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    sourceTarget: "docs_viewer",
    family: "docs_viewer",
    planArgs: { doc_path: docPath, query },
    classifierReasons: ["explicit_docs_locate_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_DOCS_LOCATE_CAPABILITY,
    observedArtifactKind: "doc_location_matches",
    observationPayload: docLocationMatches,
    answerText,
    status: "docs_locate_in_doc",
    route: "golden_path_runtime / docs_locate_in_doc",
    requiredObservationKinds,
    includeRuntimeRouteGate: false,
    includeRuntimeLegacyFallbackPossibleWhenUnhandled: false,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};


export const requiredObservationKinds = ["doc_location_matches"] as const;
export const requiredTerminalKinds = ["doc_location_matches"] as const;
export const isRequested = isHelixAskGoldenPathDocsLocateRequested;
export const buildPayload = buildHelixAskGoldenPathDocsLocatePayload;
