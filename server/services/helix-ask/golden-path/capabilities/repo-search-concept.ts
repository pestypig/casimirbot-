import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { buildHelixGoalSatisfactionEvaluationArtifact } from "../../goal-satisfaction-artifact";
import {
  buildGoldenPathAnswerLedgerArtifact,
  buildGoldenPathObservationLedgerArtifact,
  buildGoldenPathPayloadLedgerArtifact,
  buildGoldenPathRouteGateLedgerArtifact,
} from "../artifact-ledger";
import { buildGoldenPathCapabilityPlan } from "../capability-contract";
import {
  HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
  HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
  readHelixAskGoldenPathPrompt,
  readRecord,
  readString,
  readStringArray,
  type RecordLike,
} from "../core";
import {
  buildGoldenPathTerminalAnswerAuthority,
  buildGoldenPathTerminalAuthoritySingleWriter,
  buildGoldenPathTerminalResult,
  buildGoldenPathTypedFailureTerminalResult,
} from "../terminal-envelope";
import { buildGoldenPathSolverTrace } from "../solver-trace";
import { buildGoldenPathRuntimeStatus } from "../runtime-status";

export type HelixAskGoldenPathRepoSearchConceptDependencies = {
  now: () => Date;
  hashGoalFrame: (value: unknown) => string;
  buildGoalSatisfactionEvaluationArtifact: typeof buildHelixGoalSatisfactionEvaluationArtifact;
};

