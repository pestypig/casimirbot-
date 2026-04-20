import {
  executeHelixAskRouteFlow,
  prepareHelixAskRouteRequest,
  resolveHelixAskRouteContext,
  type HelixAskRouteExecutionDeps,
  type HelixAskRuntimeHandlerDeps,
} from "./ask-handler";

type HelixAskEngineResponderLike = {
  send: (status: number, payload: unknown) => void;
};

export type HelixAskEngineRequestData = Record<string, unknown> & {
  personaId?: string | null;
  dryRun?: boolean | null;
  debug?: boolean | null;
  strictProvenance?: boolean | null;
};

export type HelixAskEnginePreparedContext = {
  requestData: HelixAskEngineRequestData;
  requestQuestionSeed: string;
  requestMetadata: Record<string, unknown>;
  threadId: string;
  turnId: string;
  threadContext: Record<string, unknown> | null;
  includeMultilangMetadata: boolean;
  dispatchState: Record<string, unknown> | null;
  multilangRollout: Record<string, unknown>;
};

export type HelixAskEngineExecutionControl =
  | {
      allow: false;
      status: number;
      payload: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  | {
      allow: true;
      keepAlive: HelixAskEngineResponderLike;
      strictProvenance: boolean;
      executeAsk: (responder: HelixAskEngineResponderLike) => Promise<void>;
    };

export type HelixAskEngineArgs = {
  askStartedAtMs: number;
  requestTimeoutMs: number;
  request: Record<string, unknown>;
  runtimeDeps: HelixAskRuntimeHandlerDeps;
  executionDeps: HelixAskRouteExecutionDeps;
  resolveExecutionControl:
    (context: HelixAskEnginePreparedContext) =>
      | HelixAskEngineExecutionControl
      | Promise<HelixAskEngineExecutionControl>;
};

export type HelixAskEngineResult =
  | {
      completed: false;
      status: number;
      payload: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  | {
      completed: true;
      requestData: HelixAskEngineRequestData;
      requestQuestionSeed: string;
      threadId: string;
      turnId: string;
    };

export const executeHelixAskEngineShell = async (
  args: HelixAskEngineArgs,
): Promise<HelixAskEngineResult> => {
  const preparedRequest = await prepareHelixAskRouteRequest({
    request: args.request,
    deps: args.runtimeDeps,
  });
  if (!preparedRequest.ok) {
    return {
      completed: false,
      status: preparedRequest.status,
      payload: preparedRequest.payload,
    };
  }

  const routeContextResult = resolveHelixAskRouteContext({
    requestData: preparedRequest.requestData,
    deps: args.runtimeDeps,
  });
  if (!routeContextResult.ok) {
    return {
      completed: false,
      status: routeContextResult.status,
      payload: routeContextResult.payload,
    };
  }

  const preparedContext: HelixAskEnginePreparedContext = {
    requestData: routeContextResult.requestData as HelixAskEngineRequestData,
    requestQuestionSeed: preparedRequest.requestQuestionSeed,
    requestMetadata: routeContextResult.requestMetadata as Record<string, unknown>,
    threadId: routeContextResult.threadId,
    turnId: routeContextResult.turnId,
    threadContext: routeContextResult.threadContext as Record<string, unknown> | null,
    includeMultilangMetadata: routeContextResult.includeMultilangMetadata,
    dispatchState: routeContextResult.dispatchState as Record<string, unknown> | null,
    multilangRollout: routeContextResult.multilangRollout as Record<string, unknown>,
  };

  const executionControl = await args.resolveExecutionControl(preparedContext);
  if (!executionControl.allow) {
    return {
      completed: false,
      status: executionControl.status,
      payload: executionControl.payload,
      headers: executionControl.headers,
    };
  }

  await executeHelixAskRouteFlow({
    askStartedAtMs: args.askStartedAtMs,
    requestTimeoutMs: args.requestTimeoutMs,
    requestData: preparedContext.requestData,
    requestMetadata: routeContextResult.requestMetadata,
    requestQuestionSeed: preparedContext.requestQuestionSeed,
    threadId: preparedContext.threadId,
    turnId: preparedContext.turnId,
    threadContext: routeContextResult.threadContext,
    includeMultilangMetadata: preparedContext.includeMultilangMetadata,
    dispatchState: routeContextResult.dispatchState,
    multilangRollout: routeContextResult.multilangRollout,
    keepAlive: executionControl.keepAlive,
    strictProvenance: executionControl.strictProvenance,
    executeAsk: executionControl.executeAsk,
    deps: args.executionDeps,
  });

  return {
    completed: true,
    requestData: preparedContext.requestData,
    requestQuestionSeed: preparedContext.requestQuestionSeed,
    threadId: preparedContext.threadId,
    turnId: preparedContext.turnId,
  };
};
