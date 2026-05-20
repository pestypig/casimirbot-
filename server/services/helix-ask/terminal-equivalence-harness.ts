import { hashHelixTerminalText } from "./turn-terminal-authority";

type RecordLike = Record<string, unknown>;

export type HelixTerminalEquivalenceFailureCode =
  | "debug_terminal_differs_from_turn_terminal"
  | "poison_hashes_hidden_terminal_while_ui_stale"
  | "route_authority_missing"
  | "solver_trace_missing"
  | "stream_terminal_differs_from_turn_terminal"
  | "terminal_authority_hash_mismatch"
  | "ui_success_with_typed_failure_authority"
  | "visible_state_differs_from_terminal";

export type HelixTerminalEquivalenceHarnessResult = {
  schema: "helix.terminal_equivalence_harness_result.v1";
  turn_id: string | null;
  stream_turn_id: string | null;
  ok: boolean;
  failure_codes: HelixTerminalEquivalenceFailureCode[];
  surfaces: {
    non_stream_text: string | null;
    stream_text: string | null;
    debug_text: string | null;
    visible_ui_text: string | null;
    terminal_authority_text: string | null;
    terminal_authority_hash: string | null;
    poison_server_terminal_hash: string | null;
    poison_client_visible_hash: string | null;
  };
  assistant_answer: false;
  raw_content_included: false;
};

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

const extractDebugPayload = (debugExport: unknown): RecordLike | null => {
  const debug = readRecord(debugExport);
  return readRecord(debug?.payload) ?? debug;
};

const firstText = (...values: unknown[]): string | null => {
  for (const value of values) {
    const text = readString(value);
    if (text) return text;
  }
  return null;
};

const terminalPresentationText = (value: RecordLike | null): string | null =>
  firstText(readRecord(value?.terminal_presentation)?.concise_text);

const visibleText = (value: RecordLike | null): string | null =>
  firstText(
    readRecord(value?.visibleAnswerState)?.finalAnswer,
    value?.finalAnswer,
    value?.selected_final_answer,
    value?.answer,
    value?.assistant_answer,
    value?.text,
    terminalPresentationText(value),
  );

const authorityText = (value: RecordLike | null): string | null =>
  firstText(readRecord(value?.terminal_answer_authority)?.terminal_text_preview);

const authorityHash = (value: RecordLike | null): string | null =>
  firstText(readRecord(value?.terminal_answer_authority)?.terminal_text_hash);

const terminalKind = (value: RecordLike | null): string | null =>
  firstText(
    value?.terminal_artifact_kind,
    readRecord(value?.terminal_answer_authority)?.terminal_artifact_kind,
    readRecord(value?.resolved_turn_summary)?.terminal_artifact_kind,
  );

const finalAnswerSource = (value: RecordLike | null): string | null =>
  firstText(value?.final_answer_source, readRecord(value?.terminal_answer_authority)?.final_answer_source);

const isTypedFailureTerminal = (value: RecordLike | null): boolean =>
  /typed_failure|failure|error/i.test(`${terminalKind(value) ?? ""} ${finalAnswerSource(value) ?? ""}`);

const pushIf = (
  failures: HelixTerminalEquivalenceFailureCode[],
  condition: boolean,
  code: HelixTerminalEquivalenceFailureCode,
): void => {
  if (condition) failures.push(code);
};

const textDiffers = (left: string | null, right: string | null): boolean =>
  Boolean(left && right && left !== right);

const visibleDiffersFromAuthority = (visible: string | null, authority: string | null): boolean =>
  textDiffers(visible, authority);

export function buildTerminalEquivalenceHarnessResult(input: {
  nonStreamResponse: unknown;
  streamFinal?: unknown;
  streamTerminalEvent?: unknown;
  debugExport?: unknown;
  visibleUiAnswerState?: unknown;
}): HelixTerminalEquivalenceHarnessResult {
  const nonStream = readRecord(input.nonStreamResponse) ?? {};
  const streamFinal = readRecord(input.streamFinal);
  const streamTerminalEvent = readRecord(input.streamTerminalEvent);
  const debug = extractDebugPayload(input.debugExport);
  const visibleUi = readRecord(input.visibleUiAnswerState);

  const nonStreamText = visibleText(nonStream);
  const streamText = visibleText(streamFinal) ?? firstText(streamTerminalEvent?.text);
  const streamTerminalText = firstText(streamTerminalEvent?.text);
  const debugText = visibleText(debug);
  const visibleUiText = visibleText(visibleUi);
  const terminalText = authorityText(nonStream) ?? authorityText(debug);
  const terminalHash = authorityHash(nonStream) ?? authorityHash(debug);
  const poison = readRecord(nonStream.poison_audit) ?? readRecord(debug?.poison_audit);
  const poisonAuthority = readRecord(poison?.terminal_authority);
  const poisonServerHash = firstText(poisonAuthority?.server_terminal_text_hash);
  const poisonClientHash = firstText(poisonAuthority?.client_visible_text_hash);
  const streamAuthorityText = authorityText(streamFinal);

  const failures: HelixTerminalEquivalenceFailureCode[] = [];
  pushIf(failures, Boolean(terminalText && terminalHash && hashHelixTerminalText(terminalText) !== terminalHash), "terminal_authority_hash_mismatch");
  pushIf(failures, textDiffers(debugText, terminalText), "debug_terminal_differs_from_turn_terminal");
  pushIf(failures, visibleDiffersFromAuthority(visibleUiText, terminalText), "visible_state_differs_from_terminal");
  pushIf(failures, Boolean(isTypedFailureTerminal(nonStream) && visibleUiText && terminalText && visibleUiText !== terminalText), "ui_success_with_typed_failure_authority");
  pushIf(
    failures,
    Boolean(
      poison?.ok === true &&
        poisonServerHash &&
        terminalHash &&
        poisonServerHash === terminalHash &&
        visibleUiText &&
        hashHelixTerminalText(visibleUiText) !== terminalHash,
    ),
    "poison_hashes_hidden_terminal_while_ui_stale",
  );
  pushIf(failures, Boolean(streamFinal && textDiffers(streamText, streamAuthorityText)), "stream_terminal_differs_from_turn_terminal");
  pushIf(failures, Boolean(streamTerminalText && textDiffers(streamTerminalText, streamText)), "stream_terminal_differs_from_turn_terminal");
  pushIf(failures, Boolean(streamFinal && textDiffers(streamText, nonStreamText)), "stream_terminal_differs_from_turn_terminal");
  pushIf(failures, !readRecord(nonStream.route_authority_audit) && !readRecord(debug?.route_authority_audit), "route_authority_missing");
  pushIf(failures, !readRecord(nonStream.ask_turn_solver_trace) && !readRecord(debug?.ask_turn_solver_trace), "solver_trace_missing");

  return {
    schema: "helix.terminal_equivalence_harness_result.v1",
    turn_id: firstText(nonStream.turn_id, debug?.active_turn_id),
    stream_turn_id: firstText(streamFinal?.turn_id),
    ok: failures.length === 0,
    failure_codes: unique(failures),
    surfaces: {
      non_stream_text: nonStreamText,
      stream_text: streamText,
      debug_text: debugText,
      visible_ui_text: visibleUiText,
      terminal_authority_text: terminalText,
      terminal_authority_hash: terminalHash,
      poison_server_terminal_hash: poisonServerHash,
      poison_client_visible_hash: poisonClientHash,
    },
    assistant_answer: false,
    raw_content_included: false,
  };
}
