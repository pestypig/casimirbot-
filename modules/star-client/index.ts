import {
  CollapseDecision,
  InformationEvent,
  TelemetrySnapshot,
  TCollapseDecision,
  TInformationEvent,
  TTelemetrySnapshot,
} from "../../shared/star-telemetry";

type JsonTransport = (
  url: string,
  init: {
    method: string;
    headers?: Record<string, string>;
    body?: string;
  },
  opts?: { signal?: AbortSignal },
) => Promise<unknown>;

const DEFAULT_BASE_URL = process.env.STAR_SERVICE_URL ?? "/api/star";

const defaultTransport: JsonTransport = async (url, init, opts) => {
  const fetchImpl = (globalThis as any).fetch;
  if (!fetchImpl) throw new Error("No fetch implementation available; supply a transport.");

  const res = await fetchImpl(url, {
    ...init,
    ...opts,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Star service ${init.method} ${url} failed: ${res.status} ${res.statusText} ${text}`.trim());
  }

  return res.json();
};

export interface StarClientOptions {
  baseUrl?: string;
  transport?: JsonTransport;
}

export interface StarClient {
  sendEvent(event: TInformationEvent, signal?: AbortSignal): Promise<TTelemetrySnapshot>;
  getTelemetry(sessionId: string, sessionType?: string | AbortSignal, signal?: AbortSignal): Promise<TTelemetrySnapshot>;
  requestCollapse(
    sessionId: string,
    payload?: Partial<Pick<TCollapseDecision, "branch_id" | "reason">> | AbortSignal,
    sessionType?: string | AbortSignal,
    signal?: AbortSignal,
  ): Promise<TCollapseDecision>;
}

const buildUrl = (baseUrl: string, path: string) => `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

export const createStarClient = (options: StarClientOptions = {}): StarClient => {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const transport = options.transport ?? defaultTransport;
  const isAbortSignal = (value: unknown): value is AbortSignal =>
    typeof value === "object" && value !== null && "aborted" in (value as Record<string, unknown>);

  return {
    async sendEvent(event, signal) {
      const payload = InformationEvent.parse(event);
      const data = await transport(
        buildUrl(baseUrl, "event"),
        { method: "POST", body: JSON.stringify(payload) },
        { signal },
      );
      return TelemetrySnapshot.parse(data);
    },

    async getTelemetry(sessionId, sessionTypeOrSignal = "debate", maybeSignal) {
      if (!sessionId) throw new Error("sessionId is required to fetch telemetry.");
      const sessionType = typeof sessionTypeOrSignal === "string" ? sessionTypeOrSignal : "debate";
      const signal = typeof sessionTypeOrSignal === "string" ? maybeSignal : sessionTypeOrSignal;
      const params = new URLSearchParams({
        session_id: sessionId,
        session_type: sessionType,
      }).toString();
      const data = await transport(
        buildUrl(baseUrl, `telemetry?${params}`),
        { method: "GET" },
        { signal },
      );
      return TelemetrySnapshot.parse(data);
    },

    async requestCollapse(sessionId, payloadOrSignal = {}, sessionTypeOrSignal = "debate", maybeSignal) {
      if (!sessionId) throw new Error("sessionId is required to request a collapse.");
      const payload = isAbortSignal(payloadOrSignal) ? {} : payloadOrSignal;
      const sessionType = typeof sessionTypeOrSignal === "string" ? sessionTypeOrSignal : "debate";
      const signal = isAbortSignal(payloadOrSignal)
        ? payloadOrSignal
        : typeof sessionTypeOrSignal === "string"
          ? maybeSignal
          : sessionTypeOrSignal;
      const data = await transport(
        buildUrl(baseUrl, "collapse"),
        {
          method: "POST",
          body: JSON.stringify({ session_id: sessionId, session_type: sessionType, ...payload }),
        },
        { signal },
      );
      return CollapseDecision.parse(data);
    },
  };
};
