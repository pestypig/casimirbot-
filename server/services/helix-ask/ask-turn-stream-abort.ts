import type { Request, Response } from "express";

export type HelixAskTurnStreamAbortBoundary = {
  signal: AbortSignal;
  dispose: () => void;
};

export const createHelixAskTurnStreamAbortBoundary = (input: {
  request: Request;
  response: Response;
}): HelixAskTurnStreamAbortBoundary => {
  const controller = new AbortController();
  const abort = (reason: string): void => {
    if (!controller.signal.aborted) controller.abort(new Error(reason));
  };
  const onRequestAborted = (): void => abort("ask_turn_stream_request_aborted");
  const onResponseClose = (): void => {
    if (!input.response.writableEnded) abort("ask_turn_stream_response_closed");
  };
  const onResponseError = (): void => abort("ask_turn_stream_response_error");

  input.request.once("aborted", onRequestAborted);
  input.response.once("close", onResponseClose);
  input.response.once("error", onResponseError);

  return {
    signal: controller.signal,
    dispose: () => {
      input.request.off("aborted", onRequestAborted);
      input.response.off("close", onResponseClose);
      input.response.off("error", onResponseError);
    },
  };
};
