import { buildFinalResponsePayload } from "./response-debug-payload";
import { scrubSkippedLlmTransportErrors, type LlmTransportDebugRecord } from "./response-debug-scrub";

export const buildCleanFinalResponsePayload = <TResult extends Record<string, unknown>>(args: {
  result: TResult;
  debugPayload: LlmTransportDebugRecord;
  finalText: string;
  attachContextCapsuleToResult: (target: TResult, finalTextRaw?: string) => void;
}): TResult | (TResult & { debug: Record<string, unknown> }) => {
  scrubSkippedLlmTransportErrors(args.debugPayload);
  return buildFinalResponsePayload({
    result: args.result,
    debugPayload: args.debugPayload as Record<string, unknown> | null | undefined,
    finalText: args.finalText,
    attachContextCapsuleToResult: args.attachContextCapsuleToResult,
  });
};
