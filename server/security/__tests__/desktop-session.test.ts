import { describe, expect, it } from "vitest";
import {
  CASIMIR_DESKTOP_SESSION_HEADER,
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
});

