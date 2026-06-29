import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import { buildGoldenPathCapabilityEvidenceAnswerSuccessPayload } from "../capability-evidence-answer-success";
import { buildGoldenPathCapabilityTypedFailurePayload } from "../capability-failure";
import {
  isHelixAskGoldenPathCapabilityExplicitlyRequested,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readHelixAskGoldenPathTurnContext,
  readRecord,
  readString,
  type RecordLike,
} from "../core";

export type HelixAskGoldenPathRepoSearchConceptDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathRepoSearchConceptRequested = (body: RecordLike): boolean => {
  if (isHelixAskGoldenPathCapabilityExplicitlyRequested(body, [HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY])) return true;
  const prompt = readHelixAskGoldenPathPrompt(body).toLowerCase();
  return (
    prompt.includes(HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY) ||
    /\b(?:repo|codebase|source\s+code)\b[\s\S]{0,120}\b(?:search|find|where|concept|evidence)\b/.test(prompt) ||
    /\b(?:search|find|where)\b[\s\S]{0,120}\b(?:repo|codebase|source\s+code)\b/.test(prompt)
  );
};

export const readRepoSearchConcept = (body: RecordLike): string | null => {
  const direct =
    readString(body.concept) ??
    readString(body.query) ??
    readString(body.search_concept) ??
    readString(body.searchConcept);
  if (direct) return direct;
  const prompt = readHelixAskGoldenPathPrompt(body);
  const afterCapability = prompt.match(/repo-code\.search_concept(?:\s+for|\s+query|\s*:)?\s*([^\n\r]+)/i);
  if (afterCapability?.[1]) return afterCapability[1].trim();
  const cleaned = prompt
    .replace(/helix_ask_golden_path_runtime/gi, "")
    .replace(/repo-code\.search_concept/gi, "")
    .replace(/\b(?:use|run|call|search|find|where|repo|codebase|source\s+code|concept|evidence|for|the)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
};

const repoSearchTerms = (concept: string): string[] =>
  Array.from(
    new Set(
      concept
        .split(/[^a-zA-Z0-9_.-]+/g)
        .map((term) => term.trim())
        .filter((term) => term.length > 2),
    ),
  );

export type GoldenPathRepoSearchFile = { path: string; content: string };

export const readRepoSearchFixtureFiles = (body: RecordLike): GoldenPathRepoSearchFile[] => {
  const value = body.repo_files ?? body.repoFiles;
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): GoldenPathRepoSearchFile | null => {
      const record = readRecord(entry);
      if (!record) return null;
      const filePath = readString(record.path) ?? readString(record.filePath) ?? readString(record.file_path);
      const content = readString(record.content) ?? readString(record.text);
      return filePath && content ? { path: filePath.replace(/\\/g, "/"), content } : null;
    })
    .filter((entry): entry is GoldenPathRepoSearchFile => Boolean(entry))
    .slice(0, 40);
};

const GOLDEN_PATH_REPO_TEXT_FILE_RE =
  /\.(?:ts|tsx|js|jsx|mjs|cjs|mts|cts|md|mdx|json|jsonc|py|txt|css|scss|html|yml|yaml)$/i;

const enumerateGoldenPathRepoFilesFromGit = (): string[] => {
  try {
    return execFileSync("git", ["ls-files"], {
      cwd: process.cwd(),
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024,
    })
      .split(/\r?\n/g)
      .map((entry) => entry.trim().replace(/\\/g, "/"))
      .filter((entry) => GOLDEN_PATH_REPO_TEXT_FILE_RE.test(entry))
      .filter((entry) => !/(^|\/)(?:node_modules|dist|build|coverage|\.git)(\/|$)/i.test(entry))
      .slice(0, 600);
  } catch {
    return [];
  }
};

const enumerateGoldenPathRepoFilesFromFs = (): string[] => {
  const out: string[] = [];
  const walk = (relativeDir: string): void => {
    if (out.length >= 600) return;
    const absoluteDir = path.resolve(process.cwd(), relativeDir);
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= 600) return;
      if (/^(?:node_modules|dist|build|coverage|\.git)$/i.test(entry.name)) continue;
      const relativePath = path.join(relativeDir, entry.name).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        walk(relativePath);
      } else if (entry.isFile() && GOLDEN_PATH_REPO_TEXT_FILE_RE.test(relativePath)) {
        out.push(relativePath);
      }
    }
  };
  walk("");
  return out;
};

export const readGoldenPathRepoSearchFiles = (body: RecordLike): GoldenPathRepoSearchFile[] => {
  const fixtures = readRepoSearchFixtureFiles(body);
  if (fixtures.length > 0) return fixtures;
  const repoRoot = process.cwd();
  const selectedFiles = enumerateGoldenPathRepoFilesFromGit();
  const out: GoldenPathRepoSearchFile[] = [];
  for (const relativePath of selectedFiles.length > 0 ? selectedFiles : enumerateGoldenPathRepoFilesFromFs()) {
    const absolutePath = path.resolve(repoRoot, relativePath);
    const relative = path.relative(repoRoot, absolutePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
    try {
      const stat = statSync(absolutePath);
      if (!stat.isFile() || stat.size > 750_000) continue;
      out.push({ path: relativePath, content: readFileSync(absolutePath, "utf8") });
    } catch {
      // Ignore unreadable files; repo search should fail closed if no evidence is found.
    }
    if (out.length >= 120) break;
  }
  return out;
};

export const findGoldenPathRepoEvidence = (args: {
  files: GoldenPathRepoSearchFile[];
  concept: string;
}): Array<{ file_path: string; line: number; snippet: string; matched_terms: string[] }> => {
  const terms = repoSearchTerms(args.concept);
  if (terms.length === 0) return [];
  const matches: Array<{ file_path: string; line: number; snippet: string; matched_terms: string[]; score: number }> = [];
  for (const file of args.files) {
    const lines = file.content.split(/\r?\n/g);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      const normalizedLine = line.toLowerCase();
      const matchedTerms = terms.filter((term) => normalizedLine.includes(term.toLowerCase()));
      if (matchedTerms.length === 0) continue;
      matches.push({
        file_path: file.path,
        line: index + 1,
        snippet: line.trim().slice(0, 240),
        matched_terms: matchedTerms,
        score: matchedTerms.length,
      });
    }
  }
  return matches
    .sort((left, right) => right.score - left.score || left.file_path.localeCompare(right.file_path) || left.line - right.line)
    .slice(0, 8)
    .map(({ score: _score, ...match }) => match);
};


