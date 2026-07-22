export type CodexAppServerJsonRpcId = number | string;

export type CodexAppServerJsonRpcMessage = {
  id?: CodexAppServerJsonRpcId;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export interface CodexAppServerTransport {
  send(message: CodexAppServerJsonRpcMessage): void;
  setMessageHandler(handler: (message: CodexAppServerJsonRpcMessage) => void): void;
  setCloseHandler(handler: (error: Error | null) => void): void;
  close(): void;
  readonly stderr: string;
}

type PendingRequest = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

export class CodexAppServerProtocolError extends Error {
  readonly code: string;
  readonly detail: unknown;

  constructor(code: string, message: string, detail?: unknown) {
    super(message);
    this.name = "CodexAppServerProtocolError";
    this.code = code;
    this.detail = detail;
  }
}

export class CodexAppServerJsonRpcClient {
  private nextRequestId = 1;
  private closed = false;
  private readonly pending = new Map<CodexAppServerJsonRpcId, PendingRequest>();
  private readonly notificationHandlers = new Set<
    (method: string, params: unknown) => void
  >();
  private serverRequestHandler:
    | ((method: string, params: unknown) => Promise<unknown> | unknown)
    | null = null;
  private serverResponseSentHandler:
    | ((input: {
        id: CodexAppServerJsonRpcId;
        method: string;
        params: unknown;
        result: unknown;
      }) => void)
    | null = null;

  constructor(private readonly transport: CodexAppServerTransport) {
    transport.setMessageHandler((message: CodexAppServerJsonRpcMessage) => this.receive(message));
    transport.setCloseHandler((error: Error | null) => this.onClose(error));
  }

  setServerRequestHandler(
    handler: (method: string, params: unknown) => Promise<unknown> | unknown,
  ): void {
    this.serverRequestHandler = handler;
  }

  setServerResponseSentHandler(
    handler: (input: {
      id: CodexAppServerJsonRpcId;
      method: string;
      params: unknown;
      result: unknown;
    }) => void,
  ): void {
    this.serverResponseSentHandler = handler;
  }

  onNotification(handler: (method: string, params: unknown) => void): () => void {
    this.notificationHandlers.add(handler);
    return () => this.notificationHandlers.delete(handler);
  }

  request(method: string, params?: unknown): Promise<unknown> {
    if (this.closed) {
      return Promise.reject(
        new CodexAppServerProtocolError(
          "transport_closed",
          `Cannot send ${method}; Codex app-server transport is closed.`,
        ),
      );
    }
    const id = this.nextRequestId;
    this.nextRequestId += 1;
    return new Promise<unknown>((
      resolve: (value: unknown | PromiseLike<unknown>) => void,
      reject: (reason?: unknown) => void,
    ) => {
      this.pending.set(id, {
        resolve,
        reject: (error: Error) => reject(error),
      });
      this.transport.send({ id, method, params });
    });
  }

  notify(method: string, params?: unknown): void {
    if (this.closed) return;
    this.transport.send({ method, params });
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.transport.close();
    this.rejectPending(
      new CodexAppServerProtocolError(
        "transport_closed",
        "Codex app-server transport closed before all requests completed.",
      ),
    );
  }

  private receive(message: CodexAppServerJsonRpcMessage): void {
    if (message.method && message.id !== undefined) {
      void this.handleServerRequest(message);
      return;
    }
    if (message.method) {
      for (const handler of this.notificationHandlers) {
        handler(message.method, message.params);
      }
      return;
    }
    if (message.id === undefined) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) {
      pending.reject(
        new CodexAppServerProtocolError(
          "json_rpc_error",
          message.error.message,
          message.error,
        ),
      );
      return;
    }
    pending.resolve(message.result);
  }

  private async handleServerRequest(message: CodexAppServerJsonRpcMessage): Promise<void> {
    const method = message.method ?? "unknown";
    try {
      if (!this.serverRequestHandler) {
        throw new CodexAppServerProtocolError(
          "unsupported_server_request",
          `No handler is registered for Codex app-server request ${method}.`,
        );
      }
      const result = await this.serverRequestHandler(method, message.params);
      this.transport.send({ id: message.id, result: result ?? {} });
      if (message.id !== undefined) {
        try {
          this.serverResponseSentHandler?.({
            id: message.id,
            method,
            params: message.params,
            result: result ?? {},
          });
        } catch {
          // Debug lifecycle observers must not alter the app-server protocol.
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      this.transport.send({
        id: message.id,
        error: {
          code: -32000,
          message: messageText,
        },
      });
    }
  }

  private onClose(error: Error | null): void {
    if (this.closed) return;
    this.closed = true;
    this.rejectPending(
      error ??
        new CodexAppServerProtocolError(
          "transport_closed",
          "Codex app-server transport closed.",
        ),
    );
  }

  private rejectPending(error: Error): void {
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }
}
