import type { Request, Response } from "express";

export type HelixAskTurnHttpAbortBoundary = {
  signal: AbortSignal;
  dispose: () => void;
};

export type HelixAskTurnStreamAbortBoundary = HelixAskTurnHttpAbortBoundary;

export const createHelixAskTurnHttpAbortBoundary = (input: {
  request: Request;
  response: Response;
  reasonPrefix: "ask_turn" | "ask_turn_stream";
}): HelixAskTurnHttpAbortBoundary => {
  const controller = new AbortController();
  const abort = (reason: string): void => {
    if (!controller.signal.aborted) controller.abort(new Error(reason));
  };
  const onRequestAborted = (): void =>
    abort(`${input.reasonPrefix}_request_aborted`);
  const onResponseClose = (): void => {
    if (!input.response.writableEnded) {
      abort(`${input.reasonPrefix}_response_closed`);
    }
  };
  const onResponseError = (): void =>
    abort(`${input.reasonPrefix}_response_error`);

  input.request.once("aborted", onRequestAborted);
  input.response.once("close", onResponseClose);
  input.response.once("error", onResponseError);
  if (input.request.aborted) {
    onRequestAborted();
  } else if (input.response.destroyed && !input.response.writableEnded) {
    onResponseClose();
  }

  return {
    signal: controller.signal,
    dispose: () => {
      input.request.off("aborted", onRequestAborted);
      input.response.off("close", onResponseClose);
      input.response.off("error", onResponseError);
    },
  };
};

export const createHelixAskTurnStreamAbortBoundary = (input: {
  request: Request;
  response: Response;
}): HelixAskTurnStreamAbortBoundary =>
  createHelixAskTurnHttpAbortBoundary({
    ...input,
    reasonPrefix: "ask_turn_stream",
  });
