import { createServer, type Server } from "node:http";
import { DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI } from
  "../../../shared/desktop-auth0-account-link";

const CALLBACK_TIMEOUT_MS = 10 * 60_000;
const MAX_CALLBACK_LENGTH = 8_192;
const EXPECTED_ORIGIN = new URL(DESKTOP_AUTH0_ACCOUNT_LINK_REDIRECT_URI);

export type Auth0LoopbackCallbackLease = Readonly<{
  callbackUri: string;
  close: () => Promise<void>;
}>;

const reply = (message: string): string =>
  `<!doctype html><html><head><meta charset="utf-8"><title>CasimirBot authentication</title></head><body><p>${message}</p></body></html>`;

/** One exclusive, profile-local browser return route. No code or state is logged. */
export const startAuth0LoopbackCallback = async (input: Readonly<{
  expectedState: string;
  onCallback: (callbackUrl: string) => void | Promise<void>;
  port?: number;
  timeoutMs?: number;
}>): Promise<Auth0LoopbackCallbackLease> => {
  if (!/^[A-Za-z0-9_-]{32,512}$/u.test(input.expectedState)) {
    throw new Error("desktop_auth0_callback_state_invalid");
  }
  let port = input.port ?? Number(EXPECTED_ORIGIN.port);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error("desktop_auth0_callback_port_invalid");
  }
  let closed = false;
  let consumed = false;
  let timer: NodeJS.Timeout | null = null;
  let server: Server;
  const close = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    if (timer) clearTimeout(timer);
    timer = null;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  };
  server = createServer((request, response) => {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Pragma", "no-cache");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'");
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    const requestTarget = request.url ?? "";
    if (requestTarget === "/complete" && consumed && request.method === "GET" &&
        request.headers.host === `127.0.0.1:${port}`) {
      response.writeHead(200).end(reply("Authentication returned to CasimirBot. You may close this tab."));
      return;
    }
    if (
      consumed || request.method !== "GET" ||
      request.headers.host !== `127.0.0.1:${port}` ||
      requestTarget.length > MAX_CALLBACK_LENGTH
    ) {
      response.writeHead(404).end(reply("This authentication return is unavailable."));
      return;
    }
    let callback: URL;
    try {
      callback = new URL(requestTarget, `http://127.0.0.1:${port}`);
    } catch {
      response.writeHead(400).end(reply("This authentication return is invalid."));
      return;
    }
    if (
      callback.origin !== `http://127.0.0.1:${port}` ||
      callback.pathname !== "/callback" || callback.hash ||
      callback.searchParams.getAll("state").length !== 1 ||
      callback.searchParams.get("state") !== input.expectedState ||
      [...callback.searchParams.keys()].some((key) =>
        key !== "state" && key !== "code" && key !== "error" &&
        key !== "error_description") ||
      (callback.searchParams.getAll("code").length !== 1 &&
        callback.searchParams.getAll("error").length !== 1) ||
      (callback.searchParams.has("code") && callback.searchParams.has("error"))
    ) {
      response.writeHead(400).end(reply("This authentication return is invalid."));
      return;
    }
    consumed = true;
    // Redirect off the query-bearing URL immediately. The receipt is handled
    // only by the native main process and its authenticated local service.
    response.writeHead(303, { Location: `http://127.0.0.1:${port}/complete` }).end();
    void Promise.resolve().then(() => input.onCallback(callback.toString())).catch(() => {
      // The native completion path reports its own sanitized failure state.
    }).finally(() => {
      // Keep the one-use success page available briefly for the browser's 303.
      timer = setTimeout(() => { void close(); }, 5_000);
      timer.unref();
    });
  });
  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });
  } catch {
    throw new Error("desktop_auth0_callback_port_unavailable");
  }
  if (port === 0) {
    const address = server.address();
    if (!address || typeof address === "string") {
      await close();
      throw new Error("desktop_auth0_callback_port_unavailable");
    }
    port = address.port;
  }
  timer = setTimeout(() => { void close(); }, input.timeoutMs ?? CALLBACK_TIMEOUT_MS);
  timer.unref();
  return Object.freeze({ callbackUri: `http://127.0.0.1:${port}/callback`, close });
};
