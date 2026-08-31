import { describe, expect, it, vi } from "vitest";
import {
  CASIMIR_DESKTOP_SESSION_HEADER,
  DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH,
  createDesktopSessionGuard,
  isDesktopSessionAuthorized,
  resolveDesktopSessionConfig,
} from "../desktop-session";

const SECRET = "test-only-desktop-session-secret-1234567890";

describe("desktop session boundary", () => {
  it("stays transparent outside native desktop host mode", () => {
    const config = resolveDesktopSessionConfig({});
    expect(config.enabled).toBe(false);
    expect(isDesktopSessionAuthorized({}, config)).toBe(true);
  });

  it("fails startup closed when desktop mode lacks a strong per-launch secret", () => {
    expect(() =>
      resolveDesktopSessionConfig({ CASIMIR_DESKTOP_HOST: "1" }),
    ).toThrow(/CASIMIR_DESKTOP_SESSION_SECRET/);
    expect(() =>
      resolveDesktopSessionConfig({
        CASIMIR_DESKTOP_HOST: "true",
        CASIMIR_DESKTOP_SESSION_SECRET: "too-short",
      }),
    ).toThrow(/at least 32 characters/);
  });

  it("accepts exactly the configured secret and rejects missing, wrong, or duplicated values", () => {
    const config = resolveDesktopSessionConfig({
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
    });

    expect(
      isDesktopSessionAuthorized(
        { [CASIMIR_DESKTOP_SESSION_HEADER]: SECRET },
        config,
      ),
    ).toBe(true);
    expect(isDesktopSessionAuthorized({}, config)).toBe(false);
    expect(
      isDesktopSessionAuthorized(
        { [CASIMIR_DESKTOP_SESSION_HEADER]: `${SECRET}-wrong` },
        config,
      ),
    ).toBe(false);
    expect(
      isDesktopSessionAuthorized(
        { [CASIMIR_DESKTOP_SESSION_HEADER]: [SECRET, SECRET] },
        config,
      ),
    ).toBe(false);
  });

  it("returns a no-store typed 401 without projecting the secret", () => {
    const config = resolveDesktopSessionConfig({
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
    });
    const guard = createDesktopSessionGuard(config);
    const headers = new Map<string, string>();
    let status = 0;
    let body: unknown = null;

    const response = {
      setHeader(name: string, value: string) {
        headers.set(name.toLowerCase(), value);
      },
      status(value: number) {
        status = value;
        return this;
      },
      json(value: unknown) {
        body = value;
        return this;
      },
    };

    guard(
      { headers: {} } as never,
      response as never,
      (() => {
        throw new Error("unauthorized request reached next middleware");
      }) as never,
    );

    expect(status).toBe(401);
    expect(headers.get("cache-control")).toBe("no-store");
    expect(body).toEqual({
      error: "desktop_session_required",
      message: "A valid native desktop session is required.",
    });
    expect(JSON.stringify(body)).not.toContain(SECRET);
  });

  it("admits only the exact one-time Robinhood GET callback without the desktop header", () => {
    const config = resolveDesktopSessionConfig({
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
    });
    const guard = createDesktopSessionGuard(config);
    const next = vi.fn();
    const response = {
      setHeader: vi.fn(),
      status: vi.fn(function status() { return this; }),
      json: vi.fn(function json() { return this; }),
    };

    guard({
      headers: {},
      method: "GET",
      path: DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH,
    } as never, response as never, next);
    expect(next).toHaveBeenCalledOnce();

    next.mockClear();
    guard({
      headers: {},
      method: "POST",
      path: DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH,
    } as never, response as never, next);
    guard({
      headers: {},
      method: "GET",
      path: `${DESKTOP_ROBINHOOD_OAUTH_CALLBACK_PATH}/extra`,
    } as never, response as never, next);
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it("admits only read access to exact OAuth protected-resource metadata paths", () => {
    const config = resolveDesktopSessionConfig({
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
    });
    const guard = createDesktopSessionGuard(config);
    const next = vi.fn();
    const response = {
      setHeader: vi.fn(),
      status: vi.fn(function status() { return this; }),
      json: vi.fn(function json() { return this; }),
    };

    for (const request of [
      { method: "GET", path: "/.well-known/oauth-protected-resource" },
      { method: "HEAD", path: "/.well-known/oauth-protected-resource/mcp" },
      {
        method: "GET",
        path: "/.well-known/oauth-protected-resource/mcp/local-supervisor-coordination",
      },
    ]) {
      guard({ headers: {}, ...request } as never, response as never, next);
    }
    expect(next).toHaveBeenCalledTimes(3);

    next.mockClear();
    for (const request of [
      { method: "POST", path: "/.well-known/oauth-protected-resource/mcp" },
      { method: "GET", path: "/.well-known/oauth-protected-resource-lookalike" },
      { method: "GET", path: "/mcp/local-supervisor-coordination" },
    ]) {
      guard({ headers: {}, ...request } as never, response as never, next);
    }
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });

  it("admits independently authenticated connector transports without the renderer secret", () => {
    const config = resolveDesktopSessionConfig({
      CASIMIR_DESKTOP_HOST: "1",
      CASIMIR_DESKTOP_SESSION_SECRET: SECRET,
    });
    const guard = createDesktopSessionGuard(config);
    const next = vi.fn();
    const response = {
      setHeader: vi.fn(),
      status: vi.fn(function status() { return this; }),
      json: vi.fn(function json() { return this; }),
    };

    for (const request of [
      {
        method: "POST",
        path: "/api/environment-connectors/v1/pairing/redeem",
        originalUrl: "/api/environment-connectors/v1/pairing/redeem",
      },
      {
        method: "POST",
        path: "/api/environment-connectors/v1/device/heartbeat",
        originalUrl: "/api/environment-connectors/v1/device/heartbeat",
      },
      {
        method: "POST",
        path: "/api/environment-action/v1/authorities/environment_action_authority%3Aabc/manifest",
        originalUrl:
          "/api/environment-action/v1/authorities/environment_action_authority%3Aabc/manifest",
      },
      {
        method: "GET",
        path: "/api/environment-action/v1/authorities/environment_action_authority%3Aabc/requests/pending",
        originalUrl:
          "/api/environment-action/v1/authorities/environment_action_authority%3Aabc/requests/pending",
      },
      {
        method: "POST",
        path: "/api/room-ingress/v1/bindings/room_source_binding%3Aabc/heartbeat",
        originalUrl:
          "/api/room-ingress/v1/bindings/room_source_binding%3Aabc/heartbeat",
      },
    ]) {
      guard({ headers: {}, ...request } as never, response as never, next);
    }
    expect(next).toHaveBeenCalledTimes(5);

    next.mockClear();
    for (const request of [
      {
        method: "POST",
        path: "/api/environment-connectors-lookalike/v1/pairing/redeem",
        originalUrl: "/api/environment-connectors-lookalike/v1/pairing/redeem",
      },
      {
        method: "POST",
        path: "/api/environment-action-lookalike/v1/authorities/a/manifest",
        originalUrl:
          "/api/environment-action-lookalike/v1/authorities/a/manifest",
      },
      {
        method: "POST",
        path: "/api/environment-action/v1/authority/a/manifest",
        originalUrl: "/api/environment-action/v1/authority/a/manifest",
      },
      {
        method: "POST",
        path: "/api/room-ingress/v1/bindings/a/not-a-source-route",
        originalUrl: "/api/room-ingress/v1/bindings/a/not-a-source-route",
      },
      {
        method: "POST",
        path: "/api/agi/realtime/rooms/room/source-bindings",
        originalUrl: "/api/agi/realtime/rooms/room/source-bindings",
      },
    ]) {
      guard({ headers: {}, ...request } as never, response as never, next);
    }
    expect(next).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(401);
  });
});
