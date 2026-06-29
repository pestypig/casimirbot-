import type { HelixAskGoldenPathRuntimeTerminalResult, RecordLike } from "./core";

export const buildGoldenPathTerminalResult = (args: {
  resultId: string;
  artifactId: string;
  artifactKind: string;
  finalAnswerSource: string;
  text: string;
  supportRefs: string[];
}): HelixAskGoldenPathRuntimeTerminalResult => ({
  schema: "helix.ask_golden_path_terminal_result.v1",
  result_id: args.resultId,
  artifact_id: args.artifactId,
  artifact_kind: args.artifactKind,
  final_answer_source: args.finalAnswerSource,
  text: args.text,
  support_refs: args.supportRefs,
  terminal_authority_ok: true,
  route_authority_ok: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildGoldenPathTypedFailureTerminalResult = (args: {
  resultId: string;
  artifactId: string;
  text: string;
  supportRefs: string[];
}): HelixAskGoldenPathRuntimeTerminalResult =>
  buildGoldenPathTerminalResult({
    resultId: args.resultId,
    artifactId: args.artifactId,
    artifactKind: "typed_failure",
    finalAnswerSource: "typed_failure",
    text: args.text,
    supportRefs: args.supportRefs,
  });

export const buildGoldenPathTerminalAnswerAuthority = (args: {
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  route: string;
  completedSolverPath?: boolean;
  firstBrokenRail?: string;
}): RecordLike => ({
  schema: "helix.terminal_answer_authority.v1",
  ...(typeof args.completedSolverPath === "boolean" ? { completed_solver_path: args.completedSolverPath } : {}),
  selected_terminal_artifact_kind: args.terminalResult.artifact_kind,
  terminal_artifact_kind: args.terminalResult.artifact_kind,
  selected_terminal_artifact_id: args.terminalResult.artifact_id,
  terminal_artifact_id: args.terminalResult.artifact_id,
  selected_terminal_result_id: args.terminalResult.result_id,
  selected_final_answer: args.terminalResult.text,
  final_answer_source: args.terminalResult.final_answer_source,
  ...(args.firstBrokenRail ? { first_broken_rail: args.firstBrokenRail } : {}),
  terminal_authority_ok: true,
  route: args.route,
  server_authoritative: true,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildGoldenPathTerminalAuthoritySingleWriter = (args: {
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
}): RecordLike => ({
  schema: "helix.terminal_authority_single_writer.v1",
  selected_terminal_artifact_kind: args.terminalResult.artifact_kind,
  selected_terminal_artifact_id: args.terminalResult.artifact_id,
  selected_terminal_result_id: args.terminalResult.result_id,
  visible_text: args.terminalResult.text,
  source: args.terminalResult.final_answer_source,
  assistant_answer: false,
  raw_content_included: false,
});

export const buildGoldenPathTerminalAuthorityProjection = (args: {
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  route: string;
  completedSolverPath?: boolean;
  firstBrokenRail?: string;
}): RecordLike => ({
  terminal_answer_authority: buildGoldenPathTerminalAnswerAuthority(args),
  terminal_authority_single_writer: buildGoldenPathTerminalAuthoritySingleWriter({
    terminalResult: args.terminalResult,
  }),
});

export const buildGoldenPathTerminalResponseProjection = (args: {
  terminalResult: HelixAskGoldenPathRuntimeTerminalResult;
  terminalErrorCode?: string | null;
}): RecordLike => ({
  response_type: "final_answer",
  final_status: "final_answer",
  final_answer_source: args.terminalResult.final_answer_source,
  terminal_artifact_kind: args.terminalResult.artifact_kind,
  terminal_artifact_id: args.terminalResult.artifact_id,
  terminal_error_code: args.terminalErrorCode ?? null,
  answer: args.terminalResult.text,
  text: args.terminalResult.text,
  assistant_answer: args.terminalResult.text,
  selected_final_answer: args.terminalResult.text,
  selected_terminal_result_id: args.terminalResult.result_id,
  terminal_result: args.terminalResult,
  terminal_results: [args.terminalResult],
});