export const isHelixAskGoldenPathRepoSearchConceptRequested = (body: RecordLike): boolean => {
  const requestedCapabilities = readStringArray(body.requested_capabilities ?? body.requestedCapabilities);
  if (requestedCapabilities.includes(HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY)) return true;
  const requestedCapability =
    readString(body.requested_capability) ??
    readString(body.requestedCapability) ??
    readString(body.capability) ??
    readString(body.tool_name) ??
    readString(body.toolName);
  if (requestedCapability === HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY) return true;
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
  const now = args.deps.now();
  const createdAtMs = now.getTime();
  const turnId = readString(args.body.turn_id) ?? readString(args.body.turnId) ?? `ask:golden-repo:${createdAtMs}`;
  const traceId = readString(args.body.trace_id) ?? readString(args.body.traceId) ?? turnId;
  const sessionId = readString(args.body.session_id) ?? readString(args.body.sessionId);
  const threadId = readString(args.body.thread_id) ?? readString(args.body.threadId);
  const promptText = readHelixAskGoldenPathPrompt(args.body);
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
  }): RecordLike => {
    const terminalArtifactIdForFailure = `${turnId}:typed_failure`;
    const canonicalGoalFrame = {
      schema: "helix.ask_canonical_goal_frame.v1",
      turn_id: turnId,
      goal_kind: goalKind,
      answer_scope: "current_turn",
      required_terminal_kind: requiredTerminalKind,
      classifier_reasons: ["explicit_repo_search_concept_request"],
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalSatisfactionEvaluation = {
      schema: "helix.goal_satisfaction_evaluation.v1",
      turn_id: turnId,
      satisfaction: "not_satisfied",
      goal_kind: goalKind,
      required_terminal_kind: requiredTerminalKind,
      selected_terminal_artifact_kind: "typed_failure",
      missing_requirements: [params.missingRequirement],
      first_broken_rail: params.brokenRail,
      assistant_answer: false,
      raw_content_included: false,
    };
    const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
    const terminalResult = buildGoldenPathTypedFailureTerminalResult({
      resultId: terminalResultId,
      artifactId: terminalArtifactIdForFailure,
      text: params.text,
      supportRefs: [routeGateArtifactId],
    });
    return {
      ok: false,
      mode: "read",
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      turn_id: turnId,
      trace_id: traceId,
      session_id: sessionId,
      thread_id: threadId,
      prompt_text: promptText,
      response_type: "typed_failure",
      final_status: "typed_failure",
      final_answer_source: "typed_failure",
      terminal_artifact_kind: "typed_failure",
      terminal_artifact_id: terminalArtifactIdForFailure,
      terminal_error_code: params.errorCode,
      answer: terminalResult.text,
      text: terminalResult.text,
      assistant_answer: terminalResult.text,
      selected_final_answer: terminalResult.text,
      selected_terminal_result_id: terminalResult.result_id,
      terminal_result: terminalResult,
      terminal_results: [terminalResult],
      golden_path_runtime: buildGoldenPathRuntimeStatus({
        status: "repo_search_concept_failed",
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: params.brokenRail,
      }),
      canonical_goal_frame: canonicalGoalFrame,
      capability_plan: buildGoldenPathCapabilityPlan({
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        sourceTarget: "repo_code",
        family: "repo_code",
        executedCapability: null,
        planArgs: { concept },
        requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
        requiredTerminalKind,
      }),
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
        terminalResult,
        route: "golden_path_runtime / repo_search_concept",
      }),
      terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
      ask_turn_solver_trace: buildGoldenPathSolverTrace({
        completedSolverPath: false,
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selectedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executedCapability: null,
        firstBrokenRail: params.brokenRail,
        terminalArtifactKind: "typed_failure",
      }),
      current_turn_artifact_ledger: [
        buildGoldenPathRouteGateLedgerArtifact({
          artifactId: routeGateArtifactId,
          turnId,
          createdAtMs,
          goalHash,
          requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        }),
        buildGoldenPathPayloadLedgerArtifact({
          artifactId: terminalArtifactIdForFailure,
          turnId,
          createdAtMs,
          goalHash,
          kind: "typed_failure",
          terminalEligible: true,
          payload: {
            schema: "helix.typed_failure.v1",
            text: terminalResult.text,
            answer_text: terminalResult.text,
            terminal_result_id: terminalResult.result_id,
            error_code: params.errorCode,
            first_broken_rail: params.brokenRail,
            assistant_answer: false,
            raw_content_included: false,
          },
        }),
      ],
      debug: {
        schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
        golden_path_runtime: true,
        requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        executed_capability: null,
        terminal_artifact_kind: "typed_failure",
        final_answer_source: "typed_failure",
        first_broken_rail: params.brokenRail,
        terminal_error_code: params.errorCode,
        assistant_answer: false,
        raw_content_included: false,
      },
    };
  };

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
  const canonicalGoalFrame = {
    schema: "helix.ask_canonical_goal_frame.v1",
    turn_id: turnId,
    goal_kind: goalKind,
    answer_scope: "current_turn",
    required_terminal_kind: requiredTerminalKind,
    allows_workspace_context: true,
    allows_prior_artifacts: false,
    classifier_reasons: ["explicit_repo_search_concept_request"],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalSatisfactionEvaluation = {
    schema: "helix.goal_satisfaction_evaluation.v1",
    turn_id: turnId,
    satisfaction: "satisfied",
    goal_kind: goalKind,
    required_terminal_kind: requiredTerminalKind,
    selected_terminal_artifact_kind: requiredTerminalKind,
    missing_requirements: [],
    assistant_answer: false,
    raw_content_included: false,
  };
  const goalHash = args.deps.hashGoalFrame(canonicalGoalFrame);
  const goalSatisfactionArtifact = args.deps.buildGoalSatisfactionEvaluationArtifact({
    turnId,
    goalHash,
    evaluation: goalSatisfactionEvaluation,
    createdAtMs,
  });
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
  const terminalResult = buildGoldenPathTerminalResult({
    resultId: terminalResultId,
    artifactId: terminalArtifactId,
    artifactKind: requiredTerminalKind,
    finalAnswerSource: requiredTerminalKind,
    text: answerText,
    supportRefs: [observationArtifactId, relevanceGateArtifactId, routeGateArtifactId, goalSatisfactionArtifact.artifact_id],
  });

  return {
    ok: true,
    mode: "read",
    schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
    turn_id: turnId,
    trace_id: traceId,
    session_id: sessionId,
    thread_id: threadId,
    prompt_text: promptText,
    response_type: "final_answer",
    final_status: "final_answer",
    final_answer_source: terminalResult.final_answer_source,
    terminal_artifact_kind: terminalResult.artifact_kind,
    terminal_artifact_id: terminalResult.artifact_id,
    terminal_error_code: null,
    answer: terminalResult.text,
    text: terminalResult.text,
    assistant_answer: terminalResult.text,
    selected_final_answer: terminalResult.text,
    selected_terminal_result_id: terminalResult.result_id,
    terminal_result: terminalResult,
    terminal_results: [terminalResult],
    repo_code_evidence_observation: repoEvidenceObservation,
    repo_evidence_relevance_gate: repoEvidenceRelevanceGate,
    repo_code_evidence_answer: {
      schema: "helix.repo_code_evidence_answer.v1",
      concept,
      text: terminalResult.text,
      answer_text: terminalResult.text,
      support_refs: terminalResult.support_refs,
      selected_paths: selectedPaths,
      assistant_answer: false,
      raw_content_included: false,
    },
    golden_path_runtime: buildGoldenPathRuntimeStatus({
      status: "repo_search_concept",
      requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observedArtifactKind: "repo_code_evidence_observation",
      observedArtifactRef: observationArtifactId,
      terminalArtifactRef: terminalArtifactId,
      terminalResultId,
    }),
    canonical_goal_frame: canonicalGoalFrame,
    capability_plan: buildGoldenPathCapabilityPlan({
      requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      sourceTarget: "repo_code",
      family: "repo_code",
      planArgs: { concept },
      requiredObservationKinds: ["repo_code_evidence_observation", "repo_evidence_relevance_gate"],
      requiredTerminalKind,
    }),
    goal_satisfaction_evaluation: goalSatisfactionEvaluation,
    terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority({
      terminalResult,
      route: "golden_path_runtime / repo_search_concept",
    }),
    terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({ terminalResult }),
    ask_turn_solver_trace: buildGoldenPathSolverTrace({
      completedSolverPath: true,
      routeAuthorityOk: true,
      terminalAuthorityOk: true,
      goalSatisfaction: "satisfied",
      requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selectedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observedArtifactKind: "repo_code_evidence_observation",
      observedArtifactRef: observationArtifactId,
      terminalArtifactKind: terminalResult.artifact_kind,
      extra: {
        solver_risk_flags: [],
        solver_short_circuit_flags: [],
      },
    }),
    current_turn_artifact_ledger: [
      buildGoldenPathRouteGateLedgerArtifact({
        artifactId: routeGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        promptText,
        requestedCapability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
        goalSatisfactionArtifact,
        goalSatisfactionEvaluation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: observationArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "repo_code_evidence_observation",
        payload: repoEvidenceObservation,
      }),
      buildGoldenPathObservationLedgerArtifact({
        artifactId: relevanceGateArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: "repo_evidence_relevance_gate",
        payload: repoEvidenceRelevanceGate,
      }),
      buildGoldenPathAnswerLedgerArtifact({
        artifactId: terminalArtifactId,
        turnId,
        createdAtMs,
        goalHash,
        kind: requiredTerminalKind,
        payloadSchema: "helix.repo_code_evidence_answer.v1",
        terminalResult,
        extraPayload: {
          concept,
          selected_paths: selectedPaths,
        },
      }),
    ],
    debug: {
      schema: HELIX_ASK_GOLDEN_PATH_RUNTIME_SCHEMA,
      golden_path_runtime: true,
      golden_path_runtime_status: "repo_search_concept",
      private_runtime_loop_entered: false,
      requested_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      selected_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      executed_capability: HELIX_GOLDEN_PATH_REPO_SEARCH_CONCEPT_CAPABILITY,
      observed_artifact_kind: "repo_code_evidence_observation",
      observed_artifact_ref: observationArtifactId,
      terminal_artifact_kind: terminalResult.artifact_kind,
      terminal_result_count: 1,
      final_answer_source: terminalResult.final_answer_source,
      goal_satisfaction_evaluation: goalSatisfactionEvaluation,
      assistant_answer: false,
      raw_content_included: false,
    },
  };
};


export const requiredObservationKinds = ["repo_code_evidence_observation"] as const;
export const requiredTerminalKinds = ["repo_code_evidence_answer"] as const;
export const isRequested = isHelixAskGoldenPathRepoSearchConceptRequested;
export const buildPayload = buildHelixAskGoldenPathRepoSearchConceptPayload;