export const buildHelixAskGoldenPathRepoSearchConceptPayload = (args: {
  body: RecordLike;
  deps: HelixAskGoldenPathRepoSearchConceptDependencies;

}): RecordLike => {
  const { createdAtMs, turnId, traceId, sessionId, threadId, promptText } =
    readHelixAskGoldenPathTurnContext({
      body: args.body,
      now: args.deps.now(),
      fallbackTurnIdPrefix: "ask:golden-repo",
    });
  const routeGateArtifactId = `${turnId}:golden_path_route_gate`;
  const observationArtifactId = `${turnId}:repo_code_evidence_observation`;
  const relevanceGateArtifactId = `${turnId}:repo_evidence_relevance_gate`;
  const terminalArtifactId = `${turnId}:repo_code_evidence_answer`;
  const terminalResultId = `${turnId}:golden_path_terminal_result`;
  const requiredTerminalKind = "repo_code_evidence_answer";
  const goalKind = "repo_concept_explanation";
  const concept = readRepoSearchConcept(args.body);

  const makeFailurePayload = (params: {
    errorCode: "missing_repo_search_concept" | "repo_evidence_weak_after_repair";
    brokenRail: "argument_extraction" | "evidence_reentry";
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
      classifierReasons: ["explicit_repo_search_concept_request"],
      requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      sourceTarget: "repo_code",
      family: "repo_code",
      planArgs: { concept },
      requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
      status: "repo_search_concept_failed",
      route: "golden_path_runtime / repo_search_concept",
      errorCode: params.errorCode,
      brokenRail: params.brokenRail,
      missingRequirement: params.missingRequirement,
      text: params.text,
      hashGoalFrame: args.deps.hashGoalFrame,
    });

  if (!concept) {
    return makeFailurePayload({
      errorCode: "missing_repo_search_concept",
      brokenRail: "argument_extraction",
      missingRequirement: "repo_search_concept",
      text: "I could not complete this golden-path repo search turn because no repo concept was provided.",
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

  const selectedPaths = Array.from(new Set(evidence.map((entry) => entry.file_path)));
  const answerText = [
    `Repo evidence answer for: ${concept}`,
    ...evidence.slice(0, 5).map((entry, index) => `${index + 1}. ${entry.file_path}:${entry.line} - ${entry.snippet}`),
  ].join("\n");
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

  return buildGoldenPathCapabilityEvidenceAnswerSuccessPayload({
    turnId,
    traceId,
    sessionId,
    threadId,
    promptText,
    createdAtMs,
    routeGateArtifactId,
    terminalArtifactId,
    terminalResultId,
    requiredTerminalKind,
    goalKind,
    answerScope: "current_turn",
    sourceTarget: "repo_code",
    family: "repo_code",
    planArgs: { concept },
    classifierReasons: ["explicit_repo_search_concept_request"],
    allowsWorkspaceContext: true,
    requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    selectedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    executedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
    observations: [
      {
        artifactId: observationArtifactId,
        kind: "repo_code_evidence_observation",
        payload: repoEvidenceObservation,
      },
      {
        artifactId: relevanceGateArtifactId,
        kind: "repo_evidence_relevance_gate",
        payload: repoEvidenceRelevanceGate,
      },
    ],
    primaryObservedArtifactKind: "repo_code_evidence_observation",
    primaryObservedArtifactRef: observationArtifactId,
    terminalPayloadSchema: "helix.repo_code_evidence_answer.v1",
    terminalPayload: {
      schema: "helix.repo_code_evidence_answer.v1",
      concept,
      selected_paths: selectedPaths,
      assistant_answer: false,
      raw_content_included: false,
    },
    terminalExtraPayload: {
      concept,
      selected_paths: selectedPaths,
    },
    answerText,
    status: "repo_search_concept",
    route: "golden_path_runtime / repo_search_concept",
    requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
    includeRuntimeLegacyFallbackPossibleWhenUnhandled: false,
    includeRuntimeRouteGate: false,
    includePromptTextInRouteGate: true,
    hashGoalFrame: args.deps.hashGoalFrame,
    buildGoalSatisfactionEvaluationArtifact: args.deps.buildGoalSatisfactionEvaluationArtifact,
  });
};


export const requiredObservationKinds = ["repo_code_evidence_observation"] as const;
export const requiredTerminalKinds = ["repo_code_evidence_answer"] as const;
export const isRequested = isHelixAskGoldenPathRepoSearchConceptRequested;
export const buildPayload = buildHelixAskGoldenPathRepoSearchConceptPayload;
