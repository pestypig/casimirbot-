export type BoundedProviderContinuationStopReason =
  | "no_next_request"
  | "request_rejected"
  | "duplicate_request"
  | "budget_exhausted"
  | "aborted";

export type BoundedProviderContinuationStep<TRequest, TObservation> = {
  iteration: number;
  request: TRequest;
  observation: TObservation;
};

export type BoundedProviderContinuationRejection<TRequest> = {
  iteration: number;
  request: TRequest;
  reason: "duplicate_request" | "request_rejected";
};

export type BoundedProviderContinuationResult<TResult, TRequest, TObservation> = {
  result: TResult;
  steps: Array<BoundedProviderContinuationStep<TRequest, TObservation>>;
  rejections: Array<BoundedProviderContinuationRejection<TRequest>>;
  stop_reason: BoundedProviderContinuationStopReason;
  pending_request: TRequest | null;
  terminal_reviewed: boolean;
  terminal_review_count: number;
};

/**
 * Continues only model-selected requests. Helix supplies admission and
 * execution callbacks; this helper does not select tools, sample a model, or
 * manufacture a terminal answer.
 */
export const runBoundedProviderSelectedContinuation = async <
  TResult,
  TRequest,
  TObservation,
>(input: {
  initialResult: TResult;
  maxSteps: number;
  signal?: AbortSignal;
  requestFromResult: (result: TResult) => TRequest | null;
  requestFingerprint: (request: TRequest) => string;
  admitRequest: (
    request: TRequest,
    iteration: number,
  ) => boolean | Promise<boolean>;
  executeAndReenter: (
    request: TRequest,
    iteration: number,
  ) => Promise<{ observation: TObservation; result: TResult }>;
  reenterRejection?: (
    request: TRequest,
    reason: "duplicate_request" | "request_rejected",
    iteration: number,
  ) => Promise<TResult>;
  reviewTerminalCandidate?: (
    result: TResult,
    context: {
      iteration: number;
      steps: Array<BoundedProviderContinuationStep<TRequest, TObservation>>;
      rejections: Array<BoundedProviderContinuationRejection<TRequest>>;
    },
  ) => Promise<TResult>;
  maxTerminalReviews?: number;
  priorRequestFingerprints?: Iterable<string>;
}): Promise<
  BoundedProviderContinuationResult<TResult, TRequest, TObservation>
> => {
  let result = input.initialResult;
  const steps: Array<
    BoundedProviderContinuationStep<TRequest, TObservation>
  > = [];
  const rejections: Array<BoundedProviderContinuationRejection<TRequest>> = [];
  const attempted = new Set(input.priorRequestFingerprints ?? []);
  const reenteredRejections = new Set<string>();
  let terminalReviewCount = 0;
  let terminalReviewsSinceProgress = 0;
  const maxTerminalReviews = input.reviewTerminalCandidate
    ? Math.max(1, Math.floor(input.maxTerminalReviews ?? 1))
    : 0;

  for (
    let iteration = 1;
    iteration <= Math.max(0, input.maxSteps);
    iteration += 1
  ) {
    if (input.signal?.aborted) {
      return {
        result,
        steps,
        rejections,
        stop_reason: "aborted",
        pending_request: input.requestFromResult(result),
        terminal_reviewed: terminalReviewCount > 0,
        terminal_review_count: terminalReviewCount,
      };
    }

    let request = input.requestFromResult(result);
    while (
      !request &&
      input.reviewTerminalCandidate &&
      terminalReviewsSinceProgress < maxTerminalReviews
    ) {
      terminalReviewCount += 1;
      terminalReviewsSinceProgress += 1;
      result = await input.reviewTerminalCandidate(result, {
        iteration,
        steps: [...steps],
        rejections: [...rejections],
      });
      request = input.requestFromResult(result);
    }
    if (!request) {
      return {
        result,
        steps,
        rejections,
        stop_reason: "no_next_request",
        pending_request: null,
        terminal_reviewed: terminalReviewCount > 0,
        terminal_review_count: terminalReviewCount,
      };
    }

    const fingerprint = input.requestFingerprint(request);
    if (attempted.has(fingerprint)) {
      if (
        input.reenterRejection &&
        !reenteredRejections.has(`duplicate_request:${fingerprint}`)
      ) {
        reenteredRejections.add(`duplicate_request:${fingerprint}`);
        rejections.push({
          iteration,
          request,
          reason: "duplicate_request",
        });
        result = await input.reenterRejection(
          request,
          "duplicate_request",
          iteration,
        );
        continue;
      }
      return {
        result,
        steps,
        rejections,
        stop_reason: "duplicate_request",
        pending_request: request,
        terminal_reviewed: terminalReviewCount > 0,
        terminal_review_count: terminalReviewCount,
      };
    }
    if (!(await input.admitRequest(request, iteration))) {
      if (
        input.reenterRejection &&
        !reenteredRejections.has(`request_rejected:${fingerprint}`)
      ) {
        reenteredRejections.add(`request_rejected:${fingerprint}`);
        rejections.push({
          iteration,
          request,
          reason: "request_rejected",
        });
        result = await input.reenterRejection(
          request,
          "request_rejected",
          iteration,
        );
        continue;
      }
      return {
        result,
        steps,
        rejections,
        stop_reason: "request_rejected",
        pending_request: request,
        terminal_reviewed: terminalReviewCount > 0,
        terminal_review_count: terminalReviewCount,
      };
    }

    attempted.add(fingerprint);
    const next = await input.executeAndReenter(request, iteration);
    terminalReviewsSinceProgress = 0;
    steps.push({
      iteration,
      request,
      observation: next.observation,
    });
    result = next.result;
  }

  const pendingRequest = input.requestFromResult(result);
  return {
    result,
    steps,
    rejections,
    stop_reason: pendingRequest ? "budget_exhausted" : "no_next_request",
    pending_request: pendingRequest,
    terminal_reviewed: terminalReviewCount > 0,
    terminal_review_count: terminalReviewCount,
  };
};
