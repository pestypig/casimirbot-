type MutableEnvelope = {
  answer?: string;
} | null | undefined;

type MutableResult = {
  text?: string;
  envelope?: MutableEnvelope;
};

type MutableDebugPayload = Record<string, unknown> | null | undefined;

export type GlobalTerminalValidatorMode =
  | "minimal_repair_conversational_observe"
  | "minimal_repair"
  | "minimal_repair_observe"
  | "rewrite"
  | "observe_no_rewrite"
  | "none";

export const applyTerminalAnswerText = (args: {
  result: MutableResult;
  nextText: string;
}): string => {
  args.result.text = args.nextText;
  if (args.result.envelope) {
    args.result.envelope.answer = args.nextText;
  }
  return args.nextText;
};

export const clearGlobalTerminalValidatorState = (
  debugPayload: MutableDebugPayload,
): void => {
  if (!debugPayload) return;
  debugPayload.global_terminal_validator_applied = false;
  debugPayload.global_terminal_validator_reasons = [];
  debugPayload.global_terminal_validator_mode = "none";
  debugPayload.final_mode_gate_consistency_blocked = false;
  debugPayload.final_mode_gate_consistency_reasons = [];
};

export const recordGlobalTerminalValidatorState = (
  debugPayload: MutableDebugPayload,
  args: {
    applied: boolean;
    reasons: string[];
    mode: GlobalTerminalValidatorMode;
    consistencyBlocked?: boolean | null;
  },
): void => {
  if (!debugPayload) return;
  debugPayload.global_terminal_validator_applied = args.applied;
  debugPayload.global_terminal_validator_reasons = args.reasons.slice(0, 10);
  debugPayload.global_terminal_validator_mode = args.mode;
  if (typeof args.consistencyBlocked === "boolean") {
    debugPayload.final_mode_gate_consistency_blocked = args.consistencyBlocked;
    debugPayload.final_mode_gate_consistency_reasons = args.consistencyBlocked
      ? args.reasons.slice(0, 10)
      : [];
  }
};

export const applyGlobalTerminalValidatorOutcome = (args: {
  mode: Exclude<GlobalTerminalValidatorMode, "none">;
  reasons: string[];
  currentText: string;
  nextText?: string | null;
  result: MutableResult;
  answerPath: string[];
  debugPayload: MutableDebugPayload;
}): {
  text: string;
  applied: boolean;
} => {
  const reasonSuffix = args.reasons.join(",");
  switch (args.mode) {
    case "minimal_repair_conversational_observe":
      args.answerPath.push(`globalTerminalValidator:minimal_repair_conversational_observe:${reasonSuffix}`);
      recordGlobalTerminalValidatorState(args.debugPayload, {
        applied: true,
        reasons: args.reasons,
        mode: args.mode,
        consistencyBlocked: false,
      });
      return {
        text: args.currentText,
        applied: false,
      };
    case "minimal_repair":
      if (args.nextText) {
        const updatedText = applyTerminalAnswerText({
          result: args.result,
          nextText: args.nextText,
        });
        args.answerPath.push(`globalTerminalValidator:minimal_repair:${reasonSuffix}`);
        recordGlobalTerminalValidatorState(args.debugPayload, {
          applied: true,
          reasons: args.reasons,
          mode: args.mode,
          consistencyBlocked: false,
        });
        return {
          text: updatedText,
          applied: true,
        };
      }
      recordGlobalTerminalValidatorState(args.debugPayload, {
        applied: true,
        reasons: args.reasons,
        mode: "minimal_repair_observe",
        consistencyBlocked: null,
      });
      return {
        text: args.currentText,
        applied: false,
      };
    case "rewrite":
      if (args.nextText) {
        const updatedText = applyTerminalAnswerText({
          result: args.result,
          nextText: args.nextText,
        });
        args.answerPath.push(`globalTerminalValidator:rewrite:${reasonSuffix}`);
        recordGlobalTerminalValidatorState(args.debugPayload, {
          applied: true,
          reasons: args.reasons,
          mode: args.mode,
          consistencyBlocked: true,
        });
        return {
          text: updatedText,
          applied: true,
        };
      }
      recordGlobalTerminalValidatorState(args.debugPayload, {
        applied: true,
        reasons: args.reasons,
        mode: "observe_no_rewrite",
        consistencyBlocked: true,
      });
      return {
        text: args.currentText,
        applied: false,
      };
    case "minimal_repair_observe":
    case "observe_no_rewrite":
      recordGlobalTerminalValidatorState(args.debugPayload, {
        applied: true,
        reasons: args.reasons,
        mode: args.mode,
        consistencyBlocked: args.mode === "observe_no_rewrite" ? true : null,
      });
      return {
        text: args.currentText,
        applied: false,
      };
  }
};
